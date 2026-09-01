const CACHE_NAME = 'gp-portal-v1';
const RUNTIME_CACHE = 'gp-portal-runtime';
const API_CACHE = 'gp-portal-api';

const STATIC_ASSETS = [
  '/',
  '/app.js',
  '/styles/globals.css',
  '/offline.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        console.log('Some assets failed to cache during install');
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first with fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests: network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(API_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || createOfflineResponse('API unavailable')))
    );
    return;
  }

  // Static assets: cache first, then network
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((res) => {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, res.clone());
            });
            return res;
          })
        );
      })
    );
    return;
  }

  // Document requests: network first with stale cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response.clone());
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((response) => {
          return response || createOfflineResponse('Page unavailable offline');
        })
      )
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-applications') {
    event.waitUntil(syncPendingApplications());
  }
});

async function syncPendingApplications() {
  try {
    const db = await openIndexedDB();
    const pendingApps = await getPendingApplications(db);
    
    for (const app of pendingApps) {
      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(app),
        });
        if (response.ok) {
          await deletePendingApplication(db, app.id);
        }
      } catch (error) {
        console.error('Failed to sync application:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

function createOfflineResponse(message) {
  return new Response(
    JSON.stringify({
      offline: true,
      message,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// IndexedDB helpers
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('GramPanchayatDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingApplications')) {
        db.createObjectStore('pendingApplications', { keyPath: 'id' });
      }
    };
  });
}

function getPendingApplications(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingApplications', 'readonly');
    const store = transaction.objectStore('pendingApplications');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deletePendingApplication(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pendingApplications', 'readwrite');
    const store = transaction.objectStore('pendingApplications');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
