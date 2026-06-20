# Implementatieplan — Skillkaart Wereldklasse (7–12 jaar)

> Werkdocument voor het transformeren van Skillkaart van "read-only rapportcijfer-app" naar
> een groei-gedreven ervaring die kinderen *willen* gebruiken en waar ouders extra voor betalen.
> Gedestilleerd uit de 9 onderzoeks-PDF's in `docs/`. Versie 1.0 — 2026-06-20.

---

## 0. Kompas: de 7 niet-onderhandelbare principes

Elke feature in dit document wordt getoetst aan deze principes (zie de **SDT-checklist** per feature in §4).

| # | Principe | Bron |
|---|----------|------|
| P1 | **Self-vergelijkend, nooit sociaal** — "ik nu vs. ik vorige maand", geen teamgemiddelden/ranglijsten | Ontwikkelingspsychologie 7–12 |
| P2 | **Inzet-statistieken i.p.v. talent-ratings** — beloon gedrag, niet aanleg | Strategisch Kader Gamificatie |
| P3 | **Capped streaks** — weekreset, recovery days, geen schuld-messaging | Strategisch Kader §2 + §6 |
| P4 | **Leeftijdsdifferentiatie 7–9 vs. 10–12** | Ontwikkelingspsychologie |
| P5 | **Eén groeipunt per keer** — coach kiest 1–2 spotlight-skills | Ontwikkelingspsychologie |
| P6 | **Ouder = ambassadeur via rust** — 1 wekelijkse digest, samen-doen framing | Parental engagement |
| P7 | **Veiligheid by design** — privacy-by-default, geen 1-op-1 chat, effort-based feedback | Beleidskader Digitale Veiligheid |

**Gouden regel:** de digitale beloning mag *spectaculair* zijn, maar viert uitsluitend **persoonlijke groei en inzet**. De app is een katalysator naar de achtertuin, geen eindbestemming.

---

## 1. Huidige staat (waar we op bouwen)

Relevante bestaande bouwstenen — hergebruiken, niet opnieuw uitvinden:

| Bestaand | Locatie | Hergebruik in plan |
|----------|---------|--------------------|
| `LEVELS` (Starter→MVP) + `getLevel()` | `PlayerOverview.tsx:24` | Basis voor kaart-tiers (Fase 1) |
| `SkillCircle` radiale progress | `PlayerOverview.tsx:54` | Stijl-anker voor Inzet-DNA ringen |
| Recharts `RadarChart` | `PlayerOverview.tsx` | Trend-overlay 10–12 (Fase 1) |
| `detectAgeGroup(age)` | `trainingAI.ts:41` | Leeftijdsdifferentiatie (P4) |
| `PLAYER_SECTIONS` tab-nav | `Dashboard.tsx:51` | Nieuwe tab "Mijn Kaart" |
| `homework_submissions` + realtime | `Dashboard.tsx`, SQL | Voedt Werkethiek/Techniek-stats |
| `callAI()` / `analyzeMovementVideo()` | `ai.ts` | Challenge-feedback (Fase 3) |
| Resend e-mail | `api/send-email.ts` | Ouder-digest (Fase 4) |
| Framer Motion | overal | Pack Opening + micro-interacties (Fase 2) |
| `anon_all` RLS-patroon | `homework_submissions.sql:46` | Consistent voor nieuwe tabellen (MVP) |

**Belangrijk:** spelers gebruiken géén Supabase-auth (PIN + localStorage, `App.tsx:60`). Alle nieuwe spelerdata gaat dus via dezelfde `anon`-policies; security komt via app-logica, niet via RLS-per-user. Houd dit aan voor consistentie en hard het later samen aan.

---

## 2. Datamodel

### 2.1 Overzicht nieuwe tabellen

| Tabel | Fase | Doel |
|-------|------|------|
| `player_stats` | 1 | Berekende inzet-DNA + kaart-tier per speler |
| `stat_events` | 1 | Append-only log van inzet-gebeurtenissen (audit + herberekening) |
| `challenges` | 3 | Bibliotheek van challenge-templates (de 10 uit onderzoek) |
| `challenge_assignments` | 3 | Welke challenge aan welk team/speler toegewezen |
| `challenge_completions` | 3 | Voltooiingen + reflectie + AI-feedback |
| `streaks` | 3 | Capped weekstreak-status per speler |
| `parent_links` | 4 | Koppeling ouder-account ↔ speler |
| `notification_prefs` | 4 | Ouder-voorkeuren digest/alerts |

### 2.2 SQL — Fase 1: Inzet-DNA

