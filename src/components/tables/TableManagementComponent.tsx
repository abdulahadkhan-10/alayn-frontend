import React, { useState, useEffect, useMemo, useCallback } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  QrCode,
  Plus,
  Printer,
  Trash2,
  Wind,
  Sun,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  LayoutGrid,
  Layers,
  Users,
  UserCheck,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import {
  fetchTables,
  createBulkTables,
  updateTable,
  deleteTable,
  regenerateTableQRToken,
  TableItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "../common/QRCodeSVG";
import { showToast } from "@/lib/toast";

type FilterType = "ALL" | "AC" | "NON_AC" | "AVAILABLE" | "OCCUPIED";

export default function TableManagementComponent() {
  const { activeBranch } = useBranch();
  const currentOutletId = activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;

  // RTK Query staff employees
  const { data: rawEmployees } = useGetEmployeesQuery(undefined);
  const staffList = useMemo(() => {
    if (!rawEmployees) return [];
    const list = Array.isArray(rawEmployees) ? rawEmployees : (rawEmployees as any)?.data || [];
    return list;
  }, [rawEmployees]);

  // Data state
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  // Add tables modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [acCount, setAcCount] = useState<string | number>(0);
  const [nonAcCount, setNonAcCount] = useState<string | number>(0);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Print modals
  const [printTable, setPrintTable] = useState<TableItem | null>(null);
  const [showBulkPrint, setShowBulkPrint] = useState(false);

  // Assign staff modal & search state
  const [assignStaffTable, setAssignStaffTable] = useState<TableItem | null>(null);
  const [staffSearch, setStaffSearch] = useState("");

  // Per-table action loading
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadTables = useCallback(async () => {
    if (!currentOutletId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetchTables(currentOutletId);
    if (res.ok && res.tables) {
      setTables(res.tables);
    } else {
      setError(res.error || "Failed to load tables");
    }
    setLoading(false);
  }, [currentOutletId]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOutletId) return;

    const parsedAc = parseInt(String(acCount), 10) || 0;
    const parsedNonAc = parseInt(String(nonAcCount), 10) || 0;

    if (parsedAc === 0 && parsedNonAc === 0) {
      setAddError("Please add at least 1 AC or Non-AC table.");
      return;
    }

    setSubmittingAdd(true);
    setAddError(null);
    const res = await createBulkTables(currentOutletId, parsedAc, parsedNonAc);
    setSubmittingAdd(false);

    if (res.ok) {
      setShowAddModal(false);
      loadTables();
    } else {
      setAddError(res.error || "Failed to create tables.");
    }
  };

  const handleToggleStatus = async (table: TableItem) => {
    if (!currentOutletId) return;
    const newStatus = table.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE";
    setPendingId(table.id);
    const res = await updateTable(currentOutletId, table.id, { status: newStatus });
    setPendingId(null);
    if (res.ok) {
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, status: newStatus } : t))
      );
    } else {
      setError(res.error || "Failed to update status.");
    }
  };

  const handleAssignStaff = async (table: TableItem, staffId: string) => {
    if (!currentOutletId) return;
    const assignedStaffId = staffId === "" ? null : staffId;
    setPendingId(table.id);
    const res = await updateTable(currentOutletId, table.id, { assignedStaffId });
    setPendingId(null);
    if (res.ok) {
      loadTables();
    } else {
      setError(res.error || "Failed to assign staff.");
    }
  };

  const handleRegenerateQR = async (table: TableItem) => {
    if (!currentOutletId) return;
    setPendingId(table.id);
    const res = await regenerateTableQRToken(currentOutletId, table.id);
    setPendingId(null);
    if (res.ok && res.token) {
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, currentToken: res.token! } : t))
      );
      if (printTable?.id === table.id) {
        setPrintTable((prev) => (prev ? { ...prev, currentToken: res.token! } : null));
      }
    } else {
      setError(res.error || "Failed to regenerate QR token.");
    }
  };

  const handleDeleteTable = async (table: TableItem) => {
    if (!currentOutletId) return;
    if (!window.confirm(`Delete Table ${table.tableNumber}? This cannot be undone.`)) return;
    setPendingId(table.id);
    const res = await deleteTable(currentOutletId, table.id);
    setPendingId(null);
    if (res.ok) {
      loadTables();
    } else {
      setError(res.error || "Failed to delete table.");
    }
  };

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (filter === "AC" && t.tableType !== "AC") return false;
      if (filter === "NON_AC" && t.tableType !== "NON_AC") return false;
      if (filter === "AVAILABLE" && t.status !== "AVAILABLE") return false;
      if (filter === "OCCUPIED" && t.status !== "OCCUPIED") return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesNo = String(t.tableNumber).includes(query);
        const matchesStaff = t.assignedStaff?.name?.toLowerCase().includes(query);
        if (!matchesNo && !matchesStaff) return false;
      }

      return true;
    });
  }, [tables, filter, search]);

  const stats = useMemo(() => {
    const total = tables.length;
    const acCount = tables.filter((t) => t.tableType === "AC").length;
    const nonAcCount = tables.filter((t) => t.tableType === "NON_AC").length;
    const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
    const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
    return { total, acCount, nonAcCount, availableCount, occupiedCount };
  }, [tables]);

  const getTableOrderUrl = (token: string | null) => {
    if (!token) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `${origin}/order?token=${token}`;
  };

  const copyOrderUrl = (token: string | null) => {
    const url = getTableOrderUrl(token);
    if (!url) return;
    navigator.clipboard.writeText(url);
    showToast.success("Link Copied", "Customer order URL copied to clipboard.");
  };

  const StatCard = ({
    label,
    value,
    icon: Icon,
    colorClass,
    bgClass,
  }: {
    label: string;
    value: number;
    icon: React.ElementType;
    colorClass: string;
    bgClass: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-4 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        <h3 className={`text-2xl font-extrabold mt-1 ${colorClass}`}>{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${bgClass}`}>
        <Icon className={`w-5 h-5 ${colorClass}`} />
      </div>
    </div>
  );

  const TableCard = ({ table }: { table: TableItem }) => {
    const isAc = table.tableType === "AC";
    const isOccupied = table.status === "OCCUPIED";
    const isPending = pendingId === table.id;
    const orderUrl = getTableOrderUrl(table.currentToken);

    return (
      <div
        className={cn(
          "bg-white rounded-2xl border flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg group relative",
          isOccupied ? "border-rose-200 shadow-rose-50 shadow-sm" : "border-gray-200 shadow-sm"
        )}
      >
        {/* Top color bar — status indicator */}
        <div
          className={cn(
            "h-1 w-full",
            isOccupied
              ? "bg-gradient-to-r from-rose-400 to-rose-500"
              : "bg-gradient-to-r from-emerald-400 to-emerald-500"
          )}
        />

        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Dining Table
              </p>
              <h3 className="text-lg font-extrabold text-[#1B2A4A] leading-tight mt-0.5">
                # {table.tableNumber}
              </h3>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
                  isAc
                    ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {isAc ? <Wind className="w-2.5 h-2.5" /> : <Sun className="w-2.5 h-2.5" />}
                {isAc ? "AC" : "Non-AC"}
              </span>
              <button
                type="button"
                onClick={() => handleToggleStatus(table)}
                disabled={isPending}
                className={cn(
                  "cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all hover:scale-105",
                  isOccupied
                    ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isOccupied ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                  )}
                />
                {isOccupied ? "Occupied" : "Available"}
              </button>
            </div>
          </div>

          {/* QR Code Display & Quick Link */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex flex-col items-center justify-center relative group/qr">
            {orderUrl ? (
              <div
                onClick={() => setPrintTable(table)}
                className="cursor-pointer flex flex-col items-center"
                title="Click to view & print full QR sticker"
              >
                <QRCodeSVG value={orderUrl} size={110} fgColor="#1B2A4A" bgColor="#F9FAFB" />
                <p className="text-[10px] font-bold text-[#1B2A4A] mt-2 flex items-center gap-1 group-hover/qr:text-[#D3232A] transition-colors">
                  <QrCode className="w-3 h-3 text-[#D3232A]" />
                  Scan to Order
                </p>
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-[11px] text-gray-500 font-medium">No QR token found</p>
                <button
                  type="button"
                  onClick={() => handleRegenerateQR(table)}
                  disabled={isPending}
                  className="px-2.5 py-1 text-[10px] font-bold bg-[#1B2A4A] text-white rounded-lg hover:bg-[#D3232A] transition"
                >
                  Generate Token
                </button>
              </div>
            )}

            {orderUrl && (
              <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-gray-200/60 w-full justify-center">
                <button
                  type="button"
                  onClick={() => copyOrderUrl(table.currentToken)}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-md text-[10px] font-bold text-gray-600 hover:text-[#1B2A4A] hover:bg-gray-100 transition flex items-center gap-1 cursor-pointer"
                  title="Copy menu URL"
                >
                  <Copy className="w-2.5 h-2.5 text-gray-400" />
                  Copy Link
                </button>
                <a
                  href={orderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 bg-white border border-gray-200 rounded-md text-[10px] font-bold text-gray-600 hover:text-[#D3232A] hover:bg-gray-100 transition flex items-center gap-1 cursor-pointer"
                  title="Open customer order page"
                >
                  <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                  Test Menu
                </a>
                <button
                  type="button"
                  onClick={() => handleRegenerateQR(table)}
                  disabled={isPending}
                  className="p-1 bg-white border border-gray-200 rounded-md text-gray-400 hover:text-[#D3232A] hover:bg-gray-100 transition cursor-pointer"
                  title="Regenerate QR code token"
                >
                  <RefreshCw className={cn("w-2.5 h-2.5", isPending && "animate-spin")} />
                </button>
              </div>
            )}
          </div>

          {/* Assign Staff Button */}
          <button
            type="button"
            onClick={() => {
              setAssignStaffTable(table);
              setStaffSearch("");
            }}
            disabled={isPending}
            className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#D3232A] text-gray-600 hover:text-white border border-gray-200 hover:border-[#D3232A] text-xs font-bold transition-all disabled:opacity-50"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {table.assignedStaff ? `Assigned: ${table.assignedStaff.name}` : "Assign Staff"}
          </button>
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2 bg-gray-50/50">
          <button
            onClick={() => setPrintTable(table)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-[#1B2A4A] hover:text-white hover:border-[#1B2A4A] text-xs font-bold text-gray-600 transition-all cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            Print QR Sticker
          </button>
          <button
            onClick={() => handleDeleteTable(table)}
            disabled={isPending}
            title="Delete table"
            className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-6 text-[#1B2A4A]">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A] flex items-center gap-2">
              <QrCode className="w-7 h-7 text-[#D3232A]" />
              Table Management
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Organize dining tables, generate customer QR stickers, and assign staff members
            </p>
          </div>

          <div className="flex items-center gap-3">
            {tables.length > 0 && (
              <button
                onClick={() => setShowBulkPrint(true)}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#1B2A4A] font-semibold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-gray-600" />
                Print All QRs ({tables.length})
              </button>
            )}
            <button
              onClick={() => {
                setAcCount(0);
                setNonAcCount(0);
                setAddError(null);
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Tables
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Tables" value={stats.total} icon={Layers} colorClass="text-[#1B2A4A]" bgClass="bg-gray-100" />
          <StatCard label="AC Tables" value={stats.acCount} icon={Wind} colorClass="text-cyan-600" bgClass="bg-cyan-50" />
          <StatCard label="Non-AC Tables" value={stats.nonAcCount} icon={Sun} colorClass="text-amber-600" bgClass="bg-amber-50" />
          <StatCard label="Available" value={stats.availableCount} icon={CheckCircle2} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
          <StatCard label="Occupied" value={stats.occupiedCount} icon={Users} colorClass="text-rose-600" bgClass="bg-rose-50" />
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search table number or staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D3232A] transition"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full md:w-auto">
            {(["ALL", "AC", "NON_AC", "AVAILABLE", "OCCUPIED"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filter === f
                    ? "bg-[#1B2A4A] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "ALL" && "All Tables"}
                {f === "AC" && "AC Only"}
                {f === "NON_AC" && "Non-AC Only"}
                {f === "AVAILABLE" && "Available"}
                {f === "OCCUPIED" && "Occupied"}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Grid */}
        {loading ? (
          <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton width={80} height={20} />
                    <Skeleton width={50} height={18} borderRadius={12} />
                  </div>
                  <Skeleton height={28} borderRadius={8} />
                  <div className="pt-2 border-t border-gray-100 flex gap-2">
                    <Skeleton height={28} containerClassName="flex-1" borderRadius={8} />
                    <Skeleton width={32} height={28} borderRadius={8} />
                  </div>
                </div>
              ))}
            </div>
          </SkeletonTheme>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <h3 className="text-base font-bold text-[#1B2A4A]">No dining tables found</h3>
            <p className="text-xs text-gray-400 mt-1">
              {search || filter !== "ALL"
                ? "Try clearing filters to see all tables"
                : "Click 'Add Tables' above to set up dining tables"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredTables.map((t) => (
              <TableCard key={t.id} table={t} />
            ))}
          </div>
        )}
      </div>

      {/* Add Tables Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D3232A]" />
                <h3 className="text-lg font-bold text-[#1B2A4A]">Add Dining Tables</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {addError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5 mb-1">
                  <Wind className="w-4 h-4 text-cyan-600" />
                  AC Tables Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={acCount}
                  onChange={(e) => setAcCount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-[#1B2A4A] focus:outline-none focus:border-[#D3232A]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1B2A4A] flex items-center gap-1.5 mb-1">
                  <Sun className="w-4 h-4 text-amber-600" />
                  Non-AC Tables Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={nonAcCount}
                  onChange={(e) => setNonAcCount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold text-[#1B2A4A] focus:outline-none focus:border-[#D3232A]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submittingAdd ? "Generating..." : "Generate Tables"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Table QR Print Modal */}
      {printTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 overflow-hidden text-center p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#1B2A4A]">Table Sticker Preview</h3>
              <button
                onClick={() => setPrintTable(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center">
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#D3232A] uppercase">
                Alayn Dining
              </p>
              <h3 className="text-xl font-extrabold text-[#1B2A4A] mt-1">
                Table {printTable.tableNumber}
              </h3>
              <span className="text-xs font-semibold text-gray-500 mb-3">
                {printTable.tableType === "AC" ? "AC TABLE" : "NON-AC TABLE"}
              </span>

              {getTableOrderUrl(printTable.currentToken) ? (
                <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 mb-3">
                  <QRCodeSVG
                    value={getTableOrderUrl(printTable.currentToken)}
                    size={170}
                    fgColor="#1B2A4A"
                    bgColor="#FFFFFF"
                  />
                </div>
              ) : (
                <div className="py-6 text-amber-600 text-xs font-semibold">
                  No QR token found for this table.
                </div>
              )}

              <p className="text-xs font-bold text-[#1B2A4A]">SCAN TO ORDER</p>
              <p className="text-[10px] text-gray-400">Point phone camera at QR code</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleRegenerateQR(printTable)}
                disabled={pendingId === printTable.id}
                className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 hover:text-[#D3232A] transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Regenerate QR Token"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", pendingId === printTable.id && "animate-spin")} />
                Reset Token
              </button>

              <button
                onClick={() => window.print()}
                className="flex-1 btn-primary py-2 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Print Modal */}
      {showBulkPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-gray-200 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h3 className="text-base font-bold text-[#1B2A4A]">Print All QR Stickers</h3>
                <p className="text-xs text-gray-400 mt-0.5">{tables.length} stickers ready to print</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Sheet
                </button>
                <button
                  onClick={() => setShowBulkPrint(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable sheet */}
            <div id="printable-bulk" className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 bg-gray-50">
              {tables.map((t) => {
                const orderUrl = getTableOrderUrl(t.currentToken);
                return (
                  <div
                    key={t.id}
                    className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center text-center"
                  >
                    <p className="text-[9px] font-bold tracking-[0.12em] text-[#D3232A] uppercase">
                      Alayn Dining
                    </p>
                    <h4 className="text-lg font-extrabold text-[#1B2A4A] mt-0.5">
                      Table {t.tableNumber}
                    </h4>
                    <span className="text-[10px] font-semibold text-gray-500 mb-2">
                      {t.tableType === "AC" ? "AC TABLE" : "NON-AC TABLE"}
                    </span>
                    <div className="my-1 p-2 border border-gray-100 rounded-xl bg-white shadow-2xs">
                      {orderUrl ? (
                        <QRCodeSVG value={orderUrl} size={140} fgColor="#1B2A4A" bgColor="#FFFFFF" />
                      ) : (
                        <div className="w-[140px] h-[140px] flex items-center justify-center text-[10px] text-gray-400">
                          No Token
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-[#1B2A4A] mt-1">SCAN TO ORDER</p>
                    <p className="text-[9px] text-gray-400">Point camera at QR code</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Popup Modal */}
      {assignStaffTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#D3232A]/10 text-[#D3232A]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1B2A4A]">
                    Assign Waiter / Staff
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select employee for <span className="font-bold text-[#1B2A4A]">Table {assignStaffTable.tableNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssignStaffTable(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee by name, email or role..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#1B2A4A] font-semibold focus:outline-none focus:border-[#D3232A] transition"
                />
                {staffSearch && (
                  <button
                    onClick={() => setStaffSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Staff List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {/* Unassigned Option */}
              <button
                type="button"
                onClick={() => {
                  handleAssignStaff(assignStaffTable, "");
                  setAssignStaffTable(null);
                }}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                  !assignStaffTable.assignedStaffId && !assignStaffTable.assignedStaff?.id
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : "bg-gray-50/70 border-gray-200 hover:bg-gray-100 text-[#1B2A4A]"
                }`}
              >
                <span className="text-xs font-bold">Unassigned (No Staff)</span>
                {!assignStaffTable.assignedStaffId && !assignStaffTable.assignedStaff?.id && (
                  <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                )}
              </button>

              {staffList.filter((s: any) => {
                const name = (s.name || s.user?.name || "").toLowerCase();
                const email = (s.email || s.user?.email || "").toLowerCase();
                const role = (s.role || s.user?.role || "").toLowerCase();
                const query = staffSearch.toLowerCase();
                return name.includes(query) || email.includes(query) || role.includes(query);
              }).length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No matching employees found</p>
                </div>
              ) : (
                staffList
                  .filter((s: any) => {
                    const name = (s.name || s.user?.name || "").toLowerCase();
                    const email = (s.email || s.user?.email || "").toLowerCase();
                    const role = (s.role || s.user?.role || "").toLowerCase();
                    const query = staffSearch.toLowerCase();
                    return name.includes(query) || email.includes(query) || role.includes(query);
                  })
                  .map((s: any) => {
                    const staffId = s.id;   // Employee.id — Table.assignedStaffId FK → Employee.id
                    const name = s.name || s.user?.name || "Staff Member";
                    const email = s.email || s.user?.email || "";
                    const role = s.role || s.user?.role || "STAFF";
                    const isSelected =
                      assignStaffTable.assignedStaffId === staffId ||
                      assignStaffTable.assignedStaff?.id === staffId;

                    return (
                      <button
                        key={staffId}
                        type="button"
                        onClick={() => {
                          handleAssignStaff(assignStaffTable, staffId);
                          setAssignStaffTable(null);
                        }}
                        className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#D3232A]/5 border-[#D3232A] text-[#1B2A4A]"
                            : "bg-white border-gray-200 hover:bg-gray-50 text-[#1B2A4A]"
                        }`}
                      >
                        <div>
                          <p className="text-xs font-extrabold text-[#1B2A4A]">{name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {email && <span className="text-[10px] text-gray-400">{email}</span>}
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-gray-100 text-gray-600">
                              {role}
                            </span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#D3232A] shrink-0" />}
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
