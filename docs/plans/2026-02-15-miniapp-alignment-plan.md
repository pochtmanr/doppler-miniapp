# Mini App Alignment & Extension — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the Doppler VPN Telegram Mini App's design system with the landing page, refactor i18n to JSON files, and add a subscription status page.

**Architecture:** Client-side i18n (no URL routing), ported UI components from landing, new `/api/status` route + `/status` page. No changes to existing checkout/webhook logic.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Supabase, Stripe, Telegram Mini App SDK

---

## Task 1: Move Font File and Update .gitignore

**Files:**
- Move: `FKRasterRomanCompact-Blended.otf` → `src/fonts/FKRasterRomanCompact-Blended.otf`
- Modify: `.gitignore`
- Create: `.env.example`

**Step 1: Create fonts directory and move font**

```bash
mkdir -p src/fonts
mv FKRasterRomanCompact-Blended.otf src/fonts/FKRasterRomanCompact-Blended.otf
```

**Step 2: Create `.env.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# RevenueCat
REVENUECAT_SECRET_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=
```

**Step 3: Update `.gitignore` to explicitly exclude font tracking issues**

No change needed — font is inside `src/` which is tracked. The `.otf` at project root was untracked (shown in `git status ??`).

**Step 4: Commit**

```bash
git add src/fonts/FKRasterRomanCompact-Blended.otf .env.example
git commit -m "chore: move font to src/fonts, add .env.example"
```

---

## Task 2: Replace globals.css with Landing's @theme System

**Files:**
- Modify: `src/app/globals.css` (full replacement)

**Step 1: Replace `src/app/globals.css` with landing's design tokens**

```css
@import "tailwindcss";

@theme {
  /* Colors — matches dopplerLanding */
  --color-bg-primary: #0a0a0a;
  --color-bg-secondary: #141414;
  --color-bg-card: oklch(0.1 0 0 / 0.8);
  --color-text-primary: #f5f5f5;
  --color-text-muted: #c5c5c5;
  --color-accent-gold: #E1DECF;
  --color-accent-teal: #5390A8;
  --color-accent-teal-light: #73B0C8;

  /* Typography — font variables set by next/font in layout.tsx */
  --font-family-body: var(--font-body), "Space Grotesk", system-ui, sans-serif;
  --font-family-display: var(--font-serif), "Instrument Serif", Georgia, serif;
  --font-family-raster: var(--font-raster), "FK Raster Roman Compact", monospace;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

/* Base styles */
html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

/* Focus visible for accessibility */
:focus-visible {
  outline: 2px solid var(--color-accent-teal);
  outline-offset: 2px;
}

/* Selection color */
::selection {
  background-color: var(--color-accent-teal);
  color: var(--color-text-primary);
}
```

