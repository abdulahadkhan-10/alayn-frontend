"use client";

import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Search } from "lucide-react";
import type { ReportItemRow } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise, type ReportParams } from "@/lib/reportQuery";
import { CsvButton } from "./ExportMenu";

type SortKey = "qty" | "sales" | "change";
const FIRST_ROWS = 25;

const value = (r: ReportItemRow, key: SortKey) =>
  key === "qty" ? r.qty : key === "sales" ? r.salesPaise : r.changePct ?? 0;

interface ItemsTableProps {
  items: ReportItemRow[];
  hasPrev: boolean;
  empty: boolean;
  params: ReportParams;
}

/** Every dish sold in the period: searchable, sortable, the first 25 until "Show all". */
export default function ItemsTable({ items, hasPrev, empty, params }: ItemsTableProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "sales", desc: true });
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q ? items.filter((i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)) : items;
    return [...matched].sort((a, b) => {
      // Items with no change figure stay at the bottom either way
      if (sort.key === "change" && (a.changePct == null) !== (b.changePct == null)) return a.changePct == null ? 1 : -1;
      const d = sort.key === "change" && a.changePct == null ? 0 : value(a, sort.key) - value(b, sort.key);
      return (sort.desc ? -d : d) || a.name.localeCompare(b.name);
    });
  }, [items, query, sort]);
  const shown = showAll ? rows : rows.slice(0, FIRST_ROWS);

  const header = (key: SortKey, label: string) => {
    const active = sort.key === key;
    return (
      <th className="whitespace-nowrap px-3 py-2 text-right" aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}>
        <button
          type="button"
          onClick={() => setSort(active ? { key, desc: !sort.desc } : { key, desc: true })}
          className={`inline-flex items-center gap-1 whitespace-nowrap font-semibold ${active ? "text-slate-800" : "text-slate-500 hover:text-slate-800"}`}
        >
          {label}
          {active && (sort.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
        </button>
      </th>
    );
  };

  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4" aria-labelledby="report-items-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="report-items-title" className="text-base font-bold text-slate-800 tracking-tight">Items</h2>
          <p className="text-xs text-slate-500">Item sales before bill discounts</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!empty && items.length > 0 && (
            <label className="relative">
              <span className="sr-only">Search items</span>
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items"
                className="w-48 rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none focus:border-blue-400"
              />
            </label>
          )}
          {!empty && items.length > 0 && <CsvButton params={params} section="items" label="items" />}
        </div>
      </div>

      {empty || items.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No sales in this period</p>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No items match &ldquo;{query}&rdquo;</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 text-left">Item</th>
                  {header("qty", "Quantity")}
                  {header("sales", "Sales")}
                  {hasPrev && <th className="whitespace-nowrap px-3 py-2 text-right">Before</th>}
                  {hasPrev && header("change", "Change")}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => (
                  <tr key={r.menuItemId} className="text-slate-700">
                    <td className="px-3 py-2">
                      <span className="font-medium text-slate-800">{r.name}</span>
                      <span className="block text-xs text-slate-500">{r.category}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCount(r.qty)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatPaise(r.salesPaise)}</td>
                    {hasPrev && (
                      <td className="px-3 py-2 text-right tabular-nums text-slate-500">
                        {r.prevSalesPaise == null ? "—" : formatPaise(r.prevSalesPaise)}
                      </td>
                    )}
                    {hasPrev && (
                      <td className={`px-3 py-2 text-right font-semibold tabular-nums ${r.changePct == null ? "font-normal text-slate-400" : changeTone(r.changePct)}`}>
                        {formatChange(r.changePct)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > FIRST_ROWS && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="self-center rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showAll ? "Show fewer" : `Show all ${formatCount(rows.length)} items`}
            </button>
          )}
        </>
      )}
    </section>
  );
}
