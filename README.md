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


## Angel Ops mini-app (deploy-ready)

### Local run (web + API)

```bash
# terminal 1
npm run api

# terminal 2
npm run dev
```

Mini-app route (team context):
- `/telegram/angel-ops`

### Environment variables

Create `.env` from `.env.example` and set at least:

- `VITE_ANGEL_OPS_API_BASE` (frontend -> API base URL)
- `ANGEL_OPS_ADMIN_TOKEN` (server write protection)
- `VITE_ANGEL_OPS_ADMIN_TOKEN` (optional client token for admin writes)

### Angel Ops API endpoints

- `GET /api/angel-ops/state`
- `PUT /api/angel-ops/wallets` (protected if `ANGEL_OPS_ADMIN_TOKEN` is set)
- `POST /api/angel-ops/snapshot` (protected if `ANGEL_OPS_ADMIN_TOKEN` is set)

### Production deployment checklist

1. Deploy frontend (Vite build) and backend (`server/index.mjs`) behind HTTPS.
2. Set `VITE_ANGEL_OPS_API_BASE` to the public API URL.
3. Set `ANGEL_OPS_ADMIN_TOKEN` on server and rotate regularly.
4. If using client-side admin actions, set `VITE_ANGEL_OPS_ADMIN_TOKEN` in secure private env (avoid exposing broad-scope token).
5. Persist `server/data/angel-ops.json` on durable storage (or migrate to Postgres/Supabase for scale).
6. Add a cron/worker to refresh snapshots periodically without relying on open client tabs.
7. Configure monitoring (API health, 4xx/5xx rates, stale snapshot alerts).


### Angel Ops deploy docs
- Fast deploy runbook: `docs/ANGEL_OPS_DEPLOY_FAST.md`
- Master remaining roadmap: `docs/ANGEL_OPS_ROADMAP_MASTER.md`


Backend hardening vars (recommended in production):
- `CORS_ALLOW_ORIGIN=https://your-frontend-domain`
- `ANGEL_OPS_RATE_LIMIT_WINDOW_MS=60000`
- `ANGEL_OPS_RATE_LIMIT_MAX=60`
