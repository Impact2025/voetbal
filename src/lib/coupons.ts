import { supabase } from './supabase';

export type DiscountType = 'percent' | 'fixed' | 'free_trial';
export type CouponDuration = 'once' | 'repeating' | 'forever';

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  currency: string;
  duration: CouponDuration;
  duration_in_months: number | null;
  max_redemptions: number | null;
  per_user_limit: number;
  redeemed_count: number;
  active: boolean;
  expires_at: string | null;
  stripe_coupon_id: string | null;
  stripe_promo_id: string | null;
  created_at: string;
  updated_at: string;
}

export type CouponDraft = {
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  duration?: CouponDuration;
  duration_in_months?: number | null;
  max_redemptions?: number | null;
  per_user_limit?: number;
  expires_at?: string | null;
};

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Coupon[];
}

export async function createCoupon(d: CouponDraft): Promise<Coupon> {
  const patch = { ...d, code: d.code.toUpperCase().trim() };
  const { data, error } = await supabase.from('coupons').insert(patch).select().single();
  if (error) throw new Error(error.message);
  return data as Coupon;
}

export async function updateCoupon(id: string, patch: Partial<Coupon>): Promise<void> {
  const { error } = await supabase.from('coupons').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  discount_type?: DiscountType;
  discount_value?: number;
}

export async function validateCoupon(code: string, email?: string): Promise<ValidationResult> {
  const { data, error } = await supabase.rpc('coupon_validate', { p_code: code, p_email: email ?? null });
  if (error) throw new Error(error.message);
  return data as ValidationResult;
}

export async function syncToStripe(couponId: string): Promise<{ ok: boolean; stripe_coupon_id?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch('/api/admin/stripe-sync-coupon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ couponId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Stripe-sync mislukt.');
  return json;
}
