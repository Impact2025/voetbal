-- ================================================================
-- FIX: "new row violates row-level security policy for table team_coaches"
-- ================================================================
--
-- Root cause: de enige policy op deze tabel, "anon_all", is geschreven
-- TO anon. Zodra je ingelogd bent (geldige Supabase-sessie/JWT) verbindt
-- de app als de "authenticated" databankrol, niet als "anon" — voor die
-- rol bestond geen enkele policy. Met RLS aan (team_coaches.sql zet dit
-- aan) is het gevolg default-deny: elke INSERT/UPDATE/DELETE door een
-- ingelogde gebruiker werd geweigerd, ook al leek de policy "alles toestaan".
--
-- (De eerder geprobeerde secure_team_coaches_step1/step2.sql-scripts,
-- die dit hadden moeten vervangen door echte tenant-scoping, hebben
-- zelf nooit gewerkt — die bevatten een ongeldige "FOR INSERT, UPDATE,
-- DELETE"-clausule, wat niet toegestaan is in Postgres CREATE POLICY.
-- Zie supabase/debug_list_policies.sql: op dit moment bestaat alleen
-- "anon_all" op deze tabel.)
--
-- Deze fix breidt anon_all uit met de "authenticated"-rol, zodat
-- ingelogde coaches/club-admins/superadmins weer kunnen lezen/schrijven
-- — functioneel gelijk aan de oorspronkelijke, altijd-open opzet van
-- team_coaches.sql (dus geen nieuwe beperking, wel weer werkend).
--
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

DROP POLICY IF EXISTS "anon_all" ON team_coaches;
CREATE POLICY "anon_all"
  ON team_coaches
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ================================================================
-- Controle na uitvoeren:
--   select * from debug_list_policies('team_coaches');
-- Verwacht: anon_all | ALL | PERMISSIVE | anon,authenticated | true | true
-- ================================================================
