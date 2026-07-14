-- ============================================================================
-- players — write-hardening voor de anon-rol (spelers)
-- ============================================================================
-- WAAROM DE VORIGE VERSIE FOUT WAS
--   Spelers zijn GEEN Supabase auth-users. Ze loggen in via PIN en draaien op de
--   publieke ANON-key met een lokale sessie ({ user: { id } }). Daardoor is
--   auth.uid() NULL voor spelers, en doet een policy als "auth.uid() = id"
--   NIETS (matcht nooit) — dat is schijnveiligheid. Bovendien: écht per-rij
--   afdwingen ("alleen je eigen rij") is zonder auth-identiteit onmogelijk.
--
-- WAT DEZE MIGRATIE WÉL DOET (haalbare, echte hardening)
--   Beperkt op KOLOM-niveau wat de anon-rol mag bijwerken. Een kwaadwillende met
--   de publieke anon-key kan hierna GEEN pin_hash, evaluaties, naam, leeftijd of
--   team_id meer overschrijven — alleen de kolommen die spelers legitiem wijzigen:
--     • avatar_config            (bouw je baller)
--     • completed_homework_ids   (huiswerk afvinken)
--     • weekly_question_responses(weekvraag beantwoorden)
--   Coaches loggen in als 'authenticated' (echte JWT) en behouden volledige update.
--
-- RESTRISICO (bewust; vereist grotere refactor, aparte taak)
--   • Een anon-client kan technisch nog de avatar/huiswerk van een TEAMGENOOT
--     wijzigen (geen rij-identiteit). Impact laag: cosmetisch / voortgang.
--   • pin_hash is anon-leesbaar via de login-SELECT. Structureel dichtzetten
--     vraagt om PIN-verificatie via een SECURITY DEFINER RPC + login-refactor.
--
-- Raakt BEWUST geen RLS-policies of de RLS aan/uit-status aan: dat zou de
-- anon login-SELECT kunnen breken. Kolom-privileges werken los van RLS.
-- Idempotent — draai gerust meerdere keren.
-- ============================================================================

-- Kolom bestaat (veilig als add_avatar_config.sql al liep).
alter table public.players add column if not exists avatar_config jsonb;

-- Ruim de misleidende, dode policy op (matcht nooit voor anon-spelers).
drop policy if exists "players_update_self_avatar" on public.players;

-- Coaches (authenticated) behouden volledige update-rechten.
grant update on public.players to authenticated;

-- Spelers (anon): trek brede update in en sta alleen de veilige kolommen toe.
revoke update on public.players from anon;
grant update (avatar_config, completed_homework_ids, weekly_question_responses)
  on public.players to anon;

-- ── NALOOP-DIAGNOSE (los draaien; verwacht 3 regels: exact de kolommen hierboven)
-- select grantee, privilege_type, column_name
-- from information_schema.column_privileges
-- where table_name = 'players' and grantee = 'anon' and privilege_type = 'UPDATE'
-- order by column_name;
