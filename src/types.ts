export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'cancellation_requested';
export type BarberSelectionMode = 'all' | 'specific';

export interface AvailabilityWindow {
  id?: number;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  isActive: boolean | number;
}

export interface AvailabilityException {
  id?: number;
  type: 'blocked';
  startDate: string;
  endDate: string;
  isAllDay: boolean | number;
  startMinutes?: number | null;
  endMinutes?: number | null;
  reason?: string;
  isActive: boolean | number;
}

export interface Barber {
  id: number;
  name: string;
  specialty: string;
  imageUrl: string;
  rating: number;
  isActive: boolean | number;
  schedules?: AvailabilityWindow[];
  exceptions?: AvailabilityException[];
}

export interface Service {
  id: number;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  imageUrl: string;
  isActive: boolean | number;
  barberSelectionMode?: BarberSelectionMode;
  linkedBarberIds?: number[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  barberId: number;
  serviceId: number;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  cancellationRequestedAt?: string | null;
  cancellationRequestedFromStatus?: Extract<AppointmentStatus, 'pending' | 'confirmed'> | null;
  createdAt?: string;
  updatedAt?: string;
  serviceName?: string;
  barberName?: string;
  durationMin?: number;
  price?: number;
}

export interface AdminUser {
  id: number;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessSettings {
  id: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
  slotIntervalMinutes: number;
  heroBadgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
  context?: Record<string, unknown>;
}
