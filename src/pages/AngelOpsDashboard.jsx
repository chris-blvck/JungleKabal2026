import { useEffect, useMemo, useState } from 'react';
import Shell, { JK, Card, Badge, SectionTitle, StatBox } from '../components/JKShell';

const EPOCH = {
  name: 'Epoch 01',
  startAt: '2026-03-01T08:00:00Z',
  endAt: '2026-03-31T08:00:00Z',
  nextExitAt: '2026-04-30T08:00:00Z',
};

const DEFAULT_WALLETS = {
  trading: {
    id: 'trading',
    label: 'Trading',
    address: '9b1GJp28NbTM1F5CsvEoFoAHcRnuK5QjdH9JdPQYW8KR',
    value: 73812.45,
    pnl: 6.2,
  },
  reserve: {
    id: 'reserve',
    label: 'Reserve',
    address: '1KEKv2rM7G8NfHMBzmPqms4mbk5PcZhtPBq3f5qBvag',
    value: 45677.11,
    pnl: 3.9,
  },
  moonbag: {
    id: 'moonbag',
    label: 'Moonbag',
    address: 'HZs5UjUutFMdkb4UhhFvWtMNHSL7ZH5bYCb1CEErgvjG',
    value: 39733.82,
    pnl: 8.7,
  },
};

const TG_USERS = [
  { id: 'angel1', label: 'Angel One (@angelone)', walletPreset: 'trading' },
  { id: 'angel2', label: 'Angel Two (@angeltwo)', walletPreset: 'reserve' },
  { id: 'angel3', label: 'Angel Three (@angelthree)', walletPreset: 'moonbag' },
];

const CHOICES = {
  withdraw: 'Withdraw',
  rollover: 'Rollover',
  compound: 'Compound',
};

const CURVE = [42, 48, 46, 53, 56, 58, 61, 67, 74, 77, 80];
const CHOICE_CHANGE_DEADLINE = new Date(new Date(EPOCH.endAt).getTime() - 6 * 60 * 60 * 1000).toISOString();
const STORAGE_KEY = 'jk-angel-wallet-config-v1';
const STORAGE_SNAPSHOTS_KEY = 'jk-angel-snapshots-v1';
const AUTO_REFRESH_MS = 60_000;
const STALE_AFTER_MS = AUTO_REFRESH_MS * 2;
const RPC_ENDPOINTS = ['https://api.mainnet-beta.solana.com', 'https://solana-api.projectserum.com'];
const ANGEL_OPS_API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ANGEL_OPS_API_BASE) || '';
const ANGEL_OPS_ADMIN_TOKEN = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ANGEL_OPS_ADMIN_TOKEN) || '';

function usd(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(v || 0);
}

function pct(v) {
  return `${v >= 0 ? '+' : ''}${Number(v || 0).toFixed(2)}%`;
}

function shortAddr(a) {
  return `${a.slice(0, 4)}...${a.slice(-4)}`;
}

function formatDateTime(input) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(input));
}

function daysLeft(endAt) {
  return Math.max(0, Math.ceil((new Date(endAt).getTime() - Date.now()) / 86400000));
}

function epochProgress(startAt, endAt) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
}

function isValidSolAddress(address) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test((address || '').trim());
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSolBalance(address) {
  let lastError = null;

  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: `balance-${address}`,
          method: 'getBalance',
          params: [address, { commitment: 'confirmed' }],
        }),
      });

      if (!response.ok) throw new Error(`SOL RPC error (${response.status}) on ${endpoint}`);
      const data = await response.json();
      const lamports = Number(data?.result?.value ?? 0);
      return { solBalance: lamports / 1_000_000_000, source: endpoint };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('All SOL RPC endpoints failed');
}

