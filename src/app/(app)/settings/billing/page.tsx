"use client";

import React, { useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Receipt, 
  Store, 
  CreditCard, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Download,
  AlertCircle,
  Clock,
  Building2,
  RefreshCw
} from "lucide-react";
import { useGetBillingHistoryQuery } from "@/redux/slices/subscriptionApiSlice";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import SubscriptionRenewModal from "@/components/subscription/SubscriptionRenewModal";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function BillingPage() {
  const { data: billingData, isLoading: isBillingLoading, refetch: refetchBilling } = useGetBillingHistoryQuery();
  const { data: outletsData, isLoading: isOutletsLoading, refetch: refetchOutlets } = useGetOutletsQuery();

  const [selectedOutletForRenew, setSelectedOutletForRenew] = useState<any | null>(null);

  const billingHistory = Array.isArray(billingData) ? billingData : [];
  const outlets = Array.isArray(outletsData) ? outletsData : (outletsData as any)?.data || [];

  const isPromoPlan = (planCode?: string) => planCode?.startsWith("COUPON_");
  const totalMonthlySpend = outlets.filter((o: any) => o.subscription?.status === "ACTIVE" && !isPromoPlan(o.subscription?.planCode)).length * 2358.82;
  const promoOutletsCount = outlets.filter((o: any) => o.subscription?.status === "ACTIVE" && isPromoPlan(o.subscription?.planCode)).length;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1221] p-6 lg:p-7 rounded-3xl text-white shadow-sm border border-slate-800">
            <div>
              <Link 
                href="/outlets" 
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Outlets Ledger
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                Billing & Branch Subscriptions
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl font-medium">
                Review your active monthly outlet subscriptions, payment receipts, and GST breakdown.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  refetchBilling();
                  refetchOutlets();
                }}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors border border-slate-700 cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Billing
              </button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Active Licenses</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Store className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-zinc-900 font-serif">
                {outlets.filter((o: any) => o.subscription?.status === "ACTIVE").length} <span className="text-sm font-sans font-medium text-zinc-500">/ {outlets.length} Branches</span>
              </p>
              <p className="mt-1 text-[11px] text-zinc-400 font-medium">Powering POS, Kitchen, & Telemetry</p>
            </div>

            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Monthly Commitment</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-[#D3232A]">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-extrabold text-zinc-900 font-mono">
                ₹{totalMonthlySpend.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400 font-medium">₹1,999 + 18% GST per branch / mo</p>
            </div>

            <div className="rounded-3xl bg-white p-6 border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Payment Gateway</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base font-extrabold text-zinc-900">
                Cashfree PG (v2023-08-01)
              </p>
              <p className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Webhook Auto-Reconciliation Active
              </p>
            </div>
          </div>

          {/* Branch Subscriptions List */}
          <div className="rounded-3xl bg-white p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 font-serif">Branch Subscriptions</h2>
                <p className="text-xs text-zinc-500 font-medium">Monthly licenses per physical restaurant location</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isOutletsLoading ? (
                <Skeleton count={2} height={100} borderRadius={16} />
              ) : outlets.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-xs text-zinc-400">
                  No outlets registered yet.
                </div>
              ) : (
                outlets.map((outlet: any) => {
                  const sub = outlet.subscription;
                  const isActive = sub?.status === "ACTIVE";
                  const expiry = sub?.currentPeriodEnd 
                    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })
                    : null;

                  return (
                    <div 
                      key={outlet.id} 
                      className="flex flex-col justify-between rounded-2xl bg-slate-50 p-5 border border-slate-200/70"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#D3232A] shadow-2xs border border-gray-100">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-zinc-900">{outlet.name}</h3>
                              <p className="text-[10px] text-zinc-500">{outlet.city || "Branch Location"}</p>
                            </div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isActive 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {isActive ? "Active Subscription" : "Pending Payment"}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-zinc-600 bg-white rounded-xl p-3 border border-gray-100">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Tier</span>
                            <span className="font-bold text-zinc-800">
                              {sub?.planCode?.startsWith("COUPON_") ? (sub?.planName || "VIP Access") : "Smart Branch Pro"}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block font-semibold">Valid Till</span>
                            <span className="font-bold text-zinc-800 flex items-center gap-1 justify-end">
                              <Calendar className="h-3 w-3 text-emerald-500" />
                              {expiry || "Pending"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200/60">
                        <span className="text-xs font-bold font-mono text-zinc-900">
                          {sub?.planCode?.startsWith("COUPON_") ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-sans">
                              {sub?.planName || "Free VIP License"}
                            </span>
                          ) : (
                            "₹2,358.82 / mo"
                          )}
                        </span>
                        <button
                          onClick={() => setSelectedOutletForRenew(outlet)}
                          className="rounded-xl bg-[#D3232A] hover:bg-[#b01e23] px-3.5 py-1.5 text-[11px] font-bold text-white transition-all shadow-xs cursor-pointer"
                        >
                          {isActive ? "Extend / Renew" : "Pay via Cashfree"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Payment History & Receipts */}
          <div className="rounded-3xl bg-white border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-zinc-900 font-serif">Payment Receipts & Invoices</h2>
                <p className="text-xs text-zinc-500 font-medium">Complete audit ledger of Cashfree PG transactions</p>
              </div>
            </div>

            {isBillingLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton count={3} height={40} borderRadius={8} />
              </div>
            ) : billingHistory.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-medium">No payment receipts recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="py-3.5 px-6">Branch Outlet</th>
                      <th className="py-3.5 px-6">Method</th>
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Amount (Incl. GST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {billingHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-zinc-900">{item.outletName}</p>
                          <span className="text-[10px] text-zinc-400">{item.outletCity}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            <CreditCard className="h-3 w-3 text-slate-500" />
                            {item.paymentMethod || "UPI"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-zinc-500">
                          {new Date(item.paidAt || item.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-4 px-6">
                          {item.status === "SUCCESS" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Paid
                            </span>
                          ) : item.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                              <Clock className="h-3 w-3" />
                              Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-700">
                              <AlertCircle className="h-3 w-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-zinc-900">
                          ₹{item.amountRupees.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Cashfree Payment & Renewal Modal */}
        <SubscriptionRenewModal
          isOpen={!!selectedOutletForRenew}
          onClose={() => setSelectedOutletForRenew(null)}
          outlet={selectedOutletForRenew}
          onSuccess={() => {
            refetchBilling();
            refetchOutlets();
          }}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
