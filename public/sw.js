const CACHE_NAME = 'brujula-shell-v1';

// Solo cacheamos el shell de la app — NUNCA los datos
const SHELL_ASSETS = [
  '/',
  '/login',
];

// Archivos que NUNCA se cachean — siempre van a la red
const NEVER_CACHE = [
  '/data/brujula_data.json',
  '/api/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Datos y API siempre van a la red — nunca caché
  if (NEVER_CACHE.some((p) => url.pathname.startsWith(p))) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Shell: red primero, caché como fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
