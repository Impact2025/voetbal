-- ================================================================
-- Teams & Coaches beheer (PRO-feature club-admin)
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. TEAMS: coach_id nullable + archivering
-- ----------------------------------------------------------------
-- Een team kan straks door de club-admin worden aangemaakt vóórdat er
-- een coach is toegewezen, en kan worden gearchiveerd i.p.v. hard verwijderd
-- (spelers/evaluaties/aanwezigheid blijven aan het team_id hangen).
alter table teams alter column coach_id drop not null;
alter table teams add column if not exists archived_at timestamp with time zone;

-- 2. TEAM_COACHES: volledige coach-rooster per team (many-to-many)
-- ----------------------------------------------------------------
-- teams.coach_id blijft bestaan als "hoofdcoach"-pointer voor bestaande
-- queries/RLS elders in de app. team_coaches is de bron van waarheid voor
-- het club-admin-rooster (wie coacht dit team, incl. assistenten en
-- openstaande uitnodigingen).
create table if not exists team_coaches (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null references teams(id) on delete cascade,
  club_id       text not null,
  coach_id      uuid,                    -- null zolang uitnodiging nog niet geaccepteerd is
  email         text not null,
  role          text not null default 'head' check (role in ('head', 'assistant')),
  status        text not null default 'active' check (status in ('invited', 'active', 'removed')),
  invite_token  text unique,
  invited_at    timestamp with time zone not null default now(),
  joined_at     timestamp with time zone,
  removed_at    timestamp with time zone,
  created_at    timestamp with time zone not null default now()
);

create index if not exists team_coaches_team_id_idx  on team_coaches (team_id);
create index if not exists team_coaches_club_id_idx  on team_coaches (club_id);
create index if not exists team_coaches_coach_id_idx on team_coaches (coach_id);
create unique index if not exists team_coaches_invite_token_idx on team_coaches (invite_token) where invite_token is not null;

-- 3. ROW LEVEL SECURITY
-- ----------------------------------------------------------------
alter table team_coaches enable row level security;

-- Anon kan alles lezen en schrijven (consistent met de rest van de app)
create policy "anon_all" on team_coaches
  for all
  to anon
  using (true)
  with check (true);

-- ================================================================
-- Klaar! Controleer via:
--   select * from team_coaches limit 5;
--   select id, coach_id, archived_at from teams limit 5;
-- ================================================================
