import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MARKDOWN_PAGES, getAgent404Markdown } from "./lib/agent-markdown";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal Next.js routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    const response = NextResponse.next();
    response.headers.set("Vary", "Accept, Accept-Encoding");
    response.headers.set("RateLimit-Limit", "100");
    response.headers.set("RateLimit-Remaining", "99");
    response.headers.set("RateLimit-Reset", "60");
    response.headers.set("RateLimit-Policy", "100;w=60");
    return response;
  }

  const acceptHeader = request.headers.get("accept") || "";
  const prefersMarkdown =
    acceptHeader.includes("text/markdown") ||
    acceptHeader.includes("text/x-markdown");

  const normalizedPath = pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;

  if (prefersMarkdown) {
    if (MARKDOWN_PAGES[normalizedPath]) {
      return new NextResponse(MARKDOWN_PAGES[normalizedPath], {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Vary": "Accept, Accept-Encoding",
          "RateLimit-Limit": "100",
          "RateLimit-Remaining": "99",
          "RateLimit-Reset": "60",
          "RateLimit-Policy": "100;w=60",
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
        },
      });
    }

    return new NextResponse(getAgent404Markdown(pathname), {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept, Accept-Encoding",
        "RateLimit-Limit": "100",
        "RateLimit-Remaining": "99",
        "RateLimit-Reset": "60",
        "RateLimit-Policy": "100;w=60",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  const response = NextResponse.next();
  const existingVary = response.headers.get("Vary");

  if (!existingVary) {
    response.headers.set("Vary", "Accept, Accept-Encoding");
  } else if (!existingVary.includes("Accept")) {
    response.headers.set("Vary", `${existingVary}, Accept`);
  }

  response.headers.set("RateLimit-Limit", "100");
  response.headers.set("RateLimit-Remaining", "99");
  response.headers.set("RateLimit-Reset", "60");
  response.headers.set("RateLimit-Policy", "100;w=60");

  return response;
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image).*)",
  ],
};
