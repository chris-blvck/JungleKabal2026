// sound.ts — Die in the Jungle · Master Sound Asset Registry
// All 100 sounds translated to English and catalogued by category.
// Integrate with Web Audio API or Howler.js when assets are ready.

export type SoundCategory = 'sfx' | 'ambient' | 'music' | 'ui' | 'voice';

export interface SoundDef {
  id: string;
  category: SoundCategory;
  label: string;
  description: string;
  variants: number;
  durationMs: number; // approximate
  loop?: boolean;
  notes?: string;
}

// ── Combat — Player Actions (9 sounds) ──────────────────────────────────────
const COMBAT_PLAYER: SoundDef[] = [
  {
    id: 'dice_roll_a',
    category: 'sfx',
    label: 'Dice Roll A',
    description: 'Standard dice roll — 3 dice bouncing.',
    variants: 3,
    durationMs: 300,
  },
  {
    id: 'dice_roll_b_reroll',
    category: 'sfx',
    label: 'Dice Roll B (Reroll)',
    description: 'Frantic reroll — faster and lower pitch.',
    variants: 2,
    durationMs: 250,
  },
  {
    id: 'dice_place_attack',
    category: 'sfx',
    label: 'Dice Place — Attack',
    description: 'Die placed in attack slot — sharp dry click.',
    variants: 3,
    durationMs: 200,
  },
  {
    id: 'dice_place_heal',
    category: 'sfx',
    label: 'Dice Place — Heal',
    description: 'Die placed in heal slot — soft organic sound.',
    variants: 3,
    durationMs: 200,
  },
  {
    id: 'dice_place_shield',
    category: 'sfx',
    label: 'Dice Place — Shield',
    description: 'Die placed in shield slot — dull metallic sound.',
    variants: 3,
    durationMs: 200,
  },
  {
    id: 'dice_cooldown',
    category: 'sfx',
    label: 'Dice Cooldown',
    description: 'Die entering cooldown — dull tick + fade.',
    variants: 1,
    durationMs: 300,
  },
  {
    id: 'cooldown_reset',
    category: 'sfx',
    label: 'Cooldown Reset',
    description: 'All cooldowns reset — liberating swoosh.',
    variants: 1,
    durationMs: 500,
  },
  {
    id: 'combo_bonus',
    category: 'sfx',
    label: 'Combo Bonus',
    description: '3 attack dice in one turn — energetic stinger.',
    variants: 1,
    durationMs: 400,
  },
  {
    id: 'grid_saturation',
    category: 'sfx',
    label: 'Grid Saturation',
    description: 'Entire grid full — tension/short explosion.',
    variants: 1,
    durationMs: 400,
  },
];

