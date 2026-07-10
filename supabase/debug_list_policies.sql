-- Tijdelijke diagnose: laat de daadwerkelijk actieve RLS-policies op
-- team_coaches zien (naam, commando, permissive/restrictive, rollen,
-- de USING/WITH CHECK expressies). Nodig omdat secure_team_coaches_step2.sql
-- een ongeldige "FOR INSERT, UPDATE, DELETE" clausule bevat — Postgres
-- staat maar één commando per policy toe, dus die policy is mogelijk
-- nooit succesvol aangemaakt.
-- Kan achteraf verwijderd worden met: DROP FUNCTION debug_list_policies(text);

CREATE OR REPLACE FUNCTION debug_list_policies(p_table text)
RETURNS TABLE(
  policy_name text,
  cmd         text,
  permissive  text,
  roles       text,
  using_expr  text,
  check_expr  text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pol.polname::text,
    CASE pol.polcmd
      WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
      WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' WHEN '*' THEN 'ALL'
    END,
    CASE WHEN pol.polpermissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
    (SELECT string_agg(r.rolname, ',') FROM pg_roles r WHERE r.oid = ANY(pol.polroles)),
    pg_get_expr(pol.polqual, pol.polrelid),
    pg_get_expr(pol.polwithcheck, pol.polrelid)
  FROM pg_policy pol
  WHERE pol.polrelid = p_table::regclass;
$$;
