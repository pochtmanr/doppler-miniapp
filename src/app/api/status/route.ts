import { NextRequest, NextResponse } from 'next/server';
import { validateInitData } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { initData } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    const user = validateInitData(initData, botToken);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tgUser } = await supabaseAdmin
      .from('telegram_users')
      .select('account_id')
      .eq('telegram_id', user.id)
      .single();

    if (!tgUser?.account_id) {
      return NextResponse.json({
        tier: 'free',
        expiresAt: null,
        isActive: false,
        accountId: null,
      });
    }

    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', tgUser.account_id)
      .single();

    const expiresAt = account?.subscription_expires_at;
    const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;

    return NextResponse.json(
      {
        tier: isActive ? (account?.subscription_tier || 'free') : 'free',
        expiresAt: expiresAt || null,
        isActive,
        accountId: tgUser.account_id,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error: unknown) {
    console.error('Status error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
