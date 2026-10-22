"use client";

import React from "react";
import type { ReportData } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise } from "@/lib/reportQuery";

// Same rule as the backend's pctChange: no percentage when there was nothing before
const pct = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 1000) / 10 : null);

const GROUP_LABEL = { hour: "Hour", day: "Day", week: "Week", month: "Month" } as const;

/** The trend chart's numbers, one row per bucket, next to the matching comparison bucket. Shown under the chart. */
export default function TrendTable({ report }: { report: ReportData }) {
  const { current, previous, granularity } = report.trend;
  const hasPrev = report.comparison != null;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full min-w-[560px] text-sm">
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-3 py-2 text-left">{GROUP_LABEL[granularity]}</th>
            <th className="whitespace-nowrap px-3 py-2 text-right">Sales</th>
            <th className="whitespace-nowrap px-3 py-2 text-right">Orders</th>
            <th className="whitespace-nowrap px-3 py-2 text-right">Stock wasted</th>
            {hasPrev && <th className="whitespace-nowrap px-3 py-2 text-right">Compared with</th>}
            {hasPrev && <th className="whitespace-nowrap px-3 py-2 text-right">Change</th>}
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
                {hasPrev && (
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${change == null ? "text-slate-400" : changeTone(change)}`}>{formatChange(change)}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
