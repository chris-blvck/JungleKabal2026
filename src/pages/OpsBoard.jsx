// ============================================================
// JUNGLE KABAL — OPS BOARD
// Asana-style kanban board for team operations · Persistent via API
// ============================================================
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const API = (import.meta.env.VITE_API_BASE || "") + "/api/ops-board";

// ─── COLUMN CONFIG ──────────────────────────────────────────
const COLUMNS = [
  { id: "BACKLOG",     label: "BACKLOG",      color: "#6B7280" },
  { id: "TODO",        label: "TO DO",        color: "#3B82F6" },
  { id: "IN_PROGRESS", label: "IN PROGRESS",  color: "#F5A623" },
  { id: "REVIEW",      label: "REVIEW",       color: "#A855F7" },
  { id: "DONE",        label: "DONE",         color: "#22C55E" },
];

// ─── PRIORITY CONFIG ─────────────────────────────────────────
const PRIORITY = {
  LOW:    { color: "#6B7280", label: "LOW" },
  MED:    { color: "#3B82F6", label: "MED" },
  HIGH:   { color: "#F5A623", label: "HIGH" },
  URGENT: { color: "#EF4444", label: "URGENT" },
};

// ─── SAMPLE DATA ─────────────────────────────────────────────
const SAMPLE_CARDS = [
  {
    id: 1,
    title: "Setup KKM Telegram bot",
    assignee: "Chris",
    priority: "HIGH",
    column: "IN_PROGRESS",
    tags: ["ops", "telegram"],
    dueDate: "2026-03-20",
    description: "Configure bot commands and auto-posting",
    checklist: [
      { id: 1, text: "Create bot via BotFather", done: true },
      { id: 2, text: "Add webhook", done: false },
    ],
    createdAt: "2026-03-10T10:00:00Z",
  },
  {
    id: 2,
    title: "Design new signal template",
    assignee: "Chris",
    priority: "MED",
    column: "TODO",
    tags: ["design"],
    dueDate: "2026-03-22",
    description: "",
    checklist: [],
    createdAt: "2026-03-11T10:00:00Z",
  },
  {
    id: 3,
    title: "Onboard 10 new angels",
    assignee: "",
    priority: "URGENT",
    column: "TODO",
    tags: ["crm", "sales"],
    dueDate: "2026-03-18",
    description: "Target: 10 angels at 0.5 SOL each",
    checklist: [],
    createdAt: "2026-03-12T10:00:00Z",
  },
  {
    id: 4,
    title: "Coin Factory: launch JAGUARX",
    assignee: "Chris",
    priority: "HIGH",
    column: "IN_PROGRESS",
    tags: ["launch"],
    dueDate: "2026-03-17",
    description: "Coordinate launch with team",
    checklist: [
      { id: 1, text: "Art ready", done: true },
      { id: 2, text: "Socials setup", done: true },
      { id: 3, text: "Deploy contract", done: false },
    ],
    createdAt: "2026-03-13T10:00:00Z",
  },
  {
    id: 5,
    title: "Weekly alpha recap post",
    assignee: "Chris",
    priority: "LOW",
    column: "DONE",
    tags: ["content"],
    dueDate: "2026-03-14",
    description: "",
    checklist: [],
    createdAt: "2026-03-08T10:00:00Z",
  },
];

// ─── UTILS ───────────────────────────────────────────────────
function today() {
  return new Date().toISOString().split("T")[0];
}

function dueDateStyle(dueDate) {
  if (!dueDate) return { color: JK.muted };
  const d = dueDate.split("T")[0];
  const t = today();
  if (d < t) return { color: JK.red, fontWeight: 700 };
  if (d === t) return { color: JK.gold, fontWeight: 700 };
  return { color: JK.muted };
}

function formatDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
}

