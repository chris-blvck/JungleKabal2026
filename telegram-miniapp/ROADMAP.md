# Roadmap — Telegram Mini App (Die In The Jungle)

## 0) Foundations (this sprint)
- [x] Web mirror clone runnable online/offline (same React app as mini app).
- [x] Telegram SDK bootstrap (`ready`, `expand`, init user/start_param).
- [x] Referral deep-link parser (`startapp`, `start_param`).
- [x] Run-ticket mechanic foundation (invite => +1 ticket, restart consumes 1 ticket).
- [x] In-app alerts for referral, run end, and low tickets.


## 0.5) Visual FX polish (next)
- [x] Re-anchor combat popups to real enemy/player DOM positions (instead of rough screen %).
- [ ] Add dedicated hit/heal/shield emitters per entity with lane-aware offsets.
- [ ] Add stronger enemy hit flash + player impact ring synced with damage timing.
- [ ] Add mobile safe-area adjustment so effects never clip on Telegram in-app browser.
- [ ] Add toggle in settings: `FX intensity` (low/normal/high).

## 1) Viral Loop v1
- [x] Run finish API + leaderboard persistence (MVP).
- [x] Backend API for referral events (inviter, invited, source, timestamp).
- [x] Validate Telegram initData signature server-side (`X-Telegram-Init-Data`, optional strict mode).
- [~] Anti-abuse rules: one reward per invited user (done), self-referral block (done), cooldowns/device heuristics (todo).
- [x] Reward hook MVP: +1 run ticket on referral claim (local + server sync).
- [ ] Reward catalog v2: cosmetics, streak boosts, quest rewards.
- [ ] Share card generator (zone + score + build + referral CTA).

## 2) Retention + Addiction Layer
- [x] Daily missions (MVP local with reward claims).
- [x] Streak system (basic consecutive-day tracking).
- [ ] Daily missions v2 (+shards/reroll credits/backend sync).
- [ ] Streak system v2 (D1/D3/D7 reward ladder synced server).
- [x] Friends leaderboard endpoint (MVP).
- [ ] Friend leaderboard (global + social graph + real friend graph).
- [ ] Seasons with limited relic pool and season badges.

## 3) Economy + Ops
- [x] Telemetry event endpoint (MVP).
- [ ] Run telemetry pipeline (start, turn, death cause, score submit).
- [ ] Feature flags for balancing/rewards.
- [ ] LiveOps panel (missions, boosts, referral multipliers).
- [ ] A/B tests for onboarding and share CTA placement.

## 4) Scale + Security
- [ ] Server-side score verification / anti-cheat checks.
- [ ] Idempotent referral rewards.
- [ ] Rate limiting and replay protection for callbacks.
- [ ] Alerting dashboard (drop in share-rate, conversion, retention).
