"use client";

import React, { useMemo, useState } from "react";
import { X, IndianRupee, Loader2, AlertTriangle, ChevronDown, Plus, Store, Trash2 } from "lucide-react";
import { InventoryItemApi, useCreateItemMutation } from "@/redux/slices/inventoryApiSlice";
import { SupplierItemApi } from "@/redux/slices/supplierApiSlice";
import { useCreatePurchaseOrderMutation } from "@/redux/slices/procurementApiSlice";
import type { MarketplaceSupplier } from "./SupplierMarketplaceSection";
import { apiErrorMessage } from "@/lib/apiError";

interface Line {
  catalogItem: SupplierItemApi;
  quantity: number;
  /** The restaurant's own inventory item that receives this stock */
  inventoryItemId: string;
}

interface Props {
  outletId: string;
  supplier: MarketplaceSupplier;
  catalogItems: SupplierItemApi[];
  initialQuantities?: Record<string, number>;
  inventoryItems: InventoryItemApi[];
  onClose: () => void;
  onSuccess: () => void;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** A SKU for an inventory item created from a catalog item, e.g. "BUF-4821" (unique per outlet). */
const skuFor = (name: string) =>
  `${name.replace(/[^a-z0-9]/gi, "").slice(0, 3).toUpperCase() || "ITM"}-${Math.floor(1000 + Math.random() * 9000)}`;

/**
 * Orders from a marketplace supplier. Prices and minimums come from the supplier's catalog; for each
 * line the restaurant picks which of its own inventory items the delivery goes into, or creates one.
 */
export default function MarketplacePOModal({
  outletId,
  supplier,
  catalogItems,
  initialQuantities,
  inventoryItems,
  onClose,
  onSuccess,
}: Props) {
  const [createPO, { isLoading: isSubmitting }] = useCreatePurchaseOrderMutation();
  const [createItem] = useCreateItemMutation();
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // An inventory item with exactly the same name is pre-selected; the restaurant can change it.
  const [lines, setLines] = useState<Line[]>(() =>
    catalogItems.map((catalogItem) => ({
      catalogItem,
      quantity: initialQuantities?.[catalogItem.id] || Number(catalogItem.minOrderQty) || 1,
      inventoryItemId: inventoryItems.find((inv) => sameName(inv.name, catalogItem.name))?.id || "",
    }))
  );

  const isAllOutlets = !outletId || outletId === "all";

  const updateLine = (catalogItemId: string, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l) => (l.catalogItem.id === catalogItemId ? { ...l, ...patch } : l)));

  const removeLine = (catalogItemId: string) =>
    setLines((prev) => prev.filter((l) => l.catalogItem.id !== catalogItemId));

  const totalPaise = useMemo(
    () => lines.reduce((sum, l) => sum + Math.round(l.quantity * l.catalogItem.pricePaise), 0),
    [lines]
  );

  const handleCreateInventoryItem = async (line: Line) => {
    const { catalogItem } = line;
    setError(null);
    setCreatingFor(catalogItem.id);
    try {
      const res = await createItem({
        name: catalogItem.name,
        sku: skuFor(catalogItem.name),
        category: catalogItem.category,
        unit: catalogItem.unit,
        reorderThreshold: 0,
        unitCostPaise: catalogItem.pricePaise,
        outletId,
      }).unwrap();
      updateLine(catalogItem.id, { inventoryItemId: res.id });
    } catch (err) {
      setError(apiErrorMessage(err, `Couldn't add ${catalogItem.name} to your inventory.`));
    } finally {
      setCreatingFor(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Add at least one item.");
      return;
    }
    for (const l of lines) {
      if (!l.inventoryItemId) {
        setError(`Choose which of your inventory items "${l.catalogItem.name}" goes into, or create it.`);
        return;
      }
      const min = Number(l.catalogItem.minOrderQty) || 0;
      if (l.quantity < min) {
        setError(`${supplier.name} needs at least ${min} ${l.catalogItem.unit} of ${l.catalogItem.name}.`);
        return;
      }
    }
    const linked = lines.map((l) => l.inventoryItemId);
    if (new Set(linked).size !== linked.length) {
      setError("Two lines go into the same inventory item. Link each one to a different item.");
      return;
    }

    try {
      await createPO({
        supplierId: supplier.id,
        items: lines.map((l) => ({
          itemId: l.inventoryItemId,
          orderedQuantity: l.quantity,
          unitCostPaise: l.catalogItem.pricePaise,
        })),
      }).unwrap();
      onSuccess();
    } catch (err) {
      setError(apiErrorMessage(err, "Failed to create order."));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="marketplace-po-title"
      className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[85vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white shrink-0">
        <div>
          <h2 id="marketplace-po-title" className="text-lg font-semibold text-zinc-900 tracking-tight">
            Create Purchase Order
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
            <Store className="h-3.5 w-3.5" /> {supplier.name} · Marketplace supplier
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

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-7 space-y-4">
          {isAllOutlets && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs font-medium text-amber-900 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              Select a single branch at the top of the page. A purchase order is delivered to one branch.
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800 flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {lines.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
              <p className="text-xs font-medium text-zinc-500">No items left in this order</p>
              <p className="text-[11px] text-zinc-400 mt-1">Close this window and tick items on the supplier&apos;s card</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                  <th className="pb-3 w-3/12">Supplier Item</th>
                  <th className="pb-3 w-4/12">Goes Into Your Inventory Item</th>
                  <th className="pb-3 text-center w-2/12">Quantity</th>
                  <th className="pb-3 text-right w-2/12">Line Total</th>
                  <th className="pb-3 w-1/12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lines.map((line) => {
                  const { catalogItem } = line;
                  const linkedItem = inventoryItems.find((i) => i.id === line.inventoryItemId);
                  const unitMismatch =
                    linkedItem && linkedItem.unit.trim().toLowerCase() !== catalogItem.unit.trim().toLowerCase();
                  const min = Number(catalogItem.minOrderQty) || 0;
                  return (
                    <tr key={catalogItem.id} className="align-top">
                      <td className="py-3.5 pr-3">
                        <p className="font-medium text-zinc-900 text-sm leading-snug">{catalogItem.name}</p>
                        <p className="text-[11px] text-zinc-400">
                          ₹{(catalogItem.pricePaise / 100).toFixed(2)} / {catalogItem.unit} · Min {min} {catalogItem.unit}
                        </p>
                      </td>
                      <td className="py-3.5 pr-3">
                        <div className="relative">
                          <select
                            value={line.inventoryItemId}
                            onChange={(e) => updateLine(catalogItem.id, { inventoryItemId: e.target.value })}
                            className={`w-full appearance-none rounded-xl border bg-white px-3 py-2 pr-8 text-xs font-medium text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs ${
                              line.inventoryItemId ? "border-zinc-300" : "border-amber-300"
                            }`}
                          >
                            <option value="">Choose an inventory item…</option>
                            {inventoryItems.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.name} ({inv.currentStock || 0} {inv.unit} in stock)
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        </div>
                        {!line.inventoryItemId && (
                          <button
                            type="button"
                            onClick={() => handleCreateInventoryItem(line)}
                            disabled={creatingFor !== null || isAllOutlets}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#D3232A] hover:underline disabled:opacity-50"
                          >
                            {creatingFor === catalogItem.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            Create &quot;{catalogItem.name}&quot; ({catalogItem.unit}) in your inventory
                          </button>
                        )}
                        {unitMismatch && (
                          <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                            Your item is counted in {linkedItem.unit}, the supplier sells in {catalogItem.unit}.
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        <div className="inline-flex items-center gap-1 border border-zinc-200 rounded-lg bg-white px-2 py-1">
                          <input
                            type="number"
                            min={min || 1}
                            step="any"
                            value={line.quantity}
                            onChange={(e) => updateLine(catalogItem.id, { quantity: Math.max(0, Number(e.target.value)) })}
                            className="w-14 text-center text-xs font-semibold text-zinc-900 focus:outline-none"
                          />
                          <span className="text-[11px] text-zinc-400 font-medium">{catalogItem.unit}</span>
                        </div>
                      </td>
                      <td className="py-3.5 pl-3 text-right font-semibold text-zinc-900 tabular-nums">
                        ₹
                        {((line.quantity * catalogItem.pricePaise) / 100).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 pl-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(catalogItem.id)}
                          className="h-7 w-7 inline-flex items-center justify-center text-zinc-300 hover:text-rose-600 rounded-md transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
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
              disabled={isSubmitting || lines.length === 0 || isAllOutlets}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#b01e23] disabled:opacity-50 transition-colors shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating Order…
                </>
              ) : (
                `Send Order to ${supplier.name}`
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
