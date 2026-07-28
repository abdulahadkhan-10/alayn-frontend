"use client";

import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, IndianRupee, Loader2, CheckCircle2, AlertTriangle, Building2, Package } from "lucide-react";
import { InventoryItemApi } from "@/redux/slices/inventoryApiSlice";
import {
  useGetSuppliersQuery,
  useCreatePurchaseOrderMutation,
  SupplierApi,
} from "@/redux/slices/procurementApiSlice";

interface CustomPOLine {
  itemId: string;
  itemName: string;
  unit: string;
  currentStock: number;
  quantity: number;
  unitCostRupees: number;
}

interface Props {
  outletId: string;
  allItems: InventoryItemApi[];
  prefilledSupplierId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePurchaseOrderModal({
  outletId,
  allItems = [],
  prefilledSupplierId,
  onClose,
  onSuccess,
}: Props) {
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useGetSuppliersQuery(undefined, {
    skip: !outletId,
  });
  const [createPO, { isLoading: isSubmitting }] = useCreatePurchaseOrderMutation();

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(() => {
    if (prefilledSupplierId) return prefilledSupplierId;
    return suppliers[0]?.id || "";
  });

  // Auto-set first supplier when suppliers load
  React.useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      setSelectedSupplierId(prefilledSupplierId || suppliers[0].id);
    }
  }, [suppliers, prefilledSupplierId, selectedSupplierId]);

  const [lines, setLines] = useState<CustomPOLine[]>([]);
  const [selectedItemIdToAdd, setSelectedItemIdToAdd] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(10);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Unadded items available in dropdown
  const unaddedItems = useMemo(() => {
    const existingIds = new Set(lines.map((l) => l.itemId));
    return allItems.filter((i) => !existingIds.has(i.id));
  }, [allItems, lines]);

  const handleAddItemLine = () => {
    if (!selectedItemIdToAdd) return;
    const foundItem = allItems.find((i) => i.id === selectedItemIdToAdd);
    if (!foundItem) return;

    const rupees = (foundItem.unitCostPaise || 0) / 100;

    setLines((prev) => [
      ...prev,
      {
        itemId: foundItem.id,
        itemName: foundItem.name,
        unit: foundItem.unit,
        currentStock: foundItem.currentStock || 0,
        quantity: Math.max(1, addQty),
        unitCostRupees: rupees,
      },
    ]);

    setSelectedItemIdToAdd("");
    setAddQty(10);
  };

  const handleQtyChange = (itemId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, quantity: Math.max(1, qty) } : l))
    );
  };

  const handleCostChange = (itemId: string, rupees: number) => {
    setLines((prev) =>
      prev.map((l) => (l.itemId === itemId ? { ...l, unitCostRupees: Math.max(0, rupees) } : l))
    );
  };

  const handleRemoveLine = (itemId: string) => {
    setLines((prev) => prev.filter((l) => l.itemId !== itemId));
  };

  const totalPaise = useMemo(() => {
    return lines.reduce((sum, line) => sum + Math.round(line.quantity * line.unitCostRupees * 100), 0);
  }, [lines]);

  const handleSubmitPO = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!selectedSupplierId) {
      setFeedback({ type: "error", message: "Please select a vendor." });
      return;
    }

    if (lines.length === 0) {
      setFeedback({ type: "error", message: "Please add at least one item." });
      return;
    }

    try {
      const payloadItems = lines.map((l) => ({
        itemId: l.itemId,
        orderedQuantity: l.quantity,
        unitCostPaise: Math.round(l.unitCostRupees * 100),
      }));

      await createPO({
        supplierId: selectedSupplierId,
        items: payloadItems,
      }).unwrap();

      setFeedback({
        type: "success",
        message: "Purchase Order created successfully!",
      });

      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.data?.message || err?.message || "Failed to create order.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-po-modal-title"
      className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. FIXED HEADER */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/80 shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#D3232A]" />
          <h2 id="add-po-modal-title" className="text-sm font-bold text-zinc-900">
            Add Purchase Order
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmitPO} className="flex flex-col flex-1 min-h-0">
        {/* 2. FIXED TOP CONTROLS (Vendor Selection & Add Item Bar) */}
        <div className="p-4 pb-2 space-y-2.5 shrink-0 bg-white">
          {feedback && (
            <div
              className={`rounded-xl border p-2.5 text-xs font-bold flex items-center gap-2 ${
                feedback.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Vendor Selection (Soft Blue/Slate Tint Box) */}
          <div className="flex items-center gap-2.5 bg-slate-50/90 border border-slate-200/80 p-2.5 rounded-xl">
            <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
            <label className="text-xs font-bold text-slate-700 shrink-0">Vendor:</label>
            {isLoadingSuppliers ? (
              <span className="text-xs text-zinc-400">Loading vendors...</span>
            ) : (
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white focus:border-[#D3232A] focus:outline-none shadow-2xs"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.category ? `(${s.category})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Add Item Row (Soft Amber/Red Tint Box) */}
          <div className="flex items-center gap-2 bg-amber-50/40 border border-amber-200/60 p-2.5 rounded-xl">
            <Package className="h-4 w-4 text-amber-600 shrink-0" />
            <select
              value={selectedItemIdToAdd}
              onChange={(e) => setSelectedItemIdToAdd(e.target.value)}
              className="flex-1 rounded-lg border border-amber-200/80 px-3 py-1.5 text-xs font-bold bg-white text-zinc-900 focus:border-[#D3232A] focus:outline-none"
            >
              <option value="">+ Select item from inventory...</option>
              {unaddedItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentStock || 0} {item.unit})
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={addQty}
              onChange={(e) => setAddQty(Number(e.target.value))}
              className="w-16 rounded-lg border border-amber-200/80 px-2 py-1.5 text-center text-xs font-bold text-zinc-900 bg-white"
            />
            <button
              type="button"
              onClick={handleAddItemLine}
              disabled={!selectedItemIdToAdd}
              className="rounded-lg bg-[#D3232A] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#b01e23] disabled:opacity-40 transition-colors shrink-0 shadow-2xs"
            >
              Add
            </button>
          </div>
        </div>

        {/* 3. ONLY THIS ITEMS LIST INSIDE SCROLLS */}
        <div className="flex-1 overflow-y-auto min-h-[140px] max-h-[360px] px-4 py-1 space-y-1.5 scrollbar-thin">
          {lines.length === 0 ? (
            <div className="py-8 px-3 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50 my-auto">
              <p className="text-xs font-semibold text-zinc-500">No items added to this purchase order yet</p>
              <p className="text-[11px] text-zinc-400 mt-1">Select an item above and click "Add"</p>
            </div>
          ) : (
            lines.map((line) => (
              <div
                key={line.itemId}
                className="p-2.5 bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs transition-all"
              >
                <div className="min-w-0 flex-1 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <p className="font-bold text-zinc-900 text-xs truncate">{line.itemName}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Quantity Pill */}
                  <div className="flex items-center gap-1 bg-slate-100/90 border border-slate-200 px-2 py-0.5 rounded-lg">
                    <span className="text-[10px] font-bold text-slate-500">Qty:</span>
                    <input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleQtyChange(line.itemId, Number(e.target.value))}
                      className="w-12 text-center text-xs font-bold text-slate-900 bg-white rounded border border-slate-200 focus:outline-none"
                    />
                    <span className="text-[10px] font-semibold text-slate-600">{line.unit}</span>
                  </div>

                  {/* Unit Cost Pill */}
                  <div className="flex items-center gap-1 bg-emerald-50/90 border border-emerald-200/90 px-2 py-0.5 rounded-lg">
                    <span className="text-[10px] font-bold text-emerald-600">₹:</span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={line.unitCostRupees}
                      onChange={(e) => handleCostChange(line.itemId, Number(e.target.value))}
                      className="w-14 text-center text-xs font-bold text-emerald-900 bg-white rounded border border-emerald-200 focus:outline-none"
                    />
                  </div>

                  {/* Line Total */}
                  <span className="text-xs font-extrabold text-emerald-700 tabular-nums w-16 text-right">
                    ₹{(line.quantity * line.unitCostRupees).toFixed(0)}
                  </span>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveLine(line.itemId)}
                    className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 4. FIXED FOOTER (Total & Action Buttons) */}
        <div className="p-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-3 shrink-0 bg-white">
          <div className="bg-emerald-50/90 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-1.5">
            <span>Total:</span>
            <span className="text-emerald-700 font-black text-sm">
              ₹{(totalPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || lines.length === 0 || !selectedSupplierId}
              className="inline-flex items-center gap-1 rounded-xl bg-[#D3232A] px-4.5 py-1.5 text-xs font-bold text-white hover:bg-[#b01e23] disabled:opacity-50 transition-colors shadow-2xs"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "Create Order"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
