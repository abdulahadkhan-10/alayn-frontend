"use client";

import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import InventoryNavTabs from "@/components/Inventory/InventoryNavTabs";
import { useBranch } from "@/lib/BranchContext";
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
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
} from "lucide-react";
import Skeleton from "react-loading-skeleton";
import SmartPOModal from "@/components/Inventory/SmartPOModal";

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

// Helper for understandable order numbers: e.g. PO-20260727-5F4591
function formatUnderstandableOrderNo(po: { id: string; poNumber?: string; createdAt?: string }): string {
  if (po.poNumber) return po.poNumber;
  const dateStr = po.createdAt
    ? new Date(po.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shortHash = po.id.slice(0, 6).toUpperCase();
  return `PO-${dateStr}-${shortHash}`;
}

export default function ProcurementPage() {
  const { activeBranch, loading: branchLoading } = useBranch();
  const [activeTab, setActiveTab] = useState<"POS" | "SUPPLIERS">("POS");

  // RTK Queries
  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useGetSuppliersQuery(undefined, { skip: !activeBranch });
  const { data: purchaseOrders = [], isLoading: isLoadingPOs, refetch: refetchPOs } = useGetPurchaseOrdersQuery(undefined, { skip: !activeBranch });
  const { data: inventoryData } = useGetItemsQuery(undefined, { skip: !activeBranch });
  const items = inventoryData?.items || [];

  // Mutations
  const [createSupplier, { isLoading: isCreatingSupplier }] = useCreateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeletingSupplier }] = useDeleteSupplierMutation();
  const [receivePOItem, { isLoading: isReceiving }] = useReceivePOItemMutation();

  // Modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showSmartPOModal, setShowSmartPOModal] = useState(false);
  const [prefilledSupplierId, setPrefilledSupplierId] = useState<string | null>(null);
  const [receivingPO, setReceivingPO] = useState<PurchaseOrderApi | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<SupplierApi | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<SupplierApi | null>(null);

  // Search, Status Filter, Category & Outlet Filter states
  const [poSearchQuery, setPoSearchQuery] = useState("");
  const [poStatusFilter, setPoStatusFilter] = useState("ALL");
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [selectedSupplierCategoryFilter, setSelectedSupplierCategoryFilter] = useState("ALL");
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
        s.email.toLowerCase().includes(q);

      const matchesCategory =
        selectedSupplierCategoryFilter === "ALL" ||
        (s.category && s.category.toLowerCase().trim() === selectedSupplierCategoryFilter.toLowerCase().trim());

      const matchesOutlet =
        !isAllOutlets ||
        procurementOutletFilter === "ALL" ||
        s.outlet?.id === procurementOutletFilter ||
        s.outletId === procurementOutletFilter;

      return matchesSearch && matchesCategory && matchesOutlet;
    });
  }, [suppliers, supplierSearchQuery, selectedSupplierCategoryFilter, isAllOutlets, procurementOutletFilter]);

  // Form states
  const [supplierForm, setSupplierForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "", category: "Dairy" });
  const [receiveItemInputs, setReceiveItemInputs] = useState<{ [itemId: string]: { receivedQuantity: number; batchNumber: string; expiryDate: string } }>({});

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSupplier(supplierForm).unwrap();
      setShowAddSupplierModal(false);
      setSupplierForm({ name: "", contactPerson: "", phone: "", email: "", address: "", category: "Dairy" });
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
    const initialInputs: { [itemId: string]: { receivedQuantity: number; batchNumber: string; expiryDate: string } } = {};
    po.items.forEach((item) => {
      const remaining = Math.max(0, (item.orderedQuantity || 0) - (item.receivedQuantity || 0));
      initialInputs[item.itemId] = {
        receivedQuantity: remaining,
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
      .filter(([_, input]) => Number(input.receivedQuantity) > 0)
      .map(([itemId, input]) => ({
        itemId,
        receivedQuantity: Number(input.receivedQuantity),
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-zinc-900">
              Orders & Suppliers — <span className="text-[#D3232A]">{activeBranch?.name || "Branch"}</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Place restock orders with vendors, track shipments, and manage supplier details
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAllOutlets && availableOutlets.length > 0 && (
              <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1.5 px-3 rounded-xl shadow-xs">
                <Filter className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-700">Outlet:</span>
                <select
                  value={procurementOutletFilter}
                  onChange={(e) => {
                    setProcurementOutletFilter(e.target.value);
                    setPoPage(1);
                    setSupPage(1);
                  }}
                  className="text-xs font-semibold text-zinc-900 bg-transparent focus:outline-none"
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
            <button
              id="add-supplier-btn"
              onClick={() => setShowAddSupplierModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add Supplier
            </button>
            <button
              id="smart-po-procurement-btn"
              onClick={() => {
                setPrefilledSupplierId(null);
                setShowSmartPOModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-[#D3232A] to-red-600 px-4 py-2 text-xs font-bold text-white hover:opacity-95 transition-opacity shadow-xs"
            >
              <Zap className="h-3.5 w-3.5 fill-current" /> Quick Restock Order {lowStockItems.length > 0 ? `(${lowStockItems.length} Low)` : ''}
            </button>
          </div>
        </div>

        {/* Top Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Restock Orders</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 mt-1">{activePOCount}</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Orders currently in transit or partial</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 border border-blue-100">
              <Truck className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Restock Spend</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 mt-1">₹{totalSpendRupees}</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Cumulative vendor order value</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 border border-emerald-100">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Registered Vendors</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 mt-1">{suppliers.length}</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Active supplier contact directory</p>
            </div>
            <div className="rounded-xl bg-red-50 p-2.5 text-[#D3232A] border border-red-100">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex border-b border-zinc-200 gap-4 overflow-x-auto scrollbar-none whitespace-nowrap">
          <button
            onClick={() => setActiveTab("POS")}
            className={`pb-2 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "POS" ? "border-[#D3232A] text-[#D3232A]" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Restock Orders ({finalFilteredPOs.length})
          </button>
          <button
            onClick={() => setActiveTab("SUPPLIERS")}
            className={`pb-2 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
              activeTab === "SUPPLIERS" ? "border-[#D3232A] text-[#D3232A]" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Suppliers ({filteredSuppliers.length})
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
                              <td className="px-4 py-3.5 font-mono font-bold text-zinc-800 text-xs whitespace-nowrap overflow-hidden">
                                #{formatUnderstandableOrderNo(po)}
                              </td>
                              <td className="px-4 py-3.5 font-bold text-zinc-900 whitespace-nowrap overflow-hidden">
                                <span className="truncate max-w-[200px] block">{po.actualSupplier?.name || "Supplier"}</span>
                              </td>
                              {showPoOutlet && (
                                <td className="px-4 py-3.5 whitespace-nowrap overflow-hidden">
                                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 border border-slate-200/80 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs">
                                    <Building2 className="h-3.5 w-3.5 text-[#D3232A] shrink-0" />
                                    <span className="truncate max-w-[130px] font-medium">{po.supplier?.name || po.outlet?.name || "Main Branch"}</span>
                                  </span>
                                </td>
                              )}
                              <td className="px-4 py-3.5 text-center text-zinc-600 font-semibold whitespace-nowrap">{po.items?.length || 0}</td>
                              <td className="px-4 py-3.5 text-right font-bold text-zinc-900 tabular-nums whitespace-nowrap">
                                ₹{(po.totalAmountPaise / 100).toFixed(2)}
                              </td>
                                <td className="px-5 py-3 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusInfo.cls}`}
                                  >
                                    {po.status === "RECEIVED" ? (
                                      <CheckCircle2 className="h-3 w-3" />
                                    ) : po.status === "PARTIALLY_RECEIVED" ? (
                                      <Clock className="h-3 w-3" />
                                    ) : null}
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
                                <td className="px-5 py-3 text-right">
                                  {isReceivable ? (
                                    <button
                                      onClick={() => handleOpenReceive(po)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                                    >
                                      <PackageCheck className="h-3.5 w-3.5" /> Receive Items
                                    </button>
                                  ) : (
                                    <span className="text-xs text-emerald-700 font-bold flex items-center justify-end gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                                    </span>
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
            {/* Search & Category Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-2xs">
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
                  className="w-full rounded-lg border border-zinc-200 pl-9 pr-3 py-1.5 text-xs text-zinc-800 focus:border-[#D3232A] focus:outline-none"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                {[
                  "ALL",
                  "Dairy",
                  "Frozen Goods",
                  "Meat & Poultry",
                  "Produce",
                  "Beverages",
                  "Bakery",
                  "Syrups & Sauces",
                  "Packaging",
                  "General",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedSupplierCategoryFilter(cat);
                      setSupPage(1);
                    }}
                    className={`rounded-full px-3 py-1 text-[11px] font-bold tracking-wide transition-all whitespace-nowrap ${
                      selectedSupplierCategoryFilter.toLowerCase() === cat.toLowerCase()
                        ? "bg-[#D3232A] text-white shadow-2xs"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Suppliers */}
            {(isLoadingSuppliers || branchLoading) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
                    <Skeleton height={20} width="60%" className="mb-2" />
                    <Skeleton height={14} width="40%" className="mb-3" />
                    <Skeleton count={3} height={12} className="mb-1" />
                  </div>
                ))}
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-zinc-400 gap-2 bg-white rounded-xl border border-zinc-200 p-6 text-center">
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

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedSuppliers.map((s) => (
                      <div key={s.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all group">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-zinc-900 text-base flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-[#D3232A]" /> {s.name}
                              </h3>
                              <p className="text-xs font-semibold text-zinc-500 mt-0.5">Contact: {s.contactPerson}</p>
                              {(isAllOutlets || s.outlet) && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100/90 border border-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-800 mt-1.5">
                                  <Building2 className="h-3.5 w-3.5 text-[#D3232A] shrink-0" /> {s.outlet?.name || "Main Branch"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center rounded-full bg-red-50 text-[#D3232A] border border-red-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                                {s.category || "General"}
                              </span>
                              <button
                                onClick={() => setViewingSupplier(s)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingSupplier(s)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-0.5"
                                title="Delete Supplier"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1.5 text-xs text-zinc-600 border-t border-zinc-100 pt-3">
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <a href={`tel:${s.phone}`} className="hover:text-[#D3232A] font-semibold">{s.phone}</a>
                            </p>
                            <p className="flex items-center gap-1.5 truncate">
                              <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                              <a href={`mailto:${s.email}`} className="hover:text-[#D3232A] font-semibold truncate">{s.email}</a>
                            </p>
                            <p className="text-zinc-500 text-[11px] pt-0.5 truncate">
                              <strong>Address:</strong> {s.address}
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons: View Details & Order */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-zinc-100">
                          <button
                            onClick={() => setViewingSupplier(s)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-zinc-500" /> Details
                          </button>
                          <button
                            onClick={() => {
                              setPrefilledSupplierId(s.id);
                              setShowSmartPOModal(true);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D3232A] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors shadow-2xs"
                          >
                            <Zap className="h-3.5 w-3.5 fill-current" /> Order
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Supplier Pagination Bar */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-zinc-200 text-xs text-zinc-600">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative">
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold text-zinc-900 mb-1">Add Supplier Contact</h2>
              <p className="text-xs text-zinc-500 mb-4">Register a vendor to send stock orders to</p>

              <form onSubmit={handleCreateSupplier} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Supplier / Business Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Amul Dairy Pvt Ltd"
                    value={supplierForm.name}
                    onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Supplier Product Category</label>
                  <select
                    required
                    value={supplierForm.category}
                    onChange={(e) => setSupplierForm({ ...supplierForm, category: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#D3232A] focus:outline-none font-medium bg-white"
                  >
                    <option value="Dairy">Dairy (Milk, Cheese, Butter, etc.)</option>
                    <option value="Frozen Goods">Frozen Goods (Frozen Chicken, Ice Cream, etc.)</option>
                    <option value="Meat & Poultry">Meat & Poultry (Chicken, Mutton, Fish)</option>
                    <option value="Produce">Produce / Vegetables & Fruits</option>
                    <option value="Beverages">Beverages & Soft Drinks</option>
                    <option value="Bakery">Bakery & Bread</option>
                    <option value="Syrups & Sauces">Syrups, Sauces & Spices</option>
                    <option value="Packaging">Packaging & Containers</option>
                    <option value="General">General / All Categories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Contact Person</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={supplierForm.contactPerson}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone</label>
                    <input
                      required
                      type="text"
                      placeholder="+91 9876543210"
                      value={supplierForm.phone}
                      onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#D3232A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
                    <input
                      required
                      type="email"
                      placeholder="supplier@example.com"
                      value={supplierForm.email}
                      onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#D3232A] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Address</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Supplier street address..."
                    value={supplierForm.address}
                    onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-[#D3232A] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingSupplier}
                  className="w-full rounded-lg bg-[#D3232A] py-2.5 text-sm font-semibold text-white hover:bg-[#b01e23] transition-colors mt-2"
                >
                  {isCreatingSupplier ? "Saving Supplier…" : "Save Supplier"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: RECEIVE PO ITEMS */}
        {receivingPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setReceivingPO(null)}
                className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-bold text-zinc-900 mb-1">
                Receive Stock — Order #{receivingPO.id.slice(0, 8).toUpperCase()}
              </h2>
              <p className="text-xs text-zinc-500 mb-4">
                Record incoming stock batch details and expiry dates
              </p>

              <div className="space-y-4">
                {receivingPO.items.map((poItem) => {
                  const input = receiveItemInputs[poItem.itemId] || { receivedQuantity: 0, batchNumber: "", expiryDate: "" };
                  return (
                    <div key={poItem.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-zinc-900 text-sm">{poItem.item?.name || "Ingredient"}</span>
                        <span className="text-xs text-zinc-500">
                          Ordered: <strong>{poItem.orderedQuantity}</strong> | Prev Received: <strong>{poItem.receivedQuantity}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Receive Quantity</label>
                          <input
                            type="number"
                            step="any"
                            value={input.receivedQuantity}
                            onChange={(e) =>
                              setReceiveItemInputs({
                                ...receiveItemInputs,
                                [poItem.itemId]: { ...input, receivedQuantity: Number(e.target.value) },
                              })
                            }
                            className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs bg-white focus:outline-none font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Batch Number</label>
                          <input
                            type="text"
                            value={input.batchNumber}
                            onChange={(e) =>
                              setReceiveItemInputs({
                                ...receiveItemInputs,
                                [poItem.itemId]: { ...input, batchNumber: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={input.expiryDate}
                            onChange={(e) =>
                              setReceiveItemInputs({
                                ...receiveItemInputs,
                                [poItem.itemId]: { ...input, expiryDate: e.target.value },
                              })
                            }
                            className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={handleConfirmReceive}
                  disabled={isReceiving}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors mt-4 flex items-center justify-center gap-2"
                >
                  {isReceiving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Stock Arrival"}
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
              lowStockItems={prefilledSupplierId ? items : lowStockItems}
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
                    <h2 className="text-lg font-bold text-zinc-900">{viewingSupplier.name}</h2>
                    <span className="rounded-full bg-red-50 text-[#D3232A] border border-red-200 px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                      {viewingSupplier.category || "General"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Registered Vendor Details & Order History
                  </p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Contact Info</span>
                  <p className="text-xs text-zinc-800 font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-400 shrink-0" /> {viewingSupplier.contactPerson || "Primary Contact"}
                  </p>
                  <p className="text-xs text-zinc-800 font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-zinc-400 shrink-0" />
                    <a href={`tel:${viewingSupplier.phone}`} className="hover:text-[#D3232A]">{viewingSupplier.phone}</a>
                  </p>
                  <p className="text-xs text-zinc-800 font-semibold flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 text-zinc-400 shrink-0" />
                    <a href={`mailto:${viewingSupplier.email}`} className="hover:text-[#D3232A] truncate">{viewingSupplier.email}</a>
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Location & Outlet</span>
                  <p className="text-xs text-zinc-800 font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#D3232A] shrink-0" />
                    <span>{viewingSupplier.address}</span>
                  </p>
                  <p className="text-xs text-zinc-600 font-medium flex items-center gap-2 pt-1">
                    <Building2 className="h-4 w-4 text-zinc-400 shrink-0" />
                    <span>Assigned Outlet: <strong>{viewingSupplier.outlet?.name || "Main Branch"}</strong></span>
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
                      {supplierPOs.slice(0, 4).map((po) => (
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
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                <button
                  onClick={() => {
                    const sup = viewingSupplier;
                    setViewingSupplier(null);
                    setDeletingSupplier(sup);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" /> Delete Supplier
                </button>
                <button
                  onClick={() => {
                    const supId = viewingSupplier.id;
                    setViewingSupplier(null);
                    setPrefilledSupplierId(supId);
                    setShowSmartPOModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D3232A] px-4 py-2 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors shadow-2xs"
                >
                  <Zap className="h-4 w-4 fill-current" /> Order from Supplier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
