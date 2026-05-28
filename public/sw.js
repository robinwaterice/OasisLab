const CACHE_NAME = 'oasis-lab-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle standard http/https schemes
  if (!event.request.url.startsWith('http')) return;

  // Bypass cache entirely in local development (including mobile testing over local IP and port 3005)
  const isLocalhost = self.location.hostname === 'localhost' || 
                      self.location.hostname === '127.0.0.1' || 
                      self.location.hostname.startsWith('192.168.') ||
                      self.location.hostname.startsWith('10.') ||
                      self.location.hostname.startsWith('172.16.') || // or 172.* range
                      self.location.hostname.startsWith('172.17.') ||
                      self.location.hostname.startsWith('172.18.') ||
                      self.location.hostname.startsWith('172.19.') ||
                      self.location.hostname.startsWith('172.20.') ||
                      self.location.hostname.startsWith('172.21.') ||
                      self.location.hostname.startsWith('172.22.') ||
                      self.location.hostname.startsWith('172.23.') ||
                      self.location.hostname.startsWith('172.24.') ||
                      self.location.hostname.startsWith('172.25.') ||
                      self.location.hostname.startsWith('172.26.') ||
                      self.location.hostname.startsWith('172.27.') ||
                      self.location.hostname.startsWith('172.28.') ||
                      self.location.hostname.startsWith('172.29.') ||
                      self.location.hostname.startsWith('172.30.') ||
                      self.location.hostname.startsWith('172.31.') ||
                      self.location.port === '3005' ||
                      self.location.port === '3000';

  if (isLocalhost) {
    event.respondWith(fetch(event.request));
    return;
  }

  const url = new URL(event.request.url);
  const isHTML = event.request.mode === 'navigate' || 
                 event.request.headers.get('accept')?.includes('text/html') ||
                 url.pathname === '/' ||
                 url.pathname === '/index.html';

  if (isHTML) {
    // Network-First Strategy for HTML pages: always get fresh content when online
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, serve from cache fallback
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-First Strategy for other static assets (JS, CSS, images, etc.)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
