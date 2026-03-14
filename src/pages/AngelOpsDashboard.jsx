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
      { symbol: 'SOL', pnlPercent: 4.1, exposure: '57%' },
      { symbol: 'JUP', pnlPercent: 14.8, exposure: '19%' },
      { symbol: 'WIF', pnlPercent: -2.4, exposure: '8%' },
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
      { symbol: 'SOL', pnlPercent: 2.8, exposure: '61%' },
      { symbol: 'BONK', pnlPercent: 10.4, exposure: '13%' },
      { symbol: 'RAY', pnlPercent: 1.9, exposure: '7%' },
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
      { symbol: 'SOL', pnlPercent: 4.9, exposure: '49%' },
      { symbol: 'PYTH', pnlPercent: 12.7, exposure: '17%' },
      { symbol: 'JTO', pnlPercent: 7.1, exposure: '11%' },
    ],
  },
];

const ANGELS = [
  { id: 'a1', displayName: 'Angel One', depositUsd: 5000, shareBps: 2500, status: 'active' },
  { id: 'a2', displayName: 'Angel Two', depositUsd: 7500, shareBps: 3750, status: 'active' },
  { id: 'a3', displayName: 'Angel Three', depositUsd: 7500, shareBps: 3750, status: 'active' },
];

const choiceLabels = {
  withdraw: 'Withdraw',
  rollover: 'Rollover',
  compound: 'Compound',
};

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

export default function AngelOpsDashboard() {
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

  return (
    <Shell
      title={<>Angel <span style={{ color: JK.gold }}>Ops Dashboard</span></>}
      subtitle="Lean MVP — wallet tracking, epoch pulse, and angel choices"
      maxWidth={1120}
    >
      <SectionTitle>Overview</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatBox value={formatUsd(overview.totalEquity)} label="Total Equity" />
        <StatBox value={formatUsd(overview.startEquity)} label="Start of Epoch" color="muted" />
        <StatBox value={formatPct(overview.pnl)} label="Current PnL" color={overview.pnl >= 0 ? 'green' : 'red'} />
        <StatBox value={`${overview.daysLeft}d`} label="Days Left" />
        <StatBox value={`${overview.angelsCount}`} label="Active Angels" />
      </div>

      <Divider />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", color: '#fff', fontSize: 18 }}>{INITIAL_EPOCH.name}</div>
              <div style={{ color: JK.muted, fontSize: 12 }}>Status: {INITIAL_EPOCH.status}</div>
            </div>
            <Badge>{overview.progress.toFixed(0)}% complete</Badge>
          </div>
          <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.08)', borderRadius: 999, height: 10 }}>
            <div style={{ width: `${overview.progress}%`, background: `linear-gradient(90deg, ${JK.gold2}, ${JK.gold})`, height: '100%', borderRadius: 999 }} />
          </div>
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', color: JK.muted, fontSize: 11 }}>
            <span>Start: {new Date(INITIAL_EPOCH.startAt).toLocaleDateString()}</span>
            <span>End: {new Date(INITIAL_EPOCH.endAt).toLocaleDateString()}</span>
          </div>
        </Card>

        <Card>
          <div style={{ fontFamily: "'Cinzel', serif", color: '#fff', fontSize: 18 }}>Choice Center</div>
          <div style={{ color: JK.muted, fontSize: 12, marginTop: 6 }}>Collect end-of-epoch decisions fast.</div>

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
              {Object.keys(choiceLabels).map((choiceKey) => {
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
                    {choiceLabels[choiceKey]}
                  </button>
                );
              })}
            </div>

            <textarea
              value={note}
              onChange={(ev) => setNote(ev.target.value)}
              placeholder="Optional note..."
              style={{ minHeight: 64, background: '#111', color: '#fff', border: `1px solid ${JK.border}`, borderRadius: 10, padding: 10, fontSize: 12 }}
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
          <Card key={wallet.id}>
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
              <div style={{ fontSize: 11, color: JK.muted }}>Coin PnL snapshot (MVP)</div>
              {wallet.tokenBreakdown.map((coin) => (
                <div key={`${wallet.id}-${coin.symbol}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, background: 'rgba(255,255,255,0.02)', border: `1px solid ${JK.border}`, borderRadius: 8, padding: '6px 8px' }}>
                  <span style={{ color: '#E5E5E5' }}>{coin.symbol} · {coin.exposure} expo</span>
                  <span style={{ color: coin.pnlPercent >= 0 ? JK.green : JK.red }}>{formatPct(coin.pnlPercent)}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Divider />

      <SectionTitle>Angel Ledger</SectionTitle>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${JK.border2}`, textAlign: 'left' }}>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Angel</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Deposit</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Share</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Current Est.</th>
                <th style={{ padding: '10px 8px', fontSize: 12, color: JK.muted }}>Choice</th>
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
                      {saved?.choice ? <Badge color="#60A5FA">{choiceLabels[saved.choice]}</Badge> : <span style={{ color: JK.muted }}>Pending</span>}
                    </td>
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
