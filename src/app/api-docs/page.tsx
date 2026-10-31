import type { Metadata } from "next";
import { socialMetadata } from "@/lib/socialMetadata";
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
    types: { "text/markdown": `${siteUrl}/api-docs.md` },
  },
  ...socialMetadata({ title, description, path: "/api-docs" }),
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

const inlineCodeClass = "rounded bg-[var(--cream-light)] px-1.5 py-0.5 font-mono text-[13px] font-medium text-[var(--espresso)] ring-1 ring-[var(--border-warm)]";

export default function ApiDocsPage() {
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
            ALAYN API
          </span>
          <h1 className="hero-headline text-balance text-[2.6rem] sm:text-6xl">
            API Reference
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--muted)]">
            The Alayn app runs on a REST API, and the same API is available to your own integrations. You sign in with an Alayn account and act with that account&apos;s role and outlets.
          </p>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap gap-3 font-mono text-xs">
          <a
            href="https://api.alaynai.com/api/docs"
            className="inline-flex min-h-10 items-center rounded-full bg-[var(--espresso)] px-5 py-2 font-semibold text-white transition-colors hover:bg-[var(--espresso-mid)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            Interactive reference (Swagger)
          </a>
          <Link
            href="/openapi.json"
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--border-warm)] bg-white px-5 py-2 font-medium text-[var(--espresso)] transition-colors hover:border-[var(--espresso)]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            openapi.json (OpenAPI 3.0)
          </Link>
          <Link
            href="/llms.txt"
            className="inline-flex min-h-10 items-center rounded-full border border-[var(--border-warm)] bg-white px-5 py-2 font-medium text-[var(--espresso)] transition-colors hover:border-[var(--espresso)]/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
          >
            llms.txt
          </Link>
        </div>

        <div className="mt-12 space-y-8">
          {/* Getting started */}
          <section id="authentication" className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 sm:p-8">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[var(--amber)]">AUTHENTICATION</span>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-[-0.015em] text-[var(--espresso)]">Log in, then send a Bearer token</h2>
            <p className="mb-5 text-[15px] leading-relaxed text-[var(--muted)]">
              Exchange an Alayn account&apos;s email and password for an access token, and send it on every request. When it expires, call <code className={inlineCodeClass}>/api/v1/auth/refresh</code> with the refresh token.
            </p>
            <div className="overflow-x-auto rounded-xl bg-[var(--espresso)] p-5 font-mono text-xs leading-relaxed text-[var(--chip-on-dark)] selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)]">
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
          <section id="outlets" className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 sm:p-8">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[var(--amber)]">BASE URL &amp; OUTLETS</span>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-[-0.015em] text-[var(--espresso)]">Every request is scoped to an outlet</h2>
            <p className="mb-5 text-[15px] leading-relaxed text-[var(--muted)]">
              Pass the outlet&apos;s ID in the <code className={inlineCodeClass}>x-outlet-id</code> header. If you leave it out, the API uses the first outlet on your account; super-admin accounts must always send it.
            </p>
            <div className="space-y-1.5 rounded-xl bg-[var(--espresso)] p-5 font-mono text-xs text-[var(--chip-on-dark)] selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)]">
              <p><span className="font-semibold text-[var(--amber-on-dark)]">Base URL:</span> https://api.alaynai.com/api/v1</p>
              <p><span className="font-semibold text-[var(--amber-on-dark)]">Authorization:</span> Bearer &lt;accessToken&gt;</p>
              <p><span className="font-semibold text-[var(--amber-on-dark)]">x-outlet-id:</span> &lt;outlet-uuid&gt;</p>
            </div>
          </section>

          {/* Responses & errors */}
          <section id="responses" className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 sm:p-8">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[var(--amber)]">RESPONSES &amp; ERRORS</span>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-[-0.015em] text-[var(--espresso)]">One envelope for every response</h2>
            <p className="mb-5 text-[15px] leading-relaxed text-[var(--muted)]">
              Successful responses wrap the result in <code className={inlineCodeClass}>data</code>; lists add a <code className={inlineCodeClass}>meta</code> object with <code className={inlineCodeClass}>limit</code>, <code className={inlineCodeClass}>offset</code> and <code className={inlineCodeClass}>total</code>. Errors return an HTTP status code and a machine-readable <code className={inlineCodeClass}>code</code>.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="overflow-x-auto rounded-xl bg-[var(--espresso)] p-5 font-mono text-xs leading-relaxed text-[var(--chip-on-dark)] selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)]">
                <pre>{`{
  "success": true,
  "data": [ … ],
  "meta": { "limit": 20, "offset": 0, "total": 134 }
}`}</pre>
              </div>
              <div className="overflow-x-auto rounded-xl bg-[var(--espresso)] p-5 font-mono text-xs leading-relaxed text-[var(--chip-on-dark)] selection:bg-[var(--amber-on-dark)] selection:text-[var(--espresso)]">
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
          <section id="endpoints" className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 sm:p-8">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[var(--amber)]">ENDPOINTS</span>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-[-0.015em] text-[var(--espresso)]">What the API covers</h2>
            <p className="mb-6 text-[15px] leading-relaxed text-[var(--muted)]">
              All paths sit under <code className={inlineCodeClass}>/api/v1</code>. Request and response schemas for the documented operations are in the interactive reference and <code className={inlineCodeClass}>openapi.json</code>.
            </p>
            <div className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
              {ENDPOINT_GROUPS.map(([path, what]) => (
                <div key={path} className="flex gap-3 border-b border-[var(--border-warm)] py-2.5">
                  <code className="w-36 shrink-0 pt-0.5 font-mono text-xs font-semibold text-[var(--amber)]">{path}</code>
                  <span className="text-[var(--muted)]">{what}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limits" className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 sm:p-8">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[var(--amber)]">RATE LIMITING</span>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-[-0.015em] text-[var(--espresso)]">Rate Limits</h2>
            <p className="mb-4 text-[15px] leading-relaxed text-[var(--muted)]">
              Authenticated endpoints are not rate limited today. Public, unauthenticated endpoints are limited per IP address:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-sm leading-relaxed text-[var(--muted)] marker:text-[var(--amber)]">
              <li><strong className="font-semibold text-[var(--espresso)]">QR table menu</strong> (<code className={inlineCodeClass}>GET /api/v1/orders/tables/:token/menu</code>): 10 requests per minute</li>
              <li><strong className="font-semibold text-[var(--espresso)]">Customer feedback</strong> (<code className={inlineCodeClass}>POST /api/v1/tickets/feedback</code>): 5 requests per 15 minutes</li>
              <li><strong className="font-semibold text-[var(--espresso)]">Password reset</strong> (<code className={inlineCodeClass}>POST /api/v1/auth/forgot-password</code>): 5 requests per 15 minutes</li>
              <li><strong className="font-semibold text-[var(--espresso)]">HTTP 429:</strong> returned when a limit is exceeded, with a <code className={inlineCodeClass}>Retry-After</code> header</li>
            </ul>
          </section>

          {/* Versioning & access */}
          <section id="versioning" className="rounded-2xl border border-[var(--border-warm)] bg-white p-6 sm:p-8">
            <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-wider text-[var(--amber)]">VERSIONING &amp; ACCESS</span>
            <h2 className="mb-3 font-heading text-2xl font-bold tracking-[-0.015em] text-[var(--espresso)]">What&apos;s available today</h2>
            <ul className="list-disc space-y-2.5 pl-6 text-[15px] leading-relaxed text-[var(--muted)] marker:text-[var(--amber)]">
              <li>The current version is <code className={inlineCodeClass}>v1</code>, in the URL path.</li>
              <li>Breaking changes ship as a new version. A deprecated version keeps working for at least 6 months after its deprecation is announced on this page.</li>
              <li>Every response carries <code className={inlineCodeClass}>RateLimit-Limit</code>, <code className={inlineCodeClass}>RateLimit-Remaining</code> and <code className={inlineCodeClass}>RateLimit-Reset</code> headers. The API allows 1,000 requests per minute per IP, with stricter limits on login, QR menus and feedback. A 429 response includes <code className={inlineCodeClass}>Retry-After</code>.</li>
              <li>Access uses Alayn user accounts. There are no separate API keys, webhooks or official SDK or CLI yet.</li>
              <li>
                Planning an integration with a POS, delivery platform or accounting tool? Write to{" "}
                <a href="mailto:info@alaynai.com" className="font-medium text-[var(--amber)] underline underline-offset-4 hover:text-[var(--espresso)]">
                  info@alaynai.com
                </a>
                .
              </li>
            </ul>
          </section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
