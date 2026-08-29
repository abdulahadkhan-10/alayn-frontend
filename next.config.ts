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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Vary", value: "Accept, Accept-Encoding" },
          { key: "RateLimit-Limit", value: "100" },
          { key: "RateLimit-Remaining", value: "99" },
          { key: "RateLimit-Reset", value: "60" },
          { key: "RateLimit-Policy", value: "100;w=60" },
          { key: "x-api-version", value: "1.0.0" },
          { key: "Deprecation", value: "@1798761600" },
          { key: "Sunset", value: "Sat, 01 Jan 2028 00:00:00 GMT" },
          { key: "Link", value: '<https://alaynai.com/deprecation>; rel="deprecation"' },
        ],
      },
    ];
  },
};

export default nextConfig;
