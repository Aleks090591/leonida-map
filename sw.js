// App-Shell vorab cachen, Kacheln cache-first (wachsen beim Benutzen), Daten network-first.
const SHELL = 'shell-v17', TILES = 'tiles-v2', DATA = 'data-v1';
const SHELL_FILES = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest',
  'vendor/leaflet.js', 'vendor/leaflet.css', 'vendor/leaflet.markercluster.js', 'vendor/MarkerCluster.css',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_FILES.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); // am HTTP-Cache vorbei, sonst evtl. alte Dateien
});
self.addEventListener('activate', (e) => {
  const keep = [SHELL, TILES, DATA];
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.includes('/tiles/')) {
    e.respondWith(caches.open(TILES).then((c) => c.match(e.request).then((hit) => hit ||
      fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }))));
  } else if (url.pathname.includes('/data/')) {
    e.respondWith(caches.open(DATA).then((c) => fetch(e.request)
      .then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; })
      .catch(() => c.match(e.request))));
  } else {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
  }
});
