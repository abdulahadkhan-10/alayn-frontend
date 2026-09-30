"use client";

import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { 
  Store, 
  MapPin, 
  Landmark, 
  Map, 
  Globe, 
  Loader2, 
  ArrowRight, 
  ShieldCheck, 
  ArrowLeft, 
  ShieldAlert,
  CreditCard,
  CheckCircle2,
  Sparkles,
  Lock,
  Building2,
  Calendar,
  AlertTriangle,
  Tag,
  Gift
} from "lucide-react";
import { useBranch } from "@/lib/BranchContext";
import { useCreateOutletMutation } from "@/redux/slices/outletApiSlice";
import { 
  useInitiateOutletSubscriptionMutation, 
  useVerifyOutletPaymentMutation,
  useApplyCouponMutation
} from "@/redux/slices/subscriptionApiSlice";
import { openCashfreeCheckout } from "@/lib/cashfree";
import { useAppSelector } from "@/redux/store/hooks";
import Link from "next/link";
import SubscriptionMonthSelector, { 
  calculateSubscriptionPricing, 
  calculateProjectedEndDate 
} from "@/components/subscription/SubscriptionMonthSelector";

export default function CreateOutletPage() {
  const user = useAppSelector((state) => state.auth.user);
  const isOwner = user?.role === "BUSINESS_OWNER" || user?.role === "SUPER_ADMIN";
  const isSupplier = user?.role === "SUPPLIER";

  React.useEffect(() => {
    if (isSupplier) {
      window.location.href = "/supplier";
    }
  }, [isSupplier]);

  const { refreshBranches, branches, setActiveBranch, hasAnyActiveBranch } = useBranch();
  const existingCouponBranch = branches.find(
    (b: any) => b.id !== "all" && b.subscription?.planCode?.toUpperCase() === "COUPON_FIRST25"
  );
  const hasAlreadyRedeemedCoupon = !!existingCouponBranch;

  React.useEffect(() => {
    refreshBranches();
  }, []);

  const [createOutlet, { isLoading: isCreating }] = useCreateOutletMutation();
  const [initiateSubscription, { isLoading: isInitiating }] = useInitiateOutletSubscriptionMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyOutletPaymentMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [createdOutlet, setCreatedOutlet] = useState<any>(null);
  const [months, setMonths] = useState<number>(1);
  const [couponInput, setCouponInput] = useState<string>(hasAlreadyRedeemedCoupon ? "" : "FIRST25");
  const [couponError, setCouponError] = useState<string>("");

  React.useEffect(() => {
    if (hasAlreadyRedeemedCoupon) {
      setCouponInput("");
      setCouponError("");
    }
  }, [hasAlreadyRedeemedCoupon]);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India"
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const pricing = calculateSubscriptionPricing(months);
  const projectedEnd = calculateProjectedEndDate(months);
  const daysDiff = Math.max(1, Math.round((projectedEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  const formattedEndDate = projectedEnd.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!isOwner) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="max-w-2xl mx-auto py-12 text-center">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A] mb-6 shadow-xs">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif mb-3">
                Access Restricted
              </h1>
              <p className="text-sm text-zinc-500 max-w-md font-medium leading-relaxed mb-8">
                Adding or registering new restaurant outlets is strictly reserved for <strong>Business Owners</strong> and <strong>Super Admins</strong>.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#b01e23] transition-all"
              >
                Return to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Outlet name is required.";
    if (!formData.address.trim()) errs.address = "Address is required.";
    if (!formData.city.trim()) errs.city = "City is required.";
    if (!formData.state.trim()) errs.state = "State is required.";
    if (!formData.country.trim()) errs.country = "Country is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Step 1: Submit Details & Register Outlet
  const handleRegisterOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    try {
      const couponToSend = hasAlreadyRedeemedCoupon
        ? undefined
        : (couponInput.trim().toUpperCase() || undefined);

      const outletResult = await createOutlet({
        ...formData,
        couponCode: couponToSend,
      }).unwrap();
      await refreshBranches();
      setCreatedOutlet(outletResult);

      // Only launch directly if the backend granted active subscription (e.g. FIRST25 coupon accepted)
      if (outletResult?.subscription?.status === "ACTIVE") {
        setActiveBranch(outletResult);
        setCurrentStep(3); // Directly launch the outlet!
      } else {
        setCurrentStep(2); // Advance to Subscription Step
      }
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
        err?.message ||
        "An error occurred while creating the outlet.";
      setSubmitError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Redeem FIRST25 Promo Coupon
  const handleApplyCoupon = async () => {
    if (!createdOutlet?.id) return;
    setCouponError("");

    try {
      const res = await applyCoupon({
        couponCode: couponInput.trim(),
        outletId: createdOutlet.id,
      }).unwrap();

      await refreshBranches();
      setActiveBranch({
        ...createdOutlet,
        subscription: {
          id: res.businessSubscription?.id || "promo",
          status: "ACTIVE",
          planCode: "COUPON_FIRST25",
          planName: "FIRST25 Special Access (Free until Dec 2026)",
          currentPeriodEnd: res.validUntil || "2026-12-31T23:59:59.999Z",
        },
      });
      setCreatedOutlet((prev: any) => ({
        ...prev,
        subscription: {
          id: res.businessSubscription?.id || "promo",
          status: "ACTIVE",
          planCode: "COUPON_FIRST25",
          planName: "FIRST25 Special Access (Free until Dec 2026)",
          currentPeriodEnd: res.validUntil || "2026-12-31T23:59:59.999Z",
        },
      }));
      setCurrentStep(3); // Advance to Confirmation
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
        err?.message ||
        "Invalid coupon code. Please try again.";
      setCouponError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  // Step 2: Pay Monthly Subscription via Cashfree PG
  const handleCashfreePayment = async () => {
    if (!createdOutlet?.id) return;
    setPaymentError("");
    setIsProcessingPayment(true);

    try {
      // 1. Initiate subscription checkout session with Cashfree PG
      const res = await initiateSubscription({
        outletId: createdOutlet.id,
        planCode: "MONTHLY_STANDARD",
        months,
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
            await refreshBranches();
            setActiveBranch(createdOutlet);
            setCurrentStep(3); // Advance to Confirmation
          } catch (err) {
            console.error("Verification error:", err);
            await refreshBranches();
            setActiveBranch(createdOutlet);
            setCurrentStep(3);
          } finally {
            setIsProcessingPayment(false);
          }
        },
        onFailure: (err) => {
          console.warn("Cashfree payment dismissed or failed:", err);
          setPaymentError(err?.message || "Payment was cancelled or could not be completed.");
          setIsProcessingPayment(false);
        },
      });
    } catch (err: any) {
      console.error("Payment initiation error:", err);
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
        err?.message ||
        "Failed to initiate payment. Please try again.";
      setPaymentError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setIsProcessingPayment(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-6 sm:py-10">
        {branches.length > 0 && currentStep === 1 && (
          <Link 
            href={hasAnyActiveBranch ? "/dashboard" : "/outlets"} 
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            {hasAnyActiveBranch ? "Back to Dashboard" : "Back to Location Manager"}
          </Link>
        )}

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-between gap-2 max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 1 
                ? "bg-[#D3232A] text-white ring-4 ring-red-100" 
                : "bg-emerald-500 text-white"
            }`}>
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span className="text-xs font-bold text-zinc-800">Branch Details</span>
          </div>
          <div className={`h-0.5 flex-1 ${currentStep >= 2 ? "bg-emerald-500" : "bg-gray-200"}`} />
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 2 
                ? "bg-[#D3232A] text-white ring-4 ring-red-100" 
                : currentStep === 3 
                ? "bg-emerald-500 text-white" 
                : "bg-gray-100 text-gray-400"
            }`}>
              {currentStep === 3 ? "✓" : "2"}
            </span>
            <span className="text-xs font-bold text-zinc-800">Subscription</span>
          </div>
          <div className={`h-0.5 flex-1 ${currentStep === 3 ? "bg-emerald-500" : "bg-gray-200"}`} />
          <div className="flex items-center gap-2">
            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              currentStep === 3 
                ? "bg-emerald-500 text-white ring-4 ring-emerald-100" 
                : "bg-gray-100 text-gray-400"
            }`}>
              3
            </span>
            <span className="text-xs font-bold text-zinc-800">Launch</span>
          </div>
        </div>

        {/* STEP 1: Branch Details Form */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100/90 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A] shadow-sm">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#D3232A]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Step 1 of 2 · Location Details
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif">
                  Register Your Restaurant Outlet
                </h1>
              </div>
            </div>

            <p className="text-sm text-zinc-500 mb-8 font-medium leading-relaxed">
              Enter the physical address of this branch. Each registered outlet comes with a dedicated monthly subscription covering POS, live KDS, inventory, and staff telemetries.
            </p>

            <form onSubmit={handleRegisterOutlet} className="space-y-6">
              {submitError && (
                <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-[#D3232A] border border-red-100">
                  {submitError}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Outlet / Branch Name
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Store className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange("name")}
                    placeholder="e.g. Alayn Cafe — Bandra West Branch"
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                  />
                </div>
                {errors.name && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="address" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Street Address
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute top-3.5 left-0 flex items-start pl-3.5">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange("address")}
                    placeholder="Shop No. 4, Hill Road, Bandra West"
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200 resize-none"
                  />
                </div>
                {errors.address && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="city" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    City
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Landmark className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={handleChange("city")}
                      placeholder="Mumbai"
                      className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                    />
                  </div>
                  {errors.city && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.city}</p>}
                </div>

                <div>
                  <label htmlFor="state" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    State / Region
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Map className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={handleChange("state")}
                      placeholder="Maharashtra"
                      className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                    />
                  </div>
                  {errors.state && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.state}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="country" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                  Country
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="country"
                    type="text"
                    value={formData.country}
                    onChange={handleChange("country")}
                    placeholder="India"
                    className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                  />
                </div>
                {errors.country && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{errors.country}</p>}
              </div>

              {/* Promo Coupon Code Section */}
              {hasAlreadyRedeemedCoupon ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50/90 p-4.5 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-200/80 text-zinc-700 shadow-2xs">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-800 flex items-center gap-2">
                        <span>Promotional License Active on {existingCouponBranch?.name}</span>
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          1 Branch Used
                        </span>
                      </p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">
                        Each business is limited to 1 free promotional branch. Additional branches like this one are billed at standard monthly subscription rates.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-[#D3232A]/30 bg-gradient-to-r from-red-50/40 via-white to-amber-50/30 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-[#D3232A]">
                        <Gift className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 flex items-center gap-2">
                          <span>Have Early Access Coupon?</span>
                          <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            Free Till Dec 2026
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Enter coupon <strong className="font-mono text-zinc-900">FIRST25</strong> to get 100% free VIP access through December 31, 2026!
                        </p>
                      </div>
                    </div>
                    {couponInput.trim().toUpperCase() === "FIRST25" ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        FIRST25 Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCouponInput("FIRST25");
                          setCouponError("");
                        }}
                        className="text-[11px] font-bold text-[#D3232A] hover:text-[#b01e23] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        Apply FIRST25
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        placeholder="Enter coupon code (e.g. FIRST25)"
                        className="block w-full rounded-xl border-0 py-3 pl-3.5 pr-4 text-xs font-mono font-bold tracking-wider text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-[#D3232A] bg-white uppercase transition-all"
                      />
                    </div>
                  </div>

                  {couponInput.trim().toUpperCase() === "FIRST25" && (
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3 border border-emerald-200 text-xs text-emerald-900 animate-in fade-in-50 duration-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-emerald-900">100% Free VIP License Active</p>
                        <p className="text-[11px] text-emerald-700 leading-tight mt-0.5">
                          Your restaurant branch will be launched with free access through <strong>December 31, 2026</strong>. Zero subscription fees, no credit card required.
                        </p>
                      </div>
                    </div>
                  )}

                  {couponError && (
                    <p className="text-xs font-semibold text-[#D3232A]">{couponError}</p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed hover:-translate-y-[1px] cursor-pointer"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Branch Record...
                    </>
                  ) : !hasAlreadyRedeemedCoupon && couponInput.trim().toUpperCase() === "FIRST25" ? (
                    <>
                      <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                      Launch Branch with FIRST25 (Free until Dec 2026)
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </>
                  ) : (
                    <>
                      Save Details & Proceed to Subscription
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: Subscription Activation via Cashfree */}
        {currentStep === 2 && createdOutlet && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in-50 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#0B1221] via-[#111A2E] to-[#1E293B] p-8 sm:p-10 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#D3232A]/20 px-2.5 py-0.5 text-[11px] font-bold text-red-400 border border-[#D3232A]/30">
                  <Sparkles className="h-3.5 w-3.5" />
                  Step 2 of 2 · {months === 1 ? "Monthly" : `${months} Months`} Subscription
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Branch Registered: <strong>{createdOutlet.name}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
                Activate Outlet Subscription
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
                Activate your {months} {months === 1 ? "month" : "months"} ({daysDiff} calendar days) operational license to start creating menu items, taking orders, and syncing live inventory.
              </p>
            </div>

            <div className="p-8 sm:p-10 space-y-6">
              {paymentError && (
                <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-[#D3232A] border border-red-100">
                  {paymentError}
                </div>
              )}

              {/* Notice that payment is mandatory */}
              <div className="rounded-2xl bg-amber-500/10 p-4 text-xs font-semibold text-amber-800 border border-amber-500/20 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Subscription Required to Unlock Branch</p>
                  <p className="text-amber-700 text-[11px] font-normal mt-0.5">
                    Your outlet details are saved. To activate POS billing terminals, live Kitchen Display (KDS), and inventory telemetry, complete the monthly subscription payment below.
                  </p>
                </div>
              </div>

              {/* Outlet Summary Card */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#D3232A]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">{createdOutlet.name}</p>
                    <p className="text-[11px] text-zinc-500">{createdOutlet.address}, {createdOutlet.city}</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                  Pending Activation
                </span>
              </div>

              {/* Included Features */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Included in Alayn Smart Branch Pro:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-medium text-zinc-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Unlimited POS Billing Terminals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Live Kitchen Display System (KDS)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Real-time Multi-batch Stock Tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>AI Menu Costing & Wastage Telemetry</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Staff Rostering & Geofenced Attendance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>24/7 Priority Support & Backups</span>
                  </div>
                </div>
              </div>

              {/* Duration Selector & Dynamic Pricing */}
              <SubscriptionMonthSelector
                months={months}
                onChange={setMonths}
                disabled={isProcessingPayment || isInitiating || isVerifying || isApplyingCoupon}
              />

              {/* Promo Coupon Redemption Card */}
              {hasAlreadyRedeemedCoupon ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 space-y-1">
                  <p className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-zinc-500" />
                    Promotional Branch Already Redeemed
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Your business has already redeemed the <strong className="text-zinc-700">FIRST25</strong> promotional license for <strong>{existingCouponBranch?.name}</strong>. Each business is limited to 1 free promotional branch. Additional branches like this one require a paid subscription.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#D3232A]/30 bg-gradient-to-r from-red-50/40 via-white to-amber-50/30 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-[#D3232A]">
                        <Gift className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                          <span>Have Early Access Code FIRST25?</span>
                          <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">100% Free</span>
                        </p>
                        <p className="text-[11px] text-zinc-500">Apply coupon <strong className="font-mono text-zinc-900">FIRST25</strong> to get full access through December 31, 2026 for free!</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value.toUpperCase());
                        setCouponError("");
                      }}
                      placeholder="Enter code (e.g. FIRST25)"
                      className="block flex-1 rounded-xl border-0 py-2.5 px-3.5 text-xs font-mono font-bold tracking-wider text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-[#D3232A] bg-white uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1221] hover:bg-black text-white px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isApplyingCoupon ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      )}
                      Apply Code
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs font-semibold text-[#D3232A]">{couponError}</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleCashfreePayment}
                  disabled={isProcessingPayment || isInitiating || isVerifying || isApplyingCoupon}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed hover:-translate-y-[1px] cursor-pointer"
                >
                  {isProcessingPayment || isInitiating || isVerifying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting to Cashfree Payment Gateway...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Pay ₹{pricing.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })} & Activate Branch
                      <ArrowRight className="h-5 w-5 ml-1" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <Link
                    href="/outlets"
                    className="text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition-colors inline-flex items-center gap-1"
                  >
                    View in Location Manager
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400 font-medium pt-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Cashfree PG 256-bit Secure
                </span>
                <span>•</span>
                <span>UPI / QR / Cards / Netbanking</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Instant Activation
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Celebration & Launch */}
        {currentStep === 3 && createdOutlet && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-sm animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                Subscription Active · Ready for Operations
              </span>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif">
                Branch Successfully Launched!
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-500 max-w-md mx-auto font-medium leading-relaxed">
                <strong>{createdOutlet.name}</strong> is now fully operational with{" "}
                {createdOutlet?.subscription?.planCode === "COUPON_FIRST25" ? (
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    FIRST25 VIP Access (100% Free until December 31, 2026)
                  </span>
                ) : (
                  <span className="font-bold text-zinc-800">
                    {months} {months === 1 ? "month" : "months"} ({daysDiff} calendar days, valid until {formattedEndDate})
                  </span>
                )}{" "}
                of active subscription. Your POS counters, KDS terminals, and inventory telemetry are live.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all hover:-translate-y-[1px]"
              >
                Launch Branch Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/outlets"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 px-6 py-3.5 text-sm font-bold text-gray-700 transition-all"
              >
                View Outlets Ledger
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
