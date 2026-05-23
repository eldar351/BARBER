import { db } from '../db.mjs';
import { config } from '../config.mjs';
import { nowIso } from '../utils.mjs';
import { publishEvent } from '../events.mjs';
import { listExceptionsForBarbers, replaceExceptions } from './barberExceptionRepo.mjs';
import { scheduleSheetsBackup } from '../services/sheetsBackupService.mjs';
import { deleteRows, insertRow, insertRows, selectRows, updateRows } from './supabaseClient.mjs';

async function attachSchedules(barbers) {
  if (barbers.length === 0) return barbers;
  const ids = barbers.map((barber) => barber.id);
  let windows = [];

  if (config.dataProvider === 'sqlite') {
    const placeholders = ids.map(() => '?').join(', ');
    windows = db.prepare(`
      SELECT *
      FROM barber_availability_windows
      WHERE barberId IN (${placeholders})
      ORDER BY dayOfWeek ASC, startMinutes ASC, id ASC
    `).all(...ids);
  } else {
    windows = await selectRows('barber_availability_windows', {
      filters: { barberId: { in: ids } },
      order: 'dayOfWeek.asc,startMinutes.asc,id.asc',
    });
  }

  const exceptions = await listExceptionsForBarbers(ids);

  const map = new Map();
  for (const window of windows) {
    const list = map.get(window.barberId) || [];
    list.push({ ...window, isActive: Boolean(window.isActive) });
    map.set(window.barberId, list);
  }

  const exceptionsMap = new Map();
  for (const item of exceptions) {
    const list = exceptionsMap.get(item.barberId) || [];
    list.push({ ...item, isActive: Boolean(item.isActive), isAllDay: Boolean(item.isAllDay) });
    exceptionsMap.set(item.barberId, list);
  }

  return barbers.map((barber) => ({
    ...barber,
    isActive: Boolean(barber.isActive),
    schedules: map.get(barber.id) || [],
    exceptions: exceptionsMap.get(barber.id) || [],
  }));
}

async function replaceSchedules(barberId, schedules = []) {
  if (config.dataProvider === 'sqlite') {
    db.prepare('DELETE FROM barber_availability_windows WHERE barberId = ?').run(barberId);
    if (schedules.length === 0) return;
    const insert = db.prepare(`
      INSERT INTO barber_availability_windows (barberId, dayOfWeek, startMinutes, endMinutes, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const timestamp = nowIso();
    for (const window of schedules) {
      insert.run(barberId, window.dayOfWeek, window.startMinutes, window.endMinutes, window.isActive ? 1 : 0, timestamp, timestamp);
    }
    return;
  }

  await deleteRows('barber_availability_windows', { barberId });
  if (schedules.length === 0) return;
  const timestamp = nowIso();
  await insertRows('barber_availability_windows', schedules.map((window) => ({
    barberId,
    dayOfWeek: window.dayOfWeek,
    startMinutes: window.startMinutes,
    endMinutes: window.endMinutes,
    isActive: window.isActive ? 1 : 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  })));
}

export async function listBarbers({ activeOnly = false } = {}) {
  const rows = config.dataProvider === 'sqlite'
    ? db.prepare(`SELECT * FROM barbers ${activeOnly ? 'WHERE isActive = 1' : ''} ORDER BY isActive DESC, id ASC`).all()
    : await selectRows('barbers', {
        filters: activeOnly ? { isActive: 1 } : undefined,
        order: 'isActive.desc,id.asc',
      });
  return attachSchedules(rows);
}

export async function getBarberById(id) {
  const barber = config.dataProvider === 'sqlite'
    ? db.prepare('SELECT * FROM barbers WHERE id = ?').get(id)
    : (await selectRows('barbers', { filters: { id }, limit: 1 }))[0];
  if (!barber) return null;
  return (await attachSchedules([barber]))[0] || null;
}

export async function createBarber({ name, specialty, imageUrl, rating, isActive, schedules = [], exceptions = [] }) {
  const timestamp = nowIso();
  let barberId;

  if (config.dataProvider === 'sqlite') {
    const result = db.prepare(`
      INSERT INTO barbers (name, specialty, imageUrl, rating, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, specialty, imageUrl, rating, isActive ? 1 : 0, timestamp, timestamp);
    barberId = Number(result.lastInsertRowid);
  } else {
    const row = await insertRow('barbers', { name, specialty, imageUrl, rating, isActive: isActive ? 1 : 0, createdAt: timestamp, updatedAt: timestamp });
    barberId = Number(row.id);
  }

  await replaceSchedules(barberId, schedules);
  await replaceExceptions(barberId, exceptions);
  publishEvent('barbers_changed');
  scheduleSheetsBackup('barbers_created');
  return barberId;
}

export async function updateBarber(id, { name, specialty, imageUrl, rating, isActive, schedules = [], exceptions = [] }) {
  if (config.dataProvider === 'sqlite') {
    db.prepare(`
      UPDATE barbers
      SET name = ?, specialty = ?, imageUrl = ?, rating = ?, isActive = ?, updatedAt = ?
      WHERE id = ?
    `).run(name, specialty, imageUrl, rating, isActive ? 1 : 0, nowIso(), id);
  } else {
    await updateRows('barbers', { id }, {
      name,
      specialty,
      imageUrl,
      rating,
      isActive: isActive ? 1 : 0,
      updatedAt: nowIso(),
    });
  }

  await replaceSchedules(id, schedules);
  await replaceExceptions(id, exceptions);
  publishEvent('barbers_changed');
  scheduleSheetsBackup('barbers_updated');
}

export async function deleteBarber(id) {
  if (config.dataProvider === 'sqlite') {
    db.prepare('DELETE FROM barbers WHERE id = ?').run(id);
  } else {
    await deleteRows('barbers', { id });
  }
  publishEvent('barbers_changed');
  scheduleSheetsBackup('barbers_deleted');
}
