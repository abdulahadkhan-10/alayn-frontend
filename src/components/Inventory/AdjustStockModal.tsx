"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus, Sliders, IndianRupee, CheckCircle2 } from "lucide-react";
import { adjustInventoryStock, InventoryItem } from "@/lib/api";

type StockReason = "PURCHASE" | "WASTE" | "SALE" | "ADJUSTMENT";
type Mode = "add" | "remove";

const ADD_REASONS: { value: StockReason; label: string; desc: string }[] = [
  { value: "PURCHASE",   label: "Supplier Arrival / Purchase",   desc: "Received fresh shipment from supplier" },
  { value: "ADJUSTMENT", label: "Manual Count Correction", desc: "Found extra stock during inventory audit" },
];
const REMOVE_REASONS: { value: StockReason; label: string; desc: string }[] = [
  { value: "ADJUSTMENT", label: "Manual Count Correction", desc: "Physical count differs from ledger balance" },
  { value: "SALE",       label: "Unrecorded Kitchen Usage",   desc: "Used in kitchen prep or internal consumption" },
];

const QUICK_PRESETS = [1, 5, 10, 25, 50];

interface Props {
  outletId: string;
  item: InventoryItem;
  onAdjusted: () => void;
  onDemoAdjust?: (itemId: string, change: number) => void;
  onClose: () => void;
}

