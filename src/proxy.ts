import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MARKDOWN_PAGES, getAgent404Markdown } from "./lib/agent-markdown";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static assets, internal Next.js routes, API routes, and public asset files with extensions
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // e.g. /favicon.ico, /alaynlogo.png, /sitemap.xml, /llms.txt, /robots.txt
  ) {
    const response = NextResponse.next();
    response.headers.set("Vary", "Accept, Accept-Encoding");
    return response;
  }

  const acceptHeader = request.headers.get("accept") || "";
  const prefersMarkdown =
    acceptHeader.includes("text/markdown") ||
    acceptHeader.includes("text/x-markdown");

  // Normalize pathname: remove trailing slash if not root
  const normalizedPath = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (prefersMarkdown) {
    // 1. Check if we have pre-rendered high-signal markdown for this page
    if (MARKDOWN_PAGES[normalizedPath]) {
      return new NextResponse(MARKDOWN_PAGES[normalizedPath], {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept, Accept-Encoding",
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        },
      });
    }

    // 2. Return structured 404 Markdown body
    return new NextResponse(getAgent404Markdown(pathname), {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept, Accept-Encoding",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // Standard HTML requests: ensure Vary header
  const response = NextResponse.next();
  const existingVary = response.headers.get("Vary");

  if (!existingVary) {
    response.headers.set("Vary", "Accept, Accept-Encoding");
  } else if (!existingVary.includes("Accept")) {
    response.headers.set("Vary", `${existingVary}, Accept`);
  }

  return response;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};
