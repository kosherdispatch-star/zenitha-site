/**
 * service-worker.js — Zenitha
 * ─────────────────────────────
 * Gère :
 * 1. La mise en cache des pages pour un chargement rapide et un fonctionnement hors-ligne partiel
 * 2. La réception et l'affichage des notifications push (alertes cosmiques)
 * 3. Le clic sur une notification (ouvre la bonne page)
 */

const CACHE_NAME = 'zenitha-v1';

// Pages et fichiers essentiels à mettre en cache pour un accès rapide
const FICHIERS_A_CACHER = [
  '/zenitha.html',
  '/zenitha-inscription.html',
  '/zenitha-connexion.html',
  '/zenitha-profil.html',
  '/zenitha-chat.html',
  '/manifest.json',
];

// ── INSTALLATION ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FICHIERS_A_CACHER).catch((err) => {
        // Ne bloque pas l'installation si un fichier manque (utile en dev)
        console.warn('Zenitha SW — certains fichiers n\'ont pas pu être mis en cache :', err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATION — nettoyage des anciens caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) => {
      return Promise.all(
        noms
          .filter((nom) => nom !== CACHE_NAME)
          .map((nom) => caches.delete(nom))
      );
    })
  );
  self.clients.claim();
});

// ── STRATÉGIE DE CACHE — réseau d'abord, cache en secours ──
// (Toujours essayer d'avoir la version la plus fraîche ; si hors-ligne, utiliser le cache)
self.addEventListener('fetch', (event) => {
  // On ne met en cache que les requêtes GET vers notre propre site
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((reponse) => {
        // Met à jour le cache avec la version fraîche
        const copie = reponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copie));
        return reponse;
      })
      .catch(() => {
        // Hors-ligne : on sert la version en cache si elle existe
        return caches.match(event.request);
      })
  );
});

// ── RÉCEPTION D'UNE NOTIFICATION PUSH ──
self.addEventListener('push', (event) => {
  let data = {
    title: 'Zenitha',
    body: 'Les étoiles ont quelque chose à te dire.',
    url: '/zenitha-profil.html',
  };

  // Le serveur (Firebase Cloud Messaging) envoie les vraies données ici
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/zenitha-icon-192.png',
    badge: '/icons/zenitha-icon-96.png',
    image: data.image || undefined,
    vibrate: [200, 100, 200],
    tag: data.tag || 'zenitha-notification',
    data: { url: data.url || '/zenitha-profil.html' },
    actions: [
      { action: 'ouvrir', title: 'Découvrir' },
      { action: 'fermer', title: 'Plus tard' },
    ],
    // Couleurs cohérentes avec l'identité Zenitha
    silent: false,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── CLIC SUR UNE NOTIFICATION ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'fermer') return;

  const urlCible = event.notification.data?.url || '/zenitha-profil.html';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      // Si Zenitha est déjà ouverte dans un onglet, on le réutilise
      for (const client of clientsArr) {
        if (client.url.includes('zenitha') && 'focus' in client) {
          client.navigate(urlCible);
          return client.focus();
        }
      }
      // Sinon on ouvre un nouvel onglet
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlCible);
      }
    })
  );
});
