"use client";

import React, { useState, useMemo } from "react";
import { X, Zap, CheckCircle2, AlertTriangle, Building2, Package, IndianRupee, Loader2 } from "lucide-react";
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
        message: `Created ${supplierIds.length} Restock Purchase Order(s)!`,
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
      className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 bg-zinc-50/80">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#D3232A] p-2.5 text-white shadow-xs">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h2 id="restock-items-title" className="text-base sm:text-lg font-black text-zinc-900">
              Quick Restock Low Items
            </h2>
            <p className="text-xs text-zinc-500 font-medium">1-Click purchase orders for low stock items</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 max-h-[80vh] overflow-y-auto space-y-4">
        {feedback && (
          <div
            className={`rounded-xl border p-3.5 text-xs font-bold flex items-center gap-2 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {lines.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Package className="h-8 w-8 mx-auto text-zinc-300 mb-2" />
            <p className="text-sm font-bold text-zinc-800">No items currently need restocking</p>
            <p className="text-xs text-zinc-500 mt-1">All stock levels are looking good!</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {lines.map((line) => {
              const assignedSup = suppliers.find((s) => s.id === line.selectedSupplierId);
              const isChangingSupplier = editingSupplierItemId === line.item.id;
              const itemSuppliers = getFilteredSuppliers(line.item.category);

              return (
                <div key={line.item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-zinc-900 text-sm">{line.item.name}</p>
                    <p className="text-xs text-amber-800 font-semibold mt-0.5">
                      {line.item.currentStock} {line.item.unit} remaining
                    </p>

                    {/* Auto Supplier info */}
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                      <span>Supplier: <strong className="text-zinc-800">{assignedSup?.name || "Default Supplier"}</strong></span>
                      {!isChangingSupplier ? (
                        <button
                          type="button"
                          onClick={() => setEditingSupplierItemId(line.item.id)}
                          className="text-[11px] font-bold text-[#D3232A] hover:underline"
                        >
                          [Change]
                        </button>
                      ) : (
                        <select
                          value={line.selectedSupplierId}
                          onChange={(e) => handleLineSupplierChange(line.item.id, e.target.value)}
                          className="rounded border border-zinc-300 text-xs px-2 py-0.5 bg-white text-zinc-900 font-semibold focus:outline-none"
                        >
                          {itemSuppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-bold text-zinc-600">Order:</span>
                      <input
                        type="number"
                        min="1"
                        value={line.suggestedQty}
                        onChange={(e) => handleLineQtyChange(line.item.id, Number(e.target.value))}
                        className="w-14 rounded-md border border-zinc-300 px-2 py-1 text-center text-xs font-bold text-zinc-900 focus:border-[#D3232A] focus:outline-none bg-white"
                      />
                      <span className="text-xs font-semibold text-zinc-600">{line.item.unit}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(line.item.id)}
                      className="text-zinc-400 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                      title="Remove from order"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estimated Total Footer Summary */}
        <div className="rounded-xl bg-zinc-900 text-white p-4 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Estimated Total</span>
            <p className="text-xl font-extrabold text-emerald-400 flex items-center gap-1 mt-0.5">
              <IndianRupee className="h-4 w-4" />
              {(totalEstimatedPaise / 100).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {lines.length} item(s) to order
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGeneratePOs}
            disabled={isSubmitting || lines.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4 fill-current" /> Restock Low Stock Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
