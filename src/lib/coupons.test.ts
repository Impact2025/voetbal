import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => {
  const state = { result: { data: null as unknown, error: null as unknown }, lastInsert: null as unknown, lastTable: '' };
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybeSingle', 'limit']) {
      chain[m] = (arg: unknown) => { if (m === 'insert') state.lastInsert = arg; return chain; };
    }
    (chain as { then: unknown }).then = (res: (v: unknown) => unknown) => res(state.result);
    return chain;
  };
  return { state, makeChain };
});

vi.mock('./supabase', () => ({
  supabase: {
    from: (t: string) => { h.state.lastTable = t; return h.makeChain(); },
    rpc: vi.fn(() => Promise.resolve(h.state.result)),
  },
}));

import { createCoupon, validateCoupon, fetchCoupons } from './coupons';
import { supabase } from './supabase';

describe('coupons datalaag', () => {
  beforeEach(() => { h.state.result = { data: null, error: null }; h.state.lastInsert = null; vi.clearAllMocks(); });

  it('createCoupon zet de code om naar uppercase', async () => {
    h.state.result = { data: { id: '1', code: 'WELKOM10' }, error: null };
    await createCoupon({ code: 'welkom10', discount_type: 'percent', discount_value: 10 });
    expect((h.state.lastInsert as { code: string }).code).toBe('WELKOM10');
  });

  it('fetchCoupons gooit bij een fout', async () => {
    h.state.result = { data: null, error: { message: 'boom' } };
    await expect(fetchCoupons()).rejects.toThrow('boom');
  });

  it('validateCoupon roept de RPC aan en geeft het resultaat door', async () => {
    h.state.result = { data: { valid: true, discount_type: 'percent', discount_value: 10 }, error: null };
    const r = await validateCoupon('WELKOM10', 'a@b.nl');
    expect(supabase.rpc).toHaveBeenCalledWith('coupon_validate', { p_code: 'WELKOM10', p_email: 'a@b.nl' });
    expect(r.valid).toBe(true);
  });
});
