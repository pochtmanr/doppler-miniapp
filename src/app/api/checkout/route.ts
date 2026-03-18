import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { validateInitData } from '@/lib/telegram';
import { getPlans, type PlanId } from '@/lib/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLAN_NAMES: Record<PlanId, string> = {
  monthly: 'Doppler VPN Pro — Monthly',
  '6month': 'Doppler VPN Pro — 6 Months',
  yearly: 'Doppler VPN Pro — Yearly',
};

export async function POST(req: NextRequest) {
  try {
    const { planId, initData, promoId } = await req.json();
    const plans = getPlans();
    const plan = plans[planId as PlanId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    const planName = PLAN_NAMES[planId as PlanId];

    // Apply promo discount if provided
    let finalCents = plan.cents;
    let promoDiscount = 0;
    if (promoId) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: promo } = await supabase.from('promo_codes').select('discount_percent').eq('id', promoId).eq('is_active', true).single();
        if (promo) {
          promoDiscount = promo.discount_percent;
          finalCents = Math.round(plan.cents * (1 - promoDiscount / 100));
        }
      } catch (e) {
        console.error('Promo lookup failed:', e);
      }
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    }

    // Validate Telegram WebApp initData — no fallback, reject on failure
    if (!initData) {
      return NextResponse.json({ error: 'Missing auth — please open from Telegram bot' }, { status: 401 });
    }

    const user = validateInitData(initData, botToken);
    if (!user) {
      console.error('initData validation failed. initData length:', initData.length);
      return NextResponse.json({ error: 'Invalid auth — please open from Telegram bot' }, { status: 401 });
    }

    const userId = user.id;

    const baseUrl = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: planName },
          unit_amount: finalCents,
        },
        quantity: 1,
      }],
      metadata: {
        telegram_user_id: String(userId),
        plan_id: planId,
        days: String(plan.days),
        promo_id: promoId || '',
        promo_discount: String(promoDiscount),
        original_cents: String(plan.cents),
      },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: baseUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
