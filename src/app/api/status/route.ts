import { NextRequest, NextResponse } from 'next/server';
import { telegramUserFrom } from '@/lib/telegram';
import { findLinkedAccount } from '@/lib/account';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    const user = telegramUserFrom(initData);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await findLinkedAccount(user.id);
    const expiresAt = account?.expiresAt ?? null;
    const isActive = !!account && account.tier !== 'free' && !!expiresAt && new Date(expiresAt) > new Date();

    return NextResponse.json(
      {
        tier: isActive ? account!.tier : 'free',
        expiresAt,
        isActive,
        accountId: account?.code ?? null,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error: unknown) {
    console.error('Status error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
