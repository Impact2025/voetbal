-- Fix: voeg superadmin RLS policies toe voor training-tabellen
-- Uitvoeren in: Supabase Dashboard → SQL Editor

-- club_training_config: superadmin mag alles lezen én schrijven
DROP POLICY IF EXISTS "superadmin_all_config" ON public.club_training_config;
CREATE POLICY "superadmin_all_config"
  ON public.club_training_config FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- club_week_overrides: superadmin mag alles lezen én schrijven
DROP POLICY IF EXISTS "superadmin_all_overrides" ON public.club_week_overrides;
CREATE POLICY "superadmin_all_overrides"
  ON public.club_week_overrides FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());
