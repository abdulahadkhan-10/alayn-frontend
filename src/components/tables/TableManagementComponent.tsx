import React, { useState, useEffect, useMemo, useCallback } from "react";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  QrCode,
  Plus,
  Printer,
  Trash2,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  LayoutGrid,
  Layers,
  Users,
  UserCheck,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query/react";
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

type FilterType = "ALL" | "AVAILABLE" | "OCCUPIED";

export default function TableManagementComponent() {
  const { activeBranch, branches } = useBranch();
  const currentOutletId = activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;
  const isAllOutlets = !currentOutletId || activeBranch?.id === "all";

  // List of specific outlets excluding "all"
  const specificBranches = useMemo(() => {
    return branches.filter((b) => b.id !== "all");
  }, [branches]);

  // Data state
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  // Add tables modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetAddOutletId, setTargetAddOutletId] = useState<string>("");
  const [tableCount, setTableCount] = useState<string | number>(1);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Print modals
  const [printTable, setPrintTable] = useState<TableItem | null>(null);
  const [showBulkPrint, setShowBulkPrint] = useState(false);

  // Assign staff modal & search state
  const [assignStaffTable, setAssignStaffTable] = useState<TableItem | null>(null);
  const [staffSearch, setStaffSearch] = useState("");

  // Helper to determine target outlet ID for table operations
  const getTargetOutletId = useCallback((table: TableItem) => {
    return (
      table.outletId ||
      currentOutletId ||
      (specificBranches.length > 0 ? specificBranches[0].id : null)
    );
  }, [currentOutletId, specificBranches]);

  // RTK Query staff employees: fetch explicitly for the selected table's outlet if modal is active
  const activeAssignOutletId = assignStaffTable ? getTargetOutletId(assignStaffTable) : null;
  const { data: assignOutletEmployees, isLoading: assignStaffLoading } = useGetEmployeesQuery(
    activeAssignOutletId ? { outletId: activeAssignOutletId, limit: 1000 } : skipToken
  );

  const { data: rawEmployees } = useGetEmployeesQuery(
    currentOutletId ? { outletId: currentOutletId, limit: 1000 } : { limit: 1000 }
  );

  const staffList = useMemo(() => {
    const source = assignOutletEmployees || rawEmployees;
    if (!source) return [];
    const list = Array.isArray(source) ? source : (source as any)?.data || [];
    return list;
  }, [assignOutletEmployees, rawEmployees]);

  // Per-table action loading
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Sync default target outlet for adding tables
  useEffect(() => {
    if (currentOutletId) {
      setTargetAddOutletId(currentOutletId);
    } else if (specificBranches.length > 0) {
      setTargetAddOutletId(specificBranches[0].id);
    }
  }, [currentOutletId, specificBranches]);

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (currentOutletId) {
      // Single outlet view
      const res = await fetchTables(currentOutletId);
      if (res.ok && res.tables) {
        setTables(res.tables.map((t) => ({ ...t, outletId: t.outletId || currentOutletId })));
      } else {
        setError(res.error || "Failed to load tables");
      }
    } else {
      // All Outlets view: fetch tables across all specific branches concurrently
      if (specificBranches.length === 0) {
        setTables([]);
        setLoading(false);
        return;
      }

      try {
        const results = await Promise.all(
          specificBranches.map(async (branch) => {
            const res = await fetchTables(branch.id);
            if (res.ok && res.tables) {
              return res.tables.map((t) => ({ ...t, outletId: t.outletId || branch.id }));
            }
            return [];
          })
        );
        setTables(results.flat());
      } catch (err: any) {
        setError("Failed to load tables across outlets");
      }
    }
    setLoading(false);
  }, [currentOutletId, specificBranches]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const outletIdToUse = currentOutletId || targetAddOutletId;
    if (!outletIdToUse) {
      setAddError("Please select a target outlet location.");
      return;
    }

    const parsedCount = parseInt(String(tableCount), 10) || 0;

    if (parsedCount <= 0) {
      setAddError("Please enter at least 1 table to create.");
      return;
    }

    setSubmittingAdd(true);
    setAddError(null);
    const res = await createBulkTables(outletIdToUse, parsedCount);
    setSubmittingAdd(false);

    if (res.ok) {
      setShowAddModal(false);
      loadTables();
    } else {
      setAddError(res.error || "Failed to create tables.");
    }
  };

  const handleToggleStatus = async (table: TableItem) => {
    const targetOutletId = getTargetOutletId(table);
    if (!targetOutletId) return;

    const newStatus = table.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE";
    setPendingId(table.id);
    const res = await updateTable(targetOutletId, table.id, { status: newStatus });
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
    const targetOutletId = getTargetOutletId(table);
    if (!targetOutletId) return;

    const assignedStaffId = staffId === "" ? null : staffId;
    setPendingId(table.id);
    const res = await updateTable(targetOutletId, table.id, { assignedStaffId });
    setPendingId(null);
    if (res.ok) {
      loadTables();
    } else {
      setError(res.error || "Failed to assign staff.");
    }
  };

  const handleRegenerateQR = async (table: TableItem) => {
    const targetOutletId = getTargetOutletId(table);
    if (!targetOutletId) return;

    setPendingId(table.id);
    const res = await regenerateTableQRToken(targetOutletId, table.id);
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
    const targetOutletId = getTargetOutletId(table);
    if (!targetOutletId) return;

    if (!window.confirm(`Delete Table ${table.tableNumber}? This cannot be undone.`)) return;
    setPendingId(table.id);
    const res = await deleteTable(targetOutletId, table.id);
    setPendingId(null);
    if (res.ok) {
      loadTables();
    } else {
      setError(res.error || "Failed to delete table.");
    }
  };

  const filteredTables = useMemo(() => {
    return tables.filter((t) => {
      if (filter === "AVAILABLE" && t.status !== "AVAILABLE") return false;
      if (filter === "OCCUPIED" && t.status !== "OCCUPIED") return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesNo = String(t.tableNumber).includes(query);
        const matchesStaff = t.assignedStaff?.name?.toLowerCase().includes(query);
        const matchesOutlet = specificBranches
          .find((b) => b.id === t.outletId)
          ?.name?.toLowerCase()
          .includes(query);
        if (!matchesNo && !matchesStaff && !matchesOutlet) return false;
      }

      return true;
    });
  }, [tables, filter, search, specificBranches]);

  // Group filtered tables by outlet when in 'All Outlets' mode
  const groupedFilteredTables = useMemo(() => {
    if (!isAllOutlets) {
      return [
        {
          outletId: currentOutletId || "default",
          outletName: activeBranch?.name || "Floor Tables",
          tables: filteredTables,
        },
      ];
    }

    const map = new Map<string, { outletId: string; outletName: string; tables: TableItem[] }>();

    // Pre-populate all specific branches
    specificBranches.forEach((b) => {
      map.set(b.id, { outletId: b.id, outletName: b.name, tables: [] });
    });

    filteredTables.forEach((t) => {
      const outId = t.outletId || "other";
      if (!map.has(outId)) {
        const branchName = specificBranches.find((b) => b.id === outId)?.name || "Outlet Location";
        map.set(outId, { outletId: outId, outletName: branchName, tables: [] });
      }
      map.get(outId)!.tables.push(t);
    });

    return Array.from(map.values());
  }, [isAllOutlets, currentOutletId, activeBranch, filteredTables, specificBranches]);

  const stats = useMemo(() => {
    const total = tables.length;
    const availableCount = tables.filter((t) => t.status === "AVAILABLE").length;
    const occupiedCount = tables.filter((t) => t.status === "OCCUPIED").length;
    return { total, availableCount, occupiedCount };
  }, [tables]);

  const getTableOrderUrl = (token: string | null) => {
    if (!token) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    return `${origin}/order?token=${token}`;
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
    const isOccupied = table.status === "OCCUPIED";
    const isPending = pendingId === table.id;
    const orderUrl = getTableOrderUrl(table.currentToken);

    return (
      <div
        className={cn(
          "bg-white rounded-[16px] p-3 transition-all select-none flex flex-col h-full overflow-hidden border border-gray-100",
          isOccupied
            ? "shadow-[0_4px_16px_rgba(225,29,72,0.06)]"
            : "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
        )}
      >
        <div className="flex flex-col gap-3 flex-1">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 px-1">
            <h3 className="text-xl font-heading font-black text-[#1B2A4A] tracking-tight shrink-0">
              T{table.tableNumber}
            </h3>
            <button
              type="button"
              onClick={() => handleToggleStatus(table)}
              disabled={isPending}
              className={cn(
                "cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all shrink-0",
                isOccupied
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isOccupied ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                )}
              />
              {isOccupied ? "OCCUPIED" : "AVAILABLE"}
            </button>
          </div>

          {/* Clean & Compact QR Display */}
          <div className="bg-gray-50/50 border border-black/5 rounded-[12px] p-3 flex flex-col items-center justify-center relative group">
            {orderUrl ? (
              <div
                onClick={() => setPrintTable(table)}
                className="cursor-pointer flex flex-col items-center w-full"
                title="Click to view & print full QR sticker"
              >
                <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-2 transition-transform group-hover:scale-105">
                  <QRCodeSVG value={orderUrl} size={80} fgColor="#1B2A4A" bgColor="#FFFFFF" />
                </div>
                <p className="text-[10px] font-bold text-[#1B2A4A] flex items-center gap-1 group-hover:text-[#D3232A] transition-colors">
                  <QrCode className="w-3 h-3 text-[#D3232A]" />
                  Scan to Order
                </p>
              </div>
            ) : (
              <div className="py-6 text-center space-y-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500 mx-auto" />
                <p className="text-[10px] text-gray-500 font-bold">No QR token</p>
                <button
                  type="button"
                  onClick={() => handleRegenerateQR(table)}
                  disabled={isPending}
                  className="px-2 py-1 mt-1 text-[10px] font-extrabold bg-[#1B2A4A] text-white rounded-md hover:bg-[#D3232A] transition cursor-pointer shadow-sm"
                >
                  Generate
                </button>
              </div>
            )}
          </div>

          {/* Staff Assignment */}
          <button
            type="button"
            onClick={() => {
              setAssignStaffTable(table);
              setStaffSearch("");
            }}
            disabled={isPending}
            className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white border border-gray-200 hover:border-[#D3232A] hover:text-[#D3232A] text-gray-600 text-[11px] font-bold transition-all disabled:opacity-50 truncate shadow-sm mt-auto"
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{table.assignedStaff ? `Staff: ${table.assignedStaff.name}` : "Assign Staff"}</span>
          </button>
        </div>

        {/* Footer actions */}
        <div className="pt-2.5 mt-3 border-t border-gray-100 flex items-center gap-1.5">
          <button
            onClick={() => setPrintTable(table)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[10px] bg-gray-50 hover:bg-[#1B2A4A] hover:text-white text-[11px] font-bold text-gray-600 transition-all cursor-pointer"
          >
            <Printer className="w-3 h-3 shrink-0" />
            Print
          </button>
          <button
            onClick={() => handleDeleteTable(table)}
            disabled={isPending}
            className="p-1.5 rounded-[10px] bg-gray-50 hover:bg-rose-50 hover:text-rose-600 text-gray-400 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Delete table"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-6 bg-[#F4F5F8] min-h-screen text-[#1B2A4A]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A] flex items-center gap-2">
              <LayoutGrid className="w-6 h-6 text-[#D3232A]" />
              Table Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Configure dining tables, assign staff, and manage QR code menu ordering.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
                setTableCount(1);
                setAddError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-[#b01e23] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Tables
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Tables" value={stats.total} icon={Layers} colorClass="text-[#1B2A4A]" bgClass="bg-gray-100" />
          <StatCard label="Available" value={stats.availableCount} icon={CheckCircle2} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
          <StatCard label="Occupied" value={stats.occupiedCount} icon={Users} colorClass="text-rose-600" bgClass="bg-rose-50" />
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shrink-0">
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search table number, staff..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/80 backdrop-blur-md border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[14px] text-xs font-bold text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1B2A4A]/20 transition-all"
            />
          </div>

          <div className="flex bg-gray-100/50 backdrop-blur-md p-1 rounded-[14px] border border-black/5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] shrink-0 overflow-x-auto scrollbar-none w-full md:w-auto">
            {(["ALL", "AVAILABLE", "OCCUPIED"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-[10px] text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${filter === f
                    ? "bg-white text-[#1B2A4A] shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-200/50"
                  }`}
              >
                {f === "ALL" && "All Tables"}
                {f === "AVAILABLE" && "Available"}
                {f === "OCCUPIED" && "Occupied"}
              </button>
            ))}
          </div>
        </div>

        {/* Tables Grid Grouped By Outlet */}
        {loading ? (
          <SkeletonTheme baseColor="#f3f4f6" highlightColor="#e5e7eb">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
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
          <div className="space-y-8">
            {groupedFilteredTables.map((group) => {
              if (group.tables.length === 0 && isAllOutlets) {
                return (
                  <div key={group.outletId} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                      <span className="p-1.5 rounded-lg bg-[#1B2A4A] text-white">
                        <Store className="w-4 h-4 text-rose-400" />
                      </span>
                      <h2 className="text-base font-black text-[#1B2A4A]">
                        {group.outletName}
                      </h2>
                      <span className="text-xs text-gray-400 font-bold">
                        (0 Tables)
                      </span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-xs font-medium italic">
                      No floor tables configured for {group.outletName}.
                    </div>
                  </div>
                );
              }

              return (
                <div key={group.outletId} className="space-y-3">
                  {/* Show Heading ONLY when viewing All Outlets */}
                  {isAllOutlets && (
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-[#1B2A4A] text-white shadow-xs">
                          <Store className="w-4 h-4 text-rose-400" />
                        </span>
                        <h2 className="text-base font-black text-[#1B2A4A]">
                          {group.outletName}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700 font-black">
                          {group.tables.length} {group.tables.length === 1 ? "Table" : "Tables"}
                        </span>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                        {group.tables.filter((t) => t.status === "AVAILABLE").length} Available / {group.tables.filter((t) => t.status === "OCCUPIED").length} Occupied
                      </span>
                    </div>
                  )}

                  {/* Grid of Table Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
                    {group.tables.map((t) => (
                      <TableCard key={t.id} table={t} />
                    ))}
                  </div>
                </div>
              );
            })}
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
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Outlet Selector if in All Outlets Mode */}
              {isAllOutlets && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Select Target Outlet Location
                  </label>
                  <select
                    value={targetAddOutletId}
                    onChange={(e) => setTargetAddOutletId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-extrabold focus:outline-none focus:border-[#1B2A4A]"
                  >
                    {specificBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Number of Tables to Add
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={tableCount}
                  onChange={(e) => setTableCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#D3232A]"
                  placeholder="e.g. 5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="flex-1 py-2.5 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {submittingAdd ? "Creating..." : "Create Tables"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {assignStaffTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#D3232A]" />
                <h3 className="text-sm font-bold text-[#1B2A4A]">
                  Assign Staff to Table #{assignStaffTable.tableNumber}
                </h3>
              </div>
              <button
                onClick={() => setAssignStaffTable(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff name..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#D3232A]"
                />
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                <button
                  type="button"
                  onClick={() => {
                    handleAssignStaff(assignStaffTable, "");
                    setAssignStaffTable(null);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between border cursor-pointer",
                    !assignStaffTable.assignedStaff
                      ? "bg-gray-100 text-gray-900 border-gray-300 font-bold"
                      : "text-gray-600 hover:bg-gray-50 border-transparent"
                  )}
                >
                  <span>Unassigned</span>
                  {!assignStaffTable.assignedStaff && <CheckCircle2 className="w-3.5 h-3.5 text-[#D3232A]" />}
                </button>

                {assignStaffLoading ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    Loading staff members...
                  </p>
                ) : (
                  staffList
                    .filter((s: any) => {
                      const matchesSearch = s.name?.toLowerCase().includes(staffSearch.toLowerCase());
                      const targetOutletId = getTargetOutletId(assignStaffTable);
                      const staffOutletId = s.outletId || s.outlet?.id;
                      const matchesOutlet = !targetOutletId || staffOutletId === targetOutletId;
                      const isEligibleRole = s.role === "STAFF";
                      return matchesSearch && matchesOutlet && isEligibleRole;
                    })
                    .map((staff: any) => {
                      const isSelected = assignStaffTable.assignedStaff?.id === staff.id;
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          onClick={() => {
                            handleAssignStaff(assignStaffTable, staff.id);
                            setAssignStaffTable(null);
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-between border cursor-pointer",
                            isSelected
                              ? "bg-[#1B2A4A] text-white border-[#1B2A4A] font-bold"
                              : "text-gray-700 hover:bg-gray-50 border-transparent"
                          )}
                        >
                          <div>
                            <p className="font-bold">{staff.name}</p>
                            <p className="text-[10px] text-gray-400 font-normal">{staff.designation || staff.role || "Staff"}</p>
                          </div>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                      );
                    })
                )}

                {!assignStaffLoading &&
                  staffList.filter((s: any) => {
                    const targetOutletId = getTargetOutletId(assignStaffTable);
                    const staffOutletId = s.outletId || s.outlet?.id;
                    const matchesOutlet = !targetOutletId || staffOutletId === targetOutletId;
                    const isEligibleRole = s.role === "STAFF";
                    return matchesOutlet && isEligibleRole;
                  }).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">
                      No staff members found for this outlet.
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom print stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: auto;
          margin: 0mm; /* Removes browser headers/footers */
        }
        @media print {
          /* Hide everything on the page */
          body * {
            visibility: hidden;
          }
          /* Show print container and its contents */
          #print-section-container, #print-section-container * {
            visibility: visible;
          }
          #print-section-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            display: block !important;
            background: white;
            padding: 20px;
          }
          
          /* Style single card */
          #table-print-single-card {
            width: 380px;
            margin: 100px auto; /* Center horizontally in print */
            border: 2px dashed #1B2A4A !important;
            background-color: #F8FAFC !important;
            padding: 32px !important;
            border-radius: 16px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Style bulk cards grid */
          #table-print-bulk-cards {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 20px !important;
            width: 100% !important;
            background: white !important;
            padding: 20px !important;
          }
          .print-card-bulk {
            border: 2px dashed #1B2A4A !important;
            background-color: #F8FAFC !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding: 24px !important;
            border-radius: 16px !important;
            text-align: center !important;
          }
        }
      ` }} />

      {/* Print Single Table Sticker Modal */}
      {printTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-gray-200 overflow-hidden text-center">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-[#1B2A4A]">Table #{printTable.tableNumber} QR Sticker</h3>
              <button
                onClick={() => setPrintTable(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div id="table-print-single-card-modal" className="border-2 border-dashed border-[#1B2A4A]/20 p-6 rounded-2xl bg-slate-50 space-y-3">
                <div className="flex justify-center mb-1">
                  <img src="/logowithouttagline.png" alt="Alayn Logo" className="h-12 object-contain mix-blend-multiply" />
                </div>
                <h2 className="text-xl font-extrabold text-[#1B2A4A]">Table #{printTable.tableNumber}</h2>
                <div className="py-3 flex justify-center">
                  <QRCodeSVG value={getTableOrderUrl(printTable.currentToken)} size={160} fgColor="#1B2A4A" bgColor="#F8FAFC" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#1B2A4A]">Scan with Phone Camera to View Menu & Order</p>
                  <p className="text-[9px] font-medium text-gray-500">
                    visit us at <span className="font-semibold text-[#1B2A4A]">alaynai.com</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-2 bg-gray-50">
              <button
                type="button"
                onClick={() => setPrintTable(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 btn-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Sticker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Print All QRs Modal */}
      {showBulkPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
              <h3 className="text-sm font-bold text-[#1B2A4A]">Bulk QR Stickers ({tables.length} Tables)</h3>
              <button
                onClick={() => setShowBulkPrint(false)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="table-print-bulk-cards-modal" className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tables.map((t) => (
                <div key={t.id} className="border-2 border-dashed border-[#1B2A4A]/20 p-5 rounded-2xl bg-slate-50 text-center space-y-3">
                  <div className="flex justify-center mb-1">
                    <img src="/logowithouttagline.png" alt="Alayn Logo" className="h-8 object-contain mix-blend-multiply" />
                  </div>
                  <h4 className="text-lg font-extrabold text-[#1B2A4A]">Table #{t.tableNumber}</h4>
                  <div className="flex justify-center py-2">
                    <QRCodeSVG value={getTableOrderUrl(t.currentToken)} size={120} fgColor="#1B2A4A" bgColor="#F8FAFC" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[#1B2A4A] leading-tight">Scan with Phone Camera<br/>to View Menu & Order</p>
                    <p className="text-[8px] font-medium text-gray-500">
                      visit us at <span className="font-semibold text-[#1B2A4A]">alaynai.com</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowBulkPrint(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print All ({tables.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-Only Container (Rendered outside modals to prevent max-height layout clipping during print) */}
      <div id="print-section-container" className="hidden">
        {printTable && (
          <div id="table-print-single-card">
            <div className="flex justify-center mb-2">
              <img src="/logowithouttagline.png" alt="Alayn Logo" className="h-14 object-contain mix-blend-multiply" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#1B2A4A] mb-2">Table #{printTable.tableNumber}</h2>
            <div className="py-4 flex justify-center">
              <QRCodeSVG value={getTableOrderUrl(printTable.currentToken)} size={180} fgColor="#1B2A4A" bgColor="#F8FAFC" />
            </div>
            <div className="space-y-1 mt-2">
              <p className="text-sm font-bold text-[#1B2A4A]">Scan with Phone Camera to View Menu & Order</p>
              <p className="text-[10px] font-medium text-gray-500">
                visit us at <span className="font-semibold text-[#1B2A4A]">alaynai.com</span>
              </p>
            </div>
          </div>
        )}

        {showBulkPrint && (
          <div id="table-print-bulk-cards">
            {tables.map((t) => (
              <div key={t.id} className="print-card-bulk">
                <div className="flex justify-center mb-1">
                  <img src="/logowithouttagline.png" alt="Alayn Logo" className="h-8 object-contain mix-blend-multiply" />
                </div>
                <h4 className="text-lg font-extrabold text-[#1B2A4A]">Table #{t.tableNumber}</h4>
                <div className="flex justify-center py-2">
                  <QRCodeSVG value={getTableOrderUrl(t.currentToken)} size={120} fgColor="#1B2A4A" bgColor="#F8FAFC" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-[#1B2A4A] leading-tight">Scan with Phone Camera<br/>to View Menu & Order</p>
                  <p className="text-[8px] font-medium text-gray-500">
                    visit us at <span className="font-semibold text-[#1B2A4A]">alaynai.com</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
