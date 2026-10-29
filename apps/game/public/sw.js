// Keeps the game playable offline once loaded: the page from the network first (so updates
// arrive), hashed assets from the cache first.
const CACHE = 'theledger-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const isPage = request.mode === 'navigate';
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      if (isPage) {
        try {
          const fresh = await fetch(request);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          return (await cache.match(request)) ?? Response.error();
        }
      }
      const cached = await cache.match(request);
      if (cached) return cached;
      const fresh = await fetch(request);
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    }),
  );
});
