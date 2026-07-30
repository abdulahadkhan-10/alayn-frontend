"use client";

import React, { memo } from "react";
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, ShieldAlert } from "lucide-react";

interface StructuredBriefing {
  positives: string[];
  warnings: string[];
  recommendations: string[];
}

const BRIEFING_DATA: StructuredBriefing = {
  positives: [
    "Overall revenue increased 18.4% compared to the previous period across active outlets.",
    "Saturday dining room volume reached a peak of +24% higher sales than weekday average.",
    "Beverage & Specialty Coffee category sales grew 31% with high gross margins (81%).",
  ],
  warnings: [
    "Food cost is 3.4% above target threshold in Outlet 3 (Bhendi Bazaar Express).",
    "Supplier Verka Dairy delayed 3 consecutive purchase order deliveries this week.",
    "Inventory waste increased by 4% in dairy stock due to over-ordering buffer sizes.",
  ],
  recommendations: [
    "Reduce weekly dairy order buffer by 8% to prevent spoilage and save ~₹14,000 monthly.",
    "Prepare +25 burger patties in advance for Friday evening peak demand spike.",
    "Feature high-margin Iced Caramel Latte on primary POS quick-keys across all branches.",
  ],
};

export const ExecutiveSummaryCard = memo(function ExecutiveSummaryCard() {
  return (
    <div className="w-full rounded-2xl bg-[#0B1221] p-6 text-white shadow-md border border-slate-800 space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 border border-white/10 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Executive Intelligence Briefing</h2>
            <p className="text-xs text-slate-400 font-medium">CEO-level operational synthesis across telemetry streams</p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1 rounded-xl border border-slate-700">
          Telemetry Period: Active MTD
        </span>
      </div>

      {/* 3 Distinct Structured Columns: Positives, Warnings, Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Section 1: Positive Achievements */}
        <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-white/10 pb-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Positive Achievements</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-200 font-medium leading-relaxed">
            {BRIEFING_DATA.positives.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 2: Warnings & Cost Risks */}
        <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-orange-400 border-b border-white/10 pb-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Warnings &amp; Cost Risks</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-200 font-medium leading-relaxed">
            {BRIEFING_DATA.warnings.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400 shrink-0 mt-1.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Strategic Recommendations */}
        <div className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 text-[#D3232A] border-b border-white/10 pb-2">
            <Lightbulb className="h-4 w-4 shrink-0 text-[#D3232A]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-400">Strategic Actions</h3>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-200 font-medium leading-relaxed">
            {BRIEFING_DATA.recommendations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#D3232A] shrink-0 mt-1.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});
