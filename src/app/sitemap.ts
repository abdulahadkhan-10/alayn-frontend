import { MetadataRoute } from "next";
import { PUBLIC_PATHS } from "@/lib/site-routes";

// No lastModified: stamping every URL with the build time teaches Google to
// ignore the field. Add a real date per page if you start tracking one.
// changeFrequency and priority are ignored by Google, so they're left out.
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://alaynai.com";
  return PUBLIC_PATHS.map((path) => ({ url: `${baseUrl}${path}` }));
}
