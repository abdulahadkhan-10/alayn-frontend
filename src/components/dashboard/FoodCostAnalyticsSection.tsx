"use client";

import React, { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const INGREDIENT_SPEND = [
  { name: "Espresso Beans", spend: 68000 },
  { name: "Cheese Blocks", spend: 45000 },
  { name: "Cooking Oil", spend: 38000 },
  { name: "Basmati Rice", spend: 29000 },
  { name: "Chicken Stock", spend: 24000 },
];

export const FoodCostAnalyticsSection = memo(function FoodCostAnalyticsSection() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 tracking-tight">Food Cost &amp; High Spend Ingredients</h3>
          <p className="text-xs text-zinc-400 font-medium">Monthly raw ingredient spend visual breakdown</p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
          Food Cost: 28.4% (Target: 27.5%)
        </span>
      </div>

      {/* Target Gauge Visual */}
      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
        <div className="flex justify-between text-xs font-bold text-zinc-800">
          <span>Target vs Actual COGS</span>
          <span>28.4% (+0.9% Variance)</span>
        </div>
        <div className="h-3 w-full bg-zinc-200 rounded-full overflow-hidden relative">
          <div className="h-full bg-emerald-500 rounded-full" style={{ width: "28.4%" }} />
          <div className="absolute top-0 bottom-0 w-1 bg-zinc-900 z-10" style={{ left: "27.5%" }} title="Target 27.5%" />
        </div>
      </div>

      {/* Recharts Ingredient Spend Chart */}
      <div className="h-44 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={INGREDIENT_SPEND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#71717a", fontWeight: 600 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#a1a1aa" }} />
            <Tooltip
              formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Monthly Spend"]}
              contentStyle={{ backgroundColor: "#18181b", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
            />
            <Bar dataKey="spend" radius={[8, 8, 0, 0]} barSize={26} fill="#18181b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
