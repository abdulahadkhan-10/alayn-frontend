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
  HelpCircle,
  ArrowUpRight,
  Receipt,
  UtensilsCrossed,
  DollarSign,
  UserCheck,
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
      
      {/* 6 Responsive Double-Bezel Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {metrics.map((metric) => {
          const isUp = metric.isPositive;
          const IconComp = ICON_MAP[metric.iconName] || IndianRupee;

          return (
            <div
              key={metric.id}
              onClick={() => setSelectedMetric(metric)}
              className="group relative rounded-2xl bg-[#F8FAFC] p-1.5 ring-1 ring-zinc-950/5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out cursor-pointer"
            >
              <div className="rounded-xl bg-white p-5 h-full flex flex-col justify-between border border-zinc-200/60 transition-colors group-hover:border-zinc-300 space-y-4">
                
                {/* Header Row: Icon, Title & Tooltip */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-center text-[#1B2A4A] shrink-0 group-hover:bg-zinc-100 transition-colors">
                      <IconComp className="h-5 w-5 text-[#1B2A4A]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 truncate" title={metric.title}>
                        {metric.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 font-medium truncate">
                        Prev: <strong className="text-zinc-600 font-semibold">{metric.prevPeriodValue}</strong>
                      </p>
                    </div>
                  </div>

                  <div
                    className="relative group/tooltip shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HelpCircle className="h-4 w-4 text-zinc-300 hover:text-zinc-500 transition-colors" />
                    <div className="absolute right-0 top-6 hidden group-hover/tooltip:block w-52 p-3 bg-[#1B2A4A] text-white text-[11px] rounded-xl shadow-xl z-30 pointer-events-none leading-relaxed">
                      {metric.tooltip}
                    </div>
                  </div>
                </div>

                {/* Main Metric Value & Change Badge */}
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#1B2A4A] tracking-tight tabular-nums">
                    {metric.value}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${
                      isUp
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : "bg-rose-50 text-[#D3232A] border border-red-200/80"
                    }`}
                  >
                    {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {metric.change}
                  </span>
                </div>

                {/* Bottom Row: Inline Sparkline Bar Stack & Insight */}
                <div className="pt-3 border-t border-zinc-100 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="h-4 w-28 flex items-end gap-1">
                      {metric.sparkline.map((val, i) => {
                        const max = Math.max(...metric.sparkline, 1);
                        const pct = Math.max((val / max) * 100, 18);
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

                    <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-[#1B2A4A] flex items-center gap-0.5 transition-colors shrink-0">
                      Details <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 font-medium leading-tight truncate">
                    {metric.insightSentence}
                  </p>
                </div>

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
