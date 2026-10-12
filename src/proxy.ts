import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MARKDOWN_PAGES } from "./lib/agent-markdown";

// Only the API version header is sent. Deprecation/Sunset/RateLimit headers
// were attached to every page, declaring the whole site deprecated (sunset
// 2028) to crawlers and agents, and the rate-limit values weren't enforced.
function attachHeaders(res: NextResponse) {
  res.headers.set("x-api-version", "1.0.0");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Serve the Markdown version when one exists. Pages without one fall
  // through to their HTML: answering 404 would tell agents a real page
  // doesn't exist.
  if (prefersMarkdown && MARKDOWN_PAGES[normalizedPath]) {
    const res = new NextResponse(MARKDOWN_PAGES[normalizedPath], {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept, Accept-Encoding",
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
    attachHeaders(res);
    return res;
  }

  const response = NextResponse.next();
  const existingVary = response.headers.get("Vary");
  if (!existingVary) {
    response.headers.set("Vary", "Accept, Accept-Encoding");
  } else if (!existingVary.includes("Accept")) {
    response.headers.set("Vary", `${existingVary}, Accept`);
  }
  attachHeaders(response);
  return response;
}

export default proxy;

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
