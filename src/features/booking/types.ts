import { Barber, Service } from '../../types';

export type BookingStep = 'service' | 'date' | 'confirm';

export type Slot = {
  time: string;
  available: boolean;
  serviceDurationMin: number;
};

export type DateAvailability = {
  kind: 'available' | 'full' | 'off' | 'loading';
  availableCount: number;
  totalCount: number;
};

export type CustomerInfo = {
  name: string;
  phone: string;
  email: string;
};

export type BookingSelection = {
  selectedBarber: Barber | null;
  selectedService: Service | null;
  selectedDate: Date;
  selectedTime: string | null;
};
