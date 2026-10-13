const CACHE='twq-cal-v5';
const CORE=['./','./index.html','./manifest.json','./icon.svg','./style.css','./app1.js','./app2.js'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(async c=>{
    await Promise.all(CORE.map(u=>c.add(u).catch(()=>{})));
    await self.skipWaiting();
  }));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request)
        .then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return res;})
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res=>{
        if(res.ok){
          const cp=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,cp));
        }
        return res;
      })
      .catch(()=>caches.match(e.request,{ignoreSearch:true}))
  );
});