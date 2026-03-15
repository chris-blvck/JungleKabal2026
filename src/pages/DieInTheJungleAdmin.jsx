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

const TABS = [
  { id: 'testgame', label: '🎮 Test & Presets' },
  { id: 'metaeditor', label: '🧬 Meta Editor' },
  { id: 'cheatmode', label: '🔧 Cheat Mode' },
  { id: 'gamelogic', label: '⚙️ Game Logic' },
  { id: 'enemies', label: '👾 Enemies' },
  { id: 'artifacts', label: '📦 Artifacts' },
  { id: 'assets', label: '🖼️ Assets' },
  { id: 'avatars', label: '🎭 Avatars' },
  { id: 'narrative', label: '📖 Narrative' },
  { id: 'advanced', label: '🔬 Advanced' },
  { id: 'roadmap', label: '🗺️ Roadmap' },
];

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

const EMPTY_CONFIG = {
  assets: { monsters: { mob: [], champions: [], boss: [] }, backgrounds: { jungle: [], ruins: [], temple: [] }, zones: { general: [] }, events: { general: [] } },
  gameLogic: { difficultyMultiplier: 1.0, enemyHpScale: 1, enemyDamageScale: 1, scoreScale: 1, randomEventChance: 0.2, waveGrowthPerStage: 0.12, bossHpMultiplier: 2.4, bossDamageMultiplier: 1.8, critChance: 0.12, critMultiplier: 1.75, dodgeChance: 0.08, lifeSteal: 0.05, shieldDecayPerTurn: 0.15, comboWindowTurns: 2, rerollCostScore: 20, reviveHpRatio: 0.35, eventIntensityScale: 1, dropRateMultiplier: 1 },
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
      { label: 'Meta progression system (XP + gems + unlock tree)', done: true },
      { label: 'Companion system (Gecko 🦎, Croak 🐊, L\'Œil 👁️)', done: true },
      { label: 'Companion active ability button in combat UI', done: true },
      { label: 'Special dice faces: Pierce, Echo, Nurture, Fortress', done: true },
      { label: 'SURGE mechanic (3 same type → bonus)', done: true },
      { label: 'Lane conditionals (top heal → reset CD, bot → coins)', done: true },
      { label: 'Enemy intents + modifiers (venom, thorns, regen, berserk, stoneSkin, swift)', done: true },
      { label: '2 playable characters (Kabalian + KKM with stats)', done: true },
      { label: 'Score system + leaderboard (local)', done: true },
      { label: 'Telegram SDK integration (init, user, expand)', done: true },
      { label: 'Admin panel (test presets, meta editor, game logic, enemies viewer, cheat mode)', done: true },
      { label: 'Backend API (config, assets, runs, referrals, leaderboard)', done: true },
      { label: 'Fortress shield persistence across turns', done: true },
      { label: 'Boss zone achievement tracking fixed', done: true },
      { label: 'AngelOpsDashboard routing fixed', done: true },
      { label: 'Standalone export: diejungle/ sub-project for diejungle.fun', done: true },
    ],
  },
  {
    section: '🔧 In Progress / Next Sprint',
    color: 'amber',
    items: [
      { label: 'Map doesn\'t refresh visually after combat — map state update bug', done: false },
      { label: 'Shop node on map (guaranteed every zone) + BOSS node at end of zone', done: false },
      { label: 'Zone visited history / breadcrumb panel on map', done: false },
      { label: 'Remove wallet connect button from game UI', done: false },
      { label: '"How to Score More" guide (replaces How to Play)', done: false },
      { label: 'Post-combat loot popup (choose: Max HP +2 / Mana / Gold coin) — fast, non-disruptive', done: false },
      { label: 'Free artifact after each Boss kill', done: false },
      { label: 'Random events: big image + text + 2-3 choices (or auto-reward) — fully visual', done: false },
      { label: 'Biome system — ZONES = Biomes with unique backgrounds + biome-specific enemies', done: false },
      { label: 'Biome changes after each boss (random, changes game background dynamically)', done: false },
      { label: 'Companion selection screen before run start', done: false },
      { label: 'KKM properly gated by meta unlock (character_kkm)', done: false },
      { label: 'Profile/unlock screen (spend gems, view unlock tree)', done: false },
      { label: 'Telegram Mini App hosted on diejungle.fun', done: false },
      { label: 'Namecheap DNS → Vercel domain migration for diejungle.fun', done: false },
    ],
  },
  {
    section: '🎮 Game Design — Confirmed Direction',
    color: 'violet',
    items: [
      { label: 'BIOMES: each zone = biome (jungle / ruins / temple / void / ...) with own background image', done: false },
      { label: 'BIOMES: biome-specific enemy pool (certain enemies only appear in certain biomes)', done: false },
      { label: 'BIOMES: biome is random after each boss, changing the visual atmosphere', done: false },
      { label: 'LOOT after each mob kill: fast popup — choose Max HP +2 / Mana charge / +1 Gold', done: false },
      { label: 'LOOT: popup must not break combat rhythm — 2 sec tap then auto-dismiss', done: false },
      { label: 'BOSS reward: guaranteed free artifact pick (3 choices)', done: false },
      { label: 'EVENTS: big image + lore text + 1-3 choices — sometimes pure auto-reward (no choice)', done: false },
      { label: 'EVENTS: visible on map as special node with image thumbnail', done: false },
      { label: 'MAP: shop guaranteed on every zone, before the boss', done: false },
      { label: 'MAP: zone history breadcrumbs — show biomes visited and boss kills', done: false },
      { label: 'WEAPON system: 6 archetypes × 3 variants × 4 rarities = 72 weapons to design', done: false },
      { label: 'MANA: resource for special abilities (companions + weapons use mana)', done: false },
      { label: 'Daily seed competitive run + daily score posted in Telegram channel', done: false },
      { label: 'Referral → +150 gems visible in profile (gems as flex currency)', done: false },
    ],
  },
  {
    section: '📋 Backlog',
    color: 'zinc',
    items: [
      { label: 'Weapon system — equip weapons with passives + specials in combat', done: false },
      { label: 'Share card auto-generated end of run (score + zone + artifacts + "Beat my score" CTA)', done: false },
      { label: 'Friend leaderboard (global + social graph)', done: false },
      { label: 'Seasons with limited relic pool and season badges', done: false },
      { label: 'Visual FX polish — hit flash, impact rings, lane-aware emitters', done: false },
      { label: 'Special dice faces visual badge on die card', done: false },
      { label: 'Server-side score verification / anti-cheat', done: false },
      { label: 'Mobile safe-area adjustment for Telegram in-app browser', done: false },
      { label: 'Boss zone 4 — full enemy pool', done: false },
      { label: 'More complex enemy intents per zone (charge+curse same turn, conditional heal < 30% HP)', done: false },
      { label: 'Custom enemies/artifacts from admin that merge with hardcoded pools', done: false },
    ],
  },
];

