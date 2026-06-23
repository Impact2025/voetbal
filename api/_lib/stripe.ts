import Stripe from 'stripe';

let cached: Stripe | null = null;

// Stripe-client voor server-side gebruik. Vereist STRIPE_SECRET_KEY in Vercel.
export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY ontbreekt.');
  cached = new Stripe(key);
  return cached;
}

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}
