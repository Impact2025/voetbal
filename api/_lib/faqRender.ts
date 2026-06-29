// Server-side render voor /faq — volwaardige HTML met FAQPage JSON-LD schema
// World-class: zoekbalk, categorie-sprong navigatie, feedback-knoppen,
// soepele accordeon, per-categorie CTAs, en Google rich snippet markup.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'club' | 'coach' | 'ouder' | 'speler';
  sort_order: number;
  published: boolean;
}

const esc = (s: string) =>
  (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const SHELL_CSS = `
*{box-sizing:border-box}
body{margin:0;background:#fff;color:#334155;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.7}
a{color:#00FF9D}
.topbar{background:#0D0D0D;padding:18px 20px;text-align:center}
.brand{font-weight:900;letter-spacing:3px;color:#00FF9D;text-decoration:none;font-size:18px}
.wrap{max-width:860px;margin:0 auto;padding:40px 20px 80px}
h1{font-size:36px;line-height:1.15;color:#0f172a;margin:0 0 8px}
.sub{color:#64748b;font-size:17px;margin:0 0 16px;max-width:640px}

/* ─── Search ─── */
.search-wrap{margin:0 0 36px;position:relative}
.search-wrap svg{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none}
.search-wrap input{width:100%;padding:14px 16px 14px 46px;border:2px solid #e2e8f0;border-radius:14px;font-size:15px;outline:none;background:#f8fafc;transition:border-color .2s,box-shadow .2s}
.search-wrap input:focus{border-color:#00FF9D;box-shadow:0 0 0 3px #00FF9D22;background:#fff}
.search-wrap input::placeholder{color:#94a3b8}
.search-clear{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;color:#94a3b8;cursor:pointer;font-size:18px;display:none;padding:4px}
.search-clear.show{display:block}
.search-clear:hover{color:#475569}
.no-results{text-align:center;padding:40px 0;color:#94a3b8;display:none}
.no-results.show{display:block}

/* ─── Categorie tabs ─── */
.cat-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 32px;padding:0;list-style:none}
.cat-tab{padding:10px 18px;border-radius:999px;border:2px solid #e2e8f0;background:#fff;cursor:pointer;font-size:14px;font-weight:600;color:#64748b;transition:all .2s;white-space:nowrap}
.cat-tab:hover{border-color:#00FF9D88;color:#0f172a}
.cat-tab.active{border-color:#00FF9D;background:#00FF9D15;color:#0f172a}
.cat-tab .count{display:inline-block;margin-left:6px;font-size:12px;color:#94a3b8;font-weight:400}
.cat-tab.active .count{color:#64748b}
.cat-tab-icon{margin-right:6px}

/* ─── FAQ items (accordeon) ─── */
.cat{margin:48px 0 0;padding:0}
.cat:first-of-type{margin-top:0}
.cat-title{font-size:22px;font-weight:800;color:#0f172a;margin:0 0 18px;display:flex;align-items:center;gap:10px}
.cat-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.cat-icon.club{background:#e0f2fe;color:#0284c7}
.cat-icon.coach{background:#dcfce7;color:#16a34a}
.cat-icon.ouder{background:#fef3c7;color:#d97706}
.cat-icon.speler{background:#f3e8ff;color:#9333ea}

.item{border:1px solid #e2e8f0;border-radius:14px;margin:10px 0;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.item:hover{border-color:#00FF9D88;box-shadow:0 1px 4px #00000008}
.item.search-hidden{display:none}
.q{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px;background:none;border:none;cursor:pointer;text-align:left;font:inherit;color:#0f172a;font-weight:600;font-size:15px;line-height:1.4;transition:background .15s}
.q:hover{background:#f8fafc}
.q .chevron{color:#94a3b8;flex-shrink:0;transition:transform .3s;font-size:14px;width:18px;text-align:center}
.q.open .chevron{transform:rotate(180deg)}
.q:focus-visible{outline:2px solid #00FF9D;outline-offset:-2px;border-radius:14px}

/* Soepele accordeon via grid-template-rows */
.a-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .4s ease}
.a-wrap.open{grid-template-rows:1fr}
.a-inner{overflow:hidden}
.a{padding:0 20px 20px;color:#475569;font-size:14px;line-height:1.7}
.a p{margin:0 0 12px}
.a p:last-child{margin:0}
.a strong{color:#0f172a}
.a ul{margin:8px 0;padding-left:20px}
.a li{margin:4px 0}

/* ─── Feedback knoppen ─── */
.feedback{display:flex;align-items:center;gap:6px;padding:10px 20px 14px;border-top:1px solid #f1f5f9}
.feedback-label{font-size:12px;color:#94a3b8;margin-right:4px}
.feedback-btn{background:none;border:1px solid #e2e8f0;border-radius:8px;padding:4px 10px;font-size:13px;color:#64748b;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:4px}
.feedback-btn:hover{border-color:#00FF9D88;color:#0f172a}
.feedback-btn.active{border-color:#00FF9D;background:#00FF9D10;color:#0f172a}
.feedback-btn .count{font-size:11px;color:#94a3b8;margin-left:2px}

/* ─── CTA ─── */
.cta{background:#0D0D0D;border-radius:18px;padding:36px;text-align:center;margin:48px 0 32px}
.cta h2{color:#fff;font-size:22px;margin:0 0 8px}
.cta p{color:#94a3b8;font-size:14px;margin:0 0 4px}
.cta .small{color:#64748b;font-size:12px;margin:12px 0 0}
.cta-btn{display:inline-block;background:#00FF9D;color:#000;font-weight:800;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px;margin-top:16px;transition:background .2s}
.cta-btn:hover{background:#00e68a}
.cta-btn.secondary{background:transparent;border:2px solid #334155;color:#e2e8f0;margin-left:8px}
.cta-btn.secondary:hover{background:#1e293b}
.back{display:inline-block;margin-top:32px;color:#64748b;font-size:14px;text-decoration:none}
.back:hover{color:#0f172a}

@media(max-width:600px){
  h1{font-size:28px}
  .wrap{padding:24px 16px 60px}
  .cta{padding:24px 16px}
  .cat-tabs{overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px;-webkit-overflow-scrolling:touch}
  .cat-tab{flex-shrink:0}
}
`;

function categoryLabel(cat: FaqItem['category']): string {
  switch (cat) {
    case 'club': return 'Voor clubs & bestuurders';
    case 'coach': return 'Voor trainers & coaches';
    case 'ouder': return 'Voor ouders & verzorgers';
    case 'speler': return 'Voor jonge spelers';
  }
}

function categoryIcon(cat: FaqItem['category']): string {
  switch (cat) {
    case 'club': return '🏢';
    case 'coach': return '🧢';
    case 'ouder': return '👪';
    case 'speler': return '⚽';
  }
}

function categoryClass(cat: FaqItem['category']): string {
  switch (cat) {
    case 'club': return 'club';
    case 'coach': return 'coach';
    case 'ouder': return 'ouder';
    case 'speler': return 'speler';
  }
}

function ctaForCategory(cat: FaqItem['category']): string {
  switch (cat) {
    case 'club':
      return `<p>Klaar om je club te laten groeien met datagedreven jeugdontwikkeling?</p>
              <a class="cta-btn" href="mailto:info@skillkaart.nl?subject=Demo aanvraag">Vraag een gratis demo aan →</a>`;
    case 'coach':
      return `<p>Wil je het zelf ervaren? Meld je aan voor een gratis proefperiode.</p>
              <a class="cta-btn" href="mailto:info@skillkaart.nl?subject=Demo aanvraag">Start een gratis proef →</a>`;
    case 'ouder':
      return `<p>Vraag de trainer of coördinator van je kind om een uitnodiging. Of neem contact met me op als je eerst meer wilt weten.</p>
              <a class="cta-btn" href="mailto:info@skillkaart.nl?subject=Vraag over Skillkaart">Mail me met je vraag →</a>`;
    case 'speler':
      return `<p>Vraag je trainer om jouw Skillkaart-PIN. Die maakt hij of zij in een paar seconden voor je aan.</p>
              <a class="cta-btn" href="/">Naar Skillkaart →</a>`;
  }
}

function renderFaqItem(item: FaqItem, idx: number): string {
  return `
    <div class="item" data-category="${item.category}" data-question="${esc(item.question.toLowerCase())}" data-answer="${esc(item.answer.replace(/<[^>]+>/g, '').toLowerCase().slice(0, 200))}" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <button class="q" onclick="toggleAccordeon(this)" itemprop="name">
        ${esc(item.question)}
        <span class="chevron">▼</span>
      </button>
      <div class="a-wrap" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <div class="a-inner">
          <div class="a" itemprop="text">${item.answer}</div>
          <div class="feedback" data-id="${item.id}">
            <span class="feedback-label">Was dit antwoord behulpzaam?</span>
            <button class="feedback-btn" data-vote="up" onclick="voteFeedback(this)">👍 <span class="count">0</span></button>
            <button class="feedback-btn" data-vote="down" onclick="voteFeedback(this)">👎 <span class="count">0</span></button>
          </div>
        </div>
      </div>
    </div>`;
}

function renderCategory(cat: FaqItem['category'], items: FaqItem[]): string {
  if (items.length === 0) return '';
  const cta = ctaForCategory(cat);
  return `
    <div class="cat" data-category-group="${cat}">
      <div class="cat-title">
        <span class="cat-icon ${categoryClass(cat)}">${categoryIcon(cat)}</span>
        ${categoryLabel(cat)}
      </div>
      ${items.map((item, i) => renderFaqItem(item, i)).join('')}
      <div class="cta" style="margin-top:24px">
        <h2>Nog vragen over dit onderwerp?</h2>
        ${cta}
      </div>
    </div>`;
}

// ─── FALLBACK FAQ DATA ────────────────────────────────────────────────
// 20 unieke vragen in Vincent's stem: 6 clubs · 5 coaches · 4 ouders · 5 spelers

export const FALLBACK_FAQ: FaqItem[] = [
  { id: 'c1', question: 'Wat kost Skillkaart voor een voetbalclub?', category: 'club', sort_order: 1, published: true,
    answer: `<p>Onze tarieven zijn bewust laag gehouden zodat elke amateurvereniging kan profiteren van datagedreven jeugdontwikkeling. Een los team start al vanaf <strong>€150 per jaar</strong> — dat is €12,50 per maand. Voor complete jeugdafdelingen lopen de pakketten op tot €750 per jaar voor onbeperkt teams, inclusief dedicated onboarding en custom branding.</p>
<p>Toen Danny en ik de prijsstructuur ontwierpen, was één ding leidend: de drempel moet weg. Geen dikke eenmalige licentiekosten, geen verborgen kosten per speler. Een helder jaarbedrag, opzegbaar per seizoen. Vergelijk het met de prijs van een paar trainingshesjes — alleen krijg je er een complete AI-gedreven skill tracking infrastructuur voor terug.</p>
<p>Bekijk alle pakketten op <a href="/#tarieven" style="color:#00FF9D;text-decoration:underline">onze tarievenpagina</a> of mail me direct op <a href="mailto:info@skillkaart.nl" style="color:#00FF9D;text-decoration:underline">info@skillkaart.nl</a> voor een vrijblijvende offerte op maat.</p>` },
  { id: 'c2', question: 'Hoeveel teams kan ik toevoegen en beheren?', category: 'club', sort_order: 2, published: true,
    answer: `<p>Dat hangt af van het pakket. Basis is voor 1 team — ideaal voor een enthousiaste trainer die wil proeven. Club S ondersteunt 2 tot 5 teams, Club M gaat tot 15 teams, en met Club L krijg je onbeperkt teams.</p>
<p>Vanuit mijn ervaring met het bouwen van platformen weet ik: schaalbaarheid gaat niet alleen over het aantal teams, maar over gebruiksgemak. Daarom heeft elk team zijn eigen coach-dashboard, maar zie je als technisch coördinator alle teams in één overzicht. Danny's trainers bij UFA testen dit al met meerdere leeftijdsgroepen tegelijk — van JO7 tot JO12 — en de feedback is dat schakelen tussen teams in een paar klikken gaat.</p>` },
  { id: 'c3', question: 'Voldoet Skillkaart aan de AVG-privacywet voor jeugdspelers?', category: 'club', sort_order: 3, published: true,
    answer: `<p>Absoluut. Privacy is geen bijzaak in mijn werk — het is een ontwerpvoorwaarde. Al mijn platformen, van <a href="https://bijeen.app" style="color:#00FF9D;text-decoration:underline">Bijeen.app</a> tot <a href="https://bewaardvoorjou.nl" style="color:#00FF9D;text-decoration:underline">BewaardVoorJou.nl</a>, zijn gebouwd met datzelfde principe: de gebruiker heeft controle, de data is veilig, en wetgeving is geen obstakel maar uitgangspunt.</p>
<p>Concreet: wij leveren bij elk abonnement een <strong>verwerkersovereenkomst</strong>. Het platform ondersteunt anonieme spelersnummers. Spelers loggen in met een eenvoudige PIN-code — geen e-mailadres, geen wachtwoord. Ouders krijgen alleen toegang via een beveiligde uitnodigingslink. En alle data wordt opgeslagen bij Supabase, een bewezen Europese cloud-infrastructuurpartner.</p>` },
  { id: 'c4', question: 'Hoe start ik een pilot met Skillkaart in mijn club?', category: 'club', sort_order: 4, published: true,
    answer: `<p>Door me gewoon een mailtje te sturen. Ik richt binnen 24 uur een demo-omgeving in met jullie teamnaam en dummy-spelers, zodat het jeugdbestuur en de trainers direct kunnen zien hoe het werkt op hun eigen telefoon. Geen praatje, geen salespitch — gewoon het product ervaren.</p>
<p>De aanpak die ik met Danny heb ontwikkeld: start met één team, één enthousiaste trainer. Laat die twee weken evalueren, kijk hoe de kids reageren op hun radardiagrammen, en laat de resultaten voor zich spreken. Een paar clubs zijn al via-via binnengekomen omdat spelers thuis aan hun ouders lieten zien wat voor coole kaart ze hadden gekregen.</p>` },
  { id: 'c5', question: 'Kunnen we Skillkaart aanpassen met onze clubkleuren en ons logo?', category: 'club', sort_order: 5, published: true,
    answer: `<p>Ja, dat is onderdeel van het Club L-pakket. We noemen dat custom branding, maar het is meer dan een likje verf. Spelers zien hun eigen Skillkaart in de huisstijl van de club — het voelt alsof de club zelf een professionele ontwikkelingsomgeving heeft gebouwd. Dat versterkt de clubtrots.</p>
<p>Voor de grotere clubs bouw ik desgewenst een witte-label variant die naadloos integreert met de clubwebsite. De API staat klaar; het is een kwestie van even samen de juiste koppeling maken.</p>` },
  { id: 'c6', question: 'Wat is het verschil tussen Skillkaart, KNVB Rinus en VTON?', category: 'club', sort_order: 6, published: true,
    answer: `<p>Een vraag die ik vaak krijg van technisch coördinatoren die een doordachte keuze willen maken.</p>
<p><strong>KNVB Rinus</strong> is een fantastische bibliotheek met trainingsvormen en oefenstof. Maar het is een tool voor de <em>trainer</em> — gericht op het ontwerpen van trainingen, niet op het volgen van de individuele speler.</p>
<p><strong>VTON</strong> is een sociaal netwerk rondom voetbal, gericht op scouting en wedstrijdregistratie.</p>
<p><strong>Skillkaart</strong> vult een compleet ander gat. Toen Danny en ik het concept tekenden, zeiden we: er is geen platform dat de <em>beleving van het kind</em> centraal stelt. Geen tool die een 9-jarige het gevoel geeft dat hij een eigen profdashboard heeft. Skillkaart draait niet om de trainer, niet om scouting, maar om de ontwikkeling en motivatie van het kind.</p>
<p>Overigens: Rinus en Skillkaart vullen elkaar prima aan. Wij zien clubs die Rinus gebruiken voor de oefenstof en Skillkaart voor individuele feedback en motivatie.</p>` },

  // ── COACHES ──────────────────────────────────────────────────────────
  { id: 'co1', question: 'Hoeveel tijd kost een evaluatie op Skillkaart?', category: 'coach', sort_order: 1, published: true,
    answer: `<p>Minder dan twee minuten per speler. Dit is geen verkooppraatje — het is de realiteit van hoe we het gebouwd hebben.</p>
<p>Ik heb met Danny's trainers bij UFA talloze sessies gedaan om de interface zo strak mogelijk te krijgen. Het resultaat: een simpel scherm met 7 sliders voor de kernskills. Schuif, schuif, schuif, klaar. De AI (Google Gemini 2.5 Flash) genereert op basis van die sliders in seconden een motiverende, persoonlijke tekst.</p>
<p>Trainers zeggen: "Ik doe het nu tijdens het sinaasappelmoment na de training, ben in een kwartier door het hele team heen." Twee minuten per kind, en dat kind heeft een ervaring die normaal alleen profvoetballers krijgen.</p>` },
  { id: 'co2', question: 'Hoe werkt de AI-feedback precies?', category: 'coach', sort_order: 2, published: true,
    answer: `<p>De techniek erachter is <strong>Google Gemini 2.5 Flash</strong> — een van de meest geavanceerde taalmodellen. Maar wat mij betreft is het interessantste niet de techniek, maar wat de trainer en speler eraan hebben.</p>
<p>Als jij als trainer de 7 sliders invult, stuurt Skillkaart die data samen met context (leeftijd, positie, eerdere scores) naar Gemini. De AI genereert: een <strong>persoonlijk compliment</strong>, een <strong>concreet verbeterpunt</strong> en een <strong>trainingssuggestie</strong>. Geen generieke dooddoeners — écht maatwerk.</p>
<p>Danny noemt het "een assistent-trainer in de broekzak van elke vrijwilliger". Het stelt vrijwilligers zonder pedagogische achtergrond in staat om professionele, individuele feedback te geven. Daar doen we het voor.</p>` },
  { id: 'co3', question: 'Wat zijn de 7 kernskills die Skillkaart meet?', category: 'coach', sort_order: 3, published: true,
    answer: `<p>Snelheid, passing, techniek, schot, verdedigen, inzicht en mentaliteit. Deze zeven komen rechtstreeks uit het <strong>UFA-voetbalcurriculum</strong> dat Danny en zijn UEFA-docenten hebben ontwikkeld. Het zijn de pijlers van moderne jeugdopleidingen.</p>
<p>Ik ben geen voetbaltrainer — dat laat ik aan de experts. Mijn rol is om die zeven skills technisch meetbaar en inzichtelijk te maken. Een trainer schuift een slider van 1 tot 10, en de data wordt verwerkt in een radardiagram dat het kind de volgende dag op zijn eigen dashboard ziet. Heldere, visuele groei.</p>` },
  { id: 'co4', question: 'Kan ik als trainer trainingsplannen laten genereren?', category: 'coach', sort_order: 4, published: true,
    answer: `<p>Ja. De AI-module genereert op basis van evaluatiesuggesties een concreet trainingsplan voor een individuele speler of het hele team. Denk aan: een reeks oefeningen die aansluiten bij de zwakste skills, met video-voorbeelden en een tijdsindicatie.</p>
<p>Hoe vaker je evalueert, hoe beter de AI patronen herkent. Danny gebruikt het zelf om zijn trainster-team bij UFA te voorzien van weekplannen die aansluiten bij actuele data — geen standaard-programma meer, maar een dynamisch plan dat meebeweegt met de groep.</p>` },
  { id: 'co5', question: 'Werkt Skillkaart ook op mijn telefoon?', category: 'coach', sort_order: 5, published: true,
    answer: `<p>Ja, en dat is bewust de primaire interface. Ik heb het platform mobile-first gebouwd omdat vrijwillige trainers geen laptop meenemen naar de rand van het veld. Een snelle evaluatie tussen twee oefeningen door — dat is de praktijk.</p>
<p>Skillkaart werkt in elke browser op elke telefoon, zonder app-installatie. Voor spelers is er een PWA die aan het homescreen kan worden toegevoegd, compleet met push-notificaties. Maar geen verplichte installatie — open de link, klaar.</p>` },

  // ── OUDERS ──────────────────────────────────────────────────────────
  { id: 'o1', question: 'Hoe krijg ik als ouder toegang tot het dashboard van mijn kind?', category: 'ouder', sort_order: 1, published: true,
    answer: `<p>De club stuurt je een beveiligde uitnodigingslink. Je klikt, maakt een account met je e-mailadres, en je bent gekoppeld aan de profielkaart van je kind. Vanaf dat moment zie je de radardiagrammen, de trends over tijd, en de wekelijkse feedback.</p>
<p>Ik heb bewust gekozen voor deze aanpak: de club beheert de uitnodigingen, niet wij. Dat geeft clubs de regie over wie er meekijkt. Geen wildgroei van accounts, geen privacy-risico. Het is dezelfde filosofie die ik in al mijn platformen toepas.</p>` },
  { id: 'o2', question: 'Wat ziet mijn kind in het Skillkaart-dashboard?', category: 'ouder', sort_order: 2, published: true,
    answer: `<p>Iets waar ik zelf nog elke keer blij van word. Stel je voor: een eigen profvoetballer-kaart, compleet met een <strong>radardiagram</strong> dat laat zien hoe sterk je bent, een <strong>trendgrafiek</strong> die groei weergeeft, en een <strong>XP-systeem</strong> waarmee je levels kunt verdienen. Het ziet eruit alsof FIFA of Football Manager het heeft ontworpen — maar dan voor een 9-jarige.</p>
<p>Het dashboard is read-only, dus kinderen kunnen niets per ongeluk wijzigen. Ze loggen in met een simpele 4-cijferige PIN. En de AI-feedback is zo ingesteld dat die altijd aanmoedigend is en gericht op groei, niet op afrekenen.</p>` },
  { id: 'o3', question: 'Ontvang ik als ouder wekelijkse updates of rapportages?', category: 'ouder', sort_order: 3, published: true,
    answer: `<p>Zodra je kind een evaluatie heeft gekregen, krijg jij automatisch bericht via e-mail. Je kunt in je voorkeuren instellen of je een wekelijkse samenvatting wilt of alleen notificaties bij grote veranderingen.</p>
<p>Ik wil niet dat ouders overspoeld worden met data, maar wel precies genoeg informatie krijgen om het gesprek met hun kind aan te gaan. "Hé, ik zie dat je trainer zegt dat je passing erop vooruit is gegaan — hoe vond je dat zelf?" Dat gesprek is waar het om draait. Een getalletje zegt niks, maar het gesprek dat eruit voortkomt des te meer.</p>` },
  { id: 'o4', question: 'Hoe veilig zijn de gegevens van mijn kind?', category: 'ouder', sort_order: 4, published: true,
    answer: `<p>Veiligheid is geen feature — het is de basis. Ik heb ruim 10 jaar in het sociaal domein gewerkt; ik weet wat er gebeurt als je niet zorgvuldig omgaat met persoonsgegevens.</p>
<p>Skillkaart slaat geen overbodige data op. Spelers gebruiken een PIN. Oudergegevens worden alleen gedeeld met de club. Alles is versleuteld, onderweg en in rust. En we werken met een verwerkersovereenkomst die je bij elk abonnement krijgt.</p>
<p>Ik nodig je uit om onze privacyverklaring te lezen. Als je vragen hebt, mag je me direct mailen — ik neem de tijd.</p>` },

  // ── SPELERS ─────────────────────────────────────────────────────────
  { id: 's1', question: 'Hoe log ik in op Skillkaart met mijn PIN-code?', category: 'speler', sort_order: 1, published: true,
    answer: `<p>Je trainer geeft je een geheime code van 4 cijfers. Ga naar <strong>skillkaart.nl</strong> op je telefoon, klik op "Speler inloggen", voer je code in — en je bent binnen. Geen e-mailadres, geen wachtwoord om te onthouden. Vier cijfers, net als bij een pinautomaat.</p>
<p>Daarna zie je meteen je eigen dashboard met een coole radardiagram, XP, en wat je trainer over je heeft gezegd. Je kunt het aan je homescreen toevoegen zodat het voelt als een echte app — maar dat hoeft niet.</p>` },
  { id: 's2', question: 'Wat betekenen de radardiagrammen en hoe lees ik ze?', category: 'speler', sort_order: 2, published: true,
    answer: `<p>Stel je een spinnenweb voor met 7 punten. Elk punt staat voor een skill. Hoe groter het vlak dat wordt ingekleurd, hoe beter je scoort. Het is precies hetzelfde soort diagram dat profvoetballers in de Champions League op televisie zien.</p>
<p>Het leukste is: als je over een paar weken weer kijkt, zie je of het vlak groter is geworden. Na een paar maanden zie je echt verschil. Het is te vergelijken met een highscore in een game — alleen word jij zelf steeds beter in voetbal.</p>` },
  { id: 's3', question: 'Hoe verdien ik XP en stijg ik in level?', category: 'speler', sort_order: 3, published: true,
    answer: `<p>Elke keer dat je trainer je evalueert, verdien je XP — ervaringspunten, net als in een game. Hogere scores op skills geven meer XP. Maar ook huiswerkopdrachten en challenges leveren punten op.</p>
<p>Genoeg XP? Dan ga je naar een hoger level. Levels hebben coole namen zoals "Brons", "Zilver" of "Goud". Het idee is niet dat je beter moet zijn dan een ander — het gaat erom dat je zelf beter wordt. Iedereen kan levels verdienen in zijn eigen tempo.</p>` },
  { id: 's4', question: 'Wat zijn huiswerkopdrachten en hoe doe ik ze?', category: 'speler', sort_order: 4, published: true,
    answer: `<p>Soms geeft je trainer je een speciale opdracht om thuis te oefenen. Dat noemen we huiswerk, maar het is geen schoolhuiswerk — het zijn voetbaloefeningen! Bijvoorbeeld: "Doe 10 wandpassen tegen de muur" of "Probeer 5 keer hoog te houden." Vaak zit er een YouTube-filmpje bij.</p>
<p>In je dashboard zie je een lijstje met alle opdrachten. Heb je er een gedaan? Vink hem af. Je trainer ziet het, en jij krijgt XP. Zo word je ook thuis nóg beter in voetbal.</p>` },
  { id: 's5', question: 'Kan ik mijn Skillkaart-profielkaart delen met vrienden of familie?', category: 'speler', sort_order: 5, published: true,
    answer: `<p>Ja! Je kunt je profielkaart delen met wie je wilt. Opa en oma, je beste vriend — ze kunnen zien wat voor gave kaart je hebt. Alleen de coole plaatjes hoor, niet de cijfers of feedback. Dat blijft tussen jou en je coach.</p>
<p>Overleg wel even met je ouders voordat je deelt. Het is jóuw Skillkaart, dus jij beslist. Dat vind ik belangrijk.</p>` },
];

export function renderFaqPage(
  db: SupabaseClient,
  baseUrl: string,
): Promise<string>;
export function renderFaqPage(
  db: SupabaseClient,
  baseUrl: string,
  overrideItems?: FaqItem[],
): Promise<string>;
export async function renderFaqPage(
  db: SupabaseClient,
  baseUrl: string,
  overrideItems?: FaqItem[],
): Promise<string> {
  let items: FaqItem[];
  if (overrideItems) {
    items = overrideItems;
  } else {
    try {
      const { data } = await db
        .from('faq_items')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true });
      items = (data ?? FALLBACK_FAQ) as FaqItem[];
    } catch {
      items = FALLBACK_FAQ;
    }
  }

  const canonical = `${baseUrl}/faq`;

  // Groepeer per categorie
  const catOrder: FaqItem['category'][] = ['club', 'coach', 'ouder', 'speler'];
  const grouped = new Map<FaqItem['category'], FaqItem[]>();
  for (const c of catOrder) grouped.set(c, []);
  for (const item of items) {
    if (item.published && catOrder.includes(item.category)) {
      grouped.get(item.category)!.push(item);
    }
  }

  // Schema.org FAQPage JSON-LD
  const publishedItems = items.filter((i) => i.published);
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: publishedItems.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: i.answer.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      },
    })),
  });

  // Categorie tabs HTML
  const catTabData = catOrder.map((c) => ({
    cat: c,
    count: grouped.get(c)?.length ?? 0,
    icon: categoryIcon(c),
    label: categoryLabel(c).replace('Voor ', ''),
  }));
  const catTabsHtml = catTabData
    .filter((t) => t.count > 0)
    .map((t) =>
      `<button class="cat-tab" data-cat="${t.cat}" onclick="filterCategory('${t.cat}')">
        <span class="cat-tab-icon">${t.icon}</span>${t.label}
        <span class="count">${t.count}</span>
      </button>`
    )
    .join('');

  const catHtml = catOrder
    .map((c) => renderCategory(c, grouped.get(c) ?? []))
    .join('');

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Veelgestelde vragen — Skillkaart | AI-gestuurd jeugdvoetbalplatform</title>
<meta name="description" content="Alles wat je wilt weten over Skillkaart. Antwoorden op 20+ vragen voor clubs, trainers, ouders en spelers: prijzen, AI-feedback, privacy, PIN-inlog en aan de slag gaan.">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="Veelgestelde vragen — Skillkaart">
<meta property="og:description" content="Antwoorden op de meest gestelde vragen over Skillkaart, het AI-gedreven skill tracking platform voor jeugdvoetbal.">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Veelgestelde vragen — Skillkaart">
<meta name="twitter:description" content="Antwoorden op 20+ vragen over Skillkaart: prijzen, AI-feedback, privacy en hoe je start.">
<script type="application/ld+json">${jsonLd}</script>
<style>${SHELL_CSS}</style>
</head>
<body>

