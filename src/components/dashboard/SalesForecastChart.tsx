"use client";

import React, { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { LineChart, Target, Hourglass } from "lucide-react";
import {
  SalesForecastPoint,
  SalesForecastRange,
  useGetSalesForecastQuery,
} from "@/redux/slices/dashboardApiSlice";

interface SalesForecastChartProps {
  outletId?: string;
}

const ACTUAL = "#2563EB";
const FORECAST = "#D97706";
const RANGES: SalesForecastRange[] = ["7d", "30d", "90d"];

const inr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;
const compactInr = (value: number) =>
  value >= 100000 ? `₹${(value / 100000).toFixed(1)}L` : `₹${(value / 1000).toFixed(0)}k`;

type ChartRow = SalesForecastPoint & { band: [number, number] | null };

function ForecastTooltip({ active, payload }: { active?: boolean; payload?: { payload: ChartRow }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-200 shadow-lg">
      <p className="mb-1 font-bold text-white">{p.isToday ? `Today (${p.date.slice(8)})` : p.label}</p>
      {p.closed ? (
        <p>Closed</p>
      ) : (
        <>
          {p.actual !== null && (
            <p>
              {p.isToday ? "So far" : "Actual"}: <span className="font-semibold text-white">{inr(p.actual)}</span>
            </p>
          )}
          {p.projected !== null && (
            <p>
              Forecast: <span className="font-semibold text-white">{inr(p.projected)}</span>
            </p>
          )}
          {p.low !== null && p.high !== null && (
            <p className="text-slate-400">
              Likely {inr(p.low)} – {inr(p.high)}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function SalesForecastChart({ outletId }: SalesForecastChartProps) {
  const [range, setRange] = useState<SalesForecastRange>("7d");
  const { data, isLoading, isFetching } = useGetSalesForecastQuery({ outletId, range });

  const rows: ChartRow[] = useMemo(
    () =>
      (data?.points ?? []).map((p) => ({
        ...p,
        band: p.low !== null && p.high !== null ? [p.low, p.high] : null,
      })),
    [data],
  );

  const forecasting = data?.status === "ok";
  const hasSales = rows.some((p) => (p.actual ?? 0) > 0);
  const summary = data?.summary;
  const accuracy = data?.accuracy;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Sales Forecast</h3>
            <p className="text-xs text-slate-500 font-normal">
              Daily revenue before tax, learned from your weekly pattern
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap self-start">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-700">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: ACTUAL }} />
              Actual
            </span>
            {forecasting && (
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: FORECAST }} />
                Forecast &amp; likely range
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-0.5 border border-slate-200/60">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  range === r
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {forecasting && summary && (
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-xs font-medium text-slate-500">Next 7 days</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{inr(summary.next7DaysProjected)}</span>
          <span
            className={`text-xs font-semibold ${summary.vsLast7DaysPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}
          >
            {summary.vsLast7DaysPct >= 0 ? "+" : ""}
            {summary.vsLast7DaysPct}% vs last 7 days
          </span>
        </div>
      )}

      <div className={`h-72 w-full transition-opacity ${isFetching && !isLoading ? "opacity-60" : ""}`}>
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : !hasSales ? (
          <div className="flex h-full w-full flex-col items-center justify-center text-center p-4">
            <LineChart className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-500">No sales recorded yet</p>
            <p className="text-[11px] text-slate-400 max-w-[240px] mt-0.5">
              The forecast starts once {data?.minHistoryDays ?? 21} days of settled orders are recorded.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastActualGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACTUAL} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={ACTUAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
                minTickGap={16}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748B", fontSize: 11, fontWeight: 500 }}
                tickFormatter={compactInr}
              />
              <Tooltip content={<ForecastTooltip />} cursor={{ stroke: "#94A3B8", strokeDasharray: "3 3" }} />
              <ReferenceLine x="Today" stroke="#CBD5E1" strokeDasharray="3 3" />
              {forecasting && (
                <Area
                  type="monotone"
                  dataKey="band"
                  stroke="none"
                  fill={FORECAST}
                  fillOpacity={0.12}
                  isAnimationActive={false}
                  connectNulls
                />
              )}
              <Area
                type="monotone"
                dataKey="actual"
                stroke={ACTUAL}
                strokeWidth={2.5}
                fill="url(#forecastActualGradient)"
                dot={false}
              />
              {forecasting && (
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke={FORECAST}
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs font-medium text-slate-500">
        {forecasting ? (
          <span className="flex items-center gap-1.5">
            <Target className="h-4 w-4 text-amber-600" />
            {accuracy
              ? `Past forecasts were off by ${accuracy.mapePct}% on average (checked on the last ${accuracy.daysEvaluated} days)`
              : "Accuracy will show once a few forecast days have passed"}
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <Hourglass className="h-4 w-4 text-slate-400" />
            Forecast unlocks after {data?.minHistoryDays ?? 21} days of sales ({Math.min(data?.daysOfHistory ?? 0, data?.minHistoryDays ?? 21)}/
            {data?.minHistoryDays ?? 21} so far)
          </span>
        )}
        {data && data.coverage.forecasted < data.coverage.total && data.coverage.forecasted > 0 && (
          <span className="text-slate-400">
            Forecast covers {data.coverage.forecasted} of {data.coverage.total} outlets (others are too new)
          </span>
        )}
      </div>
    </div>
  );
}
