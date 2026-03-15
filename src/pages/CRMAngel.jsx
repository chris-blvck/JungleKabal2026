// ============================================================
// JUNGLE KABAL — CRM ANGEL
// Deal pipeline & investor tracker · Persistent via API
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const G = "#F5A623";
const API_BASE = import.meta.env.VITE_API_BASE || "";

const STAGES = [
  { id: "new",         label: "NEW",         color: "#3B82F6" },
  { id: "interested",  label: "INTERESTED",  color: G },
  { id: "negotiating", label: "NEGOTIATING", color: "#A855F7" },
  { id: "committed",   label: "COMMITTED",   color: "#22C55E" },
  { id: "closed",      label: "CLOSED ✓",    color: JK.green },
  { id: "dead",        label: "DEAD",        color: "#555" },
];

const INITIAL_DEALS = [
  { id: 1, name: "Alex M.",  stage: "interested",  amount: 50000,  type: "Angel", notes: "Met at Token2049",     socials: "@alexm",     date: "2026-02-15", followUp: "2026-03-20" },
  { id: 2, name: "TechVC",   stage: "new",         amount: 150000, type: "VC",    notes: "Warm intro via Marco", socials: "",           date: "2026-03-01", followUp: "2026-03-15" },
  { id: 3, name: "Raj S.",   stage: "negotiating", amount: 75000,  type: "Angel", notes: "Wants 5% equity",      socials: "@rajsolana", date: "2026-01-20", followUp: "2026-03-10" },
];

const TYPE_COLORS = { Angel: G, VC: "#A855F7", KOL: "#EC4899", LP: "#22C55E" };
const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 13px", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };
const lbl = { fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 6, fontFamily: "'Cinzel',serif", display: "block" };

