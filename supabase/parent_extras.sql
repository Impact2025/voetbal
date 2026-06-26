-- parent_extras.sql
-- Two new tables for the world-class parent app:
--   1. parent_consents  — AVG/GDPR verifiable parental consent (VPC)
--   2. parent_nps       — NPS microsurvey responses from parents

-- ── 1. parent_consents ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_consents (
  parent_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  consented_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, player_id, consent_version)
);

ALTER TABLE parent_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent manages own consents"
  ON parent_consents FOR ALL
  USING (parent_id = auth.uid());

-- ── 2. parent_nps ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS parent_nps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL CHECK (score BETWEEN 1 AND 10),
  feedback   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE parent_nps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parent manages own nps"
  ON parent_nps FOR ALL
  USING (parent_id = auth.uid());

-- Optional: allow superadmin to read NPS scores for analytics.
-- Only uncomment after admin_superadmin.sql has been run.
-- CREATE POLICY "superadmin reads nps"
--   ON parent_nps FOR SELECT
--   USING (is_superadmin());
