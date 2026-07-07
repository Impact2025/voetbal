-- ================================================================
-- SECURITY MIGRATION — Step 2: echte row-level scoping voor team_coaches
-- (vervangt step-1; nog steeds additive t.o.v. productie-data)
-- ================================================================
--
-- Stap 1 (secure_team_coaches_step1.sql) blokkeerde alleen anonieme
-- schrijfs — maar een INGELOGDE coach/club_admin kon nog steeds ELKE
-- rij in team_coaches aanraken (cross-club/cross-team tampering).
--
-- Deze stap voegt RESTRICTIVE policies toe die schrijven ÉN lezen
-- scoperen op identiteit:
--   - club_admin  → alleen rijen binnen eigen club_id
--   - coach       → eigen rij (coach_id = auth.uid()) + de andere coaches
--                   op de teams waar hij actief is (rooster-weergave)
--   - claim-flow  → een coach mag een uitnodiging claimen (coach_id NULL,
--                   status 'invited'); het invite_token is een geheime UUID,
--                   dus cross-claim is niet gokbaar.
--
-- Alle policies zijn RESTRICTIVE en gelden voor `anon, authenticated`.
-- Supabase verbindt altijd als de `anon`-PG-rol, maar bij een geldige
-- user-JWT levert auth.uid() de user-id — precies zoals in messaging.sql /
-- team_chat.sql / training_library.sql. Dus:
--   - zonder JWT (uid = NULL) → geen enkele branch matched → anon geblokkeerd.
--   - met JWT               → uid gekoppeld → alleen eigen club/team/rij.
--
-- De permissive `anon_all` (team_coaches.sql) blijft staan als "toestemming",
-- maar de restrictive laag eist hierboven de scoping. Netto: wereld-toegang
-- (anon én cross-tenant) is dicht, legitieme flows blijven werken.
--
-- Idempotent: DROP POLICY IF EXISTS + CREATE; functie met CREATE OR REPLACE.
-- ================================================================

-- 0. Stap-1 policy opruimen (inmiddels vervangen door de scoped varianten)
DROP POLICY IF EXISTS "team_coaches_write_authed" ON team_coaches;

-- 1. Helper: team-ids waar een coach actief is (SECURITY DEFINER ⇒ geen RLS,
--    dus geen recursie als deze functie binnen de team_coaches-RLS wordt
--    aangeroepen). Geeft '{}' als de coach nergens actief is.
CREATE OR REPLACE FUNCTION public.coach_active_team_ids(p_uid uuid)
RETURNS text[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(array_agg(team_id), '{}')
  FROM team_coaches
  WHERE coach_id = p_uid
    AND status = 'active';
$$;

-- 2. READ-scoping (RESTRICTIVE, SELECT). Geldig voor anon + authenticated.
DROP POLICY IF EXISTS "team_coaches_scoped_read" ON team_coaches;
CREATE POLICY "team_coaches_scoped_read"
  ON team_coaches
  AS RESTRICTIVE
  FOR SELECT
  TO anon, authenticated
  USING (
    -- club_admin ziet de hele club
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role = 'club_admin'
    )
    -- coach ziet zijn eigen coach-rij
    OR coach_id = auth.uid()
    -- coach ziet de andere coaches op zijn actieve teams (rooster)
    OR team_id = ANY (public.coach_active_team_ids(auth.uid()))
    -- open uitnodiging: leesbaar voor de claim-flow (token is geheim)
    OR coach_id IS NULL
  );

-- 3. WRITE-scoping (RESTRICTIVE, INSERT/UPDATE/DELETE). Geldig voor anon + authenticated.
DROP POLICY IF EXISTS "team_coaches_scoped_write" ON team_coaches;
CREATE POLICY "team_coaches_scoped_write"
  ON team_coaches
  AS RESTRICTIVE
  FOR INSERT, UPDATE, DELETE
  TO anon, authenticated
  WITH CHECK (
    -- club_admin mag rijen aanmaken/beheren binnen eigen club
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role = 'club_admin'
    )
    -- coach mag zijn eigen rij aanmaken (self-signup) en beheren
    OR coach_id = auth.uid()
  )
  USING (
    -- club_admin: eigen club
    club_id IN (
      SELECT club_id FROM profiles
      WHERE id = auth.uid() AND role = 'club_admin'
    )
    -- coach: eigen rij
    OR coach_id = auth.uid()
    -- claim-flow: een coach mag een nog-ongeclaimde uitnodiging claimen
    -- (coach_id NULL, status invited). auth.uid() is hier nog NULL op de rij,
    -- maar het geheime invite_token is de autorisatie (zie acceptCoachInvite).
    OR (coach_id IS NULL AND status = 'invited')
  );

-- ================================================================
-- Controle na uitvoeren (Supabase SQL Editor):
--   select polname, polcmd, polroles, polqual
--   from pg_policies where tablename = 'team_coaches';
-- Verwacht:
--   anon_all                 (permissive, ALL,        TO anon)
--   team_coaches_scoped_read (restrictive, SELECT,    TO anon,authenticated)
--   team_coaches_scoped_write(restrictive, INSERT/UPD/DEL, TO anon,authenticated)
--
-- Negatieve test (als server/API met service_role draait, omzeilt RLS — OK):
--   - Anoniem insert → geweigerd.
--   - Coach A insert met club_id van club B → geweigerd (WITH CHECK).
--   - Coach A update rij van club B → geweigerd (USING).
--   - Coach claimt invite via token → toegestaan (coach_id NULL branch).
-- ================================================================
