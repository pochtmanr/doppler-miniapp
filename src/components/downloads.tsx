'use client';

import { useEffect, useState } from 'react';
import type { Messages } from '@/lib/i18n';
import { DOWNLOADS, blogUrl, openExternal, type Platform } from '@/lib/links';
import { PlatformLogo, type PlatformIcon } from './platform-icons';
import { FOCUS } from './ui/recipes';

const TILES: { key: Platform; name: string; icon: PlatformIcon; store: string | null }[] = [
  { key: 'ios', name: 'iOS', icon: 'apple', store: 'App Store' },
  { key: 'android', name: 'Android', icon: 'googlePlay', store: 'Google Play' },
  { key: 'mac', name: 'macOS', icon: 'apple', store: 'Mac App Store' },
  { key: 'windows', name: 'Windows', icon: 'windows', store: null },
];

/** The platform Telegram says it runs on, so that tile comes first. */
function currentPlatform(): Platform | null {
  const p = window.Telegram?.WebApp?.platform ?? '';
  if (p === 'ios') return 'ios';
  if (p === 'android' || p === 'android_x') return 'android';
  if (p === 'macos') return 'mac';
  if (p === 'tdesktop') return /Mac/i.test(navigator.userAgent) ? 'mac' : 'windows';
  return null;
}

/**
 * The landing's "Available on" block (doppler-web sections/platforms-available.tsx),
 * minus its animated glyph band, plus the blog.
 */
export function Downloads({ lang, messages }: { lang: string; messages: Messages }) {
  const t = messages.apps;
  const [tiles, setTiles] = useState(TILES);

  useEffect(() => {
    const first = currentPlatform();
    if (first) setTiles([...TILES].sort((a, b) => Number(b.key === first) - Number(a.key === first)));
  }, []);

  return (
    <section className="mt-10">
      <div className="text-center mb-5">
        <p className="text-xs uppercase tracking-wider text-text-tertiary mb-1">{t.eyebrow}</p>
        <h2 className="text-xl font-semibold text-text-primary">{t.title}</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            type="button"
            onClick={() => openExternal(DOWNLOADS[tile.key])}
            className={`group relative flex h-[88px] flex-row overflow-hidden rounded-xl border border-overlay/10 bg-bg-secondary/20 hover:bg-bg-secondary/35 hover:border-accent-teal/30 transition-colors text-start ${FOCUS}`}
          >
            <span className="relative flex w-[34%] shrink-0 items-center justify-center border-e border-overlay/5 bg-bg-secondary/40">
              <PlatformLogo icon={tile.icon} className="w-7 h-7 text-text-muted group-hover:text-accent-teal transition-colors" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5 px-3 py-3">
              <span className="font-display text-base font-semibold leading-tight text-text-primary">{tile.name}</span>
              <span className="text-xs leading-tight text-text-muted">{tile.store ?? t.directDownload}</span>
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => openExternal(blogUrl(lang))}
        className={`mt-3 flex w-full items-center justify-between rounded-xl border border-overlay/10 bg-bg-secondary/20 px-4 py-3.5 text-sm font-medium text-text-primary hover:border-accent-teal/30 transition-colors ${FOCUS}`}
      >
        <span>{t.blog}</span>
        <svg className="w-4 h-4 shrink-0 text-text-tertiary rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </section>
  );
}
