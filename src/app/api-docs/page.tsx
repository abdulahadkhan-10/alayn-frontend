import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://alaynai.com";
const title = "Alayn API Reference — REST API for the Alayn platform";
const description = "How to authenticate with the Alayn REST API, scope requests to an outlet, read responses and errors, and stay within rate limits. Includes the OpenAPI specification.";

export const metadata: Metadata = {
  title: "API Reference",
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
    images: [{ url: "/alaynlogo.png", width: 1200, height: 630, alt: "Alayn API Reference" }],
  },
};

// Endpoint groups mounted under /api/v1 in the backend router
const ENDPOINT_GROUPS: [string, string][] = [
  ["/auth", "Log in, refresh and log out"],
  ["/outlets", "Outlets in your business"],
  ["/menu", "Menu, categories and items"],
  ["/tables", "Tables and their QR codes"],
  ["/orders", "Orders, status changes and payments"],
  ["/kitchen", "Kitchen display tickets"],
  ["/inventory", "Stock items, adjustments and recipes"],
  ["/purchase-orders", "Purchase orders and deliveries"],
  ["/waste-logs", "Waste entries and summaries"],
  ["/employees", "Staff directory and documents"],
  ["/shifts", "Shifts, assignments and swaps"],
  ["/attendance", "Clock-in and clock-out"],
  ["/leave-requests", "Leave requests and approvals"],
  ["/analytics", "Daily summaries, sellers and reports"],
  ["/dashboard", "Dashboard metrics"],
  ["/ai", "Ask Alayn AI"],
  ["/tickets", "Staff queries and customer feedback"],
  ["/notifications", "In-app notifications"],
];

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#07080a] text-white flex flex-col justify-between">
      <LandingNav />

      <main className="pt-36 pb-20 px-6 sm:px-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400 block mb-4">
            ALAYN API
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mb-4">
            API Reference
          </h1>
          <p className="text-base text-slate-300 font-light leading-relaxed">
            The Alayn app runs on a REST API, and the same API is available to your own integrations. You sign in with an Alayn account and act with that account&apos;s role and outlets.
          </p>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap gap-4 mb-12 text-xs font-mono">
          <a href="https://api.alaynai.com/api/docs" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-amber-400 hover:bg-white/10 transition-colors">
            Interactive reference (Swagger)
          </a>
          <Link href="/openapi.json" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
            openapi.json (OpenAPI 3.0)
          </Link>
          <Link href="/llms.txt" className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
            llms.txt
          </Link>
        </div>

        <div className="space-y-10">
          {/* Getting started */}
          <section id="authentication" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">AUTHENTICATION</span>
            <h2 className="text-2xl font-bold text-white mb-3">Log in, then send a Bearer token</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              Exchange an Alayn account&apos;s email and password for an access token, and send it on every request. When it expires, call <code className="text-amber-400">/api/v1/auth/refresh</code> with the refresh token.
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 overflow-x-auto">
              <pre>{`curl -X POST https://api.alaynai.com/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"owner@yourcafe.com","password":"••••••••"}'

# → { "success": true, "data": { "accessToken": "…", "refreshToken": "…", "user": { … } } }

curl https://api.alaynai.com/api/v1/orders \\
  -H "Authorization: Bearer <accessToken>" \\
  -H "x-outlet-id: <outlet-uuid>"`}</pre>
            </div>
          </section>

          {/* Base URL & outlet scoping */}
          <section id="outlets" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">BASE URL &amp; OUTLETS</span>
            <h2 className="text-2xl font-bold text-white mb-3">Every request is scoped to an outlet</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              Pass the outlet&apos;s ID in the <code className="text-amber-400">x-outlet-id</code> header. If you leave it out, the API uses the first outlet on your account; super-admin accounts must always send it.
            </p>
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-slate-300 space-y-1">
              <p><span className="text-amber-400">Base URL:</span> https://api.alaynai.com/api/v1</p>
              <p><span className="text-amber-400">Authorization:</span> Bearer &lt;accessToken&gt;</p>
              <p><span className="text-amber-400">x-outlet-id:</span> &lt;outlet-uuid&gt;</p>
            </div>
          </section>

          {/* Responses & errors */}
          <section id="responses" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">RESPONSES &amp; ERRORS</span>
            <h2 className="text-2xl font-bold text-white mb-3">One envelope for every response</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              Successful responses wrap the result in <code className="text-amber-400">data</code>; lists add a <code className="text-amber-400">meta</code> object with <code>limit</code>, <code>offset</code> and <code>total</code>. Errors return an HTTP status code and a machine-readable <code className="text-amber-400">code</code>.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 overflow-x-auto">
                <pre>{`{
  "success": true,
  "data": [ … ],
  "meta": { "limit": 20, "offset": 0, "total": 134 }
}`}</pre>
              </div>
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 overflow-x-auto">
                <pre>{`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No authentication token provided"
  }
}`}</pre>
              </div>
            </div>
          </section>

          {/* Endpoint groups */}
          <section id="endpoints" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">ENDPOINTS</span>
            <h2 className="text-2xl font-bold text-white mb-3">What the API covers</h2>
            <p className="text-sm text-slate-400 font-light mb-5">
              All paths sit under <code className="text-amber-400">/api/v1</code>. Request and response schemas for the documented operations are in the interactive reference and <code className="text-amber-400">openapi.json</code>.
            </p>
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
              {ENDPOINT_GROUPS.map(([path, what]) => (
                <div key={path} className="flex gap-3 border-b border-white/5 py-2">
                  <code className="w-36 shrink-0 text-amber-400 font-mono text-xs pt-0.5">{path}</code>
                  <span className="text-slate-300 font-light">{what}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limits" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">RATE LIMITING</span>
            <h2 className="text-2xl font-bold text-white mb-3">Rate Limits</h2>
            <p className="text-sm text-slate-400 font-light mb-4">
              Authenticated endpoints are not rate limited today. Public, unauthenticated endpoints are limited per IP address:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-xs sm:text-sm text-slate-300 font-mono">
              <li><strong className="text-amber-400">QR table menu</strong> (<code>GET /api/v1/orders/tables/:token/menu</code>): 10 requests per minute</li>
              <li><strong className="text-amber-400">Customer feedback</strong> (<code>POST /api/v1/tickets/feedback</code>): 5 requests per 15 minutes</li>
              <li><strong className="text-amber-400">Password reset</strong> (<code>POST /api/v1/auth/forgot-password</code>): 5 requests per 15 minutes</li>
              <li><strong className="text-amber-400">HTTP 429:</strong> returned when a limit is exceeded, with a <code>Retry-After</code> header</li>
            </ul>
          </section>

          {/* Versioning & access */}
          <section id="versioning" className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02]">
            <span className="text-xs font-mono text-amber-400 font-bold block mb-2">VERSIONING &amp; ACCESS</span>
            <h2 className="text-2xl font-bold text-white mb-3">What&apos;s available today</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-slate-300 font-light">
              <li>The current version is <code className="text-amber-400">v1</code>, in the URL path.</li>
              <li>Access uses Alayn user accounts. There are no separate API keys, webhooks or official SDK or CLI yet.</li>
              <li>Planning an integration with a POS, delivery platform or accounting tool? Write to <a href="mailto:sales@alaynai.com" className="text-amber-400 hover:underline">sales@alaynai.com</a>.</li>
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
