"use client";

import React, { useRef } from "react";
import { Check, Lock } from "lucide-react";
import { AGGREGATOR_NAMES, formatRupees, PlanCode, PLANS, SECOND_AGGREGATOR } from "@/lib/pricing";
import type { PlanChoice } from "./SubscriptionMonthSelector";

const FEATURES: Record<PlanCode, string[]> = {
  ALAYN_BASIC: [
    "POS, table QR & kitchen display",
    "Inventory, POs & waste tracking",
    "Reports, staff logins & daily AI",
    "Quickii direct link (coming soon)",
  ],
  ALAYN_PRO: [
    "Everything in Basic",
    "Shifts, attendance & leave",
    "Full AI: stock, staff & forecasts",
    "Swiggy or Zomato (coming soon)",
  ],
};

type DeliveryOption = "SWIGGY" | "ZOMATO" | "BOTH";

const DELIVERY_OPTIONS: readonly { id: DeliveryOption; label: string }[] = [
  { id: "SWIGGY", label: AGGREGATOR_NAMES.SWIGGY },
  { id: "ZOMATO", label: AGGREGATOR_NAMES.ZOMATO },
  { id: "BOTH", label: "Both" },
];

interface PlanPickerProps {
  value: PlanChoice;
  onChange: (choice: PlanChoice) => void;
  /** The outlet's current plan while it is active: shown as "Current", and Basic can't be picked from Pro */
  currentPlan?: PlanCode | null;
  /** Active delivery apps on the current subscription, so active 2-app Pro branches can't downgrade mid-cycle */
  currentAggregators?: string[];
  disabled?: boolean;
}

/** Basic or Pro, and for Pro, Swiggy, Zomato or both */
export default function PlanPicker({
  value,
  onChange,
  currentPlan = null,
  currentAggregators = [],
  disabled = false,
}: PlanPickerProps) {
  const radioRefs = useRef<Record<DeliveryOption, HTMLButtonElement | null>>({
    SWIGGY: null,
    ZOMATO: null,
    BOTH: null,
  });

  const lockedToBoth = currentPlan === "ALAYN_PRO" && currentAggregators.length >= 2;

  const pick = (planCode: PlanCode) => {
    if (disabled || planCode === value.planCode) return;
    onChange({
      planCode,
      aggregators: planCode === "ALAYN_PRO" ? (lockedToBoth ? ["SWIGGY", "ZOMATO"] : ["SWIGGY"]) : [],
    });
  };

  const selectedDelivery: DeliveryOption =
    value.aggregators.length >= 2
      ? "BOTH"
      : value.aggregators[0] === "ZOMATO"
        ? "ZOMATO"
        : "SWIGGY";

  const selectDelivery = (opt: DeliveryOption, focus = false) => {
    if (disabled) return;
    if (lockedToBoth && opt !== "BOTH") return;
    if (opt === "BOTH") {
      onChange({ planCode: "ALAYN_PRO", aggregators: ["SWIGGY", "ZOMATO"] });
    } else {
      onChange({ planCode: "ALAYN_PRO", aggregators: [opt] });
    }
    if (focus) radioRefs.current[opt]?.focus();
  };

  const handleDeliveryKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: DeliveryOption) => {
    if (lockedToBoth) return;
    const enabled = DELIVERY_OPTIONS.map((o) => o.id);
    const idx = enabled.indexOf(current);
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      selectDelivery(enabled[(idx + 1) % enabled.length], true);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      selectDelivery(enabled[(idx - 1 + enabled.length) % enabled.length], true);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              className={`relative flex flex-col text-left rounded-xl border p-3.5 transition-colors duration-150 ${
                selected
                  ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50/40"
                  : "border-slate-200 bg-white hover:border-slate-300"
              } ${disabled || locked ? "opacity-55 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{plan.name}</span>
                  {currentPlan === code && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                      Current
                    </span>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 ${
                    selected
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {selected && <Check className="h-2.5 w-2.5 stroke-[2.75]" />}
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-600 tabular-nums">
                <span className="font-semibold text-slate-900">{formatRupees(plan.monthly)}</span>/mo
                <span className="mx-1 text-slate-300">·</span>
                <span>{formatRupees(plan.yearly)}/yr</span>
                <span className="text-slate-400"> + GST</span>
              </p>

              <ul className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
                {FEATURES[code].map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11.5px] leading-snug text-slate-600">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-slate-400 stroke-[2]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {locked && (
                <p className="mt-2.5 flex items-center gap-1 text-[10.5px] font-medium text-slate-500">
                  <Lock className="h-3 w-3 shrink-0" /> Available after current Pro period ends
                </p>
              )}
            </button>
          );
        })}
      </div>

      {value.planCode === "ALAYN_PRO" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-800">
              Delivery partner <span className="font-normal text-slate-400">(coming soon)</span>
            </p>
            <p className="text-[11px] text-slate-500 tabular-nums">
              {lockedToBoth
                ? "Both Swiggy & Zomato active on current period"
                : `1 included · Both +${formatRupees(SECOND_AGGREGATOR.monthly)}/mo (+${formatRupees(SECOND_AGGREGATOR.yearly)}/yr)`}
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Delivery partner"
            className="inline-grid grid-cols-3 rounded-lg bg-slate-200/70 p-0.5 shrink-0"
          >
            {DELIVERY_OPTIONS.map((opt) => {
              const active = selectedDelivery === opt.id;
              const optDisabled = disabled || (lockedToBoth && opt.id !== "BOTH");
              return (
                <button
                  key={opt.id}
                  ref={(el) => {
                    radioRefs.current[opt.id] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  tabIndex={active ? 0 : -1}
                  disabled={optDisabled}
                  onClick={() => selectDelivery(opt.id)}
                  onKeyDown={(e) => handleDeliveryKeyDown(e, opt.id)}
                  className={`rounded-md px-3 py-1 text-xs transition-colors duration-150 ${
                    active
                      ? "bg-white font-semibold text-slate-900 shadow-2xs"
                      : "font-medium text-slate-600 hover:text-slate-900"
                  } ${optDisabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
