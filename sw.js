/* Divine Guest Lodge — service worker
   Strategy:
     - HTML (navigations): network-first, cache fallback (offline-safe)
     - Images / fonts: cache-first, long-lived
     - Google Fonts CSS: stale-while-revalidate
     - Everything else same-origin: stale-while-revalidate
   Bump VERSION to invalidate all caches on next visit. */

const VERSION       = 'v1.10.1';
const STATIC_CACHE  = `dgl-static-${VERSION}`;
const IMAGE_CACHE   = `dgl-images-${VERSION}`;
const FONT_CACHE    = `dgl-fonts-${VERSION}`;
const RUNTIME_CACHE = `dgl-runtime-${VERSION}`;
const ALL_CACHES    = [STATIC_CACHE, IMAGE_CACHE, FONT_CACHE, RUNTIME_CACHE];

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/fonts/PlusJakartaSans/PlusJakartaSans-Variable.woff2',
  '/fonts/Inter/Inter-Variable-Latin.woff2',
  '/images/hero/Divine-boutique-hotel-deluxe-front-view-1600.avif',
  '/images/hero/Divine-boutique-hotel-deluxe-front-view-1200.avif',
  '/images/hero/Divine-boutique-hotel-deluxe-front-view-800.avif',
  '/images/logo/Divine-Guest-lodge.avif',
];

const MAX_IMAGE_ENTRIES = 60;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k.startsWith('dgl-') && !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function trimCache(cacheName, maxEntries) {
  caches.open(cacheName).then((cache) => cache.keys().then((keys) => {
    if (keys.length <= maxEntries) return;
    cache.delete(keys[0]).then(() => trimCache(cacheName, maxEntries));
  }));
}

function isImageRequest(req) {
  return req.destination === 'image';
}

function isFontRequest(url) {
  return url.origin === 'https://fonts.gstatic.com';
}

function isFontCss(url) {
  return url.origin === 'https://fonts.googleapis.com';
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (req.mode === 'navigate' || (req.destination === 'document')) {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match('/index.html')))
    );
    return;
  }

  if (isImageRequest(req) && url.origin === self.location.origin) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          if (cached) return cached;
          return fetch(req).then((res) => {
            if (res && res.status === 200) {
              cache.put(req, res.clone());
              trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
            }
            return res;
          });
        })
      )
    );
    return;
  }

  if (isFontRequest(url)) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(req).then((cached) => cached || fetch(req).then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        }))
      )
    );
    return;
  }

  if (isFontCss(url) || url.origin === self.location.origin) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(req).then((cached) => {
          const network = fetch(req).then((res) => {
            if (res && res.status === 200) cache.put(req, res.clone());
            return res;
          }).catch(() => cached);
          return cached || network;
        })
      )
    );
  }
});
