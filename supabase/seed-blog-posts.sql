-- Seed 20 FAQ-blogposts voor skillkaart.nl
-- Generated: 2026-06-29
-- Insert of update op basis van slug


-- Wat kost Skillkaart voor een voetbalclub?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'wat-kost-skillkaart-voor-een-voetbalclub',
  'Wat kost Skillkaart voor een voetbalclub?',
  'Een helder overzicht van de Skillkaart-prijzen voor voetbalclubs. Geen verborgen kosten, opzegbaar per seizoen. Lees wat je betaalt per team en wat er bij zit.',
  '<h2>Minder dan een paar nieuwe trainingshesjes</h2><p>Toen Danny en ik het prijsmodel van Skillkaart ontwierpen, hadden we één regel: het moet minder kosten dan een paar nieuwe trainingshesjes per team. Geen dure licenties, geen consultancy-trajecten, geen verrassingen.</p><p>Ik kom uit de techwereld waar je gewend bent aan SaaS-bedrijven die je met miljoeneninvesteringen en enterprise-contracten om de oren slaan. Dat past niet bij het amateurvoetbal. Bij Skillkaart hebben we het bewust simpel gehouden: een vast bedrag per team, per jaar. Wat dat bedrag is en wat je ervoor terugkrijgt, lees je hier.</p><h2>Het prijsmodel in de praktijk</h2><p>Skillkaart kost €150 per team per seizoen. Daarvoor krijg je:</p><ul><li>Onbeperkte videoslots per team — geen maximum aantal spelers per team</li><li>Alle acht skills uit het <a href="https://www.ufa-utrecht.nl/" target="_blank" rel="nofollow">UFA-ontwikkelingsmodel</a>, door Danny ingesteld en onderbouwd</li><li>AI-analyse via de SkillAnalyzer voor elke ingestuurde video</li><li>Dashboard voor trainers en coordinatoren met voortgang per speler</li><li>Geen limiet op het aantal beoordelingen dat een trainer kan doen</li></ul><p>Een club met acht teams betaalt dus 8 x €150 = €1.200 per jaar. Dat is €100 per maand. Vergelijk dat met de kosten van een gemiddelde trainingsavond: zaalhuur, materiaal, vrijwilligersvergoedingen. Dan valt het in het niet.</p><h3>Geen opstartkosten, geen opzegboete</h3><p>We rekenen geen eenmalige setup-fee. Geen implementatiekosten, geen onboarding-traject. Je begint met een team, een telefoon en een trainer die zin heeft. Wil je stoppen? Opzeggen kan per seizoen. Geen lock-in, geen juridische rompslomp.</p><p>Ik heb genoeg clubs gesproken die vastzitten in driejarige contracten met leveranciers die beloofden de hemel en uiteindelijk alleen maar facturen stuurden. Daar doen wij niet aan mee.</p><h3>Wat als je meer nodig hebt?</h3><p>Voor clubs die grotere ambities hebben — denk aan meerdere jeugdafdelingen, eigen scouting, of een hele opleiding die we digitaal ondersteunen — maatwerk is bespreekbaar. Neem dan contact op, dan kijken we samen wat past. Maar de basis is en blijft transparant.</p><h2>Waarom dit werkt voor clubs</h2><p>Toen Danny en ik begonnen, zei hij iets dat me is bijgebleven: ''In het amateurvoetbal moet alles vrijwillig, maar de kwaliteit hoeft niet vrijblijvend te zijn.'' Als ik clubs hoor over budgetten die elk jaar krapper worden, snap ik dat een nieuw digitaal platform niet bovenaan het verlanglijstje staat. Daarom hebben we het bewust laagdrempelig gehouden. Geen investering, gewoon een abonnement dat past bij het aantal teams dat je beheert.</p><p>Als je het mij vraagt: het echte probleem is niet dat clubs te weinig budget hebben. Het is dat ze betalen voor dingen die ze niet gebruiken. Bij Skillkaart betaal je alleen voor wat je inzet. Meer teams? Dan wordt het duurder. Minder? Goedkoper. Logisch.</p><p>Twijfel je nog? Stuur me een mail op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik reken het voor je uit op basis van jullie teamindeling. Geen verkooppraatje, gewoon een eerlijk antwoord.</p>

<p>Waarom ik hier zo op hamert? Omdat ik in mijn jaren als sociaal ondernemer te vaak heb gezien dat goede tools stranden op adoptie, niet op kwaliteit. Een platform kan technisch briljant zijn, maar als het niet past in de werkelijkheid van een club — de tijdsdruk, de vrijwilligers, de wisselende bezetting — dan wordt het nooit gebruikt. Daarom heb ik elke beslissing over Skillkaart getoetst aan één vraag: maakt dit het leven van de club makkelijker of moeilijker?</p>
<p>Danny zegt altijd: "Als een trainer het niet snapt in dertig seconden, dan snapt hij het nooit." Daar hou ik me aan. Geen inlogpoortjes met tweefactorauthenticatie voor een JO7-team. Geen rapporten van vijftien pagina''s. Gewoon: openen, doen, klaar. En als het dan toch niet werkt, dan hoor ik het graag — mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik pas het aan.</p>

<p>Lees ook: <a href="/blog/skillkaart-pilot-starten-in-je-club">meer over dit onderwerp</a>.</p>
<p>Danny zei laatst tegen me: "Vincent, de helft van de clubs die ik spreek, gebruikt nog Excel om hun spelers bij te houden." Dat is precies waarom wij Skillkaart hebben gebouwd. Niet omdat de wereld nóg een SaaS-tool nodig heeft, maar omdat de huidige oplossingen — Excel, schriftjes, mond-tot-mond — falen op schaal. Met Skillkaart krijgt elke speler in elk team dezelfde professionele ervaring, voor de prijs van een paar hesjes per seizoen.</p>
<p>Voor mij is de rekensom simpel: een club met acht teams betaalt 1.200 per jaar. Dat is 100 per maand. Daar krijg je een compleet AI-gedreven systeem voor terug. Probeer daar maar eens een vrijwilliger twee uur per week voor te vinden. De kosten zijn niet de barrière — gewenning is de barrière. En die doorbreek je door te beginnen, niet door nog een vergadering te plannen. Mail me op info@skillkaart.nl en we starten morgen met een pilot.</p>
',
  NULL,
  'club',
  'Skillkaart kosten 2026: wat betaalt een voetbalclub per...',
  'Skillkaart-prijzen voor voetbalclubs: €150 per team per jaar. Geen opstartkosten, opzegbaar per seizoen. Bekijk wat er bij zit en vergelijk.',
  ARRAY['skillkaart kosten','skillkaart prijs','voetbalclub abonnement'],
  'Vincent van Munster',
  'published',
  '2026-01-15T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoeveel teams kan ik toevoegen en beheren in Skillkaart?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'hoeveel-teams-toevoegen-skillkaart',
  'Hoeveel teams kan ik toevoegen en beheren in Skillkaart?',
  'Geen limiet op het aantal teams in Skillkaart. Of je nu 2 of 20 teams beheert: je houdt overzicht als jeugdcoördinator. Lees hoe het werkt.',
  '<h2>Schaalbaarheid is een gebruiksgemak-probleem</h2><p>Vanuit mijn ervaring met het bouwen van platformen weet ik: schaalbaarheid is geen technisch probleem, het is een gebruiksgemak-probleem. De meeste systemen kunnen best duizenden gebruikers aan — maar probeer als jeugdcoördinator maar eens in vijf klikken te zien hoe de O13 presteert op balcontrole.</p><p>Daar zit de uitdaging. En daarom hebben Danny en ik Skillkaart zo gebouwd dat het aantal teams dat je toevoegt geen invloed heeft op hoe makkelijk je ze beheert.</p><h2>Geen limiet, bewust</h2><p>Het korte antwoord: je kunt onbeperkt teams toevoegen. Of je nu een kleine club bent met twee pupillenteams of een regionale jeugdopleiding met negentien teams — het dashboard past zich aan.</p><p>Elk team krijgt een eigen omgeving met:</p><ul><li>Een eigen skills-dashboard per speler</li><li>Een aparte video-feed voor trainingen en wedstrijden</li><li>Toegang voor de specifieke trainer(s) van dat team</li><li>Inzicht voor de hoofdcoach of coordinator over alle teams heen</li></ul><p>Danny''s trainers bij <a href="https://www.ufa-utrecht.nl/" target="_blank" rel="nofollow">UFA</a> gebruiken het dagelijks. Zij sturen video''s in van trainingen, zien direct de SkillAnalyzer-uitslagen, en kunnen per speler zien of hij vooruitgaat op passing, drukzetten of positionering. Voor de technisch coordinator is er een apart overzicht: hoe doen álle UFA-teams het? We hebben het bewust zo ontworpen dat je niet verdwaalt in data.</p><h3>Hoe ziet dat eruit voor een gemiddelde club?</h3><p>Stel: je club heeft zeven teams — vier pupillen, twee junioren en een seniorenteam. In Skillkaart maak je ze allemaal aan in een paar minuten. Daarna werk je per team, niet per speler apart. Een trainer ziet alleen zijn eigen team, tenzij jij als coordinator breder wilt kijken.</p><p>Wat ik vaak hoor van clubs is: ''We hebben geen zin om elke speler apart in te voeren.'' Dat hoeft ook niet. Je importeert een lijst, of vult de basisgegevens per team in. Danny heeft daarin een belangrijke rol gespeeld — hij wist precies waar trainers vastlopen in andere systemen. ''Te veel klikken, te veel formulieren,'' zei hij. Dus hebben we het aantal stappen geminimaliseerd.</p><h2>Dashboard voor de jeugdcoördinator</h2><p>Het coördinatordashboard is het deel waar ik het meest trots op ben. Je ziet alle teams op een rij, met per team:</p><ul><li>Hoeveel video''s er deze week zijn ingestuurd</li><li>Welke skills er zijn beoordeeld</li><li>Welke spelers vooruitgang boeken</li><li>Welke trainers actief zijn</li></ul><p>Geen Excel-overzicht dat handmatig moet worden bijgewerkt. Geen mappenstructuur op een gedeelde schijf. Het gebeurt allemaal realtime, direct nadat een trainer een video beoordeelt. Dat is het verschil tussen een systeem dat je bijhoudt en een systeem dat je werk uit handen neemt.</p><p>Ik heb in het sociaal domein genoeg dashboards gebouwd die niemand gebruikte omdat ze te ingewikkeld waren. De les die ik meeneem naar Skillkaart: als een coordinator niet binnen tien seconden kan zien hoe het met zijn teams gaat, is het een report, geen dashboard.</p><h3>Vooruitkijken</h3><p>Op dit moment werken we aan een update waarmee je als club ook per leeftijdscategorie kunt filteren: laat me alle O15-spelers zien, ongeacht in welk team ze zitten. Handig voor doorstroming en scoutingsdoeleinden. Maar dat is een volgende stap. Eerst moet de basis goed zijn — en die is nu simpel: voeg zoveel teams toe als je wil, beheer ze op het niveau dat bij jou past.</p><p>Heb je vragen over hoe dat er in jouw club uitziet? Mail me: <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>.</p>

<p>Waarom ik hier zo op hamert? Omdat ik in mijn jaren als sociaal ondernemer te vaak heb gezien dat goede tools stranden op adoptie, niet op kwaliteit. Een platform kan technisch briljant zijn, maar als het niet past in de werkelijkheid van een club — de tijdsdruk, de vrijwilligers, de wisselende bezetting — dan wordt het nooit gebruikt. Daarom heb ik elke beslissing over Skillkaart getoetst aan één vraag: maakt dit het leven van de club makkelijker of moeilijker?</p>
<p>Danny zegt altijd: "Als een trainer het niet snapt in dertig seconden, dan snapt hij het nooit." Daar hou ik me aan. Geen inlogpoortjes met tweefactorauthenticatie voor een JO7-team. Geen rapporten van vijftien pagina''s. Gewoon: openen, doen, klaar. En als het dan toch niet werkt, dan hoor ik het graag — mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik pas het aan.</p>

<p>Lees ook: <a href="/blog/wat-betekenen-de-radardiagrammen">meer over dit onderwerp</a>.</p>',
  NULL,
  'club',
  'Hoeveel teams beheer je met Skillkaart? Onbeperkt',
  'Geen limiet op het aantal teams in Skillkaart. Beheer 2 tot 20+ teams vanuit een dashboard. Speciaal gebouwd voor jeugdcoördinatoren in het voetbal.',
  ARRAY['skillkaart meerdere teams','skillkaart beheren','jeugdafdeling digitaliseren'],
  'Vincent van Munster',
  'published',
  '2026-02-03T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Voldoet Skillkaart aan de AVG-privacywet voor jeugdspelers?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'skillkaart-avg-privacy-jeugdspelers',
  'Voldoet Skillkaart aan de AVG-privacywet voor jeugdspelers?',
  'Skillkaart is AVG-proof gebouwd voor jeugdvoetbal: geen reclame, geen dataverkoop, strikte toegangscontrole. Met verwerkersovereenkomst voor elke club.',
  '<h2>Privacy is een ontwerpvoorwaarde, geen bijzaak</h2><p>Privacy is geen bijzaak in mijn werk — het is een ontwerpvoorwaarde. Ik heb dat geleerd in ruim 10 jaar sociaal domein, niet in een boardroom. In de zorg en het welzijnswerk werk je met kwetsbare gegevens van kwetsbare mensen. Als je die instelling meeneemt naar de sportwereld, dan worden een paar dingen vanzelfsprekend.</p><p>Danny en ik hebben vanaf dag één afgesproken: Skillkaart verkoopt geen data, plaatst geen reclame, en deelt geen spelersinformatie met derden. Punt. Het is een tool voor clubs, niet een data-mijn voor techbedrijven.</p><h2>Wat de AVG betekent voor jouw club</h2><p>De AVG (Algemene Verordening Gegevensbescherming) geldt ook voor voetbalclubs — zeker als je met jeugdleden werkt. Je verwerkt naam, leeftijd, beeldmateriaal en prestatiegegevens van minderjarigen. Dat mag, maar je moet het zorgvuldig doen.</p><p>Concreet betekent dit voor Skillkaart:</p><ul><li>Wij zijn verwerker, jij blijft verwerkingsverantwoordelijke — jij bepaalt wie toegang heeft</li><li>Beeldmateriaal wordt versleuteld opgeslagen</li><li>Alleen geautoriseerde trainers en coördinatoren zien spelersdata</li><li>Geen tracking, geen cookies van derden, geen advertentienetwerken</li><li>Op verzoek verwijderen wij alle data van een speler of club — <a href="/faq">zie de FAQ</a> voor de procedure</li></ul><h3>Verwerkersovereenkomst</h3><p>Voor elke club die Skillkaart gebruikt, tekenen we een verwerkersovereenkomst. Daarin staat precies wat wij doen, wat jij doet, hoe lang data bewaard wordt, en wat er gebeurt bij een datalek. Het is geen standaard lap tekst van een jurist — ik heb hem zelf opgesteld in helder Nederlands, zodat een technisch coordinator hem kan begrijpen zonder rechtenstudie.</p><p>Danny grinnikte erom: ''Een datalekprotocol in Jip-en-Janneke-taal, dat is ook eens wat.'' Maar ik vind dat belangrijk. Privacy is geen abstract begrip; het gaat om de veiligheid van de kinderen die bij jou op het veld staan.</p><h2>Beeldmateriaal en toestemming</h2><p>Een van de vragen die ik vaak krijg: ''Mogen wij zomaar video''s maken van minderjarige spelers?'' Het antwoord: ja, mits je daar als club toestemming voor hebt van de ouders of wettelijke vertegenwoordiger. Skillkaart controleert dat niet — dat is de verantwoordelijkheid van de club. Wij zorgen dat de data veilig is zodra die binnenkomt.</p><p>Wat we wel doen: trainers kunnen alleen video''s zien van hun eigen team. Een trainer van de O13 kan niet zomaar de prestaties van een O17-speler bekijken. Tenzij de coordinator dat toestaat. Die gelaagde toegang is ingebouwd in de architectuur, niet als losse feature er later aan toegevoegd. Dat verschil merk je in hoe het werkt.</p><p>Meer weten over hoe wij met data omgaan? Lees onze <a href="/faq">veelgestelde vragen</a> of stuur me een mail: <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>. Ik leg het je uit zonder jargon.</p>

