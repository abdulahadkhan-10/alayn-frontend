import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Features — Restaurant Billing Software, POS, KDS, Inventory & Workforce | Alayn AI";
const description = "Everything in Alayn AI: GST counter and table POS billing software, kitchen display, batch inventory with expiry tracking, waste tracking, staff rosters and attendance, multi-outlet management and analytics.";

export const metadata: Metadata = {
  title: "Features — Billing Software, POS, KDS & Inventory",
  description,
  alternates: {
    canonical: `${siteUrl}/features`,
    types: { "text/markdown": `${siteUrl}/features.md` },
  },
  ...socialMetadata({ title, description, path: "/features" }),
};

// Keep in step with the "/features" entry in src/lib/agent-markdown.ts.
const MODULES = [
  {
    number: "01",
    title: "Point of Sale & GST Billing Software",
    items: [
      "Counter and table GST billing with UPI, card and cash",
      "Printed KOTs and thermal receipts",
      "Table QR codes that open the menu on the guest's phone",
      "Unlimited POS terminals per outlet",
    ],
    link: { href: "/billing-software", label: "Explore Restaurant Billing Software" },
  },
  {
    number: "02",
    title: "Kitchen Display System",
    items: [
      "Orders reach the kitchen screen the moment they are placed",
      "Cancellations are flagged to the kitchen",
      "The floor is notified when an order is ready",
    ],
  },
  {
    number: "03",
    title: "Inventory",
    items: [
      "Stock levels with minimum levels and low-stock alerts",
      "Batch and expiry tracking, used first-expiring-first-out",
      "Suppliers and one-click restock purchase orders",
    ],
  },
  {
    number: "04",
    title: "Waste Tracking",
    items: [
      "Waste logged per item with a reason",
      "Loss totals, trends and high-waste alerts",
    ],
  },
  {
    number: "05",
    title: "Workforce",
    items: [
      "Weekly shift rosters",
      "Staff-requested shift swaps with manager approval",
      "Leave requests and approvals",
      "Tablet clock-in kiosk and geofenced attendance",
    ],
  },
  {
    number: "06",
    title: "Multi-Outlet Management",
    items: [
      "Every outlet from one login, each with its own orders, stock and staff",
      "Outlet-level prices and GST (CGST/SGST) settings",
    ],
  },
  {
    number: "07",
    title: "Analytics & Ask Alayn AI",
    items: [
      "Sales dashboards, top and bottom sellers and outlet comparisons",
      "Plain-language questions about sales, stock, staffing and menu performance",
    ],
  },
  {
    number: "08",
    title: "REST API",
    items: [
      "JWT login and outlet-scoped requests",
      "OpenAPI 3.0 specification",
    ],
    link: { href: "/api-docs", label: "API reference" },
  },
];

export default function FeaturesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/features#webpage`,
        "name": title,
        "description": description,
        "url": `${siteUrl}/features`,
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#software` },
        "breadcrumb": { "@id": `${siteUrl}/features#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/features#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "Features", "item": `${siteUrl}/features` }
        ]
      }
    ]
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
        <div className="max-w-3xl">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--amber)]">
            FEATURES
          </span>
          <h1 className="hero-headline text-balance text-[2.6rem] sm:text-6xl">
            Everything your restaurant runs on, <span className="italic font-normal text-[var(--amber)]">in one place.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--muted)]">
            Alayn AI is a{" "}
            <Link href="/billing-software" className="font-medium text-[var(--espresso)] underline decoration-[var(--amber)] decoration-2 underline-offset-4 hover:text-[var(--amber)]">
              restaurant billing software
            </Link>{" "}
            and operating system for restaurants, cafés, cloud kitchens and multi-outlet groups. Billing, the kitchen, stock, waste and staff all work from the same live data, and everything comes in two simple{" "}
            <Link href="/pricing" className="font-medium text-[var(--espresso)] underline decoration-[var(--amber)] decoration-2 underline-offset-4 hover:text-[var(--amber)]">
              per-outlet plans
            </Link>
            .
          </p>
        </div>

        <section className="mt-16 border-t border-[var(--border-warm)] pt-12">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {MODULES.map((module) => (
              <div
                key={module.number}
                className="flex flex-col rounded-2xl border border-[var(--border-warm)] bg-white p-6 transition-colors hover:border-[var(--espresso)]/25 sm:p-8"
              >
                <span className="mb-3 block font-mono text-xs font-bold text-[var(--amber)]">
                  {module.number}
                </span>
                <h2 className="mb-3 font-heading text-xl font-bold tracking-[-0.015em] text-[var(--espresso)]">{module.title}</h2>
                <ul className="list-disc space-y-2 pl-4 text-[15px] leading-relaxed text-[var(--muted)] marker:text-[var(--amber)]">
                  {module.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {module.link && (
                  <Link
                    href={module.link.href}
                    className="mt-5 inline-block w-fit text-sm font-semibold text-[var(--espresso)] underline decoration-[var(--amber)] decoration-2 underline-offset-4 hover:text-[var(--amber)]"
                  >
                    {module.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="close-heading"
          className="mt-24 rounded-2xl bg-[var(--espresso)] px-7 py-12 text-center text-white selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)] sm:px-12 sm:py-16"
        >
          <h2 id="close-heading" className="mx-auto max-w-2xl text-3xl leading-tight text-balance sm:text-[2.6rem]">
            <span className="font-[family-name:var(--font-playfair)] font-bold">See it on a live service.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--muted-on-dark)]">
            We&apos;ll walk you through Alayn with your own menu and outlets in mind.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--amber)] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--amber-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              Book a Demonstration
            </Link>
            <Link
              href="/pricing"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full px-7 py-3 text-sm font-semibold text-white ring-1 ring-white/50 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              See Pricing
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
      {/* Structured data after the content, so the page text comes early in
          the HTML for agents that only read the start of a response. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
