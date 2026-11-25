// Service worker: permite jogar offline depois do primeiro acesso.
// Estratégia "rede primeiro": sempre pega a versão nova quando há internet.
const CACHE = 'herois-de-pixel-v1.37';             // suba junto com VERSAO (js/util.js)
const FILES = ['./', 'index.html', 'style.css', 'manifest.json', 'icon.svg',
  'js/util.js', 'js/epic.js', 'js/sprites.js', 'sprites/pack.js', 'js/spritepack.js', 'sprites_rig/pecas.js', 'js/rig.js', 'js/enemies.js', 'js/world.js', 'js/worlds.js', 'js/levels.js', 'js/tutorial.js', 'js/game.js', 'js/bestiary.js', 'js/fauna.js', 'js/dimensao.js',
  'js/net.js', 'js/local.js', 'js/mapa.js', 'js/ferreiro.js', 'js/academia.js', 'js/cristais.js', 'js/ui.js', 'fonts/PressStart2P-Regular.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // guarda sem a "?..." (ex.: cada link de convite ?sala=XXXXX viraria uma cópia nova no cache)
  url.search = '';
  const key = url.href;
  e.respondWith(
    // no-cache: sempre confere com o servidor (o GitHub Pages manda guardar 10 min e as correções demoravam a chegar)
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return r;
    }).catch(() => caches.match(key))
  );
});
