/**
 * Registers the POS service worker (public/sw.js) so the POS page itself opens with no internet.
 * Production only: in development it would fight Next's hot reload.
 */
export async function registerPosServiceWorker() {
  if (process.env.NODE_ENV !== "production" || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
    const registration = await navigator.serviceWorker.ready;
    // Files this page loaded before the worker took over: hand them over so they are cached too
    const urls = [
      "/pos",
      ...performance
        .getEntriesByType("resource")
        .map((e) => e.name)
        .filter((name) => name.includes("/_next/static/")),
    ];
    registration.active?.postMessage({ type: "CACHE_URLS", urls });
  } catch {
    // No service worker: the POS still bills offline while it stays open, it just can't be reopened offline
  }
}
