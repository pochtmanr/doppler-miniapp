# Doppler Mini App

Paywall for @dopplercreatebot. Next.js 16 (App Router), TypeScript, Tailwind v4. It holds **no
payment logic**: checkout, promo pricing and the webhooks that grant Pro all live in
`doppler-web`. See `README.md` for the full purchase flow.

## Rules

- **The account comes from validated `initData`, never from the client.** Every API route calls
  `telegramUserFrom()` (`src/lib/telegram.ts`), then `findLinkedAccount()` (`src/lib/account.ts`).
  Ignore the `?account_id=` the bot appends to the URL. It is only a hint, and anyone can edit it.
- **Never create accounts here.** The bot creates and links them on /start. A second creator
  would leave users with two Account IDs.
- **Prices in `src/lib/plans.ts` are display-only.** They must match `PLAN_AMOUNTS` in
  doppler-web's `src/app/api/checkout/telegram/route.ts`, which is what gets charged.
- **Don't add a payment provider here.** An earlier Paddle version charged promo users full
  price and granted nothing on its webhook. That build is still live at
  `doppler-miniapp.vercel.app` on a Vercel account we don't control. Leave it alone and keep
  nothing pointing at it.
- UI strings live in `messages/*.json` (21 locales). Add every new key to all of them.

## Deployment

Vercel project `romans-projects-a19aa0c4/doppler-telegram-miniapp`. Env: `.env.example`.
`CHECKOUT_SHARED_SECRET` must equal the one on the `dopplervpn` project. It is Sensitive there
and can't be read back, so rotate it on both and redeploy both.

The bot that opens this app runs from `/opt/doppler-bot` on the Poland VPS, which is not a git
checkout. The URL is `links.miniapp` in `src/config.ts`, and each chat's menu button is set by
`applyMenuButton()` in `src/profile.ts`.

## Commands

```bash
npm run dev        # localhost:3000; no initData outside Telegram, so the page asks you to open it there
npm run build
npm run typecheck
```
