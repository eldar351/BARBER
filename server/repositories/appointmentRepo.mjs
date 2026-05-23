import { db } from '../db.mjs';
import { config } from '../config.mjs';
import { nowIso } from '../utils.mjs';
import { insertRow, selectRows, selectSingleRow, updateRows } from './supabaseClient.mjs';

export async function listAppointmentsForBarberDate(barberId, date, { excludeId } = {}) {
  if (config.dataProvider === 'sqlite') {
    const filters = [`a.barberId = ?`, `a.date = ?`, `a.status IN ('pending', 'confirmed', 'cancellation_requested')`];
    const params = [barberId, date];

    if (excludeId) {
      filters.push('a.id != ?');
      params.push(excludeId);
    }

    return db.prepare(`
      SELECT a.id, a.time, a.status, a.notes, s.durationMin
      FROM appointments a
      JOIN services s ON s.id = a.serviceId
      WHERE ${filters.join('\n        AND ')}
      ORDER BY a.time ASC
    `).all(...params);
  }

  const appointments = await selectRows('appointments', {
    filters: {
      barberId,
      date,
      status: { in: ['pending', 'confirmed', 'cancellation_requested'] },
      ...(excludeId ? { id: { neq: excludeId } } : {}),
    },
    order: 'time.asc',
  });

  if (appointments.length === 0) return [];
  const serviceIds = [...new Set(appointments.map((item) => item.serviceId))];
  const services = await selectRows('services', {
    select: 'id,durationMin',
    filters: { id: { in: serviceIds } },
  });
  const serviceMap = new Map(services.map((service) => [service.id, service]));

  return appointments.map((appointment) => ({
    id: appointment.id,
    time: appointment.time,
    status: appointment.status,
    notes: appointment.notes,
    durationMin: serviceMap.get(appointment.serviceId)?.durationMin ?? 0,
  }));
}

export async function listAppointmentsForBarberDateRange(barberId, startDate, endDate, { excludeId } = {}) {
  if (config.dataProvider === 'sqlite') {
    const filters = [`a.barberId = ?`, `a.date >= ?`, `a.date <= ?`, `a.status IN ('pending', 'confirmed', 'cancellation_requested')`];
    const params = [barberId, startDate, endDate];

    if (excludeId) {
      filters.push('a.id != ?');
      params.push(excludeId);
    }

    return db.prepare(`
      SELECT a.id, a.date, a.time, a.status, a.notes, s.durationMin
      FROM appointments a
      JOIN services s ON s.id = a.serviceId
      WHERE ${filters.join('\n        AND ')}
      ORDER BY a.date ASC, a.time ASC
    `).all(...params);
  }

  const appointments = await selectRows('appointments', {
    filters: {
      barberId,
      date: { gte: startDate, lte: endDate },
      status: { in: ['pending', 'confirmed', 'cancellation_requested'] },
      ...(excludeId ? { id: { neq: excludeId } } : {}),
    },
    order: 'date.asc,time.asc',
  });

  if (appointments.length === 0) return [];
  const serviceIds = [...new Set(appointments.map((item) => item.serviceId))];
  const services = await selectRows('services', {
    select: 'id,durationMin',
    filters: { id: { in: serviceIds } },
  });
  const serviceMap = new Map(services.map((service) => [service.id, service]));

  return appointments.map((appointment) => ({
    id: appointment.id,
    date: appointment.date,
    time: appointment.time,
    status: appointment.status,
    notes: appointment.notes,
    durationMin: serviceMap.get(appointment.serviceId)?.durationMin ?? 0,
  }));
}

