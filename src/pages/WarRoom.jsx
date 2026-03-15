// ============================================================
// JUNGLE KABAL — WAR ROOM (refactored with JKShell)
// Financial dashboard · Fee log · Treasury tracker
// ============================================================
import { useEffect, useState } from "react";
import Shell, { JK, Card, SectionTitle, StatBox, Badge, Divider } from "../components/JKShell";

const LOGO_ROUND = "https://i.postimg.cc/fTGb8PWH/logo-jaune-rond.png";

const INITIAL_RESERVES = {
  usdc: 0, btc: 0, btcP: 85000, eth: 0, ethP: 3000,
  sol: 0, solP: 140, others: 0, ops: 0, lpU: 0, lpS: 0, burn: 0,
  kkmG: 0, kkmP: 140, daily: 0,
};

function fmt$(n) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`; }
function fmtSol(n) { return `◎${parseFloat(n).toFixed(2)}`; }
function fmtBtc(n) { return `₿${parseFloat(n).toFixed(4)}`; }

// ── inline style helpers ──────────────────────────────────────
const inputBase = {
  background: "#0a0a0a",
  border: `1px solid ${JK.border2}`,
  color: "#e5e7eb",
  fontSize: 11,
  padding: "8px 10px",
  outline: "none",
  width: "100%",
  borderRadius: 8,
  fontFamily: "'Inter', sans-serif",
};

const labelStyle = {
  fontSize: 8,
  letterSpacing: 1,
  color: JK.muted,
  textTransform: "uppercase",
  marginBottom: 4,
  display: "block",
};

const fieldWrap = { display: "flex", flexDirection: "column", gap: 4 };

const inputGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
  gap: 10,
  marginBottom: 14,
};

const btnOutline = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontSize: 9, fontWeight: 600, letterSpacing: 1,
  padding: "8px 18px",
  border: `1px solid ${JK.gold}`,
  color: JK.gold, background: "transparent", cursor: "pointer",
  textTransform: "uppercase", borderRadius: 9999,
  fontFamily: "'Inter', sans-serif",
};

const btnSave = {
  fontSize: 9, letterSpacing: 1, fontWeight: 600,
  padding: "7px 18px",
  background: JK.gold, color: "#000", border: "none", cursor: "pointer",
  borderRadius: 9999, textTransform: "uppercase",
  fontFamily: "'Inter', sans-serif",
};

const tblTh = {
  textAlign: "left", fontSize: 7, letterSpacing: 1, color: JK.muted,
  padding: "8px 12px", borderBottom: `1px solid ${JK.border}`,
  textTransform: "uppercase", whiteSpace: "nowrap",
};
const tblTd = { padding: "10px 12px", borderBottom: `1px solid rgba(20,20,20,0.8)`, verticalAlign: "middle", fontSize: 9 };

export default function WarRoom() {
  const [openAcc, setOpenAcc] = useState(new Set(["wr-reserves", "wr-kkm", "tr-log", "tr-summary"]));
  const [reserves, setReserves] = useState(INITIAL_RESERVES);
  const [showWrForm, setShowWrForm] = useState(false);
  const [wrForm, setWrForm] = useState({ date: new Date().toISOString().slice(0, 10), gross: "", source: "KKM", note: "" });
  const [wrEntries, setWrEntries] = useState([]);
  const [trForm, setTrForm] = useState({ week: "", gross: "", burn: "", usdc: "", btc: "", solP: "140", note: "" });
  const [trEntries, setTrEntries] = useState([]);
  const [toast, setToast] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const r = localStorage.getItem("jk-wr-reserves");
      const we = localStorage.getItem("jk-wr-entries");
      const te = localStorage.getItem("jk-tr-entries");
      if (r) setReserves(JSON.parse(r));
      if (we) setWrEntries(JSON.parse(we));
      if (te) setTrEntries(JSON.parse(te));
    } catch {}
  }, []);

  function toggleAcc(id) {
    setOpenAcc(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function setR(key, val) {
    setReserves(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  }

  // Computed financial values
  const btcUsd = reserves.btc * reserves.btcP;
  const ethUsd = reserves.eth * reserves.ethP;
  const solUsd = reserves.sol * reserves.solP;
  const lpSolUsd = reserves.lpS * reserves.solP;
  const realNet = reserves.usdc + btcUsd + ethUsd + reserves.others;
  const netWithSol = realNet + solUsd;
  const total = netWithSol + reserves.ops + reserves.lpU + lpSolUsd;
  const totalAlloc = total || 1;
  const runway = reserves.burn > 0 ? (realNet / reserves.burn).toFixed(1) : "—";
  const runwayNum = parseFloat(runway);
  const runwayOk = runway === "—" || runwayNum >= 6;
  const runwayWarn = runway !== "—" && runwayNum < 6 && runwayNum >= 3;
  const kkmNet = reserves.kkmG * 0.75;
  const kkmUsd = kkmNet * reserves.kkmP;
  const kkmMonthly = kkmUsd * 4;

  // KKM form auto-net
  const wrFormNet = wrForm.gross ? (parseFloat(wrForm.gross) * 0.75 * reserves.solP).toFixed(2) : "";

  function wrAdd() {
    if (!wrForm.date || !wrForm.gross) return;
    const gross = parseFloat(wrForm.gross);
    const tugan = (gross * 0.25).toFixed(3);
    const kabalSol = (gross * 0.75).toFixed(3);
    const kabalUsd = (gross * 0.75 * reserves.solP).toFixed(2);
    setWrEntries(prev => [...prev, { id: Date.now(), ...wrForm, gross, tugan, kabalSol, kabalUsd }]);
    setWrForm(p => ({ ...p, gross: "", source: "KKM", note: "" }));
    setShowWrForm(false);
  }

  // Treasury form auto-calc
  const trFormNet = trForm.gross ? (parseFloat(trForm.gross) * 0.75).toFixed(3) : "";

  function trAdd() {
    if (!trForm.week) return;
    const gross = parseFloat(trForm.gross) || 0;
    const solP = parseFloat(trForm.solP) || 140;
    const kabalSol = (gross * 0.75).toFixed(3);
    const kabalUsd = (gross * 0.75 * solP).toFixed(2);
    const burn = parseFloat(trForm.burn) || 0;
    const net = (parseFloat(kabalUsd) - burn).toFixed(2);
    const prev = trEntries[trEntries.length - 1];
    const trend = prev ? (parseFloat(kabalUsd) >= parseFloat(prev.kabalUsd) ? "up" : "down") : "flat";
    setTrEntries(p => [...p, { id: Date.now(), ...trForm, gross, kabalSol, kabalUsd, netPnl: net, trend }]);
    setTrForm({ week: "", gross: "", burn: "", usdc: "", btc: "", solP: "140", note: "" });
  }

  function trClear() {
    setTrForm({ week: "", gross: "", burn: "", usdc: "", btc: "", solP: "140", note: "" });
  }

  // Treasury summary
  const lastEntry = trEntries[trEntries.length - 1];
  const trTotalRev = trEntries.reduce((s, e) => s + parseFloat(e.kabalUsd || 0), 0);
  const trTotalNet = trEntries.reduce((s, e) => s + parseFloat(e.netPnl || 0), 0);

  // Chart max for treasury bar chart
  const chartMax = Math.max(...trEntries.map(e => (parseFloat(e.usdc) || 0) + (parseFloat(e.btc) || 0) * 85000), 1);

  function saveAll() {
    localStorage.setItem("jk-wr-reserves", JSON.stringify(reserves));
    localStorage.setItem("jk-wr-entries", JSON.stringify(wrEntries));
    localStorage.setItem("jk-tr-entries", JSON.stringify(trEntries));
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  const nowStr = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  // Sprint progress (March 1 – May 30)
  const sprintStart = new Date("2026-03-01");
  const sprintEnd = new Date("2026-05-30");
  const now = new Date();
  const elapsed = Math.max(0, Math.floor((now - sprintStart) / 86400000));
  const sprintTotal = Math.floor((sprintEnd - sprintStart) / 86400000);
  const sprintPct = Math.min(100, Math.round((elapsed / sprintTotal) * 100));
  const monthTotal = wrEntries
    .filter(e => e.date?.slice(0, 7) === now.toISOString().slice(0, 7))
    .reduce((s, e) => s + parseFloat(e.kabalUsd || 0), 0);

  // Runway color
  const runwayColor = runwayOk ? JK.green : runwayWarn ? JK.gold : JK.red;

  // Accordion component (local)
  function Accordion({ id, icon, title, badge, children }) {
    const isOpen = openAcc.has(id);
    return (
      <div style={{
        borderRadius: 16, border: `1px solid ${JK.border}`,
        overflow: "hidden", marginBottom: 12,
      }}>
        <div
          onClick={() => toggleAcc(id)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "14px 18px", cursor: "pointer",
            background: isOpen ? "rgba(245,166,35,0.04)" : JK.card,
            borderBottom: isOpen ? `1px solid ${JK.border}` : "none",
            userSelect: "none", transition: "background 0.2s",
          }}
        >
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, letterSpacing: 1, flex: 1, color: "#e5e7eb" }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: 7, padding: "2px 8px",
              border: `1px solid ${JK.border2}`, color: JK.gold,
              borderRadius: 9999, letterSpacing: 1,
            }}>{badge}</span>
          )}
          <span style={{ color: JK.muted, fontSize: 10, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}>▼</span>
        </div>
        {isOpen && (
          <div style={{ background: "rgba(10,10,10,0.7)", padding: 18 }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  return (
    <Shell
      title={<><span style={{ color: JK.gold }}>WAR</span> ROOM</>}
      subtitle="Internal financial dashboard · Squad of 5 · 90-Day Sprint"
      maxWidth={1100}
    >
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: JK.gold, color: "#000",
          fontSize: 9, letterSpacing: 2,
          padding: "10px 22px", textTransform: "uppercase",
          fontWeight: 700, zIndex: 999, borderRadius: 9999,
        }}>
          Saved ✓
        </div>
      )}

      {/* Top bar: date + save */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10, marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: 9, letterSpacing: 1,
            padding: "4px 12px", borderRadius: 9999,
            border: `1px solid ${JK.green}`, color: JK.green,
          }}>● ONLINE</span>
          <span style={{ fontSize: 9, letterSpacing: 1, color: JK.muted }}>{nowStr}</span>
        </div>
        <button style={btnSave} onClick={saveAll}>Save ◈</button>
      </div>

      {/* ── DASHBOARD HERO ────────────────────────────────────── */}
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: 24, border: `1px solid ${JK.border2}`,
        background: "linear-gradient(135deg, rgba(20,20,20,0.9) 0%, rgba(13,13,13,0.95) 100%)",
        padding: "28px 32px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 20,
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 32px ${JK.gold}22`,
        minHeight: 130,
      }}>
        {/* JK round logo */}
        <img
          src={LOGO_ROUND}
          alt="Jungle Kabal"
          style={{ width: 60, height: 60, objectFit: "contain", position: "relative", zIndex: 2, filter: `drop-shadow(0 0 16px ${JK.gold}80)` }}
        />
        <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700, color: JK.gold, letterSpacing: 2, lineHeight: 1.1 }}>
            KABAL COMMAND CENTER
          </div>
          <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 2, textTransform: "uppercase", marginTop: 6 }}>
            Internal financial dashboard · Squad of 5 · 90-Day Sprint
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", position: "relative", zIndex: 2 }}>
          <Badge color={JK.gold}>Only The Chosen</Badge>
          <Badge color={JK.green}>March — Phase 1</Badge>
        </div>
      </div>

      <Divider />

      {/* ── NET WORTH TIERS ───────────────────────────────────── */}
      <SectionTitle>Net Worth Tiers</SectionTitle>
      <div style={{ borderRadius: 20, border: `1px solid ${JK.border}`, overflow: "hidden", marginBottom: 20, background: JK.card }}>

        {/* Tier 1 — Real Net Worth */}
        <div style={{ borderBottom: `1px solid ${JK.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 16, padding: "20px 24px" }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: JK.muted, textTransform: "uppercase", marginBottom: 6 }}>
                🏆 Kabal Real Net Worth
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{ fontSize: 9, color: JK.muted }}>USDC Reserve <b style={{ color: "#3b82f6", marginLeft: 4 }}>{fmt$(reserves.usdc)}</b></span>
                <span style={{ fontSize: 9, color: JK.muted }}>BTC Reserve <b style={{ color: "#f7931a", marginLeft: 4 }}>{fmtBtc(reserves.btc)}</b></span>
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 36, fontWeight: 700, letterSpacing: 1, lineHeight: 1, color: JK.green }}>
                {fmt$(realNet)}
              </div>
              <div style={{ fontSize: 8, color: JK.muted, marginTop: 5, letterSpacing: 0.5 }}>Stable reserves only — USDC + BTC · No SOL counted</div>
            </div>
            <img src={LOGO_ROUND} alt="" style={{ width: 60, height: 60, objectFit: "contain", opacity: 0.6 }} />
          </div>
        </div>

        {/* Tier 2 — Net Worth incl. SOL */}
        <div style={{ borderBottom: `1px solid ${JK.border}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 16, padding: "20px 24px" }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: JK.muted, textTransform: "uppercase", marginBottom: 6 }}>
                ⚡ Kabal Net Worth <span style={{ fontSize: 7, marginLeft: 4 }}>incl. SOL ammo</span>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{ fontSize: 9, color: JK.muted }}>Real Net Worth</span>
                <span style={{ fontSize: 9, color: JK.muted }}>+ SOL Ammo <b style={{ color: "#9945ff", marginLeft: 4 }}>{fmtSol(reserves.sol)}</b></span>
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 36, fontWeight: 700, letterSpacing: 1, lineHeight: 1, color: JK.gold }}>
                {fmt$(netWithSol)}
              </div>
              <div style={{ fontSize: 8, color: JK.muted, marginTop: 5 }}>Real Net Worth + SOL ammunition at current price</div>
            </div>
            <img src={LOGO_ROUND} alt="" style={{ width: 60, height: 60, objectFit: "contain", opacity: 0.6 }} />
          </div>
        </div>

        {/* Tier 3 — Total Worth */}
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 16, padding: "20px 24px" }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: 2, color: JK.muted, textTransform: "uppercase", marginBottom: 6 }}>
                🌐 Total Kabal Worth
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <span style={{ fontSize: 9, color: JK.muted }}>Net Worth + SOL</span>
                <span style={{ fontSize: 9, color: JK.muted }}>Ops Wallet <b style={{ color: "#3b82f6", marginLeft: 4 }}>{fmt$(reserves.ops)}</b></span>
                <span style={{ fontSize: 9, color: JK.muted }}>LP Reserve <b style={{ color: "#9945ff", marginLeft: 4 }}>{fmt$(reserves.lpU + lpSolUsd)}</b></span>
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 36, fontWeight: 700, letterSpacing: 1, lineHeight: 1, color: "#fff" }}>
                {fmt$(total)}
              </div>
              <div style={{ fontSize: 8, color: JK.muted, marginTop: 5 }}>Everything combined — full picture</div>
            </div>
            <img src={LOGO_ROUND} alt="" style={{ width: 60, height: 60, objectFit: "contain", opacity: 0.6 }} />
          </div>

          {/* Capital Allocation bar */}
          <div style={{ padding: "0 24px 18px" }}>
            <div style={{ fontSize: 8, letterSpacing: 2, color: JK.muted, textTransform: "uppercase", marginBottom: 7 }}>Capital Allocation</div>
            <div style={{ height: 7, background: "#0a0a0a", border: `1px solid rgba(40,40,40,0.8)`, borderRadius: 4, display: "flex", overflow: "hidden" }}>
              <div style={{ background: "#3b82f6", height: "100%", width: `${(reserves.usdc / totalAlloc * 100).toFixed(1)}%`, transition: "width 0.5s" }} />
              <div style={{ background: "#f7931a", height: "100%", width: `${(btcUsd / totalAlloc * 100).toFixed(1)}%`, transition: "width 0.5s" }} />
              <div style={{ background: "#9945ff", height: "100%", width: `${(solUsd / totalAlloc * 100).toFixed(1)}%`, transition: "width 0.5s" }} />
              <div style={{ background: "rgba(59,130,246,0.5)", height: "100%", width: `${((reserves.ops + reserves.lpU + lpSolUsd) / totalAlloc * 100).toFixed(1)}%`, transition: "width 0.5s" }} />
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 7 }}>
              {[
                { label: "USDC", color: "#3b82f6", pct: (reserves.usdc / totalAlloc * 100).toFixed(0) },
                { label: "BTC", color: "#f7931a", pct: (btcUsd / totalAlloc * 100).toFixed(0) },
                { label: "SOL", color: "#9945ff", pct: (solUsd / totalAlloc * 100).toFixed(0) },
                { label: "Ops+LP", color: "rgba(59,130,246,0.5)", pct: ((reserves.ops + reserves.lpU + lpSolUsd) / totalAlloc * 100).toFixed(0) },
              ].map(({ label, color, pct }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 8, color: JK.muted }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  {label} <b style={{ color: "#e5e7eb", marginLeft: 3 }}>{pct}%</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── KKM BLOCK ─────────────────────────────────────────── */}
      <SectionTitle>KKM — Tugan Partnership</SectionTitle>
      <Card style={{
        border: `1px solid rgba(153,69,255,0.25)`,
        background: "rgba(153,69,255,0.04)",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
        marginBottom: 20,
      }}>
        <img src={LOGO_ROUND} alt="KKM" style={{ width: 48, height: 48, objectFit: "contain", opacity: 0.8 }} />
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: "#9945ff", textTransform: "uppercase", marginBottom: 4 }}>⚡ KKM — Tugan Partnership</div>
          <div style={{ fontSize: 8, color: JK.muted }}>Joint operation · 75% Kabal / 25% Tugan · Not in net worth</div>
        </div>
        <div style={{ display: "flex", gap: 24, flex: 1, flexWrap: "wrap" }}>
          {[
            { val: fmtSol(kkmNet), sub: "Weekly Fees (Kabal 75%)", size: 22 },
            { val: fmt$(kkmUsd), sub: "USD equiv.", size: 14 },
            { val: fmt$(kkmMonthly), sub: "Est. Monthly (×4)", size: 22 },
          ].map(({ val, sub, size }) => (
            <div key={sub}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: size, fontWeight: 700, color: "#9945ff" }}>{val}</div>
              <div style={{ fontSize: 7, letterSpacing: 1, color: JK.muted, textTransform: "uppercase", marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── OPS RUNWAY ────────────────────────────────────────── */}
      <SectionTitle>OPS Runway</SectionTitle>
      <div style={{
        borderRadius: 16, border: `1px solid ${JK.border}`,
        background: JK.card, padding: "16px 22px",
        marginBottom: 20,
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        borderLeft: `3px solid ${runwayColor}`,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
          background: runwayColor,
          boxShadow: `0 0 8px ${runwayColor}`,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 2, color: runwayColor }}>
            OPS RUNWAY — {runwayOk ? "HEALTHY" : runwayWarn ? "WARNING" : "CRITICAL"}
          </div>
          <div style={{ fontSize: 8, color: JK.muted }}>
            {reserves.burn > 0 ? `Weekly burn: ${fmt$(reserves.burn)} · Real net: ${fmt$(realNet)}` : "Enter weekly burn in reserves to calculate"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 7, letterSpacing: 2, color: JK.muted, textTransform: "uppercase", marginBottom: 2 }}>Weeks of runway</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, fontWeight: 700, color: runwayColor }}>{runway}</div>
        </div>
      </div>

      {/* ── SPRINT PROGRESS ───────────────────────────────────── */}
      <SectionTitle>Sprint Progress</SectionTitle>
      <div style={{
        borderRadius: 16, border: `1px solid ${JK.border}`,
        background: JK.card, padding: "16px 22px",
        marginBottom: 20,
        borderLeft: `3px solid ${JK.gold}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: JK.muted, textTransform: "uppercase", width: 90, flexShrink: 0 }}>
            March Sprint
          </div>
          <div style={{ flex: 1, height: 7, background: "#0a0a0a", border: `1px solid rgba(40,40,40,0.8)`, borderRadius: 4, minWidth: 120, position: "relative", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: `linear-gradient(to right, ${JK.gold}, ${JK.gold2 || "#FFD037"})`,
              borderRadius: 4,
              width: `${Math.min(100, (monthTotal / 31000) * 100)}%`,
              transition: "width 0.6s ease",
            }} />
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {[
              { val: fmt$(monthTotal), lbl: "Month Total", color: JK.gold },
              { val: "$15.5k", lbl: "Min Target", color: JK.muted },
              { val: "$31k", lbl: "Max Target", color: JK.muted },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color }}>{val}</div>
                <div style={{ fontSize: 7, letterSpacing: 1, color: JK.muted, textTransform: "uppercase", marginTop: 2 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Sprint timeline bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 7, letterSpacing: 1, color: JK.muted, textTransform: "uppercase", width: 90, flexShrink: 0 }}>90-Day Sprint</div>
            <div style={{ flex: 1, height: 5, background: "#0a0a0a", border: `1px solid rgba(40,40,40,0.8)`, borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: `rgba(245,166,35,0.4)`, width: `${sprintPct}%`, borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 8, color: JK.muted, flexShrink: 0 }}>{sprintPct}% · Day {elapsed}/{sprintTotal}</div>
          </div>
        </div>
      </div>

      {/* ── KPI GRID ──────────────────────────────────────────── */}
      <SectionTitle>KPI Grid</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { tag: "Daily Fees (KKM)", val: fmt$(reserves.daily), color: JK.gold, sub: "Kabal 75% net · today", accent: JK.gold },
          { tag: "SOL Ammo", val: fmtSol(reserves.sol), color: "#9945ff", sub: "Trading bullets — off balance", accent: "#9945ff" },
          { tag: "USDC Reserve", val: fmt$(reserves.usdc), color: JK.green, sub: "Primary net KPI", accent: JK.green },
          { tag: "BTC Reserve", val: fmtBtc(reserves.btc), color: "#f7931a", sub: "Long-term accumulation", accent: "#f7931a" },
        ].map(({ tag, val, color, sub, accent }) => (
          <div key={tag} style={{
            borderRadius: 16, border: `1px solid ${JK.border}`,
            background: JK.card, padding: "16px 18px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
            <div style={{ fontSize: 8, letterSpacing: 1, color: JK.muted, textTransform: "uppercase", marginBottom: 10 }}>{tag}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 700, lineHeight: 1, color }}>{val}</div>
            <div style={{ fontSize: 8, color: JK.muted, marginTop: 5, lineHeight: 1.5 }}>{sub}</div>
          </div>
        ))}
      </div>

      <Divider />

      {/* ── FEE LOG TABLE ─────────────────────────────────────── */}
      <SectionTitle>Daily Fee Log</SectionTitle>
      <div style={{ borderRadius: 16, border: `1px solid ${JK.border}`, background: JK.card, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${JK.border}` }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, letterSpacing: 1, color: JK.gold }}>Fee Entries</span>
          <button style={btnOutline} onClick={() => setShowWrForm(v => !v)}>
            {showWrForm ? "✕ Cancel" : "+ Add Entry"}
          </button>
        </div>

        {showWrForm && (
          <div style={{
            background: "#0a0a0a", border: `1px solid ${JK.border2}`,
            borderRadius: 12, padding: 14, margin: 14,
            display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end",
          }}>
            {[
              { label: "Date", el: <input style={{ ...inputBase, width: 130 }} type="date" value={wrForm.date} onChange={e => setWrForm(p => ({ ...p, date: e.target.value }))} /> },
              { label: "Gross Fees (SOL)", el: <input style={{ ...inputBase, width: 120, color: "#9945ff" }} type="number" value={wrForm.gross} placeholder="0.0" onChange={e => setWrForm(p => ({ ...p, gross: e.target.value }))} /> },
              { label: "Kabal Net ($)", el: <input style={{ ...inputBase, width: 110, color: JK.gold }} type="number" value={wrFormNet} placeholder="auto" readOnly /> },
              { label: "Source", el: <input style={{ ...inputBase, width: 140 }} type="text" value={wrForm.source} placeholder="KKM" onChange={e => setWrForm(p => ({ ...p, source: e.target.value }))} /> },
              { label: "Note", el: <input style={{ ...inputBase, width: 140 }} type="text" value={wrForm.note} placeholder="Optional" onChange={e => setWrForm(p => ({ ...p, note: e.target.value }))} /> },
            ].map(({ label, el }) => (
              <div key={label} style={fieldWrap}>
                <span style={labelStyle}>{label}</span>
                {el}
              </div>
            ))}
            <button style={btnOutline} onClick={wrAdd}>✓ Add</button>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
            <thead>
              <tr>
                {["Date", "Gross (SOL)", "Tugan 25%", "Kabal 75%", "Kabal ($)", "Source", "Note", ""].map(h => (
                  <th key={h} style={tblTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wrEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ ...tblTd, color: JK.muted, fontSize: 8, textAlign: "center", padding: 24, letterSpacing: 1 }}>
                    — No entries yet. Start logging. —
                  </td>
                </tr>
              ) : wrEntries.map(e => (
                <tr key={e.id}>
                  <td style={{ ...tblTd, color: JK.muted }}>{e.date}</td>
                  <td style={{ ...tblTd, color: "#9945ff", fontWeight: 600 }}>{fmtSol(e.gross)}</td>
                  <td style={{ ...tblTd, color: JK.muted }}>{fmtSol(e.tugan)}</td>
                  <td style={{ ...tblTd, color: JK.gold, fontWeight: 600 }}>{fmtSol(e.kabalSol)}</td>
                  <td style={{ ...tblTd, color: JK.green, fontWeight: 600 }}>${e.kabalUsd}</td>
                  <td style={{ ...tblTd, color: JK.muted }}>{e.source}</td>
                  <td style={{ ...tblTd, color: JK.muted }}>{e.note || "—"}</td>
                  <td style={tblTd}>
                    <button
                      onClick={() => setWrEntries(p => p.filter(x => x.id !== e.id))}
                      style={{ background: "none", border: "none", color: "#2a2a2a", cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}
                      onMouseEnter={ev => { ev.currentTarget.style.color = JK.red; ev.currentTarget.style.background = `${JK.red}18`; }}
                      onMouseLeave={ev => { ev.currentTarget.style.color = "#2a2a2a"; ev.currentTarget.style.background = "none"; }}
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Divider />

      {/* ── AGENTS SECTION — WAR ROOM RESERVES & KKM ─────────── */}
      <SectionTitle>Reserves &amp; KKM Config</SectionTitle>

      <Accordion id="wr-reserves" icon="🏦" title="Stable Reserves (USDC + BTC)" badge="Real Net Worth">
        <div style={inputGrid}>
          {[
            { k: "usdc", l: "💵 USDC Reserve", color: JK.gold },
            { k: "btc", l: "₿ BTC Reserve", color: "#f7931a", step: "0.0001" },
            { k: "btcP", l: "BTC Price ($)", note: "live" },
            { k: "eth", l: "ETH Reserve", step: "0.001" },
            { k: "ethP", l: "ETH Price ($)", note: "live" },
            { k: "sol", l: "◎ SOL Ammo", color: "#9945ff", step: "0.1" },
            { k: "solP", l: "SOL Price ($)", note: "live" },
            { k: "others", l: "Autres Cryptos ($)" },
            { k: "ops", l: "💼 Ops Wallet (USDC)", color: "#3b82f6" },
            { k: "lpU", l: "🌊 LP Reserve (USDC)", color: "#3b82f6" },
            { k: "lpS", l: "🌊 LP Reserve (SOL)", color: "#9945ff", step: "0.1" },
            { k: "burn", l: "Weekly Team Burn ($)", color: JK.red },
          ].map(({ k, l, color, step, note }) => (
            <div key={k} style={fieldWrap}>
              <span style={labelStyle}>
                {l}
                {note && <span style={{ fontSize: 7, color: JK.green, marginLeft: 4 }}>● {note}</span>}
              </span>
              <input
                style={{ ...inputBase, color: color || "#e5e7eb" }}
                type="number"
                value={reserves[k] || ""}
                step={step}
                onChange={e => setR(k, e.target.value)}
                placeholder={k === "btcP" ? "85000" : k === "solP" || k === "kkmP" ? "140" : k === "ethP" ? "3000" : "0"}
              />
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion id="wr-kkm" icon="⚡" title="KKM Weekly Fees — SOL Entry" badge="75% Kabal · 25% Tugan">
        <div style={{ fontSize: 9, color: JK.muted, marginBottom: 12 }}>
          Enter GROSS SOL fees generated by KKM this week. The Tugan 25% split is auto-calculated.
        </div>
        <div style={inputGrid}>
          <div style={fieldWrap}>
            <span style={labelStyle}>Gross Fees (SOL)</span>
            <input style={{ ...inputBase, color: "#9945ff" }} type="number" value={reserves.kkmG || ""} step="0.01" onChange={e => setR("kkmG", e.target.value)} placeholder="0" />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>SOL Price at recording</span>
            <input style={inputBase} type="number" value={reserves.kkmP || ""} onChange={e => setR("kkmP", e.target.value)} placeholder="140" />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>Daily Fees (Kabal $, manual)</span>
            <input style={{ ...inputBase, color: JK.gold }} type="number" value={reserves.daily || ""} onChange={e => setR("daily", e.target.value)} placeholder="0" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 14 }}>
          {[
            { tag: "Gross Fees", val: fmtSol(reserves.kkmG), color: "#9945ff" },
            { tag: "Tugan 25%", val: fmtSol(reserves.kkmG * 0.25), color: JK.muted },
            { tag: "Kabal Net 75%", val: fmtSol(kkmNet), color: JK.gold },
            { tag: "USD Equiv.", val: fmt$(kkmUsd), color: JK.green },
          ].map(({ tag, val, color }) => (
            <Card key={tag} style={{ padding: "14px 16px", marginBottom: 0 }}>
              <div style={{ fontSize: 7, letterSpacing: 2, color: JK.muted, textTransform: "uppercase", marginBottom: 8 }}>{tag}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, color }}>{val}</div>
            </Card>
          ))}
        </div>
      </Accordion>

      <Divider />

      {/* ── TREASURY — LOG A WEEK ─────────────────────────────── */}
      <SectionTitle>Treasury</SectionTitle>

      <Accordion id="tr-log" icon="➕" title="Log a Week">
        <div style={inputGrid}>
          <div style={fieldWrap}>
            <span style={labelStyle}>Week Label</span>
            <input style={inputBase} type="text" value={trForm.week} placeholder="W01 March" onChange={e => setTrForm(p => ({ ...p, week: e.target.value }))} />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>KKM Gross Fees (SOL)</span>
            <input style={{ ...inputBase, color: "#9945ff" }} type="number" value={trForm.gross} placeholder="0.0" step="0.01" onChange={e => setTrForm(p => ({ ...p, gross: e.target.value }))} />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>KKM Kabal Net SOL (75%)</span>
            <input style={{ ...inputBase, color: JK.gold }} type="number" value={trFormNet} placeholder="auto" readOnly />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>Team Burn ($)</span>
            <input style={{ ...inputBase, color: JK.red }} type="number" value={trForm.burn} placeholder="0" onChange={e => setTrForm(p => ({ ...p, burn: e.target.value }))} />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>USDC Reserve ($)</span>
            <input style={{ ...inputBase, color: "#3b82f6" }} type="number" value={trForm.usdc} placeholder="0" onChange={e => setTrForm(p => ({ ...p, usdc: e.target.value }))} />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>BTC Reserve (₿)</span>
            <input style={{ ...inputBase, color: "#f7931a" }} type="number" value={trForm.btc} placeholder="0.0" step="0.0001" onChange={e => setTrForm(p => ({ ...p, btc: e.target.value }))} />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>SOL Price at recording</span>
            <input style={inputBase} type="number" value={trForm.solP} placeholder="140" onChange={e => setTrForm(p => ({ ...p, solP: e.target.value }))} />
          </div>
          <div style={fieldWrap}>
            <span style={labelStyle}>Note</span>
            <input style={inputBase} type="text" value={trForm.note} placeholder="3 new Angels..." onChange={e => setTrForm(p => ({ ...p, note: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
          <button style={btnOutline} onClick={trAdd}>✓ Add Week</button>
          <button style={{ ...btnOutline, borderColor: JK.border2, color: JK.muted }} onClick={trClear}>Clear</button>
          <span style={{ fontSize: 8, color: JK.muted }}>Net Kabal = Gross × 0.75 × SOL price (auto)</span>
        </div>
      </Accordion>

      <Accordion id="tr-summary" icon="📊" title="Summary">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { tag: "Cumul. KKM Revenue (Kabal)", val: fmt$(trTotalRev), color: JK.gold, sub: `${trEntries.length} weeks logged`, accent: JK.gold },
            { tag: "Current USDC Reserve", val: lastEntry ? fmt$(parseFloat(lastEntry.usdc) || 0) : "$0", color: "#3b82f6", sub: lastEntry ? `as of ${lastEntry.week}` : "—", accent: "#3b82f6" },
            { tag: "Current BTC Reserve", val: lastEntry ? fmtBtc(parseFloat(lastEntry.btc) || 0) : "₿0.0000", color: "#f7931a", sub: lastEntry ? `as of ${lastEntry.week}` : "—", accent: "#f7931a" },
            { tag: "Net (Rev − Burn)", val: fmt$(trTotalNet), color: trTotalNet >= 0 ? JK.green : JK.red, sub: "cumulative", accent: trTotalNet >= 0 ? JK.green : JK.red },
          ].map(({ tag, val, color, sub, accent }) => (
            <div key={tag} style={{
              borderRadius: 12, border: `1px solid ${JK.border}`,
              background: JK.card, padding: "14px 16px", position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
              <div style={{ fontSize: 7, letterSpacing: 1, color: JK.muted, textTransform: "uppercase", marginBottom: 6 }}>{tag}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 700, lineHeight: 1, color }}>{val}</div>
              <div style={{ fontSize: 8, color: JK.muted, marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ borderRadius: 16, border: `1px solid ${JK.border}`, background: JK.bg, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 110, padding: "0 2px" }}>
            {trEntries.length === 0 ? (
              <div style={{ color: JK.muted, fontSize: 8, letterSpacing: 1, margin: "auto" }}>No data yet</div>
            ) : trEntries.map(e => {
              const usdcH = Math.round(((parseFloat(e.usdc) || 0) / chartMax) * 100);
              const btcH = Math.round(((parseFloat(e.btc) || 0) * 85000 / chartMax) * 100);
              return (
                <div key={e.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1, minWidth: 24 }}>
                  <div style={{ display: "flex", gap: 2, alignItems: "flex-end", width: "100%" }}>
                    <div style={{ flex: 1, borderRadius: "2px 2px 0 0", background: "linear-gradient(to top, #3b82f6, #60a5fa)", height: usdcH, transition: "height 0.5s" }} />
                    <div style={{ flex: 1, borderRadius: "2px 2px 0 0", background: "linear-gradient(to top, #f7931a, #fbbf24)", height: btcH, transition: "height 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 5, letterSpacing: 0.5, color: JK.muted, textAlign: "center" }}>{e.week}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 8, color: JK.muted }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#3b82f6" }} />USDC Reserve
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 8, color: JK.muted }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f7931a" }} />BTC (×price)
            </div>
          </div>
        </div>
      </Accordion>

      <Accordion id="tr-history" icon="🗓" title="Weekly History">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9, minWidth: 680 }}>
            <thead>
              <tr>
                {["Week", "Gross (SOL)", "Kabal Net (SOL)", "Kabal ($)", "Burn", "Net P&L", "USDC", "BTC", "Trend", "Note", ""].map(h => (
                  <th key={h} style={tblTh}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trEntries.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ ...tblTd, color: JK.muted, fontSize: 8, textAlign: "center", padding: 24, letterSpacing: 1 }}>
                    — No weeks logged —
                  </td>
                </tr>
              ) : trEntries.map(e => (
                <tr key={e.id}>
                  <td style={{ ...tblTd, color: JK.muted }}>{e.week}</td>
                  <td style={{ ...tblTd, color: "#9945ff", fontWeight: 600 }}>{fmtSol(e.gross)}</td>
                  <td style={{ ...tblTd, color: JK.gold, fontWeight: 600 }}>{fmtSol(e.kabalSol)}</td>
                  <td style={{ ...tblTd, color: JK.green, fontWeight: 600 }}>${e.kabalUsd}</td>
                  <td style={{ ...tblTd, color: JK.red, fontWeight: 600 }}>{e.burn ? fmt$(parseFloat(e.burn)) : "—"}</td>
                  <td style={{ ...tblTd, color: parseFloat(e.netPnl) >= 0 ? JK.green : JK.red, fontWeight: 600 }}>
                    {parseFloat(e.netPnl) >= 0 ? "+" : ""}{fmt$(parseFloat(e.netPnl))}
                  </td>
                  <td style={{ ...tblTd, color: JK.muted }}>{e.usdc ? fmt$(parseFloat(e.usdc)) : "—"}</td>
                  <td style={{ ...tblTd, color: "#f7931a", fontWeight: 600 }}>{e.btc ? fmtBtc(parseFloat(e.btc)) : "—"}</td>
                  <td style={tblTd}>
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      fontSize: 7, letterSpacing: 0.5, padding: "2px 8px",
                      border: `1px solid ${e.trend === "up" ? JK.green : e.trend === "down" ? JK.red : JK.border2}`,
                      color: e.trend === "up" ? JK.green : e.trend === "down" ? JK.red : JK.muted,
                      borderRadius: 9999, textTransform: "uppercase",
                    }}>
                      {e.trend === "up" ? "▲" : e.trend === "down" ? "▼" : "—"}
                    </span>
                  </td>
                  <td style={{ ...tblTd, color: JK.muted }}>{e.note || "—"}</td>
                  <td style={tblTd}>
                    <button
                      onClick={() => setTrEntries(p => p.filter(x => x.id !== e.id))}
                      style={{ background: "none", border: "none", color: "#2a2a2a", cursor: "pointer", fontSize: 12, padding: "2px 8px", borderRadius: 4 }}
                      onMouseEnter={ev => { ev.currentTarget.style.color = JK.red; ev.currentTarget.style.background = `${JK.red}18`; }}
                      onMouseLeave={ev => { ev.currentTarget.style.color = "#2a2a2a"; ev.currentTarget.style.background = "none"; }}
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Accordion>

      <Accordion id="tr-targets" icon="🎯" title="90-Day Targets">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { color: JK.gold, ico: "🔥", label: "March", lines: [["USDC net", "+$5k"], ["Weekly KKM", "$500–$1k"], ["BTC", "Start accumulating"]] },
            { color: "#3b82f6", ico: "⚡", label: "April", lines: [["USDC net", "+$25k"], ["Weekly KKM", "$5k+"], ["BTC", "+0.1 BTC"]] },
            { color: "#f7931a", ico: "🚀", label: "May", lines: [["USDC net", "+$100k"], ["Weekly KKM", "$20k+"], ["BTC", "+0.5 BTC"]] },
          ].map(({ color, ico, label, lines }) => (
            <Card key={label} style={{ position: "relative", overflow: "hidden", marginBottom: 0 }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color }} />
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 600, marginBottom: 10, color }}>{ico} {label}</div>
              {lines.map(([l, v]) => (
                <div key={l} style={{ fontSize: 8, color: JK.muted, lineHeight: 2 }}>{l}: <b style={{ color: "#e5e7eb" }}>{v}</b></div>
              ))}
            </Card>
          ))}
        </div>
      </Accordion>

    </Shell>
  );
}
