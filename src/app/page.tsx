'use client';

import { useState, useEffect } from 'react';
import { getTranslation, detectLanguage } from '@/lib/i18n';

const PLANS = [
  { id: 'monthly', price: '$9.99', pricePerMonth: '$9.99', cents: 999, save: null },
  { id: '6month', price: '$49.99', pricePerMonth: '$8.33', cents: 4999, save: '17%' },
  { id: 'yearly', price: '$79.99', pricePerMonth: '$6.67', cents: 7999, save: '33%', best: true },
];

export default function Home() {
  const [lang, setLang] = useState('en');
  const [t, setT] = useState(getTranslation('en'));
  const [selected, setSelected] = useState('yearly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const detected = detectLanguage();
    setLang(detected);
    setT(getTranslation(detected));

    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

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
        alert(data.error || t.error);
      }
    } catch {
      alert(t.error);
    } finally {
      setLoading(false);
    }
  };

  const labelKey = (id: string) => {
    if (id === 'monthly') return t.monthly;
    if (id === '6month') return t.sixMonth;
    return t.yearly;
  };

  return (
    <main className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-bg flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
        <p className="text-gray-400 text-sm">{t.subtitle}</p>
      </div>

      {/* Plans */}
      <div className="space-y-3 mb-8">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className={`w-full rounded-2xl p-4 text-left transition-all relative ${
              plan.best ? 'best-value' : 'card-gradient'
            } ${selected === plan.id ? 'ring-2 ring-purple-500' : ''}`}
          >
            {plan.best && (
              <span className="absolute -top-2.5 left-4 px-2 py-0.5 text-xs font-semibold bg-purple-600 rounded-full">
                {t.bestValue}
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{labelKey(plan.id)}</div>
                <div className="text-gray-400 text-sm">
                  {plan.pricePerMonth}{t.perMonth}
                  {plan.save && (
                    <span className="ml-2 text-green-400 font-medium">
                      {t.save} {plan.save}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{plan.price}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Subscribe Button */}
      <button
        onClick={() => handleSubscribe(selected)}
        disabled={loading}
        className="w-full py-4 rounded-2xl font-semibold text-lg gradient-bg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? t.processing : t.subscribe}
      </button>

      {/* Features */}
      <div className="mt-8 px-2">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">{t.features}</h3>
        <div className="space-y-3">
          {[t.feat1, t.feat2, t.feat3, t.feat4, t.feat5].map((feat, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="text-purple-400">✓</span>
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
