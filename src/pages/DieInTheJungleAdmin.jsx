import React, { useEffect, useMemo, useState } from 'react';

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
      xp: 0,
      gems: 0,
      unlockedIds: [],
      achievements: [],
      totalRuns: 0,
      totalKills: 0,
      bestScore: 0,
    },
  },
  levelXX: {
    label: 'Level XX — Everything Unlocked',
    description: 'All companions, both weapon slots, KKM, dice specials, lane bonuses. Max progression.',
    emoji: '🏆',
    color: 'amber',
    meta: {
      xp: 5000,
      gems: 1500,
      unlockedIds: ALL_UNLOCK_IDS,
      achievements: ALL_ACHIEVEMENTS,
      totalRuns: 42,
      totalKills: 280,
      bestScore: 18500,
    },
  },
  midGame: {
    label: 'Mid Game — Zone 2 Clear',
    description: 'KKM unlocked + weapon slot 1 + dice specials + lane bonuses. No companions yet.',
    emoji: '⚔️',
    color: 'blue',
    meta: {
      xp: 900,
      gems: 200,
      unlockedIds: ['character_kkm', 'weapon_slot_1', 'dice_specials', 'lane_bonuses'],
      achievements: ['zone1_boss_first', 'zone2_boss_first'],
      totalRuns: 8,
      totalKills: 52,
      bestScore: 4200,
    },
  },
};

// ─── Asset Schema ─────────────────────────────────────────────────────────────
const ASSET_SCHEMA = {
  monsters: ['mob', 'champions', 'boss'],
  backgrounds: ['jungle', 'ruins', 'temple'],
  zones: ['general'],
  events: ['general'],
};

const TABS = [
  { id: 'testgame', label: '🎮 Test Game' },
  { id: 'roadmap', label: '🗺️ Roadmap' },
  { id: 'assets', label: '🖼️ Assets' },
  { id: 'gamelogic', label: '⚙️ Game Logic' },
  { id: 'avatars', label: '🎭 Avatars' },
  { id: 'narrative', label: '📖 Narrative' },
  { id: 'advanced', label: '🔬 Advanced' },
];

const GAME_LOGIC_GROUPS = {
  difficulty: ['enemyHpScale', 'enemyDamageScale', 'waveGrowthPerStage', 'bossHpMultiplier', 'bossDamageMultiplier', 'eventIntensityScale'],
  combat: ['critChance', 'critMultiplier', 'dodgeChance', 'lifeSteal', 'shieldDecayPerTurn', 'comboWindowTurns', 'reviveHpRatio'],
  economy: ['scoreScale', 'dropRateMultiplier', 'rerollCostScore', 'randomEventChance'],
};

const EMPTY_CONFIG = {
  assets: {
    monsters: { mob: [], champions: [], boss: [] },
    backgrounds: { jungle: [], ruins: [], temple: [] },
    zones: { general: [] },
    events: { general: [] },
  },
  gameLogic: {
    enemyHpScale: 1,
    enemyDamageScale: 1,
    scoreScale: 1,
    randomEventChance: 0.2,
    waveGrowthPerStage: 0.12,
    bossHpMultiplier: 2.4,
    bossDamageMultiplier: 1.8,
    critChance: 0.12,
    critMultiplier: 1.75,
    dodgeChance: 0.08,
    lifeSteal: 0.05,
    shieldDecayPerTurn: 0.15,
    comboWindowTurns: 2,
    rerollCostScore: 20,
    reviveHpRatio: 0.35,
    eventIntensityScale: 1,
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
};

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
      { label: 'Companion system (Gecko 🦎, Croak 🐊, L\'Œil 👁️)', done: true },
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
  };
}

function JsonEditor({ label, value, onSave, rows = 12 }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  useEffect(() => setText(JSON.stringify(value, null, 2)), [value]);
  return (
    <div className="space-y-2">
      <div className="text-sm text-zinc-300 font-medium">{label}</div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={rows} className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono" />
      <button onClick={() => { const parsed = JSON.parse(text); onSave(parsed); }} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm">
        Sauvegarder {label}
      </button>
    </div>
  );
}

