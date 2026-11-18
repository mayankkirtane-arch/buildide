import { NextResponse } from 'next/server';
import { currentUserId, SESSION_COOKIE } from '@/lib/auth';
import { db, initDb } from '@/lib/turso';

export async function GET() {
  const uid = await currentUserId();
  if (!uid) return Response.json({ user: null });
  await initDb();
  const { rows } = await db().execute({
    sql: 'SELECT id, email, name, is_pro, prompts_used, prompt_day FROM users WHERE id = ?',
    args: [uid],
  });
  return Response.json({ user: rows[0] ?? { id: uid } });
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
