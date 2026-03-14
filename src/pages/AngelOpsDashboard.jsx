import { useMemo, useState } from 'react';
import Shell, { JK, Card, Badge, SectionTitle, StatBox, Divider } from '../components/JKShell';

const INITIAL_EPOCH = {
  id: 'epoch-01',
  name: 'Epoch 01',
  startAt: '2026-03-01T08:00:00Z',
  endAt: '2026-03-31T08:00:00Z',
  status: 'active',
};

const WALLET_SEEDS = [
  {
    id: 'w1',
    name: 'Alpha Wallet',
    address: '9z9Rr5v1xQ2vK5jA7FX9kRTF5mSLckkGu9W67oL9s1vA',
    solBalance: 552.2231,
    totalValueUsd: 73812.45,
    pnlPercent: 6.2,
    tokenBreakdown: [
      { symbol: 'SOL', pnlPercent: 4.1, exposure: 57 },
      { symbol: 'JUP', pnlPercent: 14.8, exposure: 19 },
      { symbol: 'WIF', pnlPercent: -2.4, exposure: 8 },
      { symbol: 'PYTH', pnlPercent: 3.3, exposure: 6 },
    ],
  },
  {
    id: 'w2',
    name: 'Beta Wallet',
    address: '2L4PN5h51fUEhB7z4hVT6fQuk2WG6Q7siwTrT9S2x4nu',
    solBalance: 331.1128,
    totalValueUsd: 45677.11,
    pnlPercent: 3.9,
    tokenBreakdown: [
      { symbol: 'SOL', pnlPercent: 2.8, exposure: 61 },
      { symbol: 'BONK', pnlPercent: 10.4, exposure: 13 },
      { symbol: 'RAY', pnlPercent: 1.9, exposure: 7 },
      { symbol: 'JTO', pnlPercent: -1.1, exposure: 5 },
    ],
  },
  {
    id: 'w3',
    name: 'Gamma Wallet',
    address: '7Qh3qvNhm4mTRyJt2G3ed4e1MhMztNThB7zfDwV2jMmo',
    solBalance: 298.0099,
    totalValueUsd: 39733.82,
    pnlPercent: 8.7,
    tokenBreakdown: [
      { symbol: 'SOL', pnlPercent: 4.9, exposure: 49 },
      { symbol: 'PYTH', pnlPercent: 12.7, exposure: 17 },
      { symbol: 'JTO', pnlPercent: 7.1, exposure: 11 },
      { symbol: 'W', pnlPercent: 2.4, exposure: 9 },
    ],
  },
];

const ANGELS = [
  { id: 'a1', displayName: 'Angel One', depositUsd: 5000, shareBps: 2500, status: 'active' },
  { id: 'a2', displayName: 'Angel Two', depositUsd: 7500, shareBps: 3750, status: 'active' },
  { id: 'a3', displayName: 'Angel Three', depositUsd: 7500, shareBps: 3750, status: 'active' },
];

const CHOICES = {
  withdraw: 'Withdraw',
  rollover: 'Rollover',
  compound: 'Compound',
};

const CURVE_POINTS = [
  { day: 'D-10', value: 143900 },
  { day: 'D-9', value: 145120 },
  { day: 'D-8', value: 144840 },
  { day: 'D-7', value: 146010 },
  { day: 'D-6', value: 147450 },
  { day: 'D-5', value: 148080 },
  { day: 'D-4', value: 149320 },
  { day: 'D-3', value: 151100 },
  { day: 'D-2', value: 157460 },
  { day: 'D-1', value: 158990 },
  { day: 'Now', value: 159223 },
];

function formatUsd(v) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(v || 0);
}

function formatPct(v) {
  return `${v >= 0 ? '+' : ''}${Number(v || 0).toFixed(2)}%`;
}

