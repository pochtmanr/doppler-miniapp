'use client';

import { useEffect } from 'react';

/**
 * Follows Telegram's light/dark scheme after load (the boot script in layout.tsx sets
 * the first frame) and paints Telegram's own header and background to match ours.
 */
export function TelegramTheme() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const apply = () => {
      document.documentElement.classList.toggle('light', tg.colorScheme === 'light');
      // Hex colours need Bot API 6.9; older clients throw on anything but the theme keys.
      if (!tg.isVersionAtLeast?.('6.9')) return;
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary').trim();
      try {
        tg.setHeaderColor(bg);
        tg.setBackgroundColor(bg);
      } catch {
        // Unsupported client: Telegram keeps its own colours.
      }
    };

    apply();
    tg.onEvent('themeChanged', apply);
    return () => tg.offEvent('themeChanged', apply);
  }, []);

  return null;
}
