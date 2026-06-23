import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => {
  const state = { result: { data: null as unknown, error: null as unknown }, lastInsert: null as unknown };
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
    from: () => h.makeChain(),
    rpc: vi.fn(() => Promise.resolve(h.state.result)),
  },
}));

import { STAGES, ACTIVITY_LABEL, fetchAccounts, createAccount, syncPlatform } from './crm';
import { supabase } from './supabase';

describe('crm constanten', () => {
  it('heeft de vijf pipeline-fases in volgorde', () => {
    expect(STAGES.map((s) => s.id)).toEqual(['lead', 'demo', 'trial', 'paying', 'churned']);
  });
  it('heeft labels voor elk activiteitstype', () => {
    expect(Object.keys(ACTIVITY_LABEL)).toEqual(['note', 'call', 'email', 'meeting', 'task']);
  });
});

describe('crm datalaag', () => {
  beforeEach(() => { h.state.result = { data: [], error: null }; h.state.lastInsert = null; vi.clearAllMocks(); });

  it('fetchAccounts geeft een lege lijst terug bij geen data', async () => {
    h.state.result = { data: null, error: null };
    expect(await fetchAccounts()).toEqual([]);
  });

  it('createAccount stuurt de payload door en geeft de rij terug', async () => {
    h.state.result = { data: { id: 'a1', name: 'FC Test' }, error: null };
    const a = await createAccount({ name: 'FC Test' });
    expect((h.state.lastInsert as { name: string }).name).toBe('FC Test');
    expect(a.id).toBe('a1');
  });

  it('syncPlatform roept de juiste RPC aan', async () => {
    h.state.result = { data: { new_accounts: 2, new_contacts: 3 }, error: null };
    const r = await syncPlatform();
    expect(supabase.rpc).toHaveBeenCalledWith('crm_sync_platform');
    expect(r).toEqual({ new_accounts: 2, new_contacts: 3 });
  });
});
