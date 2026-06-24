-- Add coach_name to teams table
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS coach_name text;
