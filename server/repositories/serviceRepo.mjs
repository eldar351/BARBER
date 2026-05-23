import { db } from '../db.mjs';
import { config } from '../config.mjs';
import { nowIso } from '../utils.mjs';
import { publishEvent } from '../events.mjs';
import { scheduleSheetsBackup } from '../services/sheetsBackupService.mjs';
import { deleteRows, insertRow, insertRows, selectRows, updateRows } from './supabaseClient.mjs';

async function attachLinkedBarbers(services) {
  if (services.length === 0) return services;
  const ids = services.map((service) => service.id);

  const links = config.dataProvider === 'sqlite'
    ? (() => {
        const placeholders = ids.map(() => '?').join(', ');
        return db.prepare(`
          SELECT serviceId, barberId
          FROM service_barber_links
          WHERE serviceId IN (${placeholders})
          ORDER BY barberId ASC
        `).all(...ids);
      })()
    : await selectRows('service_barber_links', {
        select: 'serviceId,barberId',
        filters: { serviceId: { in: ids } },
        order: 'barberId.asc',
      });

  const map = new Map();
  for (const link of links) {
    const list = map.get(link.serviceId) || [];
    list.push(link.barberId);
    map.set(link.serviceId, list);
  }

  return services.map((service) => ({
    ...service,
    isActive: Boolean(service.isActive),
    barberSelectionMode: service.barberSelectionMode || 'all',
    linkedBarberIds: map.get(service.id) || [],
  }));
}

async function replaceLinks(serviceId, linkedBarberIds = []) {
  if (config.dataProvider === 'sqlite') {
    db.prepare('DELETE FROM service_barber_links WHERE serviceId = ?').run(serviceId);
    if (linkedBarberIds.length === 0) return;
    const insert = db.prepare(`
      INSERT OR IGNORE INTO service_barber_links (serviceId, barberId, createdAt)
      VALUES (?, ?, ?)
    `);
    const timestamp = nowIso();
    for (const barberId of linkedBarberIds) {
      insert.run(serviceId, barberId, timestamp);
    }
    return;
  }

  await deleteRows('service_barber_links', { serviceId });
  if (linkedBarberIds.length === 0) return;
  const timestamp = nowIso();
  await insertRows('service_barber_links', linkedBarberIds.map((barberId) => ({ serviceId, barberId, createdAt: timestamp })));
}

export async function listServices({ activeOnly = false } = {}) {
  const rows = config.dataProvider === 'sqlite'
    ? db.prepare(`SELECT * FROM services ${activeOnly ? 'WHERE isActive = 1' : ''} ORDER BY isActive DESC, id DESC`).all()
    : await selectRows('services', {
        filters: activeOnly ? { isActive: 1 } : undefined,
        order: 'isActive.desc,id.desc',
      });
  return attachLinkedBarbers(rows);
}

export async function getServiceById(id) {
  const service = config.dataProvider === 'sqlite'
    ? db.prepare('SELECT * FROM services WHERE id = ?').get(id)
    : (await selectRows('services', { filters: { id }, limit: 1 }))[0];
  if (!service) return null;
  return (await attachLinkedBarbers([service]))[0] || null;
}

export async function createService({ name, description, durationMin, price, imageUrl, isActive, barberSelectionMode = 'all', linkedBarberIds = [] }) {
  const timestamp = nowIso();
  let serviceId;

  if (config.dataProvider === 'sqlite') {
    const result = db.prepare(`
      INSERT INTO services (name, description, durationMin, price, imageUrl, isActive, barberSelectionMode, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description, durationMin, price, imageUrl, isActive ? 1 : 0, barberSelectionMode, timestamp, timestamp);
    serviceId = Number(result.lastInsertRowid);
  } else {
    const row = await insertRow('services', {
      name,
      description,
      durationMin,
      price,
      imageUrl,
      isActive: isActive ? 1 : 0,
      barberSelectionMode,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    serviceId = Number(row.id);
  }

  await replaceLinks(serviceId, barberSelectionMode === 'specific' ? linkedBarberIds : []);
  publishEvent('services_changed');
  scheduleSheetsBackup('services_created');
  return serviceId;
}

export async function updateService(id, { name, description, durationMin, price, imageUrl, isActive, barberSelectionMode = 'all', linkedBarberIds = [] }) {
  if (config.dataProvider === 'sqlite') {
    db.prepare(`
      UPDATE services
      SET name = ?, description = ?, durationMin = ?, price = ?, imageUrl = ?, isActive = ?, barberSelectionMode = ?, updatedAt = ?
      WHERE id = ?
    `).run(name, description, durationMin, price, imageUrl, isActive ? 1 : 0, barberSelectionMode, nowIso(), id);
  } else {
    await updateRows('services', { id }, {
      name,
      description,
      durationMin,
      price,
      imageUrl,
      isActive: isActive ? 1 : 0,
      barberSelectionMode,
      updatedAt: nowIso(),
    });
  }

  await replaceLinks(id, barberSelectionMode === 'specific' ? linkedBarberIds : []);
  publishEvent('services_changed');
  scheduleSheetsBackup('services_updated');
}

export async function deleteService(id) {
  if (config.dataProvider === 'sqlite') {
    db.prepare('DELETE FROM services WHERE id = ?').run(id);
  } else {
    await deleteRows('services', { id });
  }
  publishEvent('services_changed');
  scheduleSheetsBackup('services_deleted');
}

export function serviceSupportsBarber(service, barberId) {
  if (!service) return false;
  if ((service.barberSelectionMode || 'all') !== 'specific') return true;
  return new Set(service.linkedBarberIds || []).has(barberId);
}
