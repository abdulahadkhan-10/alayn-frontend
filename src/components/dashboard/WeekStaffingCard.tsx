"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange } from "lucide-react";
import { StaffingWeekResponse, useGetStaffingWeekQuery } from "@/redux/slices/dashboardApiSlice";

interface WeekStaffingCardProps {
  outletId?: string;
  className?: string;
}

const compactInr = (n: number) => (n >= 1000 ? `₹${+(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

type Day = StaffingWeekResponse["days"][number];

/** "Sat 24: forecast ₹24k, the busiest day, with 4 staff (a usual day has 4)." */
function flagSentence(d: Day, avgForecast: number, avgStaff: number) {
  const times = avgForecast > 0 && d.forecast ? d.forecast / avgForecast : 1;
  const usual = Math.round(avgStaff * 10) / 10;
  if (d.flag === "understaffed") {
    return `${d.label} ${d.dayOfMonth}: forecast ${compactInr(d.forecast ?? 0)} (${times.toFixed(1)}× a usual day) but only ${plural(d.staff, "person", "people")} rostered (usual ${usual}).`;
  }
  return `${d.label} ${d.dayOfMonth}: a quiet day (forecast ${compactInr(d.forecast ?? 0)}) with ${plural(d.staff, "person", "people")} rostered (usual ${usual}).`;
}

/** The next 7 days: forecast sales next to people rostered, flagging days where the two don't match. */
export default function WeekStaffingCard({ outletId, className = "" }: WeekStaffingCardProps) {
  const { data, isLoading, isError } = useGetStaffingWeekQuery({ outletId });
  const shell = `bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4 ${className}`;

  if (isLoading) return <div className={`${shell} h-[300px] animate-pulse`} aria-hidden="true" />;
  if (isError || !data) return null;

  const forecasting = data.forecastStatus !== "learning";
  const open = data.days.filter((d) => !d.closed && d.forecast !== null && d.forecast > 0);
  const avgForecast = open.length ? open.reduce((s, d) => s + (d.forecast ?? 0), 0) / open.length : 0;
  const avgStaff = open.length ? open.reduce((s, d) => s + d.staff, 0) / open.length : 0;
  const maxForecast = Math.max(1, ...data.days.map((d) => d.forecast ?? 0));
  const flagged = data.days.filter((d) => d.flag);
  const noRoster = data.days.every((d) => d.staff === 0);

  return (
    <section className={shell} aria-labelledby="week-staffing-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="week-staffing-title" className="text-base font-bold text-slate-800 tracking-tight">
              Next 7 days: staff vs demand
            </h2>
            <p className="text-xs text-slate-500">Forecast sales next to the people rostered each day</p>
          </div>
        </div>
      </div>

      {/* One column per day; bar height = forecast sales */}
      <ol className="grid grid-cols-7 gap-1.5" aria-label="Forecast and rostered staff per day">
        {data.days.map((d) => {
          const tone =
            d.flag === "understaffed" ? "bg-rose-500" : d.flag === "overstaffed" ? "bg-amber-400" : "bg-blue-500";
          const height = d.forecast ? Math.max(6, Math.round((d.forecast / maxForecast) * 100)) : 0;
          return (
            <li key={d.date} className="flex flex-col items-center gap-1 text-center">
              <div className="flex h-24 w-full items-end justify-center rounded-lg bg-slate-50">
                {d.closed ? (
                  <span className="mb-2 text-[11px] text-slate-400">Closed</span>
                ) : forecasting && d.forecast !== null ? (
                  <div
                    className={`w-3/5 max-w-7 rounded-t-md ${tone}`}
                    style={{ height: `${height}%` }}
                    title={`Forecast ${compactInr(d.forecast)}`}
                  />
                ) : null}
              </div>
              <span className="text-xs font-semibold text-slate-800">{d.label}</span>
              <span className="text-[11px] text-slate-500 tabular-nums">{d.dayOfMonth}</span>
              {forecasting && !d.closed && d.forecast !== null && (
                <span className="text-[11px] text-slate-600 tabular-nums">{compactInr(d.forecast)}</span>
              )}
              <span
                className={`rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${
                  d.flag === "understaffed" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-700"
                }`}
                title={`${plural(d.staff, "person", "people")} rostered`}
              >
                {d.closed ? "—" : d.staff}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="-mt-2 text-[11px] text-slate-500">Number under each day = people rostered</p>

      <div className="mt-auto space-y-1.5 text-sm">
        {noRoster ? (
          <p className="text-slate-600">
            No roster for the coming week yet.{" "}
            <Link href="/workforce" className="font-semibold text-indigo-600 hover:underline">
              Set up the roster
            </Link>
          </p>
        ) : !forecasting ? (
          <p className="text-slate-600">Forecast bars appear once Alayn has a few days of sales to learn from.</p>
        ) : flagged.length === 0 ? (
          <p className="text-slate-600">Staffing follows the forecast this week. No day stands out.</p>
        ) : (
          flagged.map((d) => (
            <p key={d.date} className="flex gap-2 text-slate-700">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${d.flag === "understaffed" ? "bg-rose-500" : "bg-amber-400"}`}
                aria-hidden="true"
              />
              {flagSentence(d, avgForecast, avgStaff)}
            </p>
          ))
        )}
      </div>

      <Link href="/workforce" className="inline-flex items-center gap-1 self-start text-sm font-semibold text-indigo-600 hover:underline">
        Open the roster <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