// ── Combat — Resolution (11 sounds) ─────────────────────────────────────────
const COMBAT_RESOLUTION: SoundDef[] = [
  {
    id: 'attack_hit_light',
    category: 'sfx',
    label: 'Attack Hit — Light',
    description: 'Light blade hit (1–3 dmg) — dry snap.',
    variants: 4,
    durationMs: 200,
  },
  {
    id: 'attack_hit_medium',
    category: 'sfx',
    label: 'Attack Hit — Medium',
    description: 'Medium hit (4–8 dmg) — dull impact + resonance.',
    variants: 4,
    durationMs: 250,
  },
  {
    id: 'attack_hit_heavy',
    category: 'sfx',
    label: 'Attack Hit — Heavy',
    description: 'Heavy hit (9+ dmg) — deep impact + light distortion.',
    variants: 3,
    durationMs: 350,
  },
  {
    id: 'overkill',
    category: 'sfx',
    label: 'Overkill',
    description: 'Massive excess damage — impact + jungle echo.',
    variants: 2,
    durationMs: 500,
  },
  {
    id: 'heal_apply',
    category: 'sfx',
    label: 'Heal Apply',
    description: 'Healing received — warm organic sound, breath + shimmer.',
    variants: 3,
    durationMs: 400,
  },
  {
    id: 'shield_gain',
    category: 'sfx',
    label: 'Shield Gain',
    description: 'Shield activated — hollow metallic sound + hum.',
    variants: 2,
    durationMs: 400,
  },
  {
    id: 'shield_absorbs_hit',
    category: 'sfx',
    label: 'Shield Absorbs Hit',
    description: 'Damage blocked by shield — clang + creak.',
    variants: 3,
    durationMs: 300,
  },
  {
    id: 'shield_break',
    category: 'sfx',
    label: 'Shield Break',
    description: 'Shield reaches zero — crystalline shatter + deep note.',
    variants: 1,
    durationMs: 500,
  },
  {
    id: 'player_hit',
    category: 'sfx',
    label: 'Player Hit',
    description: 'Player takes damage — short grunt + physical impact.',
    variants: 3,
    durationMs: 300,
  },
  {
    id: 'near_death_warning',
    category: 'sfx',
    label: 'Near Death Warning',
    description: 'Critical HP — lo-fi distorted heartbeat.',
    variants: 1,
    durationMs: 1200,
    loop: true,
  },
  {
    id: 'top_row_bonus',
    category: 'sfx',
    label: 'Top Row Bonus',
    description: '×3 top row multiplier triggered — powerful stinger.',
    variants: 1,
    durationMs: 400,
  },
];

// ── Weapons — Specials (9 sounds) ────────────────────────────────────────────
const WEAPON_SPECIALS: SoundDef[] = [
  {
    id: 'blade_double_strike',
    category: 'sfx',
    label: 'Blade — Double Strike',
    description: 'Two quick cuts — metallic whoosh-whoosh.',
    variants: 1,
    durationMs: 500,
  },
  {
    id: 'staff_mend',
    category: 'sfx',
    label: 'Staff — Mend',
    description: 'Staff heal — amber wave of sound.',
    variants: 1,
    durationMs: 700,
  },
  {
    id: 'shield_fortress',
    category: 'sfx',
    label: 'Shield — Fortress',
    description: 'Fortress activated — stone wall + lock sound.',
    variants: 1,
    durationMs: 600,
  },
  {
    id: 'totem_reset',
    category: 'sfx',
    label: 'Totem — Reset',
    description: 'All dice freed — tribal sound + released energy.',
    variants: 1,
    durationMs: 800,
  },
  {
    id: 'cannon_overload',
    category: 'sfx',
    label: 'Cannon — Overload',
    description: 'Top row ×5 — charge up + explosion + canyon echo.',
    variants: 1,
    durationMs: 1000,
  },
  {
    id: 'fang_inject',
    category: 'sfx',
    label: 'Fang — Inject',
    description: 'Poison injected — hiss + acid droplets.',
    variants: 1,
    durationMs: 600,
  },
  {
    id: 'fang_dot_tick',
    category: 'sfx',
    label: 'Fang — DoT Tick',
    description: 'Poison damage per turn — small acid hiss.',
    variants: 2,
    durationMs: 200,
  },
  {
    id: 'legendary_passive_proc',
    category: 'sfx',
    label: 'Legendary Passive Proc',
    description: 'Legendary passive triggered — rare distinctive sound.',
    variants: 1,
    durationMs: 500,
  },
  {
    id: 'weapon_equip',
    category: 'sfx',
    label: 'Weapon Equip',
    description: 'Weapon picked up/equipped — metal + confirmation.',
    variants: 2,
    durationMs: 400,
  },
];

