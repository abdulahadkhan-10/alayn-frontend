"use client";

import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import {
  useGetWasteLogsQuery,
  useLogWasteMutation,
  useGetWasteSummaryQuery,
  WasteLogApi,
} from "@/redux/slices/wasteApiSlice";
import { useGetItemsQuery } from "@/redux/slices/inventoryApiSlice";
import {
  Trash2,
  AlertTriangle,
  IndianRupee,
  Loader2,
  CheckCircle2,
  ArrowUpDown,
  Filter,
  Download,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  Package,
  Plus,
  X,
  PieChart,
  Building2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";

type PeriodFilter = "THIS_MONTH" | "LAST_MONTH" | "THIS_YEAR" | "ALL_TIME";

export default function WasteManagementPage() {
  const { activeBranch, loading: branchLoading } = useBranch();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // RTK Queries
  const {
    data: wasteLogsData,
    isLoading: isLoadingLogs,
    isFetching: isFetchingLogs,
    refetch: refetchLogs,
  } = useGetWasteLogsQuery(undefined, { skip: !activeBranch });

  const {
    data: wasteSummary,
    isLoading: isLoadingSummary,
    isFetching: isFetchingSummary,
    refetch: refetchSummary,
  } = useGetWasteSummaryQuery(undefined, { skip: !activeBranch });

  const { data: itemsData, isLoading: isLoadingItems } = useGetItemsQuery(undefined, { skip: !activeBranch });

  const items = itemsData?.items || [];
  const logs: WasteLogApi[] = Array.isArray(wasteLogsData)
    ? wasteLogsData
    : (wasteLogsData?.data || []);

  const isAllOutlets = activeBranch?.id === "all";

  // Form State & Mutation
  const [logWaste, { isLoading: isSubmitting }] = useLogWasteMutation();
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState<"SPOILAGE" | "OVER_PREP" | "RETURN" | "ERROR">("SPOILAGE");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Time Period & Analytics Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("THIS_MONTH");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "costAtLoggingPaise" | "quantity">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterReason, setFilterReason] = useState<string>("ALL");
  const [wasteOutletFilter, setWasteOutletFilter] = useState<string>("ALL");
  const [wastePage, setWastePage] = useState(1);
  const [wastePageSize, setWastePageSize] = useState(10);

  const toggleSort = (field: "createdAt" | "costAtLoggingPaise" | "quantity") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const selectedItem = items.find((i) => i.id === selectedItemId);
  const numQty = Number(quantity) || 0;
  const calculatedCostRupees =
    selectedItem && numQty ? (numQty * (selectedItem.unitCostPaise / 100)).toFixed(2) : "0.00";
  const remainingStock = selectedItem ? selectedItem.currentStock - numQty : 0;

  const isPageLoading = branchLoading || isLoadingLogs || isLoadingSummary;

  const handleManualRefresh = () => {
    refetchLogs();
    refetchSummary();
  };

  // Helper date logic
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Period Filtered Logs
  const periodFilteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const d = new Date(log.createdAt);
      if (selectedPeriod === "THIS_MONTH") {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (selectedPeriod === "LAST_MONTH") {
        const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
        return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
      }
      if (selectedPeriod === "THIS_YEAR") {
        return d.getFullYear() === currentYear;
      }
      return true; // ALL_TIME
    });
  }, [logs, selectedPeriod, currentYear, currentMonth]);

  // Analytics Metrics
  const periodTotalLossRupees = useMemo(() => {
    const paise = periodFilteredLogs.reduce((acc, log) => acc + (log.costAtLoggingPaise || 0), 0);
    return paise / 100;
  }, [periodFilteredLogs]);

  const yearToDateLossRupees = useMemo(() => {
    const paise = logs
      .filter((l) => new Date(l.createdAt).getFullYear() === currentYear)
      .reduce((acc, l) => acc + (l.costAtLoggingPaise || 0), 0);
    return paise / 100;
  }, [logs, currentYear]);

  // Calculate Month-over-Month Trend
  const momTrendPercentage = useMemo(() => {
    const thisMonthPaise = logs
      .filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, l) => acc + (l.costAtLoggingPaise || 0), 0);

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonthPaise = logs
      .filter((l) => {
        const d = new Date(l.createdAt);
        return d.getFullYear() === lastMonthDate.getFullYear() && d.getMonth() === lastMonthDate.getMonth();
      })
      .reduce((acc, l) => acc + (l.costAtLoggingPaise || 0), 0);

    if (lastMonthPaise === 0) return 0;
    const diff = ((thisMonthPaise - lastMonthPaise) / lastMonthPaise) * 100;
    return Number(diff.toFixed(1));
  }, [logs, currentYear, currentMonth]);

  // Top Wasted Ingredient in Selected Period
  const topWastedIngredient = useMemo(() => {
    const costMap: Record<string, { name: string; unit: string; totalCostPaise: number; count: number }> = {};
    periodFilteredLogs.forEach((log) => {
      const name = log.item?.name || "Unknown Item";
      const unit = log.item?.unit || "units";
      if (!costMap[name]) {
        costMap[name] = { name, unit, totalCostPaise: 0, count: 0 };
      }
      costMap[name].totalCostPaise += log.costAtLoggingPaise || 0;
      costMap[name].count += 1;
    });

    const sorted = Object.values(costMap).sort((a, b) => b.totalCostPaise - a.totalCostPaise);
    return sorted[0] || null;
  }, [periodFilteredLogs]);

  // Reason Breakdown Stats for Selected Period
  const reasonBreakdown = useMemo(() => {
    const map: Record<string, { count: number; totalCostPaise: number }> = {
      SPOILAGE: { count: 0, totalCostPaise: 0 },
      OVER_PREP: { count: 0, totalCostPaise: 0 },
      ERROR: { count: 0, totalCostPaise: 0 },
      RETURN: { count: 0, totalCostPaise: 0 },
    };

    periodFilteredLogs.forEach((log) => {
      if (map[log.reason]) {
        map[log.reason].count += 1;
        map[log.reason].totalCostPaise += log.costAtLoggingPaise || 0;
      }
    });

    const totalPaise = periodTotalLossRupees * 100;

    return [
      { key: "SPOILAGE", label: "Spoiled / Expired", color: "bg-[#D3232A]", textCls: "text-red-700" },
      { key: "OVER_PREP", label: "Over-Prepared", color: "bg-amber-500", textCls: "text-amber-700" },
      { key: "ERROR", label: "Kitchen Error / Spillage", color: "bg-orange-500", textCls: "text-orange-700" },
      { key: "RETURN", label: "Customer Return", color: "bg-blue-500", textCls: "text-blue-700" },
    ].map((item) => {
      const stat = map[item.key] || { count: 0, totalCostPaise: 0 };
      const percentage = totalPaise > 0 ? ((stat.totalCostPaise / totalPaise) * 100).toFixed(1) : "0.0";
      return {
        ...item,
        count: stat.count,
        costRupees: (stat.totalCostPaise / 100).toFixed(2),
        percentage: Number(percentage),
      };
    });
  }, [periodFilteredLogs, periodTotalLossRupees]);

  const availableOutlets = useMemo(() => {
    const map = new Map<string, string>();
    logs.forEach((l) => {
      if (l.outlet) map.set(l.outlet.id, l.outlet.name);
      else if (l.item?.outlet) map.set(l.item.outlet.id, l.item.outlet.name);
    });
    items.forEach((i) => {
      if (i.outlet) map.set(i.outlet.id, i.outlet.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [logs, items]);

  // Processed Logs for Table
  const processedLogs = useMemo(() => {
    let result = [...periodFilteredLogs];

    if (isAllOutlets && wasteOutletFilter !== "ALL") {
      result = result.filter(
        (l) => l.outlet?.id === wasteOutletFilter || l.outletId === wasteOutletFilter || l.item?.outlet?.id === wasteOutletFilter
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.item?.name.toLowerCase().includes(q) ||
          l.item?.sku.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q)
      );
    }

    if (filterReason !== "ALL") {
      result = result.filter((l) => l.reason === filterReason);
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      }
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [periodFilteredLogs, isAllOutlets, wasteOutletFilter, searchTerm, filterReason, sortField, sortOrder]);

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedItemId) return setFeedback({ type: "error", msg: "Please choose an ingredient." });

    if (!Number.isFinite(numQty) || numQty <= 0) {
      return setFeedback({ type: "error", msg: "Enter a valid quantity greater than 0." });
    }

    if (selectedItem && numQty > selectedItem.currentStock) {
      return setFeedback({
        type: "error",
        msg: `Wasted quantity (${numQty} ${selectedItem.unit}) cannot exceed stock balance (${selectedItem.currentStock} ${selectedItem.unit}).`,
      });
    }

    try {
      await logWaste({
        itemId: selectedItemId,
        quantity: numQty,
        reason,
      }).unwrap();

      setFeedback({ type: "success", msg: "Wastage recorded successfully! Stock balance updated." });
      setQuantity("");
      setSelectedItemId("");
      refetchLogs();
      refetchSummary();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.data?.message || err?.message || "Failed to record wastage." });
    }
  };

  const handleExportCSV = () => {
    if (processedLogs.length === 0) return alert("No waste logs to export.");

    const headers = ["Logged Date", "Item Name", "SKU", "Category", "Quantity", "Unit", "Loss Value (INR)", "Reason"];
    const rows = processedLogs.map((log) => [
      new Date(log.createdAt).toLocaleString("en-IN"),
      `"${log.item?.name || 'Item'}"`,
      `"${log.item?.sku || ''}"`,
      `"${log.item?.category || ''}"`,
      log.quantity,
      log.item?.unit || "",
      (log.costAtLoggingPaise / 100).toFixed(2),
      log.reason,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `waste_report_${selectedPeriod.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full gap-5 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-16 font-sans text-zinc-900">
        
        {/* Header & Period Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Waste &amp; Spoilage Analytics
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-3 py-0.5 text-xs font-bold text-[#D3232A]">
                <Trash2 className="h-3 w-3" /> {activeBranch?.name || "Main Branch"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Monitor monthly &amp; yearly inventory loss, analyze spoilage patterns, and log stock waste.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Period Selector */}
            <div className="bg-zinc-100 p-1 rounded-xl border border-zinc-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedPeriod("THIS_MONTH")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === "THIS_MONTH"
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                This Month
              </button>

              <button
                type="button"
                onClick={() => setSelectedPeriod("LAST_MONTH")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === "LAST_MONTH"
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Last Month
              </button>

              <button
                type="button"
                onClick={() => setSelectedPeriod("THIS_YEAR")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === "THIS_YEAR"
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                2026 YTD
              </button>

              <button
                type="button"
                onClick={() => setSelectedPeriod("ALL_TIME")}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedPeriod === "ALL_TIME"
                    ? "bg-zinc-900 text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All Time
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" /> Export
            </button>
          </div>
        </div>

        {/* Analytics Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Selected Period Waste Loss */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {selectedPeriod === "THIS_MONTH"
                    ? "This Month Loss"
                    : selectedPeriod === "LAST_MONTH"
                    ? "Last Month Loss"
                    : selectedPeriod === "THIS_YEAR"
                    ? "2026 Year-To-Date Loss"
                    : "All Time Waste Loss"}
                </span>
                <div className="h-8 w-8 rounded-xl bg-red-50 text-[#D3232A] flex items-center justify-center border border-red-100">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-2 tracking-tight">
                ₹{periodTotalLossRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
            </div>
            
            <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500 font-medium">{periodFilteredLogs.length} Waste Logs</span>
              {momTrendPercentage !== 0 && selectedPeriod === "THIS_MONTH" && (
                <span className={`inline-flex items-center gap-1 font-bold ${
                  momTrendPercentage > 0 ? "text-rose-600" : "text-emerald-600"
                }`}>
                  {momTrendPercentage > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(momTrendPercentage)}% vs last month
                </span>
              )}
            </div>
          </div>

          {/* Card 2: Year-To-Date Loss */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">2026 Total Loss (YTD)</span>
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 mt-2 tracking-tight">
                ₹{yearToDateLossRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
              Daily Avg: <strong className="text-zinc-900 font-bold">₹{(yearToDateLossRupees / (now.getDate() || 1)).toFixed(0)}/day</strong> this month
            </div>
          </div>

          {/* Card 3: Top Wasted Item */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Top Loss Ingredient</span>
                <div className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              {topWastedIngredient ? (
                <>
                  <h3 className="text-lg font-bold text-zinc-900 mt-2 truncate">
                    {topWastedIngredient.name}
                  </h3>
                  <p className="text-xs font-bold text-red-600 mt-0.5">
                    ₹{(topWastedIngredient.totalCostPaise / 100).toFixed(2)} total loss
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-zinc-400 mt-3">No waste recorded</p>
              )}
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
              {topWastedIngredient ? `${topWastedIngredient.count} waste incidents logged` : "Clean stock operation"}
            </div>
          </div>

          {/* Card 4: Primary Loss Reason */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Primary Waste Cause</span>
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <PieChart className="h-4 w-4" />
                </div>
              </div>
              {(() => {
                const topReason = [...reasonBreakdown].sort((a, b) => b.percentage - a.percentage)[0];
                return topReason && topReason.percentage > 0 ? (
                  <>
                    <h3 className="text-lg font-bold text-zinc-900 mt-2 truncate">
                      {topReason.label}
                    </h3>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">
                      {topReason.percentage}% of total period loss (₹{topReason.costRupees})
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-semibold text-zinc-400 mt-3">No data recorded</p>
                );
              })()}
            </div>

            <div className="mt-3 pt-2.5 border-t border-zinc-100 text-xs text-zinc-500 font-medium">
              Click reason bars below to filter table
            </div>
          </div>

        </div>

        {/* Visual Reason Breakdown Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Waste Breakdown by Cause</h3>
              <p className="text-xs text-zinc-500 font-medium">Rupee and percentage contribution for the selected time period</p>
            </div>
            {filterReason !== "ALL" && (
              <button
                onClick={() => setFilterReason("ALL")}
                className="text-xs font-bold text-[#D3232A] underline hover:text-[#b01e23]"
              >
                Clear reason filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reasonBreakdown.map((item) => {
              const isSelected = filterReason === item.key;
              return (
                <div
                  key={item.key}
                  onClick={() => setFilterReason(isSelected ? "ALL" : item.key)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? "border-[#D3232A] bg-red-50/50 ring-2 ring-red-200"
                      : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/80 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${item.textCls}`}>{item.label}</span>
                    <span className="text-xs font-black text-zinc-900">{item.percentage}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-200 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${item.color}`}
                      style={{ width: `${Math.min(100, Math.max(4, item.percentage))}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-500 font-semibold">
                    <span>₹{item.costRupees}</span>
                    <span>{item.count} log(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-2xs ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <p className="font-semibold">{feedback.msg}</p>
            </div>
            <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Workspace: Form Card + Logs Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Form Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs h-fit">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100">
              <div className="rounded-xl bg-red-50 p-2 text-[#D3232A]">
                <Plus className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Record Stock Wastage</h2>
                <p className="text-xs text-zinc-500 font-medium">Log item loss &amp; update inventory stock</p>
              </div>
            </div>

            <form onSubmit={handleLogWaste} className="space-y-4">
              <div>
                <label htmlFor="waste-item-select" className="block text-xs font-bold text-zinc-800 mb-1">
                  Ingredient / Stock Item
                </label>
                {isLoadingItems || branchLoading ? (
                  <Skeleton height={40} borderRadius={12} />
                ) : (
                  <select
                    required
                    id="waste-item-select"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#D3232A] focus:outline-none bg-white text-zinc-900 shadow-2xs"
                  >
                    <option value="">-- Choose ingredient from inventory --</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit}){isAllOutlets || i.outlet ? ` — [${i.outlet?.name || 'Main'}]` : ''} — Available: {i.currentStock}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="waste-reason-select" className="block text-xs font-bold text-zinc-800 mb-1">
                  Reason for Waste
                </label>
                <select
                  id="waste-reason-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-semibold focus:border-[#D3232A] focus:outline-none bg-white text-zinc-900 shadow-2xs"
                >
                  <option value="SPOILAGE">Spoiled / Expired</option>
                  <option value="OVER_PREP">Over-Prepared</option>
                  <option value="ERROR">Kitchen Error / Spillage</option>
                  <option value="RETURN">Customer Return</option>
                </select>
              </div>

              <div>
                <label htmlFor="waste-quantity-input" className="block text-xs font-bold text-zinc-800 mb-1">
                  Wasted Quantity ({selectedItem?.unit || "units"})
                </label>
                <input
                  id="waste-quantity-input"
                  type="number"
                  step="any"
                  min="0.001"
                  placeholder="Enter quantity amount..."
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-[#D3232A] focus:outline-none shadow-2xs"
                />
              </div>

              {/* Form Live Calculation Card */}
              {selectedItem && numQty > 0 && (
                <div className="rounded-xl bg-red-50/80 border border-red-200 p-3.5 space-y-2 text-xs text-red-950 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Calculated Loss:</span>
                    <strong className="text-red-700 text-sm font-black">₹{calculatedCostRupees}</strong>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-medium">
                    {numQty} {selectedItem.unit} × ₹{(selectedItem.unitCostPaise / 100).toFixed(2)} / unit
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-red-200/60 text-center">
                    <div className="bg-white p-1.5 rounded-lg border border-red-100">
                      <span className="block text-[10px] text-zinc-400 font-bold">CURRENT STOCK</span>
                      <strong className="text-xs text-zinc-900">{selectedItem.currentStock} {selectedItem.unit}</strong>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-red-100">
                      <span className="block text-[10px] text-zinc-400 font-bold">REMAINING</span>
                      <strong className={`text-xs ${remainingStock < selectedItem.reorderThreshold ? "text-red-600" : "text-emerald-700"}`}>
                        {Number(remainingStock.toFixed(2))} {selectedItem.unit}
                      </strong>
                    </div>
                  </div>
                  {remainingStock < selectedItem.reorderThreshold && (
                    <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 pt-0.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Remaining stock will drop below min threshold!
                    </p>
                  )}
                </div>
              )}

              <button
                id="submit-waste-btn"
                type="submit"
                disabled={isSubmitting || !selectedItemId || numQty <= 0}
                className="w-full rounded-xl bg-[#D3232A] py-2.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xs mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Recording Log...
                  </>
                ) : (
                  "Confirm Waste Log"
                )}
              </button>
            </form>
          </div>

          {/* Historical Logs Table */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden flex flex-col h-fit">
            
            {/* Search & Reason / Outlet Filter Header */}
            <div className="p-3.5 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter logs by item name or code..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setWastePage(1);
                  }}
                  className="w-full rounded-xl border border-zinc-200 pl-8 pr-3 py-1.5 text-xs focus:border-[#D3232A] focus:outline-none bg-white font-medium"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isAllOutlets && availableOutlets.length > 0 && (
                  <select
                    value={wasteOutletFilter}
                    onChange={(e) => {
                      setWasteOutletFilter(e.target.value);
                      setWastePage(1);
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 focus:outline-none shadow-2xs"
                  >
                    <option value="ALL">All Outlets</option>
                    {availableOutlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  value={filterReason}
                  onChange={(e) => {
                    setFilterReason(e.target.value);
                    setWastePage(1);
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 focus:outline-none shadow-2xs"
                >
                  <option value="ALL">All Reasons ({periodFilteredLogs.length})</option>
                  <option value="SPOILAGE">Spoiled / Expired</option>
                  <option value="OVER_PREP">Over-Prepared</option>
                  <option value="ERROR">Kitchen Error</option>
                  <option value="RETURN">Customer Return</option>
                </select>
              </div>
            </div>

            {/* Table */}
            {isPageLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton count={5} height={42} borderRadius={10} />
              </div>
            ) : processedLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2">
                <Package className="h-8 w-8 text-zinc-300" />
                <p className="text-sm font-bold text-zinc-700">No waste logs found for this filter</p>
                <p className="text-xs text-zinc-400">Record new waste using the form on the left</p>
              </div>
            ) : (() => {
              const totalWastePages = Math.ceil(processedLogs.length / wastePageSize);
              const safeWastePage = Math.min(wastePage, totalWastePages || 1);
              const startWasteIdx = (safeWastePage - 1) * wastePageSize;
              const paginatedLogs = processedLogs.slice(startWasteIdx, startWasteIdx + wastePageSize);
              const showWasteOutlet = Boolean(isAllOutlets || processedLogs.some((l) => l.outlet || l.item?.outlet));

              return (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse table-fixed min-w-[750px]">
                      <thead>
                        <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-200">
                          <th
                            className="px-4 py-3 cursor-pointer select-none hover:text-zinc-900 w-[22%]"
                            onClick={() => toggleSort("createdAt")}
                          >
                            <div className="flex items-center gap-1">
                              Logged Date <ArrowUpDown className="h-3 w-3" />
                            </div>
                          </th>
                          <th className="px-4 py-3 w-[26%]">Item &amp; Code</th>
                          {showWasteOutlet && <th className="px-3 py-3 w-[18%]">Outlet</th>}
                          <th
                            className="px-3 py-3 text-center cursor-pointer select-none hover:text-zinc-900 w-[12%]"
                            onClick={() => toggleSort("quantity")}
                          >
                            Qty
                          </th>
                          <th
                            className="px-4 py-3 text-right cursor-pointer select-none hover:text-zinc-900 w-[14%]"
                            onClick={() => toggleSort("costAtLoggingPaise")}
                          >
                            Loss (₹)
                          </th>
                          <th className="px-3 py-3 text-center w-[16%]">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 font-medium">
                        {paginatedLogs.map((log) => {
                          const reasonColors: Record<string, string> = {
                            SPOILAGE: "bg-red-50 text-red-700 border-red-200",
                            OVER_PREP: "bg-amber-50 text-amber-700 border-amber-200",
                            ERROR: "bg-orange-50 text-orange-700 border-orange-200",
                            RETURN: "bg-blue-50 text-blue-700 border-blue-200",
                          };

                          return (
                            <tr key={log.id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="px-4 py-3.5 text-zinc-600 whitespace-nowrap overflow-hidden" suppressHydrationWarning>
                                {mounted ? new Date(log.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) : ""}
                              </td>

                              <td className="px-4 py-3.5 whitespace-nowrap overflow-hidden">
                                <p className="font-bold text-zinc-900 text-xs truncate">{log.item?.name || "Ingredient Item"}</p>
                                <span className="text-[10px] text-zinc-400 font-mono">Code: {log.item?.sku || "N/A"}</span>
                              </td>

                              {showWasteOutlet && (
                                <td className="px-3 py-3.5 whitespace-nowrap overflow-hidden">
                                  <span className="inline-flex items-center gap-1 truncate text-xs text-zinc-700 font-semibold bg-zinc-100 px-2 py-0.5 rounded">
                                    <Building2 className="h-3 w-3 text-[#D3232A]" />
                                    {log.outlet?.name || log.item?.outlet?.name || "Main Outlet"}
                                  </span>
                                </td>
                              )}

                              <td className="px-3 py-3.5 text-center font-bold text-zinc-800 whitespace-nowrap">
                                {log.quantity} <span className="text-zinc-400 font-normal text-[10px]">{log.item?.unit || ""}</span>
                              </td>

                              <td className="px-4 py-3.5 text-right font-black text-red-600 tabular-nums whitespace-nowrap">
                                ₹{(log.costAtLoggingPaise / 100).toFixed(2)}
                              </td>

                              <td className="px-3 py-3.5 text-center whitespace-nowrap">
                                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${reasonColors[log.reason] || "bg-zinc-100 text-zinc-600"}`}>
                                  {log.reason.replace("_", " ")}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-600">
                    <div>
                      Showing <strong>{startWasteIdx + 1}</strong> to <strong>{Math.min(startWasteIdx + wastePageSize, processedLogs.length)}</strong> of <strong>{processedLogs.length}</strong> Logs
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setWastePage((p) => Math.max(1, p - 1))}
                        disabled={safeWastePage === 1}
                        className="rounded-md border border-zinc-200 bg-white p-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 font-semibold">
                        Page {safeWastePage} of {totalWastePages}
                      </span>
                      <button
                        onClick={() => setWastePage((p) => Math.min(totalWastePages, p + 1))}
                        disabled={safeWastePage >= totalWastePages}
                        className="rounded-md border border-zinc-200 bg-white p-1 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
