import { NextRequest, NextResponse } from 'next/server';
import { telegramUserFrom } from '@/lib/telegram';
import { findLinkedAccount } from '@/lib/account';
import { postDopplerWeb } from '@/lib/doppler-web';
import type { PlanId } from '@/lib/plans';

/** Checkout plan id → value stored on promo_codes.applicable_plans. */
const PROMO_PLAN: Record<PlanId, string> = { monthly: 'monthly', '6month': 'semiannual', yearly: 'annual' };

/**
 * Preview only: shows the discount before paying. The charge is re-priced by
 * doppler-web at checkout, so nothing here can lower what the user pays.
 */
export async function POST(req: NextRequest) {
  try {
    const { initData, code, planId } = await req.json();

    const user = telegramUserFrom(initData);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const plan = PROMO_PLAN[planId as PlanId];
    if (!plan || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const account = await findLinkedAccount(user.id);
    if (!account) return NextResponse.json({ error: 'no-account' }, { status: 404 });

    const { status, data } = await postDopplerWeb('/api/promo/validate', {
      code,
      account_id: account.code,
      plan,
    });
    if (!data.valid) return NextResponse.json({ valid: false, error: data.error ?? 'Invalid promo code' }, { status });

    return NextResponse.json({
      valid: true,
      code: data.code,
      promo_id: data.promo_id,
      discount_percent: data.discount_percent,
    });
  } catch (error: unknown) {
    console.error('Promo error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
