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
    bg: "bg-white",
    text: "text-[#1B2A4A]",
    border: "border-gray-300",
    dot: "bg-gray-400",
  },
  RECEIVED: {
    label: "Received",
    bg: "bg-white",
    text: "text-[#1B2A4A]",
    border: "border-gray-300",
    dot: "bg-gray-400",
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
    dot: "bg-emerald-400",
  },
  SERVED: {
    label: "Served",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-400",
  },
  DISPATCHED: {
    label: "Dispatched",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  COMPLETED: {
    label: "Completed",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-400",
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
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-5">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#D3232A]/10 border border-[#D3232A]/20">
                <ChefHat className="w-5 h-5 text-[#D3232A]" />
              </div>
              <div>
                <h1 className="text-xl font-black text-[#1B2A4A] leading-tight">
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

        {/* ── Channel Filter Cards (Manager / Owner only) ── */}
        {!isStaffRole && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  className={`relative overflow-hidden flex items-center justify-between p-4 rounded-2xl border transition-all text-left cursor-pointer group ${isActive
                    ? `bg-gradient-to-br ${tab.activeGradient} text-white shadow-lg border-transparent`
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-200 shadow-xs hover:shadow-sm hover:border-gray-300"
                    }`}
                >
                  {/* Decorative blob */}
                  {isActive && (
                    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/5" />
                  )}
                  <div className="flex items-center gap-3 relative z-10">
                    <div
                      className={`p-2.5 rounded-xl transition ${isActive
                        ? "bg-white/15"
                        : "bg-gray-100 group-hover:bg-gray-200"
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black leading-tight">
                        {tab.label}
                      </p>
                      <p
                        className={`text-[10px] font-medium mt-0.5 ${isActive ? "text-white/70" : "text-gray-400"
                          }`}
                      >
                        {tab.sublabel}
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 flex flex-col items-end gap-1">
                    <span
                      className={`text-2xl font-black leading-none ${isActive ? "text-white" : "text-[#1B2A4A]"
                        }`}
                    >
                      {tab.count}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-white/60" : "text-gray-400"
                        }`}
                    >
                      orders
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Status Sub-filter bar + Search ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border-y border-gray-200 p-3 shadow-sm">
          {/* Status pill tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
            {statusFilterTabs.map((tab) => {
              const active = selectedStatusFilter === tab.id;
              const meta = tab.id !== "ALL" ? getStatusMeta(tab.id) : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shadow-[2px_2px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none ${active
                    ? "bg-[#1B2A4A] text-white border-[#1B2A4A]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                >
                  {meta && (
                    <span
                      className={`w-1.5 h-1.5 rounded-none ${active ? "bg-white" : meta.dot}`}
                    />
                  )}
                  {tab.label}
                  {tab.id !== "ALL" && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 font-mono ml-1 border ${active
                        ? "bg-white/20 text-white border-white/20"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                    >
                      {
                        filteredOrders.filter(
                          (o: any) =>
                            o.status === tab.id ||
                            (tab.id === "SENT_TO_KITCHEN" &&
                              o.status === "RECEIVED")
                        ).length
                      }
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="TABLE # OR ORDER ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-gray-200 rounded-none text-xs font-black font-mono tracking-widest text-gray-900 focus:outline-none focus:border-[#1B2A4A] transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.05)] uppercase placeholder-gray-400"
            />
          </div>
        </div>

        {/* ── Results count ── */}
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-500 font-semibold">
            Showing{" "}
            <span className="text-[#1B2A4A] font-black">
              {filteredOrders.length}
            </span>{" "}
            order{filteredOrders.length !== 1 ? "s" : ""}
            {selectedSourceFilter !== "ALL" && (
              <span className="text-gray-400">
                {" "}
                ·{" "}
                {
                  channelTabs.find((c) => c.id === selectedSourceFilter)?.label
                }
              </span>
            )}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-[11px] text-[#D3232A] font-bold hover:underline"
            >
              Clear search
            </button>
          )}
        </div>

        {/* ── Orders Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-52 bg-gray-100 animate-pulse rounded-2xl border border-gray-200"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center space-y-3 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <ChefHat className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-sm font-bold text-gray-700">No orders found</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {selectedSourceFilter !== "ALL"
                ? `No ${channelTabs.find((c) => c.id === selectedSourceFilter)?.label.toLowerCase()} orders match the current filters.`
                : "Orders placed by staff or customers will appear here in real time."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order: any) => {
              const meta = getStatusMeta(order.status);
              const formattedTime = new Date(order.createdAt).toLocaleTimeString(
                [],
                { hour: "2-digit", minute: "2-digit" }
              );
              const rawOrderNo =
                order.orderNo ||
                order.orderNumber ||
                order.id.toUpperCase();
              const orderNumDisplay =
                rawOrderNo.length > 8
                  ? `#${rawOrderNo.slice(-6)}`
                  : rawOrderNo.startsWith("#")
                  ? rawOrderNo
                  : `#${rawOrderNo}`;
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
                  className="bg-white border border-gray-200 shadow-sm transition-all flex flex-col p-4 space-y-4 rounded-xl relative hover:shadow-md"
                >
                  {/* Header row */}
                  <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                    <div className="flex flex-col pr-2">
                      <span className="text-lg font-bold text-gray-900 leading-tight break-all">
                        {orderNumDisplay}
                      </span>
                      <span className="text-xs text-gray-500 font-medium mt-1">
                        TBL: <span className="text-gray-800">{tableNumDisplay || "COUNTER"}</span>
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border rounded-md ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formattedTime}
                      </span>
                    </div>
                  </div>

                  {/* Placer Info */}
                  <div className="flex items-center justify-between text-xs bg-gray-50/80 px-3 py-2 rounded-lg">
                    <span className="truncate text-gray-500">Placed by: <strong className="font-semibold text-gray-800">{order.placedByName || (isCounter ? "Counter Staff" : "Staff")}</strong></span>
                    <span className="text-[10px] text-gray-400 font-semibold shrink-0 uppercase tracking-wider">{order.placedByRole || (isCounter ? "COUNTER" : "STAFF")}</span>
                  </div>

                  {/* Items list */}
                  <div className="bg-gray-50/50 rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto flex-1">
                    {items.length > 0 ? (
                      (() => {
                        const consolidatedMap = new Map<string, { item: any; totalQty: number; totalPrice: number }>();
                        items.forEach((item: any) => {
                          const key = item.menuItemId || item.menuItem?.id || item.menuItem?.name || item.name || "unknown";
                          const qty = item.quantity || 1;
                          const price = getItemPrice(item);
                          if (consolidatedMap.has(key)) {
                            const existing = consolidatedMap.get(key)!;
                            existing.totalQty += qty;
                            existing.totalPrice += price;
                          } else {
                            consolidatedMap.set(key, { item, totalQty: qty, totalPrice: price });
                          }
                        });

                        return Array.from(consolidatedMap.values()).map(({ item, totalQty, totalPrice }, idx: number) => (
                          <div
                            key={item.id || idx}
                            className="flex justify-between items-start text-xs gap-2"
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200 shrink-0 leading-none">
                                {totalQty}
                              </span>
                              <span className="font-medium text-gray-700 leading-tight pt-0.5 truncate">
                                {item.menuItem?.name || item.name || "Dish Item"}
                              </span>
                            </div>
                            <span className="text-gray-600 font-medium shrink-0">
                              ₹{totalPrice.toFixed(0)}
                            </span>
                          </div>
                        ));
                      })()
                    ) : (
                      <p className="text-[11px] text-gray-400 font-medium text-center py-2">
                        No Items
                      </p>
                    )}
                  </div>

                  {/* Total & Footer actions */}
                  <div className="pt-3 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Total</span>
                      <span className="font-bold text-lg text-gray-900">
                        ₹{Number(totalAmt).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2 h-10">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                      >
                        Details
                      </button>

                      {order.status !== "COMPLETED" &&
                        order.status !== "CANCELLED" && (
                          <button
                            onClick={() => setCancellingOrder(order)}
                            disabled={isUpdating}
                            className="px-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center justify-center transition-colors"
                            title="Cancel Order"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                    
                    {/* Primary Action Button */}
                    <div className="w-full">
                      {!isStaffRole &&
                        (order.status === "SENT_TO_KITCHEN" || order.status === "RECEIVED") && (
                          <button
                            onClick={() => handleStatusChange(order.id, "PREPARING")}
                            disabled={isUpdating}
                            className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                          >
                            START PREP <ArrowRight className="w-4 h-4" />
                          </button>
                        )}

                      {!isStaffRole && order.status === "PREPARING" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "READY")}
                          disabled={isUpdating}
                          className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          MARK READY <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {!isStaffRole && order.status === "READY" && (
                        <button
                          onClick={() => handleStatusChange(order.id, "SERVED")}
                          disabled={isUpdating}
                          className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          MARK SERVED <ArrowRight className="w-4 h-4" />
                        </button>
                      )}

                      {/* Cashier/Staff button (if needed for COMPLETED flow) */}
                      {!isStaffRole && order.status === "SERVED" && (
                        <button
                          onClick={() => {
                            setCustomerName(order.customerName || "");
                            setCustomerPhone(order.customerPhone || "");
                            setSettlingOrder(order);
                          }}
                          disabled={isUpdating}
                          className="w-full h-10 bg-[#1B2A4A] hover:bg-black text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                        >
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                          SETTLE BILL
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm">
            <div className="bg-white rounded-none border-4 border-[#1B2A4A] max-w-md w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal header */}
              <div className="flex justify-between items-start p-4 border-b-4 border-[#1B2A4A] bg-[#1B2A4A] text-white">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {selectedOrder.tableNo || (selectedOrder as any).tableNumber ? (
                      <span className="bg-white text-[#1B2A4A] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <Utensils className="w-3 h-3" />
                        Table {selectedOrder.tableNo || (selectedOrder as any).tableNumber}
                      </span>
                    ) : (
                      <span className="bg-indigo-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        Counter
                      </span>
                    )}
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter mt-1">
                    {(() => {
                      const rawOrderNo = selectedOrder.orderNo || (selectedOrder as any).orderNumber || selectedOrder.id.toUpperCase();
                      return rawOrderNo.length > 8 ? `#${rawOrderNo.slice(-6)}` : rawOrderNo.startsWith("#") ? rawOrderNo : `#${rawOrderNo}`;
                    })()}
                  </h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold">
                    <Clock className="w-3 h-3" />
                    {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="bg-white text-[#1B2A4A] hover:bg-red-500 hover:text-white border-2 border-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 overflow-y-auto bg-gray-50 flex-1">
                {/* Status banner */}
                <div className={`flex items-center justify-between p-3 border-2 border-dashed ${getStatusMeta(selectedOrder.status).bg} ${getStatusMeta(selectedOrder.status).border}`}>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${getStatusMeta(selectedOrder.status).text}`}>
                    Kitchen Status
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${getStatusMeta(selectedOrder.status).text}`}>
                    {getStatusMeta(selectedOrder.status).label}
                  </span>
                </div>

                {/* Items */}
                <div className="bg-white border-2 border-gray-300 p-3 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b-2 border-gray-200 pb-2">
                    Ordered Items
                  </p>
                  <div className="space-y-3">
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
                        <div key={item.id || idx} className="flex justify-between items-start text-[13px]">
                          <div className="flex gap-2 items-start">
                            <span className="font-black text-white bg-[#1B2A4A] px-1.5 py-0.5 leading-none mt-0.5">
                              {totalQty}
                            </span>
                            <div>
                              <span className="font-bold text-[#1B2A4A] leading-tight block">
                                {item.menuItem?.name || item.name || "Dish Item"}
                              </span>
                              {notes.length > 0 && (
                                <span className="text-[10px] text-gray-500 italic mt-0.5 block border-l-2 border-amber-400 pl-1.5">
                                  {notes.join(", ")}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-gray-700">
                            ₹{totalPrice.toFixed(0)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Bill summary */}
                <div className="bg-[#1B2A4A] text-white p-4 space-y-2 relative">
                  {/* Jagged receipt edge effect top */}
                  <div className="absolute top-0 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmOWZhZmIiIHBvaW50cz0iMCAwIDQgNCA4IDAgOCA4IDAgOCIvPjwvc3ZnPg==')] -mt-2"></div>
                  
                  {(() => {
                    const subtotalVal = selectedOrder.subtotal !== undefined ? selectedOrder.subtotal : (selectedOrder as any).subtotalPaise !== undefined ? (selectedOrder as any).subtotalPaise / 100 : 0;
                    const totalVal = selectedOrder.totalAmount !== undefined ? selectedOrder.totalAmount : (selectedOrder as any).totalPaise !== undefined ? (selectedOrder as any).totalPaise / 100 : 0;
                    const discountVal = selectedOrder.discountAmount !== undefined ? selectedOrder.discountAmount : (selectedOrder as any).discountPaise !== undefined ? (selectedOrder as any).discountPaise / 100 : 0;
                    let taxVal = selectedOrder.taxAmount !== undefined ? selectedOrder.taxAmount : (selectedOrder as any).taxPaise !== undefined ? (selectedOrder as any).taxPaise / 100 : 0;
                    
                    if (taxVal === 0 && totalVal > 0 && subtotalVal > 0 && totalVal >= (subtotalVal - discountVal)) {
                      taxVal = Math.max(0, totalVal - (subtotalVal - discountVal));
                    }

                    return (
                      <>
                        <div className="flex justify-between text-[11px] font-bold text-gray-300 uppercase tracking-widest">
                          <span>Subtotal</span>
                          <span className="font-bold text-white">₹{subtotalVal.toFixed(2)}</span>
                        </div>
                        {discountVal > 0 && (
                          <div className="flex justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                            <span>Discount</span>
                            <span className="font-bold">- ₹{discountVal.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] font-bold text-gray-300 uppercase tracking-widest pb-2 border-b-2 border-dashed border-gray-600">
                          <span>Taxes</span>
                          <span className="font-bold text-white">₹{taxVal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end pt-2">
                          <span className="text-[14px] font-black uppercase tracking-widest text-emerald-400">Total</span>
                          <span className="text-3xl font-black tracking-tighter leading-none text-emerald-400">
                            ₹{totalVal.toFixed(2)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t-4 border-[#1B2A4A] bg-white flex gap-2">
                {selectedOrder.status !== "COMPLETED" &&
                  selectedOrder.status !== "CANCELLED" && (
                    <>
                      <button
                        onClick={() => {
                          setCancellingOrder(selectedOrder);
                          setSelectedOrder(null);
                        }}
                        className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 border-2 border-red-500 font-black uppercase tracking-widest py-3 px-4 text-[10px] transition-all flex items-center gap-1 active:translate-y-[2px] active:translate-x-[2px] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] active:shadow-none"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                      <button
                        onClick={() => {
                          setCustomerName(selectedOrder.customerName || "");
                          setCustomerPhone(selectedOrder.customerPhone || "");
                          setSettlingOrder(selectedOrder);
                          setSelectedOrder(null);
                        }}
                        className="flex-1 bg-[#1B2A4A] border-2 border-black text-white font-black uppercase tracking-widest py-3 px-3 text-[11px] transition-all hover:bg-black flex items-center justify-center gap-2 active:translate-y-[2px] active:translate-x-[2px] shadow-[4px_4px_0px_rgba(0,0,0,0.2)] active:shadow-none"
                      >
                        <Printer className="w-4 h-4 text-emerald-400" />
                        Settle & Print
                      </button>
                    </>
                  )}
                {/* Optional close button if needed, but we have X top right */}
                {(selectedOrder.status === "COMPLETED" || selectedOrder.status === "CANCELLED") && (
                   <button
                     onClick={() => setSelectedOrder(null)}
                     className="flex-1 bg-gray-100 hover:bg-gray-200 border-2 border-gray-300 text-gray-700 font-black uppercase tracking-widest py-3 text-[11px] transition-all active:translate-y-[2px] active:translate-x-[2px] shadow-[2px_2px_0px_rgba(0,0,0,0.1)] active:shadow-none"
                   >
                     Close
                   </button>
                )}
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
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => { if (e.target === e.currentTarget) setPrintingOrder(null); }}
          >
            <div className="relative w-full max-w-sm mx-4 rounded-2xl overflow-hidden shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)] border border-white/10 animate-in zoom-in-95 duration-200">
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
                  <h3 className="text-base font-black text-[#1B2A4A]">
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
