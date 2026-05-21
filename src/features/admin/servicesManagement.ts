import { Service } from '../../types';

export const INITIAL_SERVICE_FORM: Partial<Service> = {
  name: '',
  description: '',
  durationMin: 30,
  price: 35,
  imageUrl:
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600&h=400',
  isActive: true,
  barberSelectionMode: 'all',
  linkedBarberIds: [],
};

export function normalizeServicePayload(formData: Partial<Service>): Partial<Service> {
  return {
    ...formData,
    durationMin: Number(formData.durationMin),
    price: Number(formData.price),
    isActive: !!formData.isActive,
    barberSelectionMode: formData.barberSelectionMode || 'all',
    linkedBarberIds:
      formData.barberSelectionMode === 'specific' ? formData.linkedBarberIds || [] : [],
  };
}
