import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => {
  const state = { result: { data: null as unknown, error: null as unknown } };
  return { state };
});

vi.mock('./supabase', () => ({
  supabase: {
    rpc: vi.fn(() => Promise.resolve(h.state.result)),
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'tok-xyz' } } }) },
  },
}));

import { SEGMENTS, resolveRecipients, sendCampaign } from './mail';
import { supabase } from './supabase';

describe('mail constanten', () => {
  it('bevat de verwachte segmenten', () => {
    expect(SEGMENTS.map((s) => s.id)).toEqual(['coaches', 'club_admins', 'parents', 'all_staff', 'crm']);
  });
});

describe('mail datalaag', () => {
  beforeEach(() => { h.state.result = { data: [], error: null }; vi.restoreAllMocks(); });

  it('resolveRecipients roept de RPC aan met segment en stage', async () => {
    h.state.result = { data: [{ email: 'a@b.nl', name: 'A' }], error: null };
    const r = await resolveRecipients('crm', 'paying');
    expect(supabase.rpc).toHaveBeenCalledWith('email_resolve_recipients', { p_segment: 'crm', p_stage: 'paying' });
    expect(r).toHaveLength(1);
  });

  it('sendCampaign post naar het endpoint met auth-token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, json: () => Promise.resolve({ ok: true, recipients: 5, sent: 5, failed: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const r = await sendCampaign({ subject: 'Hoi', body: 'Tekst', segment: 'coaches' });
    expect(r.sent).toBe(5);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/send-campaign');
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer tok-xyz');
  });

  it('sendCampaign gooit bij een serverfout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'kapot' }) }));
    await expect(sendCampaign({ subject: 's', body: 'b', segment: 'coaches' })).rejects.toThrow('kapot');
  });
});
