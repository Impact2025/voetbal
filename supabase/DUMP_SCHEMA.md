# Database schema is NIET-versiebeheerd — HERSTELPLAN

## Status (2026-07-14)
De productiedatabase (project `ezbsychffwnavedwiqvw`, alias VVCcoach) draait, maar
het schema is **met de hand in Supabase Studio gebouwd**. Er stonden 55 losse
`.sql`-bestanden in `supabase/*.sql` (fix-scripts + feature-tables), maar GEEN
`supabase/migrations/` en geen `create table` voor de kern-tabellen
(`profiles`, `clubs`, `blog_posts`, `coupons`, `avatars`, `teams`).

Daardoor kan een nieuwe omgeving (staging, disaster-recovery, onboarding van een
dev) de DB niet uit de repo opbouwen. Dit is de belangrijkste
"niet-wereldklasse"-bevinding uit de audit.

## Oplossing — schema dumpen naar één migratie (doe dit ÉÉN keer)
Vereist: `supabase` CLI op PATH én een DB-wachtwoord (via de Supabase
dashboard "Database → Connection string", of `supabase db` met
`SUPABASE_DB_PASSWORD` gezet). Dit kan NIET vanaf een machine zonder
credentials — vandaar dit handmatige stapje.

```bash
cd player-hub

# 1) Project staat al gelinkt (zie supabase/.temp/linked-project.json: ref ezbsychffwnavedwiqvw)
supabase status            # bevestigt link; anders: supabase link --project-ref ezbsychffwnavedwiqvw

# 2) Dump het volledige schema (geen data) naar de migratie-structuur
supabase db dump --data-only false --linked > supabase/migrations/0001_init.sql

# 3) (Optioneel) dump RLS-policies apart zodat ze leesbaar blijven
supabase db dump --data-only false --linked --use-copy > supabase/migrations/0001_init.sql

# 4) Commit
git add supabase/migrations/0001_init.sql supabase/config.toml
git commit -m "chore(db): voeg init-migratie toe — schema nu reproduceerbaar"
```

Na deze stap is `supabase/migrations/0001_init.sql` de enige bron van waarheid.
Alle toekomstige wijzigingen gaan via `supabase migration new <naam>` + edit +
`supabase db push` (of de Studio → "Generate migration" knop).

## Wat er al WÉL goed zit
- Auth is server-side (Supabase JWT + `profiles.role`), geen client-password.
- Secrets zitten niet in `VITE_*` (alleen anon URL/key + publieke VAPID keys).
- RLS-policies bestaan (13 scripts met `create policy` in `supabase/*.sql`).
- Live check bevestigde: alle kern-tabellen bestaan in de productie-DB.

## TODO na de dump
- Verplaats de 55 losse fix-scripts naar `supabase/archive/` (niet meer nodig
  als `0001_init.sql` de waarheid is) of verwijder ze.
- Voeg een CI-stap toe die `supabase migration list` draait of een
  `supabase db diff` op een preview-branch, zodat drifts zichtbaar worden.
