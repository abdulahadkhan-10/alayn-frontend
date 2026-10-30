"use client";

import { useBranch, isBranchSubscribed, type Branch } from "@/lib/BranchContext";
import { effectivePlan } from "@/lib/pricing";

/** Whether a paid outlet is on Alayn Pro (old single-plan and free-coupon outlets count as Pro) */
export const isProBranch = (branch: Branch | null | undefined) =>
  isBranchSubscribed(branch) && effectivePlan(branch?.subscription?.planCode) === "ALAYN_PRO";

/**
 * Whether the current outlet has Alayn Pro: shift scheduling, attendance, leave and full Ask Alayn AI.
 * In the all-outlets view, any Pro outlet is enough (the server checks the same way). The demo shows everything.
 */
export function useIsPro(): boolean {
  const { activeBranch, activeBranches, isDemo } = useBranch();
  if (isDemo) return true;
  if (activeBranch?.id === "all") return activeBranches.some(isProBranch);
  return isProBranch(activeBranch);
}

/** Pages that are part of Alayn Pro: shifts, attendance and leave. The staff directory is on every plan. */
export function isProOnlyRoute(pathname: string | null | undefined, role?: string): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/attendance-terminal")) return true;
  if (/^\/workforce\/(scheduler|attendance|leaves)/.test(pathname)) return true;
  // Staff and kitchen see their own shift calendar at /workforce; owners and managers see the directory
  const managesStaff = role === "BUSINESS_OWNER" || role === "MANAGER" || role === "SUPER_ADMIN";
  return pathname === "/workforce" && !managesStaff;
}