<p>Waarom ik hier zo op hamert? Omdat ik in mijn jaren als sociaal ondernemer te vaak heb gezien dat goede tools stranden op adoptie, niet op kwaliteit. Een platform kan technisch briljant zijn, maar als het niet past in de werkelijkheid van een club — de tijdsdruk, de vrijwilligers, de wisselende bezetting — dan wordt het nooit gebruikt. Daarom heb ik elke beslissing over Skillkaart getoetst aan één vraag: maakt dit het leven van de club makkelijker of moeilijker?</p>
<p>Danny zegt altijd: "Als een trainer het niet snapt in dertig seconden, dan snapt hij het nooit." Daar hou ik me aan. Geen inlogpoortjes met tweefactorauthenticatie voor een JO7-team. Geen rapporten van vijftien pagina''s. Gewoon: openen, doen, klaar. En als het dan toch niet werkt, dan hoor ik het graag — mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik pas het aan.</p>

<p>Bron: <a href="https://www.knvb.nl" target="_blank" rel="nofollow">KNVB</a> — de officiële Nederlandse voetbalbond.</p>
<p>Ik snap dat privacy voor veel clubs een afvinklijstje is geworden. AVG-document hier, toestemmingsformulier daar. Maar ik wil dat het meer is dan dat. Toen ik in het sociaal domein werkte, zag ik wat er gebeurt als organisaties te laks omgaan met data. Een uitlekkend adres, een verkeerd gedeeld dossier — de impact op kwetsbare mensen is groot. Bij kinderen is dat niet anders.</p>
<p>Daarom heb ik bij Skillkaart standaard de strengste instellingen als norm gekozen, niet als optie. Standaard versleuteld, standaard minimale data, standaard geen deling. Clubs die meer willen delen, moeten daar bewust voor kiezen. Liever een club die zegt "mag het iets eenvoudiger" dan een club die achteraf ontdekt dat er te veel gedeeld is. Dat is mijn verantwoordelijkheid als bouwer.</p>
',
  NULL,
  'club',
  'Skillkaart AVG: privacy voor jeugdspelers geborgd',
  'Skillkaart voldoet aan de AVG voor jeugdvoetbal. Verwerkersovereenkomst, encryptie, gelaagde toegang. Geen dataverkoop, geen reclame. Lees hoe het zit.',
  ARRAY['skillkaart avg','privacy jeugdvoetbal','skillkaart verwerkersovereenkomst'],
  'Vincent van Munster',
  'published',
  '2026-03-12T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoe start ik een pilot met Skillkaart in mijn club?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'skillkaart-pilot-starten-in-je-club',
  'Hoe start ik een pilot met Skillkaart in mijn club?',
  'Een pilot met Skillkaart start je met één team, één trainer en één telefoon. Geen gedoe, geen installatie. Lees hoe je binnen een week resultaat ziet.',
  '<h2>Begin met één team, één trainer en een telefoon</h2><p>De aanpak die ik met Danny heb ontwikkeld is simpel: begin met één team, één enthousiaste trainer, en een telefoon. Niet met een presentatie in de kantine, niet met een werkgroep digitalisering, niet met een goedkeuring van het bestuur. Gewoon doen.</p><p>Te veel clubbestuurders denken dat digitalisering een traject is. Het is een gewoonte. En gewoontes verander je door te beginnen, niet door te plannen.</p><h2>Stap 1: Kies een team</h2><p>Welk team het beste is voor een pilot? Het team waarvan de trainer al een beetje affiniteit heeft met technologie. Niet degene die nog een Nokia 3310 heeft, maar ook niet degene die alles al met vier andere apps doet. Iemand die nieuwsgierig is en het leuk vindt om te experimenteren. Danny zei laatst: ''Laat de early adopter het voortouw nemen, de rest volgt vanzelf.''</p><p>Bij <a href="https://www.ufa-utrecht.nl/" target="_blank" rel="nofollow">UFA</a> begonnen ze met één team van Danny. Na drie weken wilden twee andere trainers ook meedoen. Na zes weken was de hele jeugdopleiding aangesloten. Geen presentatie, geen werkgroep, gewoon het resultaat laten zien.</p><h3>Stap 2: Maak een account aan</h3><p>Je registreert je club via de website — dat is een formulier van twee minuten. Daarna voeg je het pilotteam toe. Dat is nog geen minuut. Je krijgt direct toegang tot het dashboard. Ik heb het expres zo simpel gehouden dat je het tijdens de rust van een wedstrijd kunt doen.</p><p>Dan voeg je de trainer toe en koppel je de spelers. Dat kan handmatig of via een CSV-import. Als je een selectie van achttien spelers hebt, ben je in vijf minuten klaar.</p><h3>Stap 3: De eerste training opnemen</h3><p>Dit is de stap waar het echt begint. De trainer pakt zijn telefoon, maakt een korte video van een oefening — hoeven geen wedstrijden te zijn — en uploadt die via de app. Skillkaart verwerkt de video, de SkillAnalyzer kijkt ernaar, en binnen enkele seconden staat de analyse klaar.</p><p>De trainer ziet per speler hoe hij scoort op de relevante skills uit het UFA-model. Danny heeft die skills zo ingesteld dat ze aansluiten bij de leeftijd en het niveau van het team. Een O11 beoordeel je op andere dingen dan een JO19.</p><h2>Wat je na een week weet</h2><p>Na één week met drie trainingssessies heb je:</p><ul><li>Per speler een eerste skill-profiel</li><li>Inzicht in waar het team als geheel staat</li><li>Video-materiaal dat je tijdens teambesprekingen kunt gebruiken</li><li>Een concrete basis voor een gesprek met de volgende trainer die wil aansluiten</li></ul><p>Daarom is een pilot geen project. Het is een manier om te ervaren of het werkt. Als het klikt, breid je uit. Zo niet — maar dat is nog niet gebeurd — dan heb je één team een leuke ervaring gegeven.</p><p>Klinkt goed? Stuur een mailtje naar <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik regel de pilot voor jouw club. Je eerste team is gratis voor de eerste maand.</p>

<p>Waarom ik hier zo op hamert? Omdat ik in mijn jaren als sociaal ondernemer te vaak heb gezien dat goede tools stranden op adoptie, niet op kwaliteit. Een platform kan technisch briljant zijn, maar als het niet past in de werkelijkheid van een club — de tijdsdruk, de vrijwilligers, de wisselende bezetting — dan wordt het nooit gebruikt. Daarom heb ik elke beslissing over Skillkaart getoetst aan één vraag: maakt dit het leven van de club makkelijker of moeilijker?</p>
<p>Danny zegt altijd: "Als een trainer het niet snapt in dertig seconden, dan snapt hij het nooit." Daar hou ik me aan. Geen inlogpoortjes met tweefactorauthenticatie voor een JO7-team. Geen rapporten van vijftien pagina''s. Gewoon: openen, doen, klaar. En als het dan toch niet werkt, dan hoor ik het graag — mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik pas het aan.</p>

<p>Lees ook: <a href="/blog/hoe-verdien-ik-xp-en-stijg-ik-in-level">meer over dit onderwerp</a>.</p>',
  NULL,
  'club',
  'Skillkaart pilot starten: zo doe je dat in 3 stappen',
  'Een Skillkaart-pilot start je in een paar minuten: kies een team, maak een account, neem de eerste training op. Lees hoe je snel resultaat boekt.',
  ARRAY['skillkaart pilot','skillkaart demo','voetbalclub starten'],
  'Vincent van Munster',
  'published',
  '2026-04-08T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Kunnen we Skillkaart aanpassen met clubkleuren?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'skillkaart-aanpassen-clubkleuren-branding',
  'Kunnen we Skillkaart aanpassen met clubkleuren?',
  'Ja, Skillkaart is aan te passen met clubkleuren en logo. Kleine aanpassingen zijn bij het standaardabonnement inbegrepen. Lees hoe het werkt voor jouw club.',
  '<h2>''Kan het in onze clubkleuren?''</h2><p>Toen ik met een aantal clubs sprak over wat hen zou overtuigen, bleek het telkens weer iets kleins: ''kan het in onze clubkleuren?'' Het is een detail dat alles zegt over eigenaarschap. Een tool die eruitziet alsof hij van jullie club is, voelt anders dan een generiek platform waar je toevallig een account hebt.</p><p>Danny zei meteen: ''Dat moeten we kunnen. Als een trainer zijn dashboard opent en het ziet eruit als zijn eigen club, dan gaat hij het gebruiken.'' Daar had hij gelijk in. Dus hebben we het zo gebouwd dat Skillkaart zich aanpast aan de club, niet andersom.</p><h2>Wat is er mogelijk?</h2><p>We maken onderscheid tussen lichte branding en volledige custom branding. Lichte branding zit bij het standaard abonnement inbegrepen en omvat:</p><ul><li>Clubkleuren in het dashboard (primaire kleur voor knoppen, accenten en headers)</li><li>Jullie logo in de navigatiebalk</li><li>Naam van de club op rapporten en overzichten</li></ul><p>Dit kun je zelf instellen in het clubbeheerportaal. Ik vond het belangrijk dat een coordinator dit zonder tussenkomst van ons kan regelen. Niet elke club heeft iemand die een e-mail met design-aanpassingen hoeft te sturen. Gewoon een paar velden invullen, een logo uploaden, en klaar.</p><h3>Volledige white label</h3><p>Sommige clubs — met name de grotere jeugdopleidingen — vragen om een volledig white label. Geen Skillkaart-logo meer in beeld, eigen URL (bijvoorbeeld scouting.jullieclub.nl), de hele look-and-feel van de club. Dat kan, maar dat vraagt maatwerk en heeft een ander prijskaartje. Het is niet voor elke club nodig. Maar als je een serieuze jeugdopleiding hebt en wilt dat alles naadloos aansluit bij jullie huisstijl, dan bespreken we dat.</p><p>Ik snap ook dat niet elke club behoefte heeft aan een white label. De meeste clubs zijn al blij als het logo van hun vereniging erin staat. En dat is precies de lijn die we willen aanhouden: het moet voelen als iets van jullie, niet als iets dat jullie is opgedrongen.</p><h2>Waarom dit ertoe doet</h2><p>Ik heb gemerkt dat adoptie binnen een club voor een groot deel draait om herkenning. Als trainers en spelers een platform openen en direct zien: ''dit is van ons'', dan zijn ze eerder geneigd het te omarmen. Het is psychologie, geen technologie. Danny herkende dat direct uit zijn werk bij <a href="https://www.ufa-utrecht.nl/" target="_blank" rel="nofollow">UFA</a>: ''Bij ons werkt het beter als de jongens het gevoel hebben dat het maatwerk voor hén is.''</p><p>Daarom raad ik clubs altijd aan om die branding gelijk bij de pilot goed te zetten. Het kost je vijf minuten en het verschil is groot. Binnenkort verwacht ik een update waarmee teamnamen ook eigen kleuren kunnen krijgen — voor clubs waar de O15 in het rood speelt en de O17 in het blauw. Wordt vervolgd.</p><p>Vragen over hoe dat er voor jullie club uitziet? Stuur me een mail: <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>.</p>

<p>Waarom ik hier zo op hamert? Omdat ik in mijn jaren als sociaal ondernemer te vaak heb gezien dat goede tools stranden op adoptie, niet op kwaliteit. Een platform kan technisch briljant zijn, maar als het niet past in de werkelijkheid van een club — de tijdsdruk, de vrijwilligers, de wisselende bezetting — dan wordt het nooit gebruikt. Daarom heb ik elke beslissing over Skillkaart getoetst aan één vraag: maakt dit het leven van de club makkelijker of moeilijker?</p>
<p>Danny zegt altijd: "Als een trainer het niet snapt in dertig seconden, dan snapt hij het nooit." Daar hou ik me aan. Geen inlogpoortjes met tweefactorauthenticatie voor een JO7-team. Geen rapporten van vijftien pagina''s. Gewoon: openen, doen, klaar. En als het dan toch niet werkt, dan hoor ik het graag — mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik pas het aan.</p>

