'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RTL_LOCALES, detectLanguage, getMessages } from '@/lib/i18n';
import { DISPLAY_PLANS, type PlanId } from '@/lib/plans';
import { legalUrl, openExternal } from '@/lib/links';
import { AccountCard, formatDate, type AccountStatus } from '@/components/account-card';
import { BlogReader } from '@/components/blog-reader';
import { BlogSection } from '@/components/blog-section';
import { DevicesCard } from '@/components/devices-card';
import { Downloads } from '@/components/downloads';
import { useBlogList } from '@/lib/blog-client';
import { BTN_FLAT, BTN_PRIMARY, CARD, CARD_HAIRLINE, EYEBROW, ICON_TILE, INPUT } from '@/components/ui/recipes';

const PLANS = DISPLAY_PLANS.map((p) => {
  const monthlyCents = DISPLAY_PLANS.find((pl) => pl.id === 'monthly')?.cents || p.cents;
  const savePercent = monthlyCents > 0 ? Math.round((1 - p.cents / (p.days / 30) / monthlyCents) * 100) : 0;
  return {
    id: p.id,
    cents: p.cents,
    months: p.days / 30,
    save: savePercent > 0 ? `${savePercent}%` : null,
    best: p.id === 'yearly',
  };
});

const COINS = [
  { id: 'usdt_trc20', label: 'USDT · TRC20' },
  { id: 'usdc_trc20', label: 'USDC · TRC20' },
  { id: 'btc', label: 'BTC' },
  { id: 'eth', label: 'ETH' },
  { id: 'ton', label: 'TON' },
];

/** accounts.subscription_store values that mean an App Store / Google Play subscription renews it. */
const STORE_BILLED = ['app_store', 'play_store', 'ios', 'android', 'macos'];

/** Card payments are confirmed by Revolut's webhook within seconds; give it two minutes. */
const CARD_POLL_MS = 3_000;
const CARD_POLL_FOR_MS = 2 * 60_000;
/** Crypto waits for network confirmations: poll gently while the invoice is open, and for
 *  an hour after "I've paid" (a BTC payment sent late can take that long to confirm). */
const CRYPTO_POLL_MS = 10_000;
const CRYPTO_POLL_FOR_MS = 60 * 60_000;

type Method = 'card' | 'crypto';
type Load = 'loading' | 'ready' | 'none' | 'outside' | 'error';
/** shop → (card) confirming → done | slow;  shop → invoice → (crypto) confirming → done | slow */
type Phase = 'shop' | 'invoice' | 'confirming' | 'slow' | 'done';
/** Pro users land on `home`; the plans live on their own `extend` screen. Everyone else sees the plans on home. */
type View = 'home' | 'extend';
type Reader = { kind: 'list' } | { kind: 'post'; slug: string } | null;
type Promo = { code: string; discount_percent: number; promo_id: string };
type CryptoInvoice = {
  address: string;
  pay_amount: string;
  pay_currency: string;
  network: string;
  memo: string | null;
  qr_code: string;
  expired_at: number;
};

function initData(): string {
  return window.Telegram?.WebApp?.initData || '';
}

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData: initData(), ...body }),
  });
  return { ok: res.ok, data: await res.json().catch(() => ({})) };
}

function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}

const expiryMs = (s: AccountStatus | null) => (s?.expiresAt ? new Date(s.expiresAt).getTime() : 0);

function CheckIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block w-8 h-8 rounded-full border-2 border-overlay/15 border-t-accent-teal animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
  );
}

