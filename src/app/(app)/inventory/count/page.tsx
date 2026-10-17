"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { ArrowLeft, Building2, CheckCircle2, AlertTriangle, Loader2, Search } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InventoryNavTabs from "@/components/Inventory/InventoryNavTabs";
import { useBranch } from "@/lib/BranchContext";
import {
  StockCountResult,
  useGetItemsQuery,
  useRecordStockCountMutation,
} from "@/redux/slices/inventoryApiSlice";

const qty = (n: number) => `${+n.toFixed(2)}`;

/*
 * Stock count: someone looks at the shelf and types what's there. Menu items aren't linked to stock,
 * so this is what keeps stock levels true, and what run-out dates are worked out from.
 */
export default function StockCountPage() {
  const { activeBranch, loading: branchLoading } = useBranch();
  const { data, isLoading } = useGetItemsQuery(undefined, { skip: !activeBranch });
  const [recordCount, { isLoading: isSaving }] = useRecordStockCountMutation();

  const [counts, setCounts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<StockCountResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAllOutlets = activeBranch?.id === "all";
  const items = useMemo(() => data?.items ?? [], [data]);

  // Grouped by category, like a walk through the store room
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, typeof items>();
    for (const item of items) {
      if (q && !item.name.toLowerCase().includes(q)) continue;
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [items, search]);

  const entered = Object.entries(counts).filter(([, v]) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0);
  const invalid = Object.values(counts).some((v) => v.trim() !== "" && !(Number.isFinite(Number(v)) && Number(v) >= 0));

  async function handleSave() {
    setError(null);
    try {
      const saved = await recordCount({ counts: entered.map(([itemId, v]) => ({ itemId, counted: Number(v) })) }).unwrap();
      setResult(saved);
      setCounts({});
    } catch (err: unknown) {
      const e = err as { data?: { message?: string }; message?: string };
      setError(e?.data?.message || e?.message || "Couldn't save the count. Please try again.");
    }
  }

  const changed = result?.items.filter((i) => i.difference !== 0) ?? [];

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full gap-5 max-w-3xl mx-auto px-3 sm:px-6 pb-28">
        <InventoryNavTabs />

        <div className="flex flex-col gap-1">
          <Link href="/inventory" className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 w-fit">
            <ArrowLeft className="h-3.5 w-3.5" /> Inventory
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Count stock</h1>
            <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-0.5 text-xs font-bold text-[#D3232A] border border-red-100">
              <Building2 className="h-3.5 w-3.5" />
              {activeBranch?.name || "Main Branch"}
            </span>
          </div>
          <p className="text-sm text-zinc-600 max-w-prose">
            Type what is on the shelf right now. Leave an item blank to skip it. Counting once a week is enough
            for Alayn to learn how fast you use each item and warn you before it runs out.
          </p>
        </div>

        {result && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 shadow-2xs">
            <p className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              Count saved for {result.counted} {result.counted === 1 ? "item" : "items"}
            </p>
            {changed.length > 0 ? (
              <ul className="mt-2 space-y-0.5 text-[13px]">
                {changed.map((i) => (
                  <li key={i.itemId}>
                    {i.name}: {qty(i.counted)} {i.unit}{" "}
                    <span className="text-emerald-800">
                      ({qty(Math.abs(i.difference))} {i.unit} {i.difference < 0 ? "less" : "more"} than Alayn had)
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[13px]">Everything matched what Alayn had.</p>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Find an item…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
        </div>

        {isLoading || branchLoading ? (
          <Skeleton count={6} height={52} borderRadius={12} className="mb-2" />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold text-zinc-700">No stock items yet</p>
            <p className="text-sm text-zinc-500 mt-1">Add the items you keep in stock on the Inventory page first.</p>
          </div>
        ) : (
          groups.map(([category, list]) => (
            <section key={category} className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
              <h2 className="px-4 py-2.5 text-xs font-semibold text-zinc-500 bg-zinc-50 border-b border-zinc-100">{category}</h2>
              <ul className="divide-y divide-zinc-100">
                {list.map((item) => {
                  const value = counts[item.id] ?? "";
                  const bad = value.trim() !== "" && !(Number.isFinite(Number(value)) && Number(value) >= 0);
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <label htmlFor={`count-${item.id}`} className="min-w-0">
                        <span className="block text-sm font-semibold text-zinc-900 truncate">
                          {item.name}
                          {isAllOutlets && item.outlet ? <span className="font-normal text-zinc-500"> · {item.outlet.name}</span> : null}
                        </span>
                        <span className="block text-xs text-zinc-500 tabular-nums">
                          Alayn has {qty(item.currentStock)} {item.unit}
                        </span>
                      </label>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          id={`count-${item.id}`}
                          inputMode="decimal"
                          placeholder="—"
                          value={value}
                          onChange={(e) => setCounts((c) => ({ ...c, [item.id]: e.target.value }))}
                          aria-invalid={bad}
                          className={`w-24 rounded-lg border px-3 py-2 text-right text-sm tabular-nums focus:outline-none ${
                            bad ? "border-red-400 focus:border-red-500" : "border-zinc-200 focus:border-zinc-900"
                          }`}
                        />
                        <span className="w-8 text-xs text-zinc-500">{item.unit}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* Save bar stays in reach on a phone while scrolling the list */}
      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white/95 backdrop-blur px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">
              {invalid
                ? "Fix the numbers marked in red"
                : entered.length
                  ? `${entered.length} ${entered.length === 1 ? "item" : "items"} counted`
                  : "Nothing counted yet"}
            </p>
            <button
              type="button"
              onClick={handleSave}
              disabled={!entered.length || invalid || isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D3232A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#b01e23] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save count
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
