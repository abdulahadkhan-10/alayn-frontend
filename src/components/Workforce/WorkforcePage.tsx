"use client";

import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WorkforceHeaderNav from "./WorkforceHeaderNav";
import {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useUploadDocumentMutation,
  useBulkUploadEmployeesMutation,
} from "@/redux/slices/employeeApiSlice";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import { useBranch } from "@/lib/BranchContext";
import {
  Users,
  UserCheck,
  UserX,
  FileText,
  Plus,
  Search,
  Filter,
  Upload,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Mail,
  Lock,
  FileSpreadsheet,
  Download,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ArrowRightLeft,
} from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";
import { cn } from "@/lib/utils";

const DEMO_EMPLOYEES = [
  {
    id: "demo-1",
    name: "Rohan Sharma",
    email: "rohan.sharma@alayn.com",
    phone: "+91 98765 43210",
    role: "MANAGER",
    joiningDate: "2024-01-15",
    status: "ACTIVE",
    documents: [{ id: "d1", name: "Aadhar_Card.pdf" }],
  },
  {
    id: "demo-2",
    name: "Priya Patel",
    email: "priya.patel@alayn.com",
    phone: "+91 98123 45678",
    role: "STAFF",
    joiningDate: "2024-03-01",
    status: "ACTIVE",
    documents: [],
  },
  {
    id: "demo-3",
    name: "Amit Kumar",
    email: "amit.kumar@alayn.com",
    phone: "+91 97111 22233",
    role: "KITCHEN",
    joiningDate: "2024-02-10",
    status: "ACTIVE",
    documents: [{ id: "d2", name: "Contract_Signed.pdf" }],
  },
  {
    id: "demo-4",
    name: "Sneha Reddy",
    email: "sneha.reddy@alayn.com",
    phone: "+91 99887 76655",
    role: "STAFF",
    joiningDate: "2023-11-20",
    status: "INACTIVE",
    documents: [],
  },
];

import { useGetShiftsQuery } from "@/redux/slices/shiftApiSlice";

