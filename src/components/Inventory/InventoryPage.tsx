"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";

import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  RotateCcw,
  IndianRupee,
  Building2,
  Loader2,
  RefreshCw,
  Zap,
  Truck,
  Trash2,
  Filter,
} from "lucide-react";

import Skeleton from "react-loading-skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import {
  useGetItemsQuery,
  useGetLowStockAlertsQuery,
  InventoryItemApi,
} from "@/redux/slices/inventoryApiSlice";

import InventoryNavTabs   from "./InventoryNavTabs";
import InventoryStatCard  from "./InventoryStatCard";
import InventoryItemTable from "./InventoryItemTable";
import AddItemModal       from "./AddItemModal";
import AdjustStockModal   from "./AdjustStockModal";
import SmartPOModal       from "./SmartPOModal";

export default function InventoryPage() {
  const { activeBranch, branches, setActiveBranch, loading: branchLoading } = useBranch();

  // Production RTK Query hooks
  const {
    data: itemsResponse,
    isLoading: isLoadingItems,
    isError: isItemsError,
    refetch,
  } = useGetItemsQuery(undefined, { skip: !activeBranch });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LOW_STOCK">("ALL");

  const [showAdd, setShowAdd] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<any | null>(null);
  const [showSmartPO, setShowSmartPO] = useState(false);

  const items: InventoryItemApi[] = useMemo(() => {
    return itemsResponse?.items || [];
  }, [itemsResponse]);

  const lowStockItems = useMemo(() => {
    return items.filter((i) => (i.currentStock || 0) <= i.reorderThreshold);
  }, [items]);

  // Categories list
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((i) => i.category))).sort()],
    [items]
  );

  // Filtered items
  const filteredItems = useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((item) => {
      const matchesSearch = !q || item.name.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const isLow = (item.currentStock || 0) <= item.reorderThreshold;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "LOW_STOCK" && isLow);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const lowStockCount = lowStockItems.length;
  const isPageLoading = branchLoading || isLoadingItems;

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full gap-5 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10">
        <InventoryNavTabs />

        {/* Clean Header: Inventory & Add Item */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
            Inventory
          </h1>
          <button
            id="add-inventory-item-btn"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D3232A] px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-[#b01e23] transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>

        {/* Search & Simple Filters Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              id="inventory-search"
              type="text"
              placeholder="Search inventory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 py-2 text-xs sm:text-sm focus:border-zinc-900 focus:outline-none transition-all font-medium"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Status Filter: All / Low Stock */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === "ALL" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("LOW_STOCK")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  statusFilter === "LOW_STOCK" ? "bg-amber-500 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Low Stock ({lowStockCount})
              </button>
            </div>

            {/* Category Filter Dropdown */}
            <select
              id="inventory-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-xs sm:text-sm focus:border-zinc-900 focus:outline-none bg-white font-semibold text-zinc-800 cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Actionable Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs sm:text-sm text-amber-950 flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
              <p className="font-bold">
                {lowStockCount} {lowStockCount === 1 ? "item is" : "items are"} running low
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setStatusFilter("LOW_STOCK")}
                className="text-xs text-amber-900 font-bold underline hover:text-amber-950 whitespace-nowrap"
              >
                View items
              </button>
              <button
                onClick={() => setShowSmartPO(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs"
              >
                <Zap className="h-3.5 w-3.5 fill-current" /> Restock
              </button>
            </div>
          </div>
        )}

        {/* Main Inventory Table */}
        <div className="w-full rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden min-w-0">
          {isPageLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton height={24} width="30%" className="mb-4" />
              <Skeleton count={6} height={42} borderRadius={8} className="mb-2" />
            </div>
          ) : isItemsError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
              <p className="text-sm font-bold text-zinc-700">Unable to load inventory from server</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-[#D3232A] underline font-bold hover:text-[#b01e23]"
              >
                Try Again
              </button>
            </div>
          ) : (
            <InventoryItemTable
              items={filteredItems as any}
              onAdjust={setAdjustTarget}
              canManage={true}
              isAllOutlets={activeBranch?.id === "all"}
              onClearFilters={() => {
                setSearch("");
                setCategoryFilter("All");
                setStatusFilter("ALL");
              }}
            />
          )}
        </div>
      </div>

      {/* Add Inventory Item Modal */}
      {showAdd && activeBranch && (
        <Overlay onClose={() => setShowAdd(false)}>
          <AddItemModal
            outletId={activeBranch.id}
            onCreated={() => {
              setShowAdd(false);
              refetch();
            }}
            onClose={() => setShowAdd(false)}
            isDemo={false}
          />
        </Overlay>
      )}

      {/* Update Stock Modal */}
      {adjustTarget && activeBranch && (
        <Overlay onClose={() => setAdjustTarget(null)}>
          <AdjustStockModal
            outletId={activeBranch.id}
            item={adjustTarget}
            onAdjusted={() => {
              setAdjustTarget(null);
              refetch();
            }}
            onClose={() => setAdjustTarget(null)}
          />
        </Overlay>
      )}

      {/* Restock Order Modal */}
      {showSmartPO && activeBranch && (
        <Overlay onClose={() => setShowSmartPO(false)}>
          <SmartPOModal
            outletId={activeBranch.id}
            lowStockItems={lowStockItems}
            allItems={items}
            onClose={() => setShowSmartPO(false)}
            onSuccess={() => {
              setShowSmartPO(false);
              refetch();
            }}
          />
        </Overlay>
      )}
    </DashboardLayout>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

