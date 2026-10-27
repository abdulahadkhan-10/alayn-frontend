import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import { Check } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import { formatRupees, GST_PERCENT, MONTHLY_FEE, withGst, YEARLY_FEE, YEARLY_SAVING } from "@/lib/pricing";

const siteUrl = "https://alaynai.com";
const title = "Pricing — ₹3,000 per Outlet per Month or ₹26,000 a Year | Restaurant Billing & POS | Alayn AI";
const description = "Alayn AI restaurant billing software and POS costs ₹3,000 per outlet per month, or ₹26,000 a year, + 18% GST, with POS billing, kitchen display, inventory, waste tracking, workforce, analytics and Ask Alayn AI all included.";

export const metadata: Metadata = {
  title: "Pricing — ₹3,000/mo Restaurant Billing & POS",
  description,
  alternates: {
    canonical: `${siteUrl}/pricing`,
    types: { "text/markdown": `${siteUrl}/pricing.md` },
  },
  ...socialMetadata({ title, description, path: "/pricing" }),
};

// Prices live in src/lib/pricing.ts (the backend's src/modules/subscription/pricing.ts decides what
// is charged). Keep the "/pricing" entry in src/lib/agent-markdown.ts in step with this page.

const INCLUDED = [
  "Unlimited POS billing terminals and table QR menus",
  "Live kitchen display system (KDS)",
  "Batch inventory with expiry tracking and purchase orders",
  "Waste tracking with AI menu and wastage insights",
  "Staff rosters, shift swaps, leave and geofenced attendance",
  "Sales and P&L analytics",
  "Ask Alayn AI, with a daily question allowance for each outlet",
  "REST API access",
];

const BILLING = [
  "Each outlet has its own subscription.",
  `Prices are before ${GST_PERCENT}% GST, which is added at checkout.`,
  "Pay for 1 to 36 months at a time. Each full year is charged at the yearly price.",
  "Yearly payments are non-refundable.",
  "Payments are processed by Cashfree.",
];

const PLANS = [
  {
    name: "Monthly",
    price: MONTHLY_FEE,
    per: "month",
    note: `${formatRupees(withGst(MONTHLY_FEE))} per month with GST`,
    detail: "Pay month by month.",
    featured: false,
  },
  {
    name: "Yearly",
    price: YEARLY_FEE,
    per: "year",
    note: `${formatRupees(withGst(YEARLY_FEE))} per year with GST`,
    detail: `Works out to ${formatRupees(Math.round(YEARLY_FEE / 12))} a month. Non-refundable.`,
    featured: true,
  },
];

export default function PricingPage() {
  const offer = (name: string, price: number, duration: string, unitText: string) => ({
    "@type": "Offer",
    "name": name,
    "url": `${siteUrl}/pricing`,
    "itemOffered": { "@id": `${siteUrl}/#software` },
    "priceSpecification": {
      "@type": "UnitPriceSpecification",
      "price": price,
      "priceCurrency": "INR",
      "valueAddedTaxIncluded": false,
      "billingDuration": duration,
      "unitText": unitText,
    },
  });
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
      { "@id": `${siteUrl}/pricing#offer`, ...offer("Alayn AI — per outlet, monthly", MONTHLY_FEE, "P1M", "per outlet per month") },
      { "@id": `${siteUrl}/pricing#offer-yearly`, ...offer("Alayn AI — per outlet, yearly", YEARLY_FEE, "P1Y", "per outlet per year") },
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

      <main className="pt-32 sm:pt-36 pb-24 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="max-w-3xl mb-12 sm:mb-14">
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
            is priced per outlet, with nothing held back for a higher tier. Pay monthly, or pay for the
            year and save {formatRupees(YEARLY_SAVING)}.
          </p>
        </div>

        <section aria-label="Plans" className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-6 sm:p-8 rounded-2xl border ${
                plan.featured ? "border-amber-400/50 bg-amber-400/[0.04]" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex min-h-7 items-center justify-between gap-3 mb-5">
                <h2 className="text-sm uppercase tracking-widest font-bold text-white">{plan.name}</h2>
                {plan.featured && (
                  <span className="rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-black">
                    Save {formatRupees(YEARLY_SAVING)}
                  </span>
                )}
              </div>
              <p className="text-5xl font-extrabold text-white tracking-tight">
                {formatRupees(plan.price)}
                <span className="text-base font-light text-slate-400"> / {plan.per} + GST</span>
              </p>
              <p className="mt-2 text-sm text-slate-400 font-light">{plan.note}</p>
              <p className="mt-4 text-sm text-slate-300">{plan.detail}</p>
              <Link
                href="/signup"
                className={`mt-8 inline-flex items-center justify-center px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold transition-colors ${
                  plan.featured
                    ? "bg-amber-400 text-black hover:bg-amber-300"
                    : "border border-white/20 text-white hover:bg-white/5"
                }`}
              >
                Get started
              </Link>
            </div>
          ))}
        </section>
        <p className="mt-4 text-sm text-slate-400">
          Not sure yet?{" "}
          <Link href="/contact" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
            Book a demo
          </Link>{" "}
          and we&apos;ll walk you through it.
        </p>

        <section className="mt-16 py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-3">
              WHAT&apos;S INCLUDED
            </h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              Both plans include everything, for every outlet.
            </p>
            <Link
              href="/features"
              className="inline-block mt-3 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-2"
            >
              See every feature
            </Link>
          </div>
          <ul className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm sm:text-base text-slate-200 font-light leading-relaxed">
            {INCLUDED.map((item) => (
              <li key={item} className="flex gap-3">
                <Check className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <h2 className="md:col-span-4 text-xs uppercase tracking-widest text-amber-400 font-bold">
            HOW BILLING WORKS
          </h2>
          <ul className="md:col-span-8 space-y-3 text-sm text-slate-300 font-light leading-relaxed list-disc pl-5">
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
        </section>

        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8">
          <h2 className="md:col-span-4 text-xs uppercase tracking-widest text-amber-400 font-bold">
            MULTI-OUTLET GROUPS
          </h2>
          <p className="md:col-span-8 text-sm text-slate-300 font-light leading-relaxed">
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
