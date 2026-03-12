// ============================================================
// JUNGLE KABAL — RISK MANAGER
// Position sizing, stops & exposure tracker
// ============================================================
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const G = "#F5A623";
const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 13px", color: "#fff", fontSize: 13, fontFamily: "'Space Mono', monospace", outline: "none", width: "100%", boxSizing: "border-box" };
const label = { fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 6, fontFamily: "'Cinzel',serif", display: "block" };

function Field({ l, k, val, set, ph, type = "number" }) {
  return (
    <div>
      <span style={label}>{l}</span>
      <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={inp} />
    </div>
  );
}

const INITIAL_POSITIONS = [
  { id: 1, token: "SOL",  entry: 145, stop: 130, size: 5,   status: "open" },
  { id: 2, token: "JUP",  entry: 1.2, stop: 0.95, size: 3, status: "open" },
];

export default function RiskManager() {
  const navigate = useNavigate();

  // Calculator state
  const [portfolio, setPortfolio] = useState("10000");
  const [riskPct,   setRiskPct]   = useState("2");
  const [entry,     setEntry]     = useState("");
  const [stop,      setStop]      = useState("");
  const [target,    setTarget]    = useState("");

  // Positions
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [nextId, setNextId] = useState(10);
  const [addPos, setAddPos] = useState(false);
  const [draft, setDraft] = useState({ token: "", entry: "", stop: "", size: "", status: "open" });

  // ── Calculator ──────────────────────────────────────────────
  const calc = useMemo(() => {
    const p = parseFloat(portfolio) || 0;
    const r = parseFloat(riskPct) / 100 || 0;
    const e = parseFloat(entry) || 0;
    const s = parseFloat(stop) || 0;
    const t = parseFloat(target) || 0;

    const riskUSD = p * r;
    const stopPct = e && s ? Math.abs((e - s) / e) : 0;
    const size    = stopPct ? riskUSD / (e * stopPct) : 0;
    const sizeUSD = size * e;
    const rr      = e && s && t ? (t - e) / (e - s) : 0;

    return { riskUSD, stopPct: stopPct * 100, size, sizeUSD, rr };
  }, [portfolio, riskPct, entry, stop, target]);

  // ── Total exposure ──────────────────────────────────────────
  const totalExposure = positions
    .filter(p => p.status === "open")
    .reduce((s, p) => s + parseFloat(p.size || 0) * parseFloat(p.entry || 0), 0);

  const portfolioVal = parseFloat(portfolio) || 1;
  const exposurePct  = (totalExposure / portfolioVal) * 100;

  function savePosition() {
    if (!draft.token || !draft.entry || !draft.stop) return;
    setPositions(prev => [...prev, { ...draft, id: nextId }]);
    setNextId(n => n + 1);
    setDraft({ token: "", entry: "", stop: "", size: "", status: "open" });
    setAddPos(false);
  }

  function closePosition(id) {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, status: "closed" } : p));
  }

  function deletePosition(id) {
    setPositions(prev => prev.filter(p => p.id !== id));
  }

  return (
    <Shell
      title={<>RISK <span style={{ color: JK.gold }}>MANAGER</span></>}
      subtitle="Position sizing · Stops · Exposure tracker"
      maxWidth={920}
    >
      <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: JK.muted, cursor: "pointer", fontSize: 12, letterSpacing: 1, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
        ← BACK TO HQ
      </button>

      {/* Exposure overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { l: "PORTFOLIO", v: `$${(portfolioVal/1000).toFixed(1)}K`, color: G },
          { l: "OPEN POSITIONS", v: positions.filter(p => p.status === "open").length },
          { l: "TOTAL EXPOSURE", v: `$${Math.round(totalExposure).toLocaleString()}`, color: exposurePct > 80 ? JK.red : exposurePct > 50 ? G : JK.green },
          { l: "EXPOSURE %", v: `${exposurePct.toFixed(0)}%`, color: exposurePct > 80 ? JK.red : exposurePct > 50 ? G : JK.green },
        ].map(({ l, v, color }) => (
          <Card key={l} style={{ padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Cinzel Decorative',serif", color: color || "#888" }}>{v}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Position Sizing Calculator */}
        <Card>
          <SectionTitle>Sizing <span style={{ color: JK.gold }}>Calculator</span></SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <Field l="PORTFOLIO ($)" k="portfolio" val={portfolio} set={setPortfolio} ph="10000" />
            <Field l="RISK PER TRADE (%)" k="riskPct"   val={riskPct}   set={setRiskPct}   ph="2" />
            <Field l="ENTRY PRICE"        k="entry"     val={entry}     set={setEntry}     ph="145.00" />
            <Field l="STOP LOSS"          k="stop"      val={stop}      set={setStop}      ph="130.00" />
            <Field l="TARGET (optional)"  k="target"    val={target}    set={setTarget}    ph="180.00" />
          </div>
          <Divider />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { l: "RISK AMOUNT",   v: calc.riskUSD ? `$${calc.riskUSD.toFixed(0)}` : "—",       color: JK.red },
              { l: "STOP DISTANCE", v: calc.stopPct ? `${calc.stopPct.toFixed(1)}%` : "—",       color: G },
              { l: "POSITION SIZE", v: calc.sizeUSD ? `$${calc.sizeUSD.toFixed(0)}` : "—",       color: G },
              { l: "RISK/REWARD",   v: calc.rr > 0  ? `${calc.rr.toFixed(2)}R` : "—",            color: calc.rr >= 2 ? JK.green : calc.rr > 0 ? G : "#555" },
            ].map(({ l, v, color }) => (
              <div key={l} style={{ background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 4, fontFamily: "'Cinzel',serif" }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: "'Cinzel Decorative',serif", color }}>{v}</div>
              </div>
            ))}
          </div>
          {calc.rr > 0 && (
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: calc.rr >= 2 ? "rgba(34,197,94,0.06)" : calc.rr >= 1 ? "rgba(245,166,35,0.06)" : "rgba(239,68,68,0.06)", border: `1px solid ${calc.rr >= 2 ? JK.green : calc.rr >= 1 ? G : JK.red}22` }}>
              <div style={{ fontSize: 11, color: calc.rr >= 2 ? JK.green : calc.rr >= 1 ? G : JK.red }}>
                {calc.rr >= 3 ? "✓ EXCELLENT setup — asymmetry confirmed" : calc.rr >= 2 ? "✓ GOOD R/R — acceptable entry" : calc.rr >= 1 ? "⚠ WEAK R/R — reconsider entry or stop" : "✗ NEGATIVE R/R — do not trade"}
              </div>
            </div>
          )}
        </Card>

        {/* Rules */}
        <Card>
          <SectionTitle>Risk <span style={{ color: JK.gold }}>Rules</span></SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { rule: "Max risk per trade",     val: "2% of portfolio",  ok: true },
              { rule: "Max daily loss",          val: "5% of portfolio",  ok: true },
              { rule: "Min R/R ratio",           val: "2:1",              ok: true },
              { rule: "Max concurrent positions",val: "5 open at once",   ok: true },
              { rule: "Max exposure per sector", val: "30% of portfolio", ok: true },
              { rule: "Stop loss required",      val: "Always set before entry", ok: true },
            ].map(({ rule, val, ok }) => (
              <div key={rule} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#ccc" }}>{rule}</div>
                  <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{val}</div>
                </div>
                <span style={{ fontSize: 9, color: ok ? JK.green : JK.red, fontWeight: 700, letterSpacing: 1 }}>{ok ? "✓ SET" : "⚠ MISSING"}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Open Positions */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionTitle style={{ marginBottom: 0 }}>Open <span style={{ color: JK.gold }}>Positions</span></SectionTitle>
          <button onClick={() => setAddPos(!addPos)} style={{ background: `rgba(245,166,35,0.12)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "7px 14px", cursor: "pointer", fontFamily: "inherit" }}>+ ADD</button>
        </div>

        {addPos && (
          <div style={{ background: "rgba(245,166,35,0.04)", border: `1px solid ${G}22`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 12 }}>
              {[
                { k: "token", l: "TOKEN", ph: "SOL" },
                { k: "entry", l: "ENTRY ($)", ph: "145" },
                { k: "stop",  l: "STOP ($)",  ph: "130" },
                { k: "size",  l: "SIZE (units)", ph: "5" },
              ].map(({ k, l, ph }) => (
                <div key={k}>
                  <span style={label}>{l}</span>
                  <input value={draft[k]} onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={savePosition} style={{ background: `rgba(245,166,35,0.15)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "8px 20px", cursor: "pointer", fontFamily: "inherit" }}>SAVE POSITION</button>
              <button onClick={() => setAddPos(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#555", fontSize: 11, letterSpacing: 1, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 80px 70px", gap: 8, padding: "8px 12px", fontSize: 8, color: "#333", letterSpacing: 2, fontFamily: "'Cinzel',serif", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span>TOKEN</span><span>ENTRY</span><span>STOP</span><span>SIZE</span><span>RISK$</span><span>STATUS</span><span></span>
        </div>
        {positions.map(p => {
          const risk = parseFloat(p.size) * Math.abs(parseFloat(p.entry) - parseFloat(p.stop));
          const isOpen = p.status === "open";
          return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px 80px 70px", gap: 8, padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center", opacity: isOpen ? 1 : 0.4 }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{p.token}</span>
              <span style={{ fontSize: 12, color: "#888", fontFamily: "'Space Mono',monospace" }}>${p.entry}</span>
              <span style={{ fontSize: 12, color: JK.red, fontFamily: "'Space Mono',monospace" }}>${p.stop}</span>
              <span style={{ fontSize: 12, color: "#888" }}>{p.size}</span>
              <span style={{ fontSize: 12, color: JK.red }}>{risk ? `-$${risk.toFixed(0)}` : "—"}</span>
              <span style={{ fontSize: 9, color: isOpen ? JK.green : "#555", fontWeight: 700, letterSpacing: 1 }}>{p.status.toUpperCase()}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {isOpen && <button onClick={() => closePosition(p.id)} style={{ background: "rgba(34,197,94,0.08)", border: "none", color: JK.green, borderRadius: 6, fontSize: 9, padding: "3px 7px", cursor: "pointer" }}>✓</button>}
                <button onClick={() => deletePosition(p.id)} style={{ background: "rgba(239,68,68,0.08)", border: "none", color: JK.red, borderRadius: 6, fontSize: 9, padding: "3px 7px", cursor: "pointer" }}>✕</button>
              </div>
            </div>
          );
        })}
        {positions.length === 0 && (
          <div style={{ textAlign: "center", color: "#2a2a2a", fontSize: 12, padding: "20px 0" }}>No positions tracked yet</div>
        )}
      </Card>
    </Shell>
  );
}
