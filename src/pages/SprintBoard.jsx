// ============================================================
// JUNGLE KABAL — SPRINT BOARD
// 90-day goals · March–May 2026
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const G = "#F5A623";

const SPRINT_START = new Date("2026-03-01");
const SPRINT_END   = new Date("2026-05-30");

const INITIAL_GOALS = [
  {
    id: 1, category: "FINANCE", title: "Hit $31K combined P&L",
    description: "KKM + Kabal + LP combined target for the sprint",
    target: 31000, current: 4200, unit: "$", priority: "HIGH", status: "active",
  },
  {
    id: 2, category: "TRADING", title: "Maintain 60%+ win rate",
    description: "Across all KKM and Kabal trades",
    target: 60, current: 58, unit: "%", priority: "HIGH", status: "active",
  },
  {
    id: 3, category: "OPS", title: "Ship 6 working tools",
    description: "Watchlist, PNL Calendar, Risk Manager, Sprint Board, Arsenal, CRM",
    target: 6, current: 4, unit: "tools", priority: "MED", status: "active",
  },
  {
    id: 4, category: "GROWTH", title: "Grow squad to 8 members",
    description: "3 additional members with proven track records",
    target: 8, current: 5, unit: "members", priority: "MED", status: "active",
  },
  {
    id: 5, category: "FINANCE", title: "Build 8 weeks ops runway",
    description: "Ensure operations covered for 2 months ahead",
    target: 8, current: 5, unit: "weeks", priority: "HIGH", status: "active",
  },
  {
    id: 6, category: "DEALS", title: "Close 3 Angel deals",
    description: "KKM angel round — min $50K each",
    target: 3, current: 0, unit: "deals", priority: "HIGH", status: "active",
  },
];

const CAT_COLORS = {
  FINANCE: JK.green,
  TRADING: "#F5A623",
  OPS:     "#3B82F6",
  GROWTH:  "#A855F7",
  DEALS:   "#EC4899",
};

const PRIORITY_COLORS = { HIGH: JK.red, MED: G, LOW: "#555" };

