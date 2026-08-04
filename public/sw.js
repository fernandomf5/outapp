// Service Worker exclusively for Push Notifications.
// The app shell is intentionally never cached so checkout code is always current.

function isLegacyAppCache(name) {
  return /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-|workbox/i.test(name);
}

self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'Lembrete de Evento',
    body: 'Você tem um evento próximo!',
    icon: '/logo.png',
    badge: '/favicon.png',
    tag: 'agenda-reminder',
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || {}
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver Evento'
      },
      {
        action: 'dismiss',
        title: 'Dispensar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If there's already a window open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/dashboard');
      }
    })
  );
});

self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker...');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Service worker activated');
  event.waitUntil((async function() {
    const cacheNames = await caches.keys();
    const legacyCaches = cacheNames.filter(isLegacyAppCache);
    await Promise.allSettled(legacyCaches.map(function(name) {
      return caches.delete(name);
    }));

    await clients.claim();

    // A previous Workbox worker may have loaded a stale checkout bundle.
    // Reload every open window once under this network-only push worker.
    const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    await Promise.allSettled(windowClients.map(function(client) {
      return client.navigate(client.url);
    }));
  })());
});
