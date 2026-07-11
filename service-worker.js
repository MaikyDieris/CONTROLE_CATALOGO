const CACHE_VERSAO = 'rolamentos-app-v1';
const ARQUIVOS_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/estilo.css',
  '/js/app.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalar e guardar arquivos
self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(CACHE_VERSAO).then(cache => cache.addAll(ARQUIVOS_CACHE))
  );
});

// Ativar e limpar versões antigas
self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys().then(chaves =>
      Promise.all(chaves.filter(c => c !== CACHE_VERSAO).map(c => caches.delete(c)))
    )
  );
});

// Buscar arquivos: se sem internet, usa cache
self.addEventListener('fetch', evento => {
  if (!evento.request.url.startsWith('http')) return;
  evento.respondWith(
    fetch(evento.request)
      .then(resposta => resposta)
      .catch(() => caches.match(evento.request).then(res => res || caches.match('/offline.html')))
  );
});
