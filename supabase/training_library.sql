-- Training Library System
-- Run in Supabase SQL Editor after core schema is set up.

-- ── Clubs: add subscription tier ─────────────────────────────────────────────
ALTER TABLE public.clubs
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'pro'));

-- ── Training Library ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.training_library (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group       TEXT    NOT NULL CHECK (age_group IN ('O8', 'O9', 'O10', 'O11', 'O12')),
  training_number INTEGER NOT NULL CHECK (training_number BETWEEN 1 AND 32),
  exercises       JSONB   NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (age_group, training_number)
);

CREATE INDEX IF NOT EXISTS training_library_age_group_idx ON public.training_library (age_group);

ALTER TABLE public.training_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_library_read" ON public.training_library FOR SELECT USING (TRUE);

-- ── Season Week Plan ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.season_week_plan (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  age_group         TEXT    NOT NULL CHECK (age_group IN ('O8', 'O9', 'O10', 'O11', 'O12')),
  week_number       INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  sequence_number   INTEGER NOT NULL,
  training_a_number INTEGER,
  training_b_number INTEGER,
  homework          TEXT,
  challenge         TEXT,
  is_vacation       BOOLEAN NOT NULL DEFAULT FALSE,
  vacation_label    TEXT,
  UNIQUE (age_group, week_number)
);

CREATE INDEX IF NOT EXISTS season_week_plan_age_group_idx ON public.season_week_plan (age_group);

ALTER TABLE public.season_week_plan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "season_week_plan_read" ON public.season_week_plan FOR SELECT USING (TRUE);

-- ── Club Training Config ──────────────────────────────────────────────────────
-- club_id is TEXT to match clubs.id (which is TEXT in this project)
CREATE TABLE IF NOT EXISTS public.club_training_config (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id           TEXT    NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  age_group         TEXT    NOT NULL CHECK (age_group IN ('O8', 'O9', 'O10', 'O11', 'O12')),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  season_start_year INTEGER NOT NULL DEFAULT 2026,
  season_start_week INTEGER NOT NULL DEFAULT 35,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, age_group)
);

CREATE INDEX IF NOT EXISTS club_training_config_club_id_idx ON public.club_training_config (club_id);

ALTER TABLE public.club_training_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_admins_own_config"
  ON public.club_training_config FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM public.profiles WHERE id = auth.uid() AND role = 'club_admin'
    )
  );

CREATE POLICY "coaches_read_club_config"
  ON public.club_training_config FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM public.teams WHERE coach_id = auth.uid()
    )
  );

-- ── Club Week Overrides ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_week_overrides (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      TEXT    NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
  age_group    TEXT    NOT NULL CHECK (age_group IN ('O8', 'O9', 'O10', 'O11', 'O12')),
  week_number  INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 52),
  is_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  custom_notes TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (club_id, age_group, week_number)
);

CREATE INDEX IF NOT EXISTS club_week_overrides_club_id_idx ON public.club_week_overrides (club_id);

ALTER TABLE public.club_week_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "club_admins_own_overrides"
  ON public.club_week_overrides FOR ALL
  USING (
    club_id IN (
      SELECT club_id FROM public.profiles WHERE id = auth.uid() AND role = 'club_admin'
    )
  );

CREATE POLICY "coaches_read_week_overrides"
  ON public.club_week_overrides FOR SELECT
  USING (
    club_id IN (
      SELECT club_id FROM public.teams WHERE coach_id = auth.uid()
    )
  );