async function fetchSolUsdPrice() {
  const sources = [
    {
      name: 'CoinGecko',
      url: 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
      parser: async (response) => {
        const data = await response.json();
        return Number(data?.solana?.usd ?? 0);
      },
    },
    {
      name: 'Jupiter',
      url: 'https://price.jup.ag/v6/price?ids=SOL',
      parser: async (response) => {
        const data = await response.json();
        return Number(data?.data?.SOL?.price ?? 0);
      },
    },
  ];

  let lastError = null;

  for (const source of sources) {
    try {
      const response = await fetchWithTimeout(source.url, {}, 12_000);
      if (!response.ok) throw new Error(`Price error (${response.status}) from ${source.name}`);
      const price = await source.parser(response);
      if (!Number.isFinite(price) || price <= 0) throw new Error(`Invalid price from ${source.name}`);
      return { price, source: source.name };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error('All SOL price sources failed');
}


async function apiRequest(path, options = {}) {
  const base = (ANGEL_OPS_API_BASE || '').replace(/\/$/, '');
  const url = `${base}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(ANGEL_OPS_ADMIN_TOKEN ? { 'X-Admin-Token': ANGEL_OPS_ADMIN_TOKEN } : {}),
    ...(options.headers || {}),
  };
  const response = await fetchWithTimeout(url, { ...options, headers }, 12_000);
  if (!response.ok) throw new Error(`API error (${response.status})`);
  return response.json();
}

async function fetchRemoteAngelOpsState() {
  return apiRequest('/api/angel-ops/state', { method: 'GET' });
}

async function fetchRemoteAngelOpsHealth() {
  return apiRequest('/api/angel-ops/health', { method: 'GET' });
}

async function saveRemoteWalletConfig(wallets) {
  return apiRequest('/api/angel-ops/wallets', {
    method: 'PUT',
    body: JSON.stringify(wallets),
  });
}

async function saveRemoteSnapshot(snapshot) {
  return apiRequest('/api/angel-ops/snapshot', {
    method: 'POST',
    body: JSON.stringify(snapshot),
  });
}

async function clearRemoteSnapshots() {
  return apiRequest('/api/angel-ops/snapshots', { method: 'DELETE' });
}

function loadWalletConfig() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}


function loadTrackingSnapshots() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_SNAPSHOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrackingSnapshots(items) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_SNAPSHOTS_KEY, JSON.stringify(items));
}

function MiniVisualCurve() {
  const w = 320;
  const h = 120;
  const p = 10;
  const min = Math.min(...CURVE);
  const max = Math.max(...CURVE);
  const spread = Math.max(1, max - min);

  const pts = CURVE.map((v, i) => {
    const x = p + (i / (CURVE.length - 1)) * (w - p * 2);
    const y = h - p - ((v - min) / spread) * (h - p * 2);
    return { x, y };
  });

  const line = pts.map((t, i) => `${i === 0 ? 'M' : 'L'} ${t.x.toFixed(2)} ${t.y.toFixed(2)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${(h - p).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(h - p).toFixed(2)} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="mini-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor={JK.gold2} />
          <stop offset="100%" stopColor={JK.gold} />
        </linearGradient>
        <linearGradient id="mini-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(139,92,246,0.32)" />
          <stop offset="100%" stopColor="rgba(245,166,35,0.02)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#mini-area)" />
      <path d={line} fill="none" stroke="url(#mini-line)" strokeWidth="3" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill={JK.gold2} />
    </svg>
  );
}


function HistorySparkline({ snapshots }) {
  if (!snapshots?.length) {
    return <div style={{ fontSize: 11, color: JK.muted }}>No trend yet.</div>;
  }

  const points = snapshots.slice(0, 20).map((item) => Number(item?.totalValueUsd || 0)).reverse();
  const w = 360;
  const h = 88;
  const p = 8;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = Math.max(1, max - min);
  const pts = points.map((value, index) => {
    const x = p + (index / Math.max(1, points.length - 1)) * (w - p * 2);
    const y = h - p - ((value - min) / spread) * (h - p * 2);
    return { x, y };
  });
  const line = pts.map((t, i) => `${i === 0 ? 'M' : 'L'} ${t.x.toFixed(2)} ${t.y.toFixed(2)}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${(h - p).toFixed(2)} L ${pts[0].x.toFixed(2)} ${(h - p).toFixed(2)} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="history-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor={JK.gold} />
        </linearGradient>
        <linearGradient id="history-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(139,92,246,0.24)" />
          <stop offset="100%" stopColor="rgba(245,166,35,0.02)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#history-area)" />
      <path d={line} fill="none" stroke="url(#history-line)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill={JK.gold2} />
    </svg>
  );
}

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'miniapp', label: 'Mini App' },
    { id: 'overview', label: 'Overview' },
    { id: 'wallets', label: 'Wallets' },
    { id: 'admin', label: 'Admin' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map((t) => {
        const active = t.id === tab;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              borderRadius: 999,
              border: `1px solid ${active ? JK.gold : JK.border}`,
              background: active ? 'rgba(245,166,35,0.16)' : 'rgba(255,255,255,0.03)',
              color: active ? JK.gold : '#D4D4D4',
              fontSize: 12,
              padding: '8px 14px',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AngelOpsDashboard() {
  const [tab, setTab] = useState('miniapp');
  const [tgUser, setTgUser] = useState(TG_USERS[0].id);
  const [activeWallet, setActiveWallet] = useState('trading');
  const [choice, setChoice] = useState('rollover');
  const [confirmedChoice, setConfirmedChoice] = useState('rollover');

  const loadedConfig = loadWalletConfig();
  const [walletConfig, setWalletConfig] = useState(() => ({
    trading: loadedConfig?.trading || DEFAULT_WALLETS.trading.address,
    reserve: loadedConfig?.reserve || DEFAULT_WALLETS.reserve.address,
    moonbag: loadedConfig?.moonbag || DEFAULT_WALLETS.moonbag.address,
  }));
  const [draftWalletConfig, setDraftWalletConfig] = useState(walletConfig);
  const [adminStatus, setAdminStatus] = useState('');
  const [liveWalletData, setLiveWalletData] = useState({});
  const [snapshotHistory, setSnapshotHistory] = useState(() => loadTrackingSnapshots());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const [lastRefreshAt, setLastRefreshAt] = useState('');
  const [lastPriceSource, setLastPriceSource] = useState('');
  const [lastRpcSource, setLastRpcSource] = useState('');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(Boolean(ANGEL_OPS_API_BASE));
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState('');
  const [cloudCheckMessage, setCloudCheckMessage] = useState('');
  const [backendHealth, setBackendHealth] = useState(null);

  const wallets = useMemo(() => ({
    trading: {
      ...DEFAULT_WALLETS.trading,
      address: walletConfig.trading,
      solBalance: Number(liveWalletData?.trading?.solBalance ?? 0),
      value: Number(liveWalletData?.trading?.value ?? DEFAULT_WALLETS.trading.value),
      isLive: Boolean(liveWalletData?.trading),
    },
    reserve: {
      ...DEFAULT_WALLETS.reserve,
      address: walletConfig.reserve,
      solBalance: Number(liveWalletData?.reserve?.solBalance ?? 0),
      value: Number(liveWalletData?.reserve?.value ?? DEFAULT_WALLETS.reserve.value),
      isLive: Boolean(liveWalletData?.reserve),
    },
    moonbag: {
      ...DEFAULT_WALLETS.moonbag,
      address: walletConfig.moonbag,
      solBalance: Number(liveWalletData?.moonbag?.solBalance ?? 0),
      value: Number(liveWalletData?.moonbag?.value ?? DEFAULT_WALLETS.moonbag.value),
      isLive: Boolean(liveWalletData?.moonbag),
    },
  }), [walletConfig, liveWalletData]);

  const allWalletsReady = Object.values(walletConfig).every(isValidSolAddress);

  const user = TG_USERS.find((u) => u.id === tgUser) || TG_USERS[0];

  const totalValue = Object.values(wallets).reduce((sum, w) => sum + w.value, 0);
  const totalStart = Object.values(wallets).reduce((sum, w) => sum + w.value / (1 + w.pnl / 100), 0);
  const totalPnl = totalStart > 0 ? ((totalValue - totalStart) / totalStart) * 100 : 0;
  const stats = useMemo(
    () => ({
      left: daysLeft(EPOCH.endAt),
      progress: epochProgress(EPOCH.startAt, EPOCH.endAt),
      fullExitIn: daysLeft(EPOCH.nextExitAt),
    }),
    [],
  );

  const wallet = wallets[activeWallet] || wallets[user.walletPreset] || wallets.trading;
  const liveTrackedTotal = Object.values(wallets).reduce((sum, item) => sum + Number(item?.value || 0), 0);
  const checkCloudConnection = async () => {
    if (!ANGEL_OPS_API_BASE) {
      setCloudCheckMessage('Cloud API base not configured.');
      return;
    }
    try {
      const health = await fetchRemoteAngelOpsHealth();
      setBackendHealth(health);
      setCloudSyncEnabled(true);
      setCloudCheckMessage('Cloud API reachable.');
    } catch {
      setCloudSyncEnabled(false);
      setBackendHealth(null);
      setCloudCheckMessage('Cloud API unreachable. Check URL/CORS/token.');
    }
  };

  const syncFromRemote = async () => {
    try {
      const [remote, health] = await Promise.all([
        fetchRemoteAngelOpsState(),
        fetchRemoteAngelOpsHealth().catch(() => null),
      ]);
      if (remote?.wallets) {
        setWalletConfig((prev) => ({ ...prev, ...remote.wallets }));
        setDraftWalletConfig((prev) => ({ ...prev, ...remote.wallets }));
      }
      if (Array.isArray(remote?.snapshots) && remote.snapshots.length) {
        const nextSnapshots = remote.snapshots.slice(0, 120);
        setSnapshotHistory(nextSnapshots);
        saveTrackingSnapshots(nextSnapshots);
      }
      setCloudSyncEnabled(true);
      setLastCloudSyncAt(new Date().toISOString());
      setAdminStatus('Cloud sync complete.');
    } catch {
      setCloudSyncEnabled(false);
    }
  };


  const refreshTracking = async () => {
    if (!allWalletsReady) {
      setRefreshError('Configure valid SOL wallets first.');
      return;
    }

    setIsRefreshing(true);
    setRefreshError('');
    try {
      const { price: solUsdPrice, source: priceSource } = await fetchSolUsdPrice();
      const results = await Promise.allSettled(
        Object.entries(walletConfig).map(async ([key, address]) => {
          const { solBalance, source } = await fetchSolBalance(address);
          return [
            key,
            {
              solBalance,
              value: solBalance * solUsdPrice,
              source,
            },
          ];
        }),
      );

      const successfulEntries = results
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value);
      const failedCount = results.length - successfulEntries.length;

      if (!successfulEntries.length) {
        throw new Error('All wallet refreshes failed. Check RPC connectivity.');
      }

      const next = Object.fromEntries(successfulEntries);
      setLiveWalletData((prev) => ({ ...prev, ...next }));
      setLastPriceSource(priceSource);
      setLastRpcSource(Object.values(next)[0]?.source || '');
      const nowIso = new Date().toISOString();
      setLastRefreshAt(nowIso);
      const totalValueUsd = Object.values(next).reduce((sum, item) => sum + Number(item?.value || 0), 0);
      const snapshot = { at: nowIso, totalValueUsd, wallets: next };
      setSnapshotHistory((prev) => {
        const updatedHistory = [snapshot, ...prev].slice(0, 120);
        saveTrackingSnapshots(updatedHistory);
        return updatedHistory;
      });
      if (ANGEL_OPS_API_BASE) {
        try {
          await saveRemoteSnapshot(snapshot);
          setCloudSyncEnabled(true);
          setLastCloudSyncAt(nowIso);
        } catch {
          setCloudSyncEnabled(false);
        }
      }
      setAdminStatus(
        failedCount
          ? `Tracking refreshed with ${failedCount} wallet error(s).`
          : 'Live tracking refreshed from Solana RPC.',
      );
    } catch (error) {
      setRefreshError((error && error.message) || 'Failed to refresh tracking');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!ANGEL_OPS_API_BASE) return;
    syncFromRemote();
  }, []);

  useEffect(() => {
    if (allWalletsReady) refreshTracking();
  }, [walletConfig.trading, walletConfig.reserve, walletConfig.moonbag]);

  useEffect(() => {
    if (!allWalletsReady || !autoRefreshEnabled) return undefined;
    const intervalId = setInterval(() => {
      refreshTracking();
    }, AUTO_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [allWalletsReady, autoRefreshEnabled, walletConfig.trading, walletConfig.reserve, walletConfig.moonbag]);

  const latestSnapshot = snapshotHistory[0] || null;
  const snapshotCount = snapshotHistory.length;
  const dayDelta = useMemo(() => {
    if (!snapshotHistory.length) return null;
    const now = Date.now();
    const reference = snapshotHistory.find((item) => now - new Date(item.at).getTime() >= 24 * 60 * 60 * 1000)
      || snapshotHistory[snapshotHistory.length - 1];
    if (!reference) return null;
    const latest = Number(latestSnapshot?.totalValueUsd || 0);
    const previous = Number(reference.totalValueUsd || 0);
    const diff = latest - previous;
    const pctChange = previous > 0 ? (diff / previous) * 100 : 0;
    return { diff, pctChange };
  }, [latestSnapshot, snapshotHistory]);
  const isDataStale = lastRefreshAt ? (Date.now() - new Date(lastRefreshAt).getTime()) > STALE_AFTER_MS : false;

  const clearTrackingHistory = async () => {
    const confirmed = window.confirm('Clear all tracking snapshots? This cannot be undone.');
    if (!confirmed) return;

    setSnapshotHistory([]);
    saveTrackingSnapshots([]);

    if (ANGEL_OPS_API_BASE) {
      try {
        await clearRemoteSnapshots();
        setCloudSyncEnabled(true);
        setLastCloudSyncAt(new Date().toISOString());
        setAdminStatus('Tracking history cleared locally + cloud.');
      } catch {
        setCloudSyncEnabled(false);
        setAdminStatus('Tracking history cleared locally. Cloud clear failed.');
      }
    } else {
      setAdminStatus('Tracking history cleared locally.');
    }
  };

  const exportSnapshotsCsv = () => {
    if (!snapshotHistory.length) return;
    const headers = ['timestamp', 'total_value_usd'];
    const lines = [headers.join(',')];
    snapshotHistory.forEach((item) => {
      lines.push([item.at, Number(item.totalValueUsd || 0).toFixed(2)].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'angel-ops-snapshots.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveWalletConfig = () => {
    const normalized = {
      trading: (draftWalletConfig.trading || '').trim(),
      reserve: (draftWalletConfig.reserve || '').trim(),
      moonbag: (draftWalletConfig.moonbag || '').trim(),
    };

    const invalid = Object.entries(normalized).filter(([, value]) => !isValidSolAddress(value));
    if (invalid.length) {
      setAdminStatus(`Invalid SOL address for: ${invalid.map(([key]) => key).join(', ')}`);
      return;
    }

    setWalletConfig(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setAdminStatus('Wallet configuration saved. Tracking can start with these 3 SOL wallets.');

    if (ANGEL_OPS_API_BASE) {
      saveRemoteWalletConfig(normalized)
        .then(() => {
          setCloudSyncEnabled(true);
          setLastCloudSyncAt(new Date().toISOString());
          setAdminStatus('Wallet configuration saved locally + cloud synced.');
        })
        .catch(() => {
          setCloudSyncEnabled(false);
          setAdminStatus('Wallet saved locally. Cloud sync failed.');
        });
    }
  };

  return (
    <Shell
      title={<>Angel <span style={{ color: JK.gold }}>Ops</span></>}
      subtitle="Telegram mini-app · angels follow their bag · trust-first UX"
      maxWidth={980}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <Card style={{ marginBottom: 0, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <TabBar tab={tab} setTab={setTab} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge color={allWalletsReady ? JK.green : '#F97316'}>{allWalletsReady ? 'Wallets ready to track' : 'Wallet setup needed'}</Badge>
              <button
                type="button"
                onClick={refreshTracking}
                disabled={isRefreshing || !allWalletsReady}
                style={{
                  border: `1px solid ${JK.border2}`,
                  borderRadius: 8,
                  background: isRefreshing ? 'rgba(245,166,35,0.08)' : 'rgba(245,166,35,0.14)',
                  color: JK.gold,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: isRefreshing ? 'wait' : 'pointer',
                }}
              >
                {isRefreshing ? 'Refreshing…' : 'Refresh tracking'}
              </button>
              <Badge color={latestSnapshot ? JK.green : '#F97316'}>Live total {usd(liveTrackedTotal)}</Badge>
              <Badge color={cloudSyncEnabled ? JK.green : '#F97316'}>{cloudSyncEnabled ? 'Cloud sync ON' : 'Cloud sync OFF'}</Badge>
              <button
                type="button"
                onClick={checkCloudConnection}
                style={{
                  border: `1px solid ${JK.border2}`,
                  borderRadius: 8,
                  background: 'rgba(59,130,246,0.12)',
                  color: '#93C5FD',
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Check cloud
              </button>
              {isDataStale ? <Badge color="#F97316">Data stale</Badge> : null}
              <button
                type="button"
                onClick={() => setAutoRefreshEnabled((prev) => !prev)}
                style={{
                  border: `1px solid ${autoRefreshEnabled ? JK.border2 : JK.border}`,
                  borderRadius: 8,
                  background: autoRefreshEnabled ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.05)',
                  color: autoRefreshEnabled ? JK.green : JK.muted,
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Auto refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
              </button>
              <span style={{ color: JK.muted, fontSize: 11 }}>Telegram user</span>
              <select
                value={tgUser}
                onChange={(e) => {
                  const next = e.target.value;
                  setTgUser(next);
                  const preset = TG_USERS.find((u) => u.id === next)?.walletPreset;
                  if (preset) setActiveWallet(preset);
                }}
                style={{ background: '#111', color: '#fff', border: `1px solid ${JK.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 11 }}
              >
                {TG_USERS.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {tab === 'miniapp' && (
          <>
            <SectionTitle style={{ marginBottom: 8 }}>Investor 1-click screen</SectionTitle>

            <div style={{ display: 'grid', justifyItems: 'center' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: 420,
                  borderRadius: 26,
                  border: `1px solid ${JK.border2}`,
                  padding: 14,
                  background: 'linear-gradient(180deg, rgba(12,12,12,1), rgba(7,7,7,1))',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: 250,
                    height: 250,
                    right: -80,
                    top: -110,
                    borderRadius: '50%',
                    filter: 'blur(20px)',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.35), rgba(245,166,35,0))',
                    pointerEvents: 'none',
                  }}
                />

                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: JK.muted, textTransform: 'uppercase', letterSpacing: 1.5 }}>Jungle Kabal · Telegram mini app</div>
                      <div style={{ marginTop: 4, fontFamily: "'Cinzel', serif", fontSize: 18 }}>Welcome {user.label.split(' ')[0]}</div>
                    </div>
                    <Badge color="#60A5FA">Connected</Badge>
                  </div>

                  <div style={{ marginTop: 12, border: `1px solid ${JK.border}`, borderRadius: 14, padding: 10, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 10, color: JK.muted }}>My Wallet</div>
                    <div style={{ marginTop: 2, fontSize: 17, color: JK.gold, fontWeight: 700 }}>{usd(wallet.value)}</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: wallet.pnl >= 0 ? JK.green : JK.red }}>{pct(wallet.pnl)} · {shortAddr(wallet.address)}</div>
                    <div style={{ marginTop: 2, fontSize: 11, color: '#D8D8D8' }}>
                      SOL balance: {wallet.solBalance ? wallet.solBalance.toFixed(4) : '—'} · {wallet.isLive ? 'Live' : 'Estimated'}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 10, color: JK.muted }}>
                      Last sync: {lastRefreshAt ? formatDateTime(lastRefreshAt) : 'Never'}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <MiniVisualCurve />
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 9, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ color: JK.muted, fontSize: 10 }}>Epoch ends</div>
                      <div style={{ marginTop: 3, fontSize: 16, fontWeight: 700 }}>{stats.left} days</div>
                    </div>
                    <div style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 9, background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ color: JK.muted, fontSize: 10 }}>Next full exit</div>
                      <div style={{ marginTop: 3, fontSize: 16, fontWeight: 700 }}>{stats.fullExitIn} days</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, border: `1px solid ${JK.border}`, borderRadius: 12, padding: 10, background: 'rgba(245,166,35,0.08)' }}>
                    <div style={{ color: JK.gold, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Important</div>
                    <div style={{ marginTop: 4, color: '#E8E8E8', fontSize: 12 }}>
                      You can lock your next-epoch decision now. It will auto-apply at epoch close.
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 7 }}>
                    {Object.entries(CHOICES).map(([key, label]) => {
                      const active = key === choice;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setChoice(key)}
                          style={{
                            borderRadius: 10,
                            border: `1px solid ${active ? JK.gold : JK.border}`,
                            background: active ? 'rgba(245,166,35,0.16)' : 'rgba(255,255,255,0.03)',
                            color: active ? JK.gold : '#D0D0D0',
                            fontSize: 11,
                            padding: '9px 8px',
                            cursor: 'pointer',
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ marginTop: 9, border: `1px solid ${JK.border}`, borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: 10, color: JK.muted, textTransform: 'uppercase', letterSpacing: 1 }}>My choice</div>
                    <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: JK.gold }}>{CHOICES[confirmedChoice]}</div>
                      <Badge color={JK.green}>Saved</Badge>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: '#D9D9D9' }}>
                      Change your choice before: <span style={{ color: JK.gold }}>{formatDateTime(CHOICE_CHANGE_DEADLINE)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfirmedChoice(choice)}
                    style={{
                      marginTop: 9,
                      width: '100%',
                      border: 'none',
                      borderRadius: 11,
                      padding: '11px 12px',
                      fontWeight: 800,
                      fontSize: 12,
                      background: 'linear-gradient(90deg, #FFD037, #F5A623)',
                      color: '#000',
                      cursor: 'pointer',
                    }}
                  >
                    Confirm my choice
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <div style={{ width: '100%', maxWidth: 620, display: 'grid', gap: 8 }}>
                <div style={{ color: JK.muted, fontSize: 11, textAlign: 'center', letterSpacing: 0.5 }}>Quick actions</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8 }}>
                  {Object.values(wallets).map((w) => (
                    <a
                      key={w.id}
                      href={`https://solscan.io/account/${w.address}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: 'none',
                        border: '1px solid rgba(59,130,246,0.45)',
                        borderRadius: 10,
                        padding: '9px 10px',
                        color: '#93C5FD',
                        background: '#0d1f35',
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: 'center',
                      }}
                    >
                      Track {w.label}
                    </a>
                  ))}
                </div>

                <button
                  type="button"
                  style={{
                    border: `1px solid ${JK.border2}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    background: 'rgba(245,166,35,0.10)',
                    color: JK.gold,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Ask assistance
                </button>
              </div>
            </div>
          </>
        )}

        {tab === 'overview' && (
          <>
            <SectionTitle style={{ marginBottom: 8 }}>Overview</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 }}>
              <StatBox value={usd(totalValue)} label="Total Equity" />
              <StatBox value={pct(totalPnl)} label="Global PnL" color={totalPnl >= 0 ? 'green' : 'red'} />
              <StatBox value={`${stats.left}d`} label="Epoch Ends" />
              <StatBox value={`${stats.fullExitIn}d`} label="Next Full Exit" />
              <StatBox value={dayDelta ? pct(dayDelta.pctChange) : '—'} label="24h Delta" color={dayDelta ? (dayDelta.pctChange >= 0 ? 'green' : 'red') : undefined} />
            </div>

            <Card style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16 }}>{EPOCH.name}</div>
                <Badge color={JK.green}>{stats.progress.toFixed(0)}%</Badge>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }}>
                <div style={{ width: `${stats.progress}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${JK.gold2}, ${JK.gold})` }} />
              </div>
            </Card>


            <Card style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16 }}>Equity trend (latest 20 snapshots)</div>
                <Badge color={dayDelta ? (dayDelta.diff >= 0 ? JK.green : '#F97316') : JK.muted}>
                  {dayDelta ? `${dayDelta.diff >= 0 ? '+' : ''}${usd(dayDelta.diff)} / 24h` : 'No delta yet'}
                </Badge>
              </div>
              <HistorySparkline snapshots={snapshotHistory} />
            </Card>


            <Card style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16 }}>Tracking history</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Badge color={latestSnapshot ? JK.green : '#F97316'}>{latestSnapshot ? 'Live feed' : 'No data yet'}</Badge>
                  <Badge color="#93C5FD">{snapshotCount} snapshots</Badge>
                  <button
                    type="button"
                    onClick={exportSnapshotsCsv}
                    disabled={!snapshotHistory.length}
                    style={{
                      border: `1px solid ${JK.border2}`,
                      borderRadius: 8,
                      background: 'rgba(245,166,35,0.10)',
                      color: JK.gold,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '6px 9px',
                      cursor: snapshotHistory.length ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={clearTrackingHistory}
                    disabled={!snapshotHistory.length}
                    style={{
                      border: `1px solid ${JK.border}`,
                      borderRadius: 8,
                      background: 'rgba(239,68,68,0.12)',
                      color: '#fca5a5',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '6px 9px',
                      cursor: snapshotHistory.length ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Clear history
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: JK.muted, marginBottom: 8 }}>
                Last refresh: {lastRefreshAt ? formatDateTime(lastRefreshAt) : 'Never'}
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {snapshotHistory.slice(0, 5).map((item) => (
                  <div key={item.at} style={{ border: `1px solid ${JK.border}`, borderRadius: 8, padding: '7px 9px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#DCDCDC' }}>{formatDateTime(item.at)}</span>
                    <span style={{ fontSize: 11, color: JK.gold, fontWeight: 700 }}>{usd(item.totalValueUsd)}</span>
                  </div>
                ))}
                {!snapshotHistory.length ? <div style={{ fontSize: 11, color: JK.muted }}>Refresh tracking to build history.</div> : null}
              </div>
            </Card>
          </>
        )}

        {tab === 'wallets' && (
          <>
            <SectionTitle style={{ marginBottom: 8 }}>Wallet Monitor</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
              {Object.values(wallets).map((w) => (
                <Card key={w.id} style={{ marginBottom: 0, padding: 14 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15 }}>{w.label}</div>
                  <div style={{ marginTop: 4, fontSize: 11, color: JK.muted }}>{shortAddr(w.address)}</div>
                  <div style={{ marginTop: 8, fontSize: 16, color: JK.gold, fontWeight: 700 }}>{usd(w.value)}</div>
                  <div style={{ marginTop: 2, fontSize: 12, color: w.pnl >= 0 ? JK.green : JK.red }}>{pct(w.pnl)}</div>
                  <a href={`https://solscan.io/account/${w.address}`} target="_blank" rel="noreferrer" style={{ marginTop: 8, display: 'inline-block', color: '#93C5FD', fontSize: 11, textDecoration: 'none' }}>
                    Open Solscan ↗
                  </a>
                  <div style={{ marginTop: 4, fontSize: 10, color: JK.muted }}>
                    {w.isLive ? `Live SOL: ${w.solBalance.toFixed(4)}` : 'Live SOL pending refresh'}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {tab === 'admin' && (
          <>
            <SectionTitle style={{ marginBottom: 8 }}>Admin Wallet Setup (SOL only)</SectionTitle>
            <Card style={{ marginBottom: 0 }}>
              <div style={{ color: JK.muted, fontSize: 12, marginBottom: 10 }}>
                Enter the 3 Solana wallet addresses below from web admin. Once saved, all tracking and quick links use these addresses.
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {Object.keys(wallets).map((key) => (
                  <div key={key} style={{ border: `1px solid ${JK.border}`, borderRadius: 10, padding: 10, background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize: 11, color: JK.gold, textTransform: 'uppercase' }}>{wallets[key].label} wallet</div>
                    <input
                      value={draftWalletConfig[key] || ''}
                      onChange={(e) => setDraftWalletConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder="Enter SOL address"
                      style={{
                        marginTop: 8,
                        width: '100%',
                        background: '#0f0f0f',
                        border: `1px solid ${isValidSolAddress(draftWalletConfig[key] || '') ? JK.border : '#ef4444aa'}`,
                        borderRadius: 8,
                        color: '#fff',
                        padding: '10px 12px',
                        fontSize: 12,
                      }}
                    />
                    <div style={{ marginTop: 6, fontSize: 11, color: isValidSolAddress(draftWalletConfig[key] || '') ? JK.green : '#f87171' }}>
                      {isValidSolAddress(draftWalletConfig[key] || '') ? 'Valid SOL format' : 'Invalid SOL address format'}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={saveWalletConfig}
                  style={{
                    border: 'none',
                    borderRadius: 9,
                    background: 'linear-gradient(90deg, #FFD037, #F5A623)',
                    color: '#000',
                    padding: '10px 14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Save wallet config
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftWalletConfig({
                      trading: DEFAULT_WALLETS.trading.address,
                      reserve: DEFAULT_WALLETS.reserve.address,
                      moonbag: DEFAULT_WALLETS.moonbag.address,
                    });
                    setAdminStatus('Draft reset to defaults.');
                  }}
                  style={{
                    border: `1px solid ${JK.border2}`,
                    borderRadius: 9,
                    background: 'rgba(245,166,35,0.10)',
                    color: JK.gold,
                    padding: '10px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset draft
                </button>
                <button
                  type="button"
                  onClick={syncFromRemote}
                  style={{
                    border: `1px solid ${JK.border2}`,
                    borderRadius: 9,
                    background: 'rgba(59,130,246,0.12)',
                    color: '#93C5FD',
                    padding: '10px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Sync from cloud
                </button>
              </div>

              {adminStatus ? <div style={{ marginTop: 10, fontSize: 12, color: '#E5E5E5' }}>{adminStatus}</div> : null}
            </Card>

            <Card style={{ marginBottom: 0 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15 }}>SOL wallet structure check</div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#D9D9D9', lineHeight: 1.6 }}>
                Yes — the current structure is valid for SOL-only tracking (Trading / Reserve / Moonbag).
                Next step for real tracking is running a backend refresh worker and storing snapshots via `/api/angel-ops/snapshot`.
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: JK.muted }}>
                Last live refresh: {lastRefreshAt ? formatDateTime(lastRefreshAt) : 'Never'} · Auto-refresh cadence: {Math.round(AUTO_REFRESH_MS / 1000)}s
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: JK.muted }}>
                Price source: {lastPriceSource || '—'} · RPC source: {lastRpcSource || '—'}
              </div>
              <div style={{ marginTop: 4, fontSize: 11, color: JK.muted }}>
                Cloud sync: {cloudSyncEnabled ? 'Enabled' : 'Disabled'} · Last cloud sync: {lastCloudSyncAt ? formatDateTime(lastCloudSyncAt) : 'Never'}
              </div>
              {refreshError ? <div style={{ marginTop: 6, fontSize: 11, color: '#f87171' }}>{refreshError}</div> : null}
              <div style={{ marginTop: 10, border: `1px solid ${JK.border}`, borderRadius: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ fontSize: 11, color: JK.gold, fontWeight: 700 }}>Deployment wiring</div>
                <div style={{ marginTop: 4, fontSize: 11, color: JK.muted }}>
                  API base: {ANGEL_OPS_API_BASE || 'Not set'}
                </div>
                <div style={{ marginTop: 2, fontSize: 11, color: JK.muted }}>
                  Admin token in client: {ANGEL_OPS_ADMIN_TOKEN ? 'Configured' : 'Not configured'}
                </div>
                {cloudCheckMessage ? <div style={{ marginTop: 4, fontSize: 11, color: cloudSyncEnabled ? JK.green : '#f87171' }}>{cloudCheckMessage}</div> : null}
                {backendHealth ? (
                  <div style={{ marginTop: 6, fontSize: 11, color: JK.muted, lineHeight: 1.5 }}>
                    Health: wallets configured {backendHealth.walletsConfigured || 0} · snapshots {backendHealth.snapshotsCount || 0}
                    <br />
                    Rate limit: {backendHealth?.rateLimit?.maxWrites || '—'} writes / {Math.round((backendHealth?.rateLimit?.windowMs || 0) / 1000) || '—'}s · CORS: {backendHealth.corsAllowOrigin || '—'}
                  </div>
                ) : null}
              </div>
            </Card>
          </>
        )}
      </div>
    </Shell>
  );
}
