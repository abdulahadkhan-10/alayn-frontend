"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  TrendingDown,
  Award,
  Zap,
  Star,
  Clock,
  Package,
  ShoppingCart,
  Store,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowUpDown,
  Tag,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import {
  useGetMarketCatalogQuery,
  SupplierItemApi,
} from "@/redux/slices/supplierApiSlice";
import { InventoryItemApi } from "@/redux/slices/inventoryApiSlice";

interface Props {
  inventoryItems?: InventoryItemApi[];
  onOrderPO?: (supplierId: string, item: SupplierItemApi) => void;
}

export default function SupplierMarketplaceSection({
  inventoryItems = [],
  onOrderPO,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"CHEAPEST" | "QUALITY" | "FASTEST">("CHEAPEST");

  const { data: marketItems = [], isLoading, isError, refetch } = useGetMarketCatalogQuery({
    search: search.trim() || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
    inStockOnly,
  });

  const safeMarketItems: SupplierItemApi[] = useMemo(() => {
    if (Array.isArray(marketItems)) return marketItems;
    if (marketItems && typeof marketItems === "object" && Array.isArray((marketItems as any).data)) {
      return (marketItems as any).data;
    }
    return [];
  }, [marketItems]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    safeMarketItems.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [safeMarketItems]);

  // Compute matches and potential savings against current restaurant stock
  const processedItems = useMemo(() => {
    return safeMarketItems.map((item) => {
      const priceRupees = item.pricePaise / 100;

      // Find matching item in restaurant's own inventory
      const matchingStockItem = inventoryItems.find((inv) => {
        const invName = inv.name.toLowerCase();
        const supName = item.name.toLowerCase();
        return invName.includes(supName) || supName.includes(invName);
      });

      let currentCostRupees: number | null = null;
      let savingsRupees: number | null = null;
      let savingsPercent: number | null = null;

      if (matchingStockItem && matchingStockItem.unitCostPaise > 0) {
        currentCostRupees = matchingStockItem.unitCostPaise / 100;
        savingsRupees = currentCostRupees - priceRupees;
        savingsPercent = Math.round((savingsRupees / currentCostRupees) * 100);
      }

      const qualityScore =
        (item.qualityGrade === "Organic" ? 4 :
         item.qualityGrade === "Premium" ? 3 :
         item.qualityGrade === "Grade A" ? 2 : 1) * 10 +
        Number(item.supplier?.rating || 4.5);

      return {
        ...item,
        priceRupees,
        matchingStockItem,
        currentCostRupees,
        savingsRupees,
        savingsPercent,
        qualityScore,
      };
    });
  }, [marketItems, inventoryItems]);

  const sortedItems = useMemo(() => {
    const list = [...processedItems];
    if (sortBy === "CHEAPEST") {
      list.sort((a, b) => a.pricePaise - b.pricePaise);
    } else if (sortBy === "QUALITY") {
      list.sort((a, b) => b.qualityScore - a.qualityScore);
    } else if (sortBy === "FASTEST") {
      list.sort((a, b) => a.leadTimeHours - b.leadTimeHours);
    }
    return list;
  }, [processedItems, sortBy]);

  return (
    <div className="flex flex-col gap-5 w-full">
      
      {/* Banner / Value Proposition */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">
              Smart Purchasing & Wholesale Catalog
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold mt-1 text-white">
            Find the Cheapest & Best Material Suppliers
          </h2>
          <p className="text-xs text-zinc-300 max-w-xl mt-1">
            Browse verified food, dairy, produce, and packaging suppliers. Compare live market wholesale rates against your current inventory costs to optimize margins.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Active Suppliers</span>
            <span className="text-lg font-black text-white tabular-nums">
              {new Set(marketItems.map((i) => i.supplierId)).size}
            </span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-xl text-center border border-white/10">
            <span className="text-[10px] text-zinc-400 font-bold uppercase block">Catalog Items</span>
            <span className="text-lg font-black text-emerald-400 tabular-nums">
              {marketItems.length}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search ingredients, raw materials, or supplier names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs sm:text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
          />
        </div>

        {/* Sort & Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSortBy("CHEAPEST")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === "CHEAPEST" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Cheapest Rate
            </button>
            <button
              onClick={() => setSortBy("QUALITY")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === "QUALITY" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Top Quality
            </button>
            <button
              onClick={() => setSortBy("FASTEST")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                sortBy === "FASTEST" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              Fastest SLA
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 cursor-pointer px-2">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="rounded border-zinc-300 text-[#D3232A] focus:ring-[#D3232A]"
            />
            In Stock
          </label>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Supplier Items */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-2xl border border-zinc-200 bg-white">
              <Skeleton height={20} width="60%" className="mb-2" />
              <Skeleton height={14} width="40%" className="mb-4" />
              <Skeleton height={32} />
            </div>
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-white">
          <Store className="h-10 w-10 text-zinc-300 mb-2" />
          <h3 className="text-sm font-bold text-zinc-800">No items found in marketplace</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1">
            Try adjusting your search keywords or clearing active filters. Registered suppliers can add items to this portal anytime.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => {
            const hasSavings = item.savingsPercent && item.savingsPercent > 0;

            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-xs transition-all group"
              >
                <div>
                  {/* Top Meta: Supplier & Rating */}
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5 mb-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <Store className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="font-bold text-xs text-zinc-800 truncate">
                        {item.supplier?.name || "Independent Supplier"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md shrink-0">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {item.supplier?.rating || 5.0}
                    </div>
                  </div>

                  {/* Product Title & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 leading-snug group-hover:text-[#D3232A] transition-colors">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-zinc-500">
                          {item.category}
                        </span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-black uppercase">
                          {item.qualityGrade || "Standard"}
                        </span>
                      </div>
                    </div>

                    {item.inStock ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        In Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full shrink-0">
                        Pre-order
                      </span>
                    )}
                  </div>

                  {/* Delivery & MOQ Specs */}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium mt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {item.leadTimeHours}h delivery
                    </span>
                    <span>•</span>
                    <span>Min: {item.minOrderQty} {item.unit}</span>
                  </div>

                  {/* Savings Indicator */}
                  {hasSavings && (
                    <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-bold flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5" /> Save {item.savingsPercent}% vs store
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        -₹{item.savingsRupees?.toFixed(2)} / {item.unit}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Price & Purchase Button */}
                <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 mt-4">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Wholesale Price
                    </span>
                    <span className="text-base font-black text-zinc-900 tabular-nums">
                      ₹{item.priceRupees.toFixed(2)}
                      <span className="text-xs font-normal text-zinc-500"> / {item.unit}</span>
                    </span>
                  </div>

                  <button
                    onClick={() => onOrderPO?.(item.supplierId, item)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-[#D3232A] text-white px-3.5 py-2 text-xs font-bold transition-all shadow-xs"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Create PO
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
