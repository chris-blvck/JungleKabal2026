import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ─── Storage Keys (must match game) ──────────────────────────────────────────
const META_KEY = 'jk_meta_progression_v1';
const GAME_KEY = 'jungle_kabal_run_state_v1';
const LB_KEY = 'jungle_kabal_leaderboard_v1';

// ─── All unlock IDs ───────────────────────────────────────────────────────────
const ALL_UNLOCK_IDS = [
  'character_kkm',
  'weapon_slot_1',
  'dice_specials',
  'lane_bonuses',
  'companion_gecko',
  'companion_croak',
  'weapon_slot_2',
  'companion_oeil',
];

const UNLOCK_LABELS = {
  character_kkm: 'KKM Character 🤖',
  weapon_slot_1: 'Weapon Slot 1 ⚔️',
  dice_specials: 'Special Dice Faces ✦',
  lane_bonuses: 'Lane Bonuses 🎯',
  companion_gecko: 'Gecko Companion 🦎',
  companion_croak: 'Croak Companion 🐊',
  weapon_slot_2: 'Weapon Slot 2 ⚔️⚔️',
  companion_oeil: "L'Œil Companion 👁️",
};

const ALL_ACHIEVEMENTS = ['zone1_boss_first', 'zone2_boss_first', 'zone3_boss_first', 'zone4_boss_first'];

// ─── Test Presets ─────────────────────────────────────────────────────────────
const PRESETS = {
  level1: {
    label: 'Fresh Start',
    description: 'No unlocks, no XP. Exactly what a new player sees.',
    emoji: '🌱',
    color: 'emerald',
    meta: { xp: 0, gems: 0, unlockedIds: [], achievements: [], totalRuns: 0, totalKills: 0, bestScore: 0 },
  },
  levelXX: {
    label: 'Everything Unlocked',
    description: 'All companions, both weapon slots, KKM, dice specials, lane bonuses.',
    emoji: '🏆',
    color: 'amber',
    meta: { xp: 5000, gems: 1500, unlockedIds: ALL_UNLOCK_IDS, achievements: ALL_ACHIEVEMENTS, totalRuns: 42, totalKills: 280, bestScore: 18500 },
  },
  midGame: {
    label: 'Mid Game',
    description: 'KKM + dice specials + lane bonuses. No companions yet.',
    emoji: '⚔️',
    color: 'blue',
    meta: { xp: 900, gems: 200, unlockedIds: ['character_kkm', 'weapon_slot_1', 'dice_specials', 'lane_bonuses'], achievements: ['zone1_boss_first', 'zone2_boss_first'], totalRuns: 8, totalKills: 52, bestScore: 4200 },
  },
  companions: {
    label: 'Companion Ready',
    description: 'All companions unlocked but no weapon slots.',
    emoji: '🦎',
    color: 'violet',
    meta: { xp: 2000, gems: 600, unlockedIds: ['character_kkm', 'dice_specials', 'lane_bonuses', 'companion_gecko', 'companion_croak', 'companion_oeil'], achievements: ALL_ACHIEVEMENTS, totalRuns: 20, totalKills: 140, bestScore: 9000 },
  },
};

// ─── Enemy data (mirrored from game for display) ──────────────────────────────
const ENEMY_TIERS = {
  mob: { label: 'Mob', color: 'zinc', desc: 'Zone 1 fodder · low HP · basic intents' },
  medium: { label: 'Medium', color: 'blue', desc: 'Zone 2-3 · more HP · dangerous modifiers' },
  champions: { label: 'Champion', color: 'amber', desc: 'Zone 3+ · elites · complex intent patterns' },
  boss: { label: 'Boss', color: 'rose', desc: 'Zone end · high HP · boss mechanics' },
};

// ─── Asset Schema ─────────────────────────────────────────────────────────────
const ASSET_SCHEMA = {
  monsters: ['mob', 'champions', 'boss'],
  backgrounds: ['jungle', 'ruins', 'temple'],
  zones: ['general'],
  events: ['general'],
};

const TAB_GROUPS = [
  {
    label: '⚡ Core',
    description: 'Tester le jeu, ajuster la difficulté, tricher',
    tabs: [
      { id: 'testgame', label: '🎮 Test & Presets', help: 'Lance des presets de test rapides. Applique un preset puis ouvre /diejungle. Chaque preset configure le méta-état (XP, gems, unlocks) au lancement.' },
      { id: 'cheatmode', label: '🔧 Cheat Mode', help: 'Injecte directement HP, coins, XP, ou force une phase de jeu en cours. Utilise uniquement en dev — aucun effet sur les vrais runs joueurs.' },
      { id: 'gamelogic', label: '⚙️ Game Logic', help: 'Paramètres numériques du moteur de jeu : multiplicateurs de dégâts, scaling par zone, economy. Chaque param a une plage safe indiquée. Sauvegarde puis recharge le jeu.' },
    ],
  },
  {
    label: '🎨 Contenu',
    description: 'Enemis, artefacts, dés, méta-progression',
    tabs: [
      { id: 'metaeditor', label: '🧬 Meta Editor', help: 'Modifie directement le méta-JSON du joueur stocké en localStorage : XP, gems, unlocks débloqués. Utile pour simuler des états avancés sans jouer.' },
      { id: 'enemies', label: '👾 Enemies', help: 'Catalogue des ennemis existants (lecture seule). Voir leurs stats, tiers, modificateurs. Ajouter des ennemis custom via le JSON en bas.' },
      { id: 'artifacts', label: '📦 Artifacts', help: 'Liste des artefacts/reliques du pool. Ajouter des artefacts custom avec image, effets, rareté. Ils entrent dans le pool de shop et de récompenses boss.' },
      { id: 'dicecosmetics', label: '🎲 Dice Cosmetics', help: 'Coller des URLs d\'images pour chaque face de dé (1-6) par type (attack/shield/heal) et par personnage. Les dés custom remplacent les carrés de couleur par défaut.' },
    ],
  },
  {
    label: '🖼️ Visuels',
    description: 'Assets, images, avatars, backgrounds',
    tabs: [
      { id: 'assets', label: '🖼️ Bibliothèque Assets', help: 'Upload des images par catégorie (monsters, backgrounds, events…). Les assets uploadés sont stockés sur le serveur et accessibles par URL. Ajoute des tags pour retrouver facilement.' },
      { id: 'avatars', label: '🎭 Avatars & Visuals', help: 'URLs des avatars par personnage, images de boutons (roll/resolve/restart), backgrounds par biome. Coller une URL et Sauvegarder. Prend effet immédiatement en jeu.' },
    ],
  },
  {
    label: '🔬 Ops',
    description: 'Narrative, roadmap, backlog, config avancée',
    tabs: [
      { id: 'narrative', label: '📖 Narrative', help: 'Dialogues et textes de lore par personnage. Utilisés dans les écrans d\'intro de run et les bulles de dialogue en jeu.' },
      { id: 'advanced', label: '🔬 Advanced', help: 'Config JSON brute. Réservé aux devs. Modifier directement le payload envoyé au serveur. Attention : une erreur JSON peut casser la config.' },
      { id: 'roadmap', label: '🗺️ Roadmap', help: 'Vue d\'ensemble des features done, en cours, et backlog. Mise à jour à chaque sprint. Référence pour l\'équipe.' },
      { id: 'sprints', label: '⚡ Sprint Tracker', help: 'Master list des sprints planifiés avec leurs features condensées. Vue rapide de la roadmap d\'exécution.' },
      { id: 'contentqueue', label: '📅 Content Queue', help: 'File de contenu planifié : nouvelles features, assets à livrer, events à créer. Priorisable et assignable.' },
    ],
  },
];
// Flat list for backward compat
const TABS = TAB_GROUPS.flatMap(g => g.tabs);

const GAME_LOGIC_GROUPS = {
  difficulty: {
    label: 'Difficulty',
    keys: ['enemyHpScale', 'enemyDamageScale', 'waveGrowthPerStage', 'bossHpMultiplier', 'bossDamageMultiplier', 'eventIntensityScale'],
    descriptions: {
      enemyHpScale: 'Multiplier on all enemy HP (default 1)',
      enemyDamageScale: 'Multiplier on all enemy damage (default 1)',
      waveGrowthPerStage: 'Extra HP/DMG per zone floor (default 0.12)',
      bossHpMultiplier: 'Boss HP multiplier vs base (default 2.4)',
      bossDamageMultiplier: 'Boss damage multiplier vs base (default 1.8)',
      eventIntensityScale: 'How intense random events are (default 1)',
    },
  },
  combat: {
    label: 'Combat Mechanics',
    keys: ['critChance', 'critMultiplier', 'dodgeChance', 'lifeSteal', 'shieldDecayPerTurn', 'comboWindowTurns', 'reviveHpRatio'],
    descriptions: {
      critChance: 'Probability of crit (default 0.12)',
      critMultiplier: 'Crit damage multiplier (default 1.75)',
      dodgeChance: 'Probability to dodge hit (default 0.08)',
      lifeSteal: 'HP gained per attack (default 0.05)',
      shieldDecayPerTurn: 'Shield lost per turn (default 0.15)',
      comboWindowTurns: 'Turns for combo detection (default 2)',
      reviveHpRatio: 'HP ratio on revive (default 0.35)',
    },
  },
  economy: {
    label: 'Economy',
    keys: ['scoreScale', 'dropRateMultiplier', 'rerollCostScore', 'randomEventChance'],
    descriptions: {
      scoreScale: 'Multiplier on all score gain (default 1)',
      dropRateMultiplier: 'Artifact/item drop rate (default 1)',
      rerollCostScore: 'Score cost per reroll (default 20)',
      randomEventChance: 'Chance of random event on node (default 0.2)',
    },
  },
};