export default function AdjustStockModal({ outletId, item, onAdjusted, onDemoAdjust, onClose }: Props) {
  const [mode,   setMode]   = useState<Mode>("add");
  const [qty,    setQty]    = useState<number>(1);
  const [reason, setReason] = useState<StockReason>("PURCHASE");
  const [error,  setError]  = useState<string | null>(null);
  const [busy,   setBusy]   = useState(false);

  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    firstBtnRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const reasons    = mode === "add" ? ADD_REASONS : REMOVE_REASONS;
  const change     = mode === "add" ? qty : -qty;
  const stockAfter = Number((item.currentStock + change).toFixed(2));
  const overRemoval = mode === "remove" && qty > item.currentStock;
  const financialCost = (qty * (item.unitCostPaise / 100)).toFixed(2);

  const switchMode = (m: Mode) => {
    setMode(m);
    setQty(1);
    setError(null);
    setReason(m === "add" ? "PURCHASE" : "ADJUSTMENT");
  };

  const handleQtyChange = (val: number) => {
    const next = Math.max(0.001, val);
    setQty(next);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Please enter a valid quantity greater than zero.");
      return;
    }
    if (overRemoval) {
      setError(`Only ${item.currentStock} ${item.unit} available. Cannot remove ${qty}.`);
      return;
    }

    setError(null);
    setBusy(true);
    try {
      if (onDemoAdjust) {
        onDemoAdjust(item.id, change);
        return;
      }
      const idempotencyKey = `${item.id}-${Date.now()}`;
      const res = await adjustInventoryStock(outletId, item.id, change, reason, idempotencyKey);
      if (!res.ok) { setError(res.error ?? "Failed to adjust stock."); return; }
      onAdjusted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="adjust-stock-title"
      className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-[#D3232A] p-2 text-white shadow-xs">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h2 id="adjust-stock-title" className="text-base font-bold text-zinc-900">
              Adjust Stock Quantity
            </h2>
            <p className="text-xs text-zinc-500">Update stock balance for {item.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 max-h-[82vh] overflow-y-auto space-y-5">
        {/* Item Info Banner */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Target Item</span>
            <h3 className="text-base font-bold text-zinc-900">{item.name}</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Category: <span className="text-zinc-800 font-semibold">{item.category}</span> · Unit Cost: <span className="text-zinc-800 font-semibold">₹{(item.unitCostPaise / 100).toFixed(2)}</span>
            </p>
          </div>
          <div className="bg-white rounded-lg border border-zinc-200 p-2.5 px-4 text-center shrink-0 w-full sm:w-auto">
            <span className="text-[10px] font-semibold text-zinc-400 block uppercase">Current Stock</span>
            <span className="text-xl font-black text-zinc-900">{item.currentStock}</span>
            <span className="text-xs text-zinc-500 font-medium ml-1">{item.unit}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Action Segmented Toggle */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
              Action Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                ref={firstBtnRef}
                type="button"
                onClick={() => switchMode("add")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs sm:text-sm font-bold transition-all ${
                  mode === "add"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-2xs"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Add Stock (+)
              </button>

              <button
                type="button"
                onClick={() => switchMode("remove")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-xs sm:text-sm font-bold transition-all ${
                  mode === "remove"
                    ? "border-red-500 bg-red-50 text-red-800 shadow-2xs"
                    : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50"
                }`}
              >
                <TrendingDown className="h-4 w-4 text-red-600" /> Deduct Stock (-)
              </button>
            </div>
          </div>

          {/* Quantity Stepper & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="stock-qty" className="block text-xs font-bold uppercase tracking-wider text-zinc-600">
                Quantity Amount ({item.unit})
              </label>
              <span className="text-xs text-zinc-500 font-medium">
                Value: <strong className="text-zinc-800">₹{financialCost}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQtyChange(parseFloat((qty - 1).toFixed(3)))}
                aria-label="Decrease quantity"
                className="h-11 w-11 shrink-0 rounded-xl border border-zinc-300 bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-colors disabled:opacity-40"
                disabled={qty <= 0.001}
              >
                <Minus className="h-4 w-4 text-zinc-700" />
              </button>

              <input
                id="stock-qty"
                type="number"
                min="0.001"
                step="any"
                value={qty}
                onChange={(e) => handleQtyChange(parseFloat(e.target.value) || 0)}
                className="w-full rounded-xl border border-zinc-300 text-center text-lg font-bold h-11 focus:border-[#D3232A] focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleQtyChange(parseFloat((qty + 1).toFixed(3)))}
                aria-label="Increase quantity"
                className="h-11 w-11 shrink-0 rounded-xl border border-zinc-300 bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-colors"
              >
                <Plus className="h-4 w-4 text-zinc-700" />
              </button>
            </div>

            {/* Quick Presets Pills */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-none">
              <span className="text-[11px] text-zinc-400 font-medium mr-1">Quick Add:</span>
              {QUICK_PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQtyChange(val)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                    qty === val
                      ? "border-zinc-800 bg-zinc-900 text-white shadow-2xs"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  +{val} {item.unit}
                </button>
              ))}
            </div>

            {/* Over-removal Warning */}
            {overRemoval && (
              <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                <p className="text-xs font-bold text-red-700">
                  Cannot remove {qty} {item.unit}. Only {item.currentStock} {item.unit} available in stock.
                </p>
              </div>
            )}
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">
              Reason for Adjustment
            </label>
            <div className="grid grid-cols-1 gap-2">
              {reasons.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    reason === r.value
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-xs"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  <div
                    className={`mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      reason === r.value ? "border-white" : "border-zinc-400"
                    }`}
                  >
                    {reason === r.value && <div className="h-2 w-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold leading-tight">{r.label}</p>
                    <p className={`text-xs mt-0.5 ${reason === r.value ? "text-zinc-300" : "text-zinc-400"}`}>
                      {r.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Projected Stock Balance Card */}
          <div
            className={`rounded-xl border p-4 transition-colors ${
              overRemoval
                ? "border-red-200 bg-red-50"
                : mode === "add"
                ? "border-emerald-200 bg-emerald-50/70"
                : "border-amber-200 bg-amber-50/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                New Stock Balance
              </span>
              <span className={`text-xs font-bold ${mode === "add" ? "text-emerald-700" : "text-amber-700"}`}>
                {mode === "add" ? `+${qty}` : `-${qty}`} {item.unit}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mt-1">
              <p className="text-2xl font-black text-zinc-900 tabular-nums">
                {overRemoval ? "—" : stockAfter}{" "}
                <span className="text-xs font-normal text-zinc-500">{item.unit}</span>
              </p>
              <p className="text-xs text-zinc-600 font-medium">
                Calculation: <strong>{item.currentStock}</strong> {mode === "add" ? "+" : "-"} <strong>{qty}</strong> = <strong>{overRemoval ? "Invalid" : stockAfter} {item.unit}</strong>
              </p>
            </div>

            <div className="mt-2 pt-2 border-t border-zinc-200/60 flex items-center justify-between text-xs text-zinc-600 font-medium">
              <span>Cost Impact:</span>
              <span className="font-bold text-zinc-900">
                {qty} {item.unit} × ₹{(item.unitCostPaise / 100).toFixed(2)} = ₹{financialCost}
              </span>
            </div>

            {!overRemoval && stockAfter <= item.reorderThreshold && (
              <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Balance will be at or below minimum reorder level ({item.reorderThreshold} {item.unit})!
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <p className="text-xs font-bold text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-4.5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || overRemoval || qty <= 0}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md disabled:opacity-50 ${
                mode === "remove" ? "bg-red-600 hover:bg-red-700" : "bg-[#D3232A] hover:bg-[#b01e23]"
              }`}
            >
              {busy
                ? "Saving…"
                : mode === "add"
                ? `Confirm Add +${qty} ${item.unit}`
                : `Confirm Remove -${qty} ${item.unit}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
