import React, { useEffect, useMemo, useState, useRef } from 'react';

// ─── Storage Keys (must match game) ──────────────────────────────────────────
const META_KEY = 'jk_meta_progression_v1';
const GAME_KEY = 'jungle_kabal_run_state_v1';
const LB_KEY = 'jungle_kabal_leaderboard_v1';
const CHANGELOG_KEY = 'jungle_kabal_changelog_v1';
const GL_PROFILES_KEY = 'jungle_kabal_gl_profiles_v1';
const TUTORIAL_KEY = 'jk_tutorial_seen_v1';

function readChangelog() {
  try { return JSON.parse(localStorage.getItem(CHANGELOG_KEY) || '[]'); } catch { return []; }
}
function appendChangelog(entry) {
  const log = readChangelog();
  log.unshift({ ...entry, ts: new Date().toISOString() });
  localStorage.setItem(CHANGELOG_KEY, JSON.stringify(log.slice(0, 50)));
}
function readGLProfiles() {
  try { return JSON.parse(localStorage.getItem(GL_PROFILES_KEY) || '{}'); } catch { return {}; }
}
function saveGLProfile(name, gameLogic) {
  const profiles = readGLProfiles();
  profiles[name] = { gameLogic, savedAt: new Date().toISOString() };
  localStorage.setItem(GL_PROFILES_KEY, JSON.stringify(profiles));
}

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

const ALL_ACHIEVEMENTS = ['zone1_boss_first', 'zone2_boss_first', 'zone3_boss_first', 'zone4_boss_first'];

// ─── Test Presets ─────────────────────────────────────────────────────────────
const PRESETS = {
  level1: {
    label: 'Level 1 — Fresh Start',
    description: 'Completely fresh: no unlocks, no XP, no gems. Exactly what a new player sees.',
    emoji: '🌱',
    color: 'emerald',
    meta: {
      xp: 0, gems: 0, unlockedIds: [], achievements: [],
      totalRuns: 0, totalKills: 0, bestScore: 0,
    },
  },
  levelXX: {
    label: 'Level XX — Everything Unlocked',
    description: 'All companions, both weapon slots, KKM, dice specials, lane bonuses. Max progression.',
    emoji: '🏆',
    color: 'amber',
    meta: {
      xp: 5000, gems: 1500, unlockedIds: ALL_UNLOCK_IDS,
      achievements: ALL_ACHIEVEMENTS, totalRuns: 42, totalKills: 280, bestScore: 18500,
    },
  },
  midGame: {
    label: 'Mid Game — Zone 2 Clear',
    description: 'KKM unlocked + weapon slot 1 + dice specials + lane bonuses. No companions yet.',
    emoji: '⚔️',
    color: 'blue',
    meta: {
      xp: 900, gems: 200,
      unlockedIds: ['character_kkm', 'weapon_slot_1', 'dice_specials', 'lane_bonuses'],
      achievements: ['zone1_boss_first', 'zone2_boss_first'],
      totalRuns: 8, totalKills: 52, bestScore: 4200,
    },
  },
};

// ─── Difficulty presets ───────────────────────────────────────────────────────
const DIFFICULTY_PRESETS = {
  1: { label: 'Easy', skulls: '💀', scale: 0.7 },
  2: { label: 'Normal', skulls: '💀💀', scale: 1.0 },
  3: { label: 'Hard', skulls: '💀💀💀', scale: 1.3 },
  4: { label: 'Extreme', skulls: '💀💀💀💀', scale: 1.7 },
  5: { label: 'NIGHTMARE', skulls: '💀💀💀💀💀', scale: 2.2 },
};

const DIFFICULTY_KEYS = [
  'enemyHpScale', 'enemyDamageScale', 'waveGrowthPerStage',
  'bossHpMultiplier', 'bossDamageMultiplier', 'eventIntensityScale',
  'critChance', 'critMultiplier', 'dodgeChance', 'lifeSteal',
  'dropRateMultiplier', 'rerollCostScore',
];

// ─── Asset Schema ─────────────────────────────────────────────────────────────
const ASSET_SCHEMA = {
  monsters: ['mob', 'champions', 'boss'],
  backgrounds: ['jungle', 'ruins', 'temple'],
  zones: ['general'],
  events: ['general'],
};

// ─── Sound Schema ─────────────────────────────────────────────────────────────
const SOUND_SCHEMA = {
  DICE: [
    { id: 'roll_dice', name: 'Roll Dice', desc: 'Main dice roll sound', maxKB: 200, idealKB: 80 },
    { id: 'reroll_dice', name: 'Reroll Dice', desc: 'Reroll sound', maxKB: 150, idealKB: 60 },
    { id: 'place_die', name: 'Place Die', desc: 'Die placed on slot', maxKB: 100, idealKB: 40 },
    { id: 'special_pierce', name: 'Special: Pierce', desc: 'Pierce die special', maxKB: 150, idealKB: 60 },
    { id: 'special_echo', name: 'Special: Echo', desc: 'Echo die special', maxKB: 150, idealKB: 60 },
    { id: 'special_nurture', name: 'Special: Nurture', desc: 'Nurture die special', maxKB: 150, idealKB: 60 },
    { id: 'special_fortress', name: 'Special: Fortress', desc: 'Fortress die special', maxKB: 150, idealKB: 60 },
  ],
  COMBAT: [
    { id: 'hit_normal', name: 'Hit Normal', desc: 'Normal hit', maxKB: 100, idealKB: 40 },
    { id: 'hit_crit', name: 'Hit Critical', desc: 'Critical hit', maxKB: 150, idealKB: 60 },
    { id: 'hit_miss', name: 'Hit Miss', desc: 'Miss/dodge', maxKB: 100, idealKB: 40 },
    { id: 'player_hurt', name: 'Player Hurt', desc: 'Player takes damage', maxKB: 150, idealKB: 60 },
    { id: 'player_death', name: 'Player Death', desc: 'Player death', maxKB: 300, idealKB: 120 },
    { id: 'enemy_death', name: 'Enemy Defeated', desc: 'Enemy defeated', maxKB: 200, idealKB: 80 },
    { id: 'boss_appear', name: 'Boss Entrance', desc: 'Boss entrance', maxKB: 500, idealKB: 200 },
    { id: 'combo_surge', name: 'SURGE Combo', desc: 'SURGE combo trigger', maxKB: 200, idealKB: 80 },
  ],
  WEAPONS: [
    { id: 'weapon_slash', name: 'Slash Attack', desc: 'Slash weapon attack', maxKB: 150, idealKB: 60 },
    { id: 'weapon_magic', name: 'Magic Attack', desc: 'Magic staff attack', maxKB: 150, idealKB: 60 },
    { id: 'weapon_shield', name: 'Shield Block', desc: 'Shield block', maxKB: 150, idealKB: 60 },
    { id: 'weapon_totem', name: 'Ka Totem', desc: 'Ka Totem activation', maxKB: 200, idealKB: 80 },
    { id: 'weapon_cannon', name: 'Chrome Cannon', desc: 'Chrome cannon fire', maxKB: 200, idealKB: 80 },
    { id: 'weapon_venom', name: 'Venom Fang', desc: 'Venom fang strike', maxKB: 150, idealKB: 60 },
    { id: 'companion_ability', name: 'Companion Ability', desc: 'Companion ability use', maxKB: 200, idealKB: 80 },
  ],
  REWARDS: [
    { id: 'coin_collect', name: 'Coin Collect', desc: 'Coins collected', maxKB: 100, idealKB: 40 },
    { id: 'gem_collect', name: 'Gem Collect', desc: 'Gem collected', maxKB: 150, idealKB: 60 },
    { id: 'artifact_pickup', name: 'Artifact Pickup', desc: 'Artifact reward', maxKB: 300, idealKB: 120 },
    { id: 'level_up', name: 'Level Up', desc: 'Level up / XP milestone', maxKB: 300, idealKB: 120 },
    { id: 'unlock_new', name: 'New Unlock', desc: 'New unlock earned', maxKB: 400, idealKB: 150 },
  ],
  MAP: [
    { id: 'node_select', name: 'Node Select', desc: 'Node selected on map', maxKB: 100, idealKB: 40 },
    { id: 'zone_enter', name: 'Zone Enter', desc: 'Entering new zone', maxKB: 200, idealKB: 80 },
    { id: 'zone_clear', name: 'Zone Clear', desc: 'Zone cleared', maxKB: 300, idealKB: 120 },
    { id: 'shop_open', name: 'Shop Open', desc: 'Shop node opened', maxKB: 150, idealKB: 60 },
    { id: 'rest_camp', name: 'Rest Camp', desc: 'Rest camp entered', maxKB: 200, idealKB: 80 },
    { id: 'event_trigger', name: 'Event Trigger', desc: 'Random event triggered', maxKB: 200, idealKB: 80 },
  ],
  MUSIC: [
    { id: 'bgm_jungle', name: 'Jungle Ambient', desc: 'Jungle ambient loop', maxKB: 3000, idealKB: 1000 },
    { id: 'bgm_combat', name: 'Combat Music', desc: 'Combat music loop', maxKB: 3000, idealKB: 1200 },
    { id: 'bgm_boss', name: 'Boss Battle', desc: 'Boss battle music', maxKB: 4000, idealKB: 1500 },
    { id: 'bgm_victory', name: 'Victory Fanfare', desc: 'Victory fanfare', maxKB: 2000, idealKB: 800 },
    { id: 'bgm_gameover', name: 'Game Over', desc: 'Game over', maxKB: 2000, idealKB: 800 },
    { id: 'bgm_menu', name: 'Main Menu', desc: 'Main menu music', maxKB: 3000, idealKB: 1000 },
  ],
};

// ─── Narrative Arcs ────────────────────────────────────────────────────────────
const NARRATIVE_ARCS = [
  'The Awakening',
  'The Jungle Depths',
  'Ancient Ruins',
  'The Temple',
  'Dark Ritual',
  "Ka's Wrath",
];

// ─── XP Levels ─────────────────────────────────────────────────────────────────
const DEFAULT_XP_THRESHOLDS = [
  100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250,
  3850, 4500, 5200, 5950, 6750, 7600, 8500, 9450, 10450, 11500,
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'onboarding', label: '🧭 Onboarding' },
  { id: 'ops', label: '🎮 OPS' },
  { id: 'difficulty', label: '💀 Difficulty' },
  { id: 'pool', label: '🎱 Pool' },
  { id: 'visuals', label: '🌿 Visuals' },
  { id: 'enemies', label: '👹 Enemies' },
  { id: 'artifacts', label: '💎 Artifacts' },
  { id: 'events', label: '🎲 Events' },
  { id: 'characters', label: '🎭 Characters' },
  { id: 'narrative', label: '📖 Narrative' },
  { id: 'assets', label: '🖼️ Assets' },
  { id: 'metaxp', label: '📈 Meta XP' },
  { id: 'roadmap', label: '🗺️ Roadmap' },
  { id: 'sprint', label: '🏃 Sprint' },
  { id: 'docs', label: '📚 Docs' },
  { id: 'sound', label: '🎵 Sound' },
  { id: 'brand', label: '🎨 Brand Kit' },
  { id: 'deploy', label: '🚀 Deploy' },
  { id: 'testgame', label: '🕹️ Test Game' },
  { id: 'advanced', label: '🔬 Advanced' },
];

// ─── Roadmap Data ─────────────────────────────────────────────────────────────
const ROADMAP = [
  {
    section: '✅ Done',
    color: 'emerald',
    items: [
      { label: 'Core roguelite combat loop (roll → place → resolve)', done: true },
      { label: 'Zone-based branching map with fog of war', done: true },
      { label: 'Shop, event, rest nodes on map', done: true },
      { label: 'Meta progression system (XP + gems + unlock tree)', done: true },
      { label: 'Companion system (Gecko 🦎, Croak 🐊, L\'Oeil 👁️)', done: true },
      { label: 'Special dice faces: Pierce, Echo, Nurture, Fortress', done: true },
      { label: 'SURGE mechanic (3 same type → bonus)', done: true },
      { label: 'Lane conditionals (top heal → reset CD, bot → coins, mid 2x → +5)', done: true },
      { label: 'Enemy intents + modifiers (venom, thorns, regen, berserk, stoneSkin, swift)', done: true },
      { label: '2 playable characters (Kabalian + KKM with stats)', done: true },
      { label: 'Score system + leaderboard (local)', done: true },
      { label: 'Telegram SDK integration (init, user, expand)', done: true },
      { label: 'Run ticket mechanic (invite → tickets)', done: true },
      { label: 'Web mirror at /diejungle', done: true },
      { label: 'Admin panel (assets, game logic, narrative)', done: true },
      { label: 'Backend API (config, assets, runs, referrals, leaderboard)', done: true },
    ],
  },
  {
    section: '🔧 In Progress / Next Sprint',
    color: 'amber',
    items: [
      { label: 'Companion active ability button in combat UI (Hypnose / Leap / Vision)', done: false },
      { label: 'Companion selection screen before run start', done: false },
      { label: 'Weapon system — equip weapons with passives + specials in combat', done: false },
      { label: 'KKM character properly gated by meta unlock (character_kkm)', done: false },
      { label: 'Meta XP/gems awarded at run end (recordRunEnd wired to game)', done: false },
      { label: 'Profile/unlock screen (spend gems, view unlock tree)', done: false },
      { label: 'Fortress shield persistence across turns', done: false },
    ],
  },
  {
    section: '📋 Backlog',
    color: 'zinc',
    items: [
      { label: 'Daily seed run (same seed for all players that day)', done: false },
      { label: 'Run telemetry pipeline (start, turn, death cause, score)', done: false },
      { label: 'Share card generator (zone + score + build + referral CTA)', done: false },
      { label: 'Friend leaderboard (global + social graph)', done: false },
      { label: 'Seasons with limited relic pool and season badges', done: false },
      { label: 'Visual FX polish — hit flash, impact rings, lane-aware emitters', done: false },
      { label: 'Special dice faces visual badge on die face card', done: false },
      { label: 'Daily missions v2 (+shards/reroll credits/backend sync)', done: false },
      { label: 'Server-side score verification / anti-cheat', done: false },
      { label: 'Mobile safe-area adjustment for Telegram in-app browser', done: false },
      { label: 'LiveOps panel (missions, boosts, referral multipliers)', done: false },
      { label: 'Boss zone 4 — full enemy pool', done: false },
    ],
  },
];


// ─── Brand Colors ─────────────────────────────────────────────────────────────
const BRAND_COLORS = [
  { name: 'Primary Gold', hex: '#F59E0B' },
  { name: 'Deep Jungle', hex: '#052E16' },
  { name: 'Bone White', hex: '#F5F0E8' },
  { name: 'Blood Red', hex: '#DC2626' },
  { name: 'Mystic Purple', hex: '#7C3AED' },
  { name: 'Shadow Black', hex: '#0A0A0A' },
  { name: 'Accent Cyan', hex: '#06B6D4' },
];

// ─── Empty Config ─────────────────────────────────────────────────────────────
const EMPTY_CONFIG = {
  assets: {
    monsters: { mob: [], champions: [], boss: [] },
    backgrounds: { jungle: [], ruins: [], temple: [] },
    zones: { general: [] },
    events: { general: [] },
  },
  gameLogic: {
    enemyHpScale: 1, enemyDamageScale: 1, scoreScale: 1,
    randomEventChance: 0.2, waveGrowthPerStage: 0.12,
    bossHpMultiplier: 2.4, bossDamageMultiplier: 1.8,
    critChance: 0.12, critMultiplier: 1.75, dodgeChance: 0.08,
    lifeSteal: 0.05, shieldDecayPerTurn: 0.15, comboWindowTurns: 2,
    rerollCostScore: 20, reviveHpRatio: 0.35, eventIntensityScale: 1,
    dropRateMultiplier: 1,
  },
  randomEvents: [],
  visuals: { backgroundUrl: '', logoUrl: '', storyFragmentImageUrl: '' },
  characters: { playable: {}, emotionUrls: {} },
  narrative: { kabalian: [], kkm: [] },
  adminBacklog: [],
  monsters: { traitsCatalog: [], customMonsters: [] },
  artifacts: { customArtifacts: [] },
  assetsMeta: {},
  sounds: {},
  brandKit: { tagline: '', elevatorPitch: '', keyMessages: ['', '', ''], hashtags: '' },
  sprintItems: [],
  narrativeArcs: {},
  xpThresholds: DEFAULT_XP_THRESHOLDS,
  xpGemCosts: Array(20).fill(0),
  xpLevelRewards: Array(20).fill(''),
  runRewards: { baseXp: 50, xpPerKill: 10, xpPerZone: 80, baseGems: 5, gemsPerBoss: 20, bonusGemsOnWin: 50 },
  npcEncounters: [],
  restCamp: { healPercent: 30, bonusXp: 50, specialEvents: [] },
  pools: {
    artifactWeights: { gray: 4, gold: 3, chrome: 1 },
    starterWeights: { gray: 6, gold: 3, chrome: 1 },
    shopItemEnabled: {},
    mapNodeWeights: { combat: 3, shop: 1, rest: 1, event: 1 },
  },
  featureFlags: {
    kkm_gating: true,
    tutorial_enabled: true,
    wallet_button: false,
    companion_select_screen: true,
    daily_login_enabled: true,
    biome_backgrounds: true,
    post_combat_loot: false,
    boss_artifact_reward: false,
    mana_system: false,
  },
  biomeBackgrounds: {
    jungle: ['', '', '', ''],
    ruins: ['', '', '', ''],
    temple: ['', '', '', ''],
    abyss: ['', '', '', ''],
  },
  dailyLogin: {
    enabled: true,
    rewards: [
      { day: 1, gems: 10, tickets: 0, label: 'Daily Gem' },
      { day: 2, gems: 15, tickets: 0, label: 'Daily Gem' },
      { day: 3, gems: 20, tickets: 0, label: 'Daily Gem' },
      { day: 4, gems: 25, tickets: 0, label: 'Daily Gem' },
      { day: 5, gems: 30, tickets: 0, label: 'Daily Gem' },
      { day: 6, gems: 40, tickets: 0, label: 'Daily Gem' },
      { day: 7, gems: 80, tickets: 1, label: '🏆 Week 1 Bonus' },
      { day: 14, gems: 150, tickets: 2, label: '🏆 Week 2 Bonus' },
      { day: 30, gems: 400, tickets: 3, label: '👑 Month Streak' },
    ],
  },
  releaseNotes: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed reading file'));
    reader.readAsDataURL(file);
  });
}

