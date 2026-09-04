# Speler-dashboard Redesign — "Duolingo voor voetbal" (7–12 jaar)

> Doel: van een **overvol datarapport** naar één **rustig, gericht groeischerm** dat een kind van
> 8 jaar in 3 seconden snapt. Simpel aan de buitenkant, pro eronder. Eén duidelijke volgende stap.
> Gedestilleerd uit de 9 onderzoeks-PDF's + `IMPLEMENTATIE_PLAN_WERELDKLASSE.md`. Versie 1.0 — 2026-06-20.

---

## 0. De diagnose — waarom het "te veel" voelt (en het klopt)

Het huidige speler-**Dashboard**-tabblad (`PlayerOverview.tsx`) stapelt **9 zware kaarten** onder elkaar
op één scroll:

1. Hero-kaart (avatar, level, score/100, #rank, wedstrijdcijfer-balk)
2. Skill-cirkels (7 ringen)
3. Sterk in / Werk aan (2 kolommen)
4. Huiswerk-voortgang
5. Badges (8 stuks)
6. AI Coach-analyse
7. Jij vs Team radar
8. Voortgang-per-periode **tabel**
9. **Team Ranglijst** (#1 → #X)

Daarboven zit een nav van **6 tabbladen** (Dashboard, Kaart, Huiswerk, Skills, Statistieken, Vragen).
Een kind van 8 weet bij het openen niet *waar het moet kijken* of *wat het nu moet doen*.

### Het pijnlijke deel: het schendt jullie eigen onderzoek
De research (zie `IMPLEMENTATIE_PLAN_WERELDKLASSE.md` §0, principes P1–P7) zegt letterlijk:

| Principe | Wat het scherm nu doet | Oordeel |
|----------|------------------------|---------|
| **P1 — Self-vergelijkend, nóóit sociaal** | Team Ranglijst, #rank-medaille, "Jij vs Team" radar | ❌ Direct in strijd |
| **P2 — Inzet i.p.v. talent-ratings** | Alles draait om score/100 en skills 0–10 (aanleg) | ❌ Beloont talent, niet gedrag |
| **P5 — Eén groeipunt per keer** | 9 kaarten tegelijk, geen focus | ❌ Geen spotlight |
| **P4 — Leeftijdsdifferentiatie 7–9 vs 10–12** | Iedereen ziet dezelfde getallen-dichtheid | ⚠️ Niet gedifferentieerd |

**Conclusie:** het is niet alleen *druk* — de drukste, meest prominente elementen (ranglijst,
rank, team-vergelijking) zijn precies de elementen die het onderzoek als schadelijk voor 7–12
markeert. Opruimen lost dus twee problemen tegelijk op: **rust én pedagogisch correct**.

---

## 1. Het Duolingo-mentaalmodel (wat we kopiëren)

Duolingo is niet succesvol omdat het veel laat zien, maar omdat het **bijna niets** laat zien:

1. **Eén scherm, één vraag:** "Wat doe ik nu?" → één grote knop.
2. **Het pad, niet het dashboard:** voortgang is een lineair pad, geen grid van statistieken.
3. **Streak altijd in beeld, nooit dwingend** (vlam rechtsboven).
4. **Beloning is onmiddellijk en zintuiglijk** (geluid, confetti, XP-floater) — niet een tabel.
5. **Data is er wél, maar verstopt** achter een profieltik voor wie het wil.
6. **Minimale chrome:** 3–5 nav-items, grote tap-targets, veel witruimte.

Vertaald naar Skillkaart: **het kind moet bij het openen één ding zien dat het kan dóén**, en de
beloning daarvoor moet de Inzet-DNA-kaart laten groeien — niet een ranglijst beklimmen.

---

## 2. Nieuwe informatie-architectuur — van 6 tabs naar 3

```
NU (6 tabs, 9 kaarten op tab 1)        →   NIEUW (3 tabs, 1 focus per scherm)
─────────────────────────────────         ──────────────────────────────────
Dashboard  (9 kaarten)                     🏠 Vandaag   — 1 actie + streak + dag-ring
Kaart                                       🏆 Kaart     — Inzet-DNA identiteitskaart (trots)
Huiswerk                                    🙂 Ik        — skills, historie, coach-feedback (verdiept)
Skills
Statistieken                               (Huiswerk + Challenges leven IN "Vandaag")
Vragen                                     (Vragen = melding/kaart binnen "Vandaag")
```

### Tab 1 — 🏠 **Vandaag** (de nieuwe homescreen, vervangt de drukke Dashboard-tab)
De enige plek die telt. Maximaal **3 elementen**, in deze volgorde:

1. **Streak-vlam + groet** (bovenaan, klein): "Hoi Sem 👋 — 🔥 3 weken bezig". Capped streak (P3),
   nooit schuld-messaging.
2. **DE actiekaart** (groot, midden): de *ene* volgende stap.
   - Open huiswerk? → "Maak je oefening: Panna-pass × 10" + grote groene knop.
   - Geen huiswerk? → de challenge-van-de-week (Street Legend Combo).
   - Alles klaar? → viering + "Kom morgen terug" of een vrije challenge.
3. **Dag-/weekring** (klein, onder de knop): "2 / 3 deze week" — een doel, geen ranking.

Eén coach-vraag openstaand? → één subtiele kaart eronder ("Je coach vroeg je iets 💬"). Geen aparte tab.

### Tab 2 — 🏆 **Kaart**
De al-gebouwde `PlayerCard` (Inzet-DNA) + `StreakWidget`. Dit is het *trots*-scherm — de EA-FC-achtige
identiteitskaart. Blijft grotendeels zoals het is; dit hoort visueel rijk te zijn (dat is de beloning).

### Tab 3 — 🙂 **Ik** (alle data, opt-in)
Hier verhuist de zware data heen, achter taps, rustig opgemaakt:
- Skills-detail (radar / cirkels) — **alleen "jij", geen team**.
- **Trend: jij-nu vs jij-vorige-maand** (vervangt "Jij vs Team", P1-conform — bestaat al als plan: `TrendOverlay`).
- Coach-opmerkingen + persoonlijk trainingsplan.
- Voortgang-per-periode (ingeklapt, "Toon details").

---

## 3. Wat weg / verplaatst / vervangen wordt

| Element | Actie | Reden |
|---------|-------|-------|
| **Team Ranglijst** | **Verwijderen** | Schendt P1 (sociale vergelijking schaadt 7–12) |
| **#rank-medaille** in hero | **Verwijderen** | Zelfde — P1 |
| **"Jij vs Team" radar** | **Vervangen** door "Jij nu vs vorige maand" | P1: self-vergelijking i.p.v. sociaal |
| **Voortgang-per-periode tabel** | **Verplaatsen** naar "Ik" + inklappen | Te data-zwaar voor homescreen |
| **AI Coach-analyse** | **Verplaatsen** naar "Ik"; op Vandaag max 1 zin | Rust op homescreen |
| **Badges (8)** | **Behouden**, maar naar "Kaart" of "Ik" | Niet de eerste boodschap |
| **Skill-cirkels + Sterk/Werk-aan** | **Naar "Ik"** | Detail, geen dagactie |
| **Wedstrijdcijfer-balk** | **Naar "Ik"** | Talent-data (P2), geen dagfocus |
| **Score /100** prominent | **Dempen** → tier-naam i.p.v. kaal getal | P2: vier inzet, niet aanleg |

> Vuistregel: alles wat **talent meet** (P2) of **vergelijkt met anderen** (P1) mag bestaan, maar
> hoort **niet** op het eerste scherm. Het eerste scherm gaat over **doen**.

---

## 4. "Vandaag"-scherm — concrete spec

```
┌──────────────────────────────────────┐
│  Hoi Sem 👋            🔥 3            │  ← streak (capped), klein
│                                        │
│  ┌────────────────────────────────┐   │
│  │   VANDAAG TE DOEN              │   │  ← DE actiekaart (groot)
│  │                                │   │
│  │   🎯 Panna-pass × 10           │   │
│  │   "10 minuten in de tuin"      │   │
│  │                                │   │
│  │      [  Start oefening  ]      │   │  ← één grote groene knop
│  └────────────────────────────────┘   │
│                                        │
│   Deze week:  ●●○   2 / 3   ✨         │  ← weekdoel-ring (geen ranking)
│                                        │
│   💬 Je coach vroeg je iets            │  ← alleen indien open
└──────────────────────────────────────┘
```

**States van de actiekaart (prioriteit van boven naar beneden):**
1. Open huiswerk → toon eerste onvoltooide oefening.
2. Geen huiswerk, challenge actief → toon challenge-van-de-week.
3. Alles klaar deze sessie → viering ("Je bent klaar! 🎉") + zachte "kom terug"-boodschap (P3, geen dwang).
4. Niets toegewezen → vrije challenge-suggestie uit de bibliotheek.

**Beloning bij voltooien (al deels aanwezig — `XPFloater`, `TierUpModal`, `Confetti`):**
- Directe XP-floater + geluid (≤350 ms, P2-checklist), confetti.
- Inzet-DNA-as gaat zichtbaar omhoog → bij tier-up de pack-opening cinematic.
- Respecteer `prefers-reduced-motion`.

---

## 5. Implementatie — 3 fasen, klein en veilig

Bouwt op bestaande bouwstenen; geen backend-wijziging nodig voor fase A en B.

### Fase A — Architectuur opschonen (grootste winst, minste risico)
1. `PLAYER_SECTIONS` in `Dashboard.tsx:58` terugbrengen van 6 → 3 (`vandaag`, `kaart`, `ik`).
2. Bottom-nav + desktop-tabs aanpassen (`Dashboard.tsx:1276` & `1538`).
3. `PlayerOverview.tsx`: **Team Ranglijst, #rank, Jij-vs-Team radar verwijderen** (P1).
4. Score-getal dempen → tier-/levelnaam prominenter dan kaal cijfer (P2).

### Fase B — Het "Vandaag"-scherm bouwen
5. Nieuw component `components/dashboard/TodayScreen.tsx`:
   - Leidt de "ene actie" af uit `assignedHomeworkIds` + `completed_homework_ids` + actieve challenge.
   - Hergebruikt `StreakWidget`, `PlayerHomeworkCard`-logica, `ChallengeLibrary`.
   - Weekdoel-ring uit `streaks` (al in datamodel).
6. Render `TodayScreen` als default `mobileSection='vandaag'` (vervang regel `Dashboard.tsx:1333`).

### Fase C — "Ik"-scherm als rustig archief
7. Verplaats skill-cirkels, Sterk/Werk-aan, voortgangstabel, AI-analyse, coach-opmerkingen naar
   een nieuw `IkScreen.tsx` (of hergebruik een opgeschoonde `PlayerOverview`).
8. Vervang "Jij vs Team" door `TrendOverlay` (jij nu vs vorige maand — staat al in het wereldplan).
9. Voortgangstabel default ingeklapt achter "Toon details".

### Leeftijdsdifferentiatie (P4) — door alle fasen
- **7–9:** geen kale getallen op Vandaag; zachte taal ("Lekker bezig!"), grotere knoppen.
- **10–12:** mag de trend-cijfers en mastery-taal zien op "Ik".
- Gebruik bestaande `detectAgeGroup(player.age)` (`trainingAI.ts:41`).

---

## 6. Definition of Done
- [ ] Speler-nav = 3 tabs; "Vandaag" is de landing.
- [ ] Eerste scherm toont **max 3 elementen** en **één primaire knop**.
- [ ] Geen ranglijst, geen #rank, geen team-vergelijking zichtbaar voor het kind (P1).
- [ ] Eerste boodschap gaat over **inzet/doen**, niet over een talent-score (P2).
- [ ] `prefers-reduced-motion` gerespecteerd; beloning ≤350 ms.
- [ ] Leeftijdsmodes 7–9 én 10–12 visueel gecontroleerd (P4).
- [ ] `npm run build` + `npm run lint` clean.

## 7. Openstaande keuzes (voor jou)
1. **Ranglijst echt helemaal weg, of als opt-in voor 11–12?** Advies: helemaal weg op spelerscherm; coach mag 'm zien.
2. **"Ik"-tab naam:** "Ik", "Mijn voetbal", of "Profiel"? Advies: "Ik" (kort, eigenaarschap).
3. **Vandaag-actie volgorde:** huiswerk vóór challenge (advies) of kind laten kiezen?
