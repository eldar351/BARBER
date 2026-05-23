import bcrypt from 'bcryptjs';
import { db } from '../db.mjs';
import { config } from '../config.mjs';
import { nowIso } from '../utils.mjs';
import { scheduleSheetsBackup } from '../services/sheetsBackupService.mjs';
import { deleteRows, insertRow, selectRows, selectSingleRow, updateRows } from './supabaseClient.mjs';

export async function upsertAdmin({ email, password }) {
  const existing = await findAdminByEmail(email);
  const hash = bcrypt.hashSync(password, 10);
  const timestamp = nowIso();

  if (config.dataProvider === 'sqlite') {
    if (!existing) {
      db.prepare('INSERT INTO admin_users (email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?)').run(email, hash, timestamp, timestamp);
      scheduleSheetsBackup('admin_users_created');
      return;
    }
    if (!bcrypt.compareSync(password, existing.passwordHash)) {
      db.prepare('UPDATE admin_users SET passwordHash = ?, updatedAt = ? WHERE id = ?').run(hash, timestamp, existing.id);
      scheduleSheetsBackup('admin_users_updated');
    }
    return;
  }

  if (!existing) {
    await insertRow('admin_users', { email, passwordHash: hash, createdAt: timestamp, updatedAt: timestamp });
    scheduleSheetsBackup('admin_users_created');
    return;
  }

  if (!bcrypt.compareSync(password, existing.passwordHash)) {
    await updateRows('admin_users', { id: existing.id }, { passwordHash: hash, updatedAt: timestamp });
    scheduleSheetsBackup('admin_users_updated');
  }
}

export async function findAdminByEmail(email) {
  if (config.dataProvider === 'sqlite') {
    return db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email) || null;
  }
  return selectSingleRow('admin_users', { filters: { email } });
}

export async function findAdminById(id) {
  if (config.dataProvider === 'sqlite') {
    return db.prepare('SELECT id, email, createdAt, updatedAt FROM admin_users WHERE id = ?').get(id) || null;
  }
  const row = await selectSingleRow('admin_users', {
    select: 'id,email,createdAt,updatedAt',
    filters: { id },
  });
  return row || null;
}

export async function listAdmins() {
  if (config.dataProvider === 'sqlite') {
    return db.prepare('SELECT id, email, createdAt, updatedAt FROM admin_users ORDER BY createdAt DESC').all();
  }
  return selectRows('admin_users', {
    select: 'id,email,createdAt,updatedAt',
    order: 'createdAt.desc',
  });
}

export async function createAdmin({ email, password }) {
  const existing = await findAdminByEmail(email);
  if (existing) return { ok: false, reason: 'exists' };

  const hash = bcrypt.hashSync(password, 10);
  const timestamp = nowIso();

  if (config.dataProvider === 'sqlite') {
    const result = db.prepare('INSERT INTO admin_users (email, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?)').run(email, hash, timestamp, timestamp);
    scheduleSheetsBackup('admin_users_created');
    return { ok: true, id: Number(result.lastInsertRowid) };
  }

  const row = await insertRow('admin_users', { email, passwordHash: hash, createdAt: timestamp, updatedAt: timestamp });
  scheduleSheetsBackup('admin_users_created');
  return { ok: true, id: Number(row?.id) };
}

export async function deleteAdmin(id) {
  if (config.dataProvider === 'sqlite') {
    const result = db.prepare('DELETE FROM admin_users WHERE id = ?').run(id);
    if (result.changes > 0) scheduleSheetsBackup('admin_users_deleted');
    return result.changes > 0;
  }

  const rows = await deleteRows('admin_users', { id });
  if (rows.length > 0) scheduleSheetsBackup('admin_users_deleted');
  return rows.length > 0;
}
