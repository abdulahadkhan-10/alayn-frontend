"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { formatRupees, PLANS, SECOND_AGGREGATOR, withGst, yearlySaving, type PlanCode } from "@/lib/pricing";
import { signupHref, type Cycle } from "@/lib/planIntent";
const CYCLES: Cycle[] = ["monthly", "yearly"];

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

function Price({ plan, cycle, dark = false, animated = false }: { plan: PlanCode; cycle: Cycle; dark?: boolean; animated?: boolean }) {
  const amount = cycle === "monthly" ? PLANS[plan].monthly : PLANS[plan].yearly;
  const subtextTone = dark ? "text-[#C9D3E5]" : "text-[var(--muted)]";
  return (
    // The key replays the entrance whenever the user switches the billing period
    <div key={`${plan}-${cycle}`} className={animated ? "pricing-figure" : undefined}>
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-heading text-5xl font-extrabold tracking-[-0.03em] tabular-nums sm:text-[3.5rem]">
          {formatRupees(amount)}
        </span>
        <span className={`whitespace-nowrap text-sm font-medium ${subtextTone}`}>
          / {cycle === "monthly" ? "month" : "year"} + GST
        </span>
      </p>
      <p className={`mt-1.5 text-[13px] tabular-nums ${subtextTone}`}>
        {formatRupees(Math.round(withGst(amount)))} with 18% GST
        {cycle === "yearly" && (
          <>
            {" "}· <span className={dark ? "font-semibold text-white" : "font-semibold text-[var(--espresso)]"}>save {formatRupees(yearlySaving(plan))}</span> on
            paying monthly · non-refundable
          </>
        )}
      </p>
    </div>
  );
}

