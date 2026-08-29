import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Alayn AI Developer Platform — API Reference, OpenAPI & Webhooks";
const description = "Complete REST API reference, official @alayn/cli, RFC 9457 typed errors, webhooks, rate limiting, and multi-tenant authentication for Alayn AI.";

export const metadata: Metadata = {
  title: "Developer Platform & API Reference",
  description,
  alternates: {
    canonical: `${siteUrl}/api-docs`,
  },
  openGraph: {
    title,
    description,
    url: `${siteUrl}/api-docs`,
    siteName: "Alayn AI",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/alaynlogo.png", width: 1200, height: 630, alt: "Alayn AI Developer Platform" }],
  },
};

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
            ALAYN AI DEVELOPER PLATFORM
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
            Developer API &amp; OpenAPI Spec
          </h1>
          <p className="text-base text-slate-300 font-light leading-relaxed">
            Integrate Alayn AI with point-of-sale hardware, third-party delivery platforms, custom mobile apps, and accounting ERPs with 100% typed schema precision.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-4 mb-12 text-xs font-mono">
          <Link href="/openapi.json" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 transition-colors">
            openapi.json (OpenAPI 3.1)
          </Link>
          <Link href="/llms.txt" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
            llms.txt (Agent Guidance)
          </Link>
          <Link href="/llms-full.txt" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
            llms-full.txt (Full RAG)
          </Link>
        </div>

        {/* Content Blocks */}
        <div className="space-y-10">
          {/* CLI Tool */}
          <section id="cli" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">OFFICIAL CLI TOOL</span>
            <h2 className="text-2xl font-bold text-white mb-3">Automate with the Alayn CLI (@alayn/cli)</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              The official command-line interface lets developers, agents, and DevOps pipelines script restaurant workflows, sync menus, and tail live KDS orders without building HTTP clients from scratch.
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 space-y-2">
              <p># Install globally via npm</p>
              <p className="text-white">npm install -g @alayn/cli</p>
              <p className="mt-2 text-slate-400"># Authenticate your terminal</p>
              <p className="text-white">alayn auth login --api-key &lt;YOUR_API_KEY&gt;</p>
              <p className="mt-2 text-slate-400"># Stream live kitchen orders in real-time</p>
              <p className="text-white">alayn orders stream --outlet 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d</p>
            </div>
          </section>

          {/* Authentication & Scoping */}
          <section className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">AUTHENTICATION &amp; HEADERS</span>
            <h2 className="text-2xl font-bold text-white mb-3">Base URL &amp; Multi-Tenant Header Scoping</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              All production API requests must authenticate via Bearer JWT and specify the targeted outlet UUID via the <code className="text-amber-400">x-outlet-id</code> header.
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300 space-y-1">
              <p><span className="text-amber-400">Base URL:</span> https://api.alaynai.com/v1</p>
              <p><span className="text-amber-400">Authorization:</span> Bearer &lt;jwt_access_token&gt;</p>
              <p><span className="text-amber-400">x-outlet-id:</span> 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d</p>
            </div>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limits" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">IETF RATE LIMITING</span>
            <h2 className="text-2xl font-bold text-white mb-3">Self-Throttling &amp; Rate Limit Headers</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              Alayn AI returns standard RFC rate-limiting headers on all API responses so autonomous agents and integrations can self-throttle in real time:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm text-slate-300 font-mono">
              <li><strong className="text-amber-400">RateLimit-Limit:</strong> 100 (requests allowed per 60-second window)</li>
              <li><strong className="text-amber-400">RateLimit-Remaining:</strong> Count of remaining requests in the active window</li>
              <li><strong className="text-amber-400">RateLimit-Reset:</strong> Seconds until window reset</li>
              <li><strong className="text-amber-400">Retry-After:</strong> Provided on HTTP 429 responses indicating backoff duration</li>
            </ul>
          </section>

          {/* RFC 9457 Typed Error Model */}
          <section id="error-model" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">TYPED ERROR MODEL</span>
            <h2 className="text-2xl font-bold text-white mb-3">RFC 9457 Problem Details for HTTP APIs</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              All 4xx and 5xx responses conform to the <code className="text-amber-400">application/problem+json</code> specification, providing machine-readable error codes and structured invalid parameter details:
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300">
              <pre>{`{
  "type": "https://alaynai.com/errors/validation",
  "title": "Validation Failed",
  "status": 422,
  "detail": "Quantity for item must be greater than zero.",
  "code": "ERR_PAYLOAD_VALIDATION",
  "invalidParams": [
    { "name": "items[0].quantity", "reason": "Must be >= 1" }
  ]
}`}</pre>
            </div>
          </section>

          {/* Deprecation Policy */}
          <section id="deprecation-policy" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">API LIFECYCLE</span>
            <h2 className="text-2xl font-bold text-white mb-3">Deprecation &amp; Sunset Policy</h2>
            <p className="text-sm text-slate-400 font-light leading-relaxed mb-3">
              Alayn AI maintains a minimum <strong>12-month sunset window</strong> for deprecated API operations. When an endpoint or property is flagged for deprecation:
            </p>
            <ol className="list-decimal pl-6 space-y-1 text-xs sm:text-sm text-slate-300 font-light">
              <li>A <code className="text-amber-400">Deprecation: @&lt;unix_timestamp&gt;</code> header is attached to responses.</li>
              <li>A <code className="text-amber-400">Sunset: &lt;http_date&gt;</code> header announces the exact termination date.</li>
              <li>Active API key owners receive automated developer alerts via email and webhook telemetry.</li>
            </ol>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
