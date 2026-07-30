"use client";

import React, { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetSupplierPortalOrdersQuery,
  useUpdateSupplierPOStatusMutation,
  PurchaseOrderApi,
} from "@/redux/slices/procurementApiSlice";
import {
  Truck,
  Package,
  PackageCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  RotateCcw,
  Building2,
  Calendar,
  FileText,
  Send,
  Loader2,
  ChevronRight,
  Eye,
  Zap,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";

function formatOrderNo(po: { id: string; createdAt?: string }): string {
  const dateStr = po.createdAt
    ? new Date(po.createdAt).toISOString().slice(0, 10).replace(/-/g, "")
    : new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const shortHash = po.id.slice(0, 6).toUpperCase();
  return `PO-${dateStr}-${shortHash}`;
}

export default function SupplierPortalPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: purchaseOrders = [], isLoading, refetch } = useGetSupplierPortalOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateSupplierPOStatusMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderApi | null>(null);
  const [actionModalType, setActionModalType] = useState<"DISPATCH" | "OUT_OF_STOCK" | "VIEW" | null>(null);

  // Form states for dispatch / partial
  const [dispatchInputs, setDispatchInputs] = useState<{ [itemId: string]: number }>({});
  const [supplierNotes, setSupplierNotes] = useState("");
  const [isPartialOrder, setIsPartialOrder] = useState(false);
  const [expectedNextDeliveryDate, setExpectedNextDeliveryDate] = useState("");

  // Calculated Metrics
  const activeCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "SENT" || po.status === "PACKING").length;
  }, [purchaseOrders]);

  const dispatchedCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "DISPATCHED" || po.status === "PARTIALLY_DISPATCHED").length;
  }, [purchaseOrders]);

  const completedCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "RECEIVED").length;
  }, [purchaseOrders]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        po.id.toLowerCase().includes(q) ||
        formatOrderNo(po).toLowerCase().includes(q) ||
        (po.outlet?.name && po.outlet.name.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, searchQuery, statusFilter]);

  const handleOpenDispatchModal = (po: PurchaseOrderApi) => {
    setSelectedPO(po);
    const initialDispatch: { [itemId: string]: number } = {};
    po.items.forEach((item) => {
      initialDispatch[item.itemId] = item.dispatchedQuantity || item.orderedQuantity;
    });
    setDispatchInputs(initialDispatch);
    setSupplierNotes(po.supplierNotes || "");
    setIsPartialOrder(po.status === "PARTIALLY_DISPATCHED");
    setExpectedNextDeliveryDate(po.expectedNextDeliveryDate ? po.expectedNextDeliveryDate.split("T")[0] : "");
    setActionModalType("DISPATCH");
  };

  const handleMarkPacking = async (po: PurchaseOrderApi) => {
    try {
      await updateStatus({
        id: po.id,
        status: "PACKING",
        supplierNotes: "Order being packed for delivery",
      }).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update order status");
    }
  };

  const handleConfirmOutOfStock = async () => {
    if (!selectedPO) return;
    if (!supplierNotes.trim()) {
      return alert("Please enter a note explaining the out of stock / unfulfillment reason.");
    }

    try {
      await updateStatus({
        id: selectedPO.id,
        status: "OUT_OF_STOCK",
        supplierNotes,
      }).unwrap();
      setActionModalType(null);
      setSelectedPO(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update order status");
    }
  };

  const handleConfirmDispatch = async () => {
    if (!selectedPO) return;

    const itemsPayload = Object.entries(dispatchInputs).map(([itemId, qty]) => ({
      itemId,
      dispatchedQuantity: Number(qty) >= 0 ? Number(qty) : 0,
    }));

    const targetStatus = isPartialOrder ? "PARTIALLY_DISPATCHED" : "DISPATCHED";

    if (isPartialOrder && !expectedNextDeliveryDate) {
      return alert("Please select expected delivery date for the remaining partial order.");
    }

    try {
      await updateStatus({
        id: selectedPO.id,
        status: targetStatus,
        supplierNotes,
        expectedNextDeliveryDate: isPartialOrder ? expectedNextDeliveryDate : undefined,
        items: itemsPayload,
      }).unwrap();
      setActionModalType(null);
      setSelectedPO(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to record dispatch");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full gap-4 sm:gap-6 max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#D3232A]/10 flex items-center justify-center text-[#D3232A] shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900">
                  Supplier Fulfillment Portal
                </h1>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  Welcome, <span className="font-semibold text-zinc-700">{user?.name}</span>. Manage orders, dispatch quantities &amp; delivery dates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              Verified Vendor
            </span>
          </div>
        </div>

        {/* Executive Overview KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">New Orders to Pack</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 mt-0.5">{activeCount}</h2>
              <p className="text-xs text-amber-600 font-medium mt-0.5">Requires packing / action</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-700 shrink-0 border border-amber-100">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Dispatched Shipments</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 mt-0.5">{dispatchedCount}</h2>
              <p className="text-xs text-blue-600 font-medium mt-0.5">In transit to store</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-700 shrink-0 border border-blue-100">
              <Truck className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Delivered & Received</span>
              <h2 className="text-2xl font-extrabold text-zinc-900 mt-0.5">{completedCount}</h2>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">Fulfilled successfully</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700 shrink-0 border border-emerald-100">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order # or store branch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 pl-9 pr-3 py-2 text-xs text-zinc-800 focus:border-[#D3232A] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-800 bg-white focus:border-[#D3232A] focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Statuses ({purchaseOrders.length})</option>
              <option value="SENT">New Orders</option>
              <option value="PACKING">Packing</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="PARTIALLY_DISPATCHED">Partial Dispatch</option>
              <option value="RECEIVED">Received</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton count={4} height={48} borderRadius={12} />
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-zinc-400 gap-2 p-6 text-center">
              <Package className="h-10 w-10 text-zinc-300" />
              <p className="text-sm font-semibold text-zinc-700">No purchase orders found</p>
              <p className="text-xs text-zinc-400">When stores place purchase orders with your account, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50/90 text-zinc-500 font-bold uppercase tracking-wider border-b border-zinc-200">
                  <tr>
                    <th className="px-5 py-3.5">Order #</th>
                    <th className="px-5 py-3.5">Store Branch</th>
                    <th className="px-4 py-3.5 text-center">Items</th>
                    <th className="px-4 py-3.5 text-right">Total Amount</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-center">Date Received</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-medium">
                  {filteredPOs.map((po) => {
                    const statusBadgeConfig: Record<string, { label: string; cls: string }> = {
                      SENT: { label: "New Order", cls: "bg-sky-50 text-sky-700 border-sky-200" },
                      PACKING: { label: "Packing", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                      DISPATCHED: { label: "Dispatched", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                      PARTIALLY_DISPATCHED: { label: "Partial", cls: "bg-purple-50 text-purple-700 border-purple-200" },
                      RECEIVED: { label: "Completed", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                      OUT_OF_STOCK: { label: "Out of Stock", cls: "bg-rose-50 text-rose-700 border-rose-200" },
                      CLOSED: { label: "Closed", cls: "bg-zinc-100 text-zinc-500 border-zinc-200" },
                    };

                    const badge = statusBadgeConfig[po.status] || { label: po.status, cls: "bg-zinc-100 text-zinc-600 border-zinc-200" };

                    return (
                      <tr key={po.id} className="hover:bg-zinc-50/70 transition-colors">
                        <td className="px-5 py-4 font-mono font-bold text-zinc-900 text-xs">
                          #{formatOrderNo(po)}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 font-bold text-zinc-800">
                            <Building2 className="h-3.5 w-3.5 text-[#D3232A]" />
                            {po.outlet?.name || "Main Outlet"}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center font-bold text-zinc-700">
                          {po.items?.length || 0} SKU(s)
                        </td>

                        <td className="px-4 py-4 text-right font-extrabold text-zinc-900 tabular-nums">
                          ₹{(po.totalAmountPaise / 100).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center text-zinc-500 text-[11px]">
                          {po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : "N/A"}
                        </td>

                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {po.status === "SENT" && (
                              <button
                                onClick={() => handleMarkPacking(po)}
                                className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs"
                              >
                                <Clock className="h-3.5 w-3.5" /> Start Packing
                              </button>
                            )}

                            {(po.status === "SENT" || po.status === "PACKING") && (
                              <>
                                <button
                                  onClick={() => handleOpenDispatchModal(po)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-[#D3232A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors shadow-2xs"
                                >
                                  <Truck className="h-3.5 w-3.5" /> Dispatch Order
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPO(po);
                                    setSupplierNotes("");
                                    setActionModalType("OUT_OF_STOCK");
                                  }}
                                  className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Mark Out of Stock"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {(po.status === "DISPATCHED" || po.status === "PARTIALLY_DISPATCHED" || po.status === "RECEIVED" || po.status === "OUT_OF_STOCK") && (
                              <button
                                onClick={() => {
                                  setSelectedPO(po);
                                  setActionModalType("VIEW");
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5" /> View Details
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL 1: DISPATCH / PARTIAL ORDER MODAL */}
        {actionModalType === "DISPATCH" && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-[#D3232A]/10 text-[#D3232A] flex items-center justify-center">
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                      Dispatch Order #{formatOrderNo(selectedPO)}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      Store: <span className="font-semibold text-zinc-700">{selectedPO.outlet?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-100/80 text-zinc-600 font-bold uppercase tracking-wider border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3">Item Name</th>
                        <th className="px-3 py-3 text-center">Ordered Qty</th>
                        <th className="px-4 py-3 text-right w-36">Dispatched Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/80 font-medium">
                      {selectedPO.items.map((item) => (
                        <tr key={item.itemId}>
                          <td className="px-4 py-3 font-bold text-zinc-900">
                            {item.item?.name || "Inventory Item"}
                            <span className="block text-[10px] font-medium text-zinc-400">{item.item?.category || "General"}</span>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-zinc-700 text-sm">
                            {item.orderedQuantity} {item.item?.unit || "units"}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={item.orderedQuantity}
                              value={dispatchInputs[item.itemId] ?? item.orderedQuantity}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setDispatchInputs((prev) => ({
                                  ...prev,
                                  [item.itemId]: val,
                                }));
                              }}
                              className="w-24 rounded-xl border border-zinc-300 px-3 py-1.5 text-right text-xs font-bold text-zinc-900 focus:border-[#D3232A] focus:outline-none shadow-2xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Partial Order Checkbox */}
                <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 space-y-3 shadow-2xs">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPartialOrder}
                      onChange={(e) => setIsPartialOrder(e.target.checked)}
                      className="rounded-md border-zinc-300 text-[#D3232A] focus:ring-[#D3232A] h-4 w-4"
                    />
                    <span className="text-xs font-black text-purple-950">
                      This is a Partial Order (Remaining items will be sent later)
                    </span>
                  </label>

                  {isPartialOrder && (
                    <div className="pl-6 space-y-2">
                      <label className="block text-xs font-bold text-purple-900">
                        Expected Delivery Date for Remaining Items:
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={expectedNextDeliveryDate}
                        onChange={(e) => setExpectedNextDeliveryDate(e.target.value)}
                        className="rounded-xl border border-purple-300 bg-white px-3.5 py-2 text-xs font-bold text-zinc-800 focus:outline-none shadow-2xs"
                      />
                    </div>
                  )}
                </div>

                {/* Dispatch Notes / Reference */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700">
                    Dispatch Notes / Tracking / Invoice Reference (Optional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter invoice #, delivery driver contact, or dispatch notes..."
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    className="w-full rounded-2xl border border-zinc-200 p-3 text-xs text-zinc-800 focus:border-[#D3232A] focus:outline-none shadow-2xs"
                  />
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 bg-zinc-50/90 border-t border-zinc-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDispatch}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#D3232A] px-5 py-2 text-xs font-bold text-white hover:bg-[#b01e23] disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: OUT OF STOCK REJECTION MODAL */}
        {actionModalType === "OUT_OF_STOCK" && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
              <div className="flex items-center gap-3 px-5 sm:px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 shrink-0">
                <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 tracking-tight">
                    Out of Stock Notice
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">Order #{formatOrderNo(selectedPO)}</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-3 flex-1 overflow-y-auto">
                <p className="text-xs text-zinc-600 leading-relaxed font-medium">
                  Please provide details explaining why this purchase order cannot be fulfilled at this time.
                </p>

                <textarea
                  rows={3}
                  placeholder="Reason (e.g., Raw materials unavailable, factory out of stock until next week)..."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-300 p-3 text-xs text-zinc-900 focus:border-rose-500 focus:outline-none shadow-2xs"
                />
              </div>

              <div className="px-5 sm:px-6 py-4 bg-zinc-50/90 border-t border-zinc-100 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOutOfStock}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Notice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: VIEW ORDER DETAILS */}
        {actionModalType === "VIEW" && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-100 bg-zinc-50/80 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight">
                      Order Details #{formatOrderNo(selectedPO)}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">
                      Store: <span className="font-semibold text-zinc-700">{selectedPO.outlet?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto scrollbar-thin">
                {selectedPO.supplierNotes && (
                  <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-3.5 text-xs text-amber-900 shadow-2xs">
                    <span className="font-bold">Supplier Note:</span> {selectedPO.supplierNotes}
                  </div>
                )}

                {selectedPO.expectedNextDeliveryDate && (
                  <div className="rounded-2xl bg-purple-50/90 border border-purple-200 p-3.5 text-xs text-purple-900 shadow-2xs">
                    <span className="font-bold">Next Expected Delivery:</span> {new Date(selectedPO.expectedNextDeliveryDate).toLocaleDateString()}
                  </div>
                )}

                <div className="rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-600 font-bold border-b border-zinc-200">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-3 py-3 text-center">Ordered</th>
                        <th className="px-3 py-3 text-center">Dispatched</th>
                        <th className="px-3 py-3 text-center">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                      {selectedPO.items.map((item) => (
                        <tr key={item.itemId}>
                          <td className="px-4 py-3 font-bold">{item.item?.name}</td>
                          <td className="px-3 py-3 text-center">{item.orderedQuantity}</td>
                          <td className="px-3 py-3 text-center font-bold text-blue-700">{item.dispatchedQuantity || item.orderedQuantity}</td>
                          <td className="px-3 py-3 text-center font-bold text-emerald-700">{item.receivedQuantity || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-5 sm:px-6 py-4 bg-zinc-50/90 border-t border-zinc-100 flex items-center justify-end shrink-0">
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-bold text-white hover:bg-zinc-800 transition-colors shadow-2xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
