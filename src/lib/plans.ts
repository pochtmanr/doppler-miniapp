function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`${name} environment variable is required`);
  return val;
}

/** Server-side plan config — reads non-public env vars. Use in API routes only. */
export function getPlans() {
  return {
    monthly: { id: 'monthly', cents: Number(requireEnv('PLAN_MONTHLY_CENTS')), days: 30 },
    '6month': { id: '6month', cents: Number(requireEnv('PLAN_6MONTH_CENTS')), days: 180 },
    yearly: { id: 'yearly', cents: Number(requireEnv('PLAN_YEARLY_CENTS')), days: 365 },
  } as const;
}

export type PlanId = 'monthly' | '6month' | 'yearly';

/** Client-side display config — uses NEXT_PUBLIC_ env vars. Errors if missing. */
export const DISPLAY_PLANS: { id: PlanId; cents: number; days: number }[] = (() => {
  const monthly = process.env.NEXT_PUBLIC_PLAN_MONTHLY_CENTS;
  const sixMonth = process.env.NEXT_PUBLIC_PLAN_6MONTH_CENTS;
  const yearly = process.env.NEXT_PUBLIC_PLAN_YEARLY_CENTS;

  if (!monthly || !sixMonth || !yearly) {
    console.error('Plan price env vars missing — prices will show as $0');
  }

  return [
    { id: 'monthly', cents: Number(monthly || '0'), days: 30 },
    { id: '6month', cents: Number(sixMonth || '0'), days: 180 },
    { id: 'yearly', cents: Number(yearly || '0'), days: 365 },
  ];
})();
