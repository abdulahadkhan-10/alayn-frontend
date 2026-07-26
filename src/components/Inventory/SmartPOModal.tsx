"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Package,
  IndianRupee,
  Loader2,
  Sparkles,
} from "lucide-react";
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
  allItems = [],
  onClose,
  onSuccess,
}: Props) {
  const { data: suppliers = [], isLoading: isLoadingSuppliers } =
    useGetSuppliersQuery(undefined, { skip: !outletId });

  const [createPO, { isLoading: isSubmitting }] =
    useCreatePurchaseOrderMutation();

  const [masterSupplierId, setMasterSupplierId] = useState<string>("");
  const [lines, setLines] = useState<SmartPOItemLine[]>(() => {
    return lowStockItems.map((item) => {
      // Par-level calculation formula:
      // Suggested Qty = Math.max(reorderThreshold * 2 - currentStock, 5)
      const current = item.currentStock || 0;
      const reorder = item.reorderThreshold || 1;
      const suggested = Math.max(
        Math.ceil(reorder * 2 - current),
        Math.ceil(reorder * 1.5),
        5
      );

      return {
        item,
        suggestedQty: suggested,
        unitCostPaise: item.unitCostPaise,
        selectedSupplierId: "",
      };
    });
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Helper to filter suppliers matching an item's category (e.g. Dairy items show Dairy suppliers)
  const getFilteredSuppliers = (itemCategory?: string): SupplierApi[] => {
    if (!itemCategory || suppliers.length === 0) return suppliers;
    const catLower = itemCategory.toLowerCase().trim();
    
    // Look for strict category matches first
    const categoryMatches = suppliers.filter((s) => {
      if (!s.category) return false;
      const supCatLower = s.category.toLowerCase().trim();
      return (
        supCatLower === catLower ||
        supCatLower.includes(catLower) ||
        catLower.includes(supCatLower)
      );
    });

    // If specific category suppliers exist for this item, return only those
    if (categoryMatches.length > 0) {
      return categoryMatches;
    }

    // Otherwise fallback to all suppliers
    return suppliers;
  };

  // Set default category-matched supplier when suppliers load
  React.useEffect(() => {
    if (suppliers.length > 0) {
      const defaultId = masterSupplierId || suppliers[0].id;
      if (!masterSupplierId) {
        setMasterSupplierId(defaultId);
      }
      setLines((prev) =>
        prev.map((l) => {
          const matched = getFilteredSuppliers(l.item.category);
          const hasSpecificCategorySupplier = matched.length < suppliers.length;
          const selectedId = hasSpecificCategorySupplier
            ? (matched.find((s) => s.id === l.selectedSupplierId)?.id || matched[0].id)
            : (l.selectedSupplierId && suppliers.some((s) => s.id === l.selectedSupplierId) ? l.selectedSupplierId : defaultId);

          return {
            ...l,
            selectedSupplierId: selectedId,
          };
        })
      );
    }
  }, [suppliers]);

  const handleMasterSupplierChange = (supId: string) => {
    setMasterSupplierId(supId);
    setLines((prev) => prev.map((l) => ({ ...l, selectedSupplierId: supId })));
  };

  const handleLineQtyChange = (itemId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.item.id === itemId ? { ...l, suggestedQty: Math.max(1, qty) } : l
      )
    );
  };

  const handleLineSupplierChange = (itemId: string, supId: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.item.id === itemId ? { ...l, selectedSupplierId: supId } : l
      )
    );
  };

  const [selectedAddItem, setSelectedAddItem] = useState<string>("");
  const [showAllCustomItems, setShowAllCustomItems] = useState(false);

  const selectedMasterSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === masterSupplierId);
  }, [suppliers, masterSupplierId]);

  const customItemsPool = useMemo(() => {
    const pool = allItems.length > 0 ? allItems : lowStockItems;
    if (showAllCustomItems || !selectedMasterSupplier?.category) {
      return pool;
    }
    const supCat = selectedMasterSupplier.category.toLowerCase().trim();
    const matched = pool.filter((i) => {
      if (!i.category) return false;
      const itemCat = i.category.toLowerCase().trim();
      return itemCat === supCat || itemCat.includes(supCat) || supCat.includes(itemCat);
    });
    return matched.length > 0 ? matched : pool;
  }, [allItems, lowStockItems, selectedMasterSupplier, showAllCustomItems]);

  const handleAddItemToOrder = (itemId: string) => {
    if (!itemId) return;
    const existing = lines.find((l) => l.item.id === itemId);
    if (existing) {
      handleLineQtyChange(itemId, existing.suggestedQty + 1);
      setSelectedAddItem("");
      return;
    }

    const availablePool = allItems.length > 0 ? allItems : lowStockItems;
    const itemToAdd = availablePool.find((i) => i.id === itemId);
    if (!itemToAdd) return;

    const matchedSuppliers = getFilteredSuppliers(itemToAdd.category);
    const hasSpecificCategorySupplier = matchedSuppliers.length < suppliers.length;
    const defaultSupId = hasSpecificCategorySupplier
      ? matchedSuppliers[0]?.id
      : (masterSupplierId || suppliers[0]?.id || "");

    const newLine: SmartPOItemLine = {
      item: itemToAdd,
      suggestedQty: Math.max(Math.ceil((itemToAdd.reorderThreshold || 1) * 2 - (itemToAdd.currentStock || 0)), 5),
      unitCostPaise: itemToAdd.unitCostPaise,
      selectedSupplierId: defaultSupId,
    };

    setLines((prev) => [...prev, newLine]);
    setSelectedAddItem("");
  };

  const handleRemoveLine = (itemId: string) => {
    setLines((prev) => prev.filter((l) => l.item.id !== itemId));
  };

  // Group lines by supplier ID to generate POs per supplier
  const groupedBySupplier = useMemo(() => {
    const map: Record<string, SmartPOItemLine[]> = {};
    lines.forEach((line) => {
      const supId = line.selectedSupplierId || masterSupplierId;
      if (!supId) return;
      if (!map[supId]) map[supId] = [];
      map[supId].push(line);
    });
    return map;
  }, [lines, masterSupplierId]);

  const totalEstimatedPaise = useMemo(() => {
    return lines.reduce(
      (sum, line) => sum + line.suggestedQty * line.unitCostPaise,
      0
    );
  }, [lines]);

  const handleGeneratePOs = async () => {
    setFeedback(null);
    const supplierIds = Object.keys(groupedBySupplier);

    const invalidLine = lines.find(
      (l) => !Number.isFinite(l.suggestedQty) || l.suggestedQty <= 0
    );
    if (invalidLine) {
      setFeedback({
        type: "error",
        message: `Invalid quantity for "${invalidLine.item.name}". Quantity must be a positive number (1 or greater).`,
      });
      return;
    }

    if (supplierIds.length === 0) {
      setFeedback({
        type: "error",
        message: "Please select a supplier to generate Purchase Orders.",
      });
      return;
    }


    try {
      // Generate PO for each supplier group
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
        message: `Successfully generated ${supplierIds.length} Purchase Order(s) for low stock items!`,
      });

      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message:
          err?.data?.message || err?.message || "Failed to generate Purchase Orders.",
      });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-po-title"
      className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-gradient-to-r from-red-50 via-amber-50 to-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#D3232A] p-2.5 text-white shadow-xs">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h2 id="smart-po-title" className="text-base font-bold text-zinc-900 flex items-center gap-2">
              Quick Restock Order
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-[#D3232A] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                <Sparkles className="h-3 w-3" /> Smart Auto-Suggest
              </span>
            </h2>
            <p className="text-xs text-zinc-500">
              Auto-suggests low stock items or select any item requirement below to place orders
            </p>
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
      <div className="p-6 max-h-[82vh] overflow-y-auto space-y-5">
        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`rounded-xl border p-3.5 text-xs font-medium flex items-center gap-2 ${
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

        {/* Top Controls Grid: Default Supplier & Add Item */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Card 1: Default Supplier Selection */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 flex flex-col justify-between gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
              <Building2 className="h-4 w-4 text-[#D3232A]" />
              <span>Default Supplier Assignment</span>
            </div>
            <select
              value={masterSupplierId}
              onChange={(e) => handleMasterSupplierChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium focus:border-[#D3232A] focus:outline-none"
              disabled={isLoadingSuppliers || suppliers.length === 0}
            >
              {suppliers.length === 0 ? (
                <option value="">No Suppliers Registered</option>
              ) : (
                suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category || "General"})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Card 2: Add Custom Item Requirement */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 flex flex-col justify-between gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800">
                <Package className="h-4 w-4 text-zinc-600" />
                <span>Add Custom Item Requirement</span>
              </div>
              {selectedMasterSupplier?.category && (
                <button
                  type="button"
                  onClick={() => setShowAllCustomItems(!showAllCustomItems)}
                  className="text-[10px] font-semibold text-[#D3232A] hover:underline"
                >
                  {showAllCustomItems ? "Filter by Category" : "Show All Categories"}
                </button>
              )}
            </div>
            {selectedMasterSupplier?.category && !showAllCustomItems && (
              <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                ✓ Filtered for {selectedMasterSupplier.name} ({selectedMasterSupplier.category})
              </p>
            )}
            <div className="flex items-center gap-2">
              <select
                value={selectedAddItem}
                onChange={(e) => setSelectedAddItem(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium focus:border-[#D3232A] focus:outline-none"
              >
                <option value="">-- Choose Item to Order --</option>
                {customItemsPool.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.category || "General"}) — Stock: {i.currentStock} {i.unit}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!selectedAddItem}
                onClick={() => handleAddItemToOrder(selectedAddItem)}
                className="inline-flex items-center gap-1 rounded-lg bg-[#D3232A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#b01e23] disabled:opacity-40 transition-opacity shrink-0 shadow-xs"
              >
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Items Table */}
        {lines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50/60 p-8 text-center">
            <Package className="h-9 w-9 mx-auto text-zinc-400 mb-2" />
            <p className="text-sm font-bold text-zinc-800">No items currently in restock order</p>
            <p className="text-xs text-zinc-500 mt-1">
              Select any item from the <strong>"Add Custom Item Requirement"</strong> box above to place an order.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 font-semibold uppercase tracking-wider border-b border-zinc-200 text-[10px]">
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-3 py-3 text-center">Current Stock</th>
                  <th className="px-3 py-3 text-center">Reorder Threshold</th>
                  <th className="px-3 py-3 text-center">Order Qty</th>
                  <th className="px-4 py-3">Assigned Supplier</th>
                  <th className="px-4 py-3 text-right">Est. Cost (₹)</th>
                  <th className="px-3 py-3 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const estCost = ((line.suggestedQty * line.unitCostPaise) / 100).toFixed(2);
                  const itemSuppliers = getFilteredSuppliers(line.item.category);
                  const isCategoryFiltered = itemSuppliers.length < suppliers.length;

                  return (
                    <tr key={line.item.id} className="border-b border-zinc-100 hover:bg-zinc-50/60 transition-colors">
                      <td className="px-4 py-3.5 font-semibold text-zinc-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-zinc-900">{line.item.name}</span>
                          {line.item.category && (
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                              {line.item.category}
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-zinc-400 font-mono font-normal mt-0.5">
                          SKU: {line.item.sku}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-zinc-800">
                        {line.item.currentStock} {line.item.unit}
                      </td>
                      <td className="px-3 py-3.5 text-center text-zinc-500">
                        {line.item.reorderThreshold} {line.item.unit}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="number"
                          min="1"
                          value={line.suggestedQty}
                          onChange={(e) =>
                            handleLineQtyChange(line.item.id, Number(e.target.value))
                          }
                          className="w-16 rounded-lg border border-zinc-300 px-2 py-1 text-center font-bold text-zinc-900 focus:border-[#D3232A] focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          value={line.selectedSupplierId || (itemSuppliers[0]?.id ?? "")}
                          onChange={(e) =>
                            handleLineSupplierChange(line.item.id, e.target.value)
                          }
                          className="w-full max-w-[190px] rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs font-medium focus:outline-none bg-white text-zinc-800 truncate"
                        >
                          {itemSuppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.category || "General"})
                            </option>
                          ))}
                        </select>
                        {isCategoryFiltered && (
                          <span className="block text-[9px] text-emerald-600 font-semibold mt-0.5">
                            ✓ Filtered for {line.item.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-zinc-900 tabular-nums text-sm">
                        ₹{estCost}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.item.id)}
                          className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                          title="Remove item from order"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Cost Summary Bar */}
        <div className="rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-800 text-white p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
              Total Estimated Order Value
            </span>
            <p className="text-2xl font-extrabold flex items-center gap-1 text-emerald-400 mt-0.5">
              <IndianRupee className="h-5 w-5" />
              {(totalEstimatedPaise / 100).toLocaleString("en-IN", {
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="text-right text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white mb-1">
              {Object.keys(groupedBySupplier).length} Stock Order(s) Generated
            </span>
            <span className="block text-[11px]">Auto-grouped by assigned supplier</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-300 bg-white px-4.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGeneratePOs}
            disabled={isSubmitting || lines.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Zap className="h-4 w-4 fill-current" /> Place Stock Orders
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
