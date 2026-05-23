import { z } from 'zod';

const availabilityWindowSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startMinutes: z.coerce.number().int().min(0).max(1439),
  endMinutes: z.coerce.number().int().min(1).max(1440),
  isActive: z.coerce.boolean().default(true),
}).refine((value) => value.endMinutes > value.startMinutes, {
  message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה.',
  path: ['endMinutes'],
});

const availabilityExceptionSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  type: z.enum(['blocked']).default('blocked'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isAllDay: z.coerce.boolean().default(true),
  startMinutes: z.coerce.number().int().min(0).max(1439).nullable().optional(),
  endMinutes: z.coerce.number().int().min(1).max(1440).nullable().optional(),
  reason: z.string().trim().max(200).default(''),
  isActive: z.coerce.boolean().default(true),
}).superRefine((value, ctx) => {
  if (value.endDate < value.startDate) {
    ctx.addIssue({ code: 'custom', message: 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה או זהה לו.', path: ['endDate'] });
  }
  if (!value.isAllDay) {
    if (value.startMinutes == null || value.endMinutes == null) {
      ctx.addIssue({ code: 'custom', message: 'יש להזין שעת התחלה וסיום לחסימה חלקית.', path: ['startMinutes'] });
      return;
    }
    if (value.endMinutes <= value.startMinutes) {
      ctx.addIssue({ code: 'custom', message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה.', path: ['endMinutes'] });
    }
  }
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const appointmentSchema = z.object({
  customerName: z.string().trim().min(2, 'יש להזין שם מלא.').max(100, 'השם ארוך מדי.'),
  customerPhone: z.string().trim().min(8, 'יש להזין מספר טלפון תקין.').max(20, 'מספר הטלפון ארוך מדי.'),
  customerEmail: z.string().trim().email('יש להזין כתובת אימייל תקינה.').max(160, 'האימייל ארוך מדי.'),
  barberId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'יש להזין תאריך תקין.'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'יש להזין שעה תקינה.'),
  notes: z.string().trim().max(500, 'ההערות ארוכות מדי.').optional().default(''),
});

export const appointmentStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested']),
});

export const appointmentUpdateSchema = appointmentSchema.extend({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested']).default('pending'),
});

export const appointmentCancellationCodeRequestSchema = z.object({
  customerPhone: z.string().trim().min(8, 'יש להזין מספר טלפון תקין.').max(20, 'מספר הטלפון ארוך מדי.'),
  customerEmail: z.string().trim().email('יש להזין כתובת אימייל תקינה.').max(160, 'האימייל ארוך מדי.'),
});

export const appointmentCancellationCodeVerifySchema = appointmentCancellationCodeRequestSchema.extend({
  code: z.string().trim().regex(/^\d{4}$/, 'יש להזין קוד בן 4 ספרות.'),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(4).max(500),
  durationMin: z.coerce.number().int().min(15).max(240),
  price: z.coerce.number().min(0).max(5000),
  imageUrl: z.string().url(),
  isActive: z.coerce.boolean().default(true),
  barberSelectionMode: z.enum(['all', 'specific']).default('all'),
  linkedBarberIds: z.array(z.coerce.number().int().positive()).default([]),
}).superRefine((value, ctx) => {
  if (value.barberSelectionMode === 'specific' && value.linkedBarberIds.length === 0) {
    ctx.addIssue({ code: 'custom', message: 'יש לבחור לפחות נותן שירות אחד.', path: ['linkedBarberIds'] });
  }
});

export const barberSchema = z.object({
  name: z.string().trim().min(2).max(80),
  specialty: z.string().trim().min(2).max(160),
  imageUrl: z.string().url(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  isActive: z.coerce.boolean().default(true),
  schedules: z.array(availabilityWindowSchema).default([]),
  exceptions: z.array(availabilityExceptionSchema).default([]),
});

export const availabilityQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'יש להזין תאריך תקין.'),
  barberId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
});

export const availabilityRangeQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'יש להזין תאריך התחלה תקין.'),
  barberId: z.coerce.number().int().positive(),
  serviceId: z.coerce.number().int().positive(),
  days: z.coerce.number().int().min(1).max(31).default(14),
});

export const clientLogSchema = z.object({
  level: z.enum(['info', 'warn', 'error']).default('error'),
  source: z.string().trim().min(2).max(80),
  message: z.string().trim().min(2).max(500),
  context: z.record(z.string(), z.unknown()).optional().default({}),
});

export const systemLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(80),
  level: z.enum(['info', 'warn', 'error']).optional(),
  search: z.string().trim().max(120).optional().default(''),
});

export const settingsSchema = z.object({
  dayStartMinutes: z.coerce.number().int().min(0).max(1439),
  dayEndMinutes: z.coerce.number().int().min(1).max(1440),
  slotIntervalMinutes: z.coerce.number().int().min(5).max(180),
  heroBadgeText: z.string().trim().min(0).max(80),
  heroTitle: z.string().trim().min(2).max(120),
  heroSubtitle: z.string().trim().min(2).max(500),
}).refine((value) => value.dayEndMinutes > value.dayStartMinutes, {
  message: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה.',
  path: ['dayEndMinutes'],
});