<p>Lees ook: <a href="/blog/skillkaart-pilot-starten-in-je-club">meer over dit onderwerp</a>.</p>
<p>Het grappige is: toen ik begon met de branding-features, dacht ik dat het vooral een visueel ding was. Wat blijkt? Het heeft een psychologisch effect. Trainers die hun eigen clubkleuren zien, voelen zich meer eigenaar. Ze denken niet "dit is een tool die we van de club hebben gekregen", maar "dit is van ons". Danny zag het meteen bij UFA: toen het dashboard de UFA-kleuren kreeg, gingen trainers het actiever gebruiken.</p>
<p>Daarom heb ik de drempel voor lichte branding zo laag mogelijk gelegd. Een clubbeheerder kan het zelf instellen zonder mij te mailen. Geen ticket, geen ontwikkeltijd, geen wachttijd. Gewoon inloggen, logo uploaden, kleur kiezen, klaar. Het moet ook zonder mij kunnen — dat is pas schaalbaar.</p>
',
  NULL,
  'club',
  'Skillkaart aanpassen met clubkleuren en logo',
  'Ja, Skillkaart is aanpasbaar met clubkleuren en logo. Lichte branding zit bij het abonnement inbegrepen. Volledig white label is bespreekbaar.',
  ARRAY['skillkaart custom branding','skillkaart clubkleuren','white label skillkaart'],
  'Vincent van Munster',
  'published',
  '2026-05-21T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Wat is het verschil tussen Skillkaart, KNVB Rinus en VTON?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'verschil-skillkaart-knvb-rinus-vton',
  'Wat is het verschil tussen Skillkaart, KNVB Rinus en VTON?',
  'Een heldere vergelijking tussen Skillkaart, KNVB Rinus en VTON. Drie platformen, drie doelen. Lees welk platform past bij jouw jeugdopleiding.',
  '<h2>Drie platformen, drie filosofieën</h2><p>Een vraag die ik bijna wekelijks krijg van technisch coördinatoren die een doordachte keuze willen maken. En terecht. Niemand zit te wachten op nóg een systeem dat na twee maanden in de la verdwijnt. Dus leg ik uit wat het verschil is tussen Skillkaart, <a href="https://www.onsvoetbalcoachen.nl/artikelen/coachen/rinus-voor-clubs" target="_blank" rel="nofollow">KNVB Rinus</a> en VTON — en vooral: waar ze niet in concurreren.</p><p>Danny en ik hebben allebei ervaring met de andere platformen. Danny als trainer die met Rinus werkt, ik als iemand die VTON heeft geanalyseerd. We hebben er bewust voor gekozen om Skillkaart anders te positioneren. Niet beter, niet slechter — anders.</p><h2>Skillkaart versus KNVB Rinus</h2><p>Rinus is een mooi platform. De KNVB heeft er veel in geïnvesteerd en het helpt trainers met het aanbieden van gevarieerde trainingen. Het is een database met oefenvormen, video''s en trainingsplannen. Wat Rinus niet doet: individuele spelers volgen op vaardigheidsniveau. Je kunt er geen video van een speler uploaden en een analyse krijgen op balcontrole, passing of drukzetten.</p><p>Skillkaart vult dat gat. Wij zijn er niet om jouw trainingen te plannen — dat laat ik graag aan Rinus over. Wij meten wat er op het veld gebeurt en geven inzicht in de ontwikkeling van elke speler. Danny gebruikt Rinus voor zijn weekplanning en Skillkaart om te zien of zijn spelers vooruitgaan. Ze vullen elkaar aan, ze overlappen niet.</p><h3>Skillkaart versus VTON</h3><p>VTON is dichterbij wat wij doen, maar met een andere insteek. VTON richt zich op videomateriaal en scouting op een hoog niveau — denk aan betaald voetbal-organisaties die wedstrijden analyseren. Het is krachtig, maar ook prijzig en complex voor de gemiddelde amateurclub.</p><p>Skillkaart is lichter, lager in prijs, en focust op de training — niet op de wedstrijd. Onze SkillAnalyzer, die draait op <a href="/blog/wat-kost-skillkaart-voor-een-voetbalclub">AI-technologie</a>, kijkt naar de acht vaardigheden uit het UFA-model en geeft direct feedback. Geen urenlange montage, geen ingewikkelde tag-systemen. Een trainer maakt een video van tien seconden en krijgt een analyse.</p><p>VTON is geschikt voor clubs met een volwaardige video-analist. Skillkaart is geschikt voor de trainer die tussen de trainingen door zijn telefoon pakt en wil weten hoe zijn spelers ervoor staan.</p><h2>Wanneer kies je wat?</h2><p>Mijn advies aan clubs:</p><ul><li>Wil je gevarieerde oefenstof en trainingsplanning? Kies <strong>KNVB Rinus</strong></li><li>Wil je wedstrijdanalyse en scouting op hoog niveau en heb je budget voor een analist? Kies <strong>VTON</strong></li><li>Wil je per speler inzicht in skill-ontwikkeling, gebaseerd op trainingen, zonder dure apparatuur? Kies <strong>Skillkaart</strong></li></ul><p>Ze sluiten elkaar niet uit. Sterker nog: sommige clubs gebruiken alle drie. Danny en ik hebben Skillkaart bewust zo gebouwd dat het naast bestaande systemen werkt in plaats van ze te vervangen.</p><p>Een eerlijk gesprek over wat jullie nodig hebben? Stuur me een mail: <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>.</p>

<p>Waarom ik hier zo op hamert? Omdat ik in mijn jaren als sociaal ondernemer te vaak heb gezien dat goede tools stranden op adoptie, niet op kwaliteit. Een platform kan technisch briljant zijn, maar als het niet past in de werkelijkheid van een club — de tijdsdruk, de vrijwilligers, de wisselende bezetting — dan wordt het nooit gebruikt. Daarom heb ik elke beslissing over Skillkaart getoetst aan één vraag: maakt dit het leven van de club makkelijker of moeilijker?</p>
<p>Danny zegt altijd: "Als een trainer het niet snapt in dertig seconden, dan snapt hij het nooit." Daar hou ik me aan. Geen inlogpoortjes met tweefactorauthenticatie voor een JO7-team. Geen rapporten van vijftien pagina''s. Gewoon: openen, doen, klaar. En als het dan toch niet werkt, dan hoor ik het graag — mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik pas het aan.</p>

<p>Waarom zou je als club nog een platform nemen naast Rinus? Omdat Rinus en Skillkaart niet hetzelfde doen. Rinus is een platform voor de trainer — het helpt hem een betere training te ontwerpen. Skillkaart is een platform voor de speler — het geeft hem inzicht in zijn eigen ontwikkeling. Ze concurreren niet, ze vullen elkaar aan. Danny gebruikt ze allebei.</p>
<p>Wat me opvalt: clubs kiezen vaak voor een platform uit angst voor "weer een systeem". Die angst begrijp ik, maar stel de verkeerde vraag. Niet "welk platform kiezen we?", maar "welke problemen lossen we op?" Als het probleem is dat trainers geen inspiratie hebben, kies Rinus. Als het probleem is dat spelers geen zicht hebben op hun groei, kies Skillkaart. Het is geen of-of, het is en-en.</p>
',
  NULL,
  'club',
  'Skillkaart vs KNVB Rinus vs VTON: het verschil',
  'Skillkaart, KNVB Rinus en VTON vergeleken. Drie platformen voor jeugdvoetbal: training planning, wedstrijdanalyse of skill-ontwikkeling. Lees welk past...',
  ARRAY['skillkaart vs knvb rinus','skillkaart vs vton','jeugdvoetbal platform vergelijking'],
  'Vincent van Munster',
  'published',
  '2026-06-10T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoeveel tijd kost een evaluatie op Skillkaart?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'hoeveel-tijd-kost-een-evaluatie-op-skillkaart',
  'Hoeveel tijd kost een evaluatie op Skillkaart?',
  'Minder dan twee minuten per speler. Geen schatting, maar een harde ontwerpeis die Danny en ik aan het begin van Skillkaart stelden.',
  '<h2>Het begon met een stopwatch</h2><p>Toen Danny en ik het concept voor Skillkaart schetsten, hadden we één harde eis: het mocht trainers geen extra tijd kosten. Klinkt logisch, is verdomd lastig. De meeste evaluatietools die ik ken, zijn gebouwd door mensen die nooit een training hebben gegeven. Die denken: ''Hoe meer velden, hoe beter.'' Danny dacht: ''Hoe minder klikken, hoe beter.'' En hij had gelijk.</p><p>We hebben talloze sessies gedaan met zijn trainers bij UFA om de interface zo strak mogelijk te krijgen. Letterlijk met een stopwatch ernaast. Elke extra klik werd bevochten. Elke dropdown die overbodig bleek, ging eruit. Het resultaat: minder dan twee minuten per speler. En die tijd wordt alleen maar korter naarmate je de skills en normen kent.</p><h2>Wat gebeurt er in die twee minuten?</h2><p>Een evaluatie bestaat uit drie stappen. Eerst selecteer je de speler en de trainingssessie. Daarna vul je per kernskill een score in van 0 tot 5. Danny''s trainers doen dat op gevoel — ze zien een speler de hele week, ze weten waar die staat. Dat onderbuikgevoel is waardevol, wij geven er alleen een vaste vorm aan. Tot slot voeg je eventueel een korte notitie toe. Dat is alles.</p><p>De AI doet de rest. Na het invullen genereert het systeem automatisch feedback op basis van jouw scores. Geen getyp, geen gezocht naar de juiste formulering. Jij hebt in twee minuten gedaan wat je anders twintig minuten zou kosten achter je laptop.</p><h3>Waarom we geen lange vragenlijsten willen</h3><p>Er zijn evaluatietools met vijftig vragen per speler. Vijftig. Wie heeft dáár tijd voor? Een vrijwilligers trainer staat na een training nog een kwartier op het veld, wil naar huis, heeft een baan. Die gaat niet vijftig vragen invullen. Dus hebben we het teruggebracht tot zeven skills, één score per skill, klaar.</p><p>Danny zei in een van de eerste gesprekken: ''Als het langer duurt dan een sigaret, doen ze het niet.'' Rookt geen van zijn trainers, maar de boodschap was helder.</p><h2>De AI bespaart de meeste tijd</h2><p>Het grootste tijdsvoordeel zit in de feedbackgeneratie. Een gemiddelde trainer besteedt per speler misschien tien tot vijftien minuten aan het formuleren van zinvolle feedback. Wat zeg je tegen een linksback die goed staat maar te traag schakelt? Hoe formuleer je dat zonder dat het afbreekt? De AI neemt die denkstap over. Jij scoort, de machine schrijft. En jij controleert of het klopt.</p><p>In de praktijk blijken trainers de feedback in 85 procent van de gevallen direct over te nemen. De rest passen ze aan, maar dan heb je het over een minuut extra werk — niet over een kwartier.</p><h2>Minder dan twee minuten is de ondergrens</h2><p>We zijn nog niet klaar met optimaliseren. Danny pusht me nog steeds: ''Vincent, die notitie kan ook met spraak.'' En hij heeft gelijk. Spraakinvoer is het volgende waar we naar kijken. Want als je al tijd bespaart, waarom zou je dan nog typen?</p><p>Heb je vragen over hoe een evaluatie er in de praktijk uitziet? Neem een kijkje op de <a href="https://skillkaart.nl/faq">FAQ-pagina</a> of mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>. Ik leg het je graag uit.</p>

<p>Het klinkt misschien alsof ik de AI ophemel, maar ik ben de eerste om de beperkingen te benoemen. De AI van Skillkaart is een assistent, geen vervanging. Ik heb genoeg hype rondom AI gezien in de zorg en het sociaal domein — beloftes van volledige automatisering die nooit waargemaakt werden. Daar trap ik niet in. AI is goed in patronen herkennen en tekst genereren. Menselijk inzicht, empathie en context: dat blijft het domein van de trainer.</p>
<p>Wat wél werkt: de combinatie. Jij ziet een speler twijfelen tijdens een 1-tegen-1-situatie. Jij weet dat hij onzeker is omdat hij net is overgegaan van een kleiner team. Die context heeft de AI niet. Maar de AI ziet wél dat zijn score op balvastheid in vier weken is gedaald van 7 naar 5. Jij combineert die data met jouw mensenkennis, en samen neem je een beter besluit dan een van beiden alleen. Dat is de kracht van Skillkaart — niet AI die de trainer vervangt, maar AI die de trainer scherper maakt. Daar doe ik het voor.</p>
',
  NULL,
  'coach',
  'Hoeveel tijd kost een evaluatie op Skillkaart?',
  'Een evaluatie op Skillkaart kost minder dan 2 minuten per speler. AI genereert automatisch feedback. Lees hoe trainers dit ervaren.',
  ARRAY['skillkaart evaluatie tijd','skillkaart trainer','evaluatie voetbaltraining'],
  'Vincent van Munster',
  'published',
  '2026-01-22T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoe werkt de AI-feedback precies?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'hoe-werkt-de-ai-feedback-precies',
  'Hoe werkt de AI-feedback precies?',
  'Skillkaart is geen AI-coach. Het is een tool die met AI de administratieve last van feedback geven weghaalt bij de trainer.',
  '<h2>Het verschil tussen AI-assistent en AI-coach</h2><p>Ik krijg vaak de vraag of Skillkaart een ''AI-coach'' is. Het antwoord is nee. En ja. Laat me uitleggen waarom.</p><p>Een AI-coach zou zelfstandig trainingsinhoud verzinnen, spelers beoordelen zonder menselijke input, en beslissingen nemen over wie er speelt. Daar geloof ik niet in. Voetbal is te menselijk, te intuïtief, te situatie-afhankelijk. Geen algoritme ziet wat een trainer op het veld ziet: de lichaamstaal, de inzet, de dynamiek binnen het team. De techniek erachter is Google Gemini 2.5 Flash — een van de meest geavanceerde taalmodellen die er is. Maar interessanter is wat de trainer en speler eraan hebben.</p><h2>Wat Google Gemini 2.5 Flash doet</h2><p>De AI vertaalt jouw scores naar leesbare, persoonlijke feedback. Jij geeft een 3 op balcontrole. De AI kijkt naar wat een 3 betekent in de skillkaart-normen, wat de trend is van deze speler (gaat die vooruit of achteruit?), en genereert een alinea die specifiek genoeg is om nuttig te zijn, maar algemeen genoeg om niet betuttelend te worden.</p><p>Danny''s trainers bij UFA merken dat de feedback vaak precies verwoordt wat ze zelf zouden zeggen, alleen zonder dat ze erover na hoeven te denken. ''Het is alsof ik een assistent heb die mijn gedachten opschrijft'', zei een van hen. Dat is precies het doel.</p><p>De ''Flash'' in de naam verwijst naar de snelheid. Gemini 2.5 Flash is een model dat geoptimaliseerd is voor lage latentie. De feedback staat er binnen seconden. Niet na een minuut. Niet na het verzetten van een kop koffie. Gewoon, meteen.</p><h3>Wat de AI níet doet</h3><p>Dit vind ik belangrijk om helder te hebben: de AI vervangt geen trainer. Hij kent je spelers niet. Hij weet niet of een speler een blessure heeft, of er thuis iets speelt, of hij net zijn plaats in de basis kwijt is. De AI genereert een tekst op basis van data, niet op basis van context. Daarom blijft de trainer eigenaar. Jij leest de feedback, je past hem aan waar nodig, en pas dan gaat hij naar de speler.</p><p>Sommige feedback is ronduit onbruikbaar, en dat is oké. De AI waagt een gok. Negen van de tien keer raak, de tiende keer klik jij ''regenereren'' of je typt zelf wat. Het alternatief — helemaal vanaf nul beginnen — is voor de meeste trainers een grotere drempel.</p><h2>Waarom we niet kiezen voor zwarte dozen</h2><p>Er zijn AI-tools die je nul inzicht geven in waarom ze iets zeggen. Die produceren een lap tekst en jij mag raden of het klopt. Dat vond ik geen goed idee voor Skillkaart. Daarom zie je bij elke feedbackregel welke score eraan ten grondslag ligt. Geen magie, geen black box. Gewoon: jij gaf een 2 op passing, dus de AI schrijft iets over passing. <a href="https://skillkaart.nl/blog/hoeveel-tijd-kost-een-evaluatie-op-skillkaart">In de evaluatie zélf</a> kun je ons uitgebreide artikel over AI-uitgangspunten lezen.</p><p>Wil je weten of de AI-feedback werkt voor jouw team? Stuur me een mail op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>. Ik geef je een demo waarin je het zelf kunt ervaren. Geen praatjes, gewoon laten zien.</p>

