"use client";

import React, { memo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Building2,
  GitCompare,
  RefreshCw,
  Download,
  ChevronDown,
  Plus,
  SlidersHorizontal,
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

const QUICK_PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "Today", value: "TODAY" },
  { label: "Yesterday", value: "YESTERDAY" },
  { label: "7 Days", value: "LAST_7_DAYS" },
  { label: "This Month", value: "MTD" },
];

const ALL_PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "Today", value: "TODAY" },
  { label: "Yesterday", value: "YESTERDAY" },
  { label: "Last 7 Days", value: "LAST_7_DAYS" },
  { label: "Last 30 Days", value: "LAST_30_DAYS" },
  { label: "Last 90 Days", value: "LAST_90_DAYS" },
  { label: "Month to Date (MTD)", value: "MTD" },
  { label: "Quarter to Date (QTD)", value: "QTD" },
  { label: "Year to Date (YTD)", value: "YTD" },
];

export const GlobalFilterBar = memo(function GlobalFilterBar({
  filters,
  onFilterChange,
  outlets,
  onRefresh,
  isRefreshing = false,
}: GlobalFilterBarProps) {
  const router = useRouter();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, dateRange: e.target.value as DateRangePreset });
  };

  const handlePresetClick = (presetVal: DateRangePreset) => {
    onFilterChange({ ...filters, dateRange: presetVal });
  };

  const handleCompareSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, compareMode: e.target.value as CompareMode });
  };

  const handleExport = (type: "CSV" | "PDF" | "PRINT") => {
    setShowExportMenu(false);
    if (type === "PRINT") {
      window.print();
    } else {
      alert(`Exporting operator dashboard report as ${type} file…`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left Side: Date Presets & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Date Presets Segmented Control */}
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80">
            {QUICK_PRESETS.map((p) => {
              const isActive = filters.dateRange === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetClick(p.value)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#1B2A4A] text-white shadow-2xs"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Full Date Range Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-50 hover:bg-zinc-100/80 rounded-xl border border-zinc-200/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors">
            <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
            <select
              value={filters.dateRange}
              onChange={handleDateSelect}
              className="bg-transparent font-bold text-[#1B2A4A] focus:outline-none cursor-pointer text-xs pr-1"
            >
              {ALL_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Comparison Mode Dropdown */}
          <div className="flex items-center gap-2 bg-zinc-50 hover:bg-zinc-100/80 rounded-xl border border-zinc-200/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors">
            <GitCompare className="h-4 w-4 text-zinc-400 shrink-0" />
            <span className="text-zinc-400 text-xs hidden sm:inline">Vs:</span>
            <select
              value={filters.compareMode}
              onChange={handleCompareSelect}
              className="bg-transparent font-bold text-[#1B2A4A] focus:outline-none cursor-pointer text-xs pr-1"
            >
              <option value="PREVIOUS_PERIOD">Previous Period</option>
              <option value="PREVIOUS_YEAR">Previous Year</option>
              <option value="NONE">No Comparison</option>
            </select>
          </div>

        </div>

        {/* Right Side: Refresh, Export & New Order CTA */}
        <div className="flex items-center gap-2.5 self-end lg:self-auto shrink-0">
          
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#D3232A]" : "text-zinc-400"}`} />
            <span>{isRefreshing ? "Updating…" : "Refresh"}</span>
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-zinc-50 hover:bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-zinc-500" />
              <span>Export</span>
              <ChevronDown className="h-3 w-3 text-zinc-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-zinc-200 shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => handleExport("CSV")}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Export CSV</span>
                  <span className="text-[10px] text-zinc-400 font-mono">.csv</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("PDF")}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Download PDF</span>
                  <span className="text-[10px] text-zinc-400 font-mono">.pdf</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("PRINT")}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>Print Shift Summary</span>
                  <span className="text-[10px] text-zinc-400 font-mono">⌘P</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push("/pos")}
            className="flex items-center gap-1.5 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] px-4 py-2 text-xs font-extrabold text-white transition-all shadow-xs cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>+ New Order</span>
          </button>

        </div>

      </div>
    </div>
  );
});
