import { Router } from 'express';
import { listBarbers } from '../repositories/barberRepo.mjs';
import { listServices } from '../repositories/serviceRepo.mjs';
import { getSettings } from '../repositories/settingsRepo.mjs';
import { asyncRoute, parseWith, sendResult } from '../http.mjs';
import { appointmentCancellationCodeRequestSchema, appointmentCancellationCodeVerifySchema, appointmentSchema, availabilityQuerySchema, availabilityRangeQuerySchema, clientLogSchema } from '../validation.mjs';
import { createNewAppointment, requestAppointmentCancellationCode, verifyAppointmentCancellationCodeRequest } from '../services/appointmentService.mjs';
import { getAvailabilityRange, getAvailableSlots } from '../services/availabilityService.mjs';
import { addEventClient } from '../events.mjs';
import { logSystem } from '../services/logService.mjs';

export const publicRouter = Router();

publicRouter.get('/events', (req, res) => {
  const cleanup = addEventClient(res);
  req.on('close', cleanup);
});

publicRouter.get('/barbers', asyncRoute(async (_req, res) => {
  res.json(await listBarbers({ activeOnly: true }));
}));

publicRouter.get('/services', asyncRoute(async (_req, res) => {
  res.json(await listServices({ activeOnly: true }));
}));

publicRouter.get('/settings', asyncRoute(async (_req, res) => {
  res.json(await getSettings());
}));

publicRouter.get('/availability', asyncRoute(async (req, res) => {
  const parsed = parseWith(availabilityQuerySchema, req.query);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  return sendResult(res, await getAvailableSlots(parsed.data));
}));

publicRouter.get('/availability-range', asyncRoute(async (req, res) => {
  const parsed = parseWith(availabilityRangeQuerySchema, req.query);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  return sendResult(res, await getAvailabilityRange(parsed.data));
}));

publicRouter.post('/appointments', asyncRoute(async (req, res) => {
  const parsed = parseWith(appointmentSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  return sendResult(res, await createNewAppointment(parsed.data));
}));

publicRouter.post('/appointments/cancellation-code/request', asyncRoute(async (req, res) => {
  const parsed = parseWith(appointmentCancellationCodeRequestSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  return sendResult(res, await requestAppointmentCancellationCode(parsed.data));
}));

publicRouter.post('/appointments/cancellation-code/verify', asyncRoute(async (req, res) => {
  const parsed = parseWith(appointmentCancellationCodeVerifySchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  return sendResult(res, await verifyAppointmentCancellationCodeRequest(parsed.data));
}));

publicRouter.post('/client-logs', asyncRoute(async (req, res) => {
  const parsed = parseWith(clientLogSchema, req.body);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error, issues: parsed.issues });
  const entry = logSystem(parsed.data.level, parsed.data.source, parsed.data.message, parsed.data.context);
  return res.status(201).json({ id: entry.id });
}));
