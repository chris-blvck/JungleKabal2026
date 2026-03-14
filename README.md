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

## Kabal Payment Processor (SOL) · Mini App first

Le flow de vente est maintenant **mini app first**:
- depuis le site, l'utilisateur est redirigé vers Telegram Mini App
- le catalogue, panier, upsell, création paiement et confirmation tx se font dans la mini app
- Auto-refresh payment status every 4s with pending/confirmed/expired states
- includes MEMECOINS COURSE (BEGINNER) as FREE starter with symbolic 0.00001 SOL activation
- includes MEMECOINS COURSE (BEGINNER/INTERMEDIATE) at 20 SOL
- includes Kourses / Kodex / Koaching sections with MINDSET and AI AUTOMATION & AGENT as coming soon
- frontend includes a local fallback catalog if `/api/catalog` is unreachable (dev resilience)
- une fois confirmé, le backend crée les entitlements (wallet/telegram) pour token gating

### Endpoints

- `GET /api/catalog`
- `POST /api/payments/create-cart`
- `POST /api/payments/:id/confirm`
- `POST /api/payments/link-telegram`
- `GET /api/payments/history?telegramId=...&wallet=...`
- `GET /api/access/list?telegramId=...&wallet=...`
- `POST /api/waitlist/subscribe`
- `GET /api/access/check?productId=...&wallet=...&telegramId=...`
- `POST /api/telegram/webhook` (uniquement pour ouvrir la mini app / link)

### Variables d'environnement

```bash
ACADEMY_API_PORT=8787
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
PAYMENT_WALLET_POOL=wallet1,wallet2,wallet3
# ou PAYMENT_WALLET=wallet_unique
PAYMENT_EXPIRY_MINUTES=15

# Front redirect mini app
VITE_TELEGRAM_MINI_APP_URL=https://t.me/ton_bot/ton_mini_app

# Bot Telegram (optionnel, pour /start + bouton web_app)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_MINI_APP_URL=https://ton-domaine/telegram-miniapp
```

### Route mini app

- `/telegram-miniapp`


### Roadmap

- Fichier roadmap produit mini app: `docs/KABAL_MINIAPP_ROADMAP.md`
- Roadmap runtime utilisée par la mini app: `server/data/product-catalog.json` clé `roadmap`
- Process recommandé: mettre à jour les deux à chaque sprint.
