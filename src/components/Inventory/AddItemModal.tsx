"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, AlertTriangle, Loader2 } from "lucide-react";
import { useBranch } from "@/lib/BranchContext";
import { useCreateItemMutation } from "@/redux/slices/inventoryApiSlice";

const STANDARD_UNITS = [
  { value: "kg",    label: "Kilograms (kg)" },
  { value: "g",     label: "Grams (g)" },
  { value: "L",     label: "Liters (L)" },
  { value: "mL",    label: "Milliliters (mL)" },
  { value: "units", label: "Units / Pieces" },
  { value: "packs", label: "Packs / Boxes" },
  { value: "cans",  label: "Cans" },
  { value: "bottles", label: "Bottles" },
];

const COMMON_CATEGORIES = [
  "Dairy",
  "Produce",
  "Meat & Poultry",
  "Beverages",
  "Bakery",
  "Syrups & Sauces",
  "Packaging",
  "Frozen Goods",
  "General",
];

interface Props {
  outletId: string;
  onCreated: () => void;
  onClose: () => void;
  isDemo?: boolean;
}

export default function AddItemModal({
  outletId,
  onCreated,
  onClose,
  isDemo = false,
}: Props) {
  const { branches } = useBranch();
  const [createItem] = useCreateItemMutation();

  const [selectedOutletId, setSelectedOutletId] = useState(outletId);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [unit, setUnit] = useState("units");
  const [currentQty, setCurrentQty] = useState<number | "">(0);
  const [notifyBelow, setNotifyBelow] = useState<number | "">(5);
  const [costText, setCostText] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const realOutlets = (branches || []).filter((b) => b.id !== "all");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Item name is required.");
      return;
    }

    const initialStockNum = Number(currentQty) || 0;
    const reorderNum = Number(notifyBelow) || 0;
    const costRupeesNum = Number(costText) || 0;
    const unitCostPaise = Math.round(costRupeesNum * 100);

    setBusy(true);

    try {
      await createItem({
        name: trimmedName,
        sku: `${trimmedName.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        category,
        unit,
        reorderThreshold: reorderNum,
        unitCostPaise,
        currentStock: initialStockNum,
        outletId: selectedOutletId,
      }).unwrap();

      onCreated();
    } catch (err: any) {
      setError(err?.data?.message || err?.message || "Failed to add inventory item.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-title"
      className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white">
        <div>
          <h2 id="add-item-title" className="text-lg font-semibold text-zinc-900 tracking-tight">
            Add Inventory Item
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">Specify item details to track stock levels</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Form Body ── */}
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="p-7 space-y-6 max-h-[75vh] overflow-y-auto">

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 2-Column Symmetrical Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Item Name */}
            <div>
              <label htmlFor="item-name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Item Name *
              </label>
              <input
                ref={firstInputRef}
                id="item-name"
                required
                type="text"
                placeholder="e.g. Fresh Milk, Espresso Beans"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Branch / Outlet */}
            {realOutlets.length > 1 ? (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Branch
                </label>
                <select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-medium text-zinc-900 bg-white focus:border-zinc-800 focus:outline-none shadow-xs"
                >
                  {realOutlets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Category *
                </label>
                <select
                  id="item-category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-medium text-zinc-900 bg-white focus:border-zinc-800 focus:outline-none shadow-xs"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Category (if branch was rendered in column 2) */}
            {realOutlets.length > 1 && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                  Category *
                </label>
                <select
                  id="item-category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-medium text-zinc-900 bg-white focus:border-zinc-800 focus:outline-none shadow-xs"
                >
                  {COMMON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Unit Measurement */}
            <div>
              <label htmlFor="item-unit" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Measurement Unit *
              </label>
              <select
                id="item-unit"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-medium text-zinc-900 bg-white focus:border-zinc-800 focus:outline-none shadow-xs"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Quantity */}
            <div>
              <label htmlFor="item-qty" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Initial Stock Quantity
              </label>
              <input
                id="item-qty"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                value={currentQty}
                onChange={(e) => setCurrentQty(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label htmlFor="item-notify" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Reorder Threshold
              </label>
              <input
                id="item-notify"
                type="number"
                min="0"
                step="any"
                placeholder="5"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                value={notifyBelow}
                onChange={(e) => setNotifyBelow(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            {/* Unit Cost */}
            <div>
              <label htmlFor="item-cost" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Estimated Unit Cost (₹)
              </label>
              <input
                id="item-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-semibold text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                value={costText}
                onChange={(e) => setCostText(e.target.value)}
              />
            </div>

            {/* Storage / Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="item-notes" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 mb-1.5">
                Notes &amp; Location
              </label>
              <input
                id="item-notes"
                type="text"
                placeholder="Storage shelf, brand preference, or vendor notes…"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 shadow-xs"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Adding…
              </>
            ) : (
              "Add Inventory Item"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
