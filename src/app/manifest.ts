import type { MetadataRoute } from "next";

// Lets a till "install" the POS (home screen / desktop app), which then opens straight into billing
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alayn POS",
    short_name: "Alayn",
    description: "Restaurant billing that keeps working when the internet drops.",
    start_url: "/pos",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#1B2A4A",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