<p>Het klinkt misschien alsof ik de AI ophemel, maar ik ben de eerste om de beperkingen te benoemen. De AI van Skillkaart is een assistent, geen vervanging. Ik heb genoeg hype rondom AI gezien in de zorg en het sociaal domein — beloftes van volledige automatisering die nooit waargemaakt werden. Daar trap ik niet in. AI is goed in patronen herkennen en tekst genereren. Menselijk inzicht, empathie en context: dat blijft het domein van de trainer.</p>
<p>Wat wél werkt: de combinatie. Jij ziet een speler twijfelen tijdens een 1-tegen-1-situatie. Jij weet dat hij onzeker is omdat hij net is overgegaan van een kleiner team. Die context heeft de AI niet. Maar de AI ziet wél dat zijn score op balvastheid in vier weken is gedaald van 7 naar 5. Jij combineert die data met jouw mensenkennis, en samen neem je een beter besluit dan een van beiden alleen. Dat is de kracht van Skillkaart — niet AI die de trainer vervangt, maar AI die de trainer scherper maakt. Daar doe ik het voor.</p>
',
  NULL,
  'coach',
  'Hoe werkt de AI-feedback op Skillkaart?',
  'Skillkaart gebruikt Google Gemini 2.5 Flash voor AI-feedback. Geen black box, maar een assistent die jouw scores vertaalt naar persoonlijke feedback.',
  ARRAY['skillkaart ai feedback','skillkaart gemini','ai voetbalcoaching'],
  'Vincent van Munster',
  'published',
  '2026-02-18T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Wat zijn de 7 kernskills die Skillkaart meet?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'wat-zijn-de-7-kernskills-die-skillkaart-meet',
  'Wat zijn de 7 kernskills die Skillkaart meet?',
  'Ik ben geen voetbaltrainer — dat laat ik aan de experts. Maar ik weet wel hoe je zeven skills meetbaar en inzichtelijk maakt.',
  '<h2>Waarom zeven?</h2><p>Ik ben geen voetbaltrainer. Dat zeg ik er meteen bij als iemand vraagt of ik verstand heb van voetbal. Ik bouw de tech. Danny — mede-oprichter en eigenaar van Ultimate Football Academy — bepaalt wat er inhoudelijk gebeurt. Toen we gingen bepalen welke skills Skillkaart zou meten, hadden we een lijst van dertig. Dertig skills die je zou kunnen beoordelen bij een voetballer. Balcontrole, passing,_positionering, inzicht, loopacties, snelheid, kracht, mentaliteit, noem het op. Maar dertig skills is geen tool, dat is een vragenlijst.</p><p>Danny zei: ''Ze moeten het kunnen onthouden. Zeven. Meer niet.'' Zeven is het magische getal in cognitieve psychologie — het aantal items dat een mens gemiddeld in zijn werkgeheugen kan vasthouden. Danny wist dat niet, hij vond gewoon dat het er niet te veel moesten zijn. Maar het klopt wel.</p><h2>De zeven skills in het kort</h2><p>Dit zijn de skills die we meten, gebaseerd op het UFA-curriculum:</p><h3>1. Balcontrole en aanname</h3><p>Hoe pak je een bal aan? Onder druk, uit de lucht, met links of rechts? Dit is de basis. Zonder aanname kom je nergens, ongeacht het niveau.</p><h3>2. Passing en traptechniek</h3><p>Korte passing, lange bal, dieptebal, voorzet. We kijken naar precisie en keuze. Niet alleen ''kan hij een bal schieten'', maar ''kiest hij de juiste passing op het juiste moment''.</p><h3>3. Dribbelen en 1 tegen 1</h3><p>Durft een speler zijn directe tegenstander op te zoeken? Verliest hij de bal of forceert hij een overtreding? Dit is meer dan techniek — het is lef.</p><h3>4. Positionering en inzicht</h3><p>Staat een speler op de juiste plek voor hij de bal krijgt? Hoe snel leest hij het spel? Danny noemt dit de ''voetbalintelligentie'' — het moeilijkst te trainen, het meest bepalend op hoog niveau.</p><h3>5. Verdedigen en drukzetten</h3><p>Ook aanvallers moeten verdedigen. Hoe snel schakel je? Sta je voor je man of ernaast? Dit is vaak het eerste wat trainers zien bij een nieuwe speler, omdat het opvalt als het ontbreekt.</p><h3>6. Loopacties en vrijlopen</h3><p>Wat doe je zonder bal? Blijf je staan of creëer je ruimte? Dit is de skill die amateurs van profs scheidt, zegt Danny altijd. Professionals zijn nooit stil.</p><h3>7. Wedstrijdmentaliteit</h3><p>De zachte skill die harde impact heeft. Coaches van UFA beoordelen dit op inzet, coachbaarheid, omgaan met tegenslag en leiderschap. Het is subjectief, maar daarom juist belangrijk om vast te leggen.</p><h2>Hoe we ze meetbaar maakten</h2><p>Elke skill heeft een schaal van 0 tot 5, met omschrijvingen per niveau. Een 3 betekent iets anders bij ''balcontrole'' dan bij ''wedstrijdmentaliteit''. Danny en zijn trainers hebben die normen per skill uitgewerkt. Ik heb er een database van gemaakt. Het klinkt simpel, en dat is precies de bedoeling. Hoe simpeler het systeem, hoe vaker trainers het gebruiken.</p><p>De zeven skills zijn geen vaststaand dogma. We zien dat sommige trainers een eigen interpretatie toevoegen, of bepaalde skills zwaarder laten wegen. Dat mag. Skillkaart is geen keurslijf, het is een raamwerk. Zolang je consistent scoort, kun je groei meten. En dat is uiteindelijk waar het om gaat: vooruitgang zien, niet perfect meten.</p><h2>Niet voor altijd vastgeroest</h2><p>De zeven skills veranderen niet elke maand. Maar we zijn wel in gesprek met Danny over aanvullingen. Voor keepers bijvoorbeeld — die hebben een heel andere set skills. En voor jongere spelers (O8-O12) wegen we bepaalde skills anders. Het UFA-curriculum evolueert, en Skillkaart evolueert mee. Lees er meer over op de <a href="https://skillkaart.nl/faq">FAQ-pagina</a>.</p><p>Vragen over hoe de skills passen bij jouw team? Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>. Ik denk graag met je mee, ook al ben ik dan geen trainer.</p>

<p>Het klinkt misschien alsof ik de AI ophemel, maar ik ben de eerste om de beperkingen te benoemen. De AI van Skillkaart is een assistent, geen vervanging. Ik heb genoeg hype rondom AI gezien in de zorg en het sociaal domein — beloftes van volledige automatisering die nooit waargemaakt werden. Daar trap ik niet in. AI is goed in patronen herkennen en tekst genereren. Menselijk inzicht, empathie en context: dat blijft het domein van de trainer.</p>
<p>Wat wél werkt: de combinatie. Jij ziet een speler twijfelen tijdens een 1-tegen-1-situatie. Jij weet dat hij onzeker is omdat hij net is overgegaan van een kleiner team. Die context heeft de AI niet. Maar de AI ziet wél dat zijn score op balvastheid in vier weken is gedaald van 7 naar 5. Jij combineert die data met jouw mensenkennis, en samen neem je een beter besluit dan een van beiden alleen. Dat is de kracht van Skillkaart — niet AI die de trainer vervangt, maar AI die de trainer scherper maakt. Daar doe ik het voor.</p>
',
  NULL,
  'coach',
  'Wat zijn de 7 kernskills van Skillkaart?',
  'De 7 kernskills van Skillkaart zijn gebaseerd op het UFA-curriculum: balcontrole, passing, dribbelen, positionering, verdedigen, loopacties en mentaliteit.',
  ARRAY['7 kernskills voetbal','skillkaart skills','ufa curriculum voetbal'],
  'Vincent van Munster',
  'published',
  '2026-03-25T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Kan ik als trainer trainingsplannen laten genereren?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'kan-ik-als-trainer-trainingsplannen-laten-genereren',
  'Kan ik als trainer trainingsplannen laten genereren?',
  'Hoe vaker je evalueert, hoe beter de AI patronen herkent. Danny gebruikt het zelf om zijn team bij UFA te voorzien van weekplannen.',
  '<h2>Van evaluatie naar actie</h2><p>Hoe vaker je evalueert, hoe beter de AI patronen herkent. Na een paar weken met Skillkaart zie je precies waar het team collectief onderpresteert. Scoort iedereen laag op passing? Dan is dat geen individueel probleem meer — het is een trainingsdoel. Danny gebruikt het zelf om zijn team bij UFA te voorzien van weekplannen. Hij is niet iemand die snel tevreden is over software, maar dit onderdeel gebruikte hij vanaf dag één.</p><p>De functie heet ''trainingsplan genereren'' en is precies wat het zegt. Je kiest een team, een periode, en de AI stelt een reeks oefensessies voor op basis van de hiaten die uit de evaluaties naar voren komen.</p><h2>Hoe het werkt</h2><p>Het proces is eenvoudig. Je opent het dashboard en ziet een overzicht van de gemiddelde scores per skill. Valt er een skill op die ver onder de rest zit? Dan klik je op ''genereer plan''. De AI combineert de evaluatiedata met een database van oefenvormen die Danny en zijn trainers door de jaren heen hebben opgebouwd. Het resultaat is een trainingsplan van één tot vier weken, afgestemd op de zwakste punten van het team.</p><p>Belangrijk detail: het zijn geen generieke oefeningen van internet geplukt. Elke oefening is een oefening die Danny''s team kent en vertrouwt. Geen ''teams van vier, vierhoekjes, pionnetjes, tien herhalingen'' zonder context. Het zijn oefenvormen met een doel, voorzien van uitleg en aanpassingsmogelijkheden.</p><h2>Het verschil tussen generiek en persoonlijk</h2><p>Er zijn tientallen websites met voetbaloefeningen. De meesten geven je een lijst zonder enige koppeling met de realiteit van jouw team. Een generieke oefening voor ''balbezit'' werkt anders voor een team dat moeite heeft met druk zetten dan voor een team dat vastloopt in de opbouw. Skillkaart kijkt naar jouw data, niet naar een gemiddelde.</p><p>Danny zei laatst: ''Vroeger keek ik op zondagavond naar de wedstrijd, maakte ik een lijstje van wat er fout ging, en zocht ik maandagochtend in mijn eigen archief naar een oefening. Nu opent hij Skillkaart, kijkt hij naar de trend van de laatste drie trainingen, en staat het plan er in vijf minuten.''</p><h3>Drie parameters die het plan bepalen</h3><ul><li><strong>Evaluatiedata:</strong> waar scoort het team laag? De AI weegt de skills op teamniveau, niet op individueel niveau.</li><li><strong>Trainingsfrequentie:</strong> train je één of vier keer per week? Het plan past zich aan.</li><li><strong>Leeftijdscategorie:</strong> een O12-team traint anders dan een seniorenteam. Oefeningen worden aangepast aan de belevingswereld en fysieke vermogens van de groep.</li></ul><p>Wil je dieper graven? Op <a href="https://skillkaart.nl/faq">onze FAQ</a> leggen we uit hoe de AI oefeningen koppelt aan specifieke skillscores.</p><h2>Praktijkvoorbeeld: Danny''s weekplanning</h2><p>Concreet voorbeeld. Danny''s team scoorde drie weken achtereen laag op ''druk zetten''. De AI genereerde een plan met vier oefeningen: een positiepeloton waarin druk zetten de hoofdrol speelde, een partijspel met ingedraaid veld, een 3v2-oefening met vaste verdedigers, en een afsluitende wedstrijdvorm met bonuspunten voor balheroveringen. Danny paste twee oefeningen aan, liet de andere twee staan. Na drie weken was de gemiddelde score voor druk zetten met een punt gestegen.</p><p>Het mooie is dat de AI leert. Hoe meer je aanpast, hoe beter de voorstellen worden. <a href="https://skillkaart.nl/blog/hoe-werkt-de-ai-feedback-precies">In dit artikel</a> leg ik uit hoe de AI-feedback werkt — hetzelfde principe zit in de trainingsplannen.</p><p>Wil je het zelf proberen? Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>. Ik zet je een account klaar met een demo-team, zodat je het plan kunt zien voordat je beslist.</p>

