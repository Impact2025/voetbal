-- Fase 1: Inzet-DNA tabellen
-- Voer uit in Supabase SQL Editor

-- player_stats: derived cache (opnieuw berekend vanuit stat_events)
create table if not exists player_stats (
  player_id    uuid primary key,
  team_id      text not null,
  consistentie smallint not null default 0,
  werkethiek   smallint not null default 0,
  techniek     smallint not null default 0,
  focus        smallint not null default 0,
  team_spirit  smallint not null default 0,
  tier         text not null default 'brons'
               check (tier in ('brons','zilver','goud','legendary')),
  total_xp     integer not null default 0,
  prev_snapshot jsonb,
  snapshot_at  timestamptz,
  updated_at   timestamptz not null default now()
);

-- stat_events: append-only event log (bron van waarheid)
create table if not exists stat_events (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null,
  team_id     text not null,
  event_type  text not null
              check (event_type in ('homework_done','video_submitted','challenge_done','reflection','teamspirit')),
  axis        text not null
              check (axis in ('consistentie','werkethiek','techniek','focus','team_spirit')),
  xp          integer not null default 10,
  meta        jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists stat_events_player_idx on stat_events(player_id);
create index if not exists stat_events_team_idx   on stat_events(team_id);

-- RLS: zelfde anon_all patroon als homework_submissions
alter table player_stats enable row level security;
alter table stat_events   enable row level security;

drop policy if exists anon_all_player_stats on player_stats;
create policy anon_all_player_stats on player_stats
  for all to anon using (true) with check (true);

drop policy if exists anon_all_stat_events on stat_events;
create policy anon_all_stat_events on stat_events
  for all to anon using (true) with check (true);

-- updated_at trigger voor player_stats
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_player_stats_updated_at on player_stats;
create trigger trg_player_stats_updated_at
  before update on player_stats
  for each row execute function set_updated_at();
