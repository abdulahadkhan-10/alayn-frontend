"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";

interface OperationalPillar {
  id: string;
  category: string;
  title: string;
  traditionalProblem: string;
  traditionalImpact: string;
  alaynSolution: string;
  alaynImpact: string;
  statLabel: string;
  statValue: string;
}

const PILLARS: OperationalPillar[] = [
  {
    id: "pos",
    category: "Sales & Payments",
    title: "POS & Revenue Tracking",
    traditionalProblem: "Sales go unlogged during rush hours and offline connection drops, leaving revenue gaps at closing.",
    traditionalImpact: "Hours lost balancing registers manually",
    alaynSolution: "Offline-first POS ledger that automatically syncs sales and updates revenue totals the instant you reconnect.",
    alaynImpact: "1-click night closeout in under 60 seconds",
    statLabel: "Time Saved",
    statValue: "2 hrs / day",
  },
  {
    id: "kitchen",
    category: "Floor & Kitchen",
    title: "Table & Kitchen Sync",
    traditionalProblem: "Servers and kitchen staff rely on printed paper tickets that get lost, delayed, or miscommunicated.",
    traditionalImpact: "Delayed orders & upset guests",
    alaynSolution: "Live Kitchen Display System (KDS) synchronized instantly with table handhelds and order statuses.",
    alaynImpact: "Zero lost orders and faster table turnover",
    statLabel: "Order Drift",
    statValue: "0%",
  },
  {
    id: "inventory",
    category: "Stock & Ordering",
    title: "Inventory & Food Waste",
    traditionalProblem: "Key ingredients run out mid-service unannounced, and waste goes uncounted until monthly audits.",
    traditionalImpact: "Emergency stockouts & bloated food costs",
    alaynSolution: "Recipe-level stock deduction that auto-generates purchase orders before ingredients run dry.",
    alaynImpact: "Predictive low-stock alerts & automated POs",
    statLabel: "Stockout Reduction",
    statValue: "99%",
  },
  {
    id: "shifts",
    category: "Team & Scheduling",
    title: "Staff Shift Management",
    traditionalProblem: "Shift mix-ups, verbal availability changes, and double-booking lead to understaffed shifts.",
    traditionalImpact: "Strained staff & slow customer service",
    alaynSolution: "Intelligent roster scheduling with automated shift swaps, conflict checks, and mobile clock-ins.",
    alaynImpact: "Fair, error-free schedules published in minutes",
    statLabel: "Schedule Speed",
    statValue: "10x faster",
  },
];

export default function ChaosScene() {
  const [viewMode, setViewMode] = useState<"traditional" | "alayn">("traditional");
  const [selectedId, setSelectedId] = useState<string>("pos");

  const activePillar = PILLARS.find((p) => p.id === selectedId) || PILLARS[0];
  const isAlayn = viewMode === "alayn";

  return (
    <FieldScene
      id="chaos"
      domId="how-it-works"
      chaos={isAlayn ? 0.05 : 0.7}
      sync={isAlayn ? 0.95 : 0.05}
      presence={0.65}
      className="landing-section section-dark relative overflow-hidden bg-[#07080a] text-slate-100 py-16 sm:py-28"
      style={{ minHeight: "100vh" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12 pb-8 border-b border-white/10">
          <div className="max-w-3xl">
            <span style={{
              display: "inline-block",
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--amber)",
              marginBottom: "16px",
            }}>
              HOW ALAYN WORKS
            </span>

            <h2
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontWeight: 700,
                fontSize: "clamp(1.8rem, 4.2vw, 3.4rem)",
                lineHeight: 1.18,
                color: "#FFFFFF",
                letterSpacing: "-0.02em",
                marginBottom: "24px",
              }}
            >
              From daily operational chaos{" "}
              <br className="hidden sm:inline" />
              <span style={{ fontStyle: "italic", color: "var(--amber)", fontWeight: "400" }}>
                to complete clarity.
              </span>
            </h2>
          </div>

          <div className="max-w-md w-full">
            <p className="text-xs sm:text-base text-slate-400 leading-relaxed mb-6">
              Hospitality teams juggle dozens of moving parts every shift. See how Alayn replaces fragmented tools with a clean, unified workflow.
            </p>

            {/* Touch-Friendly Toggle */}
            <div className="flex w-full p-1 rounded-xl bg-slate-900 border border-white/10">
              <button
                onClick={() => setViewMode("traditional")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 min-h-[44px] flex items-center justify-center outline-none [-webkit-tap-highlight-color:transparent] border ${
                  !isAlayn
                    ? "bg-slate-700/50 text-white border-slate-600/50 shadow"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Traditional Operations
              </button>
              <button
                onClick={() => setViewMode("alayn")}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 min-h-[44px] flex items-center justify-center outline-none [-webkit-tap-highlight-color:transparent] border ${
                  isAlayn
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                With Alayn OS
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: 4 Core Pillars Selection */}
          <div className="lg:col-span-5 flex flex-col justify-start space-y-3">
            <div className="px-1 mb-1">
              <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                Select Operational Area
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {PILLARS.map((pillar) => {
                const isSelected = selectedId === pillar.id;
                return (
                  <button
                    key={pillar.id}
                    onClick={() => setSelectedId(pillar.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? isAlayn
                          ? "bg-slate-900 border-emerald-500/40 text-white shadow-lg"
                          : "bg-slate-900 border-rose-500/40 text-white shadow-lg"
                        : "bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        {pillar.category}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected
                            ? isAlayn
                              ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                              : "bg-rose-400 shadow-[0_0_8px_#f43f5e]"
                            : "bg-slate-700"
                        }`}
                      />
                    </div>
                    <h4 className="text-base font-semibold tracking-tight text-white">
                      {pillar.title}
                    </h4>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Solution Showcase */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="h-full p-2 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl flex flex-col justify-between">
              <div className="min-h-[420px] rounded-[calc(1.5rem-0.25rem)] bg-slate-950 p-6 sm:p-10 border border-white/5 flex flex-col justify-between relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activePillar.id}-${viewMode}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="space-y-6 flex flex-col justify-between h-full"
                  >
                    <div className="space-y-6">
                      {/* Header Tag */}
                      <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            isAlayn ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isAlayn ? "Alayn Automated Workflow" : "Traditional Manual Process"}
                        </span>
                        <span className="text-xs text-slate-400">
                          {activePillar.category}
                        </span>
                      </div>

                      {/* Main Title & Narrative */}
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-3">
                          {activePillar.title}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                          {isAlayn ? activePillar.alaynSolution : activePillar.traditionalProblem}
                        </p>
                      </div>

                      {/* Key Business Impact Box */}
                      <div
                        className={`p-4 rounded-xl border ${
                          isAlayn
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-200"
                        }`}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider block mb-1 opacity-80">
                          {isAlayn ? "Business Outcome" : "Operational Drag"}
                        </span>
                        <p className="text-sm font-medium">
                          {isAlayn ? activePillar.alaynImpact : activePillar.traditionalImpact}
                        </p>
                      </div>
                    </div>

                    {/* Always Rendered Equal Height Key Metric Footer */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                      <span>{isAlayn ? `${activePillar.statLabel}:` : "Traditional System Overhead:"}</span>
                      <span
                        className={`font-semibold ${
                          isAlayn ? "text-emerald-400 text-lg" : "text-rose-400 text-sm"
                        }`}
                      >
                        {isAlayn ? activePillar.statValue : "High Error & Delay Risk"}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FieldScene>
  );
}
