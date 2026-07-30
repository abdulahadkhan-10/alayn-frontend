"use client";

import React, { memo } from "react";
import { Sparkles, TrendingUp, ShieldCheck, ArrowRight } from "lucide-react";

interface ForecastWidgetData {
  dimension: string;
  projection: string;
  expectedImpact: string;
  trendPct: string;
  confidencePct: number;
  recommendation: string;
}

const FORECAST_WIDGETS: ForecastWidgetData[] = [
  {
    dimension: "Weekend Sales Projection",
    projection: "₹2,45,000",
    expectedImpact: "+₹38,000 Revenue",
    trendPct: "+18.4%",
    confidencePct: 94,
    recommendation: "Increase dining room floor staff by 2 servers for Saturday dinner peak.",
  },
  {
    dimension: "Order Demand Volume",
    projection: "1,120 Orders",
    expectedImpact: "+140 Order Volume",
    trendPct: "+12.0%",
    confidencePct: 91,
    recommendation: "Ensure POS registers and QR table order channels are active.",
  },
  {
    dimension: "Suggested Purchasing PO",
    projection: "₹42,000 PO",
    expectedImpact: "Prevents Stockout",
    trendPct: "Optimized",
    confidencePct: 96,
    recommendation: "Auto-order 50L full cream milk and 15kg espresso beans from primary vendors.",
  },
  {
    dimension: "Labour Hour Demand",
    projection: "184 Staff Hrs",
    expectedImpact: "100% Coverage",
    trendPct: "+8.5%",
    confidencePct: 92,
    recommendation: "Schedule kitchen prep team 1 hour earlier on Friday afternoon.",
  },
];

export const ForecastingModule = memo(function ForecastingModule() {
  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-50 text-[#D3232A] flex items-center justify-center border border-red-100 shrink-0">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B1221] tracking-tight">Predictive Forecasting Engine</h3>
            <p className="text-xs text-zinc-400 font-medium">Machine-learned projections for sales, stock depletion &amp; labor scheduling</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
          Average Model Confidence: 93.2%
        </span>
      </div>

      {/* Grid of 4 Forecasting Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FORECAST_WIDGETS.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 transition-all duration-150 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-400">{item.dimension}</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {item.confidencePct}% Confidence
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-extrabold text-[#0B1221] tracking-tight">{item.projection}</p>
                <span className="text-xs font-bold text-emerald-700">{item.trendPct}</span>
              </div>

              {/* Confidence Visualization Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-zinc-400 font-semibold">
                  <span>Confidence Gauge</span>
                  <span>{item.confidencePct}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.confidencePct}%` }} />
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-600 font-medium leading-relaxed border-t border-zinc-200/60 pt-3">
              <strong className="text-[#0B1221]">Action:</strong> {item.recommendation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});