// ─── KANBAN CARD ─────────────────────────────────────────────
function KanbanCard({ card, onClick, onDragStart }) {
  const pColor = PRIORITY[card.priority]?.color || JK.muted;
  const done = card.checklist.filter(c => c.done).length;
  const total = card.checklist.length;
  const ds = dueDateStyle(card.dueDate);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      style={{
        background: "rgba(22,22,22,0.92)",
        border: `1px solid rgba(245,166,35,0.12)`,
        borderLeft: `4px solid ${pColor}`,
        borderRadius: 10,
        padding: "12px 13px",
        marginBottom: 8,
        cursor: "grab",
        transition: "box-shadow 0.15s, border-color 0.15s",
        userSelect: "none",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 0 0 1px ${pColor}44`;
        e.currentTarget.style.borderColor = `rgba(245,166,35,0.3)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = "rgba(245,166,35,0.12)";
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#e8d5a0", marginBottom: 8, lineHeight: 1.4 }}>
        {card.title}
      </div>

      {/* Assignee pill */}
      {card.assignee && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 20, padding: "2px 8px", marginBottom: 6 }}>
          <span style={{ fontSize: 8, color: JK.gold }}>●</span>
          <span style={{ fontSize: 10, color: JK.gold, fontWeight: 600 }}>{card.assignee}</span>
        </div>
      )}

      {/* Tags */}
      {card.tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
          {card.tags.map(tag => (
            <span key={tag} style={{ fontSize: 9, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "1px 6px", color: "#aaa" }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Priority badge */}
          <span style={{ fontSize: 9, fontWeight: 700, color: pColor, background: `${pColor}18`, border: `1px solid ${pColor}33`, borderRadius: 4, padding: "1px 5px", letterSpacing: 0.5 }}>
            {card.priority}
          </span>
          {/* Checklist progress */}
          {total > 0 && (
            <span style={{ fontSize: 10, color: done === total ? JK.green : JK.muted }}>
              ☑ {done}/{total}
            </span>
          )}
        </div>
        {/* Due date */}
        {card.dueDate && (
          <span style={{ fontSize: 10, ...ds }}>
            {formatDate(card.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────
function DetailPanel({ card, onClose, onUpdate, onDelete, onMove }) {
  const [title, setTitle] = useState(card.title);
  const [desc, setDesc] = useState(card.description);
  const [assignee, setAssignee] = useState(card.assignee);
  const [priority, setPriority] = useState(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate);
  const [tags, setTags] = useState(card.tags);
  const [tagInput, setTagInput] = useState("");
  const [checklist, setChecklist] = useState(card.checklist);
  const [checkInput, setCheckInput] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // slight delay for slide-in animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function save(patch) {
    onUpdate(card.id, { title, desc, assignee, priority, dueDate, tags, checklist, ...patch });
  }

  function commitSave() {
    onUpdate(card.id, { title, description: desc, assignee, priority, dueDate, tags, checklist });
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    const next = [...tags, t];
    setTags(next);
    setTagInput("");
    onUpdate(card.id, { tags: next });
  }

  function removeTag(tag) {
    const next = tags.filter(t => t !== tag);
    setTags(next);
    onUpdate(card.id, { tags: next });
  }

  function addCheckItem() {
    const t = checkInput.trim();
    if (!t) return;
    const item = { id: Date.now(), text: t, done: false };
    const next = [...checklist, item];
    setChecklist(next);
    setCheckInput("");
    onUpdate(card.id, { checklist: next });
  }

  function toggleCheck(id) {
    const next = checklist.map(c => c.id === id ? { ...c, done: !c.done } : c);
    setChecklist(next);
    onUpdate(card.id, { checklist: next });
  }

  function deleteCheck(id) {
    const next = checklist.filter(c => c.id !== id);
    setChecklist(next);
    onUpdate(card.id, { checklist: next });
  }

  function handleDelete() {
    if (window.confirm(`Delete "${card.title}"? This cannot be undone.`)) {
      onDelete(card.id);
      onClose();
    }
  }

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(245,166,35,0.2)",
    borderRadius: 8,
    padding: "8px 10px",
    color: "#e8d5a0",
    fontSize: 13,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 10, color: JK.muted, letterSpacing: 1, marginBottom: 5, fontWeight: 700, textTransform: "uppercase" };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200,
          opacity: visible ? 1 : 0, transition: "opacity 0.25s",
        }}
      />
      {/* Panel */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: 380,
        background: "rgba(16,16,16,0.98)", borderLeft: `1px solid ${JK.border2}`,
        zIndex: 201, overflowY: "auto", padding: "24px 20px",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s cubic-bezier(.4,0,.2,1)",
        backdropFilter: "blur(20px)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: JK.muted, letterSpacing: 2, fontWeight: 700 }}>TASK DETAIL</span>
          <button onClick={handleClose} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Title</div>
          <textarea
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={() => onUpdate(card.id, { title })}
            rows={2}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Description</div>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            onBlur={() => onUpdate(card.id, { description: desc })}
            rows={3}
            placeholder="Add description..."
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5, color: desc ? "#e8d5a0" : JK.muted }}
          />
        </div>

        {/* Assignee */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Assignee</div>
          <input
            value={assignee}
            onChange={e => setAssignee(e.target.value)}
            onBlur={() => onUpdate(card.id, { assignee })}
            placeholder="Name..."
            style={inputStyle}
          />
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Priority</div>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(PRIORITY).map(([key, { color, label }]) => (
              <button
                key={key}
                onClick={() => { setPriority(key); onUpdate(card.id, { priority: key }); }}
                style={{
                  flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 10, fontWeight: 700,
                  cursor: "pointer", letterSpacing: 0.5, transition: "all 0.15s",
                  background: priority === key ? `${color}28` : "rgba(255,255,255,0.04)",
                  border: priority === key ? `1.5px solid ${color}` : "1px solid rgba(255,255,255,0.08)",
                  color: priority === key ? color : JK.muted,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Due Date</div>
          <input
            type="date"
            value={dueDate}
            onChange={e => { setDueDate(e.target.value); onUpdate(card.id, { dueDate: e.target.value }); }}
            style={{ ...inputStyle, colorScheme: "dark" }}
          />
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Tags</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {tags.map(tag => (
              <span key={tag} style={{ fontSize: 10, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 20, padding: "2px 8px", color: JK.gold, display: "flex", alignItems: "center", gap: 5 }}>
                {tag}
                <span onClick={() => removeTag(tag)} style={{ cursor: "pointer", color: JK.muted, fontSize: 11, lineHeight: 1 }}>✕</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTag()}
              placeholder="Add tag..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addTag} style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: 8, color: JK.gold, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>+</button>
          </div>
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Checklist {checklist.length > 0 && `(${checklist.filter(c => c.done).length}/${checklist.length})`}</div>
          {checklist.length > 0 && (
            <div style={{ marginBottom: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {checklist.map(item => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleCheck(item.id)}
                    style={{ accentColor: JK.green, width: 14, height: 14, cursor: "pointer", flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontSize: 12, color: item.done ? JK.muted : "#ccc", textDecoration: item.done ? "line-through" : "none" }}>{item.text}</span>
                  <button onClick={() => deleteCheck(item.id)} style={{ background: "none", border: "none", color: JK.muted, cursor: "pointer", fontSize: 12, padding: 0, lineHeight: 1 }}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={checkInput}
              onChange={e => setCheckInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCheckItem()}
              placeholder="Add item..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={addCheckItem} style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, color: JK.green, padding: "6px 12px", cursor: "pointer", fontSize: 12 }}>+</button>
          </div>
        </div>

        {/* Move to column */}
        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Move to Column</div>
          <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 4 }}>
            {COLUMNS.map(col => (
              <button
                key={col.id}
                onClick={() => { onMove(card.id, col.id); }}
                style={{
                  flexShrink: 0, padding: "5px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700,
                  cursor: col.id === card.column ? "default" : "pointer", letterSpacing: 0.5, transition: "all 0.15s",
                  background: col.id === card.column ? `${col.color}22` : "rgba(255,255,255,0.04)",
                  border: col.id === card.column ? `1.5px solid ${col.color}` : "1px solid rgba(255,255,255,0.08)",
                  color: col.id === card.column ? col.color : JK.muted,
                }}
              >
                {col.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "rgba(245,166,35,0.1)", marginBottom: 16 }} />

        {/* Delete */}
        <button
          onClick={handleDelete}
          style={{ width: "100%", padding: "10px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: JK.red, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}
        >
          DELETE TASK
        </button>
      </div>
    </>
  );
}

// ─── QUICK ADD FORM ───────────────────────────────────────────
function QuickAddForm({ columnId, onAdd, onCancel }) {
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleAdd() {
    const t = title.trim();
    if (!t) return;
    onAdd({
      id: Date.now(),
      title: t,
      description: "",
      assignee: assignee.trim(),
      priority: "MED",
      tags: [],
      dueDate: "",
      checklist: [],
      column: columnId,
      createdAt: new Date().toISOString(),
    });
    setTitle("");
    setAssignee("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") onCancel();
  }

  return (
    <div style={{ background: "rgba(22,22,22,0.95)", border: `1px solid ${JK.border2}`, borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
      <input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Task title..."
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 6, padding: "7px 10px", color: "#e8d5a0", fontSize: 12, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 7 }}
      />
      <input
        value={assignee}
        onChange={e => setAssignee(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Assignee (optional)..."
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "6px 10px", color: "#aaa", fontSize: 11, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 9 }}
      />
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={handleAdd}
          style={{ flex: 1, padding: "6px 0", background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.4)", borderRadius: 6, color: JK.gold, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}
        >
          ADD
        </button>
        <button
          onClick={onCancel}
          style={{ flex: 1, padding: "6px 0", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: JK.muted, fontSize: 11, cursor: "pointer" }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function OpsBoard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState(SAMPLE_CARDS);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"
  const [selectedCard, setSelectedCard] = useState(null);
  const [quickAdd, setQuickAdd] = useState(null); // column id or null
  const [dragCardId, setDragCardId] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [search, setSearch] = useState("");
  const saveTimer = useRef(null);

  // Load from API on mount
  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => {
        if (data.ok && Array.isArray(data.cards) && data.cards.length) {
          setCards(data.cards);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Debounced save
  useEffect(() => {
    if (!loaded) return;
    setSaveStatus("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => persistCards(cards), 1500);
    return () => clearTimeout(saveTimer.current);
  }, [cards, loaded]);

  async function persistCards(nextCards) {
    try {
      const r = await fetch(API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: nextCards }),
      });
      const data = await r.json();
      setSaveStatus(data.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    } finally {
      setTimeout(() => setSaveStatus(null), 2500);
    }
  }

  // Card update helper — merges patch into the card
  function updateCard(id, patch) {
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    // If the selected card is open, keep it in sync
    if (selectedCard?.id === id) {
      setSelectedCard(prev => prev ? { ...prev, ...patch } : prev);
    }
  }

  function addCard(card) {
    setCards(prev => [...prev, card]);
    setQuickAdd(null);
  }

  function deleteCard(id) {
    setCards(prev => prev.filter(c => c.id !== id));
    setSelectedCard(null);
  }

  function moveCard(id, columnId) {
    updateCard(id, { column: columnId });
    if (selectedCard?.id === id) {
      setSelectedCard(prev => prev ? { ...prev, column: columnId } : prev);
    }
  }

  // Drag & drop
  function handleDragStart(e, cardId) {
    setDragCardId(cardId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e, colId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(colId);
  }

  function handleDrop(e, colId) {
    e.preventDefault();
    if (dragCardId != null) {
      moveCard(dragCardId, colId);
    }
    setDragCardId(null);
    setDragOver(null);
  }

  function handleDragEnd() {
    setDragCardId(null);
    setDragOver(null);
  }

  // Filter logic
  const allAssignees = [...new Set(cards.map(c => c.assignee).filter(Boolean))].sort();
  const allTags = [...new Set(cards.flatMap(c => c.tags))].sort();

  function filteredCards(colId) {
    return cards.filter(c => {
      if (c.column !== colId) return false;
      if (filterAssignee && c.assignee !== filterAssignee) return false;
      if (filterPriority && c.priority !== filterPriority) return false;
      if (filterTag && !c.tags.includes(filterTag)) return false;
      if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }

  const hasFilters = filterAssignee || filterPriority || filterTag || search;

  const saveStatusEl = saveStatus === "saving"
    ? <span style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, background: "rgba(255,255,255,0.05)", padding: "3px 10px", borderRadius: 20 }}>SAVING...</span>
    : saveStatus === "saved"
    ? <span style={{ fontSize: 10, color: JK.green, letterSpacing: 1, background: "rgba(34,197,94,0.08)", padding: "3px 10px", borderRadius: 20 }}>SAVED ✓</span>
    : saveStatus === "error"
    ? <span style={{ fontSize: 10, color: JK.red, letterSpacing: 1, background: "rgba(239,68,68,0.08)", padding: "3px 10px", borderRadius: 20 }}>UNSAVED</span>
    : null;

  const selectStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(245,166,35,0.2)",
    borderRadius: 8,
    padding: "6px 10px",
    color: "#ccc",
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    fontFamily: "inherit",
    colorScheme: "dark",
  };

  const searchStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(245,166,35,0.2)",
    borderRadius: 8,
    padding: "6px 12px",
    color: "#e8d5a0",
    fontSize: 12,
    outline: "none",
    fontFamily: "inherit",
    width: 180,
  };

  return (
    <Shell
      title={<>OPS <span style={{ color: JK.gold }}>BOARD</span></>}
      subtitle="Asana-style kanban for team operations"
      maxWidth={1400}
    >
      {/* Back button + save status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 8, color: JK.gold, fontSize: 12, fontWeight: 700, padding: "7px 16px", cursor: "pointer", letterSpacing: 1 }}
        >
          ← BACK TO HQ
        </button>
        {saveStatusEl}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 24, padding: "14px 16px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(245,166,35,0.1)", borderRadius: 12 }}>
        <span style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, fontWeight: 700, marginRight: 4 }}>FILTER</span>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search tasks..."
          style={searchStyle}
        />

        {/* Assignee filter */}
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} style={selectStyle}>
          <option value="">All Assignees</option>
          {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Priority filter */}
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={selectStyle}>
          <option value="">All Priorities</option>
          {Object.keys(PRIORITY).map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Tag filter */}
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)} style={selectStyle}>
          <option value="">All Tags</option>
          {allTags.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {hasFilters && (
          <button
            onClick={() => { setFilterAssignee(""); setFilterPriority(""); setFilterTag(""); setSearch(""); }}
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: JK.red, fontSize: 11, padding: "6px 12px", cursor: "pointer" }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Kanban board — horizontal scroll */}
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 20, alignItems: "flex-start" }}>
        {COLUMNS.map(col => {
          const colCards = filteredCards(col.id);
          const totalInCol = cards.filter(c => c.column === col.id).length;
          const isDragTarget = dragOver === col.id;

          return (
            <div
              key={col.id}
              onDragOver={e => handleDragOver(e, col.id)}
              onDrop={e => handleDrop(e, col.id)}
              onDragLeave={() => setDragOver(null)}
              style={{
                flexShrink: 0,
                width: 280,
                background: isDragTarget ? `${col.color}08` : "rgba(14,14,14,0.7)",
                border: `1px solid ${isDragTarget ? col.color + "55" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 14,
                padding: "14px 12px",
                minHeight: 300,
                transition: "border-color 0.15s, background 0.15s",
              }}
            >
              {/* Column header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: col.color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: "#ccc", letterSpacing: 1.5, flex: 1 }}>{col.label}</span>
                <span style={{ fontSize: 10, background: `${col.color}22`, border: `1px solid ${col.color}44`, borderRadius: 20, padding: "1px 8px", color: col.color, fontWeight: 700 }}>
                  {totalInCol}
                </span>
              </div>

              {/* Cards */}
              {colCards.length === 0 && !quickAdd && (
                <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.15)", fontSize: 11, letterSpacing: 1 }}>
                  {hasFilters ? "No matches" : "No tasks"}
                </div>
              )}

              {colCards.map(card => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  onClick={() => setSelectedCard(card)}
                  onDragStart={e => handleDragStart(e, card.id)}
                />
              ))}

              {/* Quick add form inline */}
              {quickAdd === col.id && (
                <QuickAddForm
                  columnId={col.id}
                  onAdd={addCard}
                  onCancel={() => setQuickAdd(null)}
                />
              )}

              {/* Add task button */}
              {quickAdd !== col.id && (
                <button
                  onClick={() => setQuickAdd(col.id)}
                  style={{
                    width: "100%", marginTop: 6, padding: "8px 0",
                    background: "transparent", border: `1px dashed rgba(255,255,255,0.1)`,
                    borderRadius: 8, color: "rgba(255,255,255,0.3)", fontSize: 11,
                    cursor: "pointer", transition: "all 0.15s", letterSpacing: 0.5,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = col.color + "66"; e.currentTarget.style.color = col.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                >
                  + Add task
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedCard && (
        <DetailPanel
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={(id, patch) => {
            updateCard(id, patch);
            setSelectedCard(prev => prev ? { ...prev, ...patch } : prev);
          }}
          onDelete={deleteCard}
          onMove={(id, colId) => {
            moveCard(id, colId);
            setSelectedCard(prev => prev ? { ...prev, column: colId } : prev);
          }}
        />
      )}
    </Shell>
  );
}
