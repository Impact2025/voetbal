-- Fase 4: Ouderportaal tabellen
-- Voer uit in Supabase SQL Editor

-- Koppeling ouder ↔ speler via link-code
create table if not exists parent_links (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null,
  team_id     text not null,
  parent_id   uuid,            -- null totdat ouder zich registreert
  link_code   text unique not null,
  verified    boolean default false,
  created_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '7 days')
);

create index if not exists parent_links_code_idx    on parent_links(link_code);
create index if not exists parent_links_parent_idx  on parent_links(parent_id);
create index if not exists parent_links_player_idx  on parent_links(player_id);

-- Meldingsvoorkeuren per ouder
create table if not exists notification_prefs (
  parent_id      uuid primary key,
  weekly_digest  boolean default true,
  critical_alerts boolean default true,
  channel        text default 'email' check (channel in ('email','push','both')),
  detail_level   text default 'light' check (detail_level in ('light','full')),
  updated_at     timestamptz default now()
);

-- RLS voor parent_links: coach (auth) mag schrijven, anon mag lezen (voor koppelcode-claim)
alter table parent_links     enable row level security;
alter table notification_prefs enable row level security;

drop policy if exists anon_read_parent_links on parent_links;
create policy anon_read_parent_links on parent_links
  for select to anon using (true);

drop policy if exists auth_all_parent_links on parent_links;
create policy auth_all_parent_links on parent_links
  for all to authenticated using (true) with check (true);

drop policy if exists auth_own_notif_prefs on notification_prefs;
create policy auth_own_notif_prefs on notification_prefs
  for all to authenticated using (auth.uid() = parent_id) with check (auth.uid() = parent_id);

drop trigger if exists trg_notif_prefs_updated_at on notification_prefs;
create trigger trg_notif_prefs_updated_at
  before update on notification_prefs
  for each row execute function set_updated_at();
