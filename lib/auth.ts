import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db, initDb } from '@/lib/turso';

const SECRET = process.env.AUTH_SECRET ?? 'dev-only-insecure-secret-change-me';
const COOKIE = 'buildide_session';

export function signSession(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = createHmac('sha256', SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).uid; } catch { return null; }
}

// Server-only: read current user id from the session cookie.
export async function currentUserId(): Promise<string | null> {
  const store = await cookies();
  return verifySession(store.get(COOKIE)?.value);
}

export const SESSION_COOKIE = COOKIE;

// Ensure a user row exists in Turso.
export async function ensureUser(id: string, info?: { email?: string; name?: string; avatar?: string }) {
  await initDb();
  await db().execute({
    sql: `INSERT OR IGNORE INTO users (id, email, name, avatar) VALUES (?, ?, ?, ?)`,
    args: [id, info?.email ?? null, info?.name ?? null, info?.avatar ?? null],
  });
}

// GitHub OAuth config (optional — dev fallback is used when missing).
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? '';
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? '';
export const GITHUB_ENABLED = Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);
