/**
 * zenitha-api.js — Connexion centrale au backend Zenitha
 * ──────────────────────────────────────────────────────
 * À inclure sur chaque page AVANT les autres scripts :
 * <script src="zenitha-api.js"></script>
 *
 * Toutes les pages appellent ces fonctions au lieu de contacter
 * directement l'API Anthropic — la clé reste cachée côté backend.
 */

const ZENITHA_API_BASE = 'https://web-production-6b554.up.railway.app';

/**
 * Calcule le thème astral complet (5 systèmes) à partir des infos de naissance.
 * Utilisé sur : page d'inscription (à la création du profil).
 */
async function zenithaCalculerTheme({ annee, mois, jour, heure, minute, latitude, longitude, timezone }) {
  try {
    const res = await fetch(`${ZENITHA_API_BASE}/theme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ annee, mois, jour, heure, minute, latitude, longitude, timezone })
    });
    return await res.json();
  } catch (err) {
    console.error('Zenitha — erreur calcul thème', err);
    return { success: false, error: err.message };
  }
}

/**
 * Récupère les transits actuels, éventuellement comparés à un thème natal.
 * Utilisé sur : page profil (widget "Transits du jour").
 */
async function zenithaTransits(natales = null) {
  try {
    const res = await fetch(`${ZENITHA_API_BASE}/transits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(natales ? { natales } : {})
    });
    return await res.json();
  } catch (err) {
    console.error('Zenitha — erreur transits', err);
    return { success: false, error: err.message };
  }
}

/**
 * Récupère la phase lunaire actuelle.
 * Utilisé sur : accueil, profil (petits widgets).
 */
async function zenithaPhaseLune() {
  try {
    const res = await fetch(`${ZENITHA_API_BASE}/phase-lune`);
    return await res.json();
  } catch (err) {
    console.error('Zenitha — erreur phase lune', err);
    return { success: false, error: err.message };
  }
}

/**
 * Vérifie que le backend répond (utile pour debug / indicateur "en ligne").
 */
async function zenithaHealthCheck() {
  try {
    const res = await fetch(`${ZENITHA_API_BASE}/health`);
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Génère une lecture de compatibilité entre deux thèmes (premium).
 * Utilisé sur : page compatibilité.
 */
async function zenithaCompatibilite(themeA, themeB, prenomA, prenomB) {
  try {
    const res = await fetch(`${ZENITHA_API_BASE}/compatibilite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme_a: themeA, theme_b: themeB,
        prenom_a: prenomA || 'toi', prenom_b: prenomB || "l'autre"
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Zenitha — erreur compatibilité', err);
    return { success: false, error: err.message };
  }
}


/**
 * Convertit une ville en coordonnées GPS (latitude/longitude) via Nominatim (gratuit, sans clé).
 * Utilisé sur : page d'inscription (champ "lieu de naissance").
 */
async function zenithaVilleVersCoordonnees(nomVille) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(nomVille)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'fr' } }
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      nom_complet: data[0].display_name
    };
  } catch (err) {
    console.error('Zenitha — erreur géocodage', err);
    return null;
  }
}
