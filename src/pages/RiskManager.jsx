// ============================================================
// JUNGLE KABAL — FIRE RISK V9
// Position sizing · Trade logger · Moonbag tracker
// ============================================================
import { useState, useEffect } from "react";

const LOGO = "https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png";
const G = "#F5A623";

const QUOTES = [
  "Sortir les initiales = trade réussi. Le reste est du bonus. 🎯",
  "Don't marry your bags 💔",
  "No revenge trades. Ever. 🔥",
  "Quand ça marche vraiment, je sors. Je ne cherche pas plus. ✊",
  "Take profit like a monk 🧘",
  "25% max. -500$ = stop. C'est tout.",
];

const STATUS_COLORS = {
  SAFE:     { bar: "#22c55e", glow: "0 0 20px #22c55e44", border: "rgba(34,197,94,0.35)",  bg: "rgba(34,197,94,0.07)"  },
  WARNING:  { bar: G,        glow: "0 0 20px #F5A62344", border: "rgba(245,166,35,0.35)", bg: "rgba(245,166,35,0.08)" },
  DANGER:   { bar: "#fb923c", glow: "0 0 20px #fb923c44", border: "rgba(251,146,60,0.35)", bg: "rgba(251,146,60,0.07)" },
  CRITICAL: { bar: "#FF007A", glow: "0 0 30px #FF007A66", border: "rgba(255,0,122,0.5)",   bg: "rgba(255,0,122,0.08)"  },
};

function getStatus(ratio) {
  if (ratio < 60) return "SAFE";
  if (ratio < 80) return "WARNING";
  if (ratio < 100) return "DANGER";
  return "CRITICAL";
}

function Divider() {
  return <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.35), transparent)", margin: "20px 0 16px" }} />;
}

function GlowCard({ ratio, children, style = {} }) {
  const s = getStatus(ratio);
  const c = STATUS_COLORS[s];
  return (
    <div style={{ border: `1px solid ${c.border}`, boxShadow: c.glow, background: c.bg, borderRadius: 16, padding: 20, backdropFilter: "blur(10px)", transition: "all 0.3s ease", animation: s === "CRITICAL" ? "pulse 1.5s infinite" : "none", ...style }}>
      {children}
    </div>
  );
}

function RiskBar({ ratio }) {
  const s = getStatus(ratio);
  const c = STATUS_COLORS[s];
  const labels = { SAFE: "🟢 SAFE", WARNING: "🟡 WARNING", DANGER: "🟠 DANGER", CRITICAL: "🔴 CRITICAL" };
  return (
    <div>
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, height: 8, overflow: "hidden", margin: "8px 0 4px" }}>
        <div style={{ width: `${Math.min(ratio, 100)}%`, height: "100%", background: c.bar, transition: "width 0.4s ease", borderRadius: 8 }} />
      </div>
      <span style={{ fontSize: 11, color: c.bar, letterSpacing: 1 }}>{labels[s]} — {ratio.toFixed(1)}%</span>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "number", style = {} }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#888", letterSpacing: 1, ...style }}>
      {label}
      <input type={type} value={value} onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, padding: "6px 10px", color: "white", fontSize: 13, outline: "none", width: "100%", fontFamily: "inherit" }} />
    </label>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, letterSpacing: 3, color: G, textTransform: "uppercase", marginBottom: 14 }}>{children}</div>;
}

const cardStyle = { background: "rgba(20,20,20,0.9)", border: "1px solid rgba(245,166,35,0.15)", borderRadius: 16, padding: 20, backdropFilter: "blur(10px)" };
const inputStyle = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8, padding: "6px 10px", color: "white", fontSize: 13, outline: "none" };
const btnStyle = (color = G) => ({
  background: color === G ? "rgba(245,166,35,0.15)" : color === "#22c55e" ? "rgba(34,197,94,0.15)" : color === "#FF007A" ? "rgba(255,0,122,0.15)" : color === "#9945FF" ? "rgba(153,69,255,0.15)" : "rgba(255,255,255,0.05)",
  color, border: `1px solid ${color}44`, borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "'Cinzel', serif", letterSpacing: 1, transition: "all 0.2s",
});