// ── Enemies (12 sounds) ──────────────────────────────────────────────────────
const ENEMY_SOUNDS: SoundDef[] = [
  {
    id: 'enemy_appear',
    category: 'sfx',
    label: 'Enemy Appear',
    description: 'Enemy enters the scene — jungle cry or growl.',
    variants: 1,
    durationMs: 600,
    notes: 'Ideally one unique sound per enemy.',
  },
  {
    id: 'enemy_attack_trigger',
    category: 'sfx',
    label: 'Enemy Attack Trigger',
    description: 'Attack intent activated — imminent threat sound.',
    variants: 3,
    durationMs: 400,
  },
  {
    id: 'enemy_charge',
    category: 'sfx',
    label: 'Enemy Charge',
    description: 'Charge intent (preparing big damage) — rising rumble.',
    variants: 2,
    durationMs: 600,
  },
  {
    id: 'enemy_shield_up',
    category: 'sfx',
    label: 'Enemy Shield Up',
    description: 'Enemy shields — organic barrier sound.',
    variants: 2,
    durationMs: 400,
  },
  {
    id: 'enemy_heal',
    category: 'sfx',
    label: 'Enemy Heal',
    description: 'Enemy regenerates — unsettling soft sound.',
    variants: 2,
    durationMs: 400,
  },
  {
    id: 'enemy_curse_cast',
    category: 'sfx',
    label: 'Enemy Curse Cast',
    description: 'Curse cast — dark magic + wind sound.',
    variants: 1,
    durationMs: 700,
  },
  {
    id: 'enemy_death_mob',
    category: 'sfx',
    label: 'Enemy Death — Mob',
    description: 'Standard mob dies — cry + fall.',
    variants: 3,
    durationMs: 500,
  },
  {
    id: 'enemy_death_elite',
    category: 'sfx',
    label: 'Enemy Death — Elite',
    description: 'Elite dies — more dramatic + echo.',
    variants: 2,
    durationMs: 700,
  },
  {
    id: 'enemy_death_boss',
    category: 'sfx',
    label: 'Enemy Death — Boss',
    description: 'Boss dies — massive sound + epic descend.',
    variants: 1,
    durationMs: 1500,
  },
  {
    id: 'companion_gecko_sfx',
    category: 'sfx',
    label: 'Gecko Companion SFX',
    description: 'Hypnotic gecko companion — psychedelic shimmer.',
    variants: 1,
    durationMs: 500,
  },
  {
    id: 'companion_croak_sfx',
    category: 'sfx',
    label: 'Croak Companion SFX',
    description: 'Toad companion — bass croak.',
    variants: 1,
    durationMs: 500,
  },
  {
    id: 'companion_oeil_sfx',
    category: 'sfx',
    label: 'Eye Companion SFX',
    description: 'Eye spider companion — chitin clicking.',
    variants: 1,
    durationMs: 500,
  },
];

// ── Score & Rewards (10 sounds) ──────────────────────────────────────────────
const SCORE_REWARD_SOUNDS: SoundDef[] = [
  { id: 'score_pop_small', category: 'sfx', label: 'Score Pop — Small', description: 'Small score gain — light pop.', variants: 2, durationMs: 150 },
  { id: 'score_pop_big', category: 'sfx', label: 'Score Pop — Big', description: 'Overkill/one-shot bonus — pop + shimmer.', variants: 2, durationMs: 250 },
  { id: 'one_shot_bonus', category: 'sfx', label: 'One Shot Bonus', description: 'Enemy killed in one turn — triumphant stinger.', variants: 1, durationMs: 500 },
  { id: 'perfect_fight', category: 'sfx', label: 'Perfect Fight', description: 'Fight with no damage taken — short clean fanfare.', variants: 1, durationMs: 700 },
  { id: 'no_hit_streak', category: 'sfx', label: 'No-Hit Streak', description: '3 turns with no damage — rising momentum sound.', variants: 1, durationMs: 500 },
  { id: 'coin_gain', category: 'sfx', label: 'Coin Gain', description: 'Coins collected — fast metallic jingle.', variants: 3, durationMs: 200 },
  { id: 'gem_gain', category: 'sfx', label: 'Gem Gain', description: 'Gem received — crystalline rare sound + shimmer.', variants: 2, durationMs: 500 },
  { id: 'artifact_receive', category: 'sfx', label: 'Artifact Receive', description: 'Artifact collected — mysterious + resonant.', variants: 2, durationMs: 800 },
  { id: 'artifact_gold_drop', category: 'sfx', label: 'Artifact Gold Drop', description: 'Gold artifact — brighter and warmer than common.', variants: 1, durationMs: 800 },
  { id: 'artifact_chrome_drop', category: 'sfx', label: 'Artifact Chrome Drop', description: 'Legendary artifact — rare and massive sound.', variants: 1, durationMs: 1200 },
];

