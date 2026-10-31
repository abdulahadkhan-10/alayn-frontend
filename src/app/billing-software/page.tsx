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
    <div className="flex min-h-screen flex-col justify-between bg-[var(--cream-light)] text-[var(--espresso)] selection:bg-[var(--amber)] selection:text-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-[var(--espresso)] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <LandingNav />

      <main id="main-content" className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-24 pt-32 sm:px-8 sm:pt-40">
        {/* Hero Header */}
        <div className="max-w-3xl">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--amber)]">
            RESTAURANT BILLING SOFTWARE &amp; GST POS
          </span>
          <h1 className="hero-headline text-balance text-[2.6rem] sm:text-6xl">
            Billing software built for{" "}
            <span className="italic font-normal text-[var(--amber)]">real service rush.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--muted)]">
            <strong className="font-semibold text-[var(--espresso)]">Alayn AI</strong> is a unified restaurant billing software and operating system for Indian restaurants, cafés, QSRs, and cloud kitchens—connecting fast GST counter &amp; table billing directly to your kitchen display (KDS), FEFO batch inventory, waste ledger, and staff rosters from{" "}
            <Link href="/pricing" className="font-medium text-[var(--espresso)] underline decoration-[var(--amber)] decoration-2 underline-offset-4 hover:text-[var(--amber)]">
              ₹599 per outlet per month
            </Link>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--espresso)] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--espresso-mid)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
            >
              Get Started Now
            </Link>
            <Link
              href="/contact#demo"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--espresso)] px-7 py-3 text-sm font-semibold text-[var(--espresso)] transition-colors hover:bg-[var(--espresso)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
            >
              Book a Live Demo
            </Link>
          </div>
        </div>

        {/* Core Billing & POS Capabilities */}
        <section className="mt-20 border-t border-[var(--border-warm)] pt-12">
          <div className="max-w-2xl">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--amber)]">
              CAPABILITIES
            </span>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              Everything you need in a GST billing software—plus the rest of your restaurant.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {BILLING_CAPABILITIES.map((cap) => (
              <div
                key={cap.number}
                className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 transition-colors hover:border-[var(--espresso)]/25 sm:p-8"
              >
                <span className="mb-3 block font-mono text-xs font-bold text-[var(--amber)]">
                  {cap.number}
                </span>
                <h3 className="mb-3 font-heading text-xl font-bold tracking-[-0.015em] text-[var(--espresso)]">{cap.title}</h3>
                <p className="mb-4 text-[15px] leading-relaxed text-[var(--espresso)]/90">
                  {cap.description}
                </p>
                <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-[var(--muted)] marker:text-[var(--amber)]">
                  {cap.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Verticals Served */}
        <section className="mt-20 border-t border-[var(--border-warm)] pt-12">
          <div className="max-w-2xl">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--amber)]">
              BUILT FOR EVERY FORMAT
            </span>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              One billing platform across every hospitality format
            </h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 text-[15px] sm:grid-cols-2 lg:grid-cols-3">
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
                className="rounded-2xl border border-[var(--border-warm)] bg-white p-6"
              >
                <h3 className="mb-1.5 font-heading font-bold text-[var(--espresso)]">{v.name}</h3>
                <p className="text-sm leading-relaxed text-[var(--muted)]">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section for High-Intent Search Queries */}
        <section aria-labelledby="faq-heading" className="mt-24 grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--amber)]">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 id="faq-heading" className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              Common questions about Alayn AI Billing Software
            </h2>
          </div>
          <div className="divide-y divide-[var(--border-warm)] border-y border-[var(--border-warm)] md:col-span-8">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-1 text-[17px] font-semibold transition-colors marker:content-none hover:text-[var(--amber)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--amber)]">
                  <span>{faq.question}</span>
                  <span aria-hidden="true" className="relative h-4 w-4 shrink-0">
                    <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rounded bg-[var(--amber)]" />
                    <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 rounded bg-[var(--amber)] transition-transform duration-300 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="mt-2.5 max-w-[65ch] pb-1 text-[15px] leading-relaxed text-[var(--muted)] tabular-nums">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          aria-labelledby="close-heading"
          className="mt-24 rounded-2xl bg-[var(--espresso)] px-7 py-12 text-center text-white selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)] sm:px-12 sm:py-16"
        >
          <h2 id="close-heading" className="mx-auto max-w-2xl text-3xl leading-tight text-balance sm:text-[2.6rem]">
            <span className="font-[family-name:var(--font-playfair)] font-bold">Upgrade your restaurant billing software today.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted-on-dark)]">
            Alayn Basic from ₹599 per outlet per month, or Alayn Pro from ₹1,999, + 18% GST. POS, KDS, inventory and waste on both plans from day one.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--amber)] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--amber-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              Start Now
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-7 py-3 text-sm font-semibold text-white ring-1 ring-white/50 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
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