const DEFAULT_PRESETS = [
  { name: "SAFE",   globalFloat: 100, dailyAmmo: 15, maxRiskPct: 3,  allocation: 80, wallets: [
    { name: "SNIPER", label: "Buy the Dip — Size", dailyRiskPct: 2, stopPct: 5, tradesMin: 1, tradesMax: 2, avgRewardMin: 50, avgRewardMax: 100 },
    { name: "EXPLORATION", label: "Profits Only — LowCap", dailyRiskPct: 1, stopPct: 10, tradesMin: 1, tradesMax: 3, avgRewardMin: 100, avgRewardMax: 300 },
  ]},
  { name: "NORMAL", globalFloat: 100, dailyAmmo: 25, maxRiskPct: 5,  allocation: 70, wallets: [
    { name: "SNIPER", label: "Buy the Dip — Size", dailyRiskPct: 3, stopPct: 5, tradesMin: 1, tradesMax: 3, avgRewardMin: 80, avgRewardMax: 150 },
    { name: "EXPLORATION", label: "Profits Only — LowCap", dailyRiskPct: 2, stopPct: 15, tradesMin: 2, tradesMax: 6, avgRewardMin: 200, avgRewardMax: 500 },
  ]},
  { name: "AGGRO",  globalFloat: 100, dailyAmmo: 40, maxRiskPct: 10, allocation: 50, wallets: [
    { name: "SNIPER", label: "Buy the Dip — Size", dailyRiskPct: 5, stopPct: 8, tradesMin: 2, tradesMax: 5, avgRewardMin: 100, avgRewardMax: 300 },
    { name: "EXPLORATION", label: "Profits Only — LowCap", dailyRiskPct: 5, stopPct: 20, tradesMin: 3, tradesMax: 8, avgRewardMin: 300, avgRewardMax: 1000 },
  ]},
];

