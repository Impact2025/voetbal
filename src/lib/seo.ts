// Deterministische SEO-score voor live feedback in de editor.

export interface SeoCheck { label: string; ok: boolean; hint: string; weight: number }
export interface SeoResult { score: number; checks: SeoCheck[] }

export interface SeoInput {
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  excerpt: string;
  body: string;
  keywords: string[];
  cover_image_url: string | null;
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export function computeSeo(p: SeoInput): SeoResult {
  const bodyText = stripHtml(p.body);
  const words = bodyText ? bodyText.split(' ').length : 0;
  const focus = (p.keywords[0] || '').toLowerCase();
  const lc = (s: string | null | undefined) => (s || '').toLowerCase();

  const checks: SeoCheck[] = [
    { label: 'Titellengte 30–60 tekens', ok: p.title.length >= 30 && p.title.length <= 60, hint: 'Houd de titel tussen 30 en 60 tekens.', weight: 1 },
    { label: 'Meta-description 80–155 tekens', ok: (p.meta_description?.length ?? 0) >= 80 && (p.meta_description?.length ?? 0) <= 155, hint: 'Schrijf een meta-description van 80–155 tekens.', weight: 1 },
    { label: 'Focus-keyword in titel', ok: !!focus && lc(p.title).includes(focus), hint: 'Verwerk het eerste keyword in de titel.', weight: 1 },
    { label: 'Focus-keyword in tekst', ok: !!focus && bodyText.toLowerCase().includes(focus), hint: 'Gebruik het focus-keyword in de body.', weight: 1 },
    { label: 'Minstens 600 woorden', ok: words >= 600, hint: `Nu ${words} woorden; streef naar 600+.`, weight: 1 },
    { label: 'Minstens één H2-kop', ok: /<h2[\s>]/i.test(p.body), hint: 'Voeg subkoppen (<h2>) toe voor structuur.', weight: 1 },
    { label: 'Interne link aanwezig', ok: /href=["']\/blog\//i.test(p.body), hint: 'Link naar een ander Skillkaart-artikel (/blog/...).', weight: 1 },
    { label: 'Externe link aanwezig', ok: /href=["']https?:\/\//i.test(p.body), hint: 'Verwijs naar minstens één gezaghebbende externe bron.', weight: 1 },
    { label: 'Excerpt ≤ 160 tekens', ok: p.excerpt.length > 0 && p.excerpt.length <= 160, hint: 'Vul een excerpt van max 160 tekens in.', weight: 0.5 },
    { label: 'Coverafbeelding', ok: !!p.cover_image_url, hint: 'Voeg een coverafbeelding toe (OG/social).', weight: 0.5 },
  ];

  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  return { score: Math.round((got / total) * 100), checks };
}

export const slugify = (s: string) =>
  s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
