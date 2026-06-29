import { getAdminClient } from './_lib/supabaseAdmin.js';
import { renderFaqPage } from './_lib/faqRender.js';

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
}
interface Res {
  status: (code: number) => Res;
  send: (html: string) => void;
  setHeader: (n: string, v: string) => void;
}

// Server-rendert /faq met volledige HTML + FAQPage JSON-LD schema.
// Te zien via vercel.json rewrite: /faq → /api/faq-page
export default async function handler(req: Req, res: Res) {
  try {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');

    const baseUrl = (process.env.PUBLIC_BASE_URL || `https://${req.headers['host'] || ''}`).trim();
    const db = getAdminClient();

    const html = await renderFaqPage(db, baseUrl);
    return res.status(200).send(html);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.setHeader('Content-Type', 'text/plain');
    return res.status(500).send(`FAQ-pagina fout: ${msg}`);
  }
}
