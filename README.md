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

After a payment the app polls `/api/status` until the expiry moves, and only then says Pro is
active. It never trusts the payment popup alone. Buying while Pro is active extends it: the
doppler-web webhooks add the days on top of the current expiry.

The account is always taken from `initData`, never from the `?account_id=` the bot adds to
the URL. `/api/status` also returns the device count (`device_sessions`) and `max_devices`, and
with `{devices: true}` the device list (name, type, main, last active), so the app can show the
account the way doppler-web's /account page does. No route accepts an Account ID: it is a
login credential.

What the home screen shows depends on the account:

- **Pro:** the account, devices, downloads and the blog. A quiet "Extend Pro" row opens the
  plans on a separate screen.
- **Free or expired:** the plans come first.

## Blog

- The Mini App reads the blog's published posts from doppler-web's Supabase tables
  (`blog_posts`, `blog_post_translations`) with the anon key. The routes are `GET /api/blog` and
  `GET /api/blog/[slug]`, both public and cached at the edge.
- Posts open in a full-screen reader inside the app.
- Locales the blog doesn't have (uk, it, pl, nl, ro) get English, with a short note.
- Links to other posts open in the reader, and other links open outside the app.

## Look and links

- **Design:** the Mini App follows doppler-web's `DESIGN.md` ("Glyph Terminal"). The tokens
  and CTA styles in `globals.css` and the class lists in `components/ui/recipes.ts` are copied
  from there, so change the landing first and then copy.
- **Theme:** light or dark follows Telegram's `colorScheme`.
- **Legal:** privacy, terms and refund exist only on the landing. `/privacy` and `/terms`
  redirect there.
- **External links:** in-app links go through `openExternal()` (`src/lib/links.ts`), which
  uses `Telegram.WebApp.openLink`. A plain link would replace the Mini App.

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
