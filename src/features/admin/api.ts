import { api } from '../../lib/api';
import { AdminUser, Barber, Service, SystemLogEntry } from '../../types';

export function listAdminBarbers() {
  return api<Barber[]>('/api/admin/barbers', { auth: true });
}

export function listAdminServices() {
  return api<Service[]>('/api/admin/services', { auth: true });
}

export function listAdminLogs({ limit = 80, level, search = '' }: { limit?: number; level?: 'info' | 'warn' | 'error'; search?: string }) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (level) params.set('level', level);
  if (search.trim()) params.set('search', search.trim());
  return api<SystemLogEntry[]>(`/api/admin/logs?${params.toString()}`, { auth: true });
}

export function listAdminUsers() {
  return api<AdminUser[]>('/api/admin/admins', { auth: true });
}

export function createAdminUser(payload: { email: string; password: string }) {
  return api<{ id: number }>('/api/admin/admins', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(id: number) {
  return api<{ ok: true }>(`/api/admin/admins/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export function rejectAdminAppointmentCancellation(id: number) {
  return api<{ ok: true; restoredStatus: string }>(`/api/admin/appointments/${id}/cancellation/reject`, {
    method: 'POST',
    auth: true,
  });
}
