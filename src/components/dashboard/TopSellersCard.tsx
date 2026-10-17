"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import { TopSellingItemPoint } from "@/redux/slices/dashboardApiSlice";

interface TopSellersCardProps {
  items: TopSellingItemPoint[];
  rangeLabel: string; // "this month"
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/**
 * Best-selling dishes as a ranked list with a bar per row (long dish names read better across than
 * under a vertical bar chart).
 */
export default function TopSellersCard({ items, rangeLabel }: TopSellersCardProps) {
  const max = Math.max(1, ...items.map((i) => i.volume));
  const totalSales = items.reduce((s, i) => s + i.revenue, 0);

  return (
    <section
      className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4"
      aria-labelledby="top-sellers-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <h2 id="top-sellers-title" className="text-base font-bold text-slate-800 tracking-tight">
              Top sellers
            </h2>
            <p className="text-xs text-slate-500">
              {items.length ? `Top ${items.length} brought in ${inr(totalSales)} ${rangeLabel}` : `Units sold ${rangeLabel}`}
            </p>
          </div>
        </div>
        <Link
          href="/menu"
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Menu <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No dishes sold {rangeLabel} yet.</p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, idx) => (
            <li key={item.name} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-3 gap-y-1">
              <span className="text-sm font-semibold text-slate-400 tabular-nums">{idx + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {item.name} <span className="font-normal text-slate-500">· {item.category}</span>
                </p>
              </div>
              <p className="text-right text-sm tabular-nums text-slate-900">
                <span className="font-semibold">{item.volume}</span> <span className="text-slate-500">sold</span>
              </p>
              <span />
              <div className="h-2 rounded-full bg-slate-100" aria-hidden="true">
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(4, (item.volume / max) * 100)}%` }} />
              </div>
              <p className="text-right text-xs text-slate-500 tabular-nums">{inr(item.revenue)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
