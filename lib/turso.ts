import { createClient } from '@libsql/client';

// Turso (libSQL/SQLite) — server-side only. Never import this in a client component.
// For local dev without Turso, set TURSO_DATABASE_URL=file:local.db
let _client: ReturnType<typeof createClient> | null = null;

export function db() {
  if (_client) return _client;
  const url = process.env.TURSO_DATABASE_URL ?? 'file:local.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;
  _client = createClient({ url, authToken });
  return _client;
}

export async function initDb() {
  const client = db();
  await client.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      email TEXT,
      is_pro INTEGER DEFAULT 0,
      prompts_used INTEGER DEFAULT 0,
      prompt_day TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT DEFAULT 'Untitled',
      files TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
