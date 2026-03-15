// ============================================================
// JUNGLE KABAL — NARRATIVE BOARD
// Coin thesis tracker · Live prices · Team-shared · API persistent
// ============================================================
import { useEffect, useRef, useState } from "react";
import Shell, { JK } from "../components/JKShell";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ─── Static config ────────────────────────────────────────────────────────────
const ZONES = [
  { id: "ai",       label: "AI / Agents",     color: "#3B82F6" },
  { id: "animals",  label: "Animals",          color: "#22C55E" },
  { id: "cult",     label: "Cult / Community", color: "#A855F7" },
  { id: "meta",     label: "CT Meta",          color: JK.gold },
  { id: "political",label: "Political",        color: "#EF4444" },
  { id: "comeback", label: "Comeback",         color: "#F97316" },
  { id: "defi",     label: "DeFi / Infra",    color: "#06B6D4" },
  { id: "other",    label: "Other",            color: "#888" },
];

const STATUSES = [
  { id: "Watching",      col: "watch",   label: "Watching",      color: "#888" },
  { id: "Interested",    col: "watch",   label: "Interested",    color: JK.gold },
  { id: "Recycle Later", col: "watch",   label: "Recycle Later", color: "#666" },
  { id: "Ready",         col: "play",    label: "Ready",         color: "#22C55E" },
  { id: "Entered",       col: "play",    label: "Entered",       color: "#4ADE80" },
  { id: "Trimmed",       col: "play",    label: "Trimmed",       color: "#F5A623" },
  { id: "Exited",        col: "archive", label: "Exited",        color: "#888" },
  { id: "Dead",          col: "archive", label: "Dead",          color: "#444" },
];

const COLUMNS = [
  { id: "watch",   label: "WATCHLIST",  icon: "👀", color: JK.gold,    statuses: ["Watching", "Interested", "Recycle Later"] },
  { id: "play",    label: "IN PLAY",    icon: "⚡", color: "#22C55E",  statuses: ["Ready", "Entered", "Trimmed"] },
  { id: "archive", label: "ARCHIVE",    icon: "💀", color: "#555",     statuses: ["Exited", "Dead"] },
];

const BLANK_CARD = {
  ticker: "", zone: "ai", status: "Watching", heat: 50, conviction: 50,
  coingeckoId: "", thesis: "", catalyst: "", bullCase: "", bearCase: "",
  invalidation: "", entryIdea: "", target: "", notes: "", tags: "",
};

