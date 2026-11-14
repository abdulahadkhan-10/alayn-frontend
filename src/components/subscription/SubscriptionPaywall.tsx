"use client";

import React, { useState } from "react";
import { Store, Lock, Loader2, ArrowRight, ChevronRight, X, AlertCircle } from "lucide-react";
import { useBranch, Branch } from "@/lib/BranchContext";
import {
  useInitiateOutletSubscriptionMutation,
  useVerifyOutletPaymentMutation,
  useApplyCouponMutation,
} from "@/redux/slices/subscriptionApiSlice";
import { openCashfreeCheckout } from "@/lib/cashfree";
import { apiErrorMessage } from "@/lib/apiError";
import Link from "next/link";
import SubscriptionMonthSelector, { calculateSubscriptionPricing } from "./SubscriptionMonthSelector";
import PlanPicker from "./PlanPicker";
import { usePlanCheckout } from "./usePlanCheckout";

interface SubscriptionPaywallProps {
  targetBranch?: Branch | null;
}

export default function SubscriptionPaywall({ targetBranch }: SubscriptionPaywallProps) {
  const { branches, activeBranch, refreshBranches, setActiveBranch } = useBranch();
  const [initiateSubscription, { isLoading: isInitiating }] = useInitiateOutletSubscriptionMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyOutletPaymentMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  const branchToPay =
    targetBranch ||
    (activeBranch?.id !== "all" ? activeBranch : null) ||
    branches.find((b) => b.id !== "all") ||
    null;

  const [months, setMonths] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    message?: string;
  } | null>(null);

  // Reset transient state when switching branches
  const [prevBranchId, setPrevBranchId] = useState<string | undefined>(branchToPay?.id);
  if (branchToPay?.id !== prevBranchId) {
    setPrevBranchId(branchToPay?.id);
    setMonths(1);
    setErrorMessage("");
    setShowCouponInput(false);
    setCouponInput("");
    setCouponError("");
    setAppliedCoupon(null);
  }

  const hasOutlets = branches.filter((b) => b.id !== "all").length > 0;
  const { plan, setPlan, currentPlan, changing, creditRupees } = usePlanCheckout(
    branchToPay?.subscription,
    branchToPay?.id
  );
  const pricing = calculateSubscriptionPricing(months, appliedCoupon, plan, creditRupees);
  const isBusy = isProcessing || isInitiating || isVerifying;
  const isZeroDue = pricing.grandTotalPaise === 0;

  const handlePayNow = async () => {
    if (!branchToPay) return;
    setErrorMessage("");
    setIsProcessing(true);

    try {
      const res = await initiateSubscription({
        outletId: branchToPay.id,
        planCode: plan.planCode,
        aggregators: plan.aggregators,
        months,
        couponCode: appliedCoupon?.code,
      }).unwrap();

      const { paymentSessionId, orderId } = res;

      if (!paymentSessionId && !res.paidWithoutGateway) {
        throw new Error("Could not initialize Cashfree payment session.");
      }

      if (res.paidWithoutGateway) {
        await refreshBranches();
        setActiveBranch(branchToPay);
        setIsProcessing(false);
        return;
      }

      await openCashfreeCheckout({
        paymentSessionId,
        mode: process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox",
        onSuccess: async () => {
          try {
            await verifyPayment({ orderId }).unwrap();
          } catch (err: unknown) {
            console.error("Verification error:", err);
          } finally {
            await refreshBranches();
            setActiveBranch(branchToPay);
            setIsProcessing(false);
          }
        },
        onFailure: (err: { message?: string } | null) => {
          console.warn("Payment dismissed or failed:", err);
          setErrorMessage(err?.message || "Payment was cancelled or could not be completed.");
          setIsProcessing(false);
        },
      });
    } catch (err: unknown) {
      console.error("Payment initiation error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : apiErrorMessage(err, "Failed to initiate payment. Please try again.");
      setErrorMessage(msg);
      setIsProcessing(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!branchToPay) return;
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError("");

    try {
      const res = await applyCoupon({
        couponCode: cleanCode,
        outletId: branchToPay.id,
      }).unwrap();

      if ((res.discountValue ?? 0) >= 100 || (res.businessSubscription && !res.applied)) {
        await refreshBranches();
        setActiveBranch(branchToPay);
      } else {
        setAppliedCoupon({
          code: cleanCode,
          discountType: res.discountType || "PERCENTAGE",
          discountValue: res.discountValue || 0,
          message: res.message,
        });
        setShowCouponInput(false);
      }
    } catch (err: unknown) {
      setCouponError(apiErrorMessage(err, "Invalid coupon code. Please check and try again."));
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // State A: User has NO outlets registered at all
  if (!hasOutlets) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs flex flex-col items-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 mb-4">
            <Store className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Register your first outlet</h1>
          <p className="mt-1.5 text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
            Add your restaurant branch and choose a plan to unlock POS billing, kitchen display, inventory, and reports.
          </p>
          <Link
            href="/outlets/create"
            className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b81e24] active:scale-[0.98] transition-[transform,background-color] duration-150"
          >
            Register outlet
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // State B: User has registered outlet(s), but the active/selected one requires payment
  const isExpired = branchToPay?.subscription?.status === "EXPIRED";

  const promoControl = appliedCoupon ? (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-mono font-semibold text-slate-900 uppercase">{appliedCoupon.code}</span>
        <span className="text-emerald-700 font-medium">
          {appliedCoupon.discountType === "PERCENTAGE"
            ? `${appliedCoupon.discountValue}% off`
            : `₹${appliedCoupon.discountValue} off`}
        </span>
      </div>
      <button
        type="button"
        onClick={handleRemoveCoupon}
        disabled={isBusy}
        className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        Remove
      </button>
    </div>
  ) : showCouponInput ? (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={couponInput}
          onChange={(e) => {
            setCouponInput(e.target.value.toUpperCase());
            setCouponError("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleApplyCoupon();
            }
          }}
          placeholder="Promo code"
          autoFocus
          className="h-8 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-mono font-medium tracking-wide text-slate-900 uppercase placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 focus:border-slate-900 focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={handleApplyCoupon}
          disabled={isApplyingCoupon || !couponInput.trim()}
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 active:scale-[0.98] transition-[transform,background-color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isApplyingCoupon && <Loader2 className="h-3 w-3 animate-spin" />}
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setShowCouponInput(false);
            setCouponInput("");
            setCouponError("");
          }}
          aria-label="Cancel promo code"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {couponError && <p className="text-xs text-red-600">{couponError}</p>}
    </div>
  ) : (
    <button
      type="button"
      onClick={() => setShowCouponInput(true)}
      className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
    >
      + Add promo code
    </button>
  );

  return (
    <div className="max-w-[600px] mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Clean Header */}
        <div className="border-b border-slate-100 px-6 py-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                {isExpired ? "Renew subscription" : "Activate subscription"}
              </h1>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                  isExpired ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {isExpired ? "Expired" : "Inactive"}
              </span>
            </div>
            {branchToPay && (
              <p className="mt-0.5 text-xs text-slate-500 truncate">
                <span className="font-medium text-slate-700">{branchToPay.name}</span>
                {branchToPay.city ? ` · ${branchToPay.city}` : branchToPay.address ? ` · ${branchToPay.address}` : ""}
              </p>
            )}
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/70 px-3 py-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <PlanPicker
            value={plan}
            onChange={setPlan}
            currentPlan={currentPlan}
            currentAggregators={branchToPay?.subscription?.aggregators}
            disabled={isBusy || isApplyingCoupon}
          />

          <SubscriptionMonthSelector
            months={months}
            plan={plan}
            creditRupees={creditRupees}
            startsNow={changing}
            onChange={setMonths}
            currentPeriodEnd={branchToPay?.subscription?.currentPeriodEnd}
            disabled={isBusy || isApplyingCoupon}
            coupon={appliedCoupon}
            hideTotalRow
            promoSlot={promoControl}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">
                  ₹{pricing.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500">incl. GST</span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {isZeroDue ? "Covered in full · No payment needed" : "UPI, cards & netbanking via Cashfree"}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePayNow}
              disabled={isBusy || !branchToPay}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#D3232A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b81e24] active:scale-[0.98] transition-[transform,background-color] duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isZeroDue ? "Activating…" : "Opening checkout…"}
                </>
              ) : isZeroDue ? (
                "Activate now"
              ) : (
                `Pay ₹${pricing.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              )}
            </button>
          </div>

          <div className="border-t border-slate-200/60 pt-2.5 flex items-center justify-between">
            <Link
              href="/outlets"
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              Manage all outlets
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
