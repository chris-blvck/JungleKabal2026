# GAME TODO — Die in the Jungle / Jungle Kabal 2026

Comprehensive feature backlog organized by retention loop and priority.

---

## LOOP 1 — PER TURN (5-10 sec)

These affect every single player action. Highest priority for feel.

- [ ] **Badge charge ennemi** — pulsing red badge on enemy portrait when `enemy.charge > 0`: "⚡ +{charge} READY" — makes enemy intent visible before it fires
- [ ] **Lane bonus visuel fix** — `resolveTurn()` needs to consume `topRowHasHeal` (reset random cooldown) and `botRowDiceCount` (+1 coin per die in bottom row). Currently defined but not triggered in resolve logic.
- [ ] **Hit flash animation** — brief white/red flash on character portrait when taking damage
- [ ] **Dice placement animation** — small bounce when die drops into lane slot
- [ ] **Surge indicator** — show "SURGE!" text burst when 3 same-type dice align
- [ ] **Special die face visual badge** — Pierce/Echo/Fortress icons visible on die card face, not just value number
- [ ] **Enemy intent clarity** — show attack/shield/heal icon on intent, not just number
- [ ] **Die cooldown countdown** — show turns remaining on greyed-out die card

---

## LOOP 2 — PER COMBAT / PER RUN

These affect each run session (20-40 min engagement).

### Weapon System
- [ ] **Weapon system integration** — `weapons.ts` exists but has zero UI and zero usage in game code. Need equip screen + in-combat passive/active logic
- [ ] **Weapon passive effects** — each weapon archetype passive applied at run start: blade +2 ATK, staff +2 heal, shield +3 max HP, totem +1 CD tick, cannon +3 ATK, fang +1 ATK + DoT
- [ ] **Weapon special ability** — unique active per weapon usable in combat (mana-gated or cooldown-gated)
- [ ] **Weapon rarity tiers** — common / rare / epic / legendary with scaling stat bonuses

### Companion System
- [ ] **Companion equip screen** — pre-run selection screen to pick companion from unlocked list
- [ ] **Companion gate by unlock** — `hasCompanionSlot(meta)` check before showing companion UI
- [ ] **Gecko Mystique passive** — +1 to all attack die values during resolve
- [ ] **Croak Jr. active** — Leap: deal 8 flat damage, costs mana or has cooldown
- [ ] **L'Œil active** — Vision: show 2 next enemy intents ahead; free reroll

### Pre-Run Screen
- [ ] **Pre-run screen** — full screen before entering run: character + weapon + companion + starting buff selection
- [ ] **Nomade Ka character** — 28 HP, 0 ATK bonus, 1 extra reroll, Adaptation passive (adapts to biome for bonus). Gated by unlock.
- [ ] **Pre-run buffs** — 8 consumable buffs purchasable with gems before run (e.g., +5 max HP, +2 start coins, reroll token, etc.)

### Combat Loop
- [ ] **Post-combat loot popup** — after each mob kill: choose Max HP +2 / Mana charge / +1 Coin — fast, 2 sec tap then auto-dismiss
- [ ] **Boss reward** — guaranteed free artifact pick (3 choices) after each boss kill
- [ ] **Free artifact pick screen** — show 3 artifact cards, player chooses 1
- [ ] **Mana resource** — resource for weapon specials and companion actives. Recharged by die placement or rest nodes.
- [ ] **Elite enemies** — stronger versions of mobs in later zones (zones 3+), slight color/outline variant, +25% HP/ATK
- [ ] **Champion pool in zone 1** — lower probability champion encounter but present even in zone 1

### Map
- [ ] **Shop guaranteed per zone** — shop node always present in each zone, before boss
- [ ] **Boss node at end of zone** — zone structure: [mobs...] → [shop] → [BOSS]
- [ ] **Map visual refresh** — mark node as visited after combat, update map state reactively
- [ ] **Zone history breadcrumbs** — show biomes visited and boss kills in a strip below map

### Biome System
- [ ] **Biome system** — each zone = one biome (jungle / ruins / temple / abyss / void) with its own background images and enemy pool subset
- [ ] **Biome changes after boss** — random biome selection after each boss kill, dynamically changes game background
- [ ] **Multiple backgrounds per biome** — cycle through 3-4 bg variants within the same biome during play
- [ ] **Biome-specific enemies** — enemies tagged by biome; only spawn in their biome's pool

### Random Events
- [ ] **Random event screen** — big image + lore text + 2-3 choices (or auto-reward). Fully visual.
- [ ] **Event node thumbnail** — show small image on map for event nodes

---

## LOOP 3 — LONG-TERM RETENTION

These drive daily/weekly return engagement.

### Daily Systems
- [ ] **Daily login calendar** — 30-day streak display, milestone rewards at day 7 (80 gems + 1 ticket), day 14 (150 gems + 2 tickets), day 30 (400 gems). Backend: `claimDailyLogin()` already implemented in `metaProgression.ts`.
- [ ] **Daily seed competitive** — fixed seed per day, everyone plays same map layout. 1 official attempt per day. Score posted to leaderboard.
- [ ] **Daily seed backend** — `GET /api/runs/daily-seed` returns today's seed; `POST /api/runs/daily-seed/submit` submits score

### Profile / Progression
- [ ] **XP Progression screen** — show XP bar, current level, next unlock, total runs stats
- [ ] **Arsenal / unlock screen** — show all weapons and companions; grayed if locked; gem cost to unlock; unlock flow
- [ ] **Gems and coins display** — visible at all times somewhere in game UI header
- [ ] **Referral → gems** — +150 gems per referral; referral count visible in profile screen

