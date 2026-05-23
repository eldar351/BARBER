import {
  createAppointment,
  getAppointmentById,
  getUpcomingCancelableAppointment,
  listAllAppointments,
  listAppointmentsByCustomerContact,
  markAppointmentCancellationRequested,
  rejectAppointmentCancellation,
  updateAppointment,
  updateAppointmentStatus,
} from '../repositories/appointmentRepo.mjs';
import {
  clearAppointmentCancellationCode,
  generateCancellationCode,
  getAppointmentCancellationCode,
  incrementAppointmentCancellationAttempts,
  saveAppointmentCancellationCode,
  verifyAppointmentCancellationCode,
} from '../repositories/appointmentCancellationRepo.mjs';
import { config } from '../config.mjs';
import { validateAppointmentSlot } from './availabilityService.mjs';
import { publishEvent } from '../events.mjs';
import { scheduleSheetsBackup } from './sheetsBackupService.mjs';
import { isEmailServiceConfigured, sendCancellationVerificationCode } from './emailService.mjs';
import { logError, logInfo, logWarn, serializeError } from './logService.mjs';

export async function createNewAppointment(payload) {
  const validation = await validateAppointmentSlot(payload);
  if (!validation.ok) return validation;
  const id = await createAppointment(payload);
  publishEvent('appointments_changed');
  scheduleSheetsBackup('appointments_created');
  return { ok: true, code: 201, data: { id, status: 'pending' } };
}

export async function listAdminAppointments() {
  return listAllAppointments();
}

export async function changeAppointmentStatus(id, status) {
  const appointment = await getAppointmentById(id);
  if (!appointment) return { ok: false, code: 404, error: 'התור לא נמצא.' };
  const shouldClearCancellationState = appointment.status === 'cancellation_requested' || status === 'cancelled';
  await updateAppointmentStatus(id, status, shouldClearCancellationState ? {
    cancellationRequestedAt: null,
    cancellationRequestedFromStatus: null,
  } : {});
  if (shouldClearCancellationState) {
    await clearAppointmentCancellationCode(id);
  }
  publishEvent('appointments_changed');
  scheduleSheetsBackup('appointments_status_changed');
  return { ok: true, data: { ok: true } };
}

export async function updateExistingAppointment(id, payload) {
  const appointment = await getAppointmentById(id);
  if (!appointment) return { ok: false, code: 404, error: 'התור לא נמצא.' };

  const validation = await validateAppointmentSlot({ ...payload, excludeAppointmentId: id });
  if (!validation.ok) return validation;

  await updateAppointment(id, payload);
  if (appointment.status === 'cancellation_requested' && payload.status !== 'cancellation_requested') {
    await updateAppointmentStatus(id, payload.status, {
      cancellationRequestedAt: null,
      cancellationRequestedFromStatus: null,
    });
    await clearAppointmentCancellationCode(id);
  }
  publishEvent('appointments_changed');
  scheduleSheetsBackup('appointments_updated');
  return { ok: true, data: { ok: true } };
}

export async function requestAppointmentCancellationCode({ customerPhone, customerEmail }) {
  if (!isEmailServiceConfigured()) {
    return { ok: false, code: 503, error: 'שירות האימות במייל לא זמין כרגע.' };
  }

  const appointment = await getUpcomingCancelableAppointment(customerPhone.trim(), customerEmail.trim().toLowerCase());
  if (!appointment) {
    return { ok: true, data: { ok: true } };
  }

  if (appointment.status === 'cancellation_requested') {
    return { ok: true, data: { ok: true } };
  }

  const code = generateCancellationCode();
  const expiresAt = new Date(Date.now() + config.appointmentCancellation.codeTtlMinutes * 60 * 1000).toISOString();

  await saveAppointmentCancellationCode(appointment.id, code, expiresAt);

  try {
    await sendCancellationVerificationCode({
      to: appointment.customerEmail,
      customerName: appointment.customerName,
      code,
      expiresInMinutes: config.appointmentCancellation.codeTtlMinutes,
    });
    logInfo('appointment.cancellation.request', 'Cancellation verification code sent', {
      appointmentId: appointment.id,
      customerEmail: appointment.customerEmail,
    });
  } catch (error) {
    logError('appointment.cancellation.request', 'Sending cancellation verification code failed', {
      appointmentId: appointment.id,
      customerEmail: appointment.customerEmail,
      error: serializeError(error),
    });
    return { ok: false, code: 503, error: 'שליחת קוד האימות נכשלה כרגע. נסה שוב בעוד רגע.' };
  }

  return { ok: true, data: { ok: true } };
}

export async function verifyAppointmentCancellationCodeRequest({ customerPhone, customerEmail, code }) {
  const appointments = await listAppointmentsByCustomerContact(customerPhone.trim(), customerEmail.trim().toLowerCase(), {
    statuses: ['pending', 'confirmed', 'cancellation_requested'],
    upcomingOnly: false,
  });

  if (!appointments.length) {
    return { ok: false, code: 400, error: 'קוד האימות שגוי או שפג תוקפו.' };
  }

  for (const appointment of appointments) {
    const record = await getAppointmentCancellationCode(appointment.id);
    if (!record || record.consumedAt) continue;

    const expiresAt = new Date(record.expiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt < Date.now()) {
      await clearAppointmentCancellationCode(appointment.id);
      continue;
    }

    if (!verifyAppointmentCancellationCode(appointment.id, code, record.codeHash)) {
      const attempts = Number(record.attempts || 0) + 1;
      if (attempts >= config.appointmentCancellation.maxAttempts) {
        await clearAppointmentCancellationCode(appointment.id);
        logWarn('appointment.cancellation.verify', 'Cancellation verification code locked after too many attempts', {
          appointmentId: appointment.id,
          attempts,
        });
      } else {
        await incrementAppointmentCancellationAttempts(appointment.id, attempts);
      }
      return { ok: false, code: 400, error: 'קוד האימות שגוי או שפג תוקפו.' };
    }

    if (appointment.status !== 'cancellation_requested') {
      await markAppointmentCancellationRequested(appointment.id, appointment.status);
    }
    await clearAppointmentCancellationCode(appointment.id);
    publishEvent('appointments_changed');
    scheduleSheetsBackup('appointments_cancellation_requested');
    logInfo('appointment.cancellation.verify', 'Appointment cancellation requested by customer', {
      appointmentId: appointment.id,
      customerEmail: appointment.customerEmail,
    });
    return { ok: true, data: { ok: true } };
  }

  return { ok: false, code: 400, error: 'קוד האימות שגוי או שפג תוקפו.' };
}

export async function rejectAppointmentCancellationRequest(id) {
  const appointment = await getAppointmentById(id);
  if (!appointment) return { ok: false, code: 404, error: 'התור לא נמצא.' };
  if (appointment.status !== 'cancellation_requested') {
    return { ok: false, code: 400, error: 'אין בקשת ביטול פעילה על התור הזה.' };
  }

  const restoredStatus = await rejectAppointmentCancellation(id, 'confirmed');
  await clearAppointmentCancellationCode(id);
  publishEvent('appointments_changed');
  scheduleSheetsBackup('appointments_cancellation_rejected');
  return { ok: true, data: { ok: true, restoredStatus } };
}
