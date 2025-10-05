/**
 * Voltaxe Service Worker
 * Handles push notifications and background tasks
 */

// Service Worker version
const CACHE_VERSION = 'v1';
const CACHE_NAME = `voltaxe-${CACHE_VERSION}`;

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const options = {
      body: data.body || data.message || 'You have a new notification',
      icon: data.icon || '/voltaxe-icon.png',
      badge: data.badge || '/voltaxe-badge.png',
      tag: data.tag || 'voltaxe-notification',
      data: data.data || {},
      requireInteraction: data.requireInteraction || false,
      timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now(),
      actions: [
        {
          action: 'open',
          title: 'View Dashboard',
        },
        {
          action: 'close',
          title: 'Dismiss',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Voltaxe Alert', options)
    );
  } catch (error) {
    console.error('[SW] Error processing push notification:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the dashboard or specific page based on notification data
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (for future use)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
});

// Helper function for syncing alerts (placeholder)
async function syncAlerts() {
  try {
    console.log('[SW] Syncing alerts in background');
    // Future: Implement background alert synchronization
  } catch (error) {
    console.error('[SW] Error syncing alerts:', error);
  }
}

// Message handler (for communication with main thread)
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
