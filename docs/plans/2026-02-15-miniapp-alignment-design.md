# Doppler Mini App: Alignment & Extension Design

**Date:** 2026-02-15
**Approach:** B — Keep client-side i18n, align design system, add subscription status
**Scope:** Checkout + subscription status view

---

## 1. Architecture Overview

### Current State

The mini app is a Next.js 16 App Router application deployed on Vercel with:
- 2 pages: Homepage (plan selection + checkout), Success (post-payment)
- 2 API routes: `/api/checkout` (Stripe session creation), `/api/webhook` (Stripe webhook)
- Client-side i18n via inline translations object (23 languages)
- Supabase for subscription data (service key, server-side only)
- RevenueCat for mobile entitlement sync
- Dark purple/blue theme with system fonts

### Target State

- **3 pages:** Homepage, Success, Status (NEW)
- **3 API routes:** checkout, webhook, `/api/status` (NEW)
- **Design system aligned** with landing: gold/teal color scheme, 3-font typography, glassmorphism
- **i18n refactored** to JSON files in `messages/` directory (matching landing format)
- **UI components ported** from landing: Button, Card, Badge, Section

### What Does NOT Change

- Telegram SDK integration (script tag in layout, `window.Telegram.WebApp`)
- Stripe checkout flow (one-time payment mode)
- Webhook handler logic (subscription extension, RevenueCat grant)
- Supabase admin client pattern (service key, server-side only)
- No `[locale]` URL routing — locale from Telegram SDK

---

## 2. Target Folder Structure

```
doppler-miniapp/
├── messages/                         # Translation JSON files
│   ├── en.json
│   ├── ru.json
│   ├── he.json
│   └── ... (21 locales)
├── public/
│   └── images/
│       └── roundeddopplerlogo.png
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── checkout/route.ts     # Existing (unchanged)
│   │   │   ├── webhook/route.ts      # Existing (unchanged)
│   │   │   └── status/route.ts       # NEW
│   │   ├── success/page.tsx          # Existing (restyle)
│   │   ├── status/page.tsx           # NEW
│   │   ├── layout.tsx                # Updated: fonts, theme
│   │   ├── page.tsx                  # Existing (restyle)
│   │   └── globals.css               # Replaced: landing @theme
│   ├── components/
│   │   └── ui/
│   │       ├── button.tsx            # Ported from landing
│   │       ├── card.tsx              # Ported from landing
│   │       ├── badge.tsx             # Ported from landing
│   │       └── section.tsx           # Ported from landing
│   ├── fonts/
│   │   └── FKRasterRomanCompact-Blended.otf
│   ├── lib/
│   │   ├── i18n.ts                   # Refactored: JSON-based
│   │   ├── telegram.ts              # Existing (unchanged)
│   │   └── supabase.ts              # Existing (unchanged)
│   └── types/
│       └── telegram.d.ts            # Existing (unchanged)
├── .env.example                      # NEW
├── package.json
├── next.config.ts
├── postcss.config.mjs
└── tsconfig.json
```

---

## 3. Design System Alignment

### Color Migration

| Mini App Current | Landing Theme | Tailwind Class |
|---|---|---|
| `--bg-primary: #0a0a1a` | `--color-bg-primary: #0a0a0a` | `bg-bg-primary` |
| `--bg-secondary: #111128` | `--color-bg-secondary: #141414` | `bg-bg-secondary` |
| `--bg-card: #1a1a3e` | `--color-bg-card: oklch(0.1 0 0 / 0.8)` | `bg-bg-card` |
| `--accent-purple: #7c3aed` | `--color-accent-gold: #E1DECF` | `bg-accent-gold` |
| `--accent-blue: #3b82f6` | `--color-accent-teal: #5390A8` | `bg-accent-teal` |
| `--text-primary: #f0f0ff` | `--color-text-primary: #f5f5f5` | `text-text-primary` |
| `--text-secondary: #9ca3af` | `--color-text-muted: #c5c5c5` | `text-text-muted` |

### Typography (3-font system from landing)

1. **Space Grotesk** — body text, UI labels (`font-body`)
2. **Instrument Serif** — section headings (`font-display`)
3. **FK Raster Roman Compact** — accent text, logo area (`font-raster`)

Loading strategy: `next/font/google` + `next/font/local` in `layout.tsx`, CSS variables applied to `<html>`.

### Component Porting

Port from `dopplerLanding/src/components/ui/` to `doppler-miniapp/src/components/ui/`:

