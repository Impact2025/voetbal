-- ================================================================
-- BUNDEL B — Pro CRM
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- Vereist dat admin_superadmin.sql al gedraaid is (is_superadmin()).
-- ================================================================
-- Alleen de superadmin heeft toegang (RLS via is_superadmin()).
-- ================================================================


-- 1. ACCOUNTS (clubs/prospects/partners) — pipeline op stage
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_accounts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  type       text        NOT NULL DEFAULT 'prospect'
             CHECK (type IN ('prospect', 'club', 'partner', 'other')),
  stage      text        NOT NULL DEFAULT 'lead'
             CHECK (stage IN ('lead', 'demo', 'trial', 'paying', 'churned')),
  club_id    text,                       -- koppeling naar bestaande clubs.id (indien gesynct)
  website    text,
  owner      text,                       -- intern eigenaar van het account
  value      numeric     NOT NULL DEFAULT 0,  -- dealwaarde / MRR-indicatie
  tags       text[]      NOT NULL DEFAULT '{}',
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_accounts_club_id_uniq ON crm_accounts (club_id) WHERE club_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS crm_accounts_stage_idx ON crm_accounts (stage);


-- 2. CONTACTS (personen bij een account)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_contacts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid        NOT NULL REFERENCES crm_accounts (id) ON DELETE CASCADE,
  name       text        NOT NULL,
  email      text,
  phone      text,
  role       text,                       -- functie bij de club
  is_primary boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_contacts_account_idx ON crm_contacts (account_id);


-- 3. ACTIVITIES (notities, calls, taken — timeline)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_activities (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid        NOT NULL REFERENCES crm_accounts (id) ON DELETE CASCADE,
  type       text        NOT NULL DEFAULT 'note'
             CHECK (type IN ('note', 'call', 'email', 'meeting', 'task')),
  title      text        NOT NULL,
  body       text,
  done       boolean     NOT NULL DEFAULT false,  -- voor taken
  due_date   date,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_activities_account_idx ON crm_activities (account_id, created_at DESC);


-- 4. RLS — uitsluitend superadmin
-- ----------------------------------------------------------------
ALTER TABLE crm_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_accounts_superadmin   ON crm_accounts;
DROP POLICY IF EXISTS crm_contacts_superadmin   ON crm_contacts;
DROP POLICY IF EXISTS crm_activities_superadmin ON crm_activities;

CREATE POLICY crm_accounts_superadmin   ON crm_accounts   FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
CREATE POLICY crm_contacts_superadmin   ON crm_contacts   FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());
CREATE POLICY crm_activities_superadmin ON crm_activities FOR ALL TO authenticated USING (is_superadmin()) WITH CHECK (is_superadmin());


-- 5. updated_at trigger op accounts
-- ----------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_crm_accounts_updated_at ON crm_accounts;
CREATE TRIGGER trg_crm_accounts_updated_at
  BEFORE UPDATE ON crm_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 6. AUTO-SYNC: bestaande clubs → accounts, coaches → contacts
-- ----------------------------------------------------------------
-- SECURITY DEFINER omdat clubs/teams/auth.users cross-tenant gelezen
-- worden. Idempotent: voegt alleen toe wat nog niet bestaat.
CREATE OR REPLACE FUNCTION crm_sync_platform()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  new_accounts int := 0;
  new_contacts int := 0;
BEGIN
  IF NOT is_superadmin() THEN
    RAISE EXCEPTION 'Geen toegang: superadmin vereist.';
  END IF;

  -- Clubs die nog geen account hebben → toevoegen als betalende club.
  WITH ins AS (
    INSERT INTO crm_accounts (name, type, stage, club_id)
    SELECT c.name, 'club', 'paying', c.id
    FROM clubs c
    WHERE NOT EXISTS (SELECT 1 FROM crm_accounts a WHERE a.club_id = c.id)
    RETURNING 1
  )
  SELECT count(*) INTO new_accounts FROM ins;

  -- Coaches (via teams) → contacts onder het club-account.
  WITH ins2 AS (
    INSERT INTO crm_contacts (account_id, name, email, role)
    SELECT DISTINCT a.id,
           coalesce(nullif(split_part(em.email, '@', 1), ''), 'Coach'),
           em.email,
           'coach'
    FROM teams t
    JOIN crm_accounts a ON a.club_id = t.club_id
    JOIN auth.users u   ON u.id = t.coach_id
    LEFT JOIN profiles p ON p.id = t.coach_id
    CROSS JOIN LATERAL (SELECT coalesce(p.email, u.email) AS email) em
    WHERE em.email IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM crm_contacts cc
        WHERE cc.account_id = a.id AND cc.email = em.email
      )
    RETURNING 1
  )
  SELECT count(*) INTO new_contacts FROM ins2;

  RETURN jsonb_build_object('new_accounts', new_accounts, 'new_contacts', new_contacts);
END;
$$;

REVOKE ALL ON FUNCTION crm_sync_platform() FROM public, anon;
GRANT EXECUTE ON FUNCTION crm_sync_platform() TO authenticated;


-- ================================================================
-- Klaar! Controleer via:  SELECT crm_sync_platform();   (als superadmin)
-- ================================================================
