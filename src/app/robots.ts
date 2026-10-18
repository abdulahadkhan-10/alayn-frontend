import { MetadataRoute } from "next";
import { PRIVATE_APP_SECTIONS } from "@/lib/site-routes";

// No host: Host is a Yandex-only directive that other crawlers flag as
// invalid; the canonical domain comes from canonical tags and the redirect.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/features",
        "/pricing",
        "/about",
        "/contact",
        "/api-docs",
        "/openapi.json",
        "/llms.txt",
        "/llms-full.txt",
        "/legal/",
        "/login",
        "/signup",
        "/sitemap.xml",
      ],
      disallow: PRIVATE_APP_SECTIONS,
    },
    sitemap: "https://alaynai.com/sitemap.xml",
  };
}