- **Button** — variants: primary (gold), secondary (teal), outline, ghost. Remove `Link` integration (mini app uses `window.location`).
- **Card** — glassmorphism: `bg-bg-secondary/50 backdrop-blur-sm border border-white/5`. Hover state optional.
- **Badge** — variants: default, gold, teal, outline. For "Best Value" and "Save %" labels.
- **Section** — padding wrapper: `py-12 md:py-20 px-4 sm:px-6 lg:px-8`.

### Custom CSS Classes (globals.css)

Replace `.gradient-bg`, `.card-gradient`, `.best-value` with landing's @theme approach:

```css
@import "tailwindcss";

@theme {
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-bg-card: oklch(0.1 0 0 / 0.8);
  --color-text-primary: #f5f5f5;
  --color-text-muted: #c5c5c5;
  --color-accent-gold: #E1DECF;
  --color-accent-teal: #5390A8;
  --color-accent-teal-light: #73B0C8;
  --font-family-body: var(--font-body), "Space Grotesk", system-ui, sans-serif;
  --font-family-display: var(--font-serif), "Instrument Serif", Georgia, serif;
  --font-family-raster: var(--font-raster), "FK Raster Roman Compact", monospace;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}
```

---

## 4. i18n Refactor

### Strategy

- **Detection:** Client-side via `window.Telegram.WebApp.initDataUnsafe.user.language_code` (unchanged)
- **Storage:** JSON files in `messages/` directory (one per locale)
- **Loading:** Dynamic `import()` at runtime
- **Fallback:** exact match → 2-letter prefix → `en`
- **No middleware, no URL routing** — Telegram provides locale

### Translation File Format (`messages/en.json`)

```json
{
  "miniapp": {
    "title": "Doppler VPN Pro",
    "subtitle": "Unlimited access to all servers",
    "plans": {
      "monthly": "Monthly",
      "sixMonth": "6 Months",
      "yearly": "Yearly"
    },
    "bestValue": "Best Value",
    "save": "Save {percent}",
    "subscribe": "Subscribe Now",
    "perMonth": "/month",
    "feat1": "Access to all server locations",
    "feat2": "No speed limits",
    "feat3": "Up to 10 devices simultaneously",
    "feat4": "No-logs policy",
    "feat5": "24/7 customer support",
    "processing": "Processing...",
    "error": "Something went wrong. Please try again."
  },
  "status": {
    "title": "Your Subscription",
    "activePlan": "Active Plan",
    "tier": "Tier",
    "expiresAt": "Expires",
    "noSubscription": "No active subscription",
    "upgrade": "Upgrade Now",
    "active": "Active",
    "expired": "Expired",
    "free": "Free",
    "pro": "Pro",
    "daysRemaining": "{days} days remaining"
  },
  "success": {
    "title": "Payment Successful!",
    "description": "Your Doppler VPN Pro subscription is now active.",
    "close": "Close"
  }
}
```

### Refactored `src/lib/i18n.ts`

```typescript
const SUPPORTED_LOCALES = [
  'en', 'ru', 'es', 'zh', 'hi', 'ar', 'pt', 'ja', 'de', 'fa',
  'uk', 'tr', 'ko', 'fr', 'it', 'pl', 'nl', 'id', 'th', 'vi', 'ro'
];

export function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const lang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (!lang) return 'en';
  if (SUPPORTED_LOCALES.includes(lang)) return lang;
  const prefix = lang.slice(0, 2);
  if (SUPPORTED_LOCALES.includes(prefix)) return prefix;
  return 'en';
}

export async function loadTranslations(lang: string): Promise<Record<string, any>> {
  try {
    const messages = await import(`../../messages/${lang}.json`);
    return messages.default;
  } catch {
    const fallback = await import('../../messages/en.json');
    return fallback.default;
  }
}

// Helper for nested key access: t("miniapp.title")
export function t(translations: Record<string, any>, key: string): string {
  return key.split('.').reduce((obj, k) => obj?.[k], translations) ?? key;
}
```

---

## 5. Supabase Integration

### Existing Schema (No Changes Needed)

Tables already in use:
- `accounts` (51 rows) — `subscription_tier`, `subscription_expires_at`, `subscription_store`
- `telegram_users` (1 row) — `telegram_id` → `account_id` mapping
- `vpn_subscriptions` — subscription periods
- `vpn_invoices` — payment records

### New API Route: `/api/status/route.ts`

