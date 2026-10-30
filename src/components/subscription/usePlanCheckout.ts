"use client";

import { useState } from "react";
import { effectivePlan, upgradeCredit, type Aggregator, type PlanCode } from "@/lib/pricing";
import type { PlanChoice } from "./SubscriptionMonthSelector";

interface CheckoutSubscription {
  status?: string;
  planCode?: string;
  aggregators?: string[];
  currentPeriodEnd?: string;
}

const sameApps = (a: string[], b: string[]) => [...a].sort().join(",") === [...b].sort().join(",");

function startingChoice(lastPlan: PlanCode | null, currentApps: string[]): PlanChoice {
  const planCode = lastPlan ?? "ALAYN_PRO";
  if (planCode === "ALAYN_BASIC") return { planCode, aggregators: [] };
  return { planCode, aggregators: currentApps.length ? (currentApps as Aggregator[]) : ["SWIGGY"] };
}

/**
 * The plan being bought for an outlet, starting from the plan it had. Renewing the same plan adds
 * months after the current end; changing plan (or delivery apps) while active starts now, with the
 * days left credited. Starts over when `outletId` changes.
 */
export function usePlanCheckout(subscription: CheckoutSubscription | null | undefined, outletId?: string, preferPlan?: PlanCode) {
  const isActive =
    subscription?.status === "ACTIVE" &&
    (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > new Date());
  const lastPlan: PlanCode | null = subscription?.planCode ? effectivePlan(subscription.planCode) : null;
  const currentApps = subscription?.aggregators ?? [];

  const first = () => startingChoice(preferPlan ?? lastPlan, currentApps);
  const [state, setState] = useState(() => ({ outletId, plan: first() }));
  if (state.outletId !== outletId) setState({ outletId, plan: first() });
  const plan = state.outletId === outletId ? state.plan : first();
  const setPlan = (next: PlanChoice) => setState({ outletId, plan: next });

  const currentPlan = isActive ? lastPlan : null;
  const changing = !!currentPlan && (plan.planCode !== currentPlan || !sameApps(plan.aggregators, currentApps));
  const creditRupees = changing ? upgradeCredit(subscription?.planCode, currentApps.length, subscription?.currentPeriodEnd) : 0;

  return { plan, setPlan, currentPlan, changing, creditRupees };
}
