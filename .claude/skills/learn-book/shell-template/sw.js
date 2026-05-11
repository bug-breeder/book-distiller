// Opportunistic cache for Pyodide assets. On every fetch under /assets/, /public/,
// or for *.wasm, serve from cache if present, otherwise fetch from network and cache.
// First chapter pays the ~27MB Pyodide cost; subsequent chapters are served from cache.
const CACHE = "learn-book-v1";

const shouldCache = url => {
  const u = new URL(url);
  if (u.origin !== self.location.origin) return false;
  return u.pathname.includes("/assets/")
      || u.pathname.includes("/public/")
      || u.pathname.endsWith(".wasm")
      || u.pathname.endsWith(".whl");
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (!shouldCache(event.request.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(event.request);
    if (hit) return hit;
    const resp = await fetch(event.request);
    if (resp.ok) cache.put(event.request, resp.clone());
    return resp;
  })());
});
