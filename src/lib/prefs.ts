/**
 * The viewer's own choices, kept on this device. Storage can be missing or throw inside
 * some webviews, so every access is guarded and the app works without it. The boot script
 * in layout.tsx reads the same keys before first paint.
 */
export type ThemePref = 'auto' | 'light' | 'dark';

export const THEME_KEY = 'doppler.theme';
export const LANG_KEY = 'doppler.lang';
/** Fired on window when the theme preference changes, so TelegramTheme re-applies it. */
export const THEME_EVENT = 'doppler-theme';

export function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Not persisted; the choice still applies for this session.
  }
}

export function themePref(): ThemePref {
  const v = readPref(THEME_KEY);
  return v === 'light' || v === 'dark' ? v : 'auto';
}
