"use client";

import React from "react";

interface StatCardProps {
  icon: React.ReactNode;
  iconCls: string;
  label: string;
  value: string;
  sub?: string;
  pulse?: boolean;
}

export default function InventoryStatCard({
  icon,
  iconCls,
  label,
  value,
  sub,
  pulse = false,
}: StatCardProps) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-zinc-200/70 bg-white p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
      <div className={`rounded-xl p-3 shrink-0 ${iconCls} ${pulse ? "animate-pulse" : ""}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 leading-tight mt-0.5">{value}</p>
        {sub && <p className="text-xs text-zinc-500 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

