"use client";

import React from "react";
import type { ReportBreakdownRow } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise, type ReportParams } from "@/lib/reportQuery";
import { CsvButton } from "./ExportMenu";

interface BreakdownTableProps {
  title: string;
  subtitle?: string;
  firstColumn: string; // "Channel"
  rows: ReportBreakdownRow[];
  hasPrev: boolean;
  /** Shown instead of the table when there's nothing to list */
  emptyMessage?: string;
  /** Waste: the money column is cost, the count column is entries, and a fall is good */
  waste?: boolean;
  params: ReportParams;
  /** The export section this table downloads as CSV */
  section: string;
}

/** One way of splitting the period's sales (channel, payment, category…), with share and change. */
export default function BreakdownTable({ title, subtitle, firstColumn, rows, hasPrev, emptyMessage, waste = false, params, section }: BreakdownTableProps) {
  const moneyLabel = waste ? "Cost" : "Sales";
  const countLabel = waste ? "Entries" : "Orders";
  const id = `report-${title.toLowerCase().replace(/\W+/g, "-")}-title`;

  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4" aria-labelledby={id}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id={id} className="text-base font-bold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        {rows.length > 0 && <CsvButton params={params} section={section} label={title} />}
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{emptyMessage ?? "No sales in this period"}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">{firstColumn}</th>
                <th className="px-3 py-2 text-right">{moneyLabel}</th>
                <th className="px-3 py-2 text-right">{countLabel}</th>
                <th className="px-3 py-2 text-right">Share</th>
                {hasPrev && <th className="px-3 py-2 text-right">Before</th>}
                {hasPrev && <th className="px-3 py-2 text-right">Change</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.key} className="text-slate-700">
                  <td className="px-3 py-2 font-medium text-slate-800">{r.label}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatPaise(r.current.netSalesPaise)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCount(r.current.orders)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <span className="inline-flex items-center justify-end gap-2">
                      <span className="hidden sm:block h-1.5 w-12 rounded-full bg-slate-100" aria-hidden="true">
                        <span className="block h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, r.sharePct)}%` }} />
                      </span>
                      {r.sharePct.toFixed(1)}%
                    </span>
                  </td>
                  {hasPrev && (
                    <td className="px-3 py-2 text-right tabular-nums text-slate-500">{r.previous ? formatPaise(r.previous.netSalesPaise) : "—"}</td>
                  )}
                  {hasPrev && (
                    <td className={`px-3 py-2 text-right font-semibold tabular-nums ${changeTone(r.changePct, waste)}`}>{formatChange(r.changePct)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
