-- Team-uitdagingen: één collectief weekdoel per team
-- Coach stelt in, spelers zien gezamenlijke voortgang (geen individuele ranking)

create table if not exists team_challenges (
  id           uuid primary key default gen_random_uuid(),
  team_id      text not null,
  title        text not null,
  description  text not null default '',
  emoji        text not null default '🏆',
  target_count int  not null default 10,
  week_start   date not null,
  created_at   timestamptz not null default now(),
  unique(team_id, week_start)
);

create index if not exists team_challenges_team_week_idx
  on team_challenges(team_id, week_start);

alter table team_challenges enable row level security;

drop policy if exists anon_all_team_challenges on team_challenges;
create policy anon_all_team_challenges on team_challenges
  for all to anon using (true) with check (true);
