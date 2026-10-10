/* SIGNAL BREAKER dedicated app shell; independent of SIGNAL WATCH and Vercel. */
const CACHE = 'psi-signal-breaker-webpreview-v0.13.1-flow-assist';
const ASSETS = ['/fonts/PretendardVariable.woff2', './', './index.html', './src/style.css', './src/chapter-content.js', './src/engine.js', './src/app.js', '/assets/shared/presentation-cache-v1.js', '/assets/shared/signal-breaker-actors.js', './src/localization-ko.js', './src/premium-art.js', './src/premium-sound.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './art/loading-keyart-v1.webp', './art/control-gimbal-v1.webp', './art/sb01-delivery-bay-v1.webp', './art/core-materials-v1.webp', './art/operator-idle-v1.webp', './art/chapter-environments-v1.webp', './art/breaker-six-tools-final-v3.webp', './art/industrial-structures-v1.webp', './art/industrial-devices-v2.webp', './art/map-delivery-v2.webp', './art/map-delivery-v3.webp', './art/map-conveyor-v2.webp', './art/map-extraction-v2.webp', './art/map-hoist-v2.webp', './art/map-power-v2.webp', './art/world-delivery-v4.webp', './art/world-conveyor-v4.webp', './art/world-extraction-v4.webp', './art/world-hoist-v4.webp', './art/world-power-v4.webp'];
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
  const shared=url.pathname==='/fonts/PretendardVariable.woff2'||url.pathname.startsWith('/assets/shared/')||url.pathname.startsWith('/assets/survivors/')||url.pathname.startsWith('/assets/episode01/characters/');
  if (!shared&&!url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  // Media range responses are not complete files and cannot be stored as such.
  if (req.headers.has('range') || url.pathname.endsWith('/service-worker.js')) return;
  const shell = req.mode === 'navigate' || /\.(?:html|js|css)$/.test(url.pathname);
  const network = async cache => {
    const response = await fetch(req);
    if (response.status === 200 && response.type === 'basic') {
      await cache.put(req, response.clone());
    }
    return response;
  };
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (shell) {
      try { return await network(cache); }
      catch (error) {
        const hit = await cache.match(req) || (req.mode === 'navigate' ? await cache.match(new URL('./index.html', self.registration.scope).href) : undefined);
        if (hit) return hit;
        throw error;
      }
    }
    return await cache.match(req) || network(cache);
  }));
});
