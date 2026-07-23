/**
 * zenitha-auth.js — Authentification & profils Zenitha (Supabase)
 * ────────────────────────────────────────────────────────────────
 * À inclure sur chaque page APRÈS la librairie Supabase :
 *
 * <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * <script src="/zenitha-auth.js"></script>
 *
 * Gère :
 * 1. La connexion via Google (un clic)
 * 2. La sauvegarde du profil cosmique de l'utilisatrice
 * 3. La récupération de son profil à chaque visite
 */

const SUPABASE_URL = 'https://oxmaqxpiqqbpyxnageum.supabase.co';
const SUPABASE_KEY = 'sb_publishable_2BqmWeX9Rxd5vPQTqShz7w_WD5QZ3ZR';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ══════════ AUTHENTIFICATION ══════════ */

/**
 * Lance la connexion via Google.
 * Après validation, l'utilisatrice revient sur la page indiquée.
 */
async function zenithaConnexionGoogle(pageRetour = '/zenitha-inscription.html') {
  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + pageRetour
    }
  });
  if (error) {
    console.error('Zenitha — erreur connexion Google', error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

/**
 * Récupère l'utilisatrice actuellement connectée (ou null).
 */
async function zenithaUtilisatriceActuelle() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

/**
 * Déconnexion.
 */
async function zenithaDeconnexion() {
  await supabaseClient.auth.signOut();
  window.location.href = '/zenitha.html';
}

/**
 * Vérifie si quelqu'un est connecté ; sinon redirige vers l'inscription.
 * À appeler en haut des pages protégées (profil, chat).
 */
async function zenithaProtegerPage() {
  const user = await zenithaUtilisatriceActuelle();
  if (!user) {
    window.location.href = '/zenitha-inscription.html';
    return null;
  }
  return user;
}

/* ══════════ PROFILS COSMIQUES ══════════ */

/**
 * Sauvegarde le profil complet de l'utilisatrice après calcul du thème.
 *
 * @param {Object} donnees - { prenom, date_naissance, heure_naissance,
 *                             lieu_naissance, latitude, longitude, theme }
 */
async function zenithaSauvegarderProfil(donnees) {
  const user = await zenithaUtilisatriceActuelle();
  if (!user) return { success: false, error: 'Non connectée' };

  const { data, error } = await supabaseClient
    .from('profils')
    .upsert({
      user_id: user.id,
      prenom: donnees.prenom,
      email: user.email,
      date_naissance: donnees.date_naissance,
      heure_naissance: donnees.heure_naissance,
      lieu_naissance: donnees.lieu_naissance,
      latitude: donnees.latitude,
      longitude: donnees.longitude,
      theme: donnees.theme,          // le thème complet calculé (JSON)
      premium: false,
      mis_a_jour: new Date().toISOString()
    }, { onConflict: 'user_id' })
    .select();

  if (error) {
    console.error('Zenitha — erreur sauvegarde profil', error);
    return { success: false, error: error.message };
  }
  return { success: true, data };
}

/**
 * Récupère le profil cosmique de l'utilisatrice connectée.
 * Renvoie null si aucun profil n'existe encore.
 */
async function zenithaRecupererProfil() {
  const user = await zenithaUtilisatriceActuelle();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from('profils')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // Pas de profil encore créé — cas normal à la première visite
    return null;
  }
  return data;
}

/**
 * Met à jour uniquement le statut premium (après paiement Stripe plus tard).
 */
async function zenithaDefinirPremium(estPremium) {
  const user = await zenithaUtilisatriceActuelle();
  if (!user) return { success: false };

  const { error } = await supabaseClient
    .from('profils')
    .update({ premium: estPremium })
    .eq('user_id', user.id);

  return { success: !error };
}
