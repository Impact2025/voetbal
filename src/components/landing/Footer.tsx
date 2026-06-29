export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Skillkaart" className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-black text-xl tracking-tight">SKILLKAART</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed max-w-xs">
              Het eerste Nederlandse platform dat AI-gedreven skill tracking combineert met
              professionele voetbalexpertise voor jeugdspelers van 7–12 jaar.
            </p>
            <div className="space-y-1">
              <p className="text-slate-400 text-xs">Partners</p>
              <div className="flex items-center gap-3">
                <span className="text-slate-700 text-sm font-semibold">WeAreimPact</span>
                <span className="text-slate-300">×</span>
                <span className="text-slate-700 text-sm font-semibold">Ultimate Football Academy</span>
              </div>
              <p className="text-slate-400 text-xs">Regio Haarlemmermeer</p>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="font-semibold text-sm mb-4">Product</p>
            <ul className="space-y-2">
              {[
                { label: 'Coach Dashboard', href: '#features' },
                { label: 'AI Feedback', href: '#features' },
                { label: 'Speler Dashboard', href: '#features' },
                { label: 'Huiswerksysteem', href: '#features' },
                { label: 'Tarieven', href: '#tarieven' },
              ].map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="text-slate-500 hover:text-slate-900 text-sm transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="font-semibold text-sm mb-4">Contact</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:info@skillkaart.nl"
                  className="text-slate-500 hover:text-neon-ink text-sm transition-colors"
                >
                  info@skillkaart.nl
                </a>
              </li>
              <li>
                <a href="/faq" className="text-slate-500 hover:text-slate-900 text-sm transition-colors">
                  Veelgestelde vragen
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@skillkaart.nl?subject=Demo aanvraag"
                  className="text-neon-ink hover:text-neon-dark text-sm font-semibold transition-colors"
                >
                  Demo aanvragen ➔
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-xs">
            © 2026 Skillkaart. Alle rechten voorbehouden.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
              Privacy Statement
            </a>
            <a href="#" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
              Algemene Voorwaarden
            </a>
            <a href="#" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
              Verwerkersovereenkomst (AVG)
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
