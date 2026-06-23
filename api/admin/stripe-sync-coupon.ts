import type Stripe from 'stripe';
import { verifySuperadmin } from '../_lib/adminGuard.js';
import { getAdminClient, logAdminAction } from '../_lib/supabaseAdmin.js';
import { getStripe, stripeConfigured } from '../_lib/stripe.js';

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: { couponId?: string };
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

// Maakt voor een DB-coupon een bijbehorende Stripe-coupon + promotion code,
// zodat de code daadwerkelijk bij Stripe-checkout toegepast kan worden.
export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const admin = await verifySuperadmin(req.headers['authorization']);
  if (!admin) return res.status(401).json({ error: 'Geen toegang.' });
  if (!stripeConfigured()) return res.status(400).json({ error: 'Stripe is niet geconfigureerd (STRIPE_SECRET_KEY ontbreekt).' });

  const couponId = req.body?.couponId;
  if (!couponId) return res.status(400).json({ error: 'couponId ontbreekt.' });

  const db = getAdminClient();
  const { data: c, error } = await db.from('coupons').select('*').eq('id', couponId).single();
  if (error || !c) return res.status(404).json({ error: 'Coupon niet gevonden.' });

  if (c.discount_type === 'free_trial') {
    return res.status(400).json({ error: 'Gratis-proef-coupons werken via de proefperiode bij checkout, niet als Stripe-coupon.' });
  }

  const stripe = getStripe();
  try {
    const couponParams: Stripe.CouponCreateParams = {
      name: c.code,
      duration: c.duration,
      ...(c.duration === 'repeating' && c.duration_in_months ? { duration_in_months: c.duration_in_months } : {}),
      ...(c.max_redemptions ? { max_redemptions: c.max_redemptions } : {}),
    };
    if (c.discount_type === 'percent') {
      couponParams.percent_off = Number(c.discount_value);
    } else {
      couponParams.amount_off = Math.round(Number(c.discount_value) * 100);
      couponParams.currency = c.currency;
    }

    const stripeCoupon = await stripe.coupons.create(couponParams);
    const promo = await stripe.promotionCodes.create({
      coupon: stripeCoupon.id,
      code: c.code,
      ...(c.expires_at ? { expires_at: Math.floor(new Date(c.expires_at).getTime() / 1000) } : {}),
    });

    await db.from('coupons').update({ stripe_coupon_id: stripeCoupon.id, stripe_promo_id: promo.id }).eq('id', couponId);
    await logAdminAction({ actorId: admin.id, actorEmail: admin.email, action: 'coupon_stripe_synced', target: c.code });

    return res.status(200).json({ ok: true, stripe_coupon_id: stripeCoupon.id, stripe_promo_id: promo.id });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Stripe-sync mislukt.' });
  }
}
