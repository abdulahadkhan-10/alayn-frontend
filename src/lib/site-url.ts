// Alayn runs two sites: alayn.in for India and alaynai.com for the UK and
// every other country. Each page names its own domain as canonical and lists
// both versions as hreflang alternates, so search engines and AI search send
// Indian visitors to alayn.in and everyone else to alaynai.com. The other
// site's pages must list the same pair, or search engines ignore the tags.
export const INDIA_URL = "https://alayn.in";
export const INTERNATIONAL_URL = "https://alaynai.com";
export const SITE_URL = INDIA_URL;

// path is "" for the homepage, otherwise "/pricing" etc.
export function regionAlternates(path: string) {
  return {
    "en-IN": `${INDIA_URL}${path}`,
    "x-default": `${INTERNATIONAL_URL}${path}`,
  };
}
