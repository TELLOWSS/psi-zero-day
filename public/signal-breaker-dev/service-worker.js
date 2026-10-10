/* SIGNAL BREAKER dedicated app shell; independent of SIGNAL WATCH and Vercel. */
const CACHE = 'psi-signal-breaker-webpreview-v0.6.0';
const ASSETS = ['./', './index.html', './src/style.css', './src/chapter-content.js', './src/engine.js', './src/app.js', '/assets/shared/presentation-cache-v1.js', '/assets/shared/signal-breaker-actors.js', './src/localization-ko.js', './src/premium-art.js', './src/premium-sound.js', './manifest.webmanifest', './icon.svg', './art/sb01-delivery-bay-v1.webp', './art/core-materials-v1.webp', './art/operator-idle-v1.webp', './art/chapter-environments-v1.webp', './art/breaker-six-tools-final-v3.webp'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('psi-signal-breaker-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const url = new URL(req.url);
  const shared=url.pathname.startsWith('/assets/shared/')||url.pathname.startsWith('/assets/survivors/')||url.pathname.startsWith('/assets/episode01/characters/');
  if (!shared&&!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(response => {
    if (response.ok && response.type === 'basic') {
      const copy = response.clone(); void caches.open(CACHE).then(cache => cache.put(req, copy));
    }
    return response;
  })));
});
