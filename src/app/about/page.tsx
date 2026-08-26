import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "About Alayn AI — Intelligent Hospitality Operating System";
const description = "Learn about Alayn AI, the enterprise restaurant operating platform unifying POS, kitchen KDS, FEFO inventory, and workforce matrix scheduling. Backed by BRAHM Global Holdings.";

export const metadata: Metadata = {
  title: "About Us",
  description,
  alternates: {
    canonical: `${siteUrl}/about`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/about`,
    siteName: "Alayn AI",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/alaynlogo.png", width: 1200, height: 630, alt: "Alayn AI About" }],
  },
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
    desc: "Recipe-level ingredient tracking with automatic batch deduction. Low-stock alerts and automated supplier purchase orders prevent mid-service stockouts.",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": title,
    "description": description,
    "url": `${siteUrl}/about`,
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "Alayn AI",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "url": siteUrl,
      "creator": {
        "@type": "Organization",
        "name": "BRAHM Global Holdings",
        "url": "https://brahmglobalholdings.com"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
            ABOUT ALAYN AI
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            The Operating System Built for <span className="italic text-amber-400 font-normal">Hospitality Operators.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
            Alayn AI is an enterprise-grade platform designed from first principles to solve the fragmentation of restaurant technology. We unite counter POS, table dining, kitchen tickets, inventory procurement, and workforce scheduling into one synchronized ecosystem.
          </p>
        </div>

        {/* Operating Mandate */}
        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-16">
          <div className="md:col-span-4">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block mb-2">
              OUR MISSION
            </span>
            <h2 className="text-2xl font-bold text-white leading-snug">
              Replacing Operational Chaos with Complete Clarity.
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-slate-300 text-sm sm:text-base font-light leading-relaxed">
            <p>
              In most restaurant environments, operations are fractured across offline notebooks, WhatsApp groups, separate billing machines, and manual inventory spreadsheets. When an unexpected rush hits, communication collapses.
            </p>
            <p>
              Alayn AI was conceived by restaurant operators and enterprise software engineers to eliminate these bottlenecks. Every module—from frontline order entry to automated supplier purchase orders—talks to the same transactional ledger in real time.
            </p>
            <p className="text-white italic font-normal">
              &ldquo;We don&apos;t build generic business software. We engineer tools tuned to the heartbeat of a live restaurant kitchen.&rdquo;
            </p>
          </div>
        </section>

        {/* Four Core Pillars */}
        <section className="py-12 border-t border-white/10 mb-16">
          <h2 className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-8">
            FOUR CORE PILLARS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PILLARS.map((pillar) => (
              <div
                key={pillar.number}
                className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all duration-300"
              >
                <span className="text-xs font-mono text-amber-400 font-bold block mb-3">
                  {pillar.number}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">{pillar.title}</h3>
                <p className="text-sm text-slate-400 font-light leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Corporate Backing */}
        <section className="py-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-3">
            <h2 className="text-xs uppercase tracking-widest text-amber-400 font-bold">
              INSTITUTIONAL GOVERNANCE
            </h2>
            <h3 className="text-2xl font-bold text-white">Backed by BRAHM Global Holdings</h3>
            <p className="text-sm text-slate-400 font-light leading-relaxed max-w-xl">
              Alayn AI operates with institutional governance and international delivery standards as part of BRAHM Global Holdings Ltd, headquartered in London, United Kingdom.
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
    </div>
  );
}
