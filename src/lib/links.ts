/**
 * Everything the Mini App links out to. Each one opens outside the webview: a plain
 * <a href> would replace the Mini App with the site and leave no way back.
 */

const SITE = 'https://www.dopplervpn.org';

export const DOWNLOADS = {
  // One App Store listing serves iPhone, iPad and Mac (doppler-web config/platforms/macos.ts).
  ios: 'https://apps.apple.com/app/id6757091773',
  mac: 'https://apps.apple.com/app/id6757091773',
  android: 'https://play.google.com/store/apps/details?id=org.dopplervpn.android',
  windows: `${SITE}/api/windows/download/latest-x64`,
} as const;

export type Platform = keyof typeof DOWNLOADS;

/** The landing serves every Mini App locale; for the blog it redirects missing ones to /en itself. */
export function blogUrl(lang: string): string {
  return `${SITE}/${lang}/blog`;
}

/** The landing's legal pages are the only copy; the Mini App renders none of its own. */
export function legalUrl(lang: string, page: 'privacy' | 'terms' | 'refund'): string {
  return `${SITE}/${lang}/${page}`;
}

/** Call from a click handler only: Telegram ignores openLink outside a user gesture. */
export function openExternal(url: string): void {
  const tg = window.Telegram?.WebApp;
  if (tg?.openLink && tg.isVersionAtLeast?.('6.1')) {
    tg.openLink(url);
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}
