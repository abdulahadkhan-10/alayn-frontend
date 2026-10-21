"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DietaryType } from "./menuFormat";

const DIETARY_LABEL: Record<DietaryType, string> = { VEG: "Vegetarian", NON_VEG: "Non-vegetarian", VEGAN: "Vegan" };

/** The square food mark Indian diners read at a glance: green dot for veg, red triangle for non-veg */
export function DietaryMark({ type, className }: { type: DietaryType; className?: string }) {
  const tone = type === "NON_VEG" ? "border-[#B3261E] text-[#B3261E]" : type === "VEGAN" ? "border-[#0F766E] text-[#0F766E]" : "border-[#15803D] text-[#15803D]";
  return (
    <span
      role="img"
      aria-label={DIETARY_LABEL[type]}
      title={DIETARY_LABEL[type]}
      className={cn("inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-[1.5px]", tone, className)}
    >
      {type === "NON_VEG" ? (
        <svg viewBox="0 0 10 10" className="h-2 w-2 fill-current" aria-hidden="true">
          <path d="M5 1.2 9 8.6H1z" />
        </svg>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
    </span>
  );
}

interface QuantityStepperProps {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  /** What is being counted, for screen readers, e.g. "Paneer Tikka" */
  label: string;
  size?: "sm" | "md";
  className?: string;
}

/** − 2 + control. "sm" fits under a dish photo; "md" is used in sheets */
export function QuantityStepper({ value, onDecrement, onIncrement, label, size = "md", className }: QuantityStepperProps) {
  const button =
    "inline-flex h-full items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--amber) active:bg-[#C41E2A]/10";
  return (
    <div
      role="group"
      aria-label={`${label} quantity`}
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-xl border border-[#C41E2A]/25 bg-white text-(--amber) shadow-[0_1px_2px_rgba(11,18,32,0.06)]",
        size === "sm" ? "h-10 w-[104px]" : "h-11 w-[120px]",
        className
      )}
    >
      <button type="button" onClick={onDecrement} aria-label={value === 1 ? `Remove ${label}` : `One less ${label}`} className={cn(button, "w-1/3")}>
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span aria-live="polite" className="flex w-1/3 items-center justify-center text-[15px] font-bold tabular-nums">
        {value}
      </span>
      <button type="button" onClick={onIncrement} aria-label={`One more ${label}`} className={cn(button, "w-1/3")}>
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