<div class="topbar">
  <a class="brand" href="${baseUrl}/">SKILLKAART</a>
</div>

<div class="wrap">
  <h1>Veelgestelde vragen</h1>
  <p class="sub">Alles wat je wilt weten over hoe Skillkaart werkt, wat het kost en wat je ervan kunt verwachten — voor clubs, trainers, ouders en jonge spelers.</p>

  <!-- Zoekbalk -->
  <div class="search-wrap">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
    <input type="text" id="faqSearch" placeholder="Zoeken in vragen... (bijv. 'kosten', 'AI', 'PIN')" oninput="searchFAQ(this.value)">
    <button class="search-clear" id="searchClear" onclick="clearSearch()">✕</button>
  </div>
  <div class="no-results" id="noResults">Geen vragen gevonden voor deze zoekopdracht.</div>

  <!-- Categorie tabs -->
  <div class="cat-tabs" id="catTabs">
    <button class="cat-tab active" data-cat="all" onclick="filterCategory('all')">📋 Alle categorieën <span class="count">${publishedItems.length}</span></button>
    ${catTabsHtml}
  </div>

  ${catHtml}

  <!-- Algemene CTA onderaan -->
  <div class="cta">
    <h2>Staat jouw vraag er niet tussen?</h2>
    <p>Geen probleem. Ik beantwoord je mail binnen 24 uur — vaak al binnen een paar uur.</p>
    <a class="cta-btn" href="mailto:info@skillkaart.nl?subject=Vraag over Skillkaart">Mail me direct →</a>
    <a class="cta-btn secondary" href="${baseUrl}/">Terug naar Skillkaart</a>
  </div>

  <a class="back" href="${baseUrl}/">← Terug naar Skillkaart</a>
