import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import { secureStorage } from './secureStorage';
import { env } from './env';

/**
 * DentaFlow deliberately keeps PHI out of the default SQLite cache.
 * Production native builds include SQLCipher and set a per-device key from SecureStore immediately after opening.
 * The cache still rejects patient and clinical payloads by default, limiting exposure if a device is compromised.
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getOrCreateDatabaseKey(): Promise<string> {
  const existing = await secureStorage.get('offline-sqlcipher-key');
  if (existing) return existing;
  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(bytes).map((value) => value.toString(16).padStart(2, '0')).join('');
  await secureStorage.set('offline-sqlcipher-key', key);
  return key;
}

async function configureDatabaseEncryption(db: SQLite.SQLiteDatabase): Promise<void> {
  const key = await getOrCreateDatabaseKey();
  await db.execAsync(`PRAGMA key = "x'${key}'";`);
  const cipher = await db.getFirstAsync<{ cipher_version?: string }>('PRAGMA cipher_version;');
  if (env.appEnv === 'production' && !cipher?.cipher_version) {
    throw new Error('SQLCipher is required for the production offline cache. Rebuild the native app with expo-sqlite useSQLCipher enabled.');
  }
}

const SENSITIVE_KEYS = new Set([
  'patient', 'patientId', 'patient_id', 'displayName', 'firstName', 'lastName', 'dateOfBirth',
  'phone', 'email', 'address', 'medicalAlerts', 'medications', 'clinical', 'diagnosis', 'findings',
  'assessment', 'prescription', 'consent', 'signature', 'storagePath', 'body', 'subject'
]);

function assertNonSensitive(value: unknown, path = 'payload'): void {
  if (value == null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNonSensitive(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key)) throw new Error(`Sensitive data cannot be stored in the unencrypted offline cache (${path}.${key}).`);
    assertNonSensitive(child, `${path}.${key}`);
  }
}

export async function getLocalDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('dentaflow-operational.db');
      await configureDatabaseEncryption(db);
      await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA secure_delete = ON;');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cache_entries (
          cache_key TEXT PRIMARY KEY NOT NULL,
          value_json TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          expires_at TEXT
        );
        CREATE TABLE IF NOT EXISTS mutation_queue (
          id TEXT PRIMARY KEY NOT NULL,
          operation TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL,
          last_error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_mutation_queue_created_at ON mutation_queue(created_at);
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  assertNonSensitive(value);
  const db = await getLocalDatabase();
  const now = new Date();
  const expiresAt = ttlSeconds ? new Date(now.getTime() + ttlSeconds * 1000).toISOString() : null;
  await db.runAsync(
    'INSERT OR REPLACE INTO cache_entries(cache_key, value_json, updated_at, expires_at) VALUES (?, ?, ?, ?)',
    key,
    JSON.stringify(value),
    now.toISOString(),
    expiresAt
  );
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const db = await getLocalDatabase();
  const row = await db.getFirstAsync<{ value_json: string; expires_at: string | null }>(
    'SELECT value_json, expires_at FROM cache_entries WHERE cache_key = ?', key
  );
  if (!row) return null;
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await db.runAsync('DELETE FROM cache_entries WHERE cache_key = ?', key);
    return null;
  }
  return JSON.parse(row.value_json) as T;
}

const OFFLINE_MUTATION_ALLOWLIST = new Set(['device-preference', 'integration-health', 'notification-token']);

export async function queueMutation(operation: string, entityType: string, payload: unknown): Promise<void> {
  if (!OFFLINE_MUTATION_ALLOWLIST.has(entityType)) throw new Error('Patient and clinical writes require an online, authenticated transaction.');
  assertNonSensitive(payload);
  const db = await getLocalDatabase();
  await db.runAsync(
    'INSERT INTO mutation_queue(id, operation, entity_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?)',
    Crypto.randomUUID(), operation, entityType, JSON.stringify(payload), new Date().toISOString()
  );
}
