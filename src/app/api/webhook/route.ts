import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion });

const PLAN_DAYS: Record<string, number> = {
  monthly: 30,
  '6month': 180,
  yearly: 365,
};

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
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const telegramUserId = session.metadata?.telegram_user_id;
    const planId = session.metadata?.plan_id || 'monthly';
    const days = PLAN_DAYS[planId] || 30;

    if (telegramUserId) {
      const telegramId = parseInt(telegramUserId, 10);

      // 1. Get account via telegram_users
      const { data: tgUser } = await supabaseAdmin
        .from('telegram_users')
        .select('account_id')
        .eq('telegram_id', telegramId)
        .single();

      if (tgUser?.account_id) {
        // Get current subscription to extend if active
        const { data: account } = await supabaseAdmin
          .from('accounts')
          .select('subscription_expires_at')
          .eq('id', tgUser.account_id)
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
            subscription_store: 'stripe',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tgUser.account_id);
      }

      // 2. Log invoice
      await supabaseAdmin.from('vpn_invoices').insert({
        telegram_user_id: telegramId,
        plan: planId,
        amount: session.amount_total || 0,
        currency: 'USD',
        status: 'paid',
        provider: 'stripe',
        provider_payment_id: session.payment_intent as string,
      });

      // 3. Create subscription record
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      await supabaseAdmin.from('vpn_subscriptions').insert({
        telegram_user_id: telegramId,
        plan: planId,
        status: 'active',
        payment_method: 'stripe',
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      // 4. Grant RevenueCat entitlement
      await grantRevenueCatEntitlement(telegramUserId, planId);
    }
  }

  return NextResponse.json({ received: true });
}
