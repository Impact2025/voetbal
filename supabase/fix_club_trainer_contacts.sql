-- ================================================================
-- FIX v2: get_club_trainer_emails gaf 0 rijen zodra een team een coach
-- had via team_coaches maar die uitnodiging nog niet had geaccepteerd
-- (coach_id dan nog NULL) — precies de staat vlak na "Coach toevoegen".
-- ================================================================
--
-- v1 (eerdere versie in dit bestand) las team_coaches met
-- status = 'active' AND coach_id IS NOT NULL. Voor het Trainers-tabblad
-- (e-mail-broadcast, geen in-app account nodig) is dat onnodig streng:
-- een uitgenodigde coach heeft al een e-mailadres, dus je kunt ze al
-- mailen vóórdat ze inloggen.
--
-- Deze versie:
--  - laat ook status = 'invited' rijen mee (coach_id kan dan NULL zijn)
--  - retourneert tc_id (team_coaches.id, altijd uniek/non-null) als
--    stabiele sleutel, naast de optionele coach_id
--  - retourneert status, zodat de UI "uitgenodigd" kan tonen
--
-- MessagingInbox.tsx (in-app 1-op-1 chat) filtert zelf rijen zonder
-- coach_id eruit — daar is een echt account nodig om een gesprek te
-- kunnen aanmaken. TrainersTab.tsx (e-mail) gebruikt alle rijen.
--
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

DROP FUNCTION IF EXISTS get_club_trainer_emails(text);

CREATE OR REPLACE FUNCTION get_club_trainer_emails(p_club_id text)
RETURNS TABLE(
  tc_id      uuid,
  coach_id   uuid,
  email      text,
  team_id    text,
  team_name  text,
  coach_role text,
  status     text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tc.id       AS tc_id,
    tc.coach_id,
    COALESCE(p.email, u.email, tc.email) AS email,
    t.id        AS team_id,
    t.team_name,
    tc.role     AS coach_role,
    tc.status
  FROM team_coaches tc
  JOIN teams t ON t.id = tc.team_id
  LEFT JOIN auth.users u ON u.id = tc.coach_id
  LEFT JOIN profiles p ON p.id = tc.coach_id
  WHERE t.club_id = p_club_id
    AND tc.status IN ('active', 'invited')
    AND t.archived_at IS NULL
  ORDER BY t.team_name, tc.role;
END;
$$;

-- ================================================================
-- Controleer via:
--   select * from get_club_trainer_emails('IMPACT-FC');
-- ================================================================
