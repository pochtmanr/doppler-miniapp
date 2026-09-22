export type PlanId = 'monthly' | '6month' | 'yearly';

/**
 * Display prices, in cents. Must match PLAN_AMOUNTS in doppler-web's
 * /api/checkout/telegram, which is what actually gets charged.
 */
export const DISPLAY_PLANS: { id: PlanId; cents: number; days: number }[] = [
  { id: 'monthly', cents: 699, days: 30 },
  { id: '6month', cents: 2999, days: 180 },
  { id: 'yearly', cents: 3999, days: 365 },
];
