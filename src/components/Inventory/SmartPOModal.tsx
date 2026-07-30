"use client";

import React, { useState, useMemo } from "react";
import { X, CheckCircle2, AlertTriangle, Package, IndianRupee, Loader2, ChevronDown } from "lucide-react";
import { InventoryItemApi } from "@/redux/slices/inventoryApiSlice";
import {
  useGetSuppliersQuery,
  useCreatePurchaseOrderMutation,
  SupplierApi,
} from "@/redux/slices/procurementApiSlice";

interface SmartPOItemLine {
  item: InventoryItemApi;
  suggestedQty: number;
  unitCostPaise: number;
  selectedSupplierId: string;
}

interface Props {
  outletId: string;
  lowStockItems: InventoryItemApi[];
  allItems?: InventoryItemApi[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function SmartPOModal({
  outletId,
  lowStockItems,
  onClose,
  onSuccess,
}: Props) {
  const { data: suppliers = [] } = useGetSuppliersQuery(undefined, { skip: !outletId });
  const [createPO, { isLoading: isSubmitting }] = useCreatePurchaseOrderMutation();

  const [editingSupplierItemId, setEditingSupplierItemId] = useState<string | null>(null);
  const [lines, setLines] = useState<SmartPOItemLine[]>(() => {
    return lowStockItems.map((item) => {
      const current = item.currentStock || 0;
      const reorder = item.reorderThreshold || 1;
      const suggested = Math.max(Math.ceil(reorder * 2 - current), 5);

      return {
        item,
        suggestedQty: suggested,
        unitCostPaise: item.unitCostPaise,
        selectedSupplierId: "",
      };
    });
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Auto-match supplier for item category
  const getFilteredSuppliers = (itemCategory?: string): SupplierApi[] => {
    if (!itemCategory || suppliers.length === 0) return suppliers;
    const catLower = itemCategory.toLowerCase().trim();
    const categoryMatches = suppliers.filter((s) => {
      if (!s.category) return false;
      const supCatLower = s.category.toLowerCase().trim();
      return supCatLower === catLower || supCatLower.includes(catLower) || catLower.includes(supCatLower);
    });
    return categoryMatches.length > 0 ? categoryMatches : suppliers;
  };

  // Set default category-matched suppliers when suppliers load
  React.useEffect(() => {
    if (suppliers.length > 0) {
      setLines((prev) =>
        prev.map((l) => {
          if (l.selectedSupplierId) return l;
          const matched = getFilteredSuppliers(l.item.category);
          return {
            ...l,
            selectedSupplierId: matched[0]?.id || suppliers[0].id,
          };
        })
      );
    }
  }, [suppliers]);

  const handleLineQtyChange = (itemId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.item.id === itemId ? { ...l, suggestedQty: Math.max(1, qty) } : l))
    );
  };

  const handleLineSupplierChange = (itemId: string, supId: string) => {
    setLines((prev) =>
      prev.map((l) => (l.item.id === itemId ? { ...l, selectedSupplierId: supId } : l))
    );
    setEditingSupplierItemId(null);
  };

  const handleRemoveLine = (itemId: string) => {
    setLines((prev) => prev.filter((l) => l.item.id !== itemId));
  };

  // Group lines by supplier
  const groupedBySupplier = useMemo(() => {
    const map: Record<string, SmartPOItemLine[]> = {};
    lines.forEach((line) => {
      const supId = line.selectedSupplierId || (suppliers[0]?.id ?? "default");
      if (!map[supId]) map[supId] = [];
      map[supId].push(line);
    });
    return map;
  }, [lines, suppliers]);

  const totalEstimatedPaise = useMemo(() => {
    return lines.reduce((sum, line) => sum + line.suggestedQty * line.unitCostPaise, 0);
  }, [lines]);

  const handleGeneratePOs = async () => {
    setFeedback(null);
    const supplierIds = Object.keys(groupedBySupplier);

    if (supplierIds.length === 0 || lines.length === 0) {
      setFeedback({ type: "error", message: "No items selected to order." });
      return;
    }

    try {
      for (const supId of supplierIds) {
        const poLines = groupedBySupplier[supId].map((l) => ({
          itemId: l.item.id,
          orderedQuantity: l.suggestedQty,
          unitCostPaise: l.unitCostPaise,
        }));

        await createPO({
          supplierId: supId,
          items: poLines,
        }).unwrap();
      }

      setFeedback({
        type: "success",
        message: `Created ${supplierIds.length} restock purchase order${supplierIds.length > 1 ? "s" : ""}.`,
      });

      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.data?.message || err?.message || "Failed to create restock orders.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restock-items-title"
      className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100">
        <div>
          <h2 id="restock-items-title" className="text-lg font-semibold text-zinc-900 tracking-tight">
            Restock Low Items
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review quantities and submit purchase orders to suppliers
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="px-7 pt-5 pb-6 max-h-[75vh] overflow-y-auto">

        {/* Feedback banner */}
        {feedback && (
          <div
            className={`mb-5 rounded-xl border p-4 text-sm flex items-start gap-3 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Empty state */}
        {lines.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <Package className="h-9 w-9 mx-auto text-zinc-200 mb-3" />
            <p className="text-sm font-medium text-zinc-600">All stock levels are healthy</p>
            <p className="text-xs text-zinc-400 mt-1">No items currently need restocking.</p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center pb-3 border-b border-zinc-100 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Item</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-right w-32">Supplier</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 text-right w-36">Order Qty</span>
            </div>

            {/* Line items */}
            <div className="divide-y divide-zinc-100">
              {lines.map((line) => {
                const assignedSup = suppliers.find((s) => s.id === line.selectedSupplierId);
                const isChangingSupplier = editingSupplierItemId === line.item.id;
                const itemSuppliers = getFilteredSuppliers(line.item.category);
                const isOnline = assignedSup?.type === "ONLINE";

                return (
                  <div key={line.item.id} className="py-4 grid grid-cols-[1fr_auto_auto] gap-4 items-center">

                    {/* Item info */}
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900 text-sm leading-snug truncate">{line.item.name}</p>
                      <p className="text-xs text-amber-600 font-medium mt-0.5">
                        {line.item.currentStock} {line.item.unit} remaining
                      </p>
                    </div>

                    {/* Supplier column */}
                    <div className="w-36 flex flex-col items-end gap-1">
                      {!isChangingSupplier ? (
                        <>
                          <span className="text-xs font-medium text-zinc-700 text-right leading-snug truncate max-w-[130px]">
                            {assignedSup?.name || "Default"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-semibold tracking-wide ${isOnline ? "text-emerald-600" : "text-zinc-400"}`}>
                              {isOnline ? "Online" : "Offline"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingSupplierItemId(line.item.id)}
                              className="text-[11px] text-zinc-400 hover:text-zinc-700 underline underline-offset-2 transition-colors"
                            >
                              Change
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="relative w-full">
                          <select
                            value={line.selectedSupplierId}
                            onChange={(e) => handleLineSupplierChange(line.item.id, e.target.value)}
                            className="w-full appearance-none rounded-lg border border-zinc-300 text-xs px-2.5 py-1.5 pr-7 bg-white text-zinc-900 font-medium focus:border-zinc-600 focus:outline-none"
                          >
                            {itemSuppliers.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} · {s.type === "ONLINE" ? "Online" : "Offline"}
                                {s.category ? ` · ${s.category}` : ""}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400" />
                        </div>
                      )}
                    </div>

                    {/* Qty + remove */}
                    <div className="w-32 flex items-center justify-end gap-2">
                      <div className="flex items-center gap-1 border border-zinc-200 rounded-lg overflow-hidden bg-white">
                        <input
                          type="number"
                          min="1"
                          value={line.suggestedQty}
                          onChange={(e) => handleLineQtyChange(line.item.id, Number(e.target.value))}
                          className="w-14 px-2 py-1.5 text-center text-sm font-semibold text-zinc-900 focus:outline-none bg-transparent"
                        />
                        <span className="pr-2.5 text-xs text-zinc-400 font-medium">{line.item.unit}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.item.id)}
                        className="h-7 w-7 flex items-center justify-center text-zinc-300 hover:text-zinc-600 rounded-md transition-colors"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── Estimated Total ── */}
        <div className="mt-6 rounded-xl bg-zinc-50 border border-zinc-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1">Estimated Total</p>
            <p className="text-2xl font-bold text-zinc-900 flex items-center gap-1">
              <IndianRupee className="h-5 w-5 text-zinc-500" />
              {(totalEstimatedPaise / 100).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-zinc-900">{lines.length}</p>
            <p className="text-xs text-zinc-400 font-medium">{lines.length === 1 ? "item" : "items"} to order</p>
          </div>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-end gap-3 mt-5 pt-5 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGeneratePOs}
            disabled={isSubmitting || lines.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {isSubmitting ? "Placing Orders…" : "Place Restock Orders"}
          </button>
        </div>
      </div>
    </div>
  );
}
