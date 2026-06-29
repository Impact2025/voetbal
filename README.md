# Skillkaart — Player Performance Hub

**Volledig platform voor amateurvoetbalclubs**: spelers-app, ouderportal, clubbeheer en marketing site.

## 🏗 Projecten

| Project | Tech | Doel |
|---------|------|------|
| `player-hub/` | React 18 + Vite + Supabase + Tailwind + Stripe | Hoofd-app + Vercel API (SSR blog/FAQ) |
| `website/`  | React 18 + Vite + Tailwind | Marketing site (statisch) |
| `player-pwa/` | React 18 + Vite + Workbox | Mobiele PWA (installeerbaar) |

## 📦 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Supabase (PostgreSQL + Auth + RLS), Vercel Serverless Functions
- **Betalingen:** Stripe (subscriptions, coupons)
- **Email:** Resend (transacties, campagnes)
- **SEO:** Server-side rendered blog + FAQ (OG, JSON-LD, sitemap.xml, robots.txt)
- **AI Blog:** OpenRouter → Gemini 2.5 Flash (blog generatie via admin)

## 🚀 Quick Start

```bash
cd player-hub
cp .env.example .env.local  # vul aan met jouw keys
npm install
npm run dev                 # Vite (frontend, poort 5173)
vercel dev                  # Vercel (API, poort 3000)
```

## 🔐 Security

- **admin-endpoints**: `verifySuperadmin()` via JWT + email + DB profile
- **email-send**: `verifyAuth()` — club_admin of superadmin (`send-email.ts`)
- **cron**: `verifyCron()` — `CRON_SECRET` token
- **Stripe webhook**: query token + event re-retrieval (geen raw body needed)
- **Unsubscribe**: HMAC timing-safe tokens (`mailToken.ts`)
- **Input validatie**: Zod schemas per endpoint (`api/_lib/validate.ts`)
- **Error monitoring**: Sentry via `api/_lib/withError.ts` (optioneel, `SENTRY_DSN`)

## 🧪 Tests

```bash
cd player-hub
npm test            # vitest (jsdom)
npm run test -- --run  # CI mode
```

## 🚢 Deployment

Automatisch via Vercel (git push naar `main`).

## 📋 Vereisten

- Node.js 20+
- Supabase project (URL + anon key + service role key)
- Stripe account (secret key + price ID)
- Resend API key
- OpenRouter API key (voor blog generatie)
- Sentry DSN (optioneel)

Zie `.env.example` voor alle benodigde variabelen.
