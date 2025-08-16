const CACHE_NAME = 'pwa-subscription-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/styles.css',
  '/css/themes.css', 
  '/css/animations.css',
  '/js/app.js',
  '/js/db.js',
  '/js/ui.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/favicon.ico',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', event => {
  console.log('[SW] Install event');
  
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Precaching assets');
      await cache.addAll(PRECACHE_ASSETS);
      console.log('[SW] All assets precached');
      
      self.skipWaiting();
    } catch (error) {
      console.error('[SW] Precaching failed:', error);
    }
  })());
});

self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  
  event.waitUntil((async () => {
    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames
        .filter(cacheName => cacheName !== CACHE_NAME)
        .map(cacheName => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        });
      
      await Promise.all(deletePromises);
      console.log('[SW] Old caches deleted');
      
      self.clients.claim();
    } catch (error) {
      console.error('[SW] Activation failed:', error);
    }
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.url.includes('chrome-extension')) {
    return;
  }

  event.respondWith((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      
      if (cachedResponse) {
        console.log('[SW] Cache hit for:', event.request.url);
        
        event.waitUntil((async () => {
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse.ok) {
              console.log('[SW] Updating cache for:', event.request.url);
              await cache.put(event.request, networkResponse.clone());
            }
          } catch (error) {
            console.log('[SW] Background update failed for:', event.request.url);
          }
        })());
        
        return cachedResponse;
      }
      
      console.log('[SW] Cache miss, fetching:', event.request.url);
      const networkResponse = await fetch(event.request);
      
      if (networkResponse.ok) {
        console.log('[SW] Caching new resource:', event.request.url);
        await cache.put(event.request, networkResponse.clone());
      }
      
      return networkResponse;
      
    } catch (error) {
      console.error('[SW] Fetch failed:', error);
      
      if (event.request.destination === 'document') {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html');
        if (cachedIndex) {
          return cachedIndex;
        }
      }
      
      return new Response('Офлайн режим. Проверьте подключение к интернету.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain; charset=utf-8'
        })
      });
    }
  })());
});

self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-subscriptions') {
    event.waitUntil(syncSubscriptions());
  }
});

self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      const client = clients.find(c => c.visibilityState === 'visible');
      
      if (client) {
        client.navigate(urlToOpen);
        client.focus();
      } else {
        self.clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed');
});

async function syncSubscriptions() {
  try {
    console.log('[SW] Syncing subscriptions data');
    
    const data = await getStoredData();
    if (data && data.needsSync) {
      console.log('[SW] Found data that needs syncing');
    }
    
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function getStoredData() {
  return new Promise((resolve) => {
    try {
      const data = localStorage.getItem('subscriptions-data');
      resolve(data ? JSON.parse(data) : null);
    } catch (error) {
      console.error('[SW] Failed to get stored data:', error);
      resolve(null);
    }
  });
}

console.log('[SW] Service Worker loaded');