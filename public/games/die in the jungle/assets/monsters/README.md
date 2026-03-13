# Die in the Jungle — Monster Assets

Use this folder to store monster images locally in the repo.

## Tiers

- `mob/` → low-threat enemies (common fights)
- `champion/` → standard/high-threat enemies (the old "normal" tier)
- `boss/` → bosses

## Elite convention

Any monster from these folders can become elite in-game.
The game now displays elite stars based on zone progression:

- Zone 1-2: `⭐` elite
- Zone 3-4: `⭐⭐` elite
- Zone 5+: `⭐⭐⭐` elite

You do **not** need separate elite image files unless you want unique art.
Elite state is currently represented by name stars and combat scaling.

## Recommended filename format

Use kebab-case and include the tier intent:

- `mob_jungle-scout.png`
- `champion_stone-warden.png`
- `boss_ka-devourer.png`

## PostImage vs local assets

For long-term stability, prefer **local repo assets** over hotlinked URLs.

1. Save your image from PostImage.
2. Place it into the appropriate folder above.
3. Reference it in code as a local path, e.g.:
   - `/games/die in the jungle/assets/monsters/mob/mob_jungle-scout.png`

This avoids broken links and makes deployments deterministic.
