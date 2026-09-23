import { NextRequest, NextResponse } from 'next/server';
import { telegramUserFrom } from '@/lib/telegram';
import { countDevices, findLinkedAccount, listDevices } from '@/lib/account';

/** doppler-web's default when accounts.max_devices is unset (api/account/devices). */
const DEFAULT_MAX_DEVICES = 10;

/**
 * The signed-in user's account, from validated initData only. There is deliberately
 * no variant that takes an Account ID: the ID is a login credential.
 */
export async function POST(req: NextRequest) {
  try {
    const { initData, devices: withDevices } = await req.json();

    const user = telegramUserFrom(initData);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await findLinkedAccount(user.id);
    if (!account) {
      return NextResponse.json({ accountId: null }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    const expiresAt = account.expiresAt;
    const isActive = account.tier !== 'free' && !!account.tier && !!expiresAt && new Date(expiresAt) > new Date();
    // The list is for the home screen. Payment polling leaves the flag off and gets the count.
    const devices = withDevices === true ? await listDevices(account.uuid) : null;

    return NextResponse.json(
      {
        accountId: account.code,
        tier: isActive ? account.tier : 'free',
        isActive,
        expiresAt,
        store: account.store,
        devicesUsed: devices ? devices.length : await countDevices(account.uuid),
        ...(devices ? { devices } : {}),
        maxDevices: account.maxDevices || DEFAULT_MAX_DEVICES,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error: unknown) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
