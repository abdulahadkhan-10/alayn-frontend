"use client";

import React, { memo } from "react";
import { Zap, Clock, ShieldCheck, UtensilsCrossed, CreditCard, Activity, AlertTriangle, Users, Layers } from "lucide-react";

export const LiveOperationsPanel = memo(function LiveOperationsPanel() {
  return (
    <div className="w-full rounded-2xl bg-[#F8FAFC] p-1.5 ring-1 ring-zinc-950/5 shadow-2xs">
      <div className="rounded-xl bg-white p-5 sm:p-6 border border-zinc-200/60 space-y-4">
        
        {/* Header with Pulsing Live Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-xs font-extrabold text-emerald-800 tracking-tight">Live Restaurant Telemetry</span>
            </div>
            <span className="text-xs text-zinc-400 font-medium hidden md:inline">Realtime kitchen, floor &amp; POS signal feed active</span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1B2A4A] bg-zinc-100/90 px-3 py-1 rounded-xl border border-zinc-200/80">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> POS System 100% Operational
            </span>
          </div>
        </div>

        {/* Responsive Grid of 6 Realtime Health Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
          
          {/* Active Orders */}
          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Open Tickets</span>
              <Layers className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">8 Active</span>
              <p className="text-xs text-emerald-700 font-bold mt-1 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Flow Normal
              </p>
            </div>
          </div>

          {/* Kitchen Queue */}
          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Kitchen KDS</span>
              <UtensilsCrossed className="h-4 w-4 text-orange-500" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-orange-600 tracking-tight tabular-nums">6 Tickets</span>
              <p className="text-xs text-orange-700 font-bold mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Avg 11m Prep
              </p>
            </div>
          </div>

          {/* Table Capacity */}
          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Floor Occupancy</span>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">14 / 20</span>
              <p className="text-xs text-zinc-600 font-bold mt-1">70% Capacity</p>
            </div>
          </div>

          {/* Stock Watchlist */}
          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Stock Alerts</span>
              <AlertTriangle className="h-4 w-4 text-[#D3232A]" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#D3232A] tracking-tight tabular-nums">4 Low</span>
              <p className="text-xs text-[#D3232A] font-bold mt-1">2 Items 86'd</p>
            </div>
          </div>

          {/* Table Turnover */}
          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Table Turnover</span>
              <Clock className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">42 mins</span>
              <p className="text-xs text-emerald-700 font-bold mt-1">Optimal Speed</p>
            </div>
          </div>

          {/* Payment Gateway Status */}
          <div className="p-4 rounded-xl bg-zinc-50/80 border border-zinc-200/70 hover:border-zinc-300 transition-colors flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Payment Gateway</span>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 tracking-tight tabular-nums">100% Clean</span>
              <p className="text-xs text-emerald-700 font-bold mt-1">0 Failures</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
});
