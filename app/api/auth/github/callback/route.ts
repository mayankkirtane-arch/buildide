import { NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE, ensureUser, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '@/lib/auth';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  if (!code || !GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/?auth=error', base));
  }
  try {
    // Exchange code for token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(new URL('/?auth=error', base));

    // Fetch profile + email
    const headers = { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'BuildIDE' };
    const [profileRes, emailRes] = await Promise.all([
      fetch('https://api.github.com/user', { headers }),
      fetch('https://api.github.com/user/emails', { headers }),
    ]);
    const profile: any = await profileRes.json();
    const emails: any[] = await emailRes.json().catch(() => []);
    const email = emails.find((e) => e.primary)?.email ?? profile.email ?? null;

    const uid = `gh_${profile.id}`;
    await ensureUser(uid, { email, name: profile.login, avatar: profile.avatar_url });

    const res = NextResponse.redirect(new URL('/builder', base));
    res.cookies.set(SESSION_COOKIE, signSession(uid), { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30 });
    return res;
  } catch {
    return NextResponse.redirect(new URL('/?auth=error', base));
  }
}
