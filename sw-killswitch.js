// ChecklistOP — Service Worker KILL-SWITCH
//
// ATENÇÃO: Este arquivo NÃO deve ser referenciado pelo sistema em operação normal.
//
// USO: Caso seja necessário reverter completamente o Service Worker do ChecklistOP,
// substituir o conteúdo de sw.js por este arquivo e fazer deploy.
//
// O que este SW faz:
//   1. No install: apaga todos os caches do ChecklistOP.
//   2. Assume controle imediato (skipWaiting + clients.claim).
//   3. Não intercepta nenhuma requisição — deixa tudo ir à rede.
//   4. Após o próximo reload do usuário, o app funciona sem SW ativo no cache.
//
// Após o deploy deste arquivo e os usuários recarregarem o app uma vez,
// é seguro remover o sw.js do repositório e as tags do index.html.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // Notifica todas as abas abertas para recarregar
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      });
    })
  );
});

// Não intercepta nenhum fetch — tudo vai direto à rede
