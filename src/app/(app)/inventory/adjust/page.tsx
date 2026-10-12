"use client";

import React, { useState, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InventoryNavTabs from "@/components/Inventory/InventoryNavTabs";
import { useBranch } from "@/lib/BranchContext";
import { useGetItemsQuery, useAdjustStockMutation } from "@/redux/slices/inventoryApiSlice";
import { Sliders, CheckCircle2, AlertTriangle, Loader2, Building2, Filter, TrendingUp, TrendingDown } from "lucide-react";

export default function InventoryAdjustPage() {
  const { activeBranch, loading: branchLoading } = useBranch();
  const { data: itemsData, isLoading, refetch } = useGetItemsQuery(undefined, {
    skip: !activeBranch,
  });
  const [adjustStock, { isLoading: isSubmitting }] = useAdjustStockMutation();

  const [selectedItemId, setSelectedItemId] = useState("");
  const [changeAmount, setChangeAmount] = useState<number | "">("");
  const [direction, setDirection] = useState<"ADD" | "DEDUCT">("DEDUCT");
  const [reason, setReason] = useState<"SALE" | "WASTE" | "PURCHASE" | "ADJUSTMENT">("WASTE");
  const [outletFilter, setOutletFilter] = useState<string>("ALL");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const rawItems = itemsData?.items || [];
  const isAllOutlets = activeBranch?.id === "all";

  // Available outlets list from items
  const availableOutlets = useMemo(() => {
    const map = new Map<string, string>();
    rawItems.forEach((i) => {
      if (i.outlet) map.set(i.outlet.id, i.outlet.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rawItems]);

  const items = useMemo(() => {
    if (!isAllOutlets || outletFilter === "ALL") return rawItems;
    return rawItems.filter((i) => i.outlet?.id === outletFilter || i.outletId === outletFilter);
  }, [rawItems, isAllOutlets, outletFilter]);

  const selectedItem = rawItems.find((i) => i.id === selectedItemId);

  const numChange = Number(changeAmount) || 0;
  const projectedStock = selectedItem
    ? direction === "ADD"
      ? selectedItem.currentStock + numChange
      : selectedItem.currentStock - numChange
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedItemId) {
      setErrorMsg("Please select a stock item.");
      return;
    }

    if (!Number.isFinite(numChange) || numChange <= 0) {
      setErrorMsg("Please enter a valid quantity greater than 0.");
      return;
    }

    if (direction === "DEDUCT" && selectedItem && numChange > (selectedItem.currentStock || 0)) {
      setErrorMsg(`Cannot deduct ${numChange} ${selectedItem.unit}. Only ${selectedItem.currentStock} ${selectedItem.unit} available in stock.`);
      return;
    }

    const finalChange = direction === "DEDUCT" ? -numChange : numChange;

    try {
      await adjustStock({
        itemId: selectedItemId,
        change: finalChange,
        reason,
      }).unwrap();

      setSuccessMsg(`Stock updated for "${selectedItem?.name}": ${finalChange > 0 ? "+" : ""}${finalChange} ${selectedItem?.unit || ""}.`);
      setChangeAmount("");
      refetch();
    } catch (err: any) {
      setErrorMsg(err?.data?.message || err?.message || "Failed to update stock quantity.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-12">
        <InventoryNavTabs />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-zinc-900 tracking-tight">
                Update Stock
              </h1>
              <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-0.5 text-xs font-bold text-[#D3232A] border border-red-100">
                <Building2 className="h-3.5 w-3.5" />
                {activeBranch?.name || "Main Branch"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Update item stock balances for received shipments, usage, waste, or physical count corrections
            </p>
          </div>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs sm:text-sm text-emerald-900 flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <p className="font-bold">{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs sm:text-sm text-red-900 flex items-center gap-2 shadow-2xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="font-bold">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Form Card */}
          <div className="lg:col-span-2 rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-2xs">
            <h2 className="text-sm sm:text-base font-extrabold text-zinc-900 mb-4 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#D3232A]" /> Adjust Item Stock
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Select Stock Item</label>
                {(isLoading || branchLoading) ? (
                  <Skeleton height={38} borderRadius={8} />
                ) : (
                  <select
                    id="adjust-item-select"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white font-semibold text-zinc-900"
                    disabled={isLoading}
                  >
                    <option value="">-- Choose an item to update --</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}{isAllOutlets && i.outlet ? ` — [${i.outlet.name}]` : ''} — Current Stock: {i.currentStock} {i.unit}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Action Direction Segmented Toggle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDirection("ADD");
                      setReason("PURCHASE");
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs sm:text-sm font-bold transition-all ${
                      direction === "ADD"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 text-emerald-600" /> Add Stock (+)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDirection("DEDUCT");
                      setReason("ADJUSTMENT");
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs sm:text-sm font-bold transition-all ${
                      direction === "DEDUCT"
                        ? "border-red-500 bg-red-50 text-red-900 shadow-2xs"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <TrendingDown className="h-4 w-4 text-red-600" /> Deduct Stock (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">Reason for Change</label>
                <select
                  id="adjust-reason-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-[#D3232A] focus:outline-none bg-white font-semibold text-zinc-900"
                >
                  {direction === "ADD" ? (
                    <>
                      <option value="PURCHASE">New Supplier Delivery / Shipment Arrival</option>
                      <option value="ADJUSTMENT">Found Extra Stock (Audit Correction)</option>
                    </>
                  ) : (
                    <>
                      <option value="ADJUSTMENT">Stock Audit Correction (Physical count is lower)</option>
                      <option value="SALE">Kitchen Prep / Internal Consumption</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                  Quantity ({selectedItem?.unit || "units"})
                </label>
                <input
                  id="adjust-quantity-input"
                  type="number"
                  step="any"
                  min="0.001"
                  placeholder="Enter quantity amount..."
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm focus:border-[#D3232A] focus:outline-none font-bold text-zinc-900"
                />
              </div>

              {/* Live Calculator Stock Preview Card */}
              {selectedItem && (
                <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 space-y-2 text-xs text-zinc-700">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-900 text-sm">{selectedItem.name}</span>
                    {selectedItem.outlet && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[10px] font-bold text-zinc-700">
                        <Building2 className="h-3 w-3" /> {selectedItem.outlet.name}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-200/60 text-center">
                    <div className="bg-white p-2 rounded-xl border border-zinc-200/80">
                      <span className="block text-[10px] text-zinc-400 font-bold uppercase">CURRENT</span>
                      <strong className="text-sm text-zinc-900">{selectedItem.currentStock} {selectedItem.unit}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-zinc-200/80">
                      <span className="block text-[10px] text-zinc-400 font-bold uppercase">CHANGE</span>
                      <strong className={`text-sm ${direction === "ADD" ? "text-emerald-700" : "text-red-600"}`}>
                        {direction === "ADD" ? "+" : "-"}{numChange} {selectedItem.unit}
                      </strong>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-zinc-200/80">
                      <span className="block text-[10px] text-zinc-400 font-bold uppercase">PROJECTED</span>
                      <strong className={`text-sm ${projectedStock < selectedItem.reorderThreshold ? "text-amber-700" : "text-emerald-700"}`}>
                        {projectedStock} {selectedItem.unit}
                      </strong>
                    </div>
                  </div>

                  {projectedStock < selectedItem.reorderThreshold && (
                    <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1 pt-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Balance will drop below minimum stock alert level ({selectedItem.reorderThreshold} {selectedItem.unit})!
                    </p>
                  )}
                </div>
              )}

              <button
                id="submit-adjust-btn"
                type="submit"
                disabled={isSubmitting || isLoading || !selectedItemId || numChange <= 0}
                className="w-full rounded-xl bg-[#D3232A] py-3 text-sm font-bold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Stock Change"}
              </button>
            </form>
          </div>

          {/* Guidelines Sidebar Card */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-5 sm:p-6 shadow-2xs flex flex-col gap-3">
            <h3 className="text-sm font-bold text-zinc-900">Adjustment Guidelines</h3>
            <ul className="text-xs text-zinc-600 space-y-2.5 list-disc pl-4 leading-relaxed font-medium">
              <li><strong>New Deliveries:</strong> Add stock when receiving fresh items from vendors outside restock orders.</li>
              <li><strong>Kitchen Usage:</strong> Deduct stock used in daily cooking or prep.</li>
              <li><strong>Stock Audit:</strong> Use when physical count differs from the live record balance.</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

