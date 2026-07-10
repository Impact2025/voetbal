-- ================================================================
-- Coach goedkeuring: vinkje voor huiswerk- en challenge-inzendingen
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

alter table homework_submissions
  add column if not exists coach_reviewed boolean not null default false;

alter table challenge_completions
  add column if not exists coach_reviewed boolean not null default false;
