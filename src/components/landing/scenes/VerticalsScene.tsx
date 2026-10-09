"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FieldScene, useField, DEFAULT_NODES, type FieldNode } from "../motion/GlobalField";

// Every outcome below maps to a shipped feature (POS with UPI/card/cash,
// tables, kitchen display + KOT, menu availability, stock minimums and
// expiry, suppliers and POs, waste logging, shifts, multi-outlet). Metrics
// are illustrative and labelled "Example" in the UI.
const VERTICALS = [
  {
    name: "Restaurants",
    labels: ["Tables", "Kitchen", "Orders", "Stock", "Staff", "Waste"],
    outcome: "Take orders by table at the POS, send them to the kitchen display, and print KOTs for the pass.",
    data: { metric1: "9", label1: "Tables with open orders", metric2: "14", label2: "Tickets on the kitchen screen" }
  },
  {
    name: "Cafés",
    labels: ["Orders", "Kitchen", "Stock", "Staff", "Payments", "Menu"],
    outcome: "Bill fast at the counter with UPI, card or cash, switch sold-out items off the menu, and get a low-stock alert before the oat milk runs out.",
    data: { metric1: "3 cartons", label1: "Oat milk left · low-stock alert sent", metric2: "212", label2: "Orders before 10 am" }
  },
  {
    name: "Quick Service Restaurants (QSRs)",
    labels: ["Orders", "Kitchen", "Stock", "Staff", "Payments", "Menu"],
    outcome: "Keep the counter queue moving with quick billing, live kitchen tickets, and cancellations the kitchen sees straight away.",
    data: { metric1: "9", label1: "Orders on the kitchen screen", metric2: "143", label2: "UPI payments today" }
  },
  {
    name: "Cloud Kitchens",
    labels: ["Orders", "Kitchen", "Stock", "Staff", "Suppliers", "Waste"],
    outcome: "Track stock, suppliers and purchase orders for a busy kitchen, and log waste against every item.",
    data: { metric1: "3", label1: "Purchase orders on the way", metric2: "6.5 kg", label2: "Waste logged this week" }
  },
  {
    name: "Bakeries",
    labels: ["Orders", "Stock", "Expiry", "Staff", "Suppliers", "Waste"],
    outcome: "Watch expiry dates on dairy and fresh stock, reorder flour from your suppliers, and log what didn't sell as waste.",
    data: { metric1: "5", label1: "Items expiring in the next 2 days", metric2: "3.5 kg", label2: "Unsold bread logged today" }
  },
  {
    name: "Hotel Restaurants",
    labels: ["Outlets", "Orders", "Kitchen", "Stock", "Staff", "Waste"],
    outcome: "Run the restaurant, café and bar as separate outlets, each with its own stock and rota, from one login.",
    data: { metric1: "3", label1: "Outlets on one login", metric2: "18", label2: "Staff clocked in now" }
  },
];

export default function VerticalsScene() {
  const [active, setActive] = useState(0);
  const { setLabels } = useField();

  useEffect(() => {
    const v = VERTICALS[active];
    const nodes: FieldNode[] = DEFAULT_NODES.map((n, i) => ({ ...n, label: v.labels[i] }));
    setLabels(nodes);
    return () => setLabels(null);
  }, [active, setLabels]);

  const activeVertical = VERTICALS[active];

  return (
    <FieldScene
      id="verticals"
      domId="scene-verticals"
      chaos={0.03}
      sync={0.6}
      presence={0.75}
      className="landing-section py-16 sm:py-24"
      style={{ background: "#FFFFFF", minHeight: "100vh", display: "flex", alignItems: "center" }}
      ariaLabel="Built for every hospitality business"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h2 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontWeight: 800,
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "var(--espresso)",
            marginBottom: "20px",
          }}>
            Set up for the way
            <br />
            your kitchen runs.
          </h2>
        </div>

        {/* Buttons selection grid */}
        <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mb-8 sm:mb-12">
          {VERTICALS.map((v, i) => (
            <button
              key={v.name}
              onClick={() => setActive(i)}
              className="px-4 py-2.5 rounded-full border text-xs sm:text-sm font-semibold transition-all duration-200 min-h-[44px] flex items-center justify-center"
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

        {/* Morphing Mockup Dashboard below */}
        <div className="p-6 sm:p-10 rounded-3xl bg-[#F4F5F8] border border-[var(--border-warm)] max-w-4xl mx-auto shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Context Details */}
            <div>
              <span style={{ display: "inline-block", fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--amber)", marginBottom: "14px" }}>
                What changes
              </span>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-[var(--espresso)] mb-3">
                    Alayn for {activeVertical.name}
                  </h3>
                  <p className="text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                    {activeVertical.outcome}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Example screen — illustrative values, labelled so they never read as customer results */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)" }}>
                Example of what you&apos;d see
              </span>
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -12, scale: 0.97 }}
                  transition={{ duration: 0.28, type: "spring", stiffness: 100, damping: 15 }}
                  style={{ display: "flex", flexDirection: "column", gap: "16px" }}
                >
                  {/* Metric Card 1 */}
                  <div style={{ background: "#FFFFFF", border: "1px solid var(--border-warm)", borderRadius: "16px", padding: "20px 24px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                      {activeVertical.data.label1}
                    </span>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--espresso)" }}>
                      {activeVertical.data.metric1}
                    </span>
                  </div>

                  {/* Metric Card 2 */}
                  <div style={{ background: "#FFFFFF", border: "1px solid var(--border-warm)", borderRadius: "16px", padding: "20px 24px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", display: "block", marginBottom: "4px" }}>
                      {activeVertical.data.label2}
                    </span>
                    <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--espresso)" }}>
                      {activeVertical.data.metric2}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </FieldScene>
  );
}
