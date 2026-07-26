"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Building2, Zap, Sliders } from "lucide-react";
import { InventoryItem } from "@/lib/api";

interface Props {
  items: (InventoryItem & { outlet?: { id: string; name: string } })[];
  onAdjust: (item: InventoryItem) => void;
  onOrder?: () => void;
  canManage: boolean;
  isAllOutlets?: boolean;
}

export default function InventoryItemTable({ items, onAdjust, onOrder, canManage, isAllOutlets }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 h-56 text-zinc-400">
        <p className="font-medium text-zinc-600 text-sm">No items match your search filters</p>
        <p className="text-xs">Try searching a different item name or clearing filters.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / pageSize);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedItems = items.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
            <th className="px-5 py-3">Item & Code</th>
            {(isAllOutlets || items.some((i) => i.outlet)) && (
              <th className="px-5 py-3">Outlet</th>
            )}
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3 text-right">Cost / Unit</th>
            <th className="px-5 py-3 text-center">In Stock</th>
            <th className="px-5 py-3 text-center">Min Reorder Level</th>
            <th className="px-5 py-3 text-center">Status</th>
            {canManage && <th className="px-5 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((item, idx) => {
            const isLow = item.currentStock <= item.reorderThreshold;
            const healthPercentage = Math.min(100, Math.max(5, Math.round((item.currentStock / (item.reorderThreshold * 2 || 1)) * 100)));

            return (
              <tr
                key={item.id}
                className={`border-b border-zinc-100 transition-colors ${
                  isLow
                    ? "bg-red-50/80 hover:bg-red-100/70 border-l-4 border-l-red-500"
                    : idx % 2 === 0
                    ? "hover:bg-zinc-50/70"
                    : "bg-zinc-50/30 hover:bg-zinc-50/70"
                }`}
              >
                <td className="px-5 py-3">
                  <p className={`font-bold leading-tight ${isLow ? "text-red-950" : "text-zinc-900"}`}>{item.name}</p>
                  <p className={`text-[11px] font-mono mt-0.5 ${isLow ? "text-red-600 font-semibold" : "text-zinc-400"}`}>
                    Code: {item.sku}
                  </p>
                </td>
                {(isAllOutlets || items.some((i) => i.outlet)) && (
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                      <Building2 className="h-3 w-3 shrink-0" />
                      {item.outlet?.name || "Branch"}
                    </span>
                  </td>
                )}
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${isLow ? "bg-red-100 text-red-700" : "bg-zinc-100 text-zinc-600"}`}>
                    {item.category}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-zinc-700 tabular-nums font-semibold">
                  ₹{(item.unitCostPaise / 100).toFixed(2)}
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-base font-bold tabular-nums ${isLow ? "text-red-600 animate-pulse" : "text-zinc-800"}`}>
                      {item.currentStock} <span className="text-[11px] text-zinc-500 font-normal">{item.unit}</span>
                    </span>
                    {/* Visual Health Progress Meter */}
                    <div className="w-16 h-1.5 bg-zinc-200 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? "bg-red-500" : healthPercentage < 75 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${healthPercentage}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-center text-zinc-500 text-xs tabular-nums font-medium">
                  {item.reorderThreshold} {item.unit}
                </td>
                <td className="px-5 py-3 text-center">
                  {isLow ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 shadow-2xs">
                      <AlertTriangle className="h-3 w-3 text-red-600" /> Low Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Healthy
                    </span>
                  )}
                </td>
                {canManage && (
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {isLow && onOrder && (
                        <button
                          onClick={onOrder}
                          className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500 to-[#D3232A] px-2.5 py-1 text-xs font-bold text-white hover:opacity-90 transition-opacity shadow-2xs"
                        >
                          <Zap className="h-3 w-3 fill-current" /> Order
                        </button>
                      )}
                      <button
                        id={`adjust-btn-${item.id}`}
                        onClick={() => onAdjust(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-2xs group"
                      >
                        <Sliders className="h-3 w-3 text-zinc-400 group-hover:text-white transition-colors" /> Adjust
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-zinc-50/80 border-t border-zinc-200 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs font-semibold text-zinc-800 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
          <span className="text-zinc-400 ml-2">|</span>
          <span className="ml-2">
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, items.length)}</strong> of <strong>{items.length}</strong> items
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-medium">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
