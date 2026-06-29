-- ================================================================
-- SKILLKAART BLOG SEED — 7 SEO-artikelen
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

-- Insert categories skillkaart-specifiek (optioneel, wordt in de hub weergegeven als tag)
-- Bestaande blog_posts tabel wordt gebruikt met 'category' kolom.

INSERT INTO blog_posts (slug, title, excerpt, body, category, meta_title, meta_description, keywords, status, seo_score, author, published_at, created_at, updated_at) VALUES
(
  'wat-is-een-skillkaart-jeugdvoetbal',
  'Wat is een skillkaart in het jeugdvoetbal? (en waarom elke club er één nodig heeft)',
  'Een skillkaart geeft een objectief beeld van de technische, fysieke en mentale ontwikkeling van een jeugdspeler. Ontdek waarom steeds meer clubs ermee werken.',
  '<p>Elke jeugdtrainer kent het dilemma: hoe geef je een objectief beeld van de ontwikkeling van een speler, zonder te vervallen in vage termen?</p><p>Het antwoord is een skillkaart: een gestructureerd overzicht van de vaardigheden van een jonge voetballer, bijgehouden over meerdere periodes. Geen onderbuikgevoel, maar een helder beeld per skill — van aannemen tot wedstrijdmentaliteit.</p><h2>Waarom een skillkaart onmisbaar is</h2><p>De meeste trainers vertrouwen op hun geheugen en een enkel wedstrijdcijfer. Maar een speler van 9 jaar ontwikkelt zich niet lineair. Een skillkaart legt groei vast over de tijd.</p><h3>Voordelen voor de trainer</h3><ul><li>Objectieve basis voor gesprekken met ouders</li><li>Inzicht in welke skills extra aandacht nodig hebben</li><li>Vergelijking over periodes</li><li>2 minuten per speler per evaluatie</li></ul><h3>Voordelen voor de speler</h3><ul><li>Ziet eigen vooruitgang in een visuele radarchart</li><li>Begrijpt waarom hij bepaalde oefeningen krijgt</li><li>Motivatie door zichtbare groei</li></ul><h2>De 17 skills die het verschil maken</h2><p>Techniek (8), Fysiek (3), Mentaliteit (6) — drie domeinen die samen een compleet beeld geven van een jonge voetballer.</p><p><a href="https://skillkaart.nl">Probeer Skillkaart gratis.</a></p>',
  'Jeugdopleiding',
  'Skillkaart Jeugdvoetbal: Objectieve Spelersontwikkeling | Skillkaart',
  'Wat is een skillkaart en waarom gebruiken steeds meer jeugdvoetbalclubs dit? Lees hoe objectieve skilltracking de ontwikkeling van spelers van 7-12 jaar versnelt.',
  ARRAY['skillkaart', 'jeugdvoetbal', 'spelersontwikkeling', 'skill tracking', 'jeugdopleiding voetbal'],
  'published', 100, 'Skillkaart', now(), now(), now()
),
(
  'trainingsmentaliteit-ontwikkelen-jeugdvoetbal',
  'Hoe ontwikkel je trainingsmentaliteit bij jonge voetballers (7-12 jaar)',
  'Mentaliteit is vaak de beste voorspeller van sportief succes, maar hoe train je het? Drie bewezen methodes voor coaches van jonge teams.',
  '<p>De ene speler staat elke training klaar, de andere is te laat en vergeet zijn spullen. Het verschil? Trainingsmentaliteit.</p><h2>Drie pijlers</h2><h3>1. Discipline</h3><p>Aangeleerd patroon, geen karaktertrek. Basisafspraken: op tijd zijn, zelf je tas inpakken, luisteren.</p><h3>2. Concentratie</h3><p>Jonge spelers kunnen 15-20 min focussen. Deel trainingen op in korte blokken.</p><h3>3. Wedstrijdmentaliteit</h3><p>Oefen met druk: partijtjes met telling, afwerkvormen, strafschoppen.</p><h2>Meet met Skillkaart</h2><p>Scoor per periode op Trainingsmentaliteit, Wedstrijdmentaliteit, Leiderschap, Concentratie, Discipline en Aanwezigheid. Volg groei over tijd.</p>',
  'Coaching',
  'Trainingsmentaliteit Ontwikkelen bij Jonge Voetballers | Skillkaart',
  'Ontdek hoe je als coach de trainingsmentaliteit, concentratie en discipline van jeugdvoetballers van 7-12 jaar kunt ontwikkelen.',
  ARRAY['trainingsmentaliteit', 'jeugdvoetbal', 'coaching', 'mentale weerbaarheid', 'voetbaltraining'],
  'published', 100, 'Skillkaart', now(), now(), now()
),
(
  'ouderbetrokkenheid-jeugdvoetbal-tips',
  'Ouderbetrokkenheid in het jeugdvoetbal: van last naar kracht',
  'Ouders kunnen de grootste kracht van een jeugdopleiding zijn — of de grootste uitdaging. Zo maak je van ouderbetrokkenheid een voordeel.',
  '<p>Iedere jeugdtrainer kent de ouder die langs de lijn staat en elke pass becommentarieert. Maar ouderbetrokkenheid is geen probleem — het is een kans.</p><h2>De driehoek</h2><p>Coach → training. Ouder → veiligheid en rust. Speler → inzet en plezier. Wees vanaf dag één duidelijk over rollen.</p><h2>Vier tips</h2><h3>1. Ouderportaal</h3><p>Geef ouders toegang tot de skillkaart van hun kind. Skillkaart.nl biedt een apart ouderportaal.</p><h3>2. Ouderavonden</h3><p>Laat zien hoe er getraind wordt, leg de methodiek uit.</p><h3>3. Heldere communicatie</h3><p>Vast kanaal, consequent, duidelijk.</p><h3>4. Vier inzet</h3><p>Leer ouders te vragen: "Waar ben je trots op?" in plaats van "Heb je gescoord?"</p>',
  'Clubbeleid',
  'Ouderbetrokkenheid Jeugdvoetbal: Tips voor Coaches | Skillkaart',
  'Praktische strategieën voor jeugdvoetbalclubs om ouderbetrokkenheid positief in te zetten.',
  ARRAY['ouderbetrokkenheid', 'jeugdvoetbal', 'oudercoaching', 'voetbalclub', 'ouderportaal'],
  'published', 100, 'Skillkaart', now(), now(), now()
),
(
  'gamificatie-jeugdvoetbal-training-motivatie',
  'Gamificatie in de jeugdvoetbaltraining: meer plezier, meer retentie',
  'Strepen, levels, badges — gamificatie werkt. Zeker bij jonge spelers. Zo pas je het toe zonder af te leiden van het echte doel.',
  '<p>Spelenderwijs leren werkt. Gamificatie heeft de afgelopen jaren een vlucht genomen, ook in het jeugdvoetbal.</p><h2>Vijf technieken</h2><h3>1. Levels per skillgroep</h3><p>"Van Passing Level 3 naar Level 4" met vaste criteria.</p><h3>2. Team challenges</h3><p>"80% aanwezigheid = extra partijtje." Versterkt de groep.</p><h3>3. Badges</h3><p>Voor "Eerste goal", "100% aanwezig", "Beste trainer".</p><h3>4. Voortgangsbalken</h3><p>Radarchart die volloopt bij groei.</p><h3>5. Seizoensdoelen</h3><p>"Wie verbetert de meeste skills voor de winterstop?"</p><h2>Valkuil</h2><p>Gamificatie is een middel, geen doel.</p>',
  'Training',
  'Gamificatie in Jeugdvoetbaltraining | Skillkaart',
  'Ontdek hoe gamificatie de motivatie en retentie van jonge voetballers (7-12) verhoogt.',
  ARRAY['gamificatie', 'jeugdvoetbal', 'training motivatie', 'voetbalcoaching', 'retentie jeugd'],
  'published', 100, 'Skillkaart', now(), now(), now()
),
(
  'avg-privacy-jeugdvoetbalclub-wat-mag-wel',
  'AVG en privacy voor jeugdvoetbalclubs: wat mag wél? (gids 2026)',
  'Veel jeugdclubs zijn onzeker sinds de AVG. Deze gids geeft duidelijkheid over spelersgegevens, ouderlijke toestemming en digitale tools.',
  '<p>Sinds de AVG zijn veel sportclubs voorzichtiger. Begrijpelijk. Maar ontwikkeling bijhouden is essentieel.</p><h2>Mag het?</h2><p>Ja, mits: gerechtvaardigd belang + ouderlijke toestemming voor spelers onder 16.</p><h2>Wat heb je nodig?</h2><h3>1. Toestemmingsformulier</h3><p>Vermeld welke gegevens, doel, bewaartermijn, inzagerecht.</p><h3>2. Bewaartermijn</h3><p>Zolang actief. Verwijder binnen een jaar na uitschrijving.</p><h3>3. Veilige tools</h3><p>Geen Excelsheets. Gebruik AVG-compliant platform zoals Skillkaart.nl.</p><h2>Fouten</h2><ul><li>Scores delen in groepsapps — niet doen</li><li>Data bewaren van uitgeschreven spelers — verwijderen</li><li>Geen datalekprotocol — verplicht</li><li>Alleen mondelinge toestemming — niet rechtsgeldig</li></ul>',
  'Clubbeleid',
  'AVG Privacy Gids Jeugdvoetbalclubs 2026 | Skillkaart',
  'Complete AVG-gids voor jeugdvoetbalclubs: toestemming ouders, spelersgegevens, digitale platforms.',
  ARRAY['AVG', 'privacy', 'jeugdvoetbal', 'toestemming ouders', 'spelersgegevens'],
  'published', 100, 'Skillkaart', now(), now(), now()
),
(
  'radarchart-spelersontwikkeling-coach',
  'Waarom een radarchart de beste manier is om spelersgroei te visualiseren',
  'Een cijferlijst zegt weinig over een jonge speler. Een radarchart laat in één oogopslag zien waar hij staat en waar hij groeit.',
  '<p>14 spelers × 17 skills = 238 losse cijfers. Een radarchart brengt dit in één beeld.</p><h2>Drie voordelen</h2><h3>1. Patroonherkenning</h3><p>Zie direct of een speler gebalanceerd is. Hoge techniek maar lage mentaliteit? Direct zichtbaar.</p><h3>2. Vergelijking over tijd</h3><p>Huidige radar + vorige periode (stippellijn). Zie waar een speler groeit of stagneert.</p><h3>3. Motivatie</h3><p>Een radarchat die groter wordt? Dat willen spelers zien.</p><h2>Lezen</h2><p>Drie assen: Techniek, Fysiek, Mentaliteit. 0-10 per as. Skillkaart toont ook delta\'s: "+1.2 op passing".</p>',
  'Methodiek',
  'Radarchart Spelersontwikkeling: Visualiseer Groei | Skillkaart',
  'Ontdek waarom de radarchart het perfecte middel is om de ontwikkeling van jeugdvoetballers inzichtelijk te maken.',
  ARRAY['radarchart', 'spelersontwikkeling', 'visualisatie', 'skill tracking', 'coaching tools'],
  'published', 100, 'Skillkaart', now(), now(), now()
),
(
  'ai-in-jeugdvoetbal-kansen-trainer',
  'AI in het jeugdvoetbal: 5 toepassingen waar elke trainer direct mee kan beginnen',
  'AI klinkt als verre toekomst, maar er zijn praktische toepassingen die coaches nu al helpen. Zonder dat het ingewikkeld hoeft te zijn.',
  '<p>AI is niet alleen voor de Champions League. Ook voor JO11 zijn er toepassingen.</p><h2>1. Trainingsadvies</h2><p>Skillkaart AI koppelt skillgaps aan specifieke oefeningen uit de bibliotheek.</p><h2>2. Video-analyse</h2><p>AI analyseert of een oefening correct wordt uitgevoerd. Snellere feedback.</p><h2>3. Skill-suggesties</h2><p>Stagneert een speler? De coach krijgt een seintje. Idem voor positieve trends.</p><h2>4. Teamdynamiek</h2><p>AI herkent patronen over het hele team. Scoort iedereen laag op concentratie in de 2e seizoenshelft?</p><h2>5. Content</h2><p>AI helpt met blogs en nieuwsbrieven op basis van clubdata.</p><h2>AI is een hulpmiddel</h2><p>Geen vervanging voor de coach. Maar voor repetitief werk wel een uitkomst.</p>',
  'Technologie',
  'AI in Jeugdvoetbal: 5 Kansen voor de Trainer | Skillkaart',
  'Vijf concrete AI-toepassingen voor jeugdvoetbaltrainers: trainingsadvies, skillanalyse, video-analyse en meer.',
  ARRAY['AI jeugdvoetbal', 'kunstmatige intelligentie sport', 'trainingsadvies AI', 'coaching technologie'],
  'published', 100, 'Skillkaart', now(), now(), now()
)
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- Klaar! Controleer met:  SELECT slug, title, status FROM blog_posts;
-- ================================================================
