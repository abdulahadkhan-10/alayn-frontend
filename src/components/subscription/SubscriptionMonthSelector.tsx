"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { Aggregator, allowedMonths, basePriceFor, billsMonthly, formatRupees, GST_PERCENT, MAX_MONTHS, PlanCode, PLANS, SECOND_AGGREGATOR } from "@/lib/pricing";

/** The plan being bought: Basic, or Pro with Swiggy and/or Zomato */
export interface PlanChoice {
  planCode: PlanCode;
  aggregators: Aggregator[];
}

interface SubscriptionMonthSelectorProps {
  months: number;
  plan: PlanChoice;
  /** Value of the days left on the current plan, when changing plan */
  creditRupees?: number;
  /** A plan change starts now instead of after the current end */
  startsNow?: boolean;
  onChange: (months: number) => void;
  currentPeriodEnd?: string | null;
  disabled?: boolean;
  coupon?: {
    code: string;
    discountType: string;
    discountValue: number;
  } | null;
  /** Hide the final total row when rendered inside a modal that displays the total in a sticky footer */
  hideTotalRow?: boolean;
  /** Optional slot rendered below the tax line (e.g. promo code control) */
  promoSlot?: React.ReactNode;
}

/** Monthly and yearly price of a plan choice, before GST. Monthly is null for a yearly-only plan. */
export function planPrices(plan: PlanChoice) {
  const both = plan.planCode === "ALAYN_PRO" && plan.aggregators.length >= 2;
  const monthly = PLANS[plan.planCode].monthly;
  return {
    monthly: monthly === null ? null : monthly + (both ? SECOND_AGGREGATOR.monthly : 0),
    yearly: PLANS[plan.planCode].yearly + (both ? SECOND_AGGREGATOR.yearly : 0),
  };
}

export function presetOptions(plan: PlanChoice) {
  const { monthly, yearly } = planPrices(plan);
  if (monthly === null) {
    // Basic is sold by the year only
    return [1, 2, 3].map((years) => ({
      months: years * 12,
      label: years === 1 ? "1 Year" : `${years} Years`,
      subtitle: formatRupees(yearly * years),
      badge: undefined as string | undefined,
    }));
  }
  const saving = monthly * 12 - yearly;
  const pct = monthly > 0 ? Math.floor((saving / (monthly * 12)) * 100) : 0;
  return [
    { months: 1, label: "1 Month", subtitle: formatRupees(monthly) },
    { months: 3, label: "3 Months", subtitle: formatRupees(monthly * 3) },
    { months: 6, label: "6 Months", subtitle: formatRupees(monthly * 6) },
    {
      months: 12,
      label: "1 Year",
      subtitle: formatRupees(yearly),
      badge: saving > 0 ? `-${pct}%` : undefined,
    },
  ];
}

/** Mirrors what the server charges (it decides; this is for showing the price) */
export function calculateSubscriptionPricing(
  months: number,
  coupon: { discountType: string; discountValue: number } | null | undefined,
  plan: PlanChoice,
  creditRupees = 0
) {
  const gstRatePercent = GST_PERCENT;
  const safeMonths = allowedMonths(plan.planCode, months);
  const planTotal = basePriceFor(plan.planCode, safeMonths, plan.aggregators.length);
  const credit = Math.min(planTotal, Math.max(0, creditRupees));
  const rawBaseTotal = Math.round((planTotal - credit) * 100) / 100;
  let discountRupees = 0;
  if (coupon) {
    if (coupon.discountType === "PERCENTAGE") {
      discountRupees = Math.round(((rawBaseTotal * coupon.discountValue) / 100) * 100) / 100;
    } else {
      discountRupees = Math.min(rawBaseTotal, coupon.discountValue);
    }
  }
  const baseTotal = Math.max(0, rawBaseTotal - discountRupees);
  const gstTotal = Math.round(((baseTotal * gstRatePercent) / 100) * 100) / 100;
  const grandTotal = Math.round((baseTotal + gstTotal) * 100) / 100;

  return {
    months: safeMonths,
    planTotal,
    credit,
    rawBaseTotal,
    discountRupees,
    baseTotal,
    gstTotal,
    grandTotal,
    baseTotalPaise: Math.round(baseTotal * 100),
    gstTotalPaise: Math.round(gstTotal * 100),
    grandTotalPaise: Math.round(grandTotal * 100),
  };
}

/** "1 month", "1 year", "1 year + 2 months" */
function durationLabel(months: number) {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [
    years ? `${years} ${years === 1 ? "year" : "years"}` : "",
    rest ? `${rest} ${rest === 1 ? "month" : "months"}` : "",
  ].filter(Boolean);
  return parts.join(" + ");
}

export function addCalendarMonths(startDate: Date, months: number): Date {
  const result = new Date(startDate.getTime());
  const originalDate = result.getDate();
  result.setMonth(result.getMonth() + months);
  // Handle month-end boundary conditions (e.g., Jan 31 + 1 month -> Feb 28/29)
  if (result.getDate() !== originalDate) {
    result.setDate(0);
  }
  return result;
}

export function calculateProjectedEndDate(months: number, currentPeriodEnd?: string | null, startsNow = false): Date {
  const safeMonths = Math.max(1, Math.min(36, months || 1));
  const now = new Date();
  const existingEnd = currentPeriodEnd && !startsNow ? new Date(currentPeriodEnd) : null;
  const startDate = existingEnd && existingEnd > now ? existingEnd : now;

  return addCalendarMonths(startDate, safeMonths);
}

