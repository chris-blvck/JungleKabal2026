# Kabal Mini App Roadmap

This file is the source of truth for mini-app product progress.

## P0 — Live
- Visual catalog with framed premium UI
- Kourses / Kodex / Koaching sections
- Cart + SOL payment + confirmation
- Payment status polling with pending/confirmed/expired
- Expiring payment sessions (`expiresAt`)

## P1 — Done
- My Access panel in mini app ✅
- Purchase history endpoint + UI ✅
- Die in the Jungle shop mode (skins/bundles/passes) ✅
- Better fallback UX when API is unavailable ✅

## P2 — Done
- Connect entitlements directly into Academy gated pages ✅
- Auto-confirmation worker (server-side scan of pending tx) ✅
- Deep wallet integration (wallet connect + auto-detect shortcuts) ✅

## P3 — In Progress (Ops / Data)
- Conversion dashboard (view -> add-to-cart -> pay -> confirm) ✅
- Solana RPC monitoring + alerting (health counters + last errors) ✅
- Anti-fraud rules + rate limits + signature replay protection ✅

## Next iteration improvements
- Admin dashboard UI for `/api/analytics/dashboard`
- Alert webhooks (Discord/Telegram) for RPC failure spikes
- Signed Telegram init-data validation for higher trust identity mapping

## Update rules
- Update this file + `server/data/product-catalog.json` (`roadmap`) every sprint.
- Every done item should be traceable to a commit/PR.
