import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/signup"],
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
        "/support",
      ],
    },
    sitemap: "https://alaynai.com/sitemap.xml",
  };
}