export default function SubscriptionMonthSelector({
  months,
  plan,
  creditRupees = 0,
  startsNow = false,
  onChange,
  currentPeriodEnd,
  disabled = false,
  coupon = null,
  hideTotalRow = false,
  promoSlot,
}: SubscriptionMonthSelectorProps) {
  // A yearly-only plan (Basic) is bought in whole years: snap a month count picked on Pro to the next year
  const step = billsMonthly(plan.planCode) ? 1 : 12;
  React.useEffect(() => {
    const allowed = allowedMonths(plan.planCode, months);
    if (allowed !== months) onChange(allowed);
  }, [plan.planCode, months, onChange]);

  const pricing = calculateSubscriptionPricing(months, coupon, plan, creditRupees);
  const projectedEnd = calculateProjectedEndDate(months, currentPeriodEnd, startsNow);
  const prices = planPrices(plan);
  const presets = presetOptions(plan);

  const handlePresetSelect = (m: number) => {
    if (disabled) return;
    onChange(m);
  };

  const handleIncrement = () => {
    if (disabled || months + step > MAX_MONTHS) return;
    onChange(months + step);
  };

  const handleDecrement = () => {
    if (disabled || months - step < step) return;
    onChange(months - step);
  };

  const now = new Date();
  const existingEnd = currentPeriodEnd && !startsNow ? new Date(currentPeriodEnd) : null;
  const effectiveStartDate = existingEnd && existingEnd > now ? existingEnd : now;
  const daysDiff = Math.max(1, Math.round((projectedEnd.getTime() - effectiveStartDate.getTime()) / (1000 * 60 * 60 * 24)));

  const formattedEndDate = projectedEnd.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isExtending = !startsNow && currentPeriodEnd && new Date(currentPeriodEnd) > new Date();

  return (
    <div className="space-y-4">
      {/* Duration Section */}
      <div className="border-t border-slate-100 pt-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-700">Billing duration</span>
          <span className="text-xs text-slate-500 tabular-nums">
            {isExtending ? "Extends until" : "Valid until"}{" "}
            <strong className="font-medium text-slate-800">{formattedEndDate}</strong> ({daysDiff}d)
          </span>
        </div>

        {/* Preset Tiles */}
        <div className={`grid gap-2 ${presets.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"}`}>
          {presets.map((preset) => {
            const isSelected = months === preset.months;
            return (
              <button
                key={preset.months}
                type="button"
                disabled={disabled}
                onClick={() => handlePresetSelect(preset.months)}
                aria-pressed={isSelected}
                className={`flex flex-col items-start justify-between rounded-xl border px-3 py-2.5 text-left transition-colors duration-150 select-none ${
                  isSelected
                    ? "border-slate-900 ring-1 ring-slate-900 bg-slate-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex w-full items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-slate-900">{preset.label}</span>
                  {preset.badge && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 tabular-nums">
                      {preset.badge}
                    </span>
                  )}
                </div>
                <span className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                  {preset.subtitle}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Month Stepper */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs text-slate-500">
            Custom duration <span className="text-slate-400">({durationLabel(months)})</span>
          </span>

          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              disabled={disabled || months - step < step}
              onClick={handleDecrement}
              className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-l-lg"
              aria-label={step === 12 ? "One year less" : "Decrease months"}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="min-w-8 border-x border-slate-200 px-2 text-center text-xs font-semibold text-slate-900 tabular-nums">
              {months}
            </span>
            <button
              type="button"
              disabled={disabled || months + step > MAX_MONTHS}
              onClick={handleIncrement}
              className="flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer rounded-r-lg"
              aria-label={step === 12 ? "One year more" : "Increase months"}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Itemized Price Breakdown */}
      <div className="border-t border-slate-100 pt-3.5 space-y-1.5">
        <div className="flex justify-between text-xs text-slate-600">
          <span>
            {PLANS[plan.planCode].name}
            {plan.aggregators.length >= 2 ? " + second delivery app" : ""} ({durationLabel(months)})
          </span>
          <span className="font-medium text-slate-800 tabular-nums">
            ₹{pricing.planTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {pricing.credit > 0 && (
          <div className="flex justify-between text-xs text-emerald-700">
            <span>Credit for unused days on current plan</span>
            <span className="font-medium tabular-nums">
              -₹{pricing.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {pricing.discountRupees > 0 && coupon && (
          <div className="flex justify-between text-xs text-emerald-700">
            <span>Promo discount ({coupon.code})</span>
            <span className="font-medium tabular-nums">
              -₹{pricing.discountRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}

        <div className="flex justify-between text-xs text-slate-500">
          <span>GST ({GST_PERCENT}%)</span>
          <span className="tabular-nums">
            ₹{pricing.gstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {promoSlot && <div className="pt-1.5">{promoSlot}</div>}

        {months >= 12 && (
          <p className="pt-1 text-[11px] text-slate-400">
            Annual billing ({formatRupees(prices.yearly)}/yr + GST) is non-refundable.
          </p>
        )}

        {!hideTotalRow && (
          <div className="border-t border-slate-200/80 pt-3 mt-2 flex items-baseline justify-between">
            <div>
              <span className="text-sm font-semibold text-slate-900">Total payable</span>
              <span className="ml-1.5 text-xs text-slate-500">incl. GST</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 tabular-nums">
              ₹{pricing.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
