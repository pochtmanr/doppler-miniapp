import { NextRequest, NextResponse } from 'next/server';
import { Paddle, Environment, EventName } from '@paddle/paddle-node-sdk';
import { supabaseAdmin } from '@/lib/supabase';

function getPaddle(): Paddle {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error('PADDLE_API_KEY is not configured');

  const env = process.env.PADDLE_ENVIRONMENT === 'production'
    ? Environment.production
    : Environment.sandbox;

  return new Paddle(apiKey, { environment: env });
}

function getWebhookSecret(): string {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) throw new Error('PADDLE_WEBHOOK_SECRET is not configured');
  return secret;
}

const PLAN_DAYS: Record<string, number> = {
  monthly: 30,
  '6month': 180,
  yearly: 365,
};

function generateAccountId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `VPN-${segment()}-${segment()}-${segment()}`;
}

async function grantRevenueCatEntitlement(telegramUserId: string, planId: string) {
  const rcSecret = process.env.REVENUECAT_SECRET_KEY;
  if (!rcSecret) return;

  try {
    await fetch(`https://api.revenuecat.com/v1/subscribers/tg_${telegramUserId}/entitlements/pro/grant_promotional`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${rcSecret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        duration: planId === 'yearly' ? 'yearly' : planId === '6month' ? 'six_month' : 'monthly',
      }),
    });
  } catch (e) {
    console.error('RevenueCat grant error:', e);
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('paddle-signature') || '';

  if (!signature) {
    return NextResponse.json({ error: 'Missing paddle-signature header' }, { status: 400 });
  }

  const paddle = getPaddle();
  const webhookSecret = getWebhookSecret();

  let eventData;
  try {
    eventData = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature);
  } catch (err) {
    console.error('Paddle webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (eventData.eventType === EventName.TransactionCompleted) {
    const txn = eventData.data;
    const customData = txn.customData as Record<string, string> | null;
    const telegramUserId = customData?.telegram_user_id;
    const planId = customData?.plan_id || 'monthly';
    const days = PLAN_DAYS[planId] || 30;

    if (!telegramUserId) {
      console.error('Paddle webhook: missing telegram_user_id in customData', txn.id);
      return NextResponse.json({ received: true });
    }

    // Idempotency check
    const { data: existingInvoice } = await supabaseAdmin
      .from('vpn_invoices')
      .select('id')
      .eq('provider_payment_id', txn.id)
      .maybeSingle();

    if (existingInvoice) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    const telegramId = parseInt(telegramUserId, 10);

    // 1. Get account via telegram_users — auto-create if missing
    let { data: tgUser } = await supabaseAdmin
      .from('telegram_users')
      .select('account_id')
      .eq('telegram_id', telegramId)
      .single();

    if (!tgUser?.account_id) {
      const newAccountId = generateAccountId();
      const { error: accountError } = await supabaseAdmin
        .from('accounts')
        .insert({
          id: newAccountId,
          subscription_tier: 'free',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (accountError) {
        console.error('Failed to create account:', accountError);
        return NextResponse.json({ error: 'Account creation failed' }, { status: 500 });
      }

      const { error: linkError } = await supabaseAdmin
        .from('telegram_users')
        .insert({
          telegram_id: telegramId,
          account_id: newAccountId,
        });

      if (linkError) {
        console.error('Failed to link telegram user:', linkError);
        return NextResponse.json({ error: 'User linking failed' }, { status: 500 });
      }

      tgUser = { account_id: newAccountId };
      console.log(`Auto-created account ${newAccountId} for telegram user ${telegramId}`);
    }

    const accountId = tgUser.account_id;

    // 2. Extend or set subscription on the account
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('subscription_expires_at')
      .eq('id', accountId)
      .single();

    const currentExpiry = account?.subscription_expires_at
      ? new Date(account.subscription_expires_at)
      : null;
    const effectiveStart = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(effectiveStart);
    newExpiry.setDate(newExpiry.getDate() + days);

    await supabaseAdmin
      .from('accounts')
      .update({
        subscription_tier: 'pro',
        subscription_expires_at: newExpiry.toISOString(),
        subscription_store: 'paddle',
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    // 3. Log invoice
    await supabaseAdmin.from('vpn_invoices').insert({
      telegram_user_id: telegramId,
      plan: planId,
      amount: txn.details?.totals?.total ? Number(txn.details.totals.total) : 0,
      currency: txn.currencyCode || 'USD',
      status: 'paid',
      provider: 'paddle',
      provider_payment_id: txn.id,
    });

    // 4. Create subscription record
    await supabaseAdmin.from('vpn_subscriptions').insert({
      telegram_user_id: telegramId,
      plan: planId,
      status: 'active',
      payment_method: 'paddle',
      starts_at: new Date().toISOString(),
      expires_at: newExpiry.toISOString(),
    });

    // 5. Grant RevenueCat entitlement
    await grantRevenueCatEntitlement(telegramUserId, planId);
  }

  return NextResponse.json({ received: true });
}
