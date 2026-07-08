 
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// ─── Precaching (door vite-plugin-pwa ingevuld) ──────────────────────────
precacheAndRoute(self.__WB_MANIFEST);

// ─── Boot: skip waiting + clients claim + update kanaal openen ───────────
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll().then(clients => {
        clients.forEach(c => c.postMessage({ type: 'SW_ACTIVATED' }));
      });
    })
  );
});

// ─── Berichten van de app ontvangen ───────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Runtime caching ─────────────────────────────────────────────────────

// Supabase PostgREST API: NetworkFirst met timeout — data moet vers zijn
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co') && !url.pathname.startsWith('/storage/v1/'),
  new NetworkFirst({
    cacheName: 'supabase-api',
    networkTimeoutSeconds: 4,
    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 }, // 5 min
  })
);

// Supabase storage (avatars, uploads): StaleWhileRevalidate
registerRoute(
  ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/storage/v1/'),
  new StaleWhileRevalidate({
    cacheName: 'supabase-storage',
    expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
  })
);

// placehold.co avatars: CacheFirst (onveranderlijk)
registerRoute(
  ({ url }) => url.hostname === 'placehold.co',
  new CacheFirst({
    cacheName: 'placehold-images',
    expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
  })
);

// Google Fonts / analytics: StaleWhileRevalidate (niet kritisch)
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'google-fonts' })
);

// ─── Offline fallback ────────────────────────────────────────────────────

const OFFLINE_PAGE = '/offline.html';

self.addEventListener('fetch', (event) => {
  // Alleen voor navigatie-requests (pagina's) — assets worden al gecached
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Als de response ok is en HTML, cache hem
          if (response.status === 200 && response.headers.get('content-type')?.includes('text/html')) {
            const clone = response.clone();
            caches.open('skillkaart-pages').then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Offline: probeer de gecachte page, of fallback naar offline.html
          return caches.match(event.request)
            .then(cached => cached || caches.match(OFFLINE_PAGE))
            .then(fallback => {
              if (fallback) return fallback;
              // Laatste redmiddel: simpele inline HTML
              return new Response(
                '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Geen internet</title><style>body{background:#0D0D0D;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:24px}div{max-width:360px}h1{font-size:48px;margin:0 0 8px}p{color:#9ca3af;font-size:15px;line-height:1.5}</style></head><body><div><h1>⚽</h1><h2 style="color:#00FF9D">Geen internet</h2><p>Geen zorgen — je skillkaart is veilig opgeslagen. Zodra je weer online bent, ben je er weer.</p></div></body></html>',
                { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
              );
            });
        })
    );
  }
});

// ─── Push notifications ──────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { title: 'Skillkaart', body: event.data ? event.data.text() : 'Nieuw bericht' }; }

  const title = data.title || 'Skillkaart';
  const tag = data.tag || 'skillkaart-def-' + Date.now();

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: [{ action: 'open', title: 'Openen' }],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url && client.url.includes(self.location.origin) && 'navigate' in client) {
          client.focus();
          (client).navigate(urlToOpen);
          return;
        }
      }
      return self.clients.openWindow(urlToOpen);
    })
  );
});
