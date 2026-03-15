# Die In The Jungle → Telegram Mini App (sans wallet / sans on-chain)

## Où se trouve le code actuellement

- UI jouable React/TSX : `src/pages/DieInTheJungle.tsx`
- Route app : `src/App.jsx` (`/diejungle`)
- Version source backup/legacy : `public/games/die in the jungle/game code DITJ`
- Assets du jeu : `public/games/die in the jungle/assets/...`
- Setup Solana existant (global app, facultatif pour ce scope) : `src/solanaSetup.jsx`

## Réponse courte

Oui, c'est **possible** et c'est même le scénario le plus simple:
- Mini App Telegram,
- score enregistré via l'identité Telegram,
- **aucune connexion wallet**,
- **aucune interaction on-chain**.

## Niveau de difficulté (version demandée)

- **MVP Telegram avec leaderboard** : facile à moyen (1–4 jours)
- **Version solide anti-cheat + daily run + saison** : moyen (1–2 semaines)

## Challenges principaux (sans wallet)

1. **Authentification Telegram fiable**
   - Utiliser `initData` signé par Telegram pour identifier le joueur.
   - Ne pas faire confiance aux IDs envoyés brut côté client.

2. **Anti-cheat des scores**
   - Le score calculé 100% front est falsifiable.
   - Il faut un backend qui valide les runs (events, seed, cohérence des actions).

3. **Daily run équitable**
   - Une seed quotidienne unique (UTC) pour tout le monde.
   - Verrouiller la soumission: 1 run compétitif / jour / user (ou 3 essais max).

4. **Perf mobile dans Telegram**
   - Optimiser assets/animations pour Android entrée et milieu de gamme.
   - Limiter bundle JS initial.

5. **Persistance côté serveur**
   - `localStorage` reste utile pour confort local,
   - mais le classement officiel doit vivre en base serveur.

## Architecture recommandée (Telegram-native)

1. **Front Mini App (React/Vite)**
   - Réutiliser `DieInTheJungle.tsx`.
   - Intégrer Telegram WebApp SDK (`window.Telegram.WebApp`) pour:
     - `initData` / `initDataUnsafe`,
     - thème Telegram,
     - haptics + boutons natifs.

2. **Backend API**
   - Vérification HMAC de `initData` (Bot token).
   - Endpoints:
     - `POST /run/start` (seed du jour + ticket),
     - `POST /run/finish` (score + logs run),
     - `GET /leaderboard/daily`,
     - `GET /leaderboard/season`.
   - Contrôles anti-cheat (timestamps, limites actions, replay de logique clé).

3. **Data layer**
   - Tables: `users`, `daily_runs`, `season_points`, `events`.
   - Index sur `day_utc`, `telegram_user_id`, `score`.

## Features recommandées (sans on-chain)

- **Daily Run seedée** (même seed pour tous, classement clean).
- **Saisons hebdo/mensuelles** avec reset automatique.
- **Streaks de connexion** (bonus cosmetiques, titles).
- **Ghost replay des top runs**.
- **Challenges communautaires Telegram** (objectif global de dégâts/kill).
- **Clans / squads** basés sur groupes Telegram.

## Résultats positifs attendus

- **Friction minimale**: ouverture immédiate depuis Telegram.
- **Rétention forte**: daily run + saison + streak.
- **Croissance organique**: partage de score dans les chats.
- **Ops simplifiées**: pas de wallet support, pas de gas, moins de support client.
- **Base prête pour plus tard**: si besoin, une couche Solana pourra être ajoutée ensuite, sans bloquer le lancement.

## Roadmap conseillée

### Phase 1 — MVP (rapide)
- Intégration Telegram SDK.
- Backend auth Telegram + leaderboard quotidien.
- Écran résultat + partage score.

### Phase 2 — Compétitif
- Daily run seedée + anti-cheat renforcé.
- Saison + ranking global + historique joueur.
- Admin panel simple pour modération des scores.

### Phase 3 — Social loop
- Challenges de groupe.
- Clans/squads et classement équipe.
- Événements limités dans le temps.

## Note "On build sur Solana"

Même sans wallet ni on-chain au lancement, vous pouvez garder:
- branding Solana,
- narration Solana-native,
- rewards off-chain indexés sur campagnes Solana,

et décider plus tard si une intégration blockchain apporte réellement de la valeur produit.
