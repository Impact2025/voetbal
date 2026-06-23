import { getAdminClient } from './_lib/supabaseAdmin.js';
import { renderSitemap } from './_lib/blogRender.js';

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

  res.status(200).send(renderSitemap((data ?? []) as { slug: string; updated_at: string }[], baseUrl));
}