const EMPTY_DICE_COSMETICS_CHAR = () => ({
  attack: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
  shield: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
  heal:   { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
});

const EMPTY_CONFIG = {
  assets: { monsters: { mob: [], champions: [], boss: [] }, backgrounds: { jungle: [], ruins: [], temple: [] }, zones: { general: [] }, events: { general: [] } },
  gameLogic: { enemyHpScale: 1, enemyDamageScale: 1, scoreScale: 1, randomEventChance: 0.2, waveGrowthPerStage: 0.12, bossHpMultiplier: 2.4, bossDamageMultiplier: 1.8, critChance: 0.12, critMultiplier: 1.75, dodgeChance: 0.08, lifeSteal: 0.05, shieldDecayPerTurn: 0.15, comboWindowTurns: 2, rerollCostScore: 20, reviveHpRatio: 0.35, eventIntensityScale: 1, dropRateMultiplier: 1 },
  randomEvents: [],
  visuals: {
    backgroundUrl: '',
    logoUrl: '',
    storyFragmentImageUrl: '',
    buttonImages: { roll: '', reroll: '', resolve: '', restart: '' },
    biomeBackgrounds: { jungle: '', ruins: '', temple: '', abyss: '', void: '' },
  },
  characters: { playable: {}, emotionUrls: {} },
  narrative: { kabalian: [], kkm: [] },
  adminBacklog: [],
  monsters: { traitsCatalog: [], customMonsters: [] },
  artifacts: { customArtifacts: [] },
  assetsMeta: {},
  contentQueue: [],
  diceCosmetics: {
    kabalian: EMPTY_DICE_COSMETICS_CHAR(),
    kkm: EMPTY_DICE_COSMETICS_CHAR(),
    krex: EMPTY_DICE_COSMETICS_CHAR(),
  },
};

// ─── Roadmap ──────────────────────────────────────────────────────────────────
const ROADMAP = [
  {
    section: '✅ Done',
    color: 'emerald',
    items: [
      { label: 'Core roguelite combat loop (roll → place → resolve)', done: true },
      { label: 'Zone-based branching map with fog of war', done: true },
      { label: 'Shop, event, rest nodes on map', done: true },
      { label: 'Meta progression system (XP + gems + unlock tree, 20 levels)', done: true },
      { label: 'Companion system (Gecko 🦎, Croak 🐊, L\'Œil 👁️)', done: true },
      { label: 'Companion active ability button in combat UI', done: true },
      { label: 'Special dice faces: Pierce, Echo, Nurture, Fortress', done: true },
      { label: 'SURGE mechanic (3 same type → bonus)', done: true },
      { label: 'Lane conditionals (top heal → reset CD, bot → coins)', done: true },
      { label: 'Enemy intents + modifiers (venom, thorns, regen, berserk, stoneSkin, swift)', done: true },
      { label: '3 playable characters: Kabalian ⚔️, KKM 🤖, K-REX 🦖', done: true },
      { label: 'K-REX mechanics: STOMP passive + TREMOR ability', done: true },
      { label: 'Golden Kabal Dice: 10% per combat, player chooses type (attack/shield/heal), value 6', done: true },
      { label: 'Score system + leaderboard (local)', done: true },
      { label: 'Telegram SDK integration (init, user, expand)', done: true },
      { label: 'Admin panel: test presets, meta editor, game logic, enemies viewer, cheat mode', done: true },
      { label: 'Admin panel: 🎲 Dice Cosmetics tab (per-character dice image sets)', done: true },
      { label: 'Admin panel: ⚙️ Game Logic parameter map (visual guide, safe ranges)', done: true },
      { label: 'Backend API (config, assets, runs, referrals, leaderboard)', done: true },
      { label: 'Fortress shield persistence across turns', done: true },
      { label: 'Weapons system: 6 archetypes, passives + specials, Arsenal UI, pre-run equip', done: true },
      { label: 'Relic system: slots, passive effects, pre-run pick', done: true },
      { label: 'Pre-run flow: character → weapon → relic → confirm', done: true },
      { label: 'XP panel, score in header, coins display', done: true },
      { label: 'Stat caps (ATK, shield, heal max)', done: true },
      { label: 'Standalone export: diejungle/ sub-project for diejungle.fun', done: true },
      { label: 'Fix: map navigation blocked during combat (combatMapView guard)', done: true },
    ],
  },
  {
    section: '🔧 In Progress / Next Sprint',
    color: 'amber',
    items: [
      { label: 'Map doesn\'t refresh visually after combat — node not marked visited', done: false },
      { label: 'Shop node guaranteed every zone + BOSS node at end of zone', done: false },
      { label: 'Post-combat loot popup: choose Max HP +2 / Relic / +1 Gold (auto-dismiss 3s)', done: false },
      { label: 'Free artifact/relic after each Boss kill (3-choice popup)', done: false },
      { label: 'Random events: big image + lore text + 2-3 choices, shown on map node', done: false },
      { label: 'Biome system: each zone = biome (jungle/ruins/temple/void) with own background', done: false },
      { label: 'Biome changes dynamically after each boss kill', done: false },
      { label: 'Profile/unlock screen: spend gems, view unlock tree visually', done: false },
      { label: 'Telegram Mini App synced to diejungle/ codebase', done: false },
      { label: 'Telegram Mini App hosted on diejungle.fun', done: false },
      { label: 'K-REX: replace placeholder avatar with real K-REX character art', done: false },
      { label: 'Golden Kabal Dice: create dedicated golden dice skin (6 faces, 3 types)', done: false },
    ],
  },
  {
    section: '🎨 Assets Needed — Production Blockers',
    color: 'rose',
    items: [
      { label: '🗺️ MAP: custom background image for the map screen (zone overview art)', done: false },
      { label: '🗺️ MAP: node icons (custom art for mob / elite / boss / shop / event / rest)', done: false },
      { label: '🗺️ MAP: fog-of-war texture / overlay for hidden nodes', done: false },
      { label: '🦖 K-REX: character avatar (idle + emotion variants: focus/hurt/victory)', done: false },
      { label: '✨ GOLDEN DICE: 6-face dice skin for each type (attack gold / shield gold / heal gold)', done: false },
      { label: '⚔️ WEAPONS: icon art per weapon archetype (sword, staff, bow, shield, dagger, totem)', done: false },
      { label: '🌿 BIOME: jungle background (deep jungle, night)', done: false },
      { label: '🏛️ BIOME: ruins background (Ka ruins, cracked stone)', done: false },
      { label: '⛩️ BIOME: temple background (dark temple interior)', done: false },
      { label: '🌑 BIOME: abyss background (void, darkness)', done: false },
      { label: '🎭 EVENTS: 5-10 event illustrations (random event node art)', done: false },
      { label: '🛒 SHOP: shopkeeper art update (current placeholder ok for now)', done: false },
    ],
  },
  {
    section: '🎮 Game Design — Confirmed Direction',
    color: 'violet',
    items: [
      { label: 'BIOMES: biome-specific enemy pool (certain enemies only in certain biomes)', done: false },
      { label: 'LOOT: popup must not break combat rhythm — 3 sec tap then auto-dismiss', done: false },
      { label: 'EVENTS: visible on map as special node with image thumbnail', done: false },
      { label: 'MAP: zone history breadcrumbs — show biomes visited and boss kills', done: false },
      { label: 'MANA: resource for special abilities (companions + weapons use mana)', done: false },
      { label: 'Daily seed competitive run + daily score posted in Telegram channel', done: false },
      { label: 'Referral → +150 gems visible in profile (gems as flex currency)', done: false },
      { label: 'KKM unlock properly gated by character_kkm meta flag', done: false },
    ],
  },
  {
    section: '📋 Backlog',
    color: 'zinc',
    items: [
      { label: 'Share card auto-generated end of run (score + zone + artifacts + "Beat my score" CTA)', done: false },
      { label: 'Friend leaderboard (global + social graph)', done: false },
      { label: 'Seasons with limited relic pool and season badges', done: false },
      { label: 'Visual FX polish — hit flash, impact rings, lane-aware emitters', done: false },
      { label: 'Server-side score verification / anti-cheat', done: false },
      { label: 'Mobile safe-area adjustment for Telegram in-app browser', done: false },
      { label: 'Boss zone 4 — full enemy pool', done: false },
      { label: 'More complex enemy intents per zone (charge+curse same turn, conditional heal < 30%)', done: false },
      { label: 'Custom enemies/artifacts from admin merge into hardcoded pools at runtime', done: false },
      { label: 'Telegram miniapp: sync codebase from diejungle/ then deploy', done: false },
    ],
  },
];

// ─── Bugs & Features Tracker ──────────────────────────────────────────────────
const KNOWN_ISSUES = [
  { status: 'fixed', label: 'AngelOpsDashboard import missing in App.jsx — runtime crash', date: '2026-03-15' },
  { status: 'fixed', label: 'Boss zone achievement never tracked (phase === "victory" never true)', date: '2026-03-15' },
  { status: 'fixed', label: 'Fortress shield tracked but never applied on next turn', date: '2026-03-15' },
  { status: 'fixed', label: 'Wallet connect button removed from game UI', date: '2026-03-15' },
  { status: 'fixed', label: 'Weapon system now fully integrated (pre-run equip + combat passives/specials)', date: '2026-03-15' },
  { status: 'fixed', label: 'Companion selection screen added (pre-run flow)', date: '2026-03-15' },
  { status: 'fixed', label: 'Map clickable during combat — player could skip to next node mid-fight', date: '2026-03-15' },
  { status: 'open', label: 'Companion Croak missing achievementRequired — gem-only unlock', date: '2026-03-15' },
  { status: 'open', label: 'KKM character not gated by character_kkm unlock — always available', date: '2026-03-15' },
  { status: 'open', label: 'Echo dice face (value 5) defined but behavior unclear', date: '2026-03-15' },
  { status: 'open', label: 'Curse hasCurse flag set but never read — dead code', date: '2026-03-15' },
  { status: 'open', label: 'Zone scaling caps at zone 4 — endless mode needs infinite scaling', date: '2026-03-15' },
  { status: 'open', label: 'Map events and shop costs hardcoded — not admin-tunable', date: '2026-03-15' },
  { status: 'open', label: 'Map doesn\'t visually refresh after combat (node not marked visited)', date: '2026-03-15' },
  { status: 'open', label: 'No shop node guaranteed on map — player can miss shop entirely', date: '2026-03-15' },
  { status: 'open', label: 'No boss node at end of zone — zone structure is random', date: '2026-03-15' },
  { status: 'open', label: 'No biome system — all zones use same background', date: '2026-03-15' },
  { status: 'open', label: 'K-REX using KKM placeholder avatar — needs real K-REX art', date: '2026-03-15' },
  { status: 'open', label: 'Golden Kabal Dice has no dedicated skin — uses regular dice visuals', date: '2026-03-15' },
  { status: 'open', label: 'No PAUSE button — player cannot pause mid-run (Sprint 2)', date: '2026-03-15' },
  { status: 'open', label: 'No tutorial for first-time players — discovery is fully self-serve (Sprint 4)', date: '2026-03-15' },
  { status: 'open', label: 'No post-run share card — no Twitter/Telegram share flow (Sprint 5)', date: '2026-03-15' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed reading file'));
    reader.readAsDataURL(file);
  });
}

// ─── Sprint Plan ───────────────────────────────────────────────────────────────
const SPRINT_PLAN = [
  {
    id: 'S0',
    label: '✅ Sprint 0 — Foundation',
    status: 'done',
    color: 'emerald',
    items: [
      { done: true,  label: 'Core combat loop (roll → place → resolve)' },
      { done: true,  label: 'Zone map with fog of war, shop/event/rest nodes' },
      { done: true,  label: 'Meta progression: XP + gems + 20-level unlock tree' },
      { done: true,  label: '3 characters: Kabalian, KKM, K-REX' },
      { done: true,  label: 'Companions: Gecko, Croak, L\'Œil' },
      { done: true,  label: 'Weapons: 6 archetypes, pre-run equip, passives + specials' },
      { done: true,  label: 'Relics: slots, passive effects, pre-run pick' },
      { done: true,  label: 'Enemy intents + 6 modifiers (venom, thorns, regen…)' },
      { done: true,  label: 'Admin panel: tabs, presets, meta editor, game logic, enemies' },
      { done: true,  label: 'Backend API: config, assets, runs, referrals, leaderboard' },
      { done: true,  label: 'Biome system: 4 backgrounds (jungle/ruins/temple/abyss)' },
      { done: true,  label: 'Shop: shopkeeper + player character + dialogue bubble' },
      { done: true,  label: 'Enemy details drawer (tap to expand)' },
      { done: true,  label: 'Map blocked during combat (combatMapView guard)' },
      { done: true,  label: 'Admin: tab groups Core/Content/Visuals/Ops + help banners' },
      { done: true,  label: 'Admin: Asset Library with configured URLs visual grid' },
      { done: true,  label: 'Sound system placeholder (sound.ts, 25 keys, no-op)' },
    ],
  },
  {
    id: 'S1',
    label: '🔄 Sprint 1 — Ka Power + Kill Rewards + Lanes',
    status: 'active',
    color: 'amber',
    items: [
      { done: true,  label: 'Ka Power System: fragments (◆◆◆◆), Kabalian=Ka Rage ⚡, KKM=Ka Fortress 🛡️, K-REX=Ka Stomp 🦶' },
      { done: true,  label: 'Kill Rewards: mob=1 reward auto-random (pool pondéré), elite=2/3, boss=4/6 avec skip' },
      { done: true,  label: 'Dynamic Lanes: bonus/malus aléatoires après chaque resolve (20% malus, garantie ATK+/HEAL+)' },
      { done: true,  label: 'Player GAUCHE / Enemy DROITE (swap arena)' },
      { done: true,  label: 'Karnivor rename (Carnivor Plant → Karnivor)' },
    ],
  },
  {
    id: 'S2',
    label: '🟡 Sprint 2 — Game Feel',
    status: 'planned',
    color: 'yellow',
    items: [
      { done: false, label: 'Countdown 7s par tour: barre sous grille, rouge < 3s, skip auto si 0' },
      { done: false, label: 'Dice multiplier preview: badge rouge/bleu/jaune sur slot (valeur × mult)' },
      { done: false, label: 'Haptic: die=light, kill=success, boss=heavy×8/4s, SURGE=rigid×3' },
      { done: false, label: 'ROLL + RESOLVE pulsent et glowent quand c\'est leur tour' },
      { done: false, label: '⏸️ Bouton PAUSE: ouvre overlay pause (continue / quit / settings)' },
      { done: false, label: 'Shield reset entre ennemis, HP ne remonte pas' },
      { done: false, label: 'UI compact: reroll petit, weapons 2 slots petits, free CD petit badge' },
    ],
  },
  {
    id: 'S3',
    label: '🟠 Sprint 3 — Navigation & Settings',
    status: 'planned',
    color: 'orange',
    items: [
      { done: false, label: 'Settings panel: auto-resolve toggle, sound mixer, Leave & Save, Leave no save' },
      { done: false, label: 'Map à gauche de How to Play dans la nav secondaire' },
      { done: false, label: 'Jungle Coin Shop rename (in-run, ephémère)' },
      { done: false, label: 'Gem Store rename (permanent: cosmetics + armes)' },
      { done: false, label: 'Sound: brancher sound.ts, BGM par biome, SFX sur chaque action' },
    ],
  },
  {
    id: 'S4',
    label: '🔵 Sprint 4 — Tutorial',
    status: 'planned',
    color: 'blue',
    items: [
      { done: false, label: 'Tuto premier jeu: mandatory, no cooldown, dés fixés, 5 tooltips séquentiels' },
      { done: false, label: 'Tuto avancé: accessible depuis How to Play (lanes, SURGE, builds, économie)' },
      { done: false, label: 'Objectif du jeu visible en tuto + règles' },
    ],
  },
  {
    id: 'S5',
    label: '🟣 Sprint 5 — Social & Meta',
    status: 'planned',
    color: 'violet',
    items: [
      { done: false, label: 'Share card post-run: canvas (score, titre, zone, artifacts) → Twitter + Telegram Story, +1 gem/24h' },
      { done: false, label: 'Gem Store: cosmetics + armes permanentes (1 gem = 0.1 SOL | $DIE token -65% + burn)' },
      { done: false, label: 'Tokenomics: gems in-game (mob 1%, boss +1 garanti, fin zone +5/10/15, daily top3 50/30/15, referral +50 max×20)' },
      { done: false, label: 'Anti-farm: cap 30 gems/jour, boss gems validés zone 2+, 1 TG ID = 1 wallet, referral plafonné' },
      { done: false, label: 'Bridge MVP → V1: achat SOL direct sur site web → gems API | V2: bridge $DIE Solana→TON (Allbridge)' },
    ],
  },
  {
    id: 'S6',
    label: '⚫ Sprint 6 — Polish & Assets',
    status: 'planned',
    color: 'zinc',
    items: [
      { done: false, label: 'Map visuelle: background custom + node icons custom par type' },
      { done: false, label: 'Die placeholder full-size dans chaque case de grille' },
      { done: false, label: 'K-REX: remplacer placeholder avatar par vraie illustration' },
      { done: false, label: 'Golden Dice: skin dédié pour le Golden Kabal Dice' },
      { done: false, label: 'Biome Void: background dédié (en attente asset)' },
    ],
  },
];

