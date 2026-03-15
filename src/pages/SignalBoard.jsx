// ============================================================
// JUNGLE KABAL — SIGNAL BOARD
// Trading signals · Persistent via API · Team-shared
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ─── CONSTANTS ───────────────────────────────────────────────
const TYPE_META = {
  LONG:  { color: JK.green,   accent: JK.green },
  SHORT: { color: JK.red,     accent: JK.red },
  WATCH: { color: JK.gold,    accent: JK.gold },
  FADE:  { color: "#A855F7",  accent: "#A855F7" },
};

const STATUS_META = {
  OPEN:    { color: JK.gold,   label: "OPEN" },
  WIN:     { color: JK.green,  label: "WIN" },
  LOSS:    { color: JK.red,    label: "LOSS" },
  INVALID: { color: JK.muted,  label: "INVALID" },
};

const TIMEFRAME_COLORS = {
  SCALP: "#3B82F6",
  SWING: JK.gold,
  HOLD:  "#A855F7",
};

const FILTER_TABS = ["ALL", "OPEN", "WIN", "LOSS", "WATCH"];

const BLANK_DRAFT = {
  ticker: "",
  type: "LONG",
  entry: "",
  tp1: "",
  tp2: "",
  tp3: "",
  sl: "",
  conviction: 3,
  timeframe: "SWING",
  thesis: "",
  status: "OPEN",
  poster: "",
};

// ─── SAMPLE SIGNALS ─────────────────────────────────────────
const INITIAL_SIGNALS = [
  {
    id: 1,
    ticker: "SOL",
    type: "LONG",
    entry: "185–190",
    tp1: "210",
    tp2: "235",
    tp3: "260",
    sl: "175",
    conviction: 4,
    timeframe: "SWING",
    thesis: "Reclaim of 200MA + devs accumulating on-chain. Dip buyer setup.",
    status: "OPEN",
    poster: "Kabal Alpha",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 2,
    ticker: "BTC",
    type: "LONG",
    entry: "82000–84000",
    tp1: "90000",
    tp2: "95000",
    tp3: "",
    sl: "78000",
    conviction: 5,
    timeframe: "HOLD",
    thesis: "Macro cycle support zone. ETF inflows re-accelerating. Strong hands.",
    status: "WIN",
    poster: "Kabal Alpha",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: 3,
    ticker: "DOGE",
    type: "FADE",
    entry: "0.190–0.200",
    tp1: "0.160",
    tp2: "0.140",
    tp3: "",
    sl: "0.215",
    conviction: 3,
    timeframe: "SCALP",
    thesis: "Hype exhaustion after pump. No fundamentals. Distribution pattern on 4H.",
    status: "OPEN",
    poster: "El Jaguar",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

// ─── HELPERS ─────────────────────────────────────────────────
function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function Stars({ count, max = 5 }) {
  return (
    <span style={{ letterSpacing: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < count ? JK.gold : "rgba(255,255,255,0.12)", fontSize: 12 }}>★</span>
      ))}
    </span>
  );
}

