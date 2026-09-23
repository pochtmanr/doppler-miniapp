import type { Metadata, Viewport } from 'next';
import { Nunito, Rubik, Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import { LOCALES, RTL_LOCALES } from '@/lib/i18n';
import { LANG_KEY, THEME_KEY } from '@/lib/prefs';
import { TelegramTheme } from '@/components/telegram-theme';
import './globals.css';

// Fonts mirror doppler-web's [locale]/layout.tsx.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  // No Arial stand-in: it would catch Cyrillic before Rubik does.
  adjustFontFallback: false,
});

const rubik = Rubik({
  subsets: ['cyrillic'],
  variable: '--font-rubik',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
  preload: false,
});

// Nunito's 700 is the match for SF Pro Rounded Semibold; headings use only this face.
const nunito = Nunito({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-rounded',
  display: 'swap',
  weight: '700',
});

export const metadata: Metadata = {
  title: 'Doppler VPN Pro',
  description: 'Get Doppler VPN Pro and manage your account',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Runs before first paint, so a light-theme user never sees a dark flash. A theme or
 * language the viewer picked in the app (lib/prefs.ts) wins over Telegram's.
 * Telegram passes the theme and the user's language in the launch URL's hash;
 * telegram-web-app.js derives colorScheme from bg_color the same way (HSP < 120 = dark).
 * TelegramTheme keeps it in sync afterwards.
 */
const bootScript = `(function(){try{
var h=new URLSearchParams(location.hash.slice(1));
var st=function(k){try{return localStorage.getItem(k)}catch(e){return null}};
var th=st('${THEME_KEY}'),pl=st('${LANG_KEY}');
var tp=JSON.parse(h.get('tgWebAppThemeParams')||'{}');var bg=tp.bg_color;
if(th==='light')document.documentElement.classList.add('light');
else if(th!=='dark'&&bg&&/^#[0-9a-f]{6}$/i.test(bg)){var r=parseInt(bg.slice(1,3),16),g=parseInt(bg.slice(3,5),16),b=parseInt(bg.slice(5,7),16);
if(Math.sqrt(0.299*r*r+0.587*g*g+0.114*b*b)>=120)document.documentElement.classList.add('light');}
var d=new URLSearchParams(h.get('tgWebAppData')||'');var u=JSON.parse(d.get('user')||'{}');
var L=${JSON.stringify(LOCALES)},R=${JSON.stringify(RTL_LOCALES)};
var l=u.language_code||'en';if(L.indexOf(l)<0)l=L.indexOf(l.slice(0,2))<0?'en':l.slice(0,2);
if(pl&&L.indexOf(pl)>=0)l=pl;
document.documentElement.lang=l;if(R.indexOf(l)>=0)document.documentElement.dir='rtl';
}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${rubik.variable} ${nunito.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <TelegramTheme />
        {children}
      </body>
    </html>
  );
}
