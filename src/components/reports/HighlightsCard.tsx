"use client";

import React from "react";

/** The few things worth knowing about this period, in plain sentences from the server. */
export default function HighlightsCard({ highlights, empty }: { highlights: string[]; empty: boolean }) {
  if (!empty && highlights.length === 0) return null;
  return (
    <section className="min-w-0 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-3" aria-labelledby="report-highlights-title">
      <h2 id="report-highlights-title" className="text-base font-bold text-slate-800 tracking-tight">Highlights</h2>
      {empty ? (
        <p className="text-sm text-slate-500">No sales in this period</p>
      ) : (
        <ul className="space-y-2">
          {highlights.map((h) => (
            <li key={h} className="flex gap-2 text-sm leading-relaxed text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-hidden="true" />
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
