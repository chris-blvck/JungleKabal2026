# Jungle Kabal

This project is a React app built with Vite and Tailwind CSS. It includes a main sales page and three sub pages: the **Kabal Kash Machine**, the **Kabal Hunters Lodge**, and the **Kabal Angels** demo. Routing between pages is managed by React Router. 

## Local Development

1. Install dependencies (internet connection required):
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```

The application will be served at `http://localhost:5173` by default.

## Building for Production

To create a production build, run:

```bash
npm run build
```

The static output will be generated in the `dist` directory.

## Solana Setup

This project includes a minimal provider setup (`src/solanaSetup.jsx`) using
`@solana/web3.js` and the wallet adapter. After installing dependencies, you can
connect a wallet like Phantom and interact with Solana programs from your React
components. Update the endpoint in that file if you want to use a different
cluster (e.g. devnet or testnet).

## Solana Integration (Overview)

This repository only contains the front‑end code. To integrate Solana functionality, you can add the [`@solana/web3.js`](https://github.com/solana-labs/solana-web3.js/) library and connect to a wallet using tools such as [`@solana/wallet-adapter`](https://github.com/solana-labs/wallet-adapter). After installing the packages, you can interact with on‑chain programs from your React components.


## Academy Admin + API

- Start API (persists editable academy content):
  ```bash
  npm run api
  ```
- Start web app:
  ```bash
  npm run dev
  ```

Admin route (team subdomain): `/academy/admin`
User route: `/academy`

API endpoint used by admin/user pages: `GET/PUT /api/academy/content` (default `http://localhost:8787`).

## Kabal Payment Processor (SOL + Telegram link)

Le serveur Node inclut maintenant un flow de paiement SOL minimal pour Academy:

- Page checkout: `/academy/checkout`
- Créer un paiement: `POST /api/payments/create`
- Vérifier un paiement: `POST /api/payments/:id/confirm`
- Vérifier un accès token-gated: `GET /api/access/check?productId=...&wallet=...&telegramId=...`
- Lier Telegram manuellement: `POST /api/payments/link-telegram`
- Webhook bot Telegram (deep-link `/start link_<paymentId>`): `POST /api/telegram/webhook`

### Variables d'environnement

```bash
ACADEMY_API_PORT=8787
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PAYMENT_WALLET_POOL=wallet1,wallet2,wallet3
# ou PAYMENT_WALLET=wallet_unique
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_STRICT_AUTH=0
```

Le backend fait une rotation automatique des wallets de réception via `PAYMENT_WALLET_POOL` (pour sécurité/opsec).


## Telegram Mini App Migration

A dedicated Telegram Mini App repo scaffold now exists in `telegram-miniapp/` to migrate **Die In The Jungle** while keeping desktop routes unchanged.


### Mini App backend endpoints (MVP)

When running `npm run api`, the same Node server now also exposes Telegram Mini App MVP endpoints:

- `POST /api/runs/finish` (`mode: competitive|practice`)
- `GET /api/runs/leaderboard?limit=20&mode=competitive|practice`
- `POST /api/runs/friends-leaderboard`
- `POST /api/referrals/claim`
- `GET /api/referrals/stats/:code`
- `POST /api/miniapp/auth/check`
- `POST /api/telemetry/event`
- `GET /api/telemetry/summary`

Miniapp run rules (current MVP):
- **Competitive daily**: 1 run/day by default (fair board), with extra daily attempts unlocked when a competitive run reaches zone 6+.
- **Practice**: capped to **10 runs/day**.
