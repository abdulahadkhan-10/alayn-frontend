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
