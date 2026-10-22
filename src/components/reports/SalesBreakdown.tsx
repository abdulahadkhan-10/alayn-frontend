"use client";

import React, { useRef, useState } from "react";
import type { ReportBreakdownRow, ReportData } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatPaise, type ReportParams } from "@/lib/reportQuery";
import { CsvButton } from "./ExportMenu";

interface Tab {
  key: "categories" | "channels" | "payments" | "outlets";
  label: string;
  firstColumn: string;
  note: string;
}

const TABS: Tab[] = [
  { key: "categories", label: "Categories", firstColumn: "Category", note: "Item sales before bill discounts" },
  { key: "channels", label: "Channels", firstColumn: "Channel", note: "Sales before tax" },
  { key: "payments", label: "Payments", firstColumn: "Payment method", note: "Amounts received, including tax" },
  { key: "outlets", label: "Outlets", firstColumn: "Outlet", note: "Sales before tax" },
];

function Rows({ rows, firstColumn, hasPrev }: { rows: ReportBreakdownRow[]; firstColumn: string; hasPrev: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100">
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="w-24 sm:w-32" />
          <col className="w-16 sm:w-44" />
          {hasPrev && <col className="w-20 sm:w-24" />}
        </colgroup>
        <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-2 py-2 text-left sm:px-3">{firstColumn}</th>
            <th className="whitespace-nowrap px-2 py-2 text-right sm:px-3">Sales</th>
            <th className="whitespace-nowrap px-2 py-2 text-right sm:px-3">Share</th>
            {hasPrev && <th className="whitespace-nowrap px-2 py-2 text-right sm:px-3">Change</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.key} className="text-slate-700">
              <td className="truncate whitespace-nowrap px-2 py-2 font-medium text-slate-800 sm:px-3" title={r.label}>{r.label}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3">{formatPaise(r.current.netSalesPaise)}</td>
              <td className="whitespace-nowrap px-2 py-2 text-right tabular-nums sm:px-3">
                <span className="inline-flex items-center justify-end gap-2">
                  <span className="hidden sm:block h-1.5 w-20 rounded-full bg-slate-100" aria-hidden="true">
                    <span className="block h-1.5 rounded-full bg-blue-500" style={{ width: `${Math.min(100, r.sharePct)}%` }} />
                  </span>
                  {r.sharePct.toFixed(1)}%
                </span>
              </td>
              {hasPrev && (
                <td className={`whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums sm:px-3 ${r.changePct == null ? "font-normal text-slate-400" : changeTone(r.changePct)}`}>
                  {formatChange(r.changePct)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Categories, channels, payments and outlets in one card, one tab each; tabs with no rows are left out. */
export default function SalesBreakdown({ report, params }: { report: ReportData; params: ReportParams }) {
  const tabs = TABS.filter((t) => report[t.key].length > 0 && (t.key !== "outlets" || report.outlets.length > 1));
  const [chosen, setChosen] = useState<Tab["key"]>("categories");
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  if (tabs.length === 0) return null;

  const active = tabs.find((t) => t.key === chosen) ?? tabs[0];
  const rows = report[active.key];
  const hasPrev = report.comparison != null;

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = tabs.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next == null) return;
    e.preventDefault();
    setChosen(tabs[next].key);
    buttons.current[next]?.focus();
  };

  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4" aria-labelledby="report-breakdown-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="report-breakdown-title" className="text-base font-bold text-slate-800 tracking-tight">Where sales came from</h2>
          <p className="text-xs text-slate-500">{active.note}</p>
        </div>
        <CsvButton params={params} section={active.key} label={active.label.toLowerCase()} />
      </div>

      <div role="tablist" aria-label="Split sales by" className="flex flex-wrap gap-1 border-b border-slate-100">
        {tabs.map((t, i) => {
          const selected = t.key === active.key;
          return (
            <button
              key={t.key}
              ref={(el) => {
                buttons.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`report-tab-${t.key}`}
              aria-selected={selected}
              aria-controls="report-breakdown-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setChosen(t.key)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                selected ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div id="report-breakdown-panel" role="tabpanel" aria-labelledby={`report-tab-${active.key}`} tabIndex={0} className="outline-none">
        {active.key === "channels" && rows.length === 1 ? (
          <p className="py-4 text-sm text-slate-700">
            All sales came through <span className="font-semibold text-slate-800">{rows[0].label}</span>.
          </p>
        ) : (
          <Rows rows={rows} firstColumn={active.firstColumn} hasPrev={hasPrev} />
        )}
      </div>
    </section>
  );
}
