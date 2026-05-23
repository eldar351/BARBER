import { Router } from 'express';
import { requireAuth } from '../middleware/auth.mjs';
import { asyncRoute, parseWith } from '../http.mjs';
import { appointmentSchema, appointmentStatusSchema, appointmentUpdateSchema, loginSchema, serviceSchema, barberSchema, settingsSchema, systemLogsQuerySchema } from '../validation.mjs';
import { loginAdmin } from '../services/authService.mjs';
import { createNewAppointment, listAdminAppointments, changeAppointmentStatus, rejectAppointmentCancellationRequest, updateExistingAppointment } from '../services/appointmentService.mjs';
import { listServices, createService, updateService, deleteService } from '../repositories/serviceRepo.mjs';
import { listBarbers, createBarber, updateBarber, deleteBarber } from '../repositories/barberRepo.mjs';
import { getSettings, updateSettings } from '../repositories/settingsRepo.mjs';
import { listSystemLogs, logInfo, logWarn } from '../services/logService.mjs';
import { getRequestMeta } from '../requestContext.mjs';

export const adminRouter = Router();

adminRouter.post('/login', asyncRoute(async (req, res) => {
  const parsed = parseWith(loginSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  const result = await loginAdmin(parsed.data.email, parsed.data.password);
  if (!result) {
    logWarn('auth.login', 'Admin login failed', {
      ...getRequestMeta(req),
      email: parsed.data.email,
    });
    return res.status(401).json({ error: 'אימייל או סיסמה שגויים.', requestId: req.requestId });
  }
  logInfo('auth.login', 'Admin login succeeded', {
    ...getRequestMeta(req),
    adminId: result.admin?.id,
    email: result.admin?.email,
  });
  return res.json(result);
}));

adminRouter.get('/me', requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

adminRouter.get('/appointments', requireAuth, asyncRoute(async (_req, res) => {
  res.json(await listAdminAppointments());
}));

adminRouter.post('/appointments', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(appointmentSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  const result = await createNewAppointment(parsed.data);
  if (!result.ok) return res.status(result.code).json({ error: result.error });
  return res.status(result.code).json(result.data);
}));

adminRouter.get('/settings', requireAuth, asyncRoute(async (_req, res) => {
  res.json(await getSettings());
}));

adminRouter.put('/settings', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(settingsSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  res.json(await updateSettings(parsed.data));
}));

adminRouter.patch('/appointments/:id/status', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(appointmentStatusSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  const result = await changeAppointmentStatus(Number(req.params.id), parsed.data.status);
  if (!result.ok) return res.status(result.code).json({ error: result.error });
  return res.json(result.data);
}));

adminRouter.post('/appointments/:id/cancellation/reject', requireAuth, asyncRoute(async (req, res) => {
  const result = await rejectAppointmentCancellationRequest(Number(req.params.id));
  if (!result.ok) return res.status(result.code).json({ error: result.error });
  return res.json(result.data);
}));

adminRouter.put('/appointments/:id', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(appointmentUpdateSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  const result = await updateExistingAppointment(Number(req.params.id), parsed.data);
  if (!result.ok) return res.status(result.code).json({ error: result.error });
  return res.json(result.data);
}));

adminRouter.get('/services', requireAuth, asyncRoute(async (_req, res) => {
  res.json(await listServices());
}));

adminRouter.post('/services', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(serviceSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  const id = await createService(parsed.data);
  res.status(201).json({ id });
}));

adminRouter.put('/services/:id', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(serviceSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  await updateService(Number(req.params.id), parsed.data);
  res.json({ ok: true });
}));

adminRouter.delete('/services/:id', requireAuth, asyncRoute(async (req, res) => {
  await deleteService(Number(req.params.id));
  res.json({ ok: true });
}));

adminRouter.get('/barbers', requireAuth, asyncRoute(async (_req, res) => {
  res.json(await listBarbers());
}));

adminRouter.get('/logs', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(systemLogsQuerySchema, req.query);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  res.json(listSystemLogs(parsed.data));
}));

adminRouter.post('/barbers', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(barberSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  const id = await createBarber(parsed.data);
  res.status(201).json({ id });
}));

adminRouter.put('/barbers/:id', requireAuth, asyncRoute(async (req, res) => {
  const parsed = parseWith(barberSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  await updateBarber(Number(req.params.id), parsed.data);
  res.json({ ok: true });
}));

adminRouter.delete('/barbers/:id', requireAuth, asyncRoute(async (req, res) => {
  await deleteBarber(Number(req.params.id));
  res.json({ ok: true });
}));
