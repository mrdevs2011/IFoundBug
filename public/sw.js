const CACHE_NAME = 'ifoundbug-cache-v6';

// Force new service worker activation immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          // Delete all old caches
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Network-First strategy for all page navigations and API calls,
// Cache fallback only when truly offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache API cannot store chrome-extension:// and other non-http(s) schemes.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Never serve stale application bundles: Next.js JS/CSS contains build-time
  // public environment values and must always match the active deployment.
  // Supabase/API requests must also always go directly to the network.
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/')
  ) {
    return;
  }

  // Never cache HTML navigations: authenticated and link-only bug pages can
  // contain account/workspace data. Offline fallback must not replay private pages.
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => new Response(
      '<!doctype html><html lang=\"uz\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Offline · IFoundBug</title><body style=\"margin:0;background:#090b0a;color:#e5e7eb;font:16px system-ui;display:grid;min-height:100vh;place-items:center\"><main style=\"max-width:28rem;padding:2rem;text-align:center\"><h1>Internet aloqasi yo‘q</h1><p style=\"color:#9ca3af\">IFoundBug sahifalari maxfiy ma’lumotlarni himoya qilish uchun offline keshlanmaydi. Aloqa tiklangach qayta urinib ko‘ring.</p><button onclick=\"location.reload()\" style=\"background:#34d399;border:0;border-radius:10px;padding:.7rem 1rem;font-weight:600\">Qayta urinish</button></main></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )));
    return;
  }

  // Static assets (images, css, js): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy).catch(() => {}));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networked;
    })
  );
});
