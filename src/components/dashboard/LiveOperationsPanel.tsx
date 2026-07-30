"use client";

import React, { memo } from "react";
import { Zap, Clock, ShieldCheck, UtensilsCrossed, CreditCard, Activity } from "lucide-react";

export const LiveOperationsPanel = memo(function LiveOperationsPanel() {
  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
      {/* Header with Pulsing Live Status */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-emerald-800">Live Operations Cockpit</span>
          </div>
          <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Realtime operational telemetry feed active</span>
        </div>

        <span className="text-xs font-extrabold text-[#0B1221] bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/80">
          System Health: 100% Operational
        </span>
      </div>

      {/* Grid of 6 Realtime Health Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Open Orders</span>
          <span className="text-xl font-extrabold text-[#0B1221] mt-1">8 Active</span>
          <span className="text-[10px] text-emerald-700 font-bold mt-1">Flow Normal</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Kitchen Queue</span>
          <span className="text-xl font-extrabold text-orange-600 mt-1">6 Tickets</span>
          <span className="text-[10px] text-orange-700 font-bold mt-1">Avg 11m Prep</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Table Occupancy</span>
          <span className="text-xl font-extrabold text-[#0B1221] mt-1">14 / 20</span>
          <span className="text-[10px] text-zinc-500 font-bold mt-1">70% Capacity</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Stock Health</span>
          <span className="text-xl font-extrabold text-[#D3232A] mt-1">4 Low</span>
          <span className="text-[10px] text-[#D3232A] font-bold mt-1">Reorder Alert</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Table Turnover</span>
          <span className="text-xl font-extrabold text-[#0B1221] mt-1">42 mins</span>
          <span className="text-[10px] text-emerald-700 font-bold mt-1">Optimal Speed</span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 flex flex-col justify-between">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">Payment Health</span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1">100% Clean</span>
          <span className="text-[10px] text-emerald-700 font-bold mt-1">0 Failed Payments</span>
        </div>
      </div>
    </div>
  );
});
