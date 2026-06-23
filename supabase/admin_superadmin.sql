-- ================================================================
-- BUNDEL A — Platform Superadmin
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================
-- Geeft v.munster@weareimpact.nl een platform-brede 'superadmin' rol,
-- een veilige cross-tenant metrics-RPC en een audit-log.
-- ================================================================


-- 0. ROL-CONSTRAINT UITBREIDEN MET 'superadmin'
-- ----------------------------------------------------------------
-- profiles.role heeft een check-constraint; voeg 'superadmin' toe aan
-- de toegestane waarden voordat we de rol zetten.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('club_admin', 'coach', 'player', 'parent', 'superadmin'));


-- 1. SUPERADMIN ROL TOEKENNEN
-- ----------------------------------------------------------------
-- Koppelt aan het bestaande auth-account van de eigenaar.
UPDATE profiles p
SET role = 'superadmin'
FROM auth.users u
WHERE p.id = u.id
  AND lower(u.email) = 'v.munster@weareimpact.nl';

-- Veiligheidsnet: als er nog geen profielrij bestaat, maak er een aan.
INSERT INTO profiles (id, role, email)
SELECT u.id, 'superadmin', u.email
FROM auth.users u
WHERE lower(u.email) = 'v.munster@weareimpact.nl'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);


-- 2. GUARD HELPER: is_superadmin()
-- ----------------------------------------------------------------
-- True wanneer de huidige aanroeper de superadmin is (op e-mail in de
-- JWT óf op profile-rol). SECURITY DEFINER zodat de profiles-lookup
-- niet door RLS geblokkeerd wordt.
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    coalesce(lower(auth.jwt() ->> 'email') = 'v.munster@weareimpact.nl', false)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    );
$$;


-- 3. CROSS-TENANT METRICS RPC: admin_metrics()
-- ----------------------------------------------------------------
-- Geeft één jsonb-object met platform-brede KPI's. SECURITY DEFINER
-- omzeilt bewust RLS, maar de functie weigert iedereen behalve de
-- superadmin of de service-role (gebruikt door de cron-rapporten).
CREATE OR REPLACE FUNCTION admin_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT (is_superadmin() OR coalesce(auth.role(), '') = 'service_role') THEN
    RAISE EXCEPTION 'Geen toegang: superadmin vereist.';
  END IF;

  -- Teams/clubs met activiteit in de laatste 30 dagen (via stat_events).
  WITH active_team_ids AS (
    SELECT DISTINCT team_id
    FROM stat_events
    WHERE created_at >= now() - interval '30 days'
  ),
  active_club_ids AS (
    SELECT DISTINCT t.club_id
    FROM teams t
    JOIN active_team_ids a ON a.team_id = t.id
    WHERE t.club_id IS NOT NULL
  )
  SELECT jsonb_build_object(
    'totals', jsonb_build_object(
      'clubs',        (SELECT count(*) FROM clubs),
      'teams',        (SELECT count(*) FROM teams),
      'players',      (SELECT count(*) FROM players),
      'coaches',      (SELECT count(*) FROM profiles WHERE role = 'coach'),
      'club_admins',  (SELECT count(*) FROM profiles WHERE role = 'club_admin'),
      'parents',      (SELECT count(*) FROM profiles WHERE role = 'parent')
    ),
    'signups', jsonb_build_object(
      'today',    (SELECT count(*) FROM auth.users WHERE created_at >= date_trunc('day', now())),
      'last_7d',  (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '7 days'),
      'last_30d', (SELECT count(*) FROM auth.users WHERE created_at >= now() - interval '30 days')
    ),
    'activity', jsonb_build_object(
      'events_7d',      (SELECT count(*) FROM stat_events WHERE created_at >= now() - interval '7 days'),
      'events_30d',     (SELECT count(*) FROM stat_events WHERE created_at >= now() - interval '30 days'),
      'submissions_7d', (SELECT count(*) FROM homework_submissions WHERE created_at >= now() - interval '7 days'),
      'videos_7d',      (SELECT count(*) FROM stat_events WHERE event_type = 'video_submitted' AND created_at >= now() - interval '7 days')
    ),
    'engagement', jsonb_build_object(
      'active_players_7d',  (SELECT count(DISTINCT player_id) FROM stat_events WHERE created_at >= now() - interval '7 days'),
      'active_players_30d', (SELECT count(DISTINCT player_id) FROM stat_events WHERE created_at >= now() - interval '30 days'),
      'active_teams_30d',   (SELECT count(*) FROM active_team_ids),
      'active_clubs_30d',   (SELECT count(*) FROM active_club_ids),
      'dormant_clubs',      (SELECT count(*) FROM clubs) - (SELECT count(*) FROM active_club_ids)
    ),
    'generated_at', now()
  )
  INTO result;

  RETURN result;
END;
$$;

-- Alleen ingelogde gebruikers + service-role mogen aanroepen; de functie
-- zelf checkt vervolgens op superadmin. Anon krijgt geen execute-recht.
REVOKE ALL ON FUNCTION admin_metrics() FROM public, anon;
GRANT EXECUTE ON FUNCTION admin_metrics() TO authenticated, service_role;


-- 4. AUDIT-LOG (pro)
-- ----------------------------------------------------------------
-- Elke gevoelige admin-actie wordt hier gelogd (schrijven gebeurt
-- server-side via de service-role; superadmin mag lezen).
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid,
  actor_email text,
  action      text        NOT NULL,
  target      text,
  meta        jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS admin_audit_log_created_idx ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_action_idx  ON admin_audit_log (action);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Alleen de superadmin mag de log lezen; schrijven loopt via service-role
-- (die RLS sowieso omzeilt), dus geen insert-policy nodig voor clients.
DROP POLICY IF EXISTS superadmin_read_audit ON admin_audit_log;
CREATE POLICY superadmin_read_audit ON admin_audit_log
  FOR SELECT TO authenticated
  USING (is_superadmin());


-- ================================================================
-- Klaar! Controleer via:
--   SELECT role FROM profiles p JOIN auth.users u ON u.id = p.id
--     WHERE lower(u.email) = 'v.munster@weareimpact.nl';
--   SELECT admin_metrics();   -- als superadmin ingelogd
-- ================================================================
