import { verifySuperadmin } from '../_lib/adminGuard.js';
import { getAdminClient, logAdminAction } from '../_lib/supabaseAdmin.js';
import { GenerateBlogSchema, validateOrError } from '../_lib/validate.js';

interface Req {
  method: string;
  headers: Record<string, string | undefined>;
  body: { topic?: string; keywords?: string; category?: string };
}
interface Res {
  status: (code: number) => Res;
  json: (data: unknown) => void;
  end: () => void;
  setHeader: (n: string, v: string) => void;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req: Req, res: Res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const admin = await verifySuperadmin(req.headers['authorization']);
  if (!admin) return res.status(401).json({ error: 'Geen toegang.' });

  // Input-validatie met zod
  if (!validateOrError(GenerateBlogSchema, req.body, res)) return;

  const topic = req.body?.topic?.trim();
  if (!topic) return res.status(400).json({ error: 'Onderwerp is verplicht.' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'OPENROUTER_API_KEY ontbreekt.' });

  // Bestaande gepubliceerde posts voor interne-link-suggesties.
  const { data: existing } = await getAdminClient()
    .from('blog_posts').select('slug, title').eq('status', 'published').limit(40);
  const internalList = (existing ?? []).map((p: { slug: string; title: string }) => `- "${p.title}" → /blog/${p.slug}`).join('\n') || '(nog geen bestaande artikelen)';

  const prompt = `Je bent een wereldklasse SEO-copywriter voor Skillkaart, een SaaS voor jeugdvoetbalontwikkeling. Doelgroep: voetbalcoaches en voetbalouders in Nederland.

Schrijf een diepgaand, E-E-A-T-waardig artikel in het Nederlands over: "${topic}".
${req.body?.keywords ? `Belangrijke keywords om natuurlijk te verwerken: ${req.body.keywords}.` : ''}
${req.body?.category ? `Categorie: ${req.body.category}.` : ''}

Eisen:
- 700-1100 woorden, scanbaar: gebruik <h2> en <h3> koppen, korte paragrafen en waar passend een <ul>.
- Verwerk het hoofdkeyword natuurlijk in de eerste alinea, een kop en de meta.
- INTERNE links: voeg 1-3 links toe naar relevante bestaande artikelen, exact als href="/blog/<slug>". Alleen als echt relevant; anders weglaten. Beschikbaar:
${internalList}
- EXTERNE links: voeg 1-3 links toe naar gezaghebbende, ECHTE bronnen (bijv. knvb.nl en andere erkende sport-/wetenschapsbronnen). Verzin geen niet-bestaande URL's; gebruik bekende hoofddomeinen.
- body = geldige HTML-fragmenten (begin direct met een <p>; GEEN <html>, <body> of <h1> — de titel wordt apart getoond).

Geef UITSLUITEND geldige JSON terug (geen markdown, geen uitleg) met exact deze velden:
{"title": string, "slug": string (kebab-case, nl, zonder accenten/spaties), "excerpt": string (max 160 tekens), "meta_title": string (max 60 tekens), "meta_description": string (max 155 tekens), "category": string, "keywords": string[] (4-8 items), "body": string (HTML)}`;

  try {
    const aiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'Skillkaart Blog' },
      body: JSON.stringify({
        model: process.env.BLOG_AI_MODEL || 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4000,
        temperature: 0.6,
      }),
    });
    if (!aiRes.ok) throw new Error(`AI HTTP ${aiRes.status}`);
    const json = (await aiRes.json()) as { choices?: Array<{ message?: { content?: string } }> };
    let text = json.choices?.[0]?.message?.content?.trim() || '';

    // Strip eventuele code fences en pak het JSON-object eruit.
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Geen JSON in AI-antwoord.');
    const parsed = JSON.parse(text.slice(start, end + 1));

    await logAdminAction({ actorId: admin.id, actorEmail: admin.email, action: 'blog_generated', target: parsed.slug, meta: { topic } });

    return res.status(200).json({ ok: true, post: parsed });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Generatie mislukt.' });
  }
}
