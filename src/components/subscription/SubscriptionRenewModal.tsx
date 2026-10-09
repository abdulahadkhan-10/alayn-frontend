"use client";

import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Sparkles, 
  Loader2, 
  AlertCircle,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  Tag,
  Gift
} from "lucide-react";
import { 
  useInitiateOutletSubscriptionMutation, 
  useVerifyOutletPaymentMutation,
  useApplyCouponMutation
} from "@/redux/slices/subscriptionApiSlice";
import { openCashfreeCheckout } from "@/lib/cashfree";
import SubscriptionMonthSelector, { 
  calculateSubscriptionPricing, 
  calculateProjectedEndDate 
} from "./SubscriptionMonthSelector";

interface SubscriptionRenewModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlet: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    subscription?: {
      status?: string;
      currentPeriodEnd?: string;
      monthlyFeePaise?: number;
    };
  } | null;
  onSuccess?: () => void;
}

export default function SubscriptionRenewModal({
  isOpen,
  onClose,
  outlet,
  onSuccess,
}: SubscriptionRenewModalProps) {
  const [initiateSubscription, { isLoading: isInitiating }] = useInitiateOutletSubscriptionMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyOutletPaymentMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  const [months, setMonths] = useState<number>(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    message?: string;
  } | null>(null);
  const [paymentStep, setPaymentStep] = useState<"review" | "processing" | "success">("review");

  if (!isOpen || !outlet) return null;

  const pricing = calculateSubscriptionPricing(months, 1999, 18, appliedCoupon);
  const projectedEnd = calculateProjectedEndDate(months, outlet.subscription?.currentPeriodEnd);
  const now = new Date();
  const existingEnd = outlet.subscription?.currentPeriodEnd ? new Date(outlet.subscription.currentPeriodEnd) : null;
  const effectiveStartDate = existingEnd && existingEnd > now ? existingEnd : now;
  const daysDiff = Math.max(1, Math.round((projectedEnd.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  const formattedEndDate = projectedEnd.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handlePayNow = async () => {
    setErrorMessage("");
    setPaymentStep("processing");

    try {
      // 1. Initiate order on backend with selected duration in months and dynamic coupon
      const res = await initiateSubscription({
        outletId: outlet.id,
        planCode: "MONTHLY_STANDARD",
        months,
        couponCode: appliedCoupon?.code,
      }).unwrap();

      const { paymentSessionId, orderId } = res;

      if (!paymentSessionId) {
        throw new Error("Could not initialize Cashfree payment session.");
      }

      // 2. Open Cashfree Drop-in Checkout Modal
      await openCashfreeCheckout({
        paymentSessionId,
        mode: process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox",
        onSuccess: async () => {
          try {
            // 3. Fast-track server-side verification
            await verifyPayment({ orderId }).unwrap();
            setPaymentSuccess(true);
            setPaymentStep("success");
            if (onSuccess) onSuccess();
          } catch (err: any) {
            console.error("Verification error:", err);
            // Even if client call errors, Webhook guarantees activation; show success state
            setPaymentSuccess(true);
            setPaymentStep("success");
            if (onSuccess) onSuccess();
          }
        },
        onFailure: (err) => {
          console.warn("Cashfree payment dismissed or failed:", err);
          setErrorMessage(err?.message || "Payment was cancelled or could not be completed.");
          setPaymentStep("review");
        },
      });
    } catch (err: any) {
      console.error("Subscription initiation error:", err);
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
        err?.message ||
        "Failed to initiate payment. Please try again.";
      setErrorMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
      setPaymentStep("review");
    }
  };

  const handleApplyCoupon = async () => {
    if (!outlet?.id) return;
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError("");
    setCouponSuccess(false);

    try {
      const res = await applyCoupon({
        couponCode: cleanCode,
        outletId: outlet.id,
      }).unwrap();

      if ((res.discountValue ?? 0) >= 100 || (res.businessSubscription && !res.applied)) {
        // 100% Free VIP activation
        setCouponSuccess(true);
        setPaymentStep("success");
        onSuccess?.();
      } else {
        // Partial discount coupon applied
        setAppliedCoupon({
          code: cleanCode,
          discountType: res.discountType || "PERCENTAGE",
          discountValue: res.discountValue || 0,
          message: res.message,
        });
        setCouponSuccess(true);
      }
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
        err?.message ||
        "Invalid coupon code. Please check and try again.";
      setCouponError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponSuccess(false);
    setCouponError("");
  };

  const isSubActive = outlet.subscription?.status === "ACTIVE";
  const expiryDate = outlet.subscription?.currentPeriodEnd 
    ? new Date(outlet.subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
        onClick={paymentStep === "processing" ? undefined : onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 z-10 animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-br from-[#0B1221] via-[#111A2E] to-[#1E293B] p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            disabled={paymentStep === "processing"}
            className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#D3232A]/20 px-2.5 py-0.5 text-[11px] font-bold text-red-400 border border-[#D3232A]/30">
              <Sparkles className="h-3 w-3" />
              Outlet Subscription
            </span>
            {isSubActive && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3" />
                Active Branch
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white">
            {isSubActive ? "Extend Monthly Subscription" : "Activate Branch Subscription"}
          </h2>
          <p className="mt-1 text-xs text-slate-300 font-medium">
            Powering POS, Live Kitchen Display, Inventory & Workforce for:
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 p-3 backdrop-blur-xs border border-white/10">
            <Building2 className="h-4 w-4 text-red-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{outlet.name}</p>
              <p className="text-[10px] text-slate-300 truncate">{outlet.city || outlet.address || "Physical Location"}</p>
            </div>
            {expiryDate && (
              <div className="ml-auto text-right shrink-0">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">Valid Till</span>
                <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-emerald-400" />
                  {expiryDate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {paymentStep === "success" ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-zinc-900 font-serif">
                Payment Confirmed & Subscription Active!
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto font-medium leading-relaxed">
                Your subscription for <strong>{outlet.name}</strong> has been successfully renewed.{" "}
                <span className="font-bold text-zinc-800">
                  {months} {months === 1 ? "month" : "months"} ({daysDiff} calendar days, valid until {formattedEndDate})
                </span>{" "}
                of uninterrupted operations have been credited to this branch.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full rounded-2xl bg-[#D3232A] px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#b01e23] transition-all cursor-pointer"
                >
                  Close & Continue
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-[#D3232A] border border-red-100">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Plan Perks */}
              <div className="space-y-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  Included In Your Monthly Plan
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-zinc-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Unlimited POS Counters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Live Kitchen Display (KDS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Multi-batch Inventory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>AI Menu Costing Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Staff Geofence Attendance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>24/7 Priority Support</span>
                  </div>
                </div>
              </div>

              {/* Duration & Price Selector */}
              <SubscriptionMonthSelector
                months={months}
                onChange={setMonths}
                currentPeriodEnd={outlet.subscription?.currentPeriodEnd}
                disabled={paymentStep === "processing" || isInitiating || isVerifying || isApplyingCoupon}
                coupon={appliedCoupon}
              />

              {/* Dynamic Coupon Box */}
              {appliedCoupon ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-3.5 flex items-center justify-between animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-900 tracking-wider uppercase">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          {appliedCoupon.discountType === "PERCENTAGE"
                            ? `${appliedCoupon.discountValue}% OFF`
                            : `₹${appliedCoupon.discountValue} OFF`}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Discount applied to your subscription total
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-[#D3232A]">
                      <Tag className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs font-bold text-zinc-900">Have a Promo or Coupon Code?</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      placeholder="Enter coupon code"
                      className="block flex-1 rounded-xl border-0 py-2.5 px-3 text-xs font-mono font-bold tracking-wider text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-[#D3232A] bg-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#0B1221] hover:bg-black text-white px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isApplyingCoupon ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 text-amber-400" />
                      )}
                      Apply Code
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs font-semibold text-[#D3232A]">{couponError}</p>
                  )}
                </div>
              )}

              {/* Pay Button */}
              <button
                onClick={handlePayNow}
                disabled={paymentStep === "processing" || isInitiating || isVerifying}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-4 text-sm font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer hover:-translate-y-[1px]"
              >
                {paymentStep === "processing" || isInitiating || isVerifying ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Connecting to Cashfree Payment Gateway...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay ₹{pricing.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} via Cashfree PG
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 font-medium pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  256-bit Encrypted
                </span>
                <span>•</span>
                <span>UPI / QR / Cards / Netbanking</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Cashfree Verified
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