export async function createAppointment({ customerName, customerPhone, customerEmail, barberId, serviceId, date, time, status = 'pending', notes = '' }) {
  const timestamp = nowIso();
  if (config.dataProvider === 'sqlite') {
    const result = db.prepare(`
      INSERT INTO appointments (customerName, customerPhone, customerEmail, barberId, serviceId, date, time, status, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(customerName, customerPhone, customerEmail, barberId, serviceId, date, time, status, notes, timestamp, timestamp);
    return Number(result.lastInsertRowid);
  }

  const row = await insertRow('appointments', {
    customerName,
    customerPhone,
    customerEmail,
    barberId,
    serviceId,
    date,
    time,
    status,
    notes,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  return Number(row.id);
}

export async function listAllAppointments() {
  if (config.dataProvider === 'sqlite') {
    return db.prepare(`
      SELECT a.*, s.name AS serviceName, s.durationMin, s.price, b.name AS barberName
      FROM appointments a
      JOIN services s ON s.id = a.serviceId
      JOIN barbers b ON b.id = a.barberId
      ORDER BY CASE a.status
        WHEN 'cancellation_requested' THEN 1
        WHEN 'pending' THEN 2
        WHEN 'confirmed' THEN 3
        WHEN 'completed' THEN 4
        ELSE 5
      END, a.date ASC, a.time ASC
    `).all();
  }

  const [appointments, services, barbers] = await Promise.all([
    selectRows('appointments', { order: 'date.asc,time.asc,id.asc' }),
    selectRows('services', { select: 'id,name,durationMin,price' }),
    selectRows('barbers', { select: 'id,name' }),
  ]);

  const serviceMap = new Map(services.map((service) => [service.id, service]));
  const barberMap = new Map(barbers.map((barber) => [barber.id, barber]));
  const statusRank = { cancellation_requested: 1, pending: 2, confirmed: 3, completed: 4, cancelled: 5 };

  return appointments
    .map((appointment) => ({
      ...appointment,
      serviceName: serviceMap.get(appointment.serviceId)?.name ?? null,
      durationMin: serviceMap.get(appointment.serviceId)?.durationMin ?? null,
      price: serviceMap.get(appointment.serviceId)?.price ?? null,
      barberName: barberMap.get(appointment.barberId)?.name ?? null,
    }))
    .sort((a, b) => {
      const rankDelta = (statusRank[a.status] || 99) - (statusRank[b.status] || 99);
      if (rankDelta !== 0) return rankDelta;
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.time.localeCompare(b.time);
    });
}

export async function updateAppointmentStatus(id, status, extraFields = {}) {
  const patch = { status, updatedAt: nowIso(), ...extraFields };
  if (config.dataProvider === 'sqlite') {
    const fields = Object.keys(patch);
    const values = fields.map((field) => patch[field]);
    const setSql = fields.map((field) => `${field} = ?`).join(', ');
    db.prepare(`UPDATE appointments SET ${setSql} WHERE id = ?`).run(...values, id);
    return;
  }
  await updateRows('appointments', { id }, patch);
}

export async function updateAppointment(id, { customerName, customerPhone, customerEmail, barberId, serviceId, date, time, status, notes = '' }) {
  if (config.dataProvider === 'sqlite') {
    db.prepare(`
      UPDATE appointments
      SET customerName = ?, customerPhone = ?, customerEmail = ?, barberId = ?, serviceId = ?, date = ?, time = ?, status = ?, notes = ?, updatedAt = ?
      WHERE id = ?
    `).run(customerName, customerPhone, customerEmail, barberId, serviceId, date, time, status, notes, nowIso(), id);
    return;
  }

  await updateRows('appointments', { id }, {
    customerName,
    customerPhone,
    customerEmail,
    barberId,
    serviceId,
    date,
    time,
    status,
    notes,
    updatedAt: nowIso(),
  });
}

export async function getAppointmentById(id) {
  if (config.dataProvider === 'sqlite') {
    return db.prepare('SELECT * FROM appointments WHERE id = ?').get(id) || null;
  }
  return (await selectRows('appointments', { filters: { id }, limit: 1 }))[0] || null;
}

export async function listAppointmentsByCustomerContact(customerPhone, customerEmail, { statuses = ['pending', 'confirmed'], upcomingOnly = true } = {}) {
  const normalizedEmail = customerEmail.trim().toLowerCase();
  if (config.dataProvider === 'sqlite') {
    const rows = db.prepare(`
      SELECT *
      FROM appointments
      WHERE customerPhone = ?
        AND lower(customerEmail) = ?
        AND status IN (${statuses.map(() => '?').join(', ')})
      ORDER BY date ASC, time ASC, id ASC
    `).all(customerPhone, normalizedEmail, ...statuses);
    return upcomingOnly ? rows.filter(isUpcomingAppointment) : rows;
  }

  const rows = await selectRows('appointments', {
    filters: {
      customerPhone,
      customerEmail: normalizedEmail,
      status: { in: statuses },
    },
    order: 'date.asc,time.asc,id.asc',
  });
  return upcomingOnly ? rows.filter(isUpcomingAppointment) : rows;
}

export async function getUpcomingCancelableAppointment(customerPhone, customerEmail) {
  return (await listAppointmentsByCustomerContact(customerPhone, customerEmail))[0] || null;
}

export async function markAppointmentCancellationRequested(id, fromStatus) {
  const requestedAt = nowIso();
  await updateAppointmentStatus(id, 'cancellation_requested', {
    cancellationRequestedAt: requestedAt,
    cancellationRequestedFromStatus: fromStatus,
  });
}

export async function rejectAppointmentCancellation(id, fallbackStatus = 'confirmed') {
  const appointment = await getAppointmentById(id);
  if (!appointment) return null;
  const restoredStatus = appointment.cancellationRequestedFromStatus || fallbackStatus;
  await updateAppointmentStatus(id, restoredStatus, {
    cancellationRequestedAt: null,
    cancellationRequestedFromStatus: null,
  });
  return restoredStatus;
}

function isUpcomingAppointment(appointment) {
  const dateTime = new Date(`${appointment.date}T${appointment.time || '00:00'}:00`);
  return !Number.isNaN(dateTime.getTime()) && dateTime.getTime() >= Date.now();
}
