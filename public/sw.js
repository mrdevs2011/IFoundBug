const CACHE_NAME = 'ifoundbug-cache-v7';

// Activate new versions immediately; the page shows a "new version" banner on controllerchange.
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
      '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#010409"><title>Offline · IFoundBug</title><body style="margin:0;background:#0d1117;color:#f0f6fc;font:14px -apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans,Helvetica,Arial,sans-serif;display:grid;min-height:100vh;place-items:center"><main style="max-width:26rem;padding:2rem;text-align:center"><svg width="40" height="40" viewBox="0 0 16 16" fill="#9198a1" aria-hidden="true"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"/></svg><h1 style="font-size:20px;font-weight:600;margin:16px 0 8px">You are offline</h1><p style="color:#9198a1;line-height:1.5;margin:0 0 20px">IFoundBug does not store pages offline, to keep private issues private. Reconnect and try again.</p><button onclick="location.reload()" style="background:#238636;color:#fff;border:1px solid rgba(240,246,252,.1);border-radius:6px;padding:5px 16px;font:inherit;font-weight:500;cursor:pointer">Try again</button></main></body></html>',
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