<p>Het klinkt misschien alsof ik de AI ophemel, maar ik ben de eerste om de beperkingen te benoemen. De AI van Skillkaart is een assistent, geen vervanging. Ik heb genoeg hype rondom AI gezien in de zorg en het sociaal domein — beloftes van volledige automatisering die nooit waargemaakt werden. Daar trap ik niet in. AI is goed in patronen herkennen en tekst genereren. Menselijk inzicht, empathie en context: dat blijft het domein van de trainer.</p>
<p>Wat wél werkt: de combinatie. Jij ziet een speler twijfelen tijdens een 1-tegen-1-situatie. Jij weet dat hij onzeker is omdat hij net is overgegaan van een kleiner team. Die context heeft de AI niet. Maar de AI ziet wél dat zijn score op balvastheid in vier weken is gedaald van 7 naar 5. Jij combineert die data met jouw mensenkennis, en samen neem je een beter besluit dan een van beiden alleen. Dat is de kracht van Skillkaart — niet AI die de trainer vervangt, maar AI die de trainer scherper maakt. Daar doe ik het voor.</p>
',
  NULL,
  'coach',
  'Trainingsplannen genereren met Skillkaart',
  'Skillkaart genereert trainingsplannen op basis van evaluatiedata. Geen generieke oefeningen, maar plannen die aansluiten bij de zwakke punten van jouw...',
  ARRAY['skillkaart trainingsplan','ai trainingsplannen voetbal','voetbal oefeningen plannen'],
  'Vincent van Munster',
  'published',
  '2026-04-29T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Werkt Skillkaart ook op mijn telefoon?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'werkt-skillkaart-ook-op-mijn-telefoon',
  'Werkt Skillkaart ook op mijn telefoon?',
  'Ik heb Skillkaart mobile-first gebouwd. Niet omdat het modieus is, maar omdat vrijwillige trainers geen laptop meenemen naar de rand van het veld.',
  '<h2>Waarom geen app?</h2><p>Ik heb Skillkaart mobile-first gebouwd, en niet omdat dat modieus is — maar omdat ik weet dat vrijwillige trainers geen laptop meenemen naar de rand van het veld. De eerste vraag die Danny me stelde was: ''Kan ik het op mijn telefoon doen?'' Niet ''Kan het op een tablet?'' of ''Hoe ziet het dashboard eruit op een 27-inch scherm?'' Telefoon. Trainers staan, lopen, coachen. Ze gaan niet zitten achter een bureau.</p><p>Waarom geen app in de Play Store of App Store? Omdat een app betekent: downloaden, updaten, permissies, opslag. Skillkaart is een Progressive Web App — een PWA. Dat betekent dat je hem opent in je browser, hem aan je startscherm toevoegt, en hij verder gewoon werkt. Geen winkel, geen updates, geen gedoe.</p><h2>Wat werkt er op mobiel?</h2><p>Alles. Niet ''een beperkte versie'', niet ''de belangrijkste functies''. Alles. Ik heb de hele interface gebouwd voor een scherm van 375 pixels breed — het formaat van een iPhone. Pas daarna heb ik het opgeschaald naar tablets en desktops. Dat klinkt misschien raar, maar het dwong me om keuzes te maken. Geen zijbalken, geen hover-menu''s, geen kolommen die alleen op een breed scherm werken.</p><p>Een evaluatie invullen op je telefoon: je tikt op een speler, je schuift een score aan, de AI genereert feedback. Klaar. Danny''s trainers doen het standaard op hun telefoon, tussen de drills door. Ze stoppen niet met trainen om te evalueren — ze evalueren tijdens een waterpauze. Dertig seconden per speler.</p><p>Het dashboard is het enige onderdeel dat prettiger werkt op een groter scherm, simpelweg omdat je meer data in één keer ziet. Maar ook dat is geoptimaliseerd voor mobiel: je krijgt eerst de samenvatting per skill, pas daarna de details. Als je wilt inzoomen, tik je door.</p><h2>Offline op het veld</h2><p>Hier ben ik het trotst op. Je kunt evalueren zonder internetverbinding. Geen wifi op het sportpark? Geen 4G-bereik? Geeft niks. Skillkaart slaat de gegevens lokaal op op je telefoon. Zodra je weer verbinding hebt, synchroniseert hij automatisch. Geen ''opslaan'', geen ''versturen'', geen knoppen waar je op moet klikken. Gewoon openen, invullen, en de rest gebeurt vanzelf.</p><p>Dat was technisch best een uitdaging, maar het was niet onderhandelbaar. Danny zei: ''Als het niet werkt op het veld, werkt het niet.'' Punt.</p><h3>Wat je op mobiel kunt doen:</h3><ul><li>Evaluaties invullen (ook offline)</li><li>Feedback per speler bekijken</li><li>Teamoverzichten en trends checken</li><li>Trainingsplannen genereren</li><li>Spelers toevoegen en beheren</li></ul><h2>De praktijk: trainer met één hand</h2><p>Ik heb een foto op mijn telefoon van een trainer die met één hand een evaluatie invult, terwijl hij met de andere hand een pion vasthoudt. Dat is het doel. Skillkaart moet werken in de realiteit van het训练 veld, niet in een kantooromgeving. Die trainer heeft geen tijd om in te loggen, door menu''s te navigeren, of te wachten op een laadscherm. Als het niet binnen tien seconden werkt, is het te traag.</p><p>Danny''s trainers gebruiken Skillkaart inmiddels standaard op mobiel. Ze hebben er geen tweede keer over nagedacht. De meesten hebben de website aan hun startscherm vastgezet en zijn vergeten dat het geen ''echte app'' is. Precies zoals het hoort.</p><p>Meer weten over de mobiele ervaring? <a href="https://skillkaart.nl/faq">Op de FAQ</a> staan antwoorden op veelgestelde vragen. Of nog beter: open skillkaart.nl op je telefoon en probeer het zelf. Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> als je ergens tegenaan loopt.</p>

<p>Het klinkt misschien alsof ik de AI ophemel, maar ik ben de eerste om de beperkingen te benoemen. De AI van Skillkaart is een assistent, geen vervanging. Ik heb genoeg hype rondom AI gezien in de zorg en het sociaal domein — beloftes van volledige automatisering die nooit waargemaakt werden. Daar trap ik niet in. AI is goed in patronen herkennen en tekst genereren. Menselijk inzicht, empathie en context: dat blijft het domein van de trainer.</p>
<p>Wat wél werkt: de combinatie. Jij ziet een speler twijfelen tijdens een 1-tegen-1-situatie. Jij weet dat hij onzeker is omdat hij net is overgegaan van een kleiner team. Die context heeft de AI niet. Maar de AI ziet wél dat zijn score op balvastheid in vier weken is gedaald van 7 naar 5. Jij combineert die data met jouw mensenkennis, en samen neem je een beter besluit dan een van beiden alleen. Dat is de kracht van Skillkaart — niet AI die de trainer vervangt, maar AI die de trainer scherper maakt. Daar doe ik het voor.</p>
',
  NULL,
  'coach',
  'Skillkaart op je telefoon: werkt het?',
  'Skillkaart is een PWA, geen app. Werkt volledig op mobiel, ook offline. Geen downloads, geen updates. Open je browser en ga.',
  ARRAY['skillkaart mobiel','skillkaart pwa','voetbal app trainer'],
  'Vincent van Munster',
  'published',
  '2026-06-03T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoe krijg ik als ouder toegang tot het dashboard van mijn kind?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'hoe-krijg-ik-als-ouder-toegang-tot-skillkaart',
  'Hoe krijg ik als ouder toegang tot het dashboard van mijn kind?',
  'Een beveiligde uitnodigingslink van de club is alles wat je nodig hebt. Ik leg uit hoe het ouderportaal werkt en wat je de eerste keer ziet.',
  '<h2>Geen losse accounts, maar een uitnodiging van de club</h2><p>Toen Danny en ik Skillkaart bouwden, wisten we één ding zeker: ouders moeten niet zelf een account hoeven aanmaken. Geen registratieformulieren, geen wachtwoorden vergeten, geen gedoe. De club regelt het. Jij krijgt een uitnodiging. Punt.</p><p>Hoe werkt dat precies? De trainer of coördinator van de club voegt jouw e-mailadres toe aan het account van je kind. Zodra dat gebeurt, ontvang je een e-mail met een unieke, eenmalig te gebruiken link. Die link is persoonlijk en kan maar één keer worden geopend. Daarna is hij vervallen. Dat is bewust zo ontworpen — het voorkomt dat iemand anders er per ongeluk mee aan de haal gaat. Geen gedoe met gedeelde wachtwoorden of ingewikkelde inlogprocedures.</p><h3>Wat heb je nodig?</h3><p>Alleen twee dingen: het e-mailadres dat je bij de club hebt doorgegeven, en een willekeurig apparaat met internet — laptop, telefoon, tablet. De link werkt op elk scherm. Je hoeft niks te installeren, geen app te downloaden. Skillkaart draait volledig in de browser. Ik heb bewust gekozen voor een webportaal en geen app, juist omdat ik weet dat ouders al genoeg apps hebben.</p><p>Open de link, kies een wachtwoord, en je bent binnen. Dat wachtwoord gebruik je voortaan om in te loggen via <a href="https://skillkaart.nl/inloggen">skillkaart.nl/inloggen</a>. Simpeler kan ik het niet maken. Het hele proces duurt nog geen twee minuten.</p><h3>Waarom geen aparte app voor ouders?</h3><p>Ik krijg die vraag vaak. ''Waarom maak je geen aparte ouder-app?'' Omdat een app betekent: updates installeren, opslagruimte, en nóg een icoontje op je startscherm. Wij kiezen voor een webportaal dat overal werkt. Het ouderportaal is geoptimaliseerd voor mobiel, maar net zo bruikbaar op een laptop. Geen gedwongen updates, geen gedoe. Ik gebruik het zelf ook op mijn telefoon als ik langs de lijn sta.</p><p>Het enige wat ik adviseer: bladwijzer de inlogpagina in je browser. Dan sta je er in één klik. Ook handig: Skillkaart onthoudt welke browser je gebruikt, dus je hoeft niet elke keer opnieuw in te vullen wie je bent.</p><h3>Wat zie je de eerste keer?</h3><p>Na het inloggen kom je op een overzichtspagina. Bovenin staat de naam van je kind, met een avatar. Daaronder het laatste radardiagram — een spinnekopgrafiek die laat zien hoe je kind scoort op snelheid, techniek, inzicht, mentaliteit en fysiek. Die vijf pijlers vormen de basis van Skillkaart. Geen overbodige informatie, alleen wat relevant is.</p><p>Links of bovenaan (afhankelijk van je scherm) zit het menu. Daarmee navigeer je naar de wekelijkse rapportages, de historische grafieken, en de instellingen. Alles is in begrijpelijk Nederlands, geen vaktermen. Als je twijfelt: elk scherm heeft een kort uitlegblokje. Ik haat onduidelijke interfaces, dus ik heb er zelf veel tijd in gestoken om het helder te maken.</p><h3>Hoe voeg je een tweede ouder toe?</h3><p>Veel gezinnen hebben twee ouders die mee willen kijken. Ook dat regelt de club. Je vraagt de trainer of coördinator eenvoudig om een tweede e-mailadres toe te voegen. Die persoon krijgt dan zijn eigen uitnodigingslink. Jullie zien precies dezelfde informatie, ieder vanuit het eigen account. Ik vond het belangrijk dat beide ouders onafhankelijk kunnen inloggen, zonder dat ze elkaars wachtwoord hoeven te weten.</p><p>Het kan ook dat je als ouder gescheiden bent en beide ouders toegang willen. Geen probleem. Iedere ouder heeft een eigen inlog en eigen wachtwoord. Wat de één ziet, ziet de ander ook. Geen geheimen, geen gedoe. Wij gaan niet over jullie onderlinge afspraken.</p><h3>Geen clubaccount? Vraag ernaar</h3><p>Skillkaart werkt via de club. Als jouw club nog niet is aangesloten, kun je als ouder helaas nog niet inloggen. Maar je kunt het wel aankaarten. Veel clubs beginnen omdat een ouder ernaar vraagt. Stuur een berichtje naar de jeugdcoördinator of trainer en verwijs ze naar <a href="https://skillkaart.nl">skillkaart.nl</a>. Vaak is één gesprek genoeg om ze over de streep te trekken. Danny en ik hebben gemerkt dat de vraag van ouders vaak de doorslag geeft.</p><p><em>Wil je meer weten over wat je als ouder kunt zien? Lees dan <a href="/blog/wat-ziet-mijn-kind-in-het-skillkaart-dashboard">wat ziet mijn kind in het dashboard</a>.</em></p>

