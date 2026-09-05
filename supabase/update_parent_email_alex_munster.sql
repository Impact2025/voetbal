-- ================================================================
-- MIGRATIE: Update ouder e-mailadres + koppel Alex van Munster
--
-- Doelnut:
--   * Ouder-mailadres wijzigen:  v.munster@weareimpact.nl  →  weareimpactnl@gmail.com
--   * Koppel Alex van Munster (VVCO11-1) aan zijn ouder-account
--
-- VOER UIT in: Supabase Dashboard → SQL Editor  (vereist service_role/superadmin)
-- Idempotent: veilig om herhaaldelijk te draaien.
--
-- TIP: als je psql gebruikt, run dan eerst alleen deze SELECT om te bevestigen
--      dat de oude e-mail matched (case-insensitive, trim):
--   SELECT id, email FROM auth.users WHERE lower(trim(email)) = lower(trim('v.munster@weareimpact.nl'));
-- ================================================================

-- ── FASE 1: DATA-UPDATES (in één transactie) ──────────────────────
BEGIN;

-- Debug: rapporteer hoeveel rijen er gematcht worden
DO $$
DECLARE
  u_count int := 0;
  p_count int := 0;
BEGIN
  SELECT count(*) INTO u_count
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim('v.munster@weareimpact.nl'));

  SELECT count(*) INTO p_count
  FROM profiles
  WHERE lower(trim(email)) = lower(trim('v.munster@weareimpact.nl'));

  RAISE NOTICE 'auth.users matches: %', u_count;
  RAISE NOTICE 'profiles matches: %', p_count;

  -- Stop alleen als er echt nergens een match is (zodat herhalingen veilig zijn)
  IF u_count = 0 AND p_count = 0 THEN
    RAISE WARNING 'Geen matches gevonden voor v.munster@weareimpact.nl — skip update.';
  ELSE
    -- 1a. auth.users
    UPDATE auth.users
      SET email = 'weareimpactnl@gmail.com'
      WHERE lower(trim(email)) = lower(trim('v.munster@weareimpact.nl'));
    RAISE NOTICE 'auth.users rows updated: %', u_count;

    -- 1b. profiles
    UPDATE profiles
      SET email = 'weareimpactnl@gmail.com'
      WHERE lower(trim(email)) = lower(trim('v.munster@weareimpact.nl'));
    RAISE NOTICE 'profiles rows updated: %', p_count;

    -- 2. parent_link aanmaken (Alex ↔ ouder)
    --    Alex:  id = dfa9df53-0eef-484d-9c84-ad681390908c, team VVCO11-1
    --    Ouder: id = 7cfbea0a-816b-4019-a183-c2bd4b918d8c
    DELETE FROM parent_links
     WHERE player_id = 'dfa9df53-0eef-484d-9c84-ad681390908c'
       AND parent_id IS NOT NULL;

    INSERT INTO parent_links (player_id, team_id, parent_id, link_code, verified)
    VALUES ('dfa9df53-0eef-484d-9c84-ad681390908c', 'VVCO11-1',
            '7cfbea0a-816b-4019-a183-c2bd4b918d8c', NULL, true);
    RAISE NOTICE 'parent_link inserted: 1';

    -- 3. notification_prefs (upsert)
    INSERT INTO notification_prefs
      (parent_id, weekly_digest, critical_alerts, channel, detail_level)
    VALUES
      ('7cfbea0a-816b-4019-a183-c2bd4b918d8c', true, true, 'email', 'light')
    ON CONFLICT (parent_id) DO UPDATE
      SET weekly_digest    = EXCLUDED.weekly_digest,
          critical_alerts  = EXCLUDED.critical_alerts,
          channel          = EXCLUDED.channel,
          detail_level     = EXCLUDED.detail_level,
          updated_at       = now();
    RAISE NOTICE 'notification_prefs upserted: 1';
  END IF;
END $$;

COMMIT;

-- ── FASE 2: UPDATE is_superadmin() functie (separately, los van data) ──
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
SELECT 'profiles' AS tbl, id, email, role
  FROM profiles
  WHERE lower(email) = 'weareimpactnl@gmail.com'
UNION ALL
SELECT 'parent_links', pl.player_id, p.email, pl.verified::text
  FROM parent_links pl
  JOIN profiles p ON p.id = pl.parent_id
  WHERE pl.player_id = 'dfa9df53-0eef-484d-9c84-ad681390908c'
UNION ALL
SELECT 'notification_prefs', np.parent_id, np.parent_id::text, np.weekly_digest::text
  FROM notification_prefs np
  WHERE np.parent_id = '7cfbea0a-816b-4019-a183-c2bd4b918d8c';
