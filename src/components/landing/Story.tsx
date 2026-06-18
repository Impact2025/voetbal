import { Monitor, Circle, Zap } from 'lucide-react'

const timeline = [
  {
    icon: Monitor,
    title: 'Tech-stack & AI',
    text: 'Vincent van Munster (WeAreimPact) bracht de cloud-infrastructuur, AI-koppelingen en de software-expertise in.',
  },
  {
    icon: Circle,
    title: 'Voetbalinhoud & Netwerk',
    text: 'Ultimate Football Academy bracht het curriculum, de progressiemodellen en hun sterke regionale netwerk van trainers mee.',
  },
  {
    icon: Zap,
    title: 'Gebouwd op de velden',
    text: 'Getest en ontwikkeld in Nieuw-Vennep, Zwanenburg en omgeving — niet door een verre multinational, maar lokaal.',
  },
]

export default function Story() {
  return (
    <section id="verhaal" className="py-24 bg-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div>
              <p className="text-neon text-sm font-semibold uppercase tracking-widest mb-3">
                Over ons
              </p>
              <h2 className="text-3xl sm:text-4xl font-black leading-tight">
                De perfecte match tussen{' '}
                <span className="neon-text">code en grasmat</span>
              </h2>
            </div>

            <p className="text-white/60 leading-relaxed">
              De basis van Skillkaart ligt in de <strong className="text-white">Haarlemmermeer</strong>. Tijdens de
              ontwikkeling van het platform zochten we niet naar de zoveelste software-investeerder,
              maar naar échte voetbalinhoud.
            </p>

            <p className="text-white/60 leading-relaxed">
              Samen vormen zij de perfecte combinatie: technologisch vooruitstrevend, maar volledig
              geworteld in de praktijk van het Nederlandse amateurvoetbal.{' '}
              <span className="text-white font-semibold">
                Geen theoretische software van een verre multinational
              </span>
              , maar een platform gebouwd en getest op de velden in Nieuw-Vennep, Zwanenburg en
              omgeving.
            </p>

            <a
              href="#tarieven"
              className="neon-btn px-7 py-3.5 rounded-xl font-bold text-sm inline-flex items-center gap-2"
            >
              Start vandaag met een demo ➔
            </a>
          </div>

          <div className="relative">
            <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-neon/40 via-neon/20 to-transparent" />
            <div className="space-y-8">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div className="w-14 h-14 rounded-2xl bg-dark-700 border border-neon/30 flex items-center justify-center flex-shrink-0 z-10">
                    <item.icon size={20} className="text-neon" />
                  </div>
                  <div className="pt-3">
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed">{item.text}</p>
                  </div>
                </div>
              ))}

              <div className="flex gap-4 pt-4 pl-20">
                <div className="flex-1 bg-dark-700 rounded-xl p-4 border border-white/10 text-center">
                  <p className="text-neon font-black text-lg">WeAre<br/>imPact</p>
                  <p className="text-white/40 text-xs mt-1">Tech & AI</p>
                </div>
                <div className="flex items-center text-white/20 font-bold text-xl">×</div>
                <div className="flex-1 bg-dark-700 rounded-xl p-4 border border-white/10 text-center">
                  <p className="text-white font-black text-lg leading-tight">UFA</p>
                  <p className="text-white/40 text-xs mt-1">Voetbalinhoud</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
