// Service Worker for Skids Vision
// Provides offline capabilities and performance improvements

const CACHE_NAME = 'skids-vision-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Static assets cached successfully');
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Old caches cleaned up');
        self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('📁 Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('❌ Network request failed:', error);
            
            // Return offline fallback if available
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            throw error;
          });
      })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for offline data (if needed in future)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      console.log('🔄 Background sync triggered')
    );
  }
});

// Handle push notifications (if needed in future)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Vision screening reminder',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'skids-vision-notification'
  };

  event.waitUntil(
    self.registration.showNotification('Skids Vision', options)
  );
});

console.log('🚀 Skids Vision Service Worker loaded');
