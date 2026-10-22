"use client";

import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ReportData, ReportTotals } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise } from "@/lib/reportQuery";

interface Figure {
  label: string;
  key: keyof ReportTotals;
  money: boolean;
  lowerIsBetter?: boolean;
  neutral?: boolean;
  note?: string;
}

// Same figures and colour rules as the PDF's headline table, split into the four that matter most and the rest
const HEADLINE: Figure[] = [
  { label: "Sales (before tax)", key: "netSalesPaise", money: true, note: "Settled orders, after discounts" },
  { label: "Orders", key: "orders", money: false, note: "Settled orders" },
  { label: "Average order value", key: "avgOrderPaise", money: true, note: "Sales divided by orders" },
  { label: "Stock wasted", key: "wastePaise", money: true, lowerIsBetter: true, note: "Value of stock logged as waste" },
];
const OTHER: Figure[] = [
  { label: "Items sold", key: "itemsSold", money: false },
  { label: "Discounts", key: "discountPaise", money: true, neutral: true },
  { label: "Tax collected", key: "taxPaise", money: true, neutral: true },
  { label: "Service charge", key: "serviceChargePaise", money: true, neutral: true },
  { label: "Cancelled orders", key: "cancelledOrders", money: false, lowerIsBetter: true },
];

const BADGE: Record<string, string> = {
  "text-emerald-700": "bg-emerald-50 border-emerald-200",
  "text-rose-600": "bg-rose-50 border-rose-200",
  "text-slate-500": "bg-slate-50 border-slate-200",
};

const show = (t: ReportTotals, f: Figure) => (f.money ? formatPaise(t[f.key]) : formatCount(t[f.key]));

/** Headline cards (this period, change, comparison value) and a strip with the smaller figures. */
export default function ComparisonKpis({ report }: { report: ReportData }) {
  const { current, previous, changePct } = report.totals;
  const compareLabel = report.comparison?.compareLabel;
  const pctOf = (f: Figure) => (previous ? changePct[f.key] ?? null : null);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {HEADLINE.map((f) => {
          const pct = pctOf(f);
          const tone = changeTone(pct, f.lowerIsBetter, f.neutral);
          return (
            <div key={f.key} className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
              <span className="truncate text-xs font-semibold text-slate-500" title={f.label}>{f.label}</span>
              <span className="mt-2 truncate text-xl sm:text-2xl font-bold tabular-nums tracking-tight text-slate-800">{show(current, f)}</span>
              {/* Always under the value; no badge when there's nothing to compare with */}
              <div className="mt-1.5 h-6">
                {pct != null && (
                  <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${tone} ${BADGE[tone]}`}>
                    {pct === 0 ? <Minus className="h-3.5 w-3.5" /> : pct > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {formatChange(pct)}
                  </span>
                )}
              </div>
              {f.note && <p className="mt-1.5 truncate text-xs text-slate-500" title={f.note}>{f.note}</p>}
              {compareLabel && (
                <div className="mt-auto pt-3">
                  <div className="border-t border-slate-100 pt-2 text-xs text-slate-500">
                    <span className="block truncate" title={compareLabel}>{compareLabel}</span>
                    <span className="block font-semibold tabular-nums text-slate-600">{previous ? show(previous, f) : "—"}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs" aria-labelledby="report-other-title">
        <h2 id="report-other-title" className="text-sm font-bold text-slate-800 tracking-tight">Other figures</h2>
        <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-3">
          {OTHER.map((f) => {
            const pct = pctOf(f);
            return (
              <div key={f.key} className="min-w-0">
                <dt className="truncate text-xs font-semibold text-slate-500" title={f.label}>{f.label}</dt>
                <dd className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap">
                  <span className="truncate text-base font-bold tabular-nums text-slate-800">{show(current, f)}</span>
                  {pct != null && <span className={`text-xs font-semibold tabular-nums ${changeTone(pct, f.lowerIsBetter, f.neutral)}`}>{formatChange(pct)}</span>}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-3 text-xs text-slate-500">Tax collected and service charge are not counted in sales.</p>
      </section>
    </>
  );
}
