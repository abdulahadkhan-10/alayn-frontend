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

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const filteredLeaves = userLeaves.filter(
    (l: any) => statusFilter === "ALL" || l.status === statusFilter
  );

  const pendingCount = userLeaves.filter((l: any) => l.status === "REQUESTED").length;
  const approvedCount = userLeaves.filter((l: any) => l.status === "APPROVED").length;
  const rejectedCount = userLeaves.filter((l: any) => l.status === "REJECTED").length;

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
            <h1 className="text-2xl font-bold text-gray-900">
              {isManagerOrOwner ? "Leave Approvals & Requests" : "My Leave Requests"}
            </h1>
            <p className="text-sm text-gray-500">
              {isManagerOrOwner
                ? "Review, approve, or reject employee leave applications."
                : "Submit time-off requests and track the approval status of your applications."}
            </p>
          </div>
          {!isManagerOrOwner && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b01e23] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Apply for Leave
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metrics Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending Approvals
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">{pendingCount}</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approved Leaves
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">{approvedCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rejected Leaves
                </p>
                <p className="mt-1 text-2xl font-semibold text-rose-600">{rejectedCount}</p>
              </div>
              <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
                <XCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter Status:</span>
          </div>
          <div className="flex items-center gap-2">
            {["ALL", "REQUESTED", "APPROVED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? "bg-[#D3232A] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st === "REQUESTED" ? "PENDING" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Leave Requests Table */}
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
                ) : filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No leave requests found.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {l.employee?.name || "Staff Member"}
                        </div>
                        <div className="text-xs text-gray-400">{l.employee?.role}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            l.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-800"
                              : l.status === "REJECTED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isManagerOrOwner ? (
                          l.status === "REQUESTED" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleStatusUpdate(l.id, "APPROVED")}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(l.id, "REJECTED")}
                                disabled={isUpdating}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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
        </div>

        {/* Modal: Request Leave */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">New Leave Application</h3>
                <button onClick={() => setShowCreateModal(false)}>
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
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg shadow-sm disabled:opacity-50"
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
