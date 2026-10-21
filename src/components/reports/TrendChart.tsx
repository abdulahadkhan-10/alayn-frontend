"use client";

import React, { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart } from "lucide-react";
import type { ReportData } from "@/redux/slices/reportsApiSlice";
import { formatPaise } from "@/lib/reportQuery";

const CURRENT = "#2563EB";
const PREVIOUS = "#94A3B8";

// Axis labels in rupees: ₹1.2k, ₹15k, ₹1.5L
const compactInr = (rupees: number) => {
  if (rupees >= 100000) return `₹${+(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 10000) return `₹${Math.round(rupees / 1000)}k`;
  if (rupees >= 1000) return `₹${+(rupees / 1000).toFixed(1)}k`;
  return `₹${Math.round(rupees)}`;
};

interface Row {
  label: string;
  prevLabel: string | null;
  current: number | null; // rupees, for the chart scale
  previous: number | null;
  currentPaise: number | null;
  previousPaise: number | null;
}

function TrendTooltip({ active, payload, compareLabel }: { active?: boolean; payload?: { payload: Row }[]; compareLabel?: string }) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{r.label}</p>
      <p className="mt-1 flex items-center gap-2 text-slate-700 tabular-nums">
        <span className="h-2 w-2 rounded-full" style={{ background: CURRENT }} />
        Sales {r.currentPaise == null ? "—" : formatPaise(r.currentPaise)}
      </p>
      {compareLabel && (
        <p className="mt-0.5 flex items-center gap-2 text-slate-500 tabular-nums">
          <span className="h-2 w-2 rounded-full" style={{ background: PREVIOUS }} />
          {r.prevLabel ?? compareLabel}: {r.previousPaise == null ? "—" : formatPaise(r.previousPaise)}
        </p>
      )}
    </div>
  );
}

/** Sales over the period as a solid area, the comparison as a dashed line, bucket by bucket. */
export default function TrendChart({ report, empty }: { report: ReportData; empty: boolean }) {
  const { current, previous } = report.trend;
  const rows = useMemo<Row[]>(() => {
    const n = Math.max(current.length, previous.length);
    return Array.from({ length: n }, (_, i) => {
      const c = current[i];
      const p = previous[i];
      return {
        label: c?.label ?? p?.label ?? "",
        prevLabel: p?.label ?? null,
        current: c ? c.netSalesPaise / 100 : null,
        previous: p ? p.netSalesPaise / 100 : null,
        currentPaise: c ? c.netSalesPaise : null,
        previousPaise: p ? p.netSalesPaise : null,
      };
    });
  }, [current, previous]);
  const compareLabel = report.comparison?.compareLabel;

  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4" aria-labelledby="report-trend-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h2 id="report-trend-title" className="text-base font-bold text-slate-800 tracking-tight">Sales trend</h2>
            <p className="text-xs text-slate-500">Sales before tax, {report.period.label}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CURRENT }} /> This period
          </span>
          {compareLabel && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed" style={{ borderColor: PREVIOUS }} /> {compareLabel}
            </span>
          )}
        </div>
      </div>

      {empty ? (
        <p className="py-12 text-center text-sm text-slate-500">No sales in this period</p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="reportTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CURRENT} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={CURRENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                tickFormatter={compactInr}
                domain={[0, "auto"]}
                allowDecimals={false}
              />
              <Tooltip content={<TrendTooltip compareLabel={compareLabel} />} cursor={{ stroke: "#94A3B8", strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="current" stroke={CURRENT} strokeWidth={2.5} fill="url(#reportTrendGradient)" dot={false} />
              {compareLabel && (
                <Line type="monotone" dataKey="previous" stroke={PREVIOUS} strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
