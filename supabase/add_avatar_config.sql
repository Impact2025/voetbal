-- "Bouw je baller" — avatar systeem
-- Voegt een gestructureerd avatar-config veld toe aan spelers.
-- Kind kiest zelf onderdelen (huid, haar, kleur, accessoire); geen echte foto's meer nodig.
--
-- Draai dit handmatig in de Supabase SQL editor.

alter table public.players
  add column if not exists avatar_config jsonb;

comment on column public.players.avatar_config is
  'Zelf-gekozen avatar ("bouw je baller"): { skin, hair, hairColor, background, accessory }. Vervangt avatar_url voor nieuwe profielen.';

-- avatar_url blijft bestaan voor bestaande (legacy) foto''s; de app faseert het uit.
-- Spelers werken hun eigen avatar_config bij via de bestaande players-update policy
-- (dezelfde policy die completed_homework_ids al toestaat vanuit de PWA).
