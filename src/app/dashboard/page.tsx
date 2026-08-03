"use client";

import React, { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/redux/store/hooks";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import { useBranch } from "@/lib/BranchContext";
import { useCreateOutletMutation } from "@/redux/slices/outletApiSlice";
import { useGetKpisQuery } from "@/redux/slices/dashboardApiSlice";

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
  LineChart
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
  Bar
} from "recharts";

interface PageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type RangeType = "TODAY" | "7_DAY" | "14_DAY" | "THIS_MONTH";

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

  const [dateRange, setDateRange] = useState<RangeType>("TODAY");

  const { data: kpiData, isLoading: isKpiLoading } = useGetKpisQuery(
    { outletId, range: dateRange },
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

  // Mocked Staff Data for Shift Roster Matrix
  const staffMatrix = [
    { id: 1, name: "Arjun Mehta", role: "Head Chef", status: "ON_SHIFT", hours: "09:00 - 18:00", overlap: false },
    { id: 2, name: "Priya Sharma", role: "Floor Manager", status: "ON_SHIFT", hours: "10:00 - 19:00", overlap: true },
    { id: 3, name: "Rahul Verma", role: "Sous Chef", status: "ON_LEAVE", hours: "-", overlap: false },
    { id: 4, name: "Neha Gupta", role: "Server", status: "ON_SHIFT", hours: "12:00 - 21:00", overlap: true },
    { id: 5, name: "Amit Kumar", role: "Bartender", status: "UPCOMING", hours: "17:00 - 01:00", overlap: false },
  ];

  // Queue Data aligned with backend Order schema (Order #, Status, Wait Time, Item Count)
  const queueData = [
    { ticket: "#ORD-8921", status: "PREPARING", timeIn: "12 mins", items: 4 },
    { ticket: "#ORD-8922", status: "SENT_TO_KITCHEN", timeIn: "8 mins", items: 2 },
    { ticket: "#ORD-8923", status: "PREPARING", timeIn: "18 mins", items: 6, delayed: true },
    { ticket: "#ORD-8924", status: "READY", timeIn: "4 mins", items: 1 },
  ];

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
    { name: "Dine-in", value: 65, color: "#1e40af" },
    { name: "Delivery", value: 20, color: "#3b82f6" },
    { name: "Takeaway", value: 15, color: "#d97706" },
  ];

  const topItemsData = [
    { name: "Butter Chicken", volume: 142 },
    { name: "Paneer Tikka", volume: 118 },
    { name: "Garlic Naan", volume: 204 },
    { name: "Dal Makhani", volume: 98 },
    { name: "Biryani", volume: 85 },
  ];

  const getRangeLabel = (range: RangeType) => {
    switch (range) {
      case "TODAY": return "Today";
      case "7_DAY": return "7 Days";
      case "14_DAY": return "14 Days";
      case "THIS_MONTH": return "This Month";
    }
  };

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
          <div className="py-6 px-4 sm:px-6 max-w-[1400px] mx-auto space-y-6 font-sans">
            
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-300 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600">Live Telemetry Active</span>
                </div>
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Operator Console</h1>
                <p className="text-sm text-zinc-500 font-medium">
                  {activeBranch?.name || "All Branches"} • Real-time operational data
                </p>
              </div>

              <div className="flex items-center bg-zinc-100 p-1 rounded-lg border border-zinc-200">
                {(["TODAY", "7_DAY", "14_DAY", "THIS_MONTH"] as RangeType[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                      dateRange === range ? "bg-white shadow-sm border border-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {getRangeLabel(range)}
                  </button>
                ))}
              </div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "NET REVENUE", value: kpiData?.totalRevenue?.value || "₹1,24,500", prev: "₹1,18,200", trend: kpiData?.totalRevenue?.change || "+5.3%", positive: kpiData?.totalRevenue?.isPositive ?? true },
                { label: "ORDER VOLUME", value: "342", prev: "310", trend: "+10.3%", positive: true },
                { label: "AVG ORDER VALUE", value: "₹364", prev: "₹381", trend: "-4.4%", positive: false },
                { label: "GROSS MARGIN", value: kpiData?.netMargin?.value || "68.4%", prev: "67.2%", trend: kpiData?.netMargin?.change || "+1.2%", positive: kpiData?.netMargin?.isPositive ?? true },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-zinc-50 p-1 rounded-xl border border-zinc-200/80 shadow-xs">
                  <div className="bg-white rounded-lg p-4 h-full border border-zinc-100/50 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">{kpi.label}</span>
                    <div className="mt-3 flex items-end justify-between">
                      <span className="text-2xl font-black text-zinc-900 tabular-nums tracking-tight">{kpi.value}</span>
                      <div className={`flex items-center gap-1 text-xs font-bold ${kpi.positive ? "text-emerald-600" : "text-red-600"}`}>
                        {kpi.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {kpi.trend}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-400 font-medium font-mono">Prev: {kpi.prev}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Revenue Area Chart */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="bg-zinc-50 p-1 rounded-xl border border-zinc-200/80 shadow-xs h-full">
                  <div className="bg-white rounded-lg border border-zinc-100/50 p-5 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <LineChart className="h-4 w-4 text-blue-700" />
                        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Sales Velocity</h3>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">{getRangeLabel(dateRange)}</span>
                    </div>
                    <div className="flex-1 min-h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1e40af" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#1e40af" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Revenue']}
                            labelStyle={{ color: '#71717a', fontWeight: 'bold', fontSize: '12px' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#1e40af" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Channels Donut */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="bg-zinc-50 p-1 rounded-xl border border-zinc-200/80 shadow-xs h-full">
                  <div className="bg-white rounded-lg border border-zinc-100/50 p-5 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <PieChartIcon className="h-4 w-4 text-amber-600" />
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Order Channels</h3>
                    </div>
                    <div className="flex-1 min-h-[180px] flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {channelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px', fontWeight: 'bold' }}
                             itemStyle={{ color: '#18181b' }}
                             formatter={(value: any) => [`${value}%`, 'Share']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-zinc-900 tabular-nums leading-none">100<span className="text-sm text-zinc-400">%</span></span>
                      </div>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                      {channelData.map((channel, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: channel.color }}></span>
                          <span className="text-[11px] font-bold text-zinc-600">{channel.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: Live Orders Telemetry & Top Items & Staff Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Live Kitchen/Order Telemetry (4 cols) */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="bg-zinc-50 p-1 rounded-xl border border-zinc-200/80 shadow-xs h-full flex flex-col">
                  <div className="bg-white rounded-lg border border-zinc-100/50 h-full flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-zinc-700" />
                        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Active Orders</h3>
                      </div>
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded uppercase border border-amber-200 tracking-wider">
                        1 Delayed
                      </span>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50/50 border-b border-zinc-100 text-[9px] uppercase font-bold text-zinc-500 tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Order ID</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Wait Time</th>
                            <th className="px-3 py-2 text-right">Items</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {queueData.map((row, i) => (
                            <tr key={i} className="hover:bg-zinc-50/30 transition-colors">
                              <td className="px-3 py-2 font-mono font-bold text-zinc-800 text-[11px]">{row.ticket}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                  row.status === "PREPARING" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  row.status === "SENT_TO_KITCHEN" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {row.status.replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono text-[11px] text-zinc-600">
                                {row.timeIn}
                                {row.delayed && <AlertTriangle className="inline h-2.5 w-2.5 text-red-500 ml-1 mb-0.5" />}
                              </td>
                              <td className="px-3 py-2 text-[11px] font-semibold text-zinc-700 text-right">{row.items}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-3 border-t border-zinc-100 bg-zinc-50/50 flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                       <span>Tables: 18/24</span>
                       <span>Avg Prep: 12.4m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Middle Column: Top Selling Items Bar Chart (4 cols) */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="bg-zinc-50 p-1 rounded-xl border border-zinc-200/80 shadow-xs h-full">
                  <div className="bg-white rounded-lg border border-zinc-100/50 p-5 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart2 className="h-4 w-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Top Selling Items</h3>
                    </div>
                    <div className="flex-1 min-h-[160px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={topItemsData} margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#3f3f46", fontWeight: 600 }} width={85} />
                          <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px', fontWeight: 'bold' }}
                            formatter={(value: any) => [`${value} items`, 'Sold']}
                          />
                          <Bar dataKey="volume" fill="#1e40af" radius={[0, 4, 4, 0]} barSize={16}>
                             {topItemsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? "#1e40af" : index === 1 ? "#3b82f6" : "#cbd5e1"} />
                             ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Shift Matrix (4 cols) */}
              <div className="lg:col-span-4 flex flex-col">
                <div className="bg-zinc-50 p-1 rounded-xl border border-zinc-200/80 shadow-xs h-full flex flex-col">
                  <div className="bg-white rounded-lg border border-zinc-100/50 h-full flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between sticky top-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-zinc-700" />
                        <h3 className="text-sm font-bold text-zinc-900 tracking-tight">Shift Coverage</h3>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <div className="divide-y divide-zinc-100">
                        {staffMatrix.slice(0,4).map((staff) => (
                          <div key={staff.id} className="p-3.5 flex items-center justify-between hover:bg-zinc-50/50 transition-colors">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-zinc-900">{staff.name}</span>
                              <span className="text-[9px] text-zinc-500 font-medium">{staff.role}</span>
                            </div>
                            <div className="flex items-center gap-2 text-right">
                              <div className="flex flex-col items-end">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                  staff.status === "ON_SHIFT" ? "text-emerald-600" :
                                  staff.status === "ON_LEAVE" ? "text-red-500" : "text-zinc-400"
                                }`}>
                                  {staff.status.replace("_", " ")}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500">{staff.hours}</span>
                              </div>
                              {staff.overlap && <div className="h-1.5 w-1.5 rounded-full bg-amber-400" title="Overlap Warning" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