// ── Map & Navigation (9 sounds) ──────────────────────────────────────────────
const MAP_SOUNDS: SoundDef[] = [
  { id: 'map_reveal', category: 'sfx', label: 'Map Reveal', description: 'Next node revealed — mist lifting.', variants: 1, durationMs: 600 },
  { id: 'node_select', category: 'sfx', label: 'Node Select', description: 'Player selects a node — soft confirmation.', variants: 2, durationMs: 300 },
  { id: 'node_combat_mob', category: 'sfx', label: 'Node — Combat Mob', description: 'Entering mob fight — light tension sound.', variants: 1, durationMs: 500 },
  { id: 'node_elite_enter', category: 'sfx', label: 'Node — Elite Enter', description: 'Entering elite fight — deeper + warning sound.', variants: 1, durationMs: 700 },
  { id: 'node_boss_enter', category: 'sfx', label: 'Node — Boss Enter', description: 'Entering boss fight — dramatic heavy sound.', variants: 1, durationMs: 1500 },
  { id: 'node_shop_enter', category: 'sfx', label: 'Node — Shop Enter', description: 'Entering Le Passeur shop — mysterious + welcoming.', variants: 1, durationMs: 1000 },
  { id: 'node_event_enter', category: 'sfx', label: 'Node — Event ❓', description: 'Random event — mystery + curiosity sound.', variants: 1, durationMs: 700 },
  { id: 'node_rest_enter', category: 'sfx', label: 'Node — Rest Enter', description: 'Rest camp — campfire + calm jungle.', variants: 1, durationMs: 1000 },
  { id: 'zone_complete', category: 'sfx', label: 'Zone Complete', description: 'Zone finished — short fanfare + transition.', variants: 1, durationMs: 1500 },
];

// ── Shop — Le Passeur (4 sounds) ─────────────────────────────────────────────
const SHOP_SOUNDS: SoundDef[] = [
  { id: 'shop_open', category: 'sfx', label: 'Shop Open', description: 'Shop UI opened — coin pouch + metal.', variants: 1, durationMs: 500 },
  { id: 'item_buy', category: 'sfx', label: 'Item Buy', description: 'Purchase complete — satisfying kaching.', variants: 2, durationMs: 400 },
  { id: 'cant_afford', category: 'sfx', label: "Can't Afford", description: 'Not enough coins — soft rejection sound.', variants: 2, durationMs: 300 },
  { id: 'shop_reroll', category: 'sfx', label: 'Shop Reroll', description: 'Inventory rerolled — shuffle + new draw.', variants: 1, durationMs: 600 },
];

