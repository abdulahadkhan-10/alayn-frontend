"use client";

import React, { useEffect, useState } from "react";
import { useModalTransition } from "@/components/ui/TModal";
import { X, Check, Loader2, AlertCircle } from "lucide-react";
import {
  useInitiateOutletSubscriptionMutation,
  useVerifyOutletPaymentMutation,
  useApplyCouponMutation,
} from "@/redux/slices/subscriptionApiSlice";
import { openCashfreeCheckout } from "@/lib/cashfree";
import { apiErrorMessage } from "@/lib/apiError";
import SubscriptionMonthSelector, {
  calculateSubscriptionPricing,
  calculateProjectedEndDate,
} from "./SubscriptionMonthSelector";
import PlanPicker from "./PlanPicker";
import { usePlanCheckout } from "./usePlanCheckout";

interface ModalOutlet {
  id: string;
  name: string;
  address?: string;
  city?: string;
  subscription?: {
    status?: string;
    planCode?: string;
    aggregators?: string[];
    currentPeriodEnd?: string;
    monthlyFeePaise?: number;
  } | null;
}

interface SubscriptionRenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlet: ModalOutlet | null;
  onSuccess?: () => void;
  /** Start on this plan instead of the outlet’s current one (e.g. Pro from an upgrade prompt) */
  preferPlan?: "ALAYN_BASIC" | "ALAYN_PRO";
}

