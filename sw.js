/* Adventure Bay: offline support for the installed app.
   - The page itself (index.html) is fetched fresh when online, so new versions arrive right away; offline, the saved copy opens.
   - Scripts, styles and icons have a version in their address (?v=…, see scripts/stamp.mjs), so a saved copy is always the right one.
   - Fonts and emoji are saved the first time they load. Analytics requests are never saved.
   VERSION is updated by `npm run stamp`, which makes browsers pick up a new worker and clear old saved files. */
const VERSION = '332ffbc-mwowo570';
const CACHE = 'adventure-bay-' + VERSION;
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('adventure-bay-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(/amplitude\.com$/.test(url.hostname)) return;                    // analytics: always live, never saved
  if(req.mode === 'navigate'){                                         // the page: fresh when online, saved copy when offline
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); return res; })
      .catch(() => caches.match('./').then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {   // everything else: saved copy first
    if(res && (res.ok || res.type === 'opaque')){ const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