**Step 2: Verify build compiles**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds (pages may look unstyled since old CSS classes are gone — that's expected, we'll fix in later tasks)

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: replace CSS with landing's @theme design system"
```

---

## Task 3: Update Layout with Font Loading

**Files:**
- Modify: `src/app/layout.tsx` (full rewrite)

**Step 1: Rewrite `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next';
import { Instrument_Serif, Space_Grotesk } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: '400',
  style: ['normal', 'italic'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const fkRaster = localFont({
  src: '../fonts/FKRasterRomanCompact-Blended.otf',
  variable: '--font-raster',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Doppler VPN — Subscribe',
  description: 'Get Doppler VPN Pro subscription',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${spaceGrotesk.variable} ${fkRaster.variable}`}
    >
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary font-body antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 2: Verify build compiles**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds. Fonts are now loaded via next/font.

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: add 3-font system matching landing (Space Grotesk, Instrument Serif, FK Raster)"
```

---

## Task 4: Port UI Components from Landing

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/section.tsx`

**Step 1: Create `src/components/ui/button.tsx`**

Adapted from landing — removed `next-intl` Link dependency, uses plain `<a>` for href.

```tsx
import { type ComponentProps } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<ComponentProps<'button'>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-gold text-bg-primary hover:bg-accent-gold/90 shadow-lg shadow-accent-gold/20',
  secondary:
    'bg-accent-teal text-text-primary hover:bg-accent-teal-light shadow-lg shadow-accent-teal/20',
  outline:
    'border-2 border-text-primary/20 text-text-primary hover:border-accent-gold hover:text-accent-gold bg-transparent',
  ghost: 'text-text-primary hover:text-accent-gold bg-transparent',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none';

  const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (href) {
    return (
      <a href={href} className={combinedStyles}>
        {children}
      </a>
    );
  }

  return (
    <button className={combinedStyles} {...props}>
      {children}
    </button>
  );
}
```

**Step 2: Create `src/components/ui/card.tsx`**

Copy directly from landing — no dependencies to change.

```tsx
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: 'p-0',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className = '',
  hover = false,
  padding = 'md',
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl bg-bg-secondary/50 backdrop-blur-sm border border-white/5
        ${paddingStyles[padding]}
        ${hover ? 'transition-all duration-300 hover:bg-bg-secondary/70 hover:border-accent-teal/20 hover:shadow-lg hover:shadow-accent-teal/5' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`font-display text-xl md:text-2xl font-semibold text-text-primary ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-text-muted text-base leading-relaxed ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
```

**Step 3: Create `src/components/ui/badge.tsx`**

```tsx
import { type ReactNode } from 'react';

type BadgeVariant = 'default' | 'gold' | 'teal' | 'outline';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-text-primary',
  gold: 'bg-accent-gold/20 text-accent-gold',
  teal: 'bg-accent-teal/20 text-accent-teal-light',
  outline: 'border border-accent-gold/50 text-accent-gold bg-transparent',
};

export function Badge({
  children,
  variant = 'default',
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
```

**Step 4: Create `src/components/ui/section.tsx`**

```tsx
import { type ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
  as?: 'section' | 'div' | 'article';
}

export function Section({
  children,
  className = '',
  id,
  as: Component = 'section',
}: SectionProps) {
  return (
    <Component
      id={id}
      className={`py-12 md:py-20 px-4 sm:px-6 lg:px-8 ${className}`}
    >
      <div className="mx-auto max-w-7xl">{children}</div>
    </Component>
  );
}
```

**Step 5: Verify build**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
git add src/components/ui/
git commit -m "feat: port Button, Card, Badge, Section components from landing"
```

---

## Task 5: Extract Translations to JSON Files

**Files:**
- Create: `messages/en.json`
- Create: `messages/ru.json`
- Create: remaining 19 locale files
- Modify: `src/lib/i18n.ts` (full rewrite)

**Step 1: Create `messages/en.json`**

```json
{
  "miniapp": {
    "title": "Doppler VPN Pro",
    "subtitle": "Unlimited speed, all servers, no ads",
    "monthly": "Monthly",
    "sixMonth": "6 Months",
    "yearly": "Yearly",
    "bestValue": "Best Value",
    "save": "Save",
    "subscribe": "Subscribe",
    "perMonth": "/mo",
    "features": "What you get",
    "feat1": "All server locations",
    "feat2": "Unlimited bandwidth",
    "feat3": "No ads",
    "feat4": "Priority support",
    "feat5": "Up to 5 devices",
    "processing": "Processing...",
    "error": "Something went wrong"
  },
  "status": {
    "title": "Your Subscription",
    "tier": "Plan",
    "expiresAt": "Expires",
    "daysRemaining": "{days} days remaining",
    "noSubscription": "No active subscription",
    "subscribe": "Get Pro",
    "active": "Active",
    "expired": "Expired",
    "free": "Free",
    "pro": "Pro"
  },
  "success": {
    "title": "Payment Successful!",
    "description": "Your Doppler VPN Pro subscription is now active.",
    "close": "Close"
  }
}
```

**Step 2: Create `messages/ru.json`**

```json
{
  "miniapp": {
    "title": "Doppler VPN Pro",
    "subtitle": "Безлимитная скорость, все серверы, без рекламы",
    "monthly": "Месяц",
    "sixMonth": "6 месяцев",
    "yearly": "Год",
    "bestValue": "Лучшее предложение",
    "save": "Экономия",
    "subscribe": "Подписаться",
    "perMonth": "/мес",
    "features": "Что вы получите",
    "feat1": "Все серверы",
    "feat2": "Безлимитный трафик",
    "feat3": "Без рекламы",
    "feat4": "Приоритетная поддержка",
    "feat5": "До 5 устройств",
    "processing": "Обработка...",
    "error": "Произошла ошибка"
  },
  "status": {
    "title": "Ваша подписка",
    "tier": "План",
    "expiresAt": "Истекает",
    "daysRemaining": "Осталось {days} дней",
    "noSubscription": "Нет активной подписки",
    "subscribe": "Получить Pro",
    "active": "Активна",
    "expired": "Истекла",
    "free": "Бесплатный",
    "pro": "Pro"
  },
  "success": {
    "title": "Оплата прошла успешно!",
    "description": "Ваша подписка Doppler VPN Pro активирована.",
    "close": "Закрыть"
  }
}
```

**Step 3: Create remaining locale files**

For each remaining locale (es, zh, hi, ar, pt, ja, de, fa, uk, tr, ko, fr, it, pl, nl, id, th, vi, ro), create a `messages/{locale}.json` file. The `miniapp` section values come directly from the existing inline `translations` object in `src/lib/i18n.ts`. The `status` and `success` sections should use the English values as placeholders (to be translated later, or via AI translation).

Each file follows the same structure as `en.json` above.

**Step 4: Rewrite `src/lib/i18n.ts`**

```typescript
// Static imports for all locale files to enable webpack bundling
import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import es from '../../messages/es.json';
import zh from '../../messages/zh.json';
import hi from '../../messages/hi.json';
import ar from '../../messages/ar.json';
import pt from '../../messages/pt.json';
import ja from '../../messages/ja.json';
import de from '../../messages/de.json';
import fa from '../../messages/fa.json';
import uk from '../../messages/uk.json';
import tr from '../../messages/tr.json';
import ko from '../../messages/ko.json';
import fr from '../../messages/fr.json';
import it from '../../messages/it.json';
import pl from '../../messages/pl.json';
import nl from '../../messages/nl.json';
import id from '../../messages/id.json';
import th from '../../messages/th.json';
import vi from '../../messages/vi.json';
import ro from '../../messages/ro.json';

type Messages = typeof en;

const locales: Record<string, Messages> = {
  en, ru, es, zh, hi, ar, pt, ja, de, fa, uk, tr, ko, fr, it, pl, nl, id, th, vi, ro,
};

export function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const lang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (!lang) return 'en';
  if (locales[lang]) return lang;
  const prefix = lang.slice(0, 2);
  if (locales[prefix]) return prefix;
  return 'en';
}

export function getMessages(lang: string): Messages {
  return locales[lang] || locales['en'];
}

// Flat accessor for backward compatibility during migration
// Usage: t(messages, 'miniapp.title')
export function t(messages: Messages, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  return typeof current === 'string' ? current : key;
}
```

**Step 5: Verify build**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds (pages won't work yet since they still use old `getTranslation` — fixed in next task).

**Step 6: Commit**

```bash
git add messages/ src/lib/i18n.ts
git commit -m "feat: extract translations to JSON files, refactor i18n to match landing format"
```

---

## Task 6: Restyle Homepage with New Design System

**Files:**
- Modify: `src/app/page.tsx` (full rewrite)

**Step 1: Rewrite `src/app/page.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { detectLanguage, getMessages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const PLANS = [
  { id: 'monthly', price: '$9.99', pricePerMonth: '$9.99', cents: 999, save: null, best: false },
  { id: '6month', price: '$49.99', pricePerMonth: '$8.33', cents: 4999, save: '17%', best: false },
  { id: 'yearly', price: '$79.99', pricePerMonth: '$6.67', cents: 7999, save: '33%', best: true },
];

export default function Home() {
  const [messages, setMessages] = useState(getMessages('en'));
  const [selected, setSelected] = useState('yearly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const lang = detectLanguage();
    setMessages(getMessages(lang));

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const m = messages.miniapp;

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, initData }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || m.error);
      }
    } catch {
      alert(m.error);
    } finally {
      setLoading(false);
    }
  };

  const labelKey = (id: string) => {
    if (id === 'monthly') return m.monthly;
    if (id === '6month') return m.sixMonth;
    return m.yearly;
  };

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent-teal/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-teal-light">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold mb-2">{m.title}</h1>
        <p className="text-text-muted text-sm">{m.subtitle}</p>
      </div>

      {/* Plans */}
      <div className="space-y-3 mb-8">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className="w-full text-left"
          >
            <Card
              hover
              padding="md"
              className={`relative transition-all ${
                selected === plan.id
                  ? 'ring-2 ring-accent-gold border-accent-gold/30'
                  : ''
              } ${plan.best ? 'border-accent-gold/20' : ''}`}
            >
              {plan.best && (
                <Badge variant="gold" className="absolute -top-3 left-4 text-xs">
                  {m.bestValue}
                </Badge>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-lg text-text-primary">{labelKey(plan.id)}</div>
                  <div className="text-text-muted text-sm">
                    {plan.pricePerMonth}{m.perMonth}
                    {plan.save && (
                      <span className="ml-2 text-accent-teal-light font-medium">
                        {m.save} {plan.save}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-text-primary">{plan.price}</div>
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {/* Subscribe Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={() => handleSubscribe(selected)}
        disabled={loading}
        className="w-full"
      >
        {loading ? m.processing : m.subscribe}
      </Button>

      {/* Features */}
      <div className="mt-8 px-2">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">{m.features}</h3>
        <div className="space-y-3">
          {[m.feat1, m.feat2, m.feat3, m.feat4, m.feat5].map((feat, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-accent-teal-light">&#10003;</span>
              <span className="text-text-muted">{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* View Subscription Status Link */}
      <div className="mt-8 text-center">
        <Button variant="ghost" size="sm" href="/status">
          {messages.status.title} &rarr;
        </Button>
      </div>
    </main>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: restyle homepage with landing design system (gold/teal, glassmorphism)"
```

---

## Task 7: Restyle Success Page

**Files:**
- Modify: `src/app/success/page.tsx` (full rewrite)

**Step 1: Rewrite `src/app/success/page.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { detectLanguage, getMessages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function SuccessPage() {
  const [messages, setMessages] = useState(getMessages('en'));

  useEffect(() => {
    setMessages(getMessages(detectLanguage()));
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  }, []);

  const s = messages.success;

  const handleClose = () => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Card padding="lg" className="text-center max-w-sm w-full">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent-teal/20 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-teal-light">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold mb-3">{s.title}</h1>
        <p className="text-text-muted mb-8">{s.description}</p>
        <Button
          variant="primary"
          size="lg"
          onClick={handleClose}
          className="w-full"
        >
          {s.close}
        </Button>
      </Card>
    </main>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/success/page.tsx
git commit -m "feat: restyle success page with landing design system"
```

---

## Task 8: Create Status API Route

**Files:**
- Create: `src/app/api/status/route.ts`

**Step 1: Create `src/app/api/status/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // Validate Telegram auth — no fallback
    const user = validateInitData(initData, botToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Look up account via telegram_users
    const { data: tgUser } = await supabaseAdmin
      .from('telegram_users')
      .select('account_id')
      .eq('telegram_id', user.id)
      .single();

    if (!tgUser?.account_id) {
      return NextResponse.json({
        tier: 'free',
        expiresAt: null,
        isActive: false,
      });
    }

    // Get subscription status
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', tgUser.account_id)
      .single();

    const expiresAt = account?.subscription_expires_at;
    const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;

    return NextResponse.json(
      {
        tier: isActive ? (account?.subscription_tier || 'free') : 'free',
        expiresAt: expiresAt || null,
        isActive,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Status error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

**Step 2: Verify build**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/api/status/route.ts
git commit -m "feat: add /api/status route for subscription status lookup"
```

---

## Task 9: Create Status Page

**Files:**
- Create: `src/app/status/page.tsx`

**Step 1: Create `src/app/status/page.tsx`**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { detectLanguage, getMessages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubscriptionStatus {
  tier: string;
  expiresAt: string | null;
  isActive: boolean;
}

export default function StatusPage() {
  const [messages, setMessages] = useState(getMessages('en'));
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lang = detectLanguage();
    setMessages(getMessages(lang));

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      if (!initData) {
        setError('Please open from Telegram');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initData }),
      });

      if (!res.ok) {
        setError('Failed to load status');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setStatus(data);
    } catch {
      setError('Failed to load status');
    } finally {
      setLoading(false);
    }
  };

  const s = messages.status;

  const daysRemaining = () => {
    if (!status?.expiresAt) return 0;
    const diff = new Date(status.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-display text-2xl font-semibold mb-2">{s.title}</h1>
      </div>

      {/* Loading */}
      {loading && (
        <Card padding="lg" className="text-center">
          <div className="text-text-muted">Loading...</div>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card padding="lg" className="text-center">
          <div className="text-text-muted">{error}</div>
        </Card>
      )}

      {/* Status Card */}
      {status && !loading && !error && (
        <Card padding="lg">
          <div className="space-y-4">
            {/* Tier */}
            <div className="flex items-center justify-between">
              <span className="text-text-muted">{s.tier}</span>
              <Badge variant={status.isActive ? 'teal' : 'default'}>
                {status.isActive ? s.pro : s.free}
              </Badge>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Status</span>
              <Badge variant={status.isActive ? 'gold' : 'outline'}>
                {status.isActive ? s.active : s.expired}
              </Badge>
            </div>

            {/* Expiry */}
            {status.expiresAt && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">{s.expiresAt}</span>
                  <span className="text-text-primary font-medium">
                    {formatDate(status.expiresAt)}
                  </span>
                </div>

                {status.isActive && (
                  <div className="text-center pt-2">
                    <span className="text-accent-teal-light text-sm">
                      {s.daysRemaining.replace('{days}', String(daysRemaining()))}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* No subscription */}
            {!status.isActive && !status.expiresAt && (
              <div className="text-center py-4">
                <p className="text-text-muted">{s.noSubscription}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* CTA */}
      <div className="mt-8">
        <Button
          variant={status?.isActive ? 'outline' : 'primary'}
          size="lg"
          href="/"
          className="w-full"
        >
          {status?.isActive ? messages.miniapp.subscribe : s.subscribe}
        </Button>
      </div>
    </main>
  );
}
```

**Step 2: Verify build**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add src/app/status/page.tsx
git commit -m "feat: add subscription status page"
```

---

## Task 10: Final Build Verification and Typecheck

**Step 1: Run typecheck**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx tsc --noEmit`
Expected: No type errors.

**Step 2: Run full build**

Run: `cd /Users/romanpochtman/Developer/doppler-miniapp && npx next build`
Expected: Build succeeds with all pages compiled.

**Step 3: Fix any issues found**

Address any type errors or build failures before final commit.

**Step 4: Commit all remaining changes**

```bash
git add -A
git status
# Review what's staged, then commit if clean
git commit -m "chore: final build verification"
```

---

## Summary of Changes

| Category | Before | After |
|---|---|---|
| **Colors** | Purple/blue gradients | Gold/teal matching landing |
| **Fonts** | System fonts only | Space Grotesk + Instrument Serif + FK Raster |
| **CSS** | `:root` variables + custom classes | Tailwind 4 `@theme` tokens |
| **i18n** | Inline `translations` object | JSON files in `messages/` |
| **Components** | Raw `<button>` / `<div>` | Ported Button, Card, Badge, Section |
| **Pages** | 2 (Home, Success) | 3 (Home, Success, Status) |
| **API Routes** | 2 (checkout, webhook) | 3 (checkout, webhook, status) |

## Files Created
- `src/fonts/FKRasterRomanCompact-Blended.otf` (moved)
- `.env.example`
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/section.tsx`
- `messages/en.json` + 20 more locale files
- `src/app/api/status/route.ts`
- `src/app/status/page.tsx`

## Files Modified
- `src/app/globals.css` (full replacement)
- `src/app/layout.tsx` (font loading added)
- `src/lib/i18n.ts` (refactored to JSON imports)
- `src/app/page.tsx` (restyled)
- `src/app/success/page.tsx` (restyled)

## Files NOT Modified
- `src/app/api/checkout/route.ts` (unchanged)
- `src/app/api/webhook/route.ts` (unchanged)
- `src/lib/telegram.ts` (unchanged)
- `src/lib/supabase.ts` (unchanged)
- `src/types/telegram.d.ts` (unchanged)
