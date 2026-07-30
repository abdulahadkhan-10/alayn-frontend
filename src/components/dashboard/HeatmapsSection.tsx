"use client";

import React, { memo, useState } from "react";
import { LayoutGrid, Flame, Clock, Users, Utensils } from "lucide-react";

type HeatmapMode = "REVENUE_HOUR" | "REVENUE_DAY" | "ORDERS_HOUR" | "KITCHEN_LOAD";

const HOURS = ["10am", "12pm", "2pm", "4pm", "6pm", "8pm", "10pm"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Intensity 0-4
const HEATMAP_MATRIX = [
  [1, 2, 3, 1, 2, 4, 3], // Mon
  [1, 2, 2, 1, 2, 3, 2], // Tue
  [2, 3, 3, 2, 3, 4, 3], // Wed
  [2, 3, 4, 2, 3, 4, 4], // Thu
  [3, 4, 4, 3, 4, 4, 4], // Fri
  [4, 4, 4, 4, 4, 4, 4], // Sat
  [3, 4, 4, 3, 4, 4, 3], // Sun
];

const INTENSITY_COLORS = ["bg-zinc-100", "bg-red-100", "bg-red-300", "bg-[#D3232A] text-white", "bg-red-800 text-white"];

export const HeatmapsSection = memo(function HeatmapsSection() {
  const [mode, setMode] = useState<HeatmapMode>("REVENUE_HOUR");

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-zinc-900 tracking-tight">Operational Heatmaps</h3>
          <p className="text-xs text-zinc-400 font-medium">Hourly &amp; daily intensity patterns for revenue, orders &amp; kitchen load</p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("REVENUE_HOUR")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "REVENUE_HOUR" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Revenue / Hour
          </button>
          <button
            type="button"
            onClick={() => setMode("ORDERS_HOUR")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "ORDERS_HOUR" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Orders / Hour
          </button>
          <button
            type="button"
            onClick={() => setMode("KITCHEN_LOAD")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "KITCHEN_LOAD" ? "bg-white text-zinc-900 shadow-2xs" : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Kitchen Load
          </button>
        </div>
      </div>

      {/* Matrix Table Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px] space-y-1.5">
          {/* Header Hour Labels */}
          <div className="grid grid-cols-8 gap-1.5 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-wider pb-1">
            <span>Day</span>
            {HOURS.map((h) => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {/* Day Rows */}
          {DAYS.map((day, dIdx) => (
            <div key={day} className="grid grid-cols-8 gap-1.5 items-center">
              <span className="text-xs font-bold text-zinc-700 text-center">{day}</span>
              {HOURS.map((_, hIdx) => {
                const intensity = HEATMAP_MATRIX[dIdx][hIdx];
                return (
                  <div
                    key={hIdx}
                    className={`h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-transform hover:scale-105 cursor-pointer ${INTENSITY_COLORS[intensity]}`}
                    title={`${day} @ ${HOURS[hIdx]}: Intensity Level ${intensity}`}
                  >
                    L{intensity}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
