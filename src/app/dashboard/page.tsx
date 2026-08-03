"use client";

import React, { useState, use, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store/hooks";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { useBranch } from "@/lib/BranchContext";
import { useCreateOutletMutation } from "@/redux/slices/outletApiSlice";
import { useGetKpisQuery } from "@/redux/slices/dashboardApiSlice";
import { useGetOrdersQuery } from "@/redux/slices/orderApiSlice";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import { useGetMenuItemsQuery } from "@/redux/slices/menuApiSlice";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

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
  ExternalLink
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
    { outletId, range: dateRange },
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

  const [createOutlet, { isLoading: isSubmitting }] = useCreateOutletMutation();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  // AI Insights state
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  const isInitialLoading = loading || isKpiLoading;
  const hasNoOutlets = !isInitialLoading && !isDemo && branches.length === 0;

  const handleFormChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCreateOutletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    try {
      await createOutlet(formData).unwrap();
      await refreshBranches();
    } catch (err: any) {
      setSubmitError(err?.data?.message || "An error occurred while creating the outlet.");
    }
  };

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
    } else {
      list = [
        { id: "emp-1", name: "Arjun Mehta", role: "Head Chef", status: "ON_SHIFT", hours: "09:00 - 18:00" },
        { id: "emp-2", name: "Priya Sharma", role: "Floor Manager", status: "ON_SHIFT", hours: "10:00 - 19:00" },
        { id: "emp-3", name: "Rahul Verma", role: "Sous Chef", status: "ON_LEAVE", hours: "-" },
        { id: "emp-4", name: "Sunita Roy", role: "Kitchen Lead", status: "ON_SHIFT", hours: "08:00 - 17:00" },
      ];
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

    return filtered.length > 0 ? filtered : list.slice(0, 4);
  }, [employeesResponse]);

  // Process Real Active Orders Data (Top 4 View)
  const { activeOrdersList, activeStats } = useMemo(() => {
    let rawOrders = Array.isArray(realOrders) ? realOrders : (realOrders as any)?.data || [];

    if (!rawOrders || rawOrders.length === 0) {
      rawOrders = [
        {
          id: "ord-8921",
          orderNo: "#ORD-8921",
          orderSource: "TABLE",
          tableNo: "T-04",
          status: "PREPARING",
          totalAmount: 1450,
        },
        {
          id: "ord-8922",
          orderNo: "#ORD-8922",
          orderSource: "COUNTER",
          tableNo: "Counter",
          status: "SENT_TO_KITCHEN",
          totalAmount: 680,
        },
        {
          id: "ord-8923",
          orderNo: "#ORD-8923",
          orderSource: "QR",
          tableNo: "T-12",
          status: "PREPARING",
          totalAmount: 2100,
        },
        {
          id: "ord-8924",
          orderNo: "#ORD-8924",
          orderSource: "DELIVERY",
          tableNo: "Zomato #402",
          status: "READY",
          totalAmount: 420,
        },
      ];
    }

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

  // Top Selling Items Analytics
  const topItemsAnalytics = useMemo(() => {
    const itemsArray = [
      { name: "Butter Chicken", volume: 142, revenue: 59640, category: "Main Course" },
      { name: "Garlic Naan", volume: 204, revenue: 16320, category: "Breads" },
      { name: "Paneer Tikka", volume: 118, revenue: 37760, category: "Starters" },
      { name: "Dal Makhani", volume: 98, revenue: 27440, category: "Main Course" },
      { name: "Biryani", volume: 85, revenue: 29750, category: "Rice" },
    ];

    const totalVolume = itemsArray.reduce((acc, item) => acc + item.volume, 0);
    const totalRevenue = itemsArray.reduce((acc, item) => acc + item.revenue, 0);

    return {
      topItems: itemsArray,
      totalVolume,
      totalRevenue,
    };
  }, []);

  const revenueData = [
    { time: "10 AM", revenue: 2400 },
    { time: "12 PM", revenue: 8900 },
    { time: "2 PM", revenue: 14200 },
    { time: "4 PM", revenue: 6400 },
    { time: "6 PM", revenue: 11000 },
    { time: "8 PM", revenue: 23500 },
    { time: "10 PM", revenue: 28400 },
  ];

  const channelData = [
    { name: "Dine-in", value: 65, color: "#2563eb" },
    { name: "Delivery", value: 20, color: "#3b82f6" },
    { name: "Takeaway", value: 15, color: "#d97706" },
  ];

  return (
    <AuthGuard>
      <DashboardLayout>
        {isInitialLoading ? (
          <DashboardSkeleton />
        ) : hasNoOutlets ? (
          <div className="max-w-3xl mx-auto py-8">
            <div className="bg-white rounded-xl p-8 shadow-sm border border-zinc-200">
              <h1 className="text-xl font-bold text-zinc-900 mb-2">Register Your First Outlet</h1>
              <p className="text-sm text-zinc-500 mb-6">Complete setup to access real-time telemetry.</p>
              <form onSubmit={handleCreateOutletSubmit} className="space-y-4">
                {submitError && <div className="text-red-600 text-sm">{submitError}</div>}
                <input type="text" placeholder="Outlet Name" value={formData.name} onChange={handleFormChange("name")} className="w-full border border-zinc-300 rounded-md p-2 text-sm" />
                <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold">
                  {isSubmitting ? "Saving..." : "Create Outlet"}
                </button>
              </form>
            </div>
          </div>
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
                { label: "NET REVENUE", value: kpiData?.totalRevenue?.value || "₹1,24,500", prev: "₹1,18,200", trend: kpiData?.totalRevenue?.change || "+5.3%", positive: kpiData?.totalRevenue?.isPositive ?? true, route: "/performance" },
                { label: "ACTIVE ORDERS", value: `${activeStats.activeCount}`, prev: "310", trend: "+10.3%", positive: true, route: "/pos" },
                { label: "AVG ORDER VALUE", value: "₹364", prev: "₹381", trend: "-4.4%", positive: false, route: "/orders" },
                { label: "GROSS MARGIN", value: kpiData?.netMargin?.value || "68.4%", prev: "67.2%", trend: kpiData?.netMargin?.change || "+1.2%", positive: kpiData?.netMargin?.isPositive ?? true, route: "/performance" },
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
                <div className="h-[240px] w-full">
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
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                  {channelData.map((ch, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                        <span className="text-[11px] font-semibold text-slate-600">{ch.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800 tabular-nums">{ch.value}%</span>
                    </div>
                  ))}
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
                      onClick={() => router.push("/pos")}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors bg-blue-50/60 px-3 py-1.5 rounded-xl border border-blue-200/60"
                    >
                      View All <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/70 flex-1">
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
                  {managersAndKitchenStaff.slice(0, 4).map((staff: any) => {
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
                  })}
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
            </section>



                 {/* ========================================================================= */}
            {/* FULL WIDTH SECTION 4: ALAYN AI OPERATIONAL INSIGHTS (PROFESSIONAL LIGHT THEME) */}
            {/* ========================================================================= */}
            <section className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-7 space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold tracking-tight text-slate-800">AlaynAI Executive Intelligence</h2>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> ALAYN AI ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-normal">
                      Real-time generative insights for revenue optimization, waste prevention &amp; staffing efficiency
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsAiGenerating(true);
                    setTimeout(() => setIsAiGenerating(false), 1200);
                  }}
                  disabled={isAiGenerating}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <Zap className={`h-3.5 w-3.5 text-indigo-600 ${isAiGenerating ? "animate-spin" : ""}`} />
                  {isAiGenerating ? "Running AlaynAI..." : "Refresh Intelligence"}
                </button>
              </div>

              {/* 2-Column Split: Strategic Directives (Left) + Quick AI Prompts & Assistant (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Column: 4 Strategic Directives with Direct Module Actions */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Live AI Directives</div>
                  
                  {[
                    {
                      title: "Peak Evening Surge Forecast",
                      badge: "ESTIMATED UPLIFT: +₹14,500",
                      badgeColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
                      desc: "Predicting a 38% demand surge between 7:30 PM - 9:30 PM based on sales velocity.",
                      actionLabel: "Open Kitchen Display",
                      route: "/kitchen",
                      icon: TrendingUp,
                      iconColor: "text-emerald-600",
                    },
                    {
                      title: "Stock & Inventory Threshold Alert",
                      badge: "REORDER REQUIRED",
                      badgeColor: "bg-amber-50 text-amber-800 border-amber-200",
                      desc: "Dairy items (Milk & Oat Milk) moving 1.4x faster than benchmark. Threshold reached in 2 days.",
                      actionLabel: "Draft Purchase Order",
                      route: "/inventory",
                      icon: AlertTriangle,
                      iconColor: "text-amber-600",
                    },
                    {
                      title: "Menu Item Pair Optimization",
                      badge: "MARGIN UPLIFT: +14%",
                      badgeColor: "bg-blue-50 text-blue-800 border-blue-200",
                      desc: "Pairing Garlic Naan with Paneer Tikka increased ticket size by +₹48 over 24 hrs.",
                      actionLabel: "Optimize Menu Combo",
                      route: "/menu",
                      icon: Sparkles,
                      iconColor: "text-blue-600",
                    },
                    {
                      title: "Shift Staffing Ratio",
                      badge: "OPTIMAL COVERAGE",
                      badgeColor: "bg-purple-50 text-purple-800 border-purple-200",
                      desc: "Manager and Chef ratio is operating at 94% efficiency for active table capacity.",
                      actionLabel: "View Staff Roster",
                      route: "/workforce",
                      icon: Users,
                      iconColor: "text-purple-600",
                    },
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${card.iconColor}`} />
                            <span className="text-xs font-bold text-slate-800">{card.title}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${card.badgeColor}`}>
                              {card.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-normal leading-relaxed">{card.desc}</p>
                        </div>

                        <button
                          onClick={() => router.push(card.route)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-all flex items-center gap-1 shrink-0 self-start sm:self-center"
                        >
                          {card.actionLabel} <ArrowRight className="h-3 w-3 text-slate-500" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: AI Assistant & Prompt Trigger Shortcuts */}
                <div className="lg:col-span-5 space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">AlaynAI Executive Assistant</span>
                    </div>

                    <p className="text-xs text-slate-500 font-normal leading-relaxed">
                      Ask AlaynAI to analyze margins, generate sales forecasts, or detect operational anomalies.
                    </p>

                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Suggested Prompts:</div>
                      {[
                        "Forecast weekend revenue surge",
                        "Detect inventory waste anomalies",
                        "Optimize peak shift roster",
                      ].map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => setAiPrompt(promptText)}
                          className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50/60 text-xs font-semibold text-slate-700 hover:text-blue-700 rounded-xl border border-slate-200/80 transition-all flex items-center justify-between group"
                        >
                          <span>&quot;{promptText}&quot;</span>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ask AlaynAI for operational analysis..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="w-full pl-3 pr-16 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                      />
                      <button
                        onClick={() => {
                          if (!aiPrompt) return;
                          setIsAiGenerating(true);
                          setTimeout(() => {
                            setIsAiGenerating(false);
                            setAiPrompt("");
                          }, 1000);
                        }}
                        className="absolute right-1 top-1 px-3 py-1 bg-[#D3232A] hover:bg-[#b81d23] text-white font-semibold text-xs rounded-lg transition-all"
                      >
                        Ask
                      </button>
                    </div>
                  </div>
                </div>

              </div>

            </section>

          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
