import { createHash, timingSafeEqual } from 'crypto';
import { getAdminClient, logAdminAction } from './_lib/supabaseAdmin.js';

// ── Machine-publicatie-endpoint (Agent OS → skillkaart.nl) ──────────────────
// Spiegelt de Bijeen /api/blog-route: volautomatische publicatie vanuit de
// Agent OS content-wachtrij. Agent OS POST hierheen met een Bearer-token en de
// (niet-Bijeen) payload-vorm:
//   { title, content, slug, seoTitle, seoDescription, tags[], source }
// en verwacht { post: { slug } } terug (dan bouwt Agent OS de live-URL).
//
// Vereist in Vercel (production + preview):
//   SKILLKAART_PUBLISH_KEY   — zelfde string als in Agent OS .env
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY   (al aanwezig)
// De sleutel MOET exact overeenkomen met SKILLKAART_PUBLISH_KEY in
// D:/apps/agentos/.env.

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: unknown;
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

// Timing-safe én lengte-ongevoelige vergelijking van de Bearer-sleutel.
function hasValidPublishKey(req: Req): boolean {
  const key =
    process.env.SKILLKAART_PUBLISH_KEY || process.env.PUBLISH_API_KEY || '';
  const authHeader = req.headers['authorization'];
  if (!key || !authHeader?.startsWith('Bearer ')) return false;
  const a = createHash('sha256').update(authHeader.slice(7)).digest();
  const b = createHash('sha256').update(key).digest();
  return timingSafeEqual(a, b);
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // accenten
    .replace(/[^a-z0-9\s-]/g, '') // emoji, em-dash, haakjes, etc.
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '');
}

function toExcerpt(html: string, max = 200): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, '') + '…';
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Fail CLOSED: geen/verkeerde sleutel → 401.
  if (!hasValidPublishKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body: Record<string, unknown>;
  try {
    body =
      typeof req.body === 'string' ? JSON.parse(req.body) : (req.body as Record<string, unknown>);
  } catch {
    return res.status(400).json({ error: 'Ongeldige JSON' });
  }
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Lege body' });
  }

  const title = String(body.title ?? '').trim();
  const content = String(body.content ?? '').trim();
  // Agent OS stuurt seoTitle/seoDescription; ondersteun ook meta*-varianten.
  const seoTitle = String(body.seoTitle ?? body.metaTitle ?? '').trim();
  const seoDescription = String(
    body.seoDescription ?? body.metaDescription ?? '',
  ).trim();
  const excerptIn = String(body.excerpt ?? '').trim();
  const category = String(body.category ?? '').trim() || null;
  const tags = Array.isArray(body.tags)
    ? (body.tags as unknown[]).map(String).filter(Boolean)
    : [];
  const coverImage = String(body.coverImage ?? body.cover_image_url ?? '').trim() || null;

  if (!title) return res.status(422).json({ error: 'Titel is verplicht' });
  if (!content) return res.status(422).json({ error: 'Content is verplicht' });

  const db = getAdminClient();

  // Slug: gebruik de meegestuurde slug, anders uit de titel. Altijd hersaneren
  // (Agent OS-slugs kunnen emoji/em-dash/haakjes bevatten).
  let slug = slugify(String(body.slug ?? '').trim() || title);
  if (!slug) slug = `artikel-${Date.now()}`;

  const excerpt = excerptIn || toExcerpt(content);
  const metaTitle = (seoTitle || title).slice(0, 60);
  const metaDescription = (seoDescription || excerpt).slice(0, 155);

  const row = {
    slug,
    title,
    excerpt,
    body: content,
    cover_image_url: coverImage,
    category,
    meta_title: metaTitle,
    meta_description: metaDescription,
    keywords: tags,
    status: 'published' as const,
    author: 'Skillkaart',
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    // Upsert op slug: bestaat de post al → update, anders → insert.
    // Voorkomt duplicaat-key-fouten bij herpublicatie van hetzelfde artikel.
    const { data, error } = await db
      .from('blog_posts')
      .upsert(row, { onConflict: 'slug' })
      .select('slug, title, status')
      .single();

    if (error) {
      return res.status(500).json({ error: `DB-fout: ${error.message}` });
    }

    // IndexNow ping (best-effort): laat zoekmachines het nieuwe artikel weten.
    const baseUrl = (process.env.PUBLIC_BASE_URL || 'https://skillkaart.nl').replace(/\/+$/, '');
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      const fullUrl = `${baseUrl}/blog/${data.slug}`;
      try {
        await fetch('https://api.indexnow.org/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify({
            host: new URL(baseUrl).host,
            key: indexNowKey,
            keyLocation: `${baseUrl}/${indexNowKey}.txt`,
            urlList: [fullUrl],
          }),
        });
      } catch {
        /* ping mag nooit de publicatie blokkeren */
      }
    }

    await logAdminAction({
      action: 'blog_published_agentos',
      target: data.slug,
      meta: { source: String(body.source ?? 'agent-os'), title },
    });

    return res.status(201).json({ post: data, url: `${baseUrl}/blog/${data.slug}` });
  } catch (err) {
    return res
      .status(500)
      .json({ error: err instanceof Error ? err.message : 'Publicatie mislukt' });
  }
}
