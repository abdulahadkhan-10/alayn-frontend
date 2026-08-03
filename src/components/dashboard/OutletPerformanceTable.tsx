"use client";

import React, { memo, useState } from "react";
import { Building2, TrendingUp, TrendingDown, Star, Eye, ExternalLink } from "lucide-react";
import { OutletPerformanceRecord, OutletHealthStatus } from "@/types/dashboard";

interface OutletPerformanceTableProps {
  outlets: OutletPerformanceRecord[];
  onSelectOutlet?: (outletId: string) => void;
}

const HEALTH_STATUS_CONFIG: Record<OutletHealthStatus, { label: string; cls: string }> = {
  EXCELLENT: { label: "Excellent", cls: "bg-emerald-50 text-emerald-800 border-emerald-200/80" },
  GOOD: { label: "Good", cls: "bg-blue-50 text-blue-800 border-blue-200/80" },
  NEEDS_ATTENTION: { label: "Needs Attention", cls: "bg-amber-50 text-amber-800 border-amber-200/80" },
  CRITICAL: { label: "Critical", cls: "bg-red-50 text-[#D3232A] border-red-200/80" },
};

export const OutletPerformanceTable = memo(function OutletPerformanceTable({
  outlets,
  onSelectOutlet,
}: OutletPerformanceTableProps) {
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  return (
    <div className="w-full rounded-2xl bg-[#F8FAFC] p-1.5 ring-1 ring-zinc-950/5 shadow-2xs">
      <div className="rounded-xl bg-white border border-zinc-200/60 overflow-hidden">
        
        {/* Table Header Controls */}
        <div className="p-5 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight">Multi-Outlet Performance Matrix</h2>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D3232A] bg-red-50 px-2.5 py-0.5 rounded-md border border-red-100">
                Operator View
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">Comparative financial, food cost %, inventory waste &amp; customer satisfaction telemetry</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-700 font-bold bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/80 font-mono">
              {outlets.length} Active Locations
            </span>
          </div>
        </div>

        {/* Centerpiece Table Container with Sticky Header & Freeze Pane */}
        <div className="overflow-x-auto max-h-[500px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-20 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-200 shadow-2xs">
              <tr>
                <th className="px-5 py-3.5 sticky left-0 z-30 bg-zinc-50 border-r border-zinc-200/80 min-w-[220px]">
                  Outlet / Branch
                </th>
                <th className="px-4 py-3.5 text-right">Net Sales</th>
                <th className="px-4 py-3.5 text-center">7D Sparkline</th>
                <th className="px-4 py-3.5 text-center">Total Orders</th>
                <th className="px-4 py-3.5 text-center">Growth</th>
                <th className="px-4 py-3.5 text-right">Gross Margin</th>
                <th className="px-4 py-3.5 text-center">Food Cost %</th>
                <th className="px-4 py-3.5 text-right">Waste Cost</th>
                <th className="px-4 py-3.5 text-center">Rating</th>
                <th className="px-4 py-3.5 text-center">Health Score</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {outlets.map((outlet, idx) => {
                const statusCfg = HEALTH_STATUS_CONFIG[outlet.healthStatus];
                const isHovered = hoveredRowId === outlet.id;

                return (
                  <tr
                    key={outlet.id}
                    onMouseEnter={() => setHoveredRowId(outlet.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                    onClick={() => onSelectOutlet && onSelectOutlet(outlet.id)}
                    className={`transition-colors cursor-pointer ${
                      isHovered ? "bg-zinc-50/90" : "bg-white"
                    }`}
                  >
                    {/* Pinned Outlet Column */}
                    <td className="px-5 py-3.5 sticky left-0 z-10 bg-white border-r border-zinc-200/80">
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-lg bg-zinc-100 text-[#1B2A4A] flex items-center justify-center text-xs font-bold shrink-0 font-mono">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-[#1B2A4A] text-xs sm:text-sm leading-snug">{outlet.name}</p>
                          <p className="text-[11px] text-zinc-400 font-medium">{outlet.city} · {outlet.code}</p>
                        </div>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="px-4 py-3.5 text-right font-extrabold text-[#1B2A4A] tabular-nums text-sm">
                      ₹{outlet.revenue.toLocaleString("en-IN")}
                    </td>

                    {/* Inline Sparkline */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-4 w-20 mx-auto flex items-end gap-0.5">
                        {outlet.sparkline.map((val, i) => {
                          const max = Math.max(...outlet.sparkline, 1);
                          const pct = Math.max((val / max) * 100, 15);
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-xs ${
                                outlet.growth >= 0 ? "bg-emerald-400" : "bg-[#D3232A]"
                              }`}
                              style={{ height: `${pct}%` }}
                            />
                          );
                        })}
                      </div>
                    </td>

                    {/* Orders */}
                    <td className="px-4 py-3.5 text-center font-bold text-zinc-800 tabular-nums">
                      {outlet.orders.toLocaleString()}
                    </td>

                    {/* Growth */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          outlet.growth >= 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-[#D3232A] border border-red-200"
                        }`}
                      >
                        {outlet.growth >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {outlet.growth >= 0 ? `+${outlet.growth}%` : `${outlet.growth}%`}
                      </span>
                    </td>

                    {/* Gross Profit */}
                    <td className="px-4 py-3.5 text-right font-bold text-emerald-700 tabular-nums">
                      ₹{outlet.grossProfit.toLocaleString("en-IN")}
                    </td>

                    {/* Food Cost % with Gauge Progress Bar */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="space-y-1 w-24 mx-auto">
                        <span className={`text-xs font-bold tabular-nums ${outlet.foodCostPct > 30 ? "text-[#D3232A]" : "text-zinc-800"}`}>
                          {outlet.foodCostPct}%
                        </span>
                        <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              outlet.foodCostPct > 30 ? "bg-[#D3232A]" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(outlet.foodCostPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Waste Cost */}
                    <td className="px-4 py-3.5 text-right font-semibold text-[#D3232A] tabular-nums">
                      ₹{outlet.wasteCost.toLocaleString("en-IN")}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-orange-600 tabular-nums">
                        <Star className="h-3.5 w-3.5 fill-current" /> {outlet.rating.toFixed(1)}
                      </span>
                    </td>

                    {/* Health Score & Badge */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusCfg.cls}`}
                      >
                        {outlet.healthScore}/100 · {statusCfg.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectOutlet) onSelectOutlet(outlet.id);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-[#1B2A4A] hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                        title="View Detailed Outlet Telemetry"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
});
