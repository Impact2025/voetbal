import { getAdminClient } from './_lib/supabaseAdmin.js';

// Lichte view-teller-endpoint. De blog-HTML wordt door Vercel ge-edge-cached
// (s-maxage), waardoor de page-functie niet per bezoeker draait en server-side
// tellen niet werkt. Daarom telt de CLIENT: het artikel laadt een mini-script
// dat POST /api/blog-view?slug=... aanroept. Deze endpoint is bewust NIET
// gecached en hoogt de teller atomisch op via de increment_blog_view RPC.

interface Req {
  method: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | undefined>;
  body: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug ontbreekt' });

  // Bots niet meetellen (dubbele beveiliging naast het feit dat crawlers meestal
  // geen JS uitvoeren).
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview/.test(ua)) {
    return res.status(200).json({ ok: true, skipped: 'bot' });
  }

  try {
    const { data, error } = await getAdminClient().rpc('increment_blog_view', { p_slug: slug });
    if (error) return res.status(200).json({ ok: false }); // stil falen (bv. migratie niet gedraaid)
    return res.status(200).json({ ok: true, views: data });
  } catch {
    return res.status(200).json({ ok: false });
  }
}
