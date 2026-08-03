"use client";

import React, { memo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface DistributionItem {
  name: string;
  value: number;
  percentage: number;
  orders: number;
  color: string;
}

const DATA: DistributionItem[] = [
  { name: "Dine In", value: 245000, percentage: 48, orders: 1250, color: "#1B2A4A" }, // Navy
  { name: "Counter / Takeaway", value: 132000, percentage: 26, orders: 890, color: "#D3232A" }, // Red
  { name: "QR Order & Pay", value: 76000, percentage: 15, orders: 420, color: "#f59e0b" }, // Orange
  { name: "Online Delivery", value: 56000, percentage: 11, orders: 310, color: "#10b981" }, // Green
];

export const SalesDistributionCard = memo(function SalesDistributionCard() {
  const totalRev = DATA.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl bg-[#F8FAFC] p-1.5 ring-1 ring-zinc-950/5 shadow-2xs h-full flex flex-col justify-between">
      <div className="rounded-xl bg-white p-5 sm:p-6 border border-zinc-200/60 h-full flex flex-col justify-between space-y-4">
        
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[#1B2A4A] tracking-tight truncate">Sales by Channel</h3>
            <p className="text-xs text-zinc-400 font-medium truncate">Order source breakdown</p>
          </div>
          <span className="text-xs font-extrabold text-[#1B2A4A] bg-zinc-100/90 px-3 py-1 rounded-xl border border-zinc-200/80 shrink-0 whitespace-nowrap tabular-nums">
            ₹{totalRev.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Visual Donut Chart */}
        <div className="h-52 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={DATA}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={78}
                paddingAngle={4}
                dataKey="value"
              >
                {DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                contentStyle={{ backgroundColor: "#1B2A4A", borderRadius: "12px", color: "#fff", fontSize: "12px", border: "none", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-[#1B2A4A] tabular-nums">48%</span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dine In Lead</span>
          </div>
        </div>

        {/* Visual Legend Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {DATA.map((item) => (
            <div key={item.name} className="p-2.5 rounded-xl border border-zinc-100 bg-zinc-50/70 flex items-center justify-between gap-2 min-w-0">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-zinc-800 truncate" title={item.name}>{item.name}</span>
              </div>
              <span className="text-xs font-bold text-[#1B2A4A] shrink-0 whitespace-nowrap ml-1 tabular-nums">{item.percentage}%</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
});
