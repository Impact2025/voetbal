-- Corrigeert faq_items die al in de database staan (create_faq_items.sql gebruikt
-- "on conflict do nothing", dus die insert-fixes raken bestaande rijen niet aan).
-- Draai dit één keer in de Supabase SQL Editor. Idempotent — mag vaker draaien.
--
-- Aanleiding: FAQ-content beschreef een oudere productversie (7 skills i.p.v. 17,
-- 4-cijferige PIN i.p.v. 6, "account aanmaken" i.p.v. magic-link, evaluatie-trigger
-- i.p.v. huiswerk/video/challenge-trigger) en miste het seizoenstrainingsprogramma
-- volledig. Deze content voedt de AI-supportagent, dus foute antwoorden hier komen
-- direct bij coaches/ouders/spelers terecht.

update public.faq_items set answer =
$$<p>Minder dan twee minuten per speler. Dit is geen verkooppraatje — het is de realiteit van hoe we het gebouwd hebben.</p>
<p>Ik heb met Danny''s trainers talloze sessies gedaan om de interface zo strak mogelijk te krijgen. Het resultaat: een simpel scherm met sliders voor <strong>17 skills</strong>, verdeeld over drie groepen (Techniek, Fysiek, Mentaliteit). Schuif, schuif, schuif, klaar. De AI genereert op basis daarvan in seconden een motiverende, persoonlijke tekst.</p>
<p>Trainers zeggen: "Ik doe het nu tijdens het sinaasappelmoment na de training, ben in een kwartier door het hele team heen."</p>$$
where id = 'co1';

update public.faq_items set answer =
$$<p>De techniek erachter is <strong>Google Gemini 2.5 Flash</strong> — een van de meest geavanceerde taalmodellen. Maar wat mij betreft is het interessantste niet de techniek, maar wat de trainer en speler eraan hebben.</p>
<p>Als jij als trainer de sliders invult, stuurt Skillkaart die data samen met context (leeftijd, positie, eerdere scores) naar Gemini. De AI genereert: een <strong>persoonlijk compliment</strong>, een <strong>concreet verbeterpunt</strong> en een <strong>trainingssuggestie</strong>.</p>$$
where id = 'co2';

update public.faq_items set
  question = 'Welke skills meet Skillkaart precies?',
  answer =
$$<p>17 skills, verdeeld over drie groepen: <strong>Techniek</strong> (rechterbeen, linkerbeen, aannemen, passen, passeerbewegingen, scoren, 1v1 aanvallend, 1v1 verdedigen), <strong>Fysiek</strong> (snelheid, wendbaarheid, duelkracht) en <strong>Mentaliteit</strong> (trainingsmentaliteit, wedstrijdmentaliteit, leiderschap, concentratie, discipline, aanwezigheid).</p>
<p>Een trainer schuift per skill een slider van 1 tot 10, en de data wordt verwerkt in een radardiagram dat het kind de volgende dag op zijn eigen dashboard ziet.</p>$$
where id = 'co3';

update public.faq_items set answer =
$$<p>De coach of club stuurt je een beveiligde uitnodigingslink per e-mail. Je klikt op de knop in de mail en bent direct ingelogd — <strong>geen account of wachtwoord om aan te maken</strong>. Vanaf dat moment ben je gekoppeld aan de profielkaart van je kind en zie je de radardiagrammen, de trends over tijd en de feedback van de trainer.</p>
<p>Ik heb bewust gekozen voor deze aanpak: de club beheert de uitnodigingen, niet wij.</p>$$
where id = 'o1';

update public.faq_items set answer =
$$<p>Iets waar ik zelf nog elke keer blij van word. Stel je voor: een eigen profvoetballer-kaart, compleet met een <strong>radardiagram</strong> dat laat zien hoe sterk je bent, een <strong>trendgrafiek</strong> die groei weergeeft, en een <strong>XP-systeem</strong> waarmee je levels kunt verdienen.</p>
<p>Het dashboard is read-only, dus kinderen kunnen niets per ongeluk wijzigen. Ze loggen in met het Team ID van hun team en een eigen 6-cijferige PIN — geen e-mailadres of wachtwoord nodig.</p>$$
where id = 'o2';

update public.faq_items set
  question = 'Ontvang ik als ouder automatisch bericht over mijn kind?',
  answer =
$$<p>Ja. Zodra je kind <strong>huiswerk afrondt, een trainingsvideo instuurt of een challenge voltooit</strong>, krijg jij automatisch een melding — mooi startpunt voor een gesprekje aan tafel.</p>
<p>"Hé, ik zie dat je net je huiswerk hebt afgevinkt — hoe ging het?" Dat gesprek is waar het om draait. Voor het volledige overzicht (skills, trends, coach-feedback) log je gewoon even in op het ouderdashboard.</p>$$
where id = 'o3';

update public.faq_items set answer =
$$<p>Je trainer geeft je een <strong>Team ID</strong> en een geheime code van <strong>6 cijfers</strong>. Ga naar <strong>skillkaart.nl</strong> op je telefoon, klik op "Speler inloggen", vul je Team ID en je pincode in — en je bent binnen. Geen e-mailadres, geen wachtwoord om te onthouden.</p>
<p>Daarna zie je meteen je eigen dashboard met een coole radardiagram, XP, en wat je trainer over je heeft gezegd.</p>$$
where id = 's1';

-- Nieuwe FAQ-items over het seizoenstrainingsprogramma (bestonden nog niet).
insert into public.faq_items (id, question, answer, category, sort_order) values
('c7', 'Wat is het seizoenstrainingsprogramma en hoe activeer ik het?',
$$<p>Dit is onze complete seizoensplanning: per leeftijdsgroep (O8 t/m O12) 32 trainingen verdeeld over het seizoen, met per week twee sessies (A/B), wisselend huiswerk en een maandelijkse challenge. Trainers hoeven zelf niets meer te bedenken.</p>
<p>Het is een <strong>PRO-feature</strong>. Als club-beheerder activeer je het via <strong>Club Admin → tabblad Trainingen</strong>: zet de club op PRO en vink de leeftijdsgroep(en) aan die je wilt gebruiken. Daarna verschijnt het programma automatisch in het dashboard van de betreffende coaches.</p>$$,
'club', 7)
on conflict (id) do update set question = excluded.question, answer = excluded.answer;

insert into public.faq_items (id, question, answer, category, sort_order) values
('co6', 'Waar vind ik het seizoenstrainingsprogramma voor mijn team?',
$$<p>Onder het tabblad <strong>Trainingen</strong> in je coach-dashboard, mits deze feature door je club is geactiveerd (het is een PRO-feature per leeftijdsgroep). Je ziet dan de huidige week met sessie A en B, per sessie drie oefeningen (warming-up, techniek, partijvorm), plus het huiswerk en de challenge die elke ~4 weken wisselen.</p>
<p>Zie je niks staan bij Trainingen? Vraag je club-beheerder om de feature en jouw leeftijdsgroep te activeren via Club Admin → Trainingen.</p>$$,
'coach', 6)
on conflict (id) do update set question = excluded.question, answer = excluded.answer;

-- Verificatie: loop hierna even mee met de resultaten.
select id, question, category, sort_order from public.faq_items order by category, sort_order;
