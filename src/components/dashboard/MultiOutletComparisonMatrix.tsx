"use client";

import React, { memo, useState, useMemo } from "react";
import { ArrowUpDown, Star, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { OutletPerformanceRecord } from "@/types/dashboard";

interface MultiOutletComparisonMatrixProps {
  outlets: OutletPerformanceRecord[];
}

type SortField = "revenue" | "growth" | "orders" | "foodCostPct" | "wasteCost" | "grossProfit" | "rating" | "healthScore";

export const MultiOutletComparisonMatrix = memo(function MultiOutletComparisonMatrix({
  outlets,
}: MultiOutletComparisonMatrixProps) {
  const [sortField, setSortField] = useState<SortField>("healthScore");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedOutlets = useMemo(() => {
    return [...outlets].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [outlets, sortField, sortAsc]);

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 tracking-tight">Multi-Outlet Comparative Matrix</h3>
          <p className="text-xs text-zinc-400 font-medium">Side-by-side comparative benchmarking across all enterprise locations</p>
        </div>
        <span className="text-xs text-zinc-500 font-semibold">Click column header to sort</span>
      </div>

      {/* Sortable Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 text-zinc-400 font-semibold uppercase tracking-wider text-[11px] border-b border-zinc-200">
            <tr>
              <th className="px-4 py-3">Outlet</th>
              <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort("revenue")}>
                <div className="inline-flex items-center gap-1">Revenue <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="px-4 py-3 text-center cursor-pointer" onClick={() => handleSort("growth")}>
                <div className="inline-flex items-center gap-1">Growth <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="px-4 py-3 text-center cursor-pointer" onClick={() => handleSort("orders")}>
                <div className="inline-flex items-center gap-1">Orders <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="px-4 py-3 text-center cursor-pointer" onClick={() => handleSort("foodCostPct")}>
                <div className="inline-flex items-center gap-1">Food Cost % <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort("wasteCost")}>
                <div className="inline-flex items-center gap-1">Waste <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="px-4 py-3 text-right cursor-pointer" onClick={() => handleSort("grossProfit")}>
                <div className="inline-flex items-center gap-1">Profit <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="px-4 py-3 text-center cursor-pointer" onClick={() => handleSort("rating")}>
                <div className="inline-flex items-center gap-1">Rating <ArrowUpDown className="h-3 w-3" /></div>
              </th>
              <th className="px-4 py-3 text-center cursor-pointer" onClick={() => handleSort("healthScore")}>
                <div className="inline-flex items-center gap-1">Health <ArrowUpDown className="h-3 w-3" /></div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sortedOutlets.map((o) => (
              <tr key={o.id} className="hover:bg-zinc-50/60 transition-colors">
                <td className="px-4 py-3 font-semibold text-zinc-900">{o.name}</td>
                <td className="px-4 py-3 text-right font-bold text-zinc-900">₹{o.revenue.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-center font-semibold text-emerald-700">+{o.growth}%</td>
                <td className="px-4 py-3 text-center font-bold text-zinc-800">{o.orders}</td>
                <td className="px-4 py-3 text-center font-medium text-zinc-800">{o.foodCostPct}%</td>
                <td className="px-4 py-3 text-right font-semibold text-rose-600">₹{o.wasteCost.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-700">₹{o.grossProfit.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-center font-bold text-amber-600">★ {o.rating.toFixed(1)}</td>
                <td className="px-4 py-3 text-center font-bold text-zinc-900">{o.healthScore}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
