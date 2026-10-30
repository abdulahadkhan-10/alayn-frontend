/**
 * Alayn's plans, per outlet, before 18% GST. Keep in step with src/modules/subscription/pricing.ts in the
 * backend, which decides what is charged.
 *
 * - Basic: ₹599 a month or ₹5,999 a year. Everything except shift scheduling and full Ask Alayn AI.
 * - Pro: ₹1,999 a month or ₹19,999 a year. Everything, plus one of Swiggy or Zomato.
 * - Both Swiggy and Zomato on Pro: the second one is ₹499 a month or ₹4,999 a year more.
 */
export type PlanCode = "ALAYN_BASIC" | "ALAYN_PRO";
export type Aggregator = "SWIGGY" | "ZOMATO";

export const PLANS: Record<PlanCode, { code: PlanCode; name: string; monthly: number; yearly: number }> = {
  ALAYN_BASIC: { code: "ALAYN_BASIC", name: "Alayn Basic", monthly: 599, yearly: 5999 },
  ALAYN_PRO: { code: "ALAYN_PRO", name: "Alayn Pro", monthly: 1999, yearly: 19999 },
};

/** The second delivery app on Pro */
export const SECOND_AGGREGATOR = { monthly: 499, yearly: 4999 };

export const AGGREGATOR_NAMES: Record<Aggregator, string> = { SWIGGY: "Swiggy", ZOMATO: "Zomato" };

/** Ask Alayn AI questions a day on Basic (the backend's AI_DAILY_QUESTIONS_BASIC) */
export const BASIC_AI_QUESTIONS = 3;

export const GST_PERCENT = 18;
export const MAX_MONTHS = 36;

export const withGst = (amount: number) => Math.round(amount * (100 + GST_PERCENT)) / 100;

const priceFor = (price: { monthly: number; yearly: number }, months: number) =>
  Math.floor(months / 12) * price.yearly + (months % 12) * price.monthly;

/** Price before GST for some months: each full year at the yearly price, the months left over at the monthly price */
export function basePriceFor(planCode: PlanCode, months: number, aggregatorCount = 0): number {
  const m = Math.max(1, Math.min(MAX_MONTHS, Math.floor(months) || 1));
  const addOn = planCode === "ALAYN_PRO" && aggregatorCount >= 2 ? priceFor(SECOND_AGGREGATOR, m) : 0;
  return priceFor(PLANS[planCode], m) + addOn;
}

/** What paying yearly saves against paying month by month for 12 months */
export const yearlySaving = (planCode: PlanCode) => PLANS[planCode].monthly * 12 - PLANS[planCode].yearly;

/**
 * Which plan a subscription counts as. Outlets on the old single plan (MONTHLY_STANDARD) and
 * free-coupon outlets (COUPON_*) have every feature, so they count as Pro.
 */
export function effectivePlan(planCode: string | null | undefined): PlanCode {
  if (planCode === "ALAYN_BASIC" || planCode === "ALAYN_PRO") return planCode;
  if (planCode === "MONTHLY_STANDARD" || planCode?.startsWith("COUPON_")) return "ALAYN_PRO";
  return "ALAYN_BASIC";
}

/**
 * Credit for the days left on the current plan when an outlet changes plan, valued at that plan's
 * yearly price (the backend works it out the same way; it decides).
 */
export function upgradeCredit(planCode: string | null | undefined, aggregatorCount: number, periodEnd?: string | null): number {
  if (!periodEnd || planCode?.startsWith("COUPON_")) return 0;
  const daysLeft = (new Date(periodEnd).getTime() - Date.now()) / 86_400_000;
  if (daysLeft <= 0) return 0;
  const perDay = basePriceFor(effectivePlan(planCode), 12, aggregatorCount) / 365;
  return Math.round(perDay * daysLeft * 100) / 100;
}

export const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