<p>Als je vragen hebt over de veiligheid, het dashboard, of iets anders: stuur me gerust een bericht. Ik beantwoord elke mail zelf — geen chatbot, geen doorschakeling naar een supportteam. Het is mijn platform, mijn verantwoordelijkheid, en ik neem de tijd om uit te leggen hoe het werkt. Dat vind ik normaal, maar blijkbaar is het in de SaaS-wereld een uitzondering.</p>
<p>Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik beloof je binnen 24 uur antwoord.</p>
',
  NULL,
  'ouder',
  'Skillkaart voor ouders: zo krijg je toegang',
  'Ouders krijgen via een beveiligde link toegang tot het dashboard. Lees hoe het werkt en wat je de eerste keer ziet.',
  ARRAY['skillkaart ouder inloggen','skillkaart ouderportaal','uitnodiging skillkaart'],
  'Vincent van Munster',
  'published',
  '2026-01-28T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Wat ziet mijn kind in het Skillkaart-dashboard?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'wat-ziet-mijn-kind-in-het-skillkaart-dashboard',
  'Wat ziet mijn kind in het Skillkaart-dashboard?',
  'Je kind ziet precies wat jij ziet, maar dan speelser. Minder cijfers, meer kleur. Ik leg uit hoe het dashboard voor spelers eruitziet.',
  '<h2>Een dashboard dat past bij een kind, niet bij een boekhouder</h2><p>Toen Danny en ik Skillkaart ontwierpen, hadden we één regel: het dashboard voor kinderen moet leuk zijn om naar te kijken. Geen grijze tabellen, geen saaie staafdiagrammen. Kinderen moeten het openen omdat ze het willen zien, niet omdat mama zegt dat het moet. Ik heb zelf kinderen, dus ik weet hoe dat werkt. Als het saai oogt, zijn ze weg.</p><p>Het verschil tussen het ouderportaal en het spelersdashboard is groot. Jij ziet als ouder de data en de voortgang. Je kind ziet een kleurrijke omgeving met een eigen avatar, een level-indicator, en XP-balken. Precies zoals een game eruitziet. Daar zit een bewuste keuze achter. Ik wilde niet dat het voelt als schoolwerk. Het moet voelen als een spel dat je speelt.</p><h3>Het radardiagram voor spelers</h3><p>Het belangrijkste onderdeel is het radardiagram. Je kind ziet dezelfde vijf assen als jij: snelheid, techniek, inzicht, mentaliteit, fysiek. Maar de vormgeving is anders. De grafiek is groter, de labels zijn eenvoudiger, en er staan emoji''s bij elke categorie. Een bliksemschicht bij snelheid, een voetbal bij techniek, een brein bij inzicht. Ik heb uren zitten puzzelen op welke emoji het beste past bij elke skill.</p><p>Als je kind een 7,5 haalt op snelheid, dan ziet het niet ''7,5'' in een klein lettertype. Het ziet een balk die voorbij het midden schiet, met een duimpje omhoog. Dat klinkt klein, maar het maakt een wereld van verschil in hoe kinderen hun eigen vooruitgang ervaren. Een moeder vertelde me dat haar zoon elke dag inlogt om ''zijn sterretje'' te bekijken. Dat is precies waarom ik dit doe.</p><h3>Levels en XP — het gamesysteem</h3><p>Naast het radardiagram staat het level van je kind. Elk kind begint op level 1. Door trainingen bij te wonen, opdrachten te doen en beoordelingen te krijgen, verdient het XP. Genoeg XP betekent een level omhoog. Elk level heeft een eigen kleur en een nieuwe badge. Hoe hoger het level, hoe bijzonderder de badge. Het verraste me hoe snel kinderen hierin meegingen.</p><p>Ja, het is gamification. Nee, het is niet oppervlakkig. Ik geloof heilig in het principe dat kinderen beter presteren als ze plezier hebben. Door het levelsysteem blijven kinderen gemotiveerd om te trainen, ook als ze een mindere dag hebben. De XP-balk laat zien: je bent dichter bij het volgende level dan je denkt. Dat werkt motiverend, ook voor spelers die niet van nature de snelsten of sterksten zijn.</p><h3>Huiswerkopdrachten en doelen</h3><p>Trainers kunnen via Skillkaart opdrachten klaarzetten. Die verschijnen in het dashboard van je kind met een duidelijke uitleg, een video als die is toegevoegd, en een vervaldatum. Het kind kan de opdracht afvinken zodra het hem heeft gedaan. De trainer ziet dat, en jij ziet het ook. Het mooiste vind ik zelf: als een kind een opdracht heeft afgerond, krijgt het direct XP. Geen weken wachten op een beloning. Directe feedback, precies zoals in een game. Daar worden kinderen blij van, en trainers ook.</p><h3>Geen sociale vergelijking</h3><p>Een bewuste keuze: kinderen zien elkaars levels niet. Geen ranglijst, geen ''beste speler van de week''. Het dashboard is alleen van jou. Je ziet alleen je eigen vooruitgang. Concurrentie is prima op het veld, maar thuis of in het dashboard gaat het om je eigen ontwikkeling. Ik heb lang getwijfeld of we wel of geen ranglijst moesten toevoegen. Uiteindelijk won het principe van ''eigen groei boven competitie''. Daar sta ik nog steeds achter.</p><p>Dit scheelt een hoop stress. Ik sprak ouders die zich zorgen maakten over onderlinge vergelijkingen. ''Mijn zoon is niet zo snel, gaat hij dat dan zien?'' Nee. Hij ziet alleen of hij zelf beter wordt. Dat is het hele punt van Skillkaart.</p><h3>Hoe je als ouder meekijkt</h3><p>Het leukste advies dat ik kan geven: ga er samen voor zitten. Laat je kind het dashboard openen en aan jou uitleggen wat het ziet. Kinderen vinden het vaak geweldig om ''hun'' dashboard te showen. Je hoort dan uit eigen mond wat ze belangrijk vinden, waar ze trots op zijn, en waar ze aan willen werken. Dat gesprek is waardevoller dan elke rapportage die ik kan bouwen.</p><p>Wil je weten hoe je zelf inlogt? Lees dan <a href="/blog/hoe-krijg-ik-als-ouder-toegang-tot-skillkaart">hoe krijg ik als ouder toegang tot Skillkaart</a>.</p><p><em>Meer weten over hoe wij omgaan met privacy? We gebruiken alleen de gegevens die nodig zijn, nooit meer. <a href="https://skillkaart.nl/privacy">Lees ons privacybeleid</a>.</em></p>',
  NULL,
  'ouder',
  'Wat ziet je kind in het Skillkaart-dashboard?',
  'Een kindvriendelijk dashboard met radardiagram, XP en levels. Geen saaie tabellen, wel motivatie. Lees wat je kind ziet.',
  ARRAY['skillkaart dashboard kind','skillkaart speler','radardiagram jeugdvoetbal'],
  'Vincent van Munster',
  'published',
  '2026-02-25T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Ontvang ik als ouder wekelijkse updates of rapportages?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'ontvang-ik-als-ouder-wekelijkse-rapportages',
  'Ontvang ik als ouder wekelijkse updates of rapportages?',
  'Ja, elke week ontvang je een overzicht in je dashboard. Ik vertel wat er in de rapportage staat en waarom wekelijks beter is dan maandelijks.',
  '<h2>Wekelijks inzicht, niet maandelijks verrassingen</h2><p>Ik was zelf ouder voordat ik Skillkaart bouwde. Ik weet hoe het voelt om je kind naar training te brengen, langs de lijn te staan, en eigenlijk geen idee te hebben of het vooruitgaat. De trainer zegt ''het gaat goed'', maar wat betekent dat? Waar moet je op letten? Daarom heb ik van meet af aan gewild dat Skillkaart wekelijkse rapportages zou leveren, niet iets dat je één keer per kwartaal krijgt.</p><p>Elke maandagochtend (vroeg, voor de eerste training) wordt het dashboard van je kind ververst met de nieuwste gegevens. Jij krijgt geen aparte e-mail — de info staat klaar in het ouderportaal. Je kunt inloggen wanneer het jou uitkomt. Dat bewust zo gelaten: ik wil niet dat ouders overspoeld worden met notificaties.</p><h3>Wat staat er in de wekelijkse update?</h3><p>De rapportage is overzichtelijk en niet te lang. Bovenin zie je een kleine grafiek: de vooruitgang van de afgelopen vier weken op de vijf vaardigheden — snelheid, techniek, inzicht, mentaliteit, fysiek. Als er een duidelijke stijging of daling is, springt die eruit. Ik heb met Danny afgestemd dat we alleen de trends tonen, niet de ruwe cijfers. Ouders hebben baat bij overzicht, niet bij datagraven.</p><p>Daaronder staat een kort tekstblok van de trainer. Geen standaardzinnen. De trainer typt zelf wat er die week is geoefend en hoe je kind het deed. Soms staat er een tip bij, zoals ''probeer thuis eens 10 minuten te kaatsen tegen de muur.'' Die tips zijn goud waard, want ze geven je als ouder houvast. Je kunt je kind helpen zonder dat je zelf een trainer bent.</p><p>Als laatste zie je eventueel een nieuw radardiagram. Het radardiagram wordt niet elke week opnieuw gemeten — dat zou te veel druk geven. Gemiddeld één keer per maand maakt de trainer een nieuwe beoordeling. Bij elke nieuwe beoordeling verschijnt het bijgewerkte diagram in de rapportage. Zo kun je maand-over-maand zien of je kind groeit.</p><h3>Waarom wekelijks en niet maandelijks?</h3><p>Veel clubs werken met periodieke evaluaties, één keer per kwartaal of half jaar. Dat vond ik altijd te traag. In vier maanden kan er veel gebeuren — zowel positief als negatief. Een dipje in motivatie zie je pas maanden later terug in de cijfers. Dan kun je niet meer bijsturen. Wekelijkse updates voorkomen dat. Als een trainer ziet dat een kind twee weken achter elkaar minder scoort op inzet, kan hij daar direct op reageren. En jij als ouder ziet het ook.</p><p>Samen kun je het gesprek aangaan: ''Hé, ik zie dat training wat minder gaat. Merk je dat zelf ook?'' Die gesprekken zijn veel waardevoller als ze gebaseerd zijn op data, niet op onderbuikgevoel. Ik merk aan mezelf dat ik ook eerder geneigd ben om iets te zeggen als ik het zwart-op-wit zie, dan als ik alleen een vaag gevoel heb.</p><h3>Kun je ook meldingen krijgen?</h3><p>Ja. In de instellingen van het ouderportaal kun je aangeven of je een melding wilt bij nieuwe rapportages. Dat gaat via e-mail of een pushmelding in de browser. Ik raad het aan — dan hoef je er niet elke dag aan te denken. Je krijgt een seintje, logt even in, en bent op de hoogte. De meldingen zijn overigens niet spammerig. Maximaal één per week, tenzij er iets bijzonders is. We hebben geen belang bij dagelijkse notificaties — wij willen dat je Skillkaart gebruikt wanneer het nuttig is, niet omdat het moet.</p><h3>Wat als je een maand overslaat?</h3><p>Geen ramp. Het dashboard onthoudt alles. Als je een maand niet inlogt, zie je bij binnenkomst direct wat je hebt gemist. De grafieken worden gewoon doorgetrokken. Skillkaart is er om jou te helpen, niet om je te controleren. Ik snap heus dat ouders het druk hebben. Het is juist de bedoeling dat je het gebruikt wanneer het jou uitkomt, niet wanneer wij het willen.</p><p><em>Benieuwd naar hoe veilig al deze gegevens zijn? Lees dan <a href="/blog/hoe-veilig-zijn-de-gegevens-van-mijn-kind">hoe veilig zijn de gegevens van mijn kind</a>.</em></p>

<p>Als je vragen hebt over de veiligheid, het dashboard, of iets anders: stuur me gerust een bericht. Ik beantwoord elke mail zelf — geen chatbot, geen doorschakeling naar een supportteam. Het is mijn platform, mijn verantwoordelijkheid, en ik neem de tijd om uit te leggen hoe het werkt. Dat vind ik normaal, maar blijkbaar is het in de SaaS-wereld een uitzondering.</p>
<p>Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik beloof je binnen 24 uur antwoord.</p>

<p>Meer informatie over privacy en kindergegevens vind je op <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="nofollow">de site van de Autoriteit Persoonsgegevens</a>.</p>',
  NULL,
  'ouder',
  'Wekelijkse Skillkaart rapportage voor ouders',
  'Elke week een overzicht in het ouderportaal. Met grafiek, trainer-tekst en radardiagram. Wekelijks inzicht is beter dan maandelijkse verrassingen.',
  ARRAY['skillkaart ouder rapportage','skillkaart wekelijkse update','voortgang kind'],
  'Vincent van Munster',
  'published',
  '2026-04-01T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoe veilig zijn de gegevens van mijn kind?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'hoe-veilig-zijn-de-gegevens-van-mijn-kind',
  'Hoe veilig zijn de gegevens van mijn kind?',
  'Wij nemen privacy serieus. Gegevens worden versleuteld opgeslagen, nooit gedeeld met derden, en voldoen aan de AVG. Ik leg uit hoe het zit.',
  '<h2>AVG, encryptie, en een simpele belofte</h2><p>Dit is de vraag die ik het vaakst krijg van ouders. En terecht. Je geeft de gegevens van je kind aan een platform. Dat moet je kunnen vertrouwen. Laat ik helder zijn: wij verkopen geen data, wij delen geen data, en wij bewaren geen data langer dan nodig. Punt. Ik neem dit zelf ook heel serieus — mijn eigen kinderen gebruiken Skillkaart, dus ik wil precies dezelfde garanties als jij.</p><p>Skillkaart is gebouwd met privacy by design. Dat betekent dat privacy niet achteraf is toegevoegd, maar vanaf dag één in de architectuur zit. Danny en ik hebben bewust gekozen voor een Nederlandse hostingprovider, met servers in Nederland. Geen AWS in Ierland of Frankfurt, maar gewoon Nederlandse datacenters die voldoen aan de strengste Europese normen. Het kost misschien iets meer, maar het is het waard.</p><h3>Welke gegevens slaan we op?</h3><p>Alleen wat nodig is om Skillkaart te laten werken. Dat zijn: naam en leeftijd van je kind (voor het profiel en de leeftijdscategorie), een gebruikersnaam en gehasht wachtwoord, trainingsbeoordelingen (de radardiagrammen en scores), XP en level (het gamesysteem), en huiswerkopdrachten en of ze zijn gemaakt. Meer niet.</p><p>We slaan geen locatiegegevens op, geen telefoonnummers (tenzij je die zelf invult), geen adressen, en geen foto''s van je kind. De avatar in het dashboard is een getekend icoontje, geen echte foto. Ik vond het belangrijk dat kinderen niet herleidbaar zijn op basis van hun profiel. Een getekend icoontje is leuker én veiliger.</p><h3>Hoe zit het met delen met derden?</h3><p>We delen niets. Geen data naar adverteerders, geen data naar onderzoeksbureaus, geen data naar ''partners''. We hebben geen advertentiemodel. We verdienen geld doordat clubs en bonden een licentie nemen. Dat is alles. Ik wil niet de schijn wekken dat we ooit data gaan verkopen — dat gebeurt niet, punt.</p><p>De enige mensen die de gegevens van je kind kunnen zien, zijn: jijzelf, je kind (alleen het eigen dashboard), de trainer, en eventueel de jeugdcoördinator van de club. Verder niemand. Niet Danny, niet ik, niet een stagiair die per ongeluk in de database kijkt. Alleen de direct betrokkenen bij de club. Wij hebben als platformbeheerders geen toegang tot individuele spelersgegevens.</p><h3>Encryptie en wachtwoorden</h3><p>Alle gegevens worden versleuteld opgeslagen. Het wachtwoord dat je kiest, slaan we nooit op in leesbare vorm — alleen een zogeheten hash. Zelfs als iemand de database zou weten te bemachtigen, kan die er niks mee. De verbinding tussen jouw browser en onze server loopt standaard via HTTPS — dezelfde beveiliging die banken gebruiken.</p><p>Ik merk dat veel ouders opgelucht ademhalen als ik dit uitleg. Het klinkt misschien technisch, maar de boodschap is simpel: we doen wat nodig is om veilig te zijn, en niet meer dan dat.</p><h3>Wat als je stopt met Skillkaart?</h3><p>Dan verwijderen we alle gegevens binnen dertig dagen. Geen restjes in backups, geen sluimerende profielen. Je kunt dit zelf aanvragen via het ouderportaal, of de club doet het voor je. We sturen een bevestiging zodra alles is gewist. Ik weet dat sommige platforms het moeilijk maken om gegevens te verwijderen. Dat doen wij niet. Jouw gegevens zijn van jou. Als je weggaat, gaan ze mee — of worden ze vernietigd.</p><h3>Heb je nog vragen over veiligheid?</h3><p>Ik snap dat dit veel informatie is. Privacy is een onderwerp waar je niet te makkelijk over moet denken. Ik nodig je uit om kritisch te blijven. Als er iets niet duidelijk is, of als je een functie mist die je veiliger zou maken, laat het me weten. Skillkaart groeit nog steeds, en veel van de beste ideeën komen van ouders. We hebben bijvoorbeeld de optie om tweestapsverificatie in te schakelen toegevoegd op verzoek van een ouder die in de IT werkt. Dus jouw feedback telt.</p><h3>Altijd een vraag?</h3><p>Neem contact op. Ik beantwoord privacyvragen zelf, niet een chatbot. Stuur een mail naar <a href="mailto:vincent@skillkaart.nl">vincent@skillkaart.nl</a> en je krijgt antwoord van mij, binnen een werkdag. Geen standaardbeleidsteksten, gewoon duidelijkheid.</p><p><em>Wil je weten hoe de wekelijkse rapportage eruitziet? Lees <a href="/blog/ontvang-ik-als-ouder-wekelijkse-rapportages">ontvang ik als ouder wekelijkse updates</a>.</em></p>
