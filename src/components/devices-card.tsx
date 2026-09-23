'use client';

import type { Messages } from '@/lib/i18n';
import { PlatformLogo, type PlatformIcon } from './platform-icons';
import { CARD, CARD_HAIRLINE, CHIP, EYEBROW } from './ui/recipes';

/** One device_sessions row as /api/status returns it (no device_id, no account id). */
export interface Device {
  name: string;
  type: string;
  isMain: boolean;
  lastActiveAt: string | null;
}

const ICON: Record<string, PlatformIcon> = { ios: 'apple', macos: 'apple', android: 'googlePlay', windows: 'windows' };
const PLATFORM: Record<string, string> = { ios: 'iOS', macos: 'macOS', android: 'Android', windows: 'Windows' };
const BROWSERS = new Set(['chrome', 'firefox', 'web']);

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/** "2 days ago" in the reader's language, without a string per locale. */
function relative(iso: string, lang: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(diff)) return '';
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return rtf.format(0, 'minute');
}

function DeviceGlyph({ type }: { type: string }) {
  const icon = ICON[type];
  if (icon) return <PlatformLogo icon={icon} className="w-5 h-5" />;
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path strokeLinecap="round" d="M8 20h8M12 16v4" />
    </svg>
  );
}

/** The account's signed-in devices, like the Devices screen in the apps. Card recipe B. */
export function DevicesCard({
  devices,
  maxDevices,
  lang,
  messages,
}: {
  devices: Device[];
  maxDevices: number;
  lang: string;
  messages: Messages;
}) {
  const d = messages.devices;
  const label = (type: string) => PLATFORM[type] ?? (BROWSERS.has(type) ? d.browser : d.unknown);

  return (
    <section className={`${CARD} p-5`} aria-labelledby="devices-title">
      <span className={CARD_HAIRLINE} aria-hidden="true" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <h2 id="devices-title" className={EYEBROW}>{d.title}</h2>
          <span className="text-xs text-text-tertiary tabular-nums">
            {d.count.replace('{used}', String(devices.length)).replace('{max}', String(maxDevices))}
          </span>
        </div>

        {devices.length === 0 ? (
          <p className="mt-4 text-sm text-text-muted">{d.empty}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {devices.map((device, i) => (
              <li
                key={`${device.name}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-overlay/10 bg-bg-secondary/20 px-3 py-2.5"
              >
                <span className="flex items-center justify-center w-9 h-9 shrink-0 rounded-xl bg-bg-secondary/80 border border-overlay/10 text-text-muted">
                  <DeviceGlyph type={device.type} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span dir="auto" className="truncate text-sm font-medium text-text-primary">
                      {device.name || label(device.type)}
                    </span>
                    {device.isMain && <span className={`${CHIP} shrink-0 !px-2 !text-[10px]`}>{d.main}</span>}
                  </span>
                  <span className="block truncate text-xs text-text-tertiary">
                    {label(device.type)}
                    {device.lastActiveAt && ` · ${d.lastActive.replace('{when}', relative(device.lastActiveAt, lang))}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs text-text-tertiary">{d.hint}</p>
      </div>
    </section>
  );
}
