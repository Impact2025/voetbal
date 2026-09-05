-- ================================================================
-- MIGRATIE: Update ouder e-mailadres + koppel Alex van Munster
--
-- Doelnut:
--   * Ouder-mailadres wijzigen:  v.munster@weareimpact.nl  →  weareimpactnl@gmail.com
--   * Koppel Alex van Munster (VVCO11-1) aan zijn ouder-account
--   * Update is_superadmin() hard-coded e-mailcheck
--
-- VOER UIT in: Supabase Dashboard → SQL Editor  (vereist superadmin/service_role)
-- Idempotent: veilig om herhaaldelijk te draaien.
-- ================================================================

BEGIN;

-- 1. auth.users: hoofdmailadres bijwerken
UPDATE auth.users
  SET email = 'weareimpactnl@gmail.com',
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
  WHERE lower(email) = 'v.munster@weareimpact.nl';

-- Als er al een account bestaat met het nieuwe mailadres (merge-conflict),
-- dan skip we die — rapporteer maar.
DO $$
DECLARE
  dupe_count int;
BEGIN
  SELECT count(*) INTO dupe_count
  FROM auth.users
  WHERE lower(email) = 'weareimpactnl@gmail.com'
    AND id NOT IN (SELECT id FROM auth.users WHERE lower(email) = 'v.munster@weareimpact.nl');
  IF dupe_count > 0 THEN
    RAISE WARNING 'Let op: er bestaat al een ander account met % (niet overschreven).', 'weareimpactnl@gmail.com';
  END IF;
END $$;

-- 2. profiles: e-mailadres bijwerken
UPDATE profiles
  SET email = 'weareimpactnl@gmail.com'
  WHERE lower(email) = 'v.munster@weareimpact.nl';

-- 3. (Re)create parent_link Alex ↔ ouder
--    Alex van Munster: id = dfa9df53-0eef-484d-9c84-ad681390908c, team VVCO11-1
--    Ouder (Vincent):  id = 7cfbea0a-816b-4019-a183-c2bd4b918d8c
DELETE FROM parent_links
 WHERE player_id = 'dfa9df53-0eef-484d-9c84-ad681390908c'
   AND parent_id IS NOT NULL;

INSERT INTO parent_links (player_id, team_id, parent_id, link_code, verified)
VALUES ('dfa9df53-0eef-484d-9c84-ad681390908c', 'VVCO11-1', '7cfbea0a-816b-4019-a183-c2bd4b918d8c', NULL, true);

-- 4. notification_prefs voor ouder (upsert)
INSERT INTO notification_prefs (parent_id, weekly_digest, critical_alerts, channel, detail_level)
VALUES ('7cfbea0a-816b-4019-a183-c2bd4b918d8c', true, true, 'email', 'light')
ON CONFLICT (parent_id) DO UPDATE
  SET weekly_digest = EXCLUDED.weekly_digest,
      critical_alerts = EXCLUDED.critical_alerts,
      channel = EXCLUDED.channel,
      detail_level = EXCLUDED.detail_level,
      updated_at = now();

COMMIT;

-- 5. Update de hard-coded e-mailcheck in is_superadmin()
--    (admin_superadmin.sql regel 49: 'v.munster@weareimpact.nl' → 'weareimpactnl@gmail.com')
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    coalesce(lower(auth.jwt() ->> 'email') = 'weareimpactnl@gmail.com', false)
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'superadmin'
    )
$$;

-- ================================================================
-- VERIFICATIE
-- ================================================================
SELECT 'auth.users' AS tbl, id, email, email_confirmed_at IS NOT NULL AS confirmed
FROM auth.users
WHERE lower(email) = 'weareimpactnl@gmail.com'
UNION ALL
SELECT 'profiles', id, email, role AS confirmed
FROM profiles
WHERE lower(email) = 'weareimpactnl@gmail.com'
UNION ALL
SELECT 'parent_links', pl.player_id, u.email, pl.verified AS confirmed
FROM parent_links pl
JOIN auth.users u ON u.id = pl.parent_id
WHERE pl.player_id = 'dfa9df53-0eef-484d-9c84-ad681390908c';