### Social / Share
- [ ] **Telegram share card** — detect `window.Telegram?.WebApp`; use `shareUrl()` instead of Twitter share for in-Telegram sharing. Auto-generate end-of-run card (score + zone + artifacts + "Beat my score" CTA)
- [ ] **Telegram share card image** — auto-generated canvas card: character portrait + score + zone reached + artifact icons
- [ ] **Weekly leaderboard** — weekly reset, top 10 get gem rewards (50/30/20 gems)

### Leaderboard
- [ ] **Leaderboard** — move leaderboard to bottom of game page (below main game frame). Keep local leaderboard for now.
- [ ] **Friend leaderboard** — global + social graph leaderboard (Telegram contacts who play)

---

## GAME SYSTEMS (technical)

These are architectural systems that enable the above features.

- [ ] **Weapon system** (`weapons.ts`) — 6 archetypes × 3 variants × 4 rarities = 72 weapons total. Wire passives and specials into combat resolve.
- [ ] **Mana system** — track `player.mana`, `player.maxMana`. Gain mana from die placement or rest. Spend on weapon specials and companion actives.
- [ ] **Monster dialogue system** — sound/text reaction categories by monster type/name. Visual bark on enemy portrait.
- [ ] **KKM gated by unlock** — check `character_kkm` unlock before allowing KKM selection. Currently always available.
- [ ] **Server-side score verification** — basic anti-cheat: validate score math on submission
- [ ] **Mobile safe-area** — Telegram in-app browser bottom bar overlap. Use env(safe-area-inset-bottom).
- [ ] **Cursor/wallet connect removal** — remove wallet connect button from game UI entirely
- [ ] **Zone 4+ scaling** — endless mode infinite scaling past zone 4. `waveGrowthPerStage` already in config, just needs cap removed.

---

## ADMIN INTERFACE

- [ ] **Reorganize tabs** — group into Core / Content / Tools sections with visual separators
- [ ] **Mini-tutorial per tab** — collapsible "ℹ️ How to use" box at top of each tab
- [ ] **Game Logic change log** — list of parameter changes with timestamp + before/after value. Persisted in localStorage key `jungle_kabal_changelog_v1`
- [ ] **Save/Load profiles for Game Logic** — store named profiles (e.g., "Easy Mode", "Balanced", "Hard") in localStorage key `jungle_kabal_gl_profiles_v1`
- [ ] **Balance calculator** — given enemy HP scale and player avg damage per turn, estimate turns to kill avg enemy at each zone
- [ ] **Multiple backgrounds per biome** — `config.visuals.biomeBackgrounds` becomes array per biome: `{ jungle: string[], ruins: string[], ... }` — show up to 4 slots per biome in admin
- [ ] **Deploy tab** — manage Vercel deployment from admin. Show last git commit info. Changelog/release notes editor.
- [ ] **Asset roadmap tab** — show asset status grid from ASSET_ROADMAP.md. Admin can mark assets as done. Summary stats at top.
- [ ] **2-click asset upload** — drag & drop or click-to-browse, auto-saves on select. No extra Save button.
- [ ] **Delete button on assets** — X button per asset in grid to remove it
- [ ] **Avatars tab Nomade Ka** — add Nomade Ka character section to avatars tab
- [ ] **Characters tab with emotion images** — show character images per emotion (happy/sad/focus/scared/excited) with visual preview

---

## SOCIAL / META

- [ ] **Telegram share card native** — use Telegram WebApp shareUrl API
- [ ] **Referral system** — unique referral link per user. Track referrals on backend. Award 150 gems on referral activation.
- [ ] **Daily competitive seed** — same map for all players each day
- [ ] **Weekly leaderboard with gem rewards** — top 3 weekly winners get gems

---

## KNOWN BUGS (open)

- [ ] Companion Croak missing achievementRequired — gem-only unlock path needed
- [ ] KKM character not gated by character_kkm unlock — always available
- [ ] Weapon system imported but zero usage in game code
- [ ] Companion selection screen missing before run start
- [ ] Echo dice face (value 5) defined but behavior unclear — need to spec exact effect
- [ ] `hasCurse` flag set on enemies but never read — dead code, either implement or remove
- [ ] Zone scaling caps at zone 4 — endless mode needs infinite scaling
- [ ] Map events and shop costs hardcoded — not admin-tunable
- [ ] Map doesn't visually refresh after combat (node not marked visited)
- [ ] No shop node guaranteed on map — player can miss shop entirely
- [ ] No boss node at end of zone — zone structure is random
- [ ] Wallet connect button still visible — needs removal
- [ ] Post-combat loot choice missing (Max HP / Mana / Gold)
- [ ] No biome system — all zones use same background
- [ ] Leaderboard still at top of page — move to bottom

---

## PRIORITY MATRIX

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Lane bonus fix (botRowDiceCount coins) | Small | Core loop |
| P0 | Badge charge ennemi visual | Small | Polish |
| P0 | Map visual refresh after combat | Small | UX bug |
| P0 | Shop guaranteed per zone | Medium | Game balance |
| P1 | Companion equip screen | Medium | Retention |
| P1 | Pre-run screen | Medium | Retention |
| P1 | Post-combat loot popup | Medium | Engagement |
| P1 | Biome system | Large | Longevity |
| P1 | Daily login calendar UI | Small | Daily retention |
| P2 | Weapon system integration | Large | Depth |
| P2 | Nomade Ka character | Medium | Content |
| P2 | Telegram share card | Small | Viral |
| P2 | XP/progression screen | Medium | Meta |
| P3 | Daily competitive seed | Large | Competitive |
| P3 | Weekly leaderboard | Medium | Social |
| P3 | Referral system | Large | Growth |
