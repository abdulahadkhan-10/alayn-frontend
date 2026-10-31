import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import DemoRequestForm from "@/components/landing/DemoRequestForm";

const siteUrl = "https://alaynai.com";
const title = "Contact & Book a Demo — Alayn AI";
const description = "Connect with Alayn AI. Book an interactive demonstration, get enterprise sales quotes, or access operator technical support.";

export const metadata: Metadata = {
  title: "Contact Us",
  description,
  alternates: {
    canonical: `${siteUrl}/contact`,
    types: { "text/markdown": `${siteUrl}/contact.md` },
  },
  ...socialMetadata({ title, description, path: "/contact" }),
};

const CHANNELS = [
  {
    badge: "Sales & Demo",
    title: "Book a Platform Demonstration",
    desc: "Discover how Alayn AI transforms POS, kitchen flow, inventory, and workforce management for your specific outlets.",
    email: "info@alaynai.com",
    subject: "Demonstration Request",
    sla: "Within 24 Hours",
  },
  {
    badge: "Enterprise",
    title: "Multi-Outlet & Chain Inquiries",
    desc: "Custom deployments, enterprise API integrations, volume pricing, and dedicated account management.",
    email: "info@alaynai.com",
    subject: "Enterprise Partnership",
    sla: "Priority Response",
  },
  {
    badge: "Support",
    title: "Operator Technical Support",
    desc: "Dedicated support for active restaurant managers, chef staff, and administrative teams.",
    email: "info@alaynai.com",
    subject: "Operator Support Request",
    sla: "Same-Day SLA",
  },
];

export default function ContactPage() {
  // Contact points live on the Organization in the root layout's graph;
  // reference it by @id rather than declaring a second copy.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": `${siteUrl}/contact#webpage`,
        "name": title,
        "description": description,
        "url": `${siteUrl}/contact`,
        "isPartOf": { "@id": `${siteUrl}/#website` },
        "mainEntity": { "@id": `${siteUrl}/#organization` },
        "breadcrumb": { "@id": `${siteUrl}/contact#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/contact#breadcrumb`,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": siteUrl },
          { "@type": "ListItem", "position": 2, "name": "Contact", "item": `${siteUrl}/contact` }
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
            CONNECT WITH ALAYN AI
          </span>
          <h1 className="hero-headline text-balance text-[2.6rem] sm:text-6xl">
            Let&apos;s Transform Your <span className="italic font-normal text-[var(--amber)]">Operations.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--muted)]">
            Whether you run a single high-volume café or manage dozens of multi-city restaurant outlets, our team is ready to demonstrate how Alayn AI unifies your business.
          </p>
        </div>

        <section id="demo" className="mt-12 scroll-mt-32">
          <DemoRequestForm />
        </section>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {CHANNELS.map((ch) => (
            <div
              key={ch.title}
              className="flex flex-col justify-between rounded-2xl border border-[var(--border-warm)] bg-white p-6 transition-colors hover:border-[var(--espresso)]/25 sm:p-8"
            >
              <div>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-[var(--cream-light)] px-2.5 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--amber)] ring-1 ring-[var(--border-warm)]">
                    {ch.badge}
                  </span>
                  <span className="font-mono text-[11px] uppercase text-[var(--muted)]">
                    {ch.sla}
                  </span>
                </div>
                <h2 className="mb-2 font-heading text-xl font-bold tracking-[-0.015em] text-[var(--espresso)]">{ch.title}</h2>
                <p className="mb-6 text-sm leading-relaxed text-[var(--muted)]">
                  {ch.desc}
                </p>
              </div>

              <a
                href={`mailto:${ch.email}?subject=${encodeURIComponent(ch.subject)}`}
                className="inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--espresso)] underline decoration-[var(--amber)] decoration-2 underline-offset-4 hover:text-[var(--amber)]"
              >
                <span>{ch.email}</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          ))}
        </div>

        {/* Self-serve option, secondary to the demo */}
        <section
          aria-labelledby="self-serve-heading"
          className="mt-16 flex flex-col items-start justify-between gap-6 rounded-2xl bg-[var(--espresso)] p-7 text-white selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)] sm:flex-row sm:items-center sm:p-10"
        >
          <div>
            <h2 id="self-serve-heading" className="font-heading text-xl font-bold sm:text-2xl">
              Prefer to look around first?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted-on-dark)]">
              Create an operator account and explore the platform at your own pace.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--amber-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Create an account
          </Link>
        </section>

        {/* Registered business address, matching /legal/corporate */}
        <address className="mt-16 border-t border-[var(--border-warm)] pt-10 not-italic text-sm leading-relaxed text-[var(--muted)]">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--espresso)]">Business address</span>
          Alayn AI · BRAHM Global Holdings<br />
          Shop No. 6, Veena Beena Shopping Centre, Guru Nanak Marg<br />
          Bandra West, Mumbai, Maharashtra 400050, India<br />
          <a href="mailto:info@alaynai.com" className="font-medium text-[var(--amber)] underline underline-offset-4 hover:text-[var(--espresso)]">
            info@alaynai.com
          </a>
        </address>
      </main>

      <LandingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
