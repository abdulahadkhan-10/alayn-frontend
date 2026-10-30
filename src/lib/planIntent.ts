import { PLANS, type PlanCode } from "@/lib/pricing";

/**
 * The plan and billing period a visitor picked on the pricing page. It travels as ?plan=&cycle= on the
 * signup link and is kept in this browser until the first outlet is paid for, so checkout starts on it.
 */
export type Cycle = "monthly" | "yearly";
export interface PlanIntent {
  plan: PlanCode;
  cycle: Cycle;
}

const KEY = "alayn_plan_intent";

export const signupHref = (plan: PlanCode, cycle: Cycle) => `/signup?plan=${plan}&cycle=${cycle}`;

export function parsePlanIntent(plan: string | null | undefined, cycle: string | null | undefined): PlanIntent | null {
  if (plan !== "ALAYN_BASIC" && plan !== "ALAYN_PRO") return null;
  return { plan, cycle: cycle === "monthly" ? "monthly" : "yearly" };
}

export function savePlanIntent(intent: PlanIntent) {
  try {
    localStorage.setItem(KEY, JSON.stringify(intent));
  } catch {
    /* storage blocked: checkout falls back to its own default */
  }
}

export function readPlanIntent(): PlanIntent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PlanIntent>;
    return parsePlanIntent(parsed.plan, parsed.cycle);
  } catch {
    return null;
  }
}

export function clearPlanIntent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}

export const planIntentLabel = ({ plan, cycle }: PlanIntent) =>
  `${PLANS[plan].name} · ₹${(cycle === "monthly" ? PLANS[plan].monthly : PLANS[plan].yearly).toLocaleString("en-IN")}/${cycle === "monthly" ? "mo" : "yr"} + GST`;
