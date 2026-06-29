/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals, no-undef */

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// ─── Self-install ────────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Precache (ingevuld door vite-plugin-pwa build) ─────────────────────────

precacheAndRoute(self.__WB_MANIFEST);

// ─── Runtime caching ─────────────────────────────────────────────────────────

registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/'),
  new NetworkFirst({
    cacheName: 'supabase-storage',
    networkTimeoutSeconds: 5,
  })
);

registerRoute(
  ({ url }) => url.hostname === 'placehold.co',
  new CacheFirst({
    cacheName: 'placehold-images',
  })
);

// ─── Push notifications ──────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Skillkaart', body: event.data ? event.data.text() : 'Nieuw bericht' };
  }

  const title = data.title || 'Skillkaart';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'skillkaart-default',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If there's an open window, focus it and navigate
      for (const client of windowClients) {
        if (client.url && client.url.includes(self.location.origin)) {
          client.focus();
          if (client.navigate) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(urlToOpen);
    })
  );
});
