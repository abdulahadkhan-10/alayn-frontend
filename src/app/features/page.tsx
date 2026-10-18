import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Features — Restaurant POS, KDS, Inventory & Workforce | Alayn AI";
const description = "Everything in Alayn AI: counter and table POS, kitchen display, batch inventory with expiry tracking, waste tracking, staff rosters and attendance, multi-outlet management and analytics.";

export const metadata: Metadata = {
  title: "Features",
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
    title: "Point of Sale",
    items: [
      "Counter and table billing with UPI, card and cash",
      "Printed KOTs and thermal receipts",
      "Table QR codes that open the menu on the guest's phone",
      "Unlimited POS terminals per outlet",
    ],
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
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
            FEATURES
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Everything your restaurant runs on, <span className="italic text-amber-400 font-normal">in one place.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
            Alayn AI is a restaurant operating system for restaurants, cafés, cloud kitchens and multi-outlet groups. Billing, the kitchen, stock, waste and staff all work from the same live data, and every feature is included in one{" "}
            <Link href="/pricing" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
              per-outlet plan
            </Link>
            .
          </p>
        </div>

        <section className="py-12 border-t border-white/10 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MODULES.map((module) => (
              <div
                key={module.number}
                className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all duration-300"
              >
                <span className="text-xs font-mono text-amber-400 font-bold block mb-3">
                  {module.number}
                </span>
                <h2 className="text-xl font-bold text-white mb-3">{module.title}</h2>
                <ul className="space-y-2 text-sm text-slate-400 font-light leading-relaxed list-disc pl-4">
                  {module.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {module.link && (
                  <Link
                    href={module.link.href}
                    className="inline-block mt-4 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2"
                  >
                    {module.link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-3">
            <h2 className="text-2xl font-bold text-white">See it on a live service</h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xl">
              We&apos;ll walk you through Alayn with your own menu and outlets in mind.
            </p>
          </div>
          <div className="md:col-span-4 flex justify-start md:justify-end">
            <Link
              href="/contact"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold"
            >
              Book a Demonstration
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