const INITIAL_CARDS = [
  { id: "1", ticker: "$GOR",  zone: "animals", status: "Ready",     heat: 88, conviction: 79, coingeckoId: "", thesis: "Strong jungle fit, meme clarity, easy to understand, already has attention memory.", catalyst: "Community push + meme spread + runner comparison", bullCase: "Can become the main jungle animal ticker if timeline picks it up again.", bearCase: "Could just be a dead bounce if no fresh CT attention comes in.", invalidation: "Loses social momentum and fails to hold narrative relevance.", entryIdea: "Starter near fatigue pullback, add only if volume returns.", target: "Retest of last local top, then runner extension if meta stays hot.", notes: "Feels like a clean second-wave play if narrative reactivates.", tags: "Runner, Strong lore, Good CT fit" },
  { id: "2", ticker: "$MONK", zone: "cult",    status: "Watching",  heat: 71, conviction: 84, coingeckoId: "", thesis: "Simple brand, sticky meme, tribe energy. Easy for holders to rally around.", catalyst: "Cult narrative strengthening + repeat mentions + meme consistency", bullCase: "Could become a belief coin rather than a one-day pump.", bearCase: "May stay niche if it fails to escape its bubble.", invalidation: "Narrative stalls and no new believers enter.", entryIdea: "Watch for tight base after runner impulse.", target: "Slow grind into leader status inside its sub-meta.", notes: "Less explosive than hype coins, but stickier if culture catches.", tags: "Cult, Early, Might revive" },
  { id: "3", ticker: "$BOTX", zone: "ai",      status: "Interested",heat: 93, conviction: 63, coingeckoId: "", thesis: "AI remains easy narrative fuel and still gets instant attention when packaged well.", catalyst: "Bot tooling angle + smart account threads + fast market appetite", bullCase: "If AI meta keeps rotating, this can run just on narrative alignment.", bearCase: "Too many AI clones. Needs identity, not just the category.", invalidation: "Fails to differentiate from generic AI tickers.", entryIdea: "Only if it shows social acceleration versus other AI names.", target: "Quick momentum trade rather than long hold.", notes: "High heat, lower trust. Good for attention, not yet for marriage.", tags: "Crowded, Risky" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function heatColor(h) {
  if (h >= 80) return "#EF4444";
  if (h >= 60) return JK.gold;
  return "#22C55E";
}
function getZone(id) { return ZONES.find(z => z.id === id) || ZONES[ZONES.length - 1]; }
function getStatus(id) { return STATUSES.find(s => s.id === id) || STATUSES[0]; }
function getCol(statusId) { return COLUMNS.find(c => c.statuses.includes(statusId)) || COLUMNS[0]; }

const inp = {
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, padding: "8px 12px", color: "#fff", fontSize: 13,
  fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
};
const lbl = { fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif", display: "block" };

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeatBar({ value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 4, height: 3, overflow: "hidden", marginTop: 4 }}>
      <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

function Tag({ label, color = JK.gold }) {
  return (
    <span style={{ fontSize: 8, color, background: `${color}18`, border: `1px solid ${color}33`, borderRadius: 20, padding: "2px 7px", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function PriceBadge({ price, change24h }) {
  if (!price) return null;
  const pos = change24h >= 0;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 9, fontFamily: "'Space Mono',monospace",
      color: pos ? "#22C55E" : "#EF4444",
      background: pos ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${pos ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
      borderRadius: 6, padding: "2px 7px",
    }}>
      ${price < 0.001 ? price.toFixed(8) : price < 1 ? price.toFixed(4) : price.toFixed(2)}
      <span style={{ opacity: 0.7 }}>{pos ? "▲" : "▼"}{Math.abs(change24h).toFixed(1)}%</span>
    </span>
  );
}

function CoinCard({ card, prices, onSelect, onStatusChange, onDelete, selected }) {
  const zone = getZone(card.zone);
  const status = getStatus(card.status);
  const hc = heatColor(card.heat);
  const priceData = prices[card.coingeckoId?.toLowerCase()];
  const isSelected = selected === card.id;
  const tags = card.tags ? card.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <div
      onClick={() => onSelect(card.id)}
      style={{
        background: isSelected ? "rgba(245,166,35,0.07)" : "rgba(18,18,18,0.95)",
        border: `1px solid ${isSelected ? JK.gold + "55" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 12, padding: "14px 16px",
        cursor: "pointer", transition: "all 0.15s",
        boxShadow: isSelected ? `0 0 20px ${JK.gold}18` : "none",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${zone.color}88, transparent)` }} />

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 700, color: "#e8d5a0", letterSpacing: 1 }}>{card.ticker}</div>
          {priceData && <PriceBadge price={priceData.usd} change24h={priceData.usd_24h_change} />}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <Tag label={zone.label} color={zone.color} />
          <select
            value={card.status}
            onChange={e => { e.stopPropagation(); onStatusChange(card.id, e.target.value); }}
            onClick={e => e.stopPropagation()}
            style={{ background: `${status.color}18`, border: `1px solid ${status.color}44`, borderRadius: 5, padding: "2px 5px", color: status.color, fontSize: 8, fontFamily: "'Cinzel',serif", letterSpacing: 0.5, cursor: "pointer", outline: "none" }}
          >
            {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Thesis */}
      <p style={{ fontSize: 11, color: "#888", lineHeight: 1.5, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {card.thesis || card.whyPump || "—"}
      </p>

      {/* Heat + Conviction */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 8, color: "#444", letterSpacing: 1 }}>HEAT</span>
            <span style={{ fontSize: 9, color: hc, fontWeight: 700 }}>{card.heat}</span>
          </div>
          <HeatBar value={card.heat} color={hc} />
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ fontSize: 8, color: "#444", letterSpacing: 1 }}>CONV.</span>
            <span style={{ fontSize: 9, color: "#3B82F6", fontWeight: 700 }}>{card.conviction}</span>
          </div>
          <HeatBar value={card.conviction} color="#3B82F6" />
        </div>
      </div>

      {/* Tags + delete */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
        {tags.slice(0, 3).map(t => <Tag key={t} label={t} color="#555" />)}
        <button
          onClick={e => { e.stopPropagation(); onDelete(card.id); }}
          style={{ marginLeft: "auto", background: "rgba(239,68,68,0.08)", border: "none", color: "#555", borderRadius: 5, fontSize: 10, padding: "2px 7px", cursor: "pointer" }}
        >✕</button>
      </div>
    </div>
  );
}

function DetailPanel({ card, onClose, onEdit }) {
  if (!card) return null;
  const zone = getZone(card.zone);
  const status = getStatus(card.status);
  const fields = [
    ["💡 Thesis",       card.thesis || card.whyPump],
    ["🔥 Catalyst",     card.catalyst],
    ["🐂 Bull Case",    card.bullCase],
    ["🐻 Bear Case",    card.bearCase],
    ["❌ Invalidation", card.invalidation],
    ["📍 Entry Idea",   card.entryIdea],
    ["🎯 Target",       card.target],
    ["📝 Notes",        card.notes],
  ].filter(([, v]) => v);

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 380,
      background: "rgba(14,14,14,0.98)", backdropFilter: "blur(20px)",
      borderLeft: `1px solid ${JK.border}`,
      zIndex: 300, overflowY: "auto", padding: "24px 20px",
      boxShadow: `-20px 0 60px rgba(0,0,0,0.6)`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 22, fontWeight: 700, color: "#e8d5a0" }}>{card.ticker}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <Tag label={zone.label} color={zone.color} />
            <Tag label={status.label} color={status.color} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onEdit(card)} style={{ background: "rgba(245,166,35,0.12)", border: `1px solid ${JK.gold}44`, borderRadius: 7, color: JK.gold, fontSize: 10, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>EDIT</button>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: "#555", borderRadius: 7, fontSize: 16, padding: "4px 10px", cursor: "pointer" }}>✕</button>
        </div>
      </div>

      {/* Gauges */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[["HEAT", card.heat, heatColor(card.heat)], ["CONVICTION", card.conviction, "#3B82F6"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 6 }}>{l}</div>
            <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 22, fontWeight: 900, color: c }}>{v}</div>
            <HeatBar value={v} color={c} />
          </div>
        ))}
      </div>

      {/* Fields */}
      {fields.map(([label, value]) => (
        <div key={label} style={{ marginBottom: 14, borderLeft: `2px solid ${JK.border}`, paddingLeft: 12 }}>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, fontFamily: "'Cinzel',serif", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function CardForm({ draft, setDraft, onSave, onCancel, isEdit }) {
  const fields = [
    { k: "ticker",      l: "TICKER",         ph: "$GOR" },
    { k: "coingeckoId", l: "COINGECKO ID",   ph: "the-ticker (for live price)" },
    { k: "thesis",      l: "THESIS (1 LINE)", ph: "Why this pumps..." },
    { k: "catalyst",    l: "CATALYST",        ph: "What triggers the move" },
    { k: "bullCase",    l: "BULL CASE",       ph: "Best case scenario" },
    { k: "bearCase",    l: "BEAR CASE",       ph: "What kills the trade" },
    { k: "invalidation",l: "INVALIDATION",   ph: "When to abandon thesis" },
    { k: "entryIdea",   l: "ENTRY IDEA",      ph: "How to enter" },
    { k: "target",      l: "TARGET",          ph: "Exit target" },
    { k: "notes",       l: "NOTES",           ph: "Extra context..." },
    { k: "tags",        l: "TAGS (comma sep)",ph: "Runner, Cult, Risky" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 400,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#111", border: `1px solid ${JK.border}`, borderRadius: 16,
        padding: 24, width: "100%", maxWidth: 700, maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: JK.gold, fontWeight: 700 }}>{isEdit ? "EDIT CARD" : "NEW CARD"}</span>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>

        {/* Zone + Status + Sliders */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <span style={lbl}>ZONE</span>
            <select value={draft.zone} onChange={e => setDraft(p => ({ ...p, zone: e.target.value }))} style={inp}>
              {ZONES.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </div>
          <div>
            <span style={lbl}>STATUS</span>
            <select value={draft.status} onChange={e => setDraft(p => ({ ...p, status: e.target.value }))} style={inp}>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[["heat", "HEAT 🔥", heatColor(draft.heat)], ["conviction", "CONVICTION 💎", "#3B82F6"]].map(([k, l, c]) => (
            <div key={k}>
              <div style={{ display: "flex", justifyContent: "space-between", ...lbl }}>
                <span>{l}</span><span style={{ color: c }}>{draft[k]}</span>
              </div>
              <input type="range" min="0" max="100" value={draft[k]} onChange={e => setDraft(p => ({ ...p, [k]: Number(e.target.value) }))}
                style={{ width: "100%", accentColor: c }} />
            </div>
          ))}
        </div>

        {/* Text fields */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 16 }}>
          {fields.map(({ k, l, ph }) => (
            <div key={k}>
              <span style={lbl}>{l}</span>
              {["thesis", "catalyst", "bullCase", "bearCase", "invalidation", "entryIdea", "target", "notes"].includes(k) ? (
                <textarea value={draft[k] || ""} onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))} placeholder={ph}
                  style={{ ...inp, resize: "vertical", minHeight: 56 }} />
              ) : (
                <input value={draft[k] || ""} onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inp} />
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onSave} style={{ background: "rgba(245,166,35,0.15)", border: `1px solid ${JK.gold}44`, borderRadius: 8, color: JK.gold, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "10px 24px", cursor: "pointer", fontFamily: "inherit" }}>
            {isEdit ? "SAVE CHANGES" : "ADD CARD"}
          </button>
          <button onClick={onCancel} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#555", fontSize: 11, padding: "10px 16px", cursor: "pointer", fontFamily: "inherit" }}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NarrativeBoard() {
  const [cards, setCards] = useState(INITIAL_CARDS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(BLANK_CARD);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterZone, setFilterZone] = useState("all");
  const [viewMode, setViewMode] = useState("board");
  const [prices, setPrices] = useState({});
  const saveTimer = useRef(null);

  // Load from API
  useEffect(() => {
    fetch(`${API_BASE}/api/narrative/cards`)
      .then(r => r.json())
      .then(data => { if (data.ok && Array.isArray(data.cards) && data.cards.length) setCards(data.cards); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Auto-save 1.5s after any change
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistCards(cards), 1500);
    return () => clearTimeout(saveTimer.current);
  }, [cards, loaded]);

  async function persistCards(nextCards) {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/narrative/cards`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: nextCards }),
      });
      const data = await r.json();
      setSaveStatus(data.ok ? "saved" : "error");
    } catch { setSaveStatus("error"); }
    finally { setSaving(false); setTimeout(() => setSaveStatus(null), 2500); }
  }

  // Fetch live prices from CoinGecko for tracked cards
  useEffect(() => {
    const ids = [...new Set(cards.map(c => c.coingeckoId?.toLowerCase()).filter(Boolean))];
    if (!ids.length) return;
    const fetchPrices = () => {
      fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`)
        .then(r => r.json())
        .then(data => setPrices(data))
        .catch(() => {});
    };
    fetchPrices();
    const iv = setInterval(fetchPrices, 60000);
    return () => clearInterval(iv);
  }, [cards.map(c => c.coingeckoId).join(",")]);

  const selectedCard = cards.find(c => c.id === selectedId) || null;

  function handleSelect(id) {
    setSelectedId(prev => prev === id ? null : id);
  }

  function handleStatusChange(id, status) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }

  function handleDelete(id) {
    setCards(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handleEdit(card) {
    setDraft({ ...card, tags: Array.isArray(card.tags) ? card.tags.join(", ") : card.tags || "" });
    setEditId(card.id);
    setShowForm(true);
    setSelectedId(null);
  }

  function saveCard() {
    if (!draft.ticker.trim()) return;
    if (editId) {
      setCards(prev => prev.map(c => c.id === editId ? { ...draft, id: editId } : c));
      setEditId(null);
    } else {
      setCards(prev => [...prev, { ...draft, id: Date.now().toString() }]);
    }
    setDraft(BLANK_CARD);
    setShowForm(false);
  }

  // Filter
  const filtered = cards.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.ticker.toLowerCase().includes(q) || (c.thesis || c.whyPump || "").toLowerCase().includes(q) || (c.tags || "").toLowerCase().includes(q);
    const matchZone = filterZone === "all" || c.zone === filterZone;
    return matchSearch && matchZone;
  });

  // Stats
  const inPlay = cards.filter(c => ["Ready", "Entered", "Trimmed"].includes(c.status)).length;
  const avgHeat = cards.length ? Math.round(cards.reduce((s, c) => s + c.heat, 0) / cards.length) : 0;
  const trackedPrices = Object.keys(prices).length;

  return (
    <Shell
      title={<>NARRATIVE <span style={{ color: JK.gold }}>BOARD</span></>}
      subtitle="Coin thesis tracker · Live prices · Auto-synced with the squad"
      maxWidth={selectedCard ? 1200 : 1100}
    >
      {/* Save status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { l: "TOTAL",   v: cards.length,  c: JK.gold },
            { l: "IN PLAY", v: inPlay,         c: "#22C55E" },
            { l: "AVG HEAT",v: avgHeat,        c: heatColor(avgHeat) },
            { l: "PRICES",  v: trackedPrices,  c: "#3B82F6" },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 18, fontWeight: 900, color: c }}>{v}</div>
              <div style={{ fontSize: 8, color: "#444", letterSpacing: 2 }}>{l}</div>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 10, color: saving ? JK.gold : saveStatus === "saved" ? "#22C55E" : saveStatus === "error" ? "#EF4444" : "#333", letterSpacing: 1 }}>
          {saving ? "⏳ Saving…" : saveStatus === "saved" ? "✓ Saved" : saveStatus === "error" ? "✕ Error" : ""}
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search ticker, thesis, tags…"
          style={{ ...inp, width: 220, fontSize: 12 }}
        />
        <select value={filterZone} onChange={e => setFilterZone(e.target.value)} style={{ ...inp, width: 150 }}>
          <option value="all">All zones</option>
          {ZONES.map(z => <option key={z.id} value={z.id}>{z.label}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {[["board", "⊞"], ["table", "≡"]].map(([mode, icon]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              background: viewMode === mode ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${viewMode === mode ? JK.gold + "44" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 7, color: viewMode === mode ? JK.gold : "#555",
              fontSize: 16, padding: "6px 12px", cursor: "pointer",
            }}>{icon}</button>
          ))}
        </div>
        <button onClick={() => { setDraft(BLANK_CARD); setEditId(null); setShowForm(true); }} style={{
          background: "rgba(245,166,35,0.12)", border: `1px solid ${JK.gold}44`,
          borderRadius: 8, color: JK.gold, fontWeight: 700, fontSize: 11,
          letterSpacing: 1.5, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit",
        }}>+ NEW CARD</button>
      </div>

      {/* Live price strip */}
      {Object.keys(prices).length > 0 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
          {cards.filter(c => prices[c.coingeckoId?.toLowerCase()]).map(c => {
            const p = prices[c.coingeckoId.toLowerCase()];
            const pos = p.usd_24h_change >= 0;
            return (
              <div key={c.id} onClick={() => handleSelect(c.id)} style={{
                display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
                background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: 8, padding: "6px 12px", cursor: "pointer",
              }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, color: "#e8d5a0", fontWeight: 700 }}>{c.ticker}</span>
                <PriceBadge price={p.usd} change24h={p.usd_24h_change} />
              </div>
            );
          })}
        </div>
      )}

      {/* Board / Table layout with optional detail panel */}
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {viewMode === "board" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
              {COLUMNS.map(col => {
                const colCards = filtered.filter(c => col.statuses.includes(c.status)).sort((a, b) => b.heat - a.heat);
                return (
                  <div key={col.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                      <span style={{ fontSize: 14 }}>{col.icon}</span>
                      <span style={{ fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700, color: col.color, letterSpacing: 2 }}>{col.label}</span>
                      <span style={{ fontSize: 9, color: "#333", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "1px 7px" }}>{colCards.length}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {colCards.map(card => (
                        <CoinCard key={card.id} card={card} prices={prices} onSelect={handleSelect} onStatusChange={handleStatusChange} onDelete={handleDelete} selected={selectedId} />
                      ))}
                      {colCards.length === 0 && (
                        <div style={{ fontSize: 11, color: "#222", textAlign: "center", padding: "20px 0", fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>— empty —</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table view */
            <div style={{ background: "rgba(18,18,18,0.95)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "120px 110px 110px 60px 60px 1fr 80px", gap: 8, padding: "8px 14px", fontSize: 8, color: "#333", letterSpacing: 2, fontFamily: "'Cinzel',serif", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span>TICKER</span><span>ZONE</span><span>STATUS</span><span>HEAT</span><span>CONV.</span><span>THESIS</span><span></span>
              </div>
              {filtered.sort((a, b) => b.heat - a.heat).map(card => {
                const zone = getZone(card.zone);
                const status = getStatus(card.status);
                const hc = heatColor(card.heat);
                const priceData = prices[card.coingeckoId?.toLowerCase()];
                return (
                  <div key={card.id} onClick={() => handleSelect(card.id)} style={{
                    display: "grid", gridTemplateColumns: "120px 110px 110px 60px 60px 1fr 80px",
                    gap: 8, padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,0.03)",
                    alignItems: "center", cursor: "pointer",
                    background: selectedId === card.id ? "rgba(245,166,35,0.05)" : "transparent",
                    transition: "background 0.15s",
                  }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, color: "#e8d5a0" }}>{card.ticker}</div>
                      {priceData && <PriceBadge price={priceData.usd} change24h={priceData.usd_24h_change} />}
                    </div>
                    <Tag label={zone.label} color={zone.color} />
                    <Tag label={status.label} color={status.color} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: hc }}>{card.heat}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#3B82F6" }}>{card.conviction}</span>
                    <span style={{ fontSize: 11, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{card.thesis || card.whyPump || "—"}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); handleEdit(card); }} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: "#555", borderRadius: 5, fontSize: 10, padding: "3px 8px", cursor: "pointer" }}>✎</button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(card.id); }} style={{ background: "rgba(239,68,68,0.08)", border: "none", color: "#EF4444", borderRadius: 5, fontSize: 10, padding: "3px 8px", cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: "#222", fontSize: 11, fontFamily: "'Cinzel',serif", letterSpacing: 2 }}>NO CARDS MATCH YOUR FILTER</div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel (inline on wide screens) */}
        {selectedCard && (
          <div style={{ width: 340, flexShrink: 0 }}>
            <div style={{
              position: "sticky", top: 60,
              background: "rgba(18,18,18,0.97)", border: `1px solid ${JK.border}`,
              borderRadius: 14, padding: 20, maxHeight: "calc(100vh - 100px)", overflowY: "auto",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 18, fontWeight: 700, color: "#e8d5a0" }}>{selectedCard.ticker}</div>
                  <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
                    <Tag label={getZone(selectedCard.zone).label} color={getZone(selectedCard.zone).color} />
                    <Tag label={getStatus(selectedCard.status).label} color={getStatus(selectedCard.status).color} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  <button onClick={() => handleEdit(selectedCard)} style={{ background: "rgba(245,166,35,0.12)", border: `1px solid ${JK.gold}44`, borderRadius: 7, color: JK.gold, fontSize: 9, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>EDIT</button>
                  <button onClick={() => setSelectedId(null)} style={{ background: "rgba(255,255,255,0.04)", border: "none", color: "#555", borderRadius: 7, fontSize: 14, padding: "3px 8px", cursor: "pointer" }}>✕</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[["HEAT", selectedCard.heat, heatColor(selectedCard.heat)], ["CONVICTION", selectedCard.conviction, "#3B82F6"]].map(([l, v, c]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 8, color: "#444", letterSpacing: 2 }}>{l}</div>
                    <div style={{ fontFamily: "'Cinzel Decorative',serif", fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
                    <HeatBar value={v} color={c} />
                  </div>
                ))}
              </div>

              {[
                ["💡 Thesis",       selectedCard.thesis || selectedCard.whyPump],
                ["🔥 Catalyst",     selectedCard.catalyst],
                ["🐂 Bull Case",    selectedCard.bullCase],
                ["🐻 Bear Case",    selectedCard.bearCase],
                ["❌ Invalidation", selectedCard.invalidation],
                ["📍 Entry",        selectedCard.entryIdea],
                ["🎯 Target",       selectedCard.target],
                ["📝 Notes",        selectedCard.notes],
              ].filter(([, v]) => v).map(([label, value]) => (
                <div key={label} style={{ marginBottom: 12, borderLeft: `2px solid rgba(245,166,35,0.2)`, paddingLeft: 10 }}>
                  <div style={{ fontSize: 8, color: "#444", letterSpacing: 1.5, fontFamily: "'Cinzel',serif", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>{value}</div>
                </div>
              ))}

              {selectedCard.tags && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                  {(typeof selectedCard.tags === "string" ? selectedCard.tags : selectedCard.tags.join(", ")).split(",").map(t => t.trim()).filter(Boolean).map(t => (
                    <Tag key={t} label={t} color="#555" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <CardForm
          draft={draft}
          setDraft={setDraft}
          onSave={saveCard}
          onCancel={() => { setShowForm(false); setEditId(null); setDraft(BLANK_CARD); }}
          isEdit={!!editId}
        />
      )}
    </Shell>
  );
}
