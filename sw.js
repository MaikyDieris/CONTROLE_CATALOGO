const CACHE_NAME = 'gerenciador-v1';
const urlsToCache = [
  '/CONTROLE_CATALOGO/',
  '/CONTROLE_CATALOGO/index.html',
  '/CONTROLE_CATALOGO/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// INSTALAÇÃO
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// ATIVAÇÃO
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// INTERCEPTAÇÃO - CORRIGIDO (IGNORA EXTENSÕES)
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;

  // ============================================================
  // IGNORA REQUISIÇÕES DE EXTENSÕES E OUTROS ESQUEMAS
  // ============================================================
  if (url.startsWith('chrome-extension://') || 
      url.startsWith('moz-extension://') ||
      url.startsWith('chrome://') ||
      url.startsWith('about:') ||
      url.startsWith('data:') ||
      url.startsWith('blob:')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(response => {
          // Verifica se é uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // CLONA E ARMAZENA EM CACHE
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              // NÃO CACHEIA REQUISIÇÕES DA API
              if (!url.includes('script.google.com') && 
                  !url.includes('googleapis.com') &&
                  !url.startsWith('chrome-extension://')) {
                cache.put(request, responseToCache).catch(err => {
                  // Ignora erros de cache de extensões
                  console.debug('Cache ignorado:', url);
                });
              }
            });
          return response;
        });
      })
  );
});

// MENSAGEM PARA ATUALIZAÇÃO
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
