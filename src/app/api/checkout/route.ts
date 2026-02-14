import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { validateInitData } from '@/lib/telegram';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion });

const PLANS: Record<string, { name: string; cents: number; days: number }> = {
  monthly: { name: 'Doppler VPN Pro — Monthly', cents: 999, days: 30 },
  '6month': { name: 'Doppler VPN Pro — 6 Months', cents: 4999, days: 180 },
  yearly: { name: 'Doppler VPN Pro — Yearly', cents: 7999, days: 365 },
};

export async function POST(req: NextRequest) {
  try {
    const { planId, initData } = await req.json();
    const plan = PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Validate Telegram auth
    const botToken = process.env.TELEGRAM_BOT_TOKEN!;
    const user = validateInitData(initData, botToken);
    if (!user) {
      return NextResponse.json({ error: 'Invalid auth' }, { status: 401 });
    }

    const baseUrl = req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: plan.name },
          unit_amount: plan.cents,
        },
        quantity: 1,
      }],
      metadata: {
        telegram_user_id: String(user.id),
        plan_id: planId,
        days: String(plan.days),
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
