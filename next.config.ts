import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        ],
      },
    ];
  },
};

export default nextConfig;