</div>

<script>
// ─── Accordeon toggle ─────────────────────────────────────────────────
function toggleAccordeon(btn) {
  btn.classList.toggle('open');
  var wrap = btn.nextElementSibling;
  if (wrap) wrap.classList.toggle('open');
}

// ─── Zoeken ───────────────────────────────────────────────────────────
function searchFAQ(q) {
  q = q.toLowerCase().trim();
  var items = document.querySelectorAll('.item');
  var anyVisible = false;
  var clearBtn = document.getElementById('searchClear');
  var noRes = document.getElementById('noResults');

  items.forEach(function(item) {
    var question = item.getAttribute('data-question') || '';
    var answer = item.getAttribute('data-answer') || '';
    // Check huidige categorie-filter
    var catFilter = document.querySelector('.cat-tab.active');
    var activeCat = catFilter ? catFilter.getAttribute('data-cat') : 'all';
    var matchesCat = activeCat === 'all' || item.getAttribute('data-category') === activeCat;

    if (!q) {
      item.classList.remove('search-hidden');
      item.style.display = matchesCat ? '' : 'none';
      if (matchesCat) anyVisible = true;
    } else {
      var match = question.indexOf(q) !== -1 || answer.indexOf(q) !== -1;
      if (match && matchesCat) {
        item.classList.remove('search-hidden');
        item.style.display = '';
        anyVisible = true;
      } else {
        item.classList.add('search-hidden');
        item.style.display = 'none';
      }
    }
  });

  if (clearBtn) clearBtn.classList.toggle('show', q.length > 0);
  if (noRes) noRes.classList.toggle('show', !anyVisible && q.length > 0);
}

