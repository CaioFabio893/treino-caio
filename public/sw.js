const CACHE = 'hybrid-strength-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch('/');
    const html = await response.clone().text();
    await cache.put('/', response);
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(match => match[1]);
    await cache.addAll(['/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', ...assets]);
    // Lazy routes are included by the generated asset list, so first offline visit can open them.
    const list = await fetch('/offline-assets.json').then(r => r.json());
    await cache.addAll(list);
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => { for (const key of await caches.keys()) if (key.startsWith('hybrid-strength-shell-') && key !== CACHE) await caches.delete(key); await self.clients.claim(); })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/')));
  } else if (url.pathname.startsWith('/assets/') || ['/icon.svg','/icon-192.png','/icon-512.png','/manifest.webmanifest'].includes(url.pathname)) {
    // Only immutable same-origin public assets: ignore request Origin variations from module/crossorigin loads.
    event.respondWith((async () => { const cached = await caches.match(event.request, { ignoreVary: true }); if (cached) return cached; const response = await fetch(event.request); if (response.ok) { const cache = await caches.open(CACHE); await cache.put(event.request, response.clone()); } return response; })());
  }
});
