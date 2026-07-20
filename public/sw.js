const CACHE = 'mpela-co-companions-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(async () => {
        const cached = await caches.match('/');
        if (cached) return cached;
        // If not in cache and network fails, return an offline page or just let it fail gracefully
        return new Response('Network error and no offline cache available.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      })
    );
    return;
  }
  
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