function ensureStructuredAssets(rawAssets = {}) {
  const out = { ...EMPTY_CONFIG.assets };
  Object.entries(ASSET_SCHEMA).forEach(([category, subcats]) => {
    const current = rawAssets?.[category];
    if (Array.isArray(current)) { out[category] = { [subcats[0]]: current }; return; }
    const nested = {};
    subcats.forEach((sub) => { nested[sub] = Array.isArray(current?.[sub]) ? current[sub] : []; });
    out[category] = nested;
  });
  return out;
}

function mergeCharDiceCosmetics(raw) {
  const out = {};
  for (const char of ['kabalian', 'kkm', 'krex']) {
    const base = EMPTY_DICE_COSMETICS_CHAR();
    const src = raw?.[char] || {};
    out[char] = {
      attack: { ...base.attack, ...(src.attack || {}) },
      shield: { ...base.shield, ...(src.shield || {}) },
      heal:   { ...base.heal,   ...(src.heal   || {}) },
    };
  }
  return out;
}

function withDefaults(raw = {}) {
  return {
    ...EMPTY_CONFIG, ...raw,
    assets: ensureStructuredAssets(raw.assets || {}),
    gameLogic: { ...EMPTY_CONFIG.gameLogic, ...(raw.gameLogic || {}) },
    visuals: {
      ...EMPTY_CONFIG.visuals,
      ...(raw.visuals || {}),
      buttonImages: { ...EMPTY_CONFIG.visuals.buttonImages, ...(raw.visuals?.buttonImages || {}) },
      biomeBackgrounds: { ...EMPTY_CONFIG.visuals.biomeBackgrounds, ...(raw.visuals?.biomeBackgrounds || {}) },
    },
    characters: { playable: { ...(raw.characters?.playable || {}) }, emotionUrls: { ...(raw.characters?.emotionUrls || {}) } },
    narrative: { kabalian: Array.isArray(raw.narrative?.kabalian) ? raw.narrative.kabalian : [], kkm: Array.isArray(raw.narrative?.kkm) ? raw.narrative.kkm : [] },
    monsters: { traitsCatalog: Array.isArray(raw.monsters?.traitsCatalog) ? raw.monsters.traitsCatalog : [], customMonsters: Array.isArray(raw.monsters?.customMonsters) ? raw.monsters.customMonsters : [] },
    artifacts: { customArtifacts: Array.isArray(raw.artifacts?.customArtifacts) ? raw.artifacts.customArtifacts : [] },
    adminBacklog: Array.isArray(raw.adminBacklog) ? raw.adminBacklog : [],
    assetsMeta: raw.assetsMeta && typeof raw.assetsMeta === 'object' ? raw.assetsMeta : {},
    contentQueue: Array.isArray(raw.contentQueue) ? raw.contentQueue : [],
    diceCosmetics: mergeCharDiceCosmetics(raw.diceCosmetics),
  };
}

function readLocalMeta() {
  try { const raw = localStorage.getItem(META_KEY); if (!raw) return null; return JSON.parse(raw); } catch { return null; }
}

function readLocalGameState() {
  try { const raw = localStorage.getItem(GAME_KEY); if (!raw) return null; return JSON.parse(raw); } catch { return null; }
}

