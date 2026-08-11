"use client";

import React, { useState, use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppSelector } from "@/redux/store/hooks";

import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { useBranch } from "@/lib/BranchContext";
import {
  useGetKpisQuery,
  useGetSalesVelocityQuery,
  useGetChannelDistributionQuery,
  useGetTopSellingItemsQuery,
} from "@/redux/slices/dashboardApiSlice";
import { useGetOrdersQuery } from "@/redux/slices/orderApiSlice";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import { useGetMenuItemsQuery } from "@/redux/slices/menuApiSlice";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import ElectricBorder from "@/components/ui/ElectricBorder";



import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  AlertTriangle,
  Activity,
  Calendar,
  PieChart as PieChartIcon,
  BarChart2,
  LineChart,
  Sparkles,
  Brain,
  Bot,
  Zap,
  RefreshCw,
  ChevronRight,
  ArrowRight,
  ChefHat,
  ShieldCheck,
  ArrowUpRight,
  ShoppingBag,
  ExternalLink,
  Send,
} from "lucide-react";



import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  LabelList
} from "recharts";

interface PageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type RangeType = "TODAY" | "7_DAY" | "CUSTOM" | "THIS_MONTH";



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



  // Date Range Controls
  const [dateRange, setDateRange] = useState<RangeType>("TODAY");
  const todayStr = new Date().toISOString().split("T")[0];
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [startDate, setStartDate] = useState<string>(sevenDaysAgoStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Queries
  const { data: kpiData, isLoading: isKpiLoading } = useGetKpisQuery(
    { outletId, range: dateRange, startDate, endDate },
    { skip: false }
  );

  const { data: realOrders = [], isLoading: isOrdersLoading, refetch: refetchOrders } = useGetOrdersQuery(
    { outletId },
    { skip: false }
  );

  const { data: employeesResponse = [], isLoading: isEmployeesLoading } = useGetEmployeesQuery(
    { outletId },
    { skip: false }
  );

  const { data: menuItems = [] } = useGetMenuItemsQuery(
    undefined,
    { skip: false }
  );

  const isInitialLoading = loading || isKpiLoading;

  const hasNoOutlets = !isInitialLoading && !isDemo && branches.length === 0;

  useEffect(() => {
    if (hasNoOutlets) {
      router.replace("/outlets/create");
    }
  }, [hasNoOutlets, router]);

  // Helper for 2-letter uppercase initials
  const getInitials = (name: string) => {
    if (!name) return "EM";
    const cleanStr = name.replace(/\(.*?\)/g, "").replace(/[^a-zA-Z\s]/g, "").trim();
    const words = cleanStr.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return "EM";
  };

  // Helper for role-based avatar background colors
  const getRoleAvatarStyle = (role: string) => {
    const r = (role || "").toUpperCase();
    if (r.includes("MANAGER") || r.includes("OWNER")) {
      return "bg-indigo-600 text-white font-bold";
    } else if (r.includes("HEAD CHEF") || r.includes("EXECUTIVE")) {
      return "bg-amber-600 text-white font-bold";
    } else if (r.includes("SOUS") || r.includes("CHEF") || r.includes("COOK")) {
      return "bg-emerald-600 text-white font-bold";
    } else if (r.includes("KITCHEN") || r.includes("HELPER") || r.includes("ASSISTANT")) {
      return "bg-teal-600 text-white font-bold";
    } else if (r.includes("SERVER") || r.includes("WAITER")) {
      return "bg-blue-600 text-white font-bold";
    }
    return "bg-slate-700 text-white font-bold";
  };

  // Process Real Staff / Employees Data (Filtered for Managers and Kitchen Staff only)
  const managersAndKitchenStaff = useMemo(() => {
    const rawList = Array.isArray(employeesResponse)
      ? employeesResponse
      : (employeesResponse as any)?.data || (employeesResponse as any)?.employees || [];

    let list: any[] = [];
    if (rawList && rawList.length > 0) {
      list = rawList.map((emp: any, idx: number) => {
        const rawName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || "Staff Member";
        const cleanName = rawName.replace(/\(.*?\)/g, "").trim();
        const roleName = (emp.role || "STAFF").replace(/_/g, " ");
        const statusMap: Record<string, string> = {
          ACTIVE: "ON_SHIFT",
          ON_SHIFT: "ON_SHIFT",
          ON_LEAVE: "ON_LEAVE",
          INACTIVE: "OFF_SHIFT",
        };
        const status = statusMap[emp.status] || (idx % 4 === 0 ? "ON_LEAVE" : "ON_SHIFT");
        const defaultHours = status === "ON_LEAVE" ? "-" : idx % 2 === 0 ? "09:00 - 18:00" : "12:00 - 21:00";
        return {
          id: emp.id || idx,
          name: cleanName || "Staff Member",
          role: roleName,
          status: status,
          hours: emp.shiftHours || defaultHours,
        };
      });
    }

    // Filter strictly for Managers and Kitchen staff only
    const filtered = list.filter((staff) => {
      const r = (staff.role || "").toUpperCase();
      return (
        r.includes("CHEF") ||
        r.includes("KITCHEN") ||
        r.includes("MANAGER") ||
        r.includes("COOK") ||
        r.includes("SOUS")
      );
    });

    return filtered;
  }, [employeesResponse]);

  // Process Real Active Orders Data (Top 4 View)
  const { activeOrdersList, activeStats } = useMemo(() => {
    const rawOrders = Array.isArray(realOrders) ? realOrders : (realOrders as any)?.data || [];

    const processed = rawOrders.map((ord: any) => ({
      id: ord.id,
      ticket: ord.orderNo || `#ORD-${String(ord.id).slice(-4).toUpperCase()}`,
      source: ord.orderSource || "TABLE",
      tableNo: ord.tableNo || "T-01",
      status: ord.status || "PREPARING",
      totalAmount: ord.totalAmount || 0,
    }));

    const activeCount = processed.filter((o: any) => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;

    return {
      activeOrdersList: processed,
      activeStats: { activeCount, totalCount: processed.length },
    };
  }, [realOrders]);

  // Real DB Analytics Queries (with Date Range Filter)
  const { data: velocityResponse = [] } = useGetSalesVelocityQuery(
    { outletId, range: dateRange, startDate, endDate },
    { skip: false }
  );

  const { data: channelResponse = [] } = useGetChannelDistributionQuery(
    { outletId, range: dateRange, startDate, endDate },
    { skip: false }
  );

  const { data: topSellingResponse = [] } = useGetTopSellingItemsQuery(
    { outletId, range: dateRange, startDate, endDate },
    { skip: false }
  );

  // Top Selling Items Analytics from DB
  const topItemsAnalytics = useMemo(() => {
    const itemsArray = Array.isArray(topSellingResponse) ? topSellingResponse : [];

    const totalVolume = itemsArray.reduce((acc, item) => acc + item.volume, 0);
    const totalRevenue = itemsArray.reduce((acc, item) => acc + item.revenue, 0);

    return {
      topItems: itemsArray,
      totalVolume,
      totalRevenue,
    };
  }, [topSellingResponse]);

  const revenueData = useMemo(() => {
    return Array.isArray(velocityResponse) ? velocityResponse : [];
  }, [velocityResponse]);

  const channelData = useMemo(() => {
    return Array.isArray(channelResponse) ? channelResponse : [];
  }, [channelResponse]);

  return (
    <AuthGuard>
      <DashboardLayout>
        {isInitialLoading || hasNoOutlets ? (
          <DashboardSkeleton />
        ) : (
          <div className="py-6 px-4 sm:px-6 max-w-[1500px] mx-auto space-y-7 font-sans bg-[#F8FAFC]">
            
            {/* Header & Date Range Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] uppercase font-semibold tracking-wider text-emerald-600">Live Telemetry Active</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Operator Console</h1>
                <p className="text-xs text-slate-500 font-normal">
                  {activeBranch?.name || "All Outlets"} • Real-time operational data &amp; AlaynAI analytics
                </p>
              </div>

              {/* Date Filter Pills + Custom Range Selector */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center bg-slate-100/70 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setDateRange("TODAY")}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      dateRange === "TODAY" ? "bg-white shadow-xs border border-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setDateRange("7_DAY")}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      dateRange === "7_DAY" ? "bg-white shadow-xs border border-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    onClick={() => setDateRange("CUSTOM")}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      dateRange === "CUSTOM" ? "bg-white shadow-xs border border-slate-200 text-[#D3232A]" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Choose Date
                  </button>
                  <button
                    onClick={() => setDateRange("THIS_MONTH")}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      dateRange === "THIS_MONTH" ? "bg-white shadow-xs border border-slate-200 text-slate-800" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    This Month
                  </button>
                </div>

                {/* Custom Date Pickers Popup Bar */}
                {dateRange === "CUSTOM" && (
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="w-36">
                      <CustomDatePicker value={startDate} onChange={setStartDate} />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">to</span>
                    <div className="w-36">
                      <CustomDatePicker value={endDate} onChange={setEndDate} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "NET REVENUE",
                  value: kpiData?.totalRevenue?.value || (realOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) > 0 ? `₹${realOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0).toLocaleString()}` : "₹0"),
                  prev: kpiData?.totalRevenue?.prev || "₹0",
                  trend: kpiData?.totalRevenue?.change || "0%",
                  positive: kpiData?.totalRevenue?.isPositive ?? true,
                  route: "/performance"
                },
                {
                  label: "ACTIVE ORDERS",
                  value: `${activeStats.activeCount}`,
                  prev: "0",
                  trend: activeStats.activeCount > 0 ? `+${activeStats.activeCount}` : "0%",
                  positive: true,
                  route: "/orders"
                },
                {
                  label: "AVG ORDER VALUE",
                  value: kpiData?.avgOrderValue?.value || (realOrders.length > 0 ? `₹${Math.round(realOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) / realOrders.length)}` : "₹0"),
                  prev: "₹0",
                  trend: kpiData?.avgOrderValue?.change || "0%",
                  positive: kpiData?.avgOrderValue?.isPositive ?? true,
                  route: "/orders"
                },
                {
                  label: "GROSS MARGIN",
                  value: kpiData?.netMargin?.value || "0%",
                  prev: "0%",
                  trend: kpiData?.netMargin?.change || "0%",
                  positive: kpiData?.netMargin?.isPositive ?? true,
                  route: "/performance"
                },
              ].map((kpi, idx) => (
                <div 
                  key={idx} 
                  onClick={() => router.push(kpi.route)}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{kpi.label}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-2xl font-bold text-slate-800 tabular-nums tracking-tight">{kpi.value}</span>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.positive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                      {kpi.positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {kpi.trend}
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400 font-normal font-mono border-t border-slate-100 pt-2 flex justify-between items-center">
                    <span>Prev: {kpi.prev}</span>
                    <span className="text-[10px] text-blue-600 font-semibold group-hover:underline">View details</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Sales Velocity Area Chart */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <LineChart className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">Sales Velocity Telemetry</h3>
                      <p className="text-xs text-slate-500 font-normal">Hourly revenue accumulation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/performance")}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
                  >
                    Full Analytics <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="h-[240px] w-full flex items-center justify-center">
                  {revenueData.length === 0 || revenueData.every(d => d.revenue === 0) ? (
                    <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 w-full h-full">
                      <BarChart2 className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-600">No Sales Telemetry Recorded Yet</p>
                      <p className="text-[11px] text-slate-400 font-normal mt-0.5">Orders placed today will automatically populate sales velocity.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                          formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Order Channels Donut */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <PieChartIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">Order Channels</h3>
                      <p className="text-xs text-slate-500 font-normal">Channel distribution share</p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/orders")}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    title="View Channel Orders"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-[180px] flex items-center justify-center relative">
                  {channelData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 w-full h-full">
                      <PieChartIcon className="h-7 w-7 text-slate-300 mb-1" />
                      <p className="text-xs font-bold text-slate-600">No Orders Recorded</p>
                      <p className="text-[10px] text-slate-400">Channels will calculate on order placement.</p>
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {channelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(val: any) => [`${val}%`, 'Share']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold text-slate-800 tabular-nums">100<span className="text-xs text-slate-400">%</span></span>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400">Total Share</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  {channelData.length === 0 ? (
                    <span className="col-span-3 text-center text-xs text-slate-400 py-1">No channel data</span>
                  ) : (
                    channelData.map((ch, i) => (
                      <div key={i} className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                          <span className="text-[11px] font-semibold text-slate-600">{ch.name}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-800 tabular-nums">{ch.value}%</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* 50/50 SYMMETRIC OPERATIONS TELEMETRY ROW: ACTIVE ORDERS (6) + SHIFT COVERAGE (6) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Side: Recent Active Orders (6 Cols) */}
              <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent Active Orders</h2>
                      <p className="text-xs text-slate-500 font-normal">Live kitchen tickets &amp; order queue summary</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
                      {activeOrdersList.length} Active
                    </span>
                    <button
                      onClick={() => router.push("/orders")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-200/60"
                    >
                      View All <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/70 flex-1">
                  {activeOrdersList.length === 0 ? (
                    <div className="py-8 text-center text-xs font-semibold text-slate-400 bg-slate-50/50 flex flex-col items-center justify-center">
                      <Activity className="h-6 w-6 text-slate-300 mb-1" />
                      No active orders right now.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase font-semibold tracking-wider">
                        <tr>
                          <th className="px-3.5 py-2.5">Ticket #</th>
                          <th className="px-3.5 py-2.5">Location</th>
                          <th className="px-3.5 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {activeOrdersList.slice(0, 4).map((row: any) => (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800 text-xs">{row.ticket}</td>
                            <td className="px-3.5 py-2.5 font-semibold text-slate-700">{row.source}: {row.tableNo}</td>
                            <td className="px-3.5 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                row.status === "PREPARING" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                                row.status === "SENT_TO_KITCHEN" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                                "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {row.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-right font-bold text-slate-800">₹{row.totalAmount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              {/* Right Side: Shift Coverage Summary (6 Cols) */}
              <section className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ChefHat className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 tracking-tight">Shift Coverage Summary</h2>
                      <p className="text-xs text-slate-500 font-normal">Active managers &amp; kitchen staff availability</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                      Managers &amp; Kitchen
                    </span>
                    <button
                      onClick={() => router.push("/workforce")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors bg-indigo-50/60 px-3.5 py-1.5 rounded-xl border border-indigo-200/60"
                    >
                      Manage Roster <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {managersAndKitchenStaff.length === 0 ? (
                    <div className="col-span-2 py-8 text-center text-xs font-semibold text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                      <Users className="h-6 w-6 text-slate-300 mb-1" />
                      No staff members registered for this branch yet.
                    </div>
                  ) : (
                    managersAndKitchenStaff.slice(0, 4).map((staff: any) => {
                      const initials = getInitials(staff.name);
                      const pfpStyle = getRoleAvatarStyle(staff.role);
                      return (
                        <div
                          key={staff.id}
                          onClick={() => router.push("/workforce")}
                          className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-center justify-between gap-2.5 hover:bg-white hover:border-slate-300 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`h-8 w-8 rounded-full ${pfpStyle} text-xs flex items-center justify-center shrink-0 shadow-2xs`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">{staff.name}</div>
                              <div className="text-[10px] text-slate-500 font-medium truncate">{staff.role}</div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                staff.status === "ON_SHIFT"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : staff.status === "ON_LEAVE"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {staff.status.replace("_", " ")}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 mt-0.5">{staff.hours}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

            </div>


            {/* ========================================================================= */}
            {/* FULL WIDTH SECTION 2: TOP SELLING MENU ITEMS (RICH SPLIT CHART + LEADERBOARD) */}
            {/* ========================================================================= */}
            <section className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <BarChart2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800 tracking-tight">Top Selling Menu Items</h2>
                    <p className="text-xs text-slate-500 font-normal">Sales volume &amp; revenue contribution breakdown</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
                    <span>Total Volume: <strong className="text-slate-800">{topItemsAnalytics.totalVolume} units</strong></span>
                    <span className="text-slate-300">|</span>
                    <span>Top Sales: <strong className="text-emerald-700">₹{topItemsAnalytics.totalRevenue.toLocaleString()}</strong></span>
                  </div>
                  <button
                    onClick={() => router.push("/menu")}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors bg-emerald-50/70 px-3.5 py-1.5 rounded-xl border border-emerald-200/80"
                  >
                    View Menu Analytics <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Rich 2-Column Split: Chart (Left) + Top Performers Leaderboard (Right) */}
              {topItemsAnalytics.topItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 w-full my-2">
                  <ShoppingBag className="h-9 w-9 text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Item Sales Recorded Yet</p>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5">As orders are completed, top menu performance will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Side: Vertical Bar Graph with Data Labels */}
                  <div className="lg:col-span-7 h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topItemsAnalytics.topItems} margin={{ top: 25, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="blueBarGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
                          formatter={(val: any) => [`${val} units sold`, 'Volume']}
                        />
                        <Bar dataKey="volume" radius={[8, 8, 0, 0]} barSize={36} fill="url(#blueBarGrad)">
                          <LabelList dataKey="volume" position="top" style={{ fontSize: '11px', fontWeight: '700', fill: '#1e293b' }} />
                          {topItemsAnalytics.topItems.map((_, idx) => (
                            <Cell key={`cell-${idx}`} fill={idx === 0 ? "#2563eb" : idx === 1 ? "#3b82f6" : idx === 2 ? "#60a5fa" : "#94a3b8"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right Side: Leaderboard Ranking Cards */}
                  <div className="lg:col-span-5 space-y-2.5">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Item Performance Matrix</div>
                    {topItemsAnalytics.topItems.slice(0, 4).map((item, idx) => {
                      const percent = Math.round((item.volume / (topItemsAnalytics.totalVolume || 1)) * 100);
                      return (
                        <div
                          key={idx}
                          onClick={() => router.push("/menu")}
                          className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                                idx === 0
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : idx === 1
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.name}</div>
                              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <div>
                              <div className="text-xs font-bold text-slate-800">{item.volume} sold</div>
                              <div className="text-[11px] font-semibold text-emerald-600">₹{item.revenue.toLocaleString()}</div>
                            </div>
                            <div className="w-10 text-right font-bold text-xs text-blue-600">
                              {percent}%
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}
            </section>

            {/* ── ALAYN AI TEASER CARD — Premium Light Modern SaaS Redesign ── */}
            <div className="w-full">
              <ElectricBorder color="#E5484D" speed={1} chaos={0.08} borderRadius={24}>
                <section
                  className="w-full rounded-[24px] overflow-hidden font-sans relative group transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #FFFFFF 0%, #FFF8F8 50%, #FCFBFD 100%)",
                    border: "1px solid rgba(229, 72, 77, 0.14)",
                    boxShadow: "0 4px 20px -2px rgba(23, 32, 51, 0.04), 0 12px 32px -4px rgba(229, 72, 77, 0.06)",
                  }}
                >
                  {/* Subtle, soft ambient gradient accents */}
                  <div
                    style={{
                      position: "absolute", top: "-60px", right: "-40px",
                      width: "320px", height: "320px",
                      borderRadius: "9999px",
                      background: "radial-gradient(circle, rgba(244, 114, 138, 0.07) 0%, rgba(229, 72, 77, 0.02) 50%, transparent 70%)",
                      filter: "blur(40px)", pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute", bottom: "-60px", left: "10%",
                      width: "280px", height: "280px",
                      borderRadius: "9999px",
                      background: "radial-gradient(circle, rgba(245, 158, 108, 0.06) 0%, transparent 70%)",
                      filter: "blur(45px)", pointerEvents: "none",
                    }}
                  />

                  <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 px-6 py-6 sm:px-8 sm:py-7 lg:px-10 lg:py-8">
                    
                    {/* Left/Center Content Stack */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left min-w-0 flex-1">
                      
                      {/* Crisp White Circular Logo Container with Soft Shadow */}
                      <div className="shrink-0 relative">
                        <div
                          style={{
                            width: "60px", height: "60px", borderRadius: "9999px",
                            background: "#FFFFFF",
                            boxShadow: "0 0 0 1px rgba(229, 72, 77, 0.12), 0 6px 16px -2px rgba(23, 32, 51, 0.08)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative", overflow: "hidden",
                          }}
                        >
                          <Image src="/justlogo.png" alt="Alayn AI" width={32} height={32}
                            style={{ width: "54%", height: "54%", objectFit: "contain", position: "relative", zIndex: 1 }}
                          />
                        </div>
                      </div>

                      {/* Typography Hierarchy */}
                      <div className="flex flex-col justify-center min-w-0 space-y-1">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#E5484D]" />
                          <p style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.12em",
                            textTransform: "uppercase", color: "#E5484D" }}>
                            RESTAURANT INTELLIGENCE & ANALYTICS
                          </p>
                        </div>
                        <h2 style={{ fontSize: "clamp(22px, 2.2vw, 26px)", fontWeight: 800,
                          color: "#172033", letterSpacing: "-0.025em", lineHeight: 1.25 }}>
                          Ask Alayn AI
                        </h2>
                        <p style={{ fontSize: "13.5px", color: "#64748B",
                          lineHeight: 1.55, fontWeight: 400, maxWidth: "560px" }}
                        >
                          Forecast revenue surge, analyze inventory depletion, and optimize shift staffing — powered by live telemetry.
                        </p>
                      </div>
                    </div>

                    {/* Right Side: Sophisticated Compact CTA Button */}
                    <div className="shrink-0 w-full sm:w-auto flex justify-center sm:justify-end pt-2 md:pt-0">
                      <button
                        onClick={() => router.push("/dashboard/alayn-ai")}
                        style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "7px",
                          background: "linear-gradient(135deg, #E5484D 0%, #D3232A 100%)",
                          border: "1px solid rgba(229, 72, 77, 0.2)",
                          borderRadius: "12px",
                          padding: "10.5px 20px",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 3px 12px rgba(229, 72, 77, 0.25)",
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "linear-gradient(135deg, #EF5350 0%, #E5484D 100%)";
                          el.style.boxShadow = "0 5px 18px rgba(229, 72, 77, 0.38)";
                          el.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLElement;
                          el.style.background = "linear-gradient(135deg, #E5484D 0%, #D3232A 100%)";
                          el.style.boxShadow = "0 3px 12px rgba(229, 72, 77, 0.25)";
                          el.style.transform = "translateY(0)";
                        }}
                      >
                        Open Alayn AI
                        <ArrowUpRight style={{ width: "15px", height: "15px" }} />
                      </button>
                    </div>

                  </div>
                </section>
              </ElectricBorder>
            </div>



          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
