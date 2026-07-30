"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Building2, Sliders } from "lucide-react";
import { InventoryItem } from "@/lib/api";

interface Props {
  items: (InventoryItem & { outlet?: { id: string; name: string } })[];
  onAdjust: (item: InventoryItem) => void;
  canManage: boolean;
  isAllOutlets?: boolean;
  onClearFilters?: () => void;
}

export default function InventoryItemTable({ items, onAdjust, canManage, isAllOutlets, onClearFilters }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 px-4 text-center">
        <p className="text-sm font-semibold text-zinc-700">No inventory items found</p>
        <p className="text-xs text-zinc-400 max-w-xs">
          Try searching a different item name or clearing your active filters.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-2 text-xs font-semibold text-[#D3232A] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / pageSize);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  const showOutletColumn = Boolean(isAllOutlets || items.some((i) => i.outlet));

  return (
    <div className="flex flex-col w-full">

      {/* ── Desktop Table View ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm border-collapse text-left">
          <thead>
            <tr className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
              <th className="px-5 py-3.5 w-[40%]">Item</th>
              {showOutletColumn && <th className="px-4 py-3.5 w-[18%]">Branch</th>}
              <th className="px-4 py-3.5 text-center w-[15%]">In Stock</th>
              <th className="px-4 py-3.5 text-center w-[12%]">Status</th>
              {canManage && <th className="px-5 py-3.5 text-right w-[15%]">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paginatedItems.map((item) => {
              const current = item.currentStock || 0;
              const threshold = item.reorderThreshold || 0;

              type StockStatus = "good" | "low" | "out";
              let status: StockStatus = "good";
              if (current <= 0) status = "out";
              else if (current <= threshold) status = "low";

              const statusMap: Record<StockStatus, { label: string; dot: string; badge: string; qty: string }> = {
                good: {
                  label: "In Stock",
                  dot: "bg-emerald-500",
                  badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  qty: "text-zinc-900 font-bold",
                },
                low: {
                  label: "Low Stock",
                  dot: "bg-amber-500",
                  badge: "bg-amber-50 text-amber-700 border-amber-200",
                  qty: "text-amber-800 font-bold",
                },
                out: {
                  label: "Out of Stock",
                  dot: "bg-rose-500",
                  badge: "bg-rose-50 text-rose-700 border-rose-200",
                  qty: "text-rose-700 font-bold",
                },
              };

              const { label, dot, badge, qty: qtyStyle } = statusMap[status];

              return (
                <tr key={item.id} className="hover:bg-zinc-50/60 transition-colors group">
                  {/* Item Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${dot}`}
                        title={`Status: ${label}`}
                      />
                      <div>
                        <p className="font-semibold text-zinc-900 text-sm leading-snug">{item.name}</p>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{item.category}</p>
                      </div>
                    </div>
                  </td>

                  {/* Branch */}
                  {showOutletColumn && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                        <Building2 className="h-3 w-3 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{item.outlet?.name || "Main Branch"}</span>
                      </span>
                    </td>
                  )}

                  {/* In Stock */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={`text-sm tabular-nums ${qtyStyle}`}>
                      {current}{" "}
                      <span className="text-xs font-normal text-zinc-400">{item.unit}</span>
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}>
                      {label}
                    </span>
                  </td>

                  {/* Action */}
                  {canManage && (
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        id={`update-btn-${item.id}`}
                        onClick={() => onAdjust(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white transition-all duration-150 shadow-sm"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        Update
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View ── */}
      <div className="sm:hidden divide-y divide-zinc-100">
        {paginatedItems.map((item) => {
          const current = item.currentStock || 0;
          const threshold = item.reorderThreshold || 0;

          type StockStatus = "good" | "low" | "out";
          let status: StockStatus = "good";
          if (current <= 0) status = "out";
          else if (current <= threshold) status = "low";

          const dotMap: Record<StockStatus, string> = {
            good: "bg-emerald-500",
            low: "bg-amber-500",
            out: "bg-rose-500",
          };

          const badgeMap: Record<StockStatus, string> = {
            good: "bg-emerald-50 text-emerald-700 border-emerald-200",
            low: "bg-amber-50 text-amber-700 border-amber-200",
            out: "bg-rose-50 text-rose-700 border-rose-200",
          };

          const labelMap: Record<StockStatus, string> = {
            good: "In Stock",
            low: "Low Stock",
            out: "Out of Stock",
          };

          return (
            <div key={item.id} className="px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${dotMap[status]}`} />
                  <p className="font-semibold text-zinc-900 text-sm truncate">{item.name}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 pl-4">
                  <p className="text-[11px] text-zinc-400">{item.category}</p>
                  <span className="text-zinc-300">·</span>
                  <p className="text-xs font-semibold text-zinc-700">
                    {current} <span className="font-normal text-zinc-400">{item.unit}</span>
                  </p>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeMap[status]}`}>
                    {labelMap[status]}
                  </span>
                </div>
              </div>

              {canManage && (
                <button
                  onClick={() => onAdjust(item)}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shrink-0"
                >
                  Update
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Pagination Bar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-zinc-50 border-t border-zinc-200 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-800 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
          <span className="text-zinc-300 mx-1">|</span>
          <span>
            {startIndex + 1}–{Math.min(startIndex + pageSize, items.length)} of {items.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="px-3 font-medium text-zinc-600">
            {safeCurrentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-500 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
