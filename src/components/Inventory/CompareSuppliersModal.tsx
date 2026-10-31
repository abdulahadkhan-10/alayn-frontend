"use client";

import React, { useState, useMemo } from "react";
import { TModal } from "@/components/ui/TModal";
import {
  TrendingDown,
  Award,
  Zap,
  Star,
  Clock,
  Package,
  ShoppingCart,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  useCompareSuppliersQuery,
  ComparisonOption,
} from "@/redux/slices/supplierApiSlice";
import { InventoryItemApi } from "@/redux/slices/inventoryApiSlice";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItemApi | null;
  onSelectSupplierForPO?: (supplierId: string, itemData: ComparisonOption) => void;
}

export default function CompareSuppliersModal({
  isOpen,
  onClose,
  item,
  onSelectSupplierForPO,
}: Props) {
  const [sortMode, setSortMode] = useState<"CHEAPEST" | "QUALITY" | "FASTEST">("CHEAPEST");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data: comparisonData, isLoading } = useCompareSuppliersQuery(
    {
      itemName: item?.name,
      category: item?.category,
      currentUnitCostPaise: item?.unitCostPaise,
      unit: item?.unit,
    },
    { skip: !isOpen || !item }
  );

  const currentPriceRupees = item ? item.unitCostPaise / 100 : 0;

  const sortedOptions = useMemo(() => {
    if (!comparisonData?.allOptions) return [];
    let list = [...comparisonData.allOptions];

    if (inStockOnly) {
      list = list.filter((opt) => opt.inStock);
    }

    if (sortMode === "CHEAPEST") {
      list.sort((a, b) => a.pricePaise - b.pricePaise);
    } else if (sortMode === "QUALITY") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortMode === "FASTEST") {
      list.sort((a, b) => (a.leadTimeHours || 24) - (b.leadTimeHours || 24));
    }

    return list;
  }, [comparisonData, sortMode, inStockOnly]);

  const cheapest = comparisonData?.recommendations?.cheapest;
  const bestQuality = comparisonData?.recommendations?.bestQuality;
  const fastest = comparisonData?.recommendations?.fastestDelivery;

  return (
    <TModal
      open={isOpen}
      onClose={onClose}
      className="bg-black/40 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 text-zinc-900">
        
        {/* Header with Item Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-red-50 text-[#D3232A]">
                <Package className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                  Compare Suppliers for <span className="text-[#D3232A]">{item?.name}</span>
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Category: <span className="text-zinc-700 font-semibold">{item?.category}</span> • Unit: <span className="text-zinc-700 font-semibold">{item?.unit}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 border border-zinc-200 px-3.5 py-2 rounded-xl text-right shrink-0">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              Your Current Store Cost
            </span>
            <span className="text-base font-black text-zinc-900 tabular-nums">
              ₹{currentPriceRupees.toFixed(2)} <span className="text-xs font-normal text-zinc-500">/ {item?.unit}</span>
            </span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#D3232A]" />
            <p className="text-xs font-semibold text-zinc-500">Searching active supplier price books...</p>
          </div>
        ) : !comparisonData || comparisonData.summary.totalSuppliersFound === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50">
            <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
            <h3 className="text-sm font-bold text-zinc-800">No active suppliers found for &quot;{item?.name}&quot;</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Currently no registered suppliers have listed &quot;{item?.name}&quot; or items in the &quot;{item?.category}&quot; category in their price catalog.
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Smart Recommendation Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Cheapest */}
              <div
                onClick={() => setSortMode("CHEAPEST")}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                  sortMode === "CHEAPEST"
                    ? "bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20"
                    : "bg-white border-zinc-200 hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="h-4 w-4" /> Cheapest Rate
                  </span>
                  {cheapest?.savingsPercent ? (
                    <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                      Save {cheapest.savingsPercent}%
                    </span>
                  ) : null}
                </div>
                <div className="text-sm font-black text-zinc-900 truncate">
                  {cheapest ? cheapest.supplierName : "None"}
                </div>
                <div className="text-xs text-emerald-700 font-bold tabular-nums mt-0.5">
                  {cheapest ? `₹${cheapest.priceRupees.toFixed(2)} / ${cheapest.unit}` : "N/A"}
                </div>
              </div>

              {/* 2. Best Quality */}
              <div
                onClick={() => setSortMode("QUALITY")}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                  sortMode === "QUALITY"
                    ? "bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20"
                    : "bg-white border-zinc-200 hover:border-purple-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-purple-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4 w-4" /> Top Quality
                  </span>
                  <span className="bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    ★ {bestQuality?.rating || 5.0}
                  </span>
                </div>
                <div className="text-sm font-black text-zinc-900 truncate">
                  {bestQuality ? bestQuality.supplierName : "None"}
                </div>
                <div className="text-xs text-purple-700 font-bold tabular-nums mt-0.5">
                  {bestQuality ? `⭐ ${bestQuality.rating} • ₹${bestQuality.priceRupees.toFixed(2)}` : "N/A"}
                </div>
              </div>

              {/* 3. Fastest Delivery */}
              <div
                onClick={() => setSortMode("FASTEST")}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                  sortMode === "FASTEST"
                    ? "bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20"
                    : "bg-white border-zinc-200 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-blue-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4" /> Fastest Delivery
                  </span>
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                    {fastest?.leadTimeHours || 24}h SLA
                  </span>
                </div>
                <div className="text-sm font-black text-zinc-900 truncate">
                  {fastest ? fastest.supplierName : "None"}
                </div>
                <div className="text-xs text-blue-700 font-bold tabular-nums mt-0.5">
                  {fastest ? `₹${fastest.priceRupees.toFixed(2)} • ${fastest.leadTimeHours}h Delivery` : "N/A"}
                </div>
              </div>
            </div>

            {/* Filter and View Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setSortMode("CHEAPEST")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortMode === "CHEAPEST" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Cheapest First
                </button>
                <button
                  onClick={() => setSortMode("QUALITY")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortMode === "QUALITY" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Best Quality
                </button>
                <button
                  onClick={() => setSortMode("FASTEST")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    sortMode === "FASTEST" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Fastest Delivery
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-zinc-300 text-[#D3232A] focus:ring-[#D3232A]"
                />
                In Stock Only
              </label>
            </div>

            {/* List of Comparing Suppliers */}
            <div className="flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1">
              {sortedOptions.map((opt) => {
                const isCheapestMatch = cheapest?.id === opt.id;
                const isBestQualityMatch = bestQuality?.id === opt.id;
                const isFastestMatch = fastest?.id === opt.id;

                return (
                  <div
                    key={opt.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                      isCheapestMatch
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    {/* Supplier & Product Info */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900">{opt.supplierName}</span>
                        {isCheapestMatch && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-black">
                            <TrendingDown className="h-3 w-3" /> Best Price
                          </span>
                        )}
                        {isBestQualityMatch && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-black">
                            <Award className="h-3 w-3" /> Top Quality
                          </span>
                        )}
                        {isFastestMatch && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-100 text-blue-800 px-2 py-0.5 text-[10px] font-black">
                            <Zap className="h-3 w-3" /> Fastest
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {opt.rating || 5.0}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium flex-wrap">
                        <span className="font-semibold text-zinc-700">{opt.name}</span>

                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-zinc-400" />
                          {opt.leadTimeHours}h lead time
                        </span>
                        <span>•</span>
                        <span>Min Order: {opt.minOrderQty} {opt.unit}</span>
                      </div>

                      {opt.contactPerson && (
                        <p className="text-[11px] text-zinc-400 font-medium">
                          Contact: {opt.contactPerson} ({opt.phone})
                        </p>
                      )}
                    </div>

                    {/* Price & Action Box */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 shrink-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base font-black text-zinc-900 tabular-nums">
                          ₹{opt.priceRupees.toFixed(2)}
                          <span className="text-xs font-normal text-zinc-400"> / {opt.unit}</span>
                        </div>
                        {currentPriceRupees > 0 && (
                          <div className="text-[11px] font-bold">
                            {opt.isCheaper ? (
                              <span className="text-emerald-700">
                                Save ₹{(currentPriceRupees - opt.priceRupees).toFixed(2)} ({opt.savingsPercent}%)
                              </span>
                            ) : opt.priceRupees === currentPriceRupees ? (
                              <span className="text-zinc-500">Same as current cost</span>
                            ) : (
                              <span className="text-rose-600">
                                +₹{(opt.priceRupees - currentPriceRupees).toFixed(2)} higher
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (onSelectSupplierForPO) {
                            onSelectSupplierForPO(opt.supplierId, opt);
                          }
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-[#D3232A] text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Order PO
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </TModal>
  );
}