function shortAddress(address) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function daysLeft(endAt) {
  const diff = new Date(endAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function epochProgress(startAt, endAt) {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return ((now - start) / (end - start)) * 100;
}

function estimateAngelValue(depositUsd, pnlPercent) {
  return depositUsd * (1 + pnlPercent / 100);
}

function EquityCurve({ points }) {
  const width = 860;
  const height = 220;
  const pad = 22;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = height - pad - ((p.value - min) / range) * (height - pad * 2);
    return { x, y, ...p };
  });

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(1)} ${(height - pad).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(height - pad).toFixed(1)} Z`;

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', minWidth: 560, display: 'block' }}>
        <defs>
          <linearGradient id="lineGlow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={JK.gold2} />
            <stop offset="100%" stopColor={JK.gold} />
          </linearGradient>
          <linearGradient id="areaGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,166,35,0.35)" />
            <stop offset="100%" stopColor="rgba(245,166,35,0.02)" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3].map((idx) => {
          const y = pad + ((height - pad * 2) / 3) * idx;
          return <line key={idx} x1={pad} y1={y} x2={width - pad} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 4" />;
        })}

        <path d={areaPath} fill="url(#areaGlow)" />
        <path d={linePath} fill="none" stroke="url(#lineGlow)" strokeWidth="3" strokeLinecap="round" />

        {coords.map((c, idx) => (
          <circle
            key={c.day}
            cx={c.x}
            cy={c.y}
            r={idx === coords.length - 1 ? 5.5 : 3.3}
            fill={idx === coords.length - 1 ? JK.gold2 : 'rgba(255,208,55,0.8)'}
            stroke="rgba(0,0,0,0.6)"
            strokeWidth="1"
          />
        ))}

        <text x={coords[coords.length - 1].x - 10} y={coords[coords.length - 1].y - 12} fill={JK.gold2} fontSize="12" textAnchor="end">
          {formatUsd(coords[coords.length - 1].value)}
        </text>
      </svg>

      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', color: JK.muted, fontSize: 10 }}>
        <span>{points[0].day}</span>
        <span>{points[points.length - 1].day}</span>
      </div>
    </div>
  );
}

function ExposureBars({ wallets }) {
  const rows = wallets
    .flatMap((wallet) => wallet.tokenBreakdown.map((coin) => ({ ...coin, wallet: wallet.name })))
    .sort((a, b) => b.exposure - a.exposure)
    .slice(0, 7);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {rows.map((row) => (
        <div key={`${row.wallet}-${row.symbol}`} style={{ display: 'grid', gap: 5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
            <span style={{ color: '#E8E8E8' }}>{row.symbol} <span style={{ color: JK.muted }}>· {row.wallet}</span></span>
            <span style={{ color: row.pnlPercent >= 0 ? JK.green : JK.red }}>{formatPct(row.pnlPercent)}</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, row.exposure)}%`,
                height: '100%',
                borderRadius: 999,
                background: row.pnlPercent >= 0
                  ? 'linear-gradient(90deg, rgba(34,197,94,0.55), rgba(34,197,94,0.9))'
                  : 'linear-gradient(90deg, rgba(239,68,68,0.5), rgba(239,68,68,0.9))',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AngelOpsDashboard() {
  const [selectedWallet, setSelectedWallet] = useState(WALLET_SEEDS[0].id);
  const [choices, setChoices] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('jk-angel-choices') || '{}');
    } catch {
      return {};
    }
  });
  const [selectedAngelId, setSelectedAngelId] = useState(ANGELS[0]?.id || '');
  const [selectedChoice, setSelectedChoice] = useState('rollover');
  const [note, setNote] = useState('');

  const overview = useMemo(() => {
    const totalEquity = WALLET_SEEDS.reduce((sum, wallet) => sum + wallet.totalValueUsd, 0);
    const startEquity = WALLET_SEEDS.reduce((sum, wallet) => sum + wallet.totalValueUsd / (1 + wallet.pnlPercent / 100), 0);
    const pnl = startEquity > 0 ? ((totalEquity - startEquity) / startEquity) * 100 : 0;

    return {
      totalEquity,
      startEquity,
      pnl,
      angelsCount: ANGELS.length,
      daysLeft: daysLeft(INITIAL_EPOCH.endAt),
      progress: epochProgress(INITIAL_EPOCH.startAt, INITIAL_EPOCH.endAt),
    };
  }, []);

  const activeWallet = WALLET_SEEDS.find((wallet) => wallet.id === selectedWallet) || WALLET_SEEDS[0];

  const saveChoice = () => {
    const next = {
      ...choices,
      [selectedAngelId]: {
        choice: selectedChoice,
        note,
        at: new Date().toISOString(),
      },
    };
    setChoices(next);
    localStorage.setItem('jk-angel-choices', JSON.stringify(next));
    setNote('');
  };

  const copyAddress = async (address) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // noop MVP
    }
  };

  return (
    <Shell
      title={<>Angel <span style={{ color: JK.gold }}>Ops Dashboard</span></>}
      subtitle="Ultra-lean, ultra-clean — wallets, PnL, courbes et décisions en 1 vue"
      maxWidth={1180}
    >
      <SectionTitle style={{ marginBottom: 12 }}>Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatBox value={formatUsd(overview.totalEquity)} label="Total Equity" />
        <StatBox value={formatUsd(overview.startEquity)} label="Start of Epoch" color="muted" />
        <StatBox value={formatPct(overview.pnl)} label="Current PnL" color={overview.pnl >= 0 ? 'green' : 'red'} />
        <StatBox value={`${overview.daysLeft}d`} label="Days Left" />
        <StatBox value={`${overview.angelsCount}`} label="Active Angels" />
      </div>

      <Divider />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12 }}>
        <Card style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 17 }}>Portfolio Curve</div>
              <div style={{ color: JK.muted, fontSize: 11 }}>Trend mock MVP (historique snapshots prêt à brancher)</div>
            </div>
            <Badge color={JK.green}>7D</Badge>
          </div>
          <EquityCurve points={CURVE_POINTS} />
        </Card>

        <Card style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 17 }}>Epoch Pulse</div>
              <div style={{ color: JK.muted, fontSize: 11 }}>{INITIAL_EPOCH.name} · {INITIAL_EPOCH.status}</div>
            </div>
            <Badge>{overview.progress.toFixed(0)}%</Badge>
          </div>

          <div style={{ marginBottom: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 11 }}>
            <div style={{ width: `${overview.progress}%`, background: `linear-gradient(90deg, ${JK.gold2}, ${JK.gold})`, height: '100%', borderRadius: 999 }} />
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 11, color: JK.muted }}>Top coin exposures live view</div>
            <ExposureBars wallets={WALLET_SEEDS} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: JK.muted, fontSize: 10, marginTop: 4 }}>
              <span>Start: {new Date(INITIAL_EPOCH.startAt).toLocaleDateString()}</span>
              <span>End: {new Date(INITIAL_EPOCH.endAt).toLocaleDateString()}</span>
            </div>
          </div>
        </Card>
      </div>

      <Divider />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 12 }}>
        <Card style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 17 }}>Wallet Inspector</div>
            <Badge color="#60A5FA">1-click verify</Badge>
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {WALLET_SEEDS.map((wallet) => {
              const active = wallet.id === activeWallet.id;
              return (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => setSelectedWallet(wallet.id)}
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${active ? JK.gold : JK.border}`,
                    padding: '6px 12px',
                    fontSize: 11,
                    color: active ? JK.gold : '#D3D3D3',
                    background: active ? 'rgba(245,166,35,0.12)' : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                  }}
                >
                  {wallet.name}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, color: '#F5F5F5' }}>{activeWallet.name}</div>
            <div style={{ color: JK.muted, fontSize: 11 }}>{shortAddress(activeWallet.address)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
              <div style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 10, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ color: JK.muted, fontSize: 10 }}>SOL Balance</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>{activeWallet.solBalance.toFixed(4)}</div>
              </div>
              <div style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 10, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ color: JK.muted, fontSize: 10 }}>Wallet Value</div>
                <div style={{ marginTop: 4, color: JK.gold, fontWeight: 700 }}>{formatUsd(activeWallet.totalValueUsd)}</div>
              </div>
              <div style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 10, background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ color: JK.muted, fontSize: 10 }}>Wallet PnL</div>
                <div style={{ marginTop: 4, color: activeWallet.pnlPercent >= 0 ? JK.green : JK.red, fontWeight: 700 }}>{formatPct(activeWallet.pnlPercent)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <a
                href={`https://solscan.io/account/${activeWallet.address}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 11,
                  background: '#0d1f35',
                  border: '1px solid rgba(59,130,246,0.45)',
                  color: '#93C5FD',
                  borderRadius: 8,
                  padding: '7px 10px',
                  textDecoration: 'none',
                }}
              >
                Open in Solscan ↗
              </a>
              <button
                type="button"
                onClick={() => copyAddress(activeWallet.address)}
                style={{
                  fontSize: 11,
                  background: 'rgba(245,166,35,0.12)',
                  border: `1px solid ${JK.border2}`,
                  color: JK.gold,
                  borderRadius: 8,
                  padding: '7px 10px',
                  cursor: 'pointer',
                }}
              >
                Copy address
              </button>
            </div>
          </div>
        </Card>

        <Card style={{ marginBottom: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", color: '#fff', fontSize: 18 }}>Choice Center</div>
          <div style={{ color: JK.muted, fontSize: 12, marginTop: 6 }}>Collect end-of-epoch decisions in 10 seconds.</div>

          <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
            <select
              value={selectedAngelId}
              onChange={(ev) => setSelectedAngelId(ev.target.value)}
              style={{ background: '#111', color: '#fff', border: `1px solid ${JK.border}`, borderRadius: 10, padding: '10px 12px' }}
            >
              {ANGELS.map((angel) => (
                <option key={angel.id} value={angel.id}>{angel.displayName}</option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
              {Object.keys(CHOICES).map((choiceKey) => {
                const active = selectedChoice === choiceKey;
                return (
                  <button
                    key={choiceKey}
                    type="button"
                    onClick={() => setSelectedChoice(choiceKey)}
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${active ? JK.gold : JK.border}`,
                      background: active ? 'rgba(245,166,35,0.16)' : 'rgba(255,255,255,0.03)',
                      color: active ? JK.gold : '#D3D3D3',
                      fontSize: 12,
                      padding: '9px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {CHOICES[choiceKey]}
                  </button>
                );
              })}
            </div>

            <textarea
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              placeholder="Optional note..."
              style={{ minHeight: 70, background: '#111', color: '#fff', border: `1px solid ${JK.border}`, borderRadius: 10, padding: 10, fontSize: 12 }}
            />

            <button
              type="button"
              onClick={saveChoice}
              style={{ background: JK.gold, border: 'none', borderRadius: 10, padding: '10px 12px', color: '#000', fontWeight: 700, cursor: 'pointer' }}
            >
              Save choice
            </button>
          </div>
        </Card>
      </div>

      <Divider />

      <SectionTitle>Tracked Wallets</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 12 }}>
        {WALLET_SEEDS.map((wallet) => (
          <Card key={wallet.id} style={{ marginBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 17 }}>{wallet.name}</div>
                <div style={{ color: JK.muted, fontSize: 12 }}>{shortAddress(wallet.address)}</div>
              </div>
              <Badge color={wallet.pnlPercent >= 0 ? JK.green : JK.red}>{formatPct(wallet.pnlPercent)}</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, border: `1px solid ${JK.border}` }}>
                <div style={{ color: JK.muted, fontSize: 10 }}>SOL Balance</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>{wallet.solBalance.toFixed(4)}</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 10, border: `1px solid ${JK.border}` }}>
                <div style={{ color: JK.muted, fontSize: 10 }}>USD Value</div>
                <div style={{ marginTop: 4, fontWeight: 700, color: JK.gold }}>{formatUsd(wallet.totalValueUsd)}</div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 11, color: JK.muted }}>Coin PnL snapshot</div>
              {wallet.tokenBreakdown.map((coin) => (
                <div key={`${wallet.id}-${coin.symbol}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, background: 'rgba(255,255,255,0.02)', border: `1px solid ${JK.border}`, borderRadius: 8, padding: '6px 8px' }}>
                  <span style={{ color: '#E5E5E5' }}>{coin.symbol} · {coin.exposure}% expo</span>
                  <span style={{ color: coin.pnlPercent >= 0 ? JK.green : JK.red }}>{formatPct(coin.pnlPercent)}</span>
                </div>
              ))}
            </div>

            <a
              href={`https://solscan.io/account/${wallet.address}`}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 10, display: 'inline-block', color: '#93C5FD', fontSize: 11, textDecoration: 'none' }}
            >
              Verify on Solscan ↗
            </a>
          </Card>
        ))}
      </div>

      <Divider />

      <SectionTitle>Angel Ledger</SectionTitle>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${JK.border2}`, textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Angel</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Deposit</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Share</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Current Est.</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Choice</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Note</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {ANGELS.map((angel) => {
                const saved = choices[angel.id];
                return (
                  <tr key={angel.id} style={{ borderBottom: `1px solid ${JK.border}` }}>
                    <td style={{ padding: '11px 8px', fontSize: 13 }}>{angel.displayName}</td>
                    <td style={{ padding: '11px 8px', fontSize: 13 }}>{formatUsd(angel.depositUsd)}</td>
                    <td style={{ padding: '11px 8px', fontSize: 13 }}>{(angel.shareBps / 100).toFixed(2)}%</td>
                    <td style={{ padding: '11px 8px', fontSize: 13, color: JK.gold }}>{formatUsd(estimateAngelValue(angel.depositUsd, overview.pnl))}</td>
                    <td style={{ padding: '11px 8px', fontSize: 13 }}>
                      {saved?.choice ? <Badge color="#60A5FA">{CHOICES[saved.choice]}</Badge> : <span style={{ color: JK.muted }}>Pending</span>}
                    </td>
                    <td style={{ padding: '11px 8px', fontSize: 12, color: '#D0D0D0' }}>{saved?.note || '—'}</td>
                    <td style={{ padding: '11px 8px', fontSize: 12, color: JK.muted }}>{saved?.at ? new Date(saved.at).toLocaleString() : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </Shell>
  );
}
