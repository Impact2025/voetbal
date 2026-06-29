# Skillkaart — Bijdragen

## Projectstructuur

```
player-hub/        ← Hoofd-app (Vite SPA + Vercel API)
  api/             ← Serverless endpoints (Vercel Functions)
    _lib/          ← Gedeelde API-logica (DB, auth, render, validatie)
    admin/         ← Superadmin-only endpoints
    stripe/        ← Stripe checkout + webhook
    cron/          ← Vercel Cron jobs (daily/monthly)
    webhooks/      ← Externe webhooks (Resend)
  src/             ← Frontend (React + TypeScript + Tailwind)
    components/    ← UI-componenten per domein
    lib/           ← Datalaag (Supabase-clients)
    utils/         ← Helpers
  dist/            ← Build output (git-ignored)

website/           ← Marketing site (Vite, statisch)
player-pwa/        ← Mobiele PWA voor spelers
```

## Development

```bash
# Hoofd-app
cd player-hub
npm dev              # Vite dev server (proxied /api → localhost:3000)

# API (losse terminal)
cd player-hub
vercel dev           # Start Vercel dev (zorgt dat /api werkt)

# Website
cd website
npm dev

# PWA
cd player-pwa
npm dev
```

## Tests

```bash
cd player-hub
npm test             # Vite + Vitest (jsdom)
npm run test -- --run  # CI-mode (eenmalig)
```

Vitest config staat in `vite.config.ts` — `globals: true`, `environment: jsdom`.

## Validation

Gebruik Zod-schema's voor API input-validatie. Voeg schema's toe in:
```
api/_lib/validate.ts
```
Gebruik `validateOrError(schema, body, res)` in endpoint handlers:
```ts
import { SendEmailSchema, validateOrError } from '../_lib/validate.js';

if (!validateOrError(SendEmailSchema, req.body, res)) return;
```

## Error monitoring (Sentry)

1. Maak een Sentry-project aan
2. Voeg `SENTRY_DSN` toe aan Vercel env vars
3. `@sentry/vercel-edge` / `@sentry/node` zit in dependencies
4. Importeer Sentry en wrap in `api/_lib/sentry.ts`

## API security regels

| Regel | Toepassing |
|-------|-----------|
| ✅ Admin endpoints | `verifySuperadmin()` uit `adminGuard.ts` |
| ✅ Email send | `verifyAuth()` — club_admin of superadmin |
| ✅ Cron | `verifyCron()` — `CRON_SECRET` uit env |
| ✅ Stripe webhook | Token in query string + event re-retrieval |
| ✅ Unsubscribe | HMAC timing-safe tokens via `mailToken.ts` |
| ⚠️ Publiek (blog/FAQ) | Geen auth — server-side rendered, alleen-lezen |

## Input validation

- Alle API endpoints met user-input moeten Zod-validatie gebruiken
- Zod-schema's in `api/_lib/validate.ts`
- Combineer met `validateOrError()` helper

## Deployment

Automatisch op Vercel via git push naar `main`.

```bash
vercel --prod
```

## Checklist voor nieuwe API-endpoints

- [ ] Zod schema in `api/_lib/validate.ts`
- [ ] `validateOrError()` aanroep in handler
- [ ] Auth guard waar nodig
- [ ] Logger/Audit (supabaseAdmin.logAdminAction)
- [ ] Cache headers voor SSR-pagina's
