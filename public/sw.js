// AdventQuest : garde l'appli sur l'appareil pour qu'elle s'ouvre même sans réseau (site ajouté à l'écran d'accueil).
// - Pages : réseau d'abord (toujours la dernière version), la copie gardée si le réseau ne répond pas.
// - Code, jeux, images, Phaser : la copie gardée tout de suite, mise à jour en arrière-plan.
// - Le serveur des scores (Supabase, autre domaine) n'est jamais mis en cache : il passe toujours par le réseau.
// Changer CACHE (v2, v3...) repart d'un cache vide au prochain chargement.
const CACHE = 'adventquest-v1';
const PRECACHE = ['/', '/phaser.min.js', '/manifest.webmanifest', '/icon-192.png', '/apple-touch-icon.png'];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => {}) // une icône manquante ne doit pas empêcher l'installation
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await withTimeout(fetch(request), NETWORK_TIMEOUT_MS);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    // Hors ligne : la page gardée, sinon l'accueil (l'appli affiche ensuite la bonne page à partir de l'adresse)
    return (await cache.match(request)) || (await cache.match('/')) || Response.error();
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  if (cached) {
    event.waitUntil(update);
    return cached;
  }
  return update;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase, CDN... : le réseau, sans cache
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request, event));
});
