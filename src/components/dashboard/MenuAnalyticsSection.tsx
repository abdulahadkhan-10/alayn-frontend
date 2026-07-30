"use client";

import React, { memo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MenuItemData {
  name: string;
  sales: number;
  revenue: number;
  margin: number;
}

const TOP_ITEMS: MenuItemData[] = [
  { name: "Butter Chicken", sales: 420, revenue: 168000, margin: 68 },
  { name: "Paneer Tikka", sales: 380, revenue: 133000, margin: 72 },
  { name: "Caramel Latte", sales: 610, revenue: 109800, margin: 81 },
  { name: "Garlic Naan", sales: 890, revenue: 71200, margin: 84 },
  { name: "Chicken Biryani", sales: 310, revenue: 93000, margin: 65 },
];

export const MenuAnalyticsSection = memo(function MenuAnalyticsSection() {
  const [viewMetric, setViewMetric] = useState<"sales" | "revenue" | "margin">("revenue");

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#0B1221] tracking-tight">Top Performing Menu Items</h3>
          <p className="text-xs text-zinc-400 font-medium">Visual ranking by sales volume, revenue &amp; profit margin</p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMetric("revenue")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMetric === "revenue" ? "bg-[#0B1221] text-white shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Revenue (₹)
          </button>
          <button
            type="button"
            onClick={() => setViewMetric("sales")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMetric === "sales" ? "bg-[#0B1221] text-white shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Qty Sold
          </button>
          <button
            type="button"
            onClick={() => setViewMetric("margin")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              viewMetric === "margin" ? "bg-[#0B1221] text-white shadow-2xs font-bold" : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Margin %
          </button>
        </div>
      </div>

      {/* Visual Recharts Horizontal Bar Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={TOP_ITEMS}
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#0B1221", fontWeight: 600 }} width={100} />
            <Tooltip
              formatter={(val: any) => [
                viewMetric === "revenue" ? `₹${Number(val).toLocaleString("en-IN")}` : viewMetric === "margin" ? `${val}%` : `${val} units`,
                viewMetric.toUpperCase(),
              ]}
              contentStyle={{ backgroundColor: "#0B1221", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
            />
            <Bar dataKey={viewMetric} radius={[0, 8, 8, 0]} barSize={20}>
              {TOP_ITEMS.map((_, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "#D3232A" : index === 1 ? "#0B1221" : "#52525b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
