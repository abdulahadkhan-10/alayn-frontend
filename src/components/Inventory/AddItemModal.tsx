"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Package, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { createInventoryItem, adjustInventoryStock, InventoryItem } from "@/lib/api";
import { useBranch } from "@/lib/BranchContext";

const COMMON_CATEGORIES = [
  "Beverages",
  "Dairy",
  "Bakery",
  "Syrups & Sauces",
  "Packaging",
  "Frozen Goods",
  "Meat & Poultry",
  "Vegetables & Produce",
  "Spices & Seasoning",
  "Others",
];

const STANDARD_UNITS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "L", label: "Litres (L)" },
  { value: "ml", label: "Millilitres (ml)" },
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "pack", label: "Packs / Bundles" },
  { value: "bottle", label: "Bottles" },
  { value: "can", label: "Cans / Tins" },
  { value: "box", label: "Boxes / Cartons" },
];

interface Props {
  outletId: string;
  onCreated: (item: InventoryItem) => void;
  onClose: () => void;
  isDemo?: boolean;
}

export default function AddItemModal({ outletId, onCreated, onClose, isDemo }: Props) {
  const { branches, activeBranch } = useBranch();
  const realOutlets = branches.filter((b) => b.id !== "all");

  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    if (outletId && outletId !== "all") return outletId;
    if (activeBranch && activeBranch.id !== "all") return activeBranch.id;
    return realOutlets[0]?.id || "";
  });

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("L");
  const [currentQty, setCurrentQty] = useState<number | "">(0);
  const [notifyBelow, setNotifyBelow] = useState<number | "">(5);
  const [category, setCategory] = useState("Dairy");

  // Progressive Disclosure: More options
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [costText, setCostText] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetOutletId = selectedOutletId || (outletId !== "all" ? outletId : "");
    if (!targetOutletId || targetOutletId === "all") {
      setError("Please select a branch location.");
      return;
    }

    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }

    const thresholdNum = Number(notifyBelow);
    if (!Number.isFinite(thresholdNum) || thresholdNum < 0) {
      setError("Alert level must be 0 or greater.");
      return;
    }

    const rupeesNum = parseFloat(costText) || 1.0; // Default nominal unit cost if unprovided
    const unitCostPaise = Math.round(rupeesNum * 100);

    // Auto-generate SKU in background (e.g., DAI-MIL-782)
    const cleanCat = category.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "ITM";
    const cleanName = name
      .trim()
      .split(/\s+/)
      .map((w) => w.slice(0, 3).toUpperCase())
      .join("")
      .slice(0, 6) || "ITEM";
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const autoSku = `${cleanCat}-${cleanName}-${randomSuffix}`;

    const initialStockNum = Number(currentQty) || 0;

    setBusy(true);
    try {
      if (isDemo || targetOutletId.startsWith("demo-")) {
        const demoItem: InventoryItem = {
          id: `demo-${Date.now()}`,
          name: name.trim(),
          sku: autoSku,
          category,
          unit,
          reorderThreshold: thresholdNum,
          unitCostPaise,
          currentStock: initialStockNum,
        };
        onCreated(demoItem);
        return;
      }

      const res = await createInventoryItem(targetOutletId, {
        name: name.trim(),
        sku: autoSku,
        category,
        unit,
        reorderThreshold: thresholdNum,
        unitCostPaise,
      });

      if (!res.ok || !res.item) {
        setError(res.error ?? "Failed to create item.");
        return;
      }

      // If initial opening stock was provided, set initial stock automatically
      if (initialStockNum > 0) {
        await adjustInventoryStock(targetOutletId, res.item.id, initialStockNum, "PURCHASE");
      }

      onCreated({
        ...res.item,
        currentStock: initialStockNum,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-title"
      className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 bg-zinc-50/80">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5 text-[#D3232A]">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 id="add-item-title" className="text-base sm:text-lg font-black text-zinc-900">
              Add Inventory Item
            </h2>
            <p className="text-xs text-zinc-500 font-medium">Add a new item to start tracking stock</p>
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

      {/* Form Body */}
      <div className="p-6 max-h-[82vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Branch Location */}
          {realOutlets.length > 1 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Branch
              </label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-900 bg-white"
              >
                {realOutlets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Item Name */}
          <div>
            <label htmlFor="item-name" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Item Name <span className="text-[#D3232A]">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="item-name"
              required
              type="text"
              placeholder="e.g. Fresh Milk, Espresso Beans"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-medium focus:border-[#D3232A] focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Unit & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-unit" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                How do you count it? <span className="text-[#D3232A]">*</span>
              </label>
              <select
                id="item-unit"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold bg-white text-zinc-900 focus:outline-none"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="item-category" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Category <span className="text-[#D3232A]">*</span>
              </label>
              <select
                id="item-category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-semibold bg-white text-zinc-900 focus:outline-none"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Current Stock & Low Stock Alert Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="item-qty" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Current Quantity
              </label>
              <input
                id="item-qty"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-[#D3232A] focus:outline-none"
                value={currentQty}
                onChange={(e) => setCurrentQty(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>

            <div>
              <label htmlFor="item-notify" className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Notify me when below
              </label>
              <input
                id="item-notify"
                type="number"
                min="0"
                step="any"
                placeholder="5"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm font-bold text-zinc-900 focus:border-[#D3232A] focus:outline-none"
                value={notifyBelow}
                onChange={(e) => setNotifyBelow(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          {/* Progressive Disclosure: More Options Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              className="text-xs font-bold text-zinc-600 hover:text-zinc-900 flex items-center gap-1"
            >
              {showMoreOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span>More options</span>
            </button>

            {showMoreOptions && (
              <div className="mt-3 space-y-3 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 animate-in fade-in duration-150">
                <div>
                  <label htmlFor="item-cost" className="block text-xs font-bold text-zinc-700 mb-1">
                    Cost per {unit} (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-semibold text-zinc-400">₹</span>
                    <input
                      id="item-cost"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full rounded-lg border border-zinc-200 pl-7 pr-3 py-1.5 text-xs font-semibold focus:border-zinc-900 focus:outline-none bg-white"
                      value={costText}
                      onChange={(e) => setCostText(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="item-notes" className="block text-xs font-bold text-zinc-700 mb-1">
                    Notes
                  </label>
                  <input
                    id="item-notes"
                    type="text"
                    placeholder="Storage location, brand preference, etc."
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium focus:border-zinc-900 focus:outline-none bg-white"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 shadow-md"
            >
              {busy ? "Adding Item..." : <><Check className="h-4 w-4" /> Add Item</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