// ─── CLICKABLE STARS INPUT ────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <span style={{ letterSpacing: 3, cursor: "pointer" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          onMouseEnter={() => setHover(i + 1)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i + 1)}
          style={{ color: i < (hover || value) ? JK.gold : "rgba(255,255,255,0.15)", fontSize: 22, transition: "color 0.1s" }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ─── TYPE / STATUS BUTTON GROUP ───────────────────────────────
function ButtonGroup({ options, value, onChange, colorMap }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(opt => {
        const color = colorMap[opt] || JK.gold;
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              background: active ? `${color}22` : "rgba(255,255,255,0.03)",
              border: `1px solid ${active ? color + "88" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8,
              color: active ? color : JK.muted,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.5,
              padding: "7px 14px",
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              transition: "all 0.15s",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── SIGNAL CARD ─────────────────────────────────────────────
function SignalCard({ signal, onEdit, onStatusChange, onDelete }) {
  const typeMeta = TYPE_META[signal.type] || TYPE_META.WATCH;
  const statusMeta = STATUS_META[signal.status] || STATUS_META.OPEN;
  const tfColor = TIMEFRAME_COLORS[signal.timeframe] || JK.gold;

  return (
    <div style={{
      background: JK.card,
      border: `1px solid ${JK.border}`,
      borderRadius: 16,
      overflow: "hidden",
      backdropFilter: "blur(10px)",
      position: "relative",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Accent line top */}
      <div style={{ height: 3, background: typeMeta.accent, flexShrink: 0 }} />

      <div style={{ padding: "16px 18px 14px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Row 1: ticker + type + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 26,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: 1,
            lineHeight: 1,
          }}>
            {signal.ticker}
          </span>
          <div style={{ display: "flex", gap: 5, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Badge color={typeMeta.color}>{signal.type}</Badge>
            <Badge color={statusMeta.color}>{statusMeta.label}</Badge>
          </div>
        </div>

        {/* Row 2: conviction + timeframe */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Stars count={signal.conviction} />
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            color: tfColor,
            background: `${tfColor}18`,
            border: `1px solid ${tfColor}33`,
            borderRadius: 6,
            padding: "2px 8px",
            fontFamily: "'Cinzel', serif",
          }}>
            {signal.timeframe}
          </span>
        </div>

        {/* Row 3: entry / targets / SL */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 8, color: JK.muted, letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>ENTRY</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#e8d5a0", fontFamily: "monospace" }}>{signal.entry || "—"}</span>
          </div>
          {signal.tp1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 8, color: JK.muted, letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>TP1</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: JK.green, fontFamily: "monospace" }}>{signal.tp1}</span>
            </div>
          )}
          {signal.tp2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 8, color: JK.muted, letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>TP2</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: JK.green, fontFamily: "monospace" }}>{signal.tp2}</span>
            </div>
          )}
          {signal.tp3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 8, color: JK.muted, letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>TP3</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: JK.green, fontFamily: "monospace" }}>{signal.tp3}</span>
            </div>
          )}
          {signal.sl && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 8, color: JK.red, letterSpacing: 2, fontFamily: "'Cinzel', serif" }}>SL</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: JK.red, fontFamily: "monospace" }}>{signal.sl}</span>
            </div>
          )}
        </div>

        {/* Row 4: thesis */}
        {signal.thesis && (
          <p style={{
            fontSize: 12,
            color: JK.muted,
            fontStyle: "italic",
            lineHeight: 1.5,
            margin: 0,
            paddingTop: 2,
          }}>
            "{signal.thesis}"
          </p>
        )}

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${JK.border2}, transparent)`, margin: "2px 0" }} />

        {/* Row 5: poster + time */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#555", fontFamily: "'Cinzel', serif", letterSpacing: 0.5 }}>
            {signal.poster || "Anonymous"}
          </span>
          <span style={{ fontSize: 10, color: "#444" }}>{timeAgo(signal.createdAt)}</span>
        </div>

        {/* Row 6: actions */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => onEdit(signal)}
            style={{
              background: "rgba(245,166,35,0.08)",
              border: `1px solid ${JK.border2}`,
              borderRadius: 7,
              color: JK.gold,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              padding: "5px 12px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            EDIT
          </button>

          <select
            value={signal.status}
            onChange={e => onStatusChange(signal.id, e.target.value)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 7,
              color: STATUS_META[signal.status]?.color || JK.muted,
              fontSize: 10,
              fontWeight: 700,
              padding: "5px 8px",
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: 1,
              outline: "none",
              flex: 1,
              minWidth: 90,
            }}
          >
            {Object.keys(STATUS_META).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={() => {
              if (window.confirm(`Delete signal for ${signal.ticker}?`)) onDelete(signal.id);
            }}
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 7,
              color: JK.red,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
              padding: "5px 10px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL FORM ───────────────────────────────────────────────
function SignalForm({ draft, setDraft, onSave, onCancel, editId }) {
  const inp = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 8,
    padding: "9px 12px",
    color: "#fff",
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const fieldLabel = (text) => (
    <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 6, fontFamily: "'Cinzel', serif" }}>{text}</div>
  );

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,0.92)",
      backdropFilter: "blur(16px)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      overflowY: "auto",
      padding: "40px 16px",
    }}>
      <div style={{
        background: "rgba(14,14,14,0.98)",
        border: `1px solid ${JK.border2}`,
        borderRadius: 20,
        padding: "32px 28px",
        width: "100%",
        maxWidth: 680,
        position: "relative",
        boxShadow: `0 0 60px rgba(245,166,35,0.12)`,
      }}>
        {/* Modal header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 18,
            fontWeight: 900,
            color: "#fff",
            margin: 0,
          }}>
            {editId ? "EDIT SIGNAL" : <><span style={{ color: JK.gold }}>NEW</span> SIGNAL</>}
          </h2>
          <button
            onClick={onCancel}
            style={{ background: "transparent", border: "none", color: JK.muted, fontSize: 20, cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Ticker */}
        <div style={{ marginBottom: 20 }}>
          {fieldLabel("TICKER")}
          <input
            value={draft.ticker}
            onChange={e => setDraft(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
            placeholder="SOL"
            maxLength={12}
            style={{ ...inp, fontFamily: "'Cinzel Decorative', serif", fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2 }}
          />
        </div>

        {/* Type */}
        <div style={{ marginBottom: 20 }}>
          {fieldLabel("SIGNAL TYPE")}
          <ButtonGroup
            options={["LONG", "SHORT", "WATCH", "FADE"]}
            value={draft.type}
            onChange={v => setDraft(p => ({ ...p, type: v }))}
            colorMap={{ LONG: JK.green, SHORT: JK.red, WATCH: JK.gold, FADE: "#A855F7" }}
          />
        </div>

        {/* Entry / SL */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <div>
            {fieldLabel("ENTRY ZONE")}
            <input value={draft.entry} onChange={e => setDraft(p => ({ ...p, entry: e.target.value }))} placeholder="185–190" style={inp} />
          </div>
          <div>
            {fieldLabel("STOP LOSS")}
            <input value={draft.sl} onChange={e => setDraft(p => ({ ...p, sl: e.target.value }))} placeholder="175" style={{ ...inp, color: JK.red }} />
          </div>
        </div>

        {/* TP targets */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
          {["tp1", "tp2", "tp3"].map((k, i) => (
            <div key={k}>
              {fieldLabel(`TP${i + 1} ${i === 2 ? "(OPTIONAL)" : ""}`)}
              <input
                value={draft[k]}
                onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))}
                placeholder={["210", "235", "260"][i]}
                style={{ ...inp, color: JK.green }}
              />
            </div>
          ))}
        </div>

        {/* Conviction */}
        <div style={{ marginBottom: 20 }}>
          {fieldLabel("CONVICTION")}
          <StarInput value={draft.conviction} onChange={v => setDraft(p => ({ ...p, conviction: v }))} />
        </div>

        {/* Timeframe */}
        <div style={{ marginBottom: 20 }}>
          {fieldLabel("TIMEFRAME")}
          <ButtonGroup
            options={["SCALP", "SWING", "HOLD"]}
            value={draft.timeframe}
            onChange={v => setDraft(p => ({ ...p, timeframe: v }))}
            colorMap={{ SCALP: "#3B82F6", SWING: JK.gold, HOLD: "#A855F7" }}
          />
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          {fieldLabel("STATUS")}
          <ButtonGroup
            options={["OPEN", "WIN", "LOSS", "INVALID"]}
            value={draft.status}
            onChange={v => setDraft(p => ({ ...p, status: v }))}
            colorMap={{ OPEN: JK.gold, WIN: JK.green, LOSS: JK.red, INVALID: JK.muted }}
          />
        </div>

        {/* Thesis */}
        <div style={{ marginBottom: 20 }}>
          {fieldLabel("THESIS (ONE LINE)")}
          <input
            value={draft.thesis}
            onChange={e => setDraft(p => ({ ...p, thesis: e.target.value }))}
            placeholder="Short reasoning — e.g. reclaim of 200MA + bullish structure"
            maxLength={140}
            style={inp}
          />
        </div>

        {/* Poster */}
        <div style={{ marginBottom: 28 }}>
          {fieldLabel("POSTED BY")}
          <input
            value={draft.poster}
            onChange={e => setDraft(p => ({ ...p, poster: e.target.value }))}
            placeholder="Kabal Alpha"
            style={inp}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onSave}
            style={{
              background: `rgba(245,166,35,0.15)`,
              border: `1px solid ${JK.gold}55`,
              borderRadius: 10,
              color: JK.gold,
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 2,
              padding: "11px 28px",
              cursor: "pointer",
              flex: 1,
            }}
          >
            {editId ? "SAVE CHANGES" : "POST SIGNAL"}
          </button>
          <button
            onClick={onCancel}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              color: JK.muted,
              fontSize: 11,
              letterSpacing: 1,
              padding: "11px 20px",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function SignalBoard() {
  const navigate = useNavigate();
  const [signals, setSignals] = useState(INITIAL_SIGNALS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saved" | "error"
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ ...BLANK_DRAFT });
  const [filter, setFilter] = useState("ALL");
  const [editId, setEditId] = useState(null);
  const saveTimer = useRef(null);

  // Load from API on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/signals`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.signals) && data.signals.length) {
          setSignals(data.signals);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Auto-save with 1.5s debounce
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistSignals(signals), 1500);
    return () => clearTimeout(saveTimer.current);
  }, [signals, loaded]);

  async function persistSignals(next) {
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/signals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signals: next }),
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

  function openAdd() {
    setDraft({ ...BLANK_DRAFT });
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(signal) {
    setDraft({
      ticker:     signal.ticker,
      type:       signal.type,
      entry:      signal.entry,
      tp1:        signal.tp1 || "",
      tp2:        signal.tp2 || "",
      tp3:        signal.tp3 || "",
      sl:         signal.sl || "",
      conviction: signal.conviction,
      timeframe:  signal.timeframe,
      thesis:     signal.thesis || "",
      status:     signal.status,
      poster:     signal.poster || "",
    });
    setEditId(signal.id);
    setShowForm(true);
  }

  function saveForm() {
    if (!draft.ticker.trim()) return;
    const now = new Date().toISOString();
    if (editId) {
      setSignals(prev => prev.map(s =>
        s.id === editId ? { ...s, ...draft, updatedAt: now } : s
      ));
    } else {
      const next = {
        ...draft,
        id: Date.now(),
        createdAt: now,
        updatedAt: now,
      };
      setSignals(prev => [next, ...prev]);
    }
    setShowForm(false);
    setEditId(null);
  }

  function statusChange(id, newStatus) {
    setSignals(prev => prev.map(s =>
      s.id === id ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s
    ));
  }

  function deleteSignal(id) {
    setSignals(prev => prev.filter(s => s.id !== id));
  }

  // ─── Stats ──────────────────────────────────────────────────
  const openSignals   = signals.filter(s => s.status === "OPEN");
  const closedSignals = signals.filter(s => ["WIN", "LOSS"].includes(s.status));
  const winSignals    = signals.filter(s => s.status === "WIN");
  const winRate       = closedSignals.length ? Math.round((winSignals.length / closedSignals.length) * 100) : 0;
  const highConv      = signals.filter(s => s.conviction >= 4);
  const avgHighConv   = highConv.length
    ? (highConv.reduce((acc, s) => acc + s.conviction, 0) / highConv.length).toFixed(1)
    : "—";

  // ─── Filtered list ───────────────────────────────────────────
  const displayed = signals.filter(s => {
    if (filter === "ALL")   return true;
    if (filter === "WATCH") return s.type === "WATCH";
    return s.status === filter;
  });

  // ─── Styles ─────────────────────────────────────────────────
  const filterBtnStyle = (tab) => ({
    background: filter === tab ? `rgba(245,166,35,0.15)` : "transparent",
    border: `1px solid ${filter === tab ? JK.gold + "55" : "rgba(255,255,255,0.07)"}`,
    borderRadius: 8,
    color: filter === tab ? JK.gold : JK.muted,
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    padding: "7px 16px",
    cursor: "pointer",
    transition: "all 0.15s",
  });

  return (
    <>
      <Shell
        title={<>SIGNAL <span style={{ color: JK.gold }}>BOARD</span></>}
        subtitle="Live trading signals · Jungle Kabal private syndicate · Team-shared"
        maxWidth={1000}
      >
        {/* Top bar: back + save status + add button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "transparent", border: "none", color: JK.muted, cursor: "pointer", fontSize: 12, letterSpacing: 1, padding: 0, fontFamily: "inherit" }}
          >
            ← BACK TO HQ
          </button>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {(saving || saveStatus) && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: saving
                  ? "rgba(245,166,35,0.08)"
                  : saveStatus === "saved"
                  ? "rgba(34,197,94,0.08)"
                  : "rgba(239,68,68,0.08)",
                border: `1px solid ${saving ? JK.gold + "33" : saveStatus === "saved" ? JK.green + "33" : JK.red + "33"}`,
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: saving ? JK.gold : saveStatus === "saved" ? JK.green : JK.red,
              }}>
                {saving ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "✕ Save error"}
              </div>
            )}
            <button
              onClick={openAdd}
              style={{
                background: `rgba(245,166,35,0.12)`,
                border: `1px solid ${JK.gold}44`,
                borderRadius: 8,
                color: JK.gold,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1.5,
                padding: "9px 18px",
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
              }}
            >
              + POST SIGNAL
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
          {[
            { label: "TOTAL SIGNALS", value: signals.length, color: JK.gold },
            { label: "OPEN",          value: openSignals.length, color: JK.gold },
            { label: "WIN RATE",      value: closedSignals.length ? `${winRate}%` : "—", color: winRate >= 60 ? JK.green : winRate > 0 ? JK.gold : JK.muted },
            { label: "HIGH CONV AVG", value: avgHighConv, color: JK.gold },
          ].map(({ label, value, color }) => (
            <Card key={label} style={{ padding: "14px 16px", textAlign: "center", marginBottom: 0 }}>
              <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 6, fontFamily: "'Cinzel', serif" }}>{label}</div>
              <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 900, color }}>{value}</div>
            </Card>
          ))}
        </div>

        <Divider />

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {FILTER_TABS.map(tab => (
            <button key={tab} onClick={() => setFilter(tab)} style={filterBtnStyle(tab)}>{tab}</button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#444", alignSelf: "center" }}>
            {displayed.length} signal{displayed.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Signals grid */}
        {displayed.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 24px",
            border: `1px dashed rgba(245,166,35,0.18)`,
            borderRadius: 20,
          }}>
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 36,
              color: "rgba(255,255,255,0.06)",
              marginBottom: 16,
              letterSpacing: 4,
            }}>
              SIG
            </div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: JK.gold, letterSpacing: 2, marginBottom: 8 }}>
              NO SIGNALS {filter !== "ALL" ? `IN ${filter}` : ""}
            </div>
            <div style={{ fontSize: 12, color: JK.muted }}>
              {filter !== "ALL"
                ? `Switch to ALL or post a new signal.`
                : `Click + POST SIGNAL to add the first signal.`}
            </div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}>
            {displayed.map(s => (
              <SignalCard
                key={s.id}
                signal={s}
                onEdit={openEdit}
                onStatusChange={statusChange}
                onDelete={deleteSignal}
              />
            ))}
          </div>
        )}
      </Shell>

      {/* Modal form */}
      {showForm && (
        <SignalForm
          draft={draft}
          setDraft={setDraft}
          onSave={saveForm}
          onCancel={() => { setShowForm(false); setEditId(null); }}
          editId={editId}
        />
      )}
    </>
  );
}
