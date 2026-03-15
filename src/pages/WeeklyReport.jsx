// ============================================================
// JUNGLE KABAL — WEEKLY / DAILY REPORT
// Aggregates: Signals (win/loss), CRM deals, Sprint goals, WarRoom
// ============================================================
import { useState, useEffect } from "react";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const API = (import.meta.env.VITE_API_BASE || "");

function safe(arr) { return Array.isArray(arr) ? arr : []; }

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function fmtMoney(n) {
  if (!n && n !== 0) return "—";
  return "$" + Number(n).toLocaleString();
}

// ─── Stat Tile ───────────────────────────────────────────────
function Tile({ label, value, sub, color = JK.gold }) {
  return (
    <div style={{
      background: "rgba(245,166,35,0.06)",
      border: `1px solid ${JK.border2}`,
      borderRadius: 14, padding: "18px 16px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: "'Cinzel Decorative', serif", lineHeight: 1, marginBottom: 4 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: "#555", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// ─── Section Row ─────────────────────────────────────────────
function Row({ left, right, color = "#fff" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <span style={{ fontSize: 13, color: JK.muted }}>{left}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color }}>{right}</span>
    </div>
  );
}

const PERIODS = [
  { label: "TODAY", days: 0 },
  { label: "7 DAYS", days: 7 },
  { label: "30 DAYS", days: 30 },
];

export default function WeeklyReport() {
  const [period, setPeriod] = useState(7);
  const [signals, setSignals] = useState([]);
  const [crm, setCrm] = useState([]);
  const [sprint, setSprint] = useState([]);
  const [warroom, setWarroom] = useState([]);
  const [coinFactory, setCoinFactory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [s, c, sp, w, cf] = await Promise.allSettled([
          fetch(API + "/api/signals").then(r => r.json()),
          fetch(API + "/api/crm").then(r => r.json()),
          fetch(API + "/api/sprint").then(r => r.json()),
          fetch(API + "/api/war-room").then(r => r.json()),
          fetch(API + "/api/coin-factory").then(r => r.json()),
        ]);
        if (s.status === "fulfilled") setSignals(safe(s.value.signals));
        if (c.status === "fulfilled") setCrm(safe(c.value.deals));
        if (sp.status === "fulfilled") setSprint(safe(sp.value.goals));
        if (w.status === "fulfilled") setWarroom(safe(w.value.entries || w.value.rows));
        if (cf.status === "fulfilled") setCoinFactory(safe(cf.value.coins));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  // Filter by period
  const cutoff = period === 0 ? daysAgo(0) : daysAgo(period);
  const inPeriod = (iso) => {
    if (!iso) return false;
    return new Date(iso) >= cutoff;
  };

  // Signals stats
  const periodSignals = signals.filter(s => inPeriod(s.createdAt));
  const wins = periodSignals.filter(s => s.status === "WIN").length;
  const losses = periodSignals.filter(s => s.status === "LOSS").length;
  const open = periodSignals.filter(s => s.status === "OPEN").length;
  const winRate = (wins + losses) > 0 ? Math.round((wins / (wins + losses)) * 100) : null;

  // CRM stats
  const periodCrm = crm.filter(d => inPeriod(d.createdAt || d.date));
  const closedDeals = periodCrm.filter(d => d.status === "CLOSED" || d.stage === "CLOSED");
  const crmRevenue = closedDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  // Sprint
  const doneGoals = sprint.filter(g => g.status === "DONE" || g.done);
  const periodDone = doneGoals.filter(g => inPeriod(g.updatedAt || g.createdAt));

  // Coin Factory
  const liveCf = coinFactory.filter(c => ["LIVE","MOON","DEPLOY"].includes(c.stage));
  const exitedCf = coinFactory.filter(c => c.stage === "EXITED");
  const deadCf = coinFactory.filter(c => c.stage === "DEAD");

  // WarRoom — revenue entries
  const periodWar = warroom.filter(e => inPeriod(e.date || e.createdAt));
  const warRevenue = periodWar.reduce((s, e) => s + (Number(e.amount) || Number(e.value) || 0), 0);

  const periodLabel = period === 0 ? "Today" : period === 7 ? "This Week" : "This Month";

  return (
    <Shell
      title={<>KABAL <span style={{ color: JK.gold }}>REPORT</span></>}
      subtitle="Daily & weekly performance overview — all data in one view"
      maxWidth={900}
    >
      {/* Period tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28, justifyContent: "center" }}>
        {PERIODS.map(({ label, days }) => {
          const active = period === days;
          return (
            <button key={days} onClick={() => setPeriod(days)} style={{
              background: active ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? JK.border2 : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8, color: active ? JK.gold : JK.muted,
              fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
              letterSpacing: 2, padding: "8px 20px", cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: JK.muted, padding: 60 }}>Loading data...</div>
      ) : (
        <>
          {/* ── Summary tiles ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
            <Tile label="Signals" value={periodSignals.length} sub={`${open} open`} />
            <Tile
              label="Win Rate"
              value={winRate !== null ? `${winRate}%` : "—"}
              sub={`${wins}W / ${losses}L`}
              color={winRate >= 60 ? JK.green : winRate >= 40 ? JK.gold : JK.red}
            />
            <Tile label="CRM Deals" value={closedDeals.length} sub={crmRevenue ? fmtMoney(crmRevenue) : "no revenue"} color={JK.green} />
            <Tile label="Tasks Done" value={periodDone.length} sub={`of ${sprint.length} total`} color="#A855F7" />
            <Tile label="Active Coins" value={liveCf.length} sub={`${exitedCf.length} exited · ${deadCf.length} dead`} color="#FFD700" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* ── Signals ── */}
            <Card>
              <SectionTitle>📡 <span style={{ color: JK.gold }}>Signals</span></SectionTitle>
              <Row left="Total this period" right={periodSignals.length} />
              <Row left="Open" right={open} color={JK.gold} />
              <Row left="Wins" right={wins} color={JK.green} />
              <Row left="Losses" right={losses} color={JK.red} />
              <Row left="Win Rate" right={winRate !== null ? `${winRate}%` : "—"} color={winRate >= 60 ? JK.green : JK.gold} />
              {periodSignals.length === 0 && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 12, padding: "16px 0" }}>No signals {periodLabel.toLowerCase()}</div>
              )}
              {periodSignals.slice(0, 5).map(s => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.type === "LONG" ? JK.green : s.type === "SHORT" ? JK.red : JK.gold }}>
                    {s.ticker} <span style={{ fontWeight: 400, fontSize: 10, color: JK.muted }}>{s.type}</span>
                  </span>
                  <span style={{ fontSize: 11, color: s.status === "WIN" ? JK.green : s.status === "LOSS" ? JK.red : s.status === "OPEN" ? JK.gold : "#555" }}>
                    {s.status}
                  </span>
                </div>
              ))}
            </Card>

            {/* ── CRM ── */}
            <Card>
              <SectionTitle>👼 <span style={{ color: JK.gold }}>Angels CRM</span></SectionTitle>
              <Row left="New deals" right={periodCrm.length} />
              <Row left="Closed" right={closedDeals.length} color={JK.green} />
              <Row left="Revenue" right={crmRevenue ? fmtMoney(crmRevenue) : "—"} color={JK.green} />
              {closedDeals.length === 0 && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 12, padding: "16px 0" }}>No closed deals {periodLabel.toLowerCase()}</div>
              )}
              {closedDeals.slice(0, 5).map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <span style={{ fontSize: 12 }}>{d.name || d.company || "Deal"}</span>
                  <span style={{ fontSize: 12, color: JK.green }}>{d.value ? fmtMoney(d.value) : "✓"}</span>
                </div>
              ))}
            </Card>

            {/* ── Sprint / Tasks ── */}
            <Card>
              <SectionTitle>🎯 <span style={{ color: JK.gold }}>Sprint Tasks</span></SectionTitle>
              <Row left="Total goals" right={sprint.length} />
              <Row left="Done" right={doneGoals.length} color={JK.green} />
              <Row left="Completion" right={sprint.length ? `${Math.round((doneGoals.length / sprint.length) * 100)}%` : "—"} color={JK.gold} />
              {periodDone.slice(0, 5).map(g => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <span style={{ color: JK.green, fontSize: 11 }}>✓</span>
                  <span style={{ fontSize: 12 }}>{g.title || g.text}</span>
                </div>
              ))}
              {periodDone.length === 0 && (
                <div style={{ textAlign: "center", color: "#444", fontSize: 12, padding: "16px 0" }}>No tasks completed {periodLabel.toLowerCase()}</div>
              )}
            </Card>

            {/* ── Coin Factory ── */}
            <Card>
              <SectionTitle>🪙 <span style={{ color: JK.gold }}>Coin Factory</span></SectionTitle>
              <Row left="Pipeline" right={coinFactory.filter(c => ["CONCEPT","RESEARCH","BRANDING"].includes(c.stage)).length} color={JK.muted} />
              <Row left="Deploying" right={coinFactory.filter(c => c.stage === "DEPLOY").length} color="#F59E0B" />
              <Row left="Live / Moon" right={liveCf.length} color={JK.green} />
              <Row left="Exited" right={exitedCf.length} color="#10B981" />
              <Row left="Dead" right={deadCf.length} color={JK.red} />
              {liveCf.slice(0, 4).map(c => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{c.ticker || c.name}</span>
                  <span style={{ fontSize: 10, color: c.stage === "MOON" ? "#FFD700" : JK.green }}>{c.stage}</span>
                </div>
              ))}
            </Card>
          </div>

          <Divider />

          {/* ── Share / Export ── */}
          <Card>
            <SectionTitle>📋 <span style={{ color: JK.gold }}>Report Summary</span></SectionTitle>
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${JK.border}`,
                borderRadius: 10,
                padding: "16px 20px",
                fontFamily: "monospace",
                fontSize: 12,
                lineHeight: 2,
                color: "#ccc",
                whiteSpace: "pre",
                overflowX: "auto",
              }}
            >{`🌿 JUNGLE KABAL — ${periodLabel.toUpperCase()} REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Signals    ${periodSignals.length} total · ${wins}W / ${losses}L${winRate !== null ? ` · ${winRate}% WR` : ""}
