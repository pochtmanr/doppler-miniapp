'use client';

import { useState, useEffect } from 'react';
import { detectLanguage, getMessages } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DISPLAY_PLANS } from '@/lib/plans';

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

export default function Home() {
  const [messages, setMessages] = useState(getMessages('en'));
  const [selected, setSelected] = useState('yearly');
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount_percent: number; promo_id: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const lang = detectLanguage();
    setMessages(getMessages(lang));

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    // Fetch the real VPN-format account ID for promo validation
    const fetchAccountId = async () => {
      try {
        const initData = window.Telegram?.WebApp?.initData || '';
        if (!initData) return;
        const res = await fetch('/api/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.accountId) setAccountId(data.accountId);
        }
      } catch {
        // Non-critical — promo validation will still work with fallback
      }
    };
    fetchAccountId();
  }, []);

  const m = messages.miniapp;

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const resolvedAccountId = accountId || 'unknown';

      const planMap: Record<string, string> = { monthly: 'monthly', '6month': 'semiannual', yearly: 'annual' };
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || ''}/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, account_id: resolvedAccountId, plan: planMap[selected] || 'monthly' }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoApplied({ code: data.code, discount_percent: data.discount_percent, promo_id: data.promo_id });
        setPromoError('');
      } else {
        setPromoError(data.error || 'Invalid code');
        setPromoApplied(null);
      }
    } catch {
      setPromoError('Failed to validate');
    } finally {
      setPromoLoading(false);
    }
  };

  const getDiscountedCents = (cents: number) => {
    if (!promoApplied) return cents;
    return Math.round(cents * (1 - promoApplied.discount_percent / 100));
  };

  const formatPrice = (cents: number) => {
    const dollars = cents / 100;
    return dollars % 1 === 0 ? `$${dollars}` : `$${dollars.toFixed(2)}`;
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(true);
    try {
      const initData = window.Telegram?.WebApp?.initData || '';
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, initData, promoId: promoApplied?.promo_id || null }),
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
        <img
          src="/icon-512.png"
          alt="Doppler VPN"
          width={64}
          height={64}
          className="mx-auto mb-4 rounded-[22%]"
        />
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
            placeholder={'Promo code'}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent-teal"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={applyPromo}
            disabled={promoLoading || !promoCode.trim()}
          >
            {promoLoading ? '...' : 'Apply'}
          </Button>
        </div>
        {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
        {promoApplied && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-accent-teal-light text-xs">✓ {promoApplied.code} — {promoApplied.discount_percent}% off</p>
            <button onClick={() => { setPromoApplied(null); setPromoCode(''); }} className="text-text-muted text-xs hover:text-red-400">✕</button>
          </div>
        )}
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

      {/* Legal Links */}
      <div className="mt-6 mb-4 flex justify-center gap-4 text-xs text-text-muted">
        <a href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</a>
        <span>&middot;</span>
        <a href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</a>
      </div>
    </main>
  );
}
