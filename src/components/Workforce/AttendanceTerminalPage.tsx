"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import WorkforceHeaderNav from "./WorkforceHeaderNav";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetAttendanceLogsQuery,
} from "@/redux/slices/attendanceApiSlice";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import {
  LogIn,
  LogOut,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Monitor,
} from "lucide-react";

const DEMO_LOGS = [
  {
    id: "att-1",
    employee: { name: "Rohan Sharma", role: "MANAGER" },
    checkInTime: "2026-07-21T08:00:00Z",
    checkOutTime: null,
    status: "PRESENT",
  },
  {
    id: "att-2",
    employee: { name: "Priya Patel", role: "STAFF" },
    checkInTime: "2026-07-21T08:15:00Z",
    checkOutTime: "2026-07-21T16:00:00Z",
    status: "PRESENT",
  },
];

export default function AttendanceTerminalPage() {
  const { data: logsApiData, isLoading: isLogsLoading } = useGetAttendanceLogsQuery(undefined);
  const { data: empApiData } = useGetEmployeesQuery(undefined);

  const [clockIn, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOut, { isLoading: isClockingOut }] = useClockOutMutation();

  const logs = logsApiData?.data || (isLogsLoading ? [] : DEMO_LOGS);
  const employees = empApiData?.data || [
    { id: "demo-1", name: "Rohan Sharma" },
    { id: "demo-2", name: "Priya Patel" },
    { id: "demo-3", name: "Amit Kumar" },
  ];

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(
    null
  );

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setDateString(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClockIn = async () => {
    if (!selectedEmployeeId) {
      setFeedback({ type: "error", msg: "Please select an employee first!" });
      return;
    }
    try {
      await clockIn({ employeeId: selectedEmployeeId }).unwrap();
      const emp = employees.find((e: any) => e.id === selectedEmployeeId);
      setFeedback({
        type: "success",
        msg: `Checked In successfully for ${emp?.name || "Employee"}!`,
      });
      setSelectedEmployeeId("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err?.data?.message || "Failed to check in (Already checked in or inactive)",
      });
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployeeId) {
      setFeedback({ type: "error", msg: "Please select an employee first!" });
      return;
    }
    try {
      await clockOut({ employeeId: selectedEmployeeId }).unwrap();
      const emp = employees.find((e: any) => e.id === selectedEmployeeId);
      setFeedback({
        type: "success",
        msg: `Checked Out successfully for ${emp?.name || "Employee"}!`,
      });
      setSelectedEmployeeId("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err?.data?.message || "Failed to check out (No open check-in record found)",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Terminal (Kiosk)</h1>
            <p className="text-sm text-gray-500">
              Digital tablet terminal for store employees to punch clock-in & clock-out.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full w-fit">
            <Monitor className="h-4 w-4" /> Tablet Kiosk Mode Active
          </div>
        </div>

        {/* Navigation Tabs */}
        <WorkforceHeaderNav />

        {/* Live Clock Terminal Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl border border-slate-700/50 space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-widest font-semibold text-red-400">
              Store Tablet Clock-In Terminal
            </p>
            <div className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono text-white">
              {timeString || "00:00:00"}
            </div>
            <p className="text-sm text-slate-400 font-medium">{dateString || "Loading date..."}</p>
          </div>

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                )}
                <span>{feedback.msg}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
                ✕
              </button>
            </div>
          )}

          {/* Controls: Employee Selection & Clock Action Buttons */}
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select Your Name / Employee Profile
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-800 border border-slate-600 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
              >
                <option value="">-- Touch to Select Employee Name --</option>
                {employees.map((e: any) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleClockIn}
                disabled={isClockingIn || !selectedEmployeeId}
                className="flex flex-col items-center justify-center gap-2 py-4 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
              >
                {isClockingIn ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>CLOCKING IN...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-6 w-6" />
                    <span>CLOCK IN</span>
                  </>
                )}
              </button>
              <button
                onClick={handleClockOut}
                disabled={isClockingOut || !selectedEmployeeId}
                className="flex flex-col items-center justify-center gap-2 py-4 px-6 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all active:scale-[0.98]"
              >
                {isClockingOut ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>CLOCKING OUT...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-6 w-6" />
                    <span>CLOCK OUT</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Today Attendance Log Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Today's Attendance Logs</h2>
              <p className="text-xs text-gray-500">Live punch records for current business shift.</p>
            </div>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold">Employee</th>
                  <th className="px-6 py-3 font-semibold">Check-In Time</th>
                  <th className="px-6 py-3 font-semibold">Check-Out Time</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No attendance punches recorded today yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {log.employee?.name || "Staff Member"}
                      </td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">
                        {new Date(log.checkInTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        {log.checkOutTime
                          ? new Date(log.checkOutTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-- Active On Shift --"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.checkOutTime
                              ? "bg-gray-100 text-gray-800"
                              : "bg-emerald-100 text-emerald-800 animate-pulse"
                          }`}
                        >
                          {log.checkOutTime ? "COMPLETED" : "ON SHIFT"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
