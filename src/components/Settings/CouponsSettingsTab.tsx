"use client";

import React, { useState, useMemo } from "react";
import {
  Tag,
  Percent,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  Calendar,
  Sparkles,
  Store,
  Layers,
  Clock,
  ChevronDown,
  X,
} from "lucide-react";
import { TModal } from "@/components/ui/TModal";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useBranch } from "@/lib/BranchContext";
import {
  useGetRestaurantCouponsQuery,
  useCreateRestaurantCouponMutation,
  useToggleRestaurantCouponStatusMutation,
  useDeleteRestaurantCouponMutation,
  RestaurantCoupon,
  CreateRestaurantCouponPayload,
} from "@/redux/slices/restaurantCouponApiSlice";

export default function CouponsSettingsTab() {
  const { activeBranch, branches } = useBranch();
  const currentOutletId = activeBranch?.id === "all" ? undefined : activeBranch?.id;

  const { data: rawCoupons, isLoading, refetch } = useGetRestaurantCouponsQuery(
    currentOutletId ? { outletId: currentOutletId } : undefined
  );

  const couponList: RestaurantCoupon[] = useMemo(() => {
    if (Array.isArray(rawCoupons)) return rawCoupons;
    if (rawCoupons && Array.isArray((rawCoupons as any).data)) return (rawCoupons as any).data;
    return [];
  }, [rawCoupons]);

  const [createCoupon, { isLoading: isCreating }] = useCreateRestaurantCouponMutation();
  const [toggleStatus, { isLoading: isToggling }] = useToggleRestaurantCouponStatusMutation();
  const [deleteCoupon, { isLoading: isDeleting }] = useDeleteRestaurantCouponMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form State
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [minOrderAmount, setMinOrderAmount] = useState<string>("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<string>("");
  const [usageLimit, setUsageLimit] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [targetOutletId, setTargetOutletId] = useState<string>("ALL");

  const specificOutlets = useMemo(() => branches.filter((b) => b.id !== "all"), [branches]);

  const filteredCoupons = useMemo(() => {
    return couponList.filter((c) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [couponList, searchQuery]);

  const stats = useMemo(() => {
    const total = couponList.length;
    const active = couponList.filter((c) => c.isActive).length;
    const totalUses = couponList.reduce((sum, c) => sum + (c.usageCount || 0), 0);
    return { total, active, totalUses };
  }, [couponList]);

  const handleCopy = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleResetForm = () => {
    setCode("");
    setDescription("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxDiscountAmount("");
    setUsageLimit("");
    setExpiresAt("");
    setTargetOutletId(currentOutletId || "ALL");
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setFeedback({ type: "error", message: "Please provide a valid coupon code." });
      return;
    }

    const numValue = parseFloat(discountValue);
    if (isNaN(numValue) || numValue <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid discount value greater than 0." });
      return;
    }

    if (discountType === "PERCENTAGE" && numValue > 100) {
      setFeedback({ type: "error", message: "Percentage discount cannot exceed 100%." });
      return;
    }

    const payload: CreateRestaurantCouponPayload = {
      code: cleanCode,
      description: description.trim() || undefined,
      discountType,
      discountValue: numValue,
      minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : undefined,
      maxDiscountAmount:
        discountType === "PERCENTAGE" && maxDiscountAmount ? parseFloat(maxDiscountAmount) : undefined,
      usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
      outletId: targetOutletId === "ALL" ? null : targetOutletId,
    };

    try {
      await createCoupon(payload).unwrap();
      setFeedback({ type: "success", message: `Coupon "${cleanCode}" created successfully!` });
      setIsCreateModalOpen(false);
      handleResetForm();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.data?.message || "Failed to create coupon. Please check inputs.",
      });
    }
  };

  const handleToggleActive = async (coupon: RestaurantCoupon) => {
    try {
      await toggleStatus({ id: coupon.id, isActive: !coupon.isActive }).unwrap();
      setFeedback({
        type: "success",
        message: `Coupon "${coupon.code}" is now ${!coupon.isActive ? "Active" : "Inactive"}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.data?.message || "Failed to update coupon status.",
      });
    }
  };

  const handleDelete = async (coupon: RestaurantCoupon) => {
    if (!confirm(`Are you sure you want to remove coupon "${coupon.code}"?`)) return;
    try {
      const res = await deleteCoupon(coupon.id).unwrap();
      setFeedback({ type: "success", message: res.message || `Coupon "${coupon.code}" deleted.` });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.data?.message || "Failed to delete coupon.",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Coupons</p>
            <h3 className="text-2xl font-black text-[#1B2A4A] mt-1">{stats.total}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Offers</p>
            <h3 className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Redemptions</p>
            <h3 className="text-2xl font-black text-[#D3232A] mt-1">{stats.totalUses}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#D3232A]">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Create */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search coupon code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            handleResetForm();
            setIsCreateModalOpen(true);
          }}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#D3232A] hover:bg-[#b01c22] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {/* Coupons Table / Cards */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs font-semibold">
            <SkeletonTheme baseColor="#E2E8F0" highlightColor="#F8FAFC">
              <div className="space-y-3">
                {[1, 2, 3, 4].map((idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 bg-gray-50/40 gap-4">
                    <div className="space-y-1.5 text-left">
                      <Skeleton width={120} height={18} borderRadius={6} />
                      <Skeleton width={180} height={12} borderRadius={4} />
                    </div>
                    <Skeleton width={90} height={22} borderRadius={6} />
                    <Skeleton width={110} height={16} borderRadius={4} />
                    <Skeleton width={80} height={24} borderRadius={8} />
                  </div>
                ))}
              </div>
            </SkeletonTheme>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
              <Tag className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-gray-800">No Coupon Codes Found</h4>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Create your first promotional discount coupon code so cashiers and managers can offer it to customers at bill settlement.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 px-4 py-2 bg-[#1B2A4A] text-white rounded-xl text-xs font-bold hover:bg-[#152038] transition cursor-pointer"
            >
              + Create Coupon Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/75 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Discount Value</th>
                  <th className="py-3 px-4">Eligibility & Limits</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Branch Scope</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-[#1B2A4A] bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200/80">
                          {coupon.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(coupon.code)}
                          title="Copy Code"
                          className="text-gray-400 hover:text-gray-700 transition cursor-pointer p-1"
                        >
                          {copiedCode === coupon.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {coupon.description && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{coupon.description}</p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {coupon.discountType === "PERCENTAGE" ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Percent className="w-3 h-3" />
                          {coupon.discountValue}% OFF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-blue-700 font-extrabold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          ₹{coupon.discountValue.toFixed(0)} FLAT OFF
                        </span>
                      )}
                      {coupon.discountType === "PERCENTAGE" && coupon.maxDiscountAmount && (
                        <div className="text-[10px] font-medium text-gray-500 mt-0.5">
                          Up to ₹{coupon.maxDiscountAmount.toFixed(0)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {coupon.minOrderAmount ? (
                        <span className="text-[11px] text-gray-700 font-medium">
                          Min bill: <strong>₹{coupon.minOrderAmount.toFixed(0)}</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400 italic">No minimum</span>
                      )}
                      {coupon.usageLimit && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Max limit: {coupon.usageLimit} total
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {coupon.expiresAt ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">No Expiry</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {coupon.outletName ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          <Store className="w-3 h-3" />
                          {coupon.outletName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                          <Layers className="w-3 h-3 text-gray-400" />
                          All Branches
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-xs text-gray-700">
                      {coupon.usageCount}{" "}
                      {coupon.usageLimit ? (
                        <span className="text-gray-400 font-normal">/ {coupon.usageLimit}</span>
                      ) : (
                        <span className="text-gray-400 font-normal text-[11px]">uses</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                          coupon.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            coupon.isActive ? "bg-emerald-600 animate-pulse" : "bg-gray-400"
                          }`}
                        />
                        {coupon.isActive ? "Active" : "Paused"}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(coupon)}
                        className="text-gray-400 hover:text-rose-600 transition p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Delete coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      <TModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        className="p-4 bg-gray-900/60 backdrop-blur-sm"
      >
        <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-rose-50 text-[#D3232A]">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1B2A4A]">
                  Create New Customer Coupon
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  Configure promotional discount codes for bill settlement.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Coupon Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. WELCOME10, FLAT50, CORP20"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 tracking-wider placeholder:text-gray-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] uppercase"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Cashier will enter this exact code at bill settlement.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Discount Type <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setDiscountType("PERCENTAGE")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    discountType === "PERCENTAGE"
                      ? "bg-white text-[#1B2A4A] shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType("FIXED_AMOUNT")}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    discountType === "FIXED_AMOUNT"
                      ? "bg-white text-[#1B2A4A] shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Flat Amount (₹)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Discount Value <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder={discountType === "PERCENTAGE" ? "10 (for 10%)" : "100 (for ₹100)"}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">
                  {discountType === "PERCENTAGE" ? "%" : "₹"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Minimum Bill Amount (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>
            </div>

            {discountType === "PERCENTAGE" ? (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Maximum Discount Cap (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    placeholder="e.g. 200 (max cap)"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A]"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Total Usage Limit (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100 uses"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Branch Applicability
              </label>
              <select
                value={targetOutletId}
                onChange={(e) => setTargetOutletId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A]"
              >
                <option value="ALL">All Branches (Brand-wide)</option>
                {specificOutlets.map((b) => (
                  <option key={b.id} value={b.id}>
                    Particular Branch: {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Special festive offer for dining customers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A]"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-5 py-2 bg-[#D3232A] hover:bg-[#b01c22] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {isCreating ? "Creating..." : "Save & Activate Coupon"}
            </button>
          </div>
        </form>
      </div>
    </TModal>
    </div>
  );
}