```sql
-- supabase/migration_player_stats.sql
-- Inzet-DNA: 5 groei-assen, berekend uit gedrag (NOOIT talent).

create table if not exists player_stats (
  player_id    uuid primary key,
  team_id      text not null,
  -- 5 kernstatistieken, 0-100 (P2: inzet, geen talent)
  consistentie smallint not null default 0,  -- huiswerk binnen de week voltooid
  werkethiek   smallint not null default 0,  -- # challenges + video-inzendingen
  techniek     smallint not null default 0,  -- diversiteit voltooide categorieën
  focus        smallint not null default 0,  -- challenges mét reflectie ingevuld
  team_spirit  smallint not null default 0,  -- mentaliteit/teamgeest-challenges
  -- kaart-tier op cumulatieve inzet
  tier         text not null default 'brons'
               check (tier in ('brons','zilver','goud','legendary')),
  total_xp     integer not null default 0,
  -- snapshot voor self-vergelijking (P1): vorige maand-waarden
  prev_snapshot jsonb,
  snapshot_at  timestamptz,
  updated_at   timestamptz not null default now()
);

create index if not exists player_stats_team_idx on player_stats (team_id);

-- Append-only event log: bron van waarheid, maakt herberekening mogelijk
create table if not exists stat_events (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null,
  team_id     text not null,
  event_type  text not null,   -- 'homework_done' | 'video_submitted' | 'challenge_done' | 'reflection' | 'teamspirit'
  axis        text not null,   -- welke stat-as dit voedt
  xp          integer not null default 10,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists stat_events_player_idx on stat_events (player_id);

alter table player_stats enable row level security;
alter table stat_events  enable row level security;
create policy "anon_all" on player_stats for all to anon using (true) with check (true);
create policy "anon_all" on stat_events  for all to anon using (true) with check (true);
```

**Berekeningskeuze:** `stat_events` is append-only de bron van waarheid. `player_stats` is een
afgeleide cache die je client-side (of via een Supabase Edge Function) herberekent na elk event.
Dit houdt de logica testbaar en voorkomt drift. De maandelijkse `prev_snapshot` wordt door een
cron (of bij eerste login van de maand) geschreven — dát is wat de trend-overlay (P1) toont.

### 2.3 SQL — Fase 3: Challenges & Streaks

```sql
-- supabase/migration_challenges.sql

create table if not exists challenges (
  id           text primary key,           -- 'street-legend-combo'
  title        text not null,              -- 'Street Legend Combo'
  category     text not null               -- 'techniek'|'inzicht'|'snelheid'|'mentaliteit'
               check (category in ('techniek','inzicht','snelheid','mentaliteit')),
  age_min      smallint not null default 7,
  age_max      smallint not null default 12,
  setup        text not null,              -- korte opzet
  win_condition text not null,             -- duidelijke win-conditie
  youtube_url  text,
  reflection_prompt text,                  -- P5/P7: reflectie i.p.v. score
  ai_feedback_hint  text,                  -- context voor callAI()
  created_at   timestamptz not null default now()
);

create table if not exists challenge_assignments (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references challenges(id),
  team_id      text not null,
  week         text,                       -- optioneel: weeklabel
  created_at   timestamptz not null default now()
);

create table if not exists challenge_completions (
  id            uuid primary key default gen_random_uuid(),
  challenge_id  text not null references challenges(id),
  player_id     uuid not null,
  team_id       text not null,
  reflection    text,                      -- kind's eigen woorden
  emoji         text,                      -- 😃/😐/😣 zelf-rapportage
  ai_feedback   text,
  completed_at  timestamptz not null default now()
);
create index if not exists completions_player_idx on challenge_completions (player_id);

-- Capped streak (P3): weekgebonden, reset zondag, geen verliesaversie
create table if not exists streaks (
  player_id        uuid primary key,
  week_start       date not null,          -- maandag van huidige week
  activities_count smallint not null default 0,
  week_goal        smallint not null default 2,
  best_week_count  smallint not null default 0,
  recovery_used    boolean not null default false,  -- weekend amulet
  flame_state      text not null default 'active'   -- 'active'|'sleep'|'complete'
                   check (flame_state in ('active','sleep','complete')),
  updated_at       timestamptz not null default now()
);

alter table challenges             enable row level security;
alter table challenge_assignments  enable row level security;
alter table challenge_completions  enable row level security;
alter table streaks                enable row level security;
create policy "anon_all" on challenges            for all to anon using (true) with check (true);
create policy "anon_all" on challenge_assignments for all to anon using (true) with check (true);
create policy "anon_all" on challenge_completions for all to anon using (true) with check (true);
create policy "anon_all" on streaks               for all to anon using (true) with check (true);
```

