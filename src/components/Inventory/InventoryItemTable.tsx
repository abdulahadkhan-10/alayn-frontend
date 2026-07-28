"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Building2, Sliders, XCircle } from "lucide-react";
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
      <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
        <p className="text-sm font-bold text-zinc-800">No inventory items found</p>
        <p className="text-xs text-zinc-500 max-w-xs">
          Try searching a different item name or clearing your active filters.
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="mt-2 text-xs font-bold text-[#D3232A] hover:underline"
          >
            Clear search filters
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
      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white shadow-2xs">
        <table className="w-full text-sm border-collapse text-left">
          <thead>
            <tr className="bg-zinc-50/80 text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-200/80">
              <th className="px-5 py-3.5 w-[40%]">Item</th>
              {showOutletColumn && <th className="px-4 py-3.5 w-[20%]">Branch</th>}
              <th className="px-4 py-3.5 text-center w-[18%]">In Stock</th>
              <th className="px-4 py-3.5 text-center w-[12%]">Status</th>
              {canManage && <th className="px-5 py-3.5 text-right w-[10%]">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80">
            {paginatedItems.map((item) => {
              const current = item.currentStock || 0;
              const threshold = item.reorderThreshold || 0;

              let statusText = "Good";
              let statusDot = "bg-emerald-500";
              let statusTextColor = "text-emerald-700 font-semibold";
              let qtyStyle = "text-zinc-900 font-bold";

              if (current <= 0) {
                statusText = "Out of Stock";
                statusDot = "bg-rose-500";
                statusTextColor = "text-rose-700 font-semibold";
                qtyStyle = "text-rose-700 font-bold";
              } else if (current <= threshold) {
                statusText = "Low";
                statusDot = "bg-amber-500";
                statusTextColor = "text-amber-700 font-semibold";
                qtyStyle = "text-amber-800 font-bold";
              }

              return (
                <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                  {/* Item Name with Status Dot Symbol on the Left */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot}`}
                        title={`Status: ${statusText}`}
                      />
                      <div>
                        <p className="font-bold text-zinc-900 text-sm leading-snug">{item.name}</p>
                        <p className="text-[11px] text-zinc-500 font-medium mt-0.5">{item.category}</p>
                      </div>
                    </div>
                  </td>

                  {/* Branch Location (if applicable) */}
                  {showOutletColumn && (
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                        <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span>{item.outlet?.name || "Main Branch"}</span>
                      </span>
                    </td>
                  )}

                  {/* In Stock */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={`text-sm tabular-nums ${qtyStyle}`}>
                      {current} <span className="text-xs font-normal text-zinc-500">{item.unit}</span>
                    </span>
                  </td>

                  {/* Clean Text Status */}
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    <span className={`text-xs ${statusTextColor}`}>
                      {statusText}
                    </span>
                  </td>

                  {/* Action Button */}
                  {canManage && (
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        id={`update-btn-${item.id}`}
                        onClick={() => onAdjust(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-white border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:border-zinc-900 hover:bg-zinc-900 hover:text-white transition-all shadow-2xs"
                      >
                        <Sliders className="h-3.5 w-3.5 text-zinc-400" /> Update
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / Tablet List View */}
      <div className="sm:hidden divide-y divide-zinc-200/80 rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
        {paginatedItems.map((item) => {
          const current = item.currentStock || 0;
          const threshold = item.reorderThreshold || 0;

          let statusText = "Good";
          let statusDot = "bg-emerald-500";

          if (current <= 0) {
            statusText = "Out of Stock";
            statusDot = "bg-rose-500";
          } else if (current <= threshold) {
            statusText = "Low";
            statusDot = "bg-amber-500";
          }

          return (
            <div key={item.id} className="p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${statusDot}`} />
                  <p className="font-bold text-zinc-900 text-sm truncate">{item.name}</p>
                </div>
                <p className="text-xs text-zinc-500 font-medium mt-0.5 ml-4.5">{item.category}</p>
                <p className="text-xs font-bold text-zinc-900 mt-1 ml-4.5">
                  {current} <span className="text-xs font-normal text-zinc-500">{item.unit} in stock</span>
                </p>
              </div>

              {canManage && (
                <button
                  onClick={() => onAdjust(item)}
                  className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition-colors shrink-0"
                >
                  Update
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-zinc-50/80 border-t border-zinc-200 text-xs text-zinc-600">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-800 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
          <span className="text-zinc-300 ml-1">|</span>
          <span className="ml-1">
            Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + pageSize, items.length)}</strong> of <strong>{items.length}</strong> items
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage === 1}
            className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 font-semibold text-zinc-700">
            Page {safeCurrentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            className="rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}


