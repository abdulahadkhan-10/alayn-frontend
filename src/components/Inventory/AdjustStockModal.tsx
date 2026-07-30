"use client";

import React, { useEffect, useState } from "react";
import { X, AlertTriangle, Truck, Utensils, Trash2, CheckCircle2, RefreshCw } from "lucide-react";
import { adjustInventoryStock, InventoryItem } from "@/lib/api";

type FlowType = "RECEIVED" | "USED" | "WASTE" | "CORRECT";

interface Props {
  outletId: string;
  item: InventoryItem;
  onAdjusted: () => void;
  onClose: () => void;
}

export default function AdjustStockModal({ outletId, item, onAdjusted, onClose }: Props) {
  const [selectedFlow, setSelectedFlow] = useState<FlowType | null>(null);

  // Flow specific state
  const [amount, setAmount] = useState<number | "">("");
  const [physicalStock, setPhysicalStock] = useState<number | "">("");
  
  // Specific reason state per flow
  const [receivedReason, setReceivedReason] = useState("Supplier Delivery");
  const [usedReason, setUsedReason] = useState("Kitchen Preparation / Cooking");
  const [wasteReason, setWasteReason] = useState("Expired / Spoilage");
  const [correctReason, setCorrectReason] = useState("Stock Count Audit Difference");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const numAmount = Number(amount) || 0;
  const numPhysical = Number(physicalStock) || 0;
  const currentStock = item.currentStock || 0;

  // Keybindings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let change = 0;
    let backendReason: "PURCHASE" | "SALE" | "WASTE" | "ADJUSTMENT" = "ADJUSTMENT";

    if (selectedFlow === "RECEIVED") {
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        setError("Please enter the quantity of new stock that arrived.");
        return;
      }
      change = numAmount;
      backendReason = "PURCHASE";
    } else if (selectedFlow === "USED") {
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        setError("Please enter the quantity of stock used.");
        return;
      }
      if (numAmount > currentStock) {
        setError(`Only ${currentStock} ${item.unit} in stock. Cannot deduct ${numAmount} ${item.unit}.`);
        return;
      }
      change = -numAmount;
      backendReason = "SALE";
    } else if (selectedFlow === "WASTE") {
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        setError("Please enter the quantity wasted or damaged.");
        return;
      }
      if (numAmount > currentStock) {
        setError(`Only ${currentStock} ${item.unit} in stock. Cannot remove ${numAmount} ${item.unit}.`);
        return;
      }
      change = -numAmount;
      backendReason = "WASTE";
    } else if (selectedFlow === "CORRECT") {
      if (!Number.isFinite(numPhysical) || numPhysical < 0) {
        setError("Please enter the physical stock quantity currently present.");
        return;
      }
      change = numPhysical - currentStock;
      backendReason = "ADJUSTMENT";
    } else {
      return;
    }

    setBusy(true);
    try {
      const idempotencyKey = `${item.id}-${Date.now()}`;
      const res = await adjustInventoryStock(outletId, item.id, change, backendReason, idempotencyKey);
      if (!res.ok) {
        setError(res.error ?? "Failed to update stock.");
        return;
      }
      onAdjusted();
    } finally {
      setBusy(false);
    }
  };

  // Calculations for preview
  let afterUpdate = currentStock;
  if (selectedFlow === "RECEIVED") afterUpdate = currentStock + numAmount;
  if (selectedFlow === "USED" || selectedFlow === "WASTE") afterUpdate = Math.max(0, currentStock - numAmount);
  if (selectedFlow === "CORRECT") afterUpdate = numPhysical;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-stock-title"
      className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-zinc-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 bg-zinc-50/80">
        <div>
          <h2 id="update-stock-title" className="text-base sm:text-lg font-black text-zinc-900">
            Update {item.name}
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            Current stock: <strong className="text-zinc-900">{currentStock} {item.unit}</strong>
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Modal Body */}
      <div className="p-6 space-y-5">
        {/* Step 1: Option Selection */}
        {!selectedFlow ? (
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-4">
              Select an action
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Stock Received */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFlow("RECEIVED");
                  setError(null);
                }}
                className="flex items-center gap-3.5 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-emerald-300 hover:bg-emerald-50/40 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Truck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Stock received</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Supplier delivered new stock</p>
                </div>
              </button>

              {/* Option 2: Stock Used */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFlow("USED");
                  setError(null);
                }}
                className="flex items-center gap-3.5 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <Utensils className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Stock used</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Used during operations</p>
                </div>
              </button>

              {/* Option 3: Waste / Damaged */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFlow("WASTE");
                  setError(null);
                }}
                className="flex items-center gap-3.5 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-rose-300 hover:bg-rose-50/40 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                  <Trash2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Waste / damaged</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Expired, damaged or spilled</p>
                </div>
              </button>

              {/* Option 4: Correct Stock Count */}
              <button
                type="button"
                onClick={() => {
                  setSelectedFlow("CORRECT");
                  setError(null);
                }}
                className="flex items-center gap-3.5 rounded-xl border border-zinc-200 bg-white p-4 text-left hover:border-amber-300 hover:bg-amber-50/40 transition-all group"
              >
                <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <RefreshCw className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">Correct stock count</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Fix incorrect quantity</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Progressive Form Flow */
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setSelectedFlow(null);
                setAmount("");
                setPhysicalStock("");
                setError(null);
              }}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-1"
            >
              ← Back to options
            </button>

            {/* FLOW 1: STOCK RECEIVED */}
            {selectedFlow === "RECEIVED" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    How much arrived? ({item.unit})
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    autoFocus
                    placeholder={`Enter ${item.unit} received...`}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value === "" ? "" : Number(e.target.value));
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-bold focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Reason for Arrival
                  </label>
                  <select
                    value={receivedReason}
                    onChange={(e) => setReceivedReason(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold focus:border-[#D3232A] focus:outline-none bg-white text-zinc-800"
                  >
                    <option value="Supplier Delivery">Supplier Delivery / Restock Arrival</option>
                    <option value="Direct Store Purchase">Direct Store Purchase</option>
                    <option value="Branch Transfer">Branch Transfer In</option>
                    <option value="Other Addition">Other Stock Addition</option>
                  </select>
                </div>
              </div>
            )}

            {/* FLOW 2: STOCK USED */}
            {selectedFlow === "USED" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    How much was used? ({item.unit})
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    autoFocus
                    placeholder={`Enter ${item.unit} used...`}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value === "" ? "" : Number(e.target.value));
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-bold focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Reason for Usage
                  </label>
                  <select
                    value={usedReason}
                    onChange={(e) => setUsedReason(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold focus:border-[#D3232A] focus:outline-none bg-white text-zinc-800"
                  >
                    <option value="Kitchen Preparation / Cooking">Kitchen Preparation / Cooking</option>
                    <option value="Staff Meal / Internal Consumption">Staff Meal / Internal Consumption</option>
                    <option value="Catering / Event Usage">Catering / Event Usage</option>
                    <option value="Unrecorded Customer Sale">Unrecorded Customer Sale</option>
                  </select>
                </div>
              </div>
            )}

            {/* FLOW 3: WASTE / DAMAGED */}
            {selectedFlow === "WASTE" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    How much was wasted? ({item.unit})
                  </label>
                  <input
                    type="number"
                    min="0.001"
                    step="any"
                    required
                    autoFocus
                    placeholder={`Enter ${item.unit} wasted...`}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value === "" ? "" : Number(e.target.value));
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-bold focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Reason for Waste
                  </label>
                  <select
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold focus:border-[#D3232A] focus:outline-none bg-white text-zinc-800"
                  >
                    <option value="Expired / Spoilage">Expired / Spoilage</option>
                    <option value="Damaged / Broken Packaging">Damaged / Broken Packaging</option>
                    <option value="Spilled / Dropped">Spilled / Dropped</option>
                    <option value="Over-cooked / Burnt">Over-cooked / Burnt</option>
                    <option value="Quality Rejection">Quality Rejection</option>
                  </select>
                </div>
              </div>
            )}

            {/* FLOW 4: CORRECT STOCK COUNT */}
            {selectedFlow === "CORRECT" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1.5">
                    How much stock do you actually have? ({item.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    autoFocus
                    placeholder={`Enter physical ${item.unit} count...`}
                    value={physicalStock}
                    onChange={(e) => {
                      setPhysicalStock(e.target.value === "" ? "" : Number(e.target.value));
                      setError(null);
                    }}
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-lg font-bold focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                    Reason for Correction
                  </label>
                  <select
                    value={correctReason}
                    onChange={(e) => setCorrectReason(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold focus:border-[#D3232A] focus:outline-none bg-white text-zinc-800"
                  >
                    <option value="Stock Count Audit Difference">Stock Count Audit Difference</option>
                    <option value="Unrecorded Item Loss">Unrecorded Item Loss</option>
                    <option value="Unrecorded Supplier Bonus/Free Item">Unrecorded Supplier Bonus/Free Item</option>
                    <option value="Initial Count Correction">Initial Count Correction</option>
                  </select>
                </div>
              </div>
            )}

            {/* Simple Result Summary Box */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3.5 grid grid-cols-3 items-center text-xs text-zinc-500">
              <div>
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-0.5">Current</span>
                <span className="font-bold text-zinc-800 text-sm">{currentStock} <span className="text-zinc-400 font-normal">{item.unit}</span></span>
              </div>
              <div className="text-center text-zinc-300 text-base">→</div>
              <div className="text-right">
                <span className="block text-[10px] uppercase tracking-wider font-semibold text-zinc-400 mb-0.5">After Update</span>
                <span className="font-bold text-zinc-900 text-sm">{afterUpdate} <span className="text-zinc-400 font-normal">{item.unit}</span></span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[#D3232A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 shadow-md"
              >
                {busy
                  ? "Updating..."
                  : selectedFlow === "RECEIVED"
                  ? `Add ${numAmount || 0} ${item.unit}`
                  : selectedFlow === "USED" || selectedFlow === "WASTE"
                  ? `Remove ${numAmount || 0} ${item.unit}`
                  : `Update Stock`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