export default function CRMAngel() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState(INITIAL_DEALS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [nextId, setNextId] = useState(100);
  const [addMode, setAddMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("all");
  const today = new Date().toISOString().slice(0, 10);
  const [draft, setDraft] = useState({ name: "", stage: "new", amount: "", type: "Angel", notes: "", socials: "", date: today, followUp: "" });
  const saveTimer = useRef(null);

  // Load from API on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/crm/deals`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.deals) && data.deals.length) {
          setDeals(data.deals);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Auto-save 1.5s after any change
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistDeals(deals), 1500);
    return () => clearTimeout(saveTimer.current);
  }, [deals, loaded]);

  async function persistDeals(nextDeals) {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/crm/deals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deals: nextDeals }),
      });
      const data = await r.json();
      setSaveStatus(data.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 2500);
    }
  }

  const filtered = filter === "all" ? deals : deals.filter(d => d.stage === filter);
  const activeDeals = deals.filter(d => !["closed", "dead"].includes(d.stage));
  const pipeline = activeDeals.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const closed = deals.filter(d => d.stage === "closed").reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const followUpToday = deals.filter(d => d.followUp === today).length;

  function saveDeal() {
    if (!draft.name.trim()) return;
    if (editId !== null) {
      setDeals(prev => prev.map(d => d.id === editId ? { ...draft, id: editId, amount: parseFloat(draft.amount) || 0 } : d));
      setEditId(null);
    } else {
      const newId = nextId;
      setDeals(prev => [...prev, { ...draft, id: newId, amount: parseFloat(draft.amount) || 0 }]);
      setNextId(n => n + 1);
    }
    setDraft({ name: "", stage: "new", amount: "", type: "Angel", notes: "", socials: "", date: today, followUp: "" });
    setAddMode(false);
  }

  function editDeal(deal) {
    setDraft({ ...deal, amount: String(deal.amount) });
    setEditId(deal.id);
    setAddMode(true);
  }

  function moveStage(id, stageId) {
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage: stageId } : d));
  }

  function deleteDeal(id) {
    setDeals(prev => prev.filter(d => d.id !== id));
  }

  return (
    <Shell title={<>CRM <span style={{ color: JK.gold }}>ANGEL</span></>} subtitle="Deal pipeline · Investor tracking · Angel round · Partagé avec toute l'équipe" maxWidth={1000}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: JK.muted, cursor: "pointer", fontSize: 12, letterSpacing: 1, padding: 0, fontFamily: "inherit" }}>← BACK TO HQ</button>
        <span style={{ fontSize: 10, color: saving ? G : saveStatus === "saved" ? JK.green : saveStatus === "error" ? JK.red : "#333", letterSpacing: 1 }}>
          {saving ? "⏳ Sauvegarde…" : saveStatus === "saved" ? "✓ Sauvegardé" : saveStatus === "error" ? "✕ Erreur de sauvegarde" : ""}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { l: "PIPELINE",        v: `$${(pipeline / 1000).toFixed(0)}K`, color: G },
          { l: "CLOSED",          v: `$${(closed / 1000).toFixed(0)}K`,   color: JK.green },
          { l: "ACTIVE DEALS",    v: activeDeals.length },
          { l: "FOLLOW UP TODAY", v: followUpToday, color: followUpToday > 0 ? JK.red : "#555" },
        ].map(({ l, v, color }) => (
          <Card key={l} style={{ padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Cinzel Decorative',serif", color: color || "#888" }}>{v}</div>
          </Card>
        ))}
      </div>

      {/* Pipeline kanban */}
      <Card style={{ marginBottom: 16, padding: "12px 16px" }}>
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {STAGES.map(s => {
            const count = deals.filter(d => d.stage === s.id).length;
            const amt = deals.filter(d => d.stage === s.id).reduce((a, d) => a + (parseFloat(d.amount) || 0), 0);
            return (
              <button key={s.id} onClick={() => setFilter(filter === s.id ? "all" : s.id)} style={{
                background: filter === s.id ? `${s.color}18` : "rgba(255,255,255,0.02)",
                border: `1px solid ${filter === s.id ? s.color + "55" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
                color: filter === s.id ? s.color : "#555", transition: "all 0.15s",
              }}>
                <div style={{ fontSize: 8, letterSpacing: 1.5, fontWeight: 700, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{count} · {amt ? `$${(amt / 1000).toFixed(0)}K` : "—"}</div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Add/Edit form button */}
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={() => { setAddMode(!addMode); setEditId(null); setDraft({ name: "", stage: "new", amount: "", type: "Angel", notes: "", socials: "", date: today, followUp: "" }); }}
          style={{ background: `rgba(245,166,35,0.12)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit" }}>
          {addMode ? "CANCEL" : "+ NEW DEAL"}
        </button>
      </div>

      {addMode && (
        <Card style={{ marginBottom: 16 }}>
          <SectionTitle>{editId ? "Edit" : "New"} <span style={{ color: JK.gold }}>Deal</span></SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 14 }}>
            {[
              { k: "name",     l: "CONTACT NAME",      ph: "Alex M." },
              { k: "amount",   l: "AMOUNT ($)",        ph: "50000" },
              { k: "socials",  l: "TWITTER / SOCIAL",  ph: "@handle" },
              { k: "date",     l: "FIRST CONTACT",     ph: today, type: "date" },
              { k: "followUp", l: "FOLLOW-UP DATE",    ph: today, type: "date" },
              { k: "notes",    l: "NOTES",             ph: "Context, intro, details…" },
            ].map(({ k, l, ph, type }) => (
              <div key={k}>
                <span style={lbl}>{l}</span>
                <input type={type || "text"} value={draft[k] || ""} onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inp} />
              </div>
            ))}
            <div>
              <span style={lbl}>TYPE</span>
              <select value={draft.type} onChange={e => setDraft(p => ({ ...p, type: e.target.value }))} style={inp}>
                {Object.keys(TYPE_COLORS).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <span style={lbl}>STAGE</span>
              <select value={draft.stage} onChange={e => setDraft(p => ({ ...p, stage: e.target.value }))} style={inp}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveDeal} style={{ background: `rgba(245,166,35,0.15)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit" }}>
            {editId ? "SAVE CHANGES" : "ADD DEAL"}
          </button>
        </Card>
      )}

      {/* Deals table */}
      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 80px 1fr 80px", gap: 8, padding: "8px 12px", fontSize: 8, color: "#333", letterSpacing: 2, fontFamily: "'Cinzel',serif", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span>CONTACT</span><span>TYPE</span><span>AMOUNT</span><span>STAGE</span><span>FOLLOW-UP</span><span>NOTES</span><span></span>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#2a2a2a", fontSize: 12, padding: "24px 0" }}>No deals in this stage</div>
        )}
        {filtered.map(d => {
          const stage = STAGES.find(s => s.id === d.stage) || STAGES[0];
          const typeColor = TYPE_COLORS[d.type] || G;
          const isFollowUp = d.followUp === today;
          return (
            <div key={d.id} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 90px 90px 80px 1fr 80px", gap: 8,
              padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)", alignItems: "center",
              background: isFollowUp ? "rgba(239,68,68,0.04)" : "transparent",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                {d.socials && <div style={{ fontSize: 10, color: "#3B82F6", marginTop: 1 }}>{d.socials}</div>}
                <div style={{ fontSize: 9, color: "#333", marginTop: 1 }}>{d.date}</div>
              </div>
              <span style={{ fontSize: 9, color: typeColor, background: `${typeColor}18`, border: `1px solid ${typeColor}33`, borderRadius: 4, padding: "2px 7px", textAlign: "center", fontFamily: "'Cinzel',serif", letterSpacing: 0.5 }}>{d.type}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: G, fontFamily: "'Space Mono',monospace" }}>${(parseFloat(d.amount) / 1000).toFixed(0)}K</span>
              <div>
                <select value={d.stage} onChange={e => moveStage(d.id, e.target.value)}
                  style={{ background: `${stage.color}18`, border: `1px solid ${stage.color}33`, borderRadius: 6, padding: "4px 8px", color: stage.color, fontSize: 9, fontFamily: "'Cinzel',serif", letterSpacing: 0.5, cursor: "pointer", outline: "none" }}>
                  {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <span style={{ fontSize: 11, color: isFollowUp ? JK.red : "#555", fontWeight: isFollowUp ? 700 : 400 }}>
                {d.followUp || "—"}
                {isFollowUp && <div style={{ fontSize: 8, color: JK.red, letterSpacing: 1 }}>⚡ TODAY</div>}
              </span>
              <span style={{ fontSize: 11, color: "#555" }}>{d.notes || "—"}</span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => editDeal(d)} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: "#555", borderRadius: 6, fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>✎</button>
                <button onClick={() => deleteDeal(d.id)} style={{ background: "rgba(239,68,68,0.08)", border: "none", color: JK.red, borderRadius: 6, fontSize: 10, padding: "4px 8px", cursor: "pointer" }}>✕</button>
              </div>
            </div>
          );
        })}
      </Card>
    </Shell>
  );
}
