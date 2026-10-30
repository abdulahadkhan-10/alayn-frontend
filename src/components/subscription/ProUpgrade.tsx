"use client";

import React, { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import { formatRupees, PLANS } from "@/lib/pricing";
import SubscriptionRenewModal from "./SubscriptionRenewModal";

/**
 * "Upgrade to Pro" button. Owners get checkout with Pro picked for the current outlet; everyone else
 * is told to ask the owner, since only owners can pay.
 */
export function UpgradeToProButton({ className = "" }: { className?: string }) {
  const { activeBranch, branches, refreshBranches } = useBranch();
  const role = useAppSelector((state) => state.auth.user?.role);
  const [open, setOpen] = useState(false);
  const canPay = role === "BUSINESS_OWNER" || role === "SUPER_ADMIN";
  const outlet = activeBranch?.id === "all" ? branches.find((b) => b.id !== "all") ?? null : activeBranch;

  if (!canPay) {
    return <p className="text-xs font-medium text-zinc-500">Ask your restaurant owner to upgrade this outlet to Alayn Pro.</p>;
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-xl bg-[#D3232A] px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#b01e23] ${className}`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Upgrade to Pro
      </button>
      <SubscriptionRenewModal
        isOpen={open}
        onClose={() => setOpen(false)}
        outlet={outlet}
        preferPlan="ALAYN_PRO"
        onSuccess={() => void refreshBranches()}
      />
    </>
  );
}

/** Shown in place of a page that is part of Alayn Pro */
export function ProLockedPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto mt-10 max-w-lg rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A]">
        <Lock className="h-5 w-5" />
      </div>
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-[#D3232A]">Alayn Pro</p>
      <h1 className="mt-1 text-xl font-extrabold text-zinc-900">{title}</h1>
      <p className="mt-2 text-sm text-zinc-600">{description}</p>
      <p className="mt-3 text-xs text-zinc-500">
        Pro is {formatRupees(PLANS.ALAYN_PRO.monthly)} a month or {formatRupees(PLANS.ALAYN_PRO.yearly)} a year + GST, with
        full Ask Alayn AI and Swiggy or Zomato (coming soon) included.
      </p>
      <div className="mt-5 flex justify-center">
        <UpgradeToProButton />
      </div>
    </div>
  );
}
