import { createHmac, randomInt } from 'crypto';
import { db } from '../db.mjs';
import { config } from '../config.mjs';
import { nowIso } from '../utils.mjs';
import { deleteRows, insertRow, selectSingleRow, updateRows } from './supabaseClient.mjs';

function hashCode(appointmentId, code) {
  return createHmac('sha256', config.jwtSecret).update(`${appointmentId}:${code}`).digest('hex');
}

export function generateCancellationCode() {
  return String(randomInt(0, 10000)).padStart(4, '0');
}

export async function saveAppointmentCancellationCode(appointmentId, code, expiresAt) {
  const codeHash = hashCode(appointmentId, code);
  const timestamp = nowIso();

  if (config.dataProvider === 'sqlite') {
    db.prepare('DELETE FROM appointment_cancellation_codes WHERE appointmentId = ?').run(appointmentId);
    db.prepare(`
      INSERT INTO appointment_cancellation_codes (appointmentId, codeHash, expiresAt, attempts, consumedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, 0, NULL, ?, ?)
    `).run(appointmentId, codeHash, expiresAt, timestamp, timestamp);
    return;
  }

  await deleteRows('appointment_cancellation_codes', { appointmentId });
  await insertRow('appointment_cancellation_codes', {
    appointmentId,
    codeHash,
    expiresAt,
    attempts: 0,
    consumedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function getAppointmentCancellationCode(appointmentId) {
  if (config.dataProvider === 'sqlite') {
    return db.prepare('SELECT * FROM appointment_cancellation_codes WHERE appointmentId = ? LIMIT 1').get(appointmentId) || null;
  }
  return selectSingleRow('appointment_cancellation_codes', { filters: { appointmentId } });
}

export async function incrementAppointmentCancellationAttempts(appointmentId, attempts) {
  const updatedAt = nowIso();
  if (config.dataProvider === 'sqlite') {
    db.prepare('UPDATE appointment_cancellation_codes SET attempts = ?, updatedAt = ? WHERE appointmentId = ?').run(attempts, updatedAt, appointmentId);
    return;
  }
  await updateRows('appointment_cancellation_codes', { appointmentId }, { attempts, updatedAt });
}

export async function consumeAppointmentCancellationCode(appointmentId) {
  const consumedAt = nowIso();
  if (config.dataProvider === 'sqlite') {
    db.prepare('UPDATE appointment_cancellation_codes SET consumedAt = ?, updatedAt = ? WHERE appointmentId = ?').run(consumedAt, consumedAt, appointmentId);
    return;
  }
  await updateRows('appointment_cancellation_codes', { appointmentId }, { consumedAt, updatedAt: consumedAt });
}

export async function clearAppointmentCancellationCode(appointmentId) {
  if (config.dataProvider === 'sqlite') {
    db.prepare('DELETE FROM appointment_cancellation_codes WHERE appointmentId = ?').run(appointmentId);
    return;
  }
  await deleteRows('appointment_cancellation_codes', { appointmentId });
}

export function verifyAppointmentCancellationCode(appointmentId, code, codeHash) {
  return hashCode(appointmentId, code) === codeHash;
}
