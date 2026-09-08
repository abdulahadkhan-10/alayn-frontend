import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/about",
        "/contact",
        "/api-docs",
        "/cli",
        "/deprecation",
        "/openapi.json",
        "/llms.txt",
        "/llms-full.txt",
        "/legal/",
        "/login",
        "/signup",
        "/privacy",
        "/sitemap.xml",
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
