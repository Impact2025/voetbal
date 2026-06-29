// Server-side HTML voor de publieke blog. Echte HTML + meta + OG + JSON-LD
// zodat Google de content volledig kan indexeren (de SPA kan dit niet).

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  category: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  author: string;
  published_at: string | null;
  updated_at: string;
}

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SHELL_CSS = `
  *{box-sizing:border-box}
  body{margin:0;background:#fff;color:#334155;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.7}
  a{color:#00FF9D;font-weight:500}
  .wrap{max-width:760px;margin:0 auto;padding:32px 20px 80px}
  .brand{font-weight:900;letter-spacing:3px;color:#00FF9D;text-decoration:none;font-size:18px}
  .meta{color:#64748b;font-size:13px;margin:8px 0 24px}
  h1{font-size:34px;line-height:1.2;color:#0f172a;margin:24px 0 8px}
  h2{font-size:24px;color:#0f172a;margin:32px 0 8px}
  h3{font-size:19px;color:#0f172a;margin:24px 0 8px}
  article img{max-width:100%;border-radius:12px}
  .cover{width:100%;border-radius:16px;margin:16px 0 8px}
  .cta{display:inline-block;margin-top:40px;background:#00FF9D;color:#000;font-weight:800;padding:14px 24px;border-radius:12px;text-decoration:none}
  .cta:hover{background:#00e68a}
  .card{display:block;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin:14px 0;text-decoration:none;color:inherit;transition:border-color .2s,box-shadow .15s}
  .card:hover{border-color:#00FF9D88;box-shadow:0 1px 4px #00000008}
  .card h2{color:#0f172a;font-size:20px;margin:8px 0 6px}
  .card p{color:#64748b;margin:0}
  .tag{display:inline-block;font-size:11px;color:#64748b;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:999px;padding:2px 8px;margin-right:6px}
  article p{color:#475569}
  article strong{color:#0f172a}
`;

function head(opts: {
  title: string; description: string; canonical: string; image?: string | null; type: string;
  publishedAt?: string | null; jsonLd?: string;
}): string {
  return `<!DOCTYPE html><html lang="nl"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
<link rel="canonical" href="${esc(opts.canonical)}">
<meta property="og:type" content="${esc(opts.type)}">
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:url" content="${esc(opts.canonical)}">
${opts.image ? `<meta property="og:image" content="${esc(opts.image)}">` : ''}
<meta name="twitter:card" content="${opts.image ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(opts.title)}">
<meta name="twitter:description" content="${esc(opts.description)}">
${opts.image ? `<meta name="twitter:image" content="${esc(opts.image)}">` : ''}
${opts.jsonLd ? `<script type="application/ld+json">${opts.jsonLd}</script>` : ''}
<style>${SHELL_CSS}</style>
</head>`;
}

export function renderPostPage(post: BlogPost, baseUrl: string): string {
  const canonical = `${baseUrl}/blog/${post.slug}`;
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt;
  const dateStr = post.published_at ? new Date(post.published_at).toLocaleDateString('nl-NL', { dateStyle: 'long' }) : '';

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description,
    image: post.cover_image_url || undefined,
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@type': 'Organization', name: 'Skillkaart' },
    keywords: post.keywords.join(', '),
    mainEntityOfPage: canonical,
  });

  return `${head({ title, description, canonical, image: post.cover_image_url, type: 'article', publishedAt: post.published_at, jsonLd })}
<body>
  <div class="wrap">
    <a class="brand" href="${baseUrl}/blog">SKILLKAART</a>
    ${post.cover_image_url ? `<img class="cover" src="${esc(post.cover_image_url)}" alt="${esc(post.title)}">` : ''}
    <h1>${esc(post.title)}</h1>
    <div class="meta">${post.category ? `${esc(post.category)} · ` : ''}${dateStr ? `${dateStr} · ` : ''}${esc(post.author)}</div>
    <article>${post.body}</article>
    <a class="cta" href="${baseUrl}/">Probeer Skillkaart →</a>
    <p style="margin-top:32px"><a href="${baseUrl}/blog">← Alle artikelen</a></p>
  </div>
</body></html>`;
}

export function renderIndexPage(posts: BlogPost[], baseUrl: string): string {
  const canonical = `${baseUrl}/blog`;
  const cards = posts.map((p) => `
    <a class="card" href="${baseUrl}/blog/${p.slug}">
      ${p.category ? `<span class="tag">${esc(p.category)}</span>` : ''}
      <h2 style="margin:8px 0 6px;font-size:20px">${esc(p.title)}</h2>
      <p style="color:#9ca3af;margin:0">${esc(p.excerpt)}</p>
    </a>`).join('');

  return `${head({
    title: 'Blog — Skillkaart | Jeugdvoetbal ontwikkeling',
    description: 'Tips, inzichten en gidsen over jeugdvoetbal, trainen en spelersontwikkeling van Skillkaart.',
    canonical, type: 'website',
  })}
<body>
  <div class="wrap">
    <a class="brand" href="${baseUrl}/">SKILLKAART</a>
    <h1>Blog</h1>
    <div class="meta">Inzichten over jeugdvoetbal & spelersontwikkeling</div>
    ${cards || '<p style="color:#6b7280">Nog geen artikelen.</p>'}
  </div>
</body></html>`;
}

export function renderSitemap(slugs: { slug: string; updated_at: string }[], baseUrl: string): string {
  const urls = slugs.map((s) => `  <url><loc>${baseUrl}/blog/${s.slug}</loc><lastmod>${new Date(s.updated_at).toISOString()}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
  <url><loc>${baseUrl}/blog</loc></url>
${urls}
</urlset>`;
}
