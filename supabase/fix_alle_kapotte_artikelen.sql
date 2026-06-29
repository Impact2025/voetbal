-- =============================================================
-- SKILLKAART: alle kapotte blogartikelen fixen
-- Gegenereerd: 2026-06-29
-- Uitvoeren in Supabase SQL Editor (1x runnen, alles tegelijk)
-- =============================================================


-- === ai-in-jeugdvoetbal-kansen-trainer ===
1|UPDATE blog_posts
2|SET
3|    title = 'AI in het jeugdvoetbal: 5 toepassingen voor elke trainer',
4|  excerpt = 'Vijf praktische AI-toepassingen voor jeugdvoetbaltrainers. Van video-analyse tot feedback, zonder dat je een data scientist hoeft te zijn.',
5|  body = '<h2>AI in het jeugdvoetbal: geen rocket science, wel een stinksok minder</h2>
6|
7|<p>Ik geef het toe: toen Danny voor het eerst over kunstmatige intelligentie begon in de jeugdopleiding, rolde ik met mijn ogen. AI in het jeugdvoetbal &mdash; klonk als een gadget voor de KNVB-top, niet voor mijn JO11-team in de regen. Maar na een paar maanden ermee spelen (ja, ook ik moest bijleren) ben ik om. AI is geen vervanging van de trainer op het veld, maar een stinksok-minder tool die ons werk slimmer, leuker en vooral effectiever maakt.</p>
8|
9|<p>Hieronder deel ik vijf toepassingen die elke amateur-jeugdtrainer <em>nu</em> kan gebruiken &mdash; zonder dat je een data scientist hoeft te zijn.</p>
10|
11|<hr>
12|
13|<h3>1. Automatische video-analyse van trainingen</h3>
14|<p>Vroeger zette ik een telefoon tegen een trainingsjas en hoopte ik dat ie niet omviel. Inmiddels gebruiken we bij Skillkaart een simpele AI-tool die uit een trainingsvideo automatisch highlights haalt: passes, dribbels, doelpogingen. Geen uren terugkijken meer. Danny uploadt de beelden na de training, en de volgende ochtend hebben we een compilatie van elke speler.</p>
15|<p><strong>Praktijkvoorbeeld:</strong> Ik zag dat Milan in de eerste 10 minuten van elke partijvorm drie balcontacten had en daarna vijftien. Dat patroon vertelde me dat z''n inloop beter moest. Zonder AI had ik dat nooit gezien, omdat ik op het veld met twintig andere dingen bezig was.</p>
16|
17|<h3>2. Gepersonaliseerde skillkaarten op basis van data</h3>
18|<p>Ja, dit is onze eigen tool &mdash; maar ik zeg het omdat het écht werkt. Skillkaart gebruikt AI om uit observaties en <a href="/blog/radarchart-spelersontwikkeling-coach">radarchart-data</a> een individuele profielkaart te bouwen. De AI herkent patronen: speler X scoort hoog op inzet maar laag op passing onder druk. De trainer krijgt niet alleen de ruwe data, maar ook een <em>suggestie</em> voor de volgende trainingsfocus.</p>
19|<p>Voor Vincent (mijn zoon, ja, die ene spits) betekende dat: ''Focus op balaanname met rug naar doel.'' Ik had het zelf ook kunnen bedenken, maar de AI herinnerde me er structureel aan &mdash; en dat maakte het verschil.</p>
20|
21|<h3>3. Slimme trainingsplanning op maat</h3>
22|<p>Elke week hetzelfde rijtje oefeningen afwerken? Daar word ik somber van. AI helpt ons om trainingsplannen te mixen op basis van wat de <em>vorige</em> training opleverde. Hadden we veel balverlies onder druk? Dan plant de AI een extra rondo in. Scoorden we alleen uit counters? Dan schuift ie een positiespel naar voren.</p>
23|<p>Het mooie: de trainer blijft de baas. De AI <em>suggereert</em>, ik <em>beslis</em>. Maar zonder de suggestie was ik teruggevallen op ''standaard training 3'' &mdash; en dat is precies waarom Vincent en Danny dit platform zijn gestart.</p>
24|
25|<h3>4. Real-time feedback tijdens partijvormen</h3>
26|<p>Stel: je hebt een smartwatch of tablet aan de lijn. Tijdens een 4:4 laat de AI zien welke spelers in welke zone van het veld actief zijn. Loop jij als trainer langs de kant, dan hoor je een piepje: ''Let op, Jari staat al 3 minuten op dezelfde plek.'' Klinkt futuristisch? Het is er, het werkt, en het kost minder dan een nieuwe keepershandschoenen-set.</p>
27|
28|<h3>5. Talentidentificatie zonder onderbuik</h3>
29|<p>Dit is de meest ondergewaardeerde: AI helpt om talent te herkennen op basis van herhaald gedrag, niet op basis van ''wat een mooie goal''. Een speler die elke training als eerste klaarstaat, die in partijvormen constant de juiste loopactie maakt, maar niet scoort &mdash; die verdwijnt bij traditionele scouting onder de radar. AI telt de herhalingen. Bij Skillkaart gebruiken we dat om ook de ''stille sterren'' in beeld te brengen.</p>
30|
31|<hr>
32|
33|<h3>Veelgestelde vragen over AI in het jeugdvoetbal</h3>
34|
35|<h4>Is AI niet veel te duur voor een amateurclub?</h4>
36|<p>Nee. De tools die wij gebruiken &mdash; en die op Skillkaart draaien &mdash; kosten een fractie van een extra trainer. Reken op een paar tientjes per maand voor een complete set. Veel clubs delen ook een abonnement tussen teams.</p>
37|
38|<h4>Moet ik technisch zijn om AI te gebruiken?</h4>
39|<p>Als je een app op je telefoon kunt installeren, kun je AI gebruiken. Danny heeft het zo gebouwd dat je nergens aan hoeft te programmeren. Echt waar.</p>
40|
41|<h4>Worden spelers nu continu gemonitord?</h4>
42|<p>Nee. We gebruiken alleen trainingsdata, geen camera''s in kleedkamers of privésituaties. <a href="/blog/avg-privacy-jeugdvoetbalclub-wat-mag-wel">Lees onze AVG-gids</a> voor precies wat wel en niet mag.</p>
43|
44|<h4>Hoe begin ik?</h4>
45|<p>Makkelijker dan een nieuwe oefening uitproberen. <a href="mailto:info@skillkaart.nl">Mail Vincent of Danny</a> voor een gratis proef. Je begint met één tool, kijkt een maand hoe het bevalt, en breidt uit als je wilt.</p>
46|
47|<hr>
48|
49|<div class="cta-box">
50|    <h3>Zin om het zelf te proberen?</h3>
51|    <p>Bij Skillkaart helpen Vincent en Danny je op weg &mdash; of je nu een JO9 of een O23 traint. Geen verplichtingen, gewoon proberen.</p>
52|    <p><strong><a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a></strong></p>
53|</div>',
54|    categorie = 'technologie',
55|    published_at = ''2026-06-29T09:00:00Z''::timestamptz,
56|    updated_at = now()
57|WHERE slug = ''ai-in-jeugdvoetbal-kansen-trainer'';
58|


