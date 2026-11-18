import Stripe from 'stripe';
import { db, initDb } from '@/lib/turso';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder');

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return Response.json({ error: 'No signature' }, { status: 400 });
  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, sig, secret);
    await initDb();

    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      const uid = s.client_reference_id ?? s.metadata?.user_id;
      if (uid) await db().execute({ sql: 'UPDATE users SET is_pro = 1 WHERE id = ?', args: [uid] });
    }
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const uid = sub.metadata?.user_id;
      if (uid) await db().execute({ sql: 'UPDATE users SET is_pro = 0 WHERE id = ?', args: [uid] });
    }
    return Response.json({ received: true });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? 'Webhook error' }, { status: 400 });
  }
}
