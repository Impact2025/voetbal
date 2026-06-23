import { Target, BrainCircuit, BarChart2, BookOpen } from 'lucide-react'

const features = [
  {
    icon: Target,
    tag: 'Coach Dashboard',
    title: 'Evalueer in minder dan 2 minuten',
    description:
      'Geen ingewikkelde spreadsheets of dikke rapporten meer. Als coach beoordeel je spelers via intuïtieve sliders op de 7 kernskills van het moderne jeugdvoetbal: Snelheid, Passing, Techniek, Schot, Verdedigen, Inzicht en Mentaliteit. Snel, simpel en direct opgeslagen.',
    highlights: ['7 kernskills', 'Intuïtieve sliders', '< 2 min per speler', 'Direct opgeslagen'],
    visual: (
      <div className="space-y-2.5">
        {[
          { label: 'Snelheid', val: 8 },
          { label: 'Passing', val: 7 },
          { label: 'Techniek', val: 9 },
          { label: 'Schot', val: 6 },
        ].map((s) => (
          <div key={s.label}>
            <div className="flex justify-between mb-1">
              <span className="text-slate-600 text-xs">{s.label}</span>
              <span className="text-neon-ink text-xs font-bold">{s.val}/10</span>
            </div>
            <div className="bg-slate-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-neon to-neon-dark rounded-full h-2 transition-all"
                style={{ width: `${s.val * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: BrainCircuit,
    tag: 'AI Feedback Module',
    title: 'Gepersonaliseerde plannen via Google Gemini 2.5 Flash',
    description:
      'Nooit meer urenlang teksten typen. Onze geavanceerde AI-module analyseert de ingevoerde sliders en genereert automatisch op maat gemaakte, motiverende opmerkingen en trainingsplannen voor de speler. Persoonlijke begeleiding op schaal.',
    highlights: ['Google Gemini 2.5', 'Automatisch gegenereerd', 'Motiverende teksten', 'Trainingsplannen'],
    visual: (
      <div className="bg-slate-50 rounded-xl p-3 border border-neon/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-neon-ink rounded-full animate-pulse" />
          <span className="text-neon-ink text-xs font-semibold">AI genereert...</span>
        </div>
        <p className="text-slate-700 text-xs leading-relaxed">
          "Thomas, jouw techniek is indrukwekkend voor jouw leeftijd! Focus deze week op je
          passing in kleine ruimtes. Oefen de wandpass 10 minuten per dag..."
        </p>
        <div className="mt-2 flex gap-1">
          {['Techniek', 'Passing', 'Focus'].map((tag) => (
            <span key={tag} className="bg-neon/10 text-neon-ink text-[10px] px-2 py-0.5 rounded-full border border-neon/20">
              {tag}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: BarChart2,
    tag: 'Speler Dashboard',
    title: 'Jouw eigen radardiagram en trendgrafiek',
    description:
      'Kinderen zien hun eigen vaardigheden groeien in een interactief, visueel dashboard. Volledig read-only en 100% afgestemd op de belevingswereld van kinderen van 7 tot 12 jaar. Het ultieme gevoel van een eigen profkaart!',
    highlights: ['Radardiagram', 'Trendgrafiek', 'PIN-login', 'Kindvriendelijk'],
    visual: (
      <div className="flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-28 h-28">
          {[0.25, 0.5, 0.75, 1].map((r) => (
            <polygon
              key={r}
              points={Array.from({ length: 7 }, (_, i) => {
                const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 7
                return `${60 + r * 44 * Math.cos(angle)},${60 + r * 44 * Math.sin(angle)}`
              }).join(' ')}
              fill="none"
              stroke="#00FF9D"
              strokeWidth="0.5"
              strokeOpacity="0.2"
            />
          ))}
          <polygon
            points={[0.82, 0.74, 0.88, 0.65, 0.70, 0.78, 0.90].map((v, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 7
              return `${60 + v * 44 * Math.cos(angle)},${60 + v * 44 * Math.sin(angle)}`
            }).join(' ')}
            fill="#00FF9D"
            fillOpacity="0.2"
            stroke="#00FF9D"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    ),
  },
  {
    icon: BookOpen,
    tag: 'Huiswerk & Reflectie',
    title: 'Verleng de trainingsweek',
    description:
      'Stuur specifieke oefeningen door via het huiswerksysteem (inclusief YouTube-links) die spelers thuis kunnen oefenen en afvinken. Activeer het zelfreflecterend vermogen met maximaal 3 korte, wekelijkse vragen in de app.',
    highlights: ['YouTube-links', 'Oefen thuis', 'Wekelijkse vragen', 'Zelfvertrouwen'],
    visual: (
      <div className="space-y-2">
        {[
          { done: true, text: 'Hooghouden Challenge' },
          { done: true, text: 'Wandpass oefening' },
          { done: false, text: 'Dribbel + Schot' },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border flex-shrink-0 ${
                item.done
                  ? 'bg-neon border-neon text-dark-900'
                  : 'border-slate-300 text-transparent'
              }`}
            >
              ✓
            </div>
            <span className={`text-xs ${item.done ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    ),
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <p className="text-neon-ink text-sm font-semibold uppercase tracking-widest">Productkenmerken</p>
          <h2 className="text-3xl sm:text-4xl font-black">
            Alles in één platform
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Van coach-evaluatie tot speler-dashboard — Skillkaart begeleidt de volledige
            ontwikkelingscyclus van uw jeugdspelers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.tag}
              className="gradient-border rounded-2xl p-6 lg:p-8 hover:shadow-neon transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-neon/10 border border-neon/20 flex items-center justify-center flex-shrink-0">
                      <f.icon size={15} className="text-neon-ink" />
                    </div>
                    <span className="text-neon-ink text-xs font-semibold uppercase tracking-widest bg-neon/10 px-2 py-0.5 rounded-full border border-neon/20">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-black text-xl leading-tight">{f.title}</h3>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-200 min-h-[100px] flex flex-col justify-center">
                {f.visual}
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-4">{f.description}</p>

              <div className="flex flex-wrap gap-2">
                {f.highlights.map((h) => (
                  <span
                    key={h}
                    className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
