# Die In The Jungle — Telegram Mini App Repo

Ce dossier est un **nouveau repo applicatif** (structure indépendante) pour porter `Die In The Jungle` en Telegram Mini App sans casser la version desktop existante.

## Ce qui est déjà porté

- Daily missions (MVP local) + claim rewards tickets.
- Streak tracking (consecutive run days).
- Le jeu est copié dans `src/game/DieInTheJungle.tsx`.
- Le boot Telegram Mini App est activé (`ready`, `expand`) dans `src/telegram.ts`.
- Support referral natif Telegram via `startapp` / `start_param`.
- Base de boucle virale intégrée au run:
  - invite/referral entrant => `+1 run ticket`
  - `Play again` consomme `1 run ticket`
  - alertes in-app (run terminé, bonus referral, tickets épuisés)
- Bouton de partage Telegram (`t.me/share/url`) pour pousser la viralité.

## Setup rapide

```bash
cd telegram-miniapp
npm install
npm run dev
```

## Variables d'environnement

Créer un `.env`:

```bash
VITE_TELEGRAM_BOT_USERNAME=TonBotUsername
VITE_MINIAPP_API_BASE=https://ton-api.example.com
```


## Backend MVP intégré

Le frontend mini app est déjà branché sur un backend MVP:

- `POST /api/runs/finish` (save run)
- `GET /api/runs/leaderboard?limit=20`
- `POST /api/runs/friends-leaderboard`
- `POST /api/referrals/claim` (idempotent par `invitedUserId`)
- `GET /api/referrals/stats/:code`
- `POST /api/miniapp/auth/check`
- `POST /api/telemetry/event`
- `GET /api/telemetry/summary`

Ces routes sont servies par `server/index.mjs` (même process que l'API Academy).

## Miroir web (clone testable online)

Oui, c'est recommandé. Cette app sert aussi de **miroir web** du mini app Telegram.

### Déploiement Vercel (simple)

1. Push `telegram-miniapp/` dans un repo dédié (ou configurer root dir sur ce dossier).
2. Dans Vercel:
   - Framework: `Vite`
   - Root Directory: `telegram-miniapp`
   - Build command: `npm run build`
   - Output directory: `dist`
3. Ajouter l'env var `VITE_TELEGRAM_BOT_USERNAME`.
4. Déployer et récupérer l'URL (ex: `https://die-jungle-miniapp.vercel.app`).
5. Déclarer cette même URL en `Mini App URL` dans BotFather.


## Ce qui manque pour tourner sur Telegram (concrètement)

Checklist minimum prod:

1. Créer/configurer le bot via BotFather (`/newbot`, `/newapp`).
2. Déployer le frontend (`telegram-miniapp/`) sur un domaine HTTPS public.
3. Déployer l'API Node (`npm run api`) sur un domaine HTTPS public.
4. Définir:
   - `VITE_TELEGRAM_BOT_USERNAME`
   - `VITE_MINIAPP_API_BASE`
5. Déclarer l'URL mini app dans BotFather (même URL que le mirror web).
6. Configurer les variables backend:
   - `TELEGRAM_BOT_TOKEN` (pour valider la signature initData Telegram)
   - `TELEGRAM_STRICT_AUTH=1` (optionnel, force auth signée)
7. Vérifier les endpoints backend:
   - `POST /api/runs/finish`
   - `GET /api/runs/leaderboard`
   - `POST /api/referrals/claim`
   - `GET /api/referrals/stats/:code`
- `POST /api/miniapp/auth/check`
- `POST /api/telemetry/event`
- `GET /api/telemetry/summary`

## Vérification workflow jeu (smoke test)

- Character select OK.
- Roll / place / resolve loop OK.
- Reward screen avec sortie `pick` ou `skip` OK.
- End screen + restart (run ticket) OK.
- Referral entrant (`start_param`) => ticket local + sync serveur (si API dispo).

## Architecture cible (migration progressive)

1. **Game core partagé**
   - Extraire la logique pure du jeu (state + reducers + balancing) dans un package partagé (`packages/game-core`) pour desktop + mini app.

2. **Adapter Telegram**
   - Garder UI web React, mais ajouter un adapter Telegram:
     - init data user
     - start_param referral
     - haptics / main button / back button

3. **Backend viral loop**
   - Endpoint `POST /runs/finish` (score, floor, build hash)
   - Endpoint `POST /referral/claim` (inviter, invited)
   - Leaderboard global + leaderboard social.

4. **Monétisation/retention**
   - Daily streak, missions, reward chests, quest social.
   - Récompenses referral (cosmétiques, reroll token, relic tickets).

## Plan recommandé (ordre ROI)

Voir `ROADMAP.md` pour le backlog priorisé.

## Documentation logic

- Spécification scalable: `docs/GAME_LOGIC.md`.

## Notes de compatibilité

La version desktop actuelle reste dans le repo principal (`src/pages/DieInTheJungle.tsx`) et continue de fonctionner sans dépendre de ce dossier.