### 2.4 SQL — Fase 4: Ouderportaal

```sql
-- supabase/migration_parent_portal.sql

-- Ouders hebben WEL Supabase-auth (zoals coach/club_admin), gekoppeld via profiles.role='parent'
create table if not exists parent_links (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null,              -- auth.users id
  player_id    uuid not null,
  team_id      text not null,
  link_code    text,                       -- eenmalige koppelcode door coach gegenereerd
  verified     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique (parent_id, player_id)
);

create table if not exists notification_prefs (
  parent_id        uuid primary key,
  weekly_digest    boolean not null default true,   -- vrijdag 16:00 (P6)
  critical_alerts  boolean not null default true,
  channel          text not null default 'email'    -- 'email'|'push'|'both'
                   check (channel in ('email','push','both')),
  detail_level     text not null default 'light'    -- 'light'|'full'
                   check (detail_level in ('light','full')),
  updated_at       timestamptz not null default now()
);

alter table parent_links       enable row level security;
alter table notification_prefs enable row level security;
-- Strenger dan anon: ouder ziet alleen eigen koppeling (P7: privacy-by-default)
create policy "parent_own" on parent_links
  for select to authenticated using (parent_id = auth.uid());
create policy "parent_own_prefs" on notification_prefs
  for all to authenticated using (parent_id = auth.uid()) with check (parent_id = auth.uid());
```

> **P7-noot:** het ouderportaal is het eerste deel waar we wél echte RLS-per-user toepassen,
> omdat ouders een auth-account hebben. Geen open 1-op-1 chat; communicatie loopt via de
> bestaande coach→club kanalen (two-deep leadership).

### 2.5 TypeScript types (`src/types/index.ts` — toevoegen)

```ts
export type StatAxis = 'consistentie' | 'werkethiek' | 'techniek' | 'focus' | 'team_spirit';
export type CardTier = 'brons' | 'zilver' | 'goud' | 'legendary';

export interface PlayerStats {
  player_id: string;
  team_id: string;
  consistentie: number;   // 0-100
  werkethiek: number;
  techniek: number;
  focus: number;
  team_spirit: number;
  tier: CardTier;
  total_xp: number;
  prev_snapshot: Record<StatAxis, number> | null;  // P1: self-vergelijking
  snapshot_at: string | null;
  updated_at: string;
}

export type ChallengeCategory = 'techniek' | 'inzicht' | 'snelheid' | 'mentaliteit';

export interface Challenge {
  id: string;
  title: string;
  category: ChallengeCategory;
  age_min: number;
  age_max: number;
  setup: string;
  win_condition: string;
  youtube_url?: string;
  reflection_prompt?: string;
  ai_feedback_hint?: string;
}

export interface ChallengeCompletion {
  id: string;
  challenge_id: string;
  player_id: string;
  team_id: string;
  reflection?: string;
  emoji?: string;
  ai_feedback?: string;
  completed_at: string;
}

export interface Streak {
  player_id: string;
  week_start: string;
  activities_count: number;
  week_goal: number;
  best_week_count: number;
  recovery_used: boolean;
  flame_state: 'active' | 'sleep' | 'complete';
}

// UserData uitbreiden met 'parent'
// role: 'club_admin' | 'coach' | 'player' | 'parent'
```

---

## 3. Componentstructuur

### 3.1 Nieuwe directory-indeling

```
src/
  lib/
    stats.ts              # computeStats(events) — pure functie, unit-testbaar
    streaks.ts            # weekstreak-logica (P3)
    cardTier.ts           # XP → tier mapping + drempels
  components/
    card/
      PlayerCard.tsx          # Fase 1 — de identiteitskaart (tier, rol, DNA)
      InzetDNA.tsx            # Fase 1 — 5-assen radiale/radar visualisatie
      TierBadge.tsx           # Fase 1 — brons/zilver/goud/legendary
      TrendOverlay.tsx        # Fase 1 — 10-12: nu vs vorige maand (P1/P4)
    feedback/
      LevelUpCinematic.tsx    # Fase 2 — pack-opening sequence
      Confetti.tsx            # Fase 2 — particles (Framer Motion)
      Mascot.tsx              # Fase 2 — "Socks", safe-failure buffer
      use3DButton.ts          # Fase 2 — tactile press hook
    challenges/
      ChallengeCard.tsx       # Fase 3 — challenge + win-conditie + reflectie
      ChallengeFeedback.tsx   # Fase 3 — AI-spiegeling
      StreakFlame.tsx         # Fase 3 — capped streak vlam + sleep mode
    parent/
      ParentDashboard.tsx     # Fase 4 — 5-seconden inzicht
      ImpactCard.tsx          # Fase 4 — maandelijkse impact-kaart
      ParentNotifPrefs.tsx    # Fase 4 — notificatie-voorkeuren
```

