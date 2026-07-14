-- ================================================================
-- Coach-goedkeuring bepaalt voltooiing + XP/streak (gate)
-- Uitvoeren in: Supabase Dashboard → SQL Editor
-- ================================================================

-- 1) granted-vlag op challenge_completions (trackt of de beloning al is uitgekeerd)
alter table challenge_completions
  add column if not exists granted boolean not null default false;

-- 2) Bestaande rijen zijn onder het oude gedrag al beloond bij inzenden.
--    Markeer ze als reeds goedgekeurd + uitgekeerd zodat er GEEN dubbele XP/streak
--    wordt toegekend en de speler ze wel als "Voltooid" blijft zien.
update challenge_completions
  set granted = true
  where granted = false
    and coach_reviewed = true;

-- 3) Voor rijen zónder coach_reviewed (oude data waar coach_reviewed nog null was):
--    deze zijn óók al beloond onder oud gedrag → ook markeren als uitgekeerd.
update challenge_completions
  set granted = true, coach_reviewed = true
  where granted = false
    and coach_reviewed is null;
