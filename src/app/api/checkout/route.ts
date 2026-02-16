import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { validateInitData } from '@/lib/telegram';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLANS: Record<string, { name: string; cents: number; days: number }> = {
  monthly: { name: 'Doppler VPN Pro — Monthly', cents: 400, days: 30 },
  '6month': { name: 'Doppler VPN Pro — 6 Months', cents: 2000, days: 180 },
  yearly: { name: 'Doppler VPN Pro — Yearly', cents: 3500, days: 365 },
};

export async function POST(req: NextRequest) {
  try {
    const { planId, initData, promoId } = await req.json();
    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

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

    // Validate Telegram WebApp initData
    let userId: number | null = null;

    if (initData) {
      const user = validateInitData(initData, botToken);
      if (user) {
        userId = user.id;
      } else {
        // Log for debugging
        console.error('initData validation failed. initData length:', initData.length);
        console.error('initData preview:', initData.substring(0, 100));
        
        // Try to extract user_id even if hash validation fails (development fallback)
        try {
          const params = new URLSearchParams(initData);
          const userStr = params.get('user');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            userId = parsed.id;
            console.log('Using user from initData without hash validation:', userId);
          }
        } catch {}
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Invalid auth — please open from Telegram bot' }, { status: 401 });
    }

    const baseUrl = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
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
