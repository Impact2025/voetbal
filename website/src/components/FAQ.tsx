import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Is dit niet heel veel extra administratie voor onze vrijwillige trainers?',
    a: 'Juist niet. Waar traditionele volgsystemen uren werk kosten, vullen trainers Skillkaart in met simpele sliders. Onze AI genereert op basis daarvan automatisch de feedbackteksten en trainingsplannen. Binnen 2 minuten per speler ben je klaar.',
  },
  {
    q: 'Hoe zit het met de privacy van onze jeugdspelers (AVG)?',
    a: 'Veiligheid staat bij ons op nummer één. Wij leveren bij elk abonnement een verwerkersovereenkomst. Daarnaast ondersteunt het platform een veilige PIN-login en is het zo in te richten dat er met anonieme spelersnummers of team-ID\'s wordt gewerkt, zonder dat er volledige privégegevens op straat liggen.',
  },
  {
    q: 'Wat maakt Skillkaart anders dan KNVB Rinus of VTON?',
    a: 'Systemen zoals KNVB Rinus zijn fantastisch voor algemene trainingsvormen, maar bieden geen individueel speler-dashboard of AI-gegenereerde feedback. Skillkaart focust zich puur op de persoonlijke beleving en longitudinale groei van het kind zelf.',
  },
  {
    q: 'Hoe starten we als club met een pilot?',
    a: 'Heel simpel. Vraag via de website een demo aan. We richten een demo-omgeving in met dummy data zodat het jeugdbestuur en de trainers direct kunnen zien hoe het werkt op een smartphone of tablet.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-neon/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/2 transition-colors"
      >
        <span className="font-semibold text-sm leading-snug">{q}</span>
        <ChevronDown
          size={18}
          className={`text-neon flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}
      >
        <p className="px-5 pb-5 text-white/60 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

export default function FAQ() {
  return (
    <section id="faq" className="py-24 bg-dark-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <p className="text-neon text-sm font-semibold uppercase tracking-widest">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-black">Veelgestelde vragen</h2>
          <p className="text-white/50">
            Geen antwoord op jouw vraag?{' '}
            <a href="mailto:info@skillkaart.nl" className="text-neon hover:underline">
              Mail ons direct
            </a>
            .
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-dark-700 rounded-2xl p-8 border border-white/10">
          <p className="text-white/60 mb-2 text-sm">Klaar om te starten?</p>
          <h3 className="text-2xl font-black mb-4">
            Geef jouw spelers de <span className="neon-text">profervaring</span> die ze verdienen.
          </h3>
          <a
            href="mailto:info@skillkaart.nl?subject=Demo aanvraag"
            className="neon-btn px-8 py-4 rounded-xl font-bold inline-flex items-center gap-2"
          >
            Vraag een gratis demo aan ➔
          </a>
        </div>
      </div>
    </section>
  )
}
