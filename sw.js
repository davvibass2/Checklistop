// ChecklistOP — Service Worker KILL-SWITCH (temporário)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
