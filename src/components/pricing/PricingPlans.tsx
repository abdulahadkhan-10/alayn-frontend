"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { formatRupees, PLANS, SECOND_AGGREGATOR, withGst, yearlySaving, type PlanCode } from "@/lib/pricing";

type Cycle = "monthly" | "yearly";

const POINTS: Record<PlanCode, { text: string; included: boolean; soon?: boolean }[]> = {
  ALAYN_BASIC: [
    { text: "POS billing on unlimited counters, with table QR menus", included: true },
    { text: "Kitchen display and KOT printing", included: true },
    { text: "Inventory with batch expiry, purchase orders and waste", included: true },
    { text: "Sales reports, staff directory and logins", included: true },
    { text: "Ask Alayn AI: daily questions on sales and menu", included: true },
    { text: "Quickii, Alayn's own delivery portal", included: true, soon: true },
    { text: "Shift scheduling, attendance and leave", included: false },
    { text: "Swiggy or Zomato integration", included: false },
  ],
  ALAYN_PRO: [
    { text: "Everything in Basic", included: true },
    { text: "Shift scheduling, swaps, attendance and leave", included: true },
    { text: "Clock-in terminal with geofencing", included: true },
    { text: "Full Ask Alayn AI: stock, waste, staff and forecasts", included: true },
    { text: "Swiggy or Zomato, your choice, included", included: true, soon: true },
  ],
};

const PITCH: Record<PlanCode, string> = {
  ALAYN_BASIC: "Billing, kitchen and stock for one outlet. Everything a restaurant needs to run service.",
  ALAYN_PRO: "Basic, plus your staff rota, the full Ask Alayn AI, and Swiggy or Zomato orders straight to the kitchen once it launches.",
};

function Price({ plan, cycle }: { plan: PlanCode; cycle: Cycle }) {
  const amount = cycle === "monthly" ? PLANS[plan].monthly : PLANS[plan].yearly;
  return (
    // The key replays the entrance whenever the amount changes
    <div key={`${plan}-${cycle}`} className="pricing-figure">
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-5xl font-extrabold tracking-[-0.03em] tabular-nums sm:text-[3.5rem]">
          {formatRupees(amount)}
        </span>
        <span className="text-sm font-medium opacity-80">/ {cycle === "monthly" ? "month" : "year"} + GST</span>
      </p>
      <p className="mt-1.5 text-[13px] tabular-nums opacity-75">
        {formatRupees(withGst(amount))} with 18% GST
        {cycle === "yearly" && <> · saves {formatRupees(yearlySaving(plan))} on paying monthly</>}
      </p>
    </div>
  );
}

