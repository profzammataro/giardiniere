// Verde & Cura — Service Worker
const CACHE_NAME = 'verde-cura-v1';

const ASSETS = [
  './giardinaggio.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap'
];

// Installazione: pre-cacha le risorse locali
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache solo le risorse locali (le Google Fonts possono fallire offline)
      return cache.addAll([
        './giardinaggio.html',
        './manifest.json',
        './icon-192.png',
        './icon-512.png',
        './apple-touch-icon.png'
      ]);
    }).then(() => self.skipWaiting())
  );
});

// Attivazione: elimina cache vecchie
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first per risorse locali, network-first per Firebase
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Firebase e Google APIs: sempre rete (dati in tempo reale)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('gstatic')
  ) {
    return; // lascia passare normalmente
  }

  // Tutto il resto: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cacha le nuove risorse valide
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
