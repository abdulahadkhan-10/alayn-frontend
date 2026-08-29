import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { MARKDOWN_PAGES, getAgent404Markdown } from "./lib/agent-markdown";

function attachHeaders(res: NextResponse) {
  res.headers.set("RateLimit-Limit", "100");
  res.headers.set("RateLimit-Remaining", "99");
  res.headers.set("RateLimit-Reset", "60");
  res.headers.set("RateLimit-Policy", "100;w=60");
  res.headers.set("x-api-version", "1.0.0");
  res.headers.set("Deprecation", "@1798761600");
  res.headers.set("Sunset", "Sat, 01 Jan 2028 00:00:00 GMT");
  res.headers.set("Link", '<https://alaynai.com/deprecation>; rel="deprecation"');
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
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

  if (prefersMarkdown) {
    if (MARKDOWN_PAGES[normalizedPath]) {
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

    const res = new NextResponse(getAgent404Markdown(pathname), {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept, Accept-Encoding",
        "Cache-Control": "no-cache, no-store, must-revalidate",
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
