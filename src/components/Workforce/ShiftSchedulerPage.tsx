"use client";

import React, { useState, useMemo, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WorkforceHeaderNav from "./WorkforceHeaderNav";
import WorkforceSkeleton from "./WorkforceSkeleton";
import {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useAssignShiftMutation,
  useRequestSwapMutation,
  useUpdateSwapStatusMutation,
} from "@/redux/slices/shiftApiSlice";
import {
  useGetEmployeesQuery,
  useGetLeaveRequestsQuery,
} from "@/redux/slices/employeeApiSlice";
import {
  useGetHolidaysQuery,
} from "@/redux/slices/holidayApiSlice";
import {
  useGetOutletRostersQuery,
  useSetWeeklyRosterMutation,
} from "@/redux/slices/rosterApiSlice";
import { CustomDatePicker } from "../ui/custom-date-picker";
import { CustomTimePicker } from "../ui/custom-time-picker";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  X,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Palmtree,
  CalendarDays,
  List,
  Users,
  Search,
  Building2,
  Repeat,
  CalendarOff,
  UserCheck,
} from "lucide-react";

const DEMO_SHIFTS = [
  {
    id: "shift-1",
    name: "Morning Rush",
    startTime: "08:00",
    endTime: "16:00",
    outlet: { id: "o1", name: "Spice & Dine - MG Road" },
    assignments: [
      { id: "a1", date: "2026-07-27T00:00:00.000Z", employee: { id: "demo-1", name: "Priya Verma", role: "STAFF" } },
      { id: "a2", date: "2026-07-27T00:00:00.000Z", employee: { id: "demo-2", name: "Rahul Verma", role: "KITCHEN" } },
      { id: "a3", date: "2026-07-27T00:00:00.000Z", employee: { id: "demo-3", name: "Chef (Spice & Dine)", role: "CHEF" } },
    ],
    swapRequests: [],
  },
  {
    id: "shift-2",
    name: "Evening Shift",
    startTime: "16:00",
    endTime: "00:00",
    outlet: { id: "o2", name: "Ocean Breeze - Juhu Beach" },
    assignments: [
      { id: "a4", date: "2026-07-27T00:00:00.000Z", employee: { id: "demo-4", name: "Head Waiter (Mumbai)", role: "HEAD WAITER" } },
    ],
    swapRequests: [
      {
        id: "s1",
        fromEmployeeId: "demo-4",
        toEmployeeId: "demo-5",
        shiftId: "shift-2",
        date: "2026-07-27",
        status: "REQUESTED",
      },
    ],
  },
];