function GoalCard({ goal, onUpdate }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const catColor = CAT_COLORS[goal.category] || G;
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(goal.current);

  function save() {
    onUpdate(goal.id, parseFloat(val) || 0);
    setEditing(false);
  }

  return (
    <div style={{
      background: "rgba(18,18,18,0.9)", border: `1px solid ${pct >= 100 ? JK.green + "44" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 14, padding: "16px 18px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${catColor}44,transparent)` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 8, color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}33`, borderRadius: 4, padding: "2px 7px", fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>{goal.category}</span>
          <span style={{ fontSize: 8, color: PRIORITY_COLORS[goal.priority], fontWeight: 700, letterSpacing: 1 }}>{goal.priority}</span>
        </div>
        {pct >= 100 && <span style={{ fontSize: 10, color: JK.green, fontWeight: 700 }}>✓ DONE</span>}
      </div>

      <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, color: "#e8d5a0", marginBottom: 6, letterSpacing: 0.5 }}>{goal.title}</div>
      <div style={{ fontSize: 11, color: JK.muted, marginBottom: 12, lineHeight: 1.5 }}>{goal.description}</div>

      {/* Progress bar */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4, height: 4, marginBottom: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? JK.green : pct >= 60 ? G : JK.red, borderRadius: 4, transition: "width 0.4s" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 10, color: "#555" }}>
          {editing ? (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input type="number" value={val} onChange={e => setVal(e.target.value)}
                style={{ width: 80, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 8px", color: "#fff", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
              <span style={{ color: "#555" }}>/ {goal.target} {goal.unit}</span>
              <button onClick={save} style={{ background: "transparent", border: "none", color: JK.green, cursor: "pointer", fontSize: 12 }}>✓</button>
            </div>
          ) : (
            <span onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
              <span style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 14, color: pct >= 100 ? JK.green : G }}>{goal.current}</span>
              <span style={{ color: "#444" }}> / {goal.target} {goal.unit}</span>
            </span>
          )}
        </div>
        <span style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 16, fontWeight: 900, color: pct >= 100 ? JK.green : pct >= 60 ? G : "#555" }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function SprintBoard() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [addMode, setAddMode] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", category: "FINANCE", priority: "MED", target: "", current: "0", unit: "" });

  const now = new Date();
  const elapsed = Math.max(0, Math.floor((now - SPRINT_START) / 86400000));
  const total   = Math.floor((SPRINT_END - SPRINT_START) / 86400000);
  const remaining = Math.max(0, total - elapsed);
  const sprintPct = Math.min(100, Math.round((elapsed / total) * 100));

  const completedGoals = goals.filter(g => (g.current / g.target) >= 1).length;

  function updateGoal(id, val) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, current: val } : g));
  }

  function addGoal() {
    if (!draft.title || !draft.target) return;
    setGoals(prev => [...prev, { ...draft, id: Date.now(), status: "active", current: parseFloat(draft.current) || 0, target: parseFloat(draft.target) }]);
    setDraft({ title: "", description: "", category: "FINANCE", priority: "MED", target: "", current: "0", unit: "" });
    setAddMode(false);
  }

  const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <Shell
      title={<>SPRINT <span style={{ color: JK.gold }}>BOARD</span></>}
      subtitle="90-Day Goals · March – May 2026 · Epoch 1"
      maxWidth={960}
    >
      <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: JK.muted, cursor: "pointer", fontSize: 12, letterSpacing: 1, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
        ← BACK TO HQ
      </button>

      {/* Sprint progress bar */}
      <Card style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, letterSpacing: 3, color: "#444", marginBottom: 4 }}>SPRINT EPOCH 1 — MARCH → MAY 2026</div>
            <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 18, fontWeight: 900, color: G }}>DAY {elapsed} <span style={{ color: "#333", fontSize: 12 }}>/ {total}</span></div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 4 }}>REMAINING</div>
            <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 18, fontWeight: 900, color: remaining < 15 ? JK.red : G }}>{remaining}d</div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, height: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${sprintPct}%`, background: `linear-gradient(90deg, ${G}, #22C55E)`, borderRadius: 6, transition: "width 0.5s" }} />
        </div>
      </Card>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { l: "TOTAL GOALS",   v: goals.length },
          { l: "COMPLETED",     v: completedGoals, color: JK.green },
          { l: "IN PROGRESS",   v: goals.length - completedGoals, color: G },
          { l: "COMPLETION",    v: `${goals.length ? Math.round((completedGoals / goals.length) * 100) : 0}%`, color: completedGoals === goals.length ? JK.green : G },
        ].map(({ l, v, color }) => (
          <Card key={l} style={{ padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Cinzel Decorative',serif", color: color || "#888" }}>{v}</div>
          </Card>
        ))}
      </div>

      {/* Add goal */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => setAddMode(!addMode)} style={{ background: `rgba(245,166,35,0.12)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit" }}>+ ADD GOAL</button>
      </div>

      {addMode && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 14 }}>
            {[
              { k: "title",       l: "GOAL TITLE",   ph: "Hit $10K P&L" },
              { k: "target",      l: "TARGET VALUE",  ph: "10000" },
              { k: "current",     l: "CURRENT VALUE", ph: "0" },
              { k: "unit",        l: "UNIT",          ph: "$, %, trades…" },
              { k: "description", l: "DESCRIPTION",   ph: "Short description" },
            ].map(({ k, l, ph }) => (
              <div key={k}>
                <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>{l}</div>
                <input value={draft[k]} onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inp} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>CATEGORY</div>
              <select value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} style={inp}>
                {Object.keys(CAT_COLORS).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>PRIORITY</div>
              <select value={draft.priority} onChange={e => setDraft(p => ({ ...p, priority: e.target.value }))} style={inp}>
                {["HIGH","MED","LOW"].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addGoal} style={{ background: `rgba(245,166,35,0.15)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "9px 20px", cursor: "pointer", fontFamily: "inherit" }}>ADD GOAL</button>
            <button onClick={() => setAddMode(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#555", fontSize: 11, letterSpacing: 1, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
          </div>
        </Card>
      )}

      {/* Goals grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
        {goals.map(g => <GoalCard key={g.id} goal={g} onUpdate={updateGoal} />)}
      </div>
    </Shell>
  );
}
