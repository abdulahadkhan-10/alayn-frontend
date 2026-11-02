"use client";

import React, { useState, useMemo, useEffect } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Search,
  Clock,
  Store,
  Plus,
  Minus,
  ShoppingCart,
  RotateCcw,
  TrendingDown,
  X,
  BadgeCheck,
  Truck,
  Phone,
  MapPin,
  ArrowRight,
  User,
  Loader2,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import {
  useGetMarketplaceSuppliersQuery,
  useGetMarketplaceSupplierItemsQuery,
  SupplierItemApi,
  MarketplaceSort,
  MarketplaceSupplierRow,
} from "@/redux/slices/supplierApiSlice";
import { InventoryItemApi } from "@/redux/slices/inventoryApiSlice";
import QuantityInput from "./QuantityInput";

export interface MarketplaceSupplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  deliveryTerms?: string;
}

interface Props {
  inventoryItems?: InventoryItemApi[];
  onOrderPO?: (
    supplier: MarketplaceSupplier,
    items: SupplierItemApi[],
    initialQuantities?: Record<string, number>
  ) => void;
}

const MAX_MATCHES_SHOWN = 2;
const SEARCH_DEBOUNCE_MS = 300;

function formatRupees(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function minQtyOf(item: SupplierItemApi): number {
  return Number(item.minOrderQty) || 1;
}

function toMarketplaceSupplier(s: MarketplaceSupplierRow["supplier"]): MarketplaceSupplier {
  return {
    id: s.id,
    name: s.name,
    contactPerson: s.contactPerson || undefined,
    phone: s.phone || undefined,
    email: s.email || undefined,
    address: s.address || undefined,
    deliveryTerms: s.deliveryTerms || undefined,
  };
}

/**
 * How much cheaper a supplier's price is than what the restaurant pays now,
 * matching its own stock items by name. null when there is nothing to compare.
 */
function savingsAgainstStock(
  item: { name: string; pricePaise: number },
  inventoryItems: InventoryItemApi[]
): { percent: number; currentCostPaise: number } | null {
  const supName = item.name.toLowerCase().trim();
  const match = inventoryItems.find((inv) => {
    const invName = inv.name.toLowerCase().trim();
    return invName === supName || invName.includes(supName) || supName.includes(invName);
  });
  if (!match || match.unitCostPaise <= 0) return null;
  const percent = Math.round(((match.unitCostPaise - item.pricePaise) / match.unitCostPaise) * 100);
  return percent > 0 ? { percent, currentCostPaise: match.unitCostPaise } : null;
}

export default function SupplierMarketplaceSection({
  inventoryItems = [],
  onOrderPO,
}: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<MarketplaceSort>("BEST");

  // Selected items (item id -> supplier id) and their quantities
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Supplier whose catalog is open in the order dialog
  const [activeRow, setActiveRow] = useState<MarketplaceSupplierRow | null>(null);
  const [catalogCategory, setCatalogCategory] = useState("All");
  const [catalogSearch, setCatalogSearch] = useState("");

  // Only hit the server once the user pauses typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  // "Show more" page counter; starts over whenever the filters change
  const filterKey = `${debouncedSearch}|${selectedCategory}|${sortBy}`;
  const [paging, setPaging] = useState({ key: filterKey, page: 1 });
  const page = paging.key === filterKey ? paging.page : 1;

  const { data, isLoading, isFetching, isError, refetch } = useGetMarketplaceSuppliersQuery({
    search: debouncedSearch || undefined,
    category: selectedCategory,
    sort: sortBy,
    page,
  });

  const rows = useMemo(() => data?.suppliers ?? [], [data]);
  const isSearching = !!debouncedSearch;
  const isTyping = search.trim() !== debouncedSearch;

  // Category tabs come with page 1 and are kept while other filters load
  const [tabsSource, setTabsSource] = useState<{ categories: { name: string; supplierCount: number }[]; total: number } | null>(null);
  if (data?.categories && data.totalSuppliers !== undefined && tabsSource?.categories !== data.categories) {
    setTabsSource({ categories: data.categories, total: data.totalSuppliers });
  }
  const categoryTabs = tabsSource
    ? [
        { id: "All", label: "All", count: tabsSource.total },
        ...tabsSource.categories.map((c) => ({ id: c.name, label: c.name, count: c.supplierCount })),
      ]
    : [];

  // ---------- Order dialog ----------
  const { data: catalogData, isFetching: catalogLoading } = useGetMarketplaceSupplierItemsQuery(
    activeRow ? activeRow.supplier.id : skipToken
  );
  const catalog = useMemo(() => (activeRow ? catalogData ?? [] : []), [activeRow, catalogData]);
  const catalogCategories = useMemo(
    () => Array.from(new Set(catalog.map((i) => i.category || "General"))).sort(),
    [catalog]
  );

  const catalogItems = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return catalog.filter(
      (item) =>
        (catalogCategory === "All" || item.category.toLowerCase() === catalogCategory.toLowerCase()) &&
        (!q || item.name.toLowerCase().includes(q))
    );
  }, [catalog, catalogCategory, catalogSearch]);

  const selectItem = (item: SupplierItemApi, on: boolean) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (on) next[item.id] = item.supplierId;
      else delete next[item.id];
      return next;
    });
    if (on) {
      setQuantities((prev) => (prev[item.id] ? prev : { ...prev, [item.id]: minQtyOf(item) }));
    }
  };

  // While typing the value isn't clamped (the field clamps to the minimum on blur)
  const setItemQuantity = (item: SupplierItemApi, value: number, { clamp = true } = {}) => {
    const rounded = Math.round(value * 1000) / 1000;
    const safe = clamp ? Math.max(minQtyOf(item), rounded) : rounded;
    setSelected((prev) => ({ ...prev, [item.id]: item.supplierId }));
    setQuantities((prev) => ({ ...prev, [item.id]: safe }));
  };

  const qtyOf = (item: SupplierItemApi) => quantities[item.id] ?? minQtyOf(item);

  const allVisibleSelected = catalogItems.length > 0 && catalogItems.every((i) => selected[i.id]);

  const toggleAllVisible = () => {
    const on = !allVisibleSelected;
    setSelected((prev) => {
      const next = { ...prev };
      catalogItems.forEach((i) => {
        if (on) next[i.id] = i.supplierId;
        else delete next[i.id];
      });
      return next;
    });
    if (on) {
      setQuantities((prev) => {
        const next = { ...prev };
        catalogItems.forEach((i) => {
          if (!next[i.id]) next[i.id] = minQtyOf(i);
        });
        return next;
      });
    }
  };

  const orderSummary = useMemo(() => {
    const items = catalog.filter((i) => selected[i.id]);
    const totalPaise = items.reduce(
      (sum, i) => sum + Math.round((quantities[i.id] ?? minQtyOf(i)) * i.pricePaise),
      0
    );
    return { items, totalRupees: totalPaise / 100 };
  }, [catalog, selected, quantities]);

  const selectedCountFor = (supplierId: string) =>
    Object.values(selected).filter((s) => s === supplierId).length;

  const openCatalog = (row: MarketplaceSupplierRow) => {
    setActiveRow(row);
    // Carry the current search/category into the dialog when it narrows things down
    setCatalogCategory(selectedCategory);
    setCatalogSearch(row.matchedCount > 0 ? debouncedSearch : "");
  };

  const closeCatalog = () => setActiveRow(null);

  const placeOrder = () => {
    if (!activeRow || orderSummary.items.length === 0) return;
    const qtys: Record<string, number> = {};
    orderSummary.items.forEach((i) => (qtys[i.id] = qtyOf(i)));
    onOrderPO?.(toMarketplaceSupplier(activeRow.supplier), orderSummary.items, qtys);
    // Clear this supplier's selection once the PO is handed off
    const supplierId = activeRow.supplier.id;
    setSelected((prev) => Object.fromEntries(Object.entries(prev).filter(([, s]) => s !== supplierId)));
    closeCatalog();
  };

  // Close the dialog on Escape
  useEffect(() => {
    if (!activeRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveRow(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeRow]);

  const resetFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedCategory("All");
  };

  const total = data?.total ?? 0;
  const marketplaceEmpty = tabsSource?.total === 0;
  // A new search/category/sort shows its first page; until it arrives, dim the old list
  const showingStale = isFetching && page === 1 && !isLoading;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search, sort and category filter */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="search"
              aria-label="Search suppliers and products"
              placeholder="Search a product or supplier — e.g. chicken, paneer, milk"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A] transition-colors [&::-webkit-search-cancel-button]:hidden"
            />
            {(isTyping || (showingStale && isSearching)) ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
            ) : (
              search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )
            )}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MarketplaceSort)}
            aria-label="Sort suppliers"
            className="h-11 shrink-0 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
          >
            <option value="BEST">Sort: Best match</option>
            <option value="PRICE">Sort: Lowest price</option>
            <option value="DELIVERY">Sort: Fastest delivery</option>
            <option value="NAME">Sort: Name A–Z</option>
          </select>
        </div>

        {categoryTabs.length > 2 && (
          <div
            role="tablist"
            aria-label="Filter by category"
            className="flex items-center gap-1.5 overflow-x-auto px-3 sm:px-4 pb-3 scrollbar-none"
          >
            {categoryTabs.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  {cat.label}
                  <span className={`tabular-nums text-[11px] ${isActive ? "text-white/70" : "text-zinc-400"}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Supplier list */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton height={64} borderRadius={12} count={6} className="mb-2" />
        </div>
      ) : isError && rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-2xl border border-zinc-200 bg-white">
          <h3 className="text-sm font-semibold text-zinc-900">Couldn’t load suppliers</h3>
          <p className="text-xs text-zinc-500 mt-1.5">Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 h-9 px-4 mt-4 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-zinc-300 bg-white">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
            <Store className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-900">
            {marketplaceEmpty
              ? "No suppliers are listed yet"
              : isSearching
              ? `No suppliers match “${debouncedSearch}”`
              : `No suppliers in ${selectedCategory}`}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mt-1.5 leading-relaxed">
            {marketplaceEmpty
              ? "Once wholesalers list their products on Alayn, their rates will show up here."
              : "Try a different product name, or clear the filters to see every supplier."}
          </p>
          {!marketplaceEmpty && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 h-9 px-4 mt-4 rounded-xl text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${showingStale ? "opacity-60" : ""}`}>
          <ul className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs divide-y divide-zinc-100 overflow-hidden">
            {rows.map((row) => {
              const { supplier } = row;
              const selectedCount = selectedCountFor(supplier.id);
              const shownMatches = row.matchedItems.slice(0, MAX_MATCHES_SHOWN);
              const extraMatches = row.matchedCount - shownMatches.length;
              const location = supplier.address?.split(",")[0]?.trim();
              const bestSaving = shownMatches
                .map((m) => savingsAgainstStock(m, inventoryItems))
                .find((s) => s !== null);

              return (
                <li
                  key={supplier.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-zinc-50/70 transition-colors"
                >
                  {/* Who */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      aria-hidden
                      className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-xs font-semibold shrink-0"
                    >
                      {initialsOf(supplier.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => openCatalog(row)}
                          className="text-sm font-semibold text-zinc-900 hover:text-[#D3232A] transition-colors text-left truncate"
                        >
                          {supplier.name}
                        </button>
                        <span title="Verified wholesaler" className="inline-flex shrink-0">
                          <BadgeCheck className="h-4 w-4 text-emerald-600" aria-label="Verified wholesaler" />
                        </span>
                      </div>

                      {shownMatches.length > 0 ? (
                        // Searching for a product: show this supplier's price for it
                        <p className="text-xs text-zinc-600 mt-0.5 truncate">
                          {shownMatches.map((item, idx) => (
                            <span key={item.id}>
                              {idx > 0 && <span className="text-zinc-300"> · </span>}
                              {item.name}{" "}
                              <span className="font-semibold text-zinc-900 tabular-nums">
                                ₹{formatRupees(item.pricePaise / 100)}
                              </span>
                              <span className="text-zinc-400">/{item.unit}</span>
                            </span>
                          ))}
                          {extraMatches > 0 && <span className="text-zinc-400"> · +{extraMatches} more</span>}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 mt-0.5 truncate">
                          {row.categories.join(", ")} · {row.totalItems} {row.totalItems === 1 ? "product" : "products"}
                          {location && (
                            <>
                              <span className="text-zinc-300"> · </span>
                              <MapPin className="inline h-3 w-3 -mt-0.5 text-zinc-400" /> {location}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Key facts + action */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 shrink-0 pl-[52px] sm:pl-0">
                    {bestSaving && (
                      <span
                        className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md"
                        title={`You pay ₹${formatRupees(bestSaving.currentCostPaise / 100)} now`}
                      >
                        <TrendingDown className="h-3 w-3" />
                        {bestSaving.percent}% cheaper
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-600 whitespace-nowrap" title="Fastest delivery">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {row.fastestLeadTimeHours}h
                    </span>
                    <div className="text-right w-20">
                      <span className="block text-[10px] text-zinc-400 leading-tight">from</span>
                      <span className="text-sm font-semibold text-zinc-900 tabular-nums">
                        ₹{formatRupees(row.minPricePaise / 100)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openCatalog(row)}
                      className={`inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold whitespace-nowrap active:scale-[0.98] transition-colors ${
                        selectedCount > 0
                          ? "bg-[#D3232A] hover:bg-[#b01e23] text-white"
                          : "bg-zinc-900 hover:bg-zinc-700 text-white"
                      }`}
                    >
                      {selectedCount > 0 ? `Review (${selectedCount})` : "Order"}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col items-center gap-2 py-1">
            <p className="text-xs text-zinc-500" aria-live="polite">
              Showing {rows.length} of {total} {total === 1 ? "supplier" : "suppliers"}
            </p>
            {data?.hasMore && (
              <button
                type="button"
                disabled={isFetching}
                onClick={() => setPaging({ key: filterKey, page: page + 1 })}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 transition-colors"
              >
                {isFetching && page > 1 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Show more suppliers
              </button>
            )}
          </div>
        </div>
      )}

      {/* Catalog & order dialog */}
      {activeRow && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeCatalog();
          }}
        >
          <div
            className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-dialog-title"
          >
            {/* Header */}
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-zinc-100 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  aria-hidden
                  className="w-11 h-11 rounded-xl bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold shrink-0"
                >
                  {initialsOf(activeRow.supplier.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 id="catalog-dialog-title" className="text-lg font-semibold text-zinc-900 tracking-tight truncate">
                      {activeRow.supplier.name}
                    </h2>
                    <BadgeCheck className="h-4 w-4 text-emerald-600 shrink-0" aria-label="Verified wholesaler" />
                  </div>
                  <div className="flex items-center gap-x-4 gap-y-1 text-xs text-zinc-500 mt-1 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      Delivers in {activeRow.fastestLeadTimeHours}h
                    </span>
                    {activeRow.supplier.address && (
                      <span className="inline-flex items-center gap-1 min-w-0" title={activeRow.supplier.address}>
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[220px]">{activeRow.supplier.address}</span>
                      </span>
                    )}
                    {activeRow.supplier.contactPerson && (
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        {activeRow.supplier.contactPerson}
                      </span>
                    )}
                    {activeRow.supplier.phone && (
                      <a
                        href={`tel:${activeRow.supplier.phone}`}
                        className="inline-flex items-center gap-1 hover:text-zinc-900 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 text-zinc-400" />
                        {activeRow.supplier.phone}
                      </a>
                    )}
                    {activeRow.supplier.deliveryTerms && (
                      <span className="inline-flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5 text-zinc-400" />
                        {activeRow.supplier.deliveryTerms}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={closeCatalog}
                aria-label="Close"
                title="Close (Esc)"
                className="h-9 w-9 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="px-5 sm:px-6 py-3 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="search"
                  aria-label="Search this supplier's products"
                  placeholder={`Search ${activeRow.totalItems} products`}
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
                />
              </div>
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                {catalogCategories.length > 1 && (
                  <select
                    value={catalogCategory}
                    onChange={(e) => setCatalogCategory(e.target.value)}
                    aria-label="Category"
                    className="h-9 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg px-2.5 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                  >
                    <option value="All">All categories</option>
                    {catalogCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
                {catalogItems.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllVisible}
                    className="h-9 px-3 rounded-lg text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors whitespace-nowrap"
                  >
                    {allVisibleSelected ? "Clear selection" : "Select all"}
                  </button>
                )}
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto">
              {catalogLoading && catalog.length === 0 ? (
                <div className="p-5 space-y-2">
                  <Skeleton height={48} borderRadius={10} count={5} className="mb-2" />
                </div>
              ) : catalogItems.length === 0 ? (
                <div className="py-14 text-center text-sm text-zinc-500">
                  No products match your search.
                  {(catalogSearch || catalogCategory !== "All") && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSearch("");
                        setCatalogCategory("All");
                      }}
                      className="block mx-auto mt-2 text-xs font-semibold text-zinc-700 underline"
                    >
                      Show all products
                    </button>
                  )}
                </div>
              ) : (
                <ul className="divide-y divide-zinc-100">
                  {catalogItems.map((item) => {
                    const isSelected = !!selected[item.id];
                    const qty = qtyOf(item);
                    const min = minQtyOf(item);
                    const saving = savingsAgainstStock(item, inventoryItems);
                    const checkboxId = `mkt-item-${item.id}`;

                    return (
                      <li
                        key={item.id}
                        className={`flex items-center gap-3 px-5 sm:px-6 py-3 transition-colors ${
                          isSelected ? "bg-red-50/40" : "hover:bg-zinc-50"
                        }`}
                      >
                        <input
                          id={checkboxId}
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => selectItem(item, e.target.checked)}
                          className="h-4 w-4 rounded border-zinc-300 text-[#D3232A] focus:ring-[#D3232A] cursor-pointer shrink-0"
                        />

                        <label htmlFor={checkboxId} className="flex-1 min-w-0 cursor-pointer">
                          <span className="block text-sm font-medium text-zinc-900 truncate">{item.name}</span>
                          <span className="flex items-center gap-x-2 gap-y-0.5 flex-wrap mt-0.5 text-[11px] text-zinc-500">
                            <span className="tabular-nums">
                              <span className="font-semibold text-zinc-800">₹{formatRupees(item.pricePaise / 100)}</span>/{item.unit}
                            </span>
                            <span aria-hidden>·</span>
                            <span>
                              Min {Number(item.minOrderQty)} {item.unit}
                            </span>
                            {!item.inStock && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="text-amber-700 font-medium">Pre-order</span>
                              </>
                            )}
                            {saving && (
                              <span
                                className="inline-flex items-center gap-0.5 font-semibold text-emerald-700"
                                title={`You currently pay ₹${formatRupees(saving.currentCostPaise / 100)}/${item.unit}`}
                              >
                                <TrendingDown className="h-3 w-3" />
                                {saving.percent}% cheaper than now
                              </span>
                            )}
                          </span>
                        </label>

                        {/* Quantity stepper */}
                        <div className="inline-flex items-center h-9 border border-zinc-200 rounded-lg bg-white overflow-hidden shrink-0">
                          <button
                            type="button"
                            aria-label={`Decrease ${item.name}`}
                            onClick={() => setItemQuantity(item, qty - 1)}
                            disabled={!isSelected || qty <= min}
                            className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <QuantityInput
                            aria-label={`${item.name} quantity in ${item.unit}`}
                            min={min}
                            value={qty}
                            onChange={(n) => setItemQuantity(item, n, { clamp: false })}
                            className="w-12 h-full text-center text-sm font-semibold text-zinc-900 border-x border-zinc-200 focus:outline-none focus:bg-zinc-50"
                          />
                          <button
                            type="button"
                            aria-label={`Increase ${item.name}`}
                            onClick={() => setItemQuantity(item, isSelected ? qty + 1 : qty)}
                            className="w-8 h-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <span
                          className={`hidden sm:block w-24 text-right text-sm tabular-nums shrink-0 ${
                            isSelected ? "font-semibold text-zinc-900" : "text-zinc-300"
                          }`}
                        >
                          ₹{formatRupees(Math.round(qty * item.pricePaise) / 100)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Order footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-zinc-200/80 bg-zinc-50 flex items-center justify-between gap-4">
              <div className="min-w-0">
                {orderSummary.items.length > 0 ? (
                  <>
                    <span className="block text-xs text-zinc-500">
                      {orderSummary.items.length} {orderSummary.items.length === 1 ? "item" : "items"} selected
                    </span>
                    <span className="block text-lg font-semibold text-zinc-900 tabular-nums">
                      ₹{formatRupees(orderSummary.totalRupees)}
                    </span>
                  </>
                ) : (
                  <span className="text-sm text-zinc-500">Tick products or press + to add them</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={closeCatalog}
                  className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl text-sm font-semibold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={orderSummary.items.length === 0}
                  className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white text-sm font-semibold active:scale-[0.98] transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Create purchase order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
