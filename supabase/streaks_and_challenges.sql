-- Fase 3: Streaks + Challenge-bibliotheek
-- Voer uit in Supabase SQL Editor

-- Capped streak per speler (één rij per speler, weekelijks reset)
create table if not exists streaks (
  player_id        uuid primary key,
  week_start       date not null,
  activities_count smallint default 0,
  week_goal        smallint default 2,
  best_week_count  smallint default 0,
  recovery_used    boolean default false,
  flame_state      text default 'active'
                   check (flame_state in ('active','sleep','complete')),
  updated_at       timestamptz default now()
);

-- Challenge templates (seeded via app)
create table if not exists challenges (
  id               text primary key,
  title            text not null,
  category         text not null check (category in ('techniek','inzicht','snelheid','mentaliteit')),
  age_min          smallint default 7,
  age_max          smallint default 12,
  setup            text not null,
  win_condition    text not null,
  youtube_url      text,
  reflection_prompt text,
  ai_feedback_hint text,
  created_at       timestamptz default now()
);

-- Per-speler voltooide challenges
create table if not exists challenge_completions (
  id           uuid primary key default gen_random_uuid(),
  challenge_id text not null references challenges(id),
  player_id    uuid not null,
  team_id      text not null,
  reflection   text,
  ai_feedback  text,
  completed_at timestamptz default now()
);

create index if not exists challenge_completions_player_idx on challenge_completions(player_id);

-- RLS: anon_all patroon (spelers hebben geen Supabase auth)
alter table streaks              enable row level security;
alter table challenges           enable row level security;
alter table challenge_completions enable row level security;

drop policy if exists anon_all_streaks on streaks;
create policy anon_all_streaks on streaks
  for all to anon using (true) with check (true);

drop policy if exists anon_all_challenges on challenges;
create policy anon_all_challenges on challenges
  for all to anon using (true) with check (true);

drop policy if exists anon_all_challenge_completions on challenge_completions;
create policy anon_all_challenge_completions on challenge_completions
  for all to anon using (true) with check (true);

-- updated_at trigger voor streaks
drop trigger if exists trg_streaks_updated_at on streaks;
create trigger trg_streaks_updated_at
  before update on streaks
  for each row execute function set_updated_at();
