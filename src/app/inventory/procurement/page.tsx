"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InventoryNavTabs from "@/components/Inventory/InventoryNavTabs";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useReceivePOItemMutation,
  SupplierApi,
  PurchaseOrderApi,
} from "@/redux/slices/procurementApiSlice";
import { useGetItemsQuery } from "@/redux/slices/inventoryApiSlice";
import {
  Truck,
  Plus,
  Building2,
  PackageCheck,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Zap,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  IndianRupee,
  Phone,
  Mail,
  RotateCcw,
  Eye,
  User,
  MapPin,
  Pencil,
  LayoutGrid,
  List,
  ShoppingCart,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import SmartPOModal from "@/components/Inventory/SmartPOModal";
import CreatePurchaseOrderModal from "@/components/Inventory/CreatePurchaseOrderModal";

// Helper for timestamped batch numbers: e.g. BCH-20260727-1237-483
function generateTimestampBatchNo(category?: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const prefix = category ? category.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 3) : "BCH";
  const rand = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${yyyy}${mm}${dd}-${hh}${min}-${rand}`;
}

// Helper for short, clean order numbers fetched from backend or generated compactly: e.g. PO-5F4591
function formatUnderstandableOrderNo(po: { id: string; poNumber?: string; createdAt?: string }): string {
  if (po.poNumber) return po.poNumber;
  const shortHash = po.id.slice(-6).toUpperCase();
  return `PO-${shortHash}`;
}

export default function ProcurementPage() {
  const { activeBranch, loading: branchLoading } = useBranch();
  const user = useAppSelector((state) => state.auth.user);
  const canManageVendors = !user || user.role === "BUSINESS_OWNER" || user.role === "MANAGER" || user.role === "SUPER_ADMIN";

  const searchParams = useSearchParams();
  const tabParam = searchParams?.get("tab");

  const [activeTab, setActiveTab] = useState<"POS" | "SUPPLIERS">("POS");
  const [supplierViewMode, setSupplierViewMode] = useState<"TABLE" | "CARDS">("TABLE");

  useEffect(() => {
    if (tabParam === "suppliers") {
      setActiveTab("SUPPLIERS");
    }
  }, [tabParam]);

  // RTK Queries
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useGetSuppliersQuery(undefined, { skip: !activeBranch });
  const { data: purchaseOrders = [], isLoading: isLoadingPOs, refetch: refetchPOs } = useGetPurchaseOrdersQuery(undefined, { skip: !activeBranch });
  const { data: inventoryData } = useGetItemsQuery(undefined, { skip: !activeBranch });
  const items = inventoryData?.items || [];

  // Mutations
  const [createSupplier, { isLoading: isCreatingSupplier }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdatingSupplier }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeletingSupplier }] = useDeleteSupplierMutation();
  const [receivePOItem, { isLoading: isReceiving }] = useReceivePOItemMutation();

  // Modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierApi | null>(null);
  const [showSmartPOModal, setShowSmartPOModal] = useState(false);
  const [showCreateCustomPOModal, setShowCreateCustomPOModal] = useState(false);
  const [prefilledSupplierId, setPrefilledSupplierId] = useState<string | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrderApi | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierApi | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierApi | null>(null);

  // Search, Status Filter, Category, Type & Outlet Filter states
  const [poSearchQuery, setPoSearchQuery] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("ALL");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [selectedSupplierCategoryFilter, setSelectedSupplierCategoryFilter] = useState("ALL");
  const [selectedSupplierTypeFilter, setSelectedSupplierTypeFilter] = useState<"ALL" | "ONLINE" | "OFFLINE">("ALL");
  const [procurementOutletFilter, setProcurementOutletFilter] = useState("ALL");

  // Pagination states
  const [poPage, setPoPage] = useState(1);
  const [poPageSize, setPoPageSize] = useState(10);
  const [supPage, setSupPage] = useState(1);
  const [supPageSize, setSupPageSize] = useState(6);

  const isAllOutlets = activeBranch?.id === "all";

  const lowStockItems = useMemo(() => {
    return items.filter((i) => (i.currentStock || 0) <= i.reorderThreshold);
  }, [items]);

  const availableOutlets = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((s) => {
      if (s.outlet) map.set(s.outlet.id, s.outlet.name);
    });
    purchaseOrders.forEach((po) => {
      if (po.supplier) map.set(po.supplier.id, po.supplier.name);
      if (po.outlet) map.set(po.outlet.id, po.outlet.name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [suppliers, purchaseOrders]);

  // Calculated PO Metrics
  const activePOCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "SENT" || po.status === "PARTIALLY_RECEIVED").length;
  }, [purchaseOrders]);

  const totalSpendRupees = useMemo(() => {
    const totalPaise = purchaseOrders.reduce((acc, po) => acc + (po.totalAmountPaise || 0), 0);
    return (totalPaise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }, [purchaseOrders]);

  // Filtered Purchase Orders
  const finalFilteredPOs = useMemo(() => {
    let result = [...purchaseOrders];

    if (isAllOutlets && procurementOutletFilter !== "ALL") {
      result = result.filter(
        (po) =>
          po.supplier?.id === procurementOutletFilter ||
          po.outletId === procurementOutletFilter ||
          po.outlet?.id === procurementOutletFilter
      );
    }

    if (poSearchQuery.trim()) {
      const q = poSearchQuery.toLowerCase().trim();
      result = result.filter(
        (po) =>
          po.id.toLowerCase().includes(q) ||
          po.actualSupplier?.name.toLowerCase().includes(q) ||
          po.supplier?.name.toLowerCase().includes(q)
      );
    }

    if (poStatusFilter !== "ALL") {
      result = result.filter((po) => po.status === poStatusFilter);
    }

    return result;
  }, [purchaseOrders, isAllOutlets, procurementOutletFilter, poSearchQuery, poStatusFilter]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = supplierSearchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.user?.name && s.user.name.toLowerCase().includes(q)) ||
        (s.user?.email && s.user.email.toLowerCase().includes(q));

      const matchesCategory =
        selectedSupplierCategoryFilter === "ALL" ||
        (s.category && s.category.toLowerCase().trim() === selectedSupplierCategoryFilter.toLowerCase().trim());

      const matchesType =
        selectedSupplierTypeFilter === "ALL" ||
        (s.type || "OFFLINE") === selectedSupplierTypeFilter;

      const matchesOutlet = isAllOutlets
        ? (procurementOutletFilter === "ALL" || s.outlet?.id === procurementOutletFilter || s.outletId === procurementOutletFilter)
        : (!s.outletId || s.outletId === activeBranch?.id || s.outlet?.id === activeBranch?.id);

      return matchesSearch && matchesCategory && matchesType && matchesOutlet;
    });
  }, [suppliers, supplierSearchQuery, selectedSupplierCategoryFilter, selectedSupplierTypeFilter, isAllOutlets, activeBranch, procurementOutletFilter]);

  // Form states
  const [supplierForm, setSupplierForm] = useState<{
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    category: string;
    type: "ONLINE" | "OFFLINE";
    password?: string;
  }>({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    category: "Dairy",
    type: "OFFLINE",
    password: "",
  });

  const [receiveItemInputs, setReceiveItemInputs] = useState<{
    [itemId: string]: {
      receivedQuantity: number;
      damagedQuantity: number;
      batchNumber: string;
      expiryDate: string;
    };
  }>({});

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createSupplier(supplierForm).unwrap();
      setShowAddSupplierModal(false);
      setSupplierForm({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        address: "",
        category: "Dairy",
        type: "OFFLINE",
        password: "",
      });

      if (res?.initialPassword) {
        alert(
          `ONLINE Supplier registered successfully!\n\nLogin Email: ${res.email}\nTemporary Password: ${res.initialPassword}\n\nPlease share these credentials with the vendor.`
        );
      }
    } catch (err: any) {
      alert(err?.data?.message || "Failed to create supplier");
    }
  };

  const handleDeleteSupplierConfirm = async () => {
    if (!deletingSupplier) return;
    try {
      await deleteSupplier(deletingSupplier.id).unwrap();
      setDeletingSupplier(null);
    } catch (err: any) {
      alert(err?.data?.message || "Failed to delete supplier");
    }
  };

  const handleOpenReceive = (po: PurchaseOrderApi) => {
    setReceivingPO(po);
    const initialInputs: {
      [itemId: string]: {
        receivedQuantity: number;
        damagedQuantity: number;
        batchNumber: string;
        expiryDate: string;
      };
    } = {};

    po.items.forEach((item) => {
      const remaining = Math.max(0, (item.orderedQuantity || 0) - (item.receivedQuantity || 0));
      const prefillQty =
        item.dispatchedQuantity && item.dispatchedQuantity > 0
          ? item.dispatchedQuantity
          : remaining;

      initialInputs[item.itemId] = {
        receivedQuantity: prefillQty,
        damagedQuantity: 0,
        batchNumber: generateTimestampBatchNo(item.item?.category),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };
    });
    setReceiveItemInputs(initialInputs);
  };

  const handleConfirmReceive = async () => {
    if (!receivingPO) return;

    for (const [itemId, input] of Object.entries(receiveItemInputs)) {
      const qty = Number(input.receivedQuantity);
      if (qty > 0) {
        if (!Number.isFinite(qty)) {
          return alert("Received quantity must be a valid number.");
        }
        if (!input.batchNumber.trim()) {
          return alert("Batch number is required for receiving stock.");
        }
      }
    }

    const itemsPayload = Object.entries(receiveItemInputs)
      .filter(([_, input]) => Number(input.receivedQuantity) > 0 || Number(input.damagedQuantity) > 0)
      .map(([itemId, input]) => ({
        itemId,
        receivedQuantity: Number(input.receivedQuantity || 0),
        damagedQuantity: Number(input.damagedQuantity || 0),
        batchNumber: input.batchNumber.trim(),
        expiryDate: input.expiryDate,
      }));

    if (itemsPayload.length === 0) return alert("Enter quantity greater than 0 for at least one item to receive.");

    try {
      await receivePOItem({ id: receivingPO.id, items: itemsPayload }).unwrap();
      setReceivingPO(null);
      refetchPOs();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to receive PO items");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-12">
        <InventoryNavTabs />

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-semibold text-zinc-900 tracking-tight">
                Purchase Orders
              </h1>
              <span className="rounded-md bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                {activeBranch?.name || "Main Branch"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-medium">
              Create restock orders, track incoming shipments, and manage supplier contacts
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id="add-custom-po-btn"
              onClick={() => {
                setPrefilledSupplierId(null);
                setShowCreateCustomPOModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Purchase Order
            </button>
            <button
              id="add-supplier-btn"
              onClick={() => setShowAddSupplierModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Supplier
            </button>
            <button
              id="smart-po-procurement-btn"
              onClick={() => {
                setPrefilledSupplierId(null);
                setShowSmartPOModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#D3232A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b01e23] transition-colors"
            >
              Quick Restock {lowStockItems.length > 0 ? `· ${lowStockItems.length} low` : ''}
            </button>
          </div>
        </div>

        {/* Top Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Active Restock Orders</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-0.5">{activePOCount}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Orders in transit or partial delivery</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700 shrink-0">
              <Truck className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Total Restock Spend</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-0.5">₹{totalSpendRupees}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Total purchase order value</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Registered Vendors</span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 mt-0.5">{suppliers.length}</h2>
              <button
                onClick={() => setActiveTab("SUPPLIERS")}
                className="text-xs text-[#D3232A] font-bold underline hover:text-[#b01e23] mt-1 block text-left"
              >
                View Vendors List →
              </button>
            </div>
            <div className="rounded-xl bg-red-50 p-3 text-[#D3232A] shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-zinc-200/80 gap-6 overflow-x-auto scrollbar-none whitespace-nowrap px-1">
          <button
            onClick={() => setActiveTab("POS")}
            className={`pb-2.5 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
              activeTab === "POS" ? "border-[#D3232A] text-[#D3232A]" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Restock Orders ({finalFilteredPOs.length})
          </button>
          <button
            onClick={() => setActiveTab("SUPPLIERS")}
            className={`pb-2.5 text-xs sm:text-sm font-bold transition-colors border-b-2 ${
              activeTab === "SUPPLIERS" ? "border-[#D3232A] text-[#D3232A]" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Supplier Directory ({filteredSuppliers.length})
          </button>
        </div>

        {/* TAB 1: PURCHASE ORDERS */}
        {activeTab === "POS" && (
          <div className="space-y-3">
            {/* Search & Status Filter Row for Orders */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by order # or supplier name..."
                  value={poSearchQuery}
                  onChange={(e) => {
                    setPoSearchQuery(e.target.value);
                    setPoPage(1);
                  }}
                  className="w-full rounded-lg border border-zinc-300 pl-9 pr-3 py-1.5 text-xs text-zinc-800 focus:border-[#D3232A] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={poStatusFilter}
                  onChange={(e) => {
                    setPoStatusFilter(e.target.value);
                    setPoPage(1);
                  }}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 focus:outline-none"
                >
                  <option value="ALL">All Statuses ({purchaseOrders.length})</option>
                  <option value="SENT">Placed</option>
                  <option value="PARTIALLY_RECEIVED">Partial</option>
                  <option value="RECEIVED">Completed</option>
                  <option value="DRAFT">Draft</option>
                </select>

                <button
                  onClick={() => {
                    setPoSearchQuery("");
                    setPoStatusFilter("ALL");
                    setPoPage(1);
                  }}
                  title="Clear filters"
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-zinc-500 hover:bg-zinc-100 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
              {(isLoadingPOs || branchLoading) ? (
                <div className="p-4 space-y-3">
                  <Skeleton height={24} width="25%" className="mb-4" />
                  <Skeleton count={5} height={42} borderRadius={8} className="mb-2" />
                </div>
              ) : finalFilteredPOs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-1.5 p-6 text-center">
                  <Truck className="h-8 w-8 text-zinc-300" />
                  <p className="text-sm font-semibold text-zinc-700">No restock orders match your search</p>
                  <p className="text-xs text-zinc-400">Click &ldquo;Quick Restock Order&rdquo; above to generate your first order.</p>
                </div>
              ) : (() => {
                const totalPoPages = Math.ceil(finalFilteredPOs.length / poPageSize);
                const safePoPage = Math.min(poPage, totalPoPages || 1);
                const startPoIdx = (safePoPage - 1) * poPageSize;
                const paginatedPOs = finalFilteredPOs.slice(startPoIdx, startPoIdx + poPageSize);
                const showPoOutlet = Boolean(isAllOutlets || finalFilteredPOs.some((p) => p.supplier || p.outlet));

                return (
                  <div className="flex flex-col">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[850px] text-sm border-collapse table-fixed">
                      <thead>
                        <tr className="bg-zinc-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                          <th className={`px-4 py-3.5 ${showPoOutlet ? "w-[12%]" : "w-[15%]"}`}>Order #</th>
                          <th className={`px-4 py-3.5 ${showPoOutlet ? "w-[20%]" : "w-[28%]"}`}>Supplier</th>
                          {showPoOutlet && (
                            <th className="px-4 py-3.5 w-[16%]">Outlet</th>
                          )}
                          <th className="px-4 py-3.5 text-center w-[8%]">Items</th>
                          <th className={`px-4 py-3.5 text-right ${showPoOutlet ? "w-[11%]" : "w-[14%]"}`}>Total Cost</th>
                          <th className={`px-4 py-3.5 text-center ${showPoOutlet ? "w-[11%]" : "w-[13%]"}`}>Status</th>
                          <th className={`px-4 py-3.5 text-center ${showPoOutlet ? "w-[11%]" : "w-[13%]"}`}>Date Placed</th>
                          <th className={`px-4 py-3.5 text-right ${showPoOutlet ? "w-[11%]" : "w-[7%]"}`}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {paginatedPOs.map((po) => {
                          const statusConfig: Record<string, { label: string; cls: string }> = {
                            DRAFT: { label: "Draft", cls: "bg-zinc-100 text-zinc-700 border-zinc-300" },
                            SENT: { label: "Placed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
                            PARTIALLY_RECEIVED: { label: "Partial", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                            RECEIVED: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                            CLOSED: { label: "Closed", cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
                          };
                          const statusInfo = statusConfig[po.status] || { label: po.status, cls: "bg-zinc-100 text-zinc-600 border-zinc-200" };
                          const isReceivable = po.status !== "RECEIVED" && po.status !== "CLOSED";

                          return (
                            <tr key={po.id} className="hover:bg-zinc-50/70 transition-colors">
                              <td className="px-4 py-3.5 font-mono font-semibold text-zinc-900 text-xs whitespace-nowrap">
                                #{formatUnderstandableOrderNo(po)}
                              </td>
                              <td className="px-4 py-3.5 font-medium text-zinc-900 whitespace-nowrap overflow-hidden">
                                <span className="truncate max-w-[200px] block">{po.actualSupplier?.name || "Supplier"}</span>
                              </td>
                              {showPoOutlet && (
                                <td className="px-4 py-3.5 whitespace-nowrap overflow-hidden">
                                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
                                    <span className="truncate max-w-[130px] inline-block align-bottom">{po.supplier?.name || po.outlet?.name || "Main Branch"}</span>
                                  </span>
                                </td>
                              )}
                              <td className="px-4 py-3.5 text-center text-zinc-600 font-medium whitespace-nowrap">{po.items?.length || 0}</td>
                              <td className="px-4 py-3.5 text-right font-semibold text-zinc-900 tabular-nums whitespace-nowrap">
                                ₹{(po.totalAmountPaise / 100).toFixed(2)}
                              </td>
                              <td className="px-5 py-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusInfo.cls}`}
                                >
                                  {statusInfo.label}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-center text-xs text-zinc-500 whitespace-nowrap">
                                {po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) : "N/A"}
                              </td>
                              <td className="px-5 py-3 text-right whitespace-nowrap">
                                {isReceivable ? (
                                  <button
                                    onClick={() => {
                                      setReceivingPO(po);
                                      const init: Record<string, any> = {};
                                      po.items?.forEach((pi) => {
                                        init[pi.itemId] = {
                                          receivedQuantity: pi.dispatchedQuantity || pi.orderedQuantity,
                                          damagedQuantity: 0,
                                          batchNumber: generateTimestampBatchNo(pi.item?.category),
                                          expiryDate: "",
                                        };
                                      });
                                      setReceiveItemInputs(init);
                                    }}
                                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                                  >
                                    Receive Stock
                                  </button>
                                ) : (
                                  <span className="text-xs font-semibold text-emerald-700">Completed</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        </tbody>
                      </table>
                    </div>

                    {/* PO Pagination Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 bg-zinc-50/80 border-t border-zinc-200 text-xs text-zinc-600">
                      <div>
                        Showing <strong>{startPoIdx + 1}</strong> to <strong>{Math.min(startPoIdx + poPageSize, finalFilteredPOs.length)}</strong> of <strong>{finalFilteredPOs.length}</strong> Orders
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setPoPage((p) => Math.max(1, p - 1))}
                          disabled={safePoPage === 1}
                          className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="px-2 font-medium">
                          Page {safePoPage} of {totalPoPages}
                        </span>
                        <button
                          onClick={() => setPoPage((p) => Math.min(totalPoPages, p + 1))}
                          disabled={safePoPage >= totalPoPages}
                          className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* TAB 2: SUPPLIERS */}
        {activeTab === "SUPPLIERS" && (
          <div className="space-y-4">
            {/* Search, Type Filter Tabs & Category Dropdown Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search suppliers by name, contact, phone..."
                    value={supplierSearchQuery}
                    onChange={(e) => {
                      setSupplierSearchQuery(e.target.value);
                      setSupPage(1);
                    }}
                    className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 text-xs text-zinc-800 focus:border-[#D3232A] focus:outline-none"
                  />
                </div>

                {/* ONLINE vs OFFLINE Filter Tabs */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-100/70 p-1 flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setSelectedSupplierTypeFilter("ALL"); setSupPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                      selectedSupplierTypeFilter === "ALL"
                        ? "bg-zinc-900 text-white shadow-2xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                    }`}
                  >
                    All Vendors ({suppliers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedSupplierTypeFilter("ONLINE"); setSupPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedSupplierTypeFilter === "ONLINE"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                    }`}
                  >
                    Online ({suppliers.filter((s) => s.type === "ONLINE").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedSupplierTypeFilter("OFFLINE"); setSupPage(1); }}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                      selectedSupplierTypeFilter === "OFFLINE"
                        ? "bg-zinc-800 text-white shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                    }`}
                  >
                    Offline ({suppliers.filter((s) => s.type !== "ONLINE").length})
                  </button>
                </div>
              </div>

              {/* Category & Outlet Filter Dropdowns */}
              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                {availableOutlets.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">Outlet:</span>
                    <select
                      id="vendor-outlet-select"
                      value={procurementOutletFilter}
                      onChange={(e) => {
                        setProcurementOutletFilter(e.target.value);
                        setSupPage(1);
                      }}
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-800 bg-white focus:border-[#D3232A] focus:outline-none cursor-pointer shadow-2xs"
                    >
                      <option value="ALL">All Outlets</option>
                      {availableOutlets.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-500 whitespace-nowrap">Category:</span>
                  <select
                    id="vendor-category-select"
                    value={selectedSupplierCategoryFilter}
                    onChange={(e) => {
                      setSelectedSupplierCategoryFilter(e.target.value);
                      setSupPage(1);
                    }}
                    className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white focus:border-[#D3232A] focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Frozen Goods">Frozen Goods</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Produce">Produce</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Syrups & Sauces">Syrups & Sauces</option>
                    <option value="Packaging">Packaging</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Display: Default Table View */}
            {(isLoadingSuppliers || branchLoading) ? (
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} height={35} className="w-full rounded-xl" />
                ))}
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2 bg-white rounded-2xl border border-zinc-200 p-6 text-center shadow-2xs">
                <Building2 className="h-8 w-8 text-zinc-300" />
                <p className="text-sm font-semibold text-zinc-600">
                  {suppliers.length === 0
                    ? "No suppliers registered yet"
                    : "No suppliers match your search filter"}
                </p>
                {suppliers.length === 0 ? (
                  <button
                    onClick={() => setShowAddSupplierModal(true)}
                    className="text-xs text-[#D3232A] font-semibold underline hover:text-[#b01e23]"
                  >
                    Add your first supplier contact
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSupplierSearchQuery("");
                      setSelectedSupplierCategoryFilter("ALL");
                      setSelectedSupplierTypeFilter("ALL");
                      setSupPage(1);
                    }}
                    className="text-xs text-[#D3232A] font-semibold underline"
                  >
                    Clear search filters
                  </button>
                )}
              </div>
            ) : (() => {
              const totalSupPages = Math.ceil(filteredSuppliers.length / supPageSize);
              const safeSupPage = Math.min(supPage, totalSupPages || 1);
              const startSupIdx = (safeSupPage - 1) * supPageSize;
              const paginatedSuppliers = filteredSuppliers.slice(startSupIdx, startSupIdx + supPageSize);

              const getCategoryBadgeStyle = (category?: string) => {
                const cat = (category || "").toLowerCase();
                if (cat.includes("dairy")) return "bg-sky-50 text-sky-800 border-sky-200/80 font-semibold";
                if (cat.includes("produce") || cat.includes("veg")) return "bg-emerald-50 text-emerald-800 border-emerald-200/80 font-semibold";
                if (cat.includes("meat") || cat.includes("poultry") || cat.includes("chicken")) return "bg-rose-50 text-rose-800 border-rose-200/80 font-semibold";
                if (cat.includes("beverage") || cat.includes("drink")) return "bg-indigo-50 text-indigo-800 border-indigo-200/80 font-semibold";
                if (cat.includes("bakery") || cat.includes("bread")) return "bg-amber-50 text-amber-800 border-amber-200/80 font-semibold";
                if (cat.includes("frozen")) return "bg-cyan-50 text-cyan-800 border-cyan-200/80 font-semibold";
                if (cat.includes("syrup") || cat.includes("sauce")) return "bg-orange-50 text-orange-800 border-orange-200/80 font-semibold";
                if (cat.includes("packaging")) return "bg-slate-100 text-slate-800 border-slate-200/80 font-semibold";
                return "bg-zinc-100 text-zinc-700 border-zinc-200/70 font-semibold";
              };

              return (
                <div className="space-y-4">
                  {/* DEFAULT ELEGANT TABLE VIEW */}
                    <div className="rounded-2xl border border-zinc-200/80 bg-white shadow-2xs overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-zinc-50/80 text-zinc-400 font-semibold uppercase tracking-wider text-[11px] border-b border-zinc-200/80">
                          <tr>
                            <th className="px-5 py-3.5 w-[35%]">Vendor Name &amp; Type</th>
                            <th className="px-4 py-3.5 text-center w-[12%]">Orders</th>
                            <th className="px-4 py-3.5 w-[25%]">Contact Info</th>
                            <th className="px-4 py-3.5 w-[18%]">Location</th>
                            <th className="px-5 py-3.5 text-right w-[10%]">Actions</th>
                          </tr>
                        </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {paginatedSuppliers.map((s) => {
                          const vendorPOCount = purchaseOrders.filter(
                            (po) => po.supplierId === s.id || po.actualSupplier?.id === s.id || po.supplier?.name === s.name
                          ).length;

                          return (
                            <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                              {/* Vendor Name & Primary Contact */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-zinc-900 text-sm leading-snug">{s.name}</p>
                                  {s.type === "ONLINE" ? (
                                    <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200 shrink-0">
                                      Online
                                    </span>
                                  ) : (
                                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-200 shrink-0">
                                      Offline
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                                  {s.contactPerson}{s.user?.email ? ` · ${s.user.email}` : ""}{s.category ? ` · ${s.category}` : ""}
                                </p>
                              </td>

                              {/* Total Orders / PO Count Badge */}
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 border border-zinc-200/80 px-2.5 py-0.5 text-[11px] font-bold text-zinc-700">
                                  {vendorPOCount} {vendorPOCount === 1 ? "PO" : "POs"}
                                </span>
                              </td>

                            {/* Phone & Email */}
                            <td className="px-4 py-4 whitespace-nowrap space-y-1">
                              <p className="text-xs text-zinc-700 font-medium">
                                <a href={`tel:${s.phone}`} className="hover:text-[#D3232A]">{s.phone}</a>
                              </p>
                              <p className="text-[11px] text-zinc-400 font-medium truncate">
                                <a href={`mailto:${s.email}`} className="hover:text-[#D3232A] truncate">{s.email}</a>
                              </p>
                            </td>

                            {/* Location / Address & Branch */}
                            <td className="px-4 py-4 max-w-xs text-xs text-zinc-600 font-medium">
                              <p className="truncate text-zinc-700 font-medium">{s.address}</p>
                              {(isAllOutlets || s.outlet) && (
                                <span className="text-[11px] font-medium text-zinc-400 block mt-0.5">
                                  {s.outlet?.name || "Main Branch"}
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setViewingSupplier(s)}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                  title="View Vendor Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>

                                {canManageVendors && (
                                  <>
                                    <button
                                      onClick={() => setEditingSupplier(s)}
                                      className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                      title="Edit Vendor Details"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingSupplier(s)}
                                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                      title="Delete Vendor"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}

                                <button
                                  onClick={() => {
                                    setPrefilledSupplierId(s.id);
                                    setShowCreateCustomPOModal(true);
                                  }}
                                  className="ml-1 inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all"
                                  title="New Order"
                                >
                                  Order
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                  {/* Supplier Pagination Bar */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-zinc-200 text-xs text-zinc-600 shadow-2xs">
                    <div>
                      Showing <strong>{startSupIdx + 1}</strong> to <strong>{Math.min(startSupIdx + supPageSize, filteredSuppliers.length)}</strong> of <strong>{filteredSuppliers.length}</strong> Suppliers
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSupPage((p) => Math.max(1, p - 1))}
                        disabled={safeSupPage === 1}
                        className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="px-2 font-medium">
                        Page {safeSupPage} of {totalSupPages}
                      </span>
                      <button
                        onClick={() => setSupPage((p) => Math.min(totalSupPages, p + 1))}
                        disabled={safeSupPage >= totalSupPages}
                        className="rounded-md border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* MODAL 1: ADD SUPPLIER */}
        {showAddSupplierModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
                    Register Supplier
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure vendor profile and portal integration
                  </p>
                </div>
                <button
                  onClick={() => setShowAddSupplierModal(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateSupplier} className="flex flex-col flex-1 min-h-0">
                <div className="flex-1 overflow-y-auto p-7 space-y-6 scrollbar-thin">
                  {/* Mode Selector */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
                      Supplier Integration Mode
                    </label>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-1 grid grid-cols-2 gap-1 max-w-md">
                      <button
                        type="button"
                        onClick={() => setSupplierForm({ ...supplierForm, type: "OFFLINE" })}
                        className={`rounded-lg py-2 px-3 text-xs font-medium transition-all ${
                          supplierForm.type === "OFFLINE"
                            ? "bg-white text-zinc-900 shadow-xs font-semibold border border-zinc-200"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Offline Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => setSupplierForm({ ...supplierForm, type: "ONLINE" })}
                        className={`rounded-lg py-2 px-3 text-xs font-medium transition-all ${
                          supplierForm.type === "ONLINE"
                            ? "bg-[#D3232A] text-white shadow-xs font-semibold"
                            : "text-zinc-500 hover:text-zinc-900"
                        }`}
                      >
                        Online Vendor (Portal)
                      </button>
                    </div>

                    {supplierForm.type === "ONLINE" ? (
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Online Vendor: Login account will be created so supplier can manage orders &amp; dispatch dates directly.
                      </p>
                    ) : (
                      <p className="text-[11px] text-zinc-400 font-medium">
                        Offline Vendor: Manual record for phone or paper invoice orders.
                      </p>
                    )}
                  </div>

                  {/* 2-Column Form Fields Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Company Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Amul Dairy Pvt Ltd"
                        value={supplierForm.name}
                        onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Category *
                      </label>
                      <select
                        required
                        value={supplierForm.category}
                        onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none bg-white shadow-xs"
                      >
                        <option value="Dairy">Dairy</option>
                        <option value="Frozen Goods">Frozen Goods</option>
                        <option value="Meat &amp; Poultry">Meat &amp; Poultry</option>
                        <option value="Produce">Produce</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Syrups &amp; Sauces">Syrups &amp; Sauces</option>
                        <option value="Packaging">Packaging</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Contact Person *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Rajesh Kumar"
                        value={supplierForm.contactPerson}
                        onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Phone *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="+91 9876543210"
                        value={supplierForm.phone}
                        onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Email *
                      </label>
                      <input
                        required
                        type="email"
                        placeholder="supplier@example.com"
                        value={supplierForm.email}
                        onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    {supplierForm.type === "ONLINE" ? (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                          Portal Login Password
                        </label>
                        <input
                          type="password"
                          placeholder="Default: Supplier@123"
                          value={supplierForm.password || ""}
                          onChange={(e) => setSupplierForm({ ...supplierForm, password: e.target.value })}
                          className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs font-mono"
                        />
                      </div>
                    ) : null}

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Address *
                      </label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Supplier street address…"
                        value={supplierForm.address}
                        onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddSupplierModal(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingSupplier}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#b01e23] disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isCreatingSupplier ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      "Save Supplier"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2.5: EDIT SUPPLIER */}
        {editingSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
                    Edit Vendor Details
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Update vendor contact details and category
                  </p>
                </div>
                <button
                  onClick={() => setEditingSupplier(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!editingSupplier) return;
                  try {
                    await updateSupplier({
                      id: editingSupplier.id,
                      data: {
                        name: editingSupplier.name,
                        contactPerson: editingSupplier.contactPerson,
                        phone: editingSupplier.phone,
                        email: editingSupplier.email,
                        address: editingSupplier.address,
                        category: editingSupplier.category,
                      },
                    }).unwrap();
                    setEditingSupplier(null);
                  } catch (err: any) {
                    alert(err?.data?.message || "Failed to update vendor");
                  }
                }}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="flex-1 overflow-y-auto p-7 space-y-5 scrollbar-thin">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Vendor Name
                      </label>
                      <input
                        required
                        type="text"
                        value={editingSupplier.name}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Category
                      </label>
                      <select
                        value={editingSupplier.category || "General"}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none bg-white shadow-xs"
                      >
                        <option value="Dairy">Dairy</option>
                        <option value="Produce">Produce</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Syrups &amp; Sauces">Syrups &amp; Sauces</option>
                        <option value="Packaging">Packaging</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                        Contact Person
                      </label>
                      <input
                        required
                        type="text"
                        value={editingSupplier.contactPerson}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, contactPerson: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Phone</label>
                      <input
                        required
                        type="text"
                        value={editingSupplier.phone}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Email</label>
                      <input
                        required
                        type="email"
                        value={editingSupplier.email}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Address</label>
                      <textarea
                        required
                        rows={2}
                        value={editingSupplier.address}
                        onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                        className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-zinc-800 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingSupplier(null)}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingSupplier}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#b01e23] disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isUpdatingSupplier ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                      </>
                    ) : (
                      "Update Vendor"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: RECEIVE PO ITEMS */}
        {receivingPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-100 bg-white shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 tracking-tight">
                    Receive Stock — Order #{formatUnderstandableOrderNo(receivingPO)}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Review supplier dispatched quantities, record accepted stock &amp; log damaged items
                  </p>
                </div>
                <button
                  onClick={() => setReceivingPO(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin">
                {/* Supplier Dispatch Status & Notes Banners */}
                {(receivingPO.status === "DISPATCHED" || receivingPO.status === "PARTIALLY_DISPATCHED") && (
                  <div className="rounded-xl bg-blue-50 border border-blue-200/80 p-3.5 text-xs text-blue-900 space-y-1 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold">
                      <Truck className="h-4 w-4 text-blue-600" />
                      Supplier Status: {receivingPO.status === "PARTIALLY_DISPATCHED" ? "Partial Dispatch Sent" : "Full Order Dispatched"}
                    </div>
                    {receivingPO.supplierNotes && (
                      <p className="text-blue-800">
                        <span className="font-semibold">Supplier Note:</span> {receivingPO.supplierNotes}
                      </p>
                    )}
                    {receivingPO.expectedNextDeliveryDate && (
                      <p className="text-purple-800 font-semibold">
                        Expected Next Delivery: {new Date(receivingPO.expectedNextDeliveryDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                    <p className="text-[11px] text-blue-700 italic pt-0.5">
                      ★ Dispatched quantities entered by vendor have been automatically pre-filled below for your convenience.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {receivingPO.items.map((poItem) => {
                    const input = receiveItemInputs[poItem.itemId] || {
                      receivedQuantity: 0,
                      damagedQuantity: 0,
                      batchNumber: "",
                      expiryDate: "",
                    };
                    return (
                      <div key={poItem.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-900 text-sm">{poItem.item?.name || "Ingredient"}</span>
                            {poItem.dispatchedQuantity ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Dispatched: {poItem.dispatchedQuantity}
                              </span>
                            ) : null}
                          </div>
                          <span className="text-xs text-zinc-400 font-medium">
                            Ordered: <strong className="text-zinc-700">{poItem.orderedQuantity}</strong> | Prev Received: <strong className="text-zinc-700">{poItem.receivedQuantity || 0}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Accepted Qty</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={input.receivedQuantity}
                              onChange={(e) =>
                                setReceiveItemInputs({
                                  ...receiveItemInputs,
                                  [poItem.itemId]: { ...input, receivedQuantity: Number(e.target.value) },
                                })
                              }
                              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs bg-white focus:border-emerald-500 focus:outline-none font-semibold text-emerald-900 shadow-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Damaged Qty</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={input.damagedQuantity || 0}
                              onChange={(e) =>
                                setReceiveItemInputs({
                                  ...receiveItemInputs,
                                  [poItem.itemId]: { ...input, damagedQuantity: Number(e.target.value) },
                                })
                              }
                              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs bg-white focus:border-rose-500 focus:outline-none font-semibold text-rose-800 shadow-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-7 py-4 bg-zinc-50 border-t border-zinc-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setReceivingPO(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReceive}
                  disabled={isReceiving}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  {isReceiving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Confirm Stock Arrival
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: 1-CLICK SMART PO GENERATOR */}
        {showSmartPOModal && activeBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <SmartPOModal
              outletId={activeBranch.id}
              lowStockItems={lowStockItems}
              allItems={items}
              onClose={() => {
                setShowSmartPOModal(false);
                setPrefilledSupplierId(null);
              }}
              onSuccess={() => {
                setShowSmartPOModal(false);
                setPrefilledSupplierId(null);
                refetchPOs();
              }}
            />
          </div>
        )}

        {/* MODAL 4B: CREATE CUSTOM PURCHASE ORDER MODAL */}
        {showCreateCustomPOModal && activeBranch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <CreatePurchaseOrderModal
              outletId={activeBranch.id}
              allItems={items}
              prefilledSupplierId={prefilledSupplierId}
              onClose={() => {
                setShowCreateCustomPOModal(false);
                setPrefilledSupplierId(null);
              }}
              onSuccess={() => {
                setShowCreateCustomPOModal(false);
                setPrefilledSupplierId(null);
                refetchPOs();
              }}
            />
          </div>
        )}

        {/* MODAL 5: DELETE SUPPLIER CONFIRMATION */}
        {deletingSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative border border-zinc-200">
              <button
                onClick={() => setDeletingSupplier(null)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 text-red-600 mb-3">
                <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">Delete Supplier</h3>
                  <p className="text-xs text-zinc-500">Confirm removing vendor contact</p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 mb-5 leading-relaxed">
                Are you sure you want to delete supplier <strong>{deletingSupplier.name}</strong>? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeletingSupplier(null)}
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSupplierConfirm}
                  disabled={isDeletingSupplier}
                  className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeletingSupplier ? "Deleting…" : "Delete Supplier"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: VIEW SUPPLIER DETAILS */}
        {viewingSupplier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-zinc-200 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setViewingSupplier(null)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-start gap-3.5 mb-5 pb-4 border-b border-zinc-100">
                <div className="rounded-xl bg-red-50 p-3 text-[#D3232A] shrink-0">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-zinc-900">{viewingSupplier.name}</h2>
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 border border-zinc-200">
                      {viewingSupplier.category || "General"}
                    </span>
                    {viewingSupplier.type === "ONLINE" ? (
                      <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        Online Vendor
                      </span>
                    ) : (
                      <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 border border-zinc-200">
                        Offline Vendor
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Registered Vendor Profile &amp; Order History
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">Contact Info</span>
                  <p className="text-xs text-zinc-900 font-medium">
                    {viewingSupplier.contactPerson || "Primary Contact"}
                  </p>
                  <p className="text-xs text-zinc-700">
                    <a href={`tel:${viewingSupplier.phone}`} className="hover:text-[#D3232A]">{viewingSupplier.phone}</a>
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    <a href={`mailto:${viewingSupplier.email}`} className="hover:text-[#D3232A] truncate">{viewingSupplier.email}</a>
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">Location &amp; Outlet</span>
                  <p className="text-xs text-zinc-800 font-medium">
                    {viewingSupplier.address}
                  </p>
                  <p className="text-xs text-zinc-500 pt-1">
                    Outlet: <strong className="text-zinc-800">{viewingSupplier.outlet?.name || "Main Branch"}</strong>
                  </p>
                </div>
              </div>

              {/* Order History */}
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Recent Purchase Orders
                </h3>
                {(() => {
                  const supplierPOs = purchaseOrders.filter(
                    (p) => p.supplierId === viewingSupplier.id || p.actualSupplier?.id === viewingSupplier.id || p.supplier?.name === viewingSupplier.name
                  );
                  if (supplierPOs.length === 0) {
                    return (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center text-xs text-zinc-500">
                        No purchase orders recorded with this supplier yet.
                      </div>
                    );
                  }
                  return (
                    <div className="rounded-xl border border-zinc-200 overflow-hidden divide-y divide-zinc-100 text-xs">
                      {supplierPOs.slice(0, 3).map((po) => (
                        <div key={po.id} className="p-3 bg-white flex items-center justify-between gap-3">
                          <div>
                            <span className="font-mono font-bold text-zinc-900">#{formatUnderstandableOrderNo(po)}</span>
                            <span className="text-zinc-400 text-[11px] ml-2">{po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-IN") : ""}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-zinc-900 tabular-nums">₹{(po.totalAmountPaise / 100).toFixed(2)}</span>
                            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                              {po.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  {canManageVendors && (
                    <>
                      <button
                        onClick={() => {
                          const sup = viewingSupplier;
                          setViewingSupplier(null);
                          setEditingSupplier(sup);
                        }}
                        className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        Edit Details
                      </button>
                      <button
                        onClick={() => {
                          const sup = viewingSupplier;
                          setViewingSupplier(null);
                          setDeletingSupplier(sup);
                        }}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    const supId = viewingSupplier.id;
                    setViewingSupplier(null);
                    setPrefilledSupplierId(supId);
                    setShowCreateCustomPOModal(true);
                  }}
                  className="rounded-xl bg-[#D3232A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#b01e23] transition-colors shadow-xs"
                >
                  Create Order from Vendor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
