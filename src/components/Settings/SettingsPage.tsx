"use client";

import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import {
  useGetHolidaysQuery,
  useCreateHolidayMutation,
} from "@/redux/slices/holidayApiSlice";
import {
  Palmtree,
  Calendar,
  Plus,
  Trash2,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Settings as SettingsIcon,
  Store,
  ShieldCheck,
} from "lucide-react";

export default function SettingsPage() {
  const { activeBranch } = useBranch();
  const outletId = activeBranch?.id === "all" ? undefined : activeBranch?.id;
  const user = useAppSelector((state) => state.auth.user);
  const isManagerOrOwner =
    user?.role === "BUSINESS_OWNER" ||
    user?.role === "MANAGER" ||
    user?.role === "SUPER_ADMIN";

  const [activeTab, setActiveTab] = useState<"HOLIDAYS" | "GENERAL">("HOLIDAYS");
  const [earlyBufferMins, setEarlyBufferMins] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("alayn_early_buffer_mins");
      if (saved) return Number(saved);
    }
    return 30;
  });
  const { data: holidaysData, isLoading } = useGetHolidaysQuery(outletId ? { outletId } : undefined);
  const [createHoliday, { isLoading: isCreatingHoliday }] = useCreateHolidayMutation();

  const holidays = holidaysData?.data || [];
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Holiday Form State
  const [holidayForm, setHolidayForm] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    type: "FESTIVAL", // FESTIVAL | WEEKLY_CLOSED | MAINTENANCE
    description: "",
  });

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createHoliday(holidayForm).unwrap();
      setFeedbackMsg("Outlet Holiday / Closure saved successfully!");
      setHolidayForm({
        name: "",
        date: new Date().toISOString().split("T")[0],
        type: "FESTIVAL",
        description: "",
      });
    } catch (err: any) {
      setFeedbackMsg(err?.data?.message || "Failed to add outlet holiday");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SettingsIcon className="h-6 w-6 text-[#D3232A]" />
              Store Settings & Configuration
            </h1>
            <p className="text-sm text-gray-500">
              Manage store holidays, operating schedules, policies, and branch configuration.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setActiveTab("HOLIDAYS")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "HOLIDAYS"
                  ? "bg-white text-[#D3232A] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Palmtree className="h-4 w-4" />
              Outlet Holidays & Closures
            </button>
            <button
              onClick={() => setActiveTab("GENERAL")}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === "GENERAL"
                  ? "bg-white text-[#D3232A] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Store className="h-4 w-4" />
              General Preferences
            </button>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMsg && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm font-medium">
            <span>{feedbackMsg}</span>
            <button onClick={() => setFeedbackMsg(null)}>
              <X className="h-4 w-4 text-blue-600 hover:text-blue-900" />
            </button>
          </div>
        )}

        {activeTab === "HOLIDAYS" ? (
          /* Outlet Holidays & Store Closures View */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Holiday Form Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-fit space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Palmtree className="h-5 w-5 text-amber-600" />
                  Add Store Holiday / Closure
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Configure festival closures, maintenance, or cafe off-days for {activeBranch?.name || "all branches"}.
                </p>
              </div>

              <form onSubmit={handleCreateHoliday} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Holiday Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                    placeholder="e.g. Diwali Festival / Store Maintenance"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Closure Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={holidayForm.date}
                    onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Closure Category
                  </label>
                  <select
                    value={holidayForm.type}
                    onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A] bg-white"
                  >
                    <option value="FESTIVAL">Festival Holiday</option>
                    <option value="WEEKLY_CLOSED">Weekly Closed Day</option>
                    <option value="MAINTENANCE">Store Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Notes / Description
                  </label>
                  <textarea
                    rows={2}
                    value={holidayForm.description}
                    onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                    placeholder="Optional details for staff..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingHoliday}
                  className="w-full flex items-center justify-center gap-2 bg-[#D3232A] hover:bg-[#b01e23] text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingHoliday ? "Saving..." : "Save Store Holiday"}
                </button>
              </form>
            </div>

            {/* Configured Holidays List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      Configured Outlet Holidays
                    </h3>
                    <p className="text-xs text-gray-500">
                      Active holiday calendar for {activeBranch?.name || "All Branches"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-600 bg-gray-200/60 px-3 py-1 rounded-full">
                    {holidays.length} Total Holiday(s)
                  </span>
                </div>

                <div className="divide-y divide-gray-200">
                  {holidays.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 space-y-2">
                      <Palmtree className="h-10 w-10 text-amber-500 mx-auto opacity-40" />
                      <p className="text-sm font-medium text-gray-900">No Store Holidays Configured Yet</p>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Use the form on the left to add festival closures, public holidays, or weekly off days for your cafe branch.
                      </p>
                    </div>
                  ) : (
                    holidays.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                            <Palmtree className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                                {item.type || "FESTIVAL"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                {new Date(item.date).toLocaleDateString(undefined, {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {item.outlet?.name && (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                                  {item.outlet.name}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 mt-1.5">{item.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* General Store Preferences View */
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm max-w-2xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-indigo-600" />
                Branch Configuration & Policies
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">General store operating parameters and attendance rules.</p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Current Branch Context</div>
                  <div className="text-xs text-gray-500 mt-0.5">{activeBranch?.name || "All Branches Selected"}</div>
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  ACTIVE
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Early Clock-in Window (Prior to Shift)</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Maximum allowed early punch-in window before scheduled shift start time.
                  </div>
                </div>
                <select
                  value={earlyBufferMins}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setEarlyBufferMins(val);
                    localStorage.setItem("alayn_early_buffer_mins", String(val));
                    setFeedbackMsg(`Early Clock-In Window updated to ${val} minutes prior to shift!`);
                  }}
                  className="text-xs font-bold text-gray-800 bg-white border border-gray-300 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D3232A]"
                >
                  <option value={15}>15 Mins Prior</option>
                  <option value={20}>20 Mins Prior</option>
                  <option value={25}>25 Mins Prior</option>
                  <option value={30}>30 Mins Prior (Default)</option>
                  <option value={45}>45 Mins Prior</option>
                  <option value={60}>60 Mins Prior</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Late Arrival Grace Period</div>
                  <div className="text-xs text-gray-500 mt-0.5">Automatic LATE status tag if employee punches in after grace period</div>
                </div>
                <span className="text-xs font-medium text-gray-700 bg-white border border-gray-300 px-3 py-1 rounded-lg">
                  15 Mins Grace
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">Workforce Security & Role Access</div>
                  <div className="text-xs text-gray-500 mt-0.5">Staff & Kitchen restricted to personal shift calendars & leaves</div>
                </div>
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
