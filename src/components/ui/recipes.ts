/**
 * Class lists copied from doppler-web (`src/components/ui/card-recipes.ts` and
 * `src/components/account/dashboard/ui.ts`), so the Mini App reads as the landing's
 * account page. Change them there first. The hover orb is left out: a touch webview
 * has no hover, so it would never show.
 */

export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-teal-light focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary';

/** Recipe B, the glass gradient card. */
export const CARD =
  'relative overflow-hidden rounded-2xl border border-overlay/10 ' +
  'bg-gradient-to-br from-accent-teal/[0.08] via-bg-secondary/60 to-accent-gold/[0.04] backdrop-blur-sm';

/** Its top hairline. `inset-x-0`: Tailwind v4 has no inset-inline-start/end pair. */
export const CARD_HAIRLINE =
  'absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent-teal/50 to-transparent';

/** Quieter card for secondary content. */
export const PLAIN_CARD = 'relative rounded-2xl border border-overlay/10 bg-bg-secondary/50';

export const EYEBROW = 'text-xs font-semibold uppercase tracking-wider text-text-tertiary';

/** The one key per screen. */
export const BTN_PRIMARY = `cta-key inline-flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-sm font-semibold text-white ${FOCUS}`;

/** Everything next to the key. */
export const BTN_FLAT = `cta-flat inline-flex items-center justify-center gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold ${FOCUS}`;

export const INPUT =
  'w-full rounded-xl border border-overlay/15 bg-bg-primary/50 px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent-teal focus:ring-1 focus:ring-accent-teal/30 outline-none transition-colors';

/** Teal chip (hero, "Pro" status). */
export const CHIP =
  'inline-flex items-center gap-1.5 rounded-full border border-accent-teal/30 bg-accent-teal/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-accent-teal';

/** Teal icon tile inside rows. */
export const ICON_TILE =
  'flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-bg-secondary/80 border border-accent-teal/20 text-accent-teal';
