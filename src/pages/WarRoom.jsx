// ============================================================
// WAR ROOM — Treasury · Revenues · Ops Costs
// team.junglekabal.meme/war-room
// ============================================================
import { useState } from "react";
import Shell, { JK, Card, StatBox, SectionTitle, Badge, Divider } from "../components/JKShell";

// ─── DATA ────────────────────────────────────────────────────

const INITIAL_REVENUES = [
  { id: "r1", source: "KKM — Monthly subscriptions", amount: 0,    status: "live",   icon: "💎" },
  { id: "r2", source: "Trading — Realized PNL",       amount: 0,    status: "live",   icon: "📈" },
  { id: "r3", source: "Affiliate — Dexscreener ref",  amount: 0,    status: "live",   icon: "🔗" },
  { id: "r4", source: "Padre — Referral commissions",  amount: 0,    status: "live",   icon: "🤖" },
  { id: "r5", source: "Angel round — Seed funding",    amount: 0,    status: "soon",   icon: "🤝" },
  { id: "r6", source: "Content — Partnerships",        amount: 0,    status: "soon",   icon: "📣" },
];

const INITIAL_EXPENSES = [
  { id: "e1", category: "Hosting / Vercel",     monthly: 20,   icon: "☁️" },
  { id: "e2", category: "Tools & SaaS",          monthly: 0,    icon: "🔧" },
  { id: "e3", category: "Ads / Promotion",       monthly: 0,    icon: "📢" },
  { id: "e4", category: "Team payroll",          monthly: 0,    icon: "👥" },
  { id: "e5", category: "Misc ops",              monthly: 0,    icon: "📦" },
];

const INITIAL_TREASURY = [
  { id: "t1", wallet: "Main Treasury",     chain: "SOL",  amount: 0, icon: "🏦" },
  { id: "t2", wallet: "Ops wallet",        chain: "SOL",  amount: 0, icon: "⚙️" },
  { id: "t3", wallet: "Trading wallet",    chain: "SOL",  amount: 0, icon: "📈" },
  { id: "t4", wallet: "USDC reserve",      chain: "SOL",  amount: 0, icon: "🔵" },
];

// ─── ROW COMPONENTS ──────────────────────────────────────────

function EditableAmount({ value, onChange, prefix = "$" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (editing) return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); onChange(parseFloat(draft) || 0); }}
      onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
      style={{ background: "rgba(245,166,35,0.10)", border: `1px solid ${JK.border2}`, borderRadius: 6, color: JK.gold, fontFamily: "inherit", fontSize: 13, fontWeight: 700, width: 90, padding: "2px 6px", textAlign: "right" }}
    />
  );
  return (
    <span
      onClick={() => setEditing(true)}
      style={{ cursor: "pointer", color: value > 0 ? JK.green : JK.muted, fontWeight: 700, fontSize: 13 }}
      title="Click to edit"
    >
      {prefix}{value.toLocaleString()}
    </span>
  );
}

function RevenueRow({ item, onUpdate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(10,10,10,0.6)", border: `1px solid ${JK.border}`, borderRadius: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 16 }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#e8d5a0", fontWeight: 600 }}>{item.source}</div>
        <span style={{ fontSize: 9, color: item.status === "live" ? JK.green : JK.muted, fontWeight: 700, letterSpacing: 1 }}>{item.status.toUpperCase()}</span>
      </div>
      <EditableAmount value={item.amount} onChange={v => onUpdate(item.id, v)} />
    </div>
  );
}

function ExpenseRow({ item, onUpdate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(10,10,10,0.6)", border: `1px solid ${JK.border}`, borderRadius: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 16 }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#e8d5a0", fontWeight: 600 }}>{item.category}</div>
        <span style={{ fontSize: 9, color: JK.muted, letterSpacing: 1 }}>MONTHLY</span>
      </div>
      <EditableAmount value={item.monthly} onChange={v => onUpdate(item.id, v)} />
    </div>
  );
}

