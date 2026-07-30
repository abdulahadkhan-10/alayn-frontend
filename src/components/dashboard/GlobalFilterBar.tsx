"use client";

import React, { memo, useState } from "react";
import {
  Calendar,
  Building2,
  GitCompare,
  RefreshCw,
  Download,
  ChevronDown,
} from "lucide-react";
import { DashboardFilterState, DateRangePreset, CompareMode } from "@/types/dashboard";

interface OutletOption {
  id: string;
  name: string;
  code?: string;
  city?: string;
}

interface GlobalFilterBarProps {
  filters: DashboardFilterState;
  onFilterChange: (newFilters: DashboardFilterState) => void;
  outlets: OutletOption[];
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const DATE_PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "Today", value: "TODAY" },
  { label: "Yesterday", value: "YESTERDAY" },
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "Last 90 Days", value: "LAST_90_DAYS" },
  { label: "This Month (MTD)", value: "MTD" },
  { label: "This Quarter (QTD)", value: "QTD" },
  { label: "This Year (YTD)", value: "YTD" },
];

export const GlobalFilterBar = memo(function GlobalFilterBar({
  filters,
  onFilterChange,
  outlets,
  onRefresh,
  isRefreshing = false,
}: GlobalFilterBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, dateRange: e.target.value as DateRangePreset });
  };

  const handleOutletSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "ALL") {
      onFilterChange({ ...filters, selectedOutletIds: [] });
    } else {
      onFilterChange({ ...filters, selectedOutletIds: [val] });
    }
  };

  const handleCompareSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, compareMode: e.target.value as CompareMode });
  };

  const handleExport = (type: "CSV" | "PDF" | "PRINT") => {
    setShowExportMenu(false);
    if (type === "PRINT") {
      window.print();
    } else {
      alert(`Exporting dashboard data as ${type} file…`);
    }
  };

  const currentOutletValue =
    filters.selectedOutletIds.length === 1 ? filters.selectedOutletIds[0] : "ALL";

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700">
            <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-500 font-medium hidden sm:inline">Date:</span>
            <select
              value={filters.dateRange}
              onChange={handleDateSelect}
              className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer pr-2"
            >
              {DATE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Outlet Selector Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700">
            <Building2 className="h-4 w-4 text-[#D3232A] shrink-0" />
            <span className="text-zinc-500 font-medium hidden sm:inline">Outlet:</span>
            <select
              value={currentOutletValue}
              onChange={handleOutletSelect}
              className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL">Entire Business (All Outlets)</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>

          {/* Compare Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700">
            <GitCompare className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-500 font-medium hidden sm:inline">Compare:</span>
            <select
              value={filters.compareMode}
              onChange={handleCompareSelect}
              className="bg-transparent font-bold text-zinc-900 focus:outline-none cursor-pointer pr-2"
            >
              <option value="PREVIOUS_PERIOD">Previous Period</option>
              <option value="PREVIOUS_YEAR">Previous Year</option>
              <option value="NONE">No Comparison</option>
            </select>
          </div>
        </div>

        {/* Right Side: Refresh & Export Controls */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#D3232A]" : "text-zinc-400"}`} />
            <span>{isRefreshing ? "Refreshing…" : "Refresh"}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Report</span>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-zinc-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleExport("CSV")}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("PDF")}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("PRINT")}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                >
                  Print Report
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
