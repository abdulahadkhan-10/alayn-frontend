"use client";

import React, { memo } from "react";
import { Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const RATING_DIST = [
  { rating: "5 Star", count: 390, color: "#10b981" }, // Green
  { rating: "4 Star", count: 65, color: "#0B1221" }, // Navy
  { rating: "3 Star", count: 18, color: "#f59e0b" }, // Orange
  { rating: "2 Star", count: 5, color: "#f97316" }, // Dark Orange
  { rating: "1 Star", count: 2, color: "#D3232A" }, // Red
];

export const CustomerAnalyticsSection = memo(function CustomerAnalyticsSection() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#0B1221] tracking-tight">Guest Rating Distribution</h3>
          <p className="text-xs text-zinc-400 font-medium">Visual rating spread across recent reviews</p>
        </div>
        <div className="flex items-center gap-1 font-extrabold text-orange-600 text-sm bg-orange-50 border border-orange-200 px-3 py-1 rounded-xl">
          <Star className="h-4 w-4 fill-current" /> 4.75 / 5.0
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="h-52 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={RATING_DIST} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="rating" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717a", fontWeight: 600 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip
              formatter={(val: any) => [`${val} Reviews`, "Count"]}
              contentStyle={{ backgroundColor: "#0B1221", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={28}>
              {RATING_DIST.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600">Repeat Guests</span>
          <span className="text-sm font-extrabold text-emerald-700">64.2%</span>
        </div>
        <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600">Complaint Rate</span>
          <span className="text-sm font-extrabold text-[#0B1221]">1.2%</span>
        </div>
      </div>
    </div>
  );
});
