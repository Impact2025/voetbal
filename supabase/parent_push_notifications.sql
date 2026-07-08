-- ─── Parent Push Subscriptions ──────────────────────────────────────────────
-- Run in Supabase SQL Editor.
-- Ouders loggen via Supabase Auth in (i.t.t. spelers die pincode-only zijn),
-- dus RLS hier is `authenticated` + eigenaarschap, net als notification_prefs.

create table if not exists parent_push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null,
  subscription jsonb not null,
  endpoint     text generated always as (subscription->>'endpoint') stored,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Eén rij per (ouder, device) — meerdere devices per ouder toegestaan
create unique index if not exists parent_push_subscriptions_parent_endpoint_idx
  on parent_push_subscriptions(parent_id, endpoint);

alter table parent_push_subscriptions enable row level security;

drop policy if exists "auth_own_push_subscriptions" on parent_push_subscriptions;
create policy "auth_own_push_subscriptions"
  on parent_push_subscriptions for all
  to authenticated
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);
