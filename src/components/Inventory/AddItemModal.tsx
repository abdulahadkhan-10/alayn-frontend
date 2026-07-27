"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  X,
  AlertTriangle,
  HelpCircle,
  Package,
  Check,
  Building2,
} from "lucide-react";
import { createInventoryItem, InventoryItem } from "@/lib/api";
import { useBranch } from "@/lib/BranchContext";

type NewItem = Omit<InventoryItem, "id" | "currentStock" | "createdAt">;

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
  { value: "kg", label: "kg — Kilogram" },
  { value: "g", label: "g — Gram" },
  { value: "L", label: "L — Litre" },
  { value: "ml", label: "ml — Millilitre" },
  { value: "pcs", label: "pcs — Pieces" },
  { value: "pack", label: "pack — Pack / Bundle" },
  { value: "bottle", label: "Bottle — Bottles" },
  { value: "can", label: "Can — Cans / Tins" },
  { value: "box", label: "Box — Boxes / Cartons" },
  { value: "custom", label: "+ Custom Unit..." },
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
  const [category, setCategory] = useState("Dairy");
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [unit, setUnit] = useState("kg");
  const [customUnit, setCustomUnit] = useState("");
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  const [reorderThreshold, setReorderThreshold] = useState<number | "">(5);
  const [costText, setCostText] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showReorderHelp, setShowReorderHelp] = useState(false);

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCategoryChange = (val: string) => {
    if (val === "custom") {
      setIsCustomCategory(true);
      setCategory("");
    } else {
      setIsCustomCategory(false);
      setCategory(val);
    }
  };

  const handleUnitChange = (val: string) => {
    if (val === "custom") {
      setIsCustomUnit(true);
      setUnit("");
    } else {
      setIsCustomUnit(false);
      setUnit(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const targetOutletId = selectedOutletId || (outletId !== "all" ? outletId : "");

    if (!targetOutletId || targetOutletId === "all") {
      setError("Please select a target outlet location for this item.");
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category;
    const finalUnit = isCustomUnit ? customUnit.trim() : unit;

    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!finalCategory) {
      setError("Category is required.");
      return;
    }
    if (!finalUnit) {
      setError("Unit of measure is required.");
      return;
    }

    const thresholdNum = Number(reorderThreshold);
    if (!Number.isFinite(thresholdNum) || thresholdNum < 0) {
      setError("Reorder level must be a non-negative number (0 or greater).");
      return;
    }

    const rupeesNum = parseFloat(costText);
    if (!Number.isFinite(rupeesNum) || rupeesNum <= 0) {
      setError("Unit cost must be a valid number greater than ₹0.00");
      return;
    }
    const unitCostPaise = Math.round(rupeesNum * 100);

    // Auto-generate SKU behind the scenes (e.g. DAI-MIL-782)
    const cleanCat = finalCategory.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) || "ITM";
    const cleanName = name
      .trim()
      .split(/\s+/)
      .map((w) => w.slice(0, 3).toUpperCase())
      .join("")
      .slice(0, 6) || "ITEM";
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const autoSku = `${cleanCat}-${cleanName}-${randomSuffix}`;

    const itemPayload: NewItem = {
      name: name.trim(),
      sku: autoSku,
      category: finalCategory,
      unit: finalUnit,
      reorderThreshold: Number(reorderThreshold) || 0,
      unitCostPaise,
    };

    setBusy(true);
    try {
      if (isDemo || targetOutletId.startsWith("demo-")) {
        const demoItem: InventoryItem = {
          ...itemPayload,
          id: `demo-${Date.now()}`,
          currentStock: 0,
        };
        onCreated(demoItem);
        return;
      }

      const res = await createInventoryItem(targetOutletId, itemPayload);
      if (!res.ok) {
        setError(res.error ?? "Failed to create item.");
        return;
      }
      onCreated(res.item!);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-title"
      className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5 text-[#D3232A]">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h2 id="add-item-title" className="text-base sm:text-lg font-bold text-zinc-900">
              Add New Inventory Item
            </h2>
            <p className="text-xs text-zinc-500">Catalog a new ingredient or stock item for your outlet</p>
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
      <div className="p-6 max-h-[82vh] overflow-y-auto">
        <form id="add-item-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Target Outlet Selection */}
          <div>
            <label htmlFor="item-outlet-select" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#D3232A]" /> Target Outlet Location <span className="text-[#D3232A]">*</span>
            </label>
            <select
              id="item-outlet-select"
              value={selectedOutletId}
              onChange={(e) => {
                setSelectedOutletId(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white font-semibold"
            >
              {realOutlets.length === 0 ? (
                <option value="">No Outlet Registered</option>
              ) : (
                realOutlets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.address ? `(${b.address})` : ""}
                  </option>
                ))
              )}
            </select>
            {(!selectedOutletId || selectedOutletId === "all") && (
              <p className="text-[11px] text-red-600 font-bold mt-1">
                ⚠️ Inventory items must be assigned to a specific outlet location. Please select an outlet above.
              </p>
            )}
          </div>

          {/* Item Name */}
          <div>
            <label htmlFor="item-name" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
              Item Name <span className="text-[#D3232A]">*</span>
            </label>
            <input
              ref={firstInputRef}
              id="item-name"
              required
              type="text"
              placeholder="e.g. Whole Milk, Espresso Beans, Paper Cups"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-[#D3232A] focus:ring-2 focus:ring-[#D3232A]/20 focus:outline-none transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category & Unit of Measure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div>
              <label htmlFor="item-category" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Category <span className="text-[#D3232A]">*</span>
              </label>
              <select
                id="item-category"
                required
                value={isCustomCategory ? "custom" : category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-[#D3232A] focus:ring-2 focus:ring-[#D3232A]/20 focus:outline-none transition-all"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom">+ Add Custom Category...</option>
              </select>
              {isCustomCategory && (
                <input
                  type="text"
                  placeholder="Enter custom category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs focus:border-[#D3232A] focus:outline-none"
                />
              )}
            </div>

            {/* Unit of Measure Dropdown */}
            <div>
              <label htmlFor="item-unit" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Unit of Measure (UOM) <span className="text-[#D3232A]">*</span>
              </label>
              <select
                id="item-unit"
                required
                value={isCustomUnit ? "custom" : unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-sm focus:border-[#D3232A] focus:ring-2 focus:ring-[#D3232A]/20 focus:outline-none transition-all"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
              {isCustomUnit && (
                <input
                  type="text"
                  placeholder="e.g. tray, gallon, scoop..."
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs focus:border-[#D3232A] focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Reorder Level & Unit Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reorder Level */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label htmlFor="item-reorder" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Reorder Level <span className="text-[#D3232A]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowReorderHelp(!showReorderHelp)}
                  className="text-zinc-400 hover:text-zinc-600"
                  title="What is Reorder Level?"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </div>

              <input
                id="item-reorder"
                required
                type="number"
                min="0"
                step="any"
                placeholder="5"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-[#D3232A] focus:ring-2 focus:ring-[#D3232A]/20 focus:outline-none transition-all"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(e.target.value === "" ? "" : Number(e.target.value))}
              />

              {showReorderHelp && (
                <div className="mt-1.5 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800 leading-tight">
                  💡 <strong>Reorder Level:</strong> The minimum stock count that triggers a <em>Low Stock Alert</em> when stock falls at or below this quantity.
                </div>
              )}
            </div>

            {/* Unit Cost (₹) */}
            <div>
              <label htmlFor="item-cost" className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                Unit Cost (₹) <span className="text-[#D3232A]">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-zinc-400">₹</span>
                <input
                  id="item-cost"
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-xl border border-zinc-300 pl-8 pr-3.5 py-2.5 text-sm font-semibold focus:border-[#D3232A] focus:ring-2 focus:ring-[#D3232A]/20 focus:outline-none transition-all"
                  value={costText}
                  onChange={(e) => setCostText(e.target.value)}
                />
              </div>
              <p className="mt-1 text-[11px] text-zinc-400">Cost per {isCustomUnit ? customUnit || "unit" : unit} in Rupees</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#b01e23] transition-colors disabled:opacity-50 shadow-md"
            >
              {busy ? "Saving Item..." : <><Check className="h-4 w-4" /> Save Item</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
