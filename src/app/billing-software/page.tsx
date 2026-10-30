import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Restaurant Billing Software & GST POS System in India | Alayn AI";
const description =
  "Fast GST billing software and POS for restaurants, cafés, QSRs, and cloud kitchens in India. Counter & table billing, instant KOT, UPI/card/cash, live KDS, FEFO inventory & workforce from ₹599/month.";

export const metadata: Metadata = {
  title: "Restaurant Billing Software & GST POS System",
  description,
  keywords: [
    "Billing Software",
    "Restaurant Billing Software",
    "POS Billing Software",
    "GST Billing Software for Restaurants",
    "Cafe Billing Software",
    "KOT Billing Software",
    "Cloud Kitchen Billing Software",
    "Restaurant POS Billing India",
    "Alayn AI Billing Software",
  ],
  alternates: {
    canonical: `${siteUrl}/billing-software`,
    types: { "text/markdown": `${siteUrl}/billing-software.md` },
  },
  ...socialMetadata({ title, description, path: "/billing-software" }),
};

const BILLING_CAPABILITIES = [
  {
    number: "01",
    title: "Counter & Table POS Billing",
    description:
      "Generate bills in seconds during Friday night rush. Switch effortlessly between quick-service counter billing and full-service dine-in table billing across unlimited POS terminals per outlet.",
    bullets: [
      "One-tap item search, category filtering, and veg / non-veg filters",
      "Table layout tracking with active running bills and occupancy status",
      "Unlimited POS billing terminals per outlet included in one plan",
    ],
  },
  {
    number: "02",
    title: "GST-Compliant Invoicing (CGST & SGST)",
    description:
      "Built for Indian taxation and hospitality compliance. Configure outlet-level GST slabs, CGST/SGST splits, discounts, and service charges with sub-unit accounting precision.",
    bullets: [
      "Automated CGST and SGST calculation on every tax invoice",
      "Customisable thermal receipt headers with GSTIN and FSSAI details",
      "Clean daily, weekly, and monthly GST sales summaries",
    ],
  },
  {
    number: "03",
    title: "Instant KOT Printing & Live Kitchen Display (KDS)",
    description:
      "The moment a bill or running order is punched, Kitchen Order Tickets (KOTs) print at the prep station and appear live on the Kitchen Display System.",
    bullets: [
      "Real-time sync between the billing counter, floor staff, and kitchen screens",
      "Item modifications and cancellations flagged immediately to chefs",
      "Instant floor notification the moment the kitchen marks an order ready",
    ],
  },
  {
    number: "04",
    title: "UPI, Card & Cash Settlements",
    description:
      "Accept every payment method your guests prefer and keep shift-end cash drawer reconciliation accurate to the rupee.",
    bullets: [
      "Record UPI, credit/debit card, and cash settlements with zero friction",
      "Track payment mode breakdowns across shifts and outlets in real time",
      "Digital QR table menus so guests can browse live menus from their phone",
    ],
  },
  {
    number: "05",
    title: "Live Inventory & Waste Control",
    description:
      "Every order and bill in Alayn AI works alongside your live stockroom and food waste ledger.",
    bullets: [
      "Batch inventory with First-Expiring-First-Out (FEFO) expiry tracking",
      "Low-stock alerts and one-click vendor restock purchase orders",
      "Item-level waste logging with reason codes and loss analytics",
    ],
  },
  {
    number: "06",
    title: "Multi-Outlet Billing & Ask Alayn AI",
    description:
      "Monitor live billing, top-selling dishes, staff attendance, and outlet performance across every branch from a single owner login.",
    bullets: [
      "Outlet-level menu pricing, tax configuration, and role-based access control",
      "Ask Alayn AI plain-language questions about your daily billing and margins",
      "Included workforce scheduling, shift swaps, and geofenced tablet clock-in",
    ],
  },
];

const FAQS = [
  {
    question: "What makes Alayn AI a complete billing software for restaurants and cafés?",
    answer:
      "Alayn AI is a unified restaurant billing software and operating system built for Indian restaurants, cafés, QSRs, bakeries, and cloud kitchens. It combines GST POS billing, KOT printing, live kitchen display (KDS), FEFO batch inventory, waste tracking, and staff scheduling, from ₹599 per outlet per month (Alayn Basic) + 18% GST.",
  },
  {
    question: "Does Alayn AI billing software support GST invoicing and thermal KOT printing?",
    answer:
      "Yes. Alayn AI supports outlet-level GST configuration (CGST and SGST), thermal receipt printing, and instant Kitchen Order Ticket (KOT) generation alongside a real-time digital Kitchen Display System (KDS).",
  },
  {
    question: "What hardware do I need to run Alayn AI billing software?",
    answer:
      "Alayn AI runs on any laptop, desktop, iPad, Android tablet, or POS touch terminal with standard thermal receipt printers—with unlimited billing terminals per outlet.",
  },
  {
    question: "Can I manage billing across multiple restaurant outlets from one account?",
    answer:
      "Yes. Multi-outlet restaurant groups can manage every location from a single login, with independent menus, GST settings, stock ledgers, staff rosters, and consolidated revenue analytics across branches.",
  },
  {
    question: "How much does Alayn AI billing software cost?",
    answer:
      "Alayn AI has two plans per outlet, + 18% GST. Alayn Basic is ₹599 a month or ₹5,999 a year, with POS billing, KDS, FEFO inventory, waste tracking, staff logins and daily Ask Alayn AI questions on sales and menu. Alayn Pro is ₹1,999 a month or ₹19,999 a year and adds shift scheduling, attendance and leave, the full Ask Alayn AI, and Swiggy or Zomato integration (coming soon).",
  },
];

