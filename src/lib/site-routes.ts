// Every route the site serves. The sitemap lists PUBLIC_PATHS, robots.txt
// disallows PRIVATE_APP_SECTIONS, and the proxy uses both to tell a real page
// from a missing one when an agent asks for Markdown.

// Indexable marketing and legal pages ("" is the homepage).
export const PUBLIC_PATHS = [
  "",
  "/features",
  "/pricing",
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

// Signed-in app sections, kept out of search.
export const PRIVATE_APP_SECTIONS = [
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
];

// App sections that are public but not worth indexing on their own.
const OTHER_APP_SECTIONS = ["/login", "/signup", "/forgot-password", "/order", "/support"];

export function isKnownRoute(path: string): boolean {
  if (path === "/" || PUBLIC_PATHS.includes(path)) return true;
  return [...PRIVATE_APP_SECTIONS, ...OTHER_APP_SECTIONS].some(
    (section) => path === section || path.startsWith(`${section}/`)
  );
}
