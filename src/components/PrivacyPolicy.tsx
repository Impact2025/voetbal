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
      <p className="text-gray-500 text-sm mb-8">Laatste update: augustus 2026</p>

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
            <li>Zelf samengestelde (illustratieve) avatar — geen foto-upload</li>
            <li>Skillevaluaties en wedstrijdcijfers ingevoerd door de coach</li>
            <li>Aanwezigheidsregistratie</li>
            <li>Antwoorden op reflectievragen</li>
            <li>Huiswerk- en challenge-video's die spelers zelf opnemen en insturen</li>
            <li>Berichten in de teamchat en met de coach</li>
            <li>Huiswerkvoltooiing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">3. Doel van de verwerking</h2>
          <p>
            De gegevens worden uitsluitend gebruikt om de sportieve ontwikkeling van de speler te ondersteunen en de communicatie tussen coach en speler/ouder te vergemakkelijken. Er worden geen gegevens verkocht aan derden of gebruikt voor commerciële doeleinden.
          </p>
          <p className="mt-3">
            Video's die spelers insturen bij huiswerk of challenges worden — uitsluitend met dat doel — automatisch geanalyseerd door een AI-model om technische feedback te geven. Zie hieronder onder "Subverwerkers" welke partij dat verwerkt.
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
            Gegevens worden bewaard zolang het teamaccount actief is. Bij verwijdering van een speler uit het systeem worden alle bijbehorende gegevens (incl. video's, chatberichten, evaluaties en streaks) in één actie gewist.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">6. Beveiliging</h2>
          <p>
            Alle gegevens worden opgeslagen in een beveiligde database (Supabase) met versleutelde verbindingen. Video's van huiswerk- en challenge-opdrachten staan in een besloten opslag en zijn alleen tijdelijk (via een kortlevende, persoonlijke link) op te vragen door de coach, gekoppelde ouders en de speler zelf — nooit publiek toegankelijk. Speler-inlogcodes worden versleuteld bewaard. Coaches authenticeren via e-mail en wachtwoord.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">7. Subverwerkers</h2>
          <p>
            We schakelen de volgende partijen in om Skillkaart te laten draaien. Zij verwerken gegevens uitsluitend in onze opdracht en verkopen of gebruiken deze niet voor eigen doeleinden:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong className="text-white">Supabase</strong> — database, authenticatie en video-opslag</li>
            <li><strong className="text-white">Vercel</strong> — hosting van de applicatie</li>
            <li><strong className="text-white">OpenRouter</strong> — verwerkt huiswerk-/challenge-video's (als losse beeldfragmenten) voor automatische technische AI-feedback</li>
            <li><strong className="text-white">Resend</strong> — verzending van transactionele e-mail (uitnodigingen, inloglinks, notificaties)</li>
            <li><strong className="text-white">Google Analytics</strong> — alleen na jouw toestemming via de cookiebanner (zie hieronder), niet voor spelers binnen de ingelogde app</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">8. Cookies</h2>
          <p>
            Skillkaart gebruikt alleen functionele cookies/lokale opslag die nodig zijn om in te loggen en de app te laten werken. Analytics-cookies (Google Analytics, op de openbare website) laden pas nadat je daar in de cookiebanner expliciet toestemming voor geeft; je kunt de app ook prima gebruiken zonder die toestemming te geven.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">9. Rechten</h2>
          <p>
            Ouders, verzorgers en spelers (vanaf 16 jaar) hebben het recht op inzage, correctie en verwijdering van gegevens. Neem hiervoor contact op met de coach die het account beheert, of mail naar het contactadres van de club.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-white mb-3">10. Vragen?</h2>
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
