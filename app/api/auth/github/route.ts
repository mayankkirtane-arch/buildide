import { NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE, ensureUser, GITHUB_CLIENT_ID, GITHUB_ENABLED } from '@/lib/auth';

// GET /api/auth/github — start GitHub OAuth. Falls back to demo login if not configured.
export async function GET() {
  if (!GITHUB_ENABLED) {
    const res = NextResponse.redirect(new URL('/builder', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'));
    res.cookies.set(SESSION_COOKIE, signSession('demo-user'), { httpOnly: true, sameSite: 'lax', path: '/' });
    await ensureUser('demo-user', { name: 'Demo User' });
    return res;
  }
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', GITHUB_CLIENT_ID!);
  url.searchParams.set('scope', 'read:user user:email');
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  url.searchParams.set('redirect_uri', `${base}/api/auth/github/callback`);
  url.searchParams.set('state', crypto.randomUUID());
  return NextResponse.redirect(url);
}
