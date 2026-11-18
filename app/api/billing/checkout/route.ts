import Stripe from 'stripe';
import { currentUserId } from '@/lib/auth';
import { db, initDb } from '@/lib/turso';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');
const PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? '';

export async function POST(req: Request) {
  try {
    const uid = await currentUserId();
    if (!uid) return Response.json({ error: 'Sign in first' }, { status: 401 });
    if (!process.env.STRIPE_SECRET_KEY || !PRICE_ID) {
      return Response.json({ error: 'Billing not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PRICE_ID to .env.local' }, { status: 503 });
    }
    await initDb();
    const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${base}/builder?pro=1`,
      cancel_url: `${base}/?billing=cancelled`,
      client_reference_id: uid,
      metadata: { user_id: uid },
      subscription_data: { metadata: { user_id: uid } },
    });
    return Response.json({ url: session.url });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'Checkout error' }, { status: 500 });
  }
}
