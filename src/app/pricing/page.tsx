import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import PricingPlans, { SoonTag } from "@/components/pricing/PricingPlans";
import { BASIC_AI_QUESTIONS, PRO_AI_QUESTIONS, formatRupees, GST_PERCENT, PLANS, SECOND_AGGREGATOR } from "@/lib/pricing";

const siteUrl = "https://alaynai.com";
const title = "Pricing — Alayn Basic ₹599/mo, Alayn Pro ₹1,999/mo | Restaurant Billing & POS | Alayn AI";
const description = `Alayn AI restaurant POS and billing software, per outlet + ${GST_PERCENT}% GST: Alayn Basic ₹599 a month or ₹5,999 a year with POS billing, kitchen display, inventory and reports; Alayn Pro ₹1,999 a month or ₹19,999 a year adding staff scheduling, full Ask Alayn AI and Swiggy or Zomato.`;

export const metadata: Metadata = {
  title: "Pricing — Alayn Basic ₹599/mo, Pro ₹1,999/mo",
  description,
  alternates: {
    canonical: `${siteUrl}/pricing`,
    types: { "text/markdown": `${siteUrl}/pricing.md` },
  },
  ...socialMetadata({ title, description, path: "/pricing" }),
};

// Prices live in src/lib/pricing.ts (the backend's src/modules/subscription/pricing.ts decides what
// is charged). Keep the "/pricing" entry in src/lib/agent-markdown.ts in step with this page.

type Cell = boolean | string | { text: string; soon: true };

const COMPARE: { group: string; rows: [string, Cell, Cell][] }[] = [
  {
    group: "Service",
    rows: [
      ["POS billing on unlimited counters", true, true],
      ["Table QR menus", true, true],
      ["Kitchen display and KOT printing", true, true],
    ],
  },
  {
    group: "Kitchen and stock",
    rows: [
      ["Inventory with batch expiry tracking", true, true],
      ["Suppliers and purchase orders", true, true],
      ["Waste logging and alerts", true, true],
    ],
  },
  {
    group: "Team",
    rows: [
      ["Staff directory, logins and roles", true, true],
      ["Shift scheduling, rosters and swaps", false, true],
      ["Attendance, leave and clock-in terminal", false, true],
    ],
  },
  {
    group: "Insight",
    rows: [
      ["Sales reports and analytics", true, true],
      ["Ask Alayn AI", "Daily questions on sales and menu", "Sales, stock, waste, staff and forecasts"],
    ],
  },
  {
    group: "Delivery",
    rows: [
      ["Quickii, Alayn's own delivery portal", { text: "Included", soon: true }, { text: "Included", soon: true }],
      ["Swiggy or Zomato integration", false, { text: "One included", soon: true }],
      [
        "Both Swiggy and Zomato",
        false,
        `+${formatRupees(SECOND_AGGREGATOR.monthly)}/mo or +${formatRupees(SECOND_AGGREGATOR.yearly)}/yr`,
      ],
    ],
  },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Are prices per outlet?",
    a: "Yes. Each outlet has its own plan, so a group can run some outlets on Basic and others on Pro.",
  },
  {
    q: "Is GST included?",
    a: `No. Prices are before ${GST_PERCENT}% GST, which is added at checkout and shown before you pay.`,
  },
  {
    q: "How do monthly and yearly billing work?",
    a: "Pay for 1 to 36 months at a time. Each full year is charged at the yearly price and the months left over at the monthly price. Yearly payments are non-refundable.",
  },
  {
    q: "Can I move from Basic to Pro later?",
    a: "Yes, at any time. Pro starts straight away and the days left on Basic are taken off the price. Moving from Pro back to Basic happens when your Pro period ends.",
  },
  {
    q: "How many Ask Alayn AI questions do I get?",
    a: `Alayn Basic includes ${BASIC_AI_QUESTIONS} questions a day about your sales and menu. Alayn Pro includes ${PRO_AI_QUESTIONS} a day and covers stock, waste, staff and forecasts too. Questions reset at midnight and are shared by everyone at the outlet.`,
  },
  {
    q: "What does “coming soon” mean?",
    a: "Quickii, our own delivery portal, and the Swiggy and Zomato integrations are being built now. They switch on for your outlet when they launch, at no extra cost on the plan that includes them.",
  },
  {
    q: "How do I pay?",
    a: (
      <>
        Payments are processed by Cashfree (UPI, cards and net banking). Refunds and cancellations follow our{" "}
        <Link href="/legal/refund" className="font-medium text-[var(--amber)] underline underline-offset-4 hover:text-[var(--espresso)]">
          refund policy
        </Link>
        .
      </>
    ),
  },
];

