"use client";

import React, { memo, useState } from "react";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Users,
  Percent,
  Star,
  Trash2,
  Package,
  Clock,
  HelpCircle,
  ArrowUpRight,
  Receipt,
  UtensilsCrossed,
  DollarSign,
  UserCheck,
  Building2,
} from "lucide-react";
import { ExecutiveKpiMetric } from "@/types/dashboard";
import { KpiDrillDownDrawer } from "./KpiDrillDownDrawer";

interface ExecutiveKpiGridProps {
  metrics: ExecutiveKpiMetric[];
}

const ICON_MAP: Record<string, any> = {
  revenue: IndianRupee,
  sales: Receipt,
  profit: TrendingUp,
  margin: Percent,
  orders: UtensilsCrossed,
  aov: DollarSign,
  guests: Users,
  foodcost: ShoppingBag,
  inventory: Package,
  waste: Trash2,
  rating: Star,
  labor: UserCheck,
};

export const ExecutiveKpiGrid = memo(function ExecutiveKpiGrid({
  metrics,
}: ExecutiveKpiGridProps) {
  const [selectedMetric, setSelectedMetric] = useState<ExecutiveKpiMetric | null>(null);

  return (
    <section aria-label="Executive KPIs" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0B1221] tracking-tight">Executive Telemetry</h2>
          <p className="text-xs text-zinc-400 font-medium">Click any metric card for instant historical drill-down telemetry</p>
        </div>
        <span className="text-xs font-bold text-zinc-600 bg-zinc-100 px-3 py-1 rounded-xl border border-zinc-200/80">
          12 Active Metrics
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const isUp = metric.isPositive;
          const IconComp = ICON_MAP[metric.iconName] || IndianRupee;

          return (
            <div
              key={metric.id}
              onClick={() => setSelectedMetric(metric)}
              className="group relative rounded-2xl bg-white p-5 shadow-2xs border border-zinc-200/80 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header Row: Premium Icon Container & Title */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center text-[#0B1221] shrink-0 group-hover:bg-zinc-100 transition-colors">
                      <IconComp className="h-4.5 w-4.5 text-[#0B1221]" />
                    </div>
                    <span className="text-xs font-bold text-zinc-600 truncate">{metric.title}</span>
                  </div>

                  <div
                    className="relative group/tooltip"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-zinc-300 hover:text-zinc-500 transition-colors" />
                    <div className="absolute right-0 top-5 hidden group-hover/tooltip:block w-48 p-2.5 bg-[#0B1221] text-white text-[11px] rounded-xl shadow-xl z-30 pointer-events-none">
                      {metric.tooltip}
                    </div>
                  </div>
                </div>

                {/* Primary Metric Value & Trend Badge */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-extrabold text-[#0B1221] tracking-tight leading-none">
                    {metric.value}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isUp
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-[#D3232A] border border-red-200"
                    }`}
                  >
                    {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {metric.change}
                  </span>
                </div>

                {/* Previous Period Comparison */}
                <p className="text-[11px] text-zinc-400 font-medium">
                  Prev Period: <strong className="text-zinc-700">{metric.prevPeriodValue}</strong>
                </p>
              </div>

              {/* Bottom Row: Mini Sparkline & Tiny Insight Sentence */}
              <div className="mt-4 pt-3 border-t border-zinc-100 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {/* Inline Sparkline */}
                  <div className="h-5 w-24 flex items-end gap-0.5">
                    {metric.sparkline.map((val, i) => {
                      const max = Math.max(...metric.sparkline, 1);
                      const pct = Math.max((val / max) * 100, 15);
                      return (
                        <div
                          key={i}
                          className={`flex-1 rounded-xs transition-all ${
                            isUp ? "bg-emerald-400 group-hover:bg-emerald-500" : "bg-[#D3232A] group-hover:bg-rose-600"
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      );
                    })}
                  </div>

                  <span className="text-[10.5px] font-semibold text-zinc-400 group-hover:text-[#0B1221] flex items-center gap-0.5 transition-colors">
                    Details <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                <p className="text-[10.5px] text-zinc-500 font-medium leading-tight truncate">
                  {metric.insightSentence}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <KpiDrillDownDrawer
        metric={selectedMetric}
        onClose={() => setSelectedMetric(null)}
      />
    </section>
  );
});
