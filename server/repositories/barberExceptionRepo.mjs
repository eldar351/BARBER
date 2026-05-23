import { db } from '../db.mjs';
import { config } from '../config.mjs';
import { nowIso } from '../utils.mjs';
import { deleteRows, insertRows, selectRows } from './supabaseClient.mjs';

export async function listExceptionsForBarbers(barberIds = []) {
  if (barberIds.length === 0) return [];

  if (config.dataProvider === 'sqlite') {
    const placeholders = barberIds.map(() => '?').join(', ');
    return db.prepare(`
      SELECT *
      FROM barber_availability_exceptions
      WHERE barberId IN (${placeholders})
      ORDER BY startDate ASC, endDate ASC, id ASC
    `).all(...barberIds);
  }

  return selectRows('barber_availability_exceptions', {
    filters: { barberId: { in: barberIds } },
    order: 'startDate.asc,endDate.asc,id.asc',
  });
}

export async function replaceExceptions(barberId, exceptions = []) {
  if (config.dataProvider === 'sqlite') {
    db.prepare('DELETE FROM barber_availability_exceptions WHERE barberId = ?').run(barberId);
    if (exceptions.length === 0) return;
    const insert = db.prepare(`
      INSERT INTO barber_availability_exceptions (
        barberId, type, startDate, endDate, isAllDay, startMinutes, endMinutes, reason, isActive, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const timestamp = nowIso();
    for (const item of exceptions) {
      insert.run(
        barberId,
        item.type || 'blocked',
        item.startDate,
        item.endDate,
        item.isAllDay ? 1 : 0,
        item.isAllDay ? null : item.startMinutes,
        item.isAllDay ? null : item.endMinutes,
        item.reason || '',
        item.isActive ? 1 : 0,
        timestamp,
        timestamp,
      );
    }
    return;
  }

  await deleteRows('barber_availability_exceptions', { barberId });
  if (exceptions.length === 0) return;
  const timestamp = nowIso();
  await insertRows('barber_availability_exceptions', exceptions.map((item) => ({
    barberId,
    type: item.type || 'blocked',
    startDate: item.startDate,
    endDate: item.endDate,
    isAllDay: item.isAllDay ? 1 : 0,
    startMinutes: item.isAllDay ? null : item.startMinutes,
    endMinutes: item.isAllDay ? null : item.endMinutes,
    reason: item.reason || '',
    isActive: item.isActive ? 1 : 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  })));
}

export async function listExceptionsForBarberDate(barberId, date) {
  if (config.dataProvider === 'sqlite') {
    return db.prepare(`
      SELECT *
      FROM barber_availability_exceptions
      WHERE barberId = ?
        AND isActive = 1
        AND startDate <= ?
        AND endDate >= ?
      ORDER BY isAllDay DESC, startMinutes ASC, endMinutes ASC, id ASC
    `).all(barberId, date, date);
  }

  return selectRows('barber_availability_exceptions', {
    filters: {
      barberId,
      isActive: 1,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    order: 'isAllDay.desc,startMinutes.asc,endMinutes.asc,id.asc',
  });
}

export async function listExceptionsForBarberDateRange(barberId, startDate, endDate) {
  if (config.dataProvider === 'sqlite') {
    return db.prepare(`
      SELECT *
      FROM barber_availability_exceptions
      WHERE barberId = ?
        AND isActive = 1
        AND startDate <= ?
        AND endDate >= ?
      ORDER BY startDate ASC, endDate ASC, isAllDay DESC, startMinutes ASC, endMinutes ASC, id ASC
    `).all(barberId, endDate, startDate);
  }

  return selectRows('barber_availability_exceptions', {
    filters: {
      barberId,
      isActive: 1,
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
    order: 'startDate.asc,endDate.asc,isAllDay.desc,startMinutes.asc,endMinutes.asc,id.asc',
  });
}
