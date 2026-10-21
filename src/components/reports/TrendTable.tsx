"use client";

import React from "react";
import type { ReportData } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise } from "@/lib/reportQuery";

// Same rule as the backend's pctChange: no percentage when there was nothing before
const pct = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null);

const GROUP_LABEL = { hour: "Hour", day: "Day", week: "Week", month: "Month" } as const;

/** The trend chart's numbers, one row per bucket, next to the matching comparison bucket. */
export default function TrendTable({ report, empty }: { report: ReportData; empty: boolean }) {
  const { current, previous, granularity } = report.trend;
  const hasPrev = report.comparison != null;

  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4" aria-labelledby="report-trend-table-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="report-trend-table-title" className="text-base font-bold text-slate-800 tracking-tight">Sales by {GROUP_LABEL[granularity].toLowerCase()}</h2>
          <p className="text-xs text-slate-500">Sales before tax, settled orders and stock wasted</p>
        </div>
        {/* Download slot: the CSV button goes here (Task 8) */}
        <div className="flex items-center gap-2" />
      </div>

      {empty ? (
        <p className="py-8 text-center text-sm text-slate-500">No sales in this period</p>
      ) : (
        <div className="max-h-96 overflow-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">{GROUP_LABEL[granularity]}</th>
                <th className="px-3 py-2 text-right">Sales</th>
                <th className="px-3 py-2 text-right">Orders</th>
                <th className="px-3 py-2 text-right">Stock wasted</th>
                {hasPrev && <th className="px-3 py-2 text-right">Compared with</th>}
                {hasPrev && <th className="px-3 py-2 text-right">Change</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {current.map((b, i) => {
                const p = previous[i];
                const change = p ? pct(b.netSalesPaise, p.netSalesPaise) : null;
                return (
                  <tr key={b.start} className="text-slate-700">
                    <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">{b.label}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatPaise(b.netSalesPaise)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCount(b.orders)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatPaise(b.wastePaise)}</td>
                    {hasPrev && (
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500 whitespace-nowrap">
                        {p ? `${formatPaise(p.netSalesPaise)} (${p.label})` : "—"}
                      </td>
                    )}
                    {hasPrev && <td className={`px-3 py-2 text-right font-semibold tabular-nums ${changeTone(change)}`}>{formatChange(change)}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