export default function Home() {
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState(getMessages('en'));
  const [load, setLoad] = useState<Load>('loading');
  const [status, setStatus] = useState<AccountStatus | null>(null);

  const [selected, setSelected] = useState<PlanId>('yearly');
  const [method, setMethod] = useState<Method>('card');
  const [coin, setCoin] = useState(COINS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [phase, setPhase] = useState<Phase>('shop');
  const [view, setView] = useState<View>('home');
  const [reader, setReader] = useState<Reader>(null);
  const [paidWith, setPaidWith] = useState<Method>('card');
  const [invoice, setInvoice] = useState<CryptoInvoice | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [invoiceExpired, setInvoiceExpired] = useState(false);
  /** Expiry before this payment. Pro is granted once the server's expiry moves past it. */
  const baseline = useRef(0);

  const m = messages.miniapp;
  const a = messages.account;
  const p = messages.pay;

  /** The account, from signed initData only. Never from the ?account_id= the bot appends. */
  const fetchStatus = useCallback(async (withDevices = false): Promise<AccountStatus | null> => {
    const { ok, data } = await post('/api/status', withDevices ? { devices: true } : {});
    if (!ok) throw new Error('status');
    return data.accountId ? (data as AccountStatus) : null;
  }, []);

  useEffect(() => {
    const detected = detectLanguage();
    setLang(detected);
    setMessages(getMessages(detected));
    // The boot script sets these from the launch hash; a reload without the hash keeps
    // initData (Telegram restores it) but not the hash, so set them here as well.
    document.documentElement.lang = detected;
    document.documentElement.dir = RTL_LOCALES.includes(detected) ? 'rtl' : 'ltr';

    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
    if (!initData()) {
      setLoad('outside');
      return;
    }
    fetchStatus(true)
      .then((s) => {
        setStatus(s);
        setLoad(s ? 'ready' : 'none');
      })
      .catch(() => setLoad('error'));
  }, [fetchStatus]);

  // Each phase is a new screen; don't leave the user scrolled into the middle of it.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase, view]);

  // Telegram's header back arrow: Extend → home. The reader registers its own while open.
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton || !tg.isVersionAtLeast?.('6.1') || reader) return;
    if (view !== 'extend' || phase !== 'shop') {
      tg.BackButton.hide();
      return;
    }
    const toHome = () => setView('home');
    tg.BackButton.onClick(toHome);
    tg.BackButton.show();
    return () => {
      tg.BackButton.offClick(toHome);
    };
  }, [view, phase, reader]);

  const blog = useBlogList(lang, load === 'ready');

  // After a payment: wait for doppler-web's webhook to move the expiry. The page never
  // claims success on the payment provider's word alone.
  useEffect(() => {
    const watching = phase === 'confirming' || phase === 'invoice';
    if (!watching) return;
    const crypto = phase === 'invoice' || paidWith === 'crypto';
    const deadline =
      phase === 'invoice'
        ? (invoice?.expired_at ? invoice.expired_at * 1000 : Date.now() + CRYPTO_POLL_FOR_MS)
        : Date.now() + (crypto ? CRYPTO_POLL_FOR_MS : CARD_POLL_FOR_MS);

    let stopped = false;
    const tick = async () => {
      try {
        const s = await fetchStatus();
        if (stopped) return;
        if (s && expiryMs(s) > baseline.current) {
          setStatus((prev) => ({ ...s, devices: prev?.devices }));
          setView('home');
          setPhase('done');
          return;
        }
      } catch {
        // A failed poll is not a verdict; try again next tick.
      }
      if (stopped) return;
      if (Date.now() >= deadline) {
        if (phase === 'confirming') setPhase('slow');
        else setInvoiceExpired(true);
        return;
      }
      timer = setTimeout(tick, crypto ? CRYPTO_POLL_MS : CARD_POLL_MS);
    };
    let timer = setTimeout(tick, crypto ? CRYPTO_POLL_MS : CARD_POLL_MS);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [phase, paidWith, invoice, fetchStatus]);

  const validatePromo = async (code: string, planId: PlanId) => {
    setPromoLoading(true);
    setPromoError('');
    try {
      const { data } = await post('/api/promo', { code, planId });
      if (data.valid) {
        setPromoApplied({ code: data.code, discount_percent: data.discount_percent, promo_id: data.promo_id });
      } else {
        setPromoApplied(null);
        setPromoError(m.promoInvalid);
      }
    } catch {
      setPromoApplied(null);
      setPromoError(m.error);
    } finally {
      setPromoLoading(false);
    }
  };

  const selectPlan = (planId: PlanId) => {
    setSelected(planId);
    // A code can be limited to some plans, so re-check it against the new one.
    if (promoApplied) validatePromo(promoApplied.code, planId);
  };

  const discounted = (cents: number) =>
    promoApplied ? Math.round(cents * (1 - promoApplied.discount_percent / 100)) : cents;

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    baseline.current = expiryMs(status);
    try {
      const { ok, data } = await post('/api/checkout', {
        planId: selected,
        method,
        coin,
        locale: lang,
        promoCode: promoApplied?.code ?? null,
        promoId: promoApplied?.promo_id ?? null,
      });
      if (!ok) {
        setError(data.error === 'no-account' ? m.noAccount : m.error);
        return;
      }

      if (data.method === 'crypto') {
        setPaidWith('crypto');
        setInvoice(data as CryptoInvoice);
        setInvoiceExpired(false);
        setPhase('invoice');
        return;
      }

      const { default: RevolutCheckout } = await import('@revolut/checkout');
      const instance = await RevolutCheckout(data.order_token, data.mode === 'prod' ? 'prod' : 'sandbox');
      instance.payWithPopup({
        onSuccess: () => {
          setPaidWith('card');
          setPhase('confirming');
        },
        onError: () => setError(m.error),
        // Closing the popup leaves the user on the plans, as before.
        onCancel: () => undefined,
      });
    } catch {
      setError(m.error);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard can be blocked inside some Telegram clients; the text stays selectable.
    }
  };

  const planLabel = (id: PlanId) => (id === 'monthly' ? m.monthly : id === '6month' ? m.sixMonth : m.yearly);

  const hero = (
    <header className="text-center mb-6">
      <img src="/icon-512.png" alt="" width={56} height={56} className="mx-auto mb-4 rounded-[22%]" />
      <h1 className="text-3xl font-semibold text-text-primary leading-tight">{m.title}</h1>
      <p className="mt-2 text-sm text-text-muted">{m.subtitle}</p>
    </header>
  );

  const footer = (
    <footer className="mt-8 mb-2 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-text-tertiary">
      {(['privacy', 'terms', 'refund'] as const).map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => openExternal(legalUrl(lang, page))}
          className="hover:text-text-primary transition-colors"
        >
          {messages.legal[page]}
        </button>
      ))}
    </footer>
  );

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen px-4 pt-6 pb-8 max-w-lg mx-auto">{children}</main>
  );

  // ── Not in Telegram, no linked account, or the lookup failed ─────────────────
  if (load !== 'ready' || !status) {
    const text =
      load === 'loading' ? a.loading : load === 'outside' ? m.openInTelegram : load === 'none' ? m.noAccount : a.loadError;
    return shell(
      <>
        {hero}
        <div className={`${CARD} p-6 text-center`}>
          <span className={CARD_HAIRLINE} aria-hidden="true" />
          <p className="relative text-sm text-text-muted" role={load === 'loading' ? 'status' : undefined}>
            {text}
          </p>
        </div>
        <Downloads lang={lang} messages={messages} />
        {footer}
      </>,
    );
  }

  // ── Waiting for the webhook, or done ─────────────────────────────────────────
  if (phase === 'confirming' || phase === 'slow' || phase === 'done') {
    const crypto = paidWith === 'crypto';
    const title =
      phase === 'done'
        ? p.done.replace('{date}', status.expiresAt ? formatDate(status.expiresAt, lang) : '')
        : phase === 'slow'
          ? crypto ? p.slowCrypto : p.slowCard
          : crypto ? p.waitingNetwork : p.confirming;
    const note =
      phase === 'done'
        ? p.doneNote
        : phase === 'slow'
          ? crypto ? p.slowCryptoNote : p.slowCardNote
          : crypto ? p.waitingNetworkNote : p.confirmingNote;

    return shell(
      <>
        <div className={`${CARD} p-6 text-center`} aria-live="polite">
          <span className={CARD_HAIRLINE} aria-hidden="true" />
          <div className="relative">
            <div className="mb-5 flex justify-center">
              {phase === 'done' ? (
                <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-bg-secondary/80 border border-accent-teal/30 text-accent-teal">
                  <CheckIcon className="w-7 h-7" />
                </span>
              ) : phase === 'confirming' ? (
                <Spinner />
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold text-text-primary leading-tight">{title}</h1>
            <p className="mt-2 text-sm text-text-muted">{note}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {phase === 'done' ? (
            <>
              <AccountCard status={status} lang={lang} messages={messages} />
              <button type="button" onClick={() => window.Telegram?.WebApp?.close()} className={`${BTN_PRIMARY} w-full`}>
                {p.close}
              </button>
            </>
          ) : phase === 'slow' ? (
            <button type="button" onClick={() => setPhase('confirming')} className={`${BTN_PRIMARY} w-full`}>
              {p.refresh}
            </button>
          ) : null}
          {phase !== 'done' && crypto && invoice && (
            <button type="button" onClick={() => setPhase('invoice')} className={`${BTN_FLAT} w-full`}>
              {m.back}
            </button>
          )}
          {phase === 'slow' && !crypto && (
            <button type="button" onClick={() => setPhase('shop')} className={`${BTN_FLAT} w-full`}>
              {m.back}
            </button>
          )}
        </div>
      </>,
    );
  }

  // ── Crypto invoice ────────────────────────────────────────────────────────────
  if (phase === 'invoice' && invoice) {
    const rows: { key: string; label: string; value: string }[] = [
      { key: 'amount', label: m.sendExactly, value: `${invoice.pay_amount} ${invoice.pay_currency}` },
      { key: 'address', label: m.toAddress, value: invoice.address },
      ...(invoice.network ? [{ key: 'network', label: m.network, value: invoice.network }] : []),
      ...(invoice.memo ? [{ key: 'memo', label: m.memo, value: invoice.memo }] : []),
    ];
    return shell(
      <>
        {hero}
        <div className={`${CARD} p-6`}>
          <span className={CARD_HAIRLINE} aria-hidden="true" />
          {invoiceExpired ? (
            <p className="relative text-sm text-text-primary text-center">{p.invoiceExpired}</p>
          ) : (
            <div className="relative">
              {/^(https?:|data:image\/)/.test(invoice.qr_code) && (
                <img src={invoice.qr_code} alt="" width={200} height={200} className="mx-auto mb-6 rounded-xl bg-white p-2" />
              )}
              <div className="space-y-4">
                {rows.map((row) => (
                  <div key={row.key}>
                    <div className={`${EYEBROW} mb-1`}>{row.label}</div>
                    <div className="flex items-center gap-2">
                      <span dir="ltr" className="flex-1 min-w-0 font-mono text-sm text-text-primary break-all select-all">
                        {row.value}
                      </span>
                      {row.key !== 'network' && (
                        <button
                          type="button"
                          onClick={() => copy(row.key, row.key === 'amount' ? invoice.pay_amount : row.value)}
                          className={`${BTN_FLAT} shrink-0 !px-3 !py-1.5 text-xs`}
                        >
                          {copied === row.key ? m.copied : m.copy}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {invoice.expired_at > 0 && (
                <p className="text-text-tertiary text-xs mt-6">
                  {m.payBefore.replace(
                    '{time}',
                    new Date(invoice.expired_at * 1000).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }),
                  )}
                </p>
              )}
              <p className="text-text-muted text-xs mt-2">{m.cryptoNote}</p>
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-col gap-3">
          {!invoiceExpired && (
            <button type="button" onClick={() => setPhase('confirming')} className={`${BTN_PRIMARY} w-full`}>
              {p.paidCrypto}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setInvoice(null);
              setPhase('shop');
            }}
            className={`${BTN_FLAT} w-full`}
          >
            {m.back}
          </button>
        </div>
      </>,
    );
  }

  // ── Home / Extend ─────────────────────────────────────────────────────────────
  const expired = !status.isActive && !!status.expiresAt;
  const plansTitle = status.isActive ? a.extendPro : expired ? a.renewPro : a.getPro;
  const cta = status.isActive ? a.extendPro : expired ? a.renewPro : m.subscribe;
  const storeBilled = status.isActive && !!status.store && STORE_BILLED.includes(status.store);
  const account = <AccountCard status={status} lang={lang} messages={messages} />;
  const devices = status.devices ? (
    <DevicesCard devices={status.devices} maxDevices={status.maxDevices} lang={lang} messages={messages} />
  ) : null;
  const blogSection = (
    <BlogSection
      blog={blog}
      lang={lang}
      messages={messages}
      onOpenPost={(slug) => setReader({ kind: 'post', slug })}
      onOpenList={() => setReader({ kind: 'list' })}
    />
  );
  const readerView = reader && (
    <BlogReader key={JSON.stringify(reader)} start={reader} lang={lang} messages={messages} onClose={() => setReader(null)} />
  );

  const plans = (
    <section aria-labelledby="plans-title">
      <h2 id="plans-title" className="text-xl font-semibold text-text-primary">{plansTitle}</h2>
      {status.isActive && <p className="mt-1 text-sm text-text-muted">{a.extendNote}</p>}
      {expired && (
        <p className="mt-1 text-sm font-medium text-accent-amber">
          {a.expiredOn.replace('{date}', formatDate(status.expiresAt!, lang))}
        </p>
      )}
      {storeBilled && (
        <p className="mt-3 rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-4 py-3 text-sm text-text-primary">
          {a.storeWarning}
        </p>
      )}
      <div className="mt-4 space-y-3" role="radiogroup" aria-labelledby="plans-title">
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          const final = discounted(plan.cents);
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => selectPlan(plan.id)}
              className={`relative w-full rounded-xl border p-4 text-start transition-colors ${
                isSelected
                  ? 'border-accent-teal bg-accent-teal/10 ring-1 ring-accent-teal/40'
                  : 'border-overlay/15 bg-bg-primary/40 hover:border-accent-teal/40'
              }`}
            >
              {plan.best && (
                <span className="absolute -top-2.5 end-4 inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent-teal text-[10px] font-bold uppercase tracking-wider text-white">
                  {m.bestValue}
                </span>
              )}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'border-accent-teal bg-accent-teal' : 'border-overlay/30'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </span>
                  <span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{planLabel(plan.id)}</span>
                      {plan.save && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-accent-teal/15 text-accent-teal text-[10px] font-bold">
                          {m.save} {plan.save}
                        </span>
                      )}
                    </span>
                    {plan.months > 1 && (
                      <span className="block text-xs text-text-muted">
                        {formatCents(Math.round(final / plan.months))}
                        {m.perMonth}
                      </span>
                    )}
                  </span>
                </div>
                <div className="text-end">
                  {promoApplied && final !== plan.cents ? (
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-text-muted line-through">{formatCents(plan.cents)}</span>
                      <span className="text-lg font-bold text-text-primary">{formatCents(final)}</span>
                    </span>
                  ) : (
                    <span className="text-lg font-bold text-text-primary">{formatCents(plan.cents)}</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Promo code */}
      <div className="mt-5">
        {promoApplied ? (
          <div className="flex items-center justify-between rounded-xl border border-accent-teal/25 bg-accent-teal/10 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-text-primary">
              <CheckIcon className="w-4 h-4 text-accent-teal" />
              <span>
                <span className="font-semibold">{promoApplied.code}</span> — {promoApplied.discount_percent}% {m.promoOff}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setPromoApplied(null);
                setPromoCode('');
              }}
              className="text-text-muted text-sm hover:text-danger"
              aria-label="✕"
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setPromoError('');
                }}
                placeholder={m.promoPlaceholder}
                className={`${INPUT} flex-1`}
              />
              <button
                type="button"
                onClick={() => validatePromo(promoCode.trim(), selected)}
                disabled={promoLoading || !promoCode.trim()}
                className={BTN_FLAT}
              >
                {promoLoading ? '…' : m.apply}
              </button>
            </div>
            {promoError && <p className="text-danger text-xs mt-1 ps-1">{promoError}</p>}
          </>
        )}
      </div>

      {/* Payment method */}
      <div className="mt-5">
        <div className={`${EYEBROW} mb-2`}>{m.payWith}</div>
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-bg-primary/40 border border-overlay/15" role="radiogroup">
          {(['card', 'crypto'] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={method === id}
              onClick={() => setMethod(id)}
              className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                method === id ? 'bg-accent-teal text-white' : 'text-text-primary hover:bg-overlay/5'
              }`}
            >
              {id === 'card' ? m.card : m.crypto}
            </button>
          ))}
        </div>
        {method === 'crypto' && (
          <div className="flex flex-wrap gap-2 mt-3">
            {COINS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCoin(c.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  coin === c.id
                    ? 'border-accent-teal/40 bg-accent-teal/10 text-accent-teal'
                    : 'border-overlay/10 text-text-muted'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={handleSubscribe} disabled={loading} className={`${BTN_PRIMARY} mt-6 w-full`}>
        {loading ? m.processing : `${cta} · ${formatCents(discounted(PLANS.find((pl) => pl.id === selected)!.cents))}`}
      </button>
      {error && <p className="text-danger text-sm text-center mt-3">{error}</p>}
    </section>
  );

  // What you get — the landing paywall's feature list, in card recipe B. Only for people deciding to buy.
  const benefits = (
    <div className={`${CARD} mt-8 p-5`}>
      <span className={CARD_HAIRLINE} aria-hidden="true" />
      <div className="relative">
        <h2 className={`${EYEBROW} mb-4`}>{m.features}</h2>
        <ul className="space-y-3">
          {[m.feat1, m.feat2, m.feat3, m.feat4, m.feat5].map((feat) => (
            <li key={feat} className="flex items-center gap-3 text-sm text-text-primary">
              <span className={ICON_TILE}>
                <CheckIcon />
              </span>
              {feat}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  // Pro: its own quiet screen for adding time, reached from the home row.
  if (status.isActive && view === 'extend') {
    return shell(
      <>
        <button
          type="button"
          onClick={() => setView('home')}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
        >
          <svg className="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {m.back}
        </button>
        {plans}
        {footer}
      </>,
    );
  }

  // Pro: the account first. No key on this screen; extending is a quiet row.
  if (status.isActive) {
    return shell(
      <>
        {hero}
        {account}
        <button
          type="button"
          onClick={() => setView('extend')}
          className="mt-3 flex w-full items-center justify-between gap-3 rounded-xl border border-overlay/10 bg-bg-secondary/20 px-4 py-3.5 text-start hover:border-accent-teal/30 transition-colors"
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium text-text-primary">{a.extendPro}</span>
            <span className="block text-xs text-text-tertiary">{storeBilled ? m.storeBilledShort : m.extendHint}</span>
          </span>
          <svg className="w-4 h-4 shrink-0 text-text-tertiary rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {devices && <div className="mt-8">{devices}</div>}
        <Downloads lang={lang} messages={messages} />
        {blogSection}
        {footer}
        {readerView}
      </>,
    );
  }

  // Free or expired: the paywall first, then everything else.
  return shell(
    <>
      {hero}
      {plans}
      {benefits}
      <div className="mt-8">{account}</div>
      {devices && <div className="mt-3">{devices}</div>}
      <Downloads lang={lang} messages={messages} />
      {blogSection}
      {footer}
      {readerView}
    </>,
  );
}