export default function RiskManager() {
  const [globalFloat, setGlobalFloat] = useState(100);
  const [solPrice, setSolPrice] = useState(150);
  const [isUSD, setIsUSD] = useState(false);
  const [dailyAmmo, setDailyAmmo] = useState(25);
  const [maxRiskPct, setMaxRiskPct] = useState(5);
  const [allocation, setAllocation] = useState(70);
  const [sessionStart, setSessionStart] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [quoteIdx] = useState(Math.floor(Math.random() * QUOTES.length));
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [activePreset, setActivePreset] = useState(1);
  const [editingPresetName, setEditingPresetName] = useState(null);
  const [wallets, setWallets] = useState([
    { name: "SNIPER",      label: "Buy the Dip — Size",    dailyRiskPct: 3, stopPct: 5,  tradesMin: 1, tradesMax: 3, avgRewardMin: 80,  avgRewardMax: 150, trades: [] },
    { name: "EXPLORATION", label: "Profits Only — LowCap", dailyRiskPct: 2, stopPct: 15, tradesMin: 2, tradesMax: 6, avgRewardMin: 200, avgRewardMax: 500, trades: [] },
  ]);
  const [moonbags, setMoonbags] = useState([]);
  const [newMoonbag, setNewMoonbag] = useState({ token: "", entryPrice: "", currentPrice: "", size: "", stopPct: 15, wallet: 0 });
  const [newTrade, setNewTrade] = useState({ token: "", entryPrice: "", stopPrice: "", targetPrice: "", sizeSOL: "" });

  // Load from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem("jk-risk-v9");
      if (!s) return;
      const d = JSON.parse(s);
      if (d.globalFloat) setGlobalFloat(d.globalFloat);
      if (d.solPrice) setSolPrice(d.solPrice);
      if (d.dailyAmmo) setDailyAmmo(d.dailyAmmo);
      if (d.maxRiskPct) setMaxRiskPct(d.maxRiskPct);
      if (d.allocation !== undefined) setAllocation(d.allocation);
      if (d.presets) setPresets(d.presets);
      if (d.wallets) setWallets(d.wallets);
      if (d.moonbags) setMoonbags(d.moonbags);
    } catch {}
  }, []);

  function saveToLocal() {
    localStorage.setItem("jk-risk-v9", JSON.stringify({ globalFloat, solPrice, dailyAmmo, maxRiskPct, allocation, presets, wallets, moonbags }));
  }

  const applyPreset = (p) => {
    setGlobalFloat(p.globalFloat); setDailyAmmo(p.dailyAmmo);
    setMaxRiskPct(p.maxRiskPct); setAllocation(p.allocation);
    setWallets(p.wallets.map(w => ({ ...w, trades: [] })));
  };

  const savePreset = (idx) => {
    setPresets(presets.map((p, i) => i === idx ? { ...p, globalFloat, dailyAmmo, maxRiskPct, allocation, wallets: wallets.map(({ trades, ...w }) => w) } : p));
  };

  // Assign allocation percentages
  const walletsWithAlloc = wallets.map((w, i) => ({ ...w, allocationPct: i === 0 ? 100 - allocation : allocation }));

  const calcWallet = (w) => {
    const capital = (dailyAmmo * w.allocationPct) / 100;
    const avgTrades = (w.tradesMin + w.tradesMax) / 2;
    const stopPct = Math.max(w.stopPct, 1);
    const dailyStopSOL = capital * (w.dailyRiskPct / 100);
    const riskPerTradeSOL = avgTrades > 0 ? dailyStopSOL / avgTrades : 0;
    const rewardRiskRatio = ((w.avgRewardMin + w.avgRewardMax) / 2) / stopPct;
    const expectedProfitMin = riskPerTradeSOL * (w.avgRewardMin / stopPct);
    const expectedProfitMax = riskPerTradeSOL * (w.avgRewardMax / stopPct);
    const expectedProfitAvg = (expectedProfitMin + expectedProfitMax) / 2;
    const tradesToBurn = w.dailyRiskPct > 0 ? Math.floor(Math.log(0.5) / Math.log(1 - w.dailyRiskPct / 100)) : 0;
    const totalLoss = (w.trades || []).filter(t => t.result === "loss").reduce((s, t) => s + (parseFloat(t.sizeSOL) * (w.stopPct / 100) || 0), 0);
    const totalWin = (w.trades || []).filter(t => t.result === "win").reduce((s, t) => s + (parseFloat(t.profitSOL) || 0), 0);
    return { ...w, capital, avgTrades, dailyStopSOL, riskPerTradeSOL, rewardRiskRatio, expectedProfitMin, expectedProfitMax, expectedProfitAvg, tradesToBurn, totalLoss, totalWin };
  };

  const calced = walletsWithAlloc.map(calcWallet);
  const maxRiskSOL = (globalFloat * maxRiskPct) / 100;
  const totalDailyRisk = calced.reduce((s, w) => s + w.dailyStopSOL, 0);
  const totalExpectedProfit = calced.reduce((s, w) => s + w.expectedProfitAvg, 0);
  const globalRiskRatio = maxRiskSOL > 0 ? (totalDailyRisk / maxRiskSOL) * 100 : 0;

  const fmt = (sol) => isUSD ? `$${(sol * solPrice).toFixed(2)}` : `${sol.toFixed(3)} ◎`;
  const fmtTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    let iv;
    if (sessionStart) iv = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [sessionStart]);

  const updateWallet = (idx, key, val) => setWallets(wallets.map((w, i) => i === idx ? { ...w, [key]: val } : w));

  const addTrade = (walletIdx) => {
    if (!newTrade.token || !newTrade.entryPrice || !newTrade.stopPrice || !newTrade.sizeSOL) return;
    const entry = parseFloat(newTrade.entryPrice);
    const stop = parseFloat(newTrade.stopPrice);
    const target = parseFloat(newTrade.targetPrice) || 0;
    const size = parseFloat(newTrade.sizeSOL);
    const rr = target && entry !== stop ? ((target - entry) / Math.abs(entry - stop)).toFixed(2) : "-";
    const riskSOL = size * (Math.abs(entry - stop) / entry);
    const trade = { ...newTrade, id: Date.now(), rr, riskSOL: riskSOL.toFixed(4), profitSOL: "", result: "open", time: new Date().toLocaleTimeString() };
    setWallets(wallets.map((w, i) => i === walletIdx ? { ...w, trades: [trade, ...(w.trades || [])] } : w));
    setNewTrade({ token: "", entryPrice: "", stopPrice: "", targetPrice: "", sizeSOL: "" });
  };

  const closeTrade = (walletIdx, tradeId, result, profitSOL = "") => {
    setWallets(wallets.map((w, i) => i === walletIdx ? { ...w, trades: (w.trades || []).map(t => t.id === tradeId ? { ...t, result, profitSOL } : t) } : w));
  };

  const moveToBag = (walletIdx, tradeId) => {
    const trade = (wallets[walletIdx].trades || []).find(t => t.id === tradeId);
    if (!trade) return;
    setMoonbags([...moonbags, { id: Date.now(), token: trade.token, entryPrice: trade.entryPrice, currentPrice: trade.entryPrice, size: trade.sizeSOL, stopPct: wallets[walletIdx].stopPct, wallet: walletIdx, trailingActive: true, highPrice: trade.entryPrice }]);
    closeTrade(walletIdx, tradeId, "moonbag");
  };

  const updateMoonbag = (id, key, val) => setMoonbags(moonbags.map(m => m.id === id ? { ...m, [key]: val } : m));
  const removeMoonbag = (id) => setMoonbags(moonbags.filter(m => m.id !== id));

  const calcMoonbagPnl = (m) => {
    const entry = parseFloat(m.entryPrice) || 0;
    const current = parseFloat(m.currentPrice) || 0;
    const size = parseFloat(m.size) || 0;
    if (!entry || !size) return { pnlPct: 0, stopPrice: 0, pnlSOL: 0 };
    const pnlPct = ((current - entry) / entry) * 100;
    const high = parseFloat(m.highPrice) || current;
    const stopPrice = high * (1 - m.stopPct / 100);
    return { pnlPct, stopPrice, pnlSOL: size * (pnlPct / 100) };
  };

  const isKillSwitch = calced.reduce((s, w) => s + w.totalLoss, 0) * solPrice >= 500;

  const tabStyle = (active) => ({
    padding: "7px 18px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
    fontFamily: "'Cinzel', serif", letterSpacing: 2,
    background: active ? "rgba(245,166,35,0.2)" : "transparent",
    color: active ? G : "#555",
    border: `1px solid ${active ? "rgba(245,166,35,0.5)" : "rgba(255,255,255,0.08)"}`,
    transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0D0D0D", color: "white", fontFamily: "'Inter', 'ui-monospace', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,0,122,0.4)} 50%{box-shadow:0 0 40px rgba(255,0,122,0.8)} }
        * { box-sizing: border-box; }
        input[type=range] { accent-color: #F5A623; }
        ::-webkit-scrollbar { width: 4px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,166,35,0.3); border-radius: 4px; }
      `}</style>

      {/* Slim global nav */}
      <div style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(13,13,13,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(245,166,35,0.12)", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, height: 42, overflowX: "auto" }}>
          {[["HQ","/"],["Board","/narrative-board"],["Risk","/risk-manager"],["War Room","/war-room"],["Sprint","/sprint-board"],["CRM","/crm-angel"],["Arsenal","/arsenal"],["Academy","/academy"]].map(([label, path]) => {
            const active = window.location.pathname === path;
            return (
              <button key={path} onClick={() => window.location.href = path} style={{ background: active ? "rgba(245,166,35,0.15)" : "transparent", border: `1px solid ${active ? "rgba(245,166,35,0.4)" : "transparent"}`, borderRadius: 7, padding: "5px 11px", color: active ? G : "#555", fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>{label}</button>
            );
          })}
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "40px 20px 0" }}>
        <img src={LOGO} alt="Jungle Kabal" style={{ width: 80, display: "block", margin: "0 auto 12px", filter: "drop-shadow(0 0 24px rgba(245,166,35,0.5))" }} />
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: 5, color: G, opacity: 0.7, marginBottom: 10, textTransform: "uppercase" }}>Private Trading System — Solana</div>
        <h1 style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 26, fontWeight: 900, letterSpacing: 2, margin: 0, background: `linear-gradient(90deg, ${G}, #FFD037, ${G})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 20px rgba(245,166,35,0.4))" }}>FIRE RISK V9</h1>
        <p style={{ color: "#555", fontSize: 11, marginTop: 10, fontStyle: "italic", maxWidth: 400, margin: "10px auto 0" }}>"{QUOTES[quoteIdx]}"</p>
      </div>

      <Divider />

      {isKillSwitch && (
        <div style={{ maxWidth: 780, margin: "0 auto 16px", padding: "0 24px" }}>
          <div style={{ background: "rgba(255,0,122,0.1)", border: "1px solid rgba(255,0,122,0.5)", borderRadius: 12, padding: 16, textAlign: "center", animation: "glow 1s infinite" }}>
            <div style={{ fontFamily: "'Cinzel', serif", color: "#FF007A", fontWeight: 700, fontSize: 16, letterSpacing: 3 }}>🔴 KILL SWITCH — SESSION TERMINÉE</div>
            <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 6 }}>Tu as perdu $500 aujourd'hui. Aucun trade supplémentaire.</div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Global config */}
        <div style={cardStyle}>
          <SectionTitle>⚙️ Configuration Globale</SectionTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
            <FieldInput label="FLOAT TOTAL (SOL)" value={globalFloat} onChange={setGlobalFloat} />
            <FieldInput label="AMMO JOURNALIER (SOL)" value={dailyAmmo} onChange={setDailyAmmo} />
            <FieldInput label="MAX RISK % / JOUR" value={maxRiskPct} onChange={setMaxRiskPct} />
            <FieldInput label="PRIX SOL ($)" value={solPrice} onChange={setSolPrice} />
            <button onClick={() => setIsUSD(!isUSD)} style={{ ...btnStyle(G), alignSelf: "flex-end", padding: "8px 14px" }}>{isUSD ? "◎ SOL" : "$ USD"}</button>
            <button onClick={saveToLocal} style={{ ...btnStyle("#22c55e"), alignSelf: "flex-end" }}>💾 SAVE</button>
            <div style={{ alignSelf: "flex-end" }}>
              {!sessionStart ? (
                <button onClick={() => { setSessionStart(Date.now()); setElapsed(0); }} style={btnStyle("#22c55e")}>▶ START SESSION</button>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Cinzel Decorative', serif", color: G, fontWeight: 700, fontSize: 18, letterSpacing: 2 }}>{fmtTime(elapsed)}</div>
                  <button onClick={() => { setSessionStart(null); setElapsed(0); }} style={{ ...btnStyle("#FF007A"), marginTop: 4, fontSize: 10 }}>⏹ END</button>
                </div>
              )}
            </div>
          </div>

          {/* Allocation slider */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid rgba(245,166,35,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 8, fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
              <span style={{ color: G }}>⚡ SNIPER {100 - allocation}%</span>
              <span style={{ color: allocation === 50 ? "#FFD037" : "#333", fontSize: 10 }}>{allocation === 50 ? "⚖ 50/50" : "— ALLOCATION —"}</span>
              <span style={{ color: "#9945FF" }}>🔥 EXPLORATION {allocation}%</span>
            </div>
            <input type="range" min="0" max="100" value={allocation} onChange={e => setAllocation(Number(e.target.value))} style={{ width: "100%", cursor: "pointer" }} />
          </div>

          {/* Presets */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(245,166,35,0.1)" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: 3, color: "#444", marginBottom: 10 }}>PRESETS STRATÉGIE</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {presets.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {editingPresetName === i ? (
                    <input autoFocus value={p.name}
                      onChange={e => setPresets(presets.map((pr, pi) => pi === i ? { ...pr, name: e.target.value } : pr))}
                      onBlur={() => setEditingPresetName(null)}
                      onKeyDown={e => e.key === "Enter" && setEditingPresetName(null)}
                      style={{ ...inputStyle, width: 100, fontSize: 11 }} />
                  ) : (
                    <button onClick={() => { applyPreset(p); setActivePreset(i); }} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Cinzel', serif", letterSpacing: 2, background: activePreset === i ? "rgba(245,166,35,0.2)" : "transparent", color: activePreset === i ? G : "#444", border: `1px solid ${activePreset === i ? "rgba(245,166,35,0.5)" : "rgba(255,255,255,0.08)"}` }}>{p.name}</button>
                  )}
                  <button onClick={() => setEditingPresetName(i)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 12 }}>✏️</button>
                  <button onClick={() => { savePreset(i); setActivePreset(i); }} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 12 }}>💾</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Divider />

        {/* Global summary */}
        <GlowCard ratio={globalRiskRatio}>
          <SectionTitle>📊 Global Summary</SectionTitle>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 28, fontWeight: 900, color: STATUS_COLORS[getStatus(globalRiskRatio)].bar, lineHeight: 1 }}>{getStatus(globalRiskRatio)}</div>
            <div style={{ textAlign: "right", fontSize: 12, lineHeight: 2 }}>
              <div style={{ color: "#888" }}>Daily Risk: <b style={{ color: "white" }}>{fmt(totalDailyRisk)}</b></div>
              <div style={{ color: "#888" }}>Expected: <b style={{ color: "#22c55e" }}>{fmt(totalExpectedProfit)}</b></div>
              <div style={{ color: "#888" }}>Moonbags: <b style={{ color: "#9945FF" }}>{moonbags.length}</b></div>
            </div>
          </div>
          <RiskBar ratio={globalRiskRatio} />
        </GlowCard>

        <Divider />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {["OVERVIEW", "SNIPER", "EXPLORATION", "MOONBAGS"].map((t, i) => (
            <button key={i} onClick={() => setActiveTab(i)} style={tabStyle(activeTab === i)}>{t}</button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {calced.map((w, idx) => {
              const walletRiskRatio = (w.dailyRiskPct / maxRiskPct) * 100;
              return (
                <GlowCard key={idx} ratio={walletRiskRatio}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: G, marginBottom: 2, letterSpacing: 2 }}>{w.name}</div>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 14, letterSpacing: 1 }}>{w.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                    {[["Capital", fmt(w.capital), "white"], ["Daily Stop", fmt(w.dailyStopSOL), "#FF007A"], ["Risk/Trade", fmt(w.riskPerTradeSOL), "white"], ["R:R Ratio", `${w.rewardRiskRatio.toFixed(2)}:1`, G], ["Burn in", `${w.tradesToBurn} trades`, "#fb923c"], ["Expected Avg", fmt(w.expectedProfitAvg), "#22c55e"]].map(([lbl, val, col]) => (
                      <div key={lbl}><div style={{ color: "#555", fontSize: 10, letterSpacing: 1, marginBottom: 2 }}>{lbl}</div><div style={{ color: col, fontWeight: 700, fontSize: 15 }}>{val}</div></div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#22c55e" }}>✅ {(w.trades || []).filter(t => t.result === "win").length} Wins</span>
                    <span style={{ color: "#FF007A" }}>❌ {(w.trades || []).filter(t => t.result === "loss").length} Loss</span>
                    <span style={{ color: "#9945FF" }}>🌙 {(w.trades || []).filter(t => t.result === "moonbag").length} Bags</span>
                  </div>
                  <RiskBar ratio={walletRiskRatio} />
                </GlowCard>
              );
            })}
          </div>
        )}

        {/* Wallet tabs */}
        {(activeTab === 1 || activeTab === 2) && (() => {
          const idx = activeTab - 1;
          const w = calced[idx];
          const walletRiskRatio = (w.dailyRiskPct / maxRiskPct) * 100;
          const entry = parseFloat(newTrade.entryPrice);
          const stop = parseFloat(newTrade.stopPrice);
          const target = parseFloat(newTrade.targetPrice);
          const rrPreview = entry && stop && target && entry !== stop ? ((target - entry) / Math.abs(entry - stop)).toFixed(2) : null;
          const rrOk = rrPreview && parseFloat(rrPreview) >= 2;
          const posSize = parseFloat(newTrade.sizeSOL) || 0;
          const posPct = w.capital > 0 ? (posSize / w.capital) * 100 : 0;
          const maxPos = w.capital * 0.25;
          const posOver = posSize > maxPos;

          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={cardStyle}>
                <SectionTitle>⚙️ Configuration</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <FieldInput label="DAILY RISK %" value={w.dailyRiskPct} onChange={v => updateWallet(idx, "dailyRiskPct", v)} />
                  <FieldInput label="STOP % / TRADE" value={w.stopPct} onChange={v => updateWallet(idx, "stopPct", v)} />
                  <FieldInput label="TRADES MIN" value={w.tradesMin} onChange={v => updateWallet(idx, "tradesMin", v)} />
                  <FieldInput label="TRADES MAX" value={w.tradesMax} onChange={v => updateWallet(idx, "tradesMax", v)} />
                  <FieldInput label="REWARD MIN %" value={w.avgRewardMin} onChange={v => updateWallet(idx, "avgRewardMin", v)} />
                  <FieldInput label="REWARD MAX %" value={w.avgRewardMax} onChange={v => updateWallet(idx, "avgRewardMax", v)} />
                </div>
                <GlowCard ratio={walletRiskRatio} style={{ marginTop: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12 }}>
                    <div><div style={{ color: "#555", fontSize: 10, letterSpacing: 1 }}>Capital</div><b style={{ color: G }}>{fmt(w.capital)}</b></div>
                    <div><div style={{ color: "#555", fontSize: 10, letterSpacing: 1 }}>Daily Stop</div><b style={{ color: "#FF007A" }}>{fmt(w.dailyStopSOL)}</b></div>
                    <div><div style={{ color: "#555", fontSize: 10, letterSpacing: 1 }}>Risk/Trade</div><b style={{ color: "white" }}>{fmt(w.riskPerTradeSOL)}</b></div>
                    <div><div style={{ color: "#555", fontSize: 10, letterSpacing: 1 }}>R:R</div><b style={{ color: G }}>{w.rewardRiskRatio.toFixed(2)}:1</b></div>
                    <div style={{ gridColumn: "1/-1" }}><div style={{ color: "#555", fontSize: 10, letterSpacing: 1 }}>Expected</div><b style={{ color: "#22c55e" }}>{fmt(w.expectedProfitMin)} – {fmt(w.expectedProfitMax)}</b></div>
                    <div><div style={{ color: "#555", fontSize: 10, letterSpacing: 1 }}>Burn in</div><b style={{ color: "#fb923c" }}>{w.tradesToBurn} trades</b></div>
                  </div>
                  <RiskBar ratio={walletRiskRatio} />
                </GlowCard>
              </div>

              <div style={cardStyle}>
                <SectionTitle>📋 Log Trade</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <FieldInput label="TOKEN" value={newTrade.token} onChange={v => setNewTrade({ ...newTrade, token: v })} type="text" />
                  <FieldInput label="ENTRÉE" value={newTrade.entryPrice} onChange={v => setNewTrade({ ...newTrade, entryPrice: v })} type="text" />
                  <FieldInput label="STOP LOSS" value={newTrade.stopPrice} onChange={v => setNewTrade({ ...newTrade, stopPrice: v })} type="text" />
                  <FieldInput label="TARGET" value={newTrade.targetPrice} onChange={v => setNewTrade({ ...newTrade, targetPrice: v })} type="text" />
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "#888", letterSpacing: 1 }}>
                      SIZE POSITION (SOL)
                      <input type="text" value={newTrade.sizeSOL} onChange={e => setNewTrade({ ...newTrade, sizeSOL: e.target.value })}
                        style={{ background: posOver ? "rgba(255,0,122,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${posOver ? "rgba(255,0,122,0.5)" : posSize > 0 ? "rgba(34,197,94,0.4)" : "rgba(245,166,35,0.2)"}`, borderRadius: 8, padding: "6px 10px", color: "white", fontSize: 13, outline: "none", width: "100%", fontFamily: "inherit" }} />
                    </label>
                    {posSize > 0 && (
                      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: posOver ? "#FF007A" : "#22c55e", background: posOver ? "rgba(255,0,122,0.1)" : "rgba(34,197,94,0.07)", border: `1px solid ${posOver ? "rgba(255,0,122,0.3)" : "rgba(34,197,94,0.3)"}`, borderRadius: 6, padding: "3px 10px" }}>
                          {posOver ? "⚠️ OVER 25%" : "✅"} {posPct.toFixed(1)}%
                        </span>
                        <span style={{ fontSize: 11, color: "#888", background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "3px 10px", border: "1px solid rgba(255,255,255,0.08)" }}>
                          {posSize.toFixed(3)} ◎ = ${(posSize * solPrice).toFixed(0)}
                        </span>
                        <span style={{ fontSize: 11, color: "#555", background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "3px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                          Max: {maxPos.toFixed(3)} ◎
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {rrPreview && (
                  <div style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 700, color: rrOk ? "#22c55e" : G, border: `1px solid ${rrOk ? "rgba(34,197,94,0.3)" : "rgba(245,166,35,0.3)"}`, borderRadius: 8, padding: "6px 10px", background: rrOk ? "rgba(34,197,94,0.07)" : "rgba(245,166,35,0.07)", marginBottom: 8, fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
                    R:R {rrPreview}:1 {rrOk ? "✅ Viable" : "⚠️ Faible"}
                  </div>
                )}
                <button onClick={() => addTrade(idx)} style={btnStyle("#22c55e")}>+ AJOUTER</button>
                <div style={{ marginTop: 16, maxHeight: 300, overflowY: "auto" }}>
                  {(!w.trades || w.trades.length === 0) && <div style={{ color: "#333", fontSize: 11, textAlign: "center", padding: 24, fontFamily: "'Cinzel', serif", letterSpacing: 2 }}>AUCUN TRADE LOGGÉ</div>}
                  {(w.trades || []).map(t => (
                    <div key={t.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 10, padding: 10, marginBottom: 8, fontSize: 12, border: `1px solid ${t.result === "win" ? "rgba(34,197,94,0.2)" : t.result === "loss" ? "rgba(255,0,122,0.2)" : t.result === "moonbag" ? "rgba(153,69,255,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: "white", fontSize: 13 }}>{t.token}</span>
                        <span style={{ color: "#444", fontSize: 10 }}>{t.time}</span>
                        <span style={{ fontWeight: 700, color: parseFloat(t.rr) >= 2 ? "#22c55e" : G, fontSize: 11 }}>R:R {t.rr}:1</span>
                      </div>
                      <div style={{ color: "#555", marginBottom: 6, fontSize: 10 }}>In: {t.entryPrice} · Stop: {t.stopPrice} · Target: {t.targetPrice} · Risk: {t.riskSOL} ◎</div>
                      {t.result === "open" && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button onClick={() => { const p = prompt("Profit en SOL ?"); if (p) closeTrade(idx, t.id, "win", p); }} style={{ ...btnStyle("#22c55e"), fontSize: 10, padding: "4px 10px" }}>✅ Win</button>
                          <button onClick={() => closeTrade(idx, t.id, "loss")} style={{ ...btnStyle("#FF007A"), fontSize: 10, padding: "4px 10px" }}>❌ Loss</button>
                          <button onClick={() => moveToBag(idx, t.id)} style={{ ...btnStyle("#9945FF"), fontSize: 10, padding: "4px 10px" }}>🌙 Moonbag</button>
                        </div>
                      )}
                      {t.result !== "open" && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: t.result === "win" ? "#22c55e" : t.result === "loss" ? "#FF007A" : "#9945FF", fontFamily: "'Cinzel', serif", letterSpacing: 1 }}>
                          {t.result === "win" ? `✅ WIN +${t.profitSOL} ◎` : t.result === "loss" ? "❌ LOSS" : "🌙 MOONBAG"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Moonbags */}
        {activeTab === 3 && (
          <div>
            <div style={cardStyle}>
              <SectionTitle>🌙 Ajouter un Moonbag</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                <FieldInput label="TOKEN" value={newMoonbag.token} onChange={v => setNewMoonbag({ ...newMoonbag, token: v })} type="text" style={{ width: 100 }} />
                <FieldInput label="PRIX ENTRÉE" value={newMoonbag.entryPrice} onChange={v => setNewMoonbag({ ...newMoonbag, entryPrice: v })} type="text" style={{ width: 110 }} />
                <FieldInput label="PRIX ACTUEL" value={newMoonbag.currentPrice} onChange={v => setNewMoonbag({ ...newMoonbag, currentPrice: v })} type="text" style={{ width: 110 }} />
                <FieldInput label="SIZE (SOL)" value={newMoonbag.size} onChange={v => setNewMoonbag({ ...newMoonbag, size: v })} type="text" style={{ width: 100 }} />
                <FieldInput label="TRAILING STOP %" value={newMoonbag.stopPct} onChange={v => setNewMoonbag({ ...newMoonbag, stopPct: v })} style={{ width: 110 }} />
                <div style={{ alignSelf: "flex-end" }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4, letterSpacing: 1 }}>WALLET</div>
                  <select value={newMoonbag.wallet} onChange={e => setNewMoonbag({ ...newMoonbag, wallet: Number(e.target.value) })} style={{ ...inputStyle, width: 140, fontFamily: "inherit" }}>
                    {wallets.map((w, i) => <option key={i} value={i}>{w.name}</option>)}
                  </select>
                </div>
                <button onClick={() => {
                  if (!newMoonbag.token || !newMoonbag.entryPrice) return;
                  setMoonbags([...moonbags, { ...newMoonbag, id: Date.now(), highPrice: newMoonbag.currentPrice || newMoonbag.entryPrice, trailingActive: true }]);
                  setNewMoonbag({ token: "", entryPrice: "", currentPrice: "", size: "", stopPct: 15, wallet: 0 });
                }} style={{ ...btnStyle("#9945FF"), alignSelf: "flex-end" }}>+ AJOUTER</button>
              </div>
            </div>
            <Divider />
            {moonbags.length === 0 && <div style={{ textAlign: "center", padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>🌙</div><div style={{ fontFamily: "'Cinzel', serif", color: "#333", fontSize: 11, letterSpacing: 3 }}>AUCUN MOONBAG ACTIF</div></div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {moonbags.map(m => {
                const { pnlPct, stopPrice, pnlSOL } = calcMoonbagPnl(m);
                const current = parseFloat(m.currentPrice) || 0;
                const isAboveStop = current > stopPrice;
                return (
                  <div key={m.id} style={{ ...cardStyle, border: `1px solid ${isAboveStop ? "rgba(153,69,255,0.4)" : "rgba(255,0,122,0.4)"}`, boxShadow: `0 0 20px ${isAboveStop ? "rgba(153,69,255,0.1)" : "rgba(255,0,122,0.1)"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, fontSize: 16, color: "#9945FF", letterSpacing: 2 }}>🌙 {m.token}</span>
                      <span style={{ fontSize: 10, color: "#444" }}>{wallets[m.wallet]?.name}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, marginBottom: 12 }}>
                      <div><div style={{ color: "#555", fontSize: 10 }}>Entrée</div><b style={{ color: "white" }}>{m.entryPrice}</b></div>
                      <div><div style={{ color: "#555", fontSize: 10 }}>Actuel</div>
                        <input value={m.currentPrice} onChange={e => { const v = e.target.value; const high = Math.max(parseFloat(v)||0, parseFloat(m.highPrice)||0); updateMoonbag(m.id,"currentPrice",v); updateMoonbag(m.id,"highPrice",high.toString()); }} style={{ ...inputStyle, width:"100%", fontSize:12, padding:"4px 8px", fontFamily:"inherit" }} />
                      </div>
                      <div><div style={{ color: "#555", fontSize: 10 }}>PnL</div><b style={{ color: pnlPct>=0?"#22c55e":"#FF007A", fontSize:14 }}>{pnlPct.toFixed(1)}% ({pnlSOL.toFixed(3)} ◎)</b></div>
                      <div><div style={{ color:"#555", fontSize:10 }}>Stop %</div><input type="number" value={m.stopPct} onChange={e=>updateMoonbag(m.id,"stopPct",Number(e.target.value))} style={{...inputStyle,width:"100%",fontSize:12,padding:"4px 8px",fontFamily:"inherit"}} /></div>
                    </div>
                    <div style={{ background: isAboveStop?"rgba(34,197,94,0.07)":"rgba(255,0,122,0.07)", border:`1px solid ${isAboveStop?"rgba(34,197,94,0.3)":"rgba(255,0,122,0.3)"}`, borderRadius:8, padding:"8px 12px", marginBottom:12 }}>
                      <div style={{ fontSize:10, color:"#555" }}>Trailing Stop · high: {parseFloat(m.highPrice).toFixed(6)}</div>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:14, color:isAboveStop?"#22c55e":"#FF007A" }}>{stopPrice.toFixed(6)} {isAboveStop?"✅ Safe":"⚠️ TRIGGERED"}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={()=>removeMoonbag(m.id)} style={{...btnStyle("#22c55e"),flex:1,fontSize:10}}>💰 VENDU</button>
                      <button onClick={()=>removeMoonbag(m.id)} style={{...btnStyle("#FF007A"),flex:1,fontSize:10}}>🛑 STOPPÉ</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Divider />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <img src={LOGO} alt="" style={{ height: 28, opacity: 0.2 }} />
            <span style={{ fontFamily: "'Cinzel', serif", color: "#333", fontSize: 9, letterSpacing: 4 }}>JUNGLE KABAL — FIRE RISK V9.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
