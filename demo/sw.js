/* ============================================================
   Service worker — offline support.
   ------------------------------------------------------------
   The only reason this file exists: so the demo opens and runs
   in a shop with no usable signal, after you have loaded it
   once on a good connection.

   Strategy is "network first, fall back to cache" so you always
   get the latest version when you DO have signal, and never get
   a blank screen when you don't.
   ============================================================ */

const CACHE = 'meridian-demo-v1';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/meridian-logo.png',
];

self.addEventListener('install', (event) => {
  // Take over immediately rather than waiting for every tab to close.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES)).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle same-origin GETs. Google Fonts and anything else falls through
  // to the network untouched, and simply doesn't render if offline.
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
