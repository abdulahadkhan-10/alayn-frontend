"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ChefHat, Users } from "lucide-react";
import { useGetStaffTodayQuery } from "@/redux/slices/dashboardApiSlice";

interface ShiftCoverageCardProps {
  outletId?: string;
  className?: string;
}

const SHOWN = 4;

/** Two-letter initials: "Asha Rao" → "AR" */
function initials(name: string) {
  const words = name.replace(/\(.*?\)/g, "").replace(/[^a-zA-Z\s]/g, "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  if (words.length === 1 && words[0].length >= 2) return words[0].slice(0, 2).toUpperCase();
  return "EM";
}

/** Avatar colour by role, so managers, kitchen and floor staff are told apart at a glance */
function avatarStyle(role: string) {
  const r = (role || "").toUpperCase();
  if (r.includes("MANAGER") || r.includes("OWNER")) return "bg-indigo-600";
  if (r.includes("HEAD CHEF") || r.includes("EXECUTIVE")) return "bg-amber-600";
  if (r.includes("SOUS") || r.includes("CHEF") || r.includes("COOK")) return "bg-emerald-600";
  if (r.includes("KITCHEN") || r.includes("HELPER") || r.includes("ASSISTANT")) return "bg-teal-600";
  if (r.includes("SERVER") || r.includes("WAITER")) return "bg-blue-600";
  return "bg-slate-700";
}

/** Who is working today, from the real roster and clock-ins (same source AlaynAI uses). */
export default function ShiftCoverageCard({ outletId, className = "" }: ShiftCoverageCardProps) {
  const { data: staffToday } = useGetStaffTodayQuery({ outletId });

  return (
    <section
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4 ${className}`}
      aria-labelledby="shift-coverage-title"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <ChefHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="shift-coverage-title" className="text-base font-bold text-slate-800 tracking-tight">
              Shift coverage today
            </h2>
            <p className="text-xs text-slate-500">
              {staffToday && staffToday.summary.working > 0
                ? `${staffToday.summary.in} of ${staffToday.summary.working} working today are in`
                : "Who's working today"}
            </p>
          </div>
        </div>
      </div>

      {!staffToday || staffToday.staff.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-sm text-slate-500">
          <Users className="h-6 w-6 text-slate-300" />
          {staffToday?.rosterSource === "none" || !staffToday ? "No roster set up for today yet." : "Nobody is rostered today."}
          <Link href="/workforce" className="font-semibold text-indigo-600 hover:underline">
            Set up the roster
          </Link>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-slate-100">
          {staffToday.staff.slice(0, SHOWN).map((staff) => {
            const pill =
              staff.status === "in"
                ? staff.late
                  ? "bg-amber-50 text-amber-800"
                  : "bg-emerald-50 text-emerald-700"
                : staff.status === "not_in" || staff.status === "leave"
                  ? "bg-rose-50 text-rose-700"
                  : "bg-slate-100 text-slate-700";
            return (
              <li key={staff.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`h-8 w-8 shrink-0 rounded-full ${avatarStyle(staff.role)} flex items-center justify-center text-xs font-semibold text-white`}
                    aria-hidden="true"
                  >
                    {initials(staff.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{staff.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {staff.shiftLabel ?? staff.role.charAt(0) + staff.role.slice(1).toLowerCase()}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${pill}`}>{staff.statusLabel}</span>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/workforce" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-indigo-600 hover:underline">
        {staffToday && staffToday.staff.length > SHOWN ? `All ${staffToday.staff.length} people today` : "Manage roster"}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
