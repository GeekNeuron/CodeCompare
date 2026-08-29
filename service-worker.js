const CACHE_NAME = 'codecompare-cache-v1';
const APP_SHELL = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './diff-utils.js',
    './share-utils.js',
    './json-utils.js',
    './lib/prism.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

// Cache-first for the app shell (same-origin). Everything else (CDN fonts/plugins)
// goes to the network as usual, so we don't try to manage third-party caching/CORS here.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            return cached || fetch(event.request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            }).catch(() => cached);
        })
    );
});