function clearSearch() {
  document.getElementById('faqSearch').value = '';
  searchFAQ('');
  document.getElementById('faqSearch').focus();
}

// ─── Categorie filter ─────────────────────────────────────────────────
function filterCategory(cat) {
  document.querySelectorAll('.cat-tab').forEach(function(t) {
    t.classList.toggle('active', t.getAttribute('data-cat') === cat);
  });

  var items = document.querySelectorAll('.item');
  items.forEach(function(item) {
    if (cat === 'all') {
      item.style.display = '';
    } else {
      item.style.display = item.getAttribute('data-category') === cat ? '' : 'none';
    }
  });

  // Toon/verberg categorie-groepen
  document.querySelectorAll('.cat').forEach(function(group) {
    var groupCat = group.getAttribute('data-category-group');
    if (cat === 'all') {
      group.style.display = '';
    } else {
      group.style.display = groupCat === cat ? '' : 'none';
    }
  });

  // Reset search highlight bij filter switch
  var searchVal = document.getElementById('faqSearch').value;
  if (searchVal) searchFAQ(searchVal);
}

// ─── Feedback knoppen ─────────────────────────────────────────────────
function voteFeedback(btn) {
  var isUp = btn.getAttribute('data-vote') === 'up';
  var parent = btn.closest('.feedback');
  var otherBtn = parent.querySelector(isUp ? '[data-vote="down"]' : '[data-vote="up"]');

  // Toggle active state
  var wasActive = btn.classList.contains('active');
  btn.classList.toggle('active', !wasActive);
  if (otherBtn) otherBtn.classList.remove('active');

  // Update count
  var countEl = btn.querySelector('.count');
  var current = parseInt(countEl.textContent) || 0;
  countEl.textContent = wasActive ? Math.max(0, current - 1) : current + 1;

  // Store in localStorage (per item)
  var itemId = parent.getAttribute('data-id');
  if (itemId) {
    try {
      var key = 'sk-feedback-' + itemId;
      if (wasActive) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, isUp ? 'up' : 'down');
      }
    } catch(e) {}
  }
}

// ─── Herstel opgeslagen feedback bij laden ────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.feedback').forEach(function(el) {
    var id = el.getAttribute('data-id');
    if (!id) return;
    try {
      var stored = localStorage.getItem('sk-feedback-' + id);
      if (stored) {
        var btn = el.querySelector('[data-vote="' + stored + '"]');
        if (btn) {
          btn.classList.add('active');
          var countEl = btn.querySelector('.count');
          countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
        }
      }
    } catch(e) {}
  });
});
</script>
</body>
</html>`;
}
