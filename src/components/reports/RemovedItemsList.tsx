"use client";

import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useGetRemovedItemsReportQuery, type RemovalTotals } from "@/redux/slices/reportsApiSlice";
import { formatCount, formatPaise, type ReportParams } from "@/lib/reportQuery";

const CARD = "min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4";
const PREVIEW_ROWS = 10;

const STAGE_LABELS: Record<string, string> = {
  SENT_TO_KITCHEN: "In kitchen",
  RECEIVED: "In kitchen",
  PREPARING: "Preparing",
  READY: "Ready",
  SERVED: "Served",
};

const ROLE_LABELS: Record<string, string> = {
  BUSINESS_OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
};

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const removalsLabel = (t: RemovalTotals) =>
  `${formatCount(t.removals)} ${t.removals === 1 ? "removal" : "removals"} · ${formatCount(t.quantity)} qty`;

/**
 * Items taken off bills in the period: who removed them, what they were worth and why.
 * Shown even when empty, so the owner can see nothing was removed.
 */
export default function RemovedItemsList({ params }: { params: ReportParams }) {
  const { currentData: report, isFetching, isError } = useGetRemovedItemsReportQuery(params);
  const [showAll, setShowAll] = useState(false);

  const header = (
    <div>
      <h2 id="report-removed-title" className="text-base font-bold text-slate-800 tracking-tight">Items removed from bills</h2>
      <p className="text-xs text-slate-500">Taken off a bill after being punched, with who removed them and why</p>
    </div>
  );

  if (isError) {
    return (
      <section className={CARD} aria-labelledby="report-removed-title">
        {header}
        <p className="text-sm text-slate-500" role="alert">Couldn&apos;t load removed items. Try again in a moment.</p>
      </section>
    );
  }

  if (!report || isFetching) {
    return (
      <section className={CARD} aria-labelledby="report-removed-title" aria-busy="true">
        {header}
        <div className="h-16 rounded-xl bg-slate-100 animate-pulse" />
      </section>
    );
  }

  const { totals, byPerson, byReason, rows } = report;
  if (totals.removals === 0) {
    return (
      <section className={CARD} aria-labelledby="report-removed-title">
        {header}
        <p className="text-sm text-slate-500">No items were removed from bills in this period.</p>
      </section>
    );
  }

  const shownRows = showAll ? rows : rows.slice(0, PREVIEW_ROWS);

  return (
    <section className={CARD} aria-labelledby="report-removed-title">
      {header}

      {/* Headline figures */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">Value removed (before tax)</p>
          <p className="text-xl font-bold text-slate-800 tabular-nums">{formatPaise(totals.amountPaise)}</p>
          <p className="text-xs text-slate-500">{removalsLabel(totals)}</p>
        </div>
        <div
          className={`rounded-xl border p-3 ${
            totals.afterServedRemovals > 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            {totals.afterServedRemovals > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
            Removed after serving
          </p>
          <p className={`text-xl font-bold tabular-nums ${totals.afterServedRemovals > 0 ? "text-rose-700" : "text-slate-800"}`}>
            {formatPaise(totals.afterServedPaise)}
          </p>
          <p className="text-xs text-slate-500">
            {totals.afterServedRemovals > 0
              ? `${formatCount(totals.afterServedRemovals)} served ${totals.afterServedRemovals === 1 ? "item" : "items"} taken off a bill. Worth checking`
              : "None"}
          </p>
        </div>
      </div>

      {/* Who removed / why */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">By person</h3>
          <ul className="divide-y divide-slate-100">
            {byPerson.map((p) => (
              <li key={p.key} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800" title={p.name}>
                  {p.name}
                  <span className="ml-1.5 text-xs font-normal text-slate-500">{ROLE_LABELS[p.role] ?? p.role}</span>
                </span>
                <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-700">
                  {formatPaise(p.amountPaise)}
                  <span className="ml-1 text-xs text-slate-500">({formatCount(p.removals)})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">By reason</h3>
          <ul className="divide-y divide-slate-100">
            {byReason.map((r) => (
              <li key={r.reason} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate font-medium text-slate-800" title={r.reason}>{r.reason}</span>
                <span className="shrink-0 whitespace-nowrap tabular-nums text-slate-700">
                  {formatPaise(r.amountPaise)}
                  <span className="ml-1 text-xs text-slate-500">({formatCount(r.removals)})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Every removal */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Every removal</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2 text-right">Value</th>
                <th className="px-3 py-2">Stage</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Removed by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shownRows.map((r) => (
                <tr key={r.id} className={r.itemStage === "SERVED" ? "bg-rose-50/50" : undefined}>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-600 tabular-nums">{when(r.at)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                    <span className="font-medium">{r.orderNumber}</span>
                    <span className="block text-xs text-slate-500">
                      {r.tableNumber != null ? `Table ${r.tableNumber}` : "Counter"}
                      {r.outletName && ` · ${r.outletName}`}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-800">
                    {r.quantity}× {r.itemName}
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums text-slate-800">{formatPaise(r.amountPaise)}</td>
                  <td className={`px-3 py-2 whitespace-nowrap ${r.itemStage === "SERVED" ? "font-semibold text-rose-700" : "text-slate-600"}`}>
                    {STAGE_LABELS[r.itemStage] ?? r.itemStage}
                  </td>
                  <td className="px-3 py-2 text-slate-600 max-w-[240px]">{r.reason}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-slate-700">
                    {r.removedByName}
                    <span className="block text-xs text-slate-500">{ROLE_LABELS[r.removedByRole] ?? r.removedByRole}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(rows.length > PREVIEW_ROWS || report.truncated) && (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            {rows.length > PREVIEW_ROWS ? (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="font-semibold text-slate-700 hover:text-slate-900 underline-offset-2 hover:underline cursor-pointer"
              >
                {showAll ? "Show fewer" : `Show all ${formatCount(rows.length)}`}
              </button>
            ) : (
              <span />
            )}
            {report.truncated && <span>Showing the latest {formatCount(rows.length)}. Pick a shorter period to see the rest.</span>}
          </div>
        )}
      </div>
    </section>
  );
}
