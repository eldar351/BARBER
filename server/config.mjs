import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function envBool(value, fallback) {
  if (value == null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

const rawEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  DB_PATH: process.env.DB_PATH,
  DATA_PROVIDER: process.env.DATA_PROVIDER,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_SCHEMA: process.env.SUPABASE_SCHEMA,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: envBool(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  APPOINTMENT_CANCELLATION_CODE_TTL_MINUTES: process.env.APPOINTMENT_CANCELLATION_CODE_TTL_MINUTES,
  APPOINTMENT_CANCELLATION_MAX_ATTEMPTS: process.env.APPOINTMENT_CANCELLATION_MAX_ATTEMPTS,
  GOOGLE_SHEETS_BACKUP_ENABLED: envBool(process.env.GOOGLE_SHEETS_BACKUP_ENABLED, true),
  GOOGLE_SHEETS_BACKUP_SHEET_ID: process.env.GOOGLE_SHEETS_BACKUP_SHEET_ID,
  GOOGLE_SHEETS_BACKUP_CREDENTIALS_PATH: process.env.GOOGLE_SHEETS_BACKUP_CREDENTIALS_PATH,
  GOOGLE_SHEETS_BACKUP_DEBOUNCE_MS: process.env.GOOGLE_SHEETS_BACKUP_DEBOUNCE_MS,
};

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8090),
  JWT_SECRET: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default('admin@barber.local'),
  ADMIN_PASSWORD: z.string().optional(),
  DB_PATH: z.string().default(path.join(rootDir, 'data', 'barber.sqlite')),
  DATA_PROVIDER: z.enum(['sqlite', 'supabase']).default('sqlite'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SCHEMA: z.string().default('public'),
  CORS_ORIGIN: z.string().default('*'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  APPOINTMENT_CANCELLATION_CODE_TTL_MINUTES: z.coerce.number().int().min(1).max(60).default(10),
  APPOINTMENT_CANCELLATION_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
  GOOGLE_SHEETS_BACKUP_ENABLED: z.boolean().default(true),
  GOOGLE_SHEETS_BACKUP_SHEET_ID: z.string().default('14LjCPsis2FRqlvObq7Z2WgapNIJy8-cPiAE5YpfCOMs'),
  GOOGLE_SHEETS_BACKUP_CREDENTIALS_PATH: z.string().default('/run/secrets/google-service-account.json'),
  GOOGLE_SHEETS_BACKUP_DEBOUNCE_MS: z.coerce.number().int().min(0).default(1200),
});

const parsed = envSchema.safeParse(rawEnv);
if (!parsed.success) {
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const env = parsed.data;

if (env.NODE_ENV === 'production') {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET is required in production');
  if (!env.ADMIN_PASSWORD) throw new Error('ADMIN_PASSWORD is required in production');
}

if (env.DATA_PROVIDER === 'supabase') {
  if (!env.SUPABASE_URL) throw new Error('SUPABASE_URL is required when DATA_PROVIDER=supabase');
  if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required when DATA_PROVIDER=supabase');
}

export const config = {
  rootDir,
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  jwtSecret: env.JWT_SECRET || 'development-only-jwt-secret-please-change',
  adminEmail: env.ADMIN_EMAIL,
  adminPassword: env.ADMIN_PASSWORD || 'ChangeMe123!',
  dbPath: env.DB_PATH,
  dataProvider: env.DATA_PROVIDER,
  corsOrigin: env.CORS_ORIGIN,
  smtp: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
  },
  appointmentCancellation: {
    codeTtlMinutes: env.APPOINTMENT_CANCELLATION_CODE_TTL_MINUTES,
    maxAttempts: env.APPOINTMENT_CANCELLATION_MAX_ATTEMPTS,
  },
  supabase: {
    url: env.SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    schema: env.SUPABASE_SCHEMA,
  },
  googleSheetsBackup: {
    enabled: env.GOOGLE_SHEETS_BACKUP_ENABLED,
    sheetId: env.GOOGLE_SHEETS_BACKUP_SHEET_ID,
    credentialsPath: env.GOOGLE_SHEETS_BACKUP_CREDENTIALS_PATH,
    debounceMs: env.GOOGLE_SHEETS_BACKUP_DEBOUNCE_MS,
  },
  isProduction: env.NODE_ENV === 'production',
};