function ensureStructuredAssets(rawAssets = {}) {
  const out = { ...EMPTY_CONFIG.assets };
  Object.entries(ASSET_SCHEMA).forEach(([category, subcats]) => {
    const current = rawAssets?.[category];
    if (Array.isArray(current)) {
      out[category] = { [subcats[0]]: current };
      return;
    }
    const nested = {};
    subcats.forEach((sub) => {
      nested[sub] = Array.isArray(current?.[sub]) ? current[sub] : [];
    });
    out[category] = nested;
  });
  return out;
}

function withDefaults(raw = {}) {
  return {
    ...EMPTY_CONFIG,
    ...raw,
    assets: ensureStructuredAssets(raw.assets || {}),
    gameLogic: { ...EMPTY_CONFIG.gameLogic, ...(raw.gameLogic || {}) },
    visuals: { ...EMPTY_CONFIG.visuals, ...(raw.visuals || {}) },
    characters: {
      playable: { ...(raw.characters?.playable || {}) },
      emotionUrls: { ...(raw.characters?.emotionUrls || {}) },
    },
    narrative: {
      kabalian: Array.isArray(raw.narrative?.kabalian) ? raw.narrative.kabalian : [],
      kkm: Array.isArray(raw.narrative?.kkm) ? raw.narrative.kkm : [],
    },
    monsters: {
      traitsCatalog: Array.isArray(raw.monsters?.traitsCatalog) ? raw.monsters.traitsCatalog : [],
      customMonsters: Array.isArray(raw.monsters?.customMonsters) ? raw.monsters.customMonsters : [],
    },
    artifacts: {
      customArtifacts: Array.isArray(raw.artifacts?.customArtifacts) ? raw.artifacts.customArtifacts : [],
    },
    adminBacklog: Array.isArray(raw.adminBacklog) ? raw.adminBacklog : [],
    assetsMeta: raw.assetsMeta && typeof raw.assetsMeta === 'object' ? raw.assetsMeta : {},
    sounds: raw.sounds && typeof raw.sounds === 'object' ? raw.sounds : {},
    brandKit: { ...EMPTY_CONFIG.brandKit, ...(raw.brandKit || {}) },
    sprintItems: Array.isArray(raw.sprintItems) ? raw.sprintItems : [],
    narrativeArcs: raw.narrativeArcs && typeof raw.narrativeArcs === 'object' ? raw.narrativeArcs : {},
    xpThresholds: Array.isArray(raw.xpThresholds) ? raw.xpThresholds : DEFAULT_XP_THRESHOLDS,
    xpGemCosts: Array.isArray(raw.xpGemCosts) ? raw.xpGemCosts : Array(20).fill(0),
    xpLevelRewards: Array.isArray(raw.xpLevelRewards) ? raw.xpLevelRewards : Array(20).fill(''),
    runRewards: { ...EMPTY_CONFIG.runRewards, ...(raw.runRewards || {}) },
    npcEncounters: Array.isArray(raw.npcEncounters) ? raw.npcEncounters : [],
    restCamp: { ...EMPTY_CONFIG.restCamp, ...(raw.restCamp || {}) },
    pools: {
      artifactWeights: { ...EMPTY_CONFIG.pools.artifactWeights, ...(raw.pools?.artifactWeights || {}) },
      starterWeights: { ...EMPTY_CONFIG.pools.starterWeights, ...(raw.pools?.starterWeights || {}) },
      shopItemEnabled: raw.pools?.shopItemEnabled && typeof raw.pools.shopItemEnabled === 'object' ? raw.pools.shopItemEnabled : {},
      mapNodeWeights: { ...EMPTY_CONFIG.pools.mapNodeWeights, ...(raw.pools?.mapNodeWeights || {}) },
    },
    featureFlags: { ...EMPTY_CONFIG.featureFlags, ...(raw.featureFlags || {}) },
    biomeBackgrounds: {
      jungle: Array.isArray(raw.biomeBackgrounds?.jungle) ? raw.biomeBackgrounds.jungle : ['', '', '', ''],
      ruins: Array.isArray(raw.biomeBackgrounds?.ruins) ? raw.biomeBackgrounds.ruins : ['', '', '', ''],
      temple: Array.isArray(raw.biomeBackgrounds?.temple) ? raw.biomeBackgrounds.temple : ['', '', '', ''],
      abyss: Array.isArray(raw.biomeBackgrounds?.abyss) ? raw.biomeBackgrounds.abyss : ['', '', '', ''],
    },
    dailyLogin: {
      enabled: raw.dailyLogin?.enabled !== undefined ? raw.dailyLogin.enabled : true,
      rewards: Array.isArray(raw.dailyLogin?.rewards) ? raw.dailyLogin.rewards : EMPTY_CONFIG.dailyLogin.rewards,
    },
    releaseNotes: typeof raw.releaseNotes === 'string' ? raw.releaseNotes : '',
  };
}

// ─── Meta Progression Reader ──────────────────────────────────────────────────
function readLocalMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

// ─── Small reusable components ────────────────────────────────────────────────
function MetaStatusBadge({ id, meta }) {
  const unlocked = meta?.unlockedIds?.includes(id);
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${unlocked ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
      {unlocked ? '✅ Unlocked' : '🔒 Locked'}
    </span>
  );
}

function JsonEditor({ label, value, onSave, rows = 12 }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  useEffect(() => setText(JSON.stringify(value, null, 2)), [value]);
  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-300 font-medium">{label}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={rows}
        className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-200"
      />
      <button
        onClick={() => { try { const parsed = JSON.parse(text); onSave(parsed); } catch(e) { alert('Invalid JSON: ' + e.message); } }}
        className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-sm font-medium"
      >
        Save {label}
      </button>
    </div>
  );
}

function SectionCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4 ${className}`}>
      {title && <h2 className="text-xl font-semibold text-amber-200">{title}</h2>}
      {children}
    </div>
  );
}

function AmberBtn({ onClick, children, className = '', disabled = false, variant = 'primary' }) {
  const base = 'px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50';
  const variants = {
    primary: 'bg-amber-600 hover:bg-amber-500 text-black',
    secondary: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200 border border-zinc-600',
    danger: 'bg-rose-700 hover:bg-rose-600 text-white',
    ghost: 'text-amber-400 hover:text-amber-300 hover:bg-amber-400/10',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-amber-500/50 bg-zinc-900 px-4 py-3 text-sm text-amber-200 shadow-xl">
      {message}
    </div>
  );
}


// ─── Main Component ───────────────────────────────────────────────────────────
export default function DieInTheJungleAdmin() {
  const [activeTab, setActiveTab] = useState('ops');
  const [category, setCategory] = useState('monsters');
  const [subcategory, setSubcategory] = useState('mob');
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [localMeta, setLocalMeta] = useState(null);
  const [presetApplied, setPresetApplied] = useState(null);
  const [toast, setToast] = useState('');

  // Assets state
  const [pendingFiles, setPendingFiles] = useState([]);
  const [pendingPreviews, setPendingPreviews] = useState([]);

  // Events sub-tab
  const [eventsSubTab, setEventsSubTab] = useState('random');

  // New enemy form
  const [newEnemy, setNewEnemy] = useState({ name: '', hp: 100, damage: 10, type: 'mob', traits: '', imageUrl: '' });
  // New artifact form
  const [newArtifact, setNewArtifact] = useState({ name: '', emoji: '🔮', description: '', rarity: 'common', passive: '' });
  // New random event form
  const [newEvent, setNewEvent] = useState({ title: '', description: '', choices: ['', ''] });
  // New NPC form
  const [newNPC, setNewNPC] = useState({ name: '', image: '', dialogue: [''] });
  // Sprint note
  const [sprintNotes, setSprintNotes] = useState('');
  // New sprint item
  const [newSprintItem, setNewSprintItem] = useState('');
  // Roadmap collapsed
  const [roadmapCollapsed, setRoadmapCollapsed] = useState({ 0: false, 1: false, 2: false });
  // New backlog item
  const [newBacklogItem, setNewBacklogItem] = useState('');
  // Narrative arc being edited
  const [activeArc, setActiveArc] = useState(0);
  // Logo/brand uploads
  const [brandLogos, setBrandLogos] = useState({ main: '', icon: '', horizontal: '' });
  // Difficulty master
  const [difficultyMaster, setDifficultyMaster] = useState(2);
  // Characters sub-tab
  const [activeCharacter, setActiveCharacter] = useState('kabalian');
  // Changelog
  const [changelog, setChangelog] = useState(() => readChangelog());
  const [changelogNote, setChangelogNote] = useState('');
  // GL Profiles
  const [glProfiles, setGlProfiles] = useState(() => readGLProfiles());
  const [newProfileName, setNewProfileName] = useState('');
  // Deploy tab
  const [deployNotes, setDeployNotes] = useState('');

  const availableSubcategories = ASSET_SCHEMA[category] || ['general'];

  useEffect(() => {
    if (!availableSubcategories.includes(subcategory)) {
      setSubcategory(availableSubcategories[0]);
    }
  }, [availableSubcategories, subcategory]);

  const assetBucket = useMemo(() => {
    const assets = ensureStructuredAssets(config.assets || {});
    return assets?.[category]?.[subcategory] || [];
  }, [config.assets, category, subcategory]);

  function refreshLocalMeta() { setLocalMeta(readLocalMeta()); }

  useEffect(() => {
    refreshLocalMeta();
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setStatus('Loading...');
    try {
      const res = await fetch('/api/miniapp/config');
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Load failed');
      setConfig(withDefaults(payload.config || EMPTY_CONFIG));
      setStatus('✅ Config loaded');
    } catch (error) {
      setStatus('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(nextConfig) {
    setLoading(true);
    setStatus('Saving...');
    try {
      const res = await fetch('/api/miniapp/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Save failed');
      setConfig(withDefaults(payload.config || nextConfig));
      setStatus('✅ Config saved');
      appendChangelog({ tab: activeTab, action: 'Config saved', note: changelogNote || '' });
      setChangelog(readChangelog());
      if (changelogNote) setChangelogNote('');
    } catch (error) {
      setStatus('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function onUpload(event) {
    const files = Array.from(event.target.files || []).slice(0, 30);
    if (!files.length) return;
    const previews = await Promise.all(files.map(async (f) => ({ name: f.name, dataUrl: await toDataUrl(f), file: f })));
    setPendingFiles(files);
    setPendingPreviews(previews);
    event.target.value = '';
  }

  async function confirmUpload() {
    if (!pendingFiles.length) return;
    setLoading(true);
    setStatus('Uploading ' + pendingFiles.length + ' file(s)...');
    try {
      const prepared = await Promise.all(pendingPreviews.map(async (p) => ({ name: p.name, dataUrl: p.dataUrl })));
      const res = await fetch('/api/miniapp/assets/upload-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subcategory, files: prepared }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Upload failed');
      setConfig(withDefaults(payload.config || config));
      setStatus('✅ ' + (payload.uploaded?.length || pendingFiles.length) + ' asset(s) uploaded');
      setPendingFiles([]);
      setPendingPreviews([]);
    } catch (error) {
      setStatus('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  function updateLogic(key, value) {
    setConfig((prev) => ({ ...prev, gameLogic: { ...(prev.gameLogic || {}), [key]: Number(value) } }));
  }

  function updateAssetMeta(asset, patch) {
    const key = asset.id || asset.url;
    const current = config.assetsMeta?.[key] || {};
    setConfig({ ...config, assetsMeta: { ...(config.assetsMeta || {}), [key]: { ...current, ...patch } } });
  }

  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    localStorage.setItem(META_KEY, JSON.stringify(preset.meta));
    localStorage.removeItem(GAME_KEY);
    setPresetApplied(presetKey);
    refreshLocalMeta();
  }

  function clearGameState() {
    localStorage.removeItem(GAME_KEY);
    localStorage.removeItem(LB_KEY);
    setStatus('✅ Game state cleared');
  }

  function clearAllLocalStorage() {
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(GAME_KEY);
    localStorage.removeItem(LB_KEY);
    setPresetApplied(null);
    refreshLocalMeta();
    setStatus('✅ All local storage cleared');
  }

  function exportCurrentMeta() {
    const meta = readLocalMeta();
    if (!meta) { setStatus('⚠️ No meta found'); return; }
    const blob = new Blob([JSON.stringify(meta, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ditj-meta-' + Date.now() + '.json';
    a.click();
  }

  function applyDifficultyPreset(level) {
    setDifficultyMaster(level);
    const scale = DIFFICULTY_PRESETS[level].scale;
    const updates = {};
    DIFFICULTY_KEYS.forEach((k) => { updates[k] = parseFloat((scale * (EMPTY_CONFIG.gameLogic[k] || 1)).toFixed(3)); });
    setConfig((prev) => ({ ...prev, gameLogic: { ...prev.gameLogic, ...updates } }));
  }

  function addEnemy() {
    if (!newEnemy.name.trim()) return;
    const enemy = { ...newEnemy, id: Date.now().toString(), traits: newEnemy.traits.split(',').map(t => t.trim()).filter(Boolean) };
    setConfig((prev) => ({ ...prev, monsters: { ...prev.monsters, customMonsters: [...prev.monsters.customMonsters, enemy] } }));
    setNewEnemy({ name: '', hp: 100, damage: 10, type: 'mob', traits: '', imageUrl: '' });
  }

  function removeEnemy(id) {
    setConfig((prev) => ({ ...prev, monsters: { ...prev.monsters, customMonsters: prev.monsters.customMonsters.filter(e => e.id !== id) } }));
  }

  function addArtifact() {
    if (!newArtifact.name.trim()) return;
    const art = { ...newArtifact, id: Date.now().toString() };
    setConfig((prev) => ({ ...prev, artifacts: { ...prev.artifacts, customArtifacts: [...prev.artifacts.customArtifacts, art] } }));
    setNewArtifact({ name: '', emoji: '🔮', description: '', rarity: 'common', passive: '' });
  }

  function removeArtifact(id) {
    setConfig((prev) => ({ ...prev, artifacts: { ...prev.artifacts, customArtifacts: prev.artifacts.customArtifacts.filter(a => a.id !== id) } }));
  }

  function addRandomEvent() {
    if (!newEvent.title.trim()) return;
    const ev = { ...newEvent, id: Date.now().toString(), choices: newEvent.choices.filter(c => c.trim()) };
    setConfig((prev) => ({ ...prev, randomEvents: [...(prev.randomEvents || []), ev] }));
    setNewEvent({ title: '', description: '', choices: ['', ''] });
  }

  function removeRandomEvent(id) {
    setConfig((prev) => ({ ...prev, randomEvents: (prev.randomEvents || []).filter(e => e.id !== id) }));
  }

  function addNPC() {
    if (!newNPC.name.trim()) return;
    const npc = { ...newNPC, id: Date.now().toString(), dialogue: newNPC.dialogue.filter(d => d.trim()) };
    setConfig((prev) => ({ ...prev, npcEncounters: [...(prev.npcEncounters || []), npc] }));
    setNewNPC({ name: '', image: '', dialogue: [''] });
  }

  function removeNPC(id) {
    setConfig((prev) => ({ ...prev, npcEncounters: (prev.npcEncounters || []).filter(n => n.id !== id) }));
  }

  const [sprintPriority, setSprintPriority] = useState('medium');
  const [enemyFilter, setEnemyFilter] = useState('');

  function addSprintItem() {
    if (!newSprintItem.trim()) return;
    const item = { id: Date.now().toString(), text: newSprintItem.trim(), done: false, priority: sprintPriority };
    setConfig((prev) => ({ ...prev, sprintItems: [...(prev.sprintItems || []), item] }));
    setNewSprintItem('');
  }

  function toggleSprintItem(id) {
    setConfig((prev) => ({ ...prev, sprintItems: (prev.sprintItems || []).map(i => i.id === id ? { ...i, done: !i.done } : i) }));
  }

  function removeSprintItem(id) {
    setConfig((prev) => ({ ...prev, sprintItems: (prev.sprintItems || []).filter(i => i.id !== id) }));
  }

  function getArcLines(arcIdx) {
    const arcName = NARRATIVE_ARCS[arcIdx];
    const arc = config.narrativeArcs?.[arcName] || { lines: Array(33).fill(''), image: '' };
    return arc;
  }

  function updateArcLine(arcIdx, lineIdx, value) {
    const arcName = NARRATIVE_ARCS[arcIdx];
    const arc = getArcLines(arcIdx);
    const newLines = [...arc.lines];
    newLines[lineIdx] = value;
    setConfig((prev) => ({ ...prev, narrativeArcs: { ...(prev.narrativeArcs || {}), [arcName]: { ...arc, lines: newLines } } }));
  }

  function updateArcImage(arcIdx, value) {
    const arcName = NARRATIVE_ARCS[arcIdx];
    const arc = getArcLines(arcIdx);
    setConfig((prev) => ({ ...prev, narrativeArcs: { ...(prev.narrativeArcs || {}), [arcName]: { ...arc, image: value } } }));
  }

  function updateXpThreshold(idx, value) {
    const next = [...(config.xpThresholds || DEFAULT_XP_THRESHOLDS)];
    next[idx] = Number(value);
    setConfig((prev) => ({ ...prev, xpThresholds: next }));
  }

  async function uploadSound(soundId, file) {
    if (!file) return;
    setLoading(true);
    setStatus('Uploading sound...');
    try {
      const dataUrl = await toDataUrl(file);
      const res = await fetch('/api/miniapp/assets/upload-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'sounds', subcategory: 'general', files: [{ name: soundId + '.mp3', dataUrl }] }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Upload failed');
      const url = payload.uploaded?.[0]?.url || '';
      if (url) {
        setConfig((prev) => ({ ...prev, sounds: { ...(prev.sounds || {}), [soundId]: url } }));
      }
      setStatus('✅ Sound uploaded');
    } catch (error) {
      setStatus('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const colorMap = {
    emerald: 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20',
    amber: 'border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20',
    blue: 'border-blue-400/50 bg-blue-400/10 hover:bg-blue-400/20',
  };


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Toast message={toast} onClose={() => setToast('')} />

      {/* Header */}
      <div className="border-b border-amber-900/40 bg-zinc-900/90 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-amber-400">🌴 Die In The Jungle · Admin</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Preview:{' '}
              <a className="text-amber-400 hover:text-amber-300 underline" href="/diejungle" target="_blank" rel="noreferrer">/diejungle</a>
              {' '}&middot; Admin: <span className="text-zinc-400">/diejungle/admin</span>
              {' '}&middot; Telegram:{' '}
              <a className="text-amber-400 hover:text-amber-300 underline" href="http://localhost:5180" target="_blank" rel="noreferrer">localhost:5180</a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadConfig} disabled={loading} className="px-3 py-1.5 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-sm border border-zinc-600">
              🔄 Reload
            </button>
            <button onClick={() => saveConfig(config)} disabled={loading} className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-sm font-bold text-black">
              💾 Save All
            </button>
            {status && <span className="text-sm text-zinc-300 max-w-xs truncate">{status}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tab Bar — scrollable on mobile */}
        <div className="overflow-x-auto">
          <div className="flex gap-1.5 min-w-max pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                    : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            OPS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'ops' && (
          <div className="space-y-6">
            {/* Difficulty Quick Set */}
            <SectionCard title="💀 Difficulty Master (Quick Set)">
              <div className="flex flex-wrap gap-2">
                {Object.entries(DIFFICULTY_PRESETS).map(([lvl, p]) => (
                  <button
                    key={lvl}
                    onClick={() => applyDifficultyPreset(Number(lvl))}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                      difficultyMaster === Number(lvl)
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-amber-500/50'
                    }`}
                  >
                    {p.skulls} {p.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">Sets all difficulty sliders to preset multiplier. You can fine-tune in the Difficulty tab.</p>
            </SectionCard>

            {/* Test Presets */}
            <SectionCard title="🎮 Test Presets">
              <p className="text-zinc-400 text-sm">Apply a preset to localStorage, then open the game to test a specific progression state.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 space-y-3 transition-colors cursor-pointer ${colorMap[preset.color]}`}
                    onClick={() => applyPreset(key)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg">{preset.emoji}</div>
                        <div className="font-bold text-sm mt-1 text-zinc-100">{preset.label}</div>
                      </div>
                      {presetApplied === key && (
                        <span className="text-[10px] bg-emerald-600/50 text-emerald-200 border border-emerald-500/50 rounded px-2 py-0.5 font-bold">APPLIED</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{preset.description}</p>
                    <div className="text-[10px] text-zinc-500 space-y-0.5">
                      <div>XP: {preset.meta.xp} · Gems: {preset.meta.gems}</div>
                      <div>Unlocks: {preset.meta.unlockedIds.length === 0 ? 'none' : preset.meta.unlockedIds.length}</div>
                      <div>Achievements: {preset.meta.achievements.length === 0 ? 'none' : preset.meta.achievements.join(', ')}</div>
                    </div>
                    <button
                      className={`w-full py-2 rounded-lg text-sm font-bold border transition-colors ${
                        preset.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white' :
                        preset.color === 'amber' ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-black' :
                        'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white'
                      }`}
                      onClick={(e) => { e.stopPropagation(); applyPreset(key); }}
                    >
                      Apply Preset
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
                <a href="/diejungle" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-sm font-medium">
                  🎮 Open Game (web)
                </a>
                <a href="http://localhost:5180" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-sm font-medium">
                  📱 Open Telegram Mini App
                </a>
                <button onClick={clearGameState} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium">
                  🗑️ Clear Run State
                </button>
                <button onClick={exportCurrentMeta} className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm font-medium">
                  📤 Export Meta JSON
                </button>
                <button onClick={clearAllLocalStorage} className="px-4 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-sm font-medium">
                  ⚠️ Clear ALL Storage
                </button>
              </div>
            </SectionCard>

            {/* Current Meta State */}
            <SectionCard title="📊 Current localStorage State">
              <div className="flex justify-end">
                <button onClick={refreshLocalMeta} className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1">
                  🔄 Refresh
                </button>
              </div>
              {localMeta ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'XP', value: localMeta.xp ?? 0 },
                      { label: 'Gems 💎', value: localMeta.gems ?? 0 },
                      { label: 'Total Runs', value: localMeta.totalRuns ?? 0 },
                      { label: 'Best Score', value: localMeta.bestScore ?? 0 },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3 text-center">
                        <div className="text-xs text-zinc-400 mb-1">{stat.label}</div>
                        <div className="text-lg font-bold text-amber-300">{stat.value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-sm text-zinc-300 mb-2 font-medium">Unlocks</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ALL_UNLOCK_IDS.map((id) => (
                        <div key={id} className="flex items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2">
                          <span className="text-sm text-zinc-300 font-mono">{id}</span>
                          <MetaStatusBadge id={id} meta={localMeta} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-300 mb-2 font-medium">Achievements</div>
                    <div className="flex flex-wrap gap-2">
                      {ALL_ACHIEVEMENTS.map((ach) => {
                        const has = localMeta.achievements?.includes(ach);
                        return (
                          <span key={ach} className={`px-2 py-1 rounded text-xs border ${has ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-200' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}>
                            {has ? '✅' : '🔒'} {ach}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <details className="rounded-lg border border-zinc-700 bg-zinc-900">
                    <summary className="px-3 py-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-200">Raw JSON</summary>
                    <pre className="px-3 py-2 text-[10px] font-mono text-zinc-300 overflow-auto max-h-40">{JSON.stringify(localMeta, null, 2)}</pre>
                  </details>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">No meta progression found in localStorage. Apply a preset or play a run.</div>
              )}
            </SectionCard>

            {/* Feature Flags */}
            <SectionCard title="🚩 Feature Flags">
              <p className="text-zinc-400 text-sm mb-4">Toggle game features on/off. The game reads these from config on load.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'kkm_gating', label: 'KKM Gating', desc: 'KKM locked until character_kkm is unlocked', badge: 'bug-fix' },
                  { key: 'tutorial_enabled', label: 'Tutorial Mode', desc: 'Show 4-screen tutorial on first run (totalRuns === 0)', badge: 'ux' },
                  { key: 'wallet_button', label: 'Wallet Button', desc: 'Show Solana wallet connect in game UI', badge: 'ui' },
                  { key: 'companion_select_screen', label: 'Companion Select', desc: 'Pre-run companion selection screen', badge: 'feature' },
                  { key: 'daily_login_enabled', label: 'Daily Login', desc: 'Daily streak reward calendar', badge: 'retention' },
                  { key: 'biome_backgrounds', label: 'Biome Backgrounds', desc: 'Change background per zone/biome', badge: 'visual' },
                  { key: 'post_combat_loot', label: 'Post-Combat Loot', desc: 'Loot popup after each mob kill (HP/Mana/Coin)', badge: 'wip' },
                  { key: 'boss_artifact_reward', label: 'Boss Artifact Pick', desc: 'Free artifact choice after boss kill', badge: 'wip' },
                  { key: 'mana_system', label: 'Mana System', desc: 'Mana resource for weapon specials & companion actives', badge: 'wip' },
                ].map(({ key, label, desc, badge }) => {
                  const enabled = config.featureFlags?.[key] !== false;
                  const badgeColor = badge === 'bug-fix' ? 'bg-rose-700/40 text-rose-300' : badge === 'ux' ? 'bg-cyan-700/40 text-cyan-300' : badge === 'retention' ? 'bg-emerald-700/40 text-emerald-300' : badge === 'visual' ? 'bg-violet-700/40 text-violet-300' : badge === 'wip' ? 'bg-zinc-600/40 text-zinc-400' : 'bg-amber-700/40 text-amber-300';
                  return (
                    <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${enabled ? 'border-amber-500/30 bg-amber-500/5' : 'border-zinc-700 bg-zinc-800/30'}`}
                      onClick={() => setConfig(p => ({ ...p, featureFlags: { ...(p.featureFlags || {}), [key]: !enabled } }))}>
                      <div className={`w-9 h-5 rounded-full flex-shrink-0 transition-colors relative ${enabled ? 'bg-amber-500' : 'bg-zinc-600'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-200">{label}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${badgeColor}`}>{badge}</span>
                        </div>
                        <div className="text-xs text-zinc-500 mt-0.5">{desc}</div>
                      </div>
                      <span className={`text-xs font-bold ${enabled ? 'text-emerald-400' : 'text-zinc-600'}`}>{enabled ? 'ON' : 'OFF'}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Flags</AmberBtn>
                <AmberBtn variant="secondary" onClick={() => {
                  localStorage.removeItem(TUTORIAL_KEY);
                  setStatus('✅ Tutorial flag reset — next game open will show tutorial');
                }}>🔄 Reset Tutorial Flag</AmberBtn>
              </div>
            </SectionCard>

            {/* Game Logic Profiles */}
            <SectionCard title="💾 Game Logic Profiles">
              <p className="text-zinc-400 text-sm mb-4">Save named snapshots of the current game logic config. Load them anytime to switch between setups.</p>
              <div className="flex gap-2 mb-4">
                <input
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Profile name (e.g. Easy Playtest)"
                  className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
                <AmberBtn onClick={() => {
                  if (!newProfileName.trim()) return;
                  saveGLProfile(newProfileName.trim(), config.gameLogic);
                  setGlProfiles(readGLProfiles());
                  setNewProfileName('');
                  setStatus('✅ Profile saved: ' + newProfileName.trim());
                }}>💾 Save Current</AmberBtn>
              </div>
              {Object.keys(glProfiles).length === 0 ? (
                <div className="text-zinc-500 text-sm">No profiles saved yet.</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(glProfiles).map(([name, { gameLogic, savedAt }]) => (
                    <div key={name} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-700 bg-zinc-800/40">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-zinc-200">{name}</div>
                        <div className="text-[10px] text-zinc-500">{new Date(savedAt).toLocaleString()}</div>
                      </div>
                      <AmberBtn variant="secondary" onClick={() => {
                        setConfig(p => ({ ...p, gameLogic: { ...p.gameLogic, ...gameLogic } }));
                        setStatus('✅ Profile loaded: ' + name);
                      }}>Load</AmberBtn>
                      <AmberBtn variant="danger" onClick={() => {
                        const p = readGLProfiles();
                        delete p[name];
                        localStorage.setItem(GL_PROFILES_KEY, JSON.stringify(p));
                        setGlProfiles(readGLProfiles());
                      }}>✕</AmberBtn>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Changelog */}
            <SectionCard title="📋 Config Changelog">
              <p className="text-zinc-400 text-sm mb-3">Auto-logged on every save. Add a note to describe what you changed.</p>
              <div className="flex gap-2 mb-3">
                <input
                  value={changelogNote}
                  onChange={(e) => setChangelogNote(e.target.value)}
                  placeholder="Note for next save (e.g. 'Tuned boss HP for playtest')"
                  className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
                <AmberBtn variant="secondary" onClick={() => {
                  if (!changelogNote.trim()) return;
                  appendChangelog({ tab: activeTab, action: 'Manual note', note: changelogNote });
                  setChangelog(readChangelog());
                  setChangelogNote('');
                }}>+ Add Note</AmberBtn>
                <AmberBtn variant="danger" onClick={() => {
                  localStorage.removeItem(CHANGELOG_KEY);
                  setChangelog([]);
                }}>Clear</AmberBtn>
              </div>
              {changelog.length === 0 ? (
                <div className="text-zinc-500 text-sm">No changes logged yet. Start saving configs to build history.</div>
              ) : (
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {changelog.map((entry, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded bg-zinc-800/50 border border-zinc-700/50 text-xs">
                      <span className="text-zinc-600 w-32 shrink-0 font-mono">{new Date(entry.ts).toLocaleString()}</span>
                      <span className="text-amber-400/80 w-20 shrink-0">[{entry.tab}]</span>
                      <span className="text-zinc-300">{entry.action}</span>
                      {entry.note && <span className="text-zinc-500 italic">— {entry.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DIFFICULTY TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'difficulty' && (
          <div className="space-y-6">
            <SectionCard title="💀 Difficulty Master">
              <p className="text-zinc-400 text-sm">Select a difficulty level — this sets all sliders below to preset multipliers.</p>
              <div className="flex flex-wrap gap-3">
                {Object.entries(DIFFICULTY_PRESETS).map(([lvl, p]) => (
                  <button
                    key={lvl}
                    onClick={() => applyDifficultyPreset(Number(lvl))}
                    className={`flex flex-col items-center gap-1 px-6 py-4 rounded-xl border-2 transition-colors font-bold ${
                      difficultyMaster === Number(lvl)
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-amber-500/50'
                    }`}
                  >
                    <span className="text-2xl">{p.skulls}</span>
                    <span className="text-sm">{p.label}</span>
                    <span className="text-xs font-normal text-zinc-500">{p.scale}x</span>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Fine-tune Difficulty">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {DIFFICULTY_KEYS.map((key) => {
                  const val = Number(config.gameLogic?.[key] ?? 0);
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-300 font-medium">{key}</label>
                        <span className="text-amber-400 font-mono text-sm">{val}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={5}
                        step={0.01}
                        value={val}
                        onChange={(e) => updateLogic(key, e.target.value)}
                        className="w-full accent-amber-400"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={val}
                        onChange={(e) => updateLogic(key, e.target.value)}
                        className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>
                  💾 Save Difficulty Settings
                </AmberBtn>
              </div>
            </SectionCard>

            {/* Balance Calculator */}
            <SectionCard title="⚖️ Balance Calculator">
              <p className="text-zinc-400 text-sm mb-4">Estimate Turns-To-Kill (TTK) and survivability given current difficulty settings and typical player stats.</p>
              {(() => {
                const gl = config.gameLogic || {};
                const baseEnemyHp = [25, 40, 65, 100];
                const baseBossHp = [80, 140, 220, 350];
                const playerAvgDmgPerTurn = 12; // approx avg dice output
                const enemyHpScale = gl.enemyHpScale ?? 1;
                const enemyDmgScale = gl.enemyDamageScale ?? 1;
                const bossHpMult = gl.bossHpMultiplier ?? 2.4;
                const bossDmgMult = gl.bossDamageMultiplier ?? 1.8;
                const baseEnemyDmg = [6, 10, 14, 20];
                const playerHp = 30;
                return (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-700 text-zinc-400 text-xs">
                            <th className="text-left py-2 pr-4">Zone</th>
                            <th className="text-left py-2 pr-4">Enemy HP</th>
                            <th className="text-left py-2 pr-4">TTK (Mob)</th>
                            <th className="text-left py-2 pr-4">Enemy DMG/turn</th>
                            <th className="text-left py-2 pr-4">Turns before death</th>
                            <th className="text-left py-2">Boss HP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3, 4].map(zone => {
                            const eHp = Math.round(baseEnemyHp[zone - 1] * enemyHpScale);
                            const ttk = Math.ceil(eHp / playerAvgDmgPerTurn);
                            const eDmg = Math.round(baseEnemyDmg[zone - 1] * enemyDmgScale);
                            const survivalTurns = Math.ceil(playerHp / Math.max(1, eDmg));
                            const bHp = Math.round(baseBossHp[zone - 1] * enemyHpScale * bossHpMult);
                            const bDmg = Math.round(baseEnemyDmg[zone - 1] * enemyDmgScale * bossDmgMult);
                            const danger = survivalTurns <= ttk;
                            return (
                              <tr key={zone} className={`border-b border-zinc-800/60 ${danger ? 'bg-rose-500/5' : 'hover:bg-zinc-800/30'}`}>
                                <td className="py-2 pr-4 font-bold text-amber-400">Zone {zone}</td>
                                <td className="py-2 pr-4 text-zinc-200">{eHp} HP</td>
                                <td className="py-2 pr-4">
                                  <span className={`font-bold ${ttk <= 2 ? 'text-emerald-400' : ttk <= 4 ? 'text-amber-400' : 'text-rose-400'}`}>{ttk}T</span>
                                </td>
                                <td className="py-2 pr-4 text-zinc-200">{eDmg} DMG</td>
                                <td className="py-2 pr-4">
                                  <span className={`font-bold ${survivalTurns >= 5 ? 'text-emerald-400' : survivalTurns >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>{survivalTurns}T {danger ? '⚠️' : ''}</span>
                                </td>
                                <td className="py-2 text-violet-300 font-medium">{bHp} HP · {bDmg} DMG</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-xs text-zinc-500 space-y-1">
                      <div>Assumes player avg <strong className="text-zinc-400">{playerAvgDmgPerTurn} DMG/turn</strong> (standard dice, no SURGE) and <strong className="text-zinc-400">{playerHp} base HP</strong>.</div>
                      <div>⚠️ = enemy likely kills player before player kills enemy. Consider lowering <code className="text-amber-400">enemyDamageScale</code> or <code className="text-amber-400">enemyHpScale</code>.</div>
                    </div>
                  </div>
                );
              })()}
            </SectionCard>
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            ENEMIES TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'enemies' && (
          <div className="space-y-6">
            <SectionCard title="👹 Enemy Pool">
              {/* Search + filter */}
              <div className="flex gap-2 mb-2">
                <input
                  value={enemyFilter}
                  onChange={(e) => setEnemyFilter(e.target.value)}
                  placeholder="Search by name or trait..."
                  className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
                {enemyFilter && <button onClick={() => setEnemyFilter('')} className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 rounded px-2">✕ Clear</button>}
                <div className="flex gap-1">
                  {['all', 'mob', 'champion', 'boss'].map(t => (
                    <button key={t} onClick={() => setEnemyFilter(t === 'all' ? '' : t)}
                      className={`px-2 py-1 rounded text-xs border transition-colors capitalize ${enemyFilter === (t === 'all' ? '' : t) ? 'bg-amber-500/20 border-amber-400/60 text-amber-300' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}>
                      {t === 'all' ? 'All' : t === 'mob' ? '⚔️ Mob' : t === 'champion' ? '🏅 Champion' : '💀 Boss'}
                    </button>
                  ))}
                </div>
              </div>
              {config.monsters.customMonsters.length === 0 ? (
                <p className="text-zinc-500 text-sm">No custom enemies yet. Add one below.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {config.monsters.customMonsters
                    .filter(e => !enemyFilter || e.name?.toLowerCase().includes(enemyFilter.toLowerCase()) || e.type === enemyFilter || (e.traits || []).some(t => t.toLowerCase().includes(enemyFilter.toLowerCase())))
                    .map((enemy) => (
                    <div key={enemy.id} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-2">
                      {enemy.imageUrl && (
                        <img src={enemy.imageUrl} alt={enemy.name} className="w-full h-32 object-cover rounded-lg" />
                      )}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-zinc-100">{enemy.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          enemy.type === 'boss' ? 'bg-rose-700 text-white' :
                          enemy.type === 'champion' ? 'bg-amber-600 text-black' :
                          'bg-zinc-600 text-zinc-200'
                        }`}>{enemy.type}</span>
                      </div>
                      <div className="text-xs text-zinc-400 flex gap-3">
                        <span>HP: <span className="text-emerald-400 font-mono">{enemy.hp}</span></span>
                        <span>DMG: <span className="text-rose-400 font-mono">{enemy.damage}</span></span>
                      </div>
                      {Array.isArray(enemy.traits) && enemy.traits.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {enemy.traits.map((t) => (
                            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-900/50 border border-violet-700/50 text-violet-300">{t}</span>
                          ))}
                        </div>
                      )}
                      <button onClick={() => removeEnemy(enemy.id)} className="text-xs text-rose-400 hover:text-rose-300 mt-1">
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Add New Enemy">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Name *</label>
                  <input
                    value={newEnemy.name}
                    onChange={(e) => setNewEnemy(p => ({ ...p, name: e.target.value }))}
                    placeholder="Jungle Viper"
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Type</label>
                  <select
                    value={newEnemy.type}
                    onChange={(e) => setNewEnemy(p => ({ ...p, type: e.target.value }))}
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="mob">mob</option>
                    <option value="champion">champion</option>
                    <option value="boss">boss</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">HP</label>
                  <input
                    type="number"
                    value={newEnemy.hp}
                    onChange={(e) => setNewEnemy(p => ({ ...p, hp: Number(e.target.value) }))}
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Damage</label>
                  <input
                    type="number"
                    value={newEnemy.damage}
                    onChange={(e) => setNewEnemy(p => ({ ...p, damage: Number(e.target.value) }))}
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Traits (comma-separated)</label>
                  <input
                    value={newEnemy.traits}
                    onChange={(e) => setNewEnemy(p => ({ ...p, traits: e.target.value }))}
                    placeholder="venom, regen, berserk"
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Image URL</label>
                  <input
                    value={newEnemy.imageUrl}
                    onChange={(e) => setNewEnemy(p => ({ ...p, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
              </div>
              <AmberBtn onClick={addEnemy}>+ Add Enemy</AmberBtn>
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ARTIFACTS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'artifacts' && (
          <div className="space-y-6">
            <SectionCard title="💎 Artifacts">
              {config.artifacts.customArtifacts.length === 0 ? (
                <p className="text-zinc-500 text-sm">No custom artifacts yet. Add one below.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {config.artifacts.customArtifacts.map((art) => (
                    <div key={art.id} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-2xl">{art.emoji}</span>
                          <div className="font-bold text-zinc-100 mt-1">{art.name}</div>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                          art.rarity === 'legendary' ? 'bg-amber-500 text-black' :
                          art.rarity === 'epic' ? 'bg-violet-600 text-white' :
                          art.rarity === 'rare' ? 'bg-blue-600 text-white' :
                          'bg-zinc-600 text-zinc-200'
                        }`}>{art.rarity}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{art.description}</p>
                      {art.passive && <p className="text-xs text-amber-400 font-medium">✨ {art.passive}</p>}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => removeArtifact(art.id)} className="text-xs text-rose-400 hover:text-rose-300">🗑️ Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Add New Artifact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Name *</label>
                  <input
                    value={newArtifact.name}
                    onChange={(e) => setNewArtifact(p => ({ ...p, name: e.target.value }))}
                    placeholder="Jungle Amulet"
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Emoji</label>
                  <input
                    value={newArtifact.emoji}
                    onChange={(e) => setNewArtifact(p => ({ ...p, emoji: e.target.value }))}
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm text-zinc-400">Description</label>
                  <textarea
                    value={newArtifact.description}
                    onChange={(e) => setNewArtifact(p => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Rarity</label>
                  <select
                    value={newArtifact.rarity}
                    onChange={(e) => setNewArtifact(p => ({ ...p, rarity: e.target.value }))}
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Passive Effect</label>
                  <input
                    value={newArtifact.passive}
                    onChange={(e) => setNewArtifact(p => ({ ...p, passive: e.target.value }))}
                    placeholder="+10% crit chance"
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
              </div>
              <AmberBtn onClick={addArtifact}>+ Add Artifact</AmberBtn>
            </SectionCard>
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            EVENTS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Sub-tab bar */}
            <div className="flex gap-2">
              {[
                { id: 'random', label: '🎲 Random Events' },
                { id: 'npc', label: '🧙 NPC Encounters' },
                { id: 'rest', label: '🏕️ Rest Camp' },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setEventsSubTab(st.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    eventsSubTab === st.id
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Random Events */}
            {eventsSubTab === 'random' && (
              <div className="space-y-4">
                <SectionCard title="Random Events">
                  {(!config.randomEvents || config.randomEvents.length === 0) ? (
                    <p className="text-zinc-500 text-sm">No random events yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {config.randomEvents.map((ev) => (
                        <div key={ev.id} className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-zinc-100">{ev.title}</div>
                            <button onClick={() => removeRandomEvent(ev.id)} className="text-xs text-rose-400 hover:text-rose-300">🗑️</button>
                          </div>
                          <p className="text-sm text-zinc-400">{ev.description}</p>
                          {ev.choices && ev.choices.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {ev.choices.map((c, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-zinc-700 text-zinc-300 border border-zinc-600">
                                  {String.fromCharCode(65 + i)}: {c}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Create Random Event">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm text-zinc-400">Title *</label>
                      <input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(p => ({ ...p, title: e.target.value }))}
                        placeholder="Strange Altar"
                        className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm text-zinc-400">Description</label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(p => ({ ...p, description: e.target.value }))}
                        rows={3}
                        className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Choices</label>
                      {newEvent.choices.map((c, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={c}
                            onChange={(e) => {
                              const choices = [...newEvent.choices];
                              choices[i] = e.target.value;
                              setNewEvent(p => ({ ...p, choices }));
                            }}
                            placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                            className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                          />
                          {newEvent.choices.length > 1 && (
                            <button
                              onClick={() => setNewEvent(p => ({ ...p, choices: p.choices.filter((_, ci) => ci !== i) }))}
                              className="px-2 text-zinc-500 hover:text-rose-400"
                            >✕</button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => setNewEvent(p => ({ ...p, choices: [...p.choices, ''] }))}
                        className="text-xs text-amber-400 hover:text-amber-300"
                      >+ Add Choice</button>
                    </div>
                    <AmberBtn onClick={addRandomEvent}>+ Create Event</AmberBtn>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* NPC Encounters */}
            {eventsSubTab === 'npc' && (
              <div className="space-y-4">
                <SectionCard title="NPC Encounters">
                  {(!config.npcEncounters || config.npcEncounters.length === 0) ? (
                    <p className="text-zinc-500 text-sm">No NPC encounters yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {config.npcEncounters.map((npc) => (
                        <div key={npc.id} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-zinc-100">{npc.name}</div>
                            <button onClick={() => removeNPC(npc.id)} className="text-xs text-rose-400 hover:text-rose-300">🗑️</button>
                          </div>
                          {npc.image && <img src={npc.image} alt={npc.name} className="w-full h-24 object-cover rounded" />}
                          <div className="space-y-1">
                            {(npc.dialogue || []).map((line, i) => (
                              <div key={i} className="text-xs text-zinc-400 bg-zinc-900/60 rounded px-2 py-1">"{line}"</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Create NPC">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm text-zinc-400">Name *</label>
                        <input
                          value={newNPC.name}
                          onChange={(e) => setNewNPC(p => ({ ...p, name: e.target.value }))}
                          placeholder="Old Shaman"
                          className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm text-zinc-400">Image URL</label>
                        <input
                          value={newNPC.image}
                          onChange={(e) => setNewNPC(p => ({ ...p, image: e.target.value }))}
                          placeholder="https://..."
                          className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-400">Dialogue Lines</label>
                      {newNPC.dialogue.map((line, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={line}
                            onChange={(e) => {
                              const d = [...newNPC.dialogue];
                              d[i] = e.target.value;
                              setNewNPC(p => ({ ...p, dialogue: d }));
                            }}
                            placeholder={`Line ${i + 1}`}
                            className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                          />
                          {newNPC.dialogue.length > 1 && (
                            <button onClick={() => setNewNPC(p => ({ ...p, dialogue: p.dialogue.filter((_, di) => di !== i) }))} className="px-2 text-zinc-500 hover:text-rose-400">✕</button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setNewNPC(p => ({ ...p, dialogue: [...p.dialogue, ''] }))} className="text-xs text-amber-400 hover:text-amber-300">+ Add Line</button>
                    </div>
                    <AmberBtn onClick={addNPC}>+ Create NPC</AmberBtn>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* Rest Camp */}
            {eventsSubTab === 'rest' && (
              <SectionCard title="🏕️ Rest Camp Settings">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-zinc-400">Heal Percent (%)</label>
                    <input
                      type="number"
                      value={config.restCamp?.healPercent ?? 30}
                      onChange={(e) => setConfig(p => ({ ...p, restCamp: { ...(p.restCamp || {}), healPercent: Number(e.target.value) } }))}
                      className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-zinc-400">Bonus XP</label>
                    <input
                      type="number"
                      value={config.restCamp?.bonusXp ?? 50}
                      onChange={(e) => setConfig(p => ({ ...p, restCamp: { ...(p.restCamp || {}), bonusXp: Number(e.target.value) } }))}
                      className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm text-zinc-400">Special Events (one per line)</label>
                    <textarea
                      value={(config.restCamp?.specialEvents || []).join('\n')}
                      onChange={(e) => setConfig(p => ({ ...p, restCamp: { ...(p.restCamp || {}), specialEvents: e.target.value.split('\n').filter(Boolean) } }))}
                      rows={4}
                      placeholder="Campfire story&#10;Mysterious stranger&#10;Hidden cache"
                      className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                </div>
                <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Rest Camp</AmberBtn>
              </SectionCard>
            )}
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            CHARACTERS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'characters' && (
          <div className="space-y-6">
            <div className="flex gap-2 flex-wrap">
              {[
                { id: 'kabalian', label: '🐍 Kabalian', sub: '30HP · Balanced' },
                { id: 'kkm', label: '⚡ KKM', sub: '24HP · Speed · unlock: character_kkm' },
                { id: 'nomade_ka', label: '🌀 Nomade Ka', sub: '28HP · Adaptation · WIP' },
              ].map((char) => (
                <button
                  key={char.id}
                  onClick={() => setActiveCharacter(char.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors text-left ${
                    activeCharacter === char.id
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <div>{char.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{char.sub}</div>
                </button>
              ))}
            </div>

            <SectionCard title={activeCharacter === 'kabalian' ? '🐍 Kabalian' : activeCharacter === 'kkm' ? '⚡ KKM' : '🌀 Nomade Ka'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Portrait upload */}
                <div className="space-y-3">
                  <h3 className="text-zinc-300 font-medium">Portrait</h3>
                  {config.characters.emotionUrls?.[activeCharacter + '_portrait'] && (
                    <img
                      src={config.characters.emotionUrls[activeCharacter + '_portrait']}
                      alt="Portrait"
                      className="w-32 h-32 object-cover rounded-xl border border-zinc-600"
                    />
                  )}
                  <div className="space-y-1">
                    <label className="text-sm text-zinc-400">Portrait URL</label>
                    <input
                      value={config.characters.emotionUrls?.[activeCharacter + '_portrait'] || ''}
                      onChange={(e) => setConfig(p => ({
                        ...p,
                        characters: { ...p.characters, emotionUrls: { ...p.characters.emotionUrls, [activeCharacter + '_portrait']: e.target.value } }
                      }))}
                      placeholder="https://..."
                      className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                </div>

                {/* Emotion images */}
                <div className="space-y-3">
                  <h3 className="text-zinc-300 font-medium">Emotion Images</h3>
                  {['happy', 'angry', 'hurt', 'neutral'].map((emotion) => {
                    const key = activeCharacter + '_' + emotion;
                    return (
                      <div key={emotion} className="flex items-center gap-3">
                        {config.characters.emotionUrls?.[key] && (
                          <img src={config.characters.emotionUrls[key]} alt={emotion} className="w-10 h-10 rounded object-cover" />
                        )}
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-zinc-400 capitalize">{emotion}</label>
                          <input
                            value={config.characters.emotionUrls?.[key] || ''}
                            onChange={(e) => setConfig(p => ({
                              ...p,
                              characters: { ...p.characters, emotionUrls: { ...p.characters.emotionUrls, [key]: e.target.value } }
                            }))}
                            placeholder="https://..."
                            className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs text-zinc-100"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Base Stats */}
              <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-zinc-300 font-medium mb-3">Base Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['hp', 'atk', 'def', 'speed', 'cost'].map((stat) => (
                    <div key={stat} className="space-y-1">
                      <label className="text-xs text-zinc-400 uppercase">{stat}</label>
                      <input
                        type="number"
                        value={config.characters.playable?.[activeCharacter]?.[stat] ?? ''}
                        onChange={(e) => setConfig(p => ({
                          ...p,
                          characters: {
                            ...p.characters,
                            playable: {
                              ...p.characters.playable,
                              [activeCharacter]: {
                                ...(p.characters.playable?.[activeCharacter] || {}),
                                [stat]: Number(e.target.value),
                              },
                            },
                          },
                        }))}
                        className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Character</AmberBtn>
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            NARRATIVE TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'narrative' && (
          <div className="space-y-6">
            {/* Arc selector */}
            <div className="flex flex-wrap gap-2">
              {NARRATIVE_ARCS.map((arc, i) => (
                <button
                  key={arc}
                  onClick={() => setActiveArc(i)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    activeArc === i
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {i + 1}. {arc}
                </button>
              ))}
            </div>

            <SectionCard title={'📖 Arc ' + (activeArc + 1) + ': ' + NARRATIVE_ARCS[activeArc]}>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Arc Image URL</label>
                  <input
                    value={getArcLines(activeArc).image || ''}
                    onChange={(e) => updateArcImage(activeArc, e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                  {getArcLines(activeArc).image && (
                    <img src={getArcLines(activeArc).image} alt="Arc" className="mt-2 h-24 rounded border border-zinc-600 object-cover" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Narrative Lines (33 lines)</label>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {Array.from({ length: 33 }).map((_, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <span className="text-xs text-zinc-600 w-6 pt-2.5 text-right shrink-0">{i + 1}</span>
                        <textarea
                          value={getArcLines(activeArc).lines?.[i] || ''}
                          onChange={(e) => updateArcLine(activeArc, i, e.target.value)}
                          rows={2}
                          placeholder={'Line ' + (i + 1) + '...'}
                          className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Arc</AmberBtn>
            </SectionCard>
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            ASSETS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'assets' && (
          <div className="space-y-6">
            <SectionCard title="🖼️ Asset Manager">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Asset Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100"
                  >
                    {Object.keys(ASSET_SCHEMA).map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Subcategory</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100"
                  >
                    {availableSubcategories.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label
                    className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${loading ? 'opacity-50 cursor-not-allowed border-zinc-700' : 'border-zinc-600 hover:border-amber-500/60 hover:bg-amber-500/5'}`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-amber-400', 'bg-amber-500/10'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('border-amber-400', 'bg-amber-500/10'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-amber-400', 'bg-amber-500/10');
                      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')).slice(0, 30);
                      if (files.length) onUpload({ target: { files, value: '' } });
                    }}
                  >
                    <span className="text-3xl">🖼️</span>
                    <span className="text-sm text-zinc-400">Drag & drop images here</span>
                    <span className="text-xs text-zinc-600">or click to browse (max 30 files)</span>
                    <input type="file" accept="image/*" multiple onChange={onUpload} disabled={loading} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Preview pending */}
              {pendingPreviews.length > 0 && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-medium text-sm">{pendingPreviews.length} file(s) ready to upload</span>
                    <div className="flex gap-2">
                      <button onClick={() => { setPendingFiles([]); setPendingPreviews([]); }} className="text-xs text-zinc-400 hover:text-rose-400">Cancel</button>
                      <AmberBtn onClick={confirmUpload} disabled={loading}>✅ Confirm Upload</AmberBtn>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {pendingPreviews.map((p) => (
                      <div key={p.name} className="space-y-1">
                        <img src={p.dataUrl} alt={p.name} className="w-full h-16 object-cover rounded border border-zinc-700" />
                        <div className="text-[9px] text-zinc-500 truncate">{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assetBucket.slice(0, 120).map((asset) => {
                  const key = asset.id || asset.url;
                  const meta = config.assetsMeta?.[key] || {};
                  return (
                    <figure key={key} className="relative group rounded border border-zinc-700 bg-zinc-800 p-2 space-y-2">
                      {/* Delete button */}
                      <button
                        onClick={() => {
                          if (!window.confirm(`Delete "${asset.originalName || asset.fileName || key}"?`)) return;
                          setConfig(p => {
                            const newAssets = JSON.parse(JSON.stringify(p.assets || {}));
                            Object.keys(newAssets).forEach(cat => {
                              Object.keys(newAssets[cat]).forEach(sub => {
                                if (Array.isArray(newAssets[cat][sub])) {
                                  newAssets[cat][sub] = newAssets[cat][sub].filter(a => (a.id || a.url) !== key);
                                }
                              });
                            });
                            const newMeta = { ...(p.assetsMeta || {}) };
                            delete newMeta[key];
                            return { ...p, assets: newAssets, assetsMeta: newMeta };
                          });
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 hover:bg-rose-500"
                        title="Delete asset"
                      >✕</button>
                      <img src={asset.url} alt={asset.originalName || asset.fileName || 'asset'} className="w-full h-24 object-cover rounded" />
                      <figcaption className="text-[10px] text-zinc-300 truncate" title={asset.originalName || asset.fileName}>
                        {asset.originalName || asset.fileName}
                      </figcaption>
                      <input
                        placeholder="tags: poison,boss"
                        value={meta.tags || ''}
                        onChange={(e) => updateAssetMeta(asset, { tags: e.target.value })}
                        className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-zinc-200"
                      />
                      <select
                        value={meta.status || 'active'}
                        onChange={(e) => updateAssetMeta(asset, { status: e.target.value })}
                        className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1 text-zinc-200"
                      >
                        <option value="active">active</option>
                        <option value="draft">draft</option>
                        <option value="deprecated">deprecated</option>
                      </select>
                    </figure>
                  );
                })}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            META XP TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'metaxp' && (
          <div className="space-y-6">
            {/* Run Reward Config */}
            <SectionCard title="🏆 Run Reward Config">
              <p className="text-zinc-400 text-sm mb-4">How much XP and Gems players earn per run. These values are used by the backend when recording run end.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { key: 'baseXp', label: 'Base XP / Run', min: 0, max: 500 },
                  { key: 'xpPerKill', label: 'XP per Kill', min: 0, max: 50 },
                  { key: 'xpPerZone', label: 'XP per Zone Cleared', min: 0, max: 200 },
                  { key: 'baseGems', label: 'Base Gems / Run', min: 0, max: 100 },
                  { key: 'gemsPerBoss', label: 'Gems per Boss Kill', min: 0, max: 100 },
                  { key: 'bonusGemsOnWin', label: 'Bonus Gems (Win Run)', min: 0, max: 200 },
                ].map(({ key, label, min, max }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-zinc-400">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="range" min={min} max={max}
                        value={config.runRewards?.[key] ?? EMPTY_CONFIG.runRewards[key]}
                        onChange={(e) => setConfig(p => ({ ...p, runRewards: { ...(p.runRewards || {}), [key]: Number(e.target.value) } }))}
                        className="flex-1 accent-amber-400" />
                      <input type="number" min={min} max={max}
                        value={config.runRewards?.[key] ?? EMPTY_CONFIG.runRewards[key]}
                        onChange={(e) => setConfig(p => ({ ...p, runRewards: { ...(p.runRewards || {}), [key]: Number(e.target.value) } }))}
                        className="w-16 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-amber-300 text-center" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 text-xs text-zinc-400 space-y-1">
                <div>💡 <strong className="text-zinc-300">Example run (Zone 2 clear, 12 kills, no boss):</strong></div>
                <div className="text-amber-300 font-mono">
                  XP = {(config.runRewards?.baseXp ?? 50)} + (12 × {(config.runRewards?.xpPerKill ?? 10)}) + (2 × {(config.runRewards?.xpPerZone ?? 80)}) = {(config.runRewards?.baseXp ?? 50) + 12 * (config.runRewards?.xpPerKill ?? 10) + 2 * (config.runRewards?.xpPerZone ?? 80)} XP
                </div>
                <div className="text-emerald-300 font-mono">
                  Gems = {(config.runRewards?.baseGems ?? 5)} base = {(config.runRewards?.baseGems ?? 5)} 💎
                </div>
              </div>
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Run Rewards</AmberBtn>
            </SectionCard>

            {/* XP Threshold Table */}
            <SectionCard title="📈 XP Thresholds (Level 1–20)">
              <p className="text-zinc-400 text-sm mb-3">Cumulative XP required to reach each level. Set gem cost to 0 for free unlock.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 text-zinc-400 text-xs">
                      <th className="text-left py-2 pr-3 w-10">Lv</th>
                      <th className="text-left py-2 pr-3">XP Required</th>
                      <th className="text-left py-2 pr-3">Gem Cost</th>
                      <th className="text-left py-2 pr-3">Reward / Unlock</th>
                      <th className="text-left py-2">Reward Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                        <td className="py-1.5 pr-3 font-bold text-amber-400 text-sm">{i + 1}</td>
                        <td className="py-1.5 pr-3">
                          <input type="number"
                            value={(config.xpThresholds || DEFAULT_XP_THRESHOLDS)[i] ?? 0}
                            onChange={(e) => updateXpThreshold(i, e.target.value)}
                            className="w-24 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-100" />
                        </td>
                        <td className="py-1.5 pr-3">
                          <input type="number" placeholder="0"
                            value={config.xpGemCosts?.[i] ?? 0}
                            onChange={(e) => {
                              const costs = [...(config.xpGemCosts || Array(20).fill(0))];
                              costs[i] = Number(e.target.value);
                              setConfig(p => ({ ...p, xpGemCosts: costs }));
                            }}
                            className="w-16 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-100" />
                        </td>
                        <td className="py-1.5 pr-3 text-xs text-amber-400/80 font-mono">
                          {ALL_UNLOCK_IDS[i] || <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="py-1.5">
                          <input type="text" placeholder="e.g. +5 max HP, new companion..."
                            value={config.xpLevelRewards?.[i] ?? ''}
                            onChange={(e) => {
                              const rewards = [...(config.xpLevelRewards || Array(20).fill(''))];
                              rewards[i] = e.target.value;
                              setConfig(p => ({ ...p, xpLevelRewards: rewards }));
                            }}
                            className="w-48 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save XP Table</AmberBtn>
            </SectionCard>

            {/* Unlock Tree visual */}
            <SectionCard title="🔓 Unlock Tree">
              <p className="text-zinc-400 text-sm mb-3">Sequential unlock dependencies (meta progression path).</p>
              <div className="flex flex-wrap gap-2 items-center">
                {ALL_UNLOCK_IDS.map((id, i) => (
                  <React.Fragment key={id}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center min-w-[100px]">
                        <div className="text-[10px] text-zinc-500 mb-0.5">Lv {i + 2}</div>
                        <div className="text-xs font-mono text-amber-300 leading-tight">{id}</div>
                        {config.xpLevelRewards?.[i + 1] && <div className="text-[9px] text-zinc-400 mt-1 italic">{config.xpLevelRewards[i + 1]}</div>}
                      </div>
                    </div>
                    {i < ALL_UNLOCK_IDS.length - 1 && <span className="text-zinc-600 text-sm">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </SectionCard>

            {/* Daily Login Config */}
            <SectionCard title="📅 Daily Login Streak">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm text-zinc-300">Daily Login Enabled</span>
                <button onClick={() => setConfig(p => ({ ...p, dailyLogin: { ...(p.dailyLogin || {}), enabled: !(p.dailyLogin?.enabled ?? true) } }))}
                  className={`w-9 h-5 rounded-full relative flex-shrink-0 transition-colors ${config.dailyLogin?.enabled !== false ? 'bg-amber-500' : 'bg-zinc-600'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${config.dailyLogin?.enabled !== false ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <p className="text-zinc-400 text-sm mb-4">Configure rewards for each streak day. Special milestone rewards at day 7, 14, and 30.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 text-zinc-400 text-xs">
                      <th className="text-left py-2 pr-3 w-12">Day</th>
                      <th className="text-left py-2 pr-3">Gems 💎</th>
                      <th className="text-left py-2 pr-3">Tickets 🎟️</th>
                      <th className="text-left py-2">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(config.dailyLogin?.rewards || EMPTY_CONFIG.dailyLogin.rewards).map((reward, i) => (
                      <tr key={i} className={`border-b border-zinc-800/60 ${reward.day === 7 || reward.day === 14 || reward.day === 30 ? 'bg-amber-500/5' : 'hover:bg-zinc-800/30'}`}>
                        <td className="py-1.5 pr-3 font-bold text-amber-400">D{reward.day}</td>
                        <td className="py-1.5 pr-3">
                          <input type="number" min={0} max={9999} value={reward.gems}
                            onChange={(e) => {
                              const rewards = [...(config.dailyLogin?.rewards || EMPTY_CONFIG.dailyLogin.rewards)];
                              rewards[i] = { ...rewards[i], gems: Number(e.target.value) };
                              setConfig(p => ({ ...p, dailyLogin: { ...(p.dailyLogin || {}), rewards } }));
                            }}
                            className="w-16 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-100" />
                        </td>
                        <td className="py-1.5 pr-3">
                          <input type="number" min={0} max={10} value={reward.tickets}
                            onChange={(e) => {
                              const rewards = [...(config.dailyLogin?.rewards || EMPTY_CONFIG.dailyLogin.rewards)];
                              rewards[i] = { ...rewards[i], tickets: Number(e.target.value) };
                              setConfig(p => ({ ...p, dailyLogin: { ...(p.dailyLogin || {}), rewards } }));
                            }}
                            className="w-16 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-100" />
                        </td>
                        <td className="py-1.5">
                          <input type="text" value={reward.label}
                            onChange={(e) => {
                              const rewards = [...(config.dailyLogin?.rewards || EMPTY_CONFIG.dailyLogin.rewards)];
                              rewards[i] = { ...rewards[i], label: e.target.value };
                              setConfig(p => ({ ...p, dailyLogin: { ...(p.dailyLogin || {}), rewards } }));
                            }}
                            className="w-40 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-300" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Daily Login</AmberBtn>
            </SectionCard>
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            ROADMAP TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4">
            <SectionCard title="🗺️ Feature Roadmap">
              <p className="text-zinc-400 text-sm">Current state of Die In The Jungle — what is done, what is next, what is in the backlog.</p>
            </SectionCard>

            {ROADMAP.map((section, si) => {
              const isCollapsed = roadmapCollapsed[si] !== false;
              const borderColor = section.color === 'emerald' ? 'border-emerald-800' : section.color === 'amber' ? 'border-amber-800' : 'border-zinc-800';
              const headerColor = section.color === 'emerald' ? 'text-emerald-300' : section.color === 'amber' ? 'text-amber-300' : 'text-zinc-400';
              return (
                <div key={section.section} className={`rounded-xl border ${borderColor} bg-zinc-900/70`}>
                  <button
                    onClick={() => setRoadmapCollapsed(p => ({ ...p, [si]: !isCollapsed }))}
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                  >
                    <h3 className={`text-lg font-bold ${headerColor}`}>{section.section}</h3>
                    <span className="text-zinc-500 text-sm">{isCollapsed ? '▶' : '▼'} {section.items.length} items</span>
                  </button>
                  {!isCollapsed && (
                    <div className="px-5 pb-5 space-y-1.5">
                      {section.items.map((item) => (
                        <div key={item.label} className="flex items-start gap-2.5 py-1">
                          <span className="text-base mt-0.5 shrink-0">{item.done ? '✅' : '⬜'}</span>
                          <span className={`text-sm ${item.done ? 'text-zinc-300' : 'text-zinc-400'}`}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add to backlog */}
            <SectionCard title="Add to Backlog">
              <div className="flex gap-2">
                <input
                  value={newBacklogItem}
                  onChange={(e) => setNewBacklogItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && newBacklogItem.trim()) { setConfig(p => ({ ...p, adminBacklog: [...(p.adminBacklog || []), { label: newBacklogItem.trim(), done: false }] })); setNewBacklogItem(''); } }}
                  placeholder="New backlog item..."
                  className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
                <AmberBtn onClick={() => { if (newBacklogItem.trim()) { setConfig(p => ({ ...p, adminBacklog: [...(p.adminBacklog || []), { label: newBacklogItem.trim(), done: false }] })); setNewBacklogItem(''); } }}>
                  + Add
                </AmberBtn>
              </div>
              {config.adminBacklog && config.adminBacklog.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  {config.adminBacklog.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="text-base shrink-0">⬜</span>
                      <span className="text-sm text-zinc-400 flex-1">{item.label || item}</span>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Progress */}
            <SectionCard>
              {(() => {
                const all = ROADMAP.flatMap(s => s.items);
                const done = all.filter(i => i.done).length;
                const pct = Math.round((done / all.length) * 100);
                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-300 font-medium">Overall Progress</span>
                      <span className="text-amber-300">{done} / {all.length} features ({pct}%)</span>
                    </div>
                    <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all" style={{ width: pct + '%' }} />
                    </div>
                  </div>
                );
              })()}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SPRINT TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sprint' && (
          <div className="space-y-6">
            <SectionCard title="🏃 Current Sprint Goals">
              {/* Add item */}
              <div className="flex gap-2">
                <input
                  value={newSprintItem}
                  onChange={(e) => setNewSprintItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addSprintItem(); }}
                  placeholder="Add sprint goal..."
                  className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
                <select value={sprintPriority} onChange={(e) => setSprintPriority(e.target.value)}
                  className="rounded bg-zinc-800 border border-zinc-700 px-2 py-2 text-sm text-zinc-100">
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
                <AmberBtn onClick={addSprintItem}>+ Add</AmberBtn>
              </div>

              {/* Progress bar */}
              {(config.sprintItems || []).length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${((config.sprintItems || []).filter(i => i.done).length / (config.sprintItems || []).length) * 100}%` }} />
                  </div>
                  <span className="text-xs text-zinc-400 shrink-0">
                    {(config.sprintItems || []).filter(i => i.done).length} / {(config.sprintItems || []).length}
                  </span>
                </div>
              )}

              {/* Kanban view: Todo | In Progress | Done */}
              {(!config.sprintItems || config.sprintItems.length === 0) ? (
                <p className="text-zinc-500 text-sm">No sprint goals yet. Add one above.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Todo */}
                  <div>
                    <div className="text-xs font-bold text-zinc-400 uppercase mb-2">📋 Todo ({(config.sprintItems || []).filter(i => !i.done).length})</div>
                    <div className="space-y-2">
                      {(config.sprintItems || []).filter(i => !i.done)
                        .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority || 'medium'] - { high: 0, medium: 1, low: 2 }[b.priority || 'medium']))
                        .map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2.5">
                          <button onClick={() => toggleSprintItem(item.id)}
                            className="w-4 h-4 rounded border border-zinc-600 hover:border-amber-400 flex items-center justify-center shrink-0" />
                          <span className="text-[10px]">{item.priority === 'high' ? '🔴' : item.priority === 'low' ? '🟢' : '🟡'}</span>
                          <span className="flex-1 text-sm text-zinc-200">{item.text}</span>
                          <button onClick={() => removeSprintItem(item.id)} className="text-xs text-zinc-600 hover:text-rose-400">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Done */}
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase mb-2">✅ Done ({(config.sprintItems || []).filter(i => i.done).length})</div>
                    <div className="space-y-2">
                      {(config.sprintItems || []).filter(i => i.done).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 rounded-lg border border-emerald-800/50 bg-emerald-900/10 px-3 py-2.5">
                          <button onClick={() => toggleSprintItem(item.id)}
                            className="w-4 h-4 rounded bg-emerald-600 border-emerald-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-[9px]">✓</span>
                          </button>
                          <span className="flex-1 text-sm line-through text-zinc-500">{item.text}</span>
                          <button onClick={() => removeSprintItem(item.id)} className="text-xs text-zinc-600 hover:text-rose-400">✕</button>
                        </div>
                      ))}
                      {(config.sprintItems || []).filter(i => i.done).length === 0 && (
                        <p className="text-zinc-600 text-xs italic">Nothing done yet — ship it!</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="📝 Sprint Notes">
              <textarea
                value={sprintNotes}
                onChange={(e) => setSprintNotes(e.target.value)}
                rows={6}
                placeholder="Sprint retrospective, blockers, notes, what to ship next..."
                className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
              />
            </SectionCard>

            <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Sprint</AmberBtn>
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            DOCS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'docs' && (
          <div className="space-y-4">
            {[
              {
                title: '🎮 Game Loop',
                content: `DIE IN THE JUNGLE — Roguelite Dice Combat\n\nEach run: navigate a branching zone map → fight enemies → visit shops, rest camps, random events → defeat zone boss → repeat × 3 zones.\n\nCOMBAT TURN:\n1. Roll 5 dice\n2. Place dice into 3 lanes (Top / Mid / Bot)\n3. Each lane resolves its effect (attack, shield, heal)\n4. Enemy executes its intent\n5. New turn begins\n\nLANE BONUSES:\n• Top row heal die → reset random ability cooldown\n• Bot row: +1 coin per die placed\n• Mid row 2× same type → +5 score\n\nSURGE: Place 3 dice of the same type in one turn → bonus effect triggers\n\nRun ends when: player HP = 0 (death) or all zone bosses cleared (victory)`,
              },
              {
                title: '🎲 Dice System',
                content: `STANDARD FACES:\n• ATK (⚔️) — deals damage equal to ATK stat\n• DEF (🛡️) — grants shield points\n• HEAL (❤️) — restores HP\n• ENERGY (⚡) — charges mana or ability\n\nSPECIAL FACES (unlockable via meta):\n• PIERCE — damage ignores all enemy defense\n• ECHO — repeats the effect of the previous lane\n• NURTURE — heals proportional to alive companions\n• FORTRESS — blocks next 2 attacks completely\n\nREROLL: Costs rerollCostScore points (default 20). Can be done before placing.\nSURGE: 3+ same type in one turn → bonus effect\n\nCONFIG KEYS: rerollCostScore, critChance, critMultiplier`,
              },
              {
                title: '⚔️ Combat System',
                content: `ENEMY INTENTS (declared each turn):\n• Attack — will deal X damage\n• Block — will gain Y shield\n• Buff — will apply a modifier\n• Special — unique boss ability\n\nENEMY MODIFIERS:\n• venom — deals DoT each turn\n• thorns — reflects % damage back to player\n• regen — enemy regenerates HP each turn\n• berserk — doubles damage next turn\n• stoneSkin — very high defense\n• swift — enemy acts twice per turn\n\nPLAYER STATS: HP, ATK, DEF, Speed\nCONFIG: critChance, critMultiplier, dodgeChance, lifeSteal, bossHpMultiplier, bossDamageMultiplier`,
              },
              {
                title: '🦎 Companion System',
                content: `One companion per run. Unlocked via meta progression.\n\nGECKO 🦎\n  Passive: +dodge chance on all attacks\n  Active: Hypnose — stuns enemy for 1 turn\n  Unlock: companion_gecko\n\nCROAK 🐊\n  Passive: +ATK stat boost\n  Active: Leap — deals burst damage\n  Unlock: companion_croak\n\nL'OEIL 👁️\n  Passive: reveals enemy intents 1 turn ahead\n  Active: Vision — exposes all hidden buffs + free reroll\n  Unlock: companion_oeil\n\nCOMPANION FLOW: select before run → companion visible in combat → active ability button appears (mana/CD gated)`,
              },
              {
                title: '📈 Meta Progression',
                content: `XP earned per run → levels up player → unlocks features sequentially.\nGems earned per run → spend on early unlocks or shop items.\n\nUNLOCK TREE (sequential):\n  Lv2: character_kkm\n  Lv3: weapon_slot_1\n  Lv4: dice_specials (Pierce/Echo/Nurture/Fortress)\n  Lv5: lane_bonuses\n  Lv6: companion_gecko\n  Lv7: companion_croak\n  Lv8: weapon_slot_2\n  Lv9: companion_oeil\n\nACHIEVEMENTS: zone1_boss_first, zone2_boss_first, zone3_boss_first, zone4_boss_first\n\nlocalStorage keys:\n  jk_meta_progression_v1  — XP, gems, unlocks, achievements\n  jungle_kabal_run_state_v1 — active run state\n  jungle_kabal_leaderboard_v1 — local scores`,
              },
              {
                title: '🔌 API Endpoints',
                content: `GAME CONFIG:\n  GET  /api/miniapp/config         — Load game config JSON\n  PUT  /api/miniapp/config         — Save game config JSON\n\nASSETS:\n  POST /api/miniapp/assets/upload-batch  — Upload up to 30 images (base64)\n\nRUNS:\n  POST /api/miniapp/runs/start     — Record run start (telegramId, character)\n  POST /api/miniapp/runs/end       — Record run end → awards XP + gems\n  GET  /api/miniapp/leaderboard    — Get top scores\n\nUSER:\n  GET  /api/miniapp/user/:id       — Get user meta progression\n  POST /api/miniapp/referral       — Record referral link click\n\nAll responses: { ok: true/false, ...data }\nAuth: Telegram initData passed in Authorization header or body.telegramInitData`,
              },
              {
                title: '🚀 Deployment',
                content: `FRONTEND:\n  Vite + React + Tailwind CSS\n  npm run dev    → localhost:5173\n  npm run build  → /dist (static)\n  Routes: /diejungle (game), /diejungle/admin (this panel)\n\nBACKEND:\n  Node.js HTTP server (server/index.mjs)\n  npm run api    → localhost:8787\n  Data: server/data/*.json (persisted as flat JSON files)\n  Env: ACADEMY_API_PORT, CORS_ALLOW_ORIGIN\n\nTELEGRAM MINI APP:\n  Separate Vite bundle on port 5180 (dev)\n  Uses Telegram WebApp SDK (window.Telegram.WebApp)\n  Auth: initDataUnsafe.user for identity\n  Set via BotFather → Edit Bot → Bot Settings → Menu Button\n\nVERCEL DEPLOY:\n  Push to main → Vercel auto-deploys frontend\n  Backend runs on separate server (not Vercel serverless)\n  Env vars set in Vercel dashboard`,
              },
              {
                title: '📋 Known Bugs & P0 Fixes',
                content: `CRITICAL BUGS:\n• KKM character NOT gated by character_kkm unlock (always available)\n• Weapon system (weapons.ts) imported but ZERO usage in game code\n• Companion selection screen missing before run start\n• Map doesn't visually refresh after combat (node not marked visited)\n• No shop node guaranteed on map — player can miss shop entirely\n• No boss node at zone end — structure is random\n• Lane bonuses (botRowDiceCount coins, topRowHasHeal reset CD) defined but not triggered\n• Echo dice face behavior unclear — spec needed\n• hasCurse flag set on enemies but never read — dead code\n• Wallet connect button still visible in game UI\n• Zone scaling caps at zone 4 (endless mode needs cap removed)\n\nP1 FEATURES MISSING:\n• Pre-run screen (character + weapon + companion selection)\n• Post-combat loot popup (Max HP / Mana / Coin choice)\n• Companion active ability button in combat\n• Mana resource system\n• Biome system (jungle/ruins/temple backgrounds per zone)`,
              },
            ].map((doc) => (
              <details key={doc.title} className="rounded-xl border border-zinc-800 bg-zinc-900/70 overflow-hidden">
                <summary className="px-5 py-4 cursor-pointer hover:bg-zinc-800/50 font-semibold text-amber-300 text-base">
                  {doc.title}
                </summary>
                <div className="px-5 pb-5">
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{doc.content}</pre>
                </div>
              </details>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            SOUND TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'sound' && (
          <div className="space-y-6">
            <SectionCard title="🎵 Sound Design">
              <p className="text-zinc-400 text-sm">Upload MP3 sounds for each game event. Sounds are stored in config.sounds and served via CDN.</p>
            </SectionCard>

            {Object.entries(SOUND_SCHEMA).map(([category, sounds]) => (
              <SectionCard key={category} title={'🔊 ' + category}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sounds.map((sound) => {
                    const uploaded = config.sounds?.[sound.id];
                    return (
                      <div key={sound.id} className={`rounded-xl border p-4 space-y-2 transition-colors ${uploaded ? 'border-emerald-700/50 bg-emerald-900/10' : 'border-zinc-700 bg-zinc-800/40'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-medium text-sm text-zinc-100">{sound.name}</div>
                            <div className="text-xs text-zinc-500 mt-0.5">{sound.desc}</div>
                          </div>
                          {uploaded && (
                            <span className="text-emerald-400 text-lg shrink-0" title="Uploaded">✅</span>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs text-zinc-500">
                          <span>Max: <span className="text-zinc-400">{sound.maxKB >= 1000 ? (sound.maxKB / 1000) + 'MB' : sound.maxKB + 'KB'}</span></span>
                          <span>Ideal: <span className="text-zinc-400">{sound.idealKB >= 1000 ? (sound.idealKB / 1000) + 'MB' : sound.idealKB + 'KB'}</span></span>
                          <span>MP3</span>
                        </div>
                        {uploaded ? (
                          <div className="flex items-center gap-2">
                            <audio controls src={uploaded} className="flex-1 h-8 [&::-webkit-media-controls]:scale-90" style={{ height: '32px' }} />
                            <button onClick={() => setConfig(p => ({ ...p, sounds: { ...p.sounds, [sound.id]: '' } }))} className="text-xs text-rose-400 hover:text-rose-300 shrink-0">Remove</button>
                          </div>
                        ) : (
                          <label className="block w-full cursor-pointer">
                            <div className="border-2 border-dashed border-zinc-600 hover:border-amber-500/50 rounded-lg px-3 py-3 text-center text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                              📂 Click or drag MP3 to upload
                            </div>
                            <input
                              type="file"
                              accept=".mp3,audio/mpeg"
                              className="hidden"
                              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSound(sound.id, f); e.target.value = ''; }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            ))}

            <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Sound Config</AmberBtn>
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            BRAND KIT TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            {/* Brand Colors */}
            <SectionCard title="🎨 Brand Colors">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {BRAND_COLORS.map((color) => (
                  <div key={color.hex} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-3 space-y-2">
                    <div className="w-full h-16 rounded-lg border border-zinc-600" style={{ backgroundColor: color.hex }} />
                    <div className="text-sm font-medium text-zinc-200">{color.name}</div>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-amber-400 flex-1">{color.hex}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(color.hex); setToast('Copied ' + color.hex); }}
                        className="text-xs text-zinc-500 hover:text-amber-400 px-1.5 py-0.5 rounded border border-zinc-700 hover:border-amber-500/50"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Typography */}
            <SectionCard title="🔤 Typography">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { role: 'Titles / Display', name: 'Serif Display', sample: 'Die In The Jungle' },
                  { role: 'Code / Stats', name: 'Mono', sample: 'ATK: 24 · DEF: 12' },
                  { role: 'Body / UI', name: 'Sans', sample: 'The jungle claims all who enter.' },
                ].map((font) => (
                  <div key={font.role} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">{font.role}</div>
                    <div className="text-lg font-bold text-zinc-100">{font.name}</div>
                    <div className="text-sm text-zinc-400 italic">{font.sample}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Logo Assets */}
            <SectionCard title="🖼️ Logo Assets">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 'main', label: 'Main Logo', hint: 'PNG with transparent background', ratio: 'Any' },
                  { key: 'icon', label: 'Icon / Avatar', hint: '1:1 square ratio', ratio: '1:1' },
                  { key: 'horizontal', label: 'Horizontal Logo', hint: 'Wide format for headers', ratio: '~4:1' },
                ].map((logo) => (
                  <div key={logo.key} className="rounded-xl border border-zinc-700 bg-zinc-800/60 p-4 space-y-3">
                    <div>
                      <div className="font-medium text-zinc-200 text-sm">{logo.label}</div>
                      <div className="text-xs text-zinc-500">{logo.hint} · Ratio: {logo.ratio}</div>
                    </div>
                    {brandLogos[logo.key] ? (
                      <div className="space-y-2">
                        <img src={brandLogos[logo.key]} alt={logo.label} className="w-full h-20 object-contain rounded border border-zinc-600 bg-zinc-900" />
                        <div className="flex gap-2">
                          <a href={brandLogos[logo.key]} download className="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded border border-amber-500/40">
                            ⬇️ Download
                          </a>
                          <button onClick={() => setBrandLogos(p => ({ ...p, [logo.key]: '' }))} className="text-xs text-rose-400 hover:text-rose-300">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className="border-2 border-dashed border-zinc-600 hover:border-amber-500/50 rounded-lg px-3 py-4 text-center text-xs text-zinc-500 hover:text-amber-400 transition-colors">
                          📂 Click to upload PNG
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const dataUrl = await toDataUrl(f);
                            setBrandLogos(p => ({ ...p, [logo.key]: dataUrl }));
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Social Media Templates */}
            <SectionCard title="📱 Social Media Post Templates">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: 'Twitter/X Post', size: '1200×675px' },
                  { name: 'Twitter/X Square', size: '1080×1080px' },
                  { name: 'Telegram Post', size: 'Standard' },
                  { name: 'Story', size: '1080×1920px' },
                ].map((tmpl) => (
                  <div key={tmpl.name} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-zinc-200">{tmpl.name}</div>
                      <div className="text-xs text-zinc-500">{tmpl.size}</div>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setToast('Template not yet uploaded — contact admin'); }}
                      className="text-xs px-3 py-1.5 rounded border border-zinc-600 text-zinc-400 hover:border-amber-500/50 hover:text-amber-400 transition-colors whitespace-nowrap"
                    >
                      📥 Download PSD
                    </a>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Brand Voice */}
            <SectionCard title="🗣️ Brand Voice">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Tagline</label>
                  <input
                    value={config.brandKit?.tagline || ''}
                    onChange={(e) => setConfig(p => ({ ...p, brandKit: { ...(p.brandKit || {}), tagline: e.target.value } }))}
                    placeholder="Roll. Fight. Die. Rise."
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Elevator Pitch</label>
                  <textarea
                    value={config.brandKit?.elevatorPitch || ''}
                    onChange={(e) => setConfig(p => ({ ...p, brandKit: { ...(p.brandKit || {}), elevatorPitch: e.target.value } }))}
                    rows={3}
                    placeholder="A roguelite dice combat game set in a deadly jungle, where every roll could be your last..."
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Key Messages</label>
                  {[0, 1, 2].map((i) => (
                    <input
                      key={i}
                      value={config.brandKit?.keyMessages?.[i] || ''}
                      onChange={(e) => {
                        const msgs = [...(config.brandKit?.keyMessages || ['', '', ''])];
                        msgs[i] = e.target.value;
                        setConfig(p => ({ ...p, brandKit: { ...(p.brandKit || {}), keyMessages: msgs } }));
                      }}
                      placeholder={'Key message ' + (i + 1)}
                      className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    />
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-zinc-400">Hashtags</label>
                  <input
                    value={config.brandKit?.hashtags || ''}
                    onChange={(e) => setConfig(p => ({ ...p, brandKit: { ...(p.brandKit || {}), hashtags: e.target.value } }))}
                    placeholder="#DieInTheJungle #JungleKabal #Roguelite #Telegram"
                    className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </div>
              </div>
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Brand Voice</AmberBtn>
            </SectionCard>

            {/* Social Post Generator */}
            <SectionCard title="✍️ Social Post Generator">
              <p className="text-zinc-400 text-sm mb-4">Generate ready-to-post content for Twitter/X and Telegram. Click Copy to grab the text.</p>
              {(() => {
                const tagline = config.brandKit?.tagline || 'Roll. Fight. Die. Rise.';
                const hashtags = config.brandKit?.hashtags || '#DieInTheJungle #JungleKabal';
                const pitch = config.brandKit?.elevatorPitch || 'A roguelite dice combat game on Telegram.';
                const posts = [
                  {
                    platform: '𝕏 Twitter/X',
                    label: 'Announcement',
                    text: `🎲 ${tagline}\n\nDie In The Jungle is live on Telegram Mini App.\nRoguelite dice combat. 3 zones. One life.\n\nPlay free → [LINK]\n\n${hashtags}`,
                  },
                  {
                    platform: '𝕏 Twitter/X',
                    label: 'Score Card',
                    text: `Just hit Zone 3 in Die In The Jungle 🌿\n💀 Score: [SCORE] | Zone [ZONE] | [KILLS] kills\n\nBeat my score → [LINK]\n\n${hashtags}`,
                  },
                  {
                    platform: '📱 Telegram',
                    label: 'Channel Post',
                    text: `🎮 *Die In The Jungle* is live!\n\n${pitch}\n\n🎲 Roll dice. Place in lanes. Trigger SURGE.\n💀 3 zones. Boss at each end. Die and try again.\n📈 XP and Gems carry over between runs.\n\n➡️ Play now: [LINK]`,
                  },
                  {
                    platform: '📱 Telegram',
                    label: 'Update Announcement',
                    text: `🔥 *New Update — Die In The Jungle*\n\n${config.releaseNotes ? config.releaseNotes.split('\n').slice(0, 5).join('\n') : '• Bug fixes & balance tweaks\n• New enemy: [NAME]\n• Difficulty tuning\n• Performance improvements'}\n\nUpdate now → [LINK]`,
                  },
                ];
                return (
                  <div className="space-y-3">
                    {posts.map((post, i) => (
                      <div key={i} className="rounded-xl border border-zinc-700 bg-zinc-800/40 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-200">{post.platform}</span>
                            <span className="text-[10px] text-zinc-500 border border-zinc-700 rounded px-1.5 py-0.5">{post.label}</span>
                          </div>
                          <button
                            onClick={() => { navigator.clipboard.writeText(post.text); setToast('Post copied!'); }}
                            className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/40 rounded px-2 py-1">
                            📋 Copy
                          </button>
                        </div>
                        <pre className="px-4 py-3 text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">{post.text}</pre>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </SectionCard>

            {/* CSS Variables */}
            <SectionCard title="🖥️ CSS Color Variables">
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 relative">
                <button
                  onClick={() => {
                    const css = BRAND_COLORS.map(c => `  --color-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex};`).join('\n');
                    navigator.clipboard.writeText(':root {\n' + css + '\n}');
                    setToast('CSS variables copied!');
                  }}
                  className="absolute top-3 right-3 text-xs text-zinc-500 hover:text-amber-400 px-2 py-1 rounded border border-zinc-700"
                >
                  Copy
                </button>
                <pre className="text-xs font-mono text-zinc-300 leading-relaxed">
{`:root {\n${BRAND_COLORS.map(c => `  --color-${c.name.toLowerCase().replace(/\s+/g, '-')}: ${c.hex};`).join('\n')}\n}`}
                </pre>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ADVANCED TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <SectionCard title="🔬 Advanced — Raw JSON Editors">
              <p className="text-zinc-400 text-sm mb-3">Edit raw game data. Invalid JSON will be rejected on save.</p>
              <div className="flex gap-2">
                <AmberBtn onClick={() => {
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `miniapp-config-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setToast('Config exported!');
                }}>⬇️ Export Full Config JSON</AmberBtn>
                <label className="px-3 py-1.5 rounded text-sm font-medium transition-colors bg-zinc-700 hover:bg-zinc-600 text-zinc-200 border border-zinc-600 cursor-pointer">
                  ⬆️ Import Config JSON
                  <input type="file" accept=".json,application/json" className="hidden" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    try {
                      const text = await f.text();
                      const parsed = JSON.parse(text);
                      setConfig(withDefaults(parsed));
                      setToast('Config imported — review and save!');
                    } catch (err) {
                      setToast('❌ Invalid JSON file');
                    }
                    e.target.value = '';
                  }} />
                </label>
              </div>
            </SectionCard>
            <SectionCard>
              <JsonEditor
                label="monsters.traitsCatalog"
                value={config.monsters.traitsCatalog}
                onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, traitsCatalog: value } }))}
                rows={10}
              />
            </SectionCard>
            <SectionCard>
              <JsonEditor
                label="monsters.customMonsters"
                value={config.monsters.customMonsters}
                onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, customMonsters: value } }))}
                rows={12}
              />
            </SectionCard>
            <SectionCard>
              <JsonEditor
                label="artifacts.customArtifacts"
                value={config.artifacts.customArtifacts}
                onSave={(value) => setConfig((p) => ({ ...p, artifacts: { ...p.artifacts, customArtifacts: value } }))}
                rows={12}
              />
            </SectionCard>
            <SectionCard>
              <JsonEditor
                label="randomEvents"
                value={config.randomEvents}
                onSave={(value) => setConfig((p) => ({ ...p, randomEvents: value }))}
                rows={12}
              />
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            POOL TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'pool' && (
          <div className="space-y-6">
            <SectionCard title="🎱 Drop Pool Configuration">
              <p className="text-zinc-400 text-sm">Control rarity weights, map node distribution, and which shop items appear. Higher number = more likely to appear.</p>
            </SectionCard>

            {/* Artifact Weights */}
            <SectionCard title="💎 Artifact Drop Weights">
              <p className="text-zinc-400 text-sm mb-4">Relative probability when the game picks a random artifact rarity. Total is normalized automatically.</p>
              {[
                { key: 'gray', label: '⬜ Gray (Common)', color: 'zinc' },
                { key: 'gold', label: '🟡 Gold (Rare)', color: 'amber' },
                { key: 'chrome', label: '🔵 Chrome (Epic)', color: 'cyan' },
              ].map(({ key, label }) => {
                const total = Object.values(config.pools?.artifactWeights || {}).reduce((s, v) => s + v, 0);
                const val = config.pools?.artifactWeights?.[key] ?? 1;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-zinc-300 w-40 shrink-0">{label}</span>
                    <input type="range" min={0} max={20} value={val}
                      onChange={(e) => setConfig(p => ({ ...p, pools: { ...p.pools, artifactWeights: { ...(p.pools?.artifactWeights || {}), [key]: Number(e.target.value) } } }))}
                      className="flex-1 accent-amber-400" />
                    <input type="number" min={0} max={20} value={val}
                      onChange={(e) => setConfig(p => ({ ...p, pools: { ...p.pools, artifactWeights: { ...(p.pools?.artifactWeights || {}), [key]: Number(e.target.value) } } }))}
                      className="w-14 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-center text-zinc-100" />
                    <span className="text-xs text-amber-400 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </SectionCard>

            {/* Starter Artifact Weights */}
            <SectionCard title="🎁 Starter Artifact Weights">
              <p className="text-zinc-400 text-sm mb-4">Rarity weights for the artifact the player starts the run with (before entering zone 1).</p>
              {[
                { key: 'gray', label: '⬜ Gray (Common)' },
                { key: 'gold', label: '🟡 Gold (Rare)' },
                { key: 'chrome', label: '🔵 Chrome (Epic)' },
              ].map(({ key, label }) => {
                const total = Object.values(config.pools?.starterWeights || {}).reduce((s, v) => s + v, 0);
                const val = config.pools?.starterWeights?.[key] ?? 1;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-zinc-300 w-40 shrink-0">{label}</span>
                    <input type="range" min={0} max={20} value={val}
                      onChange={(e) => setConfig(p => ({ ...p, pools: { ...p.pools, starterWeights: { ...(p.pools?.starterWeights || {}), [key]: Number(e.target.value) } } }))}
                      className="flex-1 accent-amber-400" />
                    <input type="number" min={0} max={20} value={val}
                      onChange={(e) => setConfig(p => ({ ...p, pools: { ...p.pools, starterWeights: { ...(p.pools?.starterWeights || {}), [key]: Number(e.target.value) } } }))}
                      className="w-14 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-center text-zinc-100" />
                    <span className="text-xs text-amber-400 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </SectionCard>

            {/* Map Node Weights */}
            <SectionCard title="🗺️ Map Node Type Weights">
              <p className="text-zinc-400 text-sm mb-4">How often each node type appears on the zone map. Combat is always present; adjust others to tune pacing.</p>
              {[
                { key: 'combat', label: '⚔️ Combat', desc: 'Enemy fight' },
                { key: 'shop', label: '🛒 Shop', desc: 'Buy items with gold' },
                { key: 'rest', label: '🔥 Rest Camp', desc: 'Heal + bonus XP' },
                { key: 'event', label: '🎲 Random Event', desc: 'Choice-based event' },
              ].map(({ key, label, desc }) => {
                const total = Object.values(config.pools?.mapNodeWeights || {}).reduce((s, v) => s + v, 0);
                const val = config.pools?.mapNodeWeights?.[key] ?? 1;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3 mb-3">
                    <div className="w-40 shrink-0">
                      <div className="text-sm text-zinc-300">{label}</div>
                      <div className="text-[10px] text-zinc-500">{desc}</div>
                    </div>
                    <input type="range" min={0} max={10} value={val}
                      onChange={(e) => setConfig(p => ({ ...p, pools: { ...p.pools, mapNodeWeights: { ...(p.pools?.mapNodeWeights || {}), [key]: Number(e.target.value) } } }))}
                      className="flex-1 accent-amber-400" />
                    <input type="number" min={0} max={10} value={val}
                      onChange={(e) => setConfig(p => ({ ...p, pools: { ...p.pools, mapNodeWeights: { ...(p.pools?.mapNodeWeights || {}), [key]: Number(e.target.value) } } }))}
                      className="w-14 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-center text-zinc-100" />
                    <span className="text-xs text-amber-400 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
              <div className="mt-2 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 text-xs text-zinc-400">
                💡 Example with current weights: on a 10-node map expect ~
                {Object.entries(config.pools?.mapNodeWeights || { combat: 3, shop: 1, rest: 1, event: 1 }).map(([k, v]) => {
                  const total = Object.values(config.pools?.mapNodeWeights || { combat: 3, shop: 1, rest: 1, event: 1 }).reduce((s, n) => s + n, 0);
                  return total > 0 ? ` ${Math.round((v / total) * 10)} ${k}` : '';
                }).join(',')} nodes
              </div>
            </SectionCard>

            {/* Gem Shop Items */}
            <SectionCard title="💎 Gem Shop Items">
              <p className="text-zinc-400 text-sm mb-4">Define items purchasable with gems during or between runs. Toggle each item on/off for the shop pool.</p>
              {(() => {
                const GEM_SHOP_DEFAULTS = [
                  { id: 'reroll_token', label: 'Reroll Token', desc: '+1 free reroll next combat', cost: 30 },
                  { id: 'max_hp_5', label: '+5 Max HP', desc: 'Permanent for this run', cost: 40 },
                  { id: 'start_gold_2', label: '+2 Starting Gold', desc: 'Begin next run with +2 gold', cost: 25 },
                  { id: 'companion_revive', label: 'Companion Revive', desc: 'Restore companion if KO', cost: 50 },
                  { id: 'artifact_reroll', label: 'Artifact Reroll', desc: 'Swap current artifact for new one', cost: 60 },
                  { id: 'xp_boost', label: 'XP Boost (1.5×)', desc: '+50% XP earned this run', cost: 35 },
                  { id: 'shield_start', label: 'Starting Shield (5)', desc: 'Begin each combat with 5 shield', cost: 45 },
                  { id: 'dice_upgrade', label: 'Dice Upgrade', desc: '+1 to all die face values this run', cost: 70 },
                ];
                return (
                  <div className="space-y-2">
                    {GEM_SHOP_DEFAULTS.map((item) => {
                      const enabled = config.pools?.shopItemEnabled?.[item.id] !== false;
                      return (
                        <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${enabled ? 'border-amber-500/40 bg-amber-500/5' : 'border-zinc-700 bg-zinc-800/30 opacity-60'}`}>
                          <button
                            onClick={() => setConfig(p => ({ ...p, pools: { ...p.pools, shopItemEnabled: { ...(p.pools?.shopItemEnabled || {}), [item.id]: !enabled } } }))}
                            className={`w-8 h-5 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-amber-500' : 'bg-zinc-600'}`}
                          >
                            <span className={`block w-4 h-4 rounded-full bg-white transition-transform mx-0.5 ${enabled ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-zinc-200">{item.label}</div>
                            <div className="text-xs text-zinc-500">{item.desc}</div>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold text-amber-300 shrink-0">
                            <span>💎</span>
                            <input type="number" min={0} max={999}
                              defaultValue={item.cost}
                              className="w-14 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-center text-amber-300"
                              onClick={(e) => e.stopPropagation()} />
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded border ${enabled ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300' : 'bg-zinc-700 border-zinc-600 text-zinc-500'}`}>
                            {enabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </SectionCard>

            <div className="flex justify-end">
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Pool Config</AmberBtn>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            TEST GAME TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'testgame' && (
          <div className="space-y-6">
            <SectionCard title="🕹️ Test Game">
              <p className="text-zinc-400 text-sm">Live game preview. Apply a test preset in OPS tab first, then reload the iframe to test a specific progression state.</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button key={key} onClick={() => { applyPreset(key); setStatus('✅ Preset applied — reload iframe'); }}
                    className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-sm hover:border-amber-500/50 transition-colors">
                    {preset.emoji} {preset.label}
                  </button>
                ))}
                <a href="/diejungle" target="_blank" rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-sm font-medium">
                  🔗 Open in new tab
                </a>
              </div>
            </SectionCard>

            {/* Embedded game */}
            <div className="rounded-xl border border-zinc-700 overflow-hidden bg-zinc-900">
              <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
                <span className="text-xs text-zinc-400 font-mono">/diejungle</span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const iframe = document.getElementById('game-iframe');
                    if (iframe) iframe.src = iframe.src;
                  }} className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1">
                    🔄 Reload
                  </button>
                </div>
              </div>
              <iframe
                id="game-iframe"
                src="/diejungle"
                className="w-full"
                style={{ height: '700px', border: 'none' }}
                title="Die in the Jungle — live test"
              />
            </div>

            {/* English UI reference */}
            <SectionCard title="📝 UI Text Reference (English)">
              <p className="text-zinc-400 text-sm mb-4">All in-game labels and their intended English text. Use as reference when checking translations.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { screen: 'Map', key: 'node_combat', en: 'Combat' },
                  { screen: 'Map', key: 'node_shop', en: 'Shop' },
                  { screen: 'Map', key: 'node_rest', en: 'Rest Camp' },
                  { screen: 'Map', key: 'node_event', en: 'Event' },
                  { screen: 'Map', key: 'node_boss', en: 'Boss' },
                  { screen: 'Combat', key: 'btn_roll', en: 'Roll Dice' },
                  { screen: 'Combat', key: 'btn_reroll', en: 'Reroll' },
                  { screen: 'Combat', key: 'btn_confirm', en: 'Confirm Attack' },
                  { screen: 'Combat', key: 'lane_top', en: 'Top Lane' },
                  { screen: 'Combat', key: 'lane_mid', en: 'Mid Lane' },
                  { screen: 'Combat', key: 'lane_bot', en: 'Bot Lane' },
                  { screen: 'Combat', key: 'surge_label', en: 'SURGE!' },
                  { screen: 'Combat', key: 'enemy_intent', en: 'Intent' },
                  { screen: 'Shop', key: 'shop_refresh', en: 'Refresh' },
                  { screen: 'Shop', key: 'shop_buy', en: 'Buy' },
                  { screen: 'Rest', key: 'rest_heal', en: 'Rest & Heal' },
                  { screen: 'Rest', key: 'rest_skip', en: 'Skip' },
                  { screen: 'Meta', key: 'xp_label', en: 'XP' },
                  { screen: 'Meta', key: 'gems_label', en: 'Gems' },
                  { screen: 'Meta', key: 'unlock_tree', en: 'Unlock Tree' },
                  { screen: 'Meta', key: 'level_up', en: 'Level Up!' },
                  { screen: 'End', key: 'run_win', en: 'Victory! You escaped the jungle.' },
                  { screen: 'End', key: 'run_lose', en: 'You died in the jungle.' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <span className="text-[10px] text-zinc-500 w-16 shrink-0 font-mono">{item.screen}</span>
                    <span className="text-[10px] text-zinc-600 w-28 shrink-0 font-mono">{item.key}</span>
                    <span className="text-xs text-zinc-200">{item.en}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            ONBOARDING TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'onboarding' && (
          <div className="space-y-6">
            {/* Admin Welcome */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-6">
              <div className="text-2xl font-black text-amber-300 mb-1">🧭 Welcome to the Admin Panel</div>
              <p className="text-zinc-400 text-sm">Everything you need to manage, tune, and ship <strong className="text-zinc-200">Die In The Jungle</strong>. This panel controls the live game config — changes save instantly to the backend.</p>
            </div>

            {/* System Health */}
            {(() => {
              const [health, setHealth] = React.useState(null);
              const [checking, setChecking] = React.useState(false);
              async function runHealthCheck() {
                setChecking(true);
                const results = {};
                // Check API
                try {
                  const r = await fetch('/api/miniapp/config', { signal: AbortSignal.timeout(3000) });
                  results.api = r.ok ? 'ok' : 'error';
                } catch { results.api = 'down'; }
                // Check game route
                try {
                  const r = await fetch('/diejungle', { signal: AbortSignal.timeout(3000) });
                  results.game = r.ok ? 'ok' : 'error';
                } catch { results.game = 'down'; }
                // Check leaderboard
                try {
                  const r = await fetch('/api/miniapp/leaderboard', { signal: AbortSignal.timeout(3000) });
                  results.leaderboard = r.ok ? 'ok' : 'error';
                } catch { results.leaderboard = 'down'; }
                // Check assets upload endpoint
                try {
                  const r = await fetch('/api/miniapp/assets/upload-batch', { method: 'OPTIONS', signal: AbortSignal.timeout(3000) });
                  results.uploads = (r.ok || r.status === 405) ? 'ok' : 'error';
                } catch { results.uploads = 'down'; }
                // localStorage
                try {
                  localStorage.setItem('__health_check', '1');
                  localStorage.removeItem('__health_check');
                  results.localStorage = 'ok';
                } catch { results.localStorage = 'down'; }
                setHealth(results);
                setChecking(false);
              }
              const statusColor = (s) => s === 'ok' ? 'text-emerald-400' : s === 'error' ? 'text-amber-400' : 'text-rose-400';
              const statusIcon = (s) => s === 'ok' ? '✅' : s === 'error' ? '⚠️' : '❌';
              const statusLabel = (s) => s === 'ok' ? 'OK' : s === 'error' ? 'Error' : s === 'down' ? 'DOWN' : '?';
              return (
                <SectionCard title="🩺 System Health Check">
                  <p className="text-zinc-400 text-sm mb-4">Verify that all services are running before making changes.</p>
                  <div className="flex gap-3 mb-4">
                    <button onClick={runHealthCheck} disabled={checking}
                      className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-sm font-medium disabled:opacity-50 transition-colors">
                      {checking ? '⏳ Checking...' : '🔍 Run Health Check'}
                    </button>
                    {health && <span className="text-xs text-zinc-500 self-center">Last checked just now</span>}
                  </div>
                  {health && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { key: 'api', label: 'Game Config API' },
                        { key: 'game', label: 'Game Route' },
                        { key: 'leaderboard', label: 'Leaderboard API' },
                        { key: 'uploads', label: 'Upload API' },
                        { key: 'localStorage', label: 'localStorage' },
                      ].map(({ key, label }) => (
                        <div key={key} className={`rounded-lg border p-3 text-center ${health[key] === 'ok' ? 'border-emerald-500/40 bg-emerald-500/5' : health[key] === 'error' ? 'border-amber-500/40 bg-amber-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
                          <div className="text-xl mb-1">{statusIcon(health[key])}</div>
                          <div className={`text-xs font-bold ${statusColor(health[key])}`}>{statusLabel(health[key])}</div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              );
            })()}

            {/* Admin Panel Express Tour */}
            <SectionCard title="⚡ Admin Panel — Express Tour">
              <p className="text-zinc-400 text-sm mb-4">Quick reference for every tab. Click to jump.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { tab: 'ops', icon: '🎮', name: 'OPS', desc: 'Apply test presets, view localStorage meta state, clear run data.' },
                  { tab: 'difficulty', icon: '💀', name: 'Difficulty', desc: 'Master 1-5 skull slider + 12 individual multipliers (HP, DMG, crit, etc.).' },
                  { tab: 'pool', icon: '🎱', name: 'Pool', desc: 'Artifact rarity weights, map node distribution, gem shop items on/off.' },
                  { tab: 'enemies', icon: '👹', name: 'Enemies', desc: 'Add/edit/delete custom enemies with stats, traits, and image.' },
                  { tab: 'artifacts', icon: '💎', name: 'Artifacts', desc: 'CRUD for custom artifacts — name, rarity, emoji, passive effect.' },
                  { tab: 'events', icon: '🎲', name: 'Events', desc: 'Create random events, NPC encounters, and rest camp bonuses.' },
                  { tab: 'characters', icon: '🎭', name: 'Characters', desc: 'Upload portraits + emotion images, edit base stats per character.' },
                  { tab: 'narrative', icon: '📖', name: 'Narrative', desc: '6 story arcs × 33 lines each. Edit lore text and arc images.' },
                  { tab: 'assets', icon: '🖼️', name: 'Assets', desc: 'Batch upload images (preview before confirm). Browse all assets.' },
                  { tab: 'metaxp', icon: '📈', name: 'Meta XP', desc: 'XP thresholds, gem costs, level rewards, run XP/gem earn rates.' },
                  { tab: 'roadmap', icon: '🗺️', name: 'Roadmap', desc: 'Feature tracking: Done / In Progress / Backlog. Collapsible sections.' },
                  { tab: 'sprint', icon: '🏃', name: 'Sprint', desc: 'Sprint goals checklist + notes. Track current dev priorities.' },
                  { tab: 'docs', icon: '📚', name: 'Docs', desc: 'Full game documentation: loop, dice, combat, API, deployment.' },
                  { tab: 'sound', icon: '🎵', name: 'Sound', desc: 'Upload MP3 sounds per event (43 slots, 6 categories). Preview + check.' },
                  { tab: 'brand', icon: '🎨', name: 'Brand Kit', desc: 'Colors, typography, logos, social templates, brand voice editor.' },
                  { tab: 'testgame', icon: '🕹️', name: 'Test Game', desc: 'Embedded live game iframe + English UI text reference.' },
                  { tab: 'advanced', icon: '🔬', name: 'Advanced', desc: 'Raw JSON editors for monsters, artifacts, events. Power-user only.' },
                ].map(({ tab, icon, name, desc }) => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className="text-left p-3 rounded-lg border border-zinc-700 bg-zinc-800/40 hover:border-amber-500/50 hover:bg-amber-500/5 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{icon}</span>
                      <span className="font-bold text-sm text-zinc-200">{name}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
                  </button>
                ))}
              </div>
            </SectionCard>

            {/* Game Tutorial */}
            <SectionCard title="🎮 Game Tutorial — What Players Need to Know">
              <p className="text-zinc-400 text-sm mb-4">Use this as reference when writing in-game tutorial text or explaining the game to new players. Everything is in English.</p>
              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    title: 'The Goal',
                    icon: '🏆',
                    color: 'amber',
                    content: 'Survive 3 zones of the jungle. Each zone has a boss at the end. Defeat all 3 bosses to win the run. You keep XP and gems even if you die.',
                  },
                  {
                    step: '02',
                    title: 'Navigate the Map',
                    icon: '🗺️',
                    color: 'cyan',
                    content: 'The zone map has branching paths. Each node is one encounter: combat, shop, rest camp, or random event. Choose your path wisely — some paths have more shops, others more fights.',
                  },
                  {
                    step: '03',
                    title: 'Roll & Place Dice',
                    icon: '🎲',
                    color: 'violet',
                    content: 'In combat, you roll 5 dice each turn. Place them into 3 lanes (Top / Mid / Bot). Each die resolves its effect based on its face: ⚔️ Attack, 🛡️ Shield, ❤️ Heal, ⚡ Energy.\n\nTip: You can reroll once per turn (costs score points).',
                  },
                  {
                    step: '04',
                    title: 'SURGE — The Key Mechanic',
                    icon: '⚡',
                    color: 'amber',
                    content: 'Place 3 dice of the SAME type in a single turn to trigger a SURGE bonus. Example: 3 attack dice = massive damage burst. Build your placement around SURGE combos.',
                  },
                  {
                    step: '05',
                    title: 'Artifacts & Shop',
                    icon: '💎',
                    color: 'emerald',
                    content: 'Artifacts give permanent passive bonuses for the run. Visit shops to buy new items with gold you earn from combat. Gold resets each run — spend it!',
                  },
                  {
                    step: '06',
                    title: 'Meta Progression',
                    icon: '📈',
                    color: 'rose',
                    content: 'XP and Gems carry over between runs. Level up to unlock new characters, dice special faces, companions, and weapon slots. Spend Gems to unlock things early or buy boosts.',
                  },
                  {
                    step: '07',
                    title: 'Companions',
                    icon: '🦎',
                    color: 'cyan',
                    content: 'Once unlocked, bring a companion into your run. They give a passive bonus AND an active ability:\n• Gecko 🦎 — passive dodge, active stun\n• Croak 🐊 — passive ATK, active burst damage\n• L\'Oeil 👁️ — passive intel, active vision + free reroll',
                  },
                ].map(({ step, title, icon, color, content }) => (
                  <div key={step} className={`rounded-xl border p-4 ${color === 'amber' ? 'border-amber-500/30 bg-amber-500/5' : color === 'cyan' ? 'border-cyan-500/30 bg-cyan-500/5' : color === 'violet' ? 'border-violet-500/30 bg-violet-500/5' : color === 'emerald' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{icon}</span>
                      <div>
                        <span className={`text-[10px] font-mono font-bold ${color === 'amber' ? 'text-amber-500' : color === 'cyan' ? 'text-cyan-500' : color === 'violet' ? 'text-violet-500' : color === 'emerald' ? 'text-emerald-500' : 'text-rose-500'}`}>STEP {step}</span>
                        <div className="font-bold text-zinc-100">{title}</div>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">{content}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Minimalist Tutorial Screens */}
            <SectionCard title="📱 Tutorial Mode — First-Run Screens">
              <p className="text-zinc-400 text-sm mb-4">These are the 4 screens shown to new players (totalRuns === 0) the first time they launch the game. Text is final English copy.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    screen: 1,
                    title: 'Welcome to the Jungle',
                    body: 'A roguelite dice combat game.\nEvery run is different.\nEvery death makes you stronger.',
                    cta: 'Start →',
                  },
                  {
                    screen: 2,
                    title: 'Roll. Place. Survive.',
                    body: 'Each turn: roll 5 dice, place them in 3 lanes.\n⚔️ Top — Attack\n🛡️ Mid — Shield\n❤️ Bot — Heal\n\nPlace 3 of the same type to trigger SURGE.',
                    cta: 'Got it →',
                  },
                  {
                    screen: 3,
                    title: 'Navigate the Map',
                    body: 'Choose your path through 3 zones.\nFight enemies, visit shops, rest at camps.\nReach the boss at the end of each zone.',
                    cta: 'Let\'s go →',
                  },
                  {
                    screen: 4,
                    title: 'You Keep Your Progress',
                    body: 'XP and Gems carry over between runs.\nLevel up to unlock characters, companions, and special dice.\n\nDeath is not the end. It\'s practice.',
                    cta: 'Begin Run →',
                  },
                ].map(({ screen, title, body, cta }) => (
                  <div key={screen} className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
                    <div className="bg-zinc-800 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Tutorial Screen {screen} / 4
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="text-lg font-black text-amber-300">{title}</div>
                      <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">{body}</p>
                      <div className="pt-2">
                        <span className="inline-block px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-bold">{cta}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700 text-xs text-zinc-400">
                💡 <strong className="text-zinc-300">Dev note:</strong> Show these screens when <code className="text-amber-300">meta.totalRuns === 0</code>. Store seen state in <code className="text-amber-300">localStorage: jk_tutorial_seen_v1</code>. Skip if flag is set.
              </div>
            </SectionCard>

            {/* Elevator pitch */}
            <SectionCard title="🗣️ How to Explain the Game (Pitch Texts)">
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/40">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">1-Line Pitch</div>
                  <p className="text-zinc-100 font-medium">"Die In The Jungle is a roguelite dice game — roll your fate, build your run, escape the jungle or die trying."</p>
                </div>
                <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/40">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Elevator Pitch (30 sec)</div>
                  <p className="text-zinc-300 text-sm leading-relaxed">"It's a roguelite where you roll 5 dice each turn and place them into lanes to attack, shield, or heal. Place 3 of the same type and you trigger a SURGE bonus. Between fights you navigate a branching map, collect artifacts, and fight zone bosses. Die and you keep your XP — unlock new characters, companions, and dice specials over time."</p>
                </div>
                <div className="p-4 rounded-lg border border-zinc-700 bg-zinc-800/40">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Telegram Post (for marketing)</div>
                  <p className="text-zinc-300 text-sm leading-relaxed">"🎲 Die In The Jungle drops today on Telegram Mini App.\nRoguelite dice combat. 3 zones. One life.\nEvery roll matters. Every death teaches you.\nPlay now → [link] #JungleKabal"</p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            VISUALS TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'visuals' && (
          <div className="space-y-6">
            <SectionCard title="🌿 Global Visuals">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'backgroundUrl', label: '🖼️ Default Background URL', placeholder: 'https://i.postimg.cc/...' },
                  { key: 'logoUrl', label: '🏷️ Logo URL', placeholder: 'https://i.postimg.cc/...' },
                  { key: 'storyFragmentImageUrl', label: '📜 Story Fragment Image', placeholder: 'https://i.postimg.cc/...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm text-zinc-400">{label}</label>
                    {config.visuals?.[key] && <img src={config.visuals[key]} alt={key} className="w-full h-24 object-cover rounded border border-zinc-700" />}
                    <input
                      value={config.visuals?.[key] || ''}
                      onChange={(e) => setConfig(p => ({ ...p, visuals: { ...(p.visuals || {}), [key]: e.target.value } }))}
                      placeholder={placeholder}
                      className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    />
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Biome Backgrounds */}
            <SectionCard title="🌍 Biome Backgrounds (per Zone)">
              <p className="text-zinc-400 text-sm mb-4">Up to 4 background variants per biome. The game randomly picks one when entering a zone. Biome order: Zone 1 = Jungle, Zone 2 = Ruins, Zone 3 = Temple, Zone 4+ = Abyss.</p>
              {[
                { id: 'jungle', label: '🌿 Jungle (Zone 1)', color: 'emerald' },
                { id: 'ruins', label: '🏛️ Ruins (Zone 2)', color: 'amber' },
                { id: 'temple', label: '⛩️ Temple (Zone 3)', color: 'violet' },
                { id: 'abyss', label: '🌑 Abyss (Zone 4+)', color: 'zinc' },
              ].map(({ id, label, color }) => (
                <div key={id} className={`p-4 rounded-xl border mb-4 ${color === 'emerald' ? 'border-emerald-800/40 bg-emerald-900/10' : color === 'amber' ? 'border-amber-800/40 bg-amber-900/10' : color === 'violet' ? 'border-violet-800/40 bg-violet-900/10' : 'border-zinc-700 bg-zinc-800/30'}`}>
                  <div className="font-medium text-zinc-200 mb-3">{label}</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((slot) => {
                      const url = config.biomeBackgrounds?.[id]?.[slot] || '';
                      return (
                        <div key={slot} className="space-y-1">
                          <div className="text-xs text-zinc-500">Variant {slot + 1}</div>
                          <div className="flex gap-2 items-start">
                            {url && <img src={url} alt={`${id}-${slot}`} className="w-16 h-10 object-cover rounded border border-zinc-700 shrink-0" />}
                            <input
                              value={url}
                              onChange={(e) => {
                                const bgs = JSON.parse(JSON.stringify(config.biomeBackgrounds || EMPTY_CONFIG.biomeBackgrounds));
                                if (!Array.isArray(bgs[id])) bgs[id] = ['', '', '', ''];
                                bgs[id][slot] = e.target.value;
                                setConfig(p => ({ ...p, biomeBackgrounds: bgs }));
                              }}
                              placeholder="https://..."
                              className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-100"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Visuals</AmberBtn>
            </SectionCard>

            {/* UI Colors quick override */}
            <SectionCard title="🎨 Quick Color Override">
              <p className="text-zinc-400 text-sm mb-4">Override brand colors without going to Brand Kit. These sync with the CSS variables.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'primaryColor', label: 'Primary' },
                  { key: 'secondaryColor', label: 'Secondary' },
                  { key: 'accentColor', label: 'Accent' },
                  { key: 'backgroundColor', label: 'Background' },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs text-zinc-400">{label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color"
                        value={config.brandKit?.[key] || '#000000'}
                        onChange={(e) => setConfig(p => ({ ...p, brandKit: { ...(p.brandKit || {}), [key]: e.target.value } }))}
                        className="w-10 h-10 rounded cursor-pointer border border-zinc-700 bg-transparent" />
                      <input type="text"
                        value={config.brandKit?.[key] || ''}
                        onChange={(e) => setConfig(p => ({ ...p, brandKit: { ...(p.brandKit || {}), [key]: e.target.value } }))}
                        className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-xs text-zinc-100 font-mono" />
                    </div>
                  </div>
                ))}
              </div>
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Colors</AmberBtn>
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            DEPLOY TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <SectionCard title="🚀 Deploy & Release">
              <p className="text-zinc-400 text-sm">Track deployments, write release notes, and verify the live endpoints.</p>
            </SectionCard>

            {/* Quick Links */}
            <SectionCard title="🔗 Quick Links">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: '🎮 Game (web)', href: '/diejungle', color: 'cyan' },
                  { label: '⚙️ Admin Panel', href: '/diejungle/admin', color: 'amber' },
                  { label: '📱 Mini App (local)', href: 'http://localhost:5180', color: 'violet' },
                  { label: '🌐 Vercel Dashboard', href: 'https://vercel.com/dashboard', color: 'zinc', external: true },
                  { label: '📦 GitHub Repo', href: 'https://github.com/chris-blvck/JungleKabal2026', color: 'zinc', external: true },
                  { label: '🤖 Telegram BotFather', href: 'https://t.me/botfather', color: 'zinc', external: true },
                ].map(({ label, href, color, external }) => (
                  <a key={href} href={href} target={external ? '_blank' : undefined} rel="noreferrer"
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors text-sm font-medium ${color === 'cyan' ? 'border-cyan-700/40 bg-cyan-700/10 text-cyan-300 hover:bg-cyan-700/20' : color === 'amber' ? 'border-amber-700/40 bg-amber-700/10 text-amber-300 hover:bg-amber-700/20' : color === 'violet' ? 'border-violet-700/40 bg-violet-700/10 text-violet-300 hover:bg-violet-700/20' : 'border-zinc-700 bg-zinc-800/40 text-zinc-300 hover:bg-zinc-700/60'}`}>
                    {label}
                    {external && <span className="text-[10px] text-zinc-600 ml-auto">↗</span>}
                  </a>
                ))}
              </div>
            </SectionCard>

            {/* Release Notes Editor */}
            <SectionCard title="📝 Release Notes">
              <p className="text-zinc-400 text-sm mb-3">Write the changelog for the current release. Saved to config and can be shown in-game on the "What's New" screen.</p>
              <textarea
                value={config.releaseNotes || ''}
                onChange={(e) => setConfig(p => ({ ...p, releaseNotes: e.target.value }))}
                rows={10}
                placeholder={`v1.3 — 2025-03-15\n• Added companion select screen\n• Fixed KKM unlock gating\n• New event: Mysterious Merchant\n• Biome backgrounds now cycle per zone\n• Balance: Zone 2 boss HP reduced 10%`}
                className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 font-mono"
              />
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save Release Notes</AmberBtn>
            </SectionCard>

            {/* Deployment Checklist */}
            <SectionCard title="✅ Deploy Checklist">
              <p className="text-zinc-400 text-sm mb-4">Run through this before pushing to production.</p>
              {(() => {
                const checks = [
                  { id: 'build', label: 'npm run build passes with 0 errors' },
                  { id: 'game_loads', label: '/diejungle loads without console errors' },
                  { id: 'admin_loads', label: '/diejungle/admin loads and tabs work' },
                  { id: 'api_config', label: 'GET /api/miniapp/config returns 200' },
                  { id: 'api_save', label: 'PUT /api/miniapp/config saves correctly' },
                  { id: 'run_test', label: 'Played at least 1 full run in test mode' },
                  { id: 'meta_xp', label: 'XP and gems awarded at run end' },
                  { id: 'kkm_gate', label: 'KKM locked for fresh account (no character_kkm unlock)' },
                  { id: 'mobile', label: 'Tested on mobile viewport (360px)' },
                  { id: 'telegram', label: 'Telegram Mini App opens correctly' },
                  { id: 'release_notes', label: 'Release notes written above' },
                  { id: 'config_saved', label: 'Config saved to backend (not just local state)' },
                ];
                const [checked, setChecked] = React.useState({});
                const doneCount = Object.values(checked).filter(Boolean).length;
                return (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(doneCount / checks.length) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-emerald-400">{doneCount}/{checks.length}</span>
                    </div>
                    {checks.map((c) => (
                      <label key={c.id} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${checked[c.id] ? 'border-emerald-600/40 bg-emerald-600/5' : 'border-zinc-700 bg-zinc-800/30 hover:bg-zinc-800/60'}`}>
                        <input type="checkbox" checked={!!checked[c.id]} onChange={(e) => setChecked(p => ({ ...p, [c.id]: e.target.checked }))} className="accent-emerald-500" />
                        <span className={`text-sm ${checked[c.id] ? 'text-emerald-300 line-through' : 'text-zinc-300'}`}>{c.label}</span>
                      </label>
                    ))}
                    {doneCount === checks.length && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 text-sm font-bold text-center">
                        ✅ All checks passed — ready to deploy!
                      </div>
                    )}
                  </div>
                );
              })()}
            </SectionCard>

            {/* API Health (same as Onboarding) */}
            <SectionCard title="🩺 API Health">
              {(() => {
                const [health, setHealth] = React.useState(null);
                const [checking, setChecking] = React.useState(false);
                async function runCheck() {
                  setChecking(true);
                  const r = {};
                  const check = async (key, url, method = 'GET') => {
                    try { const res = await fetch(url, { method, signal: AbortSignal.timeout(3000) }); r[key] = (res.ok || res.status === 405) ? 'ok' : 'error'; }
                    catch { r[key] = 'down'; }
                  };
                  await Promise.all([
                    check('config_get', '/api/miniapp/config'),
                    check('leaderboard', '/api/miniapp/leaderboard'),
                    check('uploads', '/api/miniapp/assets/upload-batch', 'OPTIONS'),
                    check('game_route', '/diejungle'),
                  ]);
                  setHealth(r);
                  setChecking(false);
                }
                return (
                  <div>
                    <button onClick={runCheck} disabled={checking}
                      className="px-4 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-sm font-medium mb-3 disabled:opacity-50">
                      {checking ? '⏳ Checking...' : '🔍 Run Check'}
                    </button>
                    {health && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { key: 'config_get', label: 'Config API' },
                          { key: 'leaderboard', label: 'Leaderboard' },
                          { key: 'uploads', label: 'Uploads' },
                          { key: 'game_route', label: 'Game Route' },
                        ].map(({ key, label }) => (
                          <div key={key} className={`rounded-lg border p-3 text-center ${health[key] === 'ok' ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'}`}>
                            <div className="text-xl mb-1">{health[key] === 'ok' ? '✅' : '❌'}</div>
                            <div className={`text-xs font-bold ${health[key] === 'ok' ? 'text-emerald-400' : 'text-rose-400'}`}>{health[key] === 'ok' ? 'OK' : 'DOWN'}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  );
}
