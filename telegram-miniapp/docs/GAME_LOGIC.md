# Game Logic Spec — Die In The Jungle (Scalable)

Ce document sert de contrat logique pour scaler le jeu sans casser l'équilibrage.

## 1. Core loop
1. Character select (Kabalian / KKM).
2. Phase `roll` → lancer les dés.
3. Phase `place` → poser chaque dé dans la grille (avec cooldowns).
4. Phase `resolve` → appliquer les effets joueur puis l'intent ennemi.
5. Si ennemi vaincu:
   - reward (starter artifact au premier combat, puis rewards boss),
   - progression room/zone.
6. Si joueur KO → game over.

## 2. State model (high-level)
- `player`: hp/shield/stats/artefacts/modificateurs.
- `enemy`: hp/shield/intents/modifier/tier.
- `grid`: 3x3 slots de dés.
- `cooldowns`: lock des cases.
- `route`: suite d'ennemis de la zone.
- `run meta`: floor/room/score/streak/runSeed.

## 3. Combat resolution order
1. Resolve grid totals (attack/heal/shield).
2. Apply player output to enemy/player.
3. Resolve enemy intent (attack/charge/shield/heal/curse).
4. Tick or reset cooldowns.
5. Trigger score tags (`overkill`, `one-shot`, `perfect`, no-hit streak).
6. Transition state (`reward`, `roll`, `victory`, `gameover`).

## 4. Content authoring conventions

### Enemy schema
```ts
{
  tier: 'mob' | 'medium' | 'boss',
  name: string,
  hp: number,
  damage: number,
  emoji: string,
  image: string,
  intents: Array<{ type: string; value: number; label: string }>,
  modifierPool: string[]
}
```

### Artifact schema
```ts
{
  id: string,
  name: string,
  rarity: 'common' | 'rare' | 'epic' | 'legendary',
  category: string,
  tags: string[],
  effectText: string,
  apply: (player) => player
}
```

## 5. Scaling rules (recommended)
- Add monsters by tier pool first, then tune intent values.
- Add artefacts with explicit tag taxonomy (`attack`, `shield`, `heal`, `tempo`, etc.).
- One feature = one isolated reducer/helper to keep merges safe.
- Never mutate source pools directly in runtime.

## 6. Anti-regression checklist
- New enemy cannot create unwinnable first zone.
- New artifact cannot soft-lock reroll/roll phases.
- Score multipliers capped and deterministic.
- Reward screen always has exit path (`pick` or `skip`).

## 7. Telegram integrations touchpoints
- On run end: emit payload (`runSeed`, `score`, `floor`, `characterId`) to backend.
- On referral claim: idempotent by `invitedUserId`.
- Keep local fallback if API unreachable (offline resilience).


## 8. Meta loop (MVP)
- Daily missions: `play_run`, `reach_zone_3`, `share_once` (ticket rewards).
- Streak: increment when at least one run is finished per day.
- Tickets: consumed on restart, earned via referral + mission claims.
