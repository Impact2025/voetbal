-- Update het artikel over veiligheid van kindergegevens
-- Voer uit in Supabase SQL Editor
UPDATE blog_posts
SET
  title = 'Hoe veilig zijn de gegevens van mijn kind?',
  excerpt = 'Skillkaart neemt de privacy van je kind serieus. Versleuteling, AVG, wie heeft toegang en wat gebeurt er met data. Lees hoe het zit.',
  body = '<h2>Privacy is geen afvinklijstje, het is een belofte</h2>
<p>Dit is de vraag die ik het vaakst krijg van ouders. En terecht. Je geeft de gegevens van je kind aan een platform. Dat moet je kunnen vertrouwen. Laat ik helder zijn: Skillkaart verkoopt geen data, deelt geen data, en bewaart geen data langer dan nodig. Punt. Mijn eigen kinderen gebruiken Skillkaart, dus ik wil precies dezelfde garanties als jij.</p>
<p>Danny zei in een van de eerste gesprekken: ''Als ik het aan mijn eigen kinderen niet zou geven, geef ik het aan niemand.'' Daar hebben we alles op getoetst. Niet op wat mag van de wet, maar op wat goed voelt. En dat is een groot verschil.</p>

<h3>Welke gegevens slaan we op?</h3>
<p>Alleen wat nodig is om Skillkaart te laten werken. Dat is: naam en leeftijd van je kind (voor het profiel en de leeftijdscategorie), een gebruikersnaam en gehasht wachtwoord, trainingsbeoordelingen (de radardiagrammen en scores), XP en level, en of huiswerkopdrachten wel of niet zijn gemaakt. Meer niet. Geen locatie, geen telefoonnummer, geen foto''s. De avatar in het dashboard is een getekend icoontje, geen echte foto. Een getekend icoontje is leuker en veiliger.</p>

<h3>Hoe worden gegevens beschermd?</h3>
<p>We hebben Skillkaart gebouwd op Nederlandse servers. Geen AWS in Ierland of data in de VS — gewoon Nederlandse datacenters die voldoen aan de strengste Europese normen. Alle data wordt versleuteld opgeslagen, zowel onderweg (TLS/SSL) als op de server zelf (encryptie at rest). Dat betekent dat zelfs als iemand onverhoopt bij de ruwe data zou komen, die er niks mee kan.</p>
<p>Daarnaast werken we met gelaagde toegang. Een trainer ziet alleen zijn eigen team. Een coordinator ziet alle teams binnen de club. Jij als ouder ziet alleen je eigen kind. Niemand krijgt automatisch toegang tot data van anderen. Dat klinkt logisch, maar je zult verbaasd zijn hoeveel platformen het niet goed regelen. Ik kom uit de techwereld en ik heb het te vaak zien misgaan.</p>
<p>Meer over de technische kant lees je in <a href="/blog/skillkaart-avg-privacy-jeugdspelers">hoe Skillkaart voldoet aan de AVG voor jeugdspelers</a>.</p>

<h3>Wie heeft er toegang?</h3>
<p>De lijst is kort: jij (als ouder), je kind (via het kind-dashboard), de trainer van het team, en de jeugdcoordinator van de club. Dat is alles. Wij als Skillkaart hebben geen toegang tot de individuele data van spelers — wij beheren het platform, maar we kijken niet mee. En we delen met niemand. Geen adverteerders, geen onderzoeksbureaus, geen ''partners''. We hebben geen advertentiemodel. Clubs en bonden betalen een licentie voor het platform — daarmee verdienen we ons geld. Niet met jouw data.</p>
<p>Danny''s club <a href="https://www.ufa-utrecht.nl/" target="_blank" rel="nofollow">UFA</a> gebruikt Skillkaart voor al hun jeugdteams. Hij zou nooit meewerken aan een platform dat de privacy van zijn spelers niet serieus neemt. En terecht. Daarom heeft hij ook meegeholpen aan het ontwerp: alles wat overbodig was, moest eruit.</p>

<h3>Wat gebeurt er met data als je stopt?</h3>
<p>Stop je met Skillkaart? Dan verwijderen we alle data. Geen restjes, geen back-ups die nog ergens rondslingeren. Volledige verwijdering op verzoek. Je kunt dat aanvragen via de club of rechtstreeks bij mij. Ik regel het persoonlijk. Ook voor individuele spelers: als een speler overstapt naar een andere club, kan de data worden overgedragen — maar alleen als jij daar toestemming voor geeft. Standaard wordt niets gedeeld.</p>
<p>De <a href="https://www.knvb.nl/" target="_blank" rel="nofollow">KNVB</a> heeft richtlijnen voor omgaan met jeugddata in het voetbal. Wij volgen die niet alleen, we gaan er een stap in verder. Privacy by design betekent dat het in het systeem zit, niet dat het een optie is die je kunt aanzetten.</p>

<p>Heb je vragen over de veiligheid van jouw kind zijn of haar gegevens? Mail me gerust. Ik beantwoord elke mail zelf. Geen chatbot, geen doorschakeling. Gewoon ik, Vincent. <a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a>.</p>',
  meta_title = 'Skillkaart veiligheid: hoe veilig zijn de gegevens van je kind?',
  meta_description = 'Skillkaart beschermt de gegevens van je kind: encryptie, AVG, Nederlandse servers, geen dataverkoop. Lees wie toegang heeft en wat er met data gebeurt.',
  keywords = ARRAY['skillkaart veiligheid kind', 'skillkaart privacy', 'skillkaart avg jeugd', 'skillkaart data beveiliging', 'skillkaart kindergegevens'],
  seo_score = 95,
  updated_at = now()
WHERE slug = 'hoe-veilig-zijn-de-gegevens-van-mijn-kind';
