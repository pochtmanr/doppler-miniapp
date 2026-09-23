import { NextRequest, NextResponse } from 'next/server';
import { telegramUserFrom } from '@/lib/telegram';
import { countDevices, findLinkedAccount } from '@/lib/account';

/** doppler-web's default when accounts.max_devices is unset (api/account/devices). */
const DEFAULT_MAX_DEVICES = 10;

/**
 * The signed-in user's account, from validated initData only. There is deliberately
 * no variant that takes an Account ID: the ID is a login credential.
 */
export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

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

    return NextResponse.json(
      {
        accountId: account.code,
        tier: isActive ? account.tier : 'free',
        isActive,
        expiresAt,
        store: account.store,
        devicesUsed: await countDevices(account.uuid),
        maxDevices: account.maxDevices || DEFAULT_MAX_DEVICES,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error: unknown) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