```typescript
// POST /api/status
// Body: { initData: string }
// Returns: { tier, expiresAt, isActive, plan }

export async function POST(req: Request) {
  const { initData } = await req.json();

  // 1. Validate Telegram auth
  const user = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Look up account
  const { data: tgUser } = await supabaseAdmin
    .from('telegram_users')
    .select('account_id')
    .eq('telegram_id', user.id)
    .single();

  if (!tgUser?.account_id) {
    return NextResponse.json({ tier: 'free', isActive: false });
  }

  // 3. Get subscription status
  const { data: account } = await supabaseAdmin
    .from('accounts')
    .select('subscription_tier, subscription_expires_at')
    .eq('id', tgUser.account_id)
    .single();

  const expiresAt = account?.subscription_expires_at;
  const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;

  return NextResponse.json({
    tier: isActive ? (account?.subscription_tier || 'free') : 'free',
    expiresAt: expiresAt || null,
    isActive,
  });
}
```

### RLS Recommendations

Enable RLS on currently-unprotected tables (defense-in-depth):

```sql
-- telegram_users
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON telegram_users
  FOR ALL USING (auth.role() = 'service_role');

-- vpn_subscriptions
ALTER TABLE vpn_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON vpn_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- vpn_invoices
ALTER TABLE vpn_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON vpn_invoices
  FOR ALL USING (auth.role() = 'service_role');
```

### Data Fetching Strategy

| Route | Method | Cache | Notes |
|---|---|---|---|
| `/api/checkout` | POST | None | Creates Stripe session |
| `/api/webhook` | POST | None | Writes to DB |
| `/api/status` | POST | `Cache-Control: private, max-age=60` | 1-min client cache |

---

## 6. Environment Variables

### Existing (Keep All)

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
SUPABASE_SERVICE_KEY=             # Service role key (server-only)
STRIPE_SECRET_KEY=                # Stripe API key
STRIPE_WEBHOOK_SECRET=            # Stripe webhook signing secret
REVENUECAT_SECRET_KEY=            # RevenueCat API key
TELEGRAM_BOT_TOKEN=               # Telegram bot token
```

### Vercel Configuration

- Set all env vars in Vercel Dashboard → Project Settings → Environment Variables
- Use `Preview` environment for test Stripe keys
- Use `Production` environment for live Stripe keys
- No `vercel.json` needed (zero-config)

### Create `.env.example`

Template file (no secrets) for developer onboarding.

---

## 7. Separation of Concerns

| Concern | Owner | Reason |
|---|---|---|
| User registration (`/start`) | Bot | Creates `telegram_users` + `accounts` records |
| VPN config generation | Bot | Server-side key management |
| Server selection | Bot | Conversational flow |
| Subscription purchase | Mini App | Stripe checkout UI |
| Payment processing | Mini App | Stripe webhook handler |
| Subscription status | Mini App | Visual UI for user |
| Device management | Bot / Future | Out of scope |

Both share the same Supabase database. The bot creates records, the mini app reads/extends them.

---

## 8. MCP Tooling

### Supabase MCP — Use For:
- `list_tables` / `execute_sql` — inspect schema and data
- `apply_migration` — add RLS policies
- `get_advisors` — security/performance checks after changes

### Vercel MCP — Use For:
- `deploy` — deploy after implementation
- `logs` — debug production issues

### NOT MCP:
- Stripe config → Stripe Dashboard
- RevenueCat → RevenueCat Dashboard
- Bot token → BotFather

---

## 9. Risks & Trade-offs

| Risk | Impact | Mitigation |
|---|---|---|
| Design divergence over time | Medium | Document shared design tokens |
| Translation files drift | Low | Same JSON structure enables diffing |
| CTA color change (purple → gold) | Low | Mini app has few repeat checkout visitors |
| Font duplication across repos | Low | Acceptable for separate deployments |
| Service key full DB access | High | Server-side only; validate all inputs |
| No rate limiting on `/api/status` | Medium | Cache-Control header; Vercel rate limiting later |
| Unsafe auth fallback in checkout | High | Remove before production |

---

## 10. Clarification Questions Before Implementation

1. Should `/status` show payment history (invoices), or only current tier + expiry?
2. Should "Subscribe" on `/status` redirect to homepage or deep-link a specific plan?
3. Is FK Raster used for headings only, or also plan prices/CTAs?
4. Should RTL languages (Hebrew, Arabic, Farsi, Urdu) be supported with `dir="rtl"`?
5. Should the unsafe auth fallback (HMAC bypass) be removed now?
