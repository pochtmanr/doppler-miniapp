import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion });

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
    const paymentId = (session.payment_intent as string) || session.id;

    // Idempotency check — skip if this payment was already processed
    const { data: existingInvoice } = await supabaseAdmin
      .from('vpn_invoices')
      .select('id')
      .eq('provider_payment_id', paymentId)
      .maybeSingle();

    if (existingInvoice) {
      return NextResponse.json({ received: true, deduplicated: true });
    }

    const telegramUserId = session.metadata?.telegram_user_id;
    const planId = session.metadata?.plan_id || 'monthly';
    const days = PLAN_DAYS[planId] || 30;

    if (telegramUserId) {
      const telegramId = parseInt(telegramUserId, 10);

      // 1. Get account via telegram_users — auto-create if missing
      let { data: tgUser } = await supabaseAdmin
        .from('telegram_users')
        .select('account_id')
        .eq('telegram_id', telegramId)
        .single();

      if (!tgUser?.account_id) {
        // Auto-create account for new Telegram user
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
          subscription_store: 'stripe',
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      // 3. Log invoice
      await supabaseAdmin.from('vpn_invoices').insert({
        telegram_user_id: telegramId,
        plan: planId,
        amount: session.amount_total || 0,
        currency: 'USD',
        status: 'paid',
        provider: 'stripe',
        provider_payment_id: session.payment_intent as string,
      });

      // 4. Create subscription record
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

      // 5. Track promo code redemption
      const promoId = session.metadata?.promo_id;
      if (promoId) {
        await supabaseAdmin.from('promo_redemptions').insert({
          promo_code_id: promoId,
          account_id: accountId,
          redeemed_at: new Date().toISOString(),
        });

        await supabaseAdmin.rpc('increment_promo_redemptions', { p_promo_id: promoId }).then(({ error }) => {
          if (error) {
            // Fallback: manually increment if RPC doesn't exist
            console.error('RPC increment_promo_redemptions failed, using manual update:', error);
            supabaseAdmin
              .from('promo_codes')
              .select('current_redemptions')
              .eq('id', promoId)
              .single()
              .then(({ data }) => {
                if (data) {
                  supabaseAdmin
                    .from('promo_codes')
                    .update({ current_redemptions: (data.current_redemptions || 0) + 1 })
                    .eq('id', promoId)
                    .then(({ error: updateErr }) => {
                      if (updateErr) console.error('Failed to increment promo redemptions:', updateErr);
                    });
                }
              });
          }
        });
      }

      // 6. Grant RevenueCat entitlement
      await grantRevenueCatEntitlement(telegramUserId, planId);
    }
  }

  return NextResponse.json({ received: true });
}
