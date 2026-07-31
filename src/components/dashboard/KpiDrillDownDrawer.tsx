"use client";

import React, { memo } from "react";
import { X, TrendingUp, TrendingDown, Info, ArrowUpRight, ChevronRight, IndianRupee } from "lucide-react";
import { ExecutiveKpiMetric } from "@/types/dashboard";

interface KpiDrillDownDrawerProps {
  metric: ExecutiveKpiMetric | null;
  onClose: () => void;
}

export const KpiDrillDownDrawer = memo(function KpiDrillDownDrawer({
  metric,
  onClose,
}: KpiDrillDownDrawerProps) {
  if (!metric) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-zinc-200 animate-in slide-in-from-right duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 bg-white">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Metric Deep Dive
            </span>
            <h2 className="text-lg font-bold text-zinc-900 leading-snug">{metric.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Main Display Value */}
          <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80">
            <p className="text-xs text-zinc-500 font-medium">Current Period Performance</p>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight">{metric.value}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  metric.isPositive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {metric.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {metric.change} vs prev period
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-3 border-t border-zinc-200/60 pt-3">
              {metric.tooltip}
            </p>
          </div>

          {/* Mini Historical Trend Chart Visualization */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Historical Trend (7-Day Telemetry)</h3>
            <div className="p-4 rounded-xl border border-zinc-200 bg-white">
              <div className="h-24 flex items-end justify-between gap-1.5 pt-4">
                {metric.sparkline.map((val, idx) => {
                  const max = Math.max(...metric.sparkline, 1);
                  const heightPct = Math.max((val / max) * 100, 15);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="w-full bg-zinc-100 rounded-t-md h-full relative flex items-end overflow-hidden">
                        <div
                          className={`w-full transition-all duration-300 ${
                            metric.isPositive ? "bg-emerald-500" : "bg-[#D3232A]"
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-400 font-mono">D{idx + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Key Drivers & Optimization Suggestions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Key Intelligence Drivers</h3>
            <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 text-xs">
              <div className="p-3 bg-white flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Top Contributing Outlet</span>
                <span className="font-semibold text-zinc-900">Main Flagship Branch</span>
              </div>
              <div className="p-3 bg-white flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Target Variance</span>
                <span className="font-semibold text-emerald-700">Within Benchmark (+2.4%)</span>
              </div>
              <div className="p-3 bg-white flex items-center justify-between">
                <span className="text-zinc-600 font-medium">Telemetry Source</span>
                <span className="font-semibold text-zinc-900">Live POS &amp; ERP Sync</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Auto-refreshed 2 mins ago</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1B2A4A] text-white rounded-xl text-xs font-semibold hover:bg-[#243556] transition-colors cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
});
