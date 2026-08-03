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
    <div className="w-full rounded-2xl bg-[#F8FAFC] p-1.5 ring-1 ring-zinc-950/5 shadow-2xs h-full flex flex-col justify-between">
      <div className="rounded-xl bg-white p-5 sm:p-6 border border-zinc-200/60 h-full flex flex-col justify-between space-y-4">
        
        {/* Command Center Header */}
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3.5">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center border border-slate-800 shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-extrabold text-[#1B2A4A] tracking-tight truncate">AI Operational Copilot</h3>
              <p className="text-xs text-zinc-400 font-medium truncate">Automated recommendations with quantified financial impact</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200/80 whitespace-nowrap font-mono">
              AI Confidence: 95.0%
            </span>
          </div>
        </div>

        {/* Recommendation Vertical Stack */}
        <div className="flex flex-col gap-3">
          {insights.map((item) => {
            const isCritical = item.type === "CRITICAL";
            const isWarning = item.type === "WARNING";

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-zinc-200/80 bg-zinc-50/60 hover:bg-zinc-50 transition-all flex flex-col justify-between gap-2.5 min-w-0"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                          isCritical
                            ? "bg-red-50 text-[#D3232A] border border-red-200"
                            : isWarning
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-blue-50 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {isCritical ? <ShieldAlert className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {item.type}
                      </span>
                      <span className="text-[11px] font-semibold text-zinc-500">{item.outletName}</span>
                    </div>
                    <span className="text-[10.5px] font-medium text-zinc-400 font-mono">{item.timeSensitivity}</span>
                  </div>

                  <h4 className="text-sm font-bold text-[#1B2A4A] leading-snug">{item.title}</h4>
                  <p className="text-xs text-zinc-600 font-medium leading-normal">{item.description}</p>
                </div>

                <div className="pt-2 border-t border-zinc-200/60 flex items-center justify-between gap-2 flex-wrap text-xs">
                  <span className="font-bold text-emerald-700 tabular-nums">
                    Impact: {item.estimatedRevenueImpact || item.estimatedSavings}
                  </span>
                  <button
                    type="button"
                    onClick={() => onActionClick && onActionClick(item)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1B2A4A] hover:text-[#D3232A] transition-colors cursor-pointer"
                  >
                    <span>{item.recommendedAction}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
});
