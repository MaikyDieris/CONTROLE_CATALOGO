// Gerenciador Industrial — Service Worker
const APP_VERSION = '4.0.0';
const CACHE_PREFIX = 'gerenciador-industrial-';
const CACHE_NAME = `${CACHE_PREFIX}${APP_VERSION}`;
const APP_ROOT = '/CONTROLE_CATALOGO/';

const APP_SHELL = [
  APP_ROOT,
  `${APP_ROOT}index.html`,
  `${APP_ROOT}manifest.json`,
  `${APP_ROOT}icons/icon-192.png`,
  `${APP_ROOT}icons/icon-512.png`
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

function isIgnoredRequest(request) {
  const url = new URL(request.url);
  return request.method !== 'GET' ||
    url.protocol === 'chrome-extension:' ||
    url.protocol === 'moz-extension:' ||
    url.protocol === 'data:' ||
    url.protocol === 'blob:' ||
    url.hostname === 'script.google.com' ||
    url.hostname.endsWith('.googleusercontent.com');
}

// Navegação usa a rede primeiro. Assim, uma implantação nova aparece
// imediatamente; o cache é usado apenas quando o dispositivo está offline.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request)) ||
      (await cache.match(`${APP_ROOT}index.html`)) ||
      Response.error();
  }
}

// Recursos estáticos abrem rapidamente pelo cache e são atualizados em segundo plano.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then(response => {
    if (response && response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (isIgnoredRequest(request)) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', event => {
  if (event.data === 'skipWaiting' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'getVersion' || event.data?.type === 'GET_VERSION') {
    const reply = { type: 'APP_VERSION', version: APP_VERSION };
    if (event.ports && event.ports[0]) event.ports[0].postMessage(reply);
    else if (event.source) event.source.postMessage(reply);
  }
});

