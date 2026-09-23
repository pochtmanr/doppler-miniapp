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
- **Home depends on the account's state (`src/app/page.tsx`).**
  - Pro: the account, then devices, Downloads and the blog. Extending is a quiet row that opens its own `extend` view.
  - Free or expired: the paywall first ("What you get" sits under the plans), then everything else.
  - Payment state (`phase`, `handleSubscribe`) stays in page.tsx on purpose.
- **Devices.** `/api/status` with `{devices: true}` lists devices. Payment polling leaves the flag off and gets only the count. Never select `device_id`: together with the account it is what `remove_device` takes.
- **Blog.** The blog is read-only from doppler-web's Supabase tables.
  - `GET /api/blog` and `/api/blog/[slug]` use the anon client (`src/lib/supabase-public.ts`); RLS allows reading published posts.
  - They are public and cached, and take no initData.
  - A list is always in one locale: `BLOG_LOCALES` in `src/lib/blog.ts`, otherwise English.
  - Markdown is rendered without rehype-raw, and links go through `openExternal`.
- UI strings live in `messages/*.json` (21 locales). Add every new key to all of them.

## Deployment

Vercel project `romans-projects-a19aa0c4/doppler-telegram-miniapp`. Env: `.env.example`. Env vars
exist for Production only, so a preview deploy has no secrets; test locally with `next start` instead.
When copying `NEXT_PUBLIC_SUPABASE_ANON_KEY` from doppler-web's `.env.local`, strip the literal
trailing `\n`, or the key is invalid.
`CHECKOUT_SHARED_SECRET` must equal the one on the `dopplervpn` project. It is Sensitive there
and can't be read back, so rotate it on both and redeploy both.

The bot that opens this app runs from `/opt/doppler-bot` on the Poland VPS, which is not a git
checkout. Its source of truth is the `doppler-telegram-bot` repo. The URL is `links.miniapp` in `src/config.ts`, and each chat's menu button is set by
`applyMenuButton()` in `src/profile.ts`.

## Commands

```bash
npm run dev        # localhost:3000; no initData outside Telegram, so the page asks you to open it there
npm run build
npm run typecheck
```
