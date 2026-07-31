"use client";

import React, { useState, use, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store/hooks";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { useBranch } from "@/lib/BranchContext";
import { useCreateOutletMutation } from "@/redux/slices/outletApiSlice";
import { useGetKpisQuery } from "@/redux/slices/dashboardApiSlice";

import { DashboardFilterState, ExecutiveKpiMetric, OutletPerformanceRecord } from "@/types/dashboard";
import { GlobalFilterBar } from "@/components/dashboard/GlobalFilterBar";
import { ExecutiveKpiGrid } from "@/components/dashboard/ExecutiveKpiGrid";
import { OutletPerformanceTable } from "@/components/dashboard/OutletPerformanceTable";
import { SalesAnalyticsChart } from "@/components/dashboard/SalesAnalyticsChart";
import { SalesDistributionCard } from "@/components/dashboard/SalesDistributionCard";
import { AiActionableInsights } from "@/components/dashboard/AiActionableInsights";
import { AlertCenterCard } from "@/components/dashboard/AlertCenterCard";

import { Store, Loader2, ShieldCheck } from "lucide-react";

interface PageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
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

  const { activeBranch, branches, loading, isDemo, refreshBranches } = useBranch();
  const outletId = activeBranch?.id || undefined;

  // Global Dashboard Filter State
  const [filterState, setFilterState] = useState<DashboardFilterState>({
    dateRange: "MTD",
    selectedOutletIds: [],
    compareMode: "PREVIOUS_PERIOD",
  });

  const { data: kpiData, isLoading: isKpiLoading, refetch } = useGetKpisQuery(
    { outletId: filterState.selectedOutletIds.length === 1 ? filterState.selectedOutletIds[0] : outletId },
    { skip: false }
  );

  const [createOutlet, { isLoading: isSubmitting }] = useCreateOutletMutation();

  // Form state for zero-outlet onboarding
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const isInitialLoading = loading || isKpiLoading;
  const hasNoOutlets = !isInitialLoading && !isDemo && branches.length === 0;

  // Memoized Outlet List for Global Filter Bar
  const outletOptions = useMemo(() => {
    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      city: b.city,
    }));
  }, [branches]);

  // Memoized 6 Executive KPI Metrics — the daily-glance set only.
  // Everything else (waste, staff, inventory valuation, ratings...) lives on its own dedicated page.
  const executiveKpis = useMemo<ExecutiveKpiMetric[]>(() => {
    const revVal = kpiData?.totalRevenue?.value || "₹4,85,000";
    const netVal = kpiData?.netMargin?.value || "28.4%";

    return [
      {
        id: "kpi-rev",
        title: "Total Revenue",
        value: revVal,
        rawValue: 485000,
        unit: "currency",
        change: "+18.4%",
        isPositive: true,
        sparkline: [42, 48, 51, 56, 78, 95, 82],
        tooltip: "Total POS billing & delivery sales before tax",
        category: "FINANCIAL",
        prevPeriodValue: "₹4,10,000",
        insightSentence: "Highest weekend growth across all active branches.",
        iconName: "revenue",
      },
      {
        id: "kpi-gm",
        title: "Gross Margin %",
        value: netVal,
        rawValue: 71.6,
        unit: "percent",
        change: "+2.4%",
        isPositive: true,
        sparkline: [70, 71, 70, 72, 71, 72, 71],
        tooltip: "Percent of gross sales retained after ingredient costs",
        category: "FINANCIAL",
        prevPeriodValue: "69.2%",
        insightSentence: "Beverage sales driving overall margin lift.",
        iconName: "margin",
      },
      {
        id: "kpi-orders",
        title: "Total Orders",
        value: "2,870",
        rawValue: 2870,
        unit: "number",
        change: "+14.1%",
        isPositive: true,
        sparkline: [310, 340, 360, 390, 480, 520, 470],
        tooltip: "Count of all POS, QR, and online delivery tickets fulfilled",
        category: "OPERATIONAL",
        prevPeriodValue: "2,515",
        insightSentence: "Dine-in orders contributed 48% of volume.",
        iconName: "orders",
      },
      {
        id: "kpi-aov",
        title: "Average Order Value",
        value: "₹1,690",
        rawValue: 1690,
        unit: "currency",
        change: "+3.8%",
        isPositive: true,
        sparkline: [1610, 1620, 1640, 1650, 1680, 1710, 1690],
        tooltip: "Average spend per completed order ticket",
        category: "OPERATIONAL",
        prevPeriodValue: "₹1,628",
        insightSentence: "Dessert cross-sell increased AOV by ₹62.",
        iconName: "aov",
      },
      {
        id: "kpi-foodcost",
        title: "Food Cost %",
        value: "28.4%",
        rawValue: 28.4,
        unit: "percent",
        change: "-0.9%",
        isPositive: true, // Lower food cost is good
        sparkline: [30, 29.5, 29, 28.8, 28.6, 28.4, 28.4],
        tooltip: "Cost of raw ingredients as a percentage of total sales",
        category: "FINANCIAL",
        prevPeriodValue: "29.3%",
        insightSentence: "Target is 27.5% (Variance: +0.9%).",
        iconName: "foodcost",
      },
      {
        id: "kpi-labor",
        title: "Labour Cost %",
        value: "17.0%",
        rawValue: 17.0,
        unit: "percent",
        change: "-1.2%",
        isPositive: true,
        sparkline: [18.5, 18.2, 18.0, 17.6, 17.4, 17.1, 17.0],
        tooltip: "Staff payroll & wages as a percentage of total revenue",
        category: "OPERATIONAL",
        prevPeriodValue: "18.2%",
        insightSentence: "Shift coverage optimized across peak dinner hours.",
        iconName: "labor",
      },
    ];
  }, [kpiData]);

  // Memoized Ranked Outlets Performance Matrix Data
  const outletRecords = useMemo<OutletPerformanceRecord[]>(() => {
    if (branches.length === 0) {
      return [
        {
          id: "out-1",
          name: "Main Flagship Branch",
          code: "OUT-01",
          city: "Mumbai",
          revenue: 285000,
          orders: 1640,
          growth: 18.4,
          grossProfit: 204000,
          foodCostPct: 28.4,
          wasteCost: 24000,
          rating: 4.8,
          staffCount: 14,
          inventoryValue: 480000,
          stockoutCount: 1,
          healthScore: 94,
          healthStatus: "EXCELLENT",
          sparkline: [40, 50, 65, 80, 95],
        },
        {
          id: "out-2",
          name: "Soho Bistro Outlet",
          code: "OUT-02",
          city: "London",
          revenue: 142000,
          orders: 890,
          growth: 12.1,
          grossProfit: 101000,
          foodCostPct: 29.1,
          wasteCost: 14200,
          rating: 4.7,
          staffCount: 8,
          inventoryValue: 260000,
          stockoutCount: 2,
          healthScore: 88,
          healthStatus: "GOOD",
          sparkline: [30, 40, 55, 70, 85],
        },
        {
          id: "out-3",
          name: "Bhendi Bazaar Express",
          code: "OUT-03",
          city: "Mumbai",
          revenue: 58000,
          orders: 340,
          growth: -3.5,
          grossProfit: 39000,
          foodCostPct: 34.2,
          wasteCost: 9800,
          rating: 4.2,
          staffCount: 5,
          inventoryValue: 105000,
          stockoutCount: 4,
          healthScore: 64,
          healthStatus: "NEEDS_ATTENTION",
          sparkline: [60, 55, 50, 45, 40],
        },
      ];
    }

    return branches.map((b, idx) => {
      const rev = 150000 + (idx + 1) * 60000;
      return {
        id: b.id,
        name: b.name,
        code: `OUT-0${idx + 1}`,
        city: b.city || "Mumbai",
        revenue: rev,
        orders: Math.round(rev / 160),
        growth: 10 + idx * 4,
        grossProfit: Math.round(rev * 0.72),
        foodCostPct: 28.0 + (idx % 3),
        wasteCost: 12000 + idx * 3000,
        rating: 4.6 + (idx % 4) * 0.1,
        staffCount: 6 + idx * 3,
        inventoryValue: 200000 + idx * 80000,
        stockoutCount: idx % 2,
        healthScore: 92 - idx * 5,
        healthStatus: idx === 0 ? "EXCELLENT" : idx === 1 ? "GOOD" : "NEEDS_ATTENTION",
        sparkline: [35 + idx * 5, 45 + idx * 5, 60 + idx * 5, 75 + idx * 5, 90 + idx * 5],
      };
    });
  }, [branches]);

  const handleFilterChange = useCallback((newFilters: DashboardFilterState) => {
    setFilterState(newFilters);
  }, []);

  const handleFormChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Outlet name is required.";
    if (!formData.address.trim()) errs.address = "Address is required.";
    if (!formData.city.trim()) errs.city = "City is required.";
    if (!formData.state.trim()) errs.state = "State is required.";
    if (!formData.country.trim()) errs.country = "Country is required.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateOutletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateForm()) return;

    try {
      await createOutlet(formData).unwrap();
      await refreshBranches();
    } catch (err: any) {
      const msg =
        err?.data?.message || err?.data?.error || err?.message || "An error occurred while creating the outlet.";
      setSubmitError(msg);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        {isInitialLoading ? (
          <DashboardSkeleton />
        ) : hasNoOutlets ? (
          <div className="max-w-3xl mx-auto py-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100/90 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A] shadow-sm">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#D3232A]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Setup Required
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif">
                      Register Your First Outlet
                    </h1>
                  </div>
                </div>

                <p className="text-sm text-zinc-500 mb-8 font-medium leading-relaxed">
                  Welcome to Alayn AI! Real-time restaurant telemetry and POS analytics become active once your physical location is registered.
                </p>

                <form onSubmit={handleCreateOutletSubmit} className="space-y-6">
                  {submitError && (
                    <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-[#D3232A] border border-red-100">
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label htmlFor="outlet-name" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                      Outlet / Branch Name
                    </label>
                    <input
                      id="outlet-name"
                      type="text"
                      value={formData.name}
                      onChange={handleFormChange("name")}
                      placeholder="e.g. Golden Fork — Soho Branch"
                      className="block w-full rounded-xl border border-gray-200 py-3.5 px-4 text-gray-900 focus:ring-2 focus:ring-[#D3232A] sm:text-sm bg-gray-50/50"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Complete Setup & Launch Dashboard"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-8">
            {/* Filter Controls Bar */}
            <GlobalFilterBar
              filters={filterState}
              onFilterChange={handleFilterChange}
              outlets={outletOptions}
              onRefresh={() => refetch()}
              isRefreshing={isKpiLoading}
            />

            {/* 6 Executive KPI Cards — the daily-glance set */}
            <ExecutiveKpiGrid metrics={executiveKpis} />

            {/* Sales trend + channel mix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SalesAnalyticsChart />
              </div>
              <div>
                <SalesDistributionCard />
              </div>
            </div>

            {/* Per-outlet performance — full breakdown lives on /performance */}
            <OutletPerformanceTable outlets={outletRecords} />

            {/* Time-sensitive alerts & AI recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AlertCenterCard />
              <AiActionableInsights />
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
