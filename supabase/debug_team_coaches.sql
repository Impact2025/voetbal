-- Tijdelijke diagnose-functie: laat ALLE team_coaches-rijen zien voor een club,
-- ongeacht status, om te controleren of er ooit coaches zijn toegevoegd.
-- Kan achteraf verwijderd worden met: DROP FUNCTION debug_team_coaches(text);

CREATE OR REPLACE FUNCTION debug_team_coaches(p_club_id text)
RETURNS TABLE(
  team_id     text,
  team_name   text,
  coach_id    uuid,
  email       text,
  role        text,
  status      text,
  invited_at  timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT tc.team_id, t.team_name, tc.coach_id, tc.email, tc.role, tc.status, tc.invited_at
  FROM team_coaches tc
  JOIN teams t ON t.id = tc.team_id
  WHERE t.club_id = p_club_id
  ORDER BY tc.invited_at;
END;
$$;