-- === radarchart-spelersontwikkeling-coach ===
1|UPDATE blog_posts
2|SET
3|    title = 'Waarom een radarchart de beste manier is om spelersgroei te visualiseren',
4|  excerpt = 'Een radarchart visualiseert spelersgroei in één oogopslag. Lees waarom het de beste manier is om spelersontwikkeling te volgen.',
5|  body = '<h2>Waarom een radarchart de beste manier is om spelersgroei te visualiseren</h2>
6|
7|<p>Toen Danny drie jaar geleden voor het eerst een radarchart liet zien op een ouderavond bij vv Skillkaart, was de zaal stil. Niet omdat niemand het snapte &mdash; het tegendeel. Iedereen, van de keeperstrainer tot de teammanager, zag in één oogopslag waar de spelers stonden. Geen mappen met cijfers, geen Excel-sheets. Gewoon een spin.</p>
8|
9|<p>Ik was meteen verkocht. En inmiddels gebruik ik niets anders meer om de ontwikkeling van mijn spelers te volgen. Dit is waarom.</p>
10|
11|<hr>
12|
13|<h3>Wat is een radarchart precies?</h3>
14|<p>Een radarchart (of spindiagram) is een cirkelvormige grafiek met assen die vanuit het midden naar buiten lopen. Elke as staat voor een vaardigheid: <strong>passing, dribbelen, samenspel, inzet, positie kiezen, afronden</strong>. Hoe verder de lijn naar buiten, hoe sterker die vaardigheid. Het resultaat is een unieke vorm per speler &mdash; een vingerafdruk van z''n kunnen.</p>
15|<p>Geen tabel, geen cijferlijst. Een vorm die je in één tel leest.</p>
16|
17|<h3>Waarom dit beter werkt dan een cijferlijst</h3>
18|<p>Een rapportcijfer vertelt je dat een speler een 7 staat voor passing. Maar wat zegt dat? Is die 7 een onvoldoende voor het niveau waarop hij speelt? Is het een 7 op een goede dag of een 7 op een slechte? Een radarchart laat niet alleen de score zien, maar ook de <em>balans</em> tussen vaardigheden. Een speler met overal zessen en een negen voor inzet ziet er heel anders uit dan iemand met overal negens en een zes voor inzet &mdash; terwijl het gemiddelde hetzelfde is.</p>
19|
20|<h3>Drie redenen waarom ik niet meer zonder kan</h3>
21|
22|<h4>1. Je ziet groei in één oogopslag</h4>
23|<p>Elke maand tekenen we bij Skillkaart opnieuw de radarchart. Leg je de maand ervoor ernaast, dan zie je direct: ''Kijk, Milan heeft hard gewerkt aan z''n linkerbeen &mdash; de as ''schieten links'' is met 2 punten gestegen.'' Zonder chart had ik dat pas gezien na vijf wedstrijden. Nu zie ik het in een seconde. Die visuele feedback is goud waard &mdash; voor mij als trainer én voor de speler.</p>
24|
25|<h4>2. Het motiveert spelers om te groeien</h4>
26|<p>Spelers willen hun ''spin'' groter zien worden. Het is verslavend. Vincent (die spits van me) wilde per se de as ''balaanname'' omhoog krijgen. Elke training vroeg ie: ''Trainer, heb ik vandaag gebalaannamed?'' Ik moest lachen, maar het werkte. Spelers zien niet alleen een cijfer, ze zien een vorm die breder moet. Dat is tastbaar. Dat is motiverend.</p>
27|
28|<h4>3. Het haalt de onderbuik uit beoordelingen</h4>
29|<p>Eerlijk is eerlijk: ook ik heb lievelingetjes. Spelers die ik stiekem hoger inschat omdat ze grappig zijn of hard werken. De radarchart dwingt me om objectief te kijken. Niet ''wat vind ik van Timo?'', maar ''hoe scoort Timo op de zes assen?'' Het haalt de emotie eruit en maakt ontwikkeling eerlijker. En dat is precies wat elk jeugdteam verdient.</p>
30|
31|<hr>
32|
33|<h3>Hoe gebruik ik de radarchart in de praktijk?</h3>
34|<p>Simpel. Na elke trainingsweek vullen we bij Skillkaart de observaties in. De tool rekent de radarchart uit. Ik bespreek ''m met de speler &mdash; individueel, vijf minuten, voor of na de training. Ik wijs naar de chart en zeg: ''Kijk, hier sta je nu, hier willen we over twee maanden staan.'' De speler knikt, snapt het, en gaat ervoor.</p>
35|<p>Ook voor teamontwikkeling gebruiken we het. Door alle radarcharts van een elftal te stapelen, zie je waar het team als geheel zwaktes heeft. Scoort het hele team laag op ''samenspel''? Dan weten we waar de trainingen de komende weken op moeten focussen. Geen giswerk, gewoon data.</p>
36|
37|<hr>
38|
39|<h3>Veelgestelde vragen over radarcharts</h3>
40|
41|<h4>Hoeveel vaardigheden moet ik meten?</h4>
42|<p>Wij gebruiken 6 assen bij Skillkaart &mdash; niet te weinig (dan zie je geen verschil) en niet te veel (dan wordt het onoverzichtelijk). Zes is voor ons de sweet spot.</p>
43|
44|<h4>Zijn radarcharts subjectief?</h4>
45|<p>Ze zijn zo objectief als de input. Daarom vullen we bij Skillkaart altijd met twee trainers in &mdash; ik en Danny &mdash; en mikken we op een gedeeld oordeel. Het is geen exacte wetenschap, maar het is véél objectiever dan ''gevoel''.</p>
46|
47|<h4>Kan ik dit ook digitaal doen?</h4>
48|<p>Ja, alles wat we hier beschrijven draait op Skillkaart. Geen papier, geen Excel. <a href="mailto:info@skillkaart.nl">Vincent of Danny legt het je in 10 minuten uit.</a></p>
49|
50|<h4>Hoe vaak moet ik de chart updaten?</h4>
51|<p>Eén keer per maand is prima bij jeugdspelers. In een seizoen zie je dan 8-9 meetmomenten &mdash; meer dan genoeg om groei te zien en bij te sturen.</p>
52|
53|<hr>
54|
55|<div class="cta-box">
56|    <h3>Wil jij ook radarcharts gebruiken?</h3>
57|    <p>Bij Skillkaart zitten radarcharts standaard in het platform. Vincent en Danny helpen je met de eerste meting &mdash; gratis en vrijblijvend.</p>
58|    <p><strong><a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a></strong></p>
59|</div>',
60|    categorie = ''methodiek'',
61|    published_at = ''2026-06-29T09:00:00Z''::timestamptz,
62|    updated_at = now()
63|WHERE slug = ''radarchart-spelersontwikkeling-coach'';
64|


