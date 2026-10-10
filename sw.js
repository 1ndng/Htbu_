// 更新程式後，把下面的版本號加 1，手機才會抓到新版
const C = 'nyear-v331';
const FILES = ['./', './index.html', './fonts.css', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
// 字體切成小份（fonts/）：先備好 Win95 字體的第一份（英數標點＋介面文字），其他用到時才下載
// 字體快取：網址含內容雜湊（?v=…），內容一變網址就不同；舊名 nyear-fonts 裡可能有過期的字體小檔（會缺字），換新名稱讓它被清掉
const FC = 'nyear-fonts2';
const FONTS = ['./fonts/c00.ttf?v=cf784348'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES))
    .then(() => caches.open(FC)).then(fc => Promise.all(FONTS.map(f => fc.match(f).then(m => m || fc.add(f).catch(() => {})))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  // 字體網址帶內容雜湊，換版本時保留已下載的字體
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C && k !== FC).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const put = (r, res, name) => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(name || C).then(c => c.put(r, cp)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin === location.origin && u.pathname.includes('/fonts/')) {
    // 字體小檔：有備存就直接用（不再每次連網確認），沒有才下載並存起來
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => put(r, res, FC))));
  } else if (u.origin === location.origin) {
    // 自己的其他檔案：有網路就抓新的，沒網路用備存的
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => put(r, res)).catch(() => caches.match(r).then(m => m || caches.match('./index.html'))));
  } else {
    // 外部檔案：先用備存的
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => put(r, res))));
  }
});
