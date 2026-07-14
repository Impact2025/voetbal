-- Avatar-config (Bouw-je-baller) RLS: een speler mag ZIJN EIGEN avatar_config
-- bijwerken. De kolom is toegevoegd in add_avatar_config.sql, maar die migratie
-- dekte de update-policy niet expliciet. Deze migratie legt hem vast zodat de
-- PWA-avatar-editor op productie werkt ongeacht de staat van de bestaande
-- players-policies.
--
-- Patroon: speler = Supabase auth-user, eigen rij-id == auth.uid().
-- Idempotent: draai gerust meerdere keren.

alter table public.players enable row level security;

drop policy if exists "players_update_self_avatar" on public.players;
create policy "players_update_self_avatar"
  on public.players for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Zorg dat de kolom bestaat (veilig als add_avatar_config.sql al liep).
alter table public.players
  add column if not exists avatar_config jsonb;

comment on column public.players.avatar_config is
  'Zelf-gekozen avatar ("bouw je baller"): { skin, hair, hairColor, background, accessory }.';
