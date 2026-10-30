"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { formatRupees, PLANS, SECOND_AGGREGATOR, withGst, yearlySaving, type PlanCode } from "@/lib/pricing";

type Cycle = "monthly" | "yearly";

// Basic: what runs service. Plain lines.
const BASIC_POINTS: { text: string; soon?: boolean }[] = [
  { text: "POS billing on unlimited counters, with table QR menus" },
  { text: "Kitchen display and KOT printing" },
  { text: "Inventory with batch expiry, purchase orders and waste" },
  { text: "Sales reports, staff directory and logins" },
  { text: "Ask Alayn AI: daily questions on sales and menu" },
  { text: "Quickii, Alayn's own delivery portal", soon: true },
];

// Pro: what changes for the owner, led by what works today. Each line names the outcome first.
const PRO_POINTS: { lead: string; text: string; soon?: boolean }[] = [
  { lead: "Everything in Basic", text: "for the same outlet." },
  { lead: "Your staff rota", text: "weekly shifts, swaps and leave approvals in one place." },
  { lead: "Attendance you can trust", text: "staff clock in only at the outlet, with late marks." },
  { lead: "The full Ask Alayn AI", text: "more questions a day, about stock, waste, staff and forecasts too." },
  { lead: "Swiggy or Zomato", text: "orders straight to your kitchen, included when it launches.", soon: true },
];

function Price({ plan, cycle }: { plan: PlanCode; cycle: Cycle }) {
  const amount = cycle === "monthly" ? PLANS[plan].monthly : PLANS[plan].yearly;
  return (
    // The key replays the entrance whenever the amount changes
    <div key={`${plan}-${cycle}`} className="pricing-figure">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-heading text-5xl font-extrabold tracking-[-0.03em] tabular-nums sm:text-[3.5rem]">
          {formatRupees(amount)}
        </span>
        <span className="whitespace-nowrap text-sm font-medium opacity-80">/ {cycle === "monthly" ? "month" : "year"} + GST</span>
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
            className={`min-h-11 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)] ${
              cycle === c ? "bg-[var(--espresso)] text-white" : "text-[var(--muted)] hover:text-[var(--espresso)]"
            }`}
          >
            {c === "monthly" ? "Monthly" : "Yearly"}
            {c === "yearly" && <span className={cycle === c ? "text-[var(--amber-on-dark)]" : "font-bold text-[var(--espresso)]"}> · save 16%</span>}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.12fr] lg:items-stretch">
        {/* Basic: plain paper, deliberately quiet */}
        <article className="flex flex-col rounded-[28px] border border-[var(--border-warm)] bg-white p-7 text-[var(--espresso)] shadow-[0_2px_6px_rgba(27,42,74,0.04),0_18px_40px_-24px_rgba(27,42,74,0.25)] sm:p-9">
          <h3 className="font-heading text-2xl font-bold">{PLANS.ALAYN_BASIC.name}</h3>
          <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--muted)]">
            Billing, kitchen and stock for one outlet. Everything you need to run service.
          </p>
          <div className="mt-7">
            <Price plan="ALAYN_BASIC" cycle={cycle} />
          </div>
          <Link
            href="/signup"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--espresso)] px-6 py-3 text-sm font-semibold text-[var(--espresso)] transition-colors hover:bg-[var(--espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            Start with Basic
          </Link>
          <p className="mt-3 text-center text-[13px] text-[var(--muted)]">Move to Pro any time. Days left on Basic are credited.</p>
          <ul className="mt-7 space-y-3 border-t border-[var(--border-warm)] pt-7 text-[15px]">
            {BASIC_POINTS.map((p) => (
              <li key={p.text} className="flex gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[var(--amber)]" aria-hidden="true" />
                <span>
                  {p.text}
                  {p.soon && <SoonTag />}
                </span>
              </li>
            ))}
          </ul>
        </article>

        {/* Pro: the navy of the logo and the hero's serif voice. First on phones, so nobody reads all of Basic before seeing it. */}
        <article className="order-first flex flex-col rounded-[28px] bg-[var(--espresso)] p-7 text-white shadow-[0_4px_10px_rgba(27,42,74,0.18),0_30px_60px_-28px_rgba(27,42,74,0.7)] sm:p-9 lg:order-none">
          <h3 className="font-heading text-2xl font-bold">{PLANS.ALAYN_PRO.name}</h3>
          <p className="mt-3 max-w-md font-[family-name:var(--font-playfair)] text-[1.7rem] font-bold leading-[1.15] tracking-[-0.01em] text-balance sm:text-[2rem]">
            For outlets that run a team, not just a counter.
          </p>
          <div className="mt-7">
            <Price plan="ALAYN_PRO" cycle={cycle} />
          </div>
          <Link
            href="/signup"
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(8,14,28,0.8)] transition-colors hover:bg-[var(--amber-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Start with Pro
          </Link>
          <ul className="mt-7 space-y-4 border-t border-white/15 pt-7 text-[15px] leading-relaxed">
            {PRO_POINTS.map((p) => (
              <li key={p.lead} className="flex gap-3">
                <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--amber-on-dark)]" aria-hidden="true" />
                <span className="text-white/75">
                  <strong className="font-semibold text-white">{p.lead}:</strong> {p.text}
                  {p.soon && <SoonTag dark />}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-2xl bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white/75 ring-1 ring-white/10">
            Want both Swiggy and Zomato? Add the second one for{" "}
            <strong className="whitespace-nowrap font-semibold text-white tabular-nums">
              {formatRupees(addOn)} / {cycle === "monthly" ? "month" : "year"} + GST
            </strong>
            .
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
