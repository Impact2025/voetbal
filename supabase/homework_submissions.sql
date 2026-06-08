-- ================================================================
-- Huiswerk Video Inzendingen
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1. TABEL
-- ----------------------------------------------------------------
create table if not exists homework_submissions (
  id                uuid primary key default gen_random_uuid(),
  player_id         uuid not null,
  homework_id       text not null,
  team_id           text not null,
  video_url         text,
  ai_feedback       text,
  feedback_status   text not null default 'pending'
                    check (feedback_status in ('pending', 'processing', 'done', 'error')),
  created_at        timestamp with time zone not null default now(),
  updated_at        timestamp with time zone not null default now()
);

-- Index voor snelle query per team/speler
create index if not exists homework_submissions_team_id_idx  on homework_submissions (team_id);
create index if not exists homework_submissions_player_id_idx on homework_submissions (player_id);

-- Auto-update van updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists homework_submissions_updated_at on homework_submissions;
create trigger homework_submissions_updated_at
  before update on homework_submissions
  for each row execute function set_updated_at();


-- 2. ROW LEVEL SECURITY
-- ----------------------------------------------------------------
alter table homework_submissions enable row level security;

-- Anon kan alles lezen en schrijven (consistent met de rest van de app)
-- In productie: vervang door team-gebaseerde policies
create policy "anon_all" on homework_submissions
  for all
  to anon
  using (true)
  with check (true);


-- 3. STORAGE BUCKET
-- ----------------------------------------------------------------
-- Maak de homework-videos bucket aan (public, 100 MB limit per bestand)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homework-videos',
  'homework-videos',
  true,
  104857600,   -- 100 MB
  array['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/avi', 'video/*']
)
on conflict (id) do update
  set file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- 4. STORAGE POLICIES
-- ----------------------------------------------------------------
-- Verwijder bestaande policies als ze er al zijn
drop policy if exists "anon_upload_homework_videos"  on storage.objects;
drop policy if exists "anon_read_homework_videos"    on storage.objects;
drop policy if exists "anon_delete_homework_videos"  on storage.objects;

-- Upload
create policy "anon_upload_homework_videos"
  on storage.objects for insert to anon
  with check (bucket_id = 'homework-videos');

-- Lezen
create policy "anon_read_homework_videos"
  on storage.objects for select to anon
  using (bucket_id = 'homework-videos');

-- Verwijderen (voor opnieuw inzenden)
create policy "anon_delete_homework_videos"
  on storage.objects for delete to anon
  using (bucket_id = 'homework-videos');


-- ================================================================
-- Klaar! Controleer via:
--   select * from homework_submissions limit 5;
--   select id, name from storage.buckets where id = 'homework-videos';
-- ================================================================
