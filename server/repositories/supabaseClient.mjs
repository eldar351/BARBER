import { config } from '../config.mjs';

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

function ensureConfigured() {
  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error('Supabase is not fully configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
}

function buildUrl(path, query = {}) {
  const url = new URL(`${config.supabase.url}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) url.searchParams.append(key, String(item));
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function request(method, path, { query, body, headers } = {}) {
  ensureConfigured();
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...JSON_HEADERS,
      apikey: config.supabase.serviceRoleKey,
      Authorization: `Bearer ${config.supabase.serviceRoleKey}`,
      'Accept-Profile': config.supabase.schema,
      'Content-Profile': config.supabase.schema,
      ...headers,
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || parsed.hint || text;
    } catch {}
    throw new Error(`Supabase request failed (${response.status}) ${method} ${path}: ${message}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function encodeFilter(value) {
  if (Array.isArray(value)) {
    return `in.(${value.map((item) => formatValue(item)).join(',')})`;
  }
  if (value && typeof value === 'object') {
    if ('gte' in value) return `gte.${formatValue(value.gte)}`;
    if ('lte' in value) return `lte.${formatValue(value.lte)}`;
    if ('neq' in value) return `neq.${formatValue(value.neq)}`;
    if ('in' in value) return `in.(${value.in.map((item) => formatValue(item)).join(',')})`;
  }
  return `eq.${formatValue(value)}`;
}

function formatValue(value) {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

function withFilters(query = {}, filters = {}) {
  const next = { ...query };
  for (const [key, value] of Object.entries(filters)) {
    if (value == null) continue;
    next[key] = encodeFilter(value);
  }
  return next;
}

export async function selectRows(table, { select = '*', filters, order, limit } = {}) {
  const query = withFilters({ select }, filters);
  if (order) query.order = order;
  if (limit != null) query.limit = limit;
  return (await request('GET', `/rest/v1/${table}`, { query })) || [];
}

export async function selectSingleRow(table, options = {}) {
  const rows = await selectRows(table, { ...options, limit: 1 });
  return rows[0] || null;
}

export async function insertRow(table, row) {
  const rows = await request('POST', `/rest/v1/${table}`, {
    body: row,
    headers: { Prefer: 'return=representation' },
  });
  return Array.isArray(rows) ? rows[0] || null : rows;
}

export async function insertRows(table, rows, { onConflict } = {}) {
  if (!rows.length) return [];
  const query = onConflict ? { on_conflict: onConflict } : undefined;
  return (await request('POST', `/rest/v1/${table}`, {
    query,
    body: rows,
    headers: { Prefer: onConflict ? 'resolution=merge-duplicates,return=representation' : 'return=representation' },
  })) || [];
}

export async function updateRows(table, filters, patch) {
  return (await request('PATCH', `/rest/v1/${table}`, {
    query: withFilters({}, filters),
    body: patch,
    headers: { Prefer: 'return=representation' },
  })) || [];
}

export async function deleteRows(table, filters) {
  return (await request('DELETE', `/rest/v1/${table}`, {
    query: withFilters({}, filters),
    headers: { Prefer: 'return=representation' },
  })) || [];
}

export async function upsertRows(table, rows, onConflict) {
  return insertRows(table, rows, { onConflict });
}
