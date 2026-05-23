import { getSettings } from '../repositories/settingsRepo.mjs';
import { getBarberById } from '../repositories/barberRepo.mjs';
import { listExceptionsForBarberDate, listExceptionsForBarberDateRange } from '../repositories/barberExceptionRepo.mjs';
import { getServiceById, serviceSupportsBarber } from '../repositories/serviceRepo.mjs';
import { listAppointmentsForBarberDate, listAppointmentsForBarberDateRange } from '../repositories/appointmentRepo.mjs';
import { minutesFromTime, timeFromMinutes } from '../utils.mjs';

const TZ = 'Asia/Jerusalem';

export async function getAvailableSlots({ barberId, serviceId, date, excludeAppointmentId }) {
  const shared = await loadAvailabilityContext({ barberId, serviceId });
  if (!shared.ok) return shared;

  const [exceptions, bookings] = await Promise.all([
    listExceptionsForBarberDate(barberId, date),
    listAppointmentsForBarberDate(barberId, date, { excludeId: excludeAppointmentId }),
  ]);
  return buildAvailabilityResult(shared.data, date, exceptions, bookings);
}

export async function getAvailabilityRange({ barberId, serviceId, startDate, days }) {
  const shared = await loadAvailabilityContext({ barberId, serviceId });
  if (!shared.ok) return shared;

  const endDate = addDays(startDate, days - 1);
  const [exceptions, bookings] = await Promise.all([
    listExceptionsForBarberDateRange(barberId, startDate, endDate),
    listAppointmentsForBarberDateRange(barberId, startDate, endDate),
  ]);
  const exceptionsByDate = new Map();
  const bookingsByDate = new Map();

  for (const item of exceptions) {
    for (const date of expandDateRange(item.startDate, item.endDate, startDate, endDate)) {
      const list = exceptionsByDate.get(date) || [];
      list.push(item);
      exceptionsByDate.set(date, list);
    }
  }

  for (const booking of bookings) {
    const list = bookingsByDate.get(booking.date) || [];
    list.push(booking);
    bookingsByDate.set(booking.date, list);
  }

  const availability = {};

  for (let index = 0; index < days; index += 1) {
    const currentDate = addDays(startDate, index);
    const result = buildAvailabilityResult(
      shared.data,
      currentDate,
      exceptionsByDate.get(currentDate) || [],
      bookingsByDate.get(currentDate) || [],
    );
    const slots = result.data.slots || [];
    const availableCount = slots.filter((slot) => slot.available).length;
    availability[currentDate] = slots.length === 0
      ? { kind: 'off', availableCount: 0, totalCount: 0 }
      : availableCount === 0
        ? { kind: 'full', availableCount: 0, totalCount: slots.length }
        : { kind: 'available', availableCount, totalCount: slots.length };
  }

  return {
    ok: true,
    data: {
      startDate,
      days,
      availability,
    },
  };
}

export async function validateAppointmentSlot({ barberId, serviceId, date, time, excludeAppointmentId }) {
  const result = await getAvailableSlots({ barberId, serviceId, date, excludeAppointmentId });
  if (!result.ok) return result;
  const slot = result.data.slots.find((item) => item.time === time);
  if (!slot) return { ok: false, code: 400, error: 'שעה לא חוקית.' };
  if (!slot.available) return { ok: false, code: 409, error: 'השעה הזו כבר תפוסה או לא זמינה.' };
  return result;
}

async function loadAvailabilityContext({ barberId, serviceId }) {
  const [barber, service, settings] = await Promise.all([
    getBarberById(barberId),
    getServiceById(serviceId),
    getSettings(),
  ]);

  if (!barber || !barber.isActive) {
    return { ok: false, code: 404, error: 'נותן השירות לא נמצא או לא פעיל.' };
  }
  if (!service || !service.isActive) {
    return { ok: false, code: 404, error: 'השירות לא נמצא או לא פעיל.' };
  }
  if (!serviceSupportsBarber(service, barberId)) {
    return { ok: false, code: 409, error: 'השירות לא משויך לנותן השירות הזה.' };
  }

  return {
    ok: true,
    data: { barber, service, settings },
  };
}

function buildAvailabilityResult(shared, date, exceptions, bookings) {
  const { barber, service, settings } = shared;
  const dayOfWeek = getDayOfWeekInTimezone(date);
  const activeWindows = (barber.schedules || []).filter((window) => Boolean(window.isActive) && window.dayOfWeek === dayOfWeek);
  const nowInfo = getNowInTimezone();
  const isToday = date === nowInfo.date;
  const slots = [];

  if (activeWindows.length === 0 || exceptions.some((item) => Boolean(item.isAllDay) && item.type === 'blocked')) {
    return {
      ok: true,
      data: {
        barber: { id: barber.id, name: barber.name },
        service: { id: service.id, name: service.name, durationMin: service.durationMin },
        settings,
        date,
        slots: [],
      },
    };
  }

  for (const window of activeWindows) {
    const start = Math.max(window.startMinutes, settings.dayStartMinutes);
    const endLimit = Math.min(window.endMinutes, settings.dayEndMinutes);
    for (let minutes = start; minutes <= endLimit; minutes += settings.slotIntervalMinutes) {
      const end = minutes + service.durationMin;
      if (end > endLimit) continue;

      const overlaps = bookings.some((booking) => {
        const bookingStart = minutesFromTime(booking.time);
        const bookingEnd = bookingStart + booking.durationMin;
        return minutes < bookingEnd && end > bookingStart;
      });

      const blockedByException = exceptions.some((item) => {
        if (item.type !== 'blocked' || item.isAllDay) return false;
        const blockedStart = Number(item.startMinutes ?? 0);
        const blockedEnd = Number(item.endMinutes ?? 0);
        return minutes < blockedEnd && end > blockedStart;
      });

      const isPast = isToday && minutes <= nowInfo.minutes;
      slots.push({
        time: timeFromMinutes(minutes),
        available: !overlaps && !blockedByException && !isPast,
        serviceDurationMin: service.durationMin,
      });
    }
  }

  const uniqueSlots = Array.from(new Map(slots.map((slot) => [slot.time, slot])).values()).sort((a, b) => a.time.localeCompare(b.time));

  return {
    ok: true,
    data: {
      barber: { id: barber.id, name: barber.name },
      service: { id: service.id, name: service.name, durationMin: service.durationMin },
      settings,
      date,
      slots: uniqueSlots,
    },
  };
}

function getNowInTimezone() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const pick = (type) => parts.find((part) => part.type === type)?.value || '00';
  return {
    date: `${pick('year')}-${pick('month')}-${pick('day')}`,
    minutes: Number(pick('hour')) * 60 + Number(pick('minute')),
  };
}

function getDayOfWeekInTimezone(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });
  const weekday = formatter.format(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

function addDays(dateString, daysToAdd) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function expandDateRange(startDate, endDate, minDate, maxDate) {
  const dates = [];
  let current = startDate < minDate ? minDate : startDate;
  const finalDate = endDate > maxDate ? maxDate : endDate;

  while (current <= finalDate) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}
