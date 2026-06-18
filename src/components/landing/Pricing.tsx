const plans = [
  {
    name: 'Basis',
    price: '150',
    period: 'jaar',
    teams: '1 team',
    forWho: 'De individuele, enthousiaste trainer die direct aan de slag wil.',
    features: [
      'AI-gegenereerde feedback',
      'Speler-dashboard',
      'UFA-curriculum',
      'Huiswerksysteem',
      'AVG-verwerkersovereenkomst',
    ],
    highlighted: false,
  },
  {
    name: 'Club S',
    price: '250',
    period: 'jaar',
    teams: '2–5 teams',
    forWho: 'Perfect voor een complete leeftijdscategorie (bijv. de gehele O9 of O11).',
    features: [
      'Alles uit Basis',
      'Tot 5 teams',
      'Coach-overzicht per team',
      'Seizoensrapportage',
      'Prioriteit support',
    ],
    highlighted: true,
    badge: 'Meest gekozen',
  },
  {
    name: 'Club M',
    price: '450',
    period: 'jaar',
    teams: '6–15 teams',
    forWho: 'Voor de ambitieuze dorps- of regioclub die de middenbouw wil digitaliseren.',
    features: [
      'Alles uit Club S',
      'Tot 15 teams',
      'TC-dashboard',
      'Bulk-import spelers',
      'Maandelijkse rapportage',
    ],
    highlighted: false,
  },
  {
    name: 'Club L',
    price: '750',
    period: 'jaar',
    teams: '15+ teams',
    forWho: 'De complete jeugdopleiding in één klap voorzien van innovatieve skill tracking.',
    features: [
      'Alles uit Club M',
      'Onbeperkt teams',
      'Dedicated onboarding',
      'Custom branding',
      'API-toegang',
    ],
    highlighted: false,
  },
]

export default function Pricing() {
  return (
    <section id="tarieven" className="py-24 bg-dark-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none grid-bg opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-6 space-y-3">
          <p className="text-neon text-sm font-semibold uppercase tracking-widest">Tarieven</p>
          <h2 className="text-3xl sm:text-4xl font-black">
            Een passend abonnement voor elk type club
          </h2>
          <p className="text-white/50 max-w-xl mx-auto">
            Alle abonnementen zijn inclusief het UFA-voetbalcurriculum en de AI-module.{' '}
            <span className="text-white">Geen verborgen kosten.</span>
          </p>
        </div>

        {/* Monthly calculation */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 bg-neon/10 border border-neon/20 rounded-full px-4 py-1.5 text-sm text-neon">
            Basis al vanaf €12,50 per maand — betaalbaar voor elke amateurvereniging
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                plan.highlighted
                  ? 'bg-neon/5 border-2 border-neon neon-glow scale-[1.02]'
                  : 'bg-dark-800 border border-white/10 hover:border-white/20'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-neon text-dark-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wide">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className={`font-black text-xl mb-1 ${plan.highlighted ? 'text-neon' : 'text-white'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-black text-white">€{plan.price}</span>
                  <span className="text-white/40 text-sm">/{plan.period}</span>
                </div>
                <p className="text-neon/70 text-xs font-semibold">{plan.teams}</p>
              </div>

              <p className="text-white/50 text-xs leading-relaxed mb-5">{plan.forWho}</p>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="text-neon mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="mailto:info@skillkaart.nl?subject=Demo aanvraag"
                className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${
                  plan.highlighted
                    ? 'neon-btn'
                    : 'border border-white/20 text-white hover:border-neon/40 hover:text-neon'
                }`}
              >
                Demo aanvragen ➔
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-white/30 text-sm mt-8">
          Alle prijzen zijn excl. BTW · Jaarlijkse facturering · Opzegbaar per seizoen
        </p>
      </div>
    </section>
  )
}
