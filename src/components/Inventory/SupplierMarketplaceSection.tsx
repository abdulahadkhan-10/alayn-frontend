"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Clock,
  Store,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  RotateCcw,
  Table2,
  TrendingDown,
  X,
  ShieldCheck,
  Building2,
  Truck,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Package,
  Layers,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import {
  useGetMarketCatalogQuery,
  SupplierItemApi,
} from "@/redux/slices/supplierApiSlice";
import { InventoryItemApi } from "@/redux/slices/inventoryApiSlice";

export interface MarketplaceSupplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  deliveryTerms?: string;
}

interface ProcessedMarketItem extends SupplierItemApi {
  priceRupees: number;
  matchingStockItem?: InventoryItemApi;
  currentCostRupees: number | null;
  savingsRupees: number | null;
  savingsPercent: number | null;
}

interface VendorProfile {
  supplier: MarketplaceSupplier;
  items: ProcessedMarketItem[];
  categories: string[];
  totalItems: number;
  minPriceRupees: number;
  maxPriceRupees: number;
  fastestLeadTimeHours: number;
  sampleItems: ProcessedMarketItem[];
  hasInStock: boolean;
}

interface Props {
  inventoryItems?: InventoryItemApi[];
  onOrderPO?: (
    supplier: MarketplaceSupplier,
    items: SupplierItemApi[],
    initialQuantities?: Record<string, number>
  ) => void;
}

