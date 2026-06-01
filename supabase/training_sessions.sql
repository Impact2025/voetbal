-- Training sessions table
-- Run this in Supabase SQL Editor to persist team sessions in the database.
-- Without this migration, team sessions are stored in localStorage (still fully functional).

create table if not exists public.training_sessions (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  title       text not null,
  plan        jsonb not null,
  created_at  timestamptz not null default now(),
  executed_at timestamptz
);

create index if not exists training_sessions_team_id_idx on public.training_sessions(team_id);

-- RLS: coaches can only access their own team's sessions
alter table public.training_sessions enable row level security;

create policy "coaches_own_team_sessions"
  on public.training_sessions
  for all
  using (
    team_id in (
      select id from public.teams where coach_id = auth.uid()
    )
  );
