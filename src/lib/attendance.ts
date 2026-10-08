// Shared helpers for attendance screens (staff Attendance Logs page and the shared kiosk terminal).

type ApiError = { data?: { message?: string; error?: { code?: string; message?: string } }; message?: string };

// Backend asks for confirmation (HTTP 409) when clocking in on a holiday, closed day or weekly off
export const CLOCK_IN_CONFIRMATION_REQUIRED = "CLOCK_IN_CONFIRMATION_REQUIRED";

export function getApiErrorCode(err: unknown): string | undefined {
  return (err as ApiError)?.data?.error?.code;
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiError;
  return e?.data?.error?.message || e?.data?.message || e?.message || fallback;
}

/**
 * Runs a clock-in request; if the backend asks "Clock in anyway?" (holiday / closed day / weekly off),
 * shows that question and retries with confirmOffDay when the user agrees.
 * Returns false if the user declined.
 */
export async function clockInWithConfirmation(
  send: (confirmOffDay: boolean) => Promise<unknown>
): Promise<boolean> {
  try {
    await send(false);
    return true;
  } catch (err) {
    if (getApiErrorCode(err) !== CLOCK_IN_CONFIRMATION_REQUIRED) throw err;
    if (!window.confirm(getApiErrorMessage(err, "Clock in anyway?"))) return false;
    await send(true);
    return true;
  }
}

export interface AttendanceLogFlags {
  isLate?: boolean;
  leftEarly?: boolean;
  workedOnHoliday?: boolean;
  workedOnClosedDay?: boolean;
  extraShift?: boolean;
  missedClockOut?: boolean;
  editedAt?: string | null;
  status?: string;
  // Synthetic row for a day covered by approved leave (no punch), so it isn't mistaken for a no-show
  onLeave?: boolean;
}

export interface AttendanceLog extends AttendanceLogFlags {
  id?: string;
  employeeId?: string;
  date?: string;
  checkInTime?: string;
  checkOutTime?: string | null;
  clockIn?: string;
  clockOut?: string;
  totalHours?: string | number;
  editReason?: string | null;
  employee?: { id?: string; userId?: string | null; name?: string; role?: string; email?: string };
}

/** Key grouping punches by employee and calendar day (split shifts produce several punches per day). */
export function employeeDayKey(log: AttendanceLog): string {
  return `${log.employeeId || log.employee?.id || "me"}|${String(log.date || "").split("T")[0]}`;
}

/** Labels shown on an attendance row. Late and left-early are separate so neither hides the other. */
export function attendanceTags(log: AttendanceLogFlags): { label: string; cls: string }[] {
  const tags: { label: string; cls: string }[] = [];
  if (log.onLeave) return [{ label: "On leave (approved)", cls: "bg-sky-100 text-sky-800" }];
  const isLate = log.isLate ?? log.status === "LATE";
  const leftEarly = log.leftEarly ?? log.status === "EARLY_DEPARTURE";
  if (log.missedClockOut) tags.push({ label: "Missed clock-out", cls: "bg-rose-100 text-rose-800" });
  if (isLate) tags.push({ label: "Late", cls: "bg-amber-100 text-amber-800" });
  if (leftEarly) tags.push({ label: "Left early", cls: "bg-orange-100 text-orange-800" });
  if (log.workedOnHoliday) tags.push({ label: "Worked on holiday", cls: "bg-purple-100 text-purple-800" });
  if (log.workedOnClosedDay) tags.push({ label: "Closed day", cls: "bg-purple-100 text-purple-800" });
  if (log.extraShift) tags.push({ label: "Extra shift", cls: "bg-indigo-100 text-indigo-800" });
  if (log.editedAt) tags.push({ label: "Edited", cls: "bg-gray-100 text-gray-700" });
  if (tags.length === 0) tags.push({ label: "Present", cls: "bg-emerald-100 text-emerald-800" });
  return tags;
}

export function formatMinutes(totalMins: number): string {
  const h = Math.floor(totalMins / 60);
  const m = Math.round(totalMins % 60);
  if (h === 0) return `${m} mins`;
  return `${h} hrs ${m} mins`;
}

interface ApprovedLeave {
  id: string;
  status?: string;
  employeeId?: string;
  startDate: string;
  endDate: string;
  employee?: AttendanceLog["employee"];
}

/**
 * One "On leave" row per approved-leave day up to today that has no punch for that employee,
 * so approved leave can be told apart from a no-show in the attendance log.
 */
export function approvedLeaveRows(leaves: ApprovedLeave[], punches: AttendanceLog[], todayStr: string): AttendanceLog[] {
  const punchedDays = new Set(punches.map(employeeDayKey));
  const rows: AttendanceLog[] = [];
  for (const leave of leaves) {
    if (leave.status !== "APPROVED") continue;
    const start = new Date(`${leave.startDate.split("T")[0]}T00:00:00.000Z`);
    const end = new Date(`${leave.endDate.split("T")[0]}T00:00:00.000Z`);
    for (let d = start; d <= end; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const dateStr = d.toISOString().split("T")[0];
      if (dateStr > todayStr) break;
      const row: AttendanceLog = {
        id: `leave-${leave.id}-${dateStr}`,
        onLeave: true,
        date: dateStr,
        employeeId: leave.employeeId || leave.employee?.id,
        employee: leave.employee,
      };
      if (!punchedDays.has(employeeDayKey(row))) rows.push(row);
    }
  }
  return rows;
}

/** Value for <input type="datetime-local"> in the browser's local time. */
export function toDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
