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
