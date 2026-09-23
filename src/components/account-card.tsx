'use client';

import { useEffect, useRef, useState } from 'react';
import type { Messages } from '@/lib/i18n';
import { BTN_FLAT, CARD, CARD_HAIRLINE, CHIP, EYEBROW } from './ui/recipes';

/** What /api/status returns for a linked account. */
export interface AccountStatus {
  accountId: string;
  tier: string;
  isActive: boolean;
  expiresAt: string | null;
  store: string | null;
  devicesUsed: number;
  maxDevices: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const COPIED_MS = 2000;

export function formatDate(iso: string, lang: string): string {
  // Same format as doppler-web's account dashboard (subscription-card.tsx).
  return new Date(iso).toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * The account the way doppler-web's /[locale]/account shows it: plan, expiry, days
 * left, devices, and the Account ID with a copy button. Card recipe B.
 */
export function AccountCard({ status, lang, messages }: { status: AccountStatus; lang: string; messages: Messages }) {
  const a = messages.account;
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const expired = !status.isActive && !!status.expiresAt;
  const daysLeft = status.expiresAt
    ? Math.max(0, Math.ceil((new Date(status.expiresAt).getTime() - Date.now()) / DAY_MS))
    : 0;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(status.accountId);
    } catch {
      // Clipboard can be blocked inside some Telegram clients; the ID stays selectable.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <div className={`${CARD} p-5`}>
      <span className={CARD_HAIRLINE} aria-hidden="true" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className={EYEBROW}>{messages.miniapp.account}</h2>
          {status.isActive ? (
            <span className={CHIP}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent-teal-light" aria-hidden="true" />
              {a.pro}
            </span>
          ) : (
            <span className="rounded-full border border-overlay/15 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-text-tertiary">
              {a.free}
            </span>
          )}
        </div>

        {status.isActive && status.expiresAt && (
          <div>
            <p className="font-display text-xl font-semibold text-text-primary">
              {a.activeUntil.replace('{date}', formatDate(status.expiresAt, lang))}
            </p>
            <p className="mt-1 text-sm text-text-muted tabular-nums">{a.daysLeft.replace('{days}', String(daysLeft))}</p>
          </div>
        )}
        {expired && (
          <p className="text-sm font-medium text-accent-amber">
            {a.expiredOn.replace('{date}', formatDate(status.expiresAt!, lang))}
          </p>
        )}
        {!status.isActive && !expired && <p className="text-sm text-text-muted">{a.noSubscription}</p>}

        <p className="text-sm text-text-muted tabular-nums">
          {a.devices.replace('{used}', String(status.devicesUsed)).replace('{max}', String(status.maxDevices))}
        </p>

        <div className="h-px bg-overlay/10" />

        <div>
          <div className="flex items-center gap-2">
            <span dir="ltr" className="flex-1 min-w-0 font-mono text-sm font-medium text-text-primary select-all break-all">
              {status.accountId}
            </span>
            <button type="button" onClick={copyId} className={`${BTN_FLAT} shrink-0`}>
              {copied ? messages.miniapp.copied : a.copyId}
            </button>
          </div>
          <p className="mt-2 text-xs text-text-tertiary">{a.idHint}</p>
        </div>
      </div>
    </div>
  );
}
