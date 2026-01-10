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

