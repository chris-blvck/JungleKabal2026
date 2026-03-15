import React, { useEffect, useMemo, useState } from 'react';

const ASSET_SCHEMA = {
  monsters: ['mob', 'champions', 'boss'],
  backgrounds: ['jungle', 'ruins', 'temple'],
  zones: ['general'],
  events: ['general'],
};

const TABS = [
  { id: 'assets', label: 'Asset Manager' },
  { id: 'gamelogic', label: 'Game Logic' },
  { id: 'avatars', label: 'Avatars & Emotions' },
  { id: 'narrative', label: 'Narrative x6' },
  { id: 'advanced', label: 'Advanced / Monsters / Artifacts' },
  { id: 'backlog', label: 'Backlog Admin' },
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
      <button
        onClick={() => {
          const parsed = JSON.parse(text);
          onSave(parsed);
        }}
        className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm"
      >
        Sauvegarder {label}
      </button>
    </div>
  );
}

export default function DieInTheJungleAdmin() {
  const [activeTab, setActiveTab] = useState('assets');
  const [category, setCategory] = useState('monsters');
  const [subcategory, setSubcategory] = useState('mob');
  const [config, setConfig] = useState(EMPTY_CONFIG);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadConfig();
  }, []);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold">Die In The Jungle · Admin Command Center</h1>
          <p className="text-zinc-400">Centre de commande complet : assets, game logic, avatars, narratives, backlog admin, traits monstres, nouveaux artifacts.</p>
          <p className="text-zinc-500 text-sm">Preview web rapide : <a className="underline text-cyan-300" href="/diejungle" target="_blank" rel="noreferrer">/diejungle</a> · Admin : <span className="text-zinc-300">/diejungle/admin</span></p>
        </header>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 py-1.5 rounded text-sm border ${activeTab === tab.id ? 'bg-amber-500/30 border-amber-300/50' : 'bg-zinc-800 border-zinc-700'}`}>
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <button onClick={loadConfig} disabled={loading} className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60">Recharger</button>
            <button onClick={() => saveConfig(config)} disabled={loading} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60">Sauvegarder tout</button>
            <p className="text-sm text-zinc-300">{status || 'Prêt.'}</p>
          </div>
        </section>

        {activeTab === 'assets' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
            <h2 className="text-xl font-medium">Asset Manager (page principale)</h2>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Type d'assets</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2">
                  {Object.keys(ASSET_SCHEMA).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Sous-catégorie</label>
                <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2">
                  {availableSubcategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Uploader images (max 30)</label>
                <input type="file" accept="image/*" multiple onChange={onUpload} disabled={loading} />
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
                    <input type="number" placeholder="order" value={meta.order ?? ''} onChange={(e) => updateAssetMeta(asset, { order: Number(e.target.value || 0) })} className="w-full text-[10px] rounded bg-zinc-900 border border-zinc-700 px-2 py-1" />
                  </figure>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'gamelogic' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
            <h2 className="text-xl font-medium">Game Logic (onglet dédié)</h2>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {Object.entries(GAME_LOGIC_GROUPS).map(([group, keys]) => (
                <div key={group} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 space-y-2">
                  <h3 className="text-zinc-200 font-medium capitalize">{group}</h3>
                  {keys.map((key) => (
                    <label key={key} className="text-sm text-zinc-300 space-y-1 block">
                      <span className="block text-zinc-400">{key}</span>
                      <input type="number" step="0.01" value={Number(config.gameLogic?.[key] ?? 0)} onChange={(e) => updateLogic(key, e.target.value)} className="w-full rounded bg-zinc-800 border border-zinc-700 px-3 py-2" />
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'avatars' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
            <h2 className="text-xl font-medium">Avatars & Emotions</h2>
            <JsonEditor label="characters.playable" value={config.characters.playable} onSave={(value) => setConfig((p) => ({ ...p, characters: { ...p.characters, playable: value } }))} />
            <JsonEditor label="characters.emotionUrls" value={config.characters.emotionUrls} onSave={(value) => setConfig((p) => ({ ...p, characters: { ...p.characters, emotionUrls: value } }))} />
            <JsonEditor label="visuals" value={config.visuals} onSave={(value) => setConfig((p) => ({ ...p, visuals: value }))} rows={6} />
          </section>
        )}

        {activeTab === 'narrative' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
            <h2 className="text-xl font-medium">Narrative Sequences (les 6 fragments éditables)</h2>
            <JsonEditor label="narrative.kabalian" value={config.narrative.kabalian} onSave={(value) => setConfig((p) => ({ ...p, narrative: { ...p.narrative, kabalian: value } }))} rows={14} />
            <JsonEditor label="narrative.kkm" value={config.narrative.kkm} onSave={(value) => setConfig((p) => ({ ...p, narrative: { ...p.narrative, kkm: value } }))} rows={14} />
          </section>
        )}

        {activeTab === 'advanced' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
            <h2 className="text-xl font-medium">Advanced : traits monstres + nouveaux artifacts</h2>
            <JsonEditor label="monsters.traitsCatalog" value={config.monsters.traitsCatalog} onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, traitsCatalog: value } }))} rows={10} />
            <JsonEditor label="monsters.customMonsters" value={config.monsters.customMonsters} onSave={(value) => setConfig((p) => ({ ...p, monsters: { ...p.monsters, customMonsters: value } }))} rows={12} />
            <JsonEditor label="artifacts.customArtifacts" value={config.artifacts.customArtifacts} onSave={(value) => setConfig((p) => ({ ...p, artifacts: { ...p.artifacts, customArtifacts: value } }))} rows={12} />
          </section>
        )}

        {activeTab === 'backlog' && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 space-y-4">
            <h2 className="text-xl font-medium">Backlog Admin</h2>
            <JsonEditor label="adminBacklog" value={config.adminBacklog} onSave={(value) => setConfig((p) => ({ ...p, adminBacklog: value }))} rows={14} />
          </section>
        )}
      </div>
    </div>
  );
}
