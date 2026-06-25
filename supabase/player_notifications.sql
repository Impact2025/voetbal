-- ─── Player Push Notifications ───────────────────────────────────────────────
-- Run in Supabase SQL Editor: Dashboard → SQL Editor

-- 1. Push subscriptions (Web Push API endpoints per player)
create table if not exists player_push_subscriptions (
  player_id   text        primary key,
  subscription jsonb      not null,
  updated_at  timestamptz default now()
);

alter table player_push_subscriptions enable row level security;

drop policy if exists "anyone_manage_push_subscriptions" on player_push_subscriptions;
create policy "anyone_manage_push_subscriptions"
  on player_push_subscriptions for all
  using (true)
  with check (true);

-- 2. Notifications sent by coaches to players
create table if not exists player_notifications (
  id          uuid        primary key default gen_random_uuid(),
  player_id   text        not null,
  team_id     text,
  title       text        not null,
  body        text        not null,
  coach_name  text,
  read        boolean     default false,
  created_at  timestamptz default now()
);

alter table player_notifications enable row level security;

drop policy if exists "anyone_read_notifications" on player_notifications;
create policy "anyone_read_notifications"
  on player_notifications for select
  using (true);

drop policy if exists "anyone_insert_notifications" on player_notifications;
create policy "anyone_insert_notifications"
  on player_notifications for insert
  with check (true);

drop policy if exists "anyone_update_read" on player_notifications;
create policy "anyone_update_read"
  on player_notifications for update
  using (true)
  with check (true);

create index if not exists idx_player_notifications_player_created
  on player_notifications(player_id, created_at desc);

-- Enable realtime for live notification delivery
alter publication supabase_realtime add table player_notifications;
