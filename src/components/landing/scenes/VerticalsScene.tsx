"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FieldScene, useField, DEFAULT_NODES, type FieldNode } from "../motion/GlobalField";

const VERTICALS = [
  { 
    name: "Restaurants", 
    labels: ["Tables", "Kitchen", "Orders", "Stock", "Staff", "Guests"], 
    outcome: "Optimize table turns, coordinate kitchen fires, and link guest history to profiles.",
    data: { metric1: "42 mins", label1: "Avg. Table Turn", metric2: "92.4%", label2: "Kitchen Prep Accuracy" }
  },
  { 
    name: "Cafés", 
    labels: ["Orders", "Kitchen", "Stock", "Staff", "Loyalty", "Payments"], 
    outcome: "Coordinate heavy morning rushes, automate oat milk restocks, and track daily tallies.",
    data: { metric1: "3.2 mins", label1: "Avg. Service Time", metric2: "₹82K", label2: "Morning Rush Gross" }
  },
  { 
    name: "Quick Service Restaurants (QSRs)", 
    labels: ["Orders", "Speed", "Stock", "Staff", "Delivery", "Payments"], 
    outcome: "Optimize drive-thrus, manage third-party delivery dispatch, and coordinate payments.",
    data: { metric1: "90s", label1: "Order-to-Pack Time", metric2: "4.8/5.0", label2: "Delivery Dispatch Rating" }
  },
  { 
    name: "Cloud Kitchens", 
    labels: ["Orders", "Kitchen", "Delivery", "Stock", "Staff", "Payments"], 
    outcome: "Manage 4 brands under one kitchen, aggregate ticket printer outputs, and optimize inventory.",
    data: { metric1: "4 Brands", label1: "Coordinated Matrix", metric2: "0.2s", label2: "Omnichannel Sync Delay" }
  },
  { 
    name: "Bakeries", 
    labels: ["Orders", "Production", "Stock", "Staff", "Wholesale", "Payments"], 
    outcome: "Calculate recipe preps, manage wholesale distributor orders, and track shelf waste.",
    data: { metric1: "₹420", label1: "Wholesale Margin Peak", metric2: "2% target", label2: "Daily Bread Waste" }
  },
  { 
    name: "Hotel Restaurants", 
    labels: ["Reservations", "Housekeeping", "F&B", "Staff", "Guests", "Payments"], 
    outcome: "Link room folios to restaurant tabs, automate morning room service, and coordinate staff.",
    data: { metric1: "0.4s", label1: "Room Tab Verification", metric2: "98%", label2: "Room Service Sync Rate" }
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
        <div className="sr-only">
          <h3>Independent Fine Dining &amp; Casual Restaurants</h3>
          <h3>Cafes, Coffee Shops &amp; Bakeries</h3>
          <h3>Cloud Kitchens &amp; Multi-Brand Delivery Hubs</h3>
          <h3>Quick Service Restaurants (QSR) &amp; Food Courts</h3>
          <h3>Hotel Dining, Bars &amp; Multi-Location Hospitality Groups</h3>
        </div>
        
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
            One intelligent platform.
            <br />
            <span style={{ fontStyle: "italic", color: "var(--amber)", fontWeight: "400" }}>
              Built for every hospitality business.
            </span>
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
                Target Architecture
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
                  <p className="text-xs sm:text-base text-[var(--muted)] leading-relaxed">
                    {activeVertical.outcome}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Simulated Live Analytics Widgets */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
