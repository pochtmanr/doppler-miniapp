import en from '../../messages/en.json';
import ru from '../../messages/ru.json';
import es from '../../messages/es.json';
import zh from '../../messages/zh.json';
import hi from '../../messages/hi.json';
import ar from '../../messages/ar.json';
import pt from '../../messages/pt.json';
import ja from '../../messages/ja.json';
import de from '../../messages/de.json';
import fa from '../../messages/fa.json';
import uk from '../../messages/uk.json';
import tr from '../../messages/tr.json';
import ko from '../../messages/ko.json';
import fr from '../../messages/fr.json';
import it from '../../messages/it.json';
import pl from '../../messages/pl.json';
import nl from '../../messages/nl.json';
import id from '../../messages/id.json';
import th from '../../messages/th.json';
import vi from '../../messages/vi.json';
import ro from '../../messages/ro.json';

export type Messages = typeof en;

const locales: Record<string, Messages> = {
  en, ru, es, zh, hi, ar, pt, ja, de, fa, uk, tr, ko, fr, it, pl, nl, id, th, vi, ro,
};

export function detectLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  const lang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (!lang) return 'en';
  if (locales[lang]) return lang;
  const prefix = lang.slice(0, 2);
  if (locales[prefix]) return prefix;
  return 'en';
}

export function getMessages(lang: string): Messages {
  return locales[lang] || locales['en'];
}
