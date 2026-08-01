"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useGetOrdersQuery, Order } from "@/redux/slices/orderApiSlice";
import { useAppSelector } from "@/redux/store/hooks";
import { useBranch } from "@/lib/BranchContext";
import { fetchTables } from "@/lib/api";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import {
  CheckCircle2,
  Search,
  RefreshCw,
  Calendar,
  Filter,
  User,
  CreditCard,
  Utensils,
  Layers,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Receipt,
  Eye,
  FileSpreadsheet,
  Clock,
  UserCheck,
  Building2,
  X,
  ChefHat,
  Check,
} from "lucide-react";

export default function CompletedOrdersPage() {
  const user = useAppSelector((state) => state.auth.user);
  const { activeBranch } = useBranch();
  const currentOutletId =
    activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;

  const isStaffRole = user?.role === "STAFF";
  const isManagerOrOwner =
    user?.role === "MANAGER" ||
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "SUPER_ADMIN";

  // Workforce employee records for staff filter dropdown
  const { data: employeesRaw } = useGetEmployeesQuery(
    currentOutletId
      ? { outletId: currentOutletId, limit: 200, offset: 0 }
      : undefined
  );
  const allEmployees: any[] = Array.isArray(employeesRaw)
    ? employeesRaw
    : (employeesRaw as any)?.data || [];
  const myEmployee = allEmployees.find((e: any) => e.userId === user?.id);

  // Assigned tables for staff role
  const [assignedTableNumbers, setAssignedTableNumbers] = useState<number[]>([]);
  React.useEffect(() => {
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
                (t.assignedStaffId === userId || t.assignedStaffId === empId)) ||
              ((t as any).staffId &&
                ((t as any).staffId === userId || (t as any).staffId === empId))
          );
          setAssignedTableNumbers(assigned.map((t) => t.tableNumber));
        }
      }
    }
    loadTables();
  }, [currentOutletId, myEmployee?.id, user?.id, isStaffRole]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<"ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch completed orders from backend
  const {
    data: orders = [],
    isLoading,
    isFetching,
    refetch,
  } = useGetOrdersQuery({
    status: "COMPLETED",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    source: selectedSource !== "ALL" ? selectedSource : undefined,
    paymentMethod: selectedPaymentMethod !== "ALL" ? selectedPaymentMethod : undefined,
  });

  const rawList: Order[] = Array.isArray(orders)
    ? orders
    : (orders as any)?.data && Array.isArray((orders as any).data)
    ? (orders as any).data
    : [];

  // Filter completed orders on frontend for staff & advanced criteria
  const filteredCompletedOrders = useMemo(() => {
    return rawList.filter((order) => {
      // 1. Mandatory status check
      if (order.status !== "COMPLETED") return false;

      const tableNum =
        order.tableNo !== undefined && order.tableNo !== null
          ? Number(order.tableNo)
          : (order as any).tableNumber !== undefined &&
            (order as any).tableNumber !== null
          ? Number((order as any).tableNumber)
          : null;

      // 2. Role-based scoping for Staff
      if (isStaffRole) {
        const staffNameMatch =
          order.placedByName &&
          user?.name &&
          order.placedByName.toLowerCase().includes(user.name.toLowerCase());
        const tableAssignedMatch =
          tableNum !== null && assignedTableNumbers.includes(tableNum);
        if (!staffNameMatch && !tableAssignedMatch) {
          return false;
        }
      }

      // 3. Manager / Owner Staff Filter
      if (selectedStaff !== "ALL") {
        if (
          !order.placedByName ||
          !order.placedByName.toLowerCase().includes(selectedStaff.toLowerCase())
        ) {
          return false;
        }
      }

      // 4. Date Range Preset Filter
      if (dateRange !== "ALL" && dateRange !== "CUSTOM") {
        const orderDate = new Date(order.createdAt);
        const now = new Date();

        if (dateRange === "TODAY") {
          if (orderDate.toDateString() !== now.toDateString()) return false;
        } else if (dateRange === "YESTERDAY") {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          if (orderDate.toDateString() !== yesterday.toDateString()) return false;
        } else if (dateRange === "THIS_WEEK") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          if (orderDate < weekAgo) return false;
        } else if (dateRange === "THIS_MONTH") {
          const monthAgo = new Date();
          monthAgo.setDate(now.getDate() - 30);
          if (orderDate < monthAgo) return false;
        }
      }

      // 5. Search query (Order #, ID, Table #, Staff name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesNo =
          order.orderNo?.toLowerCase().includes(q) ||
          (order as any).orderNumber?.toLowerCase().includes(q);
        const matchesTable = tableNum !== null && String(tableNum).includes(q);
        const matchesStaff =
          order.placedByName && order.placedByName.toLowerCase().includes(q);
        if (!matchesId && !matchesNo && !matchesTable && !matchesStaff) {
          return false;
        }
      }

      return true;
    });
  }, [
    rawList,
    isStaffRole,
    user?.name,
    assignedTableNumbers,
    selectedStaff,
    dateRange,
    searchQuery,
  ]);

  // Analytics Metrics
  const totalRevenue = useMemo(
    () => filteredCompletedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    [filteredCompletedOrders]
  );

  const avgOrderValue = useMemo(
    () =>
      filteredCompletedOrders.length > 0
        ? totalRevenue / filteredCompletedOrders.length
        : 0,
    [filteredCompletedOrders, totalRevenue]
  );

  // Pagination Math
  const totalPages = Math.ceil(filteredCompletedOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompletedOrders.slice(start, start + pageSize);
  }, [filteredCompletedOrders, currentPage, pageSize]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    dateRange,
    startDate,
    endDate,
    selectedStaff,
    selectedSource,
    selectedPaymentMethod,
    pageSize,
  ]);

  const getItemPrice = (item: any) =>
    ((item.unitPricePaise !== undefined
      ? item.unitPricePaise
      : item.menuItem?.price
      ? item.menuItem.price * 100
      : 0) / 100) * item.quantity;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/orders"
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
              title="Back to Live Orders"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </span>
                <h1 className="text-xl font-black text-[#1B2A4A]">
                  Completed Orders
                </h1>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                {isStaffRole
                  ? "History of completed orders assigned to or served by you"
                  : "Complete order archive with advanced filtering and invoice breakdown"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isStaffRole && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <UserCheck className="w-4 h-4 text-amber-600" />
                Showing Your Orders Only
              </span>
            )}
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-emerald-600" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-4 sm:p-5 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="absolute right-3 top-3 bg-white/10 p-2.5 rounded-xl">
              <IndianRupee className="w-6 h-6 text-emerald-100" />
            </div>
            <p className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Total Revenue (Completed)
            </p>
            <h3 className="text-2xl sm:text-3xl font-black mt-1">
              ₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-emerald-200 mt-1 font-medium">
              Across {filteredCompletedOrders.length} orders
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs relative">
            <div className="absolute right-3 top-3 bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <Receipt className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Total Completed Tickets
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#1B2A4A] mt-1">
              {filteredCompletedOrders.length}
            </h3>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              Filtered count
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs relative">
            <div className="absolute right-3 top-3 bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Average Order Value
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-[#1B2A4A] mt-1">
              ₹{avgOrderValue.toFixed(2)}
            </h3>
            <p className="text-[11px] text-gray-500 mt-1 font-medium">
              Per ticket average
            </p>
          </div>
        </div>

        {/* ── Advanced Filter Bar ── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#D3232A]" />
              <h2 className="text-sm font-black text-[#1B2A4A]">Filter Orders</h2>
            </div>
            {(searchQuery || dateRange !== "ALL" || selectedStaff !== "ALL" || selectedSource !== "ALL" || selectedPaymentMethod !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDateRange("ALL");
                  setStartDate("");
                  setEndDate("");
                  setSelectedStaff("ALL");
                  setSelectedSource("ALL");
                  setSelectedPaymentMethod("ALL");
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search order ID, table, staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#1B2A4A] transition"
              />
            </div>

            {/* Date Range Selector */}
            <div>
              <select
                value={dateRange}
                onChange={(e: any) => setDateRange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:border-[#1B2A4A] transition"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="YESTERDAY">Yesterday</option>
                <option value="THIS_WEEK">Last 7 Days</option>
                <option value="THIS_MONTH">Last 30 Days</option>
                <option value="CUSTOM">Custom Date Range</option>
              </select>
            </div>

            {/* Order Source Channel Filter */}
            <div>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:border-[#1B2A4A] transition"
              >
                <option value="ALL">All Channels</option>
                <option value="TABLE">Table (Dine-in)</option>
                <option value="COUNTER">Counter (Takeaway)</option>
                <option value="QR">QR Ordering</option>
                <option value="DELIVERY">Delivery</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:border-[#1B2A4A] transition"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            {/* Staff Filter (For Owner / Manager) */}
            <div>
              {!isStaffRole ? (
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl text-gray-700 focus:bg-white focus:outline-none focus:border-[#1B2A4A] transition"
                >
                  <option value="ALL">All Staff Members</option>
                  {allEmployees.map((emp) => (
                    <option key={emp.id} value={emp.user?.name || emp.name}>
                      {emp.user?.name || emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-3 py-2 text-xs font-bold bg-gray-100 border border-gray-200 rounded-xl text-gray-500 truncate">
                  Staff: {user?.name || "You"}
                </div>
              )}
            </div>
          </div>

          {/* Custom Date Inputs if CUSTOM selected */}
          {dateRange === "CUSTOM" && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <span>From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                <span>To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B2A4A]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Table & Orders List ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#D3232A] mb-2" />
              <p className="text-sm font-medium">Loading completed orders...</p>
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Receipt className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-base font-bold text-gray-700">No completed orders found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No completed orders match your current filters or search criteria. Try adjusting the filters above.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-black uppercase text-gray-500 tracking-wider">
                    <th className="py-3.5 px-4">Order ID & Date</th>
                    <th className="py-3.5 px-4">Source / Table</th>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Items Summary</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4 text-right">Total Amount</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {paginatedOrders.map((order) => {
                    const tableNum =
                      order.tableNo !== undefined && order.tableNo !== null
                        ? Number(order.tableNo)
                        : (order as any).tableNumber !== undefined &&
                          (order as any).tableNumber !== null
                        ? Number((order as any).tableNumber)
                        : null;

                    const displayNo =
                      order.orderNo ||
                      (order as any).orderNumber ||
                      order.id.slice(0, 8);

                    return (
                      <tr key={order.id} className="hover:bg-gray-50/60 transition group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1B2A4A]">
                            {displayNo}
                          </div>
                          <div className="text-[10px] font-medium text-gray-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(order.createdAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {tableNum !== null ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-[#D3232A] font-black border border-rose-100 text-[11px]">
                              <Utensils className="w-3 h-3" /> Table {tableNum}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black border border-indigo-100 text-[11px]">
                              <CreditCard className="w-3 h-3" /> Counter Direct
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-gray-700">
                          {order.placedByName ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                {order.placedByName.charAt(0).toUpperCase()}
                              </span>
                              <span>{order.placedByName}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-[220px]">
                          <div className="truncate font-medium text-gray-800">
                            {order.orderItems && order.orderItems.length > 0
                              ? order.orderItems
                                  .map((i) => `${i.quantity}x ${i.menuItem?.name || "Item"}`)
                                  .join(", ")
                              : "No items"}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {order.orderItems?.length || 0} unique item(s)
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[11px]">
                            <Check className="w-3 h-3 text-emerald-600" />
                            {order.paymentMethod || "CASH"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <span className="text-sm font-black text-[#1B2A4A]">
                            ₹{order.totalAmount.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#1B2A4A] hover:text-white text-gray-700 text-xs font-bold transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination Footer ── */}
          {!isLoading && filteredCompletedOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 bg-gray-50/50">
              <div className="text-xs text-gray-500 font-medium">
                Showing{" "}
                <span className="font-bold text-gray-800">
                  {(currentPage - 1) * pageSize + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-gray-800">
                  {Math.min(currentPage * pageSize, filteredCompletedOrders.length)}
                </span>{" "}
                of{" "}
                <span className="font-bold text-gray-800">
                  {filteredCompletedOrders.length}
                </span>{" "}
                completed orders
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span>Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>

                  <span className="text-xs font-bold text-gray-700 px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Order Detail Modal / Drawer ── */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 space-y-0">

              {/* Modal Header */}
              <div className="bg-[#1B2A4A] text-white p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-black">
                      Order {selectedOrder.orderNo || (selectedOrder as any).orderNumber || selectedOrder.id.slice(0, 8)}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-2xl text-xs">
                  <div>
                    <span className="text-gray-400 font-medium block">Source</span>
                    <span className="font-bold text-gray-800">
                      {selectedOrder.tableNo ? `Table ${selectedOrder.tableNo}` : "Counter Direct"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Staff Member</span>
                    <span className="font-bold text-gray-800">
                      {selectedOrder.placedByName || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Payment Status</span>
                    <span className="font-bold text-emerald-600 uppercase">
                      CONFIRMED ({selectedOrder.paymentMethod || "CASH"})
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block">Order Status</span>
                    <span className="font-bold text-emerald-700 uppercase">
                      COMPLETED
                    </span>
                  </div>
                </div>

                {/* Item list */}
                <div>
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-2">
                    Ordered Items
                  </h4>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                    {selectedOrder.orderItems && selectedOrder.orderItems.length > 0 ? (
                      selectedOrder.orderItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 text-xs bg-white"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-[#1B2A4A] text-[11px]">
                              {item.quantity}x
                            </span>
                            <div>
                              <p className="font-bold text-gray-800">
                                {item.menuItem?.name || "Item"}
                              </p>
                              {item.notes && (
                                <p className="text-[10px] text-gray-400 italic">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-black text-gray-800">
                            ₹{getItemPrice(item).toFixed(2)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-gray-400 italic">
                        No item breakdown available
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount Calculation */}
                <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{selectedOrder.subtotal?.toFixed(2) || selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  {selectedOrder.taxAmount > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes & Charges</span>
                      <span>₹{selectedOrder.taxAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount</span>
                      <span>-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-[#1B2A4A] pt-2 border-t border-gray-200">
                    <span>Total Paid</span>
                    <span>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-2 rounded-xl bg-[#1B2A4A] text-white text-xs font-bold hover:bg-[#283d6a] transition"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
