"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

// ── Status helpers ─────────────────────────────────────────────────────────────

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
  const { activeBranch } = useBranch();
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
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">(
    "CASH"
  );

  const {
    data: orders = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetOrdersQuery(
    selectedStatusFilter !== "ALL" ? { status: selectedStatusFilter } : undefined,
    { pollingInterval: 4000 }
  );

  const [updateOrderStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();

  const handleStatusChange = async (
    orderId: string,
    nextStatus: Order["status"],
    methodOrComment?: "CASH" | "CARD" | "UPI" | string
  ) => {
    try {
      const isPaymentMethod =
        methodOrComment === "CASH" ||
        methodOrComment === "CARD" ||
        methodOrComment === "UPI";
      await updateOrderStatus({
        id: orderId,
        status: nextStatus,
        comment: methodOrComment,
        paymentMethod: isPaymentMethod ? (methodOrComment as any) : undefined,
      }).unwrap();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, status: nextStatus } : null
        );
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const orderList = Array.isArray(orders)
    ? orders
    : (orders as any)?.data && Array.isArray((orders as any).data)
      ? (orders as any).data
      : [];

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
    { id: "COMPLETED", label: "Completed" },
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl p-3 shadow-xs">
          {/* Status pill tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {statusFilterTabs.map((tab) => {
              const active = selectedStatusFilter === tab.id;
              const meta = tab.id !== "ALL" ? getStatusMeta(tab.id) : null;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${active
                    ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs"
                    : "bg-transparent text-gray-600 border-transparent hover:bg-gray-100 hover:border-gray-200"
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
                      className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${active
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
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
              placeholder="Table # or Order ID…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A] focus:bg-white transition"
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
              const orderNumDisplay =
                order.orderNo ||
                order.orderNumber ||
                `#${order.id.slice(0, 8)}`;
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
                  className="bg-white rounded-2xl border border-gray-200 shadow-xs hover:shadow-md hover:border-gray-300 transition-all flex flex-col overflow-hidden"
                >
                  {/* Card top accent bar */}
                  <div
                    className={`h-1 w-full ${order.status === "CANCELLED"
                      ? "bg-rose-400"
                      : order.status === "COMPLETED"
                        ? "bg-gray-300"
                        : order.status === "READY"
                          ? "bg-emerald-400"
                          : order.status === "PREPARING"
                            ? "bg-amber-400"
                            : order.status === "SERVED"
                              ? "bg-purple-400"
                              : "bg-[#1B2A4A]"
                      }`}
                  />

                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Source badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black shrink-0 ${isCounter
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : "bg-[#D3232A]/10 text-[#D3232A] border border-[#D3232A]/20"
                            }`}
                        >
                          {isCounter ? (
                            <CreditCard className="w-2.5 h-2.5" />
                          ) : (
                            <Utensils className="w-2.5 h-2.5" />
                          )}
                          {isCounter ? "Counter" : `Table ${tableNumDisplay}`}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500 truncate">
                          {orderNumDisplay}
                        </span>
                      </div>

                      {/* Status pill */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black whitespace-nowrap shrink-0 border ${meta.bg} ${meta.text} ${meta.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                        />
                        {meta.label}
                      </span>
                    </div>

                    {/* Time & amount row */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {formattedTime}
                      </span>
                      <span className="font-black text-[#1B2A4A] text-sm">
                        ₹{Number(totalAmt).toFixed(2)}
                      </span>
                    </div>

                    {/* Items list */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 space-y-1.5 max-h-28 overflow-y-auto scrollbar-none flex-1">
                      {items.length > 0 ? (
                        items.map((item: any, idx: number) => (
                          <div
                            key={item.id || idx}
                            className="flex justify-between items-center text-xs gap-2"
                          >
                            <span className="font-semibold text-[#1B2A4A] truncate">
                              <span className="text-[#D3232A] font-black mr-1">
                                {item.quantity}×
                              </span>
                              {item.menuItem?.name || "Dish Item"}
                            </span>
                            <span className="text-gray-500 font-semibold shrink-0">
                              ₹{getItemPrice(item).toFixed(2)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          No item details
                        </p>
                      )}
                    </div>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs font-bold text-gray-500 hover:text-[#1B2A4A] transition flex items-center gap-1"
                      >
                        Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {!isStaffRole &&
                          (order.status === "SENT_TO_KITCHEN" ||
                            order.status === "RECEIVED") && (
                            <button
                              onClick={() =>
                                handleStatusChange(order.id, "PREPARING")
                              }
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow-xs transition disabled:opacity-60"
                            >
                              <Timer className="w-3 h-3" />
                              Start Prep
                            </button>
                          )}
                        {!isStaffRole && order.status === "PREPARING" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "READY")
                            }
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-xs transition disabled:opacity-60"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Mark Ready
                          </button>
                        )}
                        {order.status === "READY" && (
                          <button
                            onClick={() =>
                              handleStatusChange(order.id, "SERVED")
                            }
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-[11px] font-bold rounded-lg shadow-xs transition disabled:opacity-60"
                          >
                            <Package className="w-3 h-3" />
                            Mark Served
                          </button>
                        )}
                        {order.status === "SERVED" && (
                          <button
                            onClick={() => setSettlingOrder(order)}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1B2A4A] hover:bg-[#2d4272] text-white text-[11px] font-bold rounded-lg shadow-xs transition disabled:opacity-60"
                          >
                            <IndianRupee className="w-3 h-3" />
                            Settle Bill
                          </button>
                        )}
                      </div>
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
                    <h3 className="text-base font-black text-[#1B2A4A]">
                      {selectedOrder.orderNo ||
                        (selectedOrder as any).orderNumber ||
                        `#${selectedOrder.id.slice(0, 8)}`}
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
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
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
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${getStatusMeta(selectedOrder.status).bg
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
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                    Ordered Items
                  </p>
                  <div className="space-y-2">
                    {(
                      selectedOrder.orderItems ||
                      (selectedOrder as any).items ||
                      []
                    ).map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        className="flex justify-between items-start p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#1B2A4A] block">
                            <span className="text-[#D3232A] mr-1">
                              {item.quantity}×
                            </span>
                            {item.menuItem?.name || "Dish Item"}
                          </span>
                          {item.notes && (
                            <span className="text-[10px] text-gray-400 italic mt-0.5 block">
                              {item.notes}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-gray-700">
                          ₹{getItemPrice(item).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bill summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500 font-medium">
                    <span>Subtotal</span>
                    <span>
                      ₹
                      {(
                        selectedOrder.subtotal !== undefined
                          ? selectedOrder.subtotal
                          : (selectedOrder as any).subtotalPaise !== undefined
                            ? (selectedOrder as any).subtotalPaise / 100
                            : 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-[#1B2A4A] pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-[#D3232A]">
                      ₹
                      {(
                        selectedOrder.totalAmount !== undefined
                          ? selectedOrder.totalAmount
                          : (selectedOrder as any).totalPaise !== undefined
                            ? (selectedOrder as any).totalPaise / 100
                            : 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                {selectedOrder.status !== "COMPLETED" &&
                  selectedOrder.status !== "CANCELLED" && (
                    <button
                      onClick={() => {
                        setSettlingOrder(selectedOrder);
                        setSelectedOrder(null);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#1B2A4A] hover:bg-[#2d4272] text-white font-bold py-2.5 px-3 text-xs rounded-xl transition shadow-xs"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      Settle Bill
                    </button>
                  )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 text-xs font-bold rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Settle Payment ── */}
        {settlingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="text-base font-black text-[#1B2A4A] flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                    </div>
                    Settle Bill
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1 ml-9">
                    {settlingOrder.orderNo ||
                      (settlingOrder as any).orderNumber ||
                      `#${settlingOrder.id.slice(0, 8)}`}{" "}
                    ·{" "}
                    {settlingOrder.tableNo ||
                      (settlingOrder as any).tableNumber
                      ? `Table ${settlingOrder.tableNo || (settlingOrder as any).tableNumber}`
                      : "Counter Direct"}
                  </p>
                </div>
                <button
                  onClick={() => setSettlingOrder(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Bill amount hero */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-5 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                      Total Amount Due
                    </p>
                    <p className="text-3xl font-black text-emerald-900 mt-1">
                      ₹
                      {(
                        settlingOrder.totalAmount !== undefined
                          ? settlingOrder.totalAmount
                          : (settlingOrder as any).totalPaise !== undefined
                            ? (settlingOrder as any).totalPaise / 100
                            : 0
                      ).toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-200/60">
                    <CheckCircle className="w-7 h-7 text-emerald-700" />
                  </div>
                </div>

                {/* Payment method selection */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-3">
                    Payment Method
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { value: "CASH", label: "Cash", icon: Banknote },
                        { value: "CARD", label: "Card / POS", icon: CreditCard },
                        { value: "UPI", label: "UPI / QR", icon: QrCode },
                      ] as const
                    ).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPaymentMethod(value)}
                        className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition font-bold text-xs ${paymentMethod === value
                          ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={async () => {
                    const orderId = settlingOrder.id;
                    setSettlingOrder(null);
                    await handleStatusChange(orderId, "COMPLETED", paymentMethod);
                  }}
                  disabled={isUpdating}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 text-xs rounded-xl transition shadow-xs disabled:opacity-60"
                >
                  <Check className="w-4 h-4" />
                  Confirm Payment & Complete
                </button>
                <button
                  onClick={() => setSettlingOrder(null)}
                  className="px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 py-2.5 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
