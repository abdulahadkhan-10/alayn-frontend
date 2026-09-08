"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  Order,
} from "@/redux/slices/orderApiSlice";
import { useAppSelector } from "@/redux/store/hooks";
import { useBranch } from "@/lib/BranchContext";
import { fetchTables } from "@/lib/api";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import {
  Utensils,
  Clock,
  CheckCircle,
  Search,
  RefreshCw,
  ChefHat,
  QrCode,
  IndianRupee,
  ChevronRight,
  UserCheck,
  CreditCard,
  Banknote,
  Check,
  X,
  Layers,
  ArrowRight,
  Timer,
  CheckCircle2,
  XCircle,
  Package,
  Printer,
  Receipt,
  User,
} from "lucide-react";
import ThermalReceipt from "@/components/pos/ThermalReceipt";

// ── Status helpers ─────────────────────────────────────────────────────────────

import { useSocket } from "@/lib/useSocket";

type StatusKey =
  | "SENT_TO_KITCHEN"
  | "RECEIVED"
  | "PREPARING"
  | "READY"
  | "SERVED"
  | "DISPATCHED"
  | "COMPLETED"
  | "CANCELLED";

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  SENT_TO_KITCHEN: {
    label: "Sent to Kitchen",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  RECEIVED: {
    label: "Sent to Kitchen",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  PREPARING: {
    label: "Preparing",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  READY: {
    label: "Ready",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  SERVED: {
    label: "Served",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  DISPATCHED: {
    label: "Dispatched",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-300",
    dot: "bg-gray-400",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-400",
  },
};

const getStatusMeta = (status: string) =>
  STATUS_META[status] || STATUS_META["SENT_TO_KITCHEN"];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function LiveOrdersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { activeBranch, branches = [] } = useBranch();
  const currentOutletId =
    activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;
  const isStaffRole = user?.role === "STAFF";
  const isManagerOrOwner =
    user?.role === "MANAGER" ||
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "SUPER_ADMIN";

  // Workforce employee record (staff only)
  const { data: employeesRaw } = useGetEmployeesQuery(
    currentOutletId
      ? { outletId: currentOutletId, limit: 200, offset: 0 }
      : undefined,
    { skip: !currentOutletId || !isStaffRole }
  );
  const allEmployees: any[] = Array.isArray(employeesRaw)
    ? employeesRaw
    : (employeesRaw as any)?.data || [];
  const myEmployee = allEmployees.find((e: any) => e.userId === user?.id);

  const [assignedTableNumbers, setAssignedTableNumbers] = useState<number[]>(
    []
  );

  useEffect(() => {
    async function loadTables() {
      if (!currentOutletId || !isStaffRole) return;
      const res = await fetchTables(currentOutletId);
      if (res.ok && res.tables) {
        const userId = user?.id;
        const empId = myEmployee?.id;
        if (userId || empId) {
          const assigned = res.tables.filter(
            (t) =>
              (t.assignedStaffId &&
                (t.assignedStaffId === userId ||
                  t.assignedStaffId === empId)) ||
              ((t as any).staffId &&
                ((t as any).staffId === userId ||
                  (t as any).staffId === empId))
          );
          setAssignedTableNumbers(assigned.map((t) => t.tableNumber));
        } else {
          setAssignedTableNumbers([]);
        }
      }
    }
    loadTables();
  }, [currentOutletId, myEmployee?.id, user?.id, isStaffRole]);

  const [selectedSourceFilter, setSelectedSourceFilter] =
    useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] =
    useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [printingOrder, setPrintingOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">(
    "UPI"
  );
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  const {
    data: orders = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetOrdersQuery(
    selectedStatusFilter !== "ALL"
      ? { status: selectedStatusFilter }
      : { excludeCompleted: true }
  );

  // Real-time WebSocket connection for live orders
  useSocket(currentOutletId, {
    onKDSUpdate: (data: any) => {
      try {
        refetch();
      } catch (e) {
        // Query might not have completed initial fetch yet
      }
      if (data && data.orderId && data.status) {
        setSelectedOrder((prev) =>
          prev && prev.id === data.orderId ? { ...prev, status: data.status } : prev
        );
      }
    },
  });

  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();

  const handleStatusChange = async (
    orderId: string,
    nextStatus: Order["status"],
    methodOrComment?: "CASH" | "CARD" | "UPI" | string,
    custName?: string,
    custPhone?: string
  ) => {
    try {
      const isPaymentMethod =
        methodOrComment === "CASH" ||
        methodOrComment === "CARD" ||
        methodOrComment === "UPI";
      const updatedResult = await updateOrderStatus({
        id: orderId,
        status: nextStatus,
        comment: methodOrComment,
        paymentMethod: isPaymentMethod ? (methodOrComment as any) : undefined,
        customerName: custName,
        customerPhone: custPhone,
      }).unwrap();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: nextStatus } : null
        );
      }
      refetch();
      return updatedResult;
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const rawList = Array.isArray(orders)
    ? orders
    : (orders as any)?.data && Array.isArray((orders as any).data)
      ? (orders as any).data
      : [];

  // Strictly exclude COMPLETED orders from Live Orders when status filter is "ALL"
  const orderList = selectedStatusFilter === "ALL"
    ? rawList.filter((o: Order) => o.status !== "COMPLETED")
    : rawList;

  const getOrderSource = (order: Order) => {
    const tableNum =
      order.tableNo !== undefined && order.tableNo !== null
        ? Number(order.tableNo)
        : (order as any).tableNumber !== undefined &&
          (order as any).tableNumber !== null
          ? Number((order as any).tableNumber)
          : null;
    const rawSource = order.orderSource || (order as any).source;
    if (rawSource) return String(rawSource).toUpperCase();
    return tableNum !== null ? "TABLE" : "COUNTER";
  };

  const counterOrdersCount = orderList.filter(
    (o: Order) => getOrderSource(o) === "COUNTER"
  ).length;
  const tableOrdersCount = orderList.filter(
    (o: Order) => getOrderSource(o) === "TABLE"
  ).length;

  const filteredOrders = orderList.filter((order: Order) => {
    // If viewing ALL live orders, exclude COMPLETED
    if (selectedStatusFilter === "ALL" && order.status === "COMPLETED") return false;

    const tableNum =
      order.tableNo !== undefined && order.tableNo !== null
        ? Number(order.tableNo)
        : (order as any).tableNumber !== undefined &&
          (order as any).tableNumber !== null
          ? Number((order as any).tableNumber)
          : null;

    if (isStaffRole) {
      if (tableNum === null) return false;
      if (!assignedTableNumbers.includes(tableNum)) return false;
    } else if (selectedSourceFilter !== "ALL") {
      if (getOrderSource(order) !== selectedSourceFilter) return false;
    }

    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.orderNo &&
        order.orderNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ((order as any).orderNumber &&
        (order as any).orderNumber
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (tableNum !== null && String(tableNum).includes(searchQuery));
    return matchesSearch;
  });

  const getItemPrice = (item: any) =>
    ((item.unitPricePaise !== undefined
      ? item.unitPricePaise
      : item.menuItem?.price
        ? item.menuItem.price * 100
        : 0) /
      100) *
    item.quantity;

  // ── Channel card config (scalable) ──────────────────────────────────────────
  const channelTabs = [
    {
      id: "ALL",
      label: "All Channels",
      sublabel: "Every order, unified",
      count: orderList.length,
      icon: Layers,
      activeGradient: "from-[#1B2A4A] to-[#2d4272]",
      activeDot: "bg-white",
    },
    {
      id: "COUNTER",
      label: "Counter Direct",
      sublabel: "Takeaway & quick billing",
      count: counterOrdersCount,
      icon: CreditCard,
      activeGradient: "from-indigo-600 to-indigo-700",
      activeDot: "bg-indigo-200",
    },
    {
      id: "TABLE",
      label: "Table Orders",
      sublabel: "Dine-in floor service",
      count: tableOrdersCount,
      icon: Utensils,
      activeGradient: "from-[#D3232A] to-[#b91c23]",
      activeDot: "bg-rose-200",
    },
    // QR and DELIVERY can be added here when enum values are ready
  ];

  const statusFilterTabs = [
    { id: "ALL", label: "All" },
    { id: "SENT_TO_KITCHEN", label: "Sent" },
    { id: "PREPARING", label: "Preparing" },
    { id: "READY", label: "Ready" },
    { id: "SERVED", label: "Served" },
    { id: "CANCELLED", label: "Cancelled" },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-[1400px] mx-auto flex flex-col gap-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#D3232A]/10 border border-[#D3232A]/20">
                <ChefHat className="w-5 h-5 text-[#D3232A]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[#1B2A4A] leading-tight">
                  Live Orders
                </h1>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {isStaffRole
                    ? "Your assigned table orders"
                    : "Real-time order tracking across all channels"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/orders/completed"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs hover:shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            {isFetching && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#D3232A] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D3232A] animate-pulse" />
                Live
              </span>
            )}
            {isStaffRole && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                {assignedTableNumbers.length > 0
                  ? assignedTableNumbers.map((n) => `T${n}`).join(", ")
                  : "No Tables Assigned"}
              </span>
            )}
          </div>
        </div>

        {/* ── Unified Sticky Filter Header Wrapper ── */}
        <div className="sticky -top-4 sm:-top-6 lg:-top-8 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-2 sm:pb-3 bg-[#F4F7F9]">
          <div className="bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-2xl p-3 sm:p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-3 sm:gap-4">
          
          {/* Top Row: Channels & Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            {/* Channel Tabs */}
            {!isStaffRole && (
              <div className="flex bg-gray-100/80 p-1 rounded-xl w-full sm:w-fit border border-gray-200/50 overflow-x-auto min-w-0">
                {channelTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedSourceFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedSourceFilter(tab.id);
                        setSelectedStatusFilter("ALL");
                      }}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
                        isActive
                          ? "bg-white text-[#1B2A4A] shadow-sm rounded-lg border border-gray-200"
                          : "text-gray-500 hover:text-gray-800 hover:bg-white/50 rounded-lg border border-transparent"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="uppercase tracking-wider">{tab.label}</span>
                      <span
                        className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isActive ? "bg-gray-100 text-[#1B2A4A]" : "bg-gray-200/60 text-gray-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ID or Table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition shadow-xs rounded-xl"
              />
            </div>
          </div>

          {/* Bottom Row: Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
            {statusFilterTabs.map((tab) => {
              const active = selectedStatusFilter === tab.id;
              const meta = tab.id !== "ALL" ? getStatusMeta(tab.id) : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? "bg-[#1B2A4A] text-white shadow-xs"
                      : "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {meta && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${active ? "bg-white/70" : meta.dot}`}
                    />
                  )}
                  {tab.label}
                  {tab.id !== "ALL" && (
                    <span
                      className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {filteredOrders.filter(
                        (o: any) =>
                          o.status === tab.id ||
                          (tab.id === "SENT_TO_KITCHEN" && o.status === "RECEIVED")
                      ).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        </div>

        {/* ── Orders Bento Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-64 bg-white animate-pulse rounded-2xl border border-gray-200 shadow-sm"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <ChefHat className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-[#1B2A4A] uppercase tracking-widest">No active orders</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              {selectedSourceFilter !== "ALL"
                ? `No active ${channelTabs.find((c) => c.id === selectedSourceFilter)?.label.toLowerCase()} match your filters.`
                : "Active orders will appear here in real time."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order: any) => {
              const meta = getStatusMeta(order.status);
              const formattedTime = new Date(order.createdAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              );
              const orderNumDisplay = order.orderNo || order.orderNumber || order.id;
              
              const tableNumDisplay =
                order.tableNo !== undefined && order.tableNo !== null
                  ? order.tableNo
                  : order.tableNumber !== undefined &&
                    order.tableNumber !== null
                    ? order.tableNumber
                    : null;
              const isCounter = tableNumDisplay === null;
              const items = order.orderItems || order.items || [];
              const totalAmt =
                order.totalAmount !== undefined
                  ? order.totalAmount
                  : (order as any).totalPaise !== undefined
                    ? (order as any).totalPaise / 100
                    : 0;

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-2 relative overflow-hidden">
                    {/* Status Top Line indicator */}
                    <div className={`absolute top-0 left-0 w-full h-1 ${meta.bg}`} />
                    
                    <div className="flex flex-col gap-2 relative pt-1">
                      {/* Top Line: Status Badge & Time */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border bg-white ${meta.text} ${meta.border}`}>
                          <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap text-right">
                          {formattedTime}
                        </span>
                      </div>
                      
                      {/* Bottom Area: ID & Table */}
                      <div className="mt-1 flex flex-col gap-1">
                        <span className="text-[15px] font-bold text-[#1B2A4A] font-mono tracking-tight break-all">
                          {orderNumDisplay}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                          {isCounter ? "COUNTER ORDER" : `TABLE ${tableNumDisplay}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Bento Space */}
                  <div className="p-4 flex-1 flex flex-col gap-2">
                    {items.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {(() => {
                          const consolidatedMap = new Map<string, { item: any; totalQty: number }>();
                          items.forEach((item: any) => {
                            const key = item.menuItemId || item.menuItem?.id || item.menuItem?.name || item.name || "unknown";
                            const qty = item.quantity || 1;
                            if (consolidatedMap.has(key)) {
                              consolidatedMap.get(key)!.totalQty += qty;
                            } else {
                              consolidatedMap.set(key, { item, totalQty: qty });
                            }
                          });
                          
                          const uniqueItems = Array.from(consolidatedMap.values());
                          const displayItems = uniqueItems.slice(0, 4);
                          const remaining = uniqueItems.length - 4;

                          return (
                            <>
                              {displayItems.map(({ item, totalQty }, idx: number) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-bold rounded-lg max-w-full truncate">
                                  <span className="text-[#1B2A4A] font-bold">{totalQty}×</span>
                                  <span className="truncate ml-1">{item.menuItem?.name || item.name || "Item"}</span>
                                </span>
                              ))}
                              {remaining > 0 && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-100 text-gray-400 text-[10px] font-bold rounded-lg italic">
                                  +{remaining} more
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center p-4">
                        <span className="italic text-[11px] text-gray-400">No items recorded</span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer (Totals & Actions) */}
                  <div className="p-4 pt-3 border-t border-gray-100 bg-white flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Total</span>
                      <span className="text-base font-bold text-[#1B2A4A] font-mono">₹{Number(totalAmt).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedOrder(order)} className="flex-1 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-bold rounded-xl transition-colors text-center">
                        Details
                      </button>
                      
                      {!isStaffRole && (order.status === "SENT_TO_KITCHEN" || order.status === "RECEIVED") && (
                        <button onClick={() => handleStatusChange(order.id, "PREPARING")} disabled={isUpdating} className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-xl transition-colors text-center shadow-xs">
                          Start Prep
                        </button>
                      )}
                      {!isStaffRole && order.status === "PREPARING" && (
                        <button onClick={() => handleStatusChange(order.id, "READY")} disabled={isUpdating} className="flex-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-xl transition-colors text-center shadow-xs">
                          Mark Ready
                        </button>
                      )}
                      {order.status === "READY" && (
                        <button onClick={() => handleStatusChange(order.id, "SERVED")} disabled={isUpdating} className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-bold rounded-xl transition-colors text-center shadow-xs">
                          Mark Served
                        </button>
                      )}
                      {order.status === "SERVED" && (
                        <button onClick={() => { setCustomerName(order.customerName || ""); setCustomerPhone(order.customerPhone || ""); setSettlingOrder(order); }} disabled={isUpdating} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1B2A4A] hover:bg-black text-white text-[11px] font-bold rounded-xl transition-all shadow-sm active:translate-y-[1px]">
                          <Printer className="w-3.5 h-3.5" />
                          Settle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Modal: Full Order Details ── */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full shadow-2xl overflow-hidden">
              {/* Modal header */}
              <div className="flex justify-between items-center p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${selectedOrder.tableNo ||
                      (selectedOrder as any).tableNumber
                      ? "bg-[#D3232A]/10"
                      : "bg-indigo-50"
                      }`}
                  >
                    {selectedOrder.tableNo ||
                      (selectedOrder as any).tableNumber ? (
                      <Utensils className="w-4 h-4 text-[#D3232A]" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1B2A4A]">
                      {selectedOrder.orderNo ||
                        (selectedOrder as any).orderNumber ||
                        `#${selectedOrder.id.slice(0, 8).toUpperCase()}`}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {selectedOrder.tableNo ||
                        (selectedOrder as any).tableNumber
                        ? `Table ${selectedOrder.tableNo || (selectedOrder as any).tableNumber}`
                        : "Counter Direct"}{" "}
                      ·{" "}
                      {new Date(selectedOrder.createdAt).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" }
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Status banner */}
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${getStatusMeta(selectedOrder.status).bg
                    } ${getStatusMeta(selectedOrder.status).border}`}
                >
                  <span
                    className={`text-xs font-bold ${getStatusMeta(selectedOrder.status).text}`}
                  >
                    Kitchen Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusMeta(selectedOrder.status).bg
                      } ${getStatusMeta(selectedOrder.status).text} ${getStatusMeta(selectedOrder.status).border
                      }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(selectedOrder.status).dot}`}
                    />
                    {getStatusMeta(selectedOrder.status).label}
                  </span>
                </div>

                {/* Items */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Ordered Items
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      const modalItems = selectedOrder.orderItems || (selectedOrder as any).items || [];
                      const modalConsolidated = new Map<string, { item: any; totalQty: number; totalPrice: number; notes: string[] }>();
                      modalItems.forEach((item: any) => {
                        const key = item.menuItemId || item.menuItem?.id || item.menuItem?.name || item.name || "unknown";
                        const qty = item.quantity || 1;
                        const price = getItemPrice(item);
                        if (modalConsolidated.has(key)) {
                          const existing = modalConsolidated.get(key)!;
                          existing.totalQty += qty;
                          existing.totalPrice += price;
                          if (item.notes && !existing.notes.includes(item.notes)) {
                            existing.notes.push(item.notes);
                          }
                        } else {
                          modalConsolidated.set(key, { item, totalQty: qty, totalPrice: price, notes: item.notes ? [item.notes] : [] });
                        }
                      });

                      return Array.from(modalConsolidated.values()).map(({ item, totalQty, totalPrice, notes }, idx: number) => (
                        <div
                          key={item.id || idx}
                          className="flex justify-between items-start p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#1B2A4A] block">
                              <span className="text-[#D3232A] mr-1 font-bold">
                                {totalQty}×
                              </span>
                              {item.menuItem?.name || item.name || "Dish Item"}
                            </span>
                            {notes.length > 0 && (
                              <span className="text-[10px] text-gray-400 italic mt-0.5 block">
                                {notes.join(", ")}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-gray-700">
                            ₹{totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Bill summary */}
                {(() => {
                  const subtotalVal =
                    selectedOrder.subtotal !== undefined
                      ? selectedOrder.subtotal
                      : (selectedOrder as any).subtotalPaise !== undefined
                        ? (selectedOrder as any).subtotalPaise / 100
                        : 0;

                  const totalVal =
                    selectedOrder.totalAmount !== undefined
                      ? selectedOrder.totalAmount
                      : (selectedOrder as any).totalPaise !== undefined
                        ? (selectedOrder as any).totalPaise / 100
                        : 0;

                  const discountVal =
                    selectedOrder.discountAmount !== undefined
                      ? selectedOrder.discountAmount
                      : (selectedOrder as any).discountPaise !== undefined
                        ? (selectedOrder as any).discountPaise / 100
                        : 0;

                  let taxVal =
                    selectedOrder.taxAmount !== undefined
                      ? selectedOrder.taxAmount
                      : (selectedOrder as any).taxPaise !== undefined
                        ? (selectedOrder as any).taxPaise / 100
                        : 0;

                  if (taxVal === 0 && totalVal > 0 && subtotalVal > 0 && totalVal >= (subtotalVal - discountVal)) {
                    taxVal = Math.max(0, totalVal - (subtotalVal - discountVal));
                  }

                  const cgstVal =
                    selectedOrder.cgstAmount !== undefined
                      ? selectedOrder.cgstAmount
                      : (selectedOrder as any).cgstPaise !== undefined
                        ? (selectedOrder as any).cgstPaise / 100
                        : 0;

                  const sgstVal =
                    selectedOrder.sgstAmount !== undefined
                      ? selectedOrder.sgstAmount
                      : (selectedOrder as any).sgstPaise !== undefined
                        ? (selectedOrder as any).sgstPaise / 100
                        : 0;

                  const serviceTaxVal =
                    (selectedOrder as any).serviceTaxAmount !== undefined
                      ? (selectedOrder as any).serviceTaxAmount
                      : (selectedOrder as any).serviceTaxPaise !== undefined
                        ? (selectedOrder as any).serviceTaxPaise / 100
                        : 0;

                  const cgstPct = subtotalVal > 0 ? Number(((cgstVal / subtotalVal) * 100).toFixed(2)) : 0;
                  const sgstPct = subtotalVal > 0 ? Number(((sgstVal / subtotalVal) * 100).toFixed(2)) : 0;
                  const serviceTaxPct = subtotalVal > 0 ? Number(((serviceTaxVal / subtotalVal) * 100).toFixed(2)) : 0;
                  const totalTaxPct = Number((cgstPct + sgstPct + serviceTaxPct).toFixed(2));

                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600 font-medium">
                        <span>Actual Amount (Subtotal)</span>
                        <span className="font-semibold text-gray-800">
                          ₹{subtotalVal.toFixed(2)}
                        </span>
                      </div>

                      {discountVal > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount</span>
                          <span className="font-semibold">
                            - ₹{discountVal.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-gray-600 font-medium items-baseline">
                        <div className="flex flex-col">
                          <span>Tax Amount ({serviceTaxVal > 0 ? "GST & Taxes" : "GST"}{totalTaxPct > 0 ? ` ${totalTaxPct}%` : ""})</span>
                          {(cgstVal > 0 || sgstVal > 0 || serviceTaxVal > 0) && (
                            <span className="text-[10px] text-gray-400 font-normal">
                              ({[
                                cgstVal > 0 ? `CGST${cgstPct > 0 ? ` ${cgstPct}%` : ""}: ₹${cgstVal.toFixed(2)}` : null,
                                sgstVal > 0 ? `SGST${sgstPct > 0 ? ` ${sgstPct}%` : ""}: ₹${sgstVal.toFixed(2)}` : null,
                                serviceTaxVal > 0 ? `Service Tax${serviceTaxPct > 0 ? ` ${serviceTaxPct}%` : ""}: ₹${serviceTaxVal.toFixed(2)}` : null,
                              ].filter(Boolean).join(" + ")})
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-gray-800">
                          ₹{taxVal.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between font-bold text-sm text-[#1B2A4A] pt-2 border-t border-gray-200">
                        <span>Overall Total</span>
                        <span className="text-[#D3232A]">
                          ₹{totalVal.toFixed(2)}
                        </span>
                      </div>

                      {selectedOrder.paymentMethod && (
                        <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between text-[11px]">
                          <span className="text-gray-500 font-medium">Payment Method</span>
                          <span className="inline-flex items-center gap-1 font-bold text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
                            {selectedOrder.paymentMethod}
                            {selectedOrder.status === "COMPLETED" && (
                              <span className="text-emerald-600 font-bold ml-1">✓ Paid</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                {selectedOrder.status !== "COMPLETED" &&
                  selectedOrder.status !== "CANCELLED" && (
                    <>
                      <button
                        onClick={() => {
                          setCancellingOrder(selectedOrder);
                          setSelectedOrder(null);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-2.5 px-3 text-xs rounded-xl transition cursor-pointer"
                      >
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Cancel Order
                      </button>
                      <button
                        onClick={() => {
                          setCustomerName(selectedOrder.customerName || "");
                          setCustomerPhone(selectedOrder.customerPhone || "");
                          setSettlingOrder(selectedOrder);
                          setSelectedOrder(null);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 text-xs rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-emerald-200" />
                        Settle & Print Bill
                      </button>
                    </>
                  )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Settle Payment & Generate Thermal Invoice ── */}
        {settlingOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => { if (e.target === e.currentTarget) setSettlingOrder(null); }}
          >
            <div className="bg-white rounded-2xl border border-slate-200/90 max-w-md w-full shadow-xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]">
              {/* Clean Modal Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                    <Receipt className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      Checkout & Settle Bill
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Bill #{settlingOrder.orderNo || (settlingOrder as any).orderNumber || settlingOrder.id.slice(0, 8).toUpperCase()} • {settlingOrder.tableNo || (settlingOrder as any).tableNumber ? `Table ${settlingOrder.tableNo || (settlingOrder as any).tableNumber}` : "Counter"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSettlingOrder(null)}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Total Amount Summary Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
                      Amount Due
                    </span>
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">
                      ₹
                      {(
                        settlingOrder.totalAmount !== undefined
                          ? settlingOrder.totalAmount
                          : (settlingOrder as any).totalPaise !== undefined
                            ? (settlingOrder as any).totalPaise / 100
                            : 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Unpaid
                  </span>
                </div>

                {/* Customer Details Form */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Customer Details (Optional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800 transition placeholder:text-slate-400"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-slate-800 transition placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "UPI", label: "UPI / QR", icon: QrCode },
                        { value: "CASH", label: "Cash", icon: Banknote },
                        { value: "CARD", label: "Card", icon: CreditCard },
                      ] as const
                    ).map(({ value, label, icon: Icon }) => {
                      const isSelected = paymentMethod === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setPaymentMethod(value)}
                          className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Clean Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setPrintingOrder({
                      ...settlingOrder,
                      customerName: customerName.trim() || settlingOrder.customerName,
                      customerPhone: customerPhone.trim() || settlingOrder.customerPhone,
                      paymentMethod,
                      outlet: branches.find((b) => b.id === settlingOrder.outletId) || activeBranch,
                    });
                  }}
                  className="px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5 text-slate-500" />
                  Pre-Bill
                </button>

                <button
                  onClick={async () => {
                    const orderId = settlingOrder.id;
                    const cName = customerName.trim() || undefined;
                    const cPhone = customerPhone.trim() || undefined;
                    const targetOrder = settlingOrder;

                    const updatedResult = await handleStatusChange(
                      orderId,
                      "COMPLETED",
                      paymentMethod,
                      cName,
                      cPhone
                    );

                    if (updatedResult) {
                      setSettlingOrder(null);
                      setPrintingOrder({
                        ...updatedResult,
                        status: "COMPLETED",
                        paymentMethod,
                        customerName: cName || targetOrder.customerName,
                        customerPhone: cPhone || targetOrder.customerPhone,
                        outlet: branches.find((b) => b.id === targetOrder.outletId) || activeBranch,
                      });
                    }
                  }}
                  disabled={isUpdating}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-4 text-xs rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  Settle & Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Printable Thermal Receipt Modal ── */}
        {printingOrder && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm receipt-backdrop-animation"
            onClick={(e) => { if (e.target === e.currentTarget) setPrintingOrder(null); }}
          >
            <div className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)] border border-white/10 receipt-modal-animation">
              <ThermalReceipt
                order={printingOrder}
                onClose={() => setPrintingOrder(null)}
              />
            </div>
          </div>
        )}

        {/* ── Modal: Cancel Order Confirmation ── */}
        {cancellingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <XCircle className="w-6 h-6 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1B2A4A]">
                    Cancel Order
                  </h3>
                  <p className="text-xs text-gray-500 font-bold font-mono">
                    {cancellingOrder.orderNo ||
                      (cancellingOrder as any).orderNumber ||
                      `#${cancellingOrder.id.slice(0, 8)}`}
                  </p>
                </div>
              </div>

              <div className="bg-rose-50/80 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-900 space-y-1">
                <p className="font-bold">
                  Are you sure you want to cancel this order?
                </p>
                <p className="text-[11px] text-rose-700 font-medium">
                  The order status will be updated to <strong className="font-extrabold uppercase">CANCELLED</strong> and any linked table will be marked as available.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={async () => {
                    const idToCancel = cancellingOrder.id;
                    setCancellingOrder(null);
                    await handleStatusChange(idToCancel, "CANCELLED");
                  }}
                  disabled={isUpdating}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-3 text-xs rounded-xl transition shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Yes, Cancel Order
                </button>
                <button
                  onClick={() => setCancellingOrder(null)}
                  className="px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Keep Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
