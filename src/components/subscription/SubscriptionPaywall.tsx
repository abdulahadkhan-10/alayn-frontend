"use client";

import React, { useState } from "react";
import { 
  Store, 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  AlertTriangle,
  Building2,
  ChevronRight
} from "lucide-react";
import { useBranch, Branch } from "@/lib/BranchContext";
import { 
  useInitiateOutletSubscriptionMutation, 
  useVerifyOutletPaymentMutation 
} from "@/redux/slices/subscriptionApiSlice";
import { openCashfreeCheckout } from "@/lib/cashfree";
import Link from "next/link";
import SubscriptionMonthSelector, { calculateSubscriptionPricing } from "./SubscriptionMonthSelector";

interface SubscriptionPaywallProps {
  targetBranch?: Branch | null;
}

export default function SubscriptionPaywall({ targetBranch }: SubscriptionPaywallProps) {
  const { branches, activeBranch, refreshBranches, setActiveBranch } = useBranch();
  const [initiateSubscription, { isLoading: isInitiating }] = useInitiateOutletSubscriptionMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyOutletPaymentMutation();

  const [months, setMonths] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Determine which outlet to pay for
  // If targetBranch is provided, use that; otherwise activeBranch; otherwise first branch in list
  const branchToPay = targetBranch || (activeBranch?.id !== "all" ? activeBranch : null) || branches.find(b => b.id !== "all") || null;

  const hasOutlets = branches.filter(b => b.id !== "all").length > 0;
  const pricing = calculateSubscriptionPricing(months);

  const handlePayNow = async () => {
    if (!branchToPay) return;
    setErrorMessage("");
    setIsProcessing(true);

    try {
      const res = await initiateSubscription({
        outletId: branchToPay.id,
        planCode: "MONTHLY_STANDARD",
        months,
      }).unwrap();

      const { paymentSessionId, orderId } = res;

      if (!paymentSessionId) {
        throw new Error("Could not initialize Cashfree payment session.");
      }

      await openCashfreeCheckout({
        paymentSessionId,
        mode: process.env.NEXT_PUBLIC_CASHFREE_MODE === "production" ? "production" : "sandbox",
        onSuccess: async () => {
          try {
            await verifyPayment({ orderId }).unwrap();
            await refreshBranches();
            setActiveBranch(branchToPay);
          } catch (err) {
            console.error("Verification error:", err);
            await refreshBranches();
            setActiveBranch(branchToPay);
          } finally {
            setIsProcessing(false);
          }
        },
        onFailure: (err) => {
          console.warn("Payment dismissed or failed:", err);
          setErrorMessage(err?.message || "Payment was cancelled or could not be completed.");
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      setErrorMessage(
        err?.data?.message || err?.message || "Failed to initiate payment. Please try again."
      );
      setIsProcessing(false);
    }
  };

  // State A: User has NO outlets registered at all
  if (!hasOutlets) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A] mb-6 shadow-xs">
            <Store className="h-8 w-8" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-[#D3232A] mb-3">
            <Lock className="h-3.5 w-3.5" />
            No Outlets Registered
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif mb-3">
            Register Your Restaurant Outlet
          </h1>
          <p className="text-sm text-zinc-500 max-w-md font-medium leading-relaxed mb-8">
            To start using Alayn POS, kitchen displays, inventory telemetry, and live analytics, register your physical restaurant branch and activate your subscription.
          </p>
          <Link
            href="/outlets/create"
            className="inline-flex items-center gap-2 rounded-2xl bg-[#D3232A] px-7 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all hover:-translate-y-[1px]"
          >
            Register Outlet & Subscribe
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // State B: User has registered outlet(s), but the active/selected one requires payment
  const isExpired = branchToPay?.subscription?.status === "EXPIRED";

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-br from-[#0B1221] via-[#111A2E] to-[#1E293B] p-8 sm:p-10 text-white relative">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#D3232A]/20 px-2.5 py-0.5 text-[11px] font-bold text-red-400 border border-[#D3232A]/30">
              <Lock className="h-3.5 w-3.5" />
              Subscription Required · Features Locked
            </span>
            {branchToPay && (
              <span className="text-xs text-slate-400 font-medium">
                Outlet: <strong className="text-white">{branchToPay.name}</strong>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
            {isExpired ? "Renew Your Branch Subscription" : "Activate Branch Subscription"}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
            This outlet requires an active monthly subscription before POS billing counters, live kitchen displays, and inventory telemetry can be unlocked.
          </p>
        </div>

        <div className="p-8 sm:p-10 space-y-6">
          {errorMessage && (
            <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-[#D3232A] border border-red-100">
              {errorMessage}
            </div>
          )}

          {/* Targeted Branch Details */}
          {branchToPay && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#D3232A] shrink-0 shadow-2xs">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">{branchToPay.name}</h2>
                  <p className="text-xs text-zinc-500">{branchToPay.address}, {branchToPay.city || "India"}</p>
                </div>
              </div>
              <span className={`self-start sm:self-auto rounded-full px-3 py-1 text-[11px] font-bold border ${
                isExpired
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}>
                {isExpired ? "Subscription Expired" : "Pending Activation"}
              </span>
            </div>
          )}

          {/* What unlocks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Features unlocked with monthly subscription:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium text-zinc-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Unlimited POS Terminals & Table QR</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Live Kitchen Display System (KDS)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Multi-batch Inventory & Expiry Tracking</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>AI Menu Recipe & Wastage Telemetry</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Staff Geofenced Attendance & Rostering</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Sales Velocity & P&L Analytics</span>
              </div>
            </div>
          </div>

          {/* Duration & Pricing Breakdown */}
          <SubscriptionMonthSelector
            months={months}
            onChange={setMonths}
            currentPeriodEnd={branchToPay?.subscription?.currentPeriodEnd}
            disabled={isProcessing || isInitiating || isVerifying}
          />

          {/* Action Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handlePayNow}
              disabled={isProcessing || isInitiating || isVerifying || !branchToPay}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed hover:-translate-y-[1px] cursor-pointer"
            >
              {isProcessing || isInitiating || isVerifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connecting to Cashfree Payment Gateway...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay ₹{pricing.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} via Cashfree & Unlock Now
                  <ArrowRight className="h-5 w-5 ml-1" />
                </>
              )}
            </button>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link
                href="/outlets"
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors inline-flex items-center gap-1"
              >
                Manage all outlets in Location Manager
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  256-bit Secure PG
                </span>
                <span>•</span>
                <span>UPI / Cards / Netbanking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
