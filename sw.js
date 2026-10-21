const CACHE='applygrove-shell-v1';
const CORE=['./','./index.html','./styles.css','./src/app.js','./src/core.js','./manifest.webmanifest','./assets/favicon.svg','./assets/hero-small.webp','./assets/hero.webp','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(fetch(event.request).then(response=>response.ok?response:caches.match(event.request).then(cached=>cached||response)).catch(()=>caches.match(event.request).then(cached=>cached||Response.error())));
});
