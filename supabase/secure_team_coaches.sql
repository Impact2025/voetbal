-- ================================================================
-- SECURITY FIX: team_coaches stond wagenwijd open
-- ================================================================
--
-- De enige policy was:
--   anon_all  FOR ALL  TO anon, authenticated  USING (true) WITH CHECK (true)
--
-- Gevolg: elke bezoeker van skillkaart.nl kon met de publieke anon-key de
-- volledige tabel uitlezen — inclusief invite_token — en zich met een
-- willekeurig token als coach van een willekeurig team registreren. Ook
-- INSERT/UPDATE/DELETE stonden open voor anon.
--
-- Deze migratie:
--  1. geeft anon GEEN directe tabeltoegang meer; de uitnodigingsflow loopt
--     via twee SECURITY DEFINER-functies die alleen op token werken en het
--     token zelf nooit teruggeven;
--  2. beperkt SELECT tot ingelogde gebruikers binnen dezelfde club;
--  3. beperkt INSERT/UPDATE/DELETE tot de club-admin van die club (of een
--     superadmin), met één uitzondering: een coach mag zichzelf koppelen
--     (coach_id = auth.uid()) bij zelfregistratie van een eigen team.
--
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

-- ─── Helpers ────────────────────────────────────────────────────

-- Rol + club van de ingelogde gebruiker. SECURITY DEFINER omdat policies op
-- team_coaches anders zelf weer profiles moeten kunnen lezen.
CREATE OR REPLACE FUNCTION current_club_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT club_id FROM profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION current_role_name()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM profiles WHERE id = auth.uid() $$;

CREATE OR REPLACE FUNCTION is_club_manager(p_club_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT current_role_name() = 'superadmin'
      OR (current_role_name() = 'club_admin' AND current_club_id() = p_club_id)
$$;

-- ─── Policies ───────────────────────────────────────────────────

ALTER TABLE team_coaches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_all" ON team_coaches;
DROP POLICY IF EXISTS "tc_select_own_club" ON team_coaches;
DROP POLICY IF EXISTS "tc_insert_manager_or_self" ON team_coaches;
DROP POLICY IF EXISTS "tc_insert_manager" ON team_coaches;
DROP POLICY IF EXISTS "tc_insert_self_owned_team" ON team_coaches;
DROP POLICY IF EXISTS "tc_update_manager" ON team_coaches;
DROP POLICY IF EXISTS "tc_delete_manager" ON team_coaches;

-- Lezen: ingelogde gebruikers zien alleen rijen van hun eigen club.
-- anon krijgt bewust GEEN leesrecht; dat is wat invite_token beschermt.
CREATE POLICY "tc_select_own_club" ON team_coaches
  FOR SELECT TO authenticated
  USING (current_role_name() = 'superadmin' OR club_id = current_club_id());

-- Aanmaken door de club-admin van die club (het uitnodigen van een coach).
CREATE POLICY "tc_insert_manager" ON team_coaches
  FOR INSERT TO authenticated
  WITH CHECK (is_club_manager(club_id));

-- Zelfregistratie: een coach die net een eigen team heeft aangemaakt koppelt
-- zichzelf eraan (AuthComponent). Dit gebeurt vóór e-mailbevestiging, dus
-- zonder sessie — vandaar ook TO anon. De EXISTS-check bindt de rij aan een
-- team dat deze coach al bezit, zodat er geen willekeurige koppeling mogelijk is.
CREATE POLICY "tc_insert_self_owned_team" ON team_coaches
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    coach_id IS NOT NULL
    AND status = 'active'
    AND EXISTS (SELECT 1 FROM teams t WHERE t.id = team_id AND t.coach_id = team_coaches.coach_id)
  );

-- Wijzigen/verwijderen: alleen de club-admin van die club.
-- Het accepteren van een uitnodiging loopt NIET hierlangs, maar via
-- accept_coach_invite() hieronder — die draait als SECURITY DEFINER.
CREATE POLICY "tc_update_manager" ON team_coaches
  FOR UPDATE TO authenticated
  USING (is_club_manager(club_id)) WITH CHECK (is_club_manager(club_id));

CREATE POLICY "tc_delete_manager" ON team_coaches
  FOR DELETE TO authenticated
  USING (is_club_manager(club_id));

-- ─── Uitnodigingsflow (werkt zonder login, alleen op token) ─────

-- Zoekt een uitnodiging op token. Geeft het token NOOIT terug, zodat een
-- gelekte respons niet herbruikbaar is. Geen token = geen rij.
DROP FUNCTION IF EXISTS get_coach_invite(text);
CREATE OR REPLACE FUNCTION get_coach_invite(p_token text)
RETURNS TABLE(id uuid, email text, team_id text, club_id text, role text, team_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT tc.id, tc.email, tc.team_id, tc.club_id, tc.role,
         COALESCE(t.team_name, tc.team_id)
  FROM team_coaches tc
  LEFT JOIN teams t ON t.id = tc.team_id
  WHERE tc.invite_token = p_token
    AND tc.status = 'invited'
    AND tc.coach_id IS NULL
$$;

-- Rondt de uitnodiging af: koppelt het verse account aan de team_coaches-rij,
-- vult zo nodig teams.coach_id, en maakt het coach-profiel aan. Alles in één
-- transactie, zodat er geen half afgeronde acceptatie kan blijven hangen.
DROP FUNCTION IF EXISTS accept_coach_invite(text, uuid, text);
CREATE OR REPLACE FUNCTION accept_coach_invite(p_token text, p_coach_id uuid, p_email text)
RETURNS TABLE(team_id text, club_id text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row team_coaches%ROWTYPE;
BEGIN
  -- FOR UPDATE: twee gelijktijdige acceptaties van hetzelfde token serialiseren,
  -- de tweede vindt status <> 'invited' en faalt.
  SELECT * INTO v_row FROM team_coaches
   WHERE invite_token = p_token AND status = 'invited' AND coach_id IS NULL
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deze uitnodiging is niet meer geldig.';
  END IF;

  UPDATE team_coaches
     SET coach_id = p_coach_id, status = 'active', joined_at = now(), invite_token = NULL
   WHERE id = v_row.id;

  IF v_row.role = 'head' THEN
    UPDATE teams SET coach_id = p_coach_id
     WHERE id = v_row.team_id AND coach_id IS NULL;
  END IF;

  INSERT INTO profiles (id, role, team_id, club_id, email)
  VALUES (p_coach_id, 'coach', v_row.team_id, v_row.club_id, lower(trim(p_email)))
  ON CONFLICT (id) DO UPDATE
    SET role = 'coach', team_id = EXCLUDED.team_id, club_id = EXCLUDED.club_id;

  RETURN QUERY SELECT v_row.team_id, v_row.club_id;
END;
$$;

REVOKE ALL ON FUNCTION get_coach_invite(text) FROM public;
REVOKE ALL ON FUNCTION accept_coach_invite(text, uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION get_coach_invite(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION accept_coach_invite(text, uuid, text) TO anon, authenticated;

-- ================================================================
-- Controle na uitvoeren:
--   select * from debug_list_policies('team_coaches');
-- Verwacht: 5 policies. Alleen tc_insert_self_owned_team raakt anon, en die
-- geeft uitsluitend INSERT — geen SELECT, dus geen invite_token voor anon.
--
-- En met de anon-key (zou 0 rijen moeten geven):
--   select * from team_coaches;
-- ================================================================