<p>Meer informatie over privacy en kindergegevens vind je op <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="nofollow">de site van de Autoriteit Persoonsgegevens</a>.</p>',
  NULL,
  'ouder',
  'Skillkaart privacy en veiligheid voor kinderen',
  'AVG-proof, versleutelde opslag, geen verkoop van data. Lees hoe Skillkaart de gegevens van jouw kind veilig houdt. Door Vincent van Munster.',
  ARRAY['skillkaart veiligheid','skillkaart privacy kind','avg voetbal'],
  'Vincent van Munster',
  'published',
  '2026-05-06T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoe log ik in op Skillkaart met mijn pincode?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'hoe-log-ik-in-op-skillkaart-met-mijn-pincode',
  'Hoe log ik in op Skillkaart met mijn pincode?',
  'Inloggen met een pincode is supersimpel. Geen lange wachtwoorden typen. Ik leg uit hoe het werkt en wat je moet onthouden.',
  '<h2>Geen wachtwoord, maar een pincode die jij kiest</h2><p>Wachtwoorden zijn stom. Zeker als je tien bent en je moet iets onthouden als ''VoetbAl2026!''. Daarom heeft Skillkaart een pincode. Vier cijfers, net als van je telefoon. Makkelijk te onthouden, moeilijk te raden als je het goed kiest. Toen ik dit bedacht, was Danny eerst sceptisch — hij dacht dat vier cijfers niet veilig genoeg zou zijn. Maar ik legde uit dat het voor kinderen niet om militaire beveiliging gaat, maar om toegankelijkheid. En hij moest toegeven dat ik gelijk had.</p><p>Hoe werkt dat precies? Laat me het stap voor stap uitleggen.</p><h3>Stap 1: je krijgt een inlognaam van de trainer</h3><p>De trainer of jeugdcoördinator maakt een account voor jou aan. Je krijgt dan een gebruikersnaam. Dat is simpel: vaak je voorletter en achternaam, of je roepnaam. Nergens een rare code. Gewoon iets dat jij herkent. Soms krijg je een papiertje mee van de training met je inlognaam erop. Geen paniek als je het kwijtraakt — de trainer kan hem altijd opnieuw geven. Of je vraagt het aan je ouders, die zien het ook in hun dashboard.</p><h3>Stap 2: ga naar skillkaart.nl/inloggen</h3><p>Open je browser. Dat mag op een telefoon, een tablet, een laptop, of de computer van je moeder. Typ in de adresbalk: skillkaart.nl/inloggen. Klik daarna op ''Inloggen als speler''. Je ziet dan twee vakjes. Eentje voor je gebruikersnaam, eentje voor je pincode. Typ je gebruikersnaam in, daarna je pincode, en klik op de knop. Klaar. Je bent binnen. Ik heb het expres zo simpel mogelijk gehouden — geen captcha''s, geen extra bevestigingen. Gewoon inloggen en spelen.</p><h3>Stap 3: kies je eigen pincode</h3><p>De eerste keer dat je inlogt, moet je zelf een pincode kiezen. Kies iets dat je niet vergeet. Bijvoorbeeld de dag van je verjaardag? Nee, dat raden anderen te makkelijk. Kies liever iets geks. De laatste vier cijfers van het shirt van je favoriete speler. Of het getal van je geluksdag. Wat je kiest: onthoud het goed. Er is geen ''wachtwoord vergeten''-knop voor spelers. Als je je pincode kwijt bent, moet de trainer een nieuwe voor je aanmaken. Dat is even een gedoe, dus beter om het te onthouden.</p><h3>Waarom een pincode en geen wachtwoord?</h3><p>Goeie vraag. Omdat een pincode sneller is. Jij wil niet elke keer een half verhaal typen om even te kijken of je nieuwe XP hebt. Vier cijfers intoetsen en je bent er. Het voelt ook minder streng. Een wachtwoord voelt alsof je een bankrekening opent. Een pincode voelt als een spelletje starten. Danny maakte de grap: ''als we kinderen een wachtwoord laten kiezen, zetten ze er allemaal ''1234'' van.'' Nou, met een pincode kunnen ze dat ook doen, maar we waarschuwen ze. Het systeem geeft een seintje als de pincode te makkelijk is. ''Weet je het zeker?'' staat er dan. En dan denken ze vaak nog even na.</p><p>Het leuke is dat spelers hun pincode vaak veel beter onthouden dan volwassenen hun wachtwoorden. Omdat het hun eigen keuze is. Zelfbedacht, zelf onthouden. Dat werkt gewoon beter voor kinderen.</p><h3>Trouble? Geen probleem</h3><p>Als het niet lukt om in te loggen: check of je gebruikersnaam goed is. Hoofdlettergevoelig is het niet, dus ''Vincent'' en ''vincent'' werken allebei. Check of je de juiste pincode typt. Soms heb je per ongeluk je telefoon-pincode ingetypt in plaats van je Skillkaart-pincode. Ja, dat gebeurt vaker dan je denkt. Ook ik heb mezelf er wel eens op betrapt.</p><p>Lukt het nog niet? Vraag het aan je trainer of je ouders. Zij kunnen altijd helpen. Of stuur een berichtje via de club — wij hebben geen aparte klantenservice voor spelers, maar je trainer kan altijd bij ons terecht.</p><p><em>Ben je eenmaal ingelogd? Lees dan <a href="/blog/wat-betekenen-de-radardiagrammen">wat de radardiagrammen betekenen</a>, dat is het coolste onderdeel van Skillkaart.</em></p>

<p>Als je vragen hebt over de veiligheid, het dashboard, of iets anders: stuur me gerust een bericht. Ik beantwoord elke mail zelf — geen chatbot, geen doorschakeling naar een supportteam. Het is mijn platform, mijn verantwoordelijkheid, en ik neem de tijd om uit te leggen hoe het werkt. Dat vind ik normaal, maar blijkbaar is het in de SaaS-wereld een uitzondering.</p>
<p>Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik beloof je binnen 24 uur antwoord.</p>
',
  NULL,
  'speler',
  'Skillkaart pincode inloggen voor spelers',
  'Inloggen met een 4-cijferige pincode. Geen gedoe met wachtwoorden. Stap-voor-stap uitleg voor jonge voetballers.',
  ARRAY['skillkaart pin inloggen','skillkaart inloggen kind','skillkaart speler'],
  'Vincent van Munster',
  'published',
  '2026-01-08T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Wat betekenen de radardiagrammen en hoe lees ik ze?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'wat-betekenen-de-radardiagrammen',
  'Wat betekenen de radardiagrammen en hoe lees ik ze?',
  'Een spinnekopgrafiek met vijf punten. Klinkt moeilijk, is heel simpel. Ik leg uit hoe je jouw radardiagram leest.',
  '<h2>Vijf punten die alles zeggen over jouw spel</h2><p>Stel je een spinneweb voor. Maar dan eentje die laat zien hoe goed jij bent in vijf dingen die belangrijk zijn in voetbal. Dat is het radardiagram. Of zoals sommige trainers zeggen: de spinnekopgrafiek. Klinkt eng? Valt mee. Het is het leukste deel van Skillkaart, vind ik zelf ook. Toen ik het voor het eerst aan mijn eigen kinderen liet zien, waren ze meteen verkocht.</p><p>Als je inlogt, staat hij vaak bovenaan jouw dashboard. Een gekleurde vorm met vijf punten. Hoe groter de vorm, hoe beter je scoort. Elke punt is een skill die je trainer bij jou beoordeelt.</p><h3>De vijf skills: snelheid, techniek, inzicht, mentaliteit, fysiek</h3><p>Laten we ze stuk voor stuk langsgaan. <strong>Snelheid</strong> — dit gaat niet alleen over hard rennen. Het gaat ook over hoe snel je reageert. Een bal die opeens jouw kant op komt: hoe snel ben jij dan? En hoe snel schakel je van aanvallen naar verdedigen? <strong>Techniek</strong> — dit is hoe goed jij de bal onder controle hebt. Passen, dribbelen, aannemen. Overal waar de bal bij komt kijken. Ben je technisch sterk, dan verlies je de bal niet snel.</p><p><strong>Inzicht</strong> — het brein achter het spel. Zie jij waar de ruimte ligt? Speel je de bal op het juiste moment? Inzicht is het verschil tussen een goede en een slimme speler. <strong>Mentaliteit</strong> — hoe ga je om met tegenslag? Blijf je doorgaan als je verliest? Moedig je teamgenoten aan? Mentaliteit is de motor van alles. <strong>Fysiek</strong> — kracht, conditie, lenigheid. Kun je een hele wedstrijd volhouden? Ben je sterk genoeg om een verdediger van je af te houden?</p><p>Ik heb deze vijf niet zomaar gekozen. Danny en ik hebben maanden gepraat met trainers, jeugdcoördinatoren en sportwetenschappers om te bepalen wat echt de kern is van een voetballer. Dit zijn ze.</p><h3>Hoe lees je het diagram?</h3><p>Stel je een ster voor die van binnenuit wordt opgevuld. Hoe verder een punt naar buiten steekt, hoe hoger jouw score op die skill. Het midden is een 1, de buitenste rand is een 10. Heb je een punt die ver naar buiten steekt bij ''techniek''? Dan ben je technisch sterk. Zit ''fysiek'' dicht bij het midden? Dan weet je waar je aan kunt werken.</p><p>Het mooiste vind ik: je ziet in één oogopslag waar je goed in bent en wat beter kan. Geen lijstje met cijfers, geen gedoe. Gewoon een vorm die jouw unieke profiel laat zien. Elke speler heeft een andere vorm. Er is geen ''perfecte'' ster. Iedereen is anders. En dat is precies de bedoeling.</p><h3>Waarom vijf assen en niet tien?</h3><p>Omdat meer niet altijd beter is. We hebben lang nagedacht over hoeveel vaardigheden we zouden meten. Te weinig, dan mis je dingen. Te veel, dan wordt het onoverzichtelijk. Vijf is precies goed. Het dwingt trainers om te kiezen wat écht belangrijk is. En het dwingt jou om te focussen op de hoofdzaak. Toen we het testten met een paar jeugdteams, zeiden spelers: ''Eindelijk snap ik waar ik goed in ben.'' Dat was het moment waarop ik wist dat we het goed hadden gedaan.</p><h3>Kan ik mijn diagram verbeteren?</h3><p>Ja! Daar draait het om. De trainer beoordeelt je niet elke dag, maar wel regelmatig. Bij elke nieuwe beoordeling zie je of je vooruit bent gegaan. Vaker trainen, beter opletten tijdens de les, en huiswerkopdrachten doen — alles helpt om je punten te laten groeien. En het grappige: als je aan één skill werkt, trekt een andere soms ook mee. Harder trainen (fysiek) maakt je vaak ook sneller. Beter opletten (mentaliteit) helpt bij inzicht. Alles hangt samen. Het zijn net dominostenen: duw er één om, en de rest volgt.</p><p><em>Wil je weten hoe je XP verdient om te stijgen in level? Lees dan <a href="/blog/hoe-verdien-ik-xp-en-stijg-ik-in-level">hoe verdien ik XP en stijg ik in level</a>.</em></p>

<p>Als je vragen hebt over de veiligheid, het dashboard, of iets anders: stuur me gerust een bericht. Ik beantwoord elke mail zelf — geen chatbot, geen doorschakeling naar een supportteam. Het is mijn platform, mijn verantwoordelijkheid, en ik neem de tijd om uit te leggen hoe het werkt. Dat vind ik normaal, maar blijkbaar is het in de SaaS-wereld een uitzondering.</p>
<p>Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik beloof je binnen 24 uur antwoord.</p>
',
  NULL,
  'speler',
  'Radardiagram Skillkaart uitleg voor spelers',
  'Wat betekenen de vijf punten in jouw radardiagram? Snelheid, techniek, inzicht, mentaliteit en fysiek uitgelegd voor jonge voetballers.',
  ARRAY['skillkaart radardiagram','skillkaart uitleg','voetbal skills diagram'],
  'Vincent van Munster',
  'published',
  '2026-02-11T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Hoe verdien ik XP en stijg ik in level?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'hoe-verdien-ik-xp-en-stijg-ik-in-level',
  'Hoe verdien ik XP en stijg ik in level?',
  'XP verdienen in Skillkaart werkt als in een game. Training, opdrachten en inzet leveren punten op. Ik vertel hoe jij het snelst stijgt.',
  '<h2>Net als in je favoriete game, maar dan in het echt</h2><p>Iedereen kent het gevoel. Je speelt een game, je verslaat een vijand, en boem — XP. Een balkje loopt vol, je stijgt een level. Skillkaart werkt precies zo. Alleen versla jij geen draken, maar verbeter jij je voetbal-skills. Toen ik dit systeem ontwierp, zei Danny: ''Straks willen ze alleen maar XP en vergeten ze het echte voetbal.'' Maar het tegendeel is gebeurd: XP is juist de reden dat kinderen blijven trainen.</p><p>XP staat voor ervaringspunten. Hoe meer XP, hoe hoger jouw level. En hoe hoger jouw level, hoe meer dingen er vrijkomen. Nieuwe badges, coole kleuren bij je naam, en meer respect van je teamgenoten. Klinkt goed, toch? Zo verdien je ze.</p><h3>Dit levert XP op</h3><p><strong>Aanwezig zijn op training</strong> — elke training waar je bent, telt. Je krijgt XP gewoon voor het komen opdagen. Niet omdat we makkelijk zijn, maar omdat komen opdagen de basis is. Als je er niet bent, kun je ook niet beter worden. <strong>Huiswerkopdrachten maken</strong> — de trainer zet soms opdrachten klaar. Bal tegen de muur kaatsen, een bepaald aantal push-ups oefeningen. Maak je ze? Dan krijg je extra XP. En de trainer ziet dat je het hebt gedaan.</p><p><strong>Goede beoordelingen van de trainer</strong> — tijdens de training kijkt de trainer hoe je speelt. Scoor je hoog op inzet, techniek of inzicht? Dan krijg je daar XP voor. Hoe beter de beoordeling, hoe meer XP. <strong>Wedstrijden spelen</strong> — ook wedstrijden tellen mee. Niet alleen of je wint, maar hoe je speelt. Heb je een goeie wedstrijd? Dan kan de trainer je extra XP geven.</p><h3>Hoeveel XP heb je nodig?</h3><p>Level 1 naar level 2 is makkelijk. Een paar trainingen en een opdracht en je bent er. Daarna wordt het steeds een beetje moeilijker. Level 3 vraagt meer XP dan level 2. En level 10? Dat is voor de echte doorzetters. Maar hey, hoe hoger het level, hoe cooler de badge. In je dashboard zie je een balk die aangeeft hoe ver je bent. Staat hij bijna vol? Tijd om even extra je best te doen op de training. Wie weet stijg je morgen al.</p><h3>Levels zijn niet alles</h3><p>Belangrijk om te weten: levels zeggen niet dat jij ''beter'' bent dan een ander. Ze zeggen dat jij hard hebt gewerkt. Een level 5-speler die nooit traint, blijft level 5. Een level 3-speler die elke week XP pakt, is harder aan het werk. Levels belonen inzet, niet alleen talent. Danny zei laatst: ''Een level is een dagboek, geen rapport.'' Hij heeft gelijk. Het laat zien wat jij hebt gedaan, niet hoe goed je bent vergeleken met iemand anders. Ik ben het daar helemaal mee eens.</p><h3>Tips om sneller XP te pakken</h3><p>Ten eerste: wees consistent. Elke week een beetje XP is beter dan één keer heel veel en dan drie weken niks. Ten tweede: doe je huiswerkopdrachten. Die zijn vaak makkelijk en leveren veel XP op. Ten derde: vraag je trainer om feedback. ''Wat kan ik doen om beter te worden?'' Trainers geven graag tips, en als je die opvolgt, scoor je hoger bij de volgende beoordeling.</p><p>En het geheim? Plezier hebben. Spelers die genieten van training, presteren beter. Ze letten beter op, ze doen meer hun best, en ze krijgen betere beoordelingen. Het klinkt misschien suf, maar het is waar. Ik zie het elke week bij de clubs die Skillkaart gebruiken. Onthoud: het gaat niet om hoe snel je stijgt, maar dat je blijft stijgen. Elke training is een kans om een stapje dichterbij te komen. Ook als het een keer tegenzit.</p><p><em>Wil je meer weten over die huiswerkopdrachten? Lees dan <a href="/blog/wat-zijn-huiswerkopdrachten-en-hoe-doe-ik-ze">wat zijn huiswerkopdrachten en hoe doe ik ze</a>.</em></p>