export default function WorkforcePage() {
  const { activeBranch } = useBranch();
  const outletId = activeBranch?.id === "all" ? undefined : activeBranch?.id;
  const { data: apiData, isLoading } = useGetEmployeesQuery(outletId ? { outletId } : undefined);
  const { data: outletsData } = useGetOutletsQuery();
  const { data: shiftsData } = useGetShiftsQuery(outletId ? { outletId } : undefined);
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: isUpdating }] = useUpdateEmployeeMutation();
  const [uploadDocument, { isLoading: isUploading }] = useUploadDocumentMutation();
  const [bulkUpload, { isLoading: isBulkUploading }] = useBulkUploadEmployeesMutation();

  const employees = apiData?.data || (isLoading ? [] : DEMO_EMPLOYEES);
  const outlets: any[] = Array.isArray(outletsData)
    ? outletsData
    : (outletsData as any)?.data || [];
  const shifts = shiftsData?.data || [];

  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

  const currentEmployee = React.useMemo(() => {
    return employees.find(
      (e: any) => e.userId === user?.id || (user?.email && e.email === user?.email)
    );
  }, [employees, user]);

  const myAssignments = React.useMemo(() => {
    if (!currentEmployee) return [];
    const list: any[] = [];
    (shifts || []).forEach((s: any) => {
      (s.assignments || []).forEach((a: any) => {
        if (a.employeeId === currentEmployee.id || a.employee?.userId === user?.id) {
          const aDate = new Date(a.date).toISOString().split("T")[0];
          list.push({
            shiftId: s.id,
            shiftName: s.name,
            startTime: s.startTime,
            endTime: s.endTime,
            dateISO: aDate,
            outletName: s.outlet?.name,
          });
        }
      });
    });
    return list;
  }, [shifts, currentEmployee, user]);

  const todayISO = new Date().toISOString().split("T")[0];
  const todayAssignment = React.useMemo(() => {
    return myAssignments.find((a) => a.dateISO === todayISO) || myAssignments[0];
  }, [myAssignments, todayISO]);

  const weekSchedule = React.useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + monOffset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateISO = d.toISOString().split("T")[0];
      const match = myAssignments.find((a) => a.dateISO === dateISO);

      days.push({
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        dateISO,
        shift: match ? `${match.startTime} - ${match.endTime}` : "OFF",
        shiftName: match ? match.shiftName : null,
        status: dateISO === todayISO ? "Active" : match ? "Upcoming" : "Off Day",
      });
    }
    return days;
  }, [myAssignments, todayISO]);

  const [showSwapModal, setShowSwapModal] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isManagerOrOwner ? "Workforce Management" : "My Shift Calendar"}
            </h1>
            <p className="text-sm text-gray-500">
              {isManagerOrOwner
                ? "Manage staff profiles, roles, documents, and directory records."
                : "View your assigned shifts, upcoming schedules, and request shift swaps."}
            </p>
          </div>
          {isManagerOrOwner ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setBulkFile(null);
                  setBulkResult(null);
                  setShowBulkModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Bulk Upload (Excel)
              </button>
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b01e23] transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSwapModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b01e23] transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Request Shift Swap
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Feedback Message Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Role-based Content: Manager/Owner gets Directory, Staff gets Shift Calendar */}
        {isManagerOrOwner ? (
          <>
            {/* Metrics Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Staff
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{employees.length}</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Employees
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-emerald-600">
                      {employees.filter((e: any) => e.status === "ACTIVE").length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                    <UserCheck className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inactive Staff
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-rose-600">
                      {employees.filter((e: any) => e.status === "INACTIVE").length}
                    </p>
                  </div>
                  <div className="rounded-lg bg-rose-50 p-3 text-rose-600">
                    <UserX className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded Docs
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-blue-600">
                      {employees.reduce((acc: number, e: any) => acc + (e.documents?.length || 0), 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employee by name or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A] bg-white"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="BUSINESS_OWNER">Business Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                    <option value="KITCHEN">Kitchen</option>
                  </select>
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]/20 focus:border-[#D3232A] bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Directory Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3.5">Employee Name</th>
                      <th className="px-6 py-3.5">Contact & Email</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Branch(es)</th>
                      <th className="px-6 py-3.5">Joining Date</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Documents</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">
                          No employee profiles found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp: any) => (
                        <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">{emp.name}</td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-900">{emp.phone}</div>
                            <div className="text-xs text-gray-500">{emp.email || emp.user?.email || "No login email"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                                emp.role === "BUSINESS_OWNER" && "bg-purple-100 text-purple-800",
                                emp.role === "MANAGER" && "bg-indigo-100 text-indigo-800",
                                emp.role === "STAFF" && "bg-blue-100 text-blue-800",
                                emp.role === "KITCHEN" && "bg-amber-100 text-amber-800"
                              )}
                            >
                              {emp.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {emp.user?.outlets && emp.user.outlets.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {emp.user.outlets.map((u: any) => (
                                  <span
                                    key={u.outlet.id}
                                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded border border-gray-200 font-medium"
                                  >
                                    <Building2 className="h-3 w-3 text-gray-400" />
                                    {u.outlet.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Default Branch</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {new Date(emp.joiningDate).toLocaleDateString(undefined, {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-medium",
                                emp.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  emp.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                                )}
                              />
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FileText className="h-3.5 w-3.5" />
                              <span>{emp.documents?.length || 0} File(s)</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setDocUploadItem(emp);
                                  setSelectedFile(null);
                                }}
                                title="Upload Document"
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <Upload className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditEmployeeItem(emp);
                                  const assignedOutlets = emp.user?.outlets && emp.user.outlets.length > 0
                                    ? emp.user.outlets.map((u: any) => u.outlet.id)
                                    : (emp.outletId ? [emp.outletId] : []);
                                  setFormData({
                                    name: emp.name,
                                    email: emp.email || emp.user?.email || "",
                                    password: "",
                                    phone: emp.phone,
                                    role: emp.role,
                                    joiningDate: new Date(emp.joiningDate)
                                      .toISOString()
                                      .split("T")[0],
                                    status: emp.status,
                                    outletIds: assignedOutlets,
                                  });
                                }}
                                title="Edit Employee"
                                className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Staff Personal Shift Schedule & Swaps View */
          <div className="space-y-6">
            {/* Active Shift Card */}
            <div className="bg-gradient-to-r from-[#0B1221] to-[#1F2B42] text-white rounded-2xl p-6 shadow-md border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Today's Assigned Shift</span>
                <h2 className="text-xl font-bold mt-1 text-white">
                  {todayAssignment
                    ? `${todayAssignment.shiftName} (${todayAssignment.startTime} to ${todayAssignment.endTime})`
                    : "No Shift Assigned Today (Off Day)"}
                </h2>
                <p className="text-xs text-zinc-300 mt-1 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  Assigned Branch: {todayAssignment?.outletName || activeBranch?.name || "Main Branch"}
                </p>
              </div>
              <a
                href="/workforce/attendance"
                className="inline-flex items-center gap-2 bg-[#D3232A] hover:bg-[#b01e23] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <ClockIcon className="h-4 w-4" />
                Go to Attendance Terminal
              </a>
            </div>

            {/* Weekly Schedule Grid */}
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-[#D3232A]" />
                This Week's Assigned Roster
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-xl border p-3.5 text-center flex flex-col justify-between h-32 transition-all",
                      item.status === "Active"
                        ? "border-[#D3232A] bg-red-50/30 shadow-xs font-semibold"
                        : item.shift === "OFF"
                        ? "border-gray-200 bg-gray-50 opacity-60"
                        : "border-gray-200 bg-white"
                    )}
                  >
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase">{item.dayName}</span>
                      <div className="text-xs font-medium text-gray-900">{item.dateLabel}</div>
                    </div>
                    <div className="my-1">
                      {item.shiftName && (
                        <div className="text-[10px] text-gray-500 truncate">{item.shiftName}</div>
                      )}
                      <span className={cn("text-xs font-bold block", item.shift === "OFF" ? "text-gray-400" : "text-[#D3232A]")}>
                        {item.shift}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-500">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shift Swaps Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
                  My Shift Swaps & Trade Requests
                </h3>
                <button
                  onClick={() => setShowSwapModal(true)}
                  className="text-xs font-semibold text-[#D3232A] hover:underline"
                >
                  + Request New Swap
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Need to trade a shift with a coworker? Submit a swap request for approval by your team manager.
              </p>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center text-xs text-gray-500">
                No active shift swap requests pending. Click "+ Request New Swap" if you need to trade shifts.
              </div>
            </div>
          </div>
        )}

        {/* Add Employee Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 my-8">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add New Employee</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Registers employee profile & user login account</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Verma"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (Login Username) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rahul.verma@alayn.com"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Login Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Employee will use this password to log into their account dashboard.
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          role: newRole,
                          outletIds: newRole !== "MANAGER" && prev.outletIds.length > 1
                            ? [prev.outletIds[0]]
                            : prev.outletIds,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="KITCHEN">Kitchen</option>
                      <option value="BUSINESS_OWNER">Business Owner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Branch / Outlet Selection */}
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned Branch / Outlet <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                      {formData.role === "MANAGER" ? "Multi-Branch Allowed" : "Single Branch"}
                    </span>
                  </div>

                  {outlets.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No outlets found. Employee will be linked to default branch.</p>
                  ) : formData.role === "MANAGER" ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                      {outlets.map((outlet: any) => {
                        const isChecked = formData.outletIds.includes(outlet.id);
                        return (
                          <label key={outlet.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    outletIds: [...prev.outletIds, outlet.id],
                                  }));
                                } else {
                                  if (formData.outletIds.length > 1) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      outletIds: prev.outletIds.filter((id) => id !== outlet.id),
                                    }));
                                  }
                                }
                              }}
                              className="rounded border-gray-300 text-[#D3232A] focus:ring-[#D3232A]"
                            />
                            <span className="font-medium">{outlet.name}</span>
                            <span className="text-[10px] text-gray-400 ml-auto">{outlet.city}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <select
                      value={formData.outletIds[0] || ""}
                      onChange={(e) => setFormData({ ...formData, outletIds: [e.target.value] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      {outlets.map((outlet: any) => (
                        <option key={outlet.id} value={outlet.id}>
                          {outlet.name} ({outlet.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joiningDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isCreating ? "Saving & Registering..." : "Save Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Employee Modal */}
        {editEmployeeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 my-8">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Employee Profile</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Update credentials, branch assignments & details</p>
                </div>
                <button
                  onClick={() => setEditEmployeeItem(null)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (Login Username) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. rahul.verma@alayn.com"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>

                {/* New Password (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password (Optional)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Leave empty to keep existing password"
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Enter a new password only if you want to reset this employee's login password.
                  </p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-[#D3232A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          role: newRole,
                          outletIds: newRole !== "MANAGER" && prev.outletIds.length > 1
                            ? [prev.outletIds[0]]
                            : prev.outletIds,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="STAFF">Staff</option>
                      <option value="MANAGER">Manager</option>
                      <option value="KITCHEN">Kitchen</option>
                      <option value="BUSINESS_OWNER">Business Owner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Branch / Outlet Selection */}
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Assigned Branch / Outlet <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                      {formData.role === "MANAGER" ? "Multi-Branch Allowed" : "Single Branch"}
                    </span>
                  </div>

                  {outlets.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No outlets found.</p>
                  ) : formData.role === "MANAGER" ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                      {outlets.map((outlet: any) => {
                        const isChecked = formData.outletIds.includes(outlet.id);
                        return (
                          <label key={outlet.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    outletIds: [...prev.outletIds, outlet.id],
                                  }));
                                } else {
                                  if (formData.outletIds.length > 1) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      outletIds: prev.outletIds.filter((id) => id !== outlet.id),
                                    }));
                                  }
                                }
                              }}
                              className="rounded border-gray-300 text-[#D3232A] focus:ring-[#D3232A]"
                            />
                            <span className="font-medium">{outlet.name}</span>
                            <span className="text-[10px] text-gray-400 ml-auto">{outlet.city}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <select
                      value={formData.outletIds[0] || ""}
                      onChange={(e) => setFormData({ ...formData, outletIds: [e.target.value] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      {outlets.map((outlet: any) => (
                        <option key={outlet.id} value={outlet.id}>
                          {outlet.name} ({outlet.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) =>
                      setFormData({ ...formData, joiningDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setEditEmployeeItem(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? "Updating..." : "Update Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Upload Document Modal */}
        {docUploadItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">
                  Upload Document for {docUploadItem.name}
                </h3>
                <button
                  onClick={() => setDocUploadItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleDocSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select File (PDF, PNG, JPEG, DOC - Max 5MB)
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#D3232A]/10 file:text-[#D3232A] hover:file:bg-[#D3232A]/20"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setDocUploadItem(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload Document"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Bulk Upload Modal */}
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 my-8">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Bulk Upload Employees</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Import employees via Excel or CSV spreadsheet</p>
                </div>
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleBulkSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-purple-600 shrink-0" />
                    <span>Download sample template format file.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-1 bg-white border border-purple-300 px-2.5 py-1 rounded font-medium text-purple-700 hover:bg-purple-100 transition-colors shadow-xs cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Template (.csv)
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-300 hover:border-[#D3232A] rounded-xl p-6 text-center bg-gray-50/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBulkFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-700">
                    {bulkFile ? bulkFile.name : "Click to upload or drag & drop Excel / CSV file"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv up to 10MB</p>
                </div>

                {bulkResult && (
                  <div className="space-y-2 rounded-lg border border-gray-200 p-3 bg-gray-50 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-emerald-700">Success: {bulkResult.successCount}</span>
                      <span className="text-rose-700">Skipped: {bulkResult.skippedCount}</span>
                    </div>
                    {bulkResult.errors && bulkResult.errors.length > 0 && (
                      <div className="max-h-28 overflow-y-auto space-y-1 pt-1 border-t border-gray-200">
                        {bulkResult.errors.map((err: any, idx: number) => (
                          <div key={idx} className="text-rose-600 text-[11px]">
                            Row {err.row}: {err.message} {err.email ? `(${err.email})` : ""}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!bulkFile || isBulkUploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isBulkUploading ? "Processing Excel File..." : "Upload & Register"}
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
