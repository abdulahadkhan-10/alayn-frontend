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
  Clock,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useAppSelector } from "@/redux/store/hooks";

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

// Helper: Parse Date Key YYYY-MM-DD in local timezone
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

// Helper: Get 2-letter uppercase employee initials
function getInitials(name: string): string {
  if (!name) return "EM";
  const cleanStr = name.replace(/\(.*?\)/g, "").replace(/[^a-zA-Z\s]/g, "").trim();
  const words = cleanStr.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return "EM";
}

export default function ShiftSchedulerPage() {
  // Queries & Mutations
  const { data: shiftApiData, isLoading: isShiftsLoading } = useGetShiftsQuery(undefined);
  const { data: empApiData, isLoading: isEmpLoading } = useGetEmployeesQuery(undefined);
  const { data: leaveApiData } = useGetLeaveRequestsQuery(undefined);
  const { data: holidaysData } = useGetHolidaysQuery(undefined);
  const { data: outletRostersData } = useGetOutletRostersQuery(undefined);

  const user = useAppSelector((state: any) => state.auth?.user);
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

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
    MONDAY: "", TUESDAY: "", WEDNESDAY: "", THURSDAY: "", FRIDAY: "", SATURDAY: "", SUNDAY: "",
  });

  const [operatingDays] = useState<string[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]);

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

  const currentEmployee = useMemo(() => {
    return employees.find(
      (e: any) => e.userId === user?.id || (user?.email && e.email === user?.email)
    );
  }, [employees, user]);

  // Filter Employees by Search Query & Selected Outlet
  const filteredEmployees = useMemo(() => {
    if (!isManagerOrOwner) {
      return currentEmployee ? [currentEmployee] : [];
    }
    return employees.filter((e: any) => {
      // 1. Search Query Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = e.name?.toLowerCase().includes(q) || e.role?.toLowerCase().includes(q);
        if (!matchName) return false;
      }

      // 2. Outlet Filter
      if (selectedOutlet !== "ALL") {
        if (e.outlet?.name === selectedOutlet) return true;

        const hasShiftAtOutlet = shifts.some(
          (s: any) =>
            s.outlet?.name === selectedOutlet &&
            (s.assignments || []).some((a: any) => (a.employee?.id || a.employeeId) === e.id)
        );
        if (hasShiftAtOutlet) return true;

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

    // 3. Map Recurring Weekly Rosters
    const rostersList = outletRostersData?.data || [];
    columns.forEach((col) => {
      rostersList.forEach((r: any) => {
        if (r.dayOfWeek === col.dayOfWeekLong && r.shiftId && r.shift && r.employeeId) {
          if (selectedOutlet !== "ALL" && r.shift?.outlet?.name && r.shift.outlet.name !== selectedOutlet) return;

          const key = `${r.employeeId}_${col.dateKey}`;
          if (!lookup[key]) lookup[key] = [];

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

      if (assignForm.isCustomHours && assignForm.customStartTime && assignForm.customEndTime) {
        const match = shifts.find(
          (s: any) => s.startTime === assignForm.customStartTime && s.endTime === assignForm.customEndTime
        );
        if (match) {
          targetShiftId = match.id;
        } else {
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
        <div className="space-y-4">
          <WorkforceHeaderNav />
          <WorkforceSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Navigation Tabs Header */}
        <WorkforceHeaderNav />

        {/* Compact Clean Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-4 py-3 rounded-lg border border-gray-200">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Staff Schedule</h1>
            <p className="text-xs text-gray-500">Plan shifts, availability and weekly staffing.</p>
          </div>
          <div className="flex items-center gap-2">
            {isManagerOrOwner && (
              <>
                <a
                  href="/settings"
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Outlet holidays
                </a>
                <button
                  onClick={() => {
                    setRosterEmployeeId(employees[0]?.id || "");
                    setShowRosterModal(true);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Weekly roster
                </button>
                <button
                  onClick={() => setShowCreateShiftModal(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#D3232A] rounded-lg hover:bg-[#b01e23] transition-colors cursor-pointer"
                >
                  New shift
                </button>
              </>
            )}
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2.5 rounded-lg text-xs">
            <span className="font-medium">{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
              <X className="h-4 w-4 text-emerald-700" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HERO CALENDAR WORKSPACE (FULL-VIEWPORT FIT WITH NO INTERNAL SCROLL) */}
        {/* ========================================================================= */}
        <div className="w-full bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
          
          {/* Calendar Toolbar Immediately Above Calendar (36-40px high controls) */}
          <div className="px-3.5 py-2 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            
            {/* LEFT: Date Navigator + Range Segment + Tab Switcher */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Date Navigation */}
              {activeTab === "roster" && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const prev = new Date(selectedMonthDate);
                      prev.setDate(prev.getDate() - (viewRange === "7" ? 7 : viewRange === "14" ? 14 : 30));
                      setSelectedMonthDate(prev);
                    }}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-gray-900 min-w-[110px] text-center text-xs">
                    {columns[0]?.monthName} {columns[0]?.dayNum} – {columns[columns.length - 1]?.monthName} {columns[columns.length - 1]?.dayNum}
                  </span>
                  <button
                    onClick={() => {
                      const next = new Date(selectedMonthDate);
                      next.setDate(next.getDate() + (viewRange === "7" ? 7 : viewRange === "14" ? 14 : 30));
                      setSelectedMonthDate(next);
                    }}
                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSelectedMonthDate(new Date())}
                    className="ml-1 px-2 py-0.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              )}

              {/* View Range Segment Control */}
              {activeTab === "roster" && (
                <div className="flex items-center bg-gray-100 p-0.5 rounded border border-gray-200 text-xs">
                  <button
                    onClick={() => setViewRange("7")}
                    className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      viewRange === "7" ? "bg-white text-gray-900 font-semibold shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    7 days
                  </button>
                  <button
                    onClick={() => setViewRange("14")}
                    className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      viewRange === "14" ? "bg-white text-gray-900 font-semibold shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    14 days
                  </button>
                  <button
                    onClick={() => setViewRange("30")}
                    className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      viewRange === "30" ? "bg-white text-gray-900 font-semibold shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Month
                  </button>
                </div>
              )}

              {/* Tab Switcher */}
              {isManagerOrOwner && (
                <div className="flex items-center bg-gray-100 p-0.5 rounded border border-gray-200 text-xs">
                  <button
                    onClick={() => setActiveTab("roster")}
                    className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      activeTab === "roster" ? "bg-white text-gray-900 font-semibold shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Schedule
                  </button>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                      activeTab === "templates" ? "bg-white text-gray-900 font-semibold shadow-2xs" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Shift templates ({shifts.length})
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: Outlet Selector & Search Staff */}
            {isManagerOrOwner && (
              <div className="flex items-center gap-2">
                {outletOptions.length > 0 && (
                  <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                    <span className="text-gray-500 mr-1 font-medium text-[11px]">Outlet:</span>
                    <select
                      value={selectedOutlet}
                      onChange={(e) => setSelectedOutlet(e.target.value)}
                      className="bg-transparent font-medium text-gray-900 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL">All outlets</option>
                      {outletOptions.map((out) => (
                        <option key={out} value={out}>
                          {out}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="relative">
                  <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2 top-1.5" />
                  <input
                    type="text"
                    placeholder="Search staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 pr-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#D3232A] w-40 sm:w-44"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ================= TAB 1: EMPLOYEE SCHEDULE MATRIX ================= */}
          {activeTab === "roster" && (
            <div className="flex flex-col">
              {/* Full Bleed Grid Matrix Table */}
              <div className="overflow-x-auto max-w-full">
                <table className="w-full border-collapse text-left text-xs">
                  {/* Table Header: Sticky Left Employee Column + Date Headers */}
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="sticky left-0 z-20 bg-gray-50 px-3 py-1.5 font-semibold text-gray-600 w-52 min-w-[200px] border-r border-gray-200">
                        EMPLOYEE
                      </th>

                      {columns.map((col) => (
                        <th
                          key={col.dateKey}
                          className={`px-2 py-1.5 font-semibold text-center border-r border-gray-200 min-w-[120px] max-w-[160px] ${
                            col.isToday ? "bg-red-50/40 text-[#D3232A]" : "text-gray-700"
                          }`}
                        >
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">{col.dayName}</span>
                            <span className={`text-[11px] font-semibold ${col.isToday ? "text-[#D3232A]" : "text-gray-900"}`}>
                              {col.dayNum} {col.monthName}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-200">
                    {isEmpLoading || isShiftsLoading ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="py-8 text-center text-gray-500 font-medium">
                          Loading staff schedule...
                        </td>
                      </tr>
                    ) : paginatedRosterEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="py-8 text-center text-gray-500 font-medium">
                          No employees found matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedRosterEmployees.map((emp: any) => {
                        const cleanName = (emp.name || "Employee").replace(/\(.*?\)/g, "").trim();
                        const initials = getInitials(cleanName);

                        return (
                          <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors group">
                            {/* Sticky Left Column: Employee Cell */}
                            <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50 px-3 py-1.5 border-r border-gray-200">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-700 font-semibold text-[10px] flex items-center justify-center border border-gray-200 shrink-0">
                                  {initials}
                                </div>
                                <div className="overflow-hidden leading-tight">
                                  <span className="font-medium text-gray-900 truncate block text-xs">{cleanName}</span>
                                  <span className="text-[10px] text-gray-500 font-normal truncate block">
                                    {emp.role || "Staff"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Date Cells */}
                            {columns.map((col) => {
                              const lookupKey = `${emp.id}_${col.dateKey}`;
                              const cellItems = matrixLookup[lookupKey] || [];

                              const leaveItem = cellItems.find((i) => i.type === "LEAVE");
                              const shiftItems = cellItems.filter((i) => i.type === "SHIFT");

                              return (
                                <td
                                  key={col.dateKey}
                                  className={`px-1.5 py-1 border-r border-gray-200 align-top ${
                                    col.isToday ? "bg-red-50/10" : ""
                                  }`}
                                >
                                  {/* Leave */}
                                  {leaveItem ? (
                                    <div className="p-1.5 bg-rose-50/70 border border-rose-200/60 rounded text-rose-900 space-y-0.5">
                                      <span className="font-medium text-[11px] text-rose-800 block">On leave</span>
                                      <span className="text-[10px] text-rose-700/80 block truncate" title={leaveItem.data.reason}>
                                        {leaveItem.data.reason}
                                      </span>
                                    </div>
                                  ) : shiftItems.length > 0 ? (
                                    /* Shift Blocks */
                                    <div className="space-y-1">
                                      {shiftItems.map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-gray-900 leading-snug transition-colors"
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <span className="font-semibold text-[11px] text-gray-900 truncate">{item.data.shift.name}</span>
                                            {item.data.isRecurring && (
                                              <span
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openRosterModalForEmployee(emp.id);
                                                }}
                                                className="text-[9px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 rounded cursor-pointer hover:bg-indigo-100"
                                                title="Weekly recurring roster"
                                              >
                                                Weekly
                                              </span>
                                            )}
                                          </div>

                                          <div className="text-[10px] text-gray-500 font-normal">
                                            {item.data.shift.startTime} – {item.data.shift.endTime}
                                          </div>

                                          {selectedOutlet === "ALL" && item.data.shift.outlet?.name && (
                                            <div className="text-[9px] text-gray-500 truncate" title={item.data.shift.outlet.name}>
                                              {item.data.shift.outlet.name}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    /* Unassigned Cell (Hover Quick Assign for managers only) */
                                    <div className="h-full min-h-[34px] flex items-center justify-center">
                                      {isManagerOrOwner ? (
                                        <button
                                          onClick={() => {
                                            const defaultShift = shifts[0];
                                            setAssignForm({
                                              shiftId: defaultShift?.id || "",
                                              employeeIds: [emp.id],
                                              date: col.dateKey,
                                              isSingleEmp: true,
                                              singleEmpName: cleanName,
                                              singleEmpRole: emp.role || "STAFF",
                                              isCustomHours: false,
                                              customStartTime: defaultShift?.startTime || "09:00",
                                              customEndTime: defaultShift?.endTime || "17:00",
                                            });
                                            setShowAssignModal(true);
                                          }}
                                          className="w-full h-full py-1 text-[11px] text-gray-400 hover:text-[#D3232A] hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 cursor-pointer"
                                        >
                                          <Plus className="h-3 w-3" />
                                          <span>Assign</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] text-gray-300">—</span>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Simplified Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3.5 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                <div>
                  Showing <strong>{filteredEmployees.length > 0 ? (matrixPageSize === "ALL" ? 1 : (safeMatrixPage - 1) * (matrixPageSize as number) + 1) : 0}–{matrixPageSize === "ALL" ? filteredEmployees.length : Math.min(safeMatrixPage * (matrixPageSize as number), filteredEmployees.length)}</strong> of <strong>{filteredEmployees.length}</strong> employees
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={matrixPageSize}
                      onChange={(e) => {
                        const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                        setMatrixPageSize(val);
                        setMatrixPage(1);
                      }}
                      className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-800 focus:outline-none"
                    >
                      <option value={10}>10 per page</option>
                      <option value={15}>15 per page</option>
                      <option value={25}>25 per page</option>
                      <option value="ALL">All employees</option>
                    </select>
                  </div>

                  {matrixPageSize !== "ALL" && totalMatrixPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setMatrixPage((p) => Math.max(1, p - 1))}
                        disabled={safeMatrixPage === 1}
                        className="rounded border border-gray-200 bg-white p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-1.5 font-medium">
                        {safeMatrixPage} / {totalMatrixPages}
                      </span>
                      <button
                        onClick={() => setMatrixPage((p) => Math.min(totalMatrixPages, p + 1))}
                        disabled={safeMatrixPage >= totalMatrixPages}
                        className="rounded border border-gray-200 bg-white p-1 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: SHIFT TEMPLATES TAB ================= */}
          {activeTab === "templates" && (
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Shift</th>
                      <th className="px-4 py-2.5">Hours</th>
                      <th className="px-4 py-2.5">Outlet</th>
                      <th className="px-4 py-2.5">Assigned</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {shifts.map((shift: any) => (
                      <tr key={shift.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-gray-900">{shift.name}</td>
                        <td className="px-4 py-3 text-gray-600">{shift.startTime} – {shift.endTime}</td>
                        <td className="px-4 py-3 text-gray-600">{shift.outlet?.name || "All outlets"}</td>
                        <td className="px-4 py-3 text-gray-600">{shift.assignments?.length || 0} staff members</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              const todayKey = parseDateKey(new Date());
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
                            className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Compact Swap Requests Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <span>Shift swap requests</span>
              <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 rounded border border-amber-200">
                {allSwapRequests.length} pending
              </span>
            </h2>
          </div>

          <div className="space-y-2">
            {allSwapRequests.length === 0 ? (
              <p className="text-xs text-gray-500 py-1">No active shift swap requests right now.</p>
            ) : (
              allSwapRequests.map((swap: any) => (
                <div
                  key={swap.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-gray-50 rounded-md border border-gray-200 gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-medium text-gray-900">
                      Swap Request #{swap.id.slice(0, 6)} · {swap.status}
                    </div>
                    <p className="text-gray-500">Requested date: {formatDateNice(swap.date)}</p>
                  </div>

                  {swap.status === "REQUESTED" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSwapAction(swap.id, "REJECTED")}
                        disabled={isUpdatingSwap}
                        className="px-3 py-1 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-md text-xs font-medium transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleSwapAction(swap.id, "APPROVED")}
                        disabled={isUpdatingSwap}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Approve
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[85vh] my-auto overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
                <h3 className="text-base font-semibold text-gray-900">Create shift</h3>
                <button onClick={() => setShowCreateShiftModal(false)} className="cursor-pointer">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleCreateShiftSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Shift name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Morning Shift"
                      value={shiftForm.name}
                      onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        Start time
                      </label>
                      <CustomTimePicker
                        value={shiftForm.startTime}
                        onChange={(time) => setShiftForm({ ...shiftForm, startTime: time })}
                        placeholder="08:00"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">
                        End time
                      </label>
                      <CustomTimePicker
                        value={shiftForm.endTime}
                        onChange={(time) => setShiftForm({ ...shiftForm, endTime: time })}
                        placeholder="16:00"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateShiftModal(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingShift}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isCreatingShift ? "Saving..." : "Create shift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Assign Shift (CONTAINED IN VIEWPORT WITH STICKY FOOTER) */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[85vh] my-auto overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {assignForm.isSingleEmp ? `Assign shift — ${assignForm.singleEmpName}` : "Assign shift"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {formatDateNice(assignForm.date)}
                  </p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="cursor-pointer">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              {/* Scrollable Form Content */}
              <form onSubmit={handleAssignSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                  {assignForm.isSingleEmp ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900 block">{assignForm.singleEmpName}</span>
                        <span className="text-[#64748b] text-[11px]">{assignForm.singleEmpRole || "Staff"}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-medium text-gray-700">
                          Staff members ({assignForm.employeeIds.length} selected)
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
                          className="text-xs font-medium text-[#D3232A] hover:underline cursor-pointer"
                        >
                          {assignForm.employeeIds.length === employees.length ? "Deselect all" : "Select all"}
                        </button>
                      </div>

                      <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1 bg-gray-50">
                        {employees.map((e: any) => {
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

                          return (
                            <label
                              key={e.id}
                              className="flex items-center justify-between p-2 rounded border bg-white border-gray-200 cursor-pointer hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
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
                                  className="h-3.5 w-3.5 text-[#D3232A] rounded border-gray-300 focus:ring-[#D3232A]"
                                />
                                <span className="font-medium text-gray-900">{e.name}</span>
                              </div>
                              {leaveItem ? (
                                <span className="text-[10px] text-rose-700 font-medium">On leave</span>
                              ) : isAlreadyAssigned ? (
                                <span className="text-[10px] text-emerald-700 font-medium">Already assigned</span>
                              ) : null}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Shift Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-gray-700">Shift</label>
                      <button
                        type="button"
                        onClick={() => setAssignForm({ ...assignForm, isCustomHours: !assignForm.isCustomHours })}
                        className="text-xs font-medium text-[#D3232A] hover:underline cursor-pointer"
                      >
                        {assignForm.isCustomHours ? "Use presets" : "Custom hours"}
                      </button>
                    </div>

                    {!assignForm.isCustomHours ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {shifts.map((s: any) => {
                          const isSelected = !assignForm.isCustomHours && assignForm.shiftId === s.id;
                          return (
                            <div
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
                              className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer flex items-center justify-between ${
                                isSelected ? "bg-red-50/50 border-[#D3232A]" : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <span className="font-medium text-gray-900">{s.name}</span>
                              <span className="text-gray-500">{s.startTime} – {s.endTime}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">Start time</label>
                            <CustomTimePicker
                              value={assignForm.customStartTime || "09:00"}
                              onChange={(time) => setAssignForm({ ...assignForm, customStartTime: time })}
                              placeholder="09:00"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">End time</label>
                            <CustomTimePicker
                              value={assignForm.customEndTime || "17:00"}
                              onChange={(time) => setAssignForm({ ...assignForm, customEndTime: time })}
                              placeholder="17:00"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shift Date Picker */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Shift date</label>
                    <CustomDatePicker
                      value={assignForm.date}
                      onChange={(date) => setAssignForm({ ...assignForm, date })}
                    />
                  </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
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
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isAssigning || isCreatingShift ? "Saving..." : "Assign shift"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 3: Request Swap */}
        {showSwapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[85vh] my-auto overflow-hidden text-xs">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
                <h3 className="text-base font-semibold text-gray-900">Request shift swap</h3>
                <button onClick={() => setShowSwapModal(false)} className="cursor-pointer">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleSwapSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">From employee</label>
                    <select
                      required
                      value={swapForm.fromEmployeeId}
                      onChange={(e) => setSwapForm({ ...swapForm, fromEmployeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                    >
                      <option value="">-- Select employee --</option>
                      {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">To employee</label>
                    <select
                      required
                      value={swapForm.toEmployeeId}
                      onChange={(e) => setSwapForm({ ...swapForm, toEmployeeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                    >
                      <option value="">-- Select replacement --</option>
                      {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Shift</label>
                    <select
                      required
                      value={swapForm.shiftId}
                      onChange={(e) => setSwapForm({ ...swapForm, shiftId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                    >
                      <option value="">-- Select shift --</option>
                      {shifts.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.startTime} – {s.endTime})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={swapForm.date}
                      onChange={(e) => setSwapForm({ ...swapForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSwapModal(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSwapping}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isSwapping ? "Submitting..." : "Submit request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Set Weekly Roster */}
        {showRosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 sm:p-6 overflow-y-auto">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[85vh] my-auto overflow-hidden text-xs">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white rounded-t-xl shrink-0">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Weekly roster</h3>
                  <p className="text-gray-500 text-[11px]">This schedule repeats every week until changed.</p>
                </div>
                <button onClick={() => setShowRosterModal(false)} className="cursor-pointer">
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleRosterSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Employee</label>
                    <select
                      required
                      value={rosterEmployeeId}
                      onChange={(e) => setRosterEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                    >
                      <option value="">-- Choose employee --</option>
                      {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1.5">
                    <span className="font-medium text-gray-800 block">Apply the same shift to all days</span>
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
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                    >
                      <option value="">-- Choose shift timing --</option>
                      {shifts.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.startTime} – {s.endTime})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="block font-medium text-gray-800">Weekly schedule (Mon – Sun)</label>
                    {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                      const isClosed = !operatingDays.includes(day);
                      return (
                        <div key={day} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="font-medium text-gray-700 min-w-[90px] capitalize">{day.toLowerCase()}</span>
                          {isClosed ? (
                            <span className="text-gray-400 italic">Outlet closed</span>
                          ) : (
                            <select
                              value={weeklySchedule[day] || ""}
                              onChange={(e) => setWeeklySchedule({ ...weeklySchedule, [day]: e.target.value })}
                              className="px-2.5 py-1 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#D3232A]"
                            >
                              <option value="">Off</option>
                              {shifts.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.startTime} – {s.endTime})</option>
                              ))}
                            </select>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRosterModal(false)}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettingRoster || !rosterEmployeeId}
                    className="px-4 py-1.5 text-xs font-semibold text-[#ffffff] bg-[#D3232A] hover:bg-[#b01e23] rounded-lg disabled:opacity-50 cursor-pointer"
                  >
                    {isSettingRoster ? "Saving..." : "Save roster"}
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
