// Service Worker for MSCS Application Manager PWA
// Provides offline functionality and caching

const CACHE_NAME = 'mscs-manager-v1.0.0';
const CACHE_VERSION = 1;

// Assets to cache immediately
const CORE_ASSETS = [
  '/',
  '/modern.html',
  '/login-modern.html',
  '/styles/modern.css',
  '/js/api.js',
  '/js/app.js',
  '/js/auth.js',
  '/js/charts.js',
  '/js/kanban.js',
  '/js/modals.js',
  '/js/theme.js',
  '/manifest.json'
];

// External assets to cache (CDN resources)
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
  'https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js'
];

// API endpoints to cache for offline use
const API_CACHE_PATTERNS = [
  /\/api\/universities/,
  /\/api\/tasks/,
  /\/api\/documents/,
  /\/api\/deadlines/,
  /\/api\/dashboard/
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching core assets...');
        return Promise.all([
          cache.addAll(CORE_ASSETS),
          cache.addAll(EXTERNAL_ASSETS).catch(error => {
            console.warn('⚠️ Some external assets failed to cache:', error);
            // Don't fail the entire installation for external assets
          })
        ]);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        // Force activation immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated');
      
      // Notify all clients that SW is ready
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          payload: { cacheVersion: CACHE_VERSION }
        });
      });
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else {
    event.respondWith(handleAssetRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for fresh data
    const response = await fetch(request);
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', url.pathname);
    
    // Fallback to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log('📦 Serving from cache:', url.pathname);
        return cachedResponse;
      }
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No network connection available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Fallback to cached page or offline page
    console.log('🌐 Navigation offline, serving cached page');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Serve main app as fallback for SPA routing
    const appResponse = await caches.match('/modern.html');
    if (appResponse) {
      return appResponse;
    }
    
    // Last resort: offline page
    return createOfflinePage();
  }
}

// Handle asset requests with cache-first strategy
async function handleAssetRequest(request) {
  // Cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network and cache
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('❌ Asset not available offline:', request.url);
    
    // Return placeholder for images or fonts
    if (request.destination === 'image') {
      return createPlaceholderImage();
    }
    
    return new Response('', { status: 404 });
  }
}

// Helper functions
function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') || 
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - MSCS Manager</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: #f9fafb;
          color: #374151;
          text-align: center;
          padding: 2rem;
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          color: #6b7280;
        }
        h1 { color: #111827; margin-bottom: 0.5rem; }
        p { margin-bottom: 1.5rem; max-width: 400px; line-height: 1.6; }
        button {
          background: #000;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          font-size: 1rem;
        }
        button:hover { background: #1f2937; }
      </style>
    </head>
    <body>
      <div class="offline-icon">📡</div>
      <h1>You're Offline</h1>
      <p>Check your internet connection and try again. Some features may be available offline.</p>
      <button onclick="window.location.reload()">Try Again</button>
      
      <script>
        // Auto-retry when online
        window.addEventListener('online', () => {
          window.location.reload();
        });
      </script>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function createPlaceholderImage() {
  // Create a simple 1x1 transparent pixel
  const pixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const binary = atob(pixel);
  const bytes = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return new Response(bytes, {
    headers: { 'Content-Type': 'image/gif' }
  });
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  try {
    // Get pending data from IndexedDB (if implemented)
    console.log('🔄 Syncing pending data...');
    
    // Notify clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        payload: { success: true }
      });
    });
  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: data.data,
    actions: [
      {
        action: 'view',
        title: 'View Details'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/modern.html')
    );
  }
});

// Message handler for communication with main app
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});