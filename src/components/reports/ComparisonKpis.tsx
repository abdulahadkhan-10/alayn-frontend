"use client";

import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { ReportData, ReportTotals } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise } from "@/lib/reportQuery";

// Same figures, order and colour rules as the PDF's headline table
const HEADLINE: { label: string; key: keyof ReportTotals; money: boolean; lowerIsBetter?: boolean; neutral?: boolean; note?: string }[] = [
  { label: "Sales (before tax)", key: "netSalesPaise", money: true, note: "Settled orders, after discounts" },
  { label: "Orders", key: "orders", money: false, note: "Settled orders" },
  { label: "Average order value", key: "avgOrderPaise", money: true },
  { label: "Items sold", key: "itemsSold", money: false },
  { label: "Discounts", key: "discountPaise", money: true, neutral: true },
  { label: "Tax collected", key: "taxPaise", money: true, neutral: true, note: "Not counted in sales" },
  { label: "Service charge", key: "serviceChargePaise", money: true, neutral: true, note: "Not counted in sales" },
  { label: "Cancelled orders", key: "cancelledOrders", money: false, lowerIsBetter: true },
  { label: "Stock wasted", key: "wastePaise", money: true, lowerIsBetter: true, note: "Value of stock logged as waste" },
];

const BADGE: Record<string, string> = {
  "text-emerald-700": "bg-emerald-50 border-emerald-200",
  "text-rose-600": "bg-rose-50 border-rose-200",
  "text-slate-500": "bg-slate-50 border-slate-200",
};

/** Headline cards: this period's value, the comparison value and the change between them. */
export default function ComparisonKpis({ report }: { report: ReportData }) {
  const { current, previous, changePct } = report.totals;
  const show = (t: ReportTotals, k: keyof ReportTotals, money: boolean) => (money ? formatPaise(t[k]) : formatCount(t[k]));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
      {HEADLINE.map((h, idx) => {
        const pct = previous ? changePct[h.key] ?? null : null;
        const tone = changeTone(pct, h.lowerIsBetter, h.neutral);
        return (
          <div key={h.key} className="min-w-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
            <span className="text-xs font-semibold text-slate-500">{h.label}</span>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
              <span className={`${idx === 0 ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"} font-bold tabular-nums tracking-tight text-slate-800`}>
                {show(current, h.key, h.money)}
              </span>
              {report.comparison && (
                <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${tone} ${BADGE[tone]}`}>
                  {pct == null || pct === 0 ? (
                    <Minus className="h-3.5 w-3.5" />
                  ) : pct > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {formatChange(pct)}
                </span>
              )}
            </div>
            {h.note && <p className="mt-1.5 text-xs leading-snug text-slate-500">{h.note}</p>}
            {report.comparison && (
              <p className="mt-auto pt-2">
                <span className="block border-t border-slate-100 pt-2 text-xs text-slate-500 tabular-nums">
                  {report.comparison.compareLabel}: {previous ? show(previous, h.key, h.money) : "—"}
                </span>
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