export default function PricingPlans() {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const addOn = cycle === "monthly" ? SECOND_AGGREGATOR.monthly : SECOND_AGGREGATOR.yearly;

  return (
    <section aria-labelledby="plans-heading">
      <h2 id="plans-heading" className="sr-only">
        Plans
      </h2>
      <style>{`
        @keyframes pricing-figure-in {
          from { opacity: 0; filter: blur(6px); transform: translateY(4px); }
          to { opacity: 1; filter: blur(0); transform: none; }
        }
        .pricing-figure { animation: pricing-figure-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) { .pricing-figure { animation: none; } }
      `}</style>

      <div
        role="radiogroup"
        aria-label="Billing period"
        className="inline-flex rounded-full border border-[var(--border-warm)] bg-white p-1 shadow-[0_1px_2px_rgba(27,42,74,0.06)]"
      >
        {(["monthly", "yearly"] as Cycle[]).map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={cycle === c}
            onClick={() => setCycle(c)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)] ${
              cycle === c ? "bg-[var(--espresso)] text-white" : "text-[var(--muted)] hover:text-[var(--espresso)]"
            }`}
          >
            {c === "monthly" ? "Monthly" : "Yearly"}
            {c === "yearly" && <span className={cycle === c ? "text-[var(--amber-on-dark)]" : "text-[var(--amber)]"}> · save 16%</span>}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.12fr] lg:items-stretch">
        {/* Basic: plain paper */}
        <article className="flex flex-col rounded-[28px] border border-[var(--border-warm)] bg-white p-7 text-[var(--espresso)] shadow-[0_2px_6px_rgba(27,42,74,0.04),0_18px_40px_-24px_rgba(27,42,74,0.25)] sm:p-9">
          <h3 className="font-heading text-2xl font-bold">{PLANS.ALAYN_BASIC.name}</h3>
          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--muted)]">{PITCH.ALAYN_BASIC}</p>
          <div className="mt-7">
            <Price plan="ALAYN_BASIC" cycle={cycle} />
          </div>
          <Link
            href="/signup"
            className="mt-7 inline-flex items-center justify-center rounded-full border border-[var(--espresso)] px-6 py-3 text-sm font-semibold text-[var(--espresso)] transition-colors hover:bg-[var(--espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            Start with Basic
          </Link>
          <ul className="mt-8 space-y-3 border-t border-[var(--border-warm)] pt-7 text-[15px]">
            {POINTS.ALAYN_BASIC.map((p) => (
              <li key={p.text} className={`flex gap-3 ${p.included ? "" : "text-[var(--muted)]"}`}>
                {p.included ? (
                  <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--amber)]" aria-hidden="true" />
                ) : (
                  <Minus className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--muted)]/60" aria-hidden="true" />
                )}
                <span>
                  {!p.included && <span className="sr-only">Not included: </span>}
                  {p.text}
                  {p.soon && <SoonTag />}
                </span>
              </li>
            ))}
          </ul>
        </article>

        {/* Pro: the navy of the logo */}
        <article className="relative flex flex-col overflow-hidden rounded-[28px] bg-[var(--espresso)] p-7 text-white shadow-[0_4px_10px_rgba(27,42,74,0.18),0_30px_60px_-28px_rgba(27,42,74,0.7)] sm:p-9">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--amber)] opacity-25 blur-3xl" />
          <div className="relative flex items-center justify-between gap-3">
            <h3 className="font-heading text-2xl font-bold">{PLANS.ALAYN_PRO.name}</h3>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--amber-on-dark)] ring-1 ring-white/15">
              Every feature
            </span>
          </div>
          <p className="relative mt-2 max-w-md text-[15px] leading-relaxed text-white/75">{PITCH.ALAYN_PRO}</p>
          <div className="relative mt-7">
            <Price plan="ALAYN_PRO" cycle={cycle} />
          </div>
          <Link
            href="/signup"
            className="relative mt-7 inline-flex items-center justify-center rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_-6px_rgba(196,30,42,0.7)] transition-colors hover:bg-[var(--amber-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Start with Pro
          </Link>
          <ul className="relative mt-8 space-y-3 border-t border-white/15 pt-7 text-[15px]">
            {POINTS.ALAYN_PRO.map((p) => (
              <li key={p.text} className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--amber-on-dark)]" aria-hidden="true" />
                <span>
                  {p.text}
                  {p.soon && <SoonTag dark />}
                </span>
              </li>
            ))}
          </ul>
          <p className="relative mt-auto pt-8 text-sm leading-relaxed text-white/75">
            Want both Swiggy and Zomato? Add the second one for{" "}
            <strong className="font-semibold text-white tabular-nums">
              {formatRupees(addOn)} / {cycle === "monthly" ? "month" : "year"}
            </strong>{" "}
            + GST.
          </p>
        </article>
      </div>
    </section>
  );
}

export function SoonTag({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`ml-2 inline-block whitespace-nowrap rounded-full px-2 py-0.5 align-[1px] text-[11px] font-semibold ${
        dark ? "bg-white/10 text-white/85 ring-1 ring-white/15" : "bg-[var(--cream-light)] text-[var(--muted)] ring-1 ring-[var(--border-warm)]"
      }`}
    >
      Coming soon
    </span>
  );
}
