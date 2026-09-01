const CACHE_NAME = 'codecompare-cache-v2';
const PRISM_CACHE_NAME = 'codecompare-prism-cdn-v1';
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

// Prism's CDN assets are versioned in the URL (e.g. .../prism/1.30.0/...), so they
// never change once published - safe to cache indefinitely once fetched.
function isPrismCdnRequest(url) {
    return url.hostname === 'cdnjs.cloudflare.com' && url.pathname.startsWith('/ajax/libs/prism/');
}

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
            Promise.all(keys.filter(key => key !== CACHE_NAME && key !== PRISM_CACHE_NAME).map(key => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (isPrismCdnRequest(url)) {
        // Cache-first: once a language/plugin file has been fetched, it works offline forever.
        event.respondWith(
            caches.open(PRISM_CACHE_NAME).then(cache =>
                cache.match(event.request).then(cached => {
                    if (cached) return cached;
                    return fetch(event.request).then(response => {
                        if (response.ok) cache.put(event.request, response.clone());
                        return response;
                    });
                })
            )
        );
        return;
    }

    // Same-origin app shell: cache-first with network fallback/refresh.
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
