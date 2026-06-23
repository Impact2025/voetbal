import { describe, it, expect, beforeEach, vi } from 'vitest';

const h = vi.hoisted(() => {
  const state = { result: { data: null as unknown, error: null as unknown }, lastUpdate: null as unknown };
  const makeChain = () => {
    const chain: Record<string, unknown> = {};
    for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single', 'maybeSingle', 'limit']) {
      chain[m] = (arg: unknown) => { if (m === 'update') state.lastUpdate = arg; return chain; };
    }
    (chain as { then: unknown }).then = (res: (v: unknown) => unknown) => res(state.result);
    return chain;
  };
  return { state, makeChain };
});

vi.mock('./supabase', () => ({
  supabase: {
    from: () => h.makeChain(),
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'tok-123' } } }) },
  },
}));

import { setPublished, generatePost } from './blog';

describe('blog datalaag', () => {
  beforeEach(() => { h.state.result = { data: null, error: null }; h.state.lastUpdate = null; vi.restoreAllMocks(); });

  it('setPublished(true) zet status op published met published_at', async () => {
    await setPublished('id1', true);
    const u = h.state.lastUpdate as { status: string; published_at: string | null };
    expect(u.status).toBe('published');
    expect(u.published_at).toBeTruthy();
  });

  it('setPublished(false) zet terug naar concept zonder datum', async () => {
    await setPublished('id1', false);
    const u = h.state.lastUpdate as { status: string; published_at: string | null };
    expect(u.status).toBe('draft');
    expect(u.published_at).toBeNull();
  });

  it('generatePost stuurt het auth-token mee en geeft de post terug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, post: { title: 'X', slug: 'x', body: '<p>x</p>' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const post = await generatePost({ topic: 'Test' });
    expect(post.title).toBe('X');
    const [, opts] = fetchMock.mock.calls[0];
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
  });

  it('generatePost gooit bij een serverfout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({ error: 'mislukt' }) }));
    await expect(generatePost({ topic: 'Test' })).rejects.toThrow('mislukt');
  });
});
