import { getAdminClient } from './_lib/supabaseAdmin.js';
import { renderPostPage, renderIndexPage, type BlogPost } from './_lib/blogRender.js';

interface Req {
  method: string;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | undefined>;
}
interface Res {
  status: (code: number) => Res;
  send: (html: string) => void;
  setHeader: (n: string, v: string) => void;
  end: () => void;
}

const POST_COLS = 'slug,title,excerpt,body,cover_image_url,category,meta_title,meta_description,keywords,author,published_at,updated_at';

// Server-rendert /blog (index) en /blog/:slug (artikel). Gemapt via vercel.json.
export default async function handler(req: Req, res: Res) {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
    const baseUrl = (process.env.PUBLIC_BASE_URL || `https://${req.headers['host'] || ''}`).trim();
    const db = getAdminClient();

    if (slug) {
      const { data } = await db.from('blog_posts').select(POST_COLS).eq('slug', slug).eq('status', 'published').maybeSingle();
      if (!data) {
        return res.status(404).send(renderIndexPage([], baseUrl));
      }
      return res.status(200).send(renderPostPage(data as BlogPost, baseUrl));
    }

    const { data } = await db.from('blog_posts').select(POST_COLS).eq('status', 'published').order('published_at', { ascending: false });
    return res.status(200).send(renderIndexPage((data ?? []) as BlogPost[], baseUrl));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send(`Blog-page fout: ${msg}`);
  }
}
