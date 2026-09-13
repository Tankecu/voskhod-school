/* VOSKHOD Orbit — service worker: офлайн-кэш приложения */
const VERSION = 'voskhod-orbit-v7';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/cosmos.js',
  './js/config.js',
  './js/db.js',
  './js/ui.js',
  './js/tests-bank.js',
  './js/theory.js',
  './js/tests.js',
  './js/mock-sat-1-rw.js',
  './js/mock-sat-1-math.js',
  './js/mock-sat-1.js',
  './js/bank-math.js',
  './js/bank-rw.js',
  './js/bank-rw-gen.js',
  './js/mock-gen.js',
  './js/mock.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable.png',
  './icons/icon.svg',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  /* шрифты Google: stale-while-revalidate */
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(e.request);
        const network = fetch(e.request).then((res) => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  /* своё: cache-first с фоновым обновлением */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.open(VERSION).then(async (cache) => {
        const cached = await cache.match(e.request);
        const network = fetch(e.request).then((res) => {
          if (res && res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
