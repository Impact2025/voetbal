import { Building2, ClipboardList, Heart, Star } from 'lucide-react'

const audiences = [
  {
    icon: Building2,
    tag: 'Voor de club',
    title: 'Eén platform voor de hele vereniging',
    text: 'Professionaliseer alle jeugdteams tegelijk, zonder extra beheerlast. Eén curriculum, eén kwaliteitsstandaard, en zichtbaar bewijs van de kwaliteit die je aan ouders belooft bij aanmelding.',
    bullets: ['Club-brede uitrol', 'AVG-compliant beheer', 'Sterker ledenbehoud'],
  },
  {
    icon: ClipboardList,
    tag: 'Voor de coach',
    title: 'Minder administratie, meer trainen',
    text: 'Evalueer een heel elftal in enkele minuten via intuïtieve sliders. De AI schrijft de persoonlijke feedback en het trainingsplan — jij focust op het veld.',
    bullets: ['< 2 min per speler', 'AI-gegenereerde feedback', 'Kant-en-klaar curriculum'],
  },
  {
    icon: Heart,
    tag: 'Voor de ouder',
    title: 'Zicht op de groei van je kind',
    text: 'Geen wazig papieren rapportje meer aan het eind van het seizoen. Volg per week hoe je kind zich ontwikkelt, waar het aan werkt en wat het thuis kan oefenen.',
    bullets: ['Altijd actueel inzicht', 'Huiswerk-tips voor thuis', 'Directe lijn met de coach'],
  },
  {
    icon: Star,
    tag: 'Voor het kind',
    title: 'Voel je een echte prof',
    text: 'Een eigen profkaart met radardiagram, groeigrafiek en challenges. Kinderen zien hun vooruitgang zwart op wit en blijven gemotiveerd om te oefenen.',
    bullets: ['Eigen speler-dashboard', 'PIN-login, veilig en simpel', 'Motiverende challenges'],
  },
]

export default function Audiences() {
  return (
    <section id="voor-wie" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <p className="text-neon-ink text-sm font-semibold uppercase tracking-widest">Voor wie is Skillkaart</p>
          <h2 className="text-3xl sm:text-4xl font-black">Eén platform, vier keer waarde</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Club, coach, ouder en kind zien allemaal iets anders terug — maar draaien op
            dezelfde data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((a) => (
            <div
              key={a.tag}
              className="gradient-border rounded-2xl p-6 hover:shadow-neon transition-all flex flex-col"
            >
              <div className="w-10 h-10 rounded-xl bg-neon/10 border border-neon/20 flex items-center justify-center mb-5">
                <a.icon size={18} className="text-neon-ink" />
              </div>
              <span className="text-neon-ink text-xs font-semibold uppercase tracking-widest mb-2">
                {a.tag}
              </span>
              <h3 className="font-bold text-lg mb-2 leading-snug">{a.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">{a.text}</p>
              <ul className="mt-auto space-y-1.5">
                {a.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-neon-ink">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
