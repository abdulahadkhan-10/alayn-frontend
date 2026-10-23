import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Pricing — ₹1,999 per Outlet per Month | Restaurant Billing & POS | Alayn AI";
const description = "Alayn AI restaurant billing software and POS costs ₹1,999 per outlet per month + 18% GST, with POS billing, kitchen display, inventory, waste tracking, workforce and analytics all included.";

export const metadata: Metadata = {
  title: "Pricing — ₹1,999/mo Restaurant Billing & POS",
  description,
  alternates: {
    canonical: `${siteUrl}/pricing`,
    types: { "text/markdown": `${siteUrl}/pricing.md` },
  },
  ...socialMetadata({ title, description, path: "/pricing" }),
};

// Keep in step with the fee in
// src/components/subscription/SubscriptionMonthSelector.tsx and the
// "/pricing" entry in src/lib/agent-markdown.ts.
const MONTHLY_FEE = 1999;
const GST_PERCENT = 18;
const MONTHLY_TOTAL = (MONTHLY_FEE * (100 + GST_PERCENT)) / 100;

const INCLUDED = [
  "Unlimited POS billing terminals and table QR menus",
  "Live kitchen display system (KDS)",
  "Batch inventory with expiry tracking and purchase orders",
  "Waste tracking with AI menu and wastage insights",
  "Staff rosters, shift swaps, leave and geofenced attendance",
  "Sales and P&L analytics, and Ask Alayn AI",
  "REST API access",
];

const BILLING = [
  "Each outlet has its own subscription.",
  "Pay for 1 to 36 months at a time.",
  "Payments are processed by Cashfree.",
];

const formatRupees = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/pricing#webpage`,
        "name": title,
        "description": description,
        "url": `${siteUrl}/pricing`,
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#software` },
        "breadcrumb": { "@id": `${siteUrl}/pricing#breadcrumb` }
      },
      {
        "@type": "Offer",
        "@id": `${siteUrl}/pricing#offer`,
        "name": "Alayn AI — per outlet",
        "url": `${siteUrl}/pricing`,
        "itemOffered": { "@id": `${siteUrl}/#software` },
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": MONTHLY_FEE,
          "priceCurrency": "INR",
          "valueAddedTaxIncluded": false,
          "billingDuration": "P1M",
          "unitText": "per outlet per month"
        }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/pricing#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "Pricing", "item": `${siteUrl}/pricing` }
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
            PRICING
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            One plan. <span className="italic text-amber-400 font-normal">Every feature.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
            Alayn AI{" "}
            <Link href="/billing-software" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
              restaurant billing software
            </Link>{" "}
            is priced per outlet, with nothing held back for a higher tier.
          </p>
        </div>

        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-16">
          <div className="md:col-span-5 p-6 sm:p-8 rounded-2xl border border-amber-500/30 bg-white/[0.03]">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block mb-4">
              PER OUTLET
            </span>
            <p className="text-5xl font-extrabold text-white tracking-tight">
              {formatRupees(MONTHLY_FEE)}
              <span className="text-base font-light text-slate-400"> / month</span>
            </p>
            <p className="mt-2 text-sm text-slate-400 font-light">
              + {GST_PERCENT}% GST ({formatRupees(MONTHLY_TOTAL)} per month in total)
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold"
              >
                Get Started
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold border border-white/20 text-white hover:bg-white/5 transition-colors"
              >
                Book a Demo
              </Link>
            </div>
          </div>

          <div className="md:col-span-7">
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-4">
              WHAT&apos;S INCLUDED
            </h2>
            <ul className="space-y-3 text-sm sm:text-base text-slate-300 font-light leading-relaxed list-disc pl-5">
              {INCLUDED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link
              href="/features"
              className="inline-block mt-4 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              See every feature
            </Link>
          </div>
        </section>

        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-4">
              HOW BILLING WORKS
            </h2>
            <ul className="space-y-3 text-sm text-slate-300 font-light leading-relaxed list-disc pl-5">
              {BILLING.map((item) => (
                <li key={item}>{item}</li>
              ))}
              <li>
                Refunds and cancellations follow our{" "}
                <Link href="/legal/refund" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                  refund policy
                </Link>
                .
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-4">
              MULTI-OUTLET GROUPS
            </h2>
            <p className="text-sm text-slate-300 font-light leading-relaxed">
              Running many outlets? Ask us about volume pricing at{" "}
              <a href="mailto:info@alaynai.com" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                info@alaynai.com
              </a>{" "}
              or through the{" "}
              <Link href="/contact" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                contact page
              </Link>
              .
            </p>
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