// ── UI & System (12 sounds) ───────────────────────────────────────────────────
const UI_SOUNDS: SoundDef[] = [
  { id: 'button_tap', category: 'ui', label: 'Button Tap', description: 'Generic button tap — light click.', variants: 2, durationMs: 100 },
  { id: 'confirm', category: 'ui', label: 'Confirm', description: 'Action confirmed — clear positive sound.', variants: 2, durationMs: 200 },
  { id: 'cancel_back', category: 'ui', label: 'Cancel / Back', description: 'Cancel/back — neutral soft sound.', variants: 1, durationMs: 200 },
  { id: 'screen_transition', category: 'ui', label: 'Screen Transition', description: 'Screen change — short lateral whoosh.', variants: 2, durationMs: 300 },
  { id: 'popup_appear', category: 'ui', label: 'Popup Appear', description: 'Panel or popup opens — surface sound.', variants: 2, durationMs: 200 },
  { id: 'character_select', category: 'ui', label: 'Character Select', description: 'Character selection confirmed — epic validation sound.', variants: 1, durationMs: 600 },
  { id: 'daily_seed_unlock', category: 'ui', label: 'Daily Seed Unlock', description: 'Daily seed available — door opening sound.', variants: 1, durationMs: 800 },
  { id: 'leaderboard_post', category: 'ui', label: 'Leaderboard Post', description: 'Score submitted — validation + network sound.', variants: 1, durationMs: 600 },
  { id: 'weapon_unlock_gems', category: 'ui', label: 'Weapon Unlock (Gems)', description: 'Weapon unlocked with gems — premium unlock sound.', variants: 1, durationMs: 1000 },
  { id: 'run_start', category: 'ui', label: 'Run Start', description: 'Run launched — swoosh + departure impact.', variants: 1, durationMs: 700 },
  { id: 'game_over', category: 'ui', label: 'Game Over', description: "Player dies — dramatic descent + silence.", variants: 1, durationMs: 2000 },
  { id: 'run_summary_screen', category: 'ui', label: 'Run Summary Screen', description: 'Results screen — nostalgic summary sound.', variants: 1, durationMs: 1000 },
];

// ── Ambient — Jungle (6 sounds) ──────────────────────────────────────────────
const AMBIENT_SOUNDS: SoundDef[] = [
  { id: 'ambient_jungle_idle', category: 'ambient', label: 'Jungle Idle Loop', description: 'Base out-of-combat ambiance — insects, distant birds, leaves.', variants: 1, durationMs: 45000, loop: true },
  { id: 'ambient_combat_tension', category: 'ambient', label: 'Combat Tension Loop', description: 'Combat loop — low tribal percussion, ambient tension.', variants: 1, durationMs: 30000, loop: true },
  { id: 'ambient_boss_pre_fight', category: 'ambient', label: 'Boss Pre-Fight Atmosphere', description: 'Before boss — heavy silence + distant rumble.', variants: 1, durationMs: 15000, loop: true },
  { id: 'ambient_shop', category: 'ambient', label: 'Shop Atmosphere', description: 'Le Passeur — muffled jungle + mystery.', variants: 1, durationMs: 30000, loop: true },
  { id: 'ambient_rest_node', category: 'ambient', label: 'Rest Node Atmosphere', description: 'Rest camp — crackling fire + calm jungle night.', variants: 1, durationMs: 30000, loop: true },
  { id: 'ambient_event', category: 'ambient', label: 'Event Atmosphere', description: 'Random event — suspended, strange.', variants: 1, durationMs: 20000, loop: true },
];

// ── Music (8 tracks) ─────────────────────────────────────────────────────────
const MUSIC_TRACKS: SoundDef[] = [
  { id: 'music_main_theme', category: 'music', label: 'Main Theme', description: 'Main title theme — tribal percussion, Ka synth, bass. 60–90s.', variants: 1, durationMs: 75000 },
  { id: 'music_combat_adaptive', category: 'music', label: 'Combat Theme (adaptive)', description: 'Adaptive loop: calm at high enemy HP, intensifies. 2 layers.', variants: 1, durationMs: 60000, loop: true },
  { id: 'music_boss_battle', category: 'music', label: 'Boss Battle Theme', description: 'Boss fight — epic, faster rhythm, drums. Loop.', variants: 1, durationMs: 90000, loop: true },
  { id: 'music_final_boss', category: 'music', label: 'Final Boss Theme (Zone 4+)', description: 'Darker extended boss theme. Loop.', variants: 1, durationMs: 90000, loop: true },
  { id: 'music_shop', category: 'music', label: 'Shop Theme', description: 'Le Passeur — lo-fi tribal mysterious. Loop.', variants: 1, durationMs: 60000, loop: true },
  { id: 'music_victory_sting', category: 'music', label: 'Victory Sting', description: 'Run completed — triumphant short stinger. No loop. 5–8s.', variants: 1, durationMs: 6500 },
  { id: 'music_game_over', category: 'music', label: 'Game Over Theme', description: 'Player death — short melancholic melody. No loop. 8–12s.', variants: 1, durationMs: 10000 },
  { id: 'music_daily_seed', category: 'music', label: 'Daily Seed Theme', description: 'Daily seed identifier — slight variation on main theme. 3s sting.', variants: 1, durationMs: 3000 },
];

