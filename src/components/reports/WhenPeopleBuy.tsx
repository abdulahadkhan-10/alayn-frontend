"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ReportBreakdownRow, ReportData } from "@/redux/slices/reportsApiSlice";
import { changeTone, formatChange, formatCount, formatPaise, type ReportParams } from "@/lib/reportQuery";
import { CsvButton } from "./ExportMenu";
import { compactInr, CURRENT, PREVIOUS } from "./TrendChart";

interface Point {
  label: string;
  current: number; // rupees, for the chart scale
  previous: number | null;
  row: ReportBreakdownRow;
}

function BuyTooltip({ active, payload, compareLabel }: { active?: boolean; payload?: { payload: Point }[]; compareLabel?: string }) {
  if (!active || !payload?.length) return null;
  const { row } = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{row.label}</p>
      <p className="mt-1 text-slate-700 tabular-nums">Sales {formatPaise(row.current.netSalesPaise)}</p>
      <p className="text-slate-700 tabular-nums">Orders {formatCount(row.current.orders)}</p>
      <p className="text-slate-700 tabular-nums">Share {row.sharePct.toFixed(1)}%</p>
      {compareLabel && (
        <>
          <p className="mt-1 text-slate-500 tabular-nums">
            {compareLabel}: {row.previous ? formatPaise(row.previous.netSalesPaise) : "—"}
          </p>
          <p className={`font-semibold tabular-nums ${row.changePct == null ? "text-slate-400" : changeTone(row.changePct)}`}>
            Change {formatChange(row.changePct)}
          </p>
        </>
      )}
    </div>
  );
}

function SalesBars({ title, rows, compareLabel, params, section }: { title: string; rows: ReportBreakdownRow[]; compareLabel?: string; params: ReportParams; section: string }) {
  const data: Point[] = rows.map((r) => ({
    label: r.label,
    current: r.current.netSalesPaise / 100,
    previous: r.previous ? r.previous.netSalesPaise / 100 : null,
    row: r,
  }));
  return (
    <div className="min-w-0 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="whitespace-nowrap text-sm font-semibold text-slate-700">{title}</h3>
        <CsvButton params={params} section={section} label={`sales ${title.toLowerCase()}`} />
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={8} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }} dy={6} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }} tickFormatter={compactInr} allowDecimals={false} />
            <Tooltip content={<BuyTooltip compareLabel={compareLabel} />} cursor={{ fill: "#F8FAFC" }} />
            <Bar dataKey="current" name="This period" fill={CURRENT} radius={[3, 3, 0, 0]} />
            {compareLabel && <Bar dataKey="previous" name={compareLabel} fill={PREVIOUS} fillOpacity={0.5} radius={[3, 3, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** Sales by hour of day and by weekday, this period against the comparison. */
export default function WhenPeopleBuy({ report, params }: { report: ReportData; params: ReportParams }) {
  const hasHours = report.hours.length > 0; // the server only lists hours with sales
  const hasDays = report.weekdays.some((r) => r.current.netSalesPaise > 0 || (r.previous?.netSalesPaise ?? 0) > 0);
  if (!hasHours && !hasDays) return null;
  const compareLabel = report.comparison?.compareLabel;

  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4" aria-labelledby="report-when-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="report-when-title" className="text-base font-bold text-slate-800 tracking-tight">When people buy</h2>
          <p className="text-xs text-slate-500">Sales before tax</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CURRENT }} /> This period
          </span>
          {compareLabel && (
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2.5 w-2.5 rounded-sm opacity-50" style={{ background: PREVIOUS }} /> {compareLabel}
            </span>
          )}
        </div>
      </div>
      <div className={`grid grid-cols-1 gap-6 ${hasHours && hasDays ? "lg:grid-cols-2" : ""}`}>
        {hasHours && <SalesBars title="By hour" rows={report.hours} compareLabel={compareLabel} params={params} section="hours" />}
        {hasDays && <SalesBars title="By weekday" rows={report.weekdays} compareLabel={compareLabel} params={params} section="weekdays" />}
      </div>
    </section>
  );
}
