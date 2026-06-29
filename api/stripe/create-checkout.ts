import type Stripe from 'stripe';
import { getStripe, stripeConfigured } from '../_lib/stripe.js';
import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { CreateCheckoutSchema, validateOrError } from '../_lib/validate.js';

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: { priceId?: string; couponCode?: string; email?: string };
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

// Publiek: maakt een Stripe Checkout-sessie (abonnement) en past een
// couponcode toe. Aanroepbaar vanaf de pricing/upgrade-pagina.
export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();
  if (!stripeConfigured()) return res.status(400).json({ error: 'Stripe is niet geconfigureerd.' });

  // Input-validatie met zod
  if (!validateOrError(CreateCheckoutSchema, req.body, res)) return;

  const priceId = req.body?.priceId || process.env.STRIPE_PRICE_ID;
  if (!priceId) return res.status(400).json({ error: 'priceId of STRIPE_PRICE_ID ontbreekt.' });

  const { couponCode, email } = req.body;
  const base = process.env.PUBLIC_BASE_URL || `https://${req.headers['host'] || ''}`;
  const db = getAdminClient();
  const stripe = getStripe();

  // Coupon valideren + toepassing bepalen.
  const sub: Stripe.Checkout.SessionCreateParams.SubscriptionData = {};
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  let allowPromo = true;

  if (couponCode?.trim()) {
    const { data: v } = await db.rpc('coupon_validate', { p_code: couponCode, p_email: email ?? null });
    const valid = v as { valid: boolean; reason?: string; discount_type?: string; discount_value?: number } | null;
    if (!valid?.valid) return res.status(400).json({ error: `Coupon ongeldig: ${valid?.reason ?? 'onbekend'}` });

    if (valid.discount_type === 'free_trial') {
      sub.trial_period_days = Math.round(Number(valid.discount_value));
    } else {
      const { data: row } = await db.from('coupons').select('stripe_coupon_id').eq('code', couponCode.toUpperCase().trim()).maybeSingle();
      const stripeCouponId = (row as { stripe_coupon_id: string | null } | null)?.stripe_coupon_id;
      if (stripeCouponId) { discounts = [{ coupon: stripeCouponId }]; allowPromo = false; }
    }
  }

  const params: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email || undefined,
    success_url: process.env.STRIPE_SUCCESS_URL || `${base}/?upgrade=success`,
    cancel_url: process.env.STRIPE_CANCEL_URL || `${base}/?upgrade=cancel`,
    metadata: { couponCode: couponCode?.toUpperCase().trim() || '' },
  };
  if (Object.keys(sub).length) params.subscription_data = sub;
  if (discounts) params.discounts = discounts;
  else params.allow_promotion_codes = allowPromo;

  try {
    const session = await stripe.checkout.sessions.create(params);
    return res.status(200).json({ ok: true, url: session.url });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Checkout mislukt.' });
  }
}
