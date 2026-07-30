"use client";

import React, { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const FUNNEL_DATA = [
  { stage: "Placed", count: 148, color: "#0B1221" }, // Navy
  { stage: "In Kitchen", count: 142, color: "#f59e0b" }, // Orange
  { stage: "Ready", count: 140, color: "#D3232A" }, // Red
  { stage: "Served", count: 139, color: "#10b981" }, // Green
];

export const OrderAnalyticsSection = memo(function OrderAnalyticsSection() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#0B1221] tracking-tight">Kitchen Ticket Flow &amp; Speed</h3>
          <p className="text-xs text-zinc-400 font-medium">Visual order status funnel and preparation velocity</p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
          Avg Prep Time: 11.4 mins
        </span>
      </div>

      {/* Recharts Order Funnel Bar Chart */}
      <div className="h-52 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={FUNNEL_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="stage" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#71717a", fontWeight: 600 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip
              formatter={(val: any) => [`${val} Orders`, "Volume"]}
              contentStyle={{ backgroundColor: "#0B1221", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={32}>
              {FUNNEL_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600">Active Kitchen Queue</span>
          <span className="text-sm font-extrabold text-orange-600">6 Tickets</span>
        </div>
        <div className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600">Cancellation Rate</span>
          <span className="text-sm font-extrabold text-[#0B1221]">0.8%</span>
        </div>
      </div>
    </div>
  );
});
