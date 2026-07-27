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
  Package,
  Plus,
  X,
  PieChart,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";

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

  // Form Mutation State
  const [logWaste, { isLoading: isSubmitting }] = useLogWasteMutation();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState<number | "">("");
  const [reason, setReason] = useState<"SPOILAGE" | "OVER_PREP" | "RETURN" | "ERROR">("SPOILAGE");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Search, Filter, Pagination & Sort State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"createdAt" | "costAtLoggingPaise" | "quantity">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterReason, setFilterReason] = useState<string>("ALL");
  const [wasteOutletFilter, setWasteOutletFilter] = useState<string>("ALL");
  const [wastePage, setWastePage] = useState(1);
  const [wastePageSize, setWastePageSize] = useState(10);

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

  const handleLogWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedItemId) return setFeedback({ type: "error", msg: "Please select an ingredient item." });

    if (!Number.isFinite(numQty) || numQty <= 0) {
      return setFeedback({ type: "error", msg: "Please enter a valid numeric waste quantity greater than 0." });
    }

    if (selectedItem && numQty > selectedItem.currentStock) {
      return setFeedback({
        type: "error",
        msg: `Wasted quantity (${numQty} ${selectedItem.unit}) cannot exceed current stock balance (${selectedItem.currentStock} ${selectedItem.unit}).`,
      });
    }

    try {
      await logWaste({
        itemId: selectedItemId,
        quantity: numQty,
        reason,
      }).unwrap();

      setFeedback({ type: "success", msg: "Wastage recorded successfully and stock balance updated!" });
      setQuantity("");
      setSelectedItemId("");
      refetchLogs();
      refetchSummary();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.data?.message || err?.message || "Failed to record wastage." });
    }
  };

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

  // Filtered & Processed Logs
  const processedLogs = useMemo(() => {
    let result = [...logs];

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
  }, [logs, isAllOutlets, wasteOutletFilter, searchTerm, filterReason, sortField, sortOrder]);

  // Find top wasted ingredient by total cost
  const topWastedIngredient = useMemo(() => {
    const costMap: Record<string, { name: string; unit: string; totalCostPaise: number; count: number }> = {};
    logs.forEach((log) => {
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
  }, [logs]);

  const toggleSort = (field: "createdAt" | "costAtLoggingPaise" | "quantity") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const currentMonthWasteRupees = wasteSummary
    ? (wasteSummary.currentMonthWastePaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })
    : "0.00";

  // Export CSV Functionality
  const handleExportCSV = () => {
    if (processedLogs.length === 0) return alert("No logs available to export.");

    const headers = ["Logged Date", "Item Name", "Item Code", "Category", "Quantity", "Unit", "Loss Value (INR)", "Reason"];
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
    link.setAttribute("download", `waste_report_${activeBranch?.name || "branch"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 tracking-tight">
                Spoilage & Waste Tracker
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-3 py-0.5 text-xs font-bold text-red-700">
                <Trash2 className="h-3 w-3" /> {activeBranch?.name || "Branch"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Track spoiled items, kitchen loss, and register stock waste
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="refresh-waste-btn"
              onClick={handleManualRefresh}
              title="Refresh live data"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetchingLogs || isFetchingSummary ? "animate-spin text-red-600" : "text-zinc-500"}`} />
              Refresh
            </button>
            <button
              id="export-csv-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" /> Export CSV
            </button>
          </div>
        </div>

        {/* Top Executive Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Monthly Financial Loss */}
          {isPageLoading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
              <Skeleton height={14} width="40%" className="mb-2" />
              <Skeleton height={32} width="50%" className="mb-2" />
              <Skeleton height={12} width="70%" />
            </div>
          ) : (
            <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-[#D3232A] via-red-600 to-rose-700 p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-100">Monthly Wastage Loss</p>
                  <div className="rounded-xl bg-white/20 p-2 backdrop-blur-xs text-white">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
                  ₹{currentMonthWasteRupees}
                </h2>
                <p className="text-xs text-red-100 mt-1">Total value lost this calendar month</p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-red-100">
                <span>Total Logs: <strong>{logs.length}</strong></span>
                <span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Database Synced</span>
              </div>
            </div>
          )}

          {/* Card 2: Top Wasted Item */}
          {isPageLoading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
              <Skeleton height={14} width="40%" className="mb-2" />
              <Skeleton height={24} width="60%" className="mb-2" />
              <Skeleton height={12} width="80%" />
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Most Wasted Item</p>
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-600 border border-amber-100">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                </div>
                {topWastedIngredient ? (
                  <>
                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mt-2 truncate">
                      {topWastedIngredient.name}
                    </h3>
                    <p className="text-sm font-bold text-red-600 mt-1">
                      ₹{(topWastedIngredient.totalCostPaise / 100).toFixed(2)} total loss
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-zinc-400 mt-3">No wastage reported yet</p>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-3 pt-2.5 border-t border-zinc-100">
                {topWastedIngredient ? `Accounted for ${topWastedIngredient.count} waste logs` : "Stock levels operating cleanly"}
              </p>
            </div>
          )}

          {/* Card 3: Spoilage Reasons Pills */}
          {isPageLoading ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs">
              <Skeleton height={14} width="40%" className="mb-3" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton height={36} borderRadius={10} />
                <Skeleton height={36} borderRadius={10} />
                <Skeleton height={36} borderRadius={10} />
                <Skeleton height={36} borderRadius={10} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reason Breakdown</p>
                  <PieChart className="h-4 w-4 text-zinc-400" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { r: "SPOILAGE", label: "Spoiled / Expired" },
                    { r: "OVER_PREP", label: "Over-Prepared" },
                    { r: "ERROR", label: "Kitchen Spillage" },
                    { r: "RETURN", label: "Customer Return" },
                  ].map((item) => {
                    const group = wasteSummary?.byReason?.find((b) => b.reason === item.r);
                    const count = group?.count || 0;
                    const isSelected = filterReason === item.r;
                    return (
                      <button
                        key={item.r}
                        type="button"
                        onClick={() => {
                          setFilterReason(isSelected ? "ALL" : item.r);
                          setWastePage(1);
                        }}
                        className={`rounded-xl border p-2.5 transition-all text-left group ${
                          isSelected
                            ? "border-[#D3232A] bg-red-50/70 text-red-900 shadow-2xs font-semibold"
                            : "border-zinc-100 bg-zinc-50/60 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100/70"
                        }`}
                      >
                        <p className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-700 truncate">
                          {item.label}
                        </p>
                        <p className="text-xs font-extrabold text-zinc-900 mt-0.5">{count} logs</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm flex items-center justify-between gap-2 shadow-xs ${
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
              <p className="font-medium text-xs sm:text-sm">{feedback.msg}</p>
            </div>
            <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-700">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Workspace: Form + Historical Logs Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-xs h-fit">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-zinc-100">
              <div className="rounded-xl bg-red-50 p-2 text-[#D3232A]">
                <Plus className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Record Wasted Item</h2>
                <p className="text-xs text-zinc-500">Log stock loss and update inventory</p>
              </div>
            </div>

            <form onSubmit={handleLogWaste} className="space-y-4">
              <div>
                <label htmlFor="waste-item-select" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Wasted Ingredient / Item
                </label>
                {isLoadingItems || branchLoading ? (
                  <Skeleton height={42} borderRadius={12} />
                ) : (
                  <select
                    required
                    id="waste-item-select"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white font-medium"
                  >
                    <option value="">-- Choose ingredient from inventory --</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.unit}){isAllOutlets || i.outlet ? ` — [${i.outlet?.name || 'Branch'}]` : ''} — Available: {i.currentStock}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="waste-reason-select" className="block text-xs font-semibold text-zinc-700 mb-1">
                  Reason for Loss
                </label>
                <select
                  id="waste-reason-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white font-medium"
                >
                  <option value="SPOILAGE">Spoiled / Expired</option>
                  <option value="OVER_PREP">Over-Prepared</option>
                  <option value="ERROR">Kitchen Spillage / Error</option>
                  <option value="RETURN">Customer Return</option>
                </select>
              </div>

              <div>
                <label htmlFor="waste-quantity-input" className="block text-xs font-semibold text-zinc-700 mb-1">
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
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none font-semibold"
                />
              </div>

              {/* Form Live Stock Balance Impact Card */}
              {selectedItem && numQty > 0 && (
                <div className="rounded-xl bg-red-50/80 border border-red-200 p-3.5 space-y-2 text-xs text-red-950">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Calculated Loss:</span>
                    <strong className="text-red-700 text-sm font-extrabold">₹{calculatedCostRupees}</strong>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-medium">
                    Formula: {numQty} {selectedItem.unit} × ₹{(selectedItem.unitCostPaise / 100).toFixed(2)} = ₹{calculatedCostRupees}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-red-200/60 text-center">
                    <div className="bg-white/80 p-1.5 rounded-lg border border-red-100">
                      <span className="block text-[10px] text-zinc-500 font-semibold">CURRENT</span>
                      <strong className="text-xs text-zinc-800">{selectedItem.currentStock} {selectedItem.unit}</strong>
                    </div>
                    <div className="bg-white/80 p-1.5 rounded-lg border border-red-100">
                      <span className="block text-[10px] text-zinc-500 font-semibold">REMAINING</span>
                      <strong className={`text-xs ${remainingStock < selectedItem.reorderThreshold ? "text-red-600" : "text-emerald-700"}`}>
                        {Number(remainingStock.toFixed(2))} {selectedItem.unit}
                      </strong>
                    </div>
                  </div>
                  {remainingStock < selectedItem.reorderThreshold && (
                    <p className="text-[11px] text-red-600 font-bold flex items-center gap-1 pt-0.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Remaining stock will drop below min reorder level ({selectedItem.reorderThreshold} {selectedItem.unit})!
                    </p>
                  )}
                </div>
              )}

              <button
                id="submit-waste-btn"
                type="submit"
                disabled={isSubmitting || !selectedItemId || numQty <= 0}
                className="w-full rounded-xl bg-[#D3232A] py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Confirm Waste Log"
                )}
              </button>
            </form>
          </div>

          {/* Historical Logs Table Card */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white shadow-xs overflow-hidden flex flex-col h-fit">
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-zinc-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-50/50">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter waste logs by item name or code..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setWastePage(1);
                  }}
                  className="w-full rounded-xl border border-zinc-300 pl-9 pr-3.5 py-1.5 text-xs focus:border-[#D3232A] focus:outline-none bg-white"
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
                    className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-none"
                  >
                    <option value="ALL">All Outlets</option>
                    {availableOutlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                )}
                <Filter className="h-3.5 w-3.5 text-zinc-400" />
                <select
                  value={filterReason}
                  onChange={(e) => {
                    setFilterReason(e.target.value);
                    setWastePage(1);
                  }}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 focus:outline-none"
                >
                  <option value="ALL">All Reasons ({logs.length})</option>
                  <option value="SPOILAGE">Spoiled / Expired</option>
                  <option value="OVER_PREP">Over-Prepared</option>
                  <option value="ERROR">Kitchen Spillage</option>
                  <option value="RETURN">Customer Return</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {isPageLoading ? (
              <div className="p-5 space-y-3">
                <Skeleton height={20} width="30%" className="mb-4" />
                <Skeleton count={6} height={42} borderRadius={10} className="mb-2" />
              </div>
            ) : processedLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400 gap-2">
                <Package className="h-10 w-10 text-zinc-300 stroke-[1.5]" />
                <p className="text-sm font-semibold text-zinc-600">No waste logs match your search</p>
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
                    <table className="w-full min-w-[850px] text-sm border-collapse table-fixed">
                          <thead>
                            <tr className="bg-zinc-50/90 text-left text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                              <th
                                className={`px-4 py-3.5 cursor-pointer select-none hover:text-zinc-900 ${showWasteOutlet ? "w-[18%]" : "w-[24%]"}`}
                                onClick={() => toggleSort("createdAt")}
                              >
                                <div className="flex items-center gap-1">
                                  Logged Date <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </th>
                              <th className={`px-4 py-3.5 ${showWasteOutlet ? "w-[24%]" : "w-[30%]"}`}>Item & Code</th>
                              {showWasteOutlet && (
                                <th className="px-4 py-3.5 w-[20%]">Outlet</th>
                              )}
                              <th
                                className={`px-4 py-3.5 text-center cursor-pointer select-none hover:text-zinc-900 ${showWasteOutlet ? "w-[12%]" : "w-[14%]"}`}
                                onClick={() => toggleSort("quantity")}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  Quantity <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </th>
                              <th
                                className={`px-4 py-3.5 text-right cursor-pointer select-none hover:text-zinc-900 ${showWasteOutlet ? "w-[13%]" : "w-[16%]"}`}
                                onClick={() => toggleSort("costAtLoggingPaise")}
                              >
                                <div className="flex items-center justify-end gap-1">
                                  Loss Value (₹) <ArrowUpDown className="h-3 w-3" />
                                </div>
                              </th>
                              <th className={`px-4 py-3.5 text-center ${showWasteOutlet ? "w-[13%]" : "w-[16%]"}`}>Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {paginatedLogs.map((log) => {
                              const reasonColors: Record<string, string> = {
                                SPOILAGE: "bg-red-50 text-red-700 border-red-200",
                                OVER_PREP: "bg-amber-50 text-amber-700 border-amber-200",
                                ERROR: "bg-orange-50 text-orange-700 border-orange-200",
                                RETURN: "bg-blue-50 text-blue-700 border-blue-200",
                              };

                              return (
                                <tr key={log.id} className="hover:bg-zinc-50/80 transition-colors">
                                  <td className="px-4 py-3.5 text-xs text-zinc-600 whitespace-nowrap overflow-hidden" suppressHydrationWarning>
                                    {mounted ? new Date(log.createdAt).toLocaleString("en-IN", {
                                      day: "2-digit",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }) : ""}
                                  </td>

                                  <td className="px-4 py-3.5 whitespace-nowrap overflow-hidden">
                                    <p className="font-bold text-zinc-900 text-xs truncate">{log.item?.name || "Ingredient Item"}</p>
                                    <p className="text-[10px] text-zinc-400 font-mono truncate">Code: {log.item?.sku || "N/A"}</p>
                                  </td>
                                  {showWasteOutlet && (
                                    <td className="px-4 py-3.5 whitespace-nowrap overflow-hidden">
                                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
                                        <Building2 className="h-3.5 w-3.5 text-[#D3232A] shrink-0" />
                                        <span className="truncate max-w-[130px] font-medium">{log.outlet?.name || log.item?.outlet?.name || "Main Branch"}</span>
                                      </span>
                                    </td>
                                  )}
                                  <td className="px-4 py-3.5 text-center text-zinc-800 font-bold text-xs whitespace-nowrap">
                                    {log.quantity} <span className="text-zinc-400 font-normal text-[11px]">{log.item?.unit || ""}</span>
                                  </td>
                                  <td className="px-4 py-3.5 text-right font-extrabold text-red-600 text-xs tabular-nums whitespace-nowrap">
                                    ₹{(log.costAtLoggingPaise / 100).toFixed(2)}
                                  </td>
                                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                    <span
                                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${
                                        reasonColors[log.reason] || "bg-zinc-100 text-zinc-600"
                                      }`}
                                    >
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
                  <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/80 border-t border-zinc-200 text-xs text-zinc-600">
                    <div>
                      Showing <strong>{startWasteIdx + 1}</strong> to <strong>{Math.min(startWasteIdx + wastePageSize, processedLogs.length)}</strong> of <strong>{processedLogs.length}</strong> Waste Logs
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setWastePage((p) => Math.max(1, p - 1))}
                        disabled={safeWastePage === 1}
                        className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 font-medium">
                        Page {safeWastePage} of {totalWastePages}
                      </span>
                      <button
                        onClick={() => setWastePage((p) => Math.min(totalWastePages, p + 1))}
                        disabled={safeWastePage >= totalWastePages}
                        className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
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
