"use client";

import React from "react";
import type { ReportBreakdownRow } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise, type ReportParams } from "@/lib/reportQuery";
import { CsvButton } from "./ExportMenu";

/** Stock logged as waste, by reason. Hidden when nothing was wasted. For waste a fall is good. */
export default function WasteList({ rows, params }: { rows: ReportBreakdownRow[]; params: ReportParams }) {
  const wasted = rows.filter((r) => r.current.netSalesPaise > 0 || r.current.orders > 0);
  if (wasted.length === 0) return null;

  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-3" aria-labelledby="report-waste-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="report-waste-title" className="text-base font-bold text-slate-800 tracking-tight">Stock wasted by reason</h2>
          <p className="text-xs text-slate-500">Value of stock logged as waste</p>
        </div>
        <CsvButton params={params} section="waste" label="stock wasted" />
      </div>
      <ul className="divide-y divide-slate-100">
        {wasted.map((r) => (
          <li key={r.key} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate font-medium text-slate-800" title={r.label}>{r.label}</span>
            <span className="flex shrink-0 items-baseline gap-3 whitespace-nowrap tabular-nums">
              <span className="text-slate-700">
                {formatPaise(r.current.netSalesPaise)}
                <span className="ml-1 text-xs text-slate-500">
                  ({formatCount(r.current.orders)} {r.current.orders === 1 ? "entry" : "entries"})
                </span>
              </span>
              {r.changePct != null && <span className={`text-xs font-semibold ${changeTone(r.changePct, true)}`}>{formatChange(r.changePct)}</span>}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
