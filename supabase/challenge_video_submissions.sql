-- ================================================================
-- Challenge video uploads: voeg video_url en video_ai_feedback toe
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

alter table challenge_completions
  add column if not exists video_url text,
  add column if not exists video_ai_feedback text;
