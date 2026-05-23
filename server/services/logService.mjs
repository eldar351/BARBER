import fs from 'fs';
import path from 'path';

const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'system.log');
const LOG_LEVELS = new Set(['info', 'warn', 'error']);
const MEMORY_LIMIT = 200;
const memoryLogs = [];

function ensureLogDir() {
  fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });
}

function clampLevel(level) {
  return LOG_LEVELS.has(level) ? level : 'info';
}

function sanitizeValue(value, depth = 0) {
  if (value == null) return value;
  if (depth > 4) return '[max-depth]';
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined)
        .slice(0, 30)
        .map(([key, nested]) => [key, sanitizeValue(nested, depth + 1)])
    );
  }
  if (typeof value === 'string' && value.length > 2000) return `${value.slice(0, 2000)}…`;
  return value;
}

function pushToMemory(entry) {
  memoryLogs.push(entry);
  if (memoryLogs.length > MEMORY_LIMIT) memoryLogs.shift();
}

function writeRuntimeLine(entry) {
  const line = `[${entry.timestamp}] ${entry.level.toUpperCase()} ${entry.source}: ${entry.message}\n`;
  if (entry.level === 'error') {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}

export function serializeError(error) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: typeof error === 'string' ? error : JSON.stringify(error) };
}

export function logSystem(level, source, message, context = {}) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    level: clampLevel(level),
    source,
    message,
    context: sanitizeValue(context),
  };

  pushToMemory(entry);
  writeRuntimeLine(entry);

  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE_PATH, `${JSON.stringify(entry)}\n`, 'utf8');
  } catch (error) {
    pushToMemory({
      id: `${Date.now()}-log-write-failed`,
      timestamp: new Date().toISOString(),
      level: 'error',
      source: 'logger',
      message: 'Failed to persist log entry',
      context: { originalEntry: entry, error: serializeError(error) },
    });
  }

  return entry;
}

export function logInfo(source, message, context = {}) {
  return logSystem('info', source, message, context);
}

export function logWarn(source, message, context = {}) {
  return logSystem('warn', source, message, context);
}

export function logError(source, message, context = {}) {
  return logSystem('error', source, message, context);
}

function matchesFilters(entry, { level, search }) {
  if (level && entry.level !== level) return false;
  if (!search) return true;

  const needle = search.toLowerCase();
  const haystack = JSON.stringify(entry).toLowerCase();
  return haystack.includes(needle);
}

export function listSystemLogs({ limit = 80, level, search = '' } = {}) {
  const normalizedLimit = Math.min(Math.max(Number(limit) || 80, 1), 200);

  try {
    ensureLogDir();
    if (!fs.existsSync(LOG_FILE_PATH)) {
      return [...memoryLogs]
        .reverse()
        .filter((entry) => matchesFilters(entry, { level, search }))
        .slice(0, normalizedLimit);
    }

    const lines = fs.readFileSync(LOG_FILE_PATH, 'utf8').trim().split('\n').filter(Boolean);
    const logs = [];

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      try {
        const entry = JSON.parse(lines[index]);
        if (!matchesFilters(entry, { level, search })) continue;
        logs.push(entry);
        if (logs.length >= normalizedLimit) break;
      } catch {
        // Skip corrupted lines to avoid breaking the logs screen.
      }
    }

    return logs;
  } catch (error) {
    logWarn('logger', 'Failed to read persisted logs, falling back to memory buffer', { error: serializeError(error) });
    return [...memoryLogs]
      .reverse()
      .filter((entry) => matchesFilters(entry, { level, search }))
      .slice(0, normalizedLimit);
  }
}
