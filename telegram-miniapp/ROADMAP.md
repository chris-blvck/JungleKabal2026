# Roadmap — Telegram Mini App (Die In The Jungle)

## 0) Current shipped foundation
- [x] Web mirror clone runnable online/offline.
- [x] Telegram SDK bootstrap (`ready`, `expand`, init user/start_param).
- [x] Referral deep-link parser (`startapp`, `start_param`).
- [x] Daily competitive vs practice split with daily caps.
- [x] Third character slot introduced as **K-Rex** (locked by default).
- [x] Build prep surface (starter weapon + companion selection) in miniapp UI.
- [x] Readability + FX intensity toggles for in-app preview comfort.

## 1) Competitive system (priority)
- [ ] Daily Seed endpoint (1 fixed seed/day UTC).
- [ ] Official daily attempt lock (1 free fair attempt/day).
- [ ] Extra attempts handling (open board / monetized path).
- [ ] Weekly leaderboard reset (Monday UTC) + reward payout logic.
- [ ] Telegram channel auto-post for Top10 / Top3 summary.

## 2) Map + run structure
- [ ] Branching map model (`MapNode[]`) with fog reveal depth=1.
- [ ] Merge-before-boss guarantee and node-type balancing.
- [ ] Node types: mob / elite / boss / shop / event / rest.
- [ ] Zone scaling table (Z1 linear, Z2 branching, Z3+ dense).

## 3) Build system v2 (weapons/companions)
- [~] Starter weapon selection in pre-run build menu (MVP done, depth pending).
- [~] Companion selection pre-run with passive/auto effects (MVP done, depth pending).
- [ ] 2-slot weapon loadout (main hand + off hand) runtime support.
- [ ] Weapon archetype engine (blade/staff/shield/totem/cannon/fang).
- [ ] Specials activation UI + cooldown display + animations.
- [ ] Rarity pipeline (common/rare/epic/legendary + unique legendary passives).

## 4) Economy loops
- [ ] Coins in run-state (combat gains + shop spend + rerolls).
- [ ] Gems persistent backend sync + unlock economy balancing.
- [ ] Shop NPC "Le Passeur" (3-4 slots + 1 reroll/visit).
- [ ] Artifact integration in shop flow (buy + reroll reward options).

## 5) Events & narrative
- [ ] Event engine with safe/risky dual choices and tags.
- [ ] Initial pool of 10 narrative events (target 15-20).
- [ ] Rest node design finalization (heal vs artifact upgrade).
- [ ] Merchant dialogue pool (8-10 rotating lines).

## 6) Security / anti-cheat / ops
- [ ] Server-side run verification (seed, path, deterministic checks).
- [ ] Replay protection + stronger callback idempotency.
- [ ] Device/cooldown heuristics for referral abuse.
- [ ] Telemetry pipeline: `run_start`, `turn`, `death_cause`, `submit`.
- [ ] Feature flags + LiveOps + A/B routing.

## 7) UX / visual polish
- [ ] Lane-aware hit/heal/shield emitters.
- [ ] Enemy impact flash + player impact ring timing sync.
- [ ] Telegram mobile safe-area handling (notch/bottom controls).
- [ ] Character-select overlay tuning pass to keep battlefield readability.

## 8) Suggested sprint order
### Sprint A (2-4 days)
- Daily seed backend + official attempt lock + weekly board reset.
- Coins system in runtime state + basic payouts.

### Sprint B (3-5 days)
- Branching map engine + node traversal UI.
- Shop NPC v1 + pricing tables from config.

### Sprint C (next)
- Weapon archetypes + two-slot loadout + specials UI.
- Event pool v1 + anti-cheat verification pass.
