// ============================================================
// JUNGLE KABAL — KKM (KABAL KOPY MASTERS) DASHBOARD
// Copytrading performance analytics · Persistent via localStorage
// ============================================================
import { useState, useEffect, useRef } from "react";
import Shell, { JK, Card, Badge, SectionTitle, StatBox, Divider } from "../components/JKShell";

const LS_KEY = "jk-kkm-v1";

// ─── DEFAULT STATE ───────────────────────────────────────────
const DEFAULT_METRICS = {
  activeFollowers: 47,
  totalFollowers: 124,
  winRate: 68,
  monthlyRevenue: 4200,
  totalRevenueLTD: 18750,
  avgFollowerPnl: 340,
  bestTrade: "SOL +340%",
  epoch: "Epoch 1",
  startDate: "2026-01-01",
  epochEndDate: "2026-03-31",
};

const DEFAULT_MONTHLY = [
  { month: "Oct", revenue: 1200 },
  { month: "Nov", revenue: 2100 },
  { month: "Dec", revenue: 1850 },
  { month: "Jan", revenue: 3400 },
  { month: "Feb", revenue: 3900 },
  { month: "Mar", revenue: 4200 },
];

const DEFAULT_FOLLOWER_GROWTH = [
  { month: "Oct", count: 28 },
  { month: "Nov", count: 41 },
  { month: "Dec", count: 55 },
  { month: "Jan", count: 78 },
  { month: "Feb", count: 103 },
  { month: "Mar", count: 124 },
];

