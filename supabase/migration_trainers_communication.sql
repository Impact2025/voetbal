-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. Add email column to profiles (for new coach registrations)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Backfill emails for existing coaches from auth.users
UPDATE profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Club messages table for communication history
CREATE TABLE IF NOT EXISTS club_messages (
  id        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id   text        NOT NULL,
  sent_by   uuid        NOT NULL,
  to_emails text[]      NOT NULL DEFAULT '{}',
  to_names  text[]      NOT NULL DEFAULT '{}',
  subject   text        NOT NULL,
  body      text        NOT NULL,
  sent_at   timestamptz DEFAULT now()
);

-- 4. RPC function: returns coach emails for a club (SECURITY DEFINER = can read auth.users)
CREATE OR REPLACE FUNCTION get_club_trainer_emails(p_club_id text)
RETURNS TABLE(
  coach_id  uuid,
  email     text,
  team_id   text,
  team_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.coach_id,
    COALESCE(p.email, u.email) AS email,
    t.id        AS team_id,
    t.team_name
  FROM teams t
  JOIN auth.users u ON u.id = t.coach_id
  LEFT JOIN profiles p ON p.id = t.coach_id
  WHERE t.club_id = p_club_id
  ORDER BY t.team_name;
END;
$$;
