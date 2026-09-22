'use client';

import { useState, useEffect } from 'react';
import { detectLanguage, getMessages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DISPLAY_PLANS, type PlanId } from '@/lib/plans';

const PLANS = DISPLAY_PLANS.map((p) => {
  const dollars = p.cents / 100;
  const priceStr = dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
  const perMonth = p.cents / (p.days / 30) / 100;
  const perMonthStr = perMonth % 1 === 0 ? `$${perMonth}` : `$${perMonth.toFixed(2)}`;
  const monthlyCents = DISPLAY_PLANS.find((pl) => pl.id === 'monthly')?.cents || p.cents;
  const savePercent = monthlyCents > 0 ? Math.round((1 - p.cents / (p.days / 30) / monthlyCents) * 100) : 0;
  return {
    id: p.id,
    price: priceStr,
    pricePerMonth: perMonthStr,
    cents: p.cents,
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

type Method = 'card' | 'crypto';
type AccountState = 'loading' | 'ready' | 'none' | 'outside';
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

export default function Home() {
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState(getMessages('en'));
  const [selected, setSelected] = useState<PlanId>('yearly');
  const [method, setMethod] = useState<Method>('card');
  const [coin, setCoin] = useState(COINS[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<Promo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<AccountState>('loading');
  const [invoice, setInvoice] = useState<CryptoInvoice | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const detected = detectLanguage();
    setLang(detected);
    setMessages(getMessages(detected));

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    // The account always comes from the signed initData, never from the URL: the bot
    // appends ?account_id=, but anyone can edit a URL.
    if (!initData()) {
      setAccountState('outside');
      return;
    }
    post('/api/status', {})
      .then(({ data }) => {
        if (data.accountId) {
          setAccountId(data.accountId);
          setAccountState('ready');
        } else {
          setAccountState('none');
        }
      })
      .catch(() => setAccountState('none'));
  }, []);

  const m = messages.miniapp;

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

  const getDiscountedCents = (cents: number) => {
    if (!promoApplied) return cents;
    return Math.round(cents * (1 - promoApplied.discount_percent / 100));
  };

  const formatPrice = (cents: number) => {
    const dollars = cents / 100;
    return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
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
        setInvoice(data as CryptoInvoice);
        return;
      }

      const { default: RevolutCheckout } = await import('@revolut/checkout');
      const instance = await RevolutCheckout(data.order_token, data.mode === 'prod' ? 'prod' : 'sandbox');
      instance.payWithPopup({
        onSuccess: () => {
          window.location.href = '/success';
        },
        onError: () => setError(m.error),
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

  const labelKey = (id: string) => {
    if (id === 'monthly') return m.monthly;
    if (id === '6month') return m.sixMonth;
    return m.yearly;
  };

  const header = (
    <div className="text-center mb-8">
      <img
        src="/icon-512.png"
        alt="Doppler VPN"
        width={64}
        height={64}
        className="mx-auto mb-4 rounded-[22%]"
      />
      <h1 className="font-display text-2xl font-semibold mb-2">{m.title}</h1>
      <p className="text-text-muted text-sm">{m.subtitle}</p>
      {accountId && (
        <div className="mt-3 inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
          <span className="text-text-muted text-xs">{m.account}:</span>
          <span className="text-accent-teal-light text-xs font-mono font-medium">{accountId}</span>
        </div>
      )}
    </div>
  );

  if (accountState === 'outside' || accountState === 'none') {
    return (
      <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
        {header}
        <Card padding="lg" className="text-center">
          <p className="text-text-muted">{accountState === 'outside' ? m.openInTelegram : m.noAccount}</p>
        </Card>
      </main>
    );
  }

  if (invoice) {
    const rows: { key: string; label: string; value: string }[] = [
      { key: 'amount', label: m.sendExactly, value: `${invoice.pay_amount} ${invoice.pay_currency}` },
      { key: 'address', label: m.toAddress, value: invoice.address },
      ...(invoice.network ? [{ key: 'network', label: m.network, value: invoice.network }] : []),
      ...(invoice.memo ? [{ key: 'memo', label: m.memo, value: invoice.memo }] : []),
    ];
    return (
      <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
        {header}
        <Card padding="lg">
          {/^(https?:|data:image\/)/.test(invoice.qr_code) && (
            <img src={invoice.qr_code} alt="" width={200} height={200} className="mx-auto mb-6 rounded-lg bg-white p-2" />
          )}
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.key}>
                <div className="text-text-muted text-xs mb-1">{row.label}</div>
                <div className="flex items-center gap-2">
                  <span className="flex-1 font-mono text-sm break-all select-all">{row.value}</span>
                  {row.key !== 'network' && (
                    <button
                      onClick={() => copy(row.key, row.key === 'amount' ? invoice.pay_amount : row.value)}
                      className="shrink-0 text-xs text-accent-teal-light border border-white/10 rounded-md px-2 py-1"
                    >
                      {copied === row.key ? m.copied : m.copy}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {invoice.expired_at > 0 && (
            <p className="text-text-muted text-xs mt-6">
              {m.payBefore.replace(
                '{time}',
                new Date(invoice.expired_at * 1000).toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' }),
              )}
            </p>
          )}
          <p className="text-text-muted text-xs mt-2">{m.cryptoNote}</p>
        </Card>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="primary" size="md" href="/status" className="w-full">
            {messages.status.title}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setInvoice(null)} className="w-full">
            {m.back}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {header}

      {/* Plans */}
      <div className="space-y-3 mb-8">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => selectPlan(plan.id)}
            className="w-full text-left"
          >
            <Card
              hover
              padding="md"
              className={`transition-all ${
                selected === plan.id
                  ? 'ring-2 ring-accent-gold border-accent-gold/30'
                  : ''
              } ${plan.best ? 'border-accent-gold/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-text-primary">{labelKey(plan.id)}</span>
                    {plan.best && (
                      <Badge variant="gold" className="text-xs">
                        {m.bestValue}
                      </Badge>
                    )}
                  </div>
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
                  {promoApplied ? (
                    <div>
                      <div className="text-xs text-text-muted line-through">{plan.price}</div>
                      <div className="text-xl font-bold text-accent-teal-light">{formatPrice(getDiscountedCents(plan.cents))}</div>
                    </div>
                  ) : (
                    <div className="text-xl font-bold text-text-primary">{plan.price}</div>
                  )}
                </div>
              </div>
            </Card>
          </button>
        ))}
      </div>

      {/* Promo Code */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder={m.promoPlaceholder}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent-teal"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => validatePromo(promoCode.trim(), selected)}
            disabled={promoLoading || !promoCode.trim() || accountState !== 'ready'}
          >
            {promoLoading ? '...' : m.apply}
          </Button>
        </div>
        {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
        {promoApplied && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-accent-teal-light text-xs">✓ {promoApplied.code} — {promoApplied.discount_percent}% {m.promoOff}</p>
            <button onClick={() => { setPromoApplied(null); setPromoCode(''); }} className="text-text-muted text-xs hover:text-red-400">✕</button>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="mb-6">
        <div className="text-text-muted text-xs mb-2">{m.payWith}</div>
        <div className="grid grid-cols-2 gap-2">
          {(['card', 'crypto'] as const).map((id) => (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                method === id ? 'border-accent-gold text-text-primary bg-white/5' : 'border-white/10 text-text-muted'
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
                onClick={() => setCoin(c.id)}
                className={`rounded-full border px-3 py-1 text-xs transition-all ${
                  coin === c.id ? 'border-accent-teal-light text-accent-teal-light' : 'border-white/10 text-text-muted'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Subscribe Button */}
      <Button
        variant="primary"
        size="lg"
        onClick={handleSubscribe}
        disabled={loading || accountState !== 'ready'}
        className="w-full"
      >
        {loading ? m.processing : m.subscribe}
      </Button>
      {error && <p className="text-red-400 text-sm text-center mt-3">{error}</p>}

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

      {/* Legal Links */}
      <div className="mt-6 mb-4 flex justify-center gap-4 text-xs text-text-muted">
        <a href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</a>
        <span>&middot;</span>
        <a href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</a>
      </div>
    </main>
  );
}
