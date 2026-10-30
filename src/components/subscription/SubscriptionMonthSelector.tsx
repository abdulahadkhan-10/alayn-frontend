"use client";

import React from "react";
import { Calendar, Sparkles, Plus, Minus, Check, ShieldCheck, Tag } from "lucide-react";
import { Aggregator, basePriceFor, formatRupees, GST_PERCENT, MAX_MONTHS, PlanCode, PLANS, SECOND_AGGREGATOR } from "@/lib/pricing";

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
}

/** Monthly and yearly price of a plan choice, before GST */
export function planPrices(plan: PlanChoice) {
  const both = plan.planCode === "ALAYN_PRO" && plan.aggregators.length >= 2;
  return {
    monthly: PLANS[plan.planCode].monthly + (both ? SECOND_AGGREGATOR.monthly : 0),
    yearly: PLANS[plan.planCode].yearly + (both ? SECOND_AGGREGATOR.yearly : 0),
  };
}

export function presetOptions(plan: PlanChoice) {
  const { monthly, yearly } = planPrices(plan);
  const saving = monthly * 12 - yearly;
  return [
    { months: 1, label: "1 Month", subtitle: `${formatRupees(monthly)} + GST` },
    { months: 3, label: "3 Months", subtitle: `${formatRupees(monthly * 3)} + GST` },
    { months: 6, label: "6 Months", subtitle: `${formatRupees(monthly * 6)} + GST` },
    { months: 12, label: "1 Year", subtitle: `${formatRupees(yearly)} + GST`, badge: saving > 0 ? `Save ${formatRupees(saving)}` : undefined },
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
  const safeMonths = Math.max(1, Math.min(MAX_MONTHS, months || 1));
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
}: SubscriptionMonthSelectorProps) {
  const pricing = calculateSubscriptionPricing(months, coupon, plan, creditRupees);
  const projectedEnd = calculateProjectedEndDate(months, currentPeriodEnd, startsNow);
  const prices = planPrices(plan);
  const presets = presetOptions(plan);

  const handlePresetSelect = (m: number) => {
    if (disabled) return;
    onChange(m);
  };

  const handleIncrement = () => {
    if (disabled || months >= MAX_MONTHS) return;
    onChange(months + 1);
  };

  const handleDecrement = () => {
    if (disabled || months <= 1) return;
    onChange(months - 1);
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
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-[#D3232A]" />
          Choose Subscription Duration
        </label>
        <span className="text-[11px] font-semibold text-zinc-500">
          {formatRupees(prices.monthly)}/mo or {formatRupees(prices.yearly)}/yr + GST
        </span>
      </div>

      {/* Preset Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {presets.map((preset) => {
          const isSelected = months === preset.months;
          return (
            <button
              key={preset.months}
              type="button"
              disabled={disabled}
              onClick={() => handlePresetSelect(preset.months)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-150 cursor-pointer select-none ${
                isSelected
                  ? "border-[#D3232A] bg-red-50/50 text-[#D3232A] shadow-xs ring-2 ring-[#D3232A]/20"
                  : "border-slate-200 bg-white text-zinc-700 hover:border-slate-300 hover:bg-slate-50/70"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {preset.badge && (
                <span className="absolute -top-2 rounded-full bg-[#D3232A] text-[9px] font-extrabold text-white px-2 py-0.5 shadow-2xs uppercase tracking-wider">
                  {preset.badge}
                </span>
              )}
              <span className="text-sm font-extrabold leading-tight">
                {preset.label}
              </span>
              <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                {preset.subtitle}
              </span>
              {isSelected && (
                <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D3232A] text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom Month Stepper */}
      <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-800">Custom Duration:</span>
          <span className="text-xs text-zinc-500">
            ({months} {months === 1 ? "month" : "months"} · {daysDiff} calendar days)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled || months <= 1}
            onClick={handleDecrement}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-zinc-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            aria-label="Decrease months"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center text-xs font-mono font-extrabold text-zinc-900">
            {months}
          </span>
          <button
            type="button"
            disabled={disabled || months >= MAX_MONTHS}
            onClick={handleIncrement}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-zinc-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            aria-label="Increase months"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Projected Validity Card */}
      <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/70 p-3 text-xs flex items-center justify-between text-emerald-900">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>
            {isExtending ? "Extends active service until" : "Grants operational access until"}{" "}
            <strong>{formattedEndDate}</strong>
          </span>
        </div>
        <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">
          {daysDiff} Days
        </span>
      </div>

      {/* Price Summary Breakdown */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-red-50/20 p-4 border border-slate-200/80 space-y-2">
        <div className="flex justify-between text-xs text-zinc-600 font-medium">
          <span>
            {PLANS[plan.planCode].name}
            {plan.aggregators.length >= 2 ? " + second delivery app" : ""} ({durationLabel(months)})
          </span>
          <span>₹{pricing.planTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        {pricing.credit > 0 && (
          <div className="flex justify-between text-xs text-emerald-700 font-semibold">
            <span>Credit for days left on your current plan</span>
            <span>-₹{pricing.credit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {pricing.discountRupees > 0 && coupon && (
          <div className="flex justify-between items-center text-xs text-emerald-700 font-bold bg-emerald-50/90 px-2.5 py-1.5 rounded-xl border border-emerald-200">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              <span>Coupon Discount ({coupon.code})</span>
            </span>
            <span>-₹{pricing.discountRupees.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        <div className="flex justify-between text-xs text-zinc-600 font-medium">
          <span>GST ({GST_PERCENT}%)</span>
          <span>₹{pricing.gstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="border-t border-slate-200/80 pt-2.5 flex justify-between items-baseline">
          <div>
            <span className="text-xs font-extrabold text-zinc-900 block">Total Payable Now</span>
            <span className="text-[10px] text-zinc-500">Includes all applicable taxes</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold text-zinc-900 font-mono">
              ₹{pricing.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-zinc-500 block font-medium">INR</span>
          </div>
        </div>
        {months >= 12 && (
          <p className="pt-1 text-[11px] text-zinc-500">
            Years are charged at {formatRupees(prices.yearly)} + GST each and are non-refundable.
          </p>
        )}
      </div>
    </div>
  );
}
