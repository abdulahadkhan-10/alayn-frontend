import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "About Alayn AI — Intelligent Hospitality Operating System";
const description = "Learn about Alayn AI, the enterprise restaurant operating platform unifying POS, kitchen KDS, FEFO inventory, and workforce matrix scheduling. Built and operated by BRAHM Global Holdings.";

export const metadata: Metadata = {
  title: "About Us",
  description,
  alternates: {
    canonical: `${siteUrl}/about`,
    types: { "text/markdown": `${siteUrl}/about.md` },
  },
  ...socialMetadata({ title, description, path: "/about" }),
};

const PILLARS = [
  {
    number: "01",
    title: "Real-Time Floor & Kitchen Synchronization",
    desc: "Eliminate order drift and delayed tickets. Alayn connects waitstaff handhelds, floor table orders, and kitchen display stations (KDS) instantly with zero packet loss.",
  },
  {
    number: "02",
    title: "Precision FEFO & FIFO Batch Inventory",
    desc: "Stock levels, expiry tracking and a waste log. Low-stock alerts and automated supplier purchase orders prevent mid-service stockouts.",
  },
  {
    number: "03",
    title: "Workforce Matrix Scheduling",
    desc: "Employee-by-date matrix rosters, tablet PIN attendance kiosks, and peer-to-peer shift swaps designed for high-throughput restaurant teams.",
  },
  {
    number: "04",
    title: "Multi-Outlet Enterprise Scalability",
    desc: "Centralized menu and operational control with dynamic outlet-level tax scoping (CGST/SGST) and localized inventory management.",
  },
];

export default function AboutPage() {
  // The Organization and SoftwareApplication are defined once in the root
  // layout's graph; reference them by @id rather than declaring copies.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${siteUrl}/about#webpage`,
        "name": title,
        "description": description,
        "url": `${siteUrl}/about`,
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "about": { "@id": `${siteUrl}/#organization` },
        "mainEntity": { "@id": `${siteUrl}/#software` },
        "breadcrumb": { "@id": `${siteUrl}/about#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/about#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "About", "item": `${siteUrl}/about` }
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
        {/* Header */}
        <div className="max-w-3xl">
          <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--amber)]">
            ABOUT ALAYN AI
          </span>
          <h1 className="hero-headline text-balance text-[2.6rem] sm:text-6xl">
            The Operating System Built for <span className="italic font-normal text-[var(--amber)]">Hospitality Operators.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--muted)]">
            Alayn AI is an enterprise-grade platform designed from first principles to solve the fragmentation of restaurant technology. We unite counter POS, table dining, kitchen tickets, inventory procurement, and workforce scheduling into one synchronized ecosystem.
          </p>
        </div>

        {/* Operating Mandate */}
        <section className="mt-20 grid grid-cols-1 items-start gap-8 border-t border-[var(--border-warm)] pt-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--amber)]">
              OUR MISSION
            </span>
            <h2 className="font-heading text-2xl font-bold leading-snug tracking-[-0.02em] text-[var(--espresso)] sm:text-3xl">
              Replacing Operational Chaos with Complete Clarity.
            </h2>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-[var(--muted)] md:col-span-8">
            <p>
              In most restaurant environments, operations are fractured across offline notebooks, WhatsApp groups, separate billing machines, and manual inventory spreadsheets. When an unexpected rush hits, communication collapses.
            </p>
            <p>
              Alayn AI was conceived by restaurant operators and enterprise software engineers to eliminate these bottlenecks. Every module—from frontline order entry to automated supplier purchase orders—talks to the same transactional ledger in real time.
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-lg italic text-[var(--espresso)]">
              &ldquo;We don&apos;t build generic business software. We engineer tools tuned to the heartbeat of a live restaurant kitchen.&rdquo;
            </p>
          </div>
        </section>

        {/* Four Core Pillars */}
        <section className="mt-20 border-t border-[var(--border-warm)] pt-12">
          <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-[var(--amber)]">
            FOUR CORE PILLARS
          </span>
          <h2 className="font-heading text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
            How the platform fits together
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.number}
                className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 transition-colors hover:border-[var(--espresso)]/25 sm:p-8"
              >
                <span className="mb-3 block font-mono text-xs font-bold text-[var(--amber)]">
                  {pillar.number}
                </span>
                <h3 className="mb-2 font-heading text-xl font-bold tracking-[-0.015em] text-[var(--espresso)]">{pillar.title}</h3>
                <p className="text-[15px] leading-relaxed text-[var(--muted)]">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Corporate Backing */}
        <section
          aria-labelledby="governance-heading"
          className="mt-24 rounded-2xl bg-[var(--espresso)] px-7 py-12 text-white selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)] sm:px-12 sm:py-16"
        >
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="space-y-3 md:col-span-8">
              <span className="block text-xs font-bold uppercase tracking-widest text-[var(--amber-on-dark)]">
                INSTITUTIONAL GOVERNANCE
              </span>
              <h2 id="governance-heading" className="text-2xl leading-tight sm:text-3xl">
                <span className="font-[family-name:var(--font-playfair)] font-bold">Built and operated by BRAHM Global Holdings</span>
              </h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-[var(--muted-on-dark)]">
                Alayn AI is built and operated by BRAHM Global Holdings, based in Mumbai, India. Our registration details, GSTIN and policies are published on the{" "}
                <Link href="/legal/corporate" className="font-medium text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white">
                  corporate information
                </Link>{" "}
                page.
              </p>
            </div>
            <div className="flex justify-start md:col-span-4 md:justify-end">
              <Link
                href="/contact"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--amber)] px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--amber-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Book a Demonstration
              </Link>
            </div>
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
