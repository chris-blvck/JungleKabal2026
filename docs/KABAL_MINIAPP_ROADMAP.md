# Kabal Mini App Roadmap

This file is the source of truth for mini-app product progress.

## P0 — Live
- Visual catalog with framed premium UI
- Kourses / Kodex / Koaching sections
- Cart + SOL payment + confirmation
- Payment status polling with pending/confirmed/expired
- Expiring payment sessions (`expiresAt`)

## P1 — In Progress
- My Access panel in mini app (owner-based entitlement list)
- Purchase history endpoint + UI
- Better fallback UX when API is unavailable

## P2 — Next (Growth)
- Connect entitlements directly into Academy gated pages
- Auto-confirmation worker (server-side scan of pending tx)
- Deep wallet integration (no manual signature paste)

## P3 — Ops / Data
- Conversion dashboard (view -> add-to-cart -> pay -> confirm)
- Solana RPC monitoring + alerting
- Anti-fraud rules + rate limits + signature replay protection

## Update rules
- Update this file + `server/data/product-catalog.json` (`roadmap`) every sprint.
- Every done item should be traceable to a commit/PR.