function CompareCell({ value, pro = false }: { value: Cell; pro?: boolean }) {
  if (value === true) {
    return (
      <>
        <Check className={`mx-auto h-5 w-5 ${pro ? "text-[var(--amber)]" : "text-[var(--espresso)]"}`} aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="mx-auto h-5 w-5 text-[var(--muted)]/50" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  if (typeof value === "string") return <span className="text-[13px] leading-snug tabular-nums">{value}</span>;
  return (
    <span className="text-[13px] leading-snug">
      {value.text}
      <SoonTag />
    </span>
  );
}

export default function PricingPage() {
  const offer = (id: string, name: string, price: number, duration: string, unitText: string) => ({
    "@id": `${siteUrl}/pricing#${id}`,
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
      offer("basic-monthly", "Alayn Basic — per outlet, monthly", PLANS.ALAYN_BASIC.monthly, "P1M", "per outlet per month"),
      offer("basic-yearly", "Alayn Basic — per outlet, yearly", PLANS.ALAYN_BASIC.yearly, "P1Y", "per outlet per year"),
      offer("pro-monthly", "Alayn Pro — per outlet, monthly", PLANS.ALAYN_PRO.monthly, "P1M", "per outlet per month"),
      offer("pro-yearly", "Alayn Pro — per outlet, yearly", PLANS.ALAYN_PRO.yearly, "P1Y", "per outlet per year"),
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
    <div className="flex min-h-screen flex-col justify-between bg-[var(--cream-light)] text-[var(--espresso)] selection:bg-[var(--amber)] selection:text-white">
      <LandingNav />

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="max-w-3xl">
          <h1 className="hero-headline text-balance text-[2.6rem] sm:text-6xl">
            Two plans, priced per outlet.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--muted)]">
            Alayn Basic runs your{" "}
            <Link href="/billing-software" className="font-medium text-[var(--espresso)] underline decoration-[var(--amber)] decoration-2 underline-offset-4 hover:text-[var(--amber)]">
              billing
            </Link>
            , kitchen and stock. Alayn Pro adds your staff rota, the full Ask Alayn AI and Swiggy or Zomato. Pay monthly, or pay
            for the year and save.
          </p>
        </div>

        <div className="mt-12">
          <PricingPlans />
        </div>
        <p className="mt-6 text-[15px] text-[var(--muted)]">
          Not sure which?{" "}
          <Link href="/contact" className="font-medium text-[var(--amber)] underline underline-offset-4 hover:text-[var(--espresso)]">
            Book a demo
          </Link>{" "}
          and we&apos;ll walk you through both.
        </p>

        <section aria-labelledby="compare-heading" className="mt-24">
          <h2 id="compare-heading" className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            Basic and Pro, side by side
          </h2>
          <div className="mt-8 overflow-x-auto rounded-[24px] border border-[var(--border-warm)] bg-white">
            <table className="w-full border-collapse text-left text-sm sm:text-[15px]">
              <caption className="sr-only">Features in Alayn Basic and Alayn Pro</caption>
              <thead>
                <tr className="border-b border-[var(--border-warm)]">
                  <th scope="col" className="px-4 py-4 font-medium text-[var(--muted)] sm:px-7">Feature</th>
                  <th scope="col" className="w-[23%] sm:w-[27%] px-2 py-4 text-center font-heading font-bold sm:px-4">
                    Basic
                    <span className="block text-[13px] font-medium text-[var(--muted)] tabular-nums">{formatRupees(PLANS.ALAYN_BASIC.monthly)}/mo</span>
                  </th>
                  <th scope="col" className="w-[23%] sm:w-[27%] bg-[var(--espresso)]/[0.03] px-2 py-4 text-center font-heading font-bold sm:px-4">
                    Pro
                    <span className="block text-[13px] font-medium text-[var(--muted)] tabular-nums">{formatRupees(PLANS.ALAYN_PRO.monthly)}/mo</span>
                  </th>
                </tr>
              </thead>
              {COMPARE.map((section) => (
                <tbody key={section.group}>
                  <tr>
                    <th colSpan={3} scope="colgroup" className="px-4 pb-2 pt-6 text-[13px] font-semibold text-[var(--amber)] sm:px-7">
                      {section.group}
                    </th>
                  </tr>
                  {section.rows.map(([feature, basic, pro]) => (
                    <tr key={feature} className="border-t border-[var(--border-warm)]">
                      <th scope="row" className="px-4 py-3.5 font-normal sm:px-7">{feature}</th>
                      <td className="px-2 py-3.5 text-center sm:px-4"><CompareCell value={basic} /></td>
                      <td className="bg-[var(--espresso)]/[0.03] px-2 py-3.5 text-center sm:px-4"><CompareCell value={pro} pro /></td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="mt-24 grid grid-cols-1 gap-10 md:grid-cols-12">
          <h2 id="faq-heading" className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl md:col-span-4">
            Questions about billing
          </h2>
          <div className="divide-y divide-[var(--border-warm)] border-y border-[var(--border-warm)] md:col-span-8">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--amber)]">
                  {item.q}
                  <span aria-hidden="true" className="relative h-4 w-4 shrink-0">
                    <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rounded bg-[var(--amber)]" />
                    <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 rounded bg-[var(--amber)] transition-transform duration-300 group-open:scale-y-0" />
                  </span>
                </summary>
                <p className="mt-3 max-w-[65ch] text-[15px] leading-relaxed text-[var(--muted)]">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-24 flex flex-col items-start justify-between gap-6 rounded-[28px] bg-white p-8 ring-1 ring-[var(--border-warm)] sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="font-heading text-2xl font-bold">Running many outlets?</h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
              Ask us about volume pricing for groups and chains.
            </p>
          </div>
          <a
            href="mailto:info@alaynai.com"
            className="inline-flex shrink-0 items-center rounded-full bg-[var(--espresso)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--espresso-mid)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            Email info@alaynai.com
          </a>
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
