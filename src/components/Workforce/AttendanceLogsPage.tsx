"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WorkforceHeaderNav from "./WorkforceHeaderNav";
import WorkforceSkeleton from "./WorkforceSkeleton";
import {
  useClockInMutation,
  useClockOutMutation,
  useCorrectAttendanceMutation,
  useGetAttendanceLogsQuery,
} from "@/redux/slices/attendanceApiSlice";
import {
  Clock,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CalendarCheck,
  Timer,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { useAppSelector } from "@/redux/store/hooks";
import { useBranch } from "@/lib/BranchContext";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import {
  AttendanceLog,
  attendanceTags,
  clockInWithConfirmation,
  employeeDayKey,
  formatMinutes,
  getApiErrorMessage,
  toDateTimeLocalValue,
} from "@/lib/attendance";

const DEMO_ATTENDANCE_LOGS = [
  {
    id: "att-1",
    date: new Date().toISOString().split("T")[0],
    checkInTime: "09:00 AM",
    checkOutTime: "-- : --",
    totalHours: "Working...",
    status: "PRESENT",
  },
  {
    id: "att-2",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    checkInTime: "09:05 AM",
    checkOutTime: "05:30 PM",
    totalHours: "8 hrs 25 mins",
    status: "PRESENT",
  },
  {
    id: "att-3",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    checkInTime: "09:25 AM",
    checkOutTime: "05:15 PM",
    totalHours: "7 hrs 50 mins",
    status: "LATE",
  },
];

// Clean Date Formatter for Attendance Logs
function formatAttendanceDate(rawDate: string): string {
  if (!rawDate) return "—";
  try {
    const key = rawDate.split("T")[0];
    const d = new Date(key);
    if (isNaN(d.getTime())) return rawDate;
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  } catch {
    return rawDate;
  }
}

// Clean Time Formatter for Clock In / Clock Out
function formatAttendanceTime(rawTime: string | null | undefined): string {
  if (!rawTime || rawTime === "-- : --" || rawTime === "--:--") return "-- : --";
  // If already formatted like "09:00 AM" or "05:30 PM"
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(String(rawTime).trim())) {
    return String(rawTime).trim();
  }
  try {
    const d = new Date(rawTime);
    if (isNaN(d.getTime())) return String(rawTime);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch {
    return String(rawTime);
  }
}

export default function AttendanceLogsPage() {
  const { activeBranch } = useBranch();
  const outletId = activeBranch?.id === "all" ? undefined : activeBranch?.id;
  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

  const { data: apiLogsData, isLoading } = useGetAttendanceLogsQuery(outletId ? { outletId } : undefined);
  const { data: empApiData } = useGetEmployeesQuery(outletId ? { outletId } : undefined);
  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: isClockingOut }] = useClockOutMutation();

  const employees = empApiData?.data || [];
  const currentEmployee = React.useMemo(() => {
    return employees.find(
      (e: any) => e.userId === user?.id || (user?.email && e.email === user?.email)
    );
  }, [employees, user]);

  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDateStr, setCurrentDateStr] = useState<string>("");
  const [isShiftActive, setIsShiftActive] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setCurrentDateStr(now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const logs = apiLogsData?.data || (isLoading ? [] : DEMO_ATTENDANCE_LOGS);

  const userLogs = React.useMemo(() => {
    if (!isManagerOrOwner) {
      return logs.filter((log: any) => {
        if (!currentEmployee && !user) return false;
        return (
          log.employeeId === currentEmployee?.id ||
          log.employee?.id === currentEmployee?.id ||
          log.employee?.userId === user?.id ||
          (user?.email && log.employee?.email === user?.email)
        );
      });
    }
    return logs;
  }, [logs, isManagerOrOwner, currentEmployee, user]);

  useEffect(() => {
    if (!userLogs || userLogs.length === 0) {
      setIsShiftActive(false);
      return;
    }
    const hasOpen = userLogs.some((log: any) => {
      // A missed clock-out is closed (awaiting manager correction), not an active shift
      if (log.missedClockOut) return false;
      const inTime = log.clockIn || log.checkInTime;
      const outTime = log.clockOut || log.checkOutTime;
      return inTime && (!outTime || outTime === "-- : --" || outTime === "--:--");
    });
    setIsShiftActive(hasOpen);
  }, [userLogs]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(userLogs.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedLogs = React.useMemo(() => {
    return userLogs.slice(startIndex, startIndex + pageSize);
  }, [userLogs, startIndex, pageSize]);

  // Minutes worked in one punch. Open punches and missed clock-outs count 0 (no invented end time).
  const punchMinutes = (log: AttendanceLog): number => {
    if (log.missedClockOut) return 0;
    const inStr = log.clockIn || log.checkInTime;
    const outStr = log.clockOut || log.checkOutTime;
    if (!inStr || !outStr || outStr === "-- : --" || outStr === "--:--") return 0;
    const diff = new Date(outStr).getTime() - new Date(inStr).getTime();
    return Number.isFinite(diff) && diff > 0 ? diff / 60000 : 0;
  };

  // Split shifts: total per employee per day, shown when a day has more than one punch
  const dayTotals = React.useMemo(() => {
    const totals = new Map<string, { minutes: number; punches: number }>();
    for (const log of userLogs as AttendanceLog[]) {
      const key = employeeDayKey(log);
      const entry = totals.get(key) || { minutes: 0, punches: 0 };
      entry.minutes += punchMinutes(log);
      entry.punches += 1;
      totals.set(key, entry);
    }
    return totals;
  }, [userLogs]);

  // Manager/owner correction of a punch (e.g. entering the real time of a missed clock-out).
  // Mirrors backend rules: never your own record; managers only for Staff/Kitchen.
  const [correctAttendance, { isLoading: isCorrecting }] = useCorrectAttendanceMutation();
  const [editingLog, setEditingLog] = useState<AttendanceLog | null>(null);
  const [editIn, setEditIn] = useState("");
  const [editOut, setEditOut] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const canCorrect = (log: AttendanceLog) =>
    isManagerOrOwner &&
    !!log.id &&
    log.employee?.userId !== user?.id &&
    (user?.role !== "MANAGER" || ["STAFF", "KITCHEN"].includes(log.employee?.role || ""));

  const openCorrection = (log: AttendanceLog) => {
    setEditingLog(log);
    setEditIn(toDateTimeLocalValue(log.checkInTime));
    setEditOut(toDateTimeLocalValue(log.checkOutTime));
    setEditReason("");
    setEditError(null);
  };

  const handleSaveCorrection = async () => {
    if (!editingLog?.id) return;
    if (editReason.trim().length < 3) {
      setEditError("Please give a reason for the correction.");
      return;
    }
    try {
      await correctAttendance({
        id: editingLog.id,
        checkInTime: editIn ? new Date(editIn).toISOString() : undefined,
        checkOutTime: editOut ? new Date(editOut).toISOString() : undefined,
        reason: editReason.trim(),
      }).unwrap();
      setEditingLog(null);
      setFeedbackMsg("Attendance corrected.");
    } catch (err) {
      setEditError(getApiErrorMessage(err, "Failed to correct attendance"));
    }
  };

  // Grace period is configured per outlet (Settings) and enforced by the backend; shown here for information only
  const { data: outletsData = [] } = useGetOutletsQuery();
  const gracePeriodMins = outletsData.find((o) => o.id === outletId)?.lateGraceMinutes ?? 30;

  const attendanceMetrics = React.useMemo(() => {
    const targetLogs = userLogs;
    const totalLogs = targetLogs.length;

    if (totalLogs === 0) {
      return {
        rate: "0%",
        subtext: isManagerOrOwner ? "No store records yet" : "0 Shifts Scheduled",
        daysWorkedStr: "0 Days",
        daysWorkedSubtext: isManagerOrOwner ? "0 Store shifts completed" : "No shifts logged this month",
        totalHoursStr: "0 hrs",
        avgHoursSubtext: isManagerOrOwner ? "Average across outlet" : "Average 0 hrs / shift",
      };
    }

    const presentLogs = targetLogs.filter(
      (l: any) => l.status === "PRESENT" || l.status === "LATE" || l.checkInTime || l.clockIn
    );
    // Split shifts create several punches per day: count each employee-day once
    const presentCount = new Set((presentLogs as AttendanceLog[]).map(employeeDayKey)).size;
    const lateCount = new Set(
      (targetLogs as AttendanceLog[]).filter((l) => l.isLate ?? l.status === "LATE").map(employeeDayKey)
    ).size;
    const onTimeCount = Math.max(0, presentCount - lateCount);
    const rateNum = Math.round((presentCount / Math.max(totalLogs, 1)) * 100);

    const daysWorkedStr = `${presentCount} ${presentCount === 1 ? "Day" : "Days"}`;
    const daysWorkedSubtext = isManagerOrOwner
      ? `${presentCount} shifts logged (${onTimeCount} on time${lateCount > 0 ? ` · ${lateCount} late` : ""})`
      : `${presentCount} shifts completed (${onTimeCount} on time${lateCount > 0 ? ` · ${lateCount} late` : ""})`;

    let totalHours = 0;
    targetLogs.forEach((l: any) => {
      if (l.totalHours && typeof l.totalHours === "number") {
        totalHours += l.totalHours;
      } else if (l.totalHours && typeof l.totalHours === "string") {
        const match = l.totalHours.match(/(\d+)\s*hrs?/i);
        if (match) totalHours += parseInt(match[1], 10);
        else totalHours += 8;
      } else {
        const inStr = l.clockIn || l.checkInTime;
        const outStr = l.clockOut || l.checkOutTime;
        if (inStr && outStr && outStr !== "-- : --" && outStr !== "--:--") {
          const inDate = new Date(inStr);
          const outDate = new Date(outStr);
          if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime())) {
            totalHours += Math.max(0, (outDate.getTime() - inDate.getTime()) / 3600000);
          } else {
            totalHours += 8;
          }
        } else if (!outStr || outStr === "-- : --" || outStr === "--:--") {
          totalHours += 0;
        } else {
          totalHours += 8;
        }
      }
    });

    const avgHours = (totalHours / Math.max(totalLogs, 1)).toFixed(1);

    return {
      rate: `${rateNum}%`,
      subtext: isManagerOrOwner
        ? `${presentCount} Present records out of ${totalLogs}`
        : `${presentCount} Shifts Present out of ${totalLogs}`,
      daysWorkedStr,
      daysWorkedSubtext,
      totalHoursStr: `${Math.round(totalHours)} hrs`,
      avgHoursSubtext: `Average ${avgHours} hrs / shift`,
    };
  }, [userLogs, isManagerOrOwner]);

  const handleClockIn = async () => {
    setFeedbackMsg(null);
    setErrorMsg(null);

    // Punch time and late/early rules are decided by the server; only location is sent
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // On a holiday / closed day / weekly off the backend asks "Clock in anyway?" first
            const clockedIn = await clockInWithConfirmation((confirmOffDay) =>
              clockIn({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                confirmOffDay,
              }).unwrap()
            );
            if (!clockedIn) return;
            setIsShiftActive(true);
            setFeedbackMsg("Clock In successful! Have a great shift.");
          } catch (err) {
            setErrorMsg(getApiErrorMessage(err, "Failed to clock in"));
            setIsShiftActive(false);
          }
        },
        (error) => {
          setErrorMsg("Location access is required to clock in. Please enable location permissions.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setErrorMsg("Geolocation is not supported by your browser.");
    }
  };

  const handleClockOut = async () => {
    setFeedbackMsg(null);
    setErrorMsg(null);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await clockOut({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).unwrap();
            setIsShiftActive(false);
            setFeedbackMsg("Clock Out successful! Shift record saved.");
          } catch (err: any) {
            const message = err?.data?.message || err?.message || "Failed to clock out";
            setErrorMsg(message);
            setIsShiftActive(false);
          }
        },
        (error) => {
          setErrorMsg("Location access is required to clock out. Please enable location permissions.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setErrorMsg("Geolocation is not supported by your browser.");
    }
  };

  // Render Skeleton Loader while API is fetching
  if (isLoading) {
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Attendance & Punch Logs</h1>
            <p className="text-sm text-gray-500">
              Clock in/out for your assigned shifts and review your attendance history.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm font-medium shadow-xs">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)} className="text-emerald-600 hover:text-emerald-900 cursor-pointer font-bold text-base">
              &times;
            </button>
          </div>
        )}

        {/* Error Message Banner */}
        {errorMsg && (
          <div className="flex items-center justify-between bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-sm font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900 cursor-pointer font-bold text-base">
              &times;
            </button>
          </div>
        )}

        {/* Live Clock & Punch Action Card (Only for Staff / Kitchen employees) */}
        {!isManagerOrOwner ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-gradient-to-br from-[#0B1221] to-[#1A2335] text-white rounded-2xl p-6 shadow-md border border-white/10 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Live Punch Terminal</span>
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${isShiftActive ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"}`}>
                    <span className={`h-2 w-2 rounded-full ${isShiftActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    {isShiftActive ? "CLOCKED IN" : "NOT CLOCKED IN"}
                  </span>
                </div>

                <div className="mt-6 text-center">
                  <div className="text-4xl font-extrabold tracking-tight text-white font-mono">{currentTime || "--:--:--"}</div>
                  <div className="text-xs text-zinc-400 mt-1">{currentDateStr}</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                {!isShiftActive ? (
                  <button
                    onClick={handleClockIn}
                    disabled={isClockingIn}
                    className="w-full flex items-center justify-center gap-2 bg-[#D3232A] hover:bg-[#b01e23] text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isClockingIn ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <LogIn className="h-5 w-5" />
                    )}
                    {isClockingIn ? "Clocking In..." : "Clock In / Start Shift"}
                  </button>
                ) : (
                  <button
                    onClick={handleClockOut}
                    disabled={isClockingOut}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isClockingOut ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <LogOut className="h-5 w-5" />
                    )}
                    {isClockingOut ? "Clocking Out..." : "Clock Out / End Shift"}
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">This Month's Attendance</span>
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900">{attendanceMetrics.rate}</div>
                  <div className="text-xs text-gray-500 mt-1">{attendanceMetrics.subtext}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Days Worked (This Month)</span>
                  <CalendarCheck className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900">{attendanceMetrics.daysWorkedStr}</div>
                  <div className="text-xs text-gray-500 mt-1">{attendanceMetrics.daysWorkedSubtext}</div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between sm:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Shift Guidelines</span>
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Please remember to Clock In within {gracePeriodMins} minutes of your scheduled shift start time (arrival grace window). If you need to punch out for lunch or break, notify your manager or team supervisor.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Metrics Cards for Business Owner / Manager */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Overall Attendance Rate</span>
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-gray-900">{attendanceMetrics.rate}</div>
                <div className="text-xs text-gray-500 mt-1">{attendanceMetrics.subtext}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Store Shifts Completed</span>
                <CalendarCheck className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-gray-900">{attendanceMetrics.daysWorkedStr}</div>
                <div className="text-xs text-gray-500 mt-1">{attendanceMetrics.daysWorkedSubtext}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Attendance Policy</span>
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Staff punch logs are recorded in real-time via store terminal and personal logins with a {gracePeriodMins}-minute arrival grace window.
              </p>
            </div>
          </div>
        )}

        {/* Personal Attendance Logs Table */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#D3232A]" />
              {!isManagerOrOwner ? "My Attendance History" : "Store Attendance & Punch Logs"}
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200/80">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  {isManagerOrOwner && <th className="px-6 py-3.5">Employee</th>}
                  <th className="px-6 py-3.5">Clock In</th>
                  <th className="px-6 py-3.5">Clock Out</th>
                  <th className="px-6 py-3.5">Total Duration</th>
                  <th className="px-6 py-3.5">Status</th>
                  {isManagerOrOwner && <th className="px-6 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/60">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={isManagerOrOwner ? 7 : 5} className="px-6 py-8 text-center text-xs text-gray-500">
                      No attendance logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{formatAttendanceDate(log.date)}</td>
                      {isManagerOrOwner && (
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {log.employee?.name || "Staff Member"}
                        </td>
                      )}
                      <td className="px-6 py-4 text-gray-700 font-medium">{formatAttendanceTime(log.clockIn || log.checkInTime)}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{formatAttendanceTime(log.clockOut || log.checkOutTime)}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-700">
                        {(() => {
                          if (log.totalHours) return log.totalHours;
                          if (log.missedClockOut) {
                            return <span className="text-rose-700">Not counted</span>;
                          }
                          const outStr = log.clockOut || log.checkOutTime;
                          if (!outStr || outStr === "-- : --" || outStr === "--:--") return "Working...";
                          return formatMinutes(Math.floor(punchMinutes(log)));
                        })()}
                        {(() => {
                          const day = dayTotals.get(employeeDayKey(log));
                          return day && day.punches > 1 ? (
                            <div className="mt-0.5 text-[10px] font-sans font-semibold text-gray-500">
                              Day total: {formatMinutes(Math.floor(day.minutes))}
                            </div>
                          ) : null;
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {attendanceTags(log).map((tag) => (
                            <span
                              key={tag.label}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${tag.cls}`}
                            >
                              {tag.label}
                            </span>
                          ))}
                        </div>
                        {log.editReason && (
                          <p className="mt-1 text-[10px] text-gray-500" title={log.editReason}>
                            Edited: {log.editReason}
                          </p>
                        )}
                      </td>
                      {isManagerOrOwner && (
                        <td className="px-6 py-4 text-right">
                          {canCorrect(log) && (
                            <button
                              onClick={() => openCorrection(log)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                                log.missedClockOut
                                  ? "bg-rose-600 text-white hover:bg-rose-700"
                                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {log.missedClockOut ? "Fix time" : "Edit"}
                            </button>
                          )}
                        </td>
                      )}
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
                Showing <strong>{userLogs.length > 0 ? startIndex + 1 : 0}</strong> to <strong>{Math.min(startIndex + pageSize, userLogs.length)}</strong> of <strong>{userLogs.length}</strong> attendance records
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

        {/* Manager correction popup (e.g. enter the real time of a missed clock-out) */}
        {editingLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl relative border border-gray-200">
              <button
                onClick={() => setEditingLog(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-bold text-gray-900 text-base">Correct Attendance</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">
                {editingLog.employee?.name || "Staff Member"} · {formatAttendanceDate(editingLog.date || "")}
              </p>

              {editingLog.missedClockOut && (
                <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 mb-4">
                  This person forgot to clock out. Enter the time they actually left — until then, these hours are not counted.
                </p>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Clock in</label>
                  <input
                    type="datetime-local"
                    value={editIn}
                    onChange={(e) => setEditIn(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs bg-white focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Clock out</label>
                  <input
                    type="datetime-local"
                    value={editOut}
                    onChange={(e) => setEditOut(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs bg-white focus:border-[#D3232A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    maxLength={300}
                    placeholder="e.g. Forgot to punch out, left at 6 PM (confirmed with shift lead)"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-xs bg-white focus:border-[#D3232A] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-gray-500">Saved with your name so every change is traceable.</p>
                </div>
              </div>

              {editError && <p className="mt-3 text-xs font-medium text-rose-700">{editError}</p>}

              <div className="flex items-center justify-end gap-2 mt-5">
                <button
                  onClick={() => setEditingLog(null)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCorrection}
                  disabled={isCorrecting}
                  className="rounded-lg bg-[#D3232A] px-4 py-2 text-xs font-bold text-white hover:bg-[#b01e23] disabled:opacity-50 cursor-pointer"
                >
                  {isCorrecting ? "Saving…" : "Save Correction"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