// ── Voice / Vox — optional (10 lines) ───────────────────────────────────────
const VOICE_LINES: SoundDef[] = [
  { id: 'voice_passeur_welcome', category: 'voice', label: 'Le Passeur — Welcome', description: '"You\'re bleeding. I have what you need." (raspy whisper)', variants: 5, durationMs: 4000, notes: '5–8 varied lines' },
  { id: 'voice_passeur_purchase', category: 'voice', label: 'Le Passeur — Purchase', description: 'Satisfaction grunt on sale — complicit.', variants: 3, durationMs: 1500 },
  { id: 'voice_passeur_no_money', category: 'voice', label: 'Le Passeur — No Money', description: 'Soft refusal — not condescending.', variants: 2, durationMs: 2000 },
  { id: 'voice_kabalian_combat_start', category: 'voice', label: 'Kabalian — Combat Start', description: 'Short war cry at combat start.', variants: 3, durationMs: 1200 },
  { id: 'voice_kabalian_hit', category: 'voice', label: 'Kabalian — Hit Grunt', description: 'Short grunt when taking a hit.', variants: 5, durationMs: 600 },
  { id: 'voice_kabalian_victory', category: 'voice', label: 'Kabalian — Victory', description: 'Victory shout after kill/boss.', variants: 3, durationMs: 1500 },
  { id: 'voice_kabalian_near_death', category: 'voice', label: 'Kabalian — Near Death', description: 'Exhausted/desperate at critical HP.', variants: 2, durationMs: 2500 },
  { id: 'voice_kkm_combat_start', category: 'voice', label: 'KKM — Combat Start', description: 'KKM tank version — deep rumble, authority.', variants: 3, durationMs: 1200 },
  { id: 'voice_kkm_hit', category: 'voice', label: 'KKM — Hit Grunt', description: 'KKM absorbs the hit — heavy + resistant.', variants: 5, durationMs: 600 },
  { id: 'voice_run_end_narrator', category: 'voice', label: 'Run End Narrator', description: 'Short narrative line at end of run (Ka fragment style).', variants: 8, durationMs: 4000, notes: '8–10 varied lines' },
];

// ── Master registry ──────────────────────────────────────────────────────────
export const ALL_SOUNDS: SoundDef[] = [
  ...COMBAT_PLAYER,
  ...COMBAT_RESOLUTION,
  ...WEAPON_SPECIALS,
  ...ENEMY_SOUNDS,
  ...SCORE_REWARD_SOUNDS,
  ...MAP_SOUNDS,
  ...SHOP_SOUNDS,
  ...UI_SOUNDS,
  ...AMBIENT_SOUNDS,
  ...MUSIC_TRACKS,
  ...VOICE_LINES,
];

export const SOUND_BY_ID = new Map<string, SoundDef>(ALL_SOUNDS.map((s) => [s.id, s]));

// ── Playback stub (wire up Howler.js / Web Audio API here) ───────────────────
export function playSound(id: string, _volume = 1.0): void {
  // TODO: implement with Howler.js
  // const def = SOUND_BY_ID.get(id);
  // if (!def) console.warn(`[sound] Unknown sound: ${id}`);
  // Howl player goes here
}

export function playMusic(id: string, _fadeMs = 500): void {
  // TODO: fade out current music, start new track
}

export function stopAll(): void {
  // TODO: stop all playing sounds
}
