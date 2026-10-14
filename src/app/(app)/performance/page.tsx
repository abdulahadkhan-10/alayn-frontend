"use client";

import React from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import SalesForecastChart from "@/components/dashboard/SalesForecastChart";
import { PerformanceOverview, PerformanceMetricCard } from "@/components/PerformanceOverview";
import { useBranch } from "@/lib/BranchContext";
import { useGetKpisQuery, useGetOutletComparisonQuery } from "@/redux/slices/dashboardApiSlice";

type Kpi = { value: string; change: string; isPositive: boolean } | undefined;

// 0% (or no earlier period to compare with) is neutral, not "up"
function trendOf(kpi: Kpi): { trend?: string; trendType: "positive" | "negative" | "neutral" } {
  if (!kpi?.change) return { trendType: "neutral" };
  const n = parseFloat(kpi.change.replace(/[^0-9.\-]/g, ""));
  if (!Number.isFinite(n) || n === 0) return { trend: "0%", trendType: "neutral" };
  return { trend: kpi.change, trendType: kpi.isPositive ? "positive" : "negative" };
}

export default function PerformancePage() {
  const { activeBranch } = useBranch();
  const outletId = activeBranch?.id || undefined;

  const { data: kpis, isLoading: kpisLoading, isError: kpisError } = useGetKpisQuery({ outletId, range: "THIS_MONTH" });
  const {
    data: locations = [],
    isLoading: locationsLoading,
    isError: locationsError,
  } = useGetOutletComparisonQuery();

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const placeholder = kpisLoading ? "…" : "—";
  const compareNote = "This month vs the same number of days before";

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="mx-auto max-w-7xl">
          {/* Header section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Performance Analytics
              </h1>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                {activeBranch && activeBranch.id !== "all" ? activeBranch.name : "All locations"} · settled sales before tax
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm text-sm font-semibold text-gray-700">
              Today: {today}
            </div>
          </div>

          {kpisError && (
            <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              Couldn&apos;t load this month&apos;s figures. Please refresh to try again.
            </p>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <PerformanceMetricCard
              title="Net Sales"
              value={kpis?.totalRevenue?.value ?? placeholder}
              {...trendOf(kpis?.totalRevenue)}
              note={compareNote}
            />
            <PerformanceMetricCard
              title="Orders"
              value={kpis?.orders?.value ?? placeholder}
              {...trendOf(kpis?.orders)}
              note={compareNote}
            />
            <PerformanceMetricCard
              title="Avg Order Value"
              value={kpis?.avgOrderValue?.value ?? placeholder}
              {...trendOf(kpis?.avgOrderValue)}
              note={compareNote}
            />
          </div>

          {/* Daily sales with forecast */}
          <div className="mb-6">
            <SalesForecastChart outletId={outletId} />
          </div>

          {/* Location table */}
          <PerformanceOverview locations={locations} loading={locationsLoading} error={locationsError} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
