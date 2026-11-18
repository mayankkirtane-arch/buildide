import { db, initDb } from '@/lib/turso';
import { currentUserId } from '@/lib/auth';

// Prefer the signed session; fall back to header only for legacy local-dev use.
async function userId(req: Request): Promise<string> {
  return (await currentUserId()) ?? req.headers.get('x-user-id') ?? 'anonymous';
}

export async function GET(req: Request) {
  try {
    await initDb();
    const uid = await userId(req);
    const { rows } = await db().execute({
      sql: 'SELECT id, name, files, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC LIMIT 50',
      args: [uid],
    });
    return Response.json({ projects: rows });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'DB error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDb();
    const { name, files } = await req.json();
    const uid = await userId(req);
    const id = crypto.randomUUID();
    await db().execute({
      sql: 'INSERT INTO projects (id, user_id, name, files) VALUES (?, ?, ?, ?)',
      args: [id, uid, name ?? 'Untitled', JSON.stringify(files ?? [])],
    });
    return Response.json({ id }, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'DB error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await initDb();
    const { id, name, files } = await req.json();
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    await db().execute({
      sql: 'UPDATE projects SET name = ?, files = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      args: [name ?? 'Untitled', JSON.stringify(files ?? []), id],
    });
    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'DB error' }, { status: 500 });
  }
}