export default function SupplierMarketplaceSection({
  inventoryItems = [],
  onOrderPO,
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"VENDORS" | "LEDGER">("VENDORS");

  // Selected items across marketplace keyed by itemId: boolean
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});
  // Quantities keyed by itemId: number
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Active vendor for the "View Catalog & Order" modal drawer
  const [activeVendor, setActiveVendor] = useState<VendorProfile | null>(null);
  const [catalogModalCategory, setCatalogModalCategory] = useState("All");

  const { data: marketItems = [], isLoading } = useGetMarketCatalogQuery({
    search: search.trim() || undefined,
    category: selectedCategory !== "All" ? selectedCategory : undefined,
  });

  const safeMarketItems: SupplierItemApi[] = useMemo(() => {
    if (Array.isArray(marketItems)) return marketItems;
    if (marketItems && typeof marketItems === "object") {
      const maybeData = (marketItems as { data?: unknown }).data;
      if (Array.isArray(maybeData)) {
        return maybeData as SupplierItemApi[];
      }
    }
    return [];
  }, [marketItems]);

  // Compute live matches, benchmark rates, and savings against current inventory costs
  const processedItems: ProcessedMarketItem[] = useMemo(() => {
    return safeMarketItems.map((item) => {
      const priceRupees = item.pricePaise / 100;

      // Match item in restaurant's own inventory by substring/exact name
      const matchingStockItem = inventoryItems.find((inv) => {
        const invName = inv.name.toLowerCase().trim();
        const supName = item.name.toLowerCase().trim();
        return invName === supName || invName.includes(supName) || supName.includes(invName);
      });

      let currentCostRupees: number | null = null;
      let savingsRupees: number | null = null;
      let savingsPercent: number | null = null;

      if (matchingStockItem && matchingStockItem.unitCostPaise > 0) {
        currentCostRupees = matchingStockItem.unitCostPaise / 100;
        savingsRupees = currentCostRupees - priceRupees;
        savingsPercent = Math.round((savingsRupees / currentCostRupees) * 100);
      }

      return {
        ...item,
        priceRupees,
        matchingStockItem,
        currentCostRupees,
        savingsRupees,
        savingsPercent,
      };
    });
  }, [safeMarketItems, inventoryItems]);

  // Derive vendor profiles grouped by supplier
  const vendorProfiles: VendorProfile[] = useMemo(() => {
    const map = new Map<string, ProcessedMarketItem[]>();

    for (const item of processedItems) {
      const supId = item.supplierId;
      if (!map.has(supId)) {
        map.set(supId, []);
      }
      map.get(supId)!.push(item);
    }

    const profiles: VendorProfile[] = [];

    map.forEach((items, supId) => {
      const firstItem = items[0];
      const supMeta = firstItem.supplier;

      const categories = Array.from(
        new Set(items.map((i) => i.category || "General Supplies"))
      );

      const prices = items.map((i) => i.priceRupees);
      const minPriceRupees = Math.min(...prices);
      const maxPriceRupees = Math.max(...prices);

      const leadTimes = items.map((i) => i.leadTimeHours || 24);
      const fastestLeadTimeHours = Math.min(...leadTimes);

      profiles.push({
        supplier: {
          id: supId,
          name: supMeta?.name || "Wholesale Distributor",
          contactPerson: supMeta?.contactPerson,
          phone: supMeta?.phone,
          email: supMeta?.email,
          address: supMeta?.address,
          deliveryTerms: supMeta?.deliveryTerms,
        },
        items,
        categories,
        totalItems: items.length,
        minPriceRupees,
        maxPriceRupees,
        fastestLeadTimeHours,
        sampleItems: items.slice(0, 5),
        hasInStock: items.some((i) => i.inStock),
      });
    });

    // Sort by name
    return profiles.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name));
  }, [processedItems]);

  // Sync activeVendor if data refreshes
  useEffect(() => {
    if (activeVendor) {
      const updated = vendorProfiles.find((v) => v.supplier.id === activeVendor.supplier.id);
      if (updated) {
        setActiveVendor(updated);
      }
    }
  }, [vendorProfiles, activeVendor]);

  // Derived category pills for the top filter bar
  const categoryPills = useMemo(() => {
    const counts: Record<string, number> = { All: 0 };
    const supplierSet = new Set<string>();

    processedItems.forEach((item) => {
      supplierSet.add(item.supplierId);
      const cat = item.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    counts.All = supplierSet.size;

    const dynamicCategories = Object.keys(counts).filter((c) => c !== "All");

    return [
      { id: "All", label: "All Wholesalers", count: counts.All },
      ...dynamicCategories.map((c) => ({
        id: c,
        label: c,
        count: counts[c] || 0,
      })),
    ];
  }, [processedItems]);

  // Filtered vendors based on search and category
  const filteredVendors = useMemo(() => {
    const q = search.toLowerCase().trim();

    return vendorProfiles.filter((vp) => {
      // Category filter
      if (selectedCategory !== "All") {
        const matchesCategory = vp.categories.some(
          (c) => c.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (!matchesCategory) return false;
      }

      // Search query filter (matches vendor name, contact person, or any item name they supply)
      if (q) {
        const matchesName = vp.supplier.name.toLowerCase().includes(q);
        const matchesContact = vp.supplier.contactPerson?.toLowerCase().includes(q);
        const matchesAddress = vp.supplier.address?.toLowerCase().includes(q);
        const matchesCategory = vp.categories.some((c) => c.toLowerCase().includes(q));
        const matchesItem = vp.items.some((i) => i.name.toLowerCase().includes(q));

        return matchesName || matchesContact || matchesAddress || matchesCategory || matchesItem;
      }

      return true;
    });
  }, [vendorProfiles, search, selectedCategory]);

  // Quantities & Selection Helpers
  const toggleSelect = (itemId: string, defaultMinQty = 1) => {
    setSelectedItemIds((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      if (!prev[itemId] && !quantities[itemId]) {
        setQuantities((q) => ({ ...q, [itemId]: defaultMinQty }));
      }
      return next;
    });
  };

  const updateQuantity = (itemId: string, value: number, min = 1) => {
    const safeVal = Math.max(min, Math.round(value * 10) / 10);
    setQuantities((prev) => ({ ...prev, [itemId]: safeVal }));
  };

  const selectAllInActiveVendor = (items: ProcessedMarketItem[]) => {
    const allSelected = items.every((i) => selectedItemIds[i.id]);
    const nextIds = { ...selectedItemIds };
    const nextQty = { ...quantities };

    items.forEach((i) => {
      nextIds[i.id] = !allSelected;
      if (!allSelected && !nextQty[i.id]) {
        nextQty[i.id] = Number(i.minOrderQty) || 1;
      }
    });

    setSelectedItemIds(nextIds);
    setQuantities(nextQty);
  };

  // Metrics for active vendor's catalog drawer
  const activeVendorOrderMetrics = useMemo(() => {
    if (!activeVendor) return { selectedItems: [], count: 0, subtotalRupees: 0 };

    const selected = activeVendor.items.filter((i) => selectedItemIds[i.id]);
    let totalPaise = 0;

    for (const item of selected) {
      const qty = quantities[item.id] || Number(item.minOrderQty) || 1;
      totalPaise += Math.round(qty * item.pricePaise);
    }

    return {
      selectedItems: selected,
      count: selected.length,
      subtotalRupees: (totalPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      rawPaise: totalPaise,
    };
  }, [activeVendor, selectedItemIds, quantities]);

  // Handler to place PO from the catalog drawer
  const handlePlaceOrderForActiveVendor = () => {
    if (!activeVendor) return;

    // Get selected items or all items that have a configured quantity
    let orderItems = activeVendorOrderMetrics.selectedItems;

    // If nothing checked, check if there's any item with quantity or select all visible
    if (orderItems.length === 0) {
      orderItems = activeVendor.items.filter((i) => (quantities[i.id] || 0) > 0);
    }

    // If still empty, pick the first item with minimum order quantity
    if (orderItems.length === 0 && activeVendor.items.length > 0) {
      const first = activeVendor.items[0];
      orderItems = [first];
      if (!quantities[first.id]) {
        quantities[first.id] = Number(first.minOrderQty) || 1;
      }
    }

    if (orderItems.length > 0) {
      onOrderPO?.(activeVendor.supplier, orderItems, quantities);
      setActiveVendor(null);
    }
  };

  // Close catalog modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeVendor) {
        setActiveVendor(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeVendor]);

  return (
    <div className="flex flex-col gap-5 w-full">

      {/* Category Pills Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoryPills.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-[0.98] ${
                isActive
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-white border border-zinc-200/80 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50/50"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search, View Modes & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-2xs">
        
        {/* Search Input */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search verified wholesalers, supplied materials (e.g. Chicken, Milk, Buff)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-800 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A] transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher: Vendors Directory vs Ledger Table */}
        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl text-xs font-semibold shrink-0">
          <button
            onClick={() => setViewMode("VENDORS")}
            title="Verified Wholesalers Directory"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-[0.98] ${
              viewMode === "VENDORS"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Store className="h-3.5 w-3.5" />
            <span>Wholesalers ({filteredVendors.length})</span>
          </button>

          <button
            onClick={() => setViewMode("LEDGER")}
            title="Master Wholesale Price Ledger"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all active:scale-[0.98] ${
              viewMode === "LEDGER"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            <span>All Materials Ledger</span>
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton height={140} borderRadius={16} count={3} className="mb-3" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-zinc-200 rounded-2xl bg-white">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
            <Store className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-900">
            {selectedCategory !== "All"
              ? `No registered wholesalers under "${selectedCategory}"`
              : "No verified wholesalers found"}
          </h3>
          <p className="text-xs text-zinc-500 max-w-md mt-1.5 leading-relaxed">
            {selectedCategory !== "All"
              ? `We couldn't find suppliers listed under ${selectedCategory}. Try viewing all categories or inviting your local distributor to list on the Alayn procurement exchange.`
              : "Try adjusting your search keywords, or reset filters to view all available wholesale suppliers."}
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 rounded-xl text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Filters
          </button>
        </div>
      ) : (
        <>
          {/* ======================================================== */}
          {/* PRIMARY VIEW: LIST OF VENDORS (WHO THEY ARE & WHAT THEY PROVIDE) */}
          {/* ======================================================== */}
          {viewMode === "VENDORS" && (
            <div className="grid grid-cols-1 gap-4">
              {filteredVendors.map((vp) => {
                const { supplier, items, categories, sampleItems, fastestLeadTimeHours, totalItems } = vp;

                return (
                  <div
                    key={supplier.id}
                    className="group bg-white rounded-2xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 hover:shadow-xs transition-all duration-200 overflow-hidden"
                  >
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      
                      {/* Left Block: Vendor Identity & Contact */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Wholesaler Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0 group-hover:bg-red-50 group-hover:text-[#D3232A] group-hover:border-red-200 transition-colors">
                          <Building2 className="h-6 w-6" />
                        </div>

                        {/* Details */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-base text-zinc-900 tracking-tight">
                              {supplier.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Verified Wholesaler</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                              Direct Distributor
                            </span>
                          </div>

                          {/* Contact & Location Snippet */}
                          <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1 flex-wrap">
                            {supplier.address && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-zinc-400" />
                                <span className="truncate max-w-[200px]">{supplier.address}</span>
                              </span>
                            )}
                            {supplier.contactPerson && (
                              <span className="flex items-center gap-1">
                                <span className="text-zinc-400">Rep:</span>
                                <span className="font-medium text-zinc-700">{supplier.contactPerson}</span>
                              </span>
                            )}
                            {supplier.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-zinc-400" />
                                <span>{supplier.phone}</span>
                              </span>
                            )}
                          </div>

                          {/* Logistics / SLA line */}
                          <div className="flex items-center gap-3 text-xs text-zinc-600 mt-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-zinc-700">
                              <Clock className="h-3.5 w-3.5 text-zinc-400" />
                              <span>{fastestLeadTimeHours}h Delivery SLA</span>
                            </span>
                            {supplier.deliveryTerms && (
                              <span className="inline-flex items-center gap-1 text-zinc-500">
                                <Truck className="h-3.5 w-3.5 text-zinc-400" />
                                <span>{supplier.deliveryTerms}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Block: What they are providing (Categories & Top Items preview) */}
                      <div className="flex-1 lg:max-w-md bg-zinc-50/70 rounded-xl p-3.5 border border-zinc-100">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                            Supplies Provided
                          </span>
                          <span className="text-[11px] font-bold text-zinc-700 bg-white px-2 py-0.5 rounded-md border border-zinc-200">
                            {totalItems} {totalItems === 1 ? "Product" : "Products"} Listed
                          </span>
                        </div>

                        {/* Category Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap mb-2">
                          {categories.map((c) => (
                            <span
                              key={c}
                              className="text-xs font-bold text-zinc-800 bg-white px-2.5 py-0.5 rounded-lg border border-zinc-200/90 shadow-2xs"
                            >
                              {c}
                            </span>
                          ))}
                        </div>

                        {/* Preview of items they provide */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {sampleItems.map((item) => (
                            <span
                              key={item.id}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-white/80 px-2 py-0.5 rounded-md border border-zinc-200/60"
                            >
                              <span className="font-semibold text-zinc-800">{item.name}</span>
                              <span className="text-zinc-400 font-mono">₹{item.priceRupees.toFixed(0)}/{item.unit}</span>
                            </span>
                          ))}
                          {totalItems > sampleItems.length && (
                            <span className="text-[11px] font-bold text-zinc-400 px-1">
                              +{totalItems - sampleItems.length} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Block: Action to View Catalog & Place Order */}
                      <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                            Wholesale Rates
                          </span>
                          <span className="text-xs font-bold text-zinc-700">
                            ₹{vp.minPriceRupees.toFixed(0)} – ₹{vp.maxPriceRupees.toFixed(0)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveVendor(vp);
                            setCatalogModalCategory("All");
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-[#D3232A] text-white text-xs font-extrabold shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <span>View Catalog &amp; Order</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ======================================================== */}
          {/* ALTERNATE VIEW: MASTER WHOLESALE PRICE LEDGER TABLE */}
          {/* ======================================================== */}
          {viewMode === "LEDGER" && (
            <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 bg-zinc-50/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Live Wholesale Price Ledger
                  </span>
                  <span className="text-xs font-semibold text-zinc-400">
                    · Showing {processedItems.length} materials across all suppliers
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200/80 bg-zinc-50/30 text-zinc-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-10 text-center"></th>
                      <th className="py-3 px-4">Raw Material</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Verified Wholesaler</th>
                      <th className="py-3 px-3">SLA / Dispatch</th>
                      <th className="py-3 px-4 text-right">Wholesale Rate</th>
                      <th className="py-3 px-4">Margin Benchmark</th>
                      <th className="py-3 px-3">Stock &amp; MOQ</th>
                      <th className="py-3 px-3 text-center">Order Qty</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {processedItems.map((item) => {
                      const isSelected = !!selectedItemIds[item.id];
                      const currentQty = quantities[item.id] || Number(item.minOrderQty) || 1;
                      const hasSavings = item.savingsPercent && item.savingsPercent > 0;
                      const min = Number(item.minOrderQty) || 1;

                      return (
                        <tr
                          key={item.id}
                          className={`group transition-colors ${
                            isSelected ? "bg-red-50/30 border-l-2 border-l-[#D3232A]" : "hover:bg-zinc-50/80"
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.id, min)}
                              className="rounded border-zinc-300 text-[#D3232A] focus:ring-[#D3232A] cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-sm text-zinc-900 group-hover:text-black">
                              {item.name}
                            </span>
                            {item.sku && (
                              <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">
                                SKU: {item.sku}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                              {item.category || "General"}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="min-w-[140px]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs text-zinc-900">
                                  {item.supplier?.name || "Independent"}
                                </span>
                                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                              </div>
                              <span className="text-[10px] text-zinc-400 block font-medium mt-0.5">
                                Direct Wholesaler
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-xs text-zinc-600 font-medium">
                              <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <span>{item.leadTimeHours}h delivery</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="text-sm font-extrabold text-zinc-900 tabular-nums">
                              ₹{item.priceRupees.toFixed(2)}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-normal block">
                              / {item.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {hasSavings ? (
                              <div className="min-w-[130px]">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                  <TrendingDown className="h-3 w-3 shrink-0" />
                                  <span>Save {item.savingsPercent}%</span>
                                </span>
                                <span className="text-[10px] text-emerald-600 block mt-0.5 font-medium">
                                  -₹{item.savingsRupees?.toFixed(2)} / {item.unit} vs menu cost
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-400 font-medium">
                                Wholesale Direct
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {item.inStock ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                                  Pre-order
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">
                              Min: {item.minOrderQty} {item.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="inline-flex items-center border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, currentQty - 1, min)}
                                disabled={currentQty <= min}
                                className="px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 active:scale-95 transition-all"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number"
                                min={min}
                                step="any"
                                value={currentQty}
                                onChange={(e) => updateQuantity(item.id, Number(e.target.value) || min, min)}
                                className="w-12 text-center text-xs font-bold text-zinc-900 border-x border-zinc-200 py-1 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, currentQty + 1, min)}
                                className="px-2 py-1 text-zinc-500 hover:bg-zinc-100 active:scale-95 transition-all"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-[10px] text-zinc-400 block mt-0.5 font-medium">
                              {item.unit}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                const vendor = vendorProfiles.find((v) => v.supplier.id === item.supplierId);
                                if (vendor) {
                                  setActiveVendor(vendor);
                                  toggleSelect(item.id, min);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 text-white hover:bg-[#D3232A] active:scale-95 transition-all shadow-2xs"
                            >
                              <ShoppingCart className="h-3 w-3" />
                              <span>Order</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ======================================================== */}
      {/* VENDOR CATALOG & DIRECT ORDER MODAL DRAWER */}
      {/* ======================================================== */}
      {activeVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200/80 bg-zinc-50/60 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-[#D3232A] border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                      {activeVendor.supplier.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Verified Wholesaler</span>
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Direct B2B Wholesaler Catalog</span>
                    <span>·</span>
                    <span className="font-semibold text-zinc-700">{activeVendor.totalItems} Materials Available</span>
                    {activeVendor.supplier.deliveryTerms && (
                      <>
                        <span>·</span>
                        <span className="text-zinc-600">{activeVendor.supplier.deliveryTerms}</span>
                      </>
                    )}
                  </p>

                  {/* Contact pills */}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 flex-wrap">
                    {activeVendor.supplier.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-zinc-400" />
                        <span>{activeVendor.supplier.phone}</span>
                      </span>
                    )}
                    {activeVendor.supplier.address && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-zinc-400" />
                        <span>{activeVendor.supplier.address}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-zinc-700 font-medium">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      <span>{activeVendor.fastestLeadTimeHours}h SLA Turnaround</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveVendor(null)}
                className="h-8 w-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Sub-Header Toolbar (Category filter & Select All) */}
            <div className="px-6 py-2.5 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                Available Materials ({activeVendor.items.length})
              </span>

              <div className="flex items-center gap-3">
                {/* Category Filter inside vendor */}
                {activeVendor.categories.length > 1 && (
                  <select
                    value={catalogModalCategory}
                    onChange={(e) => setCatalogModalCategory(e.target.value)}
                    className="text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    <option value="All">All Categories ({activeVendor.items.length})</option>
                    {activeVendor.categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => selectAllInActiveVendor(activeVendor.items)}
                  className="text-xs font-bold text-zinc-700 hover:text-zinc-900 underline"
                >
                  {activeVendor.items.every((i) => selectedItemIds[i.id]) ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>

            {/* Catalog Items Table */}
            <div className="flex-1 overflow-y-auto p-0">
              {(() => {
                const filteredModalItems = activeVendor.items.filter((item) => {
                  if (catalogModalCategory !== "All" && item.category !== catalogModalCategory) {
                    return false;
                  }
                  return true;
                });

                if (filteredModalItems.length === 0) {
                  return (
                    <div className="py-12 text-center text-zinc-400 text-xs">
                      No materials found under the selected category.
                    </div>
                  );
                }

                return (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-zinc-50/95 backdrop-blur-xs border-b border-zinc-200/80 text-zinc-400 text-[10px] font-bold uppercase tracking-wider z-10">
                      <tr>
                        <th className="py-2.5 px-4 w-10 text-center"></th>
                        <th className="py-2.5 px-4">Raw Material</th>
                        <th className="py-2.5 px-3">Department</th>
                        <th className="py-2.5 px-4 text-right">Wholesale Rate</th>
                        <th className="py-2.5 px-4">Margin Benchmark</th>
                        <th className="py-2.5 px-3">Stock &amp; MOQ</th>
                        <th className="py-2.5 px-3 text-center">Order Quantity</th>
                        <th className="py-2.5 px-4 text-right">Estimated Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredModalItems.map((item) => {
                        const isSelected = !!selectedItemIds[item.id];
                        const currentQty = quantities[item.id] || Number(item.minOrderQty) || 1;
                        const min = Number(item.minOrderQty) || 1;
                        const lineTotalRupees = (currentQty * item.priceRupees).toFixed(2);
                        const hasSavings = item.savingsPercent && item.savingsPercent > 0;

                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              isSelected ? "bg-red-50/30" : "hover:bg-zinc-50/80"
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(item.id, min)}
                                className="rounded border-zinc-300 text-[#D3232A] focus:ring-[#D3232A] cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-xs text-zinc-900 block">
                                {item.name}
                              </span>
                              {item.sku && (
                                <span className="text-[10px] font-mono text-zinc-400 block">
                                  SKU: {item.sku}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                                {item.category || "General"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-xs text-zinc-900 tabular-nums">
                              ₹{item.priceRupees.toFixed(2)}
                              <span className="text-[10px] text-zinc-400 font-normal block">
                                / {item.unit}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {hasSavings ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                                    <TrendingDown className="h-3 w-3 shrink-0" />
                                    <span>Save {item.savingsPercent}%</span>
                                  </span>
                                  <span className="text-[9px] text-emerald-600 block mt-0.5">
                                    vs your menu cost ₹{item.currentCostRupees?.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-400">
                                  Wholesale Direct
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`text-[10px] font-bold ${item.inStock ? "text-emerald-700" : "text-zinc-500"}`}>
                                {item.inStock ? "● In Stock" : "Pre-order"}
                              </span>
                              <span className="text-[10px] text-zinc-400 block mt-0.5">
                                Min: {item.minOrderQty} {item.unit}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex items-center border border-zinc-200 rounded-lg bg-white overflow-hidden shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isSelected) toggleSelect(item.id, min);
                                    updateQuantity(item.id, currentQty - 1, min);
                                  }}
                                  disabled={currentQty <= min}
                                  className="px-2 py-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 active:scale-95 transition-all"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min={min}
                                  step="any"
                                  value={currentQty}
                                  onChange={(e) => {
                                    if (!isSelected) toggleSelect(item.id, min);
                                    updateQuantity(item.id, Number(e.target.value) || min, min);
                                  }}
                                  className="w-12 text-center text-xs font-bold text-zinc-900 border-x border-zinc-200 py-1 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isSelected) toggleSelect(item.id, min);
                                    updateQuantity(item.id, currentQty + 1, min);
                                  }}
                                  className="px-2 py-1 text-zinc-500 hover:bg-zinc-100 active:scale-95 transition-all"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                              <span className="text-[10px] text-zinc-400 block mt-0.5">
                                {item.unit}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-extrabold text-xs text-zinc-900 tabular-nums">
                              ₹{lineTotalRupees}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                );
              })()}
            </div>

            {/* Modal Sticky Bottom Order Dock */}
            <div className="p-4 border-t border-zinc-200/80 bg-zinc-50/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-zinc-900">
                      {activeVendorOrderMetrics.count} {activeVendorOrderMetrics.count === 1 ? "Material" : "Materials"} Selected
                    </span>
                    <span className="text-xs text-zinc-400">· Subtotal:</span>
                    <span className="font-black text-sm text-emerald-700 tabular-nums">
                      ₹{activeVendorOrderMetrics.subtotalRupees}
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500 block">
                    Ordering directly from {activeVendor.supplier.name} with {activeVendor.fastestLeadTimeHours}h SLA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setActiveVendor(null)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handlePlaceOrderForActiveVendor}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white text-xs font-extrabold shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  <span>Create Purchase Order with {activeVendor.supplier.name} →</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
