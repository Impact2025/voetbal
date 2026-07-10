-- Basis-weekchallenge: voltooiingen van de gratis challenge uit het seizoensprogramma
-- Voer uit in Supabase SQL Editor

create table if not exists week_challenge_completions (
  id           uuid primary key default gen_random_uuid(),
  week_plan_id uuid not null references season_week_plan(id) on delete cascade,
  player_id    uuid not null,
  team_id      text not null,
  completed_at timestamptz default now(),
  unique (week_plan_id, player_id)
);

create index if not exists week_challenge_completions_player_idx on week_challenge_completions(player_id);

-- RLS: anon_all patroon (spelers hebben geen Supabase auth, net als challenge_completions)
alter table week_challenge_completions enable row level security;

drop policy if exists anon_all_week_challenge_completions on week_challenge_completions;
create policy anon_all_week_challenge_completions on week_challenge_completions
  for all to anon using (true) with check (true);
