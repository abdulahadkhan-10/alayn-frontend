import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Contact & Book a Demo — Alayn AI";
const description = "Connect with Alayn AI. Book an interactive demonstration, get enterprise sales quotes, or access operator technical support.";

export const metadata: Metadata = {
  title: "Contact Us",
  description,
  alternates: {
    canonical: `${siteUrl}/contact`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/contact`,
    siteName: "Alayn AI",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/alaynlogo.png", width: 1200, height: 630, alt: "Alayn AI Contact" }],
  },
};

const CHANNELS = [
  {
    badge: "Sales & Demo",
    title: "Book a Platform Demonstration",
    desc: "Discover how Alayn AI transforms POS, kitchen flow, inventory, and workforce management for your specific outlets.",
    email: "sales@alaynai.com",
    subject: "Demonstration Request",
    sla: "Within 24 Hours",
  },
  {
    badge: "Enterprise",
    title: "Multi-Outlet & Chain Inquiries",
    desc: "Custom deployments, enterprise API integrations, volume pricing, and dedicated account management.",
    email: "sales@alaynai.com",
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": title,
    "description": description,
    "url": `${siteUrl}/contact`,
    "mainEntity": {
      "@type": "Organization",
      "name": "Alayn AI",
      "url": siteUrl,
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "sales",
          "email": "sales@alaynai.com",
          "availableLanguage": ["English", "Hindi"]
        },
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "email": "info@alaynai.com",
          "availableLanguage": ["English", "Hindi"]
        }
      ]
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

        {/* Quick Sign Up Callout */}
        <div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-amber-500/10 to-transparent flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Ready to explore immediately?</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-light">Create an operator account and launch your digital POS in under 2 minutes.</p>
          </div>
          <Link
            href="/signup"
            className="btn-primary shrink-0 px-6 py-3 rounded-full text-xs uppercase tracking-wider font-bold"
          >
            Get Started Free
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
