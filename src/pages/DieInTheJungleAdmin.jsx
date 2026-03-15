import React, { useEffect, useMemo, useState, useRef } from 'react';

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
  { id: 'ops', label: '🎮 OPS' },
  { id: 'difficulty', label: '💀 Difficulty' },
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
  npcEncounters: [],
  restCamp: { healPercent: 30, bonusXp: 50, specialEvents: [] },
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
    npcEncounters: Array.isArray(raw.npcEncounters) ? raw.npcEncounters : [],
    restCamp: { ...EMPTY_CONFIG.restCamp, ...(raw.restCamp || {}) },
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

  function addSprintItem() {
    if (!newSprintItem.trim()) return;
    const item = { id: Date.now().toString(), text: newSprintItem.trim(), done: false };
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
          </div>
        )}


        {/* ══════════════════════════════════════════════════════════════════════
            ENEMIES TAB
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'enemies' && (
          <div className="space-y-6">
            <SectionCard title="👹 Enemy Pool">
              {config.monsters.customMonsters.length === 0 ? (
                <p className="text-zinc-500 text-sm">No custom enemies yet. Add one below.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {config.monsters.customMonsters.map((enemy) => (
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
            <div className="flex gap-2">
              {['kabalian', 'kkm'].map((char) => (
                <button
                  key={char}
                  onClick={() => setActiveCharacter(char)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    activeCharacter === char
                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {char === 'kabalian' ? '🐍 Kabalian' : '⚡ KKM'}
                </button>
              ))}
            </div>

            <SectionCard title={activeCharacter === 'kabalian' ? '🐍 Kabalian' : '⚡ KKM'}>
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
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Select files (max 30)</label>
                  <input type="file" accept="image/*" multiple onChange={onUpload} disabled={loading} className="text-sm text-zinc-300" />
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
                    <figure key={key} className="rounded border border-zinc-700 bg-zinc-800 p-2 space-y-2">
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
            <SectionCard title="📈 XP Thresholds (Level 1–20)">
              <p className="text-zinc-400 text-sm">Cumulative XP required to reach each level.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 text-zinc-400 text-xs">
                      <th className="text-left py-2 pr-4">Level</th>
                      <th className="text-left py-2 pr-4">XP Threshold</th>
                      <th className="text-left py-2 pr-4">Gem Cost (Unlock)</th>
                      <th className="text-left py-2">Unlocks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <tr key={i} className="border-b border-zinc-800/60 hover:bg-zinc-800/30">
                        <td className="py-2 pr-4 font-bold text-amber-400">{i + 1}</td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            value={(config.xpThresholds || DEFAULT_XP_THRESHOLDS)[i] ?? 0}
                            onChange={(e) => updateXpThreshold(i, e.target.value)}
                            className="w-28 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-100"
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <input
                            type="number"
                            placeholder="0"
                            value={config.xpGemCosts?.[i] ?? ''}
                            onChange={(e) => {
                              const costs = [...(config.xpGemCosts || Array(20).fill(0))];
                              costs[i] = Number(e.target.value);
                              setConfig(p => ({ ...p, xpGemCosts: costs }));
                            }}
                            className="w-20 rounded bg-zinc-800 border border-zinc-700 px-2 py-1 text-sm text-zinc-100"
                          />
                        </td>
                        <td className="py-2 text-xs text-zinc-500">
                          {ALL_UNLOCK_IDS[i] || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AmberBtn onClick={() => saveConfig(config)} disabled={loading}>💾 Save XP Table</AmberBtn>
            </SectionCard>

            <SectionCard title="Unlock Tree">
              <p className="text-zinc-400 text-sm mb-3">Unlock dependencies (level-gated).</p>
              <div className="space-y-2">
                {ALL_UNLOCK_IDS.map((id, i) => (
                  <div key={id} className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2">
                    <span className="text-amber-400 font-bold text-sm w-8">Lv{i + 2}</span>
                    <span className="font-mono text-sm text-zinc-200">{id}</span>
                    {i > 0 && <span className="text-xs text-zinc-500">← requires {ALL_UNLOCK_IDS[i - 1]}</span>}
                  </div>
                ))}
              </div>
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
              <div className="flex gap-2">
                <input
                  value={newSprintItem}
                  onChange={(e) => setNewSprintItem(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addSprintItem(); }}
                  placeholder="Add sprint goal..."
                  className="flex-1 rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
                <AmberBtn onClick={addSprintItem}>+ Add</AmberBtn>
              </div>

              {(!config.sprintItems || config.sprintItems.length === 0) ? (
                <p className="text-zinc-500 text-sm">No sprint goals yet. Add one above.</p>
              ) : (
                <div className="space-y-2">
                  {config.sprintItems.map((item) => (
                    <div key={item.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${item.done ? 'border-emerald-800/50 bg-emerald-900/10' : 'border-zinc-700 bg-zinc-800/40'}`}>
                      <button
                        onClick={() => toggleSprintItem(item.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${item.done ? 'bg-emerald-600 border-emerald-500' : 'border-zinc-600 hover:border-amber-400'}`}
                      >
                        {item.done && <span className="text-white text-xs">✓</span>}
                      </button>
                      <span className={`flex-1 text-sm ${item.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{item.text}</span>
                      <button onClick={() => removeSprintItem(item.id)} className="text-xs text-zinc-600 hover:text-rose-400">✕</button>
                    </div>
                  ))}
                  <div className="text-xs text-zinc-500 pt-1">
                    {(config.sprintItems || []).filter(i => i.done).length} / {(config.sprintItems || []).length} done
                  </div>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Sprint Notes">
              <textarea
                value={sprintNotes}
                onChange={(e) => setSprintNotes(e.target.value)}
                rows={8}
                placeholder="Sprint retrospective, blockers, notes..."
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
                content: `Die In The Jungle is a roguelite dice-based combat game. Each run the player navigates a branching zone map, fighting enemies, visiting shops, rest camps, and random events.\n\nCombat: Player rolls 5 dice each turn and places them in 3 lanes (Top/Mid/Bot). Each die resolves its lane effect based on its face type (Attack, Shield, Heal, Special). After placing, enemies execute their intent. SURGE: 3 dice of the same type in one turn trigger a bonus.\n\nRun ends when player HP reaches 0 or all zones are cleared.`,
              },
              {
                title: '🎲 Dice System',
                content: `Standard dice have faces: ATK (swords), DEF (shield), HEAL (heart), ENERGY (bolt).\n\nSpecial faces (unlockable): PIERCE — damage ignores defense. ECHO — repeats last lane. NURTURE — heals based on allies. FORTRESS — grants a shield block for 2 turns.\n\nDice can be rerolled for a score cost (configurable via rerollCostScore). SURGE triggers when 3+ dice of same type are placed in a single turn.`,
              },
              {
                title: '⚔️ Combat System',
                content: `Enemies have intents (declared at start of turn): Attack, Block, Buff, Special. Modifiers: venom (DoT), thorns (reflect), regen (HP regen), berserk (double damage next turn), stoneSkin (high defense), swift (acts twice).\n\nPlayer stats: HP, ATK, DEF, Speed. Critical hit chance and multiplier are configurable. Dodge chance allows complete avoidance. Life steal heals player on hit. Boss HP/Damage multipliers apply on top of base stats.`,
              },
              {
                title: '🦎 Companion System',
                content: `Companions are unlocked via meta progression. Available: Gecko 🦎 (passive: +dodge chance, active: Hypnose — stuns enemy for 1 turn), Croak 🐊 (passive: +ATK, active: Leap — deals burst damage), L\'Oeil 👁️ (passive: reveals enemy intents, active: Vision — exposes all hidden buffs).\n\nOne companion per run. Companion ability has a cooldown measured in turns.`,
              },
              {
                title: '📈 Meta Progression',
                content: `XP and Gems are awarded at run end. XP levels up the player and unlocks new features via the unlock tree. Gems can be spent to buy unlocks early or reroll.\n\nUnlock tree (order): character_kkm → weapon_slot_1 → dice_specials → lane_bonuses → companion_gecko → companion_croak → weapon_slot_2 → companion_oeil.\n\nAchievements are milestone flags (zone boss firsts, etc.) stored per-player.`,
              },
              {
                title: '🔌 API Endpoints',
                content: `GET  /api/miniapp/config — Load game config\nPUT  /api/miniapp/config — Save game config\nPOST /api/miniapp/assets/upload-batch — Upload assets (batch)\nPOST /api/miniapp/runs/start — Record run start\nPOST /api/miniapp/runs/end — Record run end (awards XP/gems)\nGET  /api/miniapp/leaderboard — Get leaderboard entries\nPOST /api/miniapp/referral — Record referral\nGET  /api/miniapp/user/:id — Get user meta`,
              },
              {
                title: '🚀 Deployment',
                content: `Frontend: Vite + React, deployed via static build. Routes: /diejungle (game), /diejungle/admin (this panel).\n\nBackend: Node.js Express API at /api/miniapp/*. Assets stored in /public/uploads or CDN.\n\nTelegram Mini App: Separate Vite app on port 5180 (dev) or embedded via botFather webAppUrl. Uses Telegram WebApp SDK for auth (initDataUnsafe).`,
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
              <p className="text-zinc-400 text-sm">Edit raw game data. Invalid JSON will be rejected on save.</p>
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

      </div>
    </div>
  );
}
