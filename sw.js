// Service worker: permite jogar offline depois do primeiro acesso.
// Estratégia "rede primeiro": sempre pega a versão nova quando há internet.
const CACHE = 'herois-de-pixel-v5';
const FILES = ['./', 'index.html', 'style.css', 'manifest.json', 'icon.svg',
  'js/util.js', 'js/sprites.js', 'js/enemies.js', 'js/world.js', 'js/levels.js', 'js/game.js', 'js/net.js', 'js/ui.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
