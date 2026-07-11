// ============================================================
// SERVICE WORKER - COM ATUALIZAÇÃO AUTOMÁTICA
// ============================================================

// ============================================================
// VERSÃO - MUDE ESTE NÚMERO SEMPRE QUE ALTERAR O SITE
// ============================================================
const APP_VERSION = '2.6.0'; // <-- MUDE ISSO SEMPRE QUE ATUALIZAR
const CACHE_NAME = `gerenciador-${APP_VERSION}`;

// ============================================================
// ARQUIVOS PARA CACHE
// ============================================================
const urlsToCache = [
  '/CONTROLE_CATALOGO/',
  '/CONTROLE_CATALOGO/index.html',
  '/CONTROLE_CATALOGO/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// ============================================================
// INSTALAÇÃO
// ============================================================
self.addEventListener('install', event => {
  console.log('🔄 Instalando nova versão:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache aberto para versão', APP_VERSION);
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// ============================================================
// ATIVAÇÃO - LIMPA CACHES ANTIGOS
// ============================================================
self.addEventListener('activate', event => {
  console.log('✅ Ativando versão:', APP_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================
// INTERCEPTAÇÃO - COM CACHE E FORÇA DE ATUALIZAÇÃO
// ============================================================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = request.url;

  // IGNORA EXTENSÕES E API
  if (url.startsWith('chrome-extension://') || 
      url.startsWith('moz-extension://') ||
      url.startsWith('chrome://') ||
      url.startsWith('about:') ||
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              if (!url.includes('googleapis.com') &&
                  !url.includes('chrome-extension')) {
                cache.put(request, responseToCache).catch(() => {});
              }
            });
          return response;
        });
      })
  );
});

// ============================================================
// MENSAGEM PARA ATUALIZAÇÃO
// ============================================================
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'getVersion') {
    event.ports[0].postMessage(APP_VERSION);
  }
});

// ============================================================
// VERIFICAÇÃO DE ATUALIZAÇÃO PERIÓDICA
// ============================================================
self.addEventListener('periodicSync', function(event) {
  if (event.tag === 'update-check') {
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(urlsToCache);
      })
    );
  }
});
