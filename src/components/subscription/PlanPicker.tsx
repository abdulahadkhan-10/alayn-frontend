"use client";

import React from "react";
import { Check, Lock } from "lucide-react";
import { AGGREGATOR_NAMES, Aggregator, BASIC_AI_QUESTIONS, formatRupees, PlanCode, PLANS, SECOND_AGGREGATOR } from "@/lib/pricing";
import type { PlanChoice } from "./SubscriptionMonthSelector";

const FEATURES: Record<PlanCode, string[]> = {
  ALAYN_BASIC: [
    "POS billing, table QR menus and kitchen display",
    "Inventory, purchase orders and waste tracking",
    "Sales reports and staff logins",
    `Ask Alayn AI: ${BASIC_AI_QUESTIONS} sales and menu questions a day`,
    "Quickii delivery portal (coming soon)",
  ],
  ALAYN_PRO: [
    "Everything in Basic",
    "Shift scheduling, attendance and leave",
    "Full Ask Alayn AI: stock, staff and forecasts",
    "Swiggy or Zomato included (coming soon)",
  ],
};

interface PlanPickerProps {
  value: PlanChoice;
  onChange: (choice: PlanChoice) => void;
  /** The outlet's current plan while it is active: shown as "Current", and Basic can't be picked from Pro */
  currentPlan?: PlanCode | null;
  disabled?: boolean;
}

/** Basic or Pro, and for Pro, Swiggy, Zomato or both */
export default function PlanPicker({ value, onChange, currentPlan = null, disabled = false }: PlanPickerProps) {
  const pick = (planCode: PlanCode) => {
    if (disabled || planCode === value.planCode) return;
    onChange({ planCode, aggregators: planCode === "ALAYN_PRO" ? ["SWIGGY"] : [] });
  };
  const both = value.aggregators.length >= 2;
  const pickApp = (app: Aggregator) => !disabled && onChange({ planCode: "ALAYN_PRO", aggregators: both ? ["SWIGGY", "ZOMATO"] : [app] });
  const toggleBoth = () =>
    !disabled && onChange({ planCode: "ALAYN_PRO", aggregators: both ? [value.aggregators[0] ?? "SWIGGY"] : ["SWIGGY", "ZOMATO"] });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(Object.keys(PLANS) as PlanCode[]).map((code) => {
          const plan = PLANS[code];
          const selected = value.planCode === code;
          const locked = currentPlan === "ALAYN_PRO" && code === "ALAYN_BASIC";
          return (
            <button
              key={code}
              type="button"
              disabled={disabled || locked}
              onClick={() => pick(code)}
              aria-pressed={selected}
              className={`relative text-left rounded-2xl border p-4 transition-all duration-150 ${
                selected
                  ? "border-[#D3232A] bg-red-50/40 ring-2 ring-[#D3232A]/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${disabled || locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-zinc-900">{plan.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {formatRupees(plan.monthly)}/mo or {formatRupees(plan.yearly)}/yr + GST
                  </p>
                </div>
                {currentPlan === code ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600">Current</span>
                ) : code === "ALAYN_PRO" ? (
                  <span className="rounded-full bg-[#D3232A] px-2 py-0.5 text-[10px] font-bold text-white">Popular</span>
                ) : null}
              </div>
              <ul className="mt-3 space-y-1.5">
                {FEATURES[code].map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] font-medium text-zinc-700">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {locked && (
                <p className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
                  <Lock className="h-3 w-3" /> You can move to Basic once your Pro period ends
                </p>
              )}
            </button>
          );
        })}
      </div>

      {value.planCode === "ALAYN_PRO" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-bold text-zinc-800">
            Delivery app included with Pro <span className="font-medium text-zinc-500">(integration coming soon)</span>
          </p>
          {!both && (
            <div className="flex gap-2" role="radiogroup" aria-label="Delivery app">
              {(Object.keys(AGGREGATOR_NAMES) as Aggregator[]).map((app) => (
                <button
                  key={app}
                  type="button"
                  role="radio"
                  aria-checked={value.aggregators[0] === app}
                  disabled={disabled}
                  onClick={() => pickApp(app)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${
                    value.aggregators[0] === app
                      ? "border-[#D3232A] bg-white text-[#D3232A]"
                      : "border-slate-200 bg-white text-zinc-600 hover:border-slate-300"
                  }`}
                >
                  {AGGREGATOR_NAMES[app]}
                </button>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
            <input type="checkbox" checked={both} onChange={toggleBoth} disabled={disabled} className="h-4 w-4 accent-[#D3232A]" />
            Both Swiggy and Zomato (+{formatRupees(SECOND_AGGREGATOR.monthly)}/mo or +{formatRupees(SECOND_AGGREGATOR.yearly)}/yr + GST)
          </label>
        </div>
      )}
    </div>
  );
}
