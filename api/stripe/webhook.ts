import { getStripe } from '../_lib/stripe.js';
import { getAdminClient, logAdminAction } from '../_lib/supabaseAdmin.js';

interface Req {
  method: string;
  query: Record<string, string | string[] | undefined>;
  body: { id?: string };
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
}

// Stripe-webhook. In plaats van raw-body Svix-verificatie (lastig op Vercel)
// halen we het event op authenticiteit opnieuw op bij Stripe via het event-id,
// plus een token-gate in de URL: zet de webhook-URL in Stripe op
//   https://<domein>/api/stripe/webhook?token=<STRIPE_WEBHOOK_TOKEN>
export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') return res.status(405).end();

  const token = Array.isArray(req.query.token) ? req.query.token[0] : req.query.token;
  if (!process.env.STRIPE_WEBHOOK_TOKEN || token !== process.env.STRIPE_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Ongeldige webhook-token.' });
  }

  const eventId = req.body?.id;
  if (!eventId) return res.status(400).json({ error: 'Geen event-id.' });

  const stripe = getStripe();
  const db = getAdminClient();

  let event;
  try {
    event = await stripe.events.retrieve(eventId); // authenticiteitscheck via Stripe zelf
  } catch {
    return res.status(401).json({ error: 'Event niet te verifiëren bij Stripe.' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as {
      id: string;
      metadata?: { couponCode?: string };
      customer_email?: string | null;
      customer_details?: { email?: string | null } | null;
      amount_total?: number | null;
      amount_subtotal?: number | null;
    };
    const code = session.metadata?.couponCode?.trim();
    const email = session.customer_details?.email || session.customer_email || null;

    if (code) {
      const { data: coupon } = await db.from('coupons').select('id, redeemed_count').eq('code', code.toUpperCase()).maybeSingle();
      const c = coupon as { id: string; redeemed_count: number } | null;
      if (c) {
        const discount = ((session.amount_subtotal ?? 0) - (session.amount_total ?? 0)) / 100;
        await db.from('coupon_redemptions').insert({
          coupon_id: c.id, email, stripe_session_id: session.id, amount_discount: discount > 0 ? discount : null,
        });
        await db.from('coupons').update({ redeemed_count: c.redeemed_count + 1 }).eq('id', c.id);
        await logAdminAction({ actorEmail: 'system:stripe', action: 'coupon_redeemed', target: code, meta: { email, session: session.id } });
      }
    }
  }

  return res.status(200).json({ ok: true });
}