function TreasuryRow({ item, onUpdate }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(10,10,10,0.6)", border: `1px solid ${JK.border}`, borderRadius: 10, marginBottom: 6 }}>
      <span style={{ fontSize: 16 }}>{item.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#e8d5a0", fontWeight: 600 }}>{item.wallet}</div>
        <span style={{ fontSize: 9, color: JK.muted, letterSpacing: 1 }}>{item.chain}</span>
      </div>
      <EditableAmount value={item.amount} onChange={v => onUpdate(item.id, v)} prefix="$" />
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────

export default function WarRoom() {
  const [revenues, setRevenues]   = useState(INITIAL_REVENUES);
  const [expenses, setExpenses]   = useState(INITIAL_EXPENSES);
  const [treasury, setTreasury]   = useState(INITIAL_TREASURY);

  const totalRevenue  = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.monthly, 0);
  const totalTreasury = treasury.reduce((s, t) => s + t.amount, 0);
  const netMonthly    = totalRevenue - totalExpenses;

  const updateRevenue  = (id, v) => setRevenues(rs => rs.map(r => r.id === id ? { ...r, amount: v }   : r));
  const updateExpense  = (id, v) => setExpenses(es => es.map(e => e.id === id ? { ...e, monthly: v }  : e));
  const updateTreasury = (id, v) => setTreasury(ts => ts.map(t => t.id === id ? { ...t, amount: v }   : t));

  return (
    <Shell
      title={<>WAR <span style={{ color: JK.gold }}>ROOM</span></>}
      subtitle="Treasury · Revenues · Operational costs"
      maxWidth={860}
    >
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
        <StatBox value={`$${totalTreasury.toLocaleString()}`} label="Total treasury" color="gold" />
        <StatBox value={`$${totalRevenue.toLocaleString()}`}  label="Total revenue"  color="green" />
        <StatBox value={`$${totalExpenses.toLocaleString()}`} label="Monthly costs"  color="red" />
        <StatBox
          value={`${netMonthly >= 0 ? "+" : ""}$${netMonthly.toLocaleString()}`}
          label="Net monthly"
          color={netMonthly >= 0 ? "green" : "red"}
        />
      </div>

      {/* Treasury */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle style={{ marginBottom: 16 }}>
          🏦 Treasury <span style={{ color: JK.muted, fontSize: 11, fontFamily: "monospace" }}>— click amounts to edit</span>
        </SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {treasury.map(t => <TreasuryRow key={t.id} item={t} onUpdate={updateTreasury} />)}
        </div>
        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: JK.muted }}>Total treasury</span>
          <span style={{ fontWeight: 700, color: JK.gold, fontSize: 14 }}>${totalTreasury.toLocaleString()}</span>
        </div>
      </Card>

      {/* Revenues */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle style={{ marginBottom: 16 }}>💰 Revenue Streams</SectionTitle>
        {revenues.map(r => <RevenueRow key={r.id} item={r} onUpdate={updateRevenue} />)}
        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: JK.muted }}>Total revenue</span>
          <span style={{ fontWeight: 700, color: JK.green, fontSize: 14 }}>${totalRevenue.toLocaleString()}</span>
        </div>
      </Card>

      {/* Ops Costs */}
      <Card>
        <SectionTitle style={{ marginBottom: 16 }}>⚙️ Operational Costs</SectionTitle>
        {expenses.map(e => <ExpenseRow key={e.id} item={e} onUpdate={updateExpense} />)}
        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: JK.muted }}>Monthly burn</span>
          <span style={{ fontWeight: 700, color: JK.red, fontSize: 14 }}>${totalExpenses.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: JK.muted }}>Net monthly (rev - costs)</span>
          <span style={{ fontWeight: 700, color: netMonthly >= 0 ? JK.green : JK.red, fontSize: 14 }}>
            {netMonthly >= 0 ? "+" : ""}${netMonthly.toLocaleString()}
          </span>
        </div>
        {totalTreasury > 0 && totalExpenses > 0 && (
          <>
            <Divider />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: JK.muted }}>Runway</span>
              <span style={{ fontWeight: 700, color: JK.gold, fontSize: 14 }}>
                {Math.floor(totalTreasury / totalExpenses)} months
              </span>
            </div>
          </>
        )}
      </Card>
    </Shell>
  );
}
