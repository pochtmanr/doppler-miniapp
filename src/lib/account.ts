import 'server-only';
import { supabaseAdmin } from '@/lib/supabase';

const ACCOUNT_ID_REGEX = /^VPN-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export interface LinkedAccount {
  /** accounts.id (uuid): device_sessions and other tables key on this. */
  uuid: string;
  /** The VPN-XXXX-XXXX-XXXX code — what the user signs in with and what checkout charges. */
  code: string;
  tier: string | null;
  expiresAt: string | null;
  maxDevices: number | null;
  /** Who sold the current term: app_store, play_store, revolut, oxapay, … */
  store: string | null;
}

type AccountRow = {
  id: string;
  account_id: string;
  subscription_tier: string | null;
  subscription_expires_at: string | null;
  max_devices: number | null;
  subscription_store: string | null;
};

const COLUMNS = 'id, account_id, subscription_tier, subscription_expires_at, max_devices, subscription_store';

/**
 * The account @dopplercreatebot linked to this Telegram user. Same order the bot uses:
 * telegram_users.account_id (row uuid), then telegram_users.account_code.
 *
 * Read-only on purpose. The bot creates and links the account on /start, so a user
 * with no account here has not started the bot, and the Mini App says so rather than
 * minting a second account the bot doesn't know about.
 */
export async function findLinkedAccount(telegramId: number): Promise<LinkedAccount | null> {
  const { data: tgUser, error } = await supabaseAdmin
    .from('telegram_users')
    .select('account_id, account_code')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  if (error) throw error;
  if (!tgUser) return null;

  let row: AccountRow | null = null;
  if (tgUser.account_id) {
    ({ data: row } = await supabaseAdmin.from('accounts').select(COLUMNS).eq('id', tgUser.account_id).maybeSingle());
  }
  if (!row && tgUser.account_code) {
    ({ data: row } = await supabaseAdmin.from('accounts').select(COLUMNS).eq('account_id', tgUser.account_code).maybeSingle());
  }
  if (!row || !ACCOUNT_ID_REGEX.test(row.account_id)) return null;

  return {
    uuid: row.id,
    code: row.account_id,
    tier: row.subscription_tier,
    expiresAt: row.subscription_expires_at,
    maxDevices: row.max_devices,
    store: row.subscription_store,
  };
}

/** Signed-in devices, counted the way doppler-web's /api/account/devices lists them. */
export async function countDevices(accountUuid: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('device_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountUuid);
  if (error) throw error;
  return count ?? 0;
}
