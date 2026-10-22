"use client";

import React, { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronDown } from "lucide-react";
import type { ReportData } from "@/redux/slices/reportsApiSlice";
import { formatPaise, type ReportParams } from "@/lib/reportQuery";
import TrendTable from "./TrendTable";
import { CsvButton } from "./ExportMenu";

const BY = { hour: "hour by hour", day: "day by day", week: "week by week", month: "month by month" } as const;

export const CURRENT = "#2563EB";
export const PREVIOUS = "#94A3B8";

// Axis labels in rupees: ₹1.2k, ₹15k, ₹1.5L
export const compactInr = (rupees: number) => {
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

/** Sales over the period as a solid area, the comparison as a dashed line, bucket by bucket; the numbers on request. */
export default function TrendChart({ report, empty, params }: { report: ReportData; empty: boolean; params: ReportParams }) {
  const [showTable, setShowTable] = useState(false);
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
        <div className="min-w-0">
          <h2 id="report-trend-title" className="text-base font-bold text-slate-800 tracking-tight">Sales trend</h2>
          <p className="text-xs text-slate-500">Sales before tax, {report.period.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: CURRENT }} /> This period
          </span>
          {compareLabel && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
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
              <Area type="monotone" dataKey="current" stroke={CURRENT} strokeWidth={2.5} fill={CURRENT} fillOpacity={0.08} dot={false} />
              {compareLabel && (
                <Line type="monotone" dataKey="previous" stroke={PREVIOUS} strokeWidth={2} strokeDasharray="4 4" dot={false} connectNulls />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {!empty && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              aria-expanded={showTable}
              aria-controls="report-trend-table"
              onClick={() => setShowTable((v) => !v)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              {showTable ? "Hide" : "Show"} {BY[report.trend.granularity]}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTable ? "rotate-180" : ""}`} />
            </button>
            <CsvButton params={params} section="trend" label="sales by period" />
          </div>
          {showTable && (
            <div id="report-trend-table">
              <TrendTable report={report} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
