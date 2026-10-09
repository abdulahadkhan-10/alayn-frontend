"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowsLeftRight,
  Receipt,
  Prohibit,
  Package,
  Recycle,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { FieldScene } from "../motion/GlobalField";

/**
 * One Friday service, told twice. Each moment sits on a shared time axis so
 * the visitor reads the same evening as two parallel tracks: what happens
 * when the restaurant runs on paper, WhatsApp and memory, and what happens on
 * Alayn. Only shipped features appear on the Alayn track; values are
 * illustrative of a typical night, not customer results.
 */

interface Moment {
  time: string;
  area: string;
  icon: PhosphorIcon;
  without: string;
  withAlayn: string;
}

const MOMENTS: Moment[] = [
  {
    time: "5:30 pm",
    area: "Staff",
    icon: ArrowsLeftRight,
    without: "Two cooks swap shifts over WhatsApp. Nobody updates the rota, so Saturday is short.",
    withAlayn: "The swap request lands in the shift scheduler. You approve it and the rota updates for everyone.",
  },
  {
    time: "7:30 pm",
    area: "Orders",
    icon: Receipt,
    without: "Orders are shouted to the kitchen and a handwritten ticket goes missing.",
    withAlayn: "Orders go from the POS straight to the kitchen display, with the table number on every ticket.",
  },
  {
    time: "8:15 pm",
    area: "Kitchen",
    icon: Prohibit,
    without: "Table 4 cancels a dish, but the kitchen has already started cooking it.",
    withAlayn: "The cancellation flashes on the kitchen board so the cooks stop before it's plated.",
  },
  {
    time: "9:10 pm",
    area: "Stock",
    icon: Package,
    without: "Paneer runs out mid-rush. Nobody saw it coming, so three dishes come off the menu.",
    withAlayn: "Paneer dropped below its minimum this morning and sent a low-stock alert. One click raised the restock order.",
  },
  {
    time: "11:40 pm",
    area: "Waste",
    icon: Recycle,
    without: "Spoiled stock goes in the bin and never gets written down.",
    withAlayn: "Waste is logged against the item, and a large write-off alerts the manager.",
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

export default function ChaosScene() {
  const reduceMotion = useReducedMotion();

  const reveal = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.6, ease: EASE, delay: 0.15 + i * 0.12 },
        };

  return (
    <FieldScene
      id="chaos"
      domId="how-it-works"
      chaos={0.35}
      sync={0.5}
      presence={0.65}
      className="landing-section section-dark relative overflow-hidden text-slate-100 py-16 sm:py-28"
      style={{ minHeight: "100vh" }}
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14 sm:mb-20">
          <div className="max-w-3xl">
            <span
              style={{
                display: "inline-block",
                fontSize: "0.6875rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--amber-on-dark)",
                marginBottom: "16px",
              }}
            >
              HOW ALAYN WORKS
            </span>

            <h2
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontWeight: 700,
                fontSize: "clamp(1.8rem, 4.2vw, 3.4rem)",
                lineHeight: 1.15,
                color: "#FFFFFF",
                letterSpacing: "-0.015em",
                textWrap: "balance",
              }}
            >
              Same Friday rush.
              <br />
              <em style={{ fontStyle: "italic", color: "var(--amber-display-dark)", fontWeight: 400 }}>
                Two very different nights.
              </em>
            </h2>
          </div>

          <p className="max-w-sm text-sm sm:text-base text-slate-300 leading-relaxed">
            One service, start to close. Each moment twice: once run on paper, WhatsApp and memory, and once on Alayn.
          </p>
        </div>

        {/* ── Desktop: two tracks on one time axis ── */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-[148px_repeat(5,minmax(0,1fr))] gap-x-6">
            {/* Time axis */}
            <div />
            <div className="col-span-5 relative pb-8">
              <div className="absolute left-0 right-0 top-[14px] h-px bg-white/10" />
              <motion.div
                aria-hidden
                className="absolute left-0 right-0 top-[14px] h-px origin-left"
                style={{ background: "var(--amber-on-dark)" }}
                initial={reduceMotion ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 1.6, ease: EASE }}
              />
              <div className="grid grid-cols-5 gap-x-6">
                {MOMENTS.map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <motion.div key={m.time} {...reveal(i)} className="relative">
                      <span className="relative z-10 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-white/15 bg-[#1B2A4A] text-slate-200">
                        <Icon size={16} weight="light" />
                      </span>
                      <div className="flex items-baseline gap-2 mt-4">
                        <span className="text-[15px] font-semibold text-white tabular-nums">{m.time}</span>
                        <span className="text-xs text-slate-400">{m.area}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Track: without */}
            <div className="border-t border-white/10 pt-6 pb-8">
              <span className="block text-sm font-semibold text-slate-300">On paper</span>
              <span className="block text-xs text-slate-400 mt-1">Notebook, WhatsApp, memory</span>
            </div>
            {MOMENTS.map((m, i) => (
              <motion.p
                key={`without-${m.time}`}
                {...reveal(i)}
                className="border-t border-white/10 pt-6 pb-8 text-[15px] leading-relaxed text-slate-400"
              >
                {m.without}
              </motion.p>
            ))}

            {/* Track: with Alayn */}
            <div className="border-t border-white/15 pt-6">
              <span className="block text-sm font-semibold" style={{ color: "var(--amber-on-dark)" }}>
                On Alayn
              </span>
              <span className="block text-xs text-slate-400 mt-1">One system, every screen</span>
            </div>
            {MOMENTS.map((m, i) => (
              <motion.p
                key={`with-${m.time}`}
                {...reveal(i + 1)}
                className="border-t border-white/15 pt-6 text-[15px] leading-relaxed text-white"
              >
                {m.withAlayn}
              </motion.p>
            ))}
          </div>
        </div>

        {/* ── Mobile / tablet: vertical timeline ── */}
        <ol className="lg:hidden relative ml-[14px] border-l border-white/10">
          {MOMENTS.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.li key={m.time} {...reveal(i)} className="relative pl-8 pb-10 last:pb-0">
                <span className="absolute -left-[15px] -top-0.5 flex h-[28px] w-[28px] items-center justify-center rounded-full border border-white/15 bg-[#1B2A4A] text-slate-200">
                  <Icon size={16} weight="light" />
                </span>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-base font-semibold text-white tabular-nums">{m.time}</span>
                  <span className="text-xs text-slate-400">{m.area}</span>
                </div>
                <dl className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <dt className="text-xs font-semibold text-slate-400 mb-1">On paper</dt>
                    <dd className="text-sm leading-relaxed text-slate-400">{m.without}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold mb-1" style={{ color: "var(--amber-on-dark)" }}>
                      On Alayn
                    </dt>
                    <dd className="text-sm leading-relaxed text-white">{m.withAlayn}</dd>
                  </div>
                </dl>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </FieldScene>
  );
}
