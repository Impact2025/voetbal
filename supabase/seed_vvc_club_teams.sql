-- VVC: club + 27 jeugdteams (O8-1 .. O12-4)
-- Run in Supabase SQL Editor. Idempotent (ON CONFLICT DO NOTHING/UPDATE).

INSERT INTO public.clubs (id, name, subscription_tier)
VALUES ('VVC', 'VVC', 'free')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.teams (id, club_id, coach_id, team_name, team_class, weekly_questions, assigned_homework_ids, evaluation_periods)
VALUES
  ('VVCO8-1', 'VVC', NULL, 'VVC O8-1', 'O8', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO8-2', 'VVC', NULL, 'VVC O8-2', 'O8', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO8-3', 'VVC', NULL, 'VVC O8-3', 'O8', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO8-4', 'VVC', NULL, 'VVC O8-4', 'O8', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO8-5', 'VVC', NULL, 'VVC O8-5', 'O8', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO8-6', 'VVC', NULL, 'VVC O8-6', 'O8', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO9-1', 'VVC', NULL, 'VVC O9-1', 'O9', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO9-2', 'VVC', NULL, 'VVC O9-2', 'O9', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO9-3', 'VVC', NULL, 'VVC O9-3', 'O9', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO9-4', 'VVC', NULL, 'VVC O9-4', 'O9', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO9-5', 'VVC', NULL, 'VVC O9-5', 'O9', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO10-1', 'VVC', NULL, 'VVC O10-1', 'O10', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO10-2', 'VVC', NULL, 'VVC O10-2', 'O10', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO10-3', 'VVC', NULL, 'VVC O10-3', 'O10', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO10-4', 'VVC', NULL, 'VVC O10-4', 'O10', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO10-5', 'VVC', NULL, 'VVC O10-5', 'O10', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO10-6', 'VVC', NULL, 'VVC O10-6', 'O10', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO11-1', 'VVC', NULL, 'VVC O11-1', 'O11', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO11-2', 'VVC', NULL, 'VVC O11-2', 'O11', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO11-3', 'VVC', NULL, 'VVC O11-3', 'O11', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO11-4', 'VVC', NULL, 'VVC O11-4', 'O11', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO11-5', 'VVC', NULL, 'VVC O11-5', 'O11', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO11-6', 'VVC', NULL, 'VVC O11-6', 'O11', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO12-1', 'VVC', NULL, 'VVC O12-1', 'O12', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO12-2', 'VVC', NULL, 'VVC O12-2', 'O12', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO12-3', 'VVC', NULL, 'VVC O12-3', 'O12', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II']),
  ('VVCO12-4', 'VVC', NULL, 'VVC O12-4', 'O12', '["Wat maakt een team goed?","Wat zijn de eigenschappen van een goede teamgenoot?","Wat kan ik doen om een goede teamgenoot te zijn?"]'::jsonb, ARRAY[]::text[], ARRAY['Evaluatie I','Evaluatie II'])
ON CONFLICT (id) DO NOTHING;
