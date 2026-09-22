import { NextRequest, NextResponse } from 'next/server';
import { telegramUserFrom } from '@/lib/telegram';
import { findLinkedAccount } from '@/lib/account';
import { postDopplerWeb } from '@/lib/doppler-web';
import type { PlanId } from '@/lib/plans';

const VALID_PLANS: PlanId[] = ['monthly', '6month', 'yearly'];
const VALID_COINS = ['usdt_trc20', 'usdc_trc20', 'btc', 'eth', 'ton'];

/**
 * Starts a payment through doppler-web's /api/checkout/telegram.
 *
 * The account is never taken from the client: it comes from the validated initData,
 * so a user can only ever pay for their own account. Promo codes are passed through
 * and priced by doppler-web, which is also what redeems them after payment.
 *
 * Card → { method: 'card', order_token, mode } for the Revolut popup.
 * Crypto → { method: 'crypto', address, pay_amount, ... } to show in the app.
 */
export async function POST(req: NextRequest) {
  try {
    const { initData, planId, method, coin, promoCode, promoId, locale } = await req.json();

    if (!VALID_PLANS.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    if (method !== 'card' && method !== 'crypto') {
      return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
    }
    if (method === 'crypto' && !VALID_COINS.includes(coin)) {
      return NextResponse.json({ error: 'Invalid coin' }, { status: 400 });
    }

    const user = telegramUserFrom(initData);
    if (!user) {
      return NextResponse.json({ error: 'Invalid auth — please open from Telegram bot' }, { status: 401 });
    }

    const account = await findLinkedAccount(user.id);
    if (!account) return NextResponse.json({ error: 'no-account' }, { status: 404 });

    const secret = process.env.CHECKOUT_SHARED_SECRET;
    if (!secret) throw new Error('CHECKOUT_SHARED_SECRET is not configured');

    const { status, data } = await postDopplerWeb(
      '/api/checkout/telegram',
      {
        method,
        plan_id: planId,
        account_id: account.code,
        locale: typeof locale === 'string' ? locale : 'en',
        ...(method === 'crypto' ? { coin } : {}),
        ...(typeof promoCode === 'string' && promoCode ? { promo_code: promoCode } : {}),
        ...(typeof promoId === 'string' && promoId ? { promo_id: promoId } : {}),
      },
      { 'x-checkout-secret': secret },
    );

    if (status !== 200) {
      console.error('Checkout upstream error:', status, data);
      return NextResponse.json({ error: typeof data.error === 'string' ? data.error : 'Checkout failed' }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