export default function BillingSoftwarePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/billing-software#webpage`,
        "name": title,
        "description": description,
        "url": `${siteUrl}/billing-software`,
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#software` },
        "breadcrumb": { "@id": `${siteUrl}/billing-software#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/billing-software#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Restaurant Billing Software",
            "item": `${siteUrl}/billing-software`,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-6xl mx-auto w-full">
        {/* Hero Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
            RESTAURANT BILLING SOFTWARE &amp; GST POS
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Billing software built for{" "}
            <span className="italic text-amber-400 font-normal">real service rush.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed mb-8">
            <strong className="font-semibold text-white">Alayn AI</strong> is a unified restaurant billing software and operating system for Indian restaurants, cafés, QSRs, and cloud kitchens—connecting fast GST counter &amp; table billing directly to your kitchen display (KDS), FEFO batch inventory, waste ledger, and staff rosters for{" "}
            <Link href="/pricing" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
              ₹599 per outlet per month
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold"
            >
              Get Started Now
            </Link>
            <Link
              href="/contact#demo"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              Book a Live Demo
            </Link>
          </div>
        </div>

        {/* Core Billing & POS Capabilities */}
        <section className="py-12 border-t border-white/10 mb-16">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-3">
              CAPABILITIES
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Everything you need in a GST billing software—plus the rest of your restaurant.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BILLING_CAPABILITIES.map((cap) => (
              <div
                key={cap.number}
                className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all duration-300"
              >
                <span className="text-xs font-mono text-amber-400 font-bold block mb-3">
                  {cap.number}
                </span>
                <h3 className="text-xl font-bold text-white mb-3">{cap.title}</h3>
                <p className="text-sm text-slate-300 font-light leading-relaxed mb-4">
                  {cap.description}
                </p>
                <ul className="space-y-2 text-sm text-slate-400 font-light leading-relaxed list-disc pl-4">
                  {cap.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Verticals Served */}
        <section className="py-12 border-t border-white/10 mb-16">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-3">
              BUILT FOR EVERY FORMAT
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              One billing platform across every hospitality format
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              {
                name: "Fine Dining & Casual Restaurants",
                desc: "Table-wise running bills, instant KOT dispatch, UPI/card/cash settlements, and live table status.",
              },
              {
                name: "Cafés, Bakeries & Coffee Shops",
                desc: "Rapid counter billing, UPI/card checkout, and FEFO batch expiry alerts for milk and perishables.",
              },
              {
                name: "Quick Service Restaurants (QSR)",
                desc: "High-speed counter billing, instant KDS queue sync, and rush-hour throughput.",
              },
              {
                name: "Cloud Kitchens & Delivery Hubs",
                desc: "Centralised kitchen display screens, batch stock control, and waste reason tracking.",
              },
              {
                name: "Multi-Outlet Chains & Franchises",
                desc: "Branch-scoped menus, GST configs, and live cross-outlet revenue and food-cost visibility.",
              },
              {
                name: "Lounges & Restro-Bars",
                desc: "Table management, high-value stock batch monitoring, and shift-wise sales analytics.",
              },
            ].map((v) => (
              <div
                key={v.name}
                className="p-5 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <h3 className="font-bold text-white mb-1.5">{v.name}</h3>
                <p className="text-slate-400 font-light leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section for High-Intent Search Queries */}
        <section className="py-12 border-t border-white/10 mb-16">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-3">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Common questions about Alayn AI Billing Software
            </h2>
          </div>
          <div className="space-y-6 max-w-4xl">
            {FAQS.map((faq) => (
              <div
                key={faq.question}
                className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]"
              >
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-slate-300 font-light leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-3">
            <h2 className="text-2xl font-bold text-white">
              Upgrade your restaurant billing software today
            </h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xl">
              Alayn Basic from ₹599 per outlet per month, or Alayn Pro from ₹1,999, + 18% GST. POS, KDS, inventory and waste on both plans from day one.
            </p>
          </div>
          <div className="md:col-span-4 flex flex-wrap justify-start md:justify-end gap-3">
            <Link
              href="/signup"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold"
            >
              Start Now
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold border border-white/20 text-white hover:bg-white/5 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
