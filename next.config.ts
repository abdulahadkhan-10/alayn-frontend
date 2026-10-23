import type { NextConfig } from "next";
import path from "path";

// Origins the browser talks to, taken from the same env vars the app uses so
// the policy follows whatever API host a build points at.
function originOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}
const apiOrigins = [
  originOf(process.env.NEXT_PUBLIC_API_URL),
  originOf(process.env.NEXT_PUBLIC_API_URI),
  originOf(process.env.NEXT_PUBLIC_SOCKET_URL),
].filter((o): o is string => o !== null);
// socket.io upgrades to a websocket on the same host.
const socketOrigins = apiOrigins.map((o) => o.replace(/^http/, "ws"));

// Next's prerendered pages bootstrap with inline scripts, so script-src needs
// 'unsafe-inline' unless every page renders dynamically with nonces.
// Cashfree's SDK and checkout frame, the Tailwind CDN used inside the receipt
// print window (popups inherit this policy), and OpenStreetMap geocoding in
// settings are the third parties the app loads.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://sdk.cashfree.com https://cdn.tailwindcss.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  ["connect-src 'self'", ...apiOrigins, ...socketOrigins, "https://nominatim.openstreetmap.org", "https://*.cashfree.com"].join(" "),
  "frame-src https://*.cashfree.com",
  "frame-ancestors 'self'",
  "form-action 'self' https://*.cashfree.com",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/uploads/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.alaynai.com" }],
        destination: "https://alaynai.com/:path*",
        permanent: true,
      },
      // There is no Alayn CLI or separate deprecation programme; both pages
      // described things that don't exist. Send visitors to the real API docs.
      { source: "/cli", destination: "/api-docs#versioning", permanent: true },
      { source: "/deprecation", destination: "/api-docs#versioning", permanent: true },
      // Short aliases. A redirect() inside the page answers 200 and redirects
      // in the client, which search engines treat as a duplicate page rather
      // than a move; a config redirect answers with a real 308.
      { source: "/privacy", destination: "/legal/privacy", permanent: true },
      { source: "/docs", destination: "/api-docs", permanent: true },
      { source: "/developers", destination: "/api-docs", permanent: true },
      // Agents guess /demo when looking for how to book one.
      { source: "/demo", destination: "/contact", permanent: true },
      // Common commercial search slug aliases for billing software.
      { source: "/restaurant-billing-software", destination: "/billing-software", permanent: true },
      { source: "/pos-billing-software", destination: "/billing-software", permanent: true },
      { source: "/gst-billing-software", destination: "/billing-software", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Deprecation/Sunset/RateLimit headers used to be sent on every page,
          // which told crawlers the whole site would be retired in 2028.
          { key: "Vary", value: "Accept, Accept-Encoding" },
          // No includeSubDomains: not every alaynai.com subdomain is known to
          // serve HTTPS, and HSTS on the apex alone is safe to roll back.
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Attendance and settings pages use geolocation; nothing uses the
          // camera or microphone.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          // Report-Only: violations are logged in the browser console and
          // nothing is blocked. Once a production payment and a receipt print
          // run without violations, rename the key to Content-Security-Policy
          // to enforce it. Skipped in dev, where HMR needs eval and websockets.
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
