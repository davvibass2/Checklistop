// ChecklistOP — Service Worker
// Estratégia: Cache First para shell; atualização apenas na próxima abertura.
// Nunca recarregar automaticamente páginas abertas durante o uso.

const CACHE_NAME = 'checklistop-v2';

const SHELL = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// INSTALL — pré-cacheia o shell da aplicação
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL);
    })
    // Não chama skipWaiting() aqui:
    // o SW novo aguarda na fila até todas as abas fecharem.
  );
});

// ACTIVATE — remove caches de versões anteriores
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      // Assume controle das abas já abertas.
      // Seguro porque o SW só é ativado quando não há abas com versão anterior.
      return self.clients.claim();
    })
  );
});

// FETCH — Cache First para o shell; rede para todo o resto
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Só intercepta GET
  if (event.request.method !== 'GET') return;

  // Recursos do Supabase (API, Storage, Auth) — sempre rede, nunca cache
  if (url.hostname.includes('supabase.co')) return;

  // CDN externa (chart.js, xlsx, pptxgenjs, supabase-js) — sempre rede, nunca cache
  if (url.hostname.includes('jsdelivr.net')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Retorna do cache e em segundo plano tenta atualizar
        const networkFetch = fetch(event.request, { mode: 'cors' })
          .then((response) => {
            if (response && response.status === 200) {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
                return response;
              });
            }
            return response;
          })
          .catch(() => { /* offline — ignora */ });

        // Retorna imediatamente do cache (não aguarda a rede)
        return cached;
      }

      // Não está no cache — tenta a rede
      return fetch(event.request, { mode: 'cors' }).then((response) => {
        if (response && response.status === 200) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        }
        return response;
      });
    })
  );
});
