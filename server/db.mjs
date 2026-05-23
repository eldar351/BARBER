import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { config } from './config.mjs';

export let db = null;

if (config.dataProvider === 'sqlite') {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

  db = new Database(config.dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      specialty TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      durationMin INTEGER NOT NULL,
      price REAL NOT NULL,
      imageUrl TEXT NOT NULL,
      isActive INTEGER NOT NULL DEFAULT 1,
      barberSelectionMode TEXT NOT NULL DEFAULT 'all' CHECK (barberSelectionMode IN ('all', 'specific')),
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS barber_availability_windows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberId INTEGER NOT NULL,
      dayOfWeek INTEGER NOT NULL CHECK (dayOfWeek BETWEEN 0 AND 6),
      startMinutes INTEGER NOT NULL CHECK (startMinutes BETWEEN 0 AND 1439),
      endMinutes INTEGER NOT NULL CHECK (endMinutes BETWEEN 1 AND 1440),
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(barberId) REFERENCES barbers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS barber_availability_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barberId INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'blocked' CHECK (type IN ('blocked')),
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      isAllDay INTEGER NOT NULL DEFAULT 1,
      startMinutes INTEGER,
      endMinutes INTEGER,
      reason TEXT NOT NULL DEFAULT '',
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(barberId) REFERENCES barbers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS service_barber_links (
      serviceId INTEGER NOT NULL,
      barberId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY(serviceId, barberId),
      FOREIGN KEY(serviceId) REFERENCES services(id) ON DELETE CASCADE,
      FOREIGN KEY(barberId) REFERENCES barbers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      customerEmail TEXT NOT NULL DEFAULT '',
      barberId INTEGER NOT NULL,
      serviceId INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending','confirmed','completed','cancelled','cancellation_requested')),
      notes TEXT DEFAULT '',
      cancellationRequestedAt TEXT,
      cancellationRequestedFromStatus TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(barberId) REFERENCES barbers(id) ON DELETE RESTRICT,
      FOREIGN KEY(serviceId) REFERENCES services(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS appointment_cancellation_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointmentId INTEGER NOT NULL UNIQUE,
      codeHash TEXT NOT NULL,
      expiresAt TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      consumedAt TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY(appointmentId) REFERENCES appointments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      dayStartMinutes INTEGER NOT NULL DEFAULT 540,
      dayEndMinutes INTEGER NOT NULL DEFAULT 1140,
      slotIntervalMinutes INTEGER NOT NULL DEFAULT 30,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_appointments_barber_date_status ON appointments(barberId, date, status);
    CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(date, time);
    CREATE INDEX IF NOT EXISTS idx_appointments_contact_status ON appointments(customerPhone, customerEmail, status, date, time);
    CREATE INDEX IF NOT EXISTS idx_services_active ON services(isActive);
    CREATE INDEX IF NOT EXISTS idx_barbers_active ON barbers(isActive);
    CREATE INDEX IF NOT EXISTS idx_barber_windows_barber_day ON barber_availability_windows(barberId, dayOfWeek, isActive);
    CREATE INDEX IF NOT EXISTS idx_barber_exceptions_barber_dates ON barber_availability_exceptions(barberId, startDate, endDate, isActive);
    CREATE INDEX IF NOT EXISTS idx_service_links_barber ON service_barber_links(barberId, serviceId);
  `);

  function hasColumn(tableName, columnName) {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
  }

  function addColumnIfMissing(tableName, columnSql, columnName) {
    if (!hasColumn(tableName, columnName)) {
      db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnSql}`);
    }
  }

  addColumnIfMissing('admin_users', "updatedAt TEXT NOT NULL DEFAULT ''", 'updatedAt');
  addColumnIfMissing('barbers', "createdAt TEXT NOT NULL DEFAULT ''", 'createdAt');
  addColumnIfMissing('barbers', "updatedAt TEXT NOT NULL DEFAULT ''", 'updatedAt');
  addColumnIfMissing('services', "createdAt TEXT NOT NULL DEFAULT ''", 'createdAt');
  addColumnIfMissing('services', "updatedAt TEXT NOT NULL DEFAULT ''", 'updatedAt');
  addColumnIfMissing('services', "barberSelectionMode TEXT NOT NULL DEFAULT 'all'", 'barberSelectionMode');
  addColumnIfMissing('appointments', "notes TEXT DEFAULT ''", 'notes');
  addColumnIfMissing('appointments', "updatedAt TEXT NOT NULL DEFAULT ''", 'updatedAt');
  addColumnIfMissing('appointments', "customerEmail TEXT NOT NULL DEFAULT ''", 'customerEmail');
  addColumnIfMissing('appointments', "cancellationRequestedAt TEXT", 'cancellationRequestedAt');
  addColumnIfMissing('appointments', "cancellationRequestedFromStatus TEXT", 'cancellationRequestedFromStatus');
  addColumnIfMissing('business_settings', "createdAt TEXT NOT NULL DEFAULT ''", 'createdAt');
  addColumnIfMissing('business_settings', "updatedAt TEXT NOT NULL DEFAULT ''", 'updatedAt');
  addColumnIfMissing('business_settings', "heroBadgeText TEXT NOT NULL DEFAULT 'הזמנה מהירה ונוחה'", 'heroBadgeText');
  addColumnIfMissing('business_settings', "heroTitle TEXT NOT NULL DEFAULT 'בחר שירות, נותן שירות ושעה'", 'heroTitle');
  addColumnIfMissing('business_settings', "heroSubtitle TEXT NOT NULL DEFAULT 'השירותים יכולים להיות משויכים לכל נותני השירות או רק לחלקם — ומה שאתה רואה מתעדכן בזמן אמת.'", 'heroSubtitle');
}
