"use client";

import React, { memo } from "react";
import { Users, UserCheck, Clock, UserX, Award } from "lucide-react";

export const StaffAnalyticsSection = memo(function StaffAnalyticsSection() {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 tracking-tight">Staff &amp; Workforce Productivity</h3>
          <p className="text-xs text-zinc-400 font-medium">Shift coverage, punctuality telemetry, attendance % &amp; top staff</p>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
          Attendance: 96.4%
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
          <span className="text-[10px] font-semibold uppercase text-zinc-400 block">On Shift Today</span>
          <span className="text-lg font-bold text-emerald-700">24 Staff</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
          <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Absent Today</span>
          <span className="text-lg font-bold text-zinc-700">1 Employee</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
          <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Late Arrivals</span>
          <span className="text-lg font-bold text-amber-600">2 Employees</span>
        </div>
        <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
          <span className="text-[10px] font-semibold uppercase text-zinc-400 block">Shift Coverage</span>
          <span className="text-lg font-bold text-zinc-900">100% Filled</span>
        </div>
      </div>

      {/* Top Performing Staff Stream */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Top Performing Floor &amp; Kitchen Staff</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-900">Rajesh Kumar</p>
              <p className="text-[11px] text-zinc-400 font-medium">Head Chef · Main Outlet</p>
            </div>
            <span className="text-xs font-bold text-amber-600">★ 4.9</span>
          </div>
          <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-900">Priya Verma</p>
              <p className="text-[11px] text-zinc-400 font-medium">Floor Lead · Soho</p>
            </div>
            <span className="text-xs font-bold text-amber-600">★ 4.85</span>
          </div>
          <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-900">Sameer Khan</p>
              <p className="text-[11px] text-zinc-400 font-medium">POS Cashier · Bhendi</p>
            </div>
            <span className="text-xs font-bold text-amber-600">★ 4.8</span>
          </div>
        </div>
      </div>
    </div>
  );
});
