# Doppler VPN — Telegram Mini App (shelved)

A Telegram Mini App for managing a Doppler subscription without leaving Telegram.

> ## ⛔ Shelved 2026-09-17 — do not deploy as-is
>
> Buying now happens through the `doppler-web` checkout (`/api/checkout/init` → Revolut /
> OxaPay), which `doppler-support-bot` calls. This Mini App is **not deployed**, has no Vercel
> project, and was never registered with BotFather.
>
> **Three bugs must be fixed before it can ship.** They are not cosmetic — each one takes money
> and gives nothing back.

## Blocking bugs

1. **Promo codes are charged at full price.**
   `src/app/page.tsx` posts `promoId`, but `src/app/api/checkout/route.ts` destructures only
   `{ planId, initData }` and creates the Paddle transaction at the fixed `priceId`. The user
   sees a discount and is billed the full amount.
   `/api/promo/validate` also never writes `promo_redemptions`, so `current_redemptions` never
   increments and the "already redeemed" check can never fire.

2. **Webhook account auto-create is schema-wrong.**
   `src/app/api/webhook/route.ts` inserts `accounts { id: 'VPN-XXXX-XXXX-XXXX' }`, but
   `accounts.id` is a UUID — the code belongs in `accounts.account_id`. The insert fails, the
   handler 500s, and **a paid transaction grants nothing.**

3. **`PADDLE_ENVIRONMENT` defaults to sandbox.**
   In both `checkout/route.ts` and `webhook/route.ts`. A missing env var silently hands real
   users a sandbox checkout instead of failing loudly.

Also worth knowing: `/api/status` returns the `accounts` UUID as `accountId` and the UI renders
it as the user's Account ID, and nothing notifies the user in Telegram after payment.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase · Paddle Billing

```
src/
  app/
    layout.tsx     Root layout — loads the Telegram WebApp SDK
    page.tsx       Plans + checkout entry
    api/           checkout · webhook · status · promo/validate
    status/  success/  privacy/  terms/
  components/  lib/  types/  fonts/
```

## Running locally

```bash
npm install
cp .env.example .env.local     # fill in the values
npm run dev                    # http://localhost:3000
npm run typecheck
```

## Environment

```
NEXT_PUBLIC_SUPABASE_URL      NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PADDLE_API_KEY                PADDLE_WEBHOOK_SECRET
PADDLE_ENVIRONMENT            sandbox | production — set it explicitly, see bug 3
PADDLE_PRICE_ID_MONTHLY / _6M / _YEARLY
```

## If it is ever revived

1. Fix the three bugs above.
2. Decide whether Paddle is still the processor — the rest of the product moved to Revolut and
   OxaPay through `doppler-web`. Running a fourth payment path needs a reason.
3. Create the Vercel project and deploy.
4. Register with @BotFather (`/newapp`) and point it at the deployment.
5. Configure the Paddle webhook at `https://<domain>/api/webhook`.

**Auth model:** Telegram `initData`, validated server-side. Never trust a client-supplied
identity without that check.

## Related

`doppler-support-bot` — where buying happens today · `doppler-web` — hosts the live checkout ·
[`CLAUDE.md`](CLAUDE.md)
