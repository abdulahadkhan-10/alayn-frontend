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
  { name: "Dine In", value: 245000, percentage: 48, orders: 1250, color: "#0B1221" }, // Navy
  { name: "Counter / Takeaway", value: 132000, percentage: 26, orders: 890, color: "#D3232A" }, // Red
  { name: "QR Order & Pay", value: 76000, percentage: 15, orders: 420, color: "#f59e0b" }, // Orange
  { name: "Online Delivery", value: 56000, percentage: 11, orders: 310, color: "#10b981" }, // Green
];

export const SalesDistributionCard = memo(function SalesDistributionCard() {
  const totalRev = DATA.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-[#0B1221] tracking-tight">Sales by Channel</h3>
          <p className="text-xs text-zinc-400 font-medium">Revenue distribution across order sources</p>
        </div>
        <span className="text-xs font-bold text-[#0B1221] bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/60">
          ₹{totalRev.toLocaleString("en-IN")}
        </span>
      </div>

      {/* Visual Pie/Donut Chart */}
      <div className="h-52 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={DATA}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
              contentStyle={{ backgroundColor: "#0B1221", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-extrabold text-[#0B1221]">48%</span>
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Dine In Lead</span>
        </div>
      </div>

      {/* Visual Legend Cards */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        {DATA.map((item) => (
          <div key={item.name} className="p-3 rounded-xl border border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-semibold text-zinc-800 truncate">{item.name}</span>
            </div>
            <span className="text-xs font-bold text-[#0B1221]">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});
