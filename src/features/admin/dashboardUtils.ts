import { Appointment, AppointmentStatus, BusinessSettings } from '../../types';

export const STATUS_ORDER: AppointmentStatus[] = ['cancellation_requested', 'pending', 'confirmed', 'completed', 'cancelled'];

export function toAppointmentTimestamp(app: Pick<Appointment, 'date' | 'time'>) {
  const value = new Date(`${app.date}T${app.time || '00:00'}:00`);
  return Number.isNaN(value.getTime()) ? Number.POSITIVE_INFINITY : value.getTime();
}

export function sortAppointmentsByTime(appointments: Appointment[]) {
  return [...appointments].sort((a, b) => toAppointmentTimestamp(a) - toAppointmentTimestamp(b));
}

export function filterAppointments(appointments: Appointment[], search: string, statusFilter: 'all' | AppointmentStatus) {
  const q = search.trim().toLowerCase();
  return sortAppointmentsByTime(appointments).filter((app) => {
    const matchesSearch = !q || [app.customerName, app.customerPhone, app.customerEmail, app.serviceName, app.barberName, app.time, app.date].join(' ').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

export function getAppointmentCounts(appointments: Appointment[]) {
  return STATUS_ORDER.reduce((acc, status) => ({ ...acc, [status]: appointments.filter((app) => app.status === status).length }), {
    pending: 0,
    cancellation_requested: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  } as Record<AppointmentStatus, number>);
}

export function getSettingsPayload(settings: BusinessSettings) {
  return {
    dayStartMinutes: settings.dayStartMinutes,
    dayEndMinutes: settings.dayEndMinutes,
    slotIntervalMinutes: settings.slotIntervalMinutes,
    heroBadgeText: settings.heroBadgeText,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle,
  };
}

export function statusLabel(status: AppointmentStatus) {
  return ({ cancellation_requested: 'ממתין לביטול', pending: 'ממתינים', confirmed: 'מאושרים', completed: 'הושלמו', cancelled: 'בוטלו' })[status];
}

export function isToday(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function formatFullDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function getUpcomingAppointment(appointments: Appointment[], preferredStatus?: AppointmentStatus) {
  const now = Date.now();
  const sorted = sortAppointmentsByTime(appointments);
  if (preferredStatus) {
    const preferred = sorted.find((app) => app.status === preferredStatus && toAppointmentTimestamp(app) >= now);
    if (preferred) return preferred;
  }
  return sorted.find((app) => toAppointmentTimestamp(app) >= now) || sorted[0] || null;
}

export function getPendingQueueHead(appointments: Appointment[]) {
  return [...appointments]
    .filter((app) => app.status === 'pending')
    .sort((a, b) => {
      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : Number.POSITIVE_INFINITY;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : Number.POSITIVE_INFINITY;
      if (aCreated !== bCreated) return aCreated - bCreated;
      return a.id - b.id;
    })[0] || null;
}
