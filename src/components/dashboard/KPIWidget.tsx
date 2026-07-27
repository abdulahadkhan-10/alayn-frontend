"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";

interface KPIWidgetProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  icon: LucideIcon;
  badge?: string;
}

export default function KPIWidget({
  title,
  value,
  change,
  isPositive = true,
  subtext,
  icon: Icon,
  badge,
}: KPIWidgetProps) {
  return (
    <div className="rounded-xl bg-white p-4 sm:p-5 shadow-xs border border-gray-200/80 hover:border-gray-300 transition-all duration-200 flex flex-col justify-between min-w-0">
      <div>
        {/* Top Row: Icon + Change Badge */}
        <div className="flex items-center justify-between mb-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
            <Icon className="h-4.5 w-4.5" />
          </div>

          {change && (
            <div
              className={`flex shrink-0 items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : "bg-rose-50 text-rose-700 border border-rose-200/60"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              <span>{change}</span>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="min-w-0 mb-1.5">
          <p
            className="text-xs font-bold uppercase tracking-wider text-gray-500 leading-snug"
            title={title}
          >
            {title}
          </p>
          {badge && (
            <span className="inline-block rounded-md bg-blue-50 px-1.5 py-0.2 text-[9px] font-semibold text-blue-700 border border-blue-100 mt-0.5">
              {badge}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mt-1">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 leading-none">
            {value}
          </h3>
        </div>
      </div>

      {/* Subtext */}
      {subtext && (
        <p className="mt-2.5 text-[11px] font-medium text-gray-500 leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
}
