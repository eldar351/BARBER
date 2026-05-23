import { db } from '../db.mjs';
import { config } from '../config.mjs';
import { nowIso } from '../utils.mjs';
import { scheduleSheetsBackup } from '../services/sheetsBackupService.mjs';
import { insertRow, selectRows, updateRows } from './supabaseClient.mjs';

async function fetchExistingSettings() {
  if (config.dataProvider === 'sqlite') {
    return db.prepare('SELECT * FROM business_settings WHERE id = 1').get() || null;
  }
  return (await selectRows('business_settings', { filters: { id: 1 }, limit: 1 }))[0] || null;
}

export async function ensureSettings() {
  const existing = await fetchExistingSettings();
  if (existing) return existing;
  const timestamp = nowIso();

  const defaults = {
    id: 1,
    dayStartMinutes: 540,
    dayEndMinutes: 1140,
    slotIntervalMinutes: 30,
    heroBadgeText: 'הזמנה מהירה ונוחה',
    heroTitle: 'בחר שירות, נותן שירות ושעה',
    heroSubtitle: 'השירותים יכולים להיות משויכים לכל נותני השירות או רק לחלקם — ומה שאתה רואה מתעדכן בזמן אמת.',
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (config.dataProvider === 'sqlite') {
    db.prepare(`
      INSERT INTO business_settings (
        id, dayStartMinutes, dayEndMinutes, slotIntervalMinutes, heroBadgeText, heroTitle, heroSubtitle, createdAt, updatedAt
      ) VALUES (1, 540, 1140, 30, 'הזמנה מהירה ונוחה', 'בחר שירות, נותן שירות ושעה', 'השירותים יכולים להיות משויכים לכל נותני השירות או רק לחלקם — ומה שאתה רואה מתעדכן בזמן אמת.', ?, ?)
    `).run(timestamp, timestamp);
    return db.prepare('SELECT * FROM business_settings WHERE id = 1').get();
  }

  await insertRow('business_settings', defaults);
  return defaults;
}

export async function getSettings() {
  return ensureSettings();
}

export async function updateSettings(patch) {
  const current = await ensureSettings();
  const next = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };

  if (config.dataProvider === 'sqlite') {
    db.prepare(`
      UPDATE business_settings
      SET dayStartMinutes = ?, dayEndMinutes = ?, slotIntervalMinutes = ?, heroBadgeText = ?, heroTitle = ?, heroSubtitle = ?, updatedAt = ?
      WHERE id = 1
    `).run(
      next.dayStartMinutes,
      next.dayEndMinutes,
      next.slotIntervalMinutes,
      next.heroBadgeText,
      next.heroTitle,
      next.heroSubtitle,
      next.updatedAt,
    );
  } else {
    await updateRows('business_settings', { id: 1 }, {
      dayStartMinutes: next.dayStartMinutes,
      dayEndMinutes: next.dayEndMinutes,
      slotIntervalMinutes: next.slotIntervalMinutes,
      heroBadgeText: next.heroBadgeText,
      heroTitle: next.heroTitle,
      heroSubtitle: next.heroSubtitle,
      updatedAt: next.updatedAt,
    });
  }

  scheduleSheetsBackup('business_settings_updated');
  return getSettings();
}
