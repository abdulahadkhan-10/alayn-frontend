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

  const { data: alertsData } = useGetLowStockAlertsQuery(undefined, {
    skip: !activeBranch,
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LOW_STOCK" | "HEALTHY">("ALL");

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
        (statusFilter === "LOW_STOCK" && isLow) ||
        (statusFilter === "HEALTHY" && !isLow);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, categoryFilter, statusFilter]);

  const totalValue = items.reduce(
    (s, i) => s + (i.currentStock || 0) * (i.unitCostPaise / 100),
    0
  );
  const lowStockCount = lowStockItems.length;
  const isPageLoading = branchLoading || isLoadingItems;

  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-8">
        <InventoryNavTabs />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900">
              Stock Items — <span className="text-[#D3232A] font-bold">{activeBranch?.name || "Main Branch"}</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Track stock levels, min reorder alerts, and total inventory value
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lowStockItems.length > 0 && (
              <button
                id="smart-po-btn"
                onClick={() => setShowSmartPO(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-[#D3232A] px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:opacity-95 transition-opacity shadow-sm"
              >
                <Zap className="h-4 w-4 fill-current" /> Quick Restock Order ({lowStockItems.length} Low)
              </button>
            )}
            <button
              id="refresh-inventory-btn"
              onClick={() => refetch()}
              title="Refresh inventory"
              className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-xs"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              id="add-inventory-item-btn"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-3.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#b01e23] transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" /> Add New Item
            </button>
          </div>
        </div>

        {/* Low Stock Alert Status Banner */}
        {lowStockCount > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-xs sm:text-sm text-red-900 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              <div>
                <strong>{lowStockCount} Low Stock Item(s) Need Restocking:</strong> Current quantities are at or below minimum reorder levels.
              </div>
            </div>
            <button
              onClick={() => setStatusFilter("LOW_STOCK")}
              className="text-xs text-red-700 font-bold underline hover:text-red-900 whitespace-nowrap"
            >
              View Low Stock Only
            </button>
          </div>
        )}

        {/* Responsive KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {isPageLoading ? (
            <>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <Skeleton height={14} width="40%" className="mb-2" />
                <Skeleton height={28} width="30%" className="mb-1" />
                <Skeleton height={12} width="60%" />
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <Skeleton height={14} width="40%" className="mb-2" />
                <Skeleton height={28} width="30%" className="mb-1" />
                <Skeleton height={12} width="60%" />
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
                <Skeleton height={14} width="40%" className="mb-2" />
                <Skeleton height={28} width="30%" className="mb-1" />
                <Skeleton height={12} width="60%" />
              </div>
            </>
          ) : (
            <>
              <InventoryStatCard
                icon={<Package className="h-5 w-5" />}
                iconCls="bg-red-50 text-[#D3232A]"
                label="Total Stock Items"
                value={String(items.length)}
                sub={`${filteredItems.length} matching active filters`}
              />
              <InventoryStatCard
                icon={<AlertTriangle className="h-5 w-5" />}
                iconCls={lowStockCount > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}
                label="Low Stock Alert"
                value={String(lowStockCount)}
                pulse={lowStockCount > 0}
                sub={lowStockCount > 0 ? "Items below min reorder level" : "All stock levels healthy"}
              />
              <InventoryStatCard
                icon={<IndianRupee className="h-5 w-5" />}
                iconCls="bg-blue-50 text-blue-600"
                label="Total Inventory Value"
                value={`₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}
                sub="Calculated at unit cost price"
              />
            </>
          )}
        </div>

        {/* Responsive Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:px-4 sm:py-3 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              id="inventory-search"
              type="text"
              placeholder="Search item name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-1.5 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === "ALL" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("LOW_STOCK")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === "LOW_STOCK" ? "bg-red-600 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Low Stock ({lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("HEALTHY")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  statusFilter === "HEALTHY" ? "bg-emerald-600 text-white shadow-2xs" : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Healthy
              </button>
            </div>

            {branches.length > 1 && (
              <div className="flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs">
                <Building2 className="h-3.5 w-3.5 text-[#D3232A] shrink-0" />
                <select
                  id="inventory-outlet-filter"
                  value={activeBranch?.id || ""}
                  onChange={(e) => {
                    const selected = branches.find((b) => b.id === e.target.value) || null;
                    setActiveBranch(selected);
                  }}
                  className="bg-transparent text-xs font-semibold text-zinc-800 focus:outline-none cursor-pointer"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <select
              id="inventory-category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs sm:text-sm focus:border-[#D3232A] focus:outline-none bg-white font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All Categories" : c}
                </option>
              ))}
            </select>
            <button
              id="inventory-clear-filters-btn"
              onClick={() => {
                setSearch("");
                setCategoryFilter("All");
                setStatusFilter("ALL");
              }}
              title="Clear filters"
              className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-500 hover:bg-zinc-100 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stock Items Table */}
        <div className="w-full rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-x-auto min-w-0 h-fit mb-6">
          {isPageLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton height={24} width="30%" className="mb-4" />
              <Skeleton count={6} height={42} borderRadius={8} className="mb-2" />
            </div>
          ) : isItemsError ? (
            <div className="flex flex-col items-center justify-center gap-2 h-64">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
              <p className="text-sm font-medium text-zinc-700">Could not connect to backend server</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-[#D3232A] underline font-semibold hover:text-[#b01e23]"
              >
                Retry
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 h-64 text-zinc-400">
              <Package className="h-9 w-9 text-zinc-300" />
              <p className="text-sm font-medium text-zinc-600">No stock items match your search</p>
              <p className="text-xs text-zinc-400">Try adjusting search keywords or filters.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[#D3232A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#b01e23]"
              >
                <Plus className="h-3.5 w-3.5" /> Add New Item
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <InventoryItemTable
                items={filteredItems as any}
                onAdjust={setAdjustTarget}
                onOrder={() => setShowSmartPO(true)}
                canManage={true}
                isAllOutlets={activeBranch?.id === "all"}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
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

      {/* Adjust Stock Modal */}
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

      {/* Quick Restock Order Modal */}
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
