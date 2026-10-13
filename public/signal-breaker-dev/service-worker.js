/* SIGNAL BREAKER dedicated app shell; independent of SIGNAL WATCH and Vercel. */
const CACHE = 'psi-signal-breaker-webpreview-v0.48.5-device-audit';
const ASSETS = ['./src/talent-tech-tree.js','./src/psi-rpg-art.css','./art/psi-rpg-world-v1.png','./art/psi-rpg-base-v1.png','./art/psi-rpg-lab-v1.png','./art/psi-rpg-ui-parts-v1.png','./art/psi-projectiles-atlas-v1.webp','./art/psi-supply-atlas-v1.webp','./src/episode-two.js','./src/psi-workshop.js','./src/psi-workshop.css','./art/psi-hud-field-v1.webp','./art/psi-hud-brass-v1.webp','./art/psi-hud-grid-v1.webp','./art/psi-fire-ring-v1.webp','./art/psi-nav-ring-v1.webp','./art/psi-shield-chip-v1.webp','./src/evolution-rules.js', './src/offline-presentation.js', '/assets/episode01/characters/player-map.webp', '/assets/episode01/characters/kang-taesik-map.webp', '/assets/episode01/characters/yoon-sungho-map.webp', '/assets/episode01/characters/lee-jaehoon-map.webp', '/assets/episode01/characters/lim-junho-map.webp', '/assets/episode01/characters/performance/lim-junho-relief.webp', '/assets/episode01/characters/yoon-sungho-appreciative.webp', '/assets/episode01/characters/kang-taesik-supportive.webp', './art/ending-ch01-restored-v1.webp', './art/ending-ch02-restored-v1.webp', './art/ending-ch03-restored-v1.webp', './art/ending-ch04-restored-v1.webp', './art/ending-ch05-restored-v1.webp', '/assets/survivors/voice-ending-v1/PSI_V_END_CH01_LIM_v01.wav', '/assets/survivors/voice-ending-v1/PSI_V_END_CH02_YOON_v01.wav', '/assets/survivors/voice-ending-v1/PSI_V_END_CH03_LIM_v01.wav', '/assets/survivors/voice-ending-v1/PSI_V_END_CH04_KANG_v01.wav', '/assets/survivors/voice-ending-v1/PSI_V_END_CH05_WORKER_v01.wav', '/fonts/PretendardVariable.woff2', '/assets/survivors/safety-monitor-v2.webp', './', './index.html', './src/style.css', './src/responsive-production.css', './src/portrait-camera.js', './src/chapter-content.js', './src/causal-source.js', './src/engine.js', './src/session-flow.js', './src/flow-story.js', './src/operation-content.js', './src/burst-rules.js', './src/app.js', './src/stage-ending-content.js', './src/ending-player.js', './src/ending-sound.js', './src/ending-performance-content.js', './src/ending-performance.js', './src/ending-voice.js', '/assets/shared/presentation-cache-v1.js', '/assets/shared/signal-breaker-actors.js', './src/localization-ko.js', './src/premium-art.js', './src/premium-sound.js','./src/firing-pose.js','./src/boss-camera.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './art/loading-keyart-v1.webp', './art/control-gimbal-v1.webp', './art/sb01-delivery-bay-v1.webp', './art/core-materials-v2.webp', './art/operator-idle-v1.webp', './art/chapter-environments-v1.webp', './art/breaker-six-tools-ui-v4.webp', './art/industrial-structures-v1.webp', './art/industrial-devices-v2.webp', './art/boss-equipment-v1.webp', './art/boss-delivery-final-v2.webp', './art/boss-conveyor-final-v2.webp', './art/boss-extraction-final-v2.webp', './art/boss-tension-final-v2.webp', './art/boss-grid-final-v2.webp', './art/released-hazards-v1.webp', './art/map-delivery-v2.webp', './art/map-delivery-v3.webp', './art/map-conveyor-v2.webp', './art/map-extraction-v2.webp', './art/map-hoist-v2.webp', './art/map-power-v2.webp', './art/world-delivery-v4.webp', './art/world-conveyor-v4.webp', './art/world-extraction-v4.webp', './art/world-hoist-v4.webp', './art/world-power-v4.webp'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('psi-signal-breaker-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if(event.data?.type!=='CACHE_PRESENTATION_ASSETS'||!Array.isArray(event.data.urls))return;
  const scope=new URL(self.registration.scope).pathname;
  const urls=[...new Set(event.data.urls)].filter(value=>{
    try{
      const url=new URL(value);
      return url.origin===self.location.origin&&/\.(png|webp|jpe?g|woff2)$/.test(url.pathname)
        &&(url.pathname.startsWith(scope)||url.pathname.startsWith('/assets/survivors/')||url.pathname.startsWith('/assets/episode01/characters/')||url.pathname==='/fonts/PretendardVariable.woff2');
    }catch{return false;}
  }).slice(-128);
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(urls)).then(()=>event.ports[0]?.postMessage({ok:true,count:urls.length})).catch(()=>event.ports[0]?.postMessage({ok:false})));
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
    const response = await fetch(req, {cache: 'no-cache'});
    if (response.status === 200 && response.type === 'basic') {
      await cache.put(req, response.clone());
    }
    return response;
  };
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (shell) {
      try { return await network(cache); }
      catch (error) {
        const hit = await cache.match(req,{ignoreVary:true}) || (req.mode === 'navigate' ? await cache.match(new URL('./index.html', self.registration.scope).href,{ignoreVary:true}) : undefined);
        if (hit) return hit;
        throw error;
      }
    }
    // Online artwork must follow the deployed release, including shared assets
    // whose filenames were retained. Preserve cached media only for offline use.
    try { return await network(cache); }
    catch (error) {
      const hit = await cache.match(req,{ignoreVary:true});
      if (hit) return hit;
      throw error;
    }
  }));
});
