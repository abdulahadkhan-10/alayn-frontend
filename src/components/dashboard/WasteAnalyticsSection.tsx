"use client";

import React, { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface WasteItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const WASTE_REASONS: WasteItem[] = [
  { name: "Spoilage / Expired", value: 18400, percentage: 42, color: "#D3232A" }, // Red
  { name: "Prep Loss", value: 12200, percentage: 28, color: "#f59e0b" }, // Orange
  { name: "Customer Return", value: 7800, percentage: 18, color: "#0B1221" }, // Navy
  { name: "Storage Temperature", value: 5200, percentage: 12, color: "#10b981" }, // Green
];

export const WasteAnalyticsSection = memo(function WasteAnalyticsSection() {
  const totalWaste = WASTE_REASONS.reduce((acc, r) => acc + r.value, 0);

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#0B1221] tracking-tight">Food Waste &amp; Loss Breakdown</h3>
          <p className="text-xs text-zinc-400 font-medium">Visual waste attribution by operational reason</p>
        </div>
        <span className="text-xs font-bold text-[#D3232A] bg-red-50 border border-red-200 px-3 py-1 rounded-xl">
          Total Waste: ₹{totalWaste.toLocaleString("en-IN")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Recharts Pie Visual */}
        <div className="h-56 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={WASTE_REASONS}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {WASTE_REASONS.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Cost Impact"]}
                contentStyle={{ backgroundColor: "#0B1221", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-[#D3232A]">42%</span>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Spoilage Lead</span>
          </div>
        </div>

        {/* Reason Visual Legend List */}
        <div className="space-y-2.5">
          {WASTE_REASONS.map((item) => (
            <div key={item.name} className="p-3.5 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-bold text-[#0B1221]">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-[#0B1221]">₹{item.value.toLocaleString("en-IN")}</span>
                <span className="text-[11px] text-zinc-400 font-medium ml-2">({item.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