export default function SubscriptionRenewModal({
  isOpen,
  onClose,
  outlet,
  onSuccess,
  preferPlan,
}: SubscriptionRenewModalProps) {
  const [initiateSubscription, { isLoading: isInitiating }] = useInitiateOutletSubscriptionMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyOutletPaymentMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  // Preserve the last non-null outlet while the 150ms close transition finishes
  const [cachedOutlet, setCachedOutlet] = useState<ModalOutlet | null>(outlet);
  if (outlet && outlet !== cachedOutlet) {
    setCachedOutlet(outlet);
  }
  const displayOutlet = outlet ?? cachedOutlet;

  const [months, setMonths] = useState<number>(1);
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
  const [paymentStep, setPaymentStep] = useState<"review" | "processing" | "success">("review");

  // Reset form state cleanly whenever the modal opens or switches to a different outlet
  const sessionKey = isOpen ? (outlet?.id ?? "__open__") : null;
  const [prevSessionKey, setPrevSessionKey] = useState<string | null>(sessionKey);
  if (sessionKey !== prevSessionKey) {
    setPrevSessionKey(sessionKey);
    if (sessionKey !== null) {
      setMonths(1);
      setPaymentStep("review");
      setErrorMessage("");
      setShowCouponInput(false);
      setCouponInput("");
      setCouponError("");
      setAppliedCoupon(null);
    }
  }

  const { mounted, stateClass } = useModalTransition(isOpen);
  const { plan, setPlan, currentPlan, changing, creditRupees } = usePlanCheckout(
    displayOutlet?.subscription,
    displayOutlet?.id,
    preferPlan
  );

  const isBusy = paymentStep === "processing" || isInitiating || isVerifying;

  // Escape to close (unless mid-payment) + lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isBusy, onClose]);

  if (!mounted || !displayOutlet) return null;

  const pricing = calculateSubscriptionPricing(months, appliedCoupon, plan, creditRupees);
  const projectedEnd = calculateProjectedEndDate(months, displayOutlet.subscription?.currentPeriodEnd, changing);
  const now = new Date();
  const existingEnd =
    displayOutlet.subscription?.currentPeriodEnd && !changing
      ? new Date(displayOutlet.subscription.currentPeriodEnd)
      : null;
  const effectiveStartDate = existingEnd && existingEnd > now ? existingEnd : now;
  const daysDiff = Math.max(
    1,
    Math.round((projectedEnd.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const formattedEndDate = projectedEnd.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handlePayNow = async () => {
    setErrorMessage("");
    setPaymentStep("processing");

    try {
      const res = await initiateSubscription({
        outletId: displayOutlet.id,
        planCode: plan.planCode,
        aggregators: plan.aggregators,
        months,
        couponCode: appliedCoupon?.code,
      }).unwrap();

      const { paymentSessionId, orderId } = res;

      // A coupon or credit covering the whole amount is activated by the server with no gateway payment
      if (!paymentSessionId && !res.paidWithoutGateway) {
        throw new Error("Could not initialize Cashfree payment session.");
      }

      if (res.paidWithoutGateway) {
        setPaymentStep("success");
        onSuccess?.();
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
            setPaymentStep("success");
            onSuccess?.();
          }
        },
        onFailure: (err: { message?: string } | null) => {
          console.warn("Cashfree payment dismissed or failed:", err);
          setErrorMessage(err?.message || "Payment was cancelled or could not be completed.");
          setPaymentStep("review");
        },
      });
    } catch (err: unknown) {
      console.error("Subscription initiation error:", err);
      const msg =
        err instanceof Error
          ? err.message
          : apiErrorMessage(err, "Failed to initiate payment. Please try again.");
      setErrorMessage(msg);
      setPaymentStep("review");
    }
  };

  const handleApplyCoupon = async () => {
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError("");

    try {
      const res = await applyCoupon({
        couponCode: cleanCode,
        outletId: displayOutlet.id,
      }).unwrap();

      if ((res.discountValue ?? 0) >= 100 || (res.businessSubscription && !res.applied)) {
        setPaymentStep("success");
        onSuccess?.();
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

  const isSubActive =
    displayOutlet.subscription?.status === "ACTIVE" &&
    (!displayOutlet.subscription.currentPeriodEnd ||
      new Date(displayOutlet.subscription.currentPeriodEnd) > now);

  const expiryDate = displayOutlet.subscription?.currentPeriodEnd
    ? new Date(displayOutlet.subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const isZeroDue = pricing.grandTotalPaise === 0;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
    >
      {/* Backdrop */}
      <div
        className={`t-modal-backdrop ${stateClass} fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]`}
        onClick={isBusy ? undefined : onClose}
      />

      {/* Modal Panel */}
      <div
        className={`t-modal ${stateClass} relative z-10 flex w-full max-w-[560px] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-15px_rgba(15,23,42,0.22)] ring-1 ring-slate-900/8`}
      >
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id="subscription-modal-title" className="text-base font-semibold tracking-tight text-slate-900">
              {isSubActive ? "Renew subscription" : "Activate subscription"}
            </h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
              <span className="font-medium text-slate-700 truncate">{displayOutlet.name}</span>
              {(displayOutlet.city || displayOutlet.address) && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="truncate">{displayOutlet.city || displayOutlet.address}</span>
                </>
              )}
              {expiryDate && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{isSubActive ? `Ends ${expiryDate}` : `Expired ${expiryDate}`}</span>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Close"
            className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {paymentStep === "success" ? (
          <div className="px-6 py-8 text-center space-y-3">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <Check className="h-5 w-5 stroke-[2.5]" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Subscription active</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              <strong className="font-medium text-slate-900">{displayOutlet.name}</strong> is active for {daysDiff} days,
              valid until <strong className="font-medium text-slate-900">{formattedEndDate}</strong>.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 active:scale-[0.98] transition-[transform,background-color] duration-150 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 space-y-4">
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
                currentAggregators={displayOutlet.subscription?.aggregators}
                disabled={isBusy || isApplyingCoupon}
              />

              <SubscriptionMonthSelector
                months={months}
                plan={plan}
                creditRupees={creditRupees}
                startsNow={changing}
                onChange={setMonths}
                currentPeriodEnd={displayOutlet.subscription?.currentPeriodEnd}
                disabled={isBusy || isApplyingCoupon}
                coupon={appliedCoupon}
                hideTotalRow
                promoSlot={promoControl}
              />
            </div>

            {/* Pinned Footer */}
            <div className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between gap-4">
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
                disabled={isBusy}
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
          </>
        )}
      </div>
    </div>
  );
}
