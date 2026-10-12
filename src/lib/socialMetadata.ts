import type { Metadata } from "next";

const SITE_URL = "https://alaynai.com";
const SHARE_IMAGE = { url: "/alaynlogo.png", width: 1200, height: 630, alt: "Alayn AI" };

// Metadata merges shallowly, so a page that sets no openGraph/twitter of its
// own shares the homepage's title and description. Every indexable page
// spreads this in with its own title, description and path.
export function socialMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: "Alayn AI",
      locale: "en_IN",
      type: "website",
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SHARE_IMAGE.url],
    },
  };
}
