import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/contact",
        "/privacy",
        "/legal/*",
        "/api-docs",
        "/login",
        "/signup",
        "/llms.txt",
        "/llms-full.txt",
        "/sitemap.xml",
        "/openapi.json",
      ],
      disallow: [
        "/dashboard",
        "/inventory",
        "/kitchen",
        "/pos",
        "/menu",
        "/orders",
        "/outlets",
        "/performance",
        "/profile",
        "/settings",
        "/supplier",
        "/tables",
        "/waste",
        "/workforce",
        "/attendance-terminal",
        "/notifications",
      ],
    },
    sitemap: "https://alaynai.com/sitemap.xml",
    host: "https://alaynai.com",
  };
}
