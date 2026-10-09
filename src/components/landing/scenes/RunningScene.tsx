"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { FieldScene } from "../motion/GlobalField";

/**
 * Alerts on a phone lock screen. Every alert type here is one the product
 * actually sends (LOW_STOCK, EXPIRY_ALERT, SHIFT_SWAP_REQUESTED,
 * HIGH_WASTE_LOGGED) and every action exists in the app (Quick Restock order,
 * swap approval). Items and numbers are illustrative and labelled so.
 */

interface Alert {
  id: string;
  category: string;
  title: string;
  body: string;
  time: string;
  action?: string;
}

// Oldest first; each new arrival is stacked on top.
const ALERTS: Alert[] = [
  {
    id: "waste",
    category: "Waste",
    title: "High waste logged",
    body: "4 kg cooked rice written off at the Bandra outlet.",
    time: "25m",
  },
  {
    id: "expiry",
    category: "Stock",
    title: "Cream expiring soon",
    body: "3 packs expire tomorrow. Use them in today's prep.",
    time: "12m",
  },
  {
    id: "swap",
    category: "Staff",
    title: "Shift swap requested",
    body: "Ravi wants to swap Saturday evening with Amit.",
    time: "4m",
    action: "Review",
  },
  {
    id: "stock",
    category: "Stock",
    title: "Low stock: Paneer",
    body: "2 kg left, below your 5 kg minimum.",
    time: "now",
    action: "Restock",
  },
];

const ARRIVAL_MS = 1400;

function Notification({ alert, expanded }: { alert: Alert; expanded: boolean }) {
  return (
    <div
      className="rounded-[20px] px-3 py-2.5 text-[#1c1c1e]"
      style={{
        background: "rgba(245, 245, 247, 0.82)",
        backdropFilter: "blur(20px) saturate(1.6)",
        WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        boxShadow: "0 6px 18px -8px rgba(0, 0, 0, 0.35)",
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="relative mt-0.5 h-[30px] w-[30px] shrink-0 overflow-hidden rounded-[8px] bg-white ring-1 ring-black/5">
          <Image src="/justlogo.png" alt="" fill sizes="30px" style={{ objectFit: "contain", padding: "5px" }} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[12.5px] font-semibold leading-tight">{alert.title}</span>
            <span className="shrink-0 text-[10.5px] text-black/45">{alert.time}</span>
          </div>
          <p className="mt-0.5 text-[12px] leading-snug text-black/75">{alert.body}</p>
          <span className="mt-0.5 block text-[10.5px] text-black/45">Alayn · {alert.category}</span>
        </div>
      </div>

      {expanded && alert.action && (
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <span className="rounded-[11px] bg-black/[0.06] py-1.5 text-center text-[12px] font-semibold text-[#1c1c1e]">
            {alert.action}
          </span>
          <span className="rounded-[11px] bg-black/[0.06] py-1.5 text-center text-[12px] font-medium text-black/60">
            Later
          </span>
        </div>
      )}
    </div>
  );
}

function LockScreenPhone() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.45 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion || count >= ALERTS.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), count === 0 ? 400 : ARRIVAL_MS);
    return () => clearTimeout(t);
  }, [inView, count, reduceMotion]);

  // Newest on top
  const shown = reduceMotion ? ALERTS.length : count;
  const visible = ALERTS.slice(0, shown).reverse();

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[290px]">
      {/* Device */}
      <div
        className="relative rounded-[46px] p-[9px]"
        style={{
          background: "linear-gradient(160deg, #3a3f4a 0%, #16181d 60%)",
          boxShadow: "0 40px 80px -30px rgba(0, 0, 0, 0.7), inset 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        {/* Lock screen */}
        <div
          className="relative overflow-hidden rounded-[38px]"
          style={{
            aspectRatio: "9 / 17.5",
            background:
              "radial-gradient(120% 70% at 20% 0%, #3b4c78 0%, transparent 60%), radial-gradient(90% 60% at 100% 100%, #7a1f2b 0%, transparent 65%), #141c33",
          }}
        >
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-2.5 h-[24px] w-[84px] -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="absolute right-6 top-[13px] text-[11px] font-semibold text-white/90 tabular-nums">82%</div>

          {/* Clock */}
          <div className="pt-[48px] text-center text-white">
            <span className="block text-[12px] font-medium text-white/80">Saturday 12 October</span>
            <span
              className="block font-semibold tabular-nums leading-none mt-1"
              style={{ fontSize: "clamp(3.2rem, 16vw, 3.9rem)", letterSpacing: "-0.02em" }}
            >
              6:42
            </span>
          </div>

          {/* Notifications */}
          <div
            className="absolute inset-x-0 top-[34%] bottom-5 px-2"
            aria-live="polite"
            style={{
              maskImage: "linear-gradient(to bottom, black 82%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, black 82%, transparent)",
            }}
          >
            <motion.ul layout className="flex flex-col gap-1.5">
              <AnimatePresence initial={false}>
                {visible.map((alert, i) => (
                  <motion.li
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, y: -24, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  >
                    <Notification alert={alert} expanded={i === 0} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 h-[5px] w-[110px] -translate-x-1/2 rounded-full bg-white/80" />
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-400">
        Example notifications. Items and numbers are illustrative.
      </p>
    </div>
  );
}

export default function RunningScene() {
  return (
    <FieldScene
      id="running"
      domId="scene-running"
      chaos={0.03}
      sync={0.5}
      presence={0.55}
      className="landing-section section-dark py-16 sm:py-28"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center" }}
      ariaLabel="Alerts before service"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="lg:col-span-6">
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
              WHAT ALAYN FLAGS
            </span>

            <h2
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4.6vw, 3.25rem)",
                lineHeight: 1.12,
                letterSpacing: "-0.015em",
                textWrap: "balance",
                color: "var(--cream-light)",
                marginBottom: "20px",
              }}
            >
              Know what needs you{" "}
              <em style={{ fontStyle: "italic", color: "var(--amber-display-dark)", fontWeight: 400 }}>
                before service starts.
              </em>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg mb-10">
              Low stock, expiring items, shift swaps and high waste show up in your Alayn notifications as they happen. Each one opens the screen where you fix it.
            </p>

            <dl className="grid grid-cols-2 gap-x-8 gap-y-6 max-w-lg border-t border-white/10 pt-8">
              {[
                ["Stock", "Low-stock and expiry alerts, with a restock order one click away."],
                ["Staff", "Shift swap and leave requests waiting for your approval."],
                ["Kitchen", "Orders placed and ready, so the floor knows when to run food."],
                ["Waste", "Large write-offs flagged to the manager."],
              ].map(([term, desc]) => (
                <div key={term}>
                  <dt className="text-sm font-semibold text-white mb-1">{term}</dt>
                  <dd className="text-sm leading-relaxed text-slate-400">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Phone */}
          <div className="lg:col-span-6">
            <LockScreenPhone />
          </div>
        </div>
      </div>
    </FieldScene>
  );
}
