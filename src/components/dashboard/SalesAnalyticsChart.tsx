"use client";

import React, { memo, useState, useMemo } from "react";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type MetricToggle = "REVENUE" | "ORDERS" | "GUESTS" | "AOV" | "PROFIT";
type TimeGranularity = "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR";

interface SalesPoint {
  label: string;
  current: number;
  previous: number;
}

interface SalesAnalyticsChartProps {
  data?: SalesPoint[];
}

const DEFAULT_POINTS: SalesPoint[] = [
  { label: "Mon", current: 42000, previous: 38000 },
  { label: "Tue", current: 48000, previous: 41000 },
  { label: "Wed", current: 51000, previous: 44000 },
  { label: "Thu", current: 56000, previous: 49000 },
  { label: "Fri", current: 78000, previous: 65000 },
  { label: "Sat", current: 95000, previous: 81000 },
  { label: "Sun", current: 82000, previous: 73000 },
];

export const SalesAnalyticsChart = memo(function SalesAnalyticsChart({
  data = DEFAULT_POINTS,
}: SalesAnalyticsChartProps) {
  const [activeMetric, setActiveMetric] = useState<MetricToggle>("REVENUE");
  const [granularity, setGranularity] = useState<TimeGranularity>("DAY");
  const [showComparison, setShowComparison] = useState(true);

  const totalCurrent = useMemo(() => {
    return data.reduce((acc, d) => acc + d.current, 0);
  }, [data]);

  const totalPrevious = useMemo(() => {
    return data.reduce((acc, d) => acc + d.previous, 0);
  }, [data]);

  const pctDiff = totalPrevious ? (((totalCurrent - totalPrevious) / totalPrevious) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Top Header & Metric Toggles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-[#1B2A4A] tracking-tight">Sales &amp; Financial Telemetry</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
              <TrendingUp className="h-3 w-3" /> +{pctDiff}% vs prev
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">Linear-styled financial area charts with multi-period comparative overlays</p>
        </div>

        {/* Metric Selector Toggles */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
          {(["REVENUE", "ORDERS", "GUESTS", "AOV", "PROFIT"] as MetricToggle[]).map((m) => {
            const isActive = activeMetric === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setActiveMetric(m)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#1B2A4A] text-white shadow-2xs"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {m === "REVENUE" ? "Revenue" : m === "ORDERS" ? "Orders" : m === "GUESTS" ? "Guests" : m === "AOV" ? "AOV" : "Profit"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Control Bar: Time Granularity & Compare Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-lg border border-zinc-200">
          {(["HOUR", "DAY", "WEEK", "MONTH", "YEAR"] as TimeGranularity[]).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                granularity === g ? "bg-[#1B2A4A] text-white" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer font-semibold text-zinc-600">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              className="rounded text-[#D3232A] focus:ring-[#D3232A]"
            />
            <span>Compare Previous Period</span>
          </label>
          <div className="flex items-center gap-3 font-semibold text-[11px]">
            <span className="flex items-center gap-1.5 text-[#1B2A4A]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D3232A]" /> Current Period
            </span>
            {showComparison && (
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" /> Previous Period
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Linear-Styled Recharts Area Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="currentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D3232A" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D3232A" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="prevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#71717a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#71717a" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f4f4f5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa", fontWeight: 600 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#a1a1aa" }} />
            <Tooltip
              formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Amount"]}
              contentStyle={{ backgroundColor: "#1B2A4A", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
            />
            {showComparison && (
              <Area
                type="monotone"
                dataKey="previous"
                stroke="#a1a1aa"
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#prevGradient)"
              />
            )}
            <Area
              type="monotone"
              dataKey="current"
              stroke="#D3232A"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#currentGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
