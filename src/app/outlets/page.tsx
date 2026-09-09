"use client";

import React, { useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Link from "next/link";
import { 
  Store, 
  Plus, 
  Search, 
  MapPin, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Landmark,
  CreditCard,
  Sparkles,
  Calendar,
  AlertTriangle,
  Receipt,
  Trash2
} from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import { useGetOutletsQuery, useDeleteOutletMutation } from "@/redux/slices/outletApiSlice";
import { useBranch } from "@/lib/BranchContext";
import SubscriptionRenewModal from "@/components/subscription/SubscriptionRenewModal";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function OutletsLedgerPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: outletsData, isLoading, refetch } = useGetOutletsQuery();
  const { activeBranch, setActiveBranch, refreshBranches } = useBranch();
  const [deleteOutlet, { isLoading: isDeletingOutlet }] = useDeleteOutletMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOutletForRenew, setSelectedOutletForRenew] = useState<any | null>(null);

  const userRole = user?.role || "BUSINESS_OWNER";
  const isAuthorized = userRole === "BUSINESS_OWNER" || userRole === "SUPER_ADMIN";

  const outlets = (outletsData as any)?.data || (Array.isArray(outletsData) ? outletsData : []);

  const filteredOutlets = (outlets as any[]).filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(query) ||
      item.city?.toLowerCase().includes(query) ||
      item.address?.toLowerCase().includes(query) ||
      item.state?.toLowerCase().includes(query)
    );
  });

  // Access Restricted Guard for Managers / Staff / Kitchen
  if (!isAuthorized) {
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
                The Outlet Ledger view is reserved exclusively for <strong>Business Owners</strong> and <strong>Super Admins</strong>.
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

  const calculateDaysRemaining = (endStr?: string) => {
    if (!endStr) return 0;
    const end = new Date(endStr).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
          {/* Top Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1221] p-6 lg:p-7 rounded-3xl text-white shadow-sm border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <Store className="h-3.5 w-3.5" />
                  Branch Ledger Active
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Total Registered: <strong className="text-white">{outlets.length} Outlets</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
                Outlet & Subscription Ledger
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl font-medium">
                Manage your physical restaurant branches, Cashfree monthly subscriptions, and live terminal statuses.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <Link
                href="/settings/billing"
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors border border-slate-700 cursor-pointer shadow-xs"
              >
                <Receipt className="h-3.5 w-3.5 text-red-400" />
                Billing & Receipts
              </Link>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-2.5 text-xs font-semibold text-white transition-colors border border-slate-700 cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
              <Link
                href="/outlets/create"
                className="flex items-center gap-2 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] px-4 py-2.5 text-xs font-bold text-white transition-all shadow-md cursor-pointer hover:-translate-y-[1px]"
              >
                <Plus className="h-4 w-4" />
                Register New Outlet
              </Link>
            </div>
          </div>

          {/* Pending Activation Banner */}
          {(() => {
            const pendingList = (outlets as any[]).filter((item) => {
              const sub = item.subscription;
              if (!sub || sub.status !== "ACTIVE") return true;
              if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) <= new Date()) return true;
              return false;
            });

            if (pendingList.length === 0) return null;

            return (
              <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-amber-950">
                      {pendingList.length === 1 
                        ? `1 outlet requires subscription payment (${pendingList[0].name})` 
                        : `${pendingList.length} outlets require subscription payment`}
                    </h2>
                    <p className="text-xs text-amber-800 font-medium mt-0.5">
                      Operational features (POS counters, Live KDS, Inventory telemetry, and Menu items) remain locked until subscription payment is completed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOutletForRenew(pendingList[0])}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white px-4 py-2.5 text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer hover:-translate-y-[0.5px]"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay ₹2,358.82 & Unlock Branch
                </button>
              </div>
            );
          })()}

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by outlet name, city..."
                className="block w-full rounded-xl border-0 py-2 pl-10 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-xs bg-gray-50/50 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Showing {filteredOutlets.length} of {outlets.length} Outlets</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
            {isLoading ? (
              <SkeletonTheme baseColor="#F1F5F9" highlightColor="#F8FAFC">
                <div className="p-6 space-y-4">
                  <Skeleton height={24} width={200} borderRadius={6} />
                  <Skeleton count={4} height={56} borderRadius={12} />
                </div>
              </SkeletonTheme>
            ) : filteredOutlets.length === 0 ? (
              <div className="p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 mx-auto mb-3">
                  <Store className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No Outlets Found</h3>
                <p className="text-xs text-gray-500 mb-6 font-medium">
                  {searchQuery ? "No outlet matches your search query." : "You haven't registered any restaurant outlets yet."}
                </p>
                <Link
                  href="/outlets/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#b01e23] transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Register First Outlet
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th scope="col" className="py-3.5 px-5">Branch ID</th>
                      <th scope="col" className="py-3.5 px-5">Outlet / Branch</th>
                      <th scope="col" className="py-3.5 px-5">Location</th>
                      <th scope="col" className="py-3.5 px-5">Subscription Status</th>
                      <th scope="col" className="py-3.5 px-5">Validity</th>
                      <th scope="col" className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {filteredOutlets.map((outlet: any, idx: number) => {
                      const isActive = activeBranch?.id === outlet.id;
                      const ledgerId = `#OUT-${String(idx + 1).padStart(3, "0")}`;
                      const sub = outlet.subscription;
                      const isSubActive = sub?.status === "ACTIVE";
                      const isExpired = sub?.status === "EXPIRED" || (sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date());
                      const daysLeft = calculateDaysRemaining(sub?.currentPeriodEnd);

                      return (
                        <tr key={outlet.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-4 px-5 font-mono text-[11px] font-bold text-gray-400">
                            {ledgerId}
                          </td>
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#D3232A] font-bold shrink-0 shadow-xs">
                                <Store className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-xs sm:text-sm">{outlet.name}</p>
                                <span className="text-[10px] text-gray-400 font-medium">₹1,999/mo Pro Tier</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                <span className="truncate max-w-[200px]">{outlet.address}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                                <Landmark className="h-3 w-3 shrink-0" />
                                <span>{outlet.city}, {outlet.state || "India"}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            {isSubActive && !isExpired ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active · {daysLeft}d left
                              </span>
                            ) : isExpired ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700 border border-red-200">
                                <AlertTriangle className="h-3 w-3" />
                                Expired
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-200">
                                <Sparkles className="h-3 w-3" />
                                Pending Activation
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-5">
                            {sub?.currentPeriodEnd ? (
                              <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                <span>
                                  {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric"
                                  })}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">Not activated</span>
                            )}
                          </td>
                          <td className="py-4 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedOutletForRenew(outlet)}
                                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                                  !isSubActive || isExpired
                                    ? "bg-[#D3232A] text-white hover:bg-[#b01e23]"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                }`}
                              >
                                <CreditCard className="h-3.5 w-3.5" />
                                {!isSubActive ? "Pay Subscription" : isExpired ? "Renew Subscription" : "Extend Plan"}
                              </button>

                              {!isSubActive && !isExpired && (
                                <button
                                  type="button"
                                  title="Delete unpaid draft branch"
                                  disabled={isDeletingOutlet}
                                  onClick={async () => {
                                    if (confirm(`Are you sure you want to delete the unpaid draft branch "${outlet.name}"?`)) {
                                      try {
                                        await deleteOutlet(outlet.id).unwrap();
                                        await refreshBranches();
                                        refetch();
                                      } catch (err: any) {
                                        alert(err?.data?.message || err?.message || "Failed to delete outlet");
                                      }
                                    }
                                  }}
                                  className="inline-flex items-center justify-center h-7 w-7 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-[#D3232A] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 px-2">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Active Branch
                                </span>
                              ) : isSubActive && !isExpired ? (
                                <button
                                  onClick={() => setActiveBranch(outlet)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-gray-100 hover:bg-[#D3232A] hover:text-white px-3 py-1.5 text-[11px] font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
                                >
                                  Switch To
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
            refetch();
            refreshBranches();
          }}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
