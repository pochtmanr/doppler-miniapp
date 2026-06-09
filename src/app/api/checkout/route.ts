import { NextRequest, NextResponse } from 'next/server';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { validateInitData } from '@/lib/telegram';
import { type PlanId } from '@/lib/plans';

function getPaddle(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error('PADDLE_API_KEY is not configured');

  const env = process.env.PADDLE_ENVIRONMENT === 'production'
    ? Environment.production
    : Environment.sandbox;

  return new Paddle(apiKey, { environment: env });
}

function getPaddlePriceId(planId: PlanId): string {
  const envKey = {
    monthly: 'PADDLE_PRICE_ID_MONTHLY',
    '6month': 'PADDLE_PRICE_ID_6M',
    yearly: 'PADDLE_PRICE_ID_YEARLY',
  }[planId];

  const priceId = process.env[envKey];
  if (!priceId) throw new Error(`${envKey} is not configured`);
  return priceId;
}

export async function POST(req: NextRequest) {
  try {
    const { planId, initData } = await req.json();

    const validPlans: PlanId[] = ['monthly', '6month', 'yearly'];
    if (!validPlans.includes(planId)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    if (!initData) {
      return NextResponse.json({ error: 'Missing auth — please open from Telegram bot' }, { status: 401 });
    }

    const user = validateInitData(initData, botToken);
    if (!user) {
      console.error('initData validation failed. initData length:', initData.length);
      return NextResponse.json({ error: 'Invalid auth — please open from Telegram bot' }, { status: 401 });
    }

    const userId = user.id;
    const priceId = getPaddlePriceId(planId as PlanId);
    const baseUrl = req.nextUrl.origin;

    // Create a Paddle transaction server-side and return checkout URL
    const paddle = getPaddle();
    const transaction = await paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: {
        telegram_user_id: String(userId),
        plan_id: planId,
        source: 'miniapp',
      },
    });

    // Build checkout URL from the transaction
    const checkoutDomain = process.env.PADDLE_ENVIRONMENT === 'production'
      ? 'https://checkout.paddle.com'
      : 'https://sandbox-checkout.paddle.com';
    const checkoutUrl = `${checkoutDomain}/checkout/${transaction.id}?returnUrl=${encodeURIComponent(`${baseUrl}/success?txn_id=${transaction.id}`)}`;

    return NextResponse.json({ url: checkoutUrl });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
