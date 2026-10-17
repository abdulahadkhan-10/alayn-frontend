"use client";

import React, { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/redux/store/hooks";

import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import SalesForecastChart from "@/components/dashboard/SalesForecastChart";
import NeedsAttentionCard from "@/components/dashboard/NeedsAttentionCard";
import TodayPaceCard from "@/components/dashboard/TodayPaceCard";
import RightNowCard, { OpenOrder } from "@/components/dashboard/RightNowCard";
import ShiftCoverageCard from "@/components/dashboard/ShiftCoverageCard";
import WeekStaffingCard from "@/components/dashboard/WeekStaffingCard";
import TopSellersCard from "@/components/dashboard/TopSellersCard";
import SlowMoversCard from "@/components/dashboard/SlowMoversCard";
import { useBranch } from "@/lib/BranchContext";
import { useGetKpisQuery, useGetTopSellingItemsQuery } from "@/redux/slices/dashboardApiSlice";
import { Order, useGetOrdersQuery } from "@/redux/slices/orderApiSlice";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

import { TrendingUp, TrendingDown, Minus, Calendar, ArrowUpRight } from "lucide-react";

interface PageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type RangeType = "TODAY" | "7_DAY" | "CUSTOM" | "THIS_MONTH";

/** "YYYY-MM-DD" for India time, n days ago (toISOString would give the UTC date, a day behind before 5:30 AM) */
const istDate = (daysAgo = 0) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** How the selected date range reads in card subtitles ("No dishes sold this month") */
const RANGE_LABELS: Record<RangeType, string> = {
  TODAY: "today",
  "7_DAY": "in the last 7 days",
  THIS_MONTH: "this month",
  CUSTOM: "in the selected dates",
};

const RANGE_OPTIONS: { value: RangeType; label: string }[] = [
  { value: "TODAY", label: "Today" },
  { value: "7_DAY", label: "7 Days" },
  { value: "THIS_MONTH", label: "This Month" },
  { value: "CUSTOM", label: "Choose Date" },
];

// No change (0%, +0, or no comparison yet) gets a grey badge, not a green "up" one
function isFlatTrend(trend: string) {
  const n = parseFloat(trend.replace(/[^0-9.\-]/g, ""));
  return !Number.isFinite(n) || n === 0;
}

export default function MasterDashboardPage(props?: PageProps) {
  if (props?.params) use(props.params);
  if (props?.searchParams) use(props.searchParams);

  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  useEffect(() => {
    if (user?.role === "STAFF") {
      router.replace("/pos");
    } else if (user?.role === "KITCHEN") {
      router.replace("/kitchen");
    } else if (user?.role === "SUPPLIER") {
      router.replace("/supplier");
    }
  }, [user?.role, router]);

  const { activeBranch, branches, loading, isDemo } = useBranch();
  const outletId = activeBranch?.id || undefined;

  // Owners judge the business by the month; "Today" is one click away
  const [dateRange, setDateRange] = useState<RangeType>("THIS_MONTH");
  const [startDate, setStartDate] = useState<string>(istDate(7));
  const [endDate, setEndDate] = useState<string>(istDate());

  const { data: kpiData, isLoading: isKpiLoading } = useGetKpisQuery({ outletId, range: dateRange, startDate, endDate });
  const { data: topSelling = [] } = useGetTopSellingItemsQuery({ outletId, range: dateRange, startDate, endDate });

  // Only orders still open: the Right now card counts and lists those, and fetching every past order is slow
  const { data: realOrders = [] } = useGetOrdersQuery({ outletId, excludeCompleted: true });

  const isInitialLoading = loading || isKpiLoading;
  const hasNoOutlets = !isInitialLoading && !isDemo && branches.length === 0;

  useEffect(() => {
    if (hasNoOutlets) {
      router.replace("/outlets/create");
    }
  }, [hasNoOutlets, router]);

  // "Open" means still in the kitchen or not yet paid; finished and cancelled orders don't belong here
  const openOrders: OpenOrder[] = useMemo(() => {
    const raw: Order[] = Array.isArray(realOrders) ? realOrders : ((realOrders as { data?: Order[] })?.data ?? []);
    return raw
      .filter((o) => o.status !== "COMPLETED" && o.status !== "CANCELLED")
      .map((o) => ({
        id: o.id,
        ticket: o.orderNo || `#ORD-${String(o.id).slice(-4).toUpperCase()}`,
        source: o.orderSource || "COUNTER",
        tableNo: o.tableNo ?? null,
        status: o.status,
        totalAmount: o.totalAmount || 0,
        createdAt: o.createdAt ?? null,
      }));
  }, [realOrders]);

  const kpis = [
    {
      // Settled orders only, before GST (GST and unpaid bills are shown underneath, not counted)
      label: "Net sales (excl. GST)",
      value: kpiData?.totalRevenue?.value || "₹0",
      prev: kpiData?.totalRevenue?.prev || "₹0",
      // No percentage when there is nothing earlier to compare with (the API sends an empty change)
      trend: kpiData?.totalRevenue?.change ?? "",
      positive: kpiData?.totalRevenue?.isPositive ?? true,
      note: kpiData
        ? `GST collected ${kpiData.taxCollected?.value || "₹0"}` +
          (kpiData.serviceCharge?.value && kpiData.serviceCharge.value !== "₹0" ? ` · Service charge ${kpiData.serviceCharge.value}` : "") +
          (kpiData.openBills && kpiData.openBills.count > 0
            ? ` · ${kpiData.openBills.value} in ${kpiData.openBills.count} open bill${kpiData.openBills.count === 1 ? "" : "s"}`
            : "")
        : undefined,
      route: "/performance",
    },
    {
      label: "Orders",
      value: kpiData?.orders?.value || "0",
      prev: kpiData?.orders?.prev || "0",
      trend: kpiData?.orders?.change ?? "",
      positive: kpiData?.orders?.isPositive ?? true,
      note: "Settled orders",
      route: "/orders/completed",
    },
    {
      label: "Avg order value",
      value: kpiData?.avgOrderValue?.value || "₹0",
      prev: kpiData?.avgOrderValue?.prev || "₹0",
      trend: kpiData?.avgOrderValue?.change ?? "",
      positive: kpiData?.avgOrderValue?.isPositive ?? true,
      note: "Settled orders, excl. GST",
      route: "/orders/completed",
    },
    {
      // Menu items aren't linked to stock, so there's no food cost or margin; waste is what's known
      label: "Stock wasted",
      value: kpiData?.waste?.value || "₹0",
      prev: kpiData?.waste?.prev || "₹0",
      trend: kpiData?.waste?.change ?? "",
      positive: kpiData?.waste?.isPositive ?? true,
      note: "Value of stock logged as waste",
      route: "/inventory/waste",
    },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        {isInitialLoading || hasNoOutlets ? (
          <DashboardSkeleton />
        ) : (
          <div className="py-6 px-4 sm:px-6 max-w-[1500px] mx-auto space-y-6 font-sans bg-[#F8FAFC]">
            {/* Header & date range */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Overview</h1>
                <p className="text-sm text-slate-500">{activeBranch?.name || "All Outlets"} · Sales, orders, staff and stock at a glance</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-100/70 p-1 rounded-xl border border-slate-200" role="group" aria-label="Date range">
                  {RANGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDateRange(opt.value)}
                      aria-pressed={dateRange === opt.value}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                        dateRange === opt.value ? "bg-white shadow-xs border border-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {opt.value === "CUSTOM" && <Calendar className="h-3.5 w-3.5" />}
                      {opt.label}
                    </button>
                  ))}
                </div>

                {dateRange === "CUSTOM" && (
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="w-36">
                      <CustomDatePicker value={startDate} onChange={setStartDate} />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">to</span>
                    <div className="w-36">
                      <CustomDatePicker value={endDate} onChange={setEndDate} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Headline numbers for the selected dates */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {kpis.map((kpi, idx) => (
                <Link
                  key={kpi.label}
                  href={kpi.route}
                  className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                    {/* Sales is the number owners look for first, so it reads largest */}
                    <span
                      className={`${idx === 0 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"} font-bold tabular-nums tracking-tight ${
                        kpi.value.startsWith("-") ? "text-rose-600" : "text-slate-800"
                      }`}
                    >
                      {kpi.value}
                    </span>
                    {kpi.trend &&
                      (isFlatTrend(kpi.trend) ? (
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
                          <Minus className="h-3.5 w-3.5" />
                          0%
                        </span>
                      ) : (
                        <span
                          className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            kpi.positive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {kpi.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                          {kpi.trend}
                        </span>
                      ))}
                  </div>
                  {kpi.note && <p className="mt-1.5 text-xs leading-snug text-slate-500">{kpi.note}</p>}
                  <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500 tabular-nums">Before: {kpi.prev}</p>
                </Link>
              ))}
            </div>

            {/* What to act on right now — directly under the numbers */}
            <NeedsAttentionCard outletId={outletId} />

            {/* Today: how sales are going, and what's open */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <TodayPaceCard outletId={outletId} />
              <RightNowCard orders={openOrders} />
            </div>

            {/* People: today, and the week ahead against the forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <ShiftCoverageCard outletId={outletId} className="lg:col-span-5" />
              <WeekStaffingCard outletId={outletId} className="lg:col-span-7" />
            </div>

            {/* Sales Forecast (own range toggle; independent of the date filter above) */}
            <SalesForecastChart outletId={outletId} />

            {/* Menu: what sells, and what doesn't */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <TopSellersCard items={Array.isArray(topSelling) ? topSelling : []} rangeLabel={RANGE_LABELS[dateRange]} />
              <SlowMoversCard outletId={outletId} />
            </div>

            {/* Ask Alayn AI — a quiet invitation at the end of the page */}
            <Link
              href="/dashboard/alayn-ai"
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-[#0B0F17] px-5 py-5 sm:px-6 transition-colors hover:border-slate-600"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white">
                  <Image src="/justlogo.png" alt="" width={24} height={24} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-100">Ask Alayn AI</h2>
                  <p className="text-sm text-slate-400">
                    Sales, next week&apos;s forecast, stock, staff or your menu, answered from your own numbers.
                  </p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#E5484D] px-4 py-2 text-sm font-semibold text-white group-hover:bg-[#EF5350]">
                Open Alayn AI <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
