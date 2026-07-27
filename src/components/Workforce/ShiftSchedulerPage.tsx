"use client";

import React, { useState, useMemo } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WorkforceHeaderNav from "./WorkforceHeaderNav";
import {
  useGetShiftsQuery,
  useCreateShiftMutation,
  useAssignShiftMutation,
  useRequestSwapMutation,
  useUpdateSwapStatusMutation,
} from "@/redux/slices/shiftApiSlice";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
  useDeleteHolidayMutation,
  useUpdateOperatingDaysMutation,
} from "@/redux/slices/holidayApiSlice";
import {
  useGetOutletRostersQuery,
  useSetWeeklyRosterMutation,
} from "@/redux/slices/rosterApiSlice";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  XCircle,
  X,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
  Palmtree,
  CalendarDays,
  Trash2,
  Grid,
  List,
  Users,
  Sparkles,
  Kanban,
  User,
  Filter,
  Check,
  Search,
  Building2,
} from "lucide-react";

const DEMO_SHIFTS = [
  {
    id: "shift-1",
    name: "Morning Rush",
    startTime: "08:00",
    endTime: "16:00",
    outlet: { id: "o1", name: "Spice & Dine - MG Road" },
    assignments: [
      { id: "a1", date: "2026-07-24T00:00:00.000Z", employee: { id: "demo-1", name: "Priya Verma", role: "STAFF" } },
      { id: "a2", date: "2026-07-24T00:00:00.000Z", employee: { id: "demo-2", name: "Rahul Verma", role: "KITCHEN" } },
      { id: "a3", date: "2026-07-24T00:00:00.000Z", employee: { id: "demo-3", name: "Chef (Spice & Dine)", role: "CHEF" } },
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
      { id: "a4", date: "2026-07-21T00:00:00.000Z", employee: { id: "demo-4", name: "Head Waiter (Mumbai)", role: "HEAD WAITER" } },
      { id: "a5", date: "2026-07-22T00:00:00.000Z", employee: { id: "demo-4", name: "Head Waiter (Mumbai)", role: "HEAD WAITER" } },
      { id: "a6", date: "2026-07-24T00:00:00.000Z", employee: { id: "demo-5", name: "Order Captain (Mumbai)", role: "CAPTAIN" } },
    ],
    swapRequests: [
      {
        id: "s1",
        fromEmployeeId: "demo-4",
        toEmployeeId: "demo-5",
        shiftId: "shift-2",
        date: "2026-07-24",
        status: "REQUESTED",
      },
    ],
  },
];