function JsonEditor({ label, value, onSave, rows = 12 }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [err, setErr] = useState('');
  useEffect(() => setText(JSON.stringify(value, null, 2)), [value]);
  function trySave() {
    try { const parsed = JSON.parse(text); setErr(''); onSave(parsed); }
    catch (e) { setErr(e.message); }
  }
  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-300 font-medium">{label}</div>
      <textarea value={text} onChange={(e) => { setText(e.target.value); setErr(''); }} rows={rows} className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none" />
      {err && <div className="text-xs text-rose-400">❌ {err}</div>}
      <button onClick={trySave} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm font-medium">
        💾 Save {label}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DieInTheJungleAdmin() {
  const [activeTab, setActiveTab] = useState('testgame');
  const [category, setCategory] = useState('monsters');
  const [subcategory, setSubcategory] = useState('mob');
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [localMeta, setLocalMeta] = useState(null);
  const [presetApplied, setPresetApplied] = useState(null);
  const [logicDirty, setLogicDirty] = useState(false);
  // Meta editor state
  const [editMeta, setEditMeta] = useState({ xp: 0, gems: 0, unlockedIds: [], achievements: [] });
  const [metaEditMode, setMetaEditMode] = useState(false);
  // Enemy viewer filter
  const [enemyTierFilter, setEnemyTierFilter] = useState('all');
  // Artifact viewer filter
  const [artifactFilter, setArtifactFilter] = useState('all');
  // Cheat mode
  const [cheatFloor, setCheatFloor] = useState(2);
  const [cheatHp, setCheatHp] = useState(20);
  // Dice cosmetics
  const [diceChar, setDiceChar] = useState('kabalian');
  // Content queue
  const [contentQueue, setContentQueue] = useState(() => {
    try { const raw = localStorage.getItem('jk_content_queue_v1'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  const [cqForm, setCqForm] = useState({ date: '', type: 'Monster', name: '', rarity: 'Common', notes: '' });

  const availableSubcategories = ASSET_SCHEMA[category] || ['general'];

  useEffect(() => {
    if (!availableSubcategories.includes(subcategory)) setSubcategory(availableSubcategories[0]);
  }, [availableSubcategories, subcategory]);

  const assetBucket = useMemo(() => {
    const assets = ensureStructuredAssets(config.assets || {});
    return assets?.[category]?.[subcategory] || [];
  }, [config.assets, category, subcategory]);

  function refreshLocalMeta() {
    const m = readLocalMeta();
    setLocalMeta(m);
    if (m) setEditMeta({ xp: m.xp ?? 0, gems: m.gems ?? 0, unlockedIds: m.unlockedIds ?? [], achievements: m.achievements ?? [] });
  }

  useEffect(() => { refreshLocalMeta(); loadConfig(); }, []);

  async function loadConfig() {
    setLoading(true); setStatus('Loading...');
    try {
      const res = await fetch('/api/miniapp/config');
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Load failed');
      setConfig(withDefaults(payload.config || EMPTY_CONFIG));
      setStatus('✅ Config loaded'); setLogicDirty(false);
    } catch (error) { setStatus(`❌ ${error.message}`); }
    finally { setLoading(false); }
  }

  async function saveConfig(nextConfig) {
    setLoading(true); setStatus('Saving...');
    try {
      const res = await fetch('/api/miniapp/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextConfig) });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Save failed');
      setConfig(withDefaults(payload.config || nextConfig));
      setStatus('✅ Saved'); setLogicDirty(false);
    } catch (error) { setStatus(`❌ ${error.message}`); }
    finally { setLoading(false); }
  }

  async function onUpload(event) {
    const files = Array.from(event.target.files || []).slice(0, 30);
    if (!files.length) return;
    setLoading(true); setStatus(`Uploading ${files.length} file(s)...`);
    try {
      const prepared = await Promise.all(files.map(async (file) => ({ name: file.name, dataUrl: await toDataUrl(file) })));
      const res = await fetch('/api/miniapp/assets/upload-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, subcategory, files: prepared }) });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Upload failed');
      setConfig(withDefaults(payload.config || config));
      setStatus(`✅ ${payload.uploaded?.length || files.length} asset(s) uploaded`);
      event.target.value = '';
    } catch (error) { setStatus(`❌ ${error.message}`); }
    finally { setLoading(false); }
  }

  function updateLogic(key, value) {
    setConfig((prev) => ({ ...prev, gameLogic: { ...(prev.gameLogic || {}), [key]: Number(value) } }));
    setLogicDirty(true);
  }

  function updateAssetMeta(asset, patch) {
    const key = asset.id || asset.url;
    setConfig((prev) => ({
      ...prev,
      assetsMeta: { ...(prev.assetsMeta || {}), [key]: { ...(prev.assetsMeta?.[key] || {}), ...patch } },
    }));
  }

  // ── Test Preset Actions ──────────────────────────────────────────────────────
  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    localStorage.setItem(META_KEY, JSON.stringify(preset.meta));
    localStorage.removeItem(GAME_KEY);
    setPresetApplied(presetKey);
    refreshLocalMeta();
    setStatus(`✅ Preset "${preset.label}" applied — open game to test`);
  }

  function clearGameState() { localStorage.removeItem(GAME_KEY); localStorage.removeItem(LB_KEY); setStatus('✅ Run state cleared'); }

  function clearAllLocalStorage() {
    localStorage.removeItem(META_KEY); localStorage.removeItem(GAME_KEY); localStorage.removeItem(LB_KEY);
    setPresetApplied(null); refreshLocalMeta(); setStatus('✅ All storage cleared');
  }

  function exportCurrentMeta() {
    const meta = readLocalMeta();
    if (!meta) { setStatus('⚠️ No meta found'); return; }
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `diejungle-meta-${Date.now()}.json`; a.click();
  }

  // ── Meta Editor ──────────────────────────────────────────────────────────────
  function saveMeta() {
    const next = { ...readLocalMeta(), xp: editMeta.xp, gems: editMeta.gems, unlockedIds: editMeta.unlockedIds, achievements: editMeta.achievements };
    localStorage.setItem(META_KEY, JSON.stringify(next));
    refreshLocalMeta(); setStatus('✅ Meta saved — open game to test'); setMetaEditMode(false);
  }

  function toggleUnlock(id) {
    setEditMeta((prev) => ({
      ...prev,
      unlockedIds: prev.unlockedIds.includes(id) ? prev.unlockedIds.filter((x) => x !== id) : [...prev.unlockedIds, id],
    }));
  }

  function toggleAchievement(id) {
    setEditMeta((prev) => ({
      ...prev,
      achievements: prev.achievements.includes(id) ? prev.achievements.filter((x) => x !== id) : [...prev.achievements, id],
    }));
  }

  // ── Cheat Mode ────────────────────────────────────────────────────────────────
  function injectFloor(floor) {
    try {
      const raw = readLocalGameState();
      if (!raw) { setStatus('⚠️ No saved run — play first then inject'); return; }
      const next = { ...raw, floor, room: 0 };
      localStorage.setItem(GAME_KEY, JSON.stringify(next));
      setStatus(`✅ Floor injected: ${floor} — reload the game tab`);
    } catch (e) { setStatus(`❌ ${e.message}`); }
  }

  function injectHp(hp) {
    try {
      const raw = readLocalGameState();
      if (!raw) { setStatus('⚠️ No saved run — play first then inject'); return; }
      const next = { ...raw, player: { ...raw.player, hp } };
      localStorage.setItem(GAME_KEY, JSON.stringify(next));
      setStatus(`✅ HP injected: ${hp} — reload the game tab`);
    } catch (e) { setStatus(`❌ ${e.message}`); }
  }

  function injectCoins(coins) {
    try {
      const raw = readLocalGameState();
      if (!raw) { setStatus('⚠️ No saved run — play first then inject'); return; }
      const next = { ...raw, player: { ...raw.player, coins } };
      localStorage.setItem(GAME_KEY, JSON.stringify(next));
      setStatus(`✅ Coins injected: ${coins} — reload the game tab`);
    } catch (e) { setStatus(`❌ ${e.message}`); }
  }

  function injectGems(gems) {
    try {
      const meta = readLocalMeta() || {};
      const next = { ...meta, gems };
      localStorage.setItem(META_KEY, JSON.stringify(next));
      refreshLocalMeta(); setStatus(`✅ Gems injected: ${gems}`);
    } catch (e) { setStatus(`❌ ${e.message}`); }
  }

  const colorMap = { emerald: 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20', amber: 'border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20', blue: 'border-blue-400/50 bg-blue-400/10 hover:bg-blue-400/20', violet: 'border-violet-400/50 bg-violet-400/10 hover:bg-violet-400/20' };
  const btnColor = { emerald: 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500', amber: 'bg-amber-600 hover:bg-amber-500 border-amber-500', blue: 'bg-blue-600 hover:bg-blue-500 border-blue-500', violet: 'bg-violet-600 hover:bg-violet-500 border-violet-500' };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🌴 DIE JUNGLE · Admin</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Game: <a className="text-cyan-400 hover:text-cyan-300 underline" href="/diejungle" target="_blank" rel="noreferrer">/diejungle</a>
              {' '}· Admin: <span className="text-zinc-400">/diejungle/admin</span>
              {' '}· Mini: <a className="text-cyan-400 hover:text-cyan-300 underline" href="http://localhost:5180" target="_blank" rel="noreferrer">localhost:5180</a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadConfig} disabled={loading} className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm">🔄 Reload</button>
            <button onClick={() => saveConfig(config)} disabled={loading} className={`px-3 py-1.5 rounded text-sm font-medium ${logicDirty ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse' : 'bg-blue-700 hover:bg-blue-600 text-white'}`}>
              {logicDirty ? '⚠️ Save Changes' : '💾 Save All'}
            </button>
            {status && <span className="text-sm text-zinc-300">{status}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Tab Bar — grouped */}
        <div className="space-y-2">
          {TAB_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 min-w-[64px]">{group.label}</span>
              {group.tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${activeTab === tab.id ? 'bg-amber-500/25 border-amber-400/50 text-amber-200' : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-700/60'}`}>
                  {tab.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Active tab tutorial banner */}
        {(() => {
          const activeDef = TABS.find(t => t.id === activeTab);
          return activeDef?.help ? (
            <div className="rounded-xl border border-sky-400/20 bg-sky-900/15 px-4 py-2.5 flex items-start gap-2 text-[12px] text-sky-200">
              <span className="shrink-0 text-sky-400 font-black">?</span>
              <span>{activeDef.help}</span>
            </div>
          ) : null;
        })()}

        {/* ── TEST GAME ───────────────────────────────────────────────────────────── */}
        {activeTab === 'testgame' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">🎮 Test Presets</h2>
                <p className="text-zinc-400 text-sm mt-1">Apply a preset, then open the game. The active run is cleared so you start fresh.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <div key={key} className={`rounded-xl border p-4 space-y-3 transition-colors ${colorMap[preset.color]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg">{preset.emoji}</div>
                        <div className="font-bold text-sm mt-1">{preset.label}</div>
                      </div>
                      {presetApplied === key && <span className="text-[10px] bg-emerald-600/50 text-emerald-200 border border-emerald-500/50 rounded px-2 py-0.5 font-bold">ACTIVE</span>}
                    </div>
                    <p className="text-xs text-zinc-400">{preset.description}</p>
                    <div className="text-[10px] text-zinc-500 space-y-0.5">
                      <div>XP: {preset.meta.xp} · Gems: {preset.meta.gems}</div>
                      <div>Unlocks: {preset.meta.unlockedIds.length === 0 ? 'none' : preset.meta.unlockedIds.length}</div>
                    </div>
                    <button className={`w-full py-2 rounded-lg text-sm font-bold border ${btnColor[preset.color]}`} onClick={() => applyPreset(key)}>
                      Apply
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                <a href="/diejungle" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-sm font-medium">🎮 Open Game</a>
                <a href="http://localhost:5180" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-sm font-medium">📱 Telegram Mini App</a>
                <button onClick={clearGameState} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium">🗑️ Clear Run</button>
                <button onClick={exportCurrentMeta} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium">📤 Export Meta</button>
                <button onClick={clearAllLocalStorage} className="px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-sm font-medium">⚠️ Clear ALL</button>
              </div>
            </div>

            {/* Current State Summary */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">📊 Current localStorage State</h2>
                <button onClick={refreshLocalMeta} className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1">🔄 Refresh</button>
              </div>
              {localMeta ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[{ label: 'XP', value: localMeta.xp ?? 0 }, { label: 'Gems 💎', value: localMeta.gems ?? 0 }, { label: 'Total Runs', value: localMeta.totalRuns ?? 0 }, { label: 'Best Score', value: localMeta.bestScore ?? 0 }].map((s) => (
                      <div key={s.label} className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3 text-center">
                        <div className="text-xs text-zinc-400 mb-1">{s.label}</div>
                        <div className="text-lg font-bold">{s.value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm text-zinc-300 mb-2 font-medium">Unlocks</div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_UNLOCK_IDS.map((id) => {
                        const has = localMeta.unlockedIds?.includes(id);
                        return <span key={id} className={`px-2 py-1 rounded text-xs border ${has ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{has ? '✅' : '🔒'} {UNLOCK_LABELS[id] || id}</span>;
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-300 mb-2 font-medium">Achievements</div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_ACHIEVEMENTS.map((ach) => {
                        const has = localMeta.achievements?.includes(ach);
                        return <span key={ach} className={`px-2 py-1 rounded text-xs border ${has ? 'bg-cyan-600/30 border-cyan-500/40 text-cyan-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>{has ? '🏆' : '🔒'} {ach}</span>;
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">No meta found. Apply a preset or play a run.</div>
              )}
            </div>
          </div>
        )}

        {/* ── META EDITOR ─────────────────────────────────────────────────────────── */}
        {activeTab === 'metaeditor' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">🧬 Meta Progression Editor</h2>
                  <p className="text-zinc-400 text-sm mt-1">Directly edit XP, gems, unlocks and achievements in localStorage. Changes apply when you open the game.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={refreshLocalMeta} className="px-3 py-1.5 text-sm border border-zinc-700 rounded hover:bg-zinc-800">🔄 Reload from storage</button>
                  <button onClick={saveMeta} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-sm font-bold">💾 Save to storage</button>
                </div>
              </div>

              {/* XP + Gems */}
              <div className="grid grid-cols-2 gap-4">
                <label className="block space-y-1">
                  <span className="text-sm text-zinc-300 font-medium">XP</span>
                  <input type="number" min="0" value={editMeta.xp} onChange={(e) => setEditMeta((p) => ({ ...p, xp: Number(e.target.value) }))} className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm" />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm text-zinc-300 font-medium">Gems 💎</span>
                  <input type="number" min="0" value={editMeta.gems} onChange={(e) => setEditMeta((p) => ({ ...p, gems: Number(e.target.value) }))} className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm" />
                </label>
              </div>

              {/* Unlocks checkboxes */}
              <div>
                <div className="text-sm font-medium text-zinc-200 mb-3">Unlocks</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ALL_UNLOCK_IDS.map((id) => {
                    const checked = editMeta.unlockedIds.includes(id);
                    return (
                      <label key={id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${checked ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800'}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleUnlock(id)} className="h-4 w-4 accent-emerald-400" />
                        <span className="text-sm">{UNLOCK_LABELS[id] || id}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Achievements checkboxes */}
              <div>
                <div className="text-sm font-medium text-zinc-200 mb-3">Achievements</div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_ACHIEVEMENTS.map((id) => {
                    const checked = editMeta.achievements.includes(id);
                    return (
                      <label key={id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${checked ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-zinc-700 bg-zinc-800/40 hover:bg-zinc-800'}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleAchievement(id)} className="h-4 w-4 accent-cyan-400" />
                        <span className="text-sm font-mono text-xs">{id}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quick buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                <button onClick={() => setEditMeta({ xp: 0, gems: 0, unlockedIds: [], achievements: [] })} className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-sm">Reset all</button>
                <button onClick={() => setEditMeta({ xp: 5000, gems: 2000, unlockedIds: ALL_UNLOCK_IDS, achievements: ALL_ACHIEVEMENTS })} className="px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-sm">Max all</button>
                <button onClick={() => setEditMeta((p) => ({ ...p, unlockedIds: ALL_UNLOCK_IDS }))} className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-sm">Unlock all</button>
                <button onClick={() => setEditMeta((p) => ({ ...p, unlockedIds: [] }))} className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 text-sm">Lock all</button>
              </div>

              <button onClick={saveMeta} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-base">
                💾 Save Meta to localStorage → Open Game to Test
              </button>
            </div>
          </div>
        )}

        {/* ── CHEAT MODE ──────────────────────────────────────────────────────────── */}
        {activeTab === 'cheatmode' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-amber-300">🔧 Cheat Mode — Inject Game State</h2>
                <p className="text-zinc-400 text-sm mt-1">Directly modify localStorage game state. Start a run first, then use these injectors. Reload the game tab after injecting.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Floor injector */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
                  <h3 className="font-semibold text-amber-200">📍 Jump to Floor</h3>
                  <p className="text-xs text-zinc-400">Teleport to any floor (zone). Useful to test mid-game and boss fights.</p>
                  <div className="flex gap-2">
                    <input type="number" min="1" max="10" value={cheatFloor} onChange={(e) => setCheatFloor(Number(e.target.value))} className="w-20 rounded bg-zinc-800 border border-zinc-700 px-2 py-2 text-sm text-center" />
                    <button onClick={() => injectFloor(cheatFloor)} className="flex-1 rounded bg-amber-600 hover:bg-amber-500 py-2 text-sm font-bold">Inject Floor {cheatFloor}</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5].map((f) => <button key={f} onClick={() => injectFloor(f)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs border border-zinc-700">Zone {f}</button>)}
                  </div>
                </div>

                {/* HP injector */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
                  <h3 className="font-semibold text-rose-200">❤️ Set Player HP</h3>
                  <p className="text-xs text-zinc-400">Force player HP for testing near-death scenarios or revive testing.</p>
                  <div className="flex gap-2">
                    <input type="number" min="1" max="50" value={cheatHp} onChange={(e) => setCheatHp(Number(e.target.value))} className="w-20 rounded bg-zinc-800 border border-zinc-700 px-2 py-2 text-sm text-center" />
                    <button onClick={() => injectHp(cheatHp)} className="flex-1 rounded bg-rose-700 hover:bg-rose-600 py-2 text-sm font-bold">Set HP to {cheatHp}</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 3, 5, 10, 24, 34].map((hp) => <button key={hp} onClick={() => injectHp(hp)} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs border border-zinc-700">{hp} HP</button>)}
                  </div>
                </div>

                {/* Coins injector */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
                  <h3 className="font-semibold text-amber-200">🪙 Set Coins</h3>
                  <p className="text-xs text-zinc-400">Inject coins for testing shop purchases.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 3, 5, 10, 20].map((c) => <button key={c} onClick={() => injectCoins(c)} className="px-3 py-1.5 rounded bg-amber-800/50 hover:bg-amber-700/50 text-xs border border-amber-700/50">{c} coins</button>)}
                  </div>
                </div>

                {/* Gems injector */}
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
                  <h3 className="font-semibold text-cyan-200">💎 Set Gems (Meta)</h3>
                  <p className="text-xs text-zinc-400">Inject gems for testing unlock purchases. Updates meta directly.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 100, 300, 500, 1000, 2000].map((g) => <button key={g} onClick={() => injectGems(g)} className="px-3 py-1.5 rounded bg-cyan-800/50 hover:bg-cyan-700/50 text-xs border border-cyan-700/50">{g} gems</button>)}
                  </div>
                </div>
              </div>

              {/* Raw game state viewer */}
              <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-200">📋 Current Run State (Raw)</h3>
                  <button onClick={() => { refreshLocalMeta(); }} className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1">Refresh</button>
                </div>
                {(() => {
                  const gs = readLocalGameState();
                  if (!gs) return <div className="text-zinc-500 text-sm">No active run found.</div>;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      {[['Floor', gs.floor], ['Phase', gs.phase], ['HP', `${gs.player?.hp}/${gs.player?.maxHp}`], ['Shield', gs.player?.shield ?? 0], ['Coins', gs.player?.coins ?? 0], ['Score', gs.score], ['Turn', gs.turn], ['Room', gs.room]].map(([l, v]) => (
                        <div key={l} className="rounded border border-zinc-800 bg-zinc-800/50 p-2 text-center">
                          <div className="text-zinc-400">{l}</div>
                          <div className="font-bold text-white">{v}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ── GAME LOGIC ──────────────────────────────────────────────────────────── */}
        {activeTab === 'gamelogic' && (
          <section className="space-y-4">
            {logicDirty && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 flex items-center justify-between">
                <span className="text-amber-200 text-sm">⚠️ Unsaved changes</span>
                <button onClick={() => saveConfig(config)} className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-sm font-bold">Save Now</button>
              </div>
            )}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h2 className="text-xl font-semibold mb-1">⚙️ Game Logic Parameters</h2>
              <p className="text-zinc-400 text-sm">These values are saved to the server config and read by the game at runtime. Changes highlighted in amber until saved.</p>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {Object.entries(GAME_LOGIC_GROUPS).map(([group, { label, keys, descriptions }]) => (
                <div key={group} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
                  <h3 className="text-zinc-200 font-semibold capitalize border-b border-zinc-700 pb-2">{label}</h3>
                  {keys.map((key) => (
                    <label key={key} className="text-sm text-zinc-300 space-y-1 block">
                      <span className="block text-zinc-400 text-xs font-mono">{key}</span>
                      {descriptions[key] && <span className="block text-zinc-500 text-[11px]">{descriptions[key]}</span>}
                      <input type="number" step="0.01" value={Number(config.gameLogic?.[key] ?? 0)} onChange={(e) => updateLogic(key, e.target.value)} className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
                    </label>
                  ))}
                </div>
              ))}
            </div>

            {/* ── VISUAL PARAMETER MAP ─────────────────────────────────────────── */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-5 space-y-5">
              <div>
                <h2 className="text-xl font-semibold">🗺️ Parameter Map — What Does Each Setting Do?</h2>
                <p className="text-zinc-400 text-sm mt-1">Visual reference: each parameter's in-game impact, safe ranges, and what breaks if you push too far.</p>
              </div>

              {/* DIFFICULTY */}
              <div className="rounded-xl border border-rose-700/50 bg-rose-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-rose-700/40 pb-2">
                  <span className="text-xl">⚔️</span>
                  <h3 className="font-bold text-rose-300 text-base">DIFFICULTY — Enemy Power</h3>
                  <span className="ml-auto text-[10px] rounded-full border border-rose-500/50 bg-rose-900/60 px-2 py-0.5 text-rose-200 font-bold">DANGER ZONE: keep &lt; 2×</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[
                    { key: 'enemyHpScale', icon: '❤️', color: 'text-rose-300', title: 'Enemy HP Scale', safe: '0.7 – 1.5', impact: 'Multiplies ALL enemy HP. 1.5 = enemies are 50% tankier. Above 2 → fights feel endless.', current: config.gameLogic?.enemyHpScale },
                    { key: 'enemyDamageScale', icon: '💥', color: 'text-orange-300', title: 'Enemy Damage Scale', safe: '0.7 – 1.4', impact: 'Multiplies ALL enemy damage. 1.4 = enemies hit 40% harder. Above 1.8 → one-shots become common.', current: config.gameLogic?.enemyDamageScale },
                    { key: 'waveGrowthPerStage', icon: '📈', color: 'text-amber-300', title: 'Wave Growth Per Stage', safe: '0.08 – 0.18', impact: 'Each zone/floor adds this % of extra HP & DMG. 0.12 = +12% per zone. Too high → Zone 4 is unbeatable.', current: config.gameLogic?.waveGrowthPerStage },
                    { key: 'bossHpMultiplier', icon: '💀', color: 'text-red-300', title: 'Boss HP Multiplier', safe: '1.8 – 3.5', impact: 'Bosses get this × base HP. Default 2.4 = bosses are 2.4× a normal mob. Below 1.5 feels anticlimactic.', current: config.gameLogic?.bossHpMultiplier },
                    { key: 'bossDamageMultiplier', icon: '🔥', color: 'text-red-400', title: 'Boss Damage Multiplier', safe: '1.4 – 2.5', impact: 'Bosses deal this × base damage. 1.8 = bosses hit 80% harder than mobs. Above 3 → unfair one-shots.', current: config.gameLogic?.bossDamageMultiplier },
                    { key: 'eventIntensityScale', icon: '🌪️', color: 'text-violet-300', title: 'Event Intensity Scale', safe: '0.5 – 1.5', impact: 'Scales the negative impact of random events (damage, cost, etc.). 1 = normal. 2 = brutal events.', current: config.gameLogic?.eventIntensityScale },
                  ].map((p) => (
                    <div key={p.key} className="rounded-lg border border-rose-800/50 bg-black/30 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{p.icon}</span>
                        <span className={`text-xs font-bold ${p.color}`}>{p.title}</span>
                        <span className="ml-auto font-mono text-xs font-black text-zinc-200 bg-zinc-800 rounded px-1.5 py-0.5">{Number(p.current ?? 1).toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{p.impact}</p>
                      <div className="text-[10px] text-emerald-400">✅ Safe range: {p.safe}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* COMBAT */}
              <div className="rounded-xl border border-blue-700/50 bg-blue-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-blue-700/40 pb-2">
                  <span className="text-xl">🎲</span>
                  <h3 className="font-bold text-blue-300 text-base">COMBAT MECHANICS — Dice & Player Stats</h3>
                  <span className="ml-auto text-[10px] rounded-full border border-blue-500/50 bg-blue-900/60 px-2 py-0.5 text-blue-200 font-bold">BALANCE SENSITIVE</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {[
                    { key: 'critChance', icon: '⚡', color: 'text-yellow-300', title: 'Crit Chance', safe: '0.05 – 0.25', impact: 'Probability (0–1) of a critical hit. 0.12 = 12% crit rate. Above 0.4 → game feels random.', current: config.gameLogic?.critChance },
                    { key: 'critMultiplier', icon: '💫', color: 'text-yellow-200', title: 'Crit Multiplier', safe: '1.5 – 2.5', impact: 'Damage multiplier on a critical hit. 1.75 = crits deal 75% extra. Above 3 → burst damage too swingy.', current: config.gameLogic?.critMultiplier },
                    { key: 'dodgeChance', icon: '🌀', color: 'text-cyan-300', title: 'Dodge Chance', safe: '0.0 – 0.2', impact: 'Probability (0–1) of fully dodging an enemy hit. 0.08 = 8% dodge. Above 0.3 → trivializes damage.', current: config.gameLogic?.dodgeChance },
                    { key: 'lifeSteal', icon: '🩸', color: 'text-pink-300', title: 'Life Steal', safe: '0.0 – 0.12', impact: 'HP gained per point of attack dealt (fraction). 0.05 = 5% of damage as HP. Above 0.2 → combat trivial.', current: config.gameLogic?.lifeSteal },
                    { key: 'shieldDecayPerTurn', icon: '🛡️', color: 'text-sky-300', title: 'Shield Decay / Turn', safe: '0.0 – 0.3', impact: 'Fraction of shield lost each turn (except Fortress). 0.15 = 15% shield gone/turn. 0 = permanent shield.', current: config.gameLogic?.shieldDecayPerTurn },
                    { key: 'comboWindowTurns', icon: '🔗', color: 'text-indigo-300', title: 'Combo Window (turns)', safe: '1 – 4', impact: 'How many consecutive turns of the same die type count as a combo. 2 = 2 turns ATK in a row triggers combo.', current: config.gameLogic?.comboWindowTurns },
                    { key: 'reviveHpRatio', icon: '💖', color: 'text-rose-300', title: 'Revive HP Ratio', safe: '0.2 – 0.5', impact: 'HP fraction on death revive (if player has Kabal Sigil or revive relic). 0.35 = revive at 35% HP.', current: config.gameLogic?.reviveHpRatio },
                  ].map((p) => (
                    <div key={p.key} className="rounded-lg border border-blue-800/50 bg-black/30 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{p.icon}</span>
                        <span className={`text-xs font-bold ${p.color}`}>{p.title}</span>
                        <span className="ml-auto font-mono text-xs font-black text-zinc-200 bg-zinc-800 rounded px-1.5 py-0.5">{Number(p.current ?? 0).toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{p.impact}</p>
                      <div className="text-[10px] text-emerald-400">✅ Safe range: {p.safe}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ECONOMY */}
              <div className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-700/40 pb-2">
                  <span className="text-xl">💰</span>
                  <h3 className="font-bold text-amber-300 text-base">ECONOMY — Score, Drops & Events</h3>
                  <span className="ml-auto text-[10px] rounded-full border border-amber-500/50 bg-amber-900/60 px-2 py-0.5 text-amber-200 font-bold">LEADERBOARD IMPACT</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {[
                    { key: 'scoreScale', icon: '🏆', color: 'text-amber-300', title: 'Score Scale', safe: '0.5 – 3.0', impact: 'Multiplies all score gains. 2 = double points everywhere. Affects leaderboard — warn players before changing!', current: config.gameLogic?.scoreScale },
                    { key: 'dropRateMultiplier', icon: '🎁', color: 'text-emerald-300', title: 'Drop Rate Multiplier', safe: '0.5 – 2.0', impact: 'Multiplies artifact and item drop chances. 1.5 = 50% more drops. Scales with relics and events.', current: config.gameLogic?.dropRateMultiplier },
                    { key: 'rerollCostScore', icon: '🔁', color: 'text-sky-300', title: 'Reroll Cost (Score)', safe: '10 – 50', impact: 'Score deducted each time a player rerolls a die. 20 = -20 pts per reroll. 0 = free rerolls (risky!).', current: config.gameLogic?.rerollCostScore },
                    { key: 'randomEventChance', icon: '🎲', color: 'text-violet-300', title: 'Random Event Chance', safe: '0.1 – 0.4', impact: 'Probability a map node triggers a random event. 0.2 = 20% of nodes. Above 0.6 → every node is an event.', current: config.gameLogic?.randomEventChance },
                  ].map((p) => (
                    <div key={p.key} className="rounded-lg border border-amber-800/50 bg-black/30 p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{p.icon}</span>
                        <span className={`text-xs font-bold ${p.color}`}>{p.title}</span>
                        <span className="ml-auto font-mono text-xs font-black text-zinc-200 bg-zinc-800 rounded px-1.5 py-0.5">{Number(p.current ?? 0).toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{p.impact}</p>
                      <div className="text-[10px] text-emerald-400">✅ Safe range: {p.safe}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => saveConfig(config)} className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white">💾 Save All Parameters to Server</button>
            </div>
          </section>
        )}

        {/* ── DICE COSMETICS ──────────────────────────────────────────────────────── */}
        {activeTab === 'dicecosmetics' && (() => {
          const CHARS = [
            { id: 'kabalian', label: 'Kabalian', emoji: '⚔️', color: 'amber' },
            { id: 'kkm',      label: 'KKM',      emoji: '🤖', color: 'cyan' },
            { id: 'krex',     label: 'K-REX',    emoji: '🦖', color: 'emerald' },
          ];
          const DIE_TYPES = ['attack', 'shield', 'heal'];
          const DIE_TYPE_META = {
            attack: { emoji: '⚔️', label: 'Attack Dice', color: 'rose' },
            shield: { emoji: '🛡️', label: 'Shield Dice', color: 'sky' },
            heal:   { emoji: '❤️', label: 'Heal Dice',   color: 'pink' },
          };
          const activeChar = CHARS.find(c => c.id === diceChar) || CHARS[0];
          const charBorderColor = activeChar.color === 'amber' ? 'border-amber-500/50' : activeChar.color === 'cyan' ? 'border-cyan-500/50' : 'border-emerald-500/50';
          const charBg = activeChar.color === 'amber' ? 'bg-amber-500/10' : activeChar.color === 'cyan' ? 'bg-cyan-500/10' : 'bg-emerald-500/10';

          function updateDiceUrl(charId, dieType, face, url) {
            setConfig(prev => ({
              ...prev,
              diceCosmetics: {
                ...prev.diceCosmetics,
                [charId]: {
                  ...prev.diceCosmetics[charId],
                  [dieType]: {
                    ...(prev.diceCosmetics[charId]?.[dieType] || {}),
                    [face]: url,
                  },
                },
              },
            }));
            setLogicDirty(true);
          }

          return (
            <section className="space-y-5">
              <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-5">
                <h2 className="text-xl font-semibold text-amber-300">🎲 Dice Cosmetics</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Set custom dice images per character. Each face (1–6) per die type can have its own image URL.
                  Changes are saved to the server config and applied in-game at next run start.
                  Leave blank to use the default dice images.
                </p>
                <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-900/20 px-4 py-2 text-xs text-amber-200">
                  ✨ <strong>Golden Kabal Dice:</strong> When the golden dice appears (10% per combat), it always rolls value 6.
                  The player picks attack / shield / heal before placing it. Custom dice images apply to the character's set — not to the golden dice (which uses a special golden skin).
                </div>
              </div>

              {/* Character selector */}
              <div className="flex gap-2 flex-wrap">
                {CHARS.map(c => {
                  const active = diceChar === c.id;
                  const cls = active
                    ? c.color === 'amber' ? 'border-amber-400/70 bg-amber-500/20 text-amber-200' : c.color === 'cyan' ? 'border-cyan-400/70 bg-cyan-500/20 text-cyan-200' : 'border-emerald-400/70 bg-emerald-500/20 text-emerald-200'
                    : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200';
                  return (
                    <button key={c.id} onClick={() => setDiceChar(c.id)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${cls}`}>
                      <span className="text-lg">{c.emoji}</span>
                      {c.label}
                      {active && <span className="text-[10px] opacity-70 font-normal">← editing</span>}
                    </button>
                  );
                })}
              </div>

              {/* Dice face editor for selected character */}
              <div className={`rounded-xl border ${charBorderColor} ${charBg} p-5 space-y-6`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeChar.emoji}</span>
                  <h3 className="text-lg font-bold">{activeChar.label} — Dice Set</h3>
                  <span className="ml-auto text-xs text-zinc-400">6 faces × 3 types = 18 images total</span>
                </div>

                {DIE_TYPES.map(dieType => {
                  const tm = DIE_TYPE_META[dieType];
                  const borderCol = tm.color === 'rose' ? 'border-rose-700/50' : tm.color === 'sky' ? 'border-sky-700/50' : 'border-pink-700/50';
                  const headerCol = tm.color === 'rose' ? 'text-rose-300' : tm.color === 'sky' ? 'text-sky-300' : 'text-pink-300';
                  return (
                    <div key={dieType} className={`rounded-lg border ${borderCol} bg-black/30 p-4 space-y-3`}>
                      <div className={`flex items-center gap-2 ${headerCol} font-bold`}>
                        <span className="text-lg">{tm.emoji}</span>
                        {tm.label}
                        <span className="text-xs font-normal text-zinc-400 ml-1">— paste image URLs for each face value</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                        {[1,2,3,4,5,6].map(face => {
                          const url = config.diceCosmetics?.[diceChar]?.[dieType]?.[face] || '';
                          return (
                            <div key={face} className="space-y-2">
                              <div className="text-[10px] font-bold text-zinc-400 text-center">Face {face}{face === 6 ? ' ✦' : ''}</div>
                              <div className="h-16 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {url
                                  ? <img src={url} alt={`${dieType} face ${face}`} className="h-full w-full object-contain p-1" />
                                  : <span className="text-2xl opacity-30">{tm.emoji}</span>
                                }
                              </div>
                              <input
                                type="text"
                                placeholder="https://..."
                                value={url}
                                onChange={e => updateDiceUrl(diceChar, dieType, face, e.target.value)}
                                className="w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-mono text-zinc-200 focus:border-amber-500 focus:outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <button onClick={() => saveConfig(config)} className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-white">
                  💾 Save {activeChar.label} Dice Set to Server
                </button>
              </div>

              {/* Quick copy/paste all 3 chars */}
              <div className="rounded-xl border border-zinc-700 bg-zinc-900/70 p-4">
                <h3 className="font-semibold text-zinc-200 mb-2">📋 Bulk Edit — Raw JSON</h3>
                <p className="text-zinc-400 text-xs mb-3">Advanced: edit all dice cosmetics as raw JSON. Useful for copy-pasting entire sets.</p>
                <JsonEditor
                  label="diceCosmetics (all characters)"
                  value={config.diceCosmetics}
                  onSave={(value) => { setConfig(p => ({ ...p, diceCosmetics: mergeCharDiceCosmetics(value) })); setLogicDirty(true); }}
                  rows={14}
                />
              </div>
            </section>
          );
        })()}

        {/* ── ENEMIES VIEWER ──────────────────────────────────────────────────────── */}
        {activeTab === 'enemies' && (
          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h2 className="text-xl font-semibold mb-1">👾 Enemy Pool Viewer</h2>
              <p className="text-zinc-400 text-sm">These are the hardcoded enemy pools from the game. Filter by tier to see each enemy's stats, intents and modifiers. Custom enemies can be added via the Advanced tab.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['all', ...Object.keys(ENEMY_TIERS)].map((tier) => (
                  <button key={tier} onClick={() => setEnemyTierFilter(tier)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${enemyTierFilter === tier ? 'bg-amber-500/25 border-amber-400/50 text-amber-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}>
                    {tier === 'all' ? 'All Tiers' : `${tier.charAt(0).toUpperCase() + tier.slice(1)}`}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <p className="text-zinc-500 text-sm italic">Enemy pool data is hardcoded in DieInTheJungle.tsx · ENEMY_POOLS (lines 155-402). Use the Advanced tab to add custom enemies that extend the pool.</p>
              <div className="mt-4 space-y-2">
                {Object.entries(ENEMY_TIERS).filter(([tier]) => enemyTierFilter === 'all' || enemyTierFilter === tier).map(([tier, info]) => (
                  <div key={tier} className="rounded-lg border border-zinc-700 bg-zinc-800/40 p-3">
                    <div className={`text-sm font-bold mb-1 ${tier === 'boss' ? 'text-rose-300' : tier === 'champions' ? 'text-amber-300' : tier === 'medium' ? 'text-blue-300' : 'text-zinc-300'}`}>
                      {tier.toUpperCase()} — {info.desc}
                    </div>
                    <div className="text-xs text-zinc-400">{info.label} enemies are drawn from the hardcoded pool. Add custom ones via Advanced → customMonsters with <code className="bg-zinc-900 px-1 rounded">tier: "{tier}"</code> to override.</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
                <h3 className="text-sm font-semibold text-zinc-200 mb-2">Modifiers Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                  {[
                    { name: 'Berserk', badge: '+2 DMG', desc: 'All attacks deal +2 damage' },
                    { name: 'Stone Skin', badge: '1st hit immune', desc: 'Ignores the first hit each combat' },
                    { name: 'Thorns', badge: 'Recoil 1', desc: 'Attacking the enemy deals 1 HP recoil' },
                    { name: 'Swift', badge: '+2 first intent', desc: 'First intent each combat gets +2 value' },
                    { name: 'Venom', badge: '+1 poison', desc: 'If enemy hits HP, you lose +1 extra HP' },
                    { name: 'Regen', badge: '+2 regen', desc: 'Enemy heals 2 at end of its turn' },
                  ].map((m) => (
                    <div key={m.name} className="flex items-start gap-2 rounded border border-zinc-700 bg-zinc-800/50 p-2">
                      <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-[10px] font-bold text-zinc-200 shrink-0">{m.badge}</span>
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{m.name}</div>
                        <div className="text-[11px] text-zinc-400">{m.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── ARTIFACTS VIEWER ─────────────────────────────────────────────────────── */}
        {activeTab === 'artifacts' && (
          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h2 className="text-xl font-semibold mb-1">📦 Artifact Pool</h2>
              <p className="text-zinc-400 text-sm">These are the hardcoded artifacts (ARTIFACT_POOL in DieInTheJungle.tsx lines 414-579). Filter by rarity to audit balance.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {['all', 'common', 'rare', 'epic', 'legendary'].map((r) => (
                  <button key={r} onClick={() => setArtifactFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${artifactFilter === r ? 'bg-amber-500/25 border-amber-400/50 text-amber-200' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {[
                  { id: 'venomFang', name: 'Venom Fang', rarity: 'common', category: 'offense', tags: ['attack', 'poison'], effectText: 'When you place an attack die, enemy takes 1 extra damage.' },
                  { id: 'ironBark', name: 'Iron Bark', rarity: 'common', category: 'defense', tags: ['shield'], effectText: '+2 shield at combat start.' },
                  { id: 'moonSap', name: 'Moon Sap', rarity: 'common', category: 'heal', tags: ['heal'], effectText: '+1 heal per heal die placed.' },
                  { id: 'swiftStrike', name: 'Swift Strike', rarity: 'rare', category: 'offense', tags: ['attack', 'combo'], effectText: 'After 3 attack dice in a row, +3 bonus damage.' },
                  { id: 'shieldwall', name: 'Shieldwall', rarity: 'rare', category: 'defense', tags: ['shield', 'combo'], effectText: 'Surge (3 shields) grants +2 bonus shield.' },
                  { id: 'jungleMask', name: 'Jungle Mask', rarity: 'epic', category: 'utility', tags: ['combo'], effectText: 'SURGE attacks deal double bonus damage.' },
                  { id: 'bleedingCharm', name: 'Bleeding Charm', rarity: 'epic', category: 'offense', tags: ['attack', 'risky'], effectText: '+3 attack bonus. Lose 1 HP per turn.' },
                  { id: 'kabalSigil', name: 'Kabal Sigil', rarity: 'legendary', category: 'survival', tags: ['revive'], effectText: 'Once per run: revive at 40% HP on death.' },
                  { id: 'timeEngine', name: 'Time Engine', rarity: 'legendary', category: 'utility', tags: ['cooldown'], effectText: 'Every 3 turns, reset all dice cooldowns.' },
                ].filter((a) => artifactFilter === 'all' || a.rarity === artifactFilter).map((a) => {
                  const rarityStyle = a.rarity === 'legendary' ? 'border-amber-400/60 bg-amber-500/10 text-amber-100' : a.rarity === 'epic' ? 'border-violet-400/60 bg-violet-500/10 text-violet-100' : a.rarity === 'rare' ? 'border-blue-400/50 bg-blue-500/10 text-blue-100' : 'border-zinc-600/60 bg-zinc-800/60 text-zinc-200';
                  return (
                    <div key={a.id} className={`rounded-xl border p-3 space-y-2 ${rarityStyle}`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-sm">{a.name}</div>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${rarityStyle}`}>{a.rarity}</span>
                      </div>
                      <div className="text-xs opacity-80">{a.effectText}</div>
                      <div className="flex flex-wrap gap-1">
                        {a.tags.map((t) => <span key={t} className="text-[10px] rounded-full border border-current/30 px-1.5 py-0.5 opacity-70">{t}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-zinc-500">Full artifact pool is hardcoded in DieInTheJungle.tsx. Add custom artifacts via Advanced → customArtifacts.</p>
            </div>
          </section>
        )}

        {/* ── ASSETS ──────────────────────────────────────────────────────────────── */}
        {activeTab === 'assets' && (
          <section className="space-y-5">

            {/* ── Configured URLs (always visible) ── */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">📌 Assets configurés (URLs actives)</h2>
                <p className="text-zinc-400 text-sm mt-1">Toutes les images actuellement utilisées en jeu. Pour modifier, va dans <strong>Avatars & Visuals</strong>.</p>
              </div>

              {/* Biome backgrounds */}
              <div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-emerald-400 mb-2">🌿 Backgrounds Biomes</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { id: 'jungle', label: '🌿 Jungle' },
                    { id: 'ruins',  label: '🏛️ Ruins' },
                    { id: 'temple', label: '⛩️ Temple' },
                    { id: 'abyss',  label: '🌑 Abyss' },
                    { id: 'void',   label: '⚡ Void' },
                  ].map(b => {
                    const url = config.visuals?.biomeBackgrounds?.[b.id] || {
                      jungle: 'https://i.postimg.cc/hGqqmWDN/Chat-GPT-Image-15-mars-2026-00-24-52.png',
                      ruins:  'https://i.postimg.cc/QCz2xvnC/Chat-GPT-Image-15-mars-2026-01-27-54.png',
                      temple: 'https://i.postimg.cc/7PQ8VTPg/Chat-GPT-Image-15-mars-2026-01-36-50.png',
                      abyss:  'https://i.postimg.cc/sf0dcZf7/Chat-GPT-Image-15-mars-2026-10-55-43.png',
                      void:   'https://i.postimg.cc/hGqqmWDN/Chat-GPT-Image-15-mars-2026-00-24-52.png',
                    }[b.id] || '';
                    return (
                      <figure key={b.id} className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                        {url ? (
                          <img src={url} alt={b.label} className="w-full h-20 object-cover" />
                        ) : (
                          <div className="w-full h-20 flex items-center justify-center bg-zinc-800 text-zinc-600 text-xs">Pas d'image</div>
                        )}
                        <figcaption className="px-2 py-1 text-[10px] font-bold text-zinc-300">{b.label}</figcaption>
                        {url ? <div className="px-2 pb-1 text-[8px] text-zinc-600 truncate">{url.split('/').pop()}</div> : null}
                      </figure>
                    );
                  })}
                </div>
              </div>

              {/* Button images */}
              <div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-amber-400 mb-2">🎮 Boutons d'Action</div>
                <div className="flex flex-wrap gap-3">
                  {['roll', 'reroll', 'resolve', 'restart'].map(key => {
                    const url = config.visuals?.buttonImages?.[key] || (key === 'roll' ? 'https://i.postimg.cc/9Q7ZFSQt/Chat-GPT-Image-14-mars-2026-23-43-10.png' : '');
                    return (
                      <figure key={key} className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-center min-w-[80px]">
                        {url ? (
                          <img src={url} alt={key} className="h-12 w-auto mx-auto object-contain" />
                        ) : (
                          <div className="h-12 flex items-center justify-center text-zinc-600 text-xs">vide</div>
                        )}
                        <figcaption className="mt-1 text-[10px] font-bold text-zinc-400 uppercase">{key}</figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>

              {/* Logo + Shop */}
              <div>
                <div className="text-xs font-black uppercase tracking-[0.14em] text-violet-400 mb-2">🎭 Personnages & Logo</div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'Logo DIE JUNGLE', url: 'https://i.postimg.cc/pTXBTZ79/Chat-GPT-Image-15-mars-2026-00-13-27.png' },
                    { label: 'Shop Guy',        url: 'https://i.postimg.cc/t4Wkm7Pr/Chat-GPT-Image-15-mars-2026-19-30-40.png' },
                    { label: 'Kabalian',        url: config.characters?.playable?.kabalian?.avatar || 'https://i.postimg.cc/B6rBLmBt/Kabalian-Face.png' },
                    { label: 'KKM',             url: config.characters?.playable?.kkm?.avatar || 'https://i.postimg.cc/Kv8zygVk/KKM-Mascot-2.png' },
                  ].map(item => (
                    <figure key={item.label} className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-center w-[90px]">
                      {item.url ? (
                        <img src={item.url} alt={item.label} className="h-16 w-full object-contain rounded" />
                      ) : (
                        <div className="h-16 flex items-center justify-center text-zinc-600 text-xs">manquant</div>
                      )}
                      <figcaption className="mt-1 text-[9px] font-bold text-zinc-300 leading-tight">{item.label}</figcaption>
                    </figure>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Upload Manager ── */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">⬆️ Upload d'Assets</h2>
                <p className="text-zinc-400 text-sm mt-1">Upload des images vers le serveur par catégorie. Max 30 fichiers à la fois. Formats: PNG, JPG, WebP.</p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Catégorie</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm">
                    {Object.keys(ASSET_SCHEMA).map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Sous-catégorie</label>
                  <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm">
                    {availableSubcategories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Fichiers (max 30)</label>
                  <input type="file" accept="image/*" multiple onChange={onUpload} disabled={loading} className="text-sm text-zinc-300" />
                </div>
              </div>

              {/* Uploaded assets grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assetBucket.slice(0, 120).map((asset) => {
                  const key = asset.id || asset.url;
                  const meta = config.assetsMeta?.[key] || {};
                  return (
                    <figure key={key} className="rounded-xl border border-zinc-700 bg-zinc-800 overflow-hidden">
                      <img src={asset.url} alt={asset.originalName || asset.fileName || 'asset'} className="w-full h-20 object-cover" />
                      <div className="p-2 space-y-1.5">
                        <figcaption className="text-[10px] text-zinc-300 truncate font-medium">{asset.originalName || asset.fileName}</figcaption>
                        <input placeholder="tags: poison,boss" value={meta.tags || ''} onChange={(e) => updateAssetMeta(asset, { tags: e.target.value })} className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1" />
                        <select value={meta.status || 'active'} onChange={(e) => updateAssetMeta(asset, { status: e.target.value })} className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1">
                          <option value="active">active</option>
                          <option value="draft">draft</option>
                          <option value="deprecated">deprecated</option>
                        </select>
                      </div>
                    </figure>
                  );
                })}
                {assetBucket.length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed border-zinc-700 p-8 text-center space-y-1">
                    <div className="text-2xl">📂</div>
                    <div className="text-zinc-400 text-sm">Aucun asset uploadé dans ce bucket.</div>
                    <div className="text-zinc-600 text-xs">Choisis une catégorie, sélectionne des fichiers et upload.</div>
                  </div>
                )}
              </div>
              <button onClick={() => saveConfig(config)} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium">💾 Sauvegarder les métadonnées</button>
            </div>
          </section>
        )}

        {/* ── AVATARS ──────────────────────────────────────────────────────────────── */}
        {activeTab === 'avatars' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">🎭 Avatars & Visuals</h2>
            <JsonEditor label="characters.playable" value={config.characters.playable} onSave={(value) => setConfig((p) => ({ ...p, characters: { ...p.characters, playable: value } }))} />
            <JsonEditor label="characters.emotionUrls" value={config.characters.emotionUrls} onSave={(value) => setConfig((p) => ({ ...p, characters: { ...p.characters, emotionUrls: value } }))} />
            <JsonEditor label="visuals (background, logo, storyFragment URLs)" value={config.visuals} onSave={(value) => setConfig((p) => ({ ...p, visuals: value }))} rows={6} />

            {/* Button Images */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
              <div className="font-semibold text-amber-300">🎮 Action Button Images</div>
              <p className="text-zinc-400 text-xs">Paste image URLs for each action button. Leave blank to use text fallback.</p>
              {['roll', 'reroll', 'resolve', 'restart'].map(key => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-16 text-xs text-zinc-300 font-mono uppercase">{key}</label>
                  <input
                    type="text"
                    className="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-zinc-100 font-mono"
                    placeholder={`URL for ${key} button image`}
                    value={config.visuals?.buttonImages?.[key] || ''}
                    onChange={e => setConfig(p => ({
                      ...p,
                      visuals: {
                        ...p.visuals,
                        buttonImages: { ...p.visuals.buttonImages, [key]: e.target.value }
                      }
                    }))}
                  />
                  {config.visuals?.buttonImages?.[key] && (
                    <img src={config.visuals.buttonImages[key]} alt={key} className="h-10 w-auto object-contain rounded border border-zinc-600" />
                  )}
                </div>
              ))}
            </div>

            {/* Biome Backgrounds */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-4 space-y-3">
              <div className="font-semibold text-emerald-300">🌿 Biome Background Images</div>
              <p className="text-zinc-400 text-xs">Background URL per biome. Changes dynamically in game after boss kills.</p>
              {[
                { id: 'jungle', label: '🌿 Jungle Profonde', placeholder: 'https://i.postimg.cc/YSmfqq2c/Background-desktop.png' },
                { id: 'ruins',  label: '🏛️ Ruines Ka',       placeholder: 'URL for ruins background' },
                { id: 'temple', label: '⛩️ Temple Maudit',   placeholder: 'URL for temple background' },
                { id: 'abyss',  label: '🌑 Abysse',          placeholder: 'URL for abyss background' },
                { id: 'void',   label: '⚡ Vide Éternel',    placeholder: 'URL for void background' },
              ].map(b => (
                <div key={b.id} className="flex items-center gap-3">
                  <label className="w-32 text-xs text-zinc-300">{b.label}</label>
                  <input
                    type="text"
                    className="flex-1 rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs text-zinc-100 font-mono"
                    placeholder={b.placeholder}
                    value={config.visuals?.biomeBackgrounds?.[b.id] || ''}
                    onChange={e => setConfig(p => ({
                      ...p,
                      visuals: {
                        ...p.visuals,
                        biomeBackgrounds: { ...p.visuals.biomeBackgrounds, [b.id]: e.target.value }
                      }
                    }))}
                  />
                </div>
              ))}
            </div>

            <button onClick={() => saveConfig(config)} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium">💾 Save to server</button>
          </section>
        )}

        {/* ── NARRATIVE ────────────────────────────────────────────────────────────── */}
        {activeTab === 'narrative' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">📖 Narrative Sequences</h2>
            <p className="text-zinc-400 text-sm">Kabalian and KKM story fragments shown between zones. Array of strings.</p>
            <JsonEditor label="narrative.kabalian" value={config.narrative.kabalian} onSave={(value) => setConfig((p) => ({ ...p, narrative: { ...p.narrative, kabalian: value } }))} rows={14} />
            <JsonEditor label="narrative.kkm" value={config.narrative.kkm} onSave={(value) => setConfig((p) => ({ ...p, narrative: { ...p.narrative, kkm: value } }))} rows={14} />
            <button onClick={() => saveConfig(config)} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium">💾 Save to server</button>
          </section>
        )}

        {/* ── ADVANCED ─────────────────────────────────────────────────────────────── */}
        {activeTab === 'advanced' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">🔬 Advanced — Custom Monsters & Artifacts</h2>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200">
              ⚠️ Custom monsters and artifacts are stored in the server config. They are not yet merged into the game's hardcoded pools. This feature is in the backlog. For now, use these as staging / design documents.
            </div>
            <JsonEditor label="monsters.traitsCatalog" value={config.monsters.traitsCatalog} onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, traitsCatalog: value } }))} rows={10} />
            <JsonEditor label="monsters.customMonsters" value={config.monsters.customMonsters} onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, customMonsters: value } }))} rows={12} />
            <JsonEditor label="artifacts.customArtifacts" value={config.artifacts.customArtifacts} onSave={(value) => setConfig((p) => ({ ...p, artifacts: { ...p.artifacts, customArtifacts: value } }))} rows={12} />
            <button onClick={() => saveConfig(config)} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium">💾 Save to server</button>
          </section>
        )}

        {/* ── ROADMAP ──────────────────────────────────────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {/* Bugs & fixes tracker */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3">
              <h2 className="text-xl font-semibold">🐛 Known Issues & Fixes</h2>
              <div className="space-y-2">
                {KNOWN_ISSUES.map((issue, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border px-3 py-2 ${issue.status === 'fixed' ? 'border-emerald-700/50 bg-emerald-900/20' : 'border-zinc-700 bg-zinc-800/40'}`}>
                    <span className="text-base shrink-0">{issue.status === 'fixed' ? '✅' : '🔴'}</span>
                    <div>
                      <div className={`text-sm ${issue.status === 'fixed' ? 'text-zinc-400 line-through' : 'text-zinc-200'}`}>{issue.label}</div>
                      <div className="text-[11px] text-zinc-500">{issue.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap sections */}
            {ROADMAP.map((section) => {
              const borderColor = section.color === 'emerald' ? 'border-emerald-800' : section.color === 'amber' ? 'border-amber-800' : 'border-zinc-800';
              const headerColor = section.color === 'emerald' ? 'text-emerald-300' : section.color === 'amber' ? 'text-amber-300' : 'text-zinc-400';
              return (
                <div key={section.section} className={`rounded-xl border ${borderColor} bg-zinc-900/70 p-5 space-y-3`}>
                  <h3 className={`text-lg font-bold ${headerColor}`}>{section.section}</h3>
                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      <div key={item.label} className="flex items-start gap-2.5 py-1">
                        <span className="text-base mt-0.5 shrink-0">{item.done ? '✅' : '⬜'}</span>
                        <span className={`text-sm ${item.done ? 'text-zinc-400' : 'text-zinc-300'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Kill Rewards Pool reference */}
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 space-y-2">
              <h3 className="font-bold text-amber-300 text-sm">💎 Kill Reward Pool — Taux de drop (mob auto, elite/boss = choix)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                {[
                  { icon: '❤️', label: '+10 HP', pct: '28%', rarity: 'common' },
                  { icon: '🧬', label: '+1 HP max', pct: '20%', rarity: 'common' },
                  { icon: '🪙', label: '+10 Coins', pct: '20%', rarity: 'common' },
                  { icon: '◆',  label: 'Ka Fragment', pct: '15%', rarity: 'common' },
                  { icon: '🛡️', label: '+5 Shield', pct: '12%', rarity: 'common' },
                  { icon: '🎲', label: '+1 Dé bonus', pct: '8%', rarity: 'rare' },
                  { icon: '🎯', label: '+0.5% Crit', pct: '5%', rarity: 'rare' },
                  { icon: '✨', label: 'Artifact gray/gold', pct: '3%', rarity: 'epic' },
                  { icon: '💎', label: '1 Gem', pct: '1%', rarity: 'rare' },
                  { icon: '⚔️', label: 'Arme (run+unlock)', pct: '1%', rarity: 'legendary' },
                  { icon: '💎💎', label: '5 Gems', pct: '0.1%', rarity: 'epic' },
                ].map(r => (
                  <div key={r.label} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 ${
                    r.rarity === 'legendary' ? 'border-orange-600/40 bg-orange-950/20 text-orange-300' :
                    r.rarity === 'epic' ? 'border-violet-600/40 bg-violet-950/20 text-violet-300' :
                    r.rarity === 'rare' ? 'border-amber-600/40 bg-amber-950/20 text-amber-300' :
                    'border-zinc-700 bg-zinc-800/40 text-zinc-300'
                  }`}>
                    <span>{r.icon}</span>
                    <span className="font-medium">{r.label}</span>
                    <span className="ml-auto text-zinc-500">{r.pct}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tokenomics reference */}
            <div className="rounded-xl border border-violet-800/40 bg-violet-950/20 p-4 space-y-3">
              <h3 className="font-bold text-violet-300 text-sm">💎 Tokenomics — Sources de gems & Gem Store</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-zinc-300">
                <div className="space-y-1.5">
                  <div className="font-black text-violet-200 uppercase tracking-wider text-[10px]">Sources de gems (in-game)</div>
                  {[
                    ['Kill mob', '1% → 1 gem, 0.1% → 5 gems'],
                    ['Kill boss', '+1 gem garanti (zone 2+ uniquement)'],
                    ['Fin de run', 'Zone 1: +5 · Zone 2: +10 · Zone 3+: +15'],
                    ['Daily seed top 3', '50 / 30 / 15 gems'],
                    ['Referral', '+50 gems/ami, max 20 refs = 1 000 gems max'],
                    ['Share card', '+1 gem/jour max'],
                    ['Cap quotidien', '30 gems/jour via gameplay (reset minuit UTC)'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="text-violet-300 shrink-0 font-medium">{k}:</span><span className="text-zinc-400">{v}</span></div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="font-black text-violet-200 uppercase tracking-wider text-[10px]">Gem Store pricing</div>
                  {[
                    ['SOL', '1 gem = 0.1 SOL (prix ancre stable)'],
                    ['$DIE token', '-65% vs SOL, prix en USDC temps réel, token brûlé'],
                    ['Arme rare', '~150 gems'],
                    ['Cosmetic', 'TBD'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="text-amber-300 shrink-0 font-medium">{k}:</span><span className="text-zinc-400">{v}</span></div>
                  ))}
                  <div className="mt-2 font-black text-violet-200 uppercase tracking-wider text-[10px]">Bridge</div>
                  {[
                    ['V1 MVP', 'Achat SOL direct site web → gems API'],
                    ['V2', 'Bridge $DIE Solana → TON (Allbridge) → wallet → mini app'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2"><span className="text-emerald-300 shrink-0 font-medium">{k}:</span><span className="text-zinc-400">{v}</span></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              {(() => {
                const all = ROADMAP.flatMap((s) => s.items);
                const done = all.filter((i) => i.done).length;
                const pct = Math.round((done / all.length) * 100);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300 font-medium">Overall Progress</span>
                      <span className="text-zinc-300">{done} / {all.length} features ({pct}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── SPRINT TRACKER ───────────────────────────────────────────────────── */}
        {activeTab === 'sprints' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">⚡ Sprint Tracker</h2>
                <p className="text-zinc-400 text-sm mt-0.5">Master list des sprints — condensé pour l'équipe.</p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                {SPRINT_PLAN.reduce((t, s) => t + s.items.length, 0)} features totales ·{' '}
                {SPRINT_PLAN.reduce((t, s) => t + s.items.filter(i => i.done).length, 0)} done
              </div>
            </div>

            {SPRINT_PLAN.map((sprint) => {
              const doneCount = sprint.items.filter(i => i.done).length;
              const pct = Math.round((doneCount / sprint.items.length) * 100);
              const statusColors = {
                done:    'border-emerald-700 bg-emerald-950/30',
                active:  'border-amber-600 bg-amber-950/30',
                planned: 'border-zinc-700 bg-zinc-900/50',
              };
              const headerColors = {
                done:    'text-emerald-300',
                active:  'text-amber-300',
                planned: 'text-zinc-400',
              };
              const barColors = {
                done:    'from-emerald-500 to-emerald-400',
                active:  'from-amber-500 to-yellow-400',
                planned: 'from-zinc-600 to-zinc-500',
              };
              return (
                <div key={sprint.id} className={`rounded-xl border ${statusColors[sprint.status]} p-4 space-y-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className={`font-bold text-base ${headerColors[sprint.status]}`}>{sprint.label}</div>
                    <div className="flex items-center gap-2 shrink-0">
                      {sprint.status === 'active' && (
                        <span className="rounded-full border border-amber-400/50 bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 animate-pulse">EN COURS</span>
                      )}
                      <span className="text-xs text-zinc-400">{doneCount}/{sprint.items.length}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r ${barColors[sprint.status]} transition-all`} style={{ width: `${pct}%` }} />
                  </div>

                  {/* Items */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {sprint.items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 py-0.5">
                        <span className="shrink-0 text-sm mt-0.5">{item.done ? '✅' : sprint.status === 'active' ? '🔄' : '⬜'}</span>
                        <span className={`text-sm ${item.done ? 'text-zinc-500 line-through' : sprint.status === 'planned' ? 'text-zinc-500' : 'text-zinc-300'}`}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Total progress */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
              {(() => {
                const all = SPRINT_PLAN.flatMap(s => s.items);
                const done = all.filter(i => i.done).length;
                const pct = Math.round((done / all.length) * 100);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300 font-medium">Progression totale</span>
                      <span className="font-black text-zinc-300">{done} / {all.length} ({pct}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-amber-400 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── CONTENT QUEUE ─────────────────────────────────────────────────────── */}
        {activeTab === 'contentqueue' && (() => {
          const CQ_KEY = 'jk_content_queue_v1';
          const TYPE_COLORS = {
            Monster: 'bg-rose-600/30 border-rose-500/50 text-rose-200',
            Weapon: 'bg-amber-600/30 border-amber-500/50 text-amber-200',
            Companion: 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200',
            Relic: 'bg-violet-600/30 border-violet-500/50 text-violet-200',
            Artifact: 'bg-cyan-600/30 border-cyan-500/50 text-cyan-200',
            Event: 'bg-orange-600/30 border-orange-500/50 text-orange-200',
          };
          const RARITY_BADGE = {
            Common: 'bg-zinc-700 text-zinc-300',
            Rare: 'bg-blue-700/50 text-blue-200',
            Epic: 'bg-violet-700/50 text-violet-200',
            Legendary: 'bg-amber-700/50 text-amber-200',
          };

          function saveQueue(next) {
            localStorage.setItem(CQ_KEY, JSON.stringify(next));
            setContentQueue(next);
          }

          function addEntry() {
            if (!cqForm.date || !cqForm.name.trim()) return;
            const entry = { id: Date.now(), ...cqForm, name: cqForm.name.trim() };
            saveQueue([...contentQueue, entry].sort((a, b) => a.date.localeCompare(b.date)));
            setCqForm({ date: '', type: 'Monster', name: '', rarity: 'Common', notes: '' });
          }

          function deleteEntry(id) {
            saveQueue(contentQueue.filter(e => e.id !== id));
          }

          function exportQueue() {
            const blob = new Blob([JSON.stringify(contentQueue, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = `diejungle-content-queue-${Date.now()}.json`; a.click();
          }

          // Group by ISO week
          function getWeekLabel(dateStr) {
            const d = new Date(dateStr);
            const jan4 = new Date(d.getFullYear(), 0, 4);
            const startOfWeek = new Date(jan4);
            startOfWeek.setDate(jan4.getDate() - jan4.getDay() + 1);
            const weekNum = Math.ceil(((d - startOfWeek) / 86400000 + 1) / 7);
            return `Week ${weekNum} · ${d.getFullYear()}`;
          }

          const grouped = contentQueue.reduce((acc, entry) => {
            const wk = getWeekLabel(entry.date);
            if (!acc[wk]) acc[wk] = [];
            acc[wk].push(entry);
            return acc;
          }, {});

          return (
            <div className="space-y-6">
              {/* Tutorial */}
              <div className="rounded-xl border border-cyan-700/50 bg-cyan-900/20 p-4 text-sm text-cyan-200">
                <div className="font-bold mb-1">📅 Content Release Queue</div>
                <p className="text-xs text-cyan-300/80">Schedule content releases. Entries here are a planning tool — they don't automatically enable content in-game. Use this to pipeline a year of content releases and coordinate with your team.</p>
              </div>

              {/* Add form */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                <h2 className="text-lg font-semibold">➕ Add Release</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={cqForm.date}
                      onChange={e => setCqForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Type</label>
                    <select
                      value={cqForm.type}
                      onChange={e => setCqForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                    >
                      {['Monster', 'Weapon', 'Companion', 'Relic', 'Artifact', 'Event'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={cqForm.name}
                      onChange={e => setCqForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Void Serpent"
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Rarity</label>
                    <select
                      value={cqForm.rarity}
                      onChange={e => setCqForm(f => ({ ...f, rarity: e.target.value }))}
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none"
                    >
                      {['Common', 'Rare', 'Epic', 'Legendary'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-zinc-400 mb-1">Notes (optional)</label>
                    <textarea
                      value={cqForm.notes}
                      onChange={e => setCqForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      placeholder="Design notes, dependencies, art status..."
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addEntry}
                    disabled={!cqForm.date || !cqForm.name.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-bold"
                  >
                    ➕ Add to Queue
                  </button>
                  <button onClick={exportQueue} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium">
                    📤 Export JSON
                  </button>
                </div>
              </div>

              {/* Upcoming releases grouped by week */}
              <div className="space-y-4">
                {contentQueue.length === 0 ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500 text-sm">
                    No releases scheduled yet. Add your first entry above.
                  </div>
                ) : (
                  Object.entries(grouped).map(([week, entries]) => (
                    <div key={week} className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                      <div className="px-4 py-2 bg-zinc-800/60 text-xs font-bold text-zinc-300 border-b border-zinc-700">{week}</div>
                      <div className="divide-y divide-zinc-800">
                        {entries.map(entry => (
                          <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                            <div className="text-xs text-zinc-500 w-20 shrink-0 pt-0.5">{entry.date}</div>
                            <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold ${TYPE_COLORS[entry.type] || 'bg-zinc-700 border-zinc-600 text-zinc-300'}`}>
                              {entry.type}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-zinc-100">{entry.name}</span>
                                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${RARITY_BADGE[entry.rarity] || 'bg-zinc-700 text-zinc-300'}`}>
                                  {entry.rarity}
                                </span>
                              </div>
                              {entry.notes && <div className="text-xs text-zinc-500 mt-0.5 truncate">{entry.notes}</div>}
                            </div>
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="shrink-0 rounded px-2 py-1 text-xs text-zinc-500 hover:bg-rose-900/40 hover:text-rose-400 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
