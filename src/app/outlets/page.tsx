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
  Building2, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Landmark
} from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import { useBranch } from "@/lib/BranchContext";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function OutletsLedgerPage() {

  const user = useAppSelector((state) => state.auth.user);
  const { data: outletsData, isLoading, refetch } = useGetOutletsQuery();
  const { activeBranch, setActiveBranch } = useBranch();

  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1221] p-6 lg:p-7 rounded-2xl text-white shadow-sm border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <Store className="h-3.5 w-3.5" />
                Location Ledger Active
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Total Registered: <strong className="text-white">{outlets.length} Outlets</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
              Outlet & Location Ledger
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl font-medium">
              Manage your physical restaurant branches, address master records, and active location telemetries.
            </p>
          </div>

          <div className="flex items-center gap-3">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
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
                    <th scope="col" className="py-3.5 px-5">Ledger ID</th>
                    <th scope="col" className="py-3.5 px-5">Outlet / Branch</th>
                    <th scope="col" className="py-3.5 px-5">Location Address</th>
                    <th scope="col" className="py-3.5 px-5">City & Region</th>
                    <th scope="col" className="py-3.5 px-5">Status</th>
                    <th scope="col" className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {filteredOutlets.map((outlet: any, idx: number) => {
                    const isActive = activeBranch?.id === outlet.id;
                    const ledgerId = `#OUT-${String(idx + 1).padStart(3, "0")}`;

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
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className="truncate max-w-[220px]">{outlet.address}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Landmark className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span>{outlet.city}, {outlet.state || outlet.country || "India"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Operational
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D3232A]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Current Active
                            </span>
                          ) : (
                            <button
                              onClick={() => setActiveBranch(outlet)}
                              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 hover:bg-[#D3232A] hover:text-white px-3 py-1.5 text-[11px] font-bold text-gray-700 transition-all cursor-pointer shadow-2xs"
                            >
                              Set as Active
                            </button>
                          )}
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
    </DashboardLayout>
  </AuthGuard>
  );
}
