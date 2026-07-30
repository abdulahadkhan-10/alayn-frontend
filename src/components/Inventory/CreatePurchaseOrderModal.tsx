"use client";

import React, { useState, useMemo } from "react";
import { X, Trash2, IndianRupee, Loader2, CheckCircle2, AlertTriangle, ChevronDown } from "lucide-react";
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

  React.useEffect(() => {
    if (!selectedSupplierId && suppliers.length > 0) {
      setSelectedSupplierId(prefilledSupplierId || suppliers[0].id);
    }
  }, [suppliers, prefilledSupplierId, selectedSupplierId]);

  const [lines, setLines] = useState<CustomPOLine[]>([]);
  const [selectedItemIdToAdd, setSelectedItemIdToAdd] = useState<string>("");
  const [addQty, setAddQty] = useState<number>(10);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const selectedSup = suppliers.find((s) => s.id === selectedSupplierId);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-po-modal-title"
      className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
    >
      {/* 1. Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white shrink-0">
        <div>
          <h2 id="add-po-modal-title" className="text-lg font-semibold text-zinc-900 tracking-tight">
            Create Purchase Order
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Select a vendor and configure items for your order</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmitPO} className="flex flex-col flex-1 min-h-0">
        {/* 2. Top Setup Section: Horizontal 2-Column Grid */}
        <div className="p-7 pb-4 bg-zinc-50/50 border-b border-zinc-100 shrink-0 space-y-4">
          {feedback && (
            <div
              className={`rounded-xl border p-3.5 text-xs font-medium flex items-center gap-2.5 ${
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Vendor Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Select Vendor
              </label>
              {isLoadingSuppliers ? (
                <div className="h-10 rounded-xl bg-zinc-100 animate-pulse" />
              ) : (
                <div className="relative">
                  <select
                    required
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.type === "ONLINE" ? "Online" : "Offline"}){s.category ? ` · ${s.category}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
              )}
              {selectedSup && (
                <p className="text-[11px] text-zinc-500 font-medium pt-0.5">
                  {selectedSup.type === "ONLINE"
                    ? "Online Vendor · Automated portal dispatch sync"
                    : "Offline Vendor · Manual order phone / paper invoice"}
                </p>
              )}
            </div>

            {/* Right Column: Add Item Bar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                Add Inventory Item
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedItemIdToAdd}
                    onChange={(e) => setSelectedItemIdToAdd(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                  >
                    <option value="">Choose item to add…</option>
                    {unaddedItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.currentStock || 0} {item.unit} in stock)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={addQty}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                  className="w-16 rounded-xl border border-zinc-300 bg-white px-2.5 py-2.5 text-center text-xs font-semibold text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                />
                <button
                  type="button"
                  onClick={handleAddItemLine}
                  disabled={!selectedItemIdToAdd}
                  className="rounded-xl bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0 shadow-xs"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Added Line Items Section */}
        <div className="flex-1 overflow-y-auto p-7 min-h-[160px]">
          {lines.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <p className="text-xs font-medium text-zinc-500">No items added to this purchase order yet</p>
              <p className="text-[11px] text-zinc-400 mt-1">Select an item above and click "Add Item"</p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="pb-3 w-5/12">Item Name</th>
                    <th className="pb-3 text-center w-2/12">Quantity</th>
                    <th className="pb-3 text-center w-2/12">Unit Cost (₹)</th>
                    <th className="pb-3 text-right w-2/12">Line Total</th>
                    <th className="pb-3 text-right w-1/12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {lines.map((line) => (
                    <tr key={line.itemId} className="hover:bg-zinc-50/60 transition-colors">
                      <td className="py-3.5 pr-3">
                        <p className="font-medium text-zinc-900 text-sm leading-snug">{line.itemName}</p>
                        <p className="text-[11px] text-zinc-400">{line.currentStock} {line.unit} in stock</p>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1 border border-zinc-200 rounded-lg bg-white px-2 py-1">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) => handleQtyChange(line.itemId, Number(e.target.value))}
                            className="w-12 text-center text-xs font-semibold text-zinc-900 focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-400 font-medium">{line.unit}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1 border border-zinc-200 rounded-lg bg-white px-2 py-1">
                          <span className="text-[11px] text-zinc-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={line.unitCostRupees}
                            onChange={(e) => handleCostChange(line.itemId, Number(e.target.value))}
                            className="w-16 text-center text-xs font-semibold text-zinc-900 focus:outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-3.5 pl-3 text-right font-semibold text-zinc-900 tabular-nums">
                        ₹{(line.quantity * line.unitCostRupees).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.itemId)}
                          className="h-7 w-7 inline-flex items-center justify-center text-zinc-300 hover:text-rose-600 rounded-md transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Footer */}
        <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">Total Amount</span>
            <span className="text-xl font-bold text-zinc-900 flex items-center gap-0.5 mt-0.5">
              <IndianRupee className="h-4 w-4 text-zinc-500" />
              {(totalPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || lines.length === 0 || !selectedSupplierId}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#b01e23] disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating Order…
                </>
              ) : (
                "Create Purchase Order"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
