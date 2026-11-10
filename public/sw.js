// Service worker (feature PWA): offline read-only itinerary and budget.
// Network first for pages and GET API calls; the last good response is
// kept and served when offline. Writes are never cached or queued.
const CACHE = "parche-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

function cacheable(request) {
  if (request.method !== "GET") {
    return false;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return false;
  }
  // Auth endpoints and the agent must always hit the network.
  if (url.pathname.startsWith("/api/auth") || url.pathname.includes("/agent")) {
    return false;
  }
  return (
    request.mode === "navigate" ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/api/v1/") ||
    request.headers.get("RSC") === "1"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!cacheable(request)) {
    return;
  }
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        return cached ?? Response.error();
      }),
  );
});
