# Doppler VPN — Telegram Mini App

The paywall that @dopplercreatebot opens from its menu button. It shows the plans, previews
promo codes, and starts a payment. It takes no payments itself: everything goes through
`doppler-web`.

## How a purchase works

1. Telegram opens the app with signed `initData`. Every API route validates it against
   `TELEGRAM_BOT_TOKEN` and rejects it after 24 hours.
2. `/api/status` looks up the account the bot linked on /start (`telegram_users` →
   `accounts`). The app never creates accounts; with no link it asks the user to press Start.
3. `/api/promo` previews a code through doppler-web's `/api/promo/validate`.
4. `/api/checkout` calls doppler-web's `POST /api/checkout/telegram` with the
   `x-checkout-secret` header. doppler-web re-prices the promo, then returns either a Revolut
   `order_token` (card, opened with `payWithPopup`) or an OxaPay address (crypto, shown in the app).
5. doppler-web's Revolut and OxaPay webhooks grant Pro and redeem the promo. The Mini App has
   no webhook.

The account is always taken from `initData`, never from the `?account_id=` the bot adds to
the URL.

## Deployment

Vercel project `romans-projects-a19aa0c4/doppler-telegram-miniapp`.

An older Paddle build is still live at `doppler-miniapp.vercel.app` on a Vercel account we
don't control. Paddle refuses its live charges. Nothing should point there.

## Environment

See `.env.example`. `CHECKOUT_SHARED_SECRET` must match the value on the `dopplervpn`
Vercel project. It is stored as Sensitive there, so to change it, set a new value on both
projects and redeploy both.

## Running locally

```bash
npm install
cp .env.example .env.local     # fill in the values
npm run dev                    # http://localhost:3000
npm run typecheck
```

Outside Telegram there is no `initData`, so the page only says to open it from the bot.

## Related

`doppler-web`: checkout, promo pricing, payment webhooks. `/opt/doppler-bot` on the Poland
VPS: @dopplercreatebot, which sets each chat's menu button to this app. The URL is in
`src/config.ts` (`links.miniapp`).