export default function PricingPlans() {
  const [cycle, setCycle] = useState<Cycle>("yearly");
  const [hasToggled, setHasToggled] = useState(false);
  const radioRefs = useRef<Record<Cycle, HTMLButtonElement | null>>({
    monthly: null,
    yearly: null,
  });
  const addOn = cycle === "monthly" ? SECOND_AGGREGATOR.monthly : SECOND_AGGREGATOR.yearly;

  const selectCycle = (next: Cycle, focusTarget = false) => {
    if (next !== cycle) {
      setHasToggled(true);
      setCycle(next);
    }
    if (focusTarget) {
      radioRefs.current[next]?.focus();
    }
  };

  const handleRadioKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, current: Cycle) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const next: Cycle = current === "monthly" ? "yearly" : "monthly";
      selectCycle(next, true);
    }
  };

  return (
    <section aria-labelledby="plans-heading">
      <h2 id="plans-heading" className="sr-only">
        Plans
      </h2>
      <style>{`
        @keyframes pricing-figure-in {
          from { opacity: 0.72; filter: blur(3px); transform: translateY(3px); }
          to { opacity: 1; filter: blur(0); transform: translateY(0); }
        }
        .pricing-figure { animation: pricing-figure-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .pricing-figure { animation: none; }
        }
      `}</style>

      <div
        role="radiogroup"
        aria-label="Billing period"
        className="inline-flex rounded-full border border-[var(--border-warm)] bg-white p-1"
      >
        {CYCLES.map((c) => {
          const checked = cycle === c;
          return (
            <button
              key={c}
              ref={(el) => {
                radioRefs.current[c] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => selectCycle(c)}
              onKeyDown={(e) => handleRadioKeyDown(e, c)}
              className={`min-h-11 cursor-pointer rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)] ${
                checked ? "bg-[var(--espresso)] text-white" : "text-[var(--muted)] hover:text-[var(--espresso)]"
              }`}
            >
              {c === "monthly" ? "Monthly" : "Yearly"}
              {c === "yearly" && (
                <span className={`tabular-nums ${checked ? "text-[var(--amber-on-dark)]" : "font-bold text-[var(--espresso)]"}`}>
                  {" "}· save 16%
                </span>
              )}
            </button>
          );
        })}
      </div>
      {/* Phones see Pro first; this gets the budget-minded owner to Basic in one tap */}
      <p className="mt-4 text-sm text-[var(--muted)] lg:hidden">
        Just billing, kitchen and stock?{" "}
        <a href="#plan-basic" className="font-semibold text-[var(--espresso)] underline decoration-[var(--amber)] decoration-2 underline-offset-4">
          See Alayn Basic
        </a>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.12fr] lg:items-stretch">
        {/* Basic: plain paper, deliberately quiet — border elevation only, no ghost-card shadow */}
        <article id="plan-basic" className="flex scroll-mt-28 flex-col rounded-2xl border border-[var(--border-warm)] bg-white p-7 text-[var(--espresso)] sm:p-9">
          <div className="lg:min-h-[6.25rem]">
            <h3 className="font-heading text-2xl font-bold tracking-[-0.02em]">{PLANS.ALAYN_BASIC.name}</h3>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--muted)]">
              Billing, kitchen and stock for one outlet. Everything you need to run service.
            </p>
          </div>
          <div className="mt-7">
            <Price plan="ALAYN_BASIC" cycle={cycle} animated={hasToggled} />
          </div>
          <Link
            href={signupHref("ALAYN_BASIC", cycle)}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--espresso)] px-6 py-3 text-sm font-semibold text-[var(--espresso)] transition-colors hover:bg-[var(--espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            Start with Basic
          </Link>
          <ul className="mt-7 space-y-3.5 border-t border-[var(--border-warm)] pt-7 text-[15px] leading-relaxed">
            {BASIC_POINTS.map((p) => (
              <li key={p.text} className="flex gap-3">
                <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--amber)]" aria-hidden="true" />
                <span>
                  {p.text}
                  {p.soon && <SoonTag />}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-auto border-t border-[var(--border-warm)] pt-5 text-[13px] leading-relaxed text-[var(--muted)]">
            Move to Pro any time. Days left on Basic are credited automatically.
          </p>
        </article>

        {/* Pro: the navy of the logo and the hero's serif voice. First on phones, so nobody reads all of Basic before seeing it. */}
        <article className="order-first flex flex-col rounded-2xl bg-[var(--espresso)] p-7 text-white shadow-[0_4px_12px_rgba(27,42,74,0.16),0_28px_56px_-24px_rgba(27,42,74,0.65)] selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)] sm:p-9 lg:order-none">
          <div className="lg:min-h-[6.25rem]">
            <h3 className="font-heading text-2xl font-bold tracking-[-0.02em]">{PLANS.ALAYN_PRO.name}</h3>
            <p className="mt-2.5 max-w-md font-[family-name:var(--font-playfair)] text-[1.65rem] font-bold leading-[1.15] tracking-[-0.015em] text-balance sm:text-[1.9rem]">
              For outlets that run a team, not just a counter.
            </p>
          </div>
          <div className="mt-7">
            <Price plan="ALAYN_PRO" cycle={cycle} dark animated={hasToggled} />
          </div>
          <Link
            href={signupHref("ALAYN_PRO", cycle)}
            className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_-10px_rgba(8,14,28,0.8)] transition-colors hover:bg-[var(--amber-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Start with Pro
          </Link>
          <ul className="mt-7 space-y-4 border-t border-white/15 pt-7 text-[15px] leading-relaxed">
            {PRO_POINTS.map((p) => (
              <li key={p.lead} className="flex gap-3">
                <Check className="mt-1 h-[18px] w-[18px] shrink-0 text-[var(--amber-on-dark)]" aria-hidden="true" />
                <span className="text-[#C9D3E5]">
                  <strong className="font-semibold text-white">{p.lead}:</strong> {p.text}
                  {p.soon && <SoonTag dark />}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-auto border-t border-white/15 pt-5 text-sm leading-relaxed text-[#C9D3E5]">
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
        dark ? "bg-white/10 text-[#E2E8F3] ring-1 ring-white/15" : "bg-[var(--cream-light)] text-[var(--muted)] ring-1 ring-[var(--border-warm)]"
      }`}
    >
      Coming soon
    </span>
  );
}
