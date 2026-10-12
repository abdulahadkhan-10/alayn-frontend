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
  Gift,
  Printer,
  Monitor,
  Layers
} from "lucide-react";
import { useBranch } from "@/lib/BranchContext";
import { useCreateOutletMutation } from "@/redux/slices/outletApiSlice";
import { 
  useInitiateOutletSubscriptionMutation, 
  useVerifyOutletPaymentMutation,
  useApplyCouponMutation,
  useLazyValidateCouponQuery
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

  React.useEffect(() => {
    refreshBranches();
  }, []);

  const [createOutlet, { isLoading: isCreating }] = useCreateOutletMutation();
  const [initiateSubscription, { isLoading: isInitiating }] = useInitiateOutletSubscriptionMutation();
  const [verifyPayment, { isLoading: isVerifying }] = useVerifyOutletPaymentMutation();
  const [applyCoupon, { isLoading: isApplyingCoupon }] = useApplyCouponMutation();
  const [triggerValidateCoupon] = useLazyValidateCouponQuery();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [createdOutlet, setCreatedOutlet] = useState<any>(null);
  const [months, setMonths] = useState<number>(1);
  const [couponInput, setCouponInput] = useState<string>("");
  const [couponError, setCouponError] = useState<string>("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountType: string;
    discountValue: number;
    validUntil?: string | null;
    message?: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    kitchenMode: "HYBRID" as "KOT" | "KDS" | "HYBRID",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const pricing = calculateSubscriptionPricing(months, 1999, 18, appliedCoupon);
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

  const handleValidateCoupon = async () => {
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError("");
    setIsValidatingCoupon(true);

    try {
      const res = await triggerValidateCoupon(cleanCode).unwrap();
      if (res && res.valid) {
        setAppliedCoupon({
          code: res.code,
          discountType: res.discountType || "PERCENTAGE",
          discountValue: Number(res.discountValue || res.discountPercent || 0),
          validUntil: res.validUntil,
          message: res.message,
        });
      } else {
        setCouponError(res?.message || "Invalid or expired coupon code.");
      }
    } catch (err: any) {
      const msg =
        err?.data?.error?.message ||
        err?.data?.message ||
        (typeof err?.data?.error === "string" ? err?.data?.error : null) ||
        err?.message ||
        "Invalid coupon code. Please check and try again.";
      setCouponError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  // Step 1: Submit Details & Register Outlet
  const handleRegisterOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    try {
      const couponToSend = appliedCoupon?.code || (couponInput.trim().toUpperCase() || undefined);

      const outletResult = await createOutlet({
        ...formData,
        couponCode: couponToSend,
      }).unwrap();
      await refreshBranches();
      setCreatedOutlet(outletResult);

      // Only launch directly if the backend granted active subscription (e.g. 100% free VIP coupon accepted)
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

  // Step 2: Redeem Promo Coupon
  const handleApplyCoupon = async () => {
    if (!createdOutlet?.id) return;
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError("");

    try {
      const res = await applyCoupon({
        couponCode: cleanCode,
        outletId: createdOutlet.id,
      }).unwrap();

      if ((res.discountValue ?? 0) >= 100 || (res.businessSubscription && !res.applied)) {
        await refreshBranches();
        const activeSub = {
          id: res.businessSubscription?.id || "promo",
          status: "ACTIVE",
          planCode: `COUPON_${cleanCode}`,
          planName: `${cleanCode} VIP Access`,
          currentPeriodEnd: res.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        };
        setActiveBranch({
          ...createdOutlet,
          subscription: activeSub,
        });
        setCreatedOutlet((prev: any) => ({
          ...prev,
          subscription: activeSub,
        }));
        setCurrentStep(3); // Advance to Confirmation
      } else {
        setAppliedCoupon({
          code: cleanCode,
          discountType: res.discountType || "PERCENTAGE",
          discountValue: res.discountValue || 0,
          message: res.message,
        });
      }
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
      // 1. Initiate subscription checkout session with Cashfree PG and dynamic coupon
      const res = await initiateSubscription({
        outletId: createdOutlet.id,
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

              {/* Kitchen Operating Mode Selection (KOT vs KDS vs HYBRID) */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Kitchen Operating Setup
                  </label>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Choose how your kitchen team and cooks receive and process orders
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* KOT Mode Card */}
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, kitchenMode: "KOT" }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formData.kitchenMode === "KOT"
                        ? "border-[#1B2A4A] bg-[#1B2A4A]/5 shadow-sm ring-1 ring-[#1B2A4A]"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${formData.kitchenMode === "KOT" ? "bg-[#1B2A4A] text-white" : "bg-gray-100 text-gray-700"}`}>
                          <Printer className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Physical Slips
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-[#1B2A4A]">KOT Thermal Print</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                        Thermal printer prints 80mm/58mm tickets for cooks. No screen operation required.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400">Low digital barrier</span>
                      {formData.kitchenMode === "KOT" && <CheckCircle2 className="w-4 h-4 text-[#1B2A4A]" />}
                    </div>
                  </div>

                  {/* KDS Mode Card */}
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, kitchenMode: "KDS" }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formData.kitchenMode === "KDS"
                        ? "border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-600"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${formData.kitchenMode === "KDS" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-700"}`}>
                          <Monitor className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Paperless
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-900">KDS Display</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                        Interactive kitchen screen (Prep &rarr; Ready &rarr; Served) with 3-minute cancel retention.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400">Digital workflow</span>
                      {formData.kitchenMode === "KDS" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                  </div>

                  {/* HYBRID Mode Card */}
                  <div
                    onClick={() => setFormData((prev) => ({ ...prev, kitchenMode: "HYBRID" }))}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      formData.kitchenMode === "HYBRID"
                        ? "border-[#D3232A] bg-red-50/40 shadow-sm ring-1 ring-[#D3232A]"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${formData.kitchenMode === "HYBRID" ? "bg-[#D3232A] text-white" : "bg-gray-100 text-gray-700"}`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Recommended
                        </span>
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-900">Hybrid (Both)</h4>
                      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">
                        Prints physical thermal tickets for cooks AND displays live on KDS dispatch board.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400">KOT + KDS Dual</span>
                      {formData.kitchenMode === "HYBRID" && <CheckCircle2 className="w-4 h-4 text-[#D3232A]" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Activation / Promo Coupon Code Section */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4.5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-[#D3232A]">
                    <Tag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-900">Have an Activation or Coupon Code?</p>
                    <p className="text-[11px] text-zinc-500">If you were provided an activation voucher or discount code, enter it below.</p>
                  </div>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3.5 border border-emerald-200 animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-2 font-mono uppercase">
                          <span>{appliedCoupon.code}</span>
                          <span className="text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                            {appliedCoupon.discountValue >= 100
                              ? "100% Free VIP License"
                              : appliedCoupon.discountType === "PERCENTAGE"
                              ? `${appliedCoupon.discountValue}% OFF`
                              : `₹${appliedCoupon.discountValue} OFF`}
                          </span>
                        </p>
                        <p className="text-[11px] text-emerald-700 leading-tight mt-0.5">
                          {appliedCoupon.discountValue >= 100
                            ? appliedCoupon.validUntil
                              ? `Zero subscription fees through ${new Date(appliedCoupon.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`
                              : `Zero subscription fees (Active 100% Free VIP access).`
                            : `Discount will be applied at payment checkout.`}
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
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase());
                          setCouponError("");
                        }}
                        placeholder="Enter coupon code"
                        className="block w-full rounded-xl border-0 py-2.5 pl-3.5 pr-4 text-xs font-mono font-bold tracking-wider text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-[#D3232A] bg-white uppercase transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      disabled={isValidatingCoupon || !couponInput.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1221] hover:bg-black text-white px-4 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      )}
                      Apply Code
                    </button>
                  </div>
                )}

                {couponError && (
                  <p className="text-xs font-semibold text-[#D3232A]">{couponError}</p>
                )}
              </div>

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
                  ) : appliedCoupon && appliedCoupon.discountValue >= 100 ? (
                    <>
                      <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
                      Launch Branch Free with {appliedCoupon.code}
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
                coupon={appliedCoupon}
              />

              {/* Dynamic Coupon Box */}
              {appliedCoupon ? (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 flex items-center justify-between animate-in fade-in-50 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Tag className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-emerald-900 tracking-wider uppercase">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                          {appliedCoupon.discountType === "PERCENTAGE"
                            ? `${appliedCoupon.discountValue}% OFF`
                            : `₹${appliedCoupon.discountValue} OFF`}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Discount applied to your subscription fee
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline px-2.5 py-1.5 cursor-pointer"
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
                {createdOutlet?.subscription?.planCode?.startsWith("COUPON_") ? (
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {createdOutlet?.subscription?.planName || "VIP Access"}
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
