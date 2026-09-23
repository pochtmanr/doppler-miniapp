'use client';

import { useEffect } from 'react';
import { THEME_EVENT, themePref } from '@/lib/prefs';

/**
 * Follows Telegram's light/dark scheme after load (the boot script in layout.tsx sets
 * the first frame), unless the viewer picked Light or Dark in the app, and paints
 * Telegram's own header and background to match ours.
 */
export function TelegramTheme() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    const apply = () => {
      const pref = themePref();
      const light = pref === 'auto' ? tg?.colorScheme === 'light' : pref === 'light';
      document.documentElement.classList.toggle('light', light);
      // Hex colours need Bot API 6.9; older clients throw on anything but the theme keys.
      if (!tg?.isVersionAtLeast?.('6.9')) return;
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim();
      try {
        tg.setHeaderColor(bg);
        tg.setBackgroundColor(bg);
      } catch {
        // Unsupported client: Telegram keeps its own colours.
      }
    };

    apply();
    tg?.onEvent('themeChanged', apply);
    window.addEventListener(THEME_EVENT, apply);
    return () => {
      tg?.offEvent('themeChanged', apply);
      window.removeEventListener(THEME_EVENT, apply);
    };
  }, []);

  return null;
}
