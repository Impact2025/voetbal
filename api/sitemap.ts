import { getAdminClient } from './_lib/supabaseAdmin.js';

interface Req { method: string; headers: Record<string, string | undefined> }
interface Res {
  status: (code: number) => Res;
  send: (body: string) => void;
  setHeader: (n: string, v: string) => void;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

  const baseUrl = (process.env.PUBLIC_BASE_URL || `https://${req.headers['host'] || ''}`).trim();
  const { data } = await getAdminClient()
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const posts = (data ?? []) as { slug: string; updated_at: string; published_at?: string }[];
  const today = new Date().toISOString();
  const staticPages = [
    { path: '/', updated_at: today },
    { path: '/blog', updated_at: today },
    { path: '/faq', updated_at: today },
  ];

  const urls = [
    ...staticPages.map((p) => `  <url><loc>${baseUrl}${p.path}</loc><lastmod>${p.updated_at}</lastmod></url>`),
    ...posts.map((s) => `  <url><loc>${baseUrl}/blog/${s.slug}</loc><lastmod>${new Date(s.published_at || s.updated_at).toISOString()}</lastmod></url>`),
  ];

  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`);
}