// ─── Meta Progression Reader ──────────────────────────────────────────────────
function readLocalMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function MetaStatusBadge({ id, meta }) {
  const unlocked = meta?.unlockedIds?.includes(id);
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${unlocked ? 'bg-emerald-600/40 text-emerald-200 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
      {unlocked ? '✅ Unlocked' : '🔒 Locked'}
    </span>
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

  // Refresh local meta display
  function refreshLocalMeta() {
    setLocalMeta(readLocalMeta());
  }

  useEffect(() => {
    refreshLocalMeta();
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    setStatus('Chargement...');
    try {
      const res = await fetch('/api/miniapp/config');
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Load failed');
      setConfig(withDefaults(payload.config || EMPTY_CONFIG));
      setStatus('✅ Config chargée');
    } catch (error) {
      setStatus(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig(nextConfig) {
    setLoading(true);
    setStatus('Sauvegarde...');
    try {
      const res = await fetch('/api/miniapp/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextConfig),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Save failed');
      setConfig(withDefaults(payload.config || nextConfig));
      setStatus('✅ Config sauvegardée');
    } catch (error) {
      setStatus(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function onUpload(event) {
    const files = Array.from(event.target.files || []).slice(0, 30);
    if (!files.length) return;
    setLoading(true);
    setStatus(`Upload de ${files.length} fichier(s)...`);
    try {
      const prepared = await Promise.all(files.map(async (file) => ({ name: file.name, dataUrl: await toDataUrl(file) })));
      const res = await fetch('/api/miniapp/assets/upload-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subcategory, files: prepared }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) throw new Error(payload.error || 'Upload failed');
      setConfig(withDefaults(payload.config || config));
      setStatus(`✅ ${payload.uploaded?.length || files.length} asset(s) uploadés`);
      event.target.value = '';
    } catch (error) {
      setStatus(`❌ ${error.message}`);
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
    const next = {
      ...config,
      assetsMeta: {
        ...(config.assetsMeta || {}),
        [key]: { ...current, ...patch },
      },
    };
    setConfig(next);
  }

  // ── Test Preset Actions ──────────────────────────────────────────────────────
  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;
    // Set meta progression
    localStorage.setItem(META_KEY, JSON.stringify(preset.meta));
    // Clear game state so next run starts fresh
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
    a.download = `ditj-meta-${Date.now()}.json`;
    a.click();
  }

  const colorMap = {
    emerald: 'border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500/20',
    amber: 'border-amber-400/50 bg-amber-400/10 hover:bg-amber-400/20',
    blue: 'border-blue-400/50 bg-blue-400/10 hover:bg-blue-400/20',
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🌴 Die In The Jungle · Admin</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Preview:{' '}
              <a className="text-cyan-400 hover:text-cyan-300 underline" href="/diejungle" target="_blank" rel="noreferrer">/diejungle</a>
              {' '}· Admin:{' '}
              <span className="text-zinc-400">/diejungle/admin</span>
              {' '}· Telegram miniapp:{' '}
              <a className="text-cyan-400 hover:text-cyan-300 underline" href="http://localhost:5180" target="_blank" rel="noreferrer">localhost:5180</a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadConfig} disabled={loading} className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm">
              🔄 Reload
            </button>
            <button onClick={() => saveConfig(config)} disabled={loading} className="px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-sm">
              💾 Save All
            </button>
            {status && <span className="text-sm text-zinc-300">{status}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Tab Bar */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-500/25 border-amber-400/50 text-amber-200'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-300 hover:bg-zinc-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TEST GAME TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'testgame' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">🎮 Test Game Presets</h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Apply a preset to localStorage, then open the game to test a specific progression state.
                  Each preset clears the active run so you start fresh.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <div key={key} className={`rounded-xl border p-4 space-y-3 transition-colors cursor-pointer ${colorMap[preset.color]}`} onClick={() => applyPreset(key)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg">{preset.emoji}</div>
                        <div className="font-bold text-sm mt-1">{preset.label}</div>
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
                        preset.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500' :
                        preset.color === 'amber' ? 'bg-amber-600 hover:bg-amber-500 border-amber-500' :
                        'bg-blue-600 hover:bg-blue-500 border-blue-500'
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
            </div>

            {/* Current Meta State */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">📊 Current localStorage State</h2>
                <button onClick={refreshLocalMeta} className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-2 py-1">
                  🔄 Refresh
                </button>
              </div>

              {localMeta ? (
                <div className="space-y-4">
                  {/* Stats row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'XP', value: localMeta.xp ?? 0 },
                      { label: 'Gems 💎', value: localMeta.gems ?? 0 },
                      { label: 'Total Runs', value: localMeta.totalRuns ?? 0 },
                      { label: 'Best Score', value: localMeta.bestScore ?? 0 },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-zinc-700 bg-zinc-800/60 p-3 text-center">
                        <div className="text-xs text-zinc-400 mb-1">{stat.label}</div>
                        <div className="text-lg font-bold text-white">{stat.value.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Unlocks */}
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

                  {/* Achievements */}
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

                  {/* Raw JSON */}
                  <details className="rounded-lg border border-zinc-700 bg-zinc-900">
                    <summary className="px-3 py-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-200">Raw JSON</summary>
                    <pre className="px-3 py-2 text-[10px] font-mono text-zinc-300 overflow-auto max-h-40">{JSON.stringify(localMeta, null, 2)}</pre>
                  </details>
                </div>
              ) : (
                <div className="text-zinc-500 text-sm">No meta progression found in localStorage. Apply a preset or play a run.</div>
              )}
            </div>
          </div>
        )}

        {/* ── ROADMAP TAB ───────────────────────────────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              <h2 className="text-xl font-semibold mb-1">🗺️ Feature Roadmap</h2>
              <p className="text-zinc-400 text-sm">Current state of Die In The Jungle — what's done, what's next, what's in the backlog.</p>
            </div>

            {ROADMAP.map((section) => {
              const borderColor =
                section.color === 'emerald' ? 'border-emerald-800' :
                section.color === 'amber' ? 'border-amber-800' :
                'border-zinc-800';
              const headerColor =
                section.color === 'emerald' ? 'text-emerald-300' :
                section.color === 'amber' ? 'text-amber-300' :
                'text-zinc-400';
              return (
                <div key={section.section} className={`rounded-xl border ${borderColor} bg-zinc-900/70 p-5 space-y-3`}>
                  <h3 className={`text-lg font-bold ${headerColor}`}>{section.section}</h3>
                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      <div key={item.label} className="flex items-start gap-2.5 py-1">
                        <span className="text-base mt-0.5 shrink-0">{item.done ? '✅' : '⬜'}</span>
                        <span className={`text-sm ${item.done ? 'text-zinc-300' : 'text-zinc-400'}`}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Progress stats */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
              {(() => {
                const all = ROADMAP.flatMap(s => s.items);
                const done = all.filter(i => i.done).length;
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

        {/* ── ASSETS TAB ───────────────────────────────────────────────────────── */}
        {activeTab === 'assets' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">🖼️ Asset Manager</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type d'assets</label>
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
                <label className="block text-sm text-zinc-400 mb-1">Uploader (max 30)</label>
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
                    <figcaption className="text-[10px] text-zinc-300 truncate" title={asset.originalName || asset.fileName}>{asset.originalName || asset.fileName}</figcaption>
                    <input placeholder="tags: poison,boss" value={meta.tags || ''} onChange={(e) => updateAssetMeta(asset, { tags: e.target.value })} className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1" />
                    <select value={meta.status || 'active'} onChange={(e) => updateAssetMeta(asset, { status: e.target.value })} className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1">
                      <option value="active">active</option>
                      <option value="draft">draft</option>
                      <option value="deprecated">deprecated</option>
                    </select>
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {/* ── GAME LOGIC TAB ────────────────────────────────────────────────────── */}
        {activeTab === 'gamelogic' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">⚙️ Game Logic</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {Object.entries(GAME_LOGIC_GROUPS).map(([group, keys]) => (
                <div key={group} className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 space-y-3">
                  <h3 className="text-zinc-200 font-semibold capitalize border-b border-zinc-700 pb-2">{group}</h3>
                  {keys.map((key) => (
                    <label key={key} className="text-sm text-zinc-300 space-y-1 block">
                      <span className="block text-zinc-400 text-xs">{key}</span>
                      <input type="number" step="0.01" value={Number(config.gameLogic?.[key] ?? 0)} onChange={(e) => updateLogic(key, e.target.value)} className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm" />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── AVATARS TAB ───────────────────────────────────────────────────────── */}
        {activeTab === 'avatars' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">🎭 Avatars & Emotions</h2>
            <JsonEditor label="characters.playable" value={config.characters.playable} onSave={(value) => setConfig((p) => ({ ...p, characters: { ...p.characters, playable: value } }))} />
            <JsonEditor label="characters.emotionUrls" value={config.characters.emotionUrls} onSave={(value) => setConfig((p) => ({ ...p, characters: { ...p.characters, emotionUrls: value } }))} />
            <JsonEditor label="visuals" value={config.visuals} onSave={(value) => setConfig((p) => ({ ...p, visuals: value }))} rows={6} />
          </section>
        )}

        {/* ── NARRATIVE TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'narrative' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">📖 Narrative Sequences</h2>
            <JsonEditor label="narrative.kabalian" value={config.narrative.kabalian} onSave={(value) => setConfig((p) => ({ ...p, narrative: { ...p.narrative, kabalian: value } }))} rows={14} />
            <JsonEditor label="narrative.kkm" value={config.narrative.kkm} onSave={(value) => setConfig((p) => ({ ...p, narrative: { ...p.narrative, kkm: value } }))} rows={14} />
          </section>
        )}

        {/* ── ADVANCED TAB ──────────────────────────────────────────────────────── */}
        {activeTab === 'advanced' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
            <h2 className="text-xl font-semibold">🔬 Advanced — Monsters & Artifacts</h2>
            <JsonEditor label="monsters.traitsCatalog" value={config.monsters.traitsCatalog} onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, traitsCatalog: value } }))} rows={10} />
            <JsonEditor label="monsters.customMonsters" value={config.monsters.customMonsters} onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, customMonsters: value } }))} rows={12} />
            <JsonEditor label="artifacts.customArtifacts" value={config.artifacts.customArtifacts} onSave={(value) => setConfig((p) => ({ ...p, artifacts: { ...p.artifacts, customArtifacts: value } }))} rows={12} />
          </section>
        )}
      </div>
    </div>
  );
}
