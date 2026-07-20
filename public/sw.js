const CACHE_NAME = 'fluentway-v3';
const CACHE_FILES = [
  './',
  './index.html',
  './story_data.json',
  './grammar_rules.json',
  './complete_vocabulary.json',
  './complete_data.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Use Network-First strategy for all requests to ensure updates
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache the new response if it's successful and GET request
        if (event.request.method === 'GET' && networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache if network fails (offline mode)
        return caches.match(event.request);
      })
  );
});