const EMPTY_SIGNAL = {
  ticker: "",
  direction: "LONG",
  entry: "",
  exitPrice: "",
  result: "OPEN",
  pnlPct: "",
  followersAffected: "",
  notes: "",
  date: new Date().toISOString().slice(0, 10),
};

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ─── INPUT STYLE ─────────────────────────────────────────────
const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: `1px solid ${JK.border2}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: "#fff",
  fontSize: 13,
  fontFamily: "monospace",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
};

const labelStyle = {
  fontSize: 10,
  color: JK.muted,
  letterSpacing: 1,
  textTransform: "uppercase",
  marginBottom: 5,
  display: "block",
  fontFamily: "'Cinzel', serif",
};

// ─── EPOCH PROGRESS BAR ──────────────────────────────────────
function EpochProgress({ epoch, startDate, epochEndDate }) {
  const start = new Date(startDate);
  const end = new Date(epochEndDate);
  const now = new Date("2026-03-15");
  const total = end - start;
  const elapsed = Math.max(0, now - start);
  const pct = Math.min(100, Math.round((elapsed / total) * 100));
  const daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));

  return (
    <Card style={{ marginBottom: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 800, color: JK.gold, letterSpacing: 1 }}>
            {epoch}
          </div>
          <div style={{ fontSize: 11, color: JK.muted, marginTop: 2 }}>
            {startDate} — {epochEndDate}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 900, color: pct >= 80 ? JK.red : JK.gold }}>
            {pct}%
          </div>
          <div style={{ fontSize: 10, color: JK.muted }}>{daysLeft} days left</div>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: pct >= 80
            ? `linear-gradient(90deg, ${JK.gold}, ${JK.red})`
            : `linear-gradient(90deg, ${JK.gold}99, ${JK.gold})`,
          borderRadius: 6,
          transition: "width 0.6s ease",
          boxShadow: `0 0 12px ${JK.gold}55`,
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        <span style={{ fontSize: 10, color: JK.muted }}>START</span>
        <span style={{ fontSize: 10, color: JK.muted }}>END</span>
      </div>
    </Card>
  );
}

// ─── WIN/LOSS BAR ─────────────────────────────────────────────
function WinLossBar({ winRate }) {
  const lossRate = 100 - winRate;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: JK.green, fontWeight: 700 }}>WIN {winRate}%</span>
        <span style={{ fontSize: 11, color: JK.red, fontWeight: 700 }}>LOSS {lossRate}%</span>
      </div>
      <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", height: 18 }}>
        <div style={{
          width: `${winRate}%`,
          background: `linear-gradient(90deg, ${JK.green}aa, ${JK.green})`,
          transition: "width 0.5s",
        }} />
        <div style={{
          width: `${lossRate}%`,
          background: `linear-gradient(90deg, ${JK.red}aa, ${JK.red})`,
          transition: "width 0.5s",
        }} />
      </div>
    </div>
  );
}

// ─── MINI BAR CHART ──────────────────────────────────────────
function MiniBarChart({ data, valueKey, labelKey, color, prefix = "" }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              fontSize: 8,
              color: JK.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              maxWidth: 32,
            }}>
              {prefix}{d[valueKey] >= 1000 ? (d[valueKey] / 1000).toFixed(1) + "k" : d[valueKey]}
            </div>
            <div style={{
              width: "100%",
              height: `${Math.max(pct, 4)}%`,
              background: i === data.length - 1
                ? `linear-gradient(180deg, ${color}, ${color}99)`
                : `${color}55`,
              borderRadius: "3px 3px 0 0",
              minHeight: 4,
              transition: "height 0.4s",
              boxShadow: i === data.length - 1 ? `0 0 10px ${color}66` : "none",
            }} />
            <div style={{ fontSize: 8, color: JK.muted }}>{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── LINE VISUAL (follower growth) ───────────────────────────
function FollowerGrowthVisual({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div style={{ position: "relative", height: 80 }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 68 }}>
        {data.map((d, i) => {
          const pct = (d.count / max) * 100;
          const isLast = i === data.length - 1;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 8, color: JK.muted }}>{d.count}</div>
              <div style={{
                width: "100%",
                height: `${Math.max(pct, 4)}%`,
                background: isLast
                  ? `linear-gradient(180deg, ${JK.gold}, ${JK.gold}88)`
                  : `rgba(245,166,35,0.28)`,
                borderRadius: "3px 3px 0 0",
                minHeight: 4,
                transition: "height 0.4s",
                position: "relative",
              }}>
                {isLast && (
                  <div style={{
                    position: "absolute",
                    top: -4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 8, height: 8,
                    borderRadius: "50%",
                    background: JK.gold,
                    boxShadow: `0 0 10px ${JK.gold}`,
                  }} />
                )}
              </div>
              <div style={{ fontSize: 8, color: JK.muted }}>{d.month}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SIGNAL TABLE ROW ────────────────────────────────────────
function SignalRow({ signal, onDelete }) {
  const resultColor = signal.result === "WIN" ? JK.green : signal.result === "LOSS" ? JK.red : JK.muted;
  const dirColor = signal.direction === "LONG" ? JK.green : JK.red;
  const pnlColor = parseFloat(signal.pnlPct) > 0 ? JK.green : parseFloat(signal.pnlPct) < 0 ? JK.red : JK.muted;

  return (
    <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <td style={{ padding: "10px 12px", fontSize: 12, color: JK.gold, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>
        {signal.ticker}
      </td>
      <td style={{ padding: "10px 8px" }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 1,
          color: dirColor,
          background: `${dirColor}18`,
          border: `1px solid ${dirColor}44`,
          borderRadius: 4, padding: "2px 7px",
        }}>
          {signal.direction}
        </span>
      </td>
      <td style={{ padding: "10px 8px", fontSize: 12, color: "#ccc", fontFamily: "monospace" }}>
        {signal.entry ? `$${signal.entry}` : "—"}
      </td>
      <td style={{ padding: "10px 8px", fontSize: 12, color: "#ccc", fontFamily: "monospace" }}>
        {signal.exitPrice ? `$${signal.exitPrice}` : "—"}
      </td>
      <td style={{ padding: "10px 8px" }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 1,
          color: resultColor,
          background: `${resultColor}18`,
          border: `1px solid ${resultColor}44`,
          borderRadius: 4, padding: "2px 7px",
        }}>
          {signal.result}
        </span>
      </td>
      <td style={{ padding: "10px 8px", fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: pnlColor }}>
        {signal.pnlPct !== "" ? `${parseFloat(signal.pnlPct) > 0 ? "+" : ""}${signal.pnlPct}%` : "—"}
      </td>
      <td style={{ padding: "10px 8px", fontSize: 11, color: JK.muted }}>
        {signal.followersAffected || "—"}
      </td>
      <td style={{ padding: "10px 8px", fontSize: 11, color: JK.muted, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {signal.notes || "—"}
      </td>
      <td style={{ padding: "10px 8px", fontSize: 10, color: "#555", fontFamily: "monospace" }}>
        {signal.date}
      </td>
      <td style={{ padding: "10px 8px" }}>
        <button
          onClick={() => onDelete(signal.id)}
          style={{
            background: "rgba(239,68,68,0.08)",
            border: `1px solid ${JK.red}33`,
            color: JK.red, borderRadius: 6,
            fontSize: 10, padding: "3px 8px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// ─── ADD SIGNAL FORM ─────────────────────────────────────────
function AddSignalForm({ onAdd, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY_SIGNAL });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.ticker) return;
    onAdd({ ...form, id: newId() });
    setForm({ ...EMPTY_SIGNAL });
  }

  const colStyle = { display: "flex", flexDirection: "column" };
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    gap: 12,
    marginBottom: 14,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={gridStyle}>
        <div style={colStyle}>
          <label style={labelStyle}>Ticker *</label>
          <input style={inputStyle} value={form.ticker} onChange={e => set("ticker", e.target.value.toUpperCase())} placeholder="SOL" />
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Direction</label>
          <select style={selectStyle} value={form.direction} onChange={e => set("direction", e.target.value)}>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </select>
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Entry Price</label>
          <input style={inputStyle} type="number" step="any" value={form.entry} onChange={e => set("entry", e.target.value)} placeholder="0.00" />
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Exit Price</label>
          <input style={inputStyle} type="number" step="any" value={form.exitPrice} onChange={e => set("exitPrice", e.target.value)} placeholder="0.00" />
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Result</label>
          <select style={selectStyle} value={form.result} onChange={e => set("result", e.target.value)}>
            <option value="OPEN">OPEN</option>
            <option value="WIN">WIN</option>
            <option value="LOSS">LOSS</option>
          </select>
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>P&L %</label>
          <input style={inputStyle} type="number" step="any" value={form.pnlPct} onChange={e => set("pnlPct", e.target.value)} placeholder="e.g. 34.5" />
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Followers Affected</label>
          <input style={inputStyle} type="number" value={form.followersAffected} onChange={e => set("followersAffected", e.target.value)} placeholder="0" />
        </div>
        <div style={colStyle}>
          <label style={labelStyle}>Date</label>
          <input style={inputStyle} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
      </div>
      <div style={colStyle}>
        <label style={labelStyle}>Notes</label>
        <input style={{ ...inputStyle, marginBottom: 14 }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Optional notes…" />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button type="submit" style={{
          background: JK.gold,
          color: "#000",
          border: "none",
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: 12,
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          letterSpacing: 1,
          cursor: "pointer",
          boxShadow: `0 0 16px ${JK.gold}44`,
        }}>
          + ADD SIGNAL
        </button>
        <button type="button" onClick={onCancel} style={{
          background: "transparent",
          color: JK.muted,
          border: `1px solid rgba(255,255,255,0.1)`,
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 12,
          cursor: "pointer",
        }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────────
export default function KKMDashboard() {
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [editMetrics, setEditMetrics] = useState(DEFAULT_METRICS);
  const [signals, setSignals] = useState([]);
  const [monthlyData, setMonthlyData] = useState(DEFAULT_MONTHLY);
  const [followerData, setFollowerData] = useState(DEFAULT_FOLLOWER_GROWTH);
  const [sortAsc, setSortAsc] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  // ── LOAD from localStorage ──────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.metrics) { setMetrics(saved.metrics); setEditMetrics(saved.metrics); }
        if (saved.signals) setSignals(saved.signals);
        if (saved.monthlyData) setMonthlyData(saved.monthlyData);
        if (saved.followerData) setFollowerData(saved.followerData);
      }
    } catch (_) {}
    setLoaded(true);
  }, []);

  // ── AUTO-SAVE on change ─────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToLS();
    }, 800);
    return () => clearTimeout(saveTimerRef.current);
  }, [metrics, signals, monthlyData, followerData, loaded]);

  function saveToLS(showFeedback = false) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ metrics, signals, monthlyData, followerData }));
      if (showFeedback) {
        setSaveMsg("Saved");
        setTimeout(() => setSaveMsg(null), 2000);
      }
    } catch (_) {}
  }

  function applyMetrics() {
    setMetrics({ ...editMetrics });
    setSaveMsg("Metrics saved");
    setTimeout(() => setSaveMsg(null), 2000);
  }

  function setEM(k, v) {
    setEditMetrics(f => ({ ...f, [k]: v }));
  }

  // ── SIGNALS ─────────────────────────────────────────────────
  function addSignal(sig) {
    setSignals(prev => [sig, ...prev]);
    setShowAddForm(false);
  }

  function deleteSignal(id) {
    setSignals(prev => prev.filter(s => s.id !== id));
  }

  const sortedSignals = [...signals].sort((a, b) => {
    const da = new Date(a.date), db = new Date(b.date);
    return sortAsc ? da - db : db - da;
  });

  // ── THIS MONTH STATS ─────────────────────────────────────────
  const thisMonth = "2026-03";
  const monthSignals = signals.filter(s => s.date && s.date.startsWith(thisMonth));
  const monthWins = monthSignals.filter(s => s.result === "WIN").length;
  const monthClosed = monthSignals.filter(s => s.result !== "OPEN").length;
  const monthWinRate = monthClosed > 0 ? Math.round((monthWins / monthClosed) * 100) : 0;

  // ── RENDER ───────────────────────────────────────────────────
  const btnPrimary = {
    background: JK.gold,
    color: "#000",
    border: "none",
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 11,
    fontFamily: "'Cinzel', serif",
    fontWeight: 700,
    letterSpacing: 1,
    cursor: "pointer",
    boxShadow: `0 0 14px ${JK.gold}44`,
  };

  const btnGhost = {
    background: "transparent",
    color: JK.gold,
    border: `1px solid ${JK.border2}`,
    borderRadius: 8,
    padding: "9px 20px",
    fontSize: 11,
    fontFamily: "'Cinzel', serif",
    fontWeight: 700,
    letterSpacing: 1,
    cursor: "pointer",
  };

  const thStyle = {
    padding: "10px 12px",
    fontSize: 9,
    color: JK.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontFamily: "'Cinzel', serif",
    textAlign: "left",
    borderBottom: `1px solid ${JK.border}`,
    whiteSpace: "nowrap",
  };

  return (
    <Shell
      title="KKM Dashboard"
      subtitle="Kabal Kopy Masters · Copytrading Performance Analytics"
      maxWidth={960}
    >
      {/* ── EPOCH PROGRESS ───────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <SectionTitle style={{ marginBottom: 0 }}>
            <span style={{ color: JK.gold }}>Epoch</span> Progress
          </SectionTitle>
          <Badge color={JK.gold}>{metrics.epoch}</Badge>
        </div>
        <EpochProgress
          epoch={metrics.epoch}
          startDate={metrics.startDate}
          epochEndDate={metrics.epochEndDate}
        />
      </div>

      <Divider />

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <SectionTitle>
        <span style={{ color: JK.gold }}>KKM</span> Metrics
      </SectionTitle>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 12,
        marginBottom: 28,
      }}>
        <StatBox
          value={metrics.activeFollowers}
          label="Active Followers"
          color="gold"
        />
        <StatBox
          value={`${metrics.winRate}%`}
          label="Win Rate"
          color={metrics.winRate >= 60 ? "green" : metrics.winRate >= 50 ? "gold" : "red"}
        />
        <StatBox
          value={`$${metrics.monthlyRevenue.toLocaleString()}`}
          label="Monthly Revenue"
          color="green"
        />
        <StatBox
          value={metrics.totalFollowers}
          label="Total Followers"
          color="gold"
        />
        <StatBox
          value={`$${metrics.avgFollowerPnl}`}
          label="Avg Follower P&L / mo"
          color="green"
        />
        <StatBox
          value={`$${metrics.totalRevenueLTD.toLocaleString()}`}
          label="LTD Revenue"
          badge="ALL TIME"
          color="gold"
        />
      </div>

      <Divider />

      {/* ── PERFORMANCE CHARTS ───────────────────────────────── */}
      <SectionTitle>
        <span style={{ color: JK.gold }}>Performance</span> Charts
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Win/Loss */}
        <Card style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Cinzel',serif", marginBottom: 14 }}>
            Win / Loss Ratio
          </div>
          <WinLossBar winRate={metrics.winRate} />
          <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 6 }}>
            <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 900, color: JK.green }}>
              {metrics.winRate}
            </span>
            <span style={{ fontSize: 22, color: "#333", alignSelf: "center" }}>/</span>
            <span style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 900, color: JK.red }}>
              {100 - metrics.winRate}
            </span>
          </div>
          <div style={{ textAlign: "center", fontSize: 9, color: "#444", marginTop: 4 }}>WIN % / LOSS %</div>
        </Card>

        {/* Monthly Revenue Chart */}
        <Card style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Cinzel',serif", marginBottom: 14 }}>
            Monthly Revenue (6mo)
          </div>
          <MiniBarChart data={monthlyData} valueKey="revenue" labelKey="month" color={JK.green} prefix="$" />
        </Card>

        {/* Follower Growth */}
        <Card style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Cinzel',serif", marginBottom: 14 }}>
            Follower Growth (6mo)
          </div>
          <FollowerGrowthVisual data={followerData} />
        </Card>
      </div>

      <Divider />

      {/* ── THIS MONTH STATS ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Monthly card */}
        <Card style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Cinzel',serif", marginBottom: 14 }}>
            This Month — March 2026
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 900, color: JK.gold }}>
                {monthSignals.length}
              </div>
              <div style={{ fontSize: 9, color: JK.muted, letterSpacing: 1 }}>SIGNALS</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 900, color: monthWinRate >= 60 ? JK.green : JK.red }}>
                {monthSignals.length > 0 ? `${monthWinRate}%` : "—"}
              </div>
              <div style={{ fontSize: 9, color: JK.muted, letterSpacing: 1 }}>WIN RATE</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 900, color: JK.green }}>
                ${metrics.monthlyRevenue.toLocaleString()}
              </div>
              <div style={{ fontSize: 9, color: JK.muted, letterSpacing: 1 }}>REVENUE</div>
            </div>
          </div>
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, color: JK.muted, marginBottom: 4 }}>Best Trade</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: JK.gold, fontWeight: 800 }}>
                {metrics.bestTrade}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: JK.muted, marginBottom: 4 }}>Avg Follower P&L</div>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 18, color: JK.green, fontWeight: 900 }}>
                +${metrics.avgFollowerPnl}
              </div>
            </div>
          </div>
        </Card>

        {/* Telegram integration */}
        <Card style={{ marginBottom: 0 }}>
          <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, textTransform: "uppercase", fontFamily: "'Cinzel',serif", marginBottom: 14 }}>
            Telegram Integration
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href="https://t.me/JungleKabalKKM"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(245,166,35,0.06)",
                border: `1px solid ${JK.border2}`,
                borderRadius: 10,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 20 }}>📢</span>
              <div>
                <div style={{ fontSize: 12, color: JK.gold, fontFamily: "'Cinzel',serif", fontWeight: 700 }}>KKM Channel</div>
                <div style={{ fontSize: 10, color: JK.muted }}>Signals & announcements</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 10, color: JK.muted }}>→</span>
            </a>
            <a
              href="https://t.me/JungleKabalBot"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(245,166,35,0.06)",
                border: `1px solid ${JK.border2}`,
                borderRadius: 10,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 20 }}>🤖</span>
              <div>
                <div style={{ fontSize: 12, color: JK.gold, fontFamily: "'Cinzel',serif", fontWeight: 700 }}>KKM Bot</div>
                <div style={{ fontSize: 10, color: JK.muted }}>Automated signal delivery</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 10, color: JK.muted }}>→</span>
            </a>
            <a
              href="https://t.me/JungleKabalAnnouncements"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                background: "rgba(245,166,35,0.06)",
                border: `1px solid ${JK.border2}`,
                borderRadius: 10,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: 20 }}>📣</span>
              <div>
                <div style={{ fontSize: 12, color: JK.gold, fontFamily: "'Cinzel',serif", fontWeight: 700 }}>Announcements</div>
                <div style={{ fontSize: 10, color: JK.muted }}>Updates & news</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 10, color: JK.muted }}>→</span>
            </a>
          </div>
        </Card>
      </div>

      <Divider />

      {/* ── EDITABLE METRICS PANEL ───────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionTitle style={{ marginBottom: 0 }}>
          <span style={{ color: JK.gold }}>Edit</span> Metrics
        </SectionTitle>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saveMsg && (
            <span style={{ fontSize: 11, color: JK.green, fontFamily: "monospace" }}>
              ✓ {saveMsg}
            </span>
          )}
          <button style={btnPrimary} onClick={applyMetrics}>
            SAVE METRICS
          </button>
          <button style={btnGhost} onClick={() => saveToLS(true)}>
            SAVE ALL
          </button>
        </div>
      </div>

      <Card>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 14,
        }}>
          {[
            { key: "activeFollowers", label: "Active Followers", type: "number" },
            { key: "totalFollowers", label: "Total Followers", type: "number" },
            { key: "winRate", label: "Win Rate (%)", type: "number" },
            { key: "monthlyRevenue", label: "Monthly Revenue ($)", type: "number" },
            { key: "totalRevenueLTD", label: "Total Revenue LTD ($)", type: "number" },
            { key: "avgFollowerPnl", label: "Avg Follower P&L ($/mo)", type: "number" },
            { key: "bestTrade", label: "Best Trade", type: "text" },
            { key: "epoch", label: "Epoch Name", type: "text" },
            { key: "startDate", label: "Epoch Start Date", type: "date" },
            { key: "epochEndDate", label: "Epoch End Date", type: "date" },
          ].map(({ key, label, type }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle}>{label}</label>
              <input
                style={inputStyle}
                type={type}
                value={editMetrics[key] ?? ""}
                onChange={e => setEM(key, type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
                placeholder={label}
                step={type === "number" ? "any" : undefined}
              />
            </div>
          ))}
        </div>

        <Divider />

        <div style={{ fontSize: 11, color: JK.muted, marginBottom: 10, fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
          MONTHLY REVENUE DATA (last 6 months)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {monthlyData.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ ...labelStyle, marginBottom: 4 }}>{d.month}</label>
              <input
                style={{ ...inputStyle, fontSize: 12 }}
                type="number"
                value={d.revenue}
                onChange={e => {
                  const updated = [...monthlyData];
                  updated[i] = { ...d, revenue: Number(e.target.value) || 0 };
                  setMonthlyData(updated);
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: JK.muted, marginBottom: 10, marginTop: 18, fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
          FOLLOWER GROWTH DATA (last 6 months)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {followerData.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ ...labelStyle, marginBottom: 4 }}>{d.month}</label>
              <input
                style={{ ...inputStyle, fontSize: 12 }}
                type="number"
                value={d.count}
                onChange={e => {
                  const updated = [...followerData];
                  updated[i] = { ...d, count: Number(e.target.value) || 0 };
                  setFollowerData(updated);
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Divider />

      {/* ── SIGNAL LOG ───────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionTitle style={{ marginBottom: 0 }}>
          <span style={{ color: JK.gold }}>Signal</span> Log
        </SectionTitle>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={btnGhost}
            onClick={() => setSortAsc(v => !v)}
          >
            DATE {sortAsc ? "▲" : "▼"}
          </button>
          <button
            style={btnPrimary}
            onClick={() => setShowAddForm(v => !v)}
          >
            {showAddForm ? "CANCEL" : "+ ADD SIGNAL"}
          </button>
        </div>
      </div>

      {showAddForm && (
        <Card style={{ marginBottom: 20, borderColor: JK.border2 }}>
          <div style={{ fontSize: 12, color: JK.gold, fontFamily: "'Cinzel', serif", fontWeight: 700, marginBottom: 16, letterSpacing: 1 }}>
            NEW SIGNAL
          </div>
          <AddSignalForm onAdd={addSignal} onCancel={() => setShowAddForm(false)} />
        </Card>
      )}

      {signals.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <div style={{
              fontSize: 48,
              marginBottom: 16,
              opacity: 0.3,
            }}>
              📡
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, color: JK.muted, marginBottom: 8, letterSpacing: 1 }}>
              NO SIGNALS YET
            </div>
            <div style={{ fontSize: 12, color: "#444" }}>
              Click "+ ADD SIGNAL" to log your first trade signal.
            </div>
            <button
              style={{ ...btnPrimary, marginTop: 20 }}
              onClick={() => setShowAddForm(true)}
            >
              + ADD FIRST SIGNAL
            </button>
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "rgba(245,166,35,0.04)" }}>
                  <th style={thStyle}>Ticker</th>
                  <th style={thStyle}>Dir</th>
                  <th style={thStyle}>Entry</th>
                  <th style={thStyle}>Exit</th>
                  <th style={thStyle}>Result</th>
                  <th style={thStyle}>P&L %</th>
                  <th style={thStyle}>Followers</th>
                  <th style={thStyle}>Notes</th>
                  <th style={{ ...thStyle, cursor: "pointer" }} onClick={() => setSortAsc(v => !v)}>
                    Date {sortAsc ? "▲" : "▼"}
                  </th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {sortedSignals.map(sig => (
                  <SignalRow key={sig.id} signal={sig} onDelete={deleteSignal} />
                ))}
              </tbody>
            </table>
          </div>
          <div style={{
            padding: "12px 20px",
            borderTop: `1px solid ${JK.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: 10, color: JK.muted }}>
              {signals.length} signal{signals.length !== 1 ? "s" : ""} total
              {signals.filter(s => s.result === "WIN").length > 0 && ` · ${signals.filter(s => s.result === "WIN").length} wins`}
              {signals.filter(s => s.result === "LOSS").length > 0 && ` · ${signals.filter(s => s.result === "LOSS").length} losses`}
              {signals.filter(s => s.result === "OPEN").length > 0 && ` · ${signals.filter(s => s.result === "OPEN").length} open`}
            </span>
            <span style={{ fontSize: 10, color: JK.muted }}>
              Overall W/L: {
                signals.filter(s => s.result !== "OPEN").length > 0
                  ? `${Math.round((signals.filter(s => s.result === "WIN").length / signals.filter(s => s.result !== "OPEN").length) * 100)}%`
                  : "—"
              }
            </span>
          </div>
        </Card>
      )}

      {/* ── FOOTER NOTE ──────────────────────────────────────── */}
      <div style={{ marginTop: 32, padding: "16px 20px", background: "rgba(245,166,35,0.04)", border: `1px solid ${JK.border}`, borderRadius: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: JK.gold, fontWeight: 700, letterSpacing: 1 }}>
              KKM · KABAL KOPY MASTERS
            </span>
            <span style={{ fontSize: 10, color: "#444", marginLeft: 16 }}>
              Data persists to localStorage · Key: {LS_KEY}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {saveMsg && (
              <span style={{ fontSize: 11, color: JK.green, fontFamily: "monospace" }}>✓ {saveMsg}</span>
            )}
            <button style={btnPrimary} onClick={() => saveToLS(true)}>
              SAVE ALL
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
