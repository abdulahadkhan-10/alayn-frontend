"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Gauge } from "lucide-react";
import { useGetTodayPaceQuery } from "@/redux/slices/dashboardApiSlice";

interface TodayPaceCardProps {
  outletId?: string;
}

const TODAY = "#2563EB";
const TYPICAL = "#CBD5E1";
/** Within this many % of a normal day reads as "on track", not ahead or behind */
const ON_TRACK_PCT = 3;

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const compactInr = (n: number) => (n >= 1000 ? `₹${+(n / 1000).toFixed(1)}k` : `₹${Math.round(n)}`);

function PaceTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number | null }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const today = payload.find((p) => p.dataKey === "actual")?.value;
  const typical = payload.find((p) => p.dataKey === "typical")?.value;
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-lg">
      <p className="mb-1 font-bold text-white">From {label}</p>
      <p>
        Today: <span className="font-semibold text-white">{today === null || today === undefined ? "later" : inr(today)}</span>
      </p>
      {typical !== undefined && (
        <p>
          A normal day: <span className="font-semibold text-white">{inr(typical ?? 0)}</span>
        </p>
      )}
    </div>
  );
}

/**
 * Today's sales so far next to what a normal day of the same weekday had sold by now, scaled to
 * today's forecast: "₹12,400 by 2 PM, 8% ahead of a normal Friday".
 */
export default function TodayPaceCard({ outletId }: TodayPaceCardProps) {
  const { data, isLoading, isError } = useGetTodayPaceQuery({ outletId }, { pollingInterval: 5 * 60 * 1000 });

  const shell = "lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4";

  if (isLoading) return <div className={`${shell} h-[340px] animate-pulse`} aria-hidden="true" />;
  if (isError || !data) {
    return (
      <section className={shell}>
        <p className="text-sm text-slate-500">Couldn&apos;t load today&apos;s pace. It will retry shortly.</p>
      </section>
    );
  }

  const hasPattern = data.status === "ok";
  const pace = data.pacePct;
  const paceText =
    pace === null
      ? null
      : Math.abs(pace) < ON_TRACK_PCT
        ? "On track"
        : `${Math.abs(Math.round(pace))}% ${pace > 0 ? "ahead" : "behind"}`;
  const paceStyle =
    pace === null || Math.abs(pace) < ON_TRACK_PCT
      ? "bg-slate-100 text-slate-700 border-slate-200"
      : pace > 0
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-rose-50 text-rose-700 border-rose-200";
  const hasSlots = data.slots.length > 0;

  return (
    <section className={shell} aria-labelledby="today-pace-title">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h2 id="today-pace-title" className="text-base font-bold text-slate-800 tracking-tight">
              Today&apos;s pace
            </h2>
            <p className="text-xs text-slate-500">
              {hasPattern ? `Sales so far against a normal ${data.weekday}` : "Sales so far today, before tax"}
            </p>
          </div>
        </div>
        {paceText && (
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${paceStyle}`}>{paceText}</span>
        )}
      </div>

      <div>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">{inr(data.soFar)}</span>
          <span className="text-sm text-slate-500">by {data.asOf}</span>
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {hasPattern && data.expectedByNow !== null
            ? `A normal ${data.weekday} would be at about ${inr(data.expectedByNow)} by now` +
              (data.forecastToday !== null ? ` · forecast for today ${inr(data.forecastToday)}` : "")
            : hasPattern
              ? `Compared with the last ${data.typicalDays} ${data.weekday}s`
              : `Alayn compares today with past ${data.weekday}s once it has seen 2 of them with sales.`}
        </p>
      </div>

      <div className="h-52 w-full">
        {!hasSlots ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500">
            No sales yet today
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.slots} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 11 }}
                tickFormatter={compactInr}
                allowDecimals={false}
                width={48}
              />
              <Tooltip content={<PaceTooltip />} cursor={{ fill: "#F8FAFC" }} />
              {hasPattern && (
                <Legend
                  verticalAlign="top"
                  align="right"
                  height={24}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: string) => <span className="text-xs text-slate-600">{value}</span>}
                />
              )}
              {hasPattern && <Bar dataKey="typical" name={`Normal ${data.weekday}`} fill={TYPICAL} radius={[4, 4, 0, 0]} maxBarSize={28} />}
              <Bar dataKey="actual" name="Today" fill={TODAY} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
