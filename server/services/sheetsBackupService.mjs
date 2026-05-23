import fs from 'fs';
import crypto from 'crypto';
import { URLSearchParams } from 'url';
import { db } from '../db.mjs';
import { config } from '../config.mjs';

const SKIP_TABLES = new Set(['sqlite_sequence']);
const META_SHEET = '_backup_meta';
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

let cachedToken = null;
let cachedTokenExpiresAt = 0;
let timer = null;
let running = false;
let rerunRequested = false;
let lastReason = 'startup';

function isEnabled() {
  return config.googleSheetsBackup.enabled && config.dataProvider === 'sqlite';
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(payload, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${unsigned}.${signature}`;
}

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const raw = fs.readFileSync(config.googleSheetsBackup.credentialsPath, 'utf8');
  const credentials = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt({
    iss: credentials.client_email,
    scope: SHEETS_SCOPE,
    aud: credentials.token_uri,
    iat: now,
    exp: now + 3600,
  }, credentials.private_key);

  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`token request failed: ${response.status} ${text}`);
  }

  const token = await response.json();
  cachedToken = token.access_token;
  cachedTokenExpiresAt = Date.now() + (Number(token.expires_in || 3600) * 1000);
  return cachedToken;
}

async function sheetsRequest(path, { method = 'GET', body } = {}) {
  const token = await getAccessToken();
  const response = await fetch(`https://sheets.googleapis.com/v4/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`sheets request failed: ${response.status} ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

function getTableNames() {
  return db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all()
    .map((row) => row.name)
    .filter((name) => !SKIP_TABLES.has(name));
}

function readTable(tableName) {
  const rows = db.prepare(`SELECT * FROM "${tableName}"`).all();
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all().map((col) => col.name);
  const values = [columns];
  for (const row of rows) {
    values.push(columns.map((column) => {
      const value = row[column];
      return value == null ? '' : String(value);
    }));
  }
  return values;
}

async function ensureSheets(sheetNames) {
  const meta = await sheetsRequest(`spreadsheets/${config.googleSheetsBackup.sheetId}`);
  const existing = new Set((meta.sheets || []).map((sheet) => sheet.properties?.title).filter(Boolean));
  const requests = sheetNames
    .filter((name) => !existing.has(name))
    .map((title) => ({ addSheet: { properties: { title } } }));

  if (requests.length > 0) {
    await sheetsRequest(`spreadsheets/${config.googleSheetsBackup.sheetId}:batchUpdate`, {
      method: 'POST',
      body: { requests },
    });
  }
}

function quoteSheetTitle(title) {
  return `'${title.replace(/'/g, "''")}'`;
}

async function exportDatabase(reason) {
  const tables = getTableNames();
  const sheetNames = [...tables, META_SHEET];
  await ensureSheets(sheetNames);

  await sheetsRequest(`spreadsheets/${config.googleSheetsBackup.sheetId}/values:batchClear`, {
    method: 'POST',
    body: {
      ranges: sheetNames.map((name) => quoteSheetTitle(name)),
    },
  });

  const data = tables.map((table) => ({
    range: `${quoteSheetTitle(table)}!A1`,
    majorDimension: 'ROWS',
    values: readTable(table),
  }));

  data.push({
    range: `${quoteSheetTitle(META_SHEET)}!A1`,
    majorDimension: 'ROWS',
    values: [
      ['key', 'value'],
      ['updatedAt', new Date().toISOString()],
      ['reason', reason],
      ['dbPath', config.dbPath],
      ['tableCount', String(tables.length)],
      ['tables', tables.join(', ')],
    ],
  });

  await sheetsRequest(`spreadsheets/${config.googleSheetsBackup.sheetId}/values:batchUpdate`, {
    method: 'POST',
    body: {
      valueInputOption: 'RAW',
      data,
      includeValuesInResponse: false,
    },
  });
}

async function flushBackup() {
  if (!isEnabled()) return;
  if (running) {
    rerunRequested = true;
    return;
  }

  running = true;
  const reason = lastReason;
  try {
    await exportDatabase(reason);
    console.log(`[sheets-backup] synced (${reason})`);
  } catch (error) {
    console.error('[sheets-backup] sync failed', error);
  } finally {
    running = false;
    if (rerunRequested) {
      rerunRequested = false;
      timer = setTimeout(() => {
        timer = null;
        void flushBackup();
      }, config.googleSheetsBackup.debounceMs);
    }
  }
}

export async function runSheetsBackupNow(reason = 'manual') {
  if (!isEnabled()) return;
  lastReason = reason;
  await flushBackup();
}

export function scheduleSheetsBackup(reason = 'change') {
  if (!isEnabled()) return;
  lastReason = reason;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushBackup();
  }, config.googleSheetsBackup.debounceMs);
}
