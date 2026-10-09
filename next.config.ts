import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        ],
      },
    ];
  },
};

export default nextConfig;
