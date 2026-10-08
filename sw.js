// 更新程式後，把下面的版本號加 1，手機才會抓到新版
const C = 'nyear-v180';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const FONTS = ['./Cubic_11.ttf', './BaDingShiWeiTi-16.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES).then(() => Promise.all(FONTS.map(f => c.add(f).catch(() => {}))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (r, res) => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  if (new URL(r.url).origin === location.origin) {
    // 自己的檔案：有網路就抓新的，沒網路用備存的
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => put(r, res)).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
  } else {
    // 字型等外部檔案：先用備存的
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => put(r, res))));
  }
});
