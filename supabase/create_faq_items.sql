-- FAQ-content tabel voor de server-rendered /faq pagina (api/faq-page.ts → faqRender.ts)
-- De /faq API leest hieruit; zonder deze tabel valt hij terug op een hard-coded
-- FALLBACK_FAQ in de code. Met deze tabel zijn de vragen beheerbaar vanuit SQL/DB.
--
-- Idempotent: draai gerust meerdere keren.

create table if not exists public.faq_items (
  id          text primary key,
  question    text not null,
  answer      text not null,           -- HTML (paragrafen, <strong>, <a>)
  category    text not null
              check (category in ('club','coach','ouder','speler')),
  sort_order  int  not null default 0,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Publiek leesbaar, alleen gepubliceerd. Geen write-policy: content wordt
-- vanuit deze migratie / handmatig in de Supabase editor beheerd.
alter table public.faq_items enable row level security;

drop policy if exists "faq_read_published" on public.faq_items;
create policy "faq_read_published"
  on public.faq_items for select
  using ( published = true );

-- ───────────────────────── SEED (20 vragen, Vincent's stem) ─────────────────────────
-- Dollar-quoting wordt gebruikt zodat HTML-quotes geen SQL-probleem zijn.

-- CLUB
insert into public.faq_items (id, question, answer, category, sort_order) values
('c1', 'Wat kost Skillkaart voor een voetbalclub?',
$$<p>Onze tarieven zijn bewust laag gehouden zodat elke amateurvereniging kan profiteren van datagedreven jeugdontwikkeling. Een los team start al vanaf <strong>€150 per jaar</strong> — dat is €12,50 per maand. Voor complete jeugdafdelingen lopen de pakketten op tot €750 per jaar voor onbeperkt teams, inclusief dedicated onboarding en custom branding.</p>
<p>Toen Danny en ik de prijsstructuur ontwierpen, was één ding leidend: de drempel moet weg. Geen dikke eenmalige licentiekosten, geen verborgen kosten per speler. Een helder jaarbedrag, opzegbaar per seizoen. Vergelijk het met de prijs van een paar trainingshesjes — alleen krijg je er een complete AI-gedreven skill tracking infrastructuur voor terug.</p>
<p>Bekijk alle pakketten op <a href="/#tarieven" style="color:#00FF9D;text-decoration:underline">onze tarievenpagina</a> of mail me direct op <a href="mailto:info@skillkaart.nl" style="color:#00FF9D;text-decoration:underline">info@skillkaart.nl</a> voor een vrijblijvende offerte op maat.</p>$$,
'club', 1)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('c2', 'Hoeveel teams kan ik toevoegen en beheren?',
$$<p>Dat hangt af van het pakket. Basis is voor 1 team — ideaal voor een enthousiaste trainer die wil proeven. Club S ondersteunt 2 tot 5 teams, Club M gaat tot 15 teams, en met Club L krijg je onbeperkt teams.</p>
<p>Vanuit mijn ervaring met het bouwen van platformen weet ik: schaalbaarheid gaat niet alleen over het aantal teams, maar over gebruiksgemak. Daarom heeft elk team zijn eigen coach-dashboard, maar zie je als technisch coördinator alle teams in één overzicht.</p>$$,
'club', 2)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('c3', 'Voldoet Skillkaart aan de AVG-privacywet voor jeugdspelers?',
$$<p>Absoluut. Privacy is geen bijzaak in mijn werk — het is een ontwerpvoorwaarde. Al mijn platformen zijn gebouwd met datzelfde principe: de gebruiker heeft controle, de data is veilig, en wetgeving is geen obstakel maar uitgangspunt.</p>
<p>Concreet: wij leveren bij elk abonnement een <strong>verwerkersovereenkomst</strong>. Het platform ondersteunt anonieme spelersnummers. Spelers loggen in met een eenvoudige PIN-code — geen e-mailadres, geen wachtwoord. Ouders krijgen alleen toegang via een beveiligde uitnodigingslink.</p>$$,
'club', 3)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('c4', 'Hoe start ik een pilot met Skillkaart in mijn club?',
$$<p>Door me gewoon een mailtje te sturen. Ik richt binnen 24 uur een demo-omgeving in met jullie teamnaam en dummy-spelers, zodat het jeugdbestuur en de trainers direct kunnen zien hoe het werkt op hun eigen telefoon. Geen praatje, geen salespitch — gewoon het product ervaren.</p>
<p>De aanpak: start met één team, één enthousiaste trainer. Laat die twee weken evalueren, kijk hoe de kids reageren op hun radardiagrammen, en laat de resultaten voor zich spreken.</p>$$,
'club', 4)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('c5', 'Kunnen we Skillkaart aanpassen met onze clubkleuren en ons logo?',
$$<p>Ja, dat is onderdeel van het Club L-pakket. We noemen dat custom branding, maar het is meer dan een likje verf. Spelers zien hun eigen Skillkaart in de huisstijl van de club — het voelt alsof de club zelf een professionele ontwikkelingsomgeving heeft gebouwd. Dat versterkt de clubtrots.</p>
<p>Voor de grotere clubs bouw ik desgewenst een witte-label variant die naadloos integreert met de clubwebsite.</p>$$,
'club', 5)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('c6', 'Wat is het verschil tussen Skillkaart, KNVB Rinus en VTON?',
$$<p>Een vraag die ik vaak krijg van technisch coördinatoren.</p>
<p><strong>KNVB Rinus</strong> is een fantastische bibliotheek met trainingsvormen en oefenstof. Maar het is een tool voor de <em>trainer</em> — gericht op het ontwerpen van trainingen, niet op het volgen van de individuele speler.</p>
<p><strong>VTON</strong> is een sociaal netwerk rondom voetbal, gericht op scouting en wedstrijdregistratie.</p>
<p><strong>Skillkaart</strong> vult een compleet ander gat: er is geen platform dat de <em>beleving van het kind</em> centraal stelt. Geen tool die een 9-jarige het gevoel geeft dat hij een eigen profdashboard heeft.</p>$$,
'club', 6)
on conflict (id) do nothing;

-- COACH
insert into public.faq_items (id, question, answer, category, sort_order) values
('co1', 'Hoeveel tijd kost een evaluatie op Skillkaart?',
$$<p>Minder dan twee minuten per speler. Dit is geen verkooppraatje — het is de realiteit van hoe we het gebouwd hebben.</p>
<p>Ik heb met Danny''s trainers talloze sessies gedaan om de interface zo strak mogelijk te krijgen. Het resultaat: een simpel scherm met 7 sliders voor de kernskills. Schuif, schuif, schuif, klaar. De AI genereert op basis van die sliders in seconden een motiverende, persoonlijke tekst.</p>
<p>Trainers zeggen: "Ik doe het nu tijdens het sinaasappelmoment na de training, ben in een kwartier door het hele team heen."</p>$$,
'coach', 1)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('co2', 'Hoe werkt de AI-feedback precies?',
$$<p>De techniek erachter is <strong>Google Gemini 2.5 Flash</strong> — een van de meest geavanceerde taalmodellen. Maar wat mij betreft is het interessantste niet de techniek, maar wat de trainer en speler eraan hebben.</p>
<p>Als jij als trainer de 7 sliders invult, stuurt Skillkaart die data samen met context (leeftijd, positie, eerdere scores) naar Gemini. De AI genereert: een <strong>persoonlijk compliment</strong>, een <strong>concreet verbeterpunt</strong> en een <strong>trainingssuggestie</strong>.</p>$$,
'coach', 2)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('co3', 'Wat zijn de 7 kernskills die Skillkaart meet?',
$$<p>Snelheid, passing, techniek, schot, verdedigen, inzicht en mentaliteit. Deze zeven komen rechtstreeks uit het <strong>UFA-voetbalcurriculum</strong> dat Danny en zijn UEFA-docenten hebben ontwikkeld.</p>
<p>Een trainer schuift een slider van 1 tot 10, en de data wordt verwerkt in een radardiagram dat het kind de volgende dag op zijn eigen dashboard ziet.</p>$$,
'coach', 3)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('co4', 'Kan ik als trainer trainingsplannen laten genereren?',
$$<p>Ja. De AI-module genereert op basis van evaluatiesuggesties een concreet trainingsplan voor een individuele speler of het hele team. Denk aan: een reeks oefeningen die aansluiten bij de zwakste skills, met video-voorbeelden en een tijdsindicatie.</p>
<p>Hoe vaker je evalueert, hoe beter de AI patronen herkent.</p>$$,
'coach', 4)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('co5', 'Werkt Skillkaart ook op mijn telefoon?',
$$<p>Ja, en dat is bewust de primaire interface. Ik heb het platform mobile-first gebouwd omdat vrijwillige trainers geen laptop meenemen naar de rand van het veld.</p>
<p>Skillkaart werkt in elke browser op elke telefoon, zonder app-installatie. Voor spelers is er een PWA die aan het homescreen kan worden toegevoegd, compleet met push-notificaties.</p>$$,
'coach', 5)
on conflict (id) do nothing;

-- OUDER
insert into public.faq_items (id, question, answer, category, sort_order) values
('o1', 'Hoe krijg ik als ouder toegang tot het dashboard van mijn kind?',
$$<p>De club stuurt je een beveiligde uitnodigingslink. Je klikt, maakt een account met je e-mailadres, en je bent gekoppeld aan de profielkaart van je kind. Vanaf dat moment zie je de radardiagrammen, de trends over tijd, en de wekelijkse feedback.</p>
<p>Ik heb bewust gekozen voor deze aanpak: de club beheert de uitnodigingen, niet wij.</p>$$,
'ouder', 1)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('o2', 'Wat ziet mijn kind in het Skillkaart-dashboard?',
$$<p>Iets waar ik zelf nog elke keer blij van word. Stel je voor: een eigen profvoetballer-kaart, compleet met een <strong>radardiagram</strong> dat laat zien hoe sterk je bent, een <strong>trendgrafiek</strong> die groei weergeeft, en een <strong>XP-systeem</strong> waarmee je levels kunt verdienen.</p>
<p>Het dashboard is read-only, dus kinderen kunnen niets per ongeluk wijzigen. Ze loggen in met een simpele 4-cijferige PIN.</p>$$,
'ouder', 2)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('o3', 'Ontvang ik als ouder wekelijkse updates of rapportages?',
$$<p>Zodra je kind een evaluatie heeft gekregen, krijg jij automatisch bericht via e-mail. Je kunt in je voorkeuren instellen of je een wekelijkse samenvatting wilt of alleen notificaties bij grote veranderingen.</p>
<p>"Hé, ik zie dat je trainer zegt dat je passing erop vooruit is gegaan — hoe vond je dat zelf?" Dat gesprek is waar het om draait.</p>$$,
'ouder', 3)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('o4', 'Hoe veilig zijn de gegevens van mijn kind?',
$$<p>Veiligheid is geen feature — het is de basis. Ik heb ruim 10 jaar in het sociaal domein gewerkt; ik weet wat er gebeurt als je niet zorgvuldig omgaat met persoonsgegevens.</p>
<p>Skillkaart slaat geen overbodige data op. Spelers gebruiken een PIN. Oudergegevens worden alleen gedeeld met de club. Alles is versleuteld, onderweg en in rust.</p>$$,
'ouder', 4)
on conflict (id) do nothing;

-- SPELER
insert into public.faq_items (id, question, answer, category, sort_order) values
('s1', 'Hoe log ik in op Skillkaart met mijn PIN-code?',
$$<p>Je trainer geeft je een geheime code van 4 cijfers. Ga naar <strong>skillkaart.nl</strong> op je telefoon, klik op "Speler inloggen", voer je code in — en je bent binnen. Geen e-mailadres, geen wachtwoord om te onthouden.</p>
<p>Daarna zie je meteen je eigen dashboard met een coole radardiagram, XP, en wat je trainer over je heeft gezegd.</p>$$,
'speler', 1)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('s2', 'Wat betekenen de radardiagrammen en hoe lees ik ze?',
$$<p>Stel je een spinnenweb voor met 7 punten. Elk punt staat voor een skill. Hoe groter het vlak dat wordt ingekleurd, hoe beter je scoort.</p>
<p>Het leukste is: als je over een paar weken weer kijkt, zie je of het vlak groter is geworden. Na een paar maanden zie je echt verschil.</p>$$,
'speler', 2)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('s3', 'Hoe verdien ik XP en stijg ik in level?',
$$<p>Elke keer dat je trainer je evalueert, verdien je XP — ervaringspunten, net als in een game. Hogere scores op skills geven meer XP. Maar ook huiswerkopdrachten en challenges leveren punten op.</p>
<p>Genoeg XP? Dan ga je naar een hoger level. Levels hebben coole namen zoals "Brons", "Zilver" of "Goud".</p>$$,
'speler', 3)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('s4', 'Wat zijn huiswerkopdrachten en hoe doe ik ze?',
$$<p>Soms geeft je trainer je een speciale opdracht om thuis te oefenen. Dat noemen we huiswerk, maar het is geen schoolhuiswerk — het zijn voetbaloefeningen! Bijvoorbeeld: "Doe 10 wandpassen tegen de muur". Vaak zit er een YouTube-filmpje bij.</p>
<p>In je dashboard zie je een lijstje met alle opdrachten. Heb je er een gedaan? Vink hem af. Je trainer ziet het, en jij krijgt XP.</p>$$,
'speler', 4)
on conflict (id) do nothing;

insert into public.faq_items (id, question, answer, category, sort_order) values
('s5', 'Kan ik mijn Skillkaart-profielkaart delen met vrienden of familie?',
$$<p>Ja! Je kunt je profielkaart delen met wie je wilt. Opa en oma, je beste vriend — ze kunnen zien wat voor gave kaart je hebt. Alleen de coole plaatjes hoor, niet de cijfers of feedback.</p>
<p>Overleg wel even met je ouders voordat je deelt. Het is jóuw Skillkaart, dus jij beslist.</p>$$,
'speler', 5)
on conflict (id) do nothing;