👼 Angels     ${closedDeals.length} closed${crmRevenue ? ` · ${fmtMoney(crmRevenue)}` : ""}
🎯 Tasks      ${periodDone.length} done / ${sprint.length} total
🪙 Factory    ${liveCf.length} live · ${exitedCf.length} exited · ${deadCf.length} dead
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 junglekabal.meme`}
            </div>
            <button
              onClick={() => {
                const text = `🌿 JUNGLE KABAL — ${periodLabel.toUpperCase()} REPORT\n📡 Signals: ${periodSignals.length} total · ${wins}W/${losses}L${winRate !== null ? ` · ${winRate}% WR` : ""}\n👼 Angels: ${closedDeals.length} closed${crmRevenue ? ` · ${fmtMoney(crmRevenue)}` : ""}\n🎯 Tasks: ${periodDone.length}/${sprint.length} done\n🪙 Factory: ${liveCf.length} live · ${exitedCf.length} exited`;
                navigator.clipboard?.writeText(text);
              }}
              style={{
                marginTop: 12,
                background: "rgba(245,166,35,0.12)",
                border: `1px solid ${JK.border2}`,
                borderRadius: 8, color: JK.gold,
                fontFamily: "'Cinzel', serif", fontSize: 10,
                fontWeight: 700, letterSpacing: 1.5,
                padding: "8px 20px", cursor: "pointer",
              }}
            >
              📋 COPY FOR TELEGRAM
            </button>
          </Card>
        </>
      )}
    </Shell>
  );
}
