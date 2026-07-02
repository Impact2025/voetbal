-- ─── In-app Messaging System ────────────────────────────────────────────────
-- Run in Supabase SQL Editor: Dashboard → SQL Editor

-- 1. Conversations (2-participant threads)
-- Note: clubs.id is text (not uuid) — match that type here
create table if not exists conversations (
  id                   uuid        primary key default gen_random_uuid(),
  club_id              text        references clubs(id) on delete cascade,
  participant_ids      uuid[]      not null,
  participant_names    text[]      not null,
  participant_roles    text[]      not null,
  last_message_at      timestamptz default now(),
  last_message_preview text,
  created_at           timestamptz default now()
);

-- 2. Messages inside a conversation
create table if not exists conversation_messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references conversations(id) on delete cascade,
  sender_id       uuid        not null,
  sender_name     text        not null,
  content         text        not null,
  created_at      timestamptz default now()
);

-- 3. Per-user read cursor (to compute unread count)
create table if not exists conversation_reads (
  conversation_id uuid        not null references conversations(id) on delete cascade,
  user_id         uuid        not null,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

alter table conversations         enable row level security;
alter table conversation_messages enable row level security;
alter table conversation_reads    enable row level security;

-- conversations
drop policy if exists "participants_can_view_conversations"   on conversations;
drop policy if exists "participants_can_create_conversations" on conversations;
drop policy if exists "participants_can_update_conversations" on conversations;

create policy "participants_can_view_conversations"
  on conversations for select
  using (auth.uid() = any(participant_ids));

create policy "participants_can_create_conversations"
  on conversations for insert
  with check (auth.uid() = any(participant_ids));

create policy "participants_can_update_conversations"
  on conversations for update
  using (auth.uid() = any(participant_ids));

-- messages
drop policy if exists "participants_can_view_messages" on conversation_messages;
drop policy if exists "participants_can_send_messages" on conversation_messages;

create policy "participants_can_view_messages"
  on conversation_messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and auth.uid() = any(c.participant_ids)
    )
  );

create policy "participants_can_send_messages"
  on conversation_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and auth.uid() = any(c.participant_ids)
    )
  );

-- read tracking
drop policy if exists "users_manage_own_reads" on conversation_reads;

create policy "users_manage_own_reads"
  on conversation_reads for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_conversations_participants
  on conversations using gin(participant_ids);

create index if not exists idx_conversations_club_last
  on conversations(club_id, last_message_at desc);

create index if not exists idx_messages_conv_created
  on conversation_messages(conversation_id, created_at asc);

-- ─── Trigger: keep last_message_at + preview up to date ───────────────────────

create or replace function fn_update_conversation_last_message()
returns trigger language plpgsql as $$
begin
  update conversations
  set
    last_message_at      = new.created_at,
    last_message_preview = left(new.content, 120)
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_conversation_last_message on conversation_messages;
create trigger trg_conversation_last_message
  after insert on conversation_messages
  for each row execute function fn_update_conversation_last_message();

-- ─── Realtime publicatie ─────────────────────────────────────────────────────
-- Zodat berichtenmeldingen live binnenkomen bij de ontvanger

alter publication supabase_realtime add table conversation_messages;
alter publication supabase_realtime add table conversations;

-- ─── RPC: contacts for a coach (club admin + verified parents) ───────────────
-- Note: teams.id and teams.club_id are text; teams.coach_id and profiles.id are uuid

create or replace function get_coach_contacts(p_coach_id uuid, p_team_id text)
returns table(
  contact_id   uuid,
  contact_name text,
  contact_role text,
  subtitle     text
)
language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_club_id text;
begin
  -- resolve club_id (text) for this coach's team
  select t.club_id into v_club_id from teams t where t.id = p_team_id;

  -- 1. Club admin(s) of this club
  return query
    select
      p.id                              as contact_id,
      coalesce(p.email, u.email)        as contact_name,
      'club_admin'::text                as contact_role,
      c.name                            as subtitle
    from profiles p
    join clubs c on c.id = p.club_id
    join auth.users u on u.id = p.id
    where p.role = 'club_admin'
      and p.club_id = v_club_id;

  -- 2. Verified parents with a registered account
  return query
    select
      pl.parent_id                           as contact_id,
      ('Ouder van ' || pl2.name)             as contact_name,
      'parent'::text                         as contact_role,
      coalesce(pf.email, u.email, '')        as subtitle
    from parent_links pl
    join players pl2 on pl2.id = pl.player_id
    join auth.users u on u.id = pl.parent_id
    left join profiles pf on pf.id = pl.parent_id
    where pl.team_id = p_team_id
      and pl.verified = true
      and pl.parent_id is not null;
end;
$$;

-- ─── RPC: contacts for a parent (their child's coach) ────────────────────────

create or replace function get_parent_contacts(p_parent_id uuid)
returns table(
  contact_id   uuid,
  contact_name text,
  contact_role text,
  subtitle     text
)
language plpgsql security definer
set search_path = public, auth
as $$
begin
  return query
    select distinct
      t.coach_id                                        as contact_id,
      coalesce(t.coach_name, t.team_name, 'Trainer')   as contact_name,
      'coach'::text                                     as contact_role,
      coalesce(p.email, u.email, '')                    as subtitle
    from parent_links pl
    join teams t on t.id = pl.team_id
    join auth.users u on u.id = t.coach_id
    left join profiles p on p.id = t.coach_id
    where pl.parent_id = p_parent_id
      and pl.verified = true;
end;
$$;
