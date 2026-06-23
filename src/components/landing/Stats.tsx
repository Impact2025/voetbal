const stats = [
  {
    value: '7',
    unit: 'Skills',
    description: 'Longitudinale voortgangsmeting met 3 vaste check-ins per seizoen om de échte ontwikkeling in kaart te brengen.',
  },
  {
    value: '€12,50',
    unit: 'Per maand',
    description: 'Toegankelijke en transparante clubabonnementen die passen binnen het budget van elke amateurvereniging.',
  },
  {
    value: '100+',
    unit: 'Betalende clubs',
    description: 'Onze gezamenlijke ambitie richting het einde van seizoen 2026/2027 om het jeugdvoetbal in Nederland naar een hoger niveau te tillen.',
    goal: true,
  },
]

export default function Stats() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-neon/5 blur-3xl rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16 space-y-3">
          <p className="text-neon-ink text-sm font-semibold uppercase tracking-widest">
            Skillkaart in cijfers
          </p>
          <h2 className="text-3xl sm:text-4xl font-black">
            Bewezen methodiek, meetbare resultaten
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {stats.map((s) => (
            <div
              key={s.value}
              className={`rounded-2xl p-8 text-center border transition-all ${
                s.goal
                  ? 'border-neon/40 bg-neon/5'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              {s.goal && (
                <span className="inline-block text-xs font-semibold text-neon-ink bg-neon/10 border border-neon/20 px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider">
                  Doel 26/27
                </span>
              )}
              <div className="text-4xl lg:text-5xl font-black text-neon-ink mb-1">{s.value}</div>
              <div className="text-slate-900 font-bold text-lg mb-3">{s.unit}</div>
              <p className="text-slate-500 text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="gradient-border rounded-2xl p-8 lg:p-10 text-center">
            <div className="w-10 h-10 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-neon-ink" stroke="currentColor" strokeWidth="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
              </svg>
            </div>
            <blockquote className="text-lg lg:text-xl text-slate-700 leading-relaxed italic mb-6">
              "Met Skillkaart digitaliseren we de bewezen trainingsmethode van Ultimate Football
              Academy. De combinatie van Vincent zijn AI-expertise en onze praktijkervaring op de
              velden in de Haarlemmermeer zorgt voor een uniek product dat technologisch
              onderscheidend is én vertrouwenswaardig voelt voor coaches en ouders."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neon/20 border border-neon/40 flex items-center justify-center">
                <span className="text-neon-ink font-bold text-sm">UFA</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Ultimate Football Academy</p>
                <p className="text-slate-500 text-xs">Partner & Voetbalexpert · Haarlemmermeer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
