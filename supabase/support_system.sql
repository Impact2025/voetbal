-- ================================================================
-- Support & Ticketsysteem — Fase 0: datamodel + RLS
-- Uitvoeren in: Supabase Dashboard → SQL Editor
--
-- Zelfde beveiligingsmodel als team-chat (zie fix_team_chat_rls.sql):
-- spelers hebben geen Supabase-sessie (PIN-login), dus RLS op auth.uid()
-- kan hun toegang sowieso niet afdwingen. Alle lees/schrijfacties lopen
-- via serverless endpoints (api/support.ts, Fase 2/3) die de aanroeper
-- verifiëren via resolveIdentity() en daarna de service-role key
-- gebruiken. RLS staat daarom aan met NUL policies voor anon/authenticated
-- — dat is bedoeld, geen omissie: het sluit directe client-toegang af.
-- ================================================================

-- 0. EXTENSIE voor FAQ-embeddings (Fase 1/2)
-- ----------------------------------------------------------------
create extension if not exists vector;

-- 1. SUPPORT_CATEGORIES
-- ----------------------------------------------------------------
-- Bepaalt per doelgroep welke onderwerpen er zijn en waar een ticket
-- in die categorie standaard naartoe gerouteerd wordt.
create table if not exists support_categories (
  id          text primary key,
  name        text not null,
  audience    text not null check (audience in ('club', 'coach', 'ouder', 'speler')),
  routes_to   text not null check (routes_to in ('coach', 'club_admin', 'platform')),
  is_pro      boolean not null default false,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- 2. SUPPORT_TICKETS
-- ----------------------------------------------------------------
create table if not exists support_tickets (
  id                uuid primary key default gen_random_uuid(),
  club_id           text references clubs(id) on delete cascade,
  category_id       text references support_categories(id),
  subject           text not null,
  status            text not null default 'open'
                     check (status in ('open', 'in_behandeling', 'opgelost', 'gesloten')),
  priority          text not null default 'normaal'
                     check (priority in ('normaal', 'pro')),
  source            text not null default 'manual'
                     check (source in ('manual', 'widget', 'ai_escalation')),

  -- Melder — id is auth.uid() (coach/club_admin/parent/superadmin) of
  -- players.id (player); geen FK, want spelers zitten niet in auth.users.
  -- Waarden komen 1-op-1 uit Identity['kind'] in api/_lib/teamAccess.ts.
  created_by_kind   text not null check (created_by_kind in ('player', 'parent', 'coach', 'club_admin', 'superadmin')),
  created_by_id     text not null,
  created_by_name   text not null,

  -- Behandelaar — zelfde reden geen FK; null = nog niet toegewezen.
  assigned_to_kind  text check (assigned_to_kind in ('coach', 'club_admin', 'superadmin')),
  assigned_to_id    text,

  -- Meegegeven door de AI-agent bij escalatie (Fase 2), zodat een
  -- behandelaar niet het hele gesprek opnieuw hoeft te lezen.
  ai_summary        text,
  ai_confidence     numeric(3,2),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_support_tickets_club     on support_tickets(club_id, status);
create index if not exists idx_support_tickets_creator   on support_tickets(created_by_kind, created_by_id);
create index if not exists idx_support_tickets_assignee   on support_tickets(assigned_to_kind, assigned_to_id) where assigned_to_id is not null;

-- 3. SUPPORT_MESSAGES
-- ----------------------------------------------------------------
create table if not exists support_messages (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         uuid not null references support_tickets(id) on delete cascade,
  sender_kind       text not null check (sender_kind in ('player', 'parent', 'coach', 'club_admin', 'superadmin', 'ai')),
  sender_id         text not null,
  sender_name       text not null,
  body              text not null,
  is_internal_note  boolean not null default false,
  created_at        timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket on support_messages(ticket_id, created_at asc);

-- Houdt support_tickets.updated_at + status ('open' → 'in_behandeling' bij
-- eerste reactie van een behandelaar) synchroon met nieuwe berichten.
create or replace function fn_touch_support_ticket()
returns trigger language plpgsql as $$
begin
  update support_tickets
  set updated_at = new.created_at,
      status = case
        when status = 'open' and new.sender_kind in ('coach', 'club_admin', 'superadmin', 'ai')
          then 'in_behandeling'
        else status
      end
  where id = new.ticket_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_support_ticket on support_messages;
create trigger trg_touch_support_ticket
  after insert on support_messages
  for each row execute function fn_touch_support_ticket();

-- 4. AI_CHAT_SESSIONS + AI_CHAT_MESSAGES (Fase 2)
-- ----------------------------------------------------------------
create table if not exists ai_chat_sessions (
  id                  uuid primary key default gen_random_uuid(),
  club_id             text references clubs(id) on delete set null,
  user_kind           text not null check (user_kind in ('player', 'parent', 'coach', 'club_admin', 'superadmin')),
  user_id             text,
  started_at          timestamptz not null default now(),
  resolved            boolean not null default false,
  escalated_ticket_id uuid references support_tickets(id) on delete set null
);

create table if not exists ai_chat_messages (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references ai_chat_sessions(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  matched_faq_ids  text[],
  created_at       timestamptz not null default now()
);

create index if not exists idx_ai_chat_messages_session on ai_chat_messages(session_id, created_at asc);

-- 5. FAQ_ITEMS uitbreiden — embeddings + feedback (Fase 1)
-- ----------------------------------------------------------------
alter table faq_items add column if not exists embedding vector(1536);
alter table faq_items add column if not exists helpful_count   int not null default 0;
alter table faq_items add column if not exists unhelpful_count int not null default 0;

-- Aangeroepen door api/support.ts (faqFeedback-actie) via de service-role
-- client. SECURITY DEFINER + vaste kolomkeuze (geen dynamische SQL) i.p.v.
-- een losse update-policy voor de anon/authenticated rol.
create or replace function increment_faq_feedback(p_faq_id text, p_column text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_column = 'helpful_count' then
    update faq_items set helpful_count = helpful_count + 1 where id = p_faq_id;
  elsif p_column = 'unhelpful_count' then
    update faq_items set unhelpful_count = unhelpful_count + 1 where id = p_faq_id;
  end if;
end;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
-- Aan, zonder policies voor anon/authenticated → dicht voor directe
-- client-toegang. Serverless endpoints gebruiken de service-role key, die
-- RLS omzeilt. support_categories is de uitzondering: publiek leesbaar
-- (het widget-frontend toont categorieën vóórdat een gesprek begint).

alter table support_categories enable row level security;
alter table support_tickets    enable row level security;
alter table support_messages   enable row level security;
alter table ai_chat_sessions   enable row level security;
alter table ai_chat_messages   enable row level security;

drop policy if exists "support_categories_public_read" on support_categories;
create policy "support_categories_public_read"
  on support_categories for select
  using (true);

-- ─── Seed: standaard categorieën per doelgroep ────────────────────────────────

insert into support_categories (id, name, audience, routes_to, sort_order) values
  ('sp-huiswerk',    'Huiswerkvideo / upload lukt niet', 'speler', 'coach',       1),
  ('sp-pin',         'PIN-code kwijt of werkt niet',      'speler', 'coach',       2),
  ('sp-training',    'Training of oefening onduidelijk',  'speler', 'coach',       3),
  ('ou-koppeling',   'Koppeling met mijn kind',            'ouder',  'coach',       1),
  ('ou-privacy',     'Privacy / AVG',                       'ouder',  'club_admin',  2),
  ('ou-facturatie',  'Facturatie van de club',              'ouder',  'club_admin',  3),
  ('co-team',        'Team aanmaken of beheren',            'coach',  'club_admin',  1),
  ('co-ai',          'AI-bewegingsanalyse werkt niet',      'coach',  'club_admin',  2),
  ('co-licentie',    'Licentie / PRO-functies',             'coach',  'club_admin',  3),
  ('cl-facturatie',  'Facturatie / abonnement',             'club',   'platform',    1),
  ('cl-upgrade',     'PRO-upgrade of teams-limiet',         'club',   'platform',    2),
  ('cl-bug',         'Bug of technisch probleem',           'club',   'platform',    3)
on conflict (id) do nothing;

-- ================================================================
-- Klaar! Controleer via:
--   select * from support_categories order by audience, sort_order;
--   select column_name from information_schema.columns where table_name = 'faq_items';
-- ================================================================
