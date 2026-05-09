export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Barber {
  id: string;
  name: string;
  specialty: string;
  imageUrl: string;
  rating: number;
  isActive: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  imageUrl: string;
  isActive: boolean;
  category?: string;
}

export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  barberId: string;
  serviceId: string;
  date: string; // ISO date string
  time: string; // "10:00"
  status: AppointmentStatus;
  createdAt: any; // Server timestamp
}

export interface AdminUser {
  id: string;
  email: string;
}
