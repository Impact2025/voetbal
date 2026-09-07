// Gedeelde navbar/footer voor server-gerenderde pagina's (/faq, /blog, ...) —
// zodat ze visueel dezelfde stijl hebben als de React-homepage
// (src/components/landing/Navbar.tsx en Footer.tsx).

export const NAV_FOOTER_CSS = `
.navbar{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.95);backdrop-filter:blur(8px);border-bottom:1px solid #e2e8f0}
.nav-inner{max-width:1280px;margin:0 auto;padding:0 20px;height:72px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.nav-logo{display:flex;align-items:center;gap:8px;text-decoration:none}
.nav-logo img{width:32px;height:32px;border-radius:8px;object-fit:cover}
.nav-logo span{font-weight:900;font-size:19px;letter-spacing:-0.02em;color:#0f172a}
.nav-links{display:flex;align-items:center;gap:28px;list-style:none;margin:0;padding:0}
.nav-links a{font-size:14px;font-weight:500;color:#475569;text-decoration:none;transition:color .15s}
.nav-links a:hover,.nav-links a.active{color:#0f172a}
.nav-cta{display:flex;align-items:center;gap:10px}
.nav-btn{padding:9px 16px;border-radius:8px;font-weight:700;font-size:14px;text-decoration:none;border:1px solid #cbd5e1;color:#334155;white-space:nowrap}
.nav-btn:hover{border-color:#00996680;color:#009966}
.nav-btn.primary{background:#00FF9D;color:#06060e;border:none;box-shadow:0 0 16px #00FF9D40}
.nav-btn.primary:hover{background:#00cc7a;color:#06060e}
@media(max-width:820px){.nav-links{display:none}.nav-btn:not(.primary){display:none}}

.site-footer{background:#f8fafc;border-top:1px solid #e2e8f0;padding:32px 20px 24px;margin-top:60px}
.footer-inner{max-width:1280px;margin:0 auto}
.footer-bottom{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px}
.footer-bottom p{color:#94a3b8;font-size:12px;margin:0}
.footer-bottom .links{display:flex;gap:16px}
.footer-bottom a{color:#94a3b8;font-size:12px;text-decoration:none}
.footer-bottom a:hover{color:#475569}
`;

export function renderNavbar(baseUrl: string, activeHref?: string): string {
  const link = (href: string, label: string) =>
    `<li><a href="${href}"${href === activeHref ? ' class="active"' : ''}>${label}</a></li>`;
  return `
<header class="navbar">
  <div class="nav-inner">
    <a class="nav-logo" href="${baseUrl}/">
      <img src="${baseUrl}/logo.png" alt="Skillkaart">
      <span>SKILLKAART</span>
    </a>
    <ul class="nav-links">
      ${link(`${baseUrl}/#features`, 'Product')}
      ${link(`${baseUrl}/#verhaal`, 'Het Verhaal')}
      ${link(`${baseUrl}/#tarieven`, 'Tarieven')}
      ${link(`${baseUrl}/faq`, 'Veelgestelde vragen')}
      ${link(`${baseUrl}/blog`, 'Blog')}
    </ul>
    <div class="nav-cta">
      <a class="nav-btn" href="${baseUrl}/club">Club login</a>
      <a class="nav-btn" href="${baseUrl}/">Inloggen</a>
      <a class="nav-btn primary" href="${baseUrl}/#tarieven">Gratis Demo ➔</a>
    </div>
  </div>
</header>`;
}

export function renderFooter(baseUrl: string): string {
  return `
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-bottom">
      <p>© 2026 Skillkaart. Alle rechten voorbehouden.</p>
      <div class="links">
        <a href="${baseUrl}/privacy">Privacyverklaring</a>
        <a href="mailto:info@skillkaart.nl?subject=Verwerkersovereenkomst%20aanvragen">Verwerkersovereenkomst (AVG)</a>
      </div>
    </div>
  </div>
</footer>`;
}
