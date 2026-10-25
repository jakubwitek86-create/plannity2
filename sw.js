/* Plannity – service worker: działanie offline */
const CACHE = 'plannity-v1.1.0';
const ASSETS = [
  './', './index.html', './manifest.json', './css/styles.css',
  './js/core.js', './js/home.js', './js/tasks.js', './js/goals.js', './js/habits.js', './js/counters.js',
  './js/calendar.js', './js/schedule.js', './js/chores.js', './js/notes.js', './js/gifts.js', './js/dates.js', './js/stats.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // pogoda idzie prosto do sieci
  // stale-while-revalidate: szybko z pamięci, w tle aktualizacja
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r && r.ok) cache.put(e.request, r.clone()); return r; }).catch(() => cached);
    return cached || net;
  }));
});
