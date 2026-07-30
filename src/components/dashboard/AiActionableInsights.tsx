"use client";

import React, { memo } from "react";
import { Sparkles, ArrowRight, ShieldAlert, AlertTriangle, TrendingUp, Info, Check } from "lucide-react";
import { AiCommandInsightItem } from "@/types/dashboard";

interface AiActionableInsightsProps {
  insights?: AiCommandInsightItem[];
  onActionClick?: (item: AiCommandInsightItem) => void;
}

const COMMAND_CENTER_INSIGHTS: AiCommandInsightItem[] = [
  {
    id: "c1",
    type: "CRITICAL",
    title: "Milk Stockout Imminent",
    description: "Amul Full Cream Milk is projected to run out in 2 days based on weekend coffee sales velocity.",
    impact: "High Supply Risk",
    estimatedSavings: "₹18,400",
    estimatedRevenueImpact: "Protects ₹34,000 Sales",
    confidencePct: 96,
    timeSensitivity: "Action needed in 24h",
    recommendedAction: "Auto-Generate Purchase Order",
    outletName: "Main Outlet",
  },
  {
    id: "c2",
    type: "WARNING",
    title: "Supplier Lead-Time Degradation",
    description: "Verka Dairy has delayed deliveries for 3 consecutive purchase orders.",
    impact: "Vendor Alert",
    estimatedSavings: "₹12,000",
    confidencePct: 92,
    timeSensitivity: "Review within 48h",
    recommendedAction: "Switch Backup Supplier",
    outletName: "Bhendi Bazaar",
  },
  {
    id: "c3",
    type: "OPPORTUNITY",
    title: "Weekend Demand Surge Spike",
    description: "Friday evening dining demand is forecasted to increase +18%. Prepare +25 burger patties in advance.",
    impact: "+₹14,500 Revenue Opportunity",
    estimatedRevenueImpact: "+₹14,500",
    confidencePct: 94,
    timeSensitivity: "Prepare before Friday 5 PM",
    recommendedAction: "Adjust Kitchen Prep Roster",
    outletName: "Soho Branch",
  },
  {
    id: "c4",
    type: "INFO",
    title: "High Margin Beverage Promotion",
    description: "Iced Caramel Latte achieved the highest gross margin (81%) across all beverage categories this week.",
    impact: "Margin Expansion",
    estimatedSavings: "₹8,500",
    confidencePct: 98,
    timeSensitivity: "Ongoing Opportunity",
    recommendedAction: "Pin to POS Fast Keys",
    outletName: "Entire Business",
  },
];

export const AiActionableInsights = memo(function AiActionableInsights({
  insights = COMMAND_CENTER_INSIGHTS,
  onActionClick,
}: AiActionableInsightsProps) {
  return (
    <div className="w-full rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-6">
      {/* Command Center Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0B1221] text-white flex items-center justify-center border border-slate-800 shrink-0">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[#0B1221] tracking-tight">AI Command Center</h3>
            <p className="text-xs text-zinc-400 font-medium">Prioritized business recommendations with quantified financial impact</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
            AI Engine Confidence: 95.0%
          </span>
        </div>
      </div>

      {/* Grouped Recommendation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item) => {
          const isCritical = item.type === "CRITICAL";
          const isWarning = item.type === "WARNING";

          return (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-150 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                {/* Top Badges: Severity, Outlet & Time Sensitivity */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                      isCritical
                        ? "bg-red-50 text-[#D3232A] border border-red-200"
                        : isWarning
                        ? "bg-orange-50 text-orange-700 border border-orange-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {item.impact}
                  </span>

                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                    <span>{item.outletName}</span>
                    <span>·</span>
                    <span className="text-zinc-500 font-bold">{item.timeSensitivity}</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-[#0B1221] leading-snug">{item.title}</h4>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">{item.description}</p>

                {/* Quantified Financial Impact & AI Confidence */}
                <div className="flex items-center gap-3 pt-1 text-xs">
                  {item.estimatedSavings && (
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Savings: {item.estimatedSavings}
                    </span>
                  )}
                  {item.estimatedRevenueImpact && (
                    <span className="font-bold text-[#0B1221] bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200">
                      Impact: {item.estimatedRevenueImpact}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {item.confidencePct}% Model Confidence
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-zinc-200/60 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => onActionClick && onActionClick(item)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0B1221] px-4 py-2 text-xs font-bold text-white hover:bg-[#18181b] transition-colors cursor-pointer"
                >
                  <span>{item.recommendedAction}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#D3232A]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