### 3.2 Integratiepunten in bestaande code

| Wijziging | Bestand | Wat |
|-----------|---------|-----|
| Nieuwe tab "Mijn Kaart" | `Dashboard.tsx:51` (`PLAYER_SECTIONS`) | `{ id:'kaart', label:'Mijn Kaart', icon: Trophy }` |
| Render PlayerCard | `Dashboard.tsx:~1226` | naast bestaande `PlayerOverview` |
| Stat-event bij huiswerk | `Dashboard.tsx` `handleToggleHomeworkStatus` | `insert stat_events('homework_done')` |
| Stat-event bij video | `Dashboard.tsx` `handleSubmissionComplete` | `insert stat_events('video_submitted')` |
| Micro-interactie | `PlayerHomeworkCard.tsx:63` (voltooi-knop) | `use3DButton` + `Confetti` |
| Tier-up trigger | na `computeStats` | indien tier omhoog → `LevelUpCinematic` |
| Nieuwe rol 'parent' | `App.tsx:193` (role-switch) | render `<ParentDashboard>` |
| Parent fetch | `App.tsx` init | `parent_links` → bijbehorende speler-data |

### 3.3 Datastroom Inzet-DNA (Fase 1)

```
Kind voltooit huiswerk/video/challenge
        │
        ▼
 insert stat_events (append-only, bron van waarheid)
        │
        ▼
 computeStats(events)  ──►  upsert player_stats (cache)
        │                        │
        ▼                        ▼
 tier omhoog? ──ja──► LevelUpCinematic    InzetDNA / PlayerCard render
        │
       nee ──► stille update
```

`computeStats()` is een **pure functie** in `lib/stats.ts` (input: `StatEvent[]`, output: de 5
assen + XP + tier). Pure = unit-testbaar met Vitest (jullie hebben de setup al). Geen
businesslogica verstopt in componenten.

### 3.4 Leeftijdsdifferentiatie (P4) — één component, twee modes

`InzetDNA.tsx` leest `detectAgeGroup(player.age)`:

- **7–9 (U8/U10):** zachte niveaus `In opbouw → Stevig → Sterk` met icoon/kleur. Géén
  getallen. Schaal nooit "dramatisch leeg" (minimale basisvulling). Lage assen verschijnen
  alleen mild geframed.
- **10–12 (U12):** numerieke trend + `TrendOverlay` (twee polygonen: vorige maand vs. nu uit
  `prev_snapshot`). Mastery-taal, geen vergelijking met teamgenoten.

---

## 4. SDT-checklist per feature

Elke feature passeert deze poort vóór implementatie. SDT = Autonomie / Competentie /
Verbondenheid. `+` = versterkt, `⚠` = risico om te bewaken.

### Feature: Inzet-DNA kaart (Fase 1)
- **Autonomie** `+` Kind + coach kiezen 1–2 spotlight-assen (P5). Kind kiest eigen kaart-naam/rol.
- **Competentie** `+` Beloont gedrag dat het kind zelf bestuurt (P2), niet aangeboren talent.
- **Verbondenheid** `+` "Onze kaart voor jouw groei" — coach-stem zichtbaar bij assen.
- **Bewaken** `⚠` Nooit teamgemiddelde of ranking tonen (P1). Geen 1–10 schaal voor 7–9 (P4).
- **Veiligheid** `+` Privé "groeikaart", niet deelbaar met teamgenoten (P7).

### Feature: Kaart-tiers brons→legendary (Fase 1)
- **Autonomie** `+` Kind ziet zelf welke inzet de volgende tier ontgrendelt.
- **Competentie** `+` Tier = cumulatieve inzet, altijd haalbaar door doen (mastery, niet ego).
- **Verbondenheid** `~` Neutraal — houd tiers privé.
- **Bewaken** `⚠` Tier mag NOOIT van talent/coach-skills afhangen, alleen van `stat_events` (P2).

### Feature: Level-Up Pack Opening (Fase 2)
- **Autonomie** `+` Kind triggert het zelf door inzet; kan animatie overslaan.
- **Competentie** `+` Sensorische bekrachtiging van échte, eigen vooruitgang.
- **Verbondenheid** `~` Optioneel: "deel met je coach" knop (geen auto-broadcast).
- **Bewaken** `⚠` Max 350ms per micro-respons. Geen dark patterns / geen "verliesaversie"-trigger (P3).

