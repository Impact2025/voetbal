import { Clock, Archive, TrendingDown } from 'lucide-react'

const problems = [
  {
    icon: Clock,
    title: 'Te weinig tijd',
    text: 'Trainers hebben geen tijd voor écht persoonlijke feedback naast de wekelijkse training.',
  },
  {
    icon: Archive,
    title: 'Evaluaties verdwijnen',
    text: 'Papieren rapportjes verdwijnen aan het einde van het seizoen in een la, nooit meer terug te vinden.',
  },
  {
    icon: TrendingDown,
    title: 'Motivatieverlies',
    text: 'Kinderen verliezen hun motivatie omdat ze hun eigen groei niet zien of voelen.',
  },
]

export default function Problems() {
  return (
    <section className="py-24 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <p className="text-neon text-sm font-semibold uppercase tracking-widest">
            De uitdaging van de moderne jeugdtrainer
          </p>
          <h2 className="text-3xl sm:text-4xl font-black">
            Minder administratie, meer motivatie op het veld
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {problems.map((p) => (
            <div
              key={p.title}
              className="gradient-border rounded-2xl p-6 hover:border-neon/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center mb-5">
                <p.icon size={18} className="text-neon" />
              </div>
              <h3 className="font-bold text-lg mb-2 group-hover:text-neon transition-colors">
                {p.title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-dark-900 px-6">
                <div className="w-2 h-2 rounded-full bg-neon/60" />
              </span>
            </div>
          </div>
          <p className="text-white/70 text-lg leading-relaxed">
            <span className="text-white font-semibold">Skillkaart lost dit op.</span> Wij geloven dat professionele
            feedback niet alleen voor profclubs is weggelegd, maar voor{' '}
            <span className="text-neon font-semibold">élk jeugdteam</span>. Met ons platform
            kost een evaluatie de coach minder dan{' '}
            <span className="text-white font-semibold">2 minuten</span>, en krijgt het kind een
            magische voetbalbeleving waarin hun eigen ontwikkeling centraal staat.
          </p>
        </div>
      </div>
    </section>
  )
}
