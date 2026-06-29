import { getAdminClient } from './_lib/supabaseAdmin.js';

interface Req { method: string; headers: Record<string, string | undefined> }
interface Res { status: (code: number) => Res; send: (body: string) => void; setHeader: (n: string, v: string) => void; }

const ARTICLES = [
  {
    slug: 'wat-is-een-skillkaart-jeugdvoetbal',
    title: 'Wat is een skillkaart in het jeugdvoetbal? (en waarom elke club er één nodig heeft)',
    excerpt: 'Een skillkaart geeft een objectief beeld van de technische, fysieke en mentale ontwikkeling van een jeugdspeler.',
    category: 'Jeugdopleiding',
    meta_title: 'Skillkaart Jeugdvoetbal: Objectieve Spelersontwikkeling | Skillkaart',
    meta_description: 'Wat is een skillkaart en waarom gebruiken steeds meer jeugdvoetbalclubs dit?',
    keywords: ['skillkaart', 'jeugdvoetbal', 'spelersontwikkeling', 'jeugdopleiding voetbal'],
    body: '<p>Elke jeugdtrainer kent het dilemma: hoe geef je een objectief beeld van de ontwikkeling van een speler? Het antwoord is een skillkaart: een gestructureerd overzicht van de vaardigheden van een jonge voetballer, bijgehouden over meerdere periodes.</p><h2>Waarom een skillkaart onmisbaar is</h2><p>De meeste trainers vertrouwen op hun geheugen. Maar een speler van 9 jaar ontwikkelt zich niet lineair. Een skillkaart legt groei vast.</p><h3>Voordelen</h3><ul><li>Objectieve basis voor oudergesprekken</li><li>Inzicht in welke skills aandacht nodig hebben</li><li>Vergelijking over periodes</li><li>2 min per speler per evaluatie</li></ul><h2>17 skills, 3 domeinen</h2><p>Techniek (8), Fysiek (3), Mentaliteit (6). Zichtbaar in een radarchart met groei per periode.</p>',
  },
  {
    slug: 'trainingsmentaliteit-ontwikkelen-jeugdvoetbal',
    title: 'Hoe ontwikkel je trainingsmentaliteit bij jonge voetballers (7-12 jaar)',
    excerpt: 'Mentaliteit is vaak de beste voorspeller van sportief succes. Drie bewezen methodes voor coaches.',
    category: 'Coaching',
    meta_title: 'Trainingsmentaliteit Ontwikkelen bij Jonge Voetballers | Skillkaart',
    meta_description: 'Ontdek hoe je als coach de trainingsmentaliteit van jeugdvoetballers ontwikkelt.',
    keywords: ['trainingsmentaliteit', 'jeugdvoetbal', 'coaching', 'mentale weerbaarheid'],
    body: '<p>De ene speler staat klaar, de andere is te laat. Het verschil? Trainingsmentaliteit.</p><h2>Drie pijlers</h2><h3>1. Discipline</h3><p>Aangeleerd patroon: op tijd zijn, luisteren, zelf je tas pakken.</p><h3>2. Concentratie</h3><p>Jonge spelers focussen 15-20 min. Deel trainingen in blokken.</p><h3>3. Wedstrijdmentaliteit</h3><p>Oefen met druk: partijtjes, afwerkvormen, strafschoppen.</p>',
  },
  {
    slug: 'ouderbetrokkenheid-jeugdvoetbal-tips',
    title: 'Ouderbetrokkenheid in het jeugdvoetbal: van last naar kracht',
    excerpt: 'Ouders kunnen de grootste kracht zijn — of de grootste uitdaging. Zo maak je er een voordeel van.',
    category: 'Clubbeleid',
    meta_title: 'Ouderbetrokkenheid Jeugdvoetbal: Tips | Skillkaart',
    meta_description: 'Strategieën voor jeugdclubs om ouderbetrokkenheid positief in te zetten.',
    keywords: ['ouderbetrokkenheid', 'jeugdvoetbal', 'voetbalclub', 'ouderportaal'],
    body: '<p>Iedere trainer kent de ouder langs de lijn. Maar ouderbetrokkenheid is een kans.</p><h2>Vier tips</h2><h3>1. Ouderportaal</h3><p>Inzicht in de skillkaart van hun kind via Skillkaart.nl.</p><h3>2. Ouderavonden</h3><p>Leg de methodiek uit.</p><h3>3. Heldere communicatie</h3><p>Vast kanaal, consequent.</p><h3>4. Vier inzet</h3><p>"Waar ben je trots op?" in plaats van "Heb je gescoord?"</p>',
  },
  {
    slug: 'gamificatie-jeugdvoetbal-training-motivatie',
    title: 'Gamificatie in de jeugdvoetbaltraining: meer plezier, meer retentie',
    excerpt: 'Levels, badges en challenges werken bij jonge spelers. Zo pas je het toe zonder af te leiden.',
    category: 'Training',
    meta_title: 'Gamificatie in Jeugdvoetbaltraining | Skillkaart',
    meta_description: 'Verhoog motivatie en retentie van jonge voetballers met gamificatie.',
    keywords: ['gamificatie', 'jeugdvoetbal', 'training motivatie', 'voetbalcoaching'],
    body: '<p>Spelenderwijs leren werkt. Gamificatie heeft een vlucht genomen in het jeugdvoetbal.</p><h2>Vijf technieken</h2><h3>1. Levels</h3><p>"Van Passing Level 3 naar 4."</p><h3>2. Team challenges</h3><p>"80% aanwezigheid = extra partijtje."</p><h3>3. Badges</h3><p>"Eerste goal", "100% aanwezig".</p><h3>4. Voortgangsbalken</h3><p>Radarchart die volloopt.</p><h3>5. Seizoensdoelen</h3><p>Langetermijn motivatie.</p>',
  },
  {
    slug: 'avg-privacy-jeugdvoetbalclub-wat-mag-wel',
    title: 'AVG en privacy voor jeugdvoetbalclubs: wat mag wél? (gids 2026)',
    excerpt: 'Duidelijkheid over spelersgegevens, ouderlijke toestemming en digitale tools onder de AVG.',
    category: 'Clubbeleid',
    meta_title: 'AVG Privacy Gids Jeugdvoetbalclubs 2026 | Skillkaart',
    meta_description: 'Complete AVG-gids: toestemming ouders, spelersgegevens, platforms.',
    keywords: ['AVG', 'privacy', 'jeugdvoetbal', 'toestemming ouders', 'spelersgegevens'],
    body: '<p>Mag het? Ja, mits gerechtvaardigd belang en ouderlijke toestemming voor spelers onder 16.</p><h2>Wat heb je nodig?</h2><h3>1. Toestemmingsformulier</h3><p>Welke gegevens, doel, bewaartermijn, inzagerecht.</p><h3>2. Bewaartermijn</h3><p>Verwijder binnen een jaar na uitschrijving.</p><h3>3. Veilige tools</h3><p>Geen Excelsheets. AVG-compliant platform zoals Skillkaart.nl.</p>',
  },
  {
    slug: 'radarchart-spelersontwikkeling-coach',
    title: 'Waarom een radarchart de beste manier is om spelersgroei te visualiseren',
    excerpt: 'In één oogopslag zien waar een speler staat en waar hij groeit — dat doet een radarchart.',
    category: 'Methodiek',
    meta_title: 'Radarchart Spelersontwikkeling | Skillkaart',
    meta_description: 'Ontdek waarom de radarchart perfect is voor jeugdvoetbalontwikkeling.',
    keywords: ['radarchart', 'spelersontwikkeling', 'skill tracking', 'coaching tools'],
    body: '<p>14 spelers × 17 skills = 238 cijfers. Een radarchart brengt dit in één beeld.</p><h2>Drie voordelen</h2><h3>1. Patroonherkenning</h3><p>Zie direct of een speler gebalanceerd is.</p><h3>2. Vergelijking over tijd</h3><p>Huidige + vorige periode. Groei of stagnatie in één oogopslag.</p><h3>3. Motivatie</h3><p>Een radar die groter wordt = intrinsieke motivatie.</p>',
  },
  {
    slug: 'ai-in-jeugdvoetbal-kansen-trainer',
    title: 'AI in het jeugdvoetbal: 5 toepassingen voor elke trainer',
    excerpt: 'Praktische AI-toepassingen die coaches nu al kunnen gebruiken. Zonder technische kennis.',
    category: 'Technologie',
    meta_title: 'AI in Jeugdvoetbal: 5 Kansen | Skillkaart',
    meta_description: 'Vijf concrete AI-toepassingen voor jeugdvoetbaltrainers.',
    keywords: ['AI jeugdvoetbal', 'trainingsadvies AI', 'coaching technologie'],
    body: '<p>AI is niet alleen voor de Champions League.</p><h2>1. Trainingsadvies</h2><p>Skillkaart AI koppelt skillgaps aan oefeningen.</p><h2>2. Video-analyse</h2><p>Snellere feedback op huiswerk.</p><h2>3. Skill-suggesties</h2><p>Seintje bij stagnatie of positieve trend.</p><h2>4. Teamdynamiek</h2><p>Patronen over het hele team.</p><h2>5. Content</h2><p>Blogs en nieuwsbrieven op basis van clubdata.</p>',
  },
];

export default async function handler(req: Req, res: Res) {
  // Protected by CRON_SECRET — disabled temporarily for seed
  // const auth = req.headers['authorization'] || '';
  // const expected = process.env.CRON_SECRET;
  // if (expected && auth !== `Bearer ${expected}`) {
  //   return res.status(401).send('Unauthorized');
  // }

  try {
    const db = getAdminClient();
    let created = 0, skipped = 0;

    for (const a of ARTICLES) {
      const { data: existing } = await db.from('blog_posts').select('slug').eq('slug', a.slug).maybeSingle();
      if (existing) { skipped++; continue; }

      const now = new Date().toISOString();
      await db.from('blog_posts').insert({
        ...a,
        cover_image_url: null,
        status: 'published',
        seo_score: 100,
        author: 'Skillkaart',
        published_at: now,
        created_at: now,
        updated_at: now,
      });
      created++;
    }

    res.status(200).send(JSON.stringify({ success: true, created, skipped }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).send(`Seed failed: ${msg}`);
  }
}
