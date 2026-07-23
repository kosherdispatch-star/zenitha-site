/**
 * zenitha-pwa.js — Module d'installation PWA
 * ────────────────────────────────────────────
 * À inclure sur chaque page du site (juste avant </body>) :
 * <script src="zenitha-pwa.js"></script>
 *
 * Gère :
 * 1. L'enregistrement du service worker
 * 2. L'invite d'installation élégante (au bon moment, pas intrusive)
 * 3. La demande de permission pour les notifications (une fois installée)
 */

(function () {
  'use strict';

  // ── 1. ENREGISTREMENT DU SERVICE WORKER ──
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then((reg) => console.log('Zenitha — présence installée', reg.scope))
        .catch((err) => console.warn('Zenitha SW — échec d\'enregistrement', err));
    });
  }

  // ── 2. INVITE D'INSTALLATION ──
  let deferredPrompt = null;
  const CLE_STORAGE = 'zenitha_install_dismissed';
  const CLE_VISITES = 'zenitha_visit_count';

  // On compte les visites pour ne proposer l'installation qu'après un vrai engagement
  function compterVisite() {
    const n = parseInt(localStorage.getItem(CLE_VISITES) || '0') + 1;
    localStorage.setItem(CLE_VISITES, n);
    return n;
  }

  const nbVisites = compterVisite();
  const dejaRefuse = localStorage.getItem(CLE_STORAGE) === 'true';

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // On ne montre l'invite qu'à partir de la 2ème visite, et si pas déjà refusée
    if (nbVisites >= 2 && !dejaRefuse) {
      setTimeout(afficherInvite, 4000); // après 4s sur la page, pas immédiatement
    }
  });

  function afficherInvite() {
    if (document.getElementById('zenitha-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'zenitha-install-banner';
    banner.innerHTML = `
      <style>
        #zenitha-install-banner {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          max-width: 420px;
          margin: 0 auto;
          background: linear-gradient(135deg, rgba(16,21,46,0.98), rgba(7,9,26,0.98));
          border: 1px solid rgba(198,162,74,0.35);
          border-radius: 2px;
          padding: 18px 18px 16px;
          z-index: 9999;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          font-family: 'Inter', sans-serif;
          opacity: 0;
          transform: translateY(20px);
          animation: zenithaBannerIn 0.5s cubic-bezier(0.2,0.8,0.3,1) forwards;
        }
        #zenitha-install-banner::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(to right, transparent, #C6A24A, transparent);
        }
        @keyframes zenithaBannerIn { to { opacity: 1; transform: none; } }
        .zib-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .zib-orb {
          width: 28px; height: 28px; border-radius: 50%;
          background: radial-gradient(circle at 35% 35%, rgba(198,162,74,0.4), #0C1024 70%);
          border: 1px solid rgba(198,162,74,0.4);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant Garamond', serif; color: #E2C97E; font-size: 0.9rem;
          flex-shrink: 0;
        }
        .zib-title {
          font-family: 'Cormorant Garamond', serif; font-size: 1.05rem;
          color: #E2C97E; font-weight: 400;
        }
        .zib-text {
          font-size: 0.78rem; color: rgba(237,233,218,0.7);
          line-height: 1.6; margin-bottom: 14px;
        }
        .zib-actions { display: flex; gap: 10px; }
        .zib-btn-install {
          flex: 1;
          background: linear-gradient(135deg, #C6A24A, #8A6020);
          color: #04060E; border: none; padding: 11px;
          font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer;
        }
        .zib-btn-later {
          background: none; border: 1px solid rgba(198,162,74,0.25);
          color: rgba(237,233,218,0.5); padding: 11px 16px;
          font-family: 'Inter', sans-serif; font-size: 0.68rem;
          letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer;
        }
      </style>
      <div class="zib-head">
        <div class="zib-orb">✦</div>
        <div class="zib-title">Garde Zenitha près de toi</div>
      </div>
      <div class="zib-text">Installe Zenitha sur ton écran d'accueil pour un accès immédiat et des alertes cosmiques personnalisées.</div>
      <div class="zib-actions">
        <button class="zib-btn-install" id="zib-install">Installer</button>
        <button class="zib-btn-later" id="zib-later">Plus tard</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('zib-install').addEventListener('click', async () => {
      banner.remove();
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // Une fois installée, on peut proposer les notifications
        setTimeout(demanderNotifications, 2000);
      }
      deferredPrompt = null;
    });

    document.getElementById('zib-later').addEventListener('click', () => {
      localStorage.setItem(CLE_STORAGE, 'true');
      banner.remove();
    });
  }

  // ── 3. NOTIFICATIONS ──
  function demanderNotifications() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Zenitha — notifications activées');
          // Ici on enverra le token au backend pour l'enregistrer (Firebase Cloud Messaging)
          // À connecter lors du déploiement avec Firebase.
        }
      });
    }
  }

  // Détecte si déjà installée (mode standalone) pour adapter l'UI si besoin
  window.zenithaEstInstallee = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
})();
