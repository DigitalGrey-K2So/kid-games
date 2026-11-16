/* Offline support. Change VERSION whenever you upload new copies of the games so the iPad picks them up. */
var VERSION = 'kid-games-v3';
var FILES = [
  './',
  'index.html',
  'block-buddies.html',
  'mangos-big-hop.html',
  'bubble-garden.html',
  'berry-maze.html',
  'berry-drop.html',
  'tile-twins.html',
  'mango-dash.html',
  'splash-blast.html',
  'manifest.webmanifest',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Game files: use the saved copy, refresh it in the background when online.
   Fonts: save them the first time they load so the games look right offline too. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(e.request, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(e.request).then(function (res) {
          if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      });
    })
  );
});