// Helper: Parse Date Key YYYY-MM-DD in local timezone (prevents UTC offset shifts)
function parseDateKey(dateInput: any): string {
  if (!dateInput) return "";
  if (typeof dateInput === "string") return dateInput.split("T")[0];
  if (dateInput instanceof Date) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

// Clean Date Formatter
function formatDateNice(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return "Today";
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default function ShiftSchedulerPage() {
  // Queries & Mutations
  const { data: shiftApiData, isLoading: isShiftsLoading } = useGetShiftsQuery(undefined);
  const { data: empApiData, isLoading: isEmpLoading } = useGetEmployeesQuery(undefined);
  const { data: leaveApiData } = useGetLeaveRequestsQuery(undefined);
  const { data: holidaysData } = useGetHolidaysQuery(undefined);
  const { data: outletRostersData } = useGetOutletRostersQuery(undefined);

  const [createShift, { isLoading: isCreatingShift }] = useCreateShiftMutation();
  const [assignShift, { isLoading: isAssigning }] = useAssignShiftMutation();
  const [requestSwap, { isLoading: isSwapping }] = useRequestSwapMutation();
  const [updateSwapStatus, { isLoading: isUpdatingSwap }] = useUpdateSwapStatusMutation();
  const [setWeeklyRoster, { isLoading: isSettingRoster }] = useSetWeeklyRosterMutation();

  const shifts = shiftApiData?.data || (isShiftsLoading ? [] : DEMO_SHIFTS);
  const employees = empApiData?.data || [
    { id: "demo-1", name: "Priya Verma", role: "STAFF" },
    { id: "demo-2", name: "Rahul Verma", role: "KITCHEN" },
    { id: "demo-3", name: "Chef (Spice & Dine)", role: "CHEF" },
    { id: "demo-4", name: "Head Waiter (Mumbai)", role: "HEAD WAITER" },
    { id: "demo-5", name: "Order Captain (Mumbai)", role: "CAPTAIN" },
  ];

  const leaveRequests = leaveApiData?.data || [];

  // Matrix View State
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date(2026, 6, 27)); // Default July 2026
  const [viewRange, setViewRange] = useState<"7" | "14" | "30">("7");
  const [selectedOutlet, setSelectedOutlet] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"roster" | "templates">("roster");

  // Modals
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Forms
  const [shiftForm, setShiftForm] = useState({ name: "", startTime: "09:00", endTime: "17:00" });
  const [assignForm, setAssignForm] = useState<{
    shiftId: string;
    employeeIds: string[];
    date: string;
    isSingleEmp?: boolean;
    singleEmpName?: string;
    singleEmpRole?: string;
    isCustomHours?: boolean;
    customStartTime?: string;
    customEndTime?: string;
  }>({
    shiftId: "",
    employeeIds: [],
    date: parseDateKey(selectedMonthDate),
    isSingleEmp: false,
    singleEmpName: "",
    singleEmpRole: "",
    isCustomHours: false,
    customStartTime: "09:00",
    customEndTime: "17:00",
  });
  const [swapForm, setSwapForm] = useState({ fromEmployeeId: "", toEmployeeId: "", shiftId: "", date: parseDateKey(selectedMonthDate) });

  // Roster Modal Form State
  const [rosterEmployeeId, setRosterEmployeeId] = useState("");
  const [applyToAllShiftId, setApplyToAllShiftId] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>({
    MONDAY: "", TUESDAY: "", WEDNESDAY: "", THURSDAY: "", FRIDAY: "", SATURDAY: "", SUNDAY: "OFF",
  });

  const [operatingDays] = useState<string[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]);

  // Pre-fill employee's existing saved weekly roster when selected in modal
  useEffect(() => {
    if (!rosterEmployeeId || !outletRostersData?.data) return;
    const empRosters = outletRostersData.data.filter((r: any) => r.employeeId === rosterEmployeeId);
    if (empRosters.length > 0) {
      const schedule: Record<string, string> = { ...weeklySchedule };
      empRosters.forEach((r: any) => {
        if (r.dayOfWeek) schedule[r.dayOfWeek] = r.shiftId || "OFF";
      });
      setWeeklySchedule(schedule);
    }
  }, [rosterEmployeeId, outletRostersData]);

  // Outlets List extracted from shifts
  const outletOptions = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s: any) => {
      if (s.outlet?.name) set.add(s.outlet.name);
    });
    return Array.from(set);
  }, [shifts]);

  // Filter Employees by Search Query & Selected Outlet
  const filteredEmployees = useMemo(() => {
    return employees.filter((e: any) => {
      // 1. Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = e.name?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q);
        if (!matchName) return false;
      }

      // 2. Outlet Filter
      if (selectedOutlet !== "ALL") {
        // Direct employee outlet match
        if (e.outlet?.name === selectedOutlet) return true;

        // Check if employee has a shift assignment at selectedOutlet
        const hasShiftAtOutlet = shifts.some(
          (s: any) =>
            s.outlet?.name === selectedOutlet &&
            (s.assignments || []).some((a: any) => (a.employee?.id || a.employeeId) === e.id)
        );
        if (hasShiftAtOutlet) return true;

        // Check if employee has a weekly roster at selectedOutlet
        const rostersList = outletRostersData?.data || [];
        const hasRosterAtOutlet = rostersList.some(
          (r: any) =>
            r.employeeId === e.id && r.shift?.outlet?.name === selectedOutlet
        );
        if (hasRosterAtOutlet) return true;

        return false;
      }

      return true;
    });
  }, [employees, searchQuery, selectedOutlet, shifts, outletRostersData]);

  const [matrixPage, setMatrixPage] = useState<number>(1);
  const [matrixPageSize, setMatrixPageSize] = useState<number | "ALL">(10);

  useEffect(() => {
    setMatrixPage(1);
  }, [searchQuery, selectedOutlet, viewRange]);

  const paginatedRosterEmployees = useMemo(() => {
    if (matrixPageSize === "ALL") return filteredEmployees;
    const start = (matrixPage - 1) * (matrixPageSize as number);
    return filteredEmployees.slice(start, start + (matrixPageSize as number));
  }, [filteredEmployees, matrixPage, matrixPageSize]);

  const totalMatrixPages = matrixPageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filteredEmployees.length / (matrixPageSize as number)));
  const safeMatrixPage = Math.min(matrixPage, totalMatrixPages);

  // Generate Columns array based on selectedMonthDate & viewRange (7, 14, or 30 days)
  const columns = useMemo(() => {
    const count = parseInt(viewRange, 10);
    const result = [];
    const baseDate = new Date(selectedMonthDate);

    for (let i = 0; i < count; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dateKey = parseDateKey(d);
      const todayKey = parseDateKey(new Date());

      result.push({
        dateObj: d,
        dateKey,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        dayOfWeekLong: d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase(),
        isToday: dateKey === todayKey,
      });
    }
    return result;
  }, [selectedMonthDate, viewRange]);

  // Map of Employee Shift / Leave Matrix Lookup for ultra-fast rendering
  // Key: `${employeeId}_${dateKey}` -> { type: 'LEAVE' | 'SHIFT', data: any }
  const matrixLookup = useMemo(() => {
    const lookup: Record<string, { type: "LEAVE" | "SHIFT"; data: any }[]> = {};

    // 1. Map Leaves
    leaveRequests.forEach((leave: any) => {
      if (leave.status === "REJECTED") return;
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = parseDateKey(d);
        const key = `${leave.employeeId}_${dateKey}`;
        if (!lookup[key]) lookup[key] = [];
        lookup[key].push({
          type: "LEAVE",
          data: {
            id: leave.id,
            reason: leave.reason || "Approved Leave",
            status: leave.status,
          },
        });
      }
    });

    // 2. Map Explicit Shift Assignments
    shifts.forEach((shift: any) => {
      if (selectedOutlet !== "ALL" && shift.outlet?.name !== selectedOutlet) return;

      (shift.assignments || []).forEach((asgn: any) => {
        const dateKey = parseDateKey(asgn.date);
        const empId = asgn.employee?.id || asgn.employeeId;
        if (!empId) return;

        const key = `${empId}_${dateKey}`;
        if (!lookup[key]) lookup[key] = [];

        // Avoid duplicate shift assignments if already mapped
        const exists = lookup[key].some((item) => item.type === "SHIFT" && item.data.shift.id === shift.id);
        if (!exists) {
          lookup[key].push({
            type: "SHIFT",
            data: {
              asgnId: asgn.id,
              shift,
              isRecurring: false,
            },
          });
        }
      });
    });

    // 3. Map Recurring Weekly Rosters (EmployeeRoster)
    const rostersList = outletRostersData?.data || [];
    columns.forEach((col) => {
      rostersList.forEach((r: any) => {
        if (r.dayOfWeek === col.dayOfWeekLong && r.shiftId && r.shift && r.employeeId) {
          if (selectedOutlet !== "ALL" && r.shift?.outlet?.name && r.shift.outlet.name !== selectedOutlet) return;

          const key = `${r.employeeId}_${col.dateKey}`;
          if (!lookup[key]) lookup[key] = [];

          // Only add recurring roster if explicit assignment doesn't already exist for this date
          const hasExplicit = lookup[key].some((item) => item.type === "SHIFT");
          if (!hasExplicit) {
            lookup[key].push({
              type: "SHIFT",
              data: {
                asgnId: `roster-${r.id}`,
                shift: r.shift,
                isRecurring: true,
              },
            });
          }
        }
      });
    });

    return lookup;
  }, [shifts, leaveRequests, outletRostersData, columns, selectedOutlet]);

  // Overall Pending Swap Requests List
  const allSwapRequests = useMemo(() => {
    return shifts.flatMap((s: any) => s.swapRequests || []);
  }, [shifts]);

  // Open Weekly Roster Modal pre-filled for a specific employee
  const openRosterModalForEmployee = (empId?: string) => {
    const targetEmpId = empId || employees[0]?.id || "";
    setRosterEmployeeId(targetEmpId);

    const initialSchedule: Record<string, string> = {};
    const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

    const empRosters = (outletRostersData?.data || []).filter((r: any) => r.employeeId === targetEmpId);
    ALL_DAYS.forEach((day) => {
      if (!operatingDays.includes(day)) {
        initialSchedule[day] = "OFF";
      } else {
        const found = empRosters.find((r: any) => r.dayOfWeek === day);
        initialSchedule[day] = found?.shiftId || "OFF";
      }
    });
    setWeeklySchedule(initialSchedule);
    setShowRosterModal(true);
  };

  // Handlers
  const handleRosterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterEmployeeId) return;
    try {
      const schedulePayload = Object.entries(weeklySchedule).map(([day, shiftVal]) => ({
        dayOfWeek: day,
        shiftId: shiftVal === "OFF" || !shiftVal ? null : shiftVal,
      }));
      await setWeeklyRoster({ employeeId: rosterEmployeeId, weeklySchedule: schedulePayload }).unwrap();
      setFeedbackMsg("Weekly shift roster updated successfully!");
      setShowRosterModal(false);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to update weekly roster");
    }
  };

  const handleCreateShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift(shiftForm).unwrap();
      setFeedbackMsg("New shift slot created successfully!");
      setShowCreateShiftModal(false);
      setShiftForm({ name: "", startTime: "09:00", endTime: "17:00" });
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to create shift");
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (assignForm.employeeIds.length === 0) return;

    try {
      let targetShiftId = assignForm.shiftId;

      // Handle Custom Hours selection
      if (assignForm.isCustomHours && assignForm.customStartTime && assignForm.customEndTime) {
        const match = shifts.find(
          (s: any) => s.startTime === assignForm.customStartTime && s.endTime === assignForm.customEndTime
        );
        if (match) {
          targetShiftId = match.id;
        } else {
          // Dynamic creation of custom shift slot
          const customName = `Shift (${assignForm.customStartTime} - ${assignForm.customEndTime})`;
          const res = await createShift({
            name: customName,
            startTime: assignForm.customStartTime,
            endTime: assignForm.customEndTime,
          }).unwrap();
          targetShiftId = res?.data?.id || res?.id || res?.data?.data?.id;
        }
      }

      if (!targetShiftId) {
        setFeedbackMsg("Please select a shift preset or specify start/end times.");
        return;
      }

      await assignShift({
        shiftId: targetShiftId,
        employeeIds: assignForm.employeeIds,
        date: assignForm.date,
      }).unwrap();

      const empLabel = assignForm.isSingleEmp && assignForm.singleEmpName
        ? assignForm.singleEmpName
        : `${assignForm.employeeIds.length} staff member${assignForm.employeeIds.length === 1 ? '' : 's'}`;

      setFeedbackMsg(`Successfully assigned shift to ${empLabel} for ${formatDateNice(assignForm.date)}!`);
      setShowAssignModal(false);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to assign shift");
    }
  };

  const handleSwapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestSwap(swapForm).unwrap();
      setFeedbackMsg("Swap request submitted successfully!");
      setShowSwapModal(false);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to request shift swap");
    }
  };

  const handleSwapAction = async (swapId: string, status: "APPROVED" | "REJECTED") => {
    try {
      await updateSwapStatus({ swapId, status }).unwrap();
      setFeedbackMsg(`Swap request ${status.toLowerCase()}!`);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || `Failed to update swap status`);
    }
  };

  if (isShiftsLoading || isEmpLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <WorkforceHeaderNav />
          <WorkforceSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title & Main Action CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Shift Scheduler & Roster</span>
            </h1>
            <p className="text-sm text-gray-500">
              Interactive Employee Shift Matrix, Recurring Rosters, and Leave Integration.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 px-4 py-2.5 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Palmtree className="h-4 w-4 text-amber-600" />
              Outlet Holidays
            </a>
            <button
              onClick={() => {
                setRosterEmployeeId(employees[0]?.id || "");
                setShowRosterModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200/80 px-4 py-2.5 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs cursor-pointer"
            >
              <CalendarDays className="h-4 w-4 text-indigo-600" />
              Set Weekly Roster
            </button>
            <button
              onClick={() => setShowCreateShiftModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D3232A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#b01e23] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Shift Slot
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-sm shadow-xs">
            <span className="font-medium">{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
              <X className="h-4 w-4 text-emerald-700" />
            </button>
          </div>
        )}

        {/* Top Controls Strip: Month Selector, Range Toggle, Outlet & Search */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* View Mode & Date Range Selector */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Tab Selector */}
              <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/80">
                <button
                  onClick={() => setActiveTab("roster")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === "roster"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <CalendarIcon className="h-3.5 w-3.5 text-[#D3232A]" />
                  Roster Matrix
                </button>
                <button
                  onClick={() => setActiveTab("templates")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    activeTab === "templates"
                      ? "bg-white text-gray-900 shadow-xs font-bold"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="h-3.5 w-3.5 text-[#D3232A]" />
                  Shift Slots ({shifts.length})
                </button>
              </div>

              {/* View Range Toggle (7, 14, 30 Days) */}
              {activeTab === "roster" && (
                <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/80 text-xs">
                  <button
                    onClick={() => setViewRange("7")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      viewRange === "7" ? "bg-white text-[#D3232A] shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    7 Days (Week)
                  </button>
                  <button
                    onClick={() => setViewRange("14")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      viewRange === "14" ? "bg-white text-[#D3232A] shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    14 Days
                  </button>
                  <button
                    onClick={() => setViewRange("30")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      viewRange === "30" ? "bg-white text-[#D3232A] shadow-xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Full Month
                  </button>
                </div>
              )}
            </div>

            {/* Date Navigator & Filters */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              {/* Date Navigator Buttons */}
              {activeTab === "roster" && (
                <div className="flex items-center bg-gray-50 border border-gray-200/80 rounded-xl px-2 py-1 gap-1.5">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedMonthDate);
                      prev.setDate(prev.getDate() - (viewRange === "7" ? 7 : viewRange === "14" ? 14 : 30));
                      setSelectedMonthDate(prev);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs font-bold text-gray-800 min-w-[110px] text-center">
                    {columns[0]?.monthName} {columns[0]?.dayNum} – {columns[columns.length - 1]?.monthName} {columns[columns.length - 1]?.dayNum}
                  </span>
                  <button
                    onClick={() => {
                      const next = new Date(selectedMonthDate);
                      next.setDate(next.getDate() + (viewRange === "7" ? 7 : viewRange === "14" ? 14 : 30));
                      setSelectedMonthDate(next);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-200/60 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Outlet Filter */}
              {outletOptions.length > 0 && (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-xl text-xs">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  <select
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    className="bg-transparent font-semibold text-gray-800 focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Outlets</option>
                    {outletOptions.map((out) => (
                      <option key={out} value={out}>
                        {out}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Staff */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search staff or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D3232A] w-40 sm:w-48"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: EMPLOYEE ROSTER MATRIX VIEW ================= */}
        {activeTab === "roster" && (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            {/* Clean Matrix Table Container (Single-Page Document Scrolling) */}
            <div className="overflow-x-auto max-w-full">
              <table className="w-full border-collapse text-left">
                {/* Table Header: Sticky Left Employee Column + Date Headers */}
                <thead>
                  <tr className="bg-gray-50/95 border-b border-gray-200 text-xs">
                    {/* Sticky Left Column Header */}
                    <th className="sticky left-0 z-20 bg-gray-50/95 px-4 py-3 font-bold text-gray-700 w-56 min-w-[220px] border-r border-gray-200 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span>EMPLOYEE STAFF</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-200/60 px-2 py-0.5 rounded-full">
                          {filteredEmployees.length} Team
                        </span>
                      </div>
                    </th>

                    {/* Sticky Date Column Headers */}
                    {columns.map((col) => (
                      <th
                        key={col.dateKey}
                        className={`px-3 py-2.5 font-bold text-center border-r border-gray-200/60 min-w-[140px] max-w-[200px] transition-colors ${
                          col.isToday ? "bg-red-50/90 text-[#D3232A]" : "text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{col.dayName}</span>
                          <span
                            className={`text-sm font-bold my-0.5 px-2 py-0.5 rounded-md ${
                              col.isToday ? "bg-[#D3232A] text-white" : "text-gray-900"
                            }`}
                          >
                            {col.dayNum} {col.monthName}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body: Employee Rows */}
                <tbody className="divide-y divide-gray-200/60 text-xs">
                  {isEmpLoading || isShiftsLoading ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="py-12 text-center text-gray-500 font-medium">
                        Loading employee roster matrix...
                      </td>
                    </tr>
                  ) : paginatedRosterEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length + 1} className="py-12 text-center text-gray-500 font-medium">
                        No employees found matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRosterEmployees.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                        {/* Sticky Left Column: Employee Cell */}
                        <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/90 px-4 py-3 border-r border-gray-200 shadow-xs">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-[#D3232A]/10 text-[#D3232A] font-bold text-xs flex items-center justify-center border border-red-200/60 shrink-0">
                              {emp.name?.[0] || "E"}
                            </div>
                            <div className="overflow-hidden">
                              <span className="font-bold text-gray-900 truncate block text-xs">{emp.name}</span>
                              <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5">
                                {emp.role || "STAFF"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Date Cells for Employee */}
                        {columns.map((col) => {
                          const lookupKey = `${emp.id}_${col.dateKey}`;
                          const cellItems = matrixLookup[lookupKey] || [];

                          const leaveItem = cellItems.find((i) => i.type === "LEAVE");
                          const shiftItems = cellItems.filter((i) => i.type === "SHIFT");

                          return (
                            <td
                              key={col.dateKey}
                              className={`px-2 py-2.5 border-r border-gray-200/60 align-top transition-colors ${
                                col.isToday ? "bg-red-50/20" : ""
                              }`}
                            >
                              {/* 1. If Employee is On Leave */}
                              {leaveItem ? (
                                <div className="p-2 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-900 space-y-1 shadow-2xs">
                                  <div className="flex items-center gap-1 font-bold text-[11px] text-rose-700">
                                    <Palmtree className="h-3.5 w-3.5 text-rose-600" />
                                    <span>On Leave</span>
                                  </div>
                                  <p className="text-[10px] text-rose-600 line-clamp-1 italic" title={leaveItem.data.reason}>
                                    {leaveItem.data.reason}
                                  </p>
                                </div>
                              ) : shiftItems.length > 0 ? (
                                /* 2. If Employee has Assigned Shift(s) */
                                <div className="space-y-1.5">
                                  {shiftItems.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="p-2 bg-[#D3232A]/5 hover:bg-[#D3232A]/10 border border-red-200/80 rounded-xl text-gray-900 space-y-1 transition-colors relative group/card"
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-bold text-xs text-gray-900 truncate">{item.data.shift.name}</span>
                                        {item.data.isRecurring && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openRosterModalForEmployee(emp.id);
                                            }}
                                            className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-1.5 py-0.5 rounded shrink-0 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs"
                                            title="Click to edit Weekly Recurring Roster for this employee"
                                          >
                                            <Repeat className="h-2.5 w-2.5 text-indigo-600" />
                                          </button>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-600">
                                        <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                                        <span>{item.data.shift.startTime} - {item.data.shift.endTime}</span>
                                      </div>

                                      {/* Show Outlet Name if "ALL" Outlets selected */}
                                      {selectedOutlet === "ALL" && item.data.shift.outlet?.name && (
                                        <div className="text-[9px] font-bold text-[#D3232A] bg-red-100/60 px-1.5 py-0.5 rounded truncate" title={item.data.shift.outlet.name}>
                                          📍 {item.data.shift.outlet.name}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                /* 3. Day Off / Unassigned Cell -> Hover Quick Assign */
                                <div className="h-full min-h-[50px] flex items-center justify-center">
                                  <button
                                    onClick={() => {
                                      const defaultShift = shifts[0];
                                      setAssignForm({
                                        shiftId: defaultShift?.id || "",
                                        employeeIds: [emp.id],
                                        date: col.dateKey,
                                        isSingleEmp: true,
                                        singleEmpName: emp.name,
                                        singleEmpRole: emp.role || "STAFF",
                                        isCustomHours: false,
                                        customStartTime: defaultShift?.startTime || "09:00",
                                        customEndTime: defaultShift?.endTime || "17:00",
                                      });
                                      setShowAssignModal(true);
                                    }}
                                    className="w-full h-full py-2.5 text-[11px] font-semibold text-gray-400 hover:text-[#D3232A] hover:bg-red-50/60 rounded-xl border border-dashed border-transparent hover:border-red-200 transition-all flex items-center justify-center gap-1 opacity-40 hover:opacity-100 cursor-pointer"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Assign</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Roster Matrix Pagination & Viewport Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 bg-gray-50/90 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={matrixPageSize}
                  onChange={(e) => {
                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                    setMatrixPageSize(val);
                    setMatrixPage(1);
                  }}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                >
                  <option value={10}>10 employees</option>
                  <option value={15}>15 employees</option>
                  <option value={25}>25 employees</option>
                  <option value={50}>50 employees</option>
                  <option value="ALL">Show All ({filteredEmployees.length})</option>
                </select>
                <span>per page</span>
                <span className="text-gray-300 mx-1">|</span>
                <span>
                  Showing <strong>{filteredEmployees.length > 0 ? (matrixPageSize === "ALL" ? 1 : (safeMatrixPage - 1) * (matrixPageSize as number) + 1) : 0}</strong> to <strong>{matrixPageSize === "ALL" ? filteredEmployees.length : Math.min(safeMatrixPage * (matrixPageSize as number), filteredEmployees.length)}</strong> of <strong>{filteredEmployees.length}</strong> team members
                </span>
              </div>

              {matrixPageSize !== "ALL" && totalMatrixPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setMatrixPage((p) => Math.max(1, p - 1))}
                    disabled={safeMatrixPage === 1}
                    className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 font-medium">
                    Page {safeMatrixPage} of {totalMatrixPages}
                  </span>
                  <button
                    onClick={() => setMatrixPage((p) => Math.min(totalMatrixPages, p + 1))}
                    disabled={safeMatrixPage >= totalMatrixPages}
                    className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SHIFT SLOTS MASTER DIRECTORY ================= */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shifts.map((shift: any) => (
                <div
                  key={shift.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                    <div>
                      {shift.outlet?.name && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#D3232A] bg-red-50 px-2 py-0.5 rounded-md border border-red-100 mb-1.5">
                          📍 {shift.outlet.name}
                        </span>
                      )}
                      <h3 className="font-bold text-gray-900 text-lg leading-snug">{shift.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mt-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {shift.startTime} - {shift.endTime}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-[#D3232A]">
                      {shift.assignments?.length || 0} Total
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                      <span>ASSIGNED TEAM MEMBERS</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{shift.assignments?.length || 0} Staff</span>
                    </div>

                    {shift.assignments && shift.assignments.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap max-h-24 overflow-y-auto">
                        {shift.assignments.map((asgn: any, idx: number) => {
                          const empName = asgn.employee?.name || "Staff";
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-200/80 px-2 py-0.5 rounded-lg"
                            >
                              <Users className="h-3 w-3 text-gray-400" />
                              {empName}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">No staff assigned to this shift yet.</p>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const todayKey = parseDateKey(new Date());
                      // Find employees currently assigned to this shift for today
                      const currentlyAssignedIds = (shift.assignments || [])
                        .filter((asgn: any) => parseDateKey(asgn.date) === todayKey)
                        .map((asgn: any) => asgn.employee?.id || asgn.employeeId)
                        .filter(Boolean);

                      setAssignForm({
                        shiftId: shift.id,
                        employeeIds: currentlyAssignedIds,
                        date: todayKey,
                      });
                      setShowAssignModal(true);
                    }}
                    className="w-full py-2.5 text-xs font-bold text-center text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl transition-colors border border-red-200/80 cursor-pointer"
                  >
                    + Assign / Manage Staff
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Swap Requests Section */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Shift Swap Requests</h2>
              <p className="text-xs text-gray-500">
                Staff members requesting to exchange assigned shifts.
              </p>
            </div>
            <ArrowRightLeft className="h-5 w-5 text-[#D3232A]" />
          </div>

          <div className="space-y-3">
            {allSwapRequests.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No active shift swap requests right now.
              </p>
            ) : (
              allSwapRequests.map((swap: any) => (
                <div
                  key={swap.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <span>Swap Request #{swap.id.slice(0, 6)}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          swap.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-800"
                            : swap.status === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {swap.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Requested date: {formatDateNice(swap.date)}
                    </p>
                  </div>

                  {swap.status === "REQUESTED" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSwapAction(swap.id, "APPROVED")}
                        disabled={isUpdatingSwap}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleSwapAction(swap.id, "REJECTED")}
                        disabled={isUpdatingSwap}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal 1: Create Shift Slot */}
        {showCreateShiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                <h3 className="text-lg font-bold text-gray-900">Create Shift Slot</h3>
                <button onClick={() => setShowCreateShiftModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleCreateShiftSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Morning Shift, Evening Rush"
                    value={shiftForm.name}
                    onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time (HH:MM)
                    </label>
                    <CustomTimePicker
                      value={shiftForm.startTime}
                      onChange={(time) => setShiftForm({ ...shiftForm, startTime: time })}
                      placeholder="08:00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time (HH:MM)
                    </label>
                    <CustomTimePicker
                      value={shiftForm.endTime}
                      onChange={(time) => setShiftForm({ ...shiftForm, endTime: time })}
                      placeholder="16:00"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateShiftModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingShift}
                    className="px-4 py-2 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingShift ? "Saving..." : "Create Shift Slot"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Assign Shift */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span>
                      {assignForm.isSingleEmp
                        ? `Assign Shift — ${assignForm.singleEmpName}`
                        : "Assign Shift to Staff"}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {assignForm.isSingleEmp
                      ? `Assigning shift for ${formatDateNice(assignForm.date)}.`
                      : `Assign employees to a shift slot for ${formatDateNice(assignForm.date)}.`}
                  </p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="p-6 space-y-5">
                {/* 1. Employee Target Display */}
                {assignForm.isSingleEmp ? (
                  <div className="bg-red-50/50 border border-red-100 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#D3232A]/10 text-[#D3232A] font-bold text-sm flex items-center justify-center border border-red-200 shrink-0">
                        {assignForm.singleEmpName?.[0] || "E"}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 text-sm block">
                          {assignForm.singleEmpName}
                        </span>
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded mt-0.5">
                          {assignForm.singleEmpRole || "STAFF"}
                        </span>
                      </div>
                    </div>
                   
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select Staff Members ({assignForm.employeeIds.length} / {employees.length} selected)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (assignForm.employeeIds.length === employees.length) {
                            setAssignForm({ ...assignForm, employeeIds: [] });
                          } else {
                            setAssignForm({ ...assignForm, employeeIds: employees.map((e: any) => e.id) });
                          }
                        }}
                        className="text-xs font-bold text-[#D3232A] hover:underline cursor-pointer"
                      >
                        {assignForm.employeeIds.length === employees.length ? "Deselect All" : "⚡ Select All Staff"}
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1.5 bg-gray-50">
                      {employees.length === 0 ? (
                        <p className="text-xs text-gray-400 p-2 text-center">No employees found.</p>
                      ) : (
                        employees.map((e: any) => {
                          const isChecked = assignForm.employeeIds.includes(e.id);
                          const selectedShift = shifts.find((s: any) => s.id === assignForm.shiftId);
                          const isAlreadyAssigned = (selectedShift?.assignments || []).some((asgn: any) => {
                            const asgnDate = parseDateKey(asgn.date);
                            const asgnEmpId = asgn.employee?.id || asgn.employeeId;
                            return asgnDate === assignForm.date && asgnEmpId === e.id;
                          });

                          const lookupKey = `${e.id}_${assignForm.date}`;
                          const cellItems = matrixLookup[lookupKey] || [];
                          const leaveItem = cellItems.find((i) => i.type === "LEAVE");
                          const otherShiftItem = cellItems.find(
                            (i) => i.type === "SHIFT" && i.data.shift.id !== assignForm.shiftId
                          );

                          return (
                            <label
                              key={e.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                                leaveItem
                                  ? "bg-rose-50/60 border-rose-200 text-rose-800 opacity-75"
                                  : isAlreadyAssigned
                                  ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold"
                                  : isChecked
                                  ? "bg-red-50 border-red-200 text-gray-900 font-semibold"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(evt) => {
                                    if (evt.target.checked) {
                                      setAssignForm({ ...assignForm, employeeIds: [...assignForm.employeeIds, e.id] });
                                    } else {
                                      setAssignForm({ ...assignForm, employeeIds: assignForm.employeeIds.filter((id) => id !== e.id) });
                                    }
                                  }}
                                  className="h-4 w-4 text-[#D3232A] rounded border-gray-300 focus:ring-[#D3232A] cursor-pointer"
                                />
                                <div>
                                  <span className="text-xs font-medium block">{e.name}</span>
                                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">{e.role || "STAFF"}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {leaveItem ? (
                                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                                    🌴 On Leave
                                  </span>
                                ) : isAlreadyAssigned ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                                    ✓ Already Assigned
                                  </span>
                                ) : otherShiftItem ? (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                                    ⚠️ Shift: {otherShiftItem.data.shift.name}
                                  </span>
                                ) : null}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Hybrid Shift & Time Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                      Select Shift Preset OR Custom Hours
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setAssignForm({
                          ...assignForm,
                          isCustomHours: !assignForm.isCustomHours,
                        })
                      }
                      className="text-xs font-bold text-[#D3232A] hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200/80 transition-colors cursor-pointer"
                    >
                      {assignForm.isCustomHours ? "← Use Presets" : "⏱️ Custom Hours"}
                    </button>
                  </div>

                  {!assignForm.isCustomHours ? (
                    /* Shift Slot Pills / Presets */
                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {shifts.map((s: any) => {
                          const isSelected = !assignForm.isCustomHours && assignForm.shiftId === s.id;
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() =>
                                setAssignForm({
                                  ...assignForm,
                                  shiftId: s.id,
                                  isCustomHours: false,
                                  customStartTime: s.startTime,
                                  customEndTime: s.endTime,
                                })
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? "bg-red-50 border-[#D3232A] ring-2 ring-[#D3232A]/20 shadow-xs"
                                  : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className={`text-xs font-bold ${isSelected ? "text-[#D3232A]" : "text-gray-900"}`}>
                                  {s.name}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="h-4 w-4 text-[#D3232A] shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                                <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                                <span>{s.startTime} - {s.endTime}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Custom Start & End Time Input Pickers */
                    <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span>Specify Custom Shift Window</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Start Time
                          </label>
                          <CustomTimePicker
                            value={assignForm.customStartTime || "09:00"}
                            onChange={(time) =>
                              setAssignForm({ ...assignForm, customStartTime: time })
                            }
                            placeholder="09:00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            End Time
                          </label>
                          <CustomTimePicker
                            value={assignForm.customEndTime || "17:00"}
                            onChange={(time) =>
                              setAssignForm({ ...assignForm, customEndTime: time })
                            }
                            placeholder="17:00"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-amber-700/90 font-medium">
                        ✨ Custom shift times are automatically created as an ad-hoc slot if no preset exists.
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Date Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Shift Date
                  </label>
                  <CustomDatePicker
                    value={assignForm.date}
                    onChange={(date) => setAssignForm({ ...assignForm, date })}
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isAssigning ||
                      isCreatingShift ||
                      assignForm.employeeIds.length === 0 ||
                      (!assignForm.isCustomHours && !assignForm.shiftId) ||
                      (assignForm.isCustomHours && (!assignForm.customStartTime || !assignForm.customEndTime))
                    }
                    className="px-5 py-2.5 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer transition-all"
                  >
                    {isAssigning || isCreatingShift
                      ? "Saving..."
                      : assignForm.isSingleEmp
                      ? `Assign Shift to ${assignForm.singleEmpName?.split(' ')[0] || 'Staff'}`
                      : `Assign ${assignForm.employeeIds.length} Staff Member${assignForm.employeeIds.length === 1 ? "" : "s"}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Request Swap */}
        {showSwapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
                <h3 className="text-lg font-bold text-gray-900">Request Shift Swap</h3>
                <button onClick={() => setShowSwapModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <form onSubmit={handleSwapSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Employee (Assigned)
                  </label>
                  <select
                    required
                    value={swapForm.fromEmployeeId}
                    onChange={(e) => setSwapForm({ ...swapForm, fromEmployeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="">-- Select Source Employee --</option>
                    {employees.map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To Employee (Replacement)
                  </label>
                  <select
                    required
                    value={swapForm.toEmployeeId}
                    onChange={(e) => setSwapForm({ ...swapForm, toEmployeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="">-- Select Replacement Employee --</option>
                    {employees.map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift Slot
                  </label>
                  <select
                    required
                    value={swapForm.shiftId}
                    onChange={(e) => setSwapForm({ ...swapForm, shiftId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="">-- Select Shift --</option>
                    {shifts.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={swapForm.date}
                    onChange={(e) => setSwapForm({ ...swapForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowSwapModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSwapping}
                    className="px-4 py-2 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSwapping ? "Submitting..." : "Submit Swap Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Set Weekly Roster */}
        {showRosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Set Employee Weekly Roster</h3>
                  <p className="text-xs text-gray-500">Configure recurring Mon–Sun shifts or off-days (Applies to all upcoming weeks).</p>
                </div>
                <button onClick={() => setShowRosterModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleRosterSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Employee
                  </label>
                  <select
                    required
                    value={rosterEmployeeId}
                    onChange={(e) => setRosterEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">⚡ Quick Action: Fill All Open Days</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={applyToAllShiftId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setApplyToAllShiftId(val);
                        if (val) {
                          const nextSchedule = { ...weeklySchedule };
                          const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
                          ALL_DAYS.forEach((day) => {
                            if (operatingDays.includes(day)) {
                              nextSchedule[day] = val;
                            } else {
                              nextSchedule[day] = "OFF";
                            }
                          });
                          setWeeklySchedule(nextSchedule);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Common Shift Timing --</option>
                      {shifts.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.startTime} - {s.endTime})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Weekly Schedule (Mon – Sun)
                  </label>
                  {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                    const isClosed = !operatingDays.includes(day);
                    return (
                      <div key={day} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 text-xs">
                        <span className="font-bold text-gray-700 min-w-[90px]">{day}</span>
                        {isClosed ? (
                          <span className="text-gray-400 font-semibold italic">Outlet Closed</span>
                        ) : (
                          <select
                            value={weeklySchedule[day] || ""}
                            onChange={(e) => setWeeklySchedule({ ...weeklySchedule, [day]: e.target.value })}
                            className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                          >
                            <option value="">-- Select Shift --</option>
                            <option value="OFF">OFF (Day Off)</option>
                            {shifts.map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.startTime} - {s.endTime})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowRosterModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettingRoster || !rosterEmployeeId}
                    className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isSettingRoster ? "Saving..." : "Save Weekly Roster"}
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
