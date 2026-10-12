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
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
            CONNECT WITH ALAYN AI
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
            Let&apos;s Transform Your <span className="italic text-amber-400 font-normal">Operations.</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 font-light leading-relaxed">
            Whether you run a single high-volume café or manage dozens of multi-city restaurant outlets, our team is ready to demonstrate how Alayn AI unifies your business.
          </p>
        </div>

        <section id="demo" className="scroll-mt-32 mb-16">
          <DemoRequestForm />
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {CHANNELS.map((ch) => (
            <div
              key={ch.title}
              className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {ch.badge}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">
                    {ch.sla}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">{ch.title}</h2>
                <p className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed mb-6">
                  {ch.desc}
                </p>
              </div>

              <a
                href={`mailto:${ch.email}?subject=${encodeURIComponent(ch.subject)}`}
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold hover:underline"
              >
                <span>{ch.email}</span>
                <span>→</span>
              </a>
            </div>
          ))}
        </div>

        {/* Self-serve option, secondary to the demo */}
        <div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent flex flex-col sm:flex-row items-center justify-between gap-6 mb-16">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Prefer to look around first?</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-light">Create an operator account and explore the platform at your own pace.</p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 px-6 py-3 rounded-full border border-white/20 text-white text-xs uppercase tracking-wider font-bold hover:bg-white/5 transition-colors"
          >
            Create an account
          </Link>
        </div>

        {/* Registered business address, matching /legal/corporate */}
        <address className="not-italic text-sm text-slate-400 font-light leading-relaxed">
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Business address</span>
          Alayn AI · BRAHM Global Holdings<br />
          Shop No. 6, Veena Beena Shopping Centre, Guru Nanak Marg<br />
          Bandra West, Mumbai, Maharashtra 400050, India<br />
          <a href="mailto:info@alaynai.com" className="text-amber-400 hover:underline">info@alaynai.com</a>
        </address>
      </main>

      <LandingFooter />
    </div>
  );
}
