"use client";

import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WorkforceHeaderNav from "./WorkforceHeaderNav";
import WorkforceSkeleton from "./WorkforceSkeleton";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
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
    phone: "+91 98989 89898",
    role: "KITCHEN",
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

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);

  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editEmployeeItem, setEditEmployeeItem] = useState<any>(null);
  const [docUploadItem, setDocUploadItem] = useState<any>(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "STAFF",
    designation: "Staff Member",
    joiningDate: "",
    status: "ACTIVE",
    password: "",
    outletIds: [] as string[],
  });

  const filteredEmployees = employees.filter((emp: any) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm);
    const matchesRole = roleFilter === "ALL" || emp.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || emp.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedEmployees = React.useMemo(() => {
    return filteredEmployees.slice(startIndex, startIndex + pageSize);
  }, [filteredEmployees, startIndex, pageSize]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee(formData).unwrap();
      setFeedbackMsg("Employee created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "STAFF",
        designation: "Staff Member",
        joiningDate: "",
        status: "ACTIVE",
        password: "",
        outletIds: [],
      });
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to create employee");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployeeItem) return;
    try {
      const updateData: any = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }

      await updateEmployee({
        id: editEmployeeItem.id,
        ...updateData,
      }).unwrap();

      setFeedbackMsg("Employee profile updated successfully!");
      setEditEmployeeItem(null);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to update employee");
    }
  };

  const handleUploadDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUploadItem || !selectedFile) return;

    try {
      const fd = new FormData();
      fd.append("file", selectedFile);

      await uploadDocument({
        employeeId: docUploadItem.id,
        formData: fd,
      }).unwrap();

      setFeedbackMsg("Document uploaded successfully!");
      setDocUploadItem(null);
      setSelectedFile(null);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to upload document");
    }
  };

  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) return;
    try {
      const fd = new FormData();
      fd.append("file", bulkFile);
      await bulkUpload(fd).unwrap();
      setFeedbackMsg("Staff imported successfully!");
      setShowBulkUploadModal(false);
      setBulkFile(null);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to import staff");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ["Full Name", "Email Address", "Phone Number", "Password", "Job Role", "Joining Date"];
    const rows = [
      ["John Doe", "john.doe@example.com", "9876543210", "Password123", "STAFF", "2024-01-15"],
      ["Jane Smith", "jane.smith@example.com", "9876543211", "Password123", "MANAGER", "2024-02-01"]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "employee_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Directory</h1>
            <p className="text-sm text-gray-500">
              Manage team accounts, view staff profiles, roles, and compliance documents.
            </p>
          </div>
          {isManagerOrOwner ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 text-gray-700 px-4 py-2.5 text-sm font-semibold shadow-2xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Bulk CSV Import
              </button>
              <button
                onClick={() => {
                  const defaultOutletId = activeBranch?.id && activeBranch.id !== "all"
                    ? activeBranch.id
                    : (outlets[0]?.id || "");
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    role: "STAFF",
                    designation: "Staff Member",
                    joiningDate: new Date().toISOString().split("T")[0],
                    status: "ACTIVE",
                    password: "",
                    outletIds: defaultOutletId ? [defaultOutletId] : [],
                  });
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-4 py-2.5 text-sm font-semibold text-white shadow-2xs hover:bg-[#b01e23] transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            </div>
          ) : null}
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Feedback Message Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm font-medium shadow-2xs">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Role-based Content */}
        {isLoading ? (
          <WorkforceSkeleton />
        ) : isManagerOrOwner ? (
          <>
            {/* Metrics Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Total Staff
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-gray-900">{employees.length}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Active Employees
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                      {employees.filter((e: any) => e.status === "ACTIVE").length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                    <UserCheck className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Inactive Staff
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-rose-600">
                      {employees.filter((e: any) => e.status === "INACTIVE").length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3 text-rose-600">
                    <UserX className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Uploaded Docs
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-purple-600">
                      {employees.reduce((acc: number, e: any) => acc + (e.documents?.length || 0), 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff by name, email or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <Filter className="h-3.5 w-3.5 text-gray-400" />
                  <span>Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="BUSINESS_OWNER">Business Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                    <option value="KITCHEN">Kitchen</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                  <span>Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* GOLD STANDARD 4-COLUMN STREAMLINED STAFF TABLE */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/90 text-xs font-bold uppercase tracking-wider text-gray-600 border-b border-gray-200/80">
                    <tr>
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Role & Branch</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/60">
                    {paginatedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-xs font-medium">
                          No employee profiles found matching your search.
                        </td>
                      </tr>
                    ) : (
                      paginatedEmployees.map((emp: any) => (
                        <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* 1. EMPLOYEE (Avatar, Name, Email) */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-[#D3232A]/10 text-[#D3232A] font-bold text-xs flex items-center justify-center border border-red-200/60 shrink-0">
                                {emp.name?.[0] || "E"}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{emp.name}</div>
                                <div className="text-xs text-gray-500 font-medium">
                                  {emp.email || emp.user?.email || emp.phone || "No email provided"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. ROLE & BRANCH */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {emp.designation ? (
                                <span className="inline-flex items-center gap-1 bg-[#D3232A]/10 text-[#D3232A] text-xs px-2.5 py-0.5 rounded-full border border-red-200/80 font-bold">
                                  🏷️ {emp.designation}
                                </span>
                              ) : null}

                              <span
                                className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  emp.role === "BUSINESS_OWNER" && "bg-purple-100 text-purple-800",
                                  emp.role === "MANAGER" && "bg-indigo-100 text-indigo-800",
                                  emp.role === "STAFF" && "bg-blue-100 text-blue-800",
                                  emp.role === "KITCHEN" && "bg-amber-100 text-amber-800"
                                )}
                                title={`System Access Level: ${emp.role}`}
                              >
                                {emp.role}
                              </span>

                              {emp.user?.outlets && emp.user.outlets.length > 0 ? (
                                emp.user.outlets.map((u: any) => (
                                  <span
                                    key={u.outlet.id}
                                    className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-md border border-gray-200 font-medium"
                                  >
                                    <Building2 className="h-3 w-3 text-gray-400" />
                                    {u.outlet.name}
                                  </span>
                                ))
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[11px] px-2 py-0.5 rounded-md border border-gray-200 font-medium">
                                  <Building2 className="h-3 w-3 text-gray-400" />
                                  Default Branch
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. STATUS */}
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full",
                                emp.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                  : "bg-rose-50 text-rose-700 border border-rose-200/80"
                              )}
                            >
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  emp.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                                )}
                              />
                              {emp.status}
                            </span>
                          </td>

                          {/* 4. ACTIONS (Eye, Upload, Edit) */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* 👁️ Eye Icon: View Full Employee Profile */}
                              <button
                                onClick={() => setSelectedEmployeeDetail(emp)}
                                title="View Employee Profile & Details"
                                className="p-1.5 rounded-xl text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer border border-indigo-200/80 shadow-2xs"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {/* Upload Document Icon */}
                              <button
                                onClick={() => {
                                  setDocUploadItem(emp);
                                  setSelectedFile(null);
                                }}
                                title="Upload Compliance Document"
                                className="p-1.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer border border-gray-200 shadow-2xs"
                              >
                                <Upload className="h-4 w-4" />
                              </button>

                              {/* Edit Profile Icon */}
                              <button
                                onClick={() => {
                                  setEditEmployeeItem(emp);
                                  const assignedOutlets = emp.user?.outlets && emp.user.outlets.length > 0
                                    ? emp.user.outlets.map((u: any) => u.outlet.id)
                                    : (emp.outletId ? [emp.outletId] : []);
                                  setFormData({
                                    name: emp.name,
                                    email: emp.email || emp.user?.email || "",
                                    phone: emp.phone || "",
                                    role: emp.role || "STAFF",
                                    designation: emp.designation || emp.role || "Staff Member",
                                    joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
                                    status: emp.status || "ACTIVE",
                                    password: "",
                                    outletIds: assignedOutlets,
                                  });
                                }}
                                title="Edit Employee Profile"
                                className="p-1.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer border border-gray-200 shadow-2xs"
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
                    Showing <strong>{filteredEmployees.length > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + pageSize, filteredEmployees.length)}</strong> of <strong>{filteredEmployees.length}</strong> staff members
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1}
                    className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 font-medium">
                    Page {safeCurrentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Modal: Bulk CSV Import */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
                <h3 className="text-lg font-bold text-gray-900">Bulk CSV Import</h3>
                <button onClick={() => setShowBulkUploadModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleBulkUploadSubmit} className="flex flex-col">
                <div className="p-6 space-y-5">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900">Format Requirements</h4>
                        <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                          The CSV must include the following column headers exactly: 
                          <span className="font-mono bg-blue-100/50 px-1.5 py-0.5 rounded mx-1 text-[11px]">Full Name</span>,
                          <span className="font-mono bg-blue-100/50 px-1.5 py-0.5 rounded mx-1 text-[11px]">Email Address</span>,
                          <span className="font-mono bg-blue-100/50 px-1.5 py-0.5 rounded mx-1 text-[11px]">Password</span>,
                          <span className="font-mono bg-blue-100/50 px-1.5 py-0.5 rounded mx-1 text-[11px]">Phone Number</span>,
                          <span className="font-mono bg-blue-100/50 px-1.5 py-0.5 rounded mx-1 text-[11px]">Job Role</span>, and optionally
                          <span className="font-mono bg-blue-100/50 px-1.5 py-0.5 rounded mx-1 text-[11px]">Joining Date</span>.
                        </p>
                        <button
                          type="button"
                          onClick={handleDownloadTemplate}
                          className="mt-3 text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Download Sample Template
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CSV File <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      required
                      onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowBulkUploadModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkUploading || !bulkFile}
                    className="px-4 py-2 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-2xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isBulkUploading ? (
                      <>
                        <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Upload & Import
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create Employee */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
                <h3 className="text-lg font-bold text-gray-900">Add New Employee</h3>
                <button onClick={() => setShowCreateModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleCreateSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address (Login Username) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul.verma@alayn.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Login Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-[#D3232A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operational Designation / Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Waiter, Head Chef, Barista, Order Captain, Junior Manager..."
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App Access Level (RBAC) <span className="text-red-500">*</span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="STAFF">Staff (Basic Access)</option>
                      <option value="MANAGER">Manager (Shift & Outlets Access)</option>
                      <option value="KITCHEN">Kitchen (KDS Display Access)</option>
                      <option value="BUSINESS_OWNER">Business Owner (Full Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2">
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
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-white">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isCreating ? "Saving..." : "Create Employee"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Employee */}
        {editEmployeeItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
                <h3 className="text-lg font-bold text-gray-900">Edit Employee Profile</h3>
                <button onClick={() => setEditEmployeeItem(null)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

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
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>

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
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-[#D3232A]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operational Designation / Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Waiter, Head Chef, Barista, Order Captain, Junior Manager..."
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      App Access Level (RBAC) <span className="text-red-500">*</span>
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="STAFF">Staff (Basic Access)</option>
                      <option value="MANAGER">Manager (Shift & Outlets Access)</option>
                      <option value="KITCHEN">Kitchen (KDS Display Access)</option>
                      <option value="BUSINESS_OWNER">Business Owner (Full Admin)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2">
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
                    <div className="space-y-1.5 max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-white">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditEmployeeItem(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdating ? "Updating..." : "Update Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Upload Document */}
        {docUploadItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
                <button onClick={() => setDocUploadItem(null)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleUploadDocSubmit} className="p-6 space-y-4">
                <p className="text-sm text-gray-600">
                  Upload verification/compliance document for <strong>{docUploadItem.name}</strong>.
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#D3232A] transition-colors cursor-pointer bg-gray-50">
                  <input
                    type="file"
                    required
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm font-semibold text-[#D3232A]">
                      {selectedFile ? selectedFile.name : "Click to choose PDF or Image"}
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setDocUploadItem(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="px-4 py-2 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Employee Profile & Deep Details (👁️ Eye Icon) */}
        {selectedEmployeeDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 animate-in fade-in duration-200">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#1A2335] text-white p-6 relative">
                <button
                  onClick={() => setSelectedEmployeeDetail(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-[#D3232A] text-white font-extrabold text-2xl flex items-center justify-center border-2 border-white/20 shadow-md shrink-0">
                    {selectedEmployeeDetail.name?.[0] || "E"}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white">{selectedEmployeeDetail.name}</h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                          selectedEmployeeDetail.role === "BUSINESS_OWNER" && "bg-purple-500/20 text-purple-200 border border-purple-400/30",
                          selectedEmployeeDetail.role === "MANAGER" && "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30",
                          selectedEmployeeDetail.role === "STAFF" && "bg-blue-500/20 text-blue-200 border border-blue-400/30",
                          selectedEmployeeDetail.role === "KITCHEN" && "bg-amber-500/20 text-amber-200 border border-amber-400/30"
                        )}
                      >
                        {selectedEmployeeDetail.role}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full",
                          selectedEmployeeDetail.status === "ACTIVE"
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            selectedEmployeeDetail.status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                          )}
                        />
                        {selectedEmployeeDetail.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details Content */}
              <div className="p-6 space-y-5 text-xs text-gray-700 max-h-[70vh] overflow-y-auto">
                {/* Contact & Personal Info Grid */}
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Contact & Personal Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Login Email</span>
                        <span className="font-bold text-gray-900">{selectedEmployeeDetail.email || selectedEmployeeDetail.user?.email || "No email"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Phone Number</span>
                        <span className="font-bold text-gray-900">{selectedEmployeeDetail.phone || "Not provided"}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Joining Date</span>
                        <span className="font-bold text-gray-900">
                          {selectedEmployeeDetail.joiningDate
                            ? new Date(selectedEmployeeDetail.joiningDate).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Not specified"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 block font-medium">Primary Branch</span>
                        <span className="font-bold text-gray-900">
                          {selectedEmployeeDetail.user?.outlets?.[0]?.outlet?.name || "Main Outlet"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Outlets Section */}
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Assigned Branches ({selectedEmployeeDetail.user?.outlets?.length || 1})
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEmployeeDetail.user?.outlets && selectedEmployeeDetail.user.outlets.length > 0 ? (
                      selectedEmployeeDetail.user.outlets.map((u: any) => (
                        <span
                          key={u.outlet.id}
                          className="inline-flex items-center gap-1.5 bg-white text-gray-800 text-xs px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs font-semibold"
                        >
                          <Building2 className="h-3.5 w-3.5 text-[#D3232A]" />
                          {u.outlet.name}
                          <span className="text-[10px] text-gray-400 font-mono">({u.outlet.city})</span>
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-white text-gray-800 text-xs px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs font-semibold">
                        <Building2 className="h-3.5 w-3.5 text-[#D3232A]" />
                        Main Outlet
                      </span>
                    )}
                  </div>
                </div>

                {/* Uploaded Verification & Compliance Documents Section */}
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Verification Documents ({selectedEmployeeDetail.documents?.length || 0})
                    </h3>
                    <button
                      onClick={() => {
                        setDocUploadItem(selectedEmployeeDetail);
                        setSelectedEmployeeDetail(null);
                      }}
                      className="text-[11px] font-bold text-[#D3232A] hover:bg-red-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      Upload Document
                    </button>
                  </div>

                  {selectedEmployeeDetail.documents && selectedEmployeeDetail.documents.length > 0 ? (
                    <div className="space-y-1.5">
                      {selectedEmployeeDetail.documents.map((doc: any, i: number) => (
                        <div
                          key={doc.id || i}
                          className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200 text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 font-semibold text-gray-800 truncate">
                            <FileText className="h-4 w-4 text-purple-600 shrink-0" />
                            <span className="truncate">{doc.name || `Document_${i + 1}`}</span>
                          </div>
                          {doc.url && (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-gray-500 hover:text-[#D3232A] rounded transition-colors"
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No verification documents uploaded yet.</p>
                  )}
                </div>
              </div>

              {/* Profile Footer Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedEmployeeDetail(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const emp = selectedEmployeeDetail;
                    setSelectedEmployeeDetail(null);
                    setEditEmployeeItem(emp);
                    const assignedOutlets = emp.user?.outlets && emp.user.outlets.length > 0
                      ? emp.user.outlets.map((u: any) => u.outlet.id)
                      : (emp.outletId ? [emp.outletId] : []);
                    setFormData({
                      name: emp.name,
                      email: emp.email || emp.user?.email || "",
                      phone: emp.phone || "",
                      role: emp.role || "STAFF",
                      designation: emp.designation || emp.role || "Staff Member",
                      joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : "",
                      status: emp.status || "ACTIVE",
                      password: "",
                      outletIds: assignedOutlets,
                    });
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
