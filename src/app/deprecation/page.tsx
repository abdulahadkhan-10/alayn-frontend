import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "API Deprecation & Sunset Policy — Alayn AI";
const description = "Official REST API versioning, deprecation lifecycle, and 12-month sunset policy for Alayn AI.";

export const metadata: Metadata = {
  title: "API Deprecation & Sunset Policy",
  description,
  alternates: {
    canonical: `${siteUrl}/deprecation`,
  },
};

export default function DeprecationPolicyPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-4xl mx-auto w-full">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
          API GOVERNANCE
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
          Alayn AI API Deprecation &amp; Sunset Policy
        </h1>
        <p className="text-base text-slate-300 font-light leading-relaxed mb-12">
          Alayn AI provides enterprise-grade stability guarantees so autonomous agents, third-party POS integrators, and software developers can build with long-term confidence.
        </p>

        <section className="space-y-8">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-2">1. 12-Month Minimum Sunset Window</h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed">
              When any REST API version, endpoint, or field is slated for retirement, Alayn AI guarantees a minimum of <strong>12 calendar months</strong> of continued operation from the date of announced deprecation.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-2">2. Standard HTTP Deprecation Headers</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              Deprecated endpoints broadcast machine-readable signals across every HTTP response:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 space-y-1">
              <p>Deprecation: @1798761600</p>
              <p>Sunset: Sat, 01 Jan 2028 00:00:00 GMT</p>
              <p>Link: &lt;https://alaynai.com/deprecation&gt;; rel=&quot;deprecation&quot;</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-2">3. Active Version Status</h2>
            <p className="text-sm text-slate-400 font-light">
              Current Active Version: <strong className="text-emerald-400 font-mono">v1 (Production)</strong> — Fully supported with zero scheduled deprecation.
            </p>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