// ─── Bugs & Features Tracker ──────────────────────────────────────────────────
const KNOWN_ISSUES = [
  { status: 'fixed', label: 'AngelOpsDashboard import missing in App.jsx — runtime crash', date: '2026-03-15' },
  { status: 'fixed', label: 'Boss zone achievement never tracked (phase === "victory" never true)', date: '2026-03-15' },
  { status: 'fixed', label: 'Fortress shield tracked but never applied on next turn', date: '2026-03-15' },
  { status: 'open', label: 'Companion Croak missing achievementRequired — gem-only unlock', date: '2026-03-15' },
  { status: 'open', label: 'KKM character not gated by character_kkm unlock — always available', date: '2026-03-15' },
  { status: 'open', label: 'Weapon system imported but zero usage in game code', date: '2026-03-15' },
  { status: 'open', label: 'Companion selection screen missing before run start', date: '2026-03-15' },
  { status: 'open', label: 'Echo dice face (value 5) defined but behavior unclear', date: '2026-03-15' },
  { status: 'open', label: 'Curse hasCurse flag set but never read — dead code', date: '2026-03-15' },
  { status: 'open', label: 'Zone scaling caps at zone 4 — endless mode needs infinite scaling', date: '2026-03-15' },
  { status: 'open', label: 'Map events and shop costs hardcoded — not admin-tunable', date: '2026-03-15' },
  { status: 'open', label: 'Map doesn\'t visually refresh after combat (node not marked visited)', date: '2026-03-15' },
  { status: 'open', label: 'No shop node guaranteed on map — player can miss shop entirely', date: '2026-03-15' },
  { status: 'open', label: 'No boss node at end of zone — zone structure is random', date: '2026-03-15' },
  { status: 'open', label: 'Wallet connect button still visible — needs removal', date: '2026-03-15' },
  { status: 'open', label: 'Post-combat loot choice missing (Max HP / Mana / Gold)', date: '2026-03-15' },
  { status: 'open', label: 'No biome system — all zones use same background', date: '2026-03-15' },
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
        {/* Tab Bar */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${activeTab === tab.id ? 'bg-amber-500/25 border-amber-400/50 text-amber-200' : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-700/60'}`}>
              {tab.label}
            </button>
          ))}
        </div>

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

            {/* ── Master Difficulty Slider ─────────────────────────────────────── */}
            <div className="rounded-xl border-2 border-rose-500/40 bg-gradient-to-r from-rose-950/40 to-amber-950/30 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold text-rose-200">🎮 Master Difficulty</h3>
                  <p className="text-zinc-400 text-xs mt-0.5">Scales enemy HP + damage simultaneously. Applies to all players immediately on save.</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-rose-300">{Number(config.gameLogic?.difficultyMultiplier ?? 1.0).toFixed(1)}×</div>
                  <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                    {Number(config.gameLogic?.difficultyMultiplier ?? 1.0) <= 0.8 ? 'Easy' :
                     Number(config.gameLogic?.difficultyMultiplier ?? 1.0) <= 1.0 ? 'Normal' :
                     Number(config.gameLogic?.difficultyMultiplier ?? 1.0) <= 1.4 ? 'Hard' :
                     Number(config.gameLogic?.difficultyMultiplier ?? 1.0) <= 1.8 ? 'Brutal' : 'Nightmare'}
                  </div>
                </div>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={Number(config.gameLogic?.difficultyMultiplier ?? 1.0)}
                onChange={(e) => updateLogic('difficultyMultiplier', e.target.value)}
                className="w-full accent-rose-500 cursor-pointer"
                style={{ height: '8px' }}
              />
              <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>0.5× Easy</span>
                <span>1.0× Normal</span>
                <span>1.5× Hard</span>
                <span>2.0× Brutal</span>
                <span>2.5× Nightmare</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-zinc-400">
                <div className="rounded bg-black/30 p-2 text-center">
                  <div className="font-black text-zinc-200">HP ×{(Number(config.gameLogic?.difficultyMultiplier ?? 1.0) * (Number(config.gameLogic?.enemyHpScale ?? 1))).toFixed(2)}</div>
                  <div>enemy HP total</div>
                </div>
                <div className="rounded bg-black/30 p-2 text-center">
                  <div className="font-black text-zinc-200">DMG ×{(Number(config.gameLogic?.difficultyMultiplier ?? 1.0) * (Number(config.gameLogic?.enemyDamageScale ?? 1))).toFixed(2)}</div>
                  <div>enemy damage total</div>
                </div>
                <div className="rounded bg-black/30 p-2 text-center">
                  <button
                    onClick={() => { updateLogic('difficultyMultiplier', 1.0); }}
                    className="w-full rounded bg-zinc-700 hover:bg-zinc-600 px-2 py-1 text-xs font-bold"
                  >
                    Reset to 1.0×
                  </button>
                </div>
              </div>
              {logicDirty && (
                <button
                  onClick={() => saveConfig(config)}
                  className="mt-3 w-full rounded-lg bg-rose-600 hover:bg-rose-500 py-2 text-sm font-bold text-white"
                >
                  💾 Save Difficulty — Apply to All Players Now
                </button>
              )}
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
          </section>
        )}

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
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">🖼️ Asset Manager</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm">
                  {Object.keys(ASSET_SCHEMA).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Subcategory</label>
                <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm">
                  {availableSubcategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Upload (max 30)</label>
                <input type="file" accept="image/*" multiple onChange={onUpload} disabled={loading} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {assetBucket.slice(0, 120).map((asset) => {
                const key = asset.id || asset.url;
                const meta = config.assetsMeta?.[key] || {};
                return (
                  <figure key={key} className="rounded border border-zinc-700 bg-zinc-800 p-2 space-y-2">
                    <img src={asset.url} alt={asset.originalName || asset.fileName || 'asset'} className="w-full h-24 object-cover rounded" />
                    <figcaption className="text-[10px] text-zinc-300 truncate">{asset.originalName || asset.fileName}</figcaption>
                    <input placeholder="tags: poison,boss" value={meta.tags || ''} onChange={(e) => updateAssetMeta(asset, { tags: e.target.value })} className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1" />
                    <select value={meta.status || 'active'} onChange={(e) => updateAssetMeta(asset, { status: e.target.value })} className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1">
                      <option value="active">active</option>
                      <option value="draft">draft</option>
                      <option value="deprecated">deprecated</option>
                    </select>
                  </figure>
                );
              })}
              {assetBucket.length === 0 && <div className="col-span-full text-zinc-500 text-sm">No assets in this bucket yet. Upload some above.</div>}
            </div>
            <button onClick={() => saveConfig(config)} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-medium">💾 Save asset metadata</button>
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
      </div>
    </div>
  );
}
