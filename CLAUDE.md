# Doppler Mini App

## Overview
Telegram Mini App for Doppler VPN — subscription management and VPN config delivery inside Telegram without installing a separate app. Early development stage; scaffolded but not yet deployed or registered as a Telegram Mini App. Next.js 16, no GitHub remote yet.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (ref: `fzlrhmjdjjzcgstaeblu`)
- **Payments:** Paddle Billing
- **Deployment:** Not yet deployed (Vercel target)
- **GitHub:** No remote yet — needs repo creation

## Architecture

```
src/
  app/
    layout.tsx        # Root layout — includes Telegram WebApp SDK script
    page.tsx          # Home / main screen
    globals.css       # Global styles
    api/              # API route handlers
    status/           # VPN status page
    success/          # Payment success page
    privacy/          # Privacy policy
    terms/            # Terms of service
  components/         # Shared UI components
  fonts/              # Local fonts
  lib/                # Supabase client, utilities
  types/              # TypeScript type definitions
```

## Key Patterns
- **Telegram WebApp SDK** — must include `@twa-dev/sdk` or manual script in `layout.tsx` to access `window.Telegram.WebApp`
- **User auth** — derive Telegram user identity from `window.Telegram.WebApp.initData` (validate server-side)
- Shares Supabase backend with `landing/` and `bot/`

## Backend Integration
- **Supabase tables:** `accounts` (planned R/W), `vpn_servers` (planned R), `vpn_user_configs` (planned R)
- **External APIs:** Stripe (planned), Telegram WebApp API
- **Auth model:** Telegram `initData` verification (not Supabase Auth)

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL      # https://fzlrhmjdjjzcgstaeblu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY     # Server-side only
PADDLE_API_KEY                # Paddle API key
PADDLE_WEBHOOK_SECRET         # Paddle webhook signing secret
PADDLE_ENVIRONMENT            # 'sandbox' or 'production'
PADDLE_PRICE_ID_MONTHLY       # Paddle price ID for monthly plan
PADDLE_PRICE_ID_6M            # Paddle price ID for 6-month plan
PADDLE_PRICE_ID_YEARLY        # Paddle price ID for yearly plan
```

## Commands
```bash
npm run dev       # Next.js dev server (localhost:3000)
npm run build     # Production build
npm run typecheck # TypeScript check
```

## Deployment (Once Ready)
1. Create Vercel project: `vercel link`
2. Push to GitHub (create repo first)
3. Register as Telegram Mini App via @BotFather: `/newapp` → set URL
4. Configure Paddle webhook endpoint: `https://<miniapp-domain>/api/webhook`

## Important Notes
- **Not deployed yet** — needs Vercel project + GitHub remote before first deploy
- Telegram Mini Apps require HTTPS — Vercel handles this automatically
- `window.Telegram.WebApp.initData` must be validated server-side before trusting any user identity
- Currently only has scaffolded pages — no VPN provisioning, payment flow, or account creation implemented

## Related Projects
- `bot/` — Current Telegram entry point; Mini App is planned to supplement it
- `landing/` — Shares same Supabase project + API patterns
- `ios/` / `android/` — Same `accounts` table + RPCs for account system
