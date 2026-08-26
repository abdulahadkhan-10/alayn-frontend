import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Developer API Documentation — Alayn AI";
const description = "Complete REST API reference, webhooks, and multi-tenant authentication guides for Alayn AI.";

export const metadata: Metadata = {
  title: "Developer API Documentation",
  description,
  alternates: {
    canonical: `${siteUrl}/api-docs`,
  },
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
            DEVELOPER PLATFORM
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
            Alayn AI REST API &amp; Webhooks
          </h1>
          <p className="text-base text-slate-300 font-light leading-relaxed">
            Integrate Alayn AI with third-party delivery platforms, custom mobile applications, accounting ERPs, and automated restaurant hardware.
          </p>
        </div>

        {/* API Basics */}
        <section className="space-y-8">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-2">1. Base URL &amp; Authentication</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              All API requests must be sent over HTTPS to the primary production endpoint with your JWT authorization header:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-400 space-y-1">
              <p>Base URL: https://api.alaynai.com/v1</p>
              <p>Authorization: Bearer &lt;your_jwt_token&gt;</p>
              <p>x-outlet-id: &lt;branch_uuid&gt;</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-2">2. Core Endpoints</h2>
            <div className="space-y-4 pt-2">
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
                <span className="text-emerald-400 font-bold">GET</span> /orders — <span className="text-slate-300 font-sans">Query active counter and table orders.</span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
                <span className="text-blue-400 font-bold">POST</span> /orders — <span className="text-slate-300 font-sans">Submit a new customer order to POS and KDS.</span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
                <span className="text-emerald-400 font-bold">GET</span> /inventory/items — <span className="text-slate-300 font-sans">Retrieve live stock levels, batch numbers, and expiry telemetry.</span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
                <span className="text-blue-400 font-bold">POST</span> /inventory/purchase-orders — <span className="text-slate-300 font-sans">Generate and dispatch supplier purchase orders.</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white mb-2">3. Webhook Subscriptions</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              Receive real-time HTTP POST notifications when key restaurant events occur:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm text-slate-300 font-mono">
              <li>order.created</li>
              <li>order.completed</li>
              <li>stock.low_alert</li>
              <li>attendance.clock_in</li>
            </ul>
          </div>

          <div className="pt-4 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Machine Documentation:</span>
            <Link href="/openapi.json" className="text-amber-400 hover:underline">openapi.json</Link>
            <Link href="/llms.txt" className="text-amber-400 hover:underline">llms.txt</Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
