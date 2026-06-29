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
  publishedAt?: string | null; jsonLd?: string; extraStyle?: string;
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
${opts.extraStyle ? `<style>${opts.extraStyle}</style>` : ''}
</head>`;
}

export function renderPostPage(post: BlogPost, baseUrl: string): string {
  const canonical = `${baseUrl}/blog/${post.slug}`;
  const title = post.meta_title || post.title;
  const description = post.meta_description || post.excerpt;
  const dateStr = post.published_at ? new Date(post.published_at).toLocaleDateString('nl-NL', { dateStyle: 'long' }) : '';

  // BreadcrumbList JSON-LD
  const breadcrumbLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: `${baseUrl}/blog` },
      { '@type': 'ListItem', position: 2, name: post.title, item: canonical },
    ],
  });

  // BlogPosting JSON-LD
  const postLd = JSON.stringify({
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

  // Organization + WebSite JSON-LD (once per page)
  const orgLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Skillkaart',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'AI-gedreven skill tracking platform voor jeugdvoetbal',
  });

  return `${head({ title, description, canonical, image: post.cover_image_url, type: 'article', publishedAt: post.published_at, jsonLd: breadcrumbLd })}
<script type="application/ld+json">${postLd}</script>
<script type="application/ld+json">${orgLd}</script>
<body>
  <div class="wrap">
    <a class="brand" href="${baseUrl}/blog">SKILLKAART</a>
    ${post.cover_image_url ? `<img class="cover" src="${esc(post.cover_image_url)}" alt="${esc(post.title)}">` : ''}`
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

  // Featured = meest recente post
  const featured = posts[0] || null;
  const rest = posts.slice(1);

  // Categorieën met counts
  const catCounts = new Map<string, number>();
  for (const p of posts) {
    const cat = p.category || 'overig';
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }
  const topCats = [...catCounts.entries()].sort((a, b) => b[1] - a[1]);

  // "Meest gelezen" = top 3 op basis van keyword-lengte als proxy (geen views data)
  const popular = [...posts].sort((a, b) => (b.keywords?.length || 0) - (a.keywords?.length || 0)).slice(0, 3);

  const catPills = topCats.map(([cat, count]) =>
    `<button class="cat-pill" data-cat="${esc(cat)}" onclick="filterCat('${esc(cat)}')">${esc(cat)} <span class="count">${count}</span></button>`
  ).join('');

  const featuredHtml = featured ? `
    <a class="featured" href="${baseUrl}/blog/${featured.slug}">
      <div class="featured-body">
        <span class="tag">${featured.category ? esc(featured.category) : 'Artikel'}</span>
        <h2>${esc(featured.title)}</h2>
        <p>${esc(featured.excerpt)}</p>
        <span class="meta">${featured.published_at ? new Date(featured.published_at).toLocaleDateString('nl-NL', { dateStyle: 'long' }) : ''}</span>
        <span class="read-more">Lees verder →</span>
      </div>
    </a>` : '';

  const cards = rest.map((p) => `
    <a class="card" href="${baseUrl}/blog/${p.slug}" data-cat="${esc(p.category || 'overig')}">
      ${p.category ? `<span class="tag">${esc(p.category)}</span>` : ''}
      <h2>${esc(p.title)}</h2>
      <p>${esc(p.excerpt)}</p>
      <div class="card-footer">
        <span class="meta">${p.published_at ? new Date(p.published_at).toLocaleDateString('nl-NL', { dateStyle: 'long' }) : ''}</span>
        <span class="read-time">${Math.max(3, Math.round(p.body.split(' ').length / 200))} min lezen</span>
      </div>
    </a>`).join('');

  const popularHtml = popular.map((p) => `
    <a class="popular-item" href="${baseUrl}/blog/${p.slug}">
      <span class="popular-num">${popular.indexOf(p) + 1}</span>
      <div>
        <span class="popular-title">${esc(p.title)}</span>
        <span class="meta">${p.category || ''}</span>
      </div>
    </a>`).join('');

  const extraCss = `.hero{background:linear-gradient(135deg,#00FF9D08,#00FF9D15);border-radius:20px;padding:32px 28px;margin:0 0 32px}
.hero h1{font-size:32px;margin:0 0 6px}
.hero p{color:#64748b;margin:0 0 20px;font-size:15px}
.search-wrap{position:relative;margin:0 0 28px}
.search-wrap input{width:100%;padding:13px 16px 13px 44px;border:2px solid #e2e8f0;border-radius:12px;font-size:14px;outline:none;background:#f8fafc;transition:border-color .2s,box-shadow .2s}
.search-wrap input:focus{border-color:#00FF9D;box-shadow:0 0 0 3px #00FF9D22;background:#fff}
.search-wrap input::placeholder{color:#94a3b8}
.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none}
.search-clear{position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;display:none;padding:4px}
.search-clear.show{display:block}
.cat-pills{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 28px}
.cat-pill{padding:7px 16px;border-radius:999px;border:2px solid #e2e8f0;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#64748b;transition:all .2s}
.cat-pill:hover{border-color:#00FF9D88;color:#0f172a}
.cat-pill.active{border-color:#00FF9D;background:#00FF9D10;color:#0f172a}
.cat-pill .count{display:inline-block;margin-left:4px;font-size:11px;color:#94a3b8;font-weight:400}
.cat-pill.active .count{color:#64748b}
.no-results{text-align:center;padding:48px 0;color:#94a3b8;display:none}
.no-results.show{display:block}
.grid{display:grid;grid-template-columns:1fr;gap:24px}
@media(min-width:768px){.grid{grid-template-columns:1fr 280px}}
.featured{border:2px solid #00FF9D40;border-radius:16px;padding:24px;display:block;text-decoration:none;color:inherit;margin:0 0 20px;transition:border-color .2s;background:linear-gradient(135deg,#00FF9D04,#00FF9D10)}
.featured:hover{border-color:#00FF9D}
.featured-body h2{font-size:22px;margin:10px 0 8px}
.featured-body p{color:#475569;font-size:14px;margin:0 0 12px;line-height:1.6}
.read-more{display:inline-block;margin-top:8px;color:#00FF9D;font-weight:700;font-size:14px}
.card{border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:14px 0;display:block;text-decoration:none;color:inherit;transition:border-color .2s,box-shadow .15s}
.card:hover{border-color:#00FF9D88;box-shadow:0 2px 8px #00000008}
.card h2{font-size:17px;margin:10px 0 8px;line-height:1.35}
.card p{color:#475569;font-size:13px;margin:0 0 10px;line-height:1.55}
.card .tag{margin-bottom:4px}
.card .card-footer{display:flex;justify-content:space-between;align-items:center;font-size:12px}
.card.search-hidden{display:none}
.sidebar{position:sticky;top:32px;align-self:start}
.sidebar-section{border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:0 0 16px}
.sidebar-section h3{font-size:14px;margin:0 0 14px;color:#0f172a;text-transform:uppercase;letter-spacing:.5px}
.popular-item{display:flex;align-items:flex-start;gap:12px;padding:10px 0;text-decoration:none;color:inherit;border-bottom:1px solid #f1f5f9}
.popular-item:last-child{border:none}
.popular-item:hover .popular-title{color:#00FF9D}
.popular-num{font-size:20px;font-weight:900;color:#e2e8f0;line-height:1;min-width:24px;text-align:center}
.popular-title{font-size:13px;font-weight:600;display:block;line-height:1.3;transition:color .15s}
.sidebar-cta{background:#0D0D0D;border-radius:14px;padding:24px;text-align:center}
.sidebar-cta h3{color:#fff;font-size:16px;margin:0 0 6px;text-transform:none;letter-spacing:0}
.sidebar-cta p{color:#94a3b8;font-size:12px;margin:0 0 16px}
.sidebar-cta .cta-btn{display:inline-block;background:#00FF9D;color:#000;font-weight:800;padding:10px 20px;border-radius:10px;text-decoration:none;font-size:13px}
.sidebar-cta .cta-btn:hover{background:#00e68a}`;

  // CollectionPage + Organization JSON-LD for blog index
  const collectionLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog — Skillkaart',
    description: 'Tips, inzichten en gidsen over jeugdvoetbal, trainen en spelersontwikkeling van Skillkaart.',
    url: canonical,
    mainEntity: { '@type': 'ItemList', itemListElement: posts.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${baseUrl}/blog/${p.slug}`,
    }))},
  });

  const orgLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Skillkaart', url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'AI-gedreven skill tracking platform voor jeugdvoetbal',
  });

  return `${head({
    title: 'Blog — Skillkaart | Jeugdvoetbal ontwikkeling',
    description: 'Tips, inzichten en gidsen over jeugdvoetbal, trainen en spelersontwikkeling van Skillkaart.',
    canonical, type: 'website', extraStyle: extraCss,
  })}
<script type="application/ld+json">${collectionLd}</script>
<script type="application/ld+json">${orgLd}</script>
<body>
  <div class="wrap">
    <a class="brand" href="${baseUrl}/">SKILLKAART</a>

    <!-- Hero -->
    <div class="hero">
      <h1>Blog</h1>
      <p>Inzichten over jeugdvoetbal &amp; spelersontwikkeling. Geschreven door Vincent van Munster en het Skillkaart-team.</p>
    </div>

    <!-- Search -->
    <div class="search-wrap">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" id="blogSearch" placeholder="Zoeken in artikelen..." oninput="searchBlog(this.value)">
      <button class="search-clear" id="searchClear" onclick="clearSearch()">✕</button>
    </div>

    <!-- Category pills -->
    <div class="cat-pills" id="catPills">
      <button class="cat-pill active" data-cat="all" onclick="filterCat('all')">Alle <span class="count">${posts.length}</span></button>
      ${catPills}
    </div>

    <div class="no-results" id="noResults">Geen artikelen gevonden voor deze zoekopdracht.</div>

    <!-- Grid: main + sidebar -->
    <div class="grid">
      <div class="main-col">
        ${featuredHtml}
        <div id="postList">${cards || '<p style="color:#64748b">Nog geen artikelen.</p>'}</div>
      </div>

      <div class="sidebar">
        ${popular.length > 0 ? `
        <div class="sidebar-section">
          <h3>🔍 Meest gelezen</h3>
          ${popularHtml}
        </div>` : ''}

        <div class="sidebar-section">
          <h3>📂 Categorieën</h3>
          ${topCats.map(([cat, count]) => `
            <a href="#" class="popular-item" onclick="event.preventDefault();filterCat('${esc(cat)}')">
              <div><span class="popular-title" style="font-size:13px">${esc(cat)}</span><span class="meta">${count} artikel${count !== 1 ? 'en' : ''}</span></div>
            </a>`).join('')}
        </div>

        <div class="sidebar-cta">
          <h3>Probeer Skillkaart</h3>
          <p>AI-gedreven skill tracking voor jouw jeugdteam</p>
          <a class="cta-btn" href="${baseUrl}/">Gratis demo →</a>
        </div>
      </div>
    </div>
  </div>

<script>
var allItems;

function initBlog() {
  allItems = document.querySelectorAll('#postList .card, .featured');
  if (!allItems.length) allItems = document.querySelectorAll('.card');
}

function searchBlog(q) {
  q = q.toLowerCase().trim();
  if (!allItems) initBlog();

  // Check active category filter
  var activePill = document.querySelector('.cat-pill.active');
  var activeCat = activePill ? activePill.getAttribute('data-cat') : 'all';
  var anyVisible = false;

  allItems.forEach(function(item) {
    var text = (item.textContent || '').toLowerCase();
    var itemCat = item.getAttribute('data-cat') || '';
    var matchesCat = activeCat === 'all' || itemCat === activeCat;

    if (!q) {
      item.classList.remove('search-hidden');
      item.style.display = matchesCat ? '' : 'none';
      if (matchesCat) anyVisible = true;
    } else {
      var match = text.indexOf(q) !== -1;
      if (match && matchesCat) {
        item.classList.remove('search-hidden');
        item.style.display = '';
        anyVisible = true;
      } else {
        item.classList.add('search-hidden');
        item.style.display = 'none';
      }
    }
  });

  document.getElementById('searchClear').classList.toggle('show', q.length > 0);
  document.getElementById('noResults').classList.toggle('show', !anyVisible && q.length > 0);
}

function clearSearch() {
  document.getElementById('blogSearch').value = '';
  searchBlog('');
  document.getElementById('blogSearch').focus();
}

function filterCat(cat) {
  document.querySelectorAll('.cat-pill').forEach(function(p) {
    p.classList.toggle('active', p.getAttribute('data-cat') === cat);
  });
  if (!allItems) initBlog();
  allItems.forEach(function(item) {
    var itemCat = item.getAttribute('data-cat') || '';
    item.style.display = (cat === 'all' || itemCat === cat) ? '' : 'none';
  });
}

document.addEventListener('DOMContentLoaded', function() {
  initBlog();
});
</script>
</body></html>`; }

export function renderSitemap(slugs: { slug: string; updated_at: string }[], baseUrl: string): string {
  const urls = slugs.map((s) => `  <url><loc>${baseUrl}/blog/${s.slug}</loc><lastmod>${new Date(s.updated_at).toISOString()}</lastmod></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
  <url><loc>${baseUrl}/blog</loc></url>
${urls}
</urlset>`;
}