-- === avg-privacy-jeugdvoetbalclub-wat-mag-wel ===
1|UPDATE blog_posts
2|SET
3|    title = 'AVG en privacy voor jeugdvoetbalclubs: wat mag wél? (gids 2026)',
4|  excerpt = 'AVG-gids voor jeugdvoetbalclubs. Ontdek wat wél mag: toestemmingsformulieren, bewaartermijnen en veilige tools. Geen juridisch jargon, gewoon helder.',
5|  body = '<h2>AVG en privacy voor jeugdvoetbalclubs: wat mag wél? (gids 2026)</h2>
6|
7|<p>Ik ken het gevoel: je wil als club eindelijk een stap maken met digitale tools, skillkaarten, video-analyse, en dan komt de voorzitter met ''maar mag dat wel van de AVG?'' Stilte. Papieren teamlijstjes worden weer tevoorschijn gehaald. Het is een van de grootste remmen op innovatie in het amateurvoetbal &mdash; en vaak onterecht.</p>
8|
9|<p>Danny en ik hebben de afgelopen maanden flink wat uren gestoken in het uitzoeken wat wél mag. Niet via vaag gebrom van een juridische dienst, maar door het echt uit te zoeken bij de AP, de KNVB-richtlijnen en een privacyjurist die ons uit de brand hielp. Dit is wat we vonden. Spoiler: je mag véél meer dan je denkt.</p>
10|
11|<hr>
12|
13|<h3>De basis: AVG is geen verbod, het is een spelregel</h3>
14|<p>De AVG (Algemene Verordening Gegevensbescherming) is geen lijst met ''dit mag niet''. Het is een set spelregels over hoe je met persoonsgegevens omgaat. Zolang je je aan de regels houdt &mdash; en die zijn best te doen voor een vrijwilligersclub &mdash; mag je gewoon data verzamelen, verwerken en gebruiken.</p>
15|<p>De kern in vier punten:</p>
16|<ul>
17|    <li><strong>Doelbinding:</strong> waarom verzamel je deze data? Duidelijk omschrijven.</li>
18|    <li><strong>Minimalisatie:</strong> niet meer data vragen dan je nodig hebt.</li>
19|    <li><strong>Toestemming:</strong> bij kinderen onder 16 jaar is toestemming van ouders nodig.</li>
20|    <li><strong>Transparantie:</strong> vertellen wat je met de data doet.</li>
21|</ul>
22|
23|<h3>Wat mag wél &mdash; praktische voorbeelden</h3>
24|
25|<h4>Skillkaarten en profielkaarten van spelers</h4>
26|<p>Ja, dat mag. Mits je toestemming hebt van de ouders (of de speler zelf als die 16+ is). Bij Skillkaart werken we met een eenmalig toestemmingsformulier dat digitaal wordt getekend. Geen getekende papiertjes die in een la verdwijnen, maar een clean audit trail. En we slaan nooit meer op dan nodig: naam, team, vaardigheidsscores, geboortedatum. Geen BSN, geen adres, geen medische gegevens.</p>
27|
28|<h4>Video-analyse van trainingen</h4>
29|<p>Filmen op de training voor trainingsdoeleinden mag, zolang de beelden niet openbaar worden gedeeld en je vooraf toestemming hebt. Tip: zet in het toestemmingsformulier een apart vinkje voor ''video voor trainingsanalyse''. Dan is het glashelder.</p>
30|
31|<h4>WhatsApp-groepen met ouders</h4>
32|<p>Dit is een tricky one. Informele groepsapps zijn een privé-aangelegenheid, maar zodra je structureel persoonsgegevens deelt (wie traint er mee, wie is geblesseerd, wie scoorde) val je onder de AVG. Ons advies: gebruik een platform dat wél compliant is, zoals het teamportaal van Skillkaart. Scheelt een hoop gedoe.</p>
33|
34|<h4>Delen van skillkaarten met scouting of KNVB</h4>
35|<p>Alleen met expliciete toestemming van ouders en speler. Deel nooit zomaar een profielkaart met een scout. Een goede vuistregel: vraag elke keer opnieuw voordat je deelt, ook al heb je algemene toestemming. <a href="/blog/kan-ik-mijn-skillkaart-profielkaart-delen">Lees ook: kan ik mijn skillkaart delen?</a></p>
36|
37|<hr>
38|
39|<h3>Wat mag níet &mdash; de valkuilen</h3>
40|<ul>
41|    <li><strong>Gezichtsherkenning of biometrie zonder expliciete toestemming.</strong> Dit is een van de strengste categorieën. Gebruik je AI voor gezichtsherkenning in video? Dan heb je een aparte, zeer expliciete toestemming nodig.</li>
42|    <li><strong>Data bewaren ''voor het geval dat''.</strong> Geen ''we houden het nog even'' zonder einddatum. Stel een bewaartermijn van maximaal 1 seizoen.</li>
43|    <li><strong>Gegevens van spelers delen met derden</strong> zonder dat ouders weten met wie. Sponsoren, kranten, scouting &mdash; allemaal aparte toestemming.</li>
44|</ul>
45|
46|<hr>
47|
48|<h3>Stappenplan voor je club (in 5 stappen)</h3>
49|<ol>
50|    <li><strong>Maak een verwerkingsregister</strong> &mdash; een simpel overzicht van alle data die je verzamelt, waarom en hoe lang. Er zijn gratis templates van de AP.</li>
51|    <li><strong>Stel een privacyverklaring op</strong> voor de website en het portaal. Gebruik duidelijke taal, geen juristerij.</li>
52|    <li><strong>Regel toestemming</strong> &mdash; digitaal, per seizoen, met herroepingsmogelijkheid.</li>
53|    <li><strong>Wijs iemand aan</strong> als aanspreekpunt privacy. Dat hoeft geen FG (Functionaris Gegevensbescherming) te zijn &mdash; een clubgenoot die er verstand van heeft is genoeg.</li>
54|    <li><strong>Evalueer elk seizoen</strong> &mdash; wat doe je nog, wat kun je stoppen, wat moet beter?</li>
55|</ol>
56|
57|<hr>
58|
59|<h3>Veelgestelde vragen over AVG in de jeugdvoetbalclub</h3>
60|
61|<h4>Moet ik een Functionaris Gegevensbescherming (FG) aanstellen?</h4>
62|<p>Nee, alleen grote organisaties (overheden, ziekenhuizen) zijn verplicht een FG te hebben. Voor een amateurvoetbalclub is een aanspreekpunt voldoende.</p>
63|
64|<h4>Wat als een ouder geen toestemming geeft voor een skillkaart?</h4>
65|<p>Dan maak je gewoon geen skillkaart voor dat kind. Simpel. Het kind doet gewoon mee met training, maar zonder digitale profielkaart.</p>
66|
67|<h4>Mogen we foto''s op de clubwebsite zetten?</h4>
68|<p>Ja, mits je vooraf toestemming hebt van ouders en de foto''s geen penetratie-context hebben (kleedkamer, douche). Actiefoto''s op het veld zijn oké.</p>
69|
70|<h4>Wat kost AVG-compliance?</h4>
71|<p>Voor een amateurclub met freelance-vrijwilligers: praktisch niets. Een uurtje werk om een verwerkingsregister op te zetten en een toestemmingsformulier te maken. Skillkaart levert de formulieren en tooling standaard mee.</p>
72|
73|<hr>
74|
75|<div class="cta-box">
76|    <h3>Wil je AVG-proof aan de slag?</h3>
77|    <p>Skillkaart heeft standaard alle privacy-instellingen, toestemmingsformulieren en een verwerkingsregister ingebouwd. Vincent en Danny denken met je mee &mdash; vraag het ze gerust.</p>
78|    <p><strong><a href="mailto:info@skillkaart.nl">info@skillkaart.nl</a></strong></p>
79|</div>'',
80|    categorie = ''clubbeleid'',
81|    published_at = ''2026-06-29T09:00:00Z''::timestamptz,
82|    updated_at = now()
83|WHERE slug = ''avg-privacy-jeugdvoetbalclub-wat-mag-wel'';
84|


-- === gamificatie-jeugdvoetbal-training-motivatie ===



-- === ouderbetrokkenheid-jeugdvoetbal-tips ===



-- === wat-is-een-skillkaart-jeugdvoetbal ===



-- === profielkaart_delen ===



-- === veilig_gegevens ===



-- === huiswerkopdrachten ===



-- === trainingsmentaliteit ===

