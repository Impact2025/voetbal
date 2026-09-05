-- ================================================================
-- SQL SETUP: Test Coach Login (Milan / info@datingassistent.nl)
-- voor team VVCO11-1 — VOER UIT in Supabase Dashboard → SQL Editor
-- ================================================================

-- Stap 0: Bevestig de e-mailhandtekening voor de Auth gebruiker
-- (Verplicht: signup via anon key verstuurt geen bevestigingsmail wegens rate-limit)
UPDATE auth.users
   SET email_confirmed_at = now()
 WHERE email = 'info@datingassistent.nl';

-- Stap 1: team_coaches record zou er nu al zijn (aangemaakt via club_admin sessie)
-- Als niet — INSERT idempotent:
INSERT INTO public.team_coaches (team_id, club_id, coach_id, email, role, status, invite_token, invited_at)
SELECT 'VVCO11-1', 'VVC', 'ea781823-8d65-4eba-88a3-e99776c03042', 'info@datingassistent.nl', 'head', 'active', NULL, now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.team_coaches
   WHERE team_id = 'VVCO11-1' AND email = 'info@datingassistent.nl'
);

-- Stap 2: Zorg dat teams.coach_id verwijst naar de superadmin user UUID
UPDATE public.teams
   SET coach_id = 'ea781823-8d65-4eba-88a3-e99776c03042'
 WHERE id = 'VVCO11-1'
   AND coach_id IS DISTINCT FROM 'ea781823-8d65-4eba-88a3-e99776c03042';

-- Stap 3: Zorg dat er een coach profiel bestaat
INSERT INTO public.profiles (id, email, role, team_id, club_id)
VALUES ('ea781823-8d65-4eba-88a3-e99776c03042', 'info@datingassistent.nl', 'coach', 'VVCO11-1', 'VVC-O11-1')
ON CONFLICT (id) DO UPDATE
   SET email = EXCLUDED.email,
       role = EXCLUDED.role,
       team_id = EXCLUDED.team_id,
       club_id = EXCLUDED.club_id;

-- Stap 4: Verificatie
SELECT
  'auth.users' AS tabel,
  id,
  email,
  email_confirmed_at IS NOT NULL AS email_bevestigd,
  created_at
FROM auth.users
WHERE email = 'info@datingassistent.nl'

UNION ALL

SELECT
  'team_coaches',
  tc.id,
  tc.email,
  tc.status = 'active' AS email_bevestigd,
  tc.joined_at
FROM public.team_coaches tc
WHERE tc.team_id = 'VVCO11-1' AND tc.email = 'info@datingassistent.nl'

UNION ALL

SELECT
  'profiles',
  p.id,
  p.email,
  p.role = 'coach' AS email_bevestigd,
  p.created_at
FROM public.profiles p
WHERE p.id = 'ea781823-8d65-4eba-88a3-e99776c03042'

UNION ALL

SELECT
  'teams',
  t.id,
  t.team_name,
  t.coach_id = 'ea781823-8d65-4eba-88a3-e99776c03042' AS email_bevestigd,
  t.created_at
FROM public.teams t
WHERE t.id = 'VVCO11-1';

-- Als alle rijen "true" geven → klaar! Nu inloggen op:
-- https://skillkaart.nl
-- E-mail: info@datingassistent.nl
-- Wachtwoord: TestCoach2026!