// Date Key Helper (YYYY-MM-DD)
function parseDateKey(dateInput: any): string {
  if (!dateInput) return "";
  if (typeof dateInput === "string") return dateInput.split("T")[0];
  try {
    return new Date(dateInput).toISOString().split("T")[0];
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
  const { data: shiftApiData, isLoading: isShiftsLoading } = useGetShiftsQuery(undefined);
  const { data: empApiData } = useGetEmployeesQuery(undefined);

  const [createShift, { isLoading: isCreatingShift }] = useCreateShiftMutation();
  const [assignShift, { isLoading: isAssigning }] = useAssignShiftMutation();
  const [requestSwap, { isLoading: isSwapping }] = useRequestSwapMutation();
  const [updateSwapStatus, { isLoading: isUpdatingSwap }] = useUpdateSwapStatusMutation();

  const shifts = shiftApiData?.data || (isShiftsLoading ? [] : DEMO_SHIFTS);
  const employees = empApiData?.data || [
    { id: "demo-1", name: "Priya Verma", role: "STAFF" },
    { id: "demo-2", name: "Rahul Verma", role: "KITCHEN" },
    { id: "demo-3", name: "Chef (Spice & Dine)", role: "CHEF" },
    { id: "demo-4", name: "Head Waiter (Mumbai)", role: "HEAD WAITER" },
    { id: "demo-5", name: "Order Captain (Mumbai)", role: "CAPTAIN" },
  ];

  // RTK Query Hooks for Roster & Holidays
  const { data: holidaysData } = useGetHolidaysQuery(undefined);
  const [createHoliday] = useCreateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();
  const [updateOperatingDays] = useUpdateOperatingDaysMutation();
  const [setWeeklyRoster, { isLoading: isSettingRoster }] = useSetWeeklyRosterMutation();

  // Selected Date State for Daily Roster (Defaults to 2026-07-24 or today)
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-24");
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "templates">("daily");
  const [selectedOutlet, setSelectedOutlet] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAssignmentDetail, setSelectedAssignmentDetail] = useState<any>(null);

  // Modals
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Forms
  const [shiftForm, setShiftForm] = useState({
    name: "",
    startTime: "09:00",
    endTime: "17:00",
  });

  const [assignForm, setAssignForm] = useState<{
    shiftId: string;
    employeeIds: string[];
    date: string;
  }>({
    shiftId: "",
    employeeIds: [],
    date: selectedDate,
  });

  const [swapForm, setSwapForm] = useState({
    fromEmployeeId: "",
    toEmployeeId: "",
    shiftId: "",
    date: selectedDate,
  });

  // Pagination for Templates View
  const [templatePage, setTemplatePage] = useState(1);
  const [templatePageSize, setTemplatePageSize] = useState(9);

  // Roster Form State
  const [rosterEmployeeId, setRosterEmployeeId] = useState("");
  const [applyToAllShiftId, setApplyToAllShiftId] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState<Record<string, string>>({
    MONDAY: "",
    TUESDAY: "",
    WEDNESDAY: "",
    THURSDAY: "",
    FRIDAY: "",
    SATURDAY: "",
    SUNDAY: "OFF",
  });

  const [operatingDays, setOperatingDays] = useState<string[]>([
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
  ]);

  const holidaysList = holidaysData?.data || [];

  // Outlets List extracted from shifts data
  const outletOptions = useMemo(() => {
    const set = new Set<string>();
    shifts.forEach((s: any) => {
      if (s.outlet?.name) set.add(s.outlet.name);
    });
    return Array.from(set);
  }, [shifts]);

  // Date Strip Generator around selectedDate
  const dateStrip = useMemo(() => {
    const curr = new Date(selectedDate);
    const result = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date(curr);
      d.setDate(curr.getDate() + i);
      const dateKey = parseDateKey(d);
      result.push({
        dateStr: dateKey,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString("en-US", { weekday: "short" }),
        monthName: d.toLocaleDateString("en-US", { month: "short" }),
        isToday: dateKey === parseDateKey(new Date()),
        isSelected: dateKey === selectedDate,
      });
    }
    return result;
  }, [selectedDate]);

  // Filter Shifts by Selected Outlet
  const filteredShifts = useMemo(() => {
    return shifts.filter((s: any) => {
      const matchOutlet = selectedOutlet === "ALL" || s.outlet?.name === selectedOutlet;
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.outlet?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchOutlet && matchSearch;
    });
  }, [shifts, selectedOutlet, searchQuery]);

  // Daily Shifts Data for `selectedDate`
  const dailyShiftData = useMemo(() => {
    return filteredShifts.map((shift: any) => {
      const dateAssignments = (shift.assignments || []).filter(
        (a: any) => parseDateKey(a.date) === selectedDate
      );
      return {
        ...shift,
        dateAssignments,
      };
    });
  }, [filteredShifts, selectedDate]);

  // Summary Metrics for selectedDate
  const totalStaffScheduledOnDate = useMemo(() => {
    let count = 0;
    dailyShiftData.forEach((s: any) => {
      count += s.dateAssignments.length;
    });
    return count;
  }, [dailyShiftData]);

  const activeShiftsOnDate = useMemo(() => {
    return dailyShiftData.filter((s: any) => s.dateAssignments.length > 0).length;
  }, [dailyShiftData]);

  const allSwapRequests = useMemo(() => {
    return shifts.flatMap((s: any) => s.swapRequests || []);
  }, [shifts]);

  const openRosterModalForEmployee = (empId?: string) => {
    if (empId) setRosterEmployeeId(empId);
    const initialSchedule: Record<string, string> = {};
    const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    ALL_DAYS.forEach((day) => {
      if (!operatingDays.includes(day)) {
        initialSchedule[day] = "OFF";
      } else {
        initialSchedule[day] = weeklySchedule[day] || "";
      }
    });
    setWeeklySchedule(initialSchedule);
    setShowRosterModal(true);
  };

  const handleApplyShiftToAllOpenDays = () => {
    if (!applyToAllShiftId) return;
    const nextSchedule = { ...weeklySchedule };
    const ALL_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
    ALL_DAYS.forEach((day) => {
      if (operatingDays.includes(day)) {
        nextSchedule[day] = applyToAllShiftId;
      } else {
        nextSchedule[day] = "OFF";
      }
    });
    setWeeklySchedule(nextSchedule);
    setFeedbackMsg("Shift applied to all open days!");
  };

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
      setFeedbackMsg("New shift timing created successfully!");
      setShowCreateShiftModal(false);
      setShiftForm({ name: "", startTime: "09:00", endTime: "17:00" });
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to create shift");
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.shiftId || assignForm.employeeIds.length === 0) return;
    try {
      await assignShift({
        shiftId: assignForm.shiftId,
        employeeIds: assignForm.employeeIds,
        date: assignForm.date,
      }).unwrap();
      const count = assignForm.employeeIds.length;
      setFeedbackMsg(`Successfully assigned ${count} staff member${count === 1 ? '' : 's'} for ${formatDateNice(assignForm.date)}!`);
      setShowAssignModal(false);
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to assign shift (Check for overlap)");
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Title & Main CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Shift Scheduler & Roster</span>
            </h1>
            <p className="text-sm text-gray-500">
              Manage daily shift rosters, employee assignments, and shift swap requests.
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
              onClick={() => openRosterModalForEmployee()}
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

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-sm shadow-xs">
            <span className="font-medium">{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="cursor-pointer">
              <X className="h-4 w-4 text-emerald-700" />
            </button>
          </div>
        )}

        {/* Top Control Strip: Outlet Filter & View Switcher */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* View Mode Tabs */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/80">
              <button
                onClick={() => setActiveTab("daily")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "daily"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <CalendarIcon className="h-4 w-4 text-[#D3232A]" />
                Daily Shift Board
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "templates"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="h-4 w-4 text-[#D3232A]" />
                Shift Templates ({shifts.length})
              </button>
            </div>

            {/* Outlet Filter & Search */}
            <div className="flex flex-wrap items-center gap-3">
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

              <div className="relative">
                <Search className="h-3.5 w-3.5 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search shifts or outlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200/80 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#D3232A] w-48"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: DAILY SHIFT BOARD (PRIMARY OPERATIONAL VIEW) ================= */}
        {activeTab === "daily" && (
          <div className="space-y-6">
            {/* Interactive Date Carousel Strip */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDate(parseDateKey(prev));
                  }}
                  className="p-2 rounded-xl border border-gray-200/80 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* 7 Days Strip */}
                <div className="flex-1 grid grid-cols-7 gap-2">
                  {dateStrip.map((item) => (
                    <button
                      key={item.dateStr}
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        item.isSelected
                          ? "bg-[#D3232A] text-white border-[#D3232A] shadow-xs font-bold"
                          : item.isToday
                          ? "bg-red-50 text-[#D3232A] border-red-200 font-semibold"
                          : "bg-gray-50/80 text-gray-700 border-gray-200/60 hover:bg-gray-100"
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider opacity-80">{item.dayName}</div>
                      <div className="text-base font-bold my-0.5">{item.dayNum}</div>
                      <div className="text-[10px] opacity-80">{item.monthName}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 1);
                    setSelectedDate(parseDateKey(next));
                  }}
                  className="p-2 rounded-xl border border-gray-200/80 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Daily Roster Metrics Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Scheduled Date</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatDateNice(selectedDate)}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-red-50 text-[#D3232A] flex items-center justify-center font-bold">
                  <CalendarIcon className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Staff Working Today</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">{totalStaffScheduledOnDate} Members</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Shifts</p>
                  <p className="text-lg font-bold text-indigo-600 mt-1">{activeShiftsOnDate} Shift Slots</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Active Shifts Cards Grid for Selected Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isShiftsLoading ? (
                <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                  Loading shift roster...
                </div>
              ) : dailyShiftData.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-gray-200/80">
                  No shifts scheduled for {formatDateNice(selectedDate)}.
                </div>
              ) : (
                dailyShiftData.map((shift: any) => {
                  const assignedStaff = shift.dateAssignments || [];

                  return (
                    <div
                      key={shift.id}
                      className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between border-b border-gray-100 pb-3.5">
                          <div>
                            {shift.outlet?.name && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#D3232A] bg-red-50 px-2.5 py-0.5 rounded-md border border-red-100 mb-1.5">
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
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              assignedStaff.length > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {assignedStaff.length} Scheduled
                          </span>
                        </div>

                        {/* Assigned Staff List for selectedDate */}
                        <div className="mt-4">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                            Assigned Staff ({formatDateNice(selectedDate)})
                          </p>

                          {assignedStaff.length === 0 ? (
                            <div className="p-3 bg-gray-50/80 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-400 italic">
                              No staff assigned to this shift on {formatDateNice(selectedDate)}.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {assignedStaff.map((asgn: any, aIdx: number) => (
                                <div
                                  key={aIdx}
                                  className="flex items-center justify-between p-2.5 bg-gray-50/80 rounded-xl text-xs border border-gray-200/60"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-full bg-[#D3232A]/10 text-[#D3232A] flex items-center justify-center font-bold text-xs">
                                      {asgn.employee?.name?.[0] || "E"}
                                    </div>
                                    <div>
                                      <span className="font-semibold text-gray-900 block">{asgn.employee?.name || "Staff Member"}</span>
                                      <span className="text-[10px] text-gray-400">{asgn.employee?.role || "Staff"}</span>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setSwapForm({
                                        fromEmployeeId: asgn.employee?.id || "",
                                        toEmployeeId: "",
                                        shiftId: shift.id,
                                        date: selectedDate,
                                      });
                                      setShowSwapModal(true);
                                    }}
                                    className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200/80 transition-colors cursor-pointer"
                                  >
                                    Swap
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Assign Action */}
                      <button
                        onClick={() => {
                          setAssignForm({
                            shiftId: shift.id,
                            employeeIds: [],
                            date: selectedDate,
                          });
                          setShowAssignModal(true);
                        }}
                        className="w-full mt-4 py-2.5 text-xs font-bold text-center text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl transition-colors border border-red-200/80 cursor-pointer"
                      >
                        + Assign Staff for {formatDateNice(selectedDate)}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SHIFT TEMPLATES MASTER DIRECTORY ================= */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShifts.map((shift: any) => (
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
                      {shift.assignments?.length || 0} Total Assigned
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setAssignForm({
                        shiftId: shift.id,
                        employeeIds: [],
                        date: selectedDate,
                      });
                      setShowAssignModal(true);
                    }}
                    className="w-full py-2.5 text-xs font-bold text-center text-red-700 bg-red-50 hover:bg-red-100/80 rounded-xl transition-colors border border-red-200/80 cursor-pointer"
                  >
                    + Assign Staff
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
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Create Shift Timing</h3>
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
                    <input
                      type="text"
                      required
                      placeholder="08:00"
                      value={shiftForm.startTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time (HH:MM)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="16:00"
                      value={shiftForm.endTime}
                      onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Assign Staff for Date</h3>
                  <p className="text-xs text-gray-500">Assign employees to a shift for {formatDateNice(assignForm.date)}.</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Shift Slot
                  </label>
                  <select
                    required
                    value={assignForm.shiftId}
                    onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="">-- Select Shift Slot --</option>
                    {shifts.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

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
                        return (
                          <label
                            key={e.id}
                            className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                              isChecked
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
                              <span className="text-xs font-medium">{e.name}</span>
                            </div>
                            <span className="text-[11px] text-gray-400 uppercase tracking-wider">{e.role}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={assignForm.date}
                    onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning || assignForm.employeeIds.length === 0 || !assignForm.shiftId}
                    className="px-4 py-2 text-sm font-bold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-xl shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isAssigning
                      ? "Assigning..."
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
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
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
                      onChange={(e) => setApplyToAllShiftId(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Common Shift Timing --</option>
                      {shifts.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.startTime} - {s.endTime})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyShiftToAllOpenDays}
                      disabled={!applyToAllShiftId}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      Apply
                    </button>
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
