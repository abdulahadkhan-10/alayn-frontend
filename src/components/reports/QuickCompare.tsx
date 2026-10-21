"use client";

import React from "react";
import type { ReportParams, ReportPreset } from "@/lib/reportQuery";

const QUICK: { label: string; preset: ReportPreset }[] = [
  { label: "Today vs yesterday", preset: "TODAY" },
  { label: "This week vs last week", preset: "THIS_WEEK" },
  { label: "This month vs last month", preset: "THIS_MONTH" },
  { label: "Last month vs month before", preset: "LAST_MONTH" },
  { label: "This year vs last year", preset: "THIS_YEAR" },
];

interface QuickCompareProps {
  params: ReportParams;
  onChange: (next: ReportParams) => void;
}

/** One click sets the period and compares it with the one before; other filters stay. */
export default function QuickCompare({ params, onChange }: QuickCompareProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Quick comparisons">
      {QUICK.map((q) => {
        const active = params.preset === q.preset && params.compare === "PREVIOUS";
        return (
          <button
            key={q.preset}
            type="button"
            aria-pressed={active}
            onClick={() =>
              onChange({ ...params, preset: q.preset, compare: "PREVIOUS", from: undefined, to: undefined, cFrom: undefined, cTo: undefined })
            }
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              active
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
            }`}
          >
            {q.label}
          </button>
        );
      })}
    </div>
  );
}
