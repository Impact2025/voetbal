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

// view_count is optioneel: staat 'ie nog niet in de DB (migratie niet gedraaid),
// dan valt de query terug op de kolommen zónder view_count. Zo blijft de blog
// werken vóór en na het uitvoeren van supabase/blog_view_tracking.sql.
const POST_COLS =
  'slug,title,excerpt,body,cover_image_url,category,meta_title,meta_description,keywords,author,published_at,updated_at';
const POST_COLS_VIEWS = `${POST_COLS},view_count`;

async function selectPosts(
  db: ReturnType<typeof getAdminClient>,
  slug?: string,
) {
  // Probeer eerst mét view_count; faalt dat (kolom bestaat nog niet), val terug.
  const build = (cols: string) => {
    let q = db.from('blog_posts').select(cols).eq('status', 'published');
    if (slug) return q.eq('slug', slug).maybeSingle();
    return q.order('published_at', { ascending: false });
  };
  const withViews = await build(POST_COLS_VIEWS);
  if (!withViews.error) return withViews;
  return build(POST_COLS);
}

// Server-rendert /blog (index) en /blog/:slug (artikel). Gemapt via vercel.json.
export default async function handler(req: Req, res: Res) {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
    const baseUrl = (process.env.PUBLIC_BASE_URL || `https://${req.headers['host'] || ''}`).trim();
    const db = getAdminClient();

    if (slug) {
      const { data } = await selectPosts(db, slug);
      if (!data) {
        const { data: all } = await selectPosts(db);
        return res.status(404).send(renderIndexPage((all ?? []) as unknown as BlogPost[], baseUrl));
      }
      // Leesteller ophogen — best-effort, nooit blokkerend en niet voor bots.
      const ua = (req.headers['user-agent'] || '').toLowerCase();
      const isBot = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview/.test(ua);
      if (!isBot) {
        db.rpc('increment_blog_view', { p_slug: slug }).then(
          () => {},
          () => {}, // RPC bestaat nog niet? Stil negeren.
        );
      }
      return res.status(200).send(renderPostPage(data as unknown as BlogPost, baseUrl));
    }

    const { data } = await selectPosts(db);
    return res.status(200).send(renderIndexPage((data ?? []) as unknown as BlogPost[], baseUrl));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send(`Blog-page fout: ${msg}`);
  }
}
