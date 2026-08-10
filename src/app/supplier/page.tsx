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
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Building2,
  FileText,
  Send,
  Loader2,
  Eye,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import Skeleton from "react-loading-skeleton";

function formatOrderNo(po: { id: string; poNumber?: string; createdAt?: string }): string {
  if (po.poNumber) return po.poNumber;
  const shortHash = po.id.slice(0, 5).toUpperCase();
  return `PO-${shortHash}`;
}

export default function SupplierPortalPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { data: purchaseOrders = [], isLoading, refetch } = useGetSupplierPortalOrdersQuery();
  const [updateStatus, { isLoading: isUpdating }] = useUpdateSupplierPOStatusMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ACTION" | "DISPATCHED" | "RECEIVED" | "ALL">("ACTION");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderApi | null>(null);
  const [actionModalType, setActionModalType] = useState<"DISPATCH" | "OUT_OF_STOCK" | "VIEW" | null>(null);

  // Form states for dispatch / partial
  const [dispatchInputs, setDispatchInputs] = useState<{ [itemId: string]: number }>({});
  const [supplierNotes, setSupplierNotes] = useState("");
  const [isPartialOrder, setIsPartialOrder] = useState(false);
  const [expectedNextDeliveryDate, setExpectedNextDeliveryDate] = useState("");

  // Metrics
  const actionRequiredCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "SENT" || po.status === "PACKING").length;
  }, [purchaseOrders]);

  const dispatchedCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "DISPATCHED" || po.status === "PARTIALLY_DISPATCHED").length;
  }, [purchaseOrders]);

  const completedCount = useMemo(() => {
    return purchaseOrders.filter((po) => po.status === "RECEIVED").length;
  }, [purchaseOrders]);

  // Tab Filtering logic
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        po.id.toLowerCase().includes(q) ||
        formatOrderNo(po).toLowerCase().includes(q) ||
        (po.outlet?.name && po.outlet.name.toLowerCase().includes(q)) ||
        (po.supplier?.name && po.supplier.name.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === "ACTION") {
        matchesTab = po.status === "SENT" || po.status === "PACKING";
      } else if (activeTab === "DISPATCHED") {
        matchesTab = po.status === "DISPATCHED" || po.status === "PARTIALLY_DISPATCHED";
      } else if (activeTab === "RECEIVED") {
        matchesTab = po.status === "RECEIVED";
      }

      return matchesSearch && matchesTab;
    });
  }, [purchaseOrders, searchQuery, activeTab]);

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
        supplierNotes: "Order is currently being packed for delivery",
      }).unwrap();
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || "Failed to update order status");
    }
  };

  const handleConfirmOutOfStock = async () => {
    if (!selectedPO) return;
    if (!supplierNotes.trim()) {
      return alert("Please enter a short note explaining why this order is out of stock.");
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
      dispatchedQuantity: Math.max(0, Number(qty) || 0),
    }));

    const totalDispatched = itemsPayload.reduce((sum, item) => sum + item.dispatchedQuantity, 0);
    if (totalDispatched <= 0) {
      return alert("Dispatched quantity must be greater than 0 for at least one item.");
    }

    let isPartial = isPartialOrder;
    selectedPO.items.forEach((poItem) => {
      const dispatched = dispatchInputs[poItem.itemId] ?? poItem.orderedQuantity;
      if (dispatched < poItem.orderedQuantity) {
        isPartial = true;
      }
    });

    if (isPartial && !expectedNextDeliveryDate) {
      setIsPartialOrder(true);
      return alert("This is a partial order. Please select an expected delivery date for remaining items.");
    }

    const targetStatus = isPartial ? "PARTIALLY_DISPATCHED" : "DISPATCHED";

    try {
      await updateStatus({
        id: selectedPO.id,
        status: targetStatus,
        supplierNotes,
        expectedNextDeliveryDate: isPartial ? expectedNextDeliveryDate : undefined,
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
      <div className="flex flex-col h-full gap-4 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pb-10 text-zinc-900">
        
        {/* Streamlined Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                Supplier Portal
              </h1>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                Verified Vendor
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              Welcome, <span className="text-zinc-800 font-semibold">{user?.name || "Supplier Partner"}</span>. Manage store orders, dispatch quantities, and delivery updates.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200 text-xs shrink-0">
            <div className="text-center px-2">
              <span className="text-zinc-500 font-medium block text-[10px] uppercase tracking-wider">Action Needed</span>
              <span className="font-extrabold text-amber-600 text-sm">{actionRequiredCount}</span>
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="text-center px-2">
              <span className="text-zinc-500 font-medium block text-[10px] uppercase tracking-wider">In Transit</span>
              <span className="font-extrabold text-indigo-600 text-sm">{dispatchedCount}</span>
            </div>
            <div className="h-6 w-px bg-zinc-200" />
            <div className="text-center px-2">
              <span className="text-zinc-500 font-medium block text-[10px] uppercase tracking-wider">Completed</span>
              <span className="font-extrabold text-emerald-600 text-sm">{completedCount}</span>
            </div>
          </div>
        </div>

        {/* Action Filter Tabs & Search Bar (Single Row) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs">
          
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("ACTION")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "ACTION"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              Needs Action
              {actionRequiredCount > 0 && (
                <span className="rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-extrabold">
                  {actionRequiredCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("DISPATCHED")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === "DISPATCHED"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              In Transit ({dispatchedCount})
            </button>

            <button
              onClick={() => setActiveTab("RECEIVED")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === "RECEIVED"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              Completed ({completedCount})
            </button>

            <button
              onClick={() => setActiveTab("ALL")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                activeTab === "ALL"
                  ? "bg-zinc-900 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              All Orders ({purchaseOrders.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by PO # or store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-8 pr-3 py-1.5 text-xs text-zinc-800 focus:bg-white focus:border-[#D3232A] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Orders Table Container - Fits clean in frame */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <Skeleton count={4} height={45} borderRadius={10} />
            </div>
          ) : filteredPOs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2 px-6 text-center">
              <Package className="h-8 w-8 text-zinc-300" />
              <p className="text-sm font-bold text-zinc-700">No orders in this view</p>
              <p className="text-xs text-zinc-400 max-w-xs">
                {activeTab === "ACTION"
                  ? "All pending orders have been processed."
                  : "Try clearing search filter or selecting another tab."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse table-fixed min-w-[920px]">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[11px] border-b border-zinc-200">
                    <th className="px-4 py-3 w-[14%]">Order #</th>
                    <th className="px-4 py-3 w-[18%]">Store Branch</th>
                    <th className="px-3 py-3 text-center w-[10%]">Items</th>
                    <th className="px-4 py-3 text-right w-[13%]">Total Cost</th>
                    <th className="px-3 py-3 text-center w-[12%]">Status</th>
                    <th className="px-4 py-3 text-center w-[13%]">Date</th>
                    <th className="px-4 py-3 text-right w-[20%]">Action</th>
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
                        
                        {/* Order # - NO CUTOFF */}
                        <td className="px-4 py-3.5 whitespace-nowrap font-mono font-bold text-zinc-900 text-xs">
                          #{formatOrderNo(po)}
                        </td>

                        {/* Store Branch */}
                        <td className="px-4 py-3.5 font-bold text-zinc-800 whitespace-nowrap overflow-hidden">
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[170px]">
                            <Building2 className="h-3.5 w-3.5 text-[#D3232A] shrink-0" />
                            {po.supplier?.name || po.outlet?.name || "Main Branch"}
                          </span>
                        </td>

                        {/* Items */}
                        <td className="px-3 py-3.5 text-center font-bold text-zinc-700 whitespace-nowrap">
                          {po.items?.length || 0} SKU(s)
                        </td>

                        {/* Total Cost */}
                        <td className="px-4 py-3.5 text-right font-extrabold text-zinc-900 tabular-nums whitespace-nowrap">
                          ₹{(po.totalAmountPaise / 100).toFixed(2)}
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.cls}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-center text-zinc-500 text-[11px] whitespace-nowrap">
                          {po.createdAt ? new Date(po.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                          }) : "N/A"}
                        </td>

                        {/* Actions - Strictly 1 Primary Action Per Status */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            
                            {/* Step 1: When SENT -> Only Pack Order */}
                            {po.status === "SENT" && (
                              <>
                                <button
                                  onClick={() => handleMarkPacking(po)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-2xs"
                                >
                                  <Clock className="h-3.5 w-3.5" /> Start Packing
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPO(po);
                                    setSupplierNotes("");
                                    setActionModalType("OUT_OF_STOCK");
                                  }}
                                  className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                                  title="Report Out of Stock"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* Step 2: When PACKING -> Only Dispatch Shipment */}
                            {po.status === "PACKING" && (
                              <>
                                <button
                                  onClick={() => handleOpenDispatchModal(po)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#D3232A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#b01e23] transition-colors shadow-2xs"
                                >
                                  <Truck className="h-3.5 w-3.5" /> Dispatch Shipment
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedPO(po);
                                    setSupplierNotes("");
                                    setActionModalType("OUT_OF_STOCK");
                                  }}
                                  className="p-1 text-zinc-400 hover:text-rose-600 transition-colors"
                                  title="Report Out of Stock"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}

                            {/* Completed / Dispatched / Viewed Details */}
                            {(po.status === "DISPATCHED" || po.status === "PARTIALLY_DISPATCHED" || po.status === "RECEIVED" || po.status === "OUT_OF_STOCK" || po.status === "CLOSED") && (
                              <button
                                onClick={() => {
                                  setSelectedPO(po);
                                  setActionModalType("VIEW");
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors shadow-2xs"
                              >
                                <Eye className="h-3.5 w-3.5 text-zinc-500" /> View Details
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

        {/* MODAL 1: DISPATCH SHIPMENT MODAL */}
        {actionModalType === "DISPATCH" && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] animate-in fade-in duration-150 overflow-hidden">
              
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-[#D3232A]/10 text-[#D3232A] flex items-center justify-center">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900">
                      Dispatch Order #{formatOrderNo(selectedPO)}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium">Store: {selectedPO.outlet?.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 text-zinc-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                <div className="rounded-xl border border-zinc-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase tracking-wider border-b border-zinc-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Item Name</th>
                        <th className="px-3 py-2.5 text-center">Ordered</th>
                        <th className="px-3.5 py-2.5 text-right w-36">Dispatched Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium">
                      {selectedPO.items.map((item) => {
                        const currentVal = dispatchInputs[item.itemId] ?? item.orderedQuantity;
                        return (
                          <tr key={item.itemId}>
                            <td className="px-3.5 py-2.5 font-bold text-zinc-900">
                              {item.item?.name || "Inventory Item"}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-zinc-700">
                              {item.orderedQuantity} {item.item?.unit || "units"}
                            </td>
                            <td className="px-3.5 py-2.5 text-right">
                              <div className="inline-flex items-center gap-1 border border-zinc-300 rounded-lg p-0.5 bg-zinc-50">
                                <button
                                  type="button"
                                  onClick={() => setDispatchInputs((prev) => ({ ...prev, [item.itemId]: Math.max(0, currentVal - 1) }))}
                                  className="h-6 w-6 rounded bg-white text-zinc-700 border border-zinc-200 flex items-center justify-center font-bold"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={item.orderedQuantity}
                                  value={currentVal}
                                  onChange={(e) => setDispatchInputs((prev) => ({ ...prev, [item.itemId]: Number(e.target.value) }))}
                                  className="w-12 text-center text-xs font-bold text-zinc-900 bg-transparent focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setDispatchInputs((prev) => ({ ...prev, [item.itemId]: Math.min(item.orderedQuantity, currentVal + 1) }))}
                                  className="h-6 w-6 rounded bg-white text-zinc-700 border border-zinc-200 flex items-center justify-center font-bold"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPartialOrder}
                      onChange={(e) => setIsPartialOrder(e.target.checked)}
                      className="rounded border-purple-300 text-[#D3232A] h-4 w-4"
                    />
                    <span className="text-xs font-bold text-purple-950">
                      Partial Order (Remaining items sent later)
                    </span>
                  </label>

                  {isPartialOrder && (
                    <div className="pl-6 space-y-1">
                      <label className="block text-[11px] font-bold text-purple-900">
                        Expected Date for Remaining Items:
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={expectedNextDeliveryDate}
                        onChange={(e) => setExpectedNextDeliveryDate(e.target.value)}
                        className="rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-xs font-bold text-zinc-900"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-zinc-700">
                    Dispatch Reference / Notes (Optional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Invoice #, driver phone, or delivery note..."
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                    className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDispatch}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#D3232A] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#b01e23] disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Confirm Dispatch
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 2: OUT OF STOCK NOTICE */}
        {actionModalType === "OUT_OF_STOCK" && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] overflow-hidden">
              
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-100 bg-rose-50 text-rose-950">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
                <h3 className="text-base font-bold text-rose-900">
                  Report Out of Stock
                </h3>
              </div>

              <div className="p-5 space-y-3 flex-1 overflow-y-auto">
                <p className="text-xs text-zinc-600 font-medium">
                  Provide a quick reason why order #{formatOrderNo(selectedPO)} cannot be fulfilled.
                </p>

                <textarea
                  rows={3}
                  placeholder="Reason for out of stock..."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 p-2.5 text-xs text-zinc-900 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOutOfStock}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Submit Notice
                </button>
              </div>

            </div>
          </div>
        )}

        {/* MODAL 3: VIEW ORDER DETAILS */}
        {actionModalType === "VIEW" && selectedPO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-zinc-200 flex flex-col max-h-[85vh] overflow-hidden">
              
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-900 text-white">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4.5 w-4.5 text-zinc-300" />
                  <h3 className="text-base font-bold">
                    Order Details #{formatOrderNo(selectedPO)}
                  </h3>
                </div>
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                {selectedPO.supplierNotes && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                    <span className="font-bold">Supplier Note:</span> {selectedPO.supplierNotes}
                  </div>
                )}

                <div className="rounded-xl border border-zinc-200 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 text-zinc-600 font-bold uppercase tracking-wider border-b border-zinc-200">
                      <tr>
                        <th className="px-3.5 py-2.5">Item</th>
                        <th className="px-3 py-2.5 text-center">Ordered</th>
                        <th className="px-3 py-2.5 text-center">Dispatched</th>
                        <th className="px-3 py-2.5 text-center">Received</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 font-medium text-zinc-800">
                      {selectedPO.items.map((item) => (
                        <tr key={item.itemId}>
                          <td className="px-3.5 py-2.5 font-bold text-zinc-900">{item.item?.name}</td>
                          <td className="px-3 py-2.5 text-center font-semibold text-zinc-700">{item.orderedQuantity}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-indigo-700">{item.dispatchedQuantity || item.orderedQuantity}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{item.receivedQuantity || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end">
                <button
                  onClick={() => setActionModalType(null)}
                  className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-zinc-800"
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
