'use client';

import { useEffect, useState } from 'react';
import { LANGUAGE_NAMES, LOCALES, type Messages } from '@/lib/i18n';
import { THEME_EVENT, THEME_KEY, themePref, writePref, type ThemePref } from '@/lib/prefs';
import { FOCUS } from './ui/recipes';

const NEXT: Record<ThemePref, ThemePref> = { auto: 'light', light: 'dark', dark: 'auto' };

const PILL = `relative inline-flex items-center gap-1.5 rounded-full border border-overlay/10 bg-bg-secondary/40 px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:border-overlay/20 transition-colors ${FOCUS}`;

function ThemeIcon({ pref }: { pref: ThemePref }) {
  const common = { className: 'w-3.5 h-3.5', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const;
  if (pref === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }
  if (pref === 'dark') {
    return (
      <svg {...common}>
        <path strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Language and theme, top of every screen. Both are saved on this device only. */
export function PrefsBar({ lang, messages, onLang }: { lang: string; messages: Messages; onLang: (lang: string) => void }) {
  const s = messages.prefs;
  const [theme, setTheme] = useState<ThemePref>('auto');
  useEffect(() => setTheme(themePref()), []);

  const cycleTheme = () => {
    const next = NEXT[theme];
    setTheme(next);
    writePref(THEME_KEY, next === 'auto' ? null : next);
    window.dispatchEvent(new Event(THEME_EVENT));
  };
  const themeLabel = theme === 'light' ? s.themeLight : theme === 'dark' ? s.themeDark : s.themeAuto;

  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      <label className={`${PILL} cursor-pointer focus-within:ring-2 focus-within:ring-accent-teal-light`}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9s1.3-6.3 3.8-9z" />
        </svg>
        <span>{LANGUAGE_NAMES[lang] ?? lang}</span>
        <svg className="w-3 h-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
        {/* The native picker: a real list on every phone, no custom sheet to maintain. */}
        <select
          value={lang}
          onChange={(e) => onLang(e.target.value)}
          aria-label={s.language}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_NAMES[code] ?? code}
            </option>
          ))}
        </select>
      </label>
      <button type="button" onClick={cycleTheme} className={PILL} aria-label={`${s.theme}: ${themeLabel}`}>
        <ThemeIcon pref={theme} />
        <span>{themeLabel}</span>
      </button>
    </div>
  );
}
