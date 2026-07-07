-- ================================================================
-- SECURITY MIGRATION — Step 1: lock down team_coaches writes
-- (additive, breekt niets)
-- ================================================================
--
-- Probleem: team_coaches.sql legde een `anon_all` policy aan
--   CREATE POLICY "anon_all" ON team_coaches FOR ALL TO anon USING (true)
-- daardoor kon iEDEREEN (ingelogd of niet) rijen lezen én schrijven.
-- team_coaches bevat coach-e-mails en invite-tokens — wereld-geschreven
-- is een datalek- en abuse-vector.
--
-- Oplossing (additief): we DROPPEN anon_all NIET. In plaats daarvan
-- voegen we een RESTRICTIVE policy toe. Postgres evalueert permissive
-- policies (OR) EN restrictive policies (AND). anon_all blijft dus
-- "toestemming geven", maar de restrictive policy eist bovendien dat
-- de aanvraag van een INGELOGDE gebruiker komt (auth.uid() IS NOT NULL).
--
--   - Logged-out (anon) schrijven → geblokkeerd.
--   - Ingelogde coach / club_admin → ongewijzigd toegestaan.
--   - SELECT (lezen) blijft open zoals voorheen → geen read-breakage.
--   - service_role (server/API via supabaseAdmin) omzeilt RLS → cron/
--     server-flows blijven werken.
--
-- Uitvoeren in: Supabase Dashboard → SQL Editor, of via supabase CLI.
-- Idempotent: DROP POLICY IF EXISTS + CREATE.
-- ================================================================

-- 1. Schrijf-toegang (INSERT/UPDATE/DELETE) mag alleen van een
--    ingelogde sessie komen. Dit is de restrictive laag bovenop anon_all.
DROP POLICY IF EXISTS "team_coaches_write_authed" ON team_coaches;
CREATE POLICY "team_coaches_write_authed"
  ON team_coaches
  AS RESTRICTIVE
  FOR INSERT, UPDATE, DELETE
  TO anon, authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. (Optioneel, uitgeschakeld) — verdere coach/club *row-level* scoping.
--    Pas activeren zodra de invite-accept flow is geverifieerd: een coach
--    claimt een rij waarvan coach_id nog NULL is, dus een strikte
--    `coach_id = auth.uid()` check blokkeert het accepteren. Vandaar
--    expliciet buiten stap 1 gehouden.
--
-- create policy "team_coaches_scoped" on team_coaches
--   as restrictive for all to anon, authenticated
--   using (
--     auth.uid() is not null and (
--       club_id in (select club_id from public.profiles
--                   where id = auth.uid() and role = 'club_admin')
--       or team_id in (select team_id from public.team_coaches
--                      where coach_id = auth.uid() and status = 'active')
--       or coach_id = auth.uid()
--     )
--   )
--   with check ( /* zelfde voorwaarde als USING */ );

-- ================================================================
-- Controle na uitvoeren:
--   select polname, polcmd, polroles, polqual
--   from pg_policies where tablename = 'team_coaches';
-- Verwacht: anon_all (permissive, ALL) + team_coaches_write_authed
-- (restrictive, INSERT/UPDATE/DELETE, eist auth.uid() IS NOT NULL).
-- ================================================================