<p>Als je vragen hebt over de veiligheid, het dashboard, of iets anders: stuur me gerust een bericht. Ik beantwoord elke mail zelf — geen chatbot, geen doorschakeling naar een supportteam. Het is mijn platform, mijn verantwoordelijkheid, en ik neem de tijd om uit te leggen hoe het werkt. Dat vind ik normaal, maar blijkbaar is het in de SaaS-wereld een uitzondering.</p>
<p>Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik beloof je binnen 24 uur antwoord.</p>
',
  NULL,
  'speler',
  'XP verdienen en level stijgen in Skillkaart',
  'Hoe verdien je XP in Skillkaart? Training, opdrachten en inzet leveren punten. Lees hoe jij het snelst stijgt in level. Uitleg voor spelers.',
  ARRAY['skillkaart xp','skillkaart level','skillkaart ervaringspunten'],
  'Vincent van Munster',
  'published',
  '2026-03-18T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Wat zijn huiswerkopdrachten en hoe doe ik ze?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'wat-zijn-huiswerkopdrachten-en-hoe-doe-ik-ze',
  'Wat zijn huiswerkopdrachten en hoe doe ik ze?',
  'Huiswerk voor voetbal. Klinkt raar, maar het zijn de leukste oefeningen die je thuis kunt doen. Ik vertel hoe het werkt en wat je nodig hebt.',
  '<h2>Huiswerk dat je wél leuk vindt</h2><p>Huiswerk. Het woord alleen al klinkt saai. Rekenen, taal, topografie — bah. Maar voetbal-huiswerk? Dat is anders. Geen schriften, geen boeken, geen juf die voor de klas staat. Gewoon jij, een bal, en een opdracht van je trainer. Toen ik dit voor het eerst aan een groepje spelers uitlegde, zeiden ze: ''Dus we krijgen strafwerk?'' Nee, zeiden ik, jullie krijgen uitdagingen. En zodra ze snapten dat er XP te verdienen viel, waren ze om.</p><p>In Skillkaart kunnen trainers opdrachten klaarzetten speciaal voor jou. Het heet ''huiswerk'', maar het voelt meer als een missie die je thuis kunt doen om beter te worden.</p><h3>Hoe zie je een huiswerkopdracht?</h3><p>Als je inlogt op Skillkaart, zie je in je dashboard een apart blok met ''Huiswerk''. Daar staan alle opdrachten die voor jou klaarstaan. Je ziet de titel, een korte uitleg, en een datum. Soms zit er een filmpje bij van de trainer die de oefening voordoet. Handig, want dan weet je precies hoe het moet. Het kan ook dat de trainer een reeks opdrachten klaarzet. ''Deze maand werken we aan balcontrole.'' Dan krijg je elke week een nieuwe oefening die daarbij past.</p><h3>Wat voor opdrachten krijg je?</h3><p>Dat hangt af van waar jij aan werkt. Voorbeelden? ''Kaats de bal 50 keer tegen de muur met je linkervoet.'' Simpel, maar effectief voor techniek. ''Doe 3 keer 10 push-ups en 3 keer 10 squats.'' Voor fysiek. ''Kijk een wedstrijd van je favoriete club en let op hoe de verdediger staat.'' Voor inzicht. ''Leg op een papiertje drie doelen voor deze week.'' Voor mentaliteit.</p><p>Niet elke opdracht is even moeilijk. Soms is het iets kleins dat je in vijf minuten doet. Soms is het een echte uitdaging voor een hele week. Trainers weten wat bij jou past. En als je een opdracht te makkelijk vindt? Zeg het tegen je trainer. Dan maakt hij de volgende moeilijker.</p><h3>Hoe lever je het in?</h3><p>Heel simpel: nadat je de opdracht hebt gedaan, log je in en klik je op ''Klaar!'' of ''Afgerond''. Meer is het niet. Geen video uploaden, geen foto maken, geen bureaucratie. Jij zegt dat je het hebt gedaan, en de trainer ziet dat. Sommige trainers vragen om een korte reactie. ''Hoe ging het?'' Dan typ je in een paar woorden of het makkelijk of moeilijk was. Daar leert de trainer van — hij weet dan of de oefening te makkelijk of te moeilijk was voor de volgende keer.</p><h3>Waarom zou je het doen?</h3><p>Drie redenen. Eén: je krijgt XP. Veel XP. Huiswerkopdrachten leveren vaak meer XP op dan een gewone training. Twee: je wordt écht beter. Spelers die thuis oefenen, gaan sneller vooruit dan spelers die alleen op training komen. Drie: de trainer ziet dat je gemotiveerd bent. En gemotiveerde spelers krijgen meer kansen.</p><p>Ik ken een speler uit de E-pupillen die elke dag 10 minuten kaatste tegen de muur. Binnen twee maanden was hij de beste passer van het team. Zijn geheim? Elke dag even doen. Niet groots, niet ingewikkeld, gewoon doen. Het zijn die kleine stapjes die het verschil maken op de lange termijn.</p><h3>Wat als je het niet redt?</h3><p>Geen ramp. Opdrachten hebben een einddatum, maar als je een keer overslaat, gebeurt er niks. Geen straf, geen boze trainer. Alleen mis je de XP. De volgende keer weer een kans. Het moet leuk blijven, anders heeft het geen zin. Het is geen strafwerk, het is een kans om beter te worden. Jij bepaalt zelf hoe vaak en hoe veel je oefent. Sommige spelers doen één opdracht per week, anderen doen er drie. Allebei goed.</p><p><em>Meer weten over wat er gebeurt als je XP spaart? Lees <a href="/blog/hoe-verdien-ik-xp-en-stijg-ik-in-level">hoe verdien ik XP en stijg ik in level</a>.</em></p>

<p>Als je vragen hebt over de veiligheid, het dashboard, of iets anders: stuur me gerust een bericht. Ik beantwoord elke mail zelf — geen chatbot, geen doorschakeling naar een supportteam. Het is mijn platform, mijn verantwoordelijkheid, en ik neem de tijd om uit te leggen hoe het werkt. Dat vind ik normaal, maar blijkbaar is het in de SaaS-wereld een uitzondering.</p>
<p>Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik beloof je binnen 24 uur antwoord.</p>
',
  NULL,
  'speler',
  'Skillkaart huiswerkopdrachten uitleg',
  'Huiswerkopdrachten in Skillkaart: oefeningen van je trainer die je thuis doet. Kaatsen, push-ups, wedstrijden kijken. Zo werkt het voor spelers.',
  ARRAY['skillkaart huiswerk','skillkaart oefeningen','voetbal huiswerk'],
  'Vincent van Munster',
  'published',
  '2026-04-22T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();


-- Kan ik mijn Skillkaart-profielkaart delen?
INSERT INTO blog_posts (slug, title, excerpt, body, cover_image_url, category, meta_title, meta_description, keywords, author, status, published_at, seo_score)
VALUES (
  'kan-ik-mijn-skillkaart-profielkaart-delen',
  'Kan ik mijn Skillkaart-profielkaart delen?',
  'Ja, je kunt je profielkaart delen met vrienden, familie en scouts. Ik leg uit hoe het werkt en wat anderen wel en niet zien.',
  '<h2>Jouw voetbal-paspoort om te delen</h2><p>Stel je voor: je hebt een gave profielkaart met je level, je radardiagram, en je skills. Die wil je laten zien aan je vrienden. Aan je opa en oma. Misschien wel aan een scout van een grotere club. Kan dat? Ja. En ik heb het expres makkelijk gemaakt. Toen ik zelf jong was, had ik zoiets graag willen hebben — een kaart die liet zien waar ik goed in was, zonder dat ik er veel woorden aan vuil hoefde te maken.</p><p>Een profielkaart is een soort samenvatting van jouw Skillkaart. Geen volledig dashboard, maar een overzichtelijke kaart met de belangrijkste dingen: je naam, je level, je radardiagram en je XP. Alles wat jou laat zien als voetballer, in één plaatje. Het lijkt een beetje op een voetbalpaspoort. Scouts en trainers gebruiken het om snel te zien wat voor speler jij bent. Jij gebruikt het om te laten zien waar je trots op bent.</p><h3>Hoe deel je hem?</h3><p>In je dashboard zit een knop ''Deel profiel''. Als je daarop klikt, krijg je een speciale link. Die link kun je sturen naar wie je wilt. Via WhatsApp, via Instagram, via een berichtje. Of gewoon zeggen: ''Typ dit maar in je browser.'' Wat handig is: de link is leesbaar. Geen wirwar van letters en cijfers, maar zoiets als skillkaart.nl/p/vincent-m. Makkelijk om te onthouden en door te geven. Danny stelde voor om QR-codes toe te voegen, maar ik vond een link eerst beter — werkt op elk apparaat.</p><h3>Wat zien anderen?</h3><p>Dat is het belangrijkste. Anderen zien alleen wat jij wilt laten zien. Ze zien geen privégegevens. Geen adres, geen telefoonnummer, geen e-mailadres. Alleen je voetbalprofiel: je naam, je radardiagram, je level, en je XP. Ze zien niet of je huiswerk wel of niet is gemaakt. Ze zien niet wat je trainer in vertrouwen over jou heeft geschreven. Alleen de dingen die jij en de club oké vinden om te delen. Ook kunnen ze niks veranderen. Ze kunnen niet inloggen, geen scores aanpassen, geen XP verdienen. Het is alleen een kijkje.</p><h3>Waarom zou je delen?</h3><p>Om trots te zijn op wat je hebt bereikt. Dat is de belangrijkste reden. Je hebt hard gewerkt voor dat level. Je verdient het om het te laten zien. Het kan ook helpen als je bij een andere club wilt gaan spelen. Scouts of trainers kunnen snel zien wat je kan. Niet alleen of je wint in wedstrijden, maar wat je échte skills zijn. Dat is veel eerlijker dan alleen een scout die één wedstrijd ziet.</p><p>Sommige spelers delen hun kaart met opa en oma, die niet elke wedstrijd kunnen kijken. Dan zien ze toch hoe goed het gaat. Een moeder vertelde me dat haar schoonmoeder elke maand vraagt: ''Stuur je de nieuwe kaart?'' Dat zijn de dingen die ik het leukst vind om te horen. Skillkaart verbindt generaties rondom voetbal, zonder dat iemand erbij hoeft te zijn.</p><h3>Kun je stoppen met delen?</h3><p>Ja. Ook daar is een knop voor. ''Deel uit'' heet die. Als je hem uitzet, werkt de oude link niet meer. Iemand die hem opent, ziet dan een melding: ''Deze profielkaart is niet meer beschikbaar.'' Handig als je even geen zin hebt om te delen. Wil je hem later weer aanzetten? Kan gewoon. De link blijft hetzelfde. Je hoeft geen nieuwe te maken. Ook handig: je kunt de link sturen naar meerdere mensen tegelijk. Iedereen met de link kan de kaart zien, maar niemand kan er iets aanpassen. Jij hebt de controle. De link werkt zolang jij wilt dat hij werkt.</p><p><em>Vind je het leuk om te delen? Lees dan ook eens <a href="/blog/wat-betekenen-de-radardiagrammen">wat de radardiagrammen betekenen</a>, zodat je aan je vrienden kunt uitleggen waar ze naar kijken.</em></p>

<p>Als je vragen hebt over de veiligheid, het dashboard, of iets anders: stuur me gerust een bericht. Ik beantwoord elke mail zelf — geen chatbot, geen doorschakeling naar een supportteam. Het is mijn platform, mijn verantwoordelijkheid, en ik neem de tijd om uit te leggen hoe het werkt. Dat vind ik normaal, maar blijkbaar is het in de SaaS-wereld een uitzondering.</p>
<p>Mail me op <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a> en ik beloof je binnen 24 uur antwoord.</p>
',
  NULL,
  'speler',
  'Skillkaart profielkaart delen met vrienden',
  'Je Skillkaart-profielkaart delen met vrienden, familie of scouts. Leuk en veilig. Zo werkt het en dit zien anderen.',
  ARRAY['skillkaart profiel delen','skillkaart kaart delen','skillkaart vrienden'],
  'Vincent van Munster',
  'published',
  '2026-06-17T09:00:00Z'::timestamptz,
  95
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  body = EXCLUDED.body,
  category = EXCLUDED.category,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  keywords = EXCLUDED.keywords,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  seo_score = EXCLUDED.seo_score,
  updated_at = now();
