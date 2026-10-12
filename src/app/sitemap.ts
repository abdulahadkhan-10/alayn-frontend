import { MetadataRoute } from "next";

// No lastModified: stamping every URL with the build time teaches Google to
// ignore the field. Add a real date per page if you start tracking one.
// changeFrequency and priority are ignored by Google, so they're left out.
const PATHS = [
  "",
  "/about",
  "/contact",
  "/api-docs",
  "/legal/privacy",
  "/legal/terms",
  "/legal/cookie",
  "/legal/security",
  "/legal/responsible-ai",
  "/legal/corporate",
  "/legal/support",
  "/legal/refund",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://alaynai.com";
  return PATHS.map((path) => ({ url: `${baseUrl}${path}` }));
}
