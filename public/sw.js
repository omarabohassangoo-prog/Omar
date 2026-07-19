const CACHE_NAME = 'fluentway-v1';
const CACHE_FILES = [
  '/',
  '/index.html',
  '/story_data.json',
  '/grammar_rules.json',
  '/complete_vocabulary.json',
  '/complete_data.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
