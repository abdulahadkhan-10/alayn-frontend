"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store/hooks";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import KPIWidget from "@/components/dashboard/KPIWidget";
import SalesForecastChart from "@/components/dashboard/SalesForecastChart";
import InventoryForecastChart from "@/components/dashboard/InventoryForecastChart";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { useBranch } from "@/lib/BranchContext";
import { useCreateOutletMutation } from "@/redux/slices/outletApiSlice";
import {
  IndianRupee,
  TrendingUp,
  Users,
  Percent,
  RefreshCw,
  Zap,
  ShoppingBag,
  Clock,
  Lightbulb,
  Building2,
  Store,
  MapPin,
  Landmark,
  Map,
  Globe,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  useGetKpisQuery,
  useGetSalesForecastQuery,
  useGetInventoryForecastQuery,
} from "@/redux/slices/dashboardApiSlice";

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
    }
  }, [user?.role, router]);

  const { activeBranch, branches, loading, isDemo, refreshBranches } = useBranch();
  const outletId = activeBranch?.id || undefined;

  const { data: kpiData, isLoading: isKpiLoading, refetch } = useGetKpisQuery({ outletId }, { skip: !outletId });
  const { data: salesData, isLoading: isSalesLoading } = useGetSalesForecastQuery({ outletId }, { skip: !outletId });
  const { data: inventoryData, isLoading: isInventoryLoading } = useGetInventoryForecastQuery({ outletId }, { skip: !outletId });

  const [createOutlet, { isLoading: isSubmitting }] = useCreateOutletMutation();

  // In-place outlet creation form state
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India"
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const kpis = {
    totalRevenue: kpiData?.totalRevenue || { value: "₹0", change: "0.0%", isPositive: true },
    cogs: kpiData?.cogs || { value: "₹0", change: "0.0%", isPositive: true },
    grossProfit: kpiData?.grossProfit || { value: "₹0", change: "0.0%", isPositive: true },
    laborCosts: kpiData?.laborCosts || { value: "₹0", change: "0.0%", isPositive: true },
    netMargin: kpiData?.netMargin || { value: "0.0%", change: "0.0%", isPositive: true },
  };

  const isInitialLoading = loading || isKpiLoading;
  const hasNoOutlets = !isInitialLoading && !isDemo && branches.length === 0;

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
      const msg = err?.data?.message || err?.data?.error || err?.message || "An error occurred while creating the outlet.";
      setSubmitError(msg);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        {isInitialLoading ? (
        <DashboardSkeleton />
      ) : hasNoOutlets ? (
        <div className="max-w-3xl mx-auto py-4 sm:py-8">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100/90 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D3232A] shadow-sm">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#D3232A]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Setup Required
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-serif">
                    Register Your First Outlet With Us
                  </h1>
                </div>
              </div>

              <p className="text-sm text-zinc-500 mb-8 font-medium leading-relaxed">
                Welcome to Alayn AI! Analytics and POS telemetry will become active once your physical restaurant location is set up. Fill out the branch details below to complete your setup.
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
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="outlet-name"
                      type="text"
                      value={formData.name}
                      onChange={handleFormChange("name")}
                      placeholder="e.g. Golden Fork — Soho Branch"
                      className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                    />
                  </div>
                  {formErrors.name && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{formErrors.name}</p>}
                </div>

                <div>
                  <label htmlFor="outlet-address" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Street Address
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute top-3.5 left-0 flex items-start pl-3.5">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="outlet-address"
                      rows={3}
                      value={formData.address}
                      onChange={handleFormChange("address")}
                      placeholder="123 Main Road, Near Central Square"
                      className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200 resize-none"
                    />
                  </div>
                  {formErrors.address && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{formErrors.address}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="outlet-city" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                      City
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Landmark className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="outlet-city"
                        type="text"
                        value={formData.city}
                        onChange={handleFormChange("city")}
                        placeholder="Mumbai / London"
                        className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    {formErrors.city && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{formErrors.city}</p>}
                  </div>

                  <div>
                    <label htmlFor="outlet-state" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                      State / Region
                    </label>
                    <div className="relative rounded-xl shadow-xs">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <Map className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="outlet-state"
                        type="text"
                        value={formData.state}
                        onChange={handleFormChange("state")}
                        placeholder="Maharashtra / Greater London"
                        className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    {formErrors.state && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{formErrors.state}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="outlet-country" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">
                    Country
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="outlet-country"
                      type="text"
                      value={formData.country}
                      onChange={handleFormChange("country")}
                      placeholder="India"
                      className="block w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#D3232A] sm:text-sm bg-gray-50/50 focus:bg-white transition-all duration-200"
                    />
                  </div>
                  {formErrors.country && <p className="mt-1.5 text-xs font-semibold text-[#D3232A]">{formErrors.country}</p>}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#D3232A] px-6 py-4 text-base font-bold text-white shadow-xl hover:bg-[#b01e23] transition-all duration-200 disabled:opacity-75 disabled:cursor-not-allowed hover:-translate-y-[1px] cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Registering Outlet...
                      </>
                    ) : (
                      <>
                        Complete Setup & Launch Dashboard
                        <ArrowRight className="h-5 w-5 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-12">
          {/* Top Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0B1221] p-6 lg:p-7 rounded-2xl text-white shadow-sm border border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                  <Zap className="h-3.5 w-3.5" />
                  Live Sync Active
                </span>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Outlet: <strong className="text-white">{activeBranch?.name || "All Outlets"}</strong>
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Executive Overview & Analytics
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
                Multi-outlet POS telemetry, P&L financial summary, labor analysis, and stock forecasts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => refetch()}
                className="flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors border border-slate-700 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* P&L Summary Metric Grid - Fully Responsive */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="h-4.5 w-4.5 text-[#D3232A]" />
                P&L Financial Performance
              </h2>
              <span className="text-xs font-medium text-gray-500">Current Month (MTD)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              <KPIWidget
                title="Total Sales"
                value={kpis.totalRevenue.value}
                change={kpis.totalRevenue.change}
                isPositive={kpis.totalRevenue.isPositive}
                subtext="Total customer billing before tax"
                icon={IndianRupee}
              />
              <KPIWidget
                title="Ingredient Cost"
                value={kpis.cogs.value}
                change={kpis.cogs.change}
                isPositive={kpis.cogs.isPositive}
                subtext="Money spent on food & kitchen stock"
                icon={ShoppingBag}
              />
              <KPIWidget
                title="Sales Profit"
                value={kpis.grossProfit.value}
                change={kpis.grossProfit.change}
                isPositive={kpis.grossProfit.isPositive}
                subtext="Sales money left after food costs"
                icon={TrendingUp}
              />
              <KPIWidget
                title="Active Staff"
                value={kpis.laborCosts.value}
                change={kpis.laborCosts.change}
                isPositive={kpis.laborCosts.isPositive}
                subtext="Active employees registered"
                icon={Users}
              />
              <KPIWidget
                title="Profit Margin"
                value={kpis.netMargin.value}
                change={kpis.netMargin.change}
                isPositive={kpis.netMargin.isPositive}
                subtext="Percent of sales kept as profit"
                icon={Percent}
              />
            </div>
          </div>

          {/* Main Analytics Charts Section */}

          <SalesForecastChart data={salesData} isLoading={isSalesLoading} />
          <InventoryForecastChart data={inventoryData} isLoading={isInventoryLoading} />


          {/* Real-time Insights & Activity Feed */}
          {(() => {
            const lowStockItems = inventoryData ? inventoryData.filter(item => item.currentStock <= item.threshold) : [];
            const lowStockCount = lowStockItems.length;
            const hasNoRevenue = !kpiData || kpiData.totalRevenue.value === "₹0";
            const hasNoLabor = !kpiData || kpiData.laborCosts.value === "₹0";

            return (
              <div className="rounded-xl bg-white p-5 shadow-xs border border-gray-200/80">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                      <Lightbulb className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Operational Insights</h3>
                      <p className="text-xs text-gray-500 font-medium">Automated revenue and cost optimization recommendations</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Insight 1: Inventory */}
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-xs mb-1.5">
                        <ShoppingBag className="h-4 w-4 text-[#D3232A]" />
                        Inventory Alert
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {lowStockCount > 0
                          ? `"${lowStockItems[0].item}" is currently below safety stock threshold. Register a purchase order to prevent menu item unavailability.`
                          : "All tracked ingredients are currently above safety stock thresholds. Inventory levels are stable and stockout risk is minimal."
                        }
                      </p>
                    </div>
                  </div>

                  {/* Insight 2: Finance */}
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-xs mb-1.5">
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                        Margin Optimization
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {hasNoRevenue
                          ? "No sales transactions logged for this period yet. Real-time profitability recommendations will update once POS billing or table orders start."
                          : `Gross profit is at ${kpis.grossProfit.value} with a Net Margin of ${kpis.netMargin.value}. Standardizing portion weights will preserve margins against raw cost variances.`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Insight 3: Staffing */}
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-200/70 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-gray-900 font-bold text-xs mb-1.5">
                        <Users className="h-4 w-4 text-blue-600" />
                        Staffing Analysis
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed font-medium">
                        {hasNoLabor
                          ? `No active employee roster registered under "${activeBranch?.name || "this outlet"}". Configure shift schedules in the Workforce section to track attendance.`
                          : "Active shift coverage is currently optimal. Scheduled staff levels align with dining room capacity and active POS order volume."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      </DashboardLayout>
    </AuthGuard>
  );
}
