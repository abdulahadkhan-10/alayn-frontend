"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";

/**
 * The modules as kitchen order tickets (KOTs) clipped to a steel ticket rail.
 * Every slip hangs fully printed: ticket number, time, module name and that
 * module's features as line items, so nothing waits behind a hover. The slips
 * hang at different lengths because the modules have two to four lines each.
 * Every line item is a shipped feature.
 */

interface Ticket {
  name: string;
  time: string;
  items: string[];
}

const TICKETS: Ticket[] = [
  {
    name: "Orders & POS",
    time: "18:02",
    items: ["Counter & table billing", "UPI · card · cash", "Ticket to kitchen display", "KOT printed for the pass"],
  },
  {
    name: "Inventory",
    time: "18:09",
    items: ["Minimum level per item", "Low-stock & expiry alerts", "One-click restock order", "Suppliers & deliveries"],
  },
  {
    name: "Workforce",
    time: "18:15",
    items: ["Weekly shift planner", "Swap & leave approvals", "Clock-in terminal"],
  },
  {
    name: "Waste",
    time: "18:21",
    items: ["Logged item by item", "Reason on every entry", "High-waste alerts"],
  },
  {
    name: "Outlets",
    time: "18:30",
    items: ["Every outlet, one login", "Own orders, stock & staff"],
  },
  {
    name: "Analytics",
    time: "18:34",
    items: ["Sales through the day", "Top-selling items", "Sales by channel"],
  },
  {
    name: "Tickets",
    time: "18:41",
    items: ["Staff raise issues", "Category & priority", "Tracked per outlet"],
  },
];

// Slight, fixed tilts so the rail looks hand-loaded rather than generated
const TILTS = [-1.6, 1.1, -0.6, 1.8, -1.2, 0.7, -1.9];

// Zig-zag torn edge along the bottom of each slip
const TORN_EDGE_MASK =
  "linear-gradient(#000 0 0) top / 100% calc(100% - 7px) no-repeat, conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / 12px 7px repeat-x";

function Slip({ ticket, index }: { ticket: Ticket; index: number }) {
  const reduceMotion = useReducedMotion();
  const number = String(index + 1).padStart(2, "0");

  return (
    <motion.li
      className="relative w-[172px] shrink-0 snap-start lg:w-auto lg:min-w-0 lg:flex-1"
      style={{ transformOrigin: "50% 0%" }}
      initial={reduceMotion ? false : { opacity: 0, y: -28, rotate: TILTS[index] * 4 }}
      whileInView={{ opacity: 1, y: 0, rotate: TILTS[index] }}
      // A touched slip swings straight and drops a little, like one being read
      whileHover={reduceMotion ? undefined : { y: 8, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: "spring", stiffness: 140, damping: 11, delay: 0.1 + index * 0.08 }}
    >
      <div style={{ filter: "drop-shadow(0 10px 14px rgba(27, 42, 74, 0.16))" }}>
        <div
          className="px-4 pt-6 pb-6 text-[#1B2A4A]"
          style={{
            background: "#FBFAF6",
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            mask: TORN_EDGE_MASK,
            WebkitMask: TORN_EDGE_MASK,
          }}
        >
          <div className="flex items-baseline justify-between text-[11px] tracking-wide text-[#56657C]">
            <span>KOT {number}</span>
            <span className="tabular-nums">{ticket.time}</span>
          </div>
          <div className="my-3 border-t border-dashed border-[#1B2A4A]/25" />
          <h3
            className="text-[1.05rem] font-bold leading-tight"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            {ticket.name}
          </h3>
          <div className="mt-3 border-t border-dashed border-[#1B2A4A]/25" />
          <ul className="mt-3 space-y-2 text-[12px] leading-snug">
            {ticket.items.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="shrink-0 text-[#C41E2A]">1×</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 text-center text-[10px] tracking-[0.3em] text-[#56657C]">— ALAYN —</div>
        </div>
      </div>
    </motion.li>
  );
}

export default function ConvergenceScene() {
  return (
    <FieldScene
      id="convergence"
      domId="scene-convergence"
      chaos={0.04}
      sync={0.85}
      presence={0.9}
      className="landing-section pt-16 pb-12 sm:pt-24 sm:pb-16"
      style={{
        background: "#F4F5F8",
        display: "flex",
        alignItems: "center",
      }}
      ariaLabel="Alayn Unified Architecture"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">

        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h2
            style={{
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--espresso)",
              marginBottom: "16px",
            }}
          >
            Every part of your business.{" "}
            <br />
            <span
              style={{
                fontStyle: "italic",
                color: "var(--amber)",
                fontWeight: "400",
              }}
            >
              One intelligent platform.
            </span>
          </h2>
          <p
            className="text-xs sm:text-base"
            style={{
              color: "var(--muted)",
              maxWidth: "760px",
              margin: "0 auto",
              lineHeight: 1.6,
            }}
          >
            Alayn unifies orders, inventory, staffing, finance and operations into a single AI-powered operating system—providing real-time visibility, intelligent automation and complete operational control.
          </p>
        </div>

        {/* The ticket rail */}
        <div className="relative">
          {/* Steel rail */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 z-10 h-[18px] rounded-full"
            style={{
              background: "linear-gradient(180deg, #E9ECF1 0%, #B9C0CB 45%, #8E97A5 55%, #C9CFD8 100%)",
              boxShadow: "0 6px 10px -4px rgba(27, 42, 74, 0.35), inset 0 1px 0 rgba(255,255,255,0.8)",
            }}
          />
          {/* Rail brackets */}
          <span aria-hidden className="absolute left-3 -top-2 z-0 h-8 w-3 rounded-sm bg-[#8E97A5]" />
          <span aria-hidden className="absolute right-3 -top-2 z-0 h-8 w-3 rounded-sm bg-[#8E97A5]" />

          {/* On a phone the rail swipes sideways; the next slip peeks in so it's clear there are more */}
          <ul className="relative z-0 flex items-start gap-3 lg:gap-3.5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory scroll-px-2 px-2 pt-[8px] pb-8 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {TICKETS.map((ticket, i) => (
              <Slip key={ticket.name} ticket={ticket} index={i} />
            ))}
          </ul>
        </div>
      </div>
    </FieldScene>
  );
}
