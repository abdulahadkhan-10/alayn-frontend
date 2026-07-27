"use client";

import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WorkforceHeaderNav from "./WorkforceHeaderNav";
import {
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
  useUpdateLeaveStatusMutation,
  useGetEmployeesQuery,
} from "@/redux/slices/employeeApiSlice";
import {
  CalendarOff,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  User,
  Calendar,
  Check,
} from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import { useBranch } from "@/lib/BranchContext";

const DEMO_LEAVE_REQUESTS = [
  {
    id: "leave-1",
    employeeId: "demo-2",
    employee: { name: "Priya Patel", role: "STAFF" },
    startDate: "2026-07-25",
    endDate: "2026-07-27",
    reason: "Family medical emergency",
    status: "REQUESTED",
    createdAt: "2026-07-20T10:00:00Z",
  },
  {
    id: "leave-2",
    employeeId: "demo-3",
    employee: { name: "Amit Kumar", role: "KITCHEN" },
    startDate: "2026-08-01",
    endDate: "2026-08-02",
    reason: "Personal work",
    status: "APPROVED",
    createdAt: "2026-07-18T14:30:00Z",
  },
];

// Helper YYYY-MM-DD
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function LeaveApprovalsPage() {
  const { activeBranch } = useBranch();
  const outletId = activeBranch?.id === "all" ? undefined : activeBranch?.id;

  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

  const { data: leaveApiData, isLoading: isLeavesLoading } = useGetLeaveRequestsQuery(outletId ? { outletId } : undefined);
  const { data: empApiData } = useGetEmployeesQuery(outletId ? { outletId } : undefined);
  const [createLeaveRequest, { isLoading: isSubmitting }] = useCreateLeaveRequestMutation();
  const [updateLeaveStatus, { isLoading: isUpdating }] = useUpdateLeaveStatusMutation();

  const leaves = leaveApiData?.data || (isLeavesLoading ? [] : DEMO_LEAVE_REQUESTS);
  const employees = empApiData?.data || [
    { id: "demo-1", name: "Rohan Sharma" },
    { id: "demo-2", name: "Priya Patel" },
    { id: "demo-3", name: "Amit Kumar" },
  ];

  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date("2026-07-27"));
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<any>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [leaveForm, setLeaveForm] = useState({
    employeeId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reason: "",
  });

  const currentEmployee = React.useMemo(() => {
    return employees.find(
      (e: any) => e.userId === user?.id || (user?.email && e.email === user?.email)
    );
  }, [employees, user]);

  React.useEffect(() => {
    if (showCreateModal && currentEmployee) {
      setLeaveForm((prev) => ({ ...prev, employeeId: currentEmployee.id }));
    }
  }, [showCreateModal, currentEmployee]);

  const userLeaves = React.useMemo(() => {
    if (!isManagerOrOwner) {
      return leaves.filter((l: any) => {
        if (!currentEmployee && !user) return false;
        return (
          l.employeeId === currentEmployee?.id ||
          l.employee?.id === currentEmployee?.id ||
          l.employee?.userId === user?.id ||
          (user?.email && l.employee?.email === user?.email)
        );
      });
    }
    return leaves;
  }, [leaves, isManagerOrOwner, currentEmployee, user]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredLeaves = userLeaves.filter(
    (l: any) => statusFilter === "ALL" || l.status === statusFilter
  );

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLeaves.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLeaves = React.useMemo(() => {
    return filteredLeaves.slice(startIndex, startIndex + pageSize);
  }, [filteredLeaves, startIndex, pageSize]);

  const pendingCount = userLeaves.filter((l: any) => l.status === "REQUESTED").length;
  const approvedCount = userLeaves.filter((l: any) => l.status === "APPROVED").length;
  const rejectedCount = userLeaves.filter((l: any) => l.status === "REJECTED").length;

  // Calendar Grid Calculation
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const todayStr = toDateString(new Date());

  const monthGridDays = React.useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1; // Mon = 0
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; dayNum: number }[] = [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth, -i);
      days.push({
        date: d,
        dateStr: toDateString(d),
        isCurrentMonth: false,
        dayNum: d.getDate(),
      });
    }

    // Current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(currentYear, currentMonth, i);
      days.push({
        date: d,
        dateStr: toDateString(d),
        isCurrentMonth: true,
        dayNum: i,
      });
    }

    // Next month padding
    const targetLength = days.length <= 35 ? 35 : 42;
    const remaining = targetLength - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({
        date: d,
        dateStr: toDateString(d),
        isCurrentMonth: false,
        dayNum: d.getDate(),
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  const handleTodayMonth = () => setCalendarDate(new Date());

  const handleCreateLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetEmpId = leaveForm.employeeId || currentEmployee?.id;
      if (!targetEmpId) {
        setFeedbackMsg("Could not find your employee profile. Please contact support.");
        return;
      }
      await createLeaveRequest({ ...leaveForm, employeeId: targetEmpId }).unwrap();
      setFeedbackMsg("Leave request submitted successfully!");
      setShowCreateModal(false);
      setLeaveForm({
        employeeId: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        reason: "",
      });
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to submit leave request");
    }
  };

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateLeaveStatus({ id, status }).unwrap();
      setFeedbackMsg(`Leave request ${status.toLowerCase()}!`);
      setSelectedLeaveDetail(null);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || `Failed to update leave status`);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isManagerOrOwner ? "Leave Approvals & Requests Calendar" : "My Leave Requests"}
            </h1>
            <p className="text-sm text-gray-500">
              {isManagerOrOwner
                ? "Review, approve, or reject employee leave applications across the calendar."
                : "Submit time-off requests and track the approval status of your applications."}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b01e23] transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Apply for Leave
          </button>
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm shadow-sm">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            onClick={() => setStatusFilter("REQUESTED")}
            className={`rounded-xl border p-5 shadow-sm transition-all cursor-pointer ${
              statusFilter === "REQUESTED"
                ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/20"
                : "border-gray-200 bg-white hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Approvals
                </p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <div className="rounded-lg bg-amber-100/80 p-3 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("APPROVED")}
            className={`rounded-xl border p-5 shadow-sm transition-all cursor-pointer ${
              statusFilter === "APPROVED"
                ? "border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-400/20"
                : "border-gray-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved Leaves
                </p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{approvedCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-100/80 p-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("REJECTED")}
            className={`rounded-xl border p-5 shadow-sm transition-all cursor-pointer ${
              statusFilter === "REJECTED"
                ? "border-rose-400 bg-rose-50/60 ring-2 ring-rose-400/20"
                : "border-gray-200 bg-white hover:border-rose-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected Leaves
                </p>
                <p className="mt-1 text-2xl font-bold text-rose-600">{rejectedCount}</p>
              </div>
              <div className="rounded-lg bg-rose-100/80 p-3 text-rose-600">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode & Filter Control Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === "calendar"
                    ? "bg-white text-gray-900 shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid className="h-4 w-4 text-[#D3232A]" />
                Calendar View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-white text-gray-900 shadow-sm font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4 text-[#D3232A]" />
                Table View ({filteredLeaves.length})
              </button>
            </div>

            {/* Calendar Month Navigation */}
            {viewMode === "calendar" && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleTodayMonth}
                    className="px-2.5 py-1 text-xs font-bold text-[#D3232A] hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm font-bold text-gray-900 min-w-[140px] text-center">
                  {calendarDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>
            )}
          </div>

          {/* Filter Status Pills */}
          <div className="flex flex-wrap items-center justify-between pt-3 border-t border-gray-100 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <span className="font-semibold text-gray-700">Filter Status:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "REQUESTED", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? "bg-[#D3232A] text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {st === "REQUESTED" ? "PENDING" : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CALENDAR VIEW GRID */}
        {viewMode === "calendar" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80 text-center">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
                <div key={dayName} className="py-3 text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Grid Date Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-200 bg-gray-100">
              {monthGridDays.map((dayItem, idx) => {
                const isToday = dayItem.dateStr === todayStr;

                // Leaves overlapping on this day
                const leavesOnDate = filteredLeaves.filter((l: any) => {
                  const s = l.startDate.split("T")[0];
                  const e = l.endDate.split("T")[0];
                  return dayItem.dateStr >= s && dayItem.dateStr <= e;
                });

                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] p-2.5 transition-colors relative flex flex-col justify-between group ${
                      !dayItem.isCurrentMonth
                        ? "bg-gray-50/60 text-gray-400"
                        : isToday
                        ? "bg-red-50/40"
                        : "bg-white text-gray-800 hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Top Cell Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isToday
                            ? "bg-[#D3232A] text-white shadow-xs"
                            : dayItem.isCurrentMonth
                            ? "text-gray-800"
                            : "text-gray-400"
                        }`}
                      >
                        {dayItem.dayNum}
                      </span>

                      {/* Click Date to Apply for Leave */}
                      <button
                        onClick={() => {
                          setLeaveForm({
                            employeeId: currentEmployee?.id || "",
                            startDate: dayItem.dateStr,
                            endDate: dayItem.dateStr,
                            reason: "",
                          });
                          setShowCreateModal(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#D3232A] hover:bg-red-100 rounded-md text-[11px] font-semibold flex items-center gap-0.5 cursor-pointer"
                        title="Apply Leave for this date"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span className="hidden lg:inline">Leave</span>
                      </button>
                    </div>

                    {/* Cell Body: Leave Pills */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-0.5">
                      {leavesOnDate.length > 0 ? (
                        leavesOnDate.map((leave: any) => {
                          const isApproved = leave.status === "APPROVED";
                          const isRejected = leave.status === "REJECTED";
                          return (
                            <div
                              key={leave.id}
                              onClick={() => setSelectedLeaveDetail(leave)}
                              className={`p-1.5 rounded-lg border text-[11px] font-semibold shadow-2xs cursor-pointer transition-all hover:shadow-sm ${
                                isApproved
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-500"
                                  : isRejected
                                  ? "bg-rose-50 border-rose-300 text-rose-900 hover:border-rose-500"
                                  : "bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-500"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">{leave.employee?.name || "Staff"}</span>
                                <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0">
                                  {leave.status === "REQUESTED" ? "PENDING" : leave.status}
                                </span>
                              </div>
                              <p className="text-[10px] opacity-80 truncate mt-0.5">{leave.reason}</p>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-[11px] text-gray-300 italic pt-1 text-center font-mono">
                          No leaves
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode === "table" && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Employee</th>
                    <th className="px-6 py-3 font-semibold">Duration</th>
                    <th className="px-6 py-3 font-semibold">Reason</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLeavesLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Loading leave requests...
                      </td>
                    </tr>
                  ) : paginatedLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaves.map((l: any) => (
                      <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {l.employee?.name || "Staff Member"}
                          </div>
                          <div className="text-xs text-gray-400">{l.employee?.role}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-medium">
                          {new Date(l.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          -{" "}
                          {new Date(l.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{l.reason}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              l.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800"
                                : l.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {l.status === "REQUESTED" ? "PENDING" : l.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isManagerOrOwner ? (
                            l.status === "REQUESTED" ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleStatusUpdate(l.id, "APPROVED")}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(l.id, "REJECTED")}
                                  disabled={isUpdating}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )
                          ) : (
                            <span className="text-xs text-gray-500 font-medium">
                              {l.status === "REQUESTED" ? "Pending Approval" : "Processed"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-gray-50/80 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>per page</span>
                <span className="text-gray-300 mx-1">|</span>
                <span>
                  Showing <strong>{filteredLeaves.length > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + pageSize, filteredLeaves.length)}</strong> of <strong>{filteredLeaves.length}</strong> leave requests
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 font-medium">
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Leave Detail & Approval Popover */}
        {selectedLeaveDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-[#D3232A]/10 text-[#D3232A] flex items-center justify-center font-bold text-sm">
                    {selectedLeaveDetail.employee?.name?.[0] || "E"}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{selectedLeaveDetail.employee?.name || "Staff Member"}</h3>
                    <span className="text-[11px] text-gray-500">{selectedLeaveDetail.employee?.role || "Staff"}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedLeaveDetail(null)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Duration Span</span>
                  <span className="font-bold text-gray-900">
                    {selectedLeaveDetail.startDate} to {selectedLeaveDetail.endDate}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Current Status</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      selectedLeaveDetail.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedLeaveDetail.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedLeaveDetail.status === "REQUESTED" ? "PENDING" : selectedLeaveDetail.status}
                  </span>
                </div>
                <div className="pt-1">
                  <span className="text-gray-500 block mb-1">Reason:</span>
                  <p className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-800 text-xs leading-relaxed">
                    {selectedLeaveDetail.reason}
                  </p>
                </div>
              </div>

              {isManagerOrOwner && selectedLeaveDetail.status === "REQUESTED" && (
                <div className="pt-2 flex gap-3 border-t border-gray-100">
                  <button
                    onClick={() => handleStatusUpdate(selectedLeaveDetail.id, "APPROVED")}
                    disabled={isUpdating}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Leave
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedLeaveDetail.id, "REJECTED")}
                    disabled={isUpdating}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-xs shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Leave
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Request Leave */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">New Leave Application</h3>
                <button onClick={() => setShowCreateModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreateLeaveSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {!isManagerOrOwner ? "Applicant Employee" : "Select Employee"}
                  </label>
                  {!isManagerOrOwner ? (
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        currentEmployee
                          ? `${currentEmployee.name} (${currentEmployee.role})`
                          : user?.name
                          ? `${user.name} (${user.role})`
                          : "Logged-in Employee"
                      }
                      className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-700 font-medium rounded-lg text-sm cursor-not-allowed"
                    />
                  ) : (
                    <select
                      required
                      value={leaveForm.employeeId}
                      onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="">-- Select Employee --</option>
                      {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>
                          {e.name} {e.role ? `(${e.role})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Leave
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide detailed reason..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Leave Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
