"use client";

import React, { useState } from "react";
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
} from "lucide-react";

const DEMO_SHIFTS = [
  {
    id: "shift-1",
    name: "Morning Rush",
    startTime: "08:00",
    endTime: "16:00",
    assignments: [
      { id: "a1", date: "2026-07-21", employee: { id: "demo-1", name: "Rohan Sharma" } },
      { id: "a2", date: "2026-07-21", employee: { id: "demo-2", name: "Priya Patel" } },
    ],
    swapRequests: [],
  },
  {
    id: "shift-2",
    name: "Evening Shift",
    startTime: "16:00",
    endTime: "00:00",
    assignments: [
      { id: "a3", date: "2026-07-21", employee: { id: "demo-3", name: "Amit Kumar" } },
    ],
    swapRequests: [
      {
        id: "s1",
        fromEmployeeId: "demo-3",
        toEmployeeId: "demo-2",
        shiftId: "shift-2",
        date: "2026-07-21",
        status: "REQUESTED",
      },
    ],
  },
];

export default function ShiftSchedulerPage() {
  const { data: shiftApiData, isLoading: isShiftsLoading } = useGetShiftsQuery(undefined);
  const { data: empApiData } = useGetEmployeesQuery(undefined);

  const [createShift, { isLoading: isCreatingShift }] = useCreateShiftMutation();
  const [assignShift, { isLoading: isAssigning }] = useAssignShiftMutation();
  const [requestSwap, { isLoading: isSwapping }] = useRequestSwapMutation();
  const [updateSwapStatus, { isLoading: isUpdatingSwap }] = useUpdateSwapStatusMutation();

  const shifts = shiftApiData?.data || (isShiftsLoading ? [] : DEMO_SHIFTS);
  const employees = empApiData?.data || [
    { id: "demo-1", name: "Rohan Sharma" },
    { id: "demo-2", name: "Priya Patel" },
    { id: "demo-3", name: "Amit Kumar" },
  ];

  // RTK Query Hooks for Roster & Holidays
  const { data: holidaysData } = useGetHolidaysQuery(undefined);
  const [createHoliday, { isLoading: isCreatingHoliday }] = useCreateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();
  const [updateOperatingDays] = useUpdateOperatingDaysMutation();
  const { data: outletRostersData } = useGetOutletRostersQuery(undefined);
  const [setWeeklyRoster, { isLoading: isSettingRoster }] = useSetWeeklyRosterMutation();

  // Modals
  const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showRosterModal, setShowRosterModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
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
    date: new Date().toISOString().split("T")[0],
  });

  const [swapForm, setSwapForm] = useState({
    fromEmployeeId: "",
    toEmployeeId: "",
    shiftId: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Roster Builder Form State
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

  // Holiday Form State
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    applyToAllOutlets: false,
  });

  const [operatingDays, setOperatingDays] = useState<string[]>([
    "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"
    // SUNDAY defaults as closed if unselected
  ]);

  // When roster modal opens or operatingDays changes, auto-set closed days as OFF
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

  // Helper to Apply 1 Shift to All Open Days
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

  const holidaysList = holidaysData?.data || [];

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

  const handleCreateHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name || !holidayForm.date) return;
    try {
      await createHoliday(holidayForm).unwrap();
      setFeedbackMsg(
        holidayForm.applyToAllOutlets
          ? `Holiday '${holidayForm.name}' added for ALL outlets!`
          : `Holiday '${holidayForm.name}' added for this branch!`
      );
      setHolidayForm({ name: "", date: new Date().toISOString().split("T")[0], applyToAllOutlets: false });
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to add holiday");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday(id).unwrap();
      setFeedbackMsg("Holiday removed.");
    } catch (err: any) {
      setFeedbackMsg("Failed to remove holiday.");
    }
  };

  const handleToggleOperatingDay = async (day: string) => {
    const nextDays = operatingDays.includes(day)
      ? operatingDays.filter((d) => d !== day)
      : [...operatingDays, day];
    setOperatingDays(nextDays);
    try {
      await updateOperatingDays({ operatingDays: nextDays }).unwrap();
      setFeedbackMsg("Operating days updated.");
    } catch (err: any) {
      setFeedbackMsg("Failed to update operating days.");
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
      setFeedbackMsg(`Successfully assigned ${count} staff member${count === 1 ? '' : 's'}!`);
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
        {/* Header Title & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shift Scheduler & Roster</h1>
            <p className="text-sm text-gray-500">
              Set weekly rosters (with off-days & variable shifts), festival holidays, and shift swaps.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/settings"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 px-3.5 py-2 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-sm cursor-pointer"
            >
              <Palmtree className="h-4 w-4 text-amber-600" />
              Outlet Holidays (Settings)
            </a>
            <button
              onClick={() => openRosterModalForEmployee()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 px-3.5 py-2 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer"
            >
              <CalendarDays className="h-4 w-4 text-indigo-600" />
              🔄 Set Recurring Roster
            </button>
            <button
              onClick={() => setShowCreateShiftModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Shift Slot
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Feedback Message Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)}>
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Shift Roster Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isShiftsLoading ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              Loading shifts roster...
            </div>
          ) : shifts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
              No shifts created yet. Click "New Shift Slot" to configure employee shifts.
            </div>
          ) : (
            shifts.map((shift: any) => (
              <div
                key={shift.id}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    {shift.outlet?.name && (
                      <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D3232A] bg-red-50 px-2 py-0.5 rounded-md border border-red-100 mb-1.5">
                        <span>📍 {shift.outlet.name}</span>
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 text-lg">{shift.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {shift.startTime} - {shift.endTime}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-[#D3232A]">
                    {shift.assignments?.length || 0} Assigned
                  </span>
                </div>

                {/* Assigned Staff List */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Assigned Employees
                  </p>
                  {!shift.assignments || shift.assignments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No employees assigned to this slot.</p>
                  ) : (
                    <div className="space-y-2">
                      {shift.assignments.map((asgn: any) => (
                        <div
                          key={asgn.id || asgn.employee?.id}
                          className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-[#D3232A]/10 text-[#D3232A] flex items-center justify-center font-bold text-xs">
                              {asgn.employee?.name?.[0] || "E"}
                            </div>
                            <span className="font-medium text-gray-800">
                              {asgn.employee?.name || "Staff Member"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">Today</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Assign Button */}
                <button
                  onClick={() => {
                    setAssignForm({
                      shiftId: shift.id,
                      employeeIds: [],
                      date: new Date().toISOString().split("T")[0],
                    });
                    setShowAssignModal(true);
                  }}
                  className="w-full py-2 text-xs font-semibold text-center text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100 cursor-pointer"
                >
                  + Assign Staff for Date
                </button>
              </div>
            ))
          )}
        </div>

        {/* Swap Requests Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Pending Shift Swap Requests</h2>
              <p className="text-xs text-gray-500">
                Staff members requesting to exchange assigned shifts.
              </p>
            </div>
            <ArrowRightLeft className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {shifts.flatMap((s: any) => s.swapRequests || []).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No active shift swap requests right now.
              </p>
            ) : (
              shifts
                .flatMap((s: any) => s.swapRequests || [])
                .map((swap: any) => (
                  <div
                    key={swap.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span>Swap Request #{swap.id.slice(0, 6)}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                        Requested on date: {new Date(swap.date).toLocaleDateString()}
                      </p>
                    </div>

                    {swap.status === "REQUESTED" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSwapAction(swap.id, "APPROVED")}
                          disabled={isUpdatingSwap}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleSwapAction(swap.id, "REJECTED")}
                          disabled={isUpdatingSwap}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
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

        {/* Modal 1: Create Shift */}
        {showCreateShiftModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Create Shift Timing</h3>
                <button onClick={() => setShowCreateShiftModal(false)}>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowCreateShiftModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingShift}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg shadow-sm disabled:opacity-50"
                  >
                    {isCreatingShift ? "Saving..." : "Create Shift Slot"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Assign Shift (Supports Bulk / Select All) */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Assign Staff for Specific Date</h3>
                  <p className="text-xs text-gray-500">Assign single or multiple employees to a shift for a selected date.</p>
                </div>
                <button onClick={() => setShowAssignModal(false)}>
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="">-- Select Shift Slot --</option>
                    {shifts.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime} - {s.endTime})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bulk Employee Selector */}
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

                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1.5 bg-gray-50">
                    {employees.length === 0 ? (
                      <p className="text-xs text-gray-400 p-2 text-center">No employees found.</p>
                    ) : (
                      employees.map((e: any) => {
                        const isChecked = assignForm.employeeIds.includes(e.id);
                        
                        // Check if employee already has an assigned shift on selected date
                        let existingAssignment: any = null;
                        (shifts || []).forEach((s: any) => {
                          (s.assignments || []).forEach((a: any) => {
                            const aDate = new Date(a.date).toISOString().split("T")[0];
                            if (a.employeeId === e.id && aDate === assignForm.date) {
                              existingAssignment = {
                                shiftName: s.name,
                                startTime: s.startTime,
                                endTime: s.endTime,
                              };
                            }
                          });
                        });

                        return (
                          <label
                            key={e.id}
                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
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
                              <div>
                                <span className="text-xs font-medium">{e.name}</span>
                                {existingAssignment && (
                                  <div className="text-[10px] text-amber-700 font-medium">
                                    ⚠️ Already assigned: {existingAssignment.shiftName} ({existingAssignment.startTime} - {existingAssignment.endTime})
                                  </div>
                                )}
                              </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAssigning || assignForm.employeeIds.length === 0 || !assignForm.shiftId}
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
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
            <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Request Shift Swap</h3>
                <button onClick={() => setShowSwapModal(false)}>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowSwapModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSwapping}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSwapping ? "Submitting..." : "Submit Swap Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 4: Set Weekly Roster (Recurring Schedule) */}
        {showRosterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Fill Action Bar */}
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">⚡ Quick Action: Fill All Open Days</span>
                    <span className="text-[11px] text-indigo-600">Saves time!</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={applyToAllShiftId}
                      onChange={(e) => setApplyToAllShiftId(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-indigo-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      Apply to Open Days
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-800">
                      Weekly Schedule (Mon – Sun)
                    </label>
                    <span className="text-[11px] text-gray-500">Recurring for all months & years</span>
                  </div>
                  {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                    const isCafeClosedDay = !operatingDays.includes(day);
                    return (
                      <div
                        key={day}
                        className={`flex items-center justify-between gap-4 p-2.5 rounded-lg border ${
                          isCafeClosedDay
                            ? "bg-rose-50/70 border-rose-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="w-28 flex flex-col">
                          <span className="text-xs font-semibold text-gray-800">{day}</span>
                          {isCafeClosedDay && (
                            <span className="text-[10px] font-bold text-rose-600">CAFE CLOSED</span>
                          )}
                        </div>
                        <select
                          value={isCafeClosedDay ? "OFF" : weeklySchedule[day]}
                          disabled={isCafeClosedDay}
                          onChange={(e) => setWeeklySchedule({ ...weeklySchedule, [day]: e.target.value })}
                          className={`flex-1 px-3 py-1.5 border rounded-md text-xs focus:outline-none ${
                            isCafeClosedDay
                              ? "bg-rose-100/50 border-rose-300 text-rose-800 font-semibold cursor-not-allowed"
                              : "bg-white border-gray-300 focus:ring-2 focus:ring-[#D3232A]"
                          }`}
                        >
                          <option value="OFF">
                            {isCafeClosedDay ? "⛔ CLOSED (Cafe Holiday / Closed Day)" : "⛔ WEEKLY OFF (No Punch-In)"}
                          </option>
                          {shifts.map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.startTime} - {s.endTime})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowRosterModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSettingRoster}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#D3232A] hover:bg-[#b01e23] rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSettingRoster ? "Saving Roster..." : "Save Weekly Roster"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 5: Outlet Holidays & Operating Days */}
        {showHolidayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-xl bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Outlet Holidays & Operating Days</h3>
                  <p className="text-xs text-gray-500">Define festival closures & weekly open days for this branch or all outlets.</p>
                </div>
                <button onClick={() => setShowHolidayModal(false)} className="cursor-pointer">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* 1. Cafe Weekly Operating Days */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Cafe Weekly Open Days</h4>
                  <p className="text-xs text-gray-500 mb-3">Uncheck days when the cafe is completely closed (e.g. Closed on Sundays or Mondays).</p>
                  <div className="flex flex-wrap gap-2">
                    {["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].map((day) => {
                      const isOpen = operatingDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleOperatingDay(day)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                            isOpen
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100"
                          }`}
                        >
                          {day} {isOpen ? "✓ OPEN" : "⛔ CLOSED"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* 2. Add Festival / National Holiday */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Add Festival / Custom Holiday</h4>
                  <p className="text-xs text-gray-500 mb-2">Declare specific holiday dates like Diwali or Christmas.</p>
                  <form onSubmit={handleCreateHolidaySubmit} className="space-y-3">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Holiday Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Diwali / Independence Day"
                          value={holidayForm.name}
                          onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        />
                      </div>
                      <div className="w-36">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          required
                          value={holidayForm.date}
                          onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isCreatingHoliday}
                        className="px-3.5 py-2 bg-[#D3232A] hover:bg-[#b01e23] text-white text-xs font-semibold rounded-lg shadow-sm disabled:opacity-50 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>

                    {/* Multi-Outlet Checkbox */}
                    <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                      <input
                        type="checkbox"
                        id="applyToAllOutlets"
                        checked={holidayForm.applyToAllOutlets}
                        onChange={(e) => setHolidayForm({ ...holidayForm, applyToAllOutlets: e.target.checked })}
                        className="h-4 w-4 text-[#D3232A] rounded border-gray-300 focus:ring-[#D3232A] cursor-pointer"
                      />
                      <label htmlFor="applyToAllOutlets" className="text-xs font-medium text-gray-700 cursor-pointer">
                        Apply this holiday to <strong className="text-gray-900">ALL outlets in my business</strong> (e.g. Delhi, Mumbai, etc.)
                      </label>
                    </div>
                  </form>
                </div>

                {/* 3. Holidays List */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">Declared Holidays</h4>
                  {holidaysList.length === 0 ? (
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 text-center">
                      No custom holidays declared yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {holidaysList.map((h: any) => (
                        <div key={h.id} className="flex items-center justify-between p-2.5 bg-amber-50/50 border border-amber-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Palmtree className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-semibold text-gray-900">{h.name}</span>
                            <span className="text-xs text-gray-500">({new Date(h.date).toLocaleDateString()})</span>
                          </div>
                          <button
                            onClick={() => handleDeleteHoliday(h.id)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowHolidayModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
