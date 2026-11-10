"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { FieldScene, useField, DEFAULT_NODES, type FieldNode } from "../motion/GlobalField";
import {
  BakeryScreen,
  CafeScreen,
  CloudKitchenScreen,
  HotelScreen,
  QuickServiceScreen,
  RestaurantScreen,
} from "../verticals/KitchenScreens";

/**
 * "Your kitchen, your screen": the kinds of kitchen listed on the left, and
 * on the right the part of Alayn that kitchen leans on most. The screens are
 * examples drawn in the app's style (see verticals/KitchenScreens.tsx).
 *
 * It moves to the next kitchen by itself until the visitor picks one; it
 * waits while the pointer or keyboard focus is inside, and never moves when
 * reduced motion is on. Every outcome maps to a shipped feature.
 */
const VERTICALS = [
  {
    name: "Restaurants",
    labels: ["Tables", "Kitchen", "Orders", "Stock", "Staff", "Waste"],
    outcome: "Take orders by table at the POS, send them to the kitchen display, and print KOTs for the pass.",
    Screen: RestaurantScreen,
  },
  {
    name: "Cafés",
    labels: ["Orders", "Kitchen", "Stock", "Staff", "Payments", "Menu"],
    outcome: "Bill fast at the counter with UPI, card or cash, switch sold-out items off the menu, and get a low-stock alert before the oat milk runs out.",
    Screen: CafeScreen,
  },
  {
    name: "Quick service",
    labels: ["Orders", "Kitchen", "Stock", "Staff", "Payments", "Menu"],
    outcome: "Keep the counter queue moving with quick billing, live kitchen tickets, and cancellations the kitchen sees straight away.",
    Screen: QuickServiceScreen,
  },
  {
    name: "Cloud kitchens",
    labels: ["Orders", "Kitchen", "Stock", "Staff", "Suppliers", "Waste"],
    outcome: "Track stock, suppliers and purchase orders for a busy kitchen, and log waste against every item.",
    Screen: CloudKitchenScreen,
  },
  {
    name: "Bakeries",
    labels: ["Orders", "Stock", "Expiry", "Staff", "Suppliers", "Waste"],
    outcome: "Watch expiry dates on dairy and fresh stock, reorder flour from your suppliers, and log what didn't sell as waste.",
    Screen: BakeryScreen,
  },
  {
    name: "Hotel restaurants",
    labels: ["Outlets", "Orders", "Kitchen", "Stock", "Staff", "Waste"],
    outcome: "Run the restaurant, café and bar as separate outlets, each with its own stock and rota, from one login.",
    Screen: HotelScreen,
  },
];

