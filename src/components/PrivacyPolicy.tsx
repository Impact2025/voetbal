import { ArrowLeft } from 'lucide-react';
import { NEON_COLOR } from '../utils/constants';

interface PrivacyPolicyProps {
  onBack: () => void;
}

const PrivacyPolicy = ({ onBack }: PrivacyPolicyProps) => (
  <div className="min-h-screen bg-gradient-to-b from-[#0D0D0D] to-[#1A1A1A] text-white p-4 sm:p-8">
    <div className="max-w-2xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Terug
      </button>

      <h1 className="text-3xl font-black mb-2" style={{ color: NEON_COLOR }}>Privacyverklaring</h1>
      <p className="text-gray-500 text-sm mb-8">Laatste update: juni 2026</p>

      <div className="space-y-8 text-sm leading-relaxed text-gray-300">
        <section>
          <h2 className="text-lg font-bold text-white mb-3">1. Wie zijn wij?</h2>
          <p>
            Skillkaart is een digitale applicatie voor voetbalclubs waarmee coaches de sportieve ontwikkeling van spelers kunnen bijhouden. De coach of club die een account aanmaakt, is verantwoordelijk voor de verwerking van de ingevoerde persoonsgegevens.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">2. Welke gegevens verwerken we?</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Naam van de speler</li>
            <li>Leeftijd en positie</li>
            <li>Profielfoto (optioneel)</li>
            <li>Skillevaluaties en wedstrijdcijfers ingevoerd door de coach</li>
            <li>Aanwezigheidsregistratie</li>
            <li>Antwoorden op reflectievragen</li>
            <li>Huiswerkvoltooiing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">3. Doel van de verwerking</h2>
          <p>
            De gegevens worden uitsluitend gebruikt om de sportieve ontwikkeling van de speler te ondersteunen en de communicatie tussen coach en speler/ouder te vergemakkelijken. Er worden geen gegevens verkocht aan derden of gebruikt voor commerciële doeleinden.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">4. Grondslagen</h2>
          <p>
            De verwerking is gebaseerd op toestemming van de ouder of verzorger van de minderjarige speler. De coach bevestigt bij aanmelding dat deze toestemming is verkregen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">5. Bewaartermijn</h2>
          <p>
            Gegevens worden bewaard zolang het teamaccount actief is. Bij verwijdering van een speler uit het systeem worden alle bijbehorende gegevens direct gewist.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">6. Beveiliging</h2>
          <p>
            Alle gegevens worden opgeslagen in een beveiligde database (Supabase) met versleutelde verbindingen. Speler-inlogcodes worden versleuteld bewaard. Coaches authenticeren via e-mail en wachtwoord.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">7. Rechten</h2>
          <p>
            Ouders, verzorgers en spelers (vanaf 16 jaar) hebben het recht op inzage, correctie en verwijdering van gegevens. Neem hiervoor contact op met de coach die het account beheert, of mail naar het contactadres van de club.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">8. Vragen?</h2>
          <p>
            Heb je vragen over deze privacyverklaring of wil je gebruik maken van je rechten? Neem contact op via de coach van het team.
          </p>
        </section>
      </div>

      <button
        onClick={onBack}
        className="mt-10 px-6 py-3 rounded-xl font-bold text-black text-sm hover:opacity-90 transition-opacity"
        style={{ backgroundColor: NEON_COLOR }}
      >
        Terug naar de app
      </button>
    </div>
  </div>
);

export default PrivacyPolicy;