### Feature: Micro-interacties voltooi-knop (Fase 2)
- **Competentie** `+` Directe effectance-feedback ("mijn actie deed iets").
- **Bewaken** `⚠` Warme audio (marimba), geen schrille tonen. Respecteer `prefers-reduced-motion`.

### Feature: Mascotte "Socks" (Fase 2)
- **Autonomie** `+` Biedt alternatieve, makkelijkere oefening aan (zone van naaste ontwikkeling).
- **Verbondenheid** `+` Empathische coach-stem.
- **Bewaken** `⚠` NOOIT schuld-messaging ("Socks is verdrietig" = verboden) (P3/Ethisch Kader).

### Feature: Capped Streak (Fase 3)
- **Autonomie** `+` Weekend-amulet: kind kiest zelf een rustdag zonder straf.
- **Competentie** `+` Weekdoel haalbaar; rust = onderdeel van training (sleep mode).
- **Bewaken** `⚠` Geen infinite streak, geen dagelijkse dwang, 3-uur earn-back venster (P3).

### Feature: Challenge-bibliotheek + AI-feedback (Fase 3)
- **Autonomie** `+` Kind kiest welke challenge, schrijft eigen reflectie.
- **Competentie** `+` Duidelijke win-conditie = mastery-ervaring. AI spiegelt + 1 micro-doel (P5).
- **Verbondenheid** `+` Mentaliteit-challenges (Captain Kindness) verankeren teamgevoel.
- **Bewaken** `⚠` AI altijd opbouwend/effort-based; nooit afkeurend (P7). Eén verbeterpunt per keer (P5).

### Feature: Ouderportaal + digest (Fase 4)
- **Autonomie** `+` Ouder kiest digest/push/light/full (P6). Kind houdt eigenaarschap data.
- **Competentie** `~` Toont skill-trend + "tijd met bal", niet schermtijd.
- **Verbondenheid** `+` Samen-doen framing: 1 tuin-challenge per week (P6).
- **Bewaken** `⚠` 1 digest + kritieke alerts, geen ruis. Geen post-wedstrijd evaluaties ("Car Ride Home"-regel). Privacy-by-default, geen 1-op-1 chat (P7).

---

## 5. Fasering & volgorde

| Fase | Levert | Nieuwe backend | Aanbevolen? |
|------|--------|----------------|-------------|
| **1** | Inzet-DNA kaart + tiers + leeftijdsmodes | `player_stats`, `stat_events` | ✅ **Start hier** |
| **2** | Pack Opening + micro-interacties + Socks | geen | ✅ Samen met 1 (max wow, min backend) |
| **3** | Capped streaks + 10 challenges + AI-feedback | `challenges`, `streaks`, `*_completions` | Daarna |
| **4** | Ouderportaal + digest + impact-kaart | `parent_links`, `notification_prefs` | Grootste retentie-waarde, meeste werk |

**Aanrader:** Fase 1 + de micro-interacties uit Fase 2 eerst. Ze leveren samen de grootste
zichtbare sprong (van rapportcijfer naar EA-FC-achtige groeikaart) met de minste nieuwe
infrastructuur, en bouwen direct op data die er al is (`completed_homework_ids`,
`homework_submissions`).

## 6. Definition of Done per fase

- [ ] SQL-migratie in `supabase/` + handmatig uitgevoerd in Supabase SQL Editor
- [ ] `lib/*.ts` pure functies met Vitest-tests (`computeStats`, `cardTier`, streak-logica)
- [ ] Componenten respecteren `prefers-reduced-motion`
- [ ] Elke feature afgevinkt tegen de SDT-checklist (§4)
- [ ] `npm run build` + `npm run lint` clean
- [ ] Leeftijdsmodes 7–9 én 10–12 visueel gecontroleerd

## 7. Openstaande beslissingen (voor gebruiker)

1. **Stat-herberekening**: client-side in `lib/stats.ts` (simpel, MVP) óf Supabase Edge
   Function (robuuster). Advies: client-side starten.
2. **Ouder-auth**: aparte Supabase-account met koppelcode (voorgesteld) óf ouder ziet kind via
   gedeelde PIN. Advies: echte auth-account i.v.m. P7.
3. **Challenge-content**: de 10 challenges uit het onderzoek as-is seeden, of eerst 4
   (één per categorie) als pilot.