const ADVANCE_MS = 5500;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function VerticalsScene() {
  const [active, setActive] = useState(0);
  // Auto-advance stops for good once the visitor chooses a kitchen themselves
  const [chosen, setChosen] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const { setLabels } = useField();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const auto = !chosen && !paused && !reduceMotion;

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % VERTICALS.length), ADVANCE_MS);
    return () => clearTimeout(t);
  }, [auto, active]);

  useEffect(() => {
    const v = VERTICALS[active];
    const nodes: FieldNode[] = DEFAULT_NODES.map((n, i) => ({ ...n, label: v.labels[i] }));
    setLabels(nodes);
    return () => setLabels(null);
  }, [active, setLabels]);

  const choose = (i: number) => {
    setChosen(true);
    setActive(i);
  };

  const onKeyDown = (e: React.KeyboardEvent, refs: React.RefObject<(HTMLButtonElement | null)[]>) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + VERTICALS.length) % VERTICALS.length;
    choose(next);
    refs.current?.[next]?.focus();
    refs.current?.[next]?.scrollIntoView({ block: "nearest", inline: "center" });
  };

  const { Screen, outcome, name } = VERTICALS[active];

  return (
    <FieldScene
      id="verticals"
      domId="scene-verticals"
      chaos={0.03}
      sync={0.6}
      presence={0.75}
      className="landing-section py-16 sm:py-24"
      style={{ background: "#FFFFFF" }}
      ariaLabel="Built for every hospitality business"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <h2
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontWeight: 800,
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--espresso)",
            textWrap: "balance",
          }}
          className="mb-8 text-center sm:mb-14"
        >
          Set up for the way your kitchen runs.
        </h2>

        <div
          className="grid grid-cols-1 items-stretch gap-x-12 gap-y-6 lg:grid-cols-12"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Phone and tablet: the kitchens as a swipeable row, the outcome under it */}
          <div className="min-w-0 lg:hidden">
            <div
              role="tablist"
              aria-label="Kind of kitchen"
              onKeyDown={(e) => onKeyDown(e, chipRefs)}
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            >
              {VERTICALS.map((v, i) => (
                <button
                  key={v.name}
                  ref={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={active === i}
                  aria-controls="vertical-screen"
                  tabIndex={active === i ? 0 : -1}
                  onClick={() => choose(i)}
                  className="min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors duration-200"
                  style={{
                    borderColor: active === i ? "var(--amber)" : "var(--border-warm)",
                    background: active === i ? "rgba(196, 30, 42, 0.05)" : "transparent",
                    color: active === i ? "var(--amber)" : "var(--muted)",
                  }}
                >
                  {v.name}
                </button>
              ))}
            </div>
            <p className="mt-4 min-h-[4.5rem] text-[15px] leading-relaxed text-[var(--muted)]">{outcome}</p>
          </div>

          {/* Laptop: the kitchens as a list; the chosen one opens to its outcome */}
          <div
            role="tablist"
            aria-label="Kind of kitchen"
            aria-orientation="vertical"
            onKeyDown={(e) => onKeyDown(e, tabRefs)}
            className="hidden lg:col-span-4 lg:flex lg:flex-col lg:justify-center"
          >
            {VERTICALS.map((v, i) => {
              const selected = active === i;
              return (
                <button
                  key={v.name}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="vertical-screen"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => choose(i)}
                  className={`vertical-tab relative block w-full border-t border-[var(--border-warm)] py-4 text-left last:border-b ${selected ? "is-selected" : ""}`}
                >
                  <span
                    className="block text-[1.65rem] leading-tight transition-colors duration-300"
                    style={{
                      fontFamily: "var(--font-playfair), Georgia, serif",
                      fontWeight: selected ? 800 : 600,
                      fontStyle: selected ? "italic" : "normal",
                      color: selected ? "var(--amber)" : "var(--espresso)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {v.name}
                  </span>
                  <span className="vertical-tab-body">
                    <span className="block overflow-hidden">
                      <span className="block pt-2 text-[15px] leading-relaxed text-[var(--muted)]">{v.outcome}</span>
                    </span>
                  </span>
                  {/* Fills while this kitchen is on show, so the move to the next one isn't a surprise */}
                  {selected && auto && (
                    <motion.span
                      key={`progress-${i}`}
                      aria-hidden
                      className="absolute left-0 top-[-1px] h-[2px] bg-[var(--amber)]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: ADVANCE_MS / 1000, ease: "linear" }}
                    />
                  )}
                  {selected && !auto && <span aria-hidden className="absolute left-0 top-[-1px] h-[2px] w-full bg-[var(--amber)]" />}
                </button>
              );
            })}
          </div>

          {/* The screen for the chosen kitchen */}
          <div id="vertical-screen" role="tabpanel" aria-label={`Alayn for ${name}`} className="min-w-0 lg:col-span-8">
            <div className="lg:h-[424px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  className="h-full"
                  initial={reduceMotion ? false : { opacity: 0, y: 14, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -10, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <Screen />
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">An example of the screen. Names and numbers are illustrative.</p>
          </div>
        </div>
      </div>
    </FieldScene>
  );
}
