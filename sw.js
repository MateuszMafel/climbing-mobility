const CACHE_NAME = 'climber-mobility-v4';
const ASSETS = [
  './',
  './climbing-mobility-app.html',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700;800&display=swap'
];

// Install: cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for local assets, network-first for external (fonts, thumbnails)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // YouTube thumbnails: cache with network fallback
  if (url.hostname === 'img.youtube.com') {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fetched = fetch(e.request).then(resp => {
            if (resp.ok) cache.put(e.request, resp.clone());
            return resp;
          }).catch(() => cached);
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Google Fonts: stale-while-revalidate
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(e.request).then(cached => {
          const fetched = fetch(e.request).then(resp => {
            cache.put(e.request, resp.clone());
            return resp;
          });
          return cached || fetched;
        })
      )
    );
    return;
  }

  // Local assets: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
