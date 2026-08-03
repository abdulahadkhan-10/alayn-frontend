"use client";

import React from "react";
import {
  Building2,
  Users,
  Package,
  ShoppingBag,
  TrendingUp,
  MessageSquare,
  Trash2,
  MousePointerClick,
} from "lucide-react";
import { FieldScene } from "../motion/GlobalField";
import RadialOrbitalTimeline, { TimelineItem } from "@/components/ui/radial-orbital-timeline";

const timelineData: TimelineItem[] = [
  {
    id: 1,
    title: "Outlets",
    date: "Module 1",
    content: "Location Management. Physical branch setup, location dropdown context switching, and multi-outlet header scoping.",
    category: "Locations",
    icon: Building2,
    relatedIds: [2, 3, 5],
  },
  {
    id: 2,
    title: "Workforce",
    date: "Module 2",
    content: "Shift Scheduler & Attendance. Staff directory, shift calendar scheduling, leave approvals, and digital clock-in terminal.",
    category: "Staff",
    icon: Users,
    relatedIds: [1, 4, 5],
  },
  {
    id: 3,
    title: "Inventory",
    date: "Module 3",
    content: "Smart Inventory & POs. Ingredient cataloging, low stock reorder alerts, batch expiry warnings, and automated supplier POs.",
    category: "Inventory",
    icon: Package,
    relatedIds: [1, 4, 5, 7],
  },
  {
    id: 4,
    title: "Orders & POS",
    date: "Module 4",
    content: "Menu & POS Order Stream. Counter checkout, menu pricing categories, table/QR billing, and real-time Kitchen Display Board.",
    category: "POS",
    icon: ShoppingBag,
    relatedIds: [2, 3, 5, 7],
  },
  {
    id: 5,
    title: "Analytics",
    date: "Module 5",
    content: "Dashboard Overview & Insights. Master revenue summaries, ML sales forecasting, menu margin engineering, and outlet comparisons.",
    category: "Analytics",
    icon: TrendingUp,
    relatedIds: [1, 2, 3, 4, 6, 7],
  },
  {
    id: 6,
    title: "Tickets & CRM",
    date: "Module 6",
    content: "Feedback & Support. Unified help desk tickets, customer reviews from receipt QR codes, and internal staff query channels.",
    category: "CRM",
    icon: MessageSquare,
    relatedIds: [2, 4, 5],
  },
  {
    id: 7,
    title: "Waste",
    date: "Module 7",
    content: "Waste Management. Food spoilage logging, prep variance breakdown, shelf expiry tracking, and monthly wastage cost calculations.",
    category: "Waste",
    icon: Trash2,
    relatedIds: [3, 4, 5],
  },
];

export default function ConvergenceScene() {
  return (
    <FieldScene
      id="convergence"
      domId="scene-convergence"
      chaos={0.04}
      sync={0.85}
      presence={0.9}
      className="landing-section py-16 sm:py-24"
      style={{
        background: "#F4F5F8",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
      }}
      ariaLabel="Alayn Unified Architecture"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "0.75rem",
              fontWeight: 800,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--amber)",
              marginBottom: "12px",
            }}
          >
            The Operational Modules
          </span>
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
            Every part of your business.
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
              margin: "0 auto 16px",
              lineHeight: 1.6,
            }}
          >
            Alayn unifies orders, inventory, staffing, finance and operations into a single AI-powered operating system—providing real-time visibility, intelligent automation and complete operational control.
          </p>
          <div className="mt-4 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white border border-rose-200 shadow-sm text-[11px] sm:text-sm font-bold text-[#C41E2A] tracking-wide">
              <MousePointerClick className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C41E2A]" />
              <span className="hidden sm:inline">Click any module circle below to view details &amp; connected workflows</span>
              <span className="sm:hidden">Select any operational module below to inspect connected workflows</span>
            </span>
          </div>
        </div>

        {/* Light-Themed 7-Module Radial Orbital Timeline */}
        <div className="w-full shadow-xl rounded-2xl overflow-hidden border border-slate-200/80 bg-white">
          <RadialOrbitalTimeline timelineData={timelineData} />
        </div>
      </div>
    </FieldScene>
  );
}
