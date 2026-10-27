// Alayn POS service worker: lets the POS page open with no internet so the till can keep billing.
//
// It only ever stores the app's own files (the /pos page and Next's hashed /_next/static bundles).
// API calls are never cached here: offline bills live in IndexedDB and sync through the API later.

const CACHE = "alayn-pos-v1";
const OFFLINE_PAGES = ["/pos"];

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("alayn-pos-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// The page lists the files it already loaded before this worker was in control, so they are on hand offline
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls)) return;
  const urls = event.data.urls.filter((u) => {
    try {
      const url = new URL(u, self.location.origin);
      return url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || OFFLINE_PAGES.includes(url.pathname));
    } catch {
      return false;
    }
  });
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(urls.map((u) => cache.add(u).catch(() => undefined)))));
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Hashed build files never change: serve from the cache, fetch and keep them the first time
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              void caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // The POS page: always the live one when online, the last saved one when not
  if (request.mode === "navigate" && OFFLINE_PAGES.includes(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            void caches.open(CACHE).then((cache) => cache.put(url.pathname, copy));
          }
          return res;
        })
        .catch(() => caches.match(url.pathname).then((hit) => hit || Response.error()))
    );
  }
});
