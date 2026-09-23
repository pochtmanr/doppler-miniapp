interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramWebAppInitDataUnsafe {
  user?: TelegramWebAppUser;
  query_id?: string;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: TelegramWebAppInitDataUnsafe;
  /** Bot API version the client supports, e.g. "7.10". */
  version: string;
  /** "ios", "android", "macos", "tdesktop", "weba", "webk", "unknown", … */
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isVersionAtLeast: (version: string) => boolean;
  ready: () => void;
  close: () => void;
  expand: () => void;
  /** Opens a URL outside the Mini App (6.1+). Must be called from a user gesture. */
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  /** Hex colours need 6.9+; older clients accept only 'bg_color' / 'secondary_bg_color'. */
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  onEvent: (event: string, cb: () => void) => void;
  offEvent: (event: string, cb: () => void) => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    setParams: (params: { text?: string; color?: string; text_color?: string; is_active?: boolean; is_visible?: boolean }) => void;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
