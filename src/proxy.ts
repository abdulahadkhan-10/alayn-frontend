import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MARKDOWN_PAGES } from "./lib/agent-markdown";
import { isKnownRoute } from "./lib/site-routes";

// Only the API version header is sent. Deprecation/Sunset/RateLimit headers
// were attached to every page, declaring the whole site deprecated (sunset
// 2028) to crawlers and agents, and the rate-limit values weren't enforced.
function attachHeaders(res: NextResponse) {
  res.headers.set("x-api-version", "1.0.0");
}

function markdownResponse(body: string, status: number) {
  const res = new NextResponse(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Vary": "Accept, Accept-Encoding",
      "Cache-Control": status === 200
        ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"
        : "public, max-age=300",
    },
  });
  attachHeaders(res);
  return res;
}

const MARKDOWN_NOT_FOUND = `# 404 — Page not found

There is no page at this address on alaynai.com. Alayn AI is a restaurant billing software and operating system: GST POS billing, kitchen display, FEFO inventory, waste tracking and staff scheduling for restaurants, cafés and cloud kitchens.

Try one of these instead:

- [Home](https://alaynai.com/)
- [Restaurant Billing Software & POS](https://alaynai.com/billing-software)
- [Features](https://alaynai.com/features)
- [Pricing](https://alaynai.com/pricing)
- [Contact and demos](https://alaynai.com/contact)
- [API reference](https://alaynai.com/api-docs)
- [LLM index](https://alaynai.com/llms.txt)
- [Sitemap](https://alaynai.com/sitemap.xml)
`;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Plain .md URLs (/index.md, /pricing.md) for agents whose fetch tools
  // can't set an Accept header. Checked before the "." skip below.
  if (pathname.endsWith(".md")) {
    const pagePath = pathname === "/index.md" ? "/" : pathname.slice(0, -3);
    if (MARKDOWN_PAGES[pagePath]) {
      return markdownResponse(MARKDOWN_PAGES[pagePath], 200);
    }
  }

  if (
    pathname.startsWith("/_next") ||
    // "/api/" with the slash: a bare "/api" prefix also matched /api-docs,
    // which has a Markdown version.
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    const response = NextResponse.next();
    response.headers.set("Vary", "Accept, Accept-Encoding");
    attachHeaders(response);
    return response;
  }

  const acceptHeader = request.headers.get("accept") || "";
  const prefersMarkdown =
    acceptHeader.includes("text/markdown") ||
    acceptHeader.includes("text/x-markdown");

  const normalizedPath = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  // Serve the Markdown version when one exists. Real pages without one fall
  // through to their HTML: answering 404 would tell agents a real page
  // doesn't exist. Paths that aren't routes at all get a Markdown 404.
  if (prefersMarkdown) {
    if (MARKDOWN_PAGES[normalizedPath]) {
      return markdownResponse(MARKDOWN_PAGES[normalizedPath], 200);
    }
    if (!isKnownRoute(normalizedPath)) {
      return markdownResponse(MARKDOWN_NOT_FOUND, 404);
    }
  }

  const response = NextResponse.next();
  const existingVary = response.headers.get("Vary");
  if (!existingVary) {
    response.headers.set("Vary", "Accept, Accept-Encoding");
  } else if (!existingVary.includes("Accept")) {
    response.headers.set("Vary", `${existingVary}, Accept`);
  }
  // Point agents at the Markdown before any HTML arrives. The homepage's
  // <head> alone is several KB of framework tags, so an agent that reads
  // only the start of a response never reaches the page text.
  const links = ['</llms.txt>; rel="describedby"; type="text/plain"'];
  if (MARKDOWN_PAGES[normalizedPath]) {
    const mdPath = normalizedPath === "/" ? "/index.md" : `${normalizedPath}.md`;
    links.unshift(`<${mdPath}>; rel="alternate"; type="text/markdown"`);
  }
  response.headers.set("Link", links.join(", "));
  attachHeaders(response);
  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
