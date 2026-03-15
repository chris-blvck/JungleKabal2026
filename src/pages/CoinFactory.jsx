// ============================================================
// JUNGLE KABAL — COIN FACTORY
// Token/Meme Coin Launch Pipeline Tracker
// ============================================================
import { useState, useEffect, useRef } from "react";
import Shell, { JK, Card, Badge, SectionTitle, Divider } from "../components/JKShell";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ─── CONSTANTS ───────────────────────────────────────────────

const STAGES = ["CONCEPT", "RESEARCH", "BRANDING", "DEPLOY", "LIVE", "MOON", "EXITED", "DEAD"];

const STAGE_COLOR = {
  CONCEPT:  "#6B7280",
  RESEARCH: "#3B82F6",
  BRANDING: "#A855F7",
  DEPLOY:   "#F59E0B",
  LIVE:     "#22C55E",
  MOON:     "#FFD700",
  EXITED:   "#10B981",
  DEAD:     "#EF4444",
};

const PLATFORMS = ["pump.fun", "raydium", "orca", "manual"];

const KANBAN_COLUMNS = [
  {
    key: "PIPELINE",
    label: "PIPELINE",
    icon: "⚙",
    stages: ["CONCEPT", "RESEARCH", "BRANDING"],
    color: "#A855F7",
    desc: "Pre-launch",
  },
  {
    key: "ACTIVE",
    label: "ACTIVE",
    icon: "🔥",
    stages: ["DEPLOY", "LIVE", "MOON"],
    color: JK.green,
    desc: "Live",
  },
  {
    key: "CLOSED",
    label: "CLOSED",
    icon: "◼",
    stages: ["EXITED", "DEAD"],
    color: JK.muted,
    desc: "Closed",
  },
];

const INITIAL_COINS = [
  {
    id: "coin-001",
    name: "BANANA",
    ticker: "BANA",
    narrative: "Meme Animal",
    platform: "pump.fun",
    stage: "LIVE",
    targetMC: "10M",
    entryMC: "80K",
    contract: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    links: {
      pump: "https://pump.fun/banana",
      dex: "https://dexscreener.com/solana/banana",
      bubblemaps: "",
      twitter: "https://twitter.com/bananatoken",
      telegram: "https://t.me/bananatoken",
    },
    notes: "Strong community, influencer push incoming this weekend. Watch for 2M MC resistance.",
    checklist: [
      { label: "Logo finalized", done: true },
      { label: "Twitter account created", done: true },
      { label: "Telegram group live", done: true },
      { label: "Contract deployed", done: true },
      { label: "Raydium pool added", done: false },
      { label: "CG/CMC listing", done: false },
    ],
    team: ["Rex", "Mia", "Zoro"],
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "coin-002",
    name: "JAGUARX",
    ticker: "JAX",
    narrative: "Jungle Apex Predator",
    platform: "raydium",
    stage: "BRANDING",
    targetMC: "5M",
    entryMC: "",
    contract: "",
    links: {
      pump: "",
      dex: "",
      bubblemaps: "",
      twitter: "https://twitter.com/jaguarxtoken",
      telegram: "",
    },
    notes: "Design phase. Waiting for logo v3 from Kiko. Will deploy end of week if approved.",
    checklist: [
      { label: "Name + ticker locked", done: true },
      { label: "Narrative defined", done: true },
      { label: "Logo v1", done: true },
      { label: "Logo final approved", done: false },
      { label: "Socials created", done: false },
      { label: "Contract deployed", done: false },
    ],
    team: ["Rex", "Kiko"],
    createdAt: "2026-03-08T14:30:00Z",
  },
  {
    id: "coin-003",
    name: "BONKZILLA",
    ticker: "BONKZ",
    narrative: "Giant Degen Monster",
    platform: "pump.fun",
    stage: "EXITED",
    targetMC: "2M",
    entryMC: "50K",
    contract: "3mFkLuGya9d9XYKMf5tBxKBdTDgGuCEzEz6mPBrUGnm1",
    links: {
      pump: "https://pump.fun/bonkzilla",
      dex: "https://dexscreener.com/solana/bonkzilla",
      bubblemaps: "https://bubblemaps.io/bonkzilla",
      twitter: "https://twitter.com/bonkzillatoken",
      telegram: "https://t.me/bonkzilla",
    },
    notes: "Exited at 1.8M MC. 36x from entry. Clean exit, no regrets. Could re-enter on revive.",
    checklist: [
      { label: "Logo finalized", done: true },
      { label: "Launch executed", done: true },
      { label: "Target MC hit", done: true },
      { label: "Exit completed", done: true },
    ],
    team: ["Rex", "Mia", "Luca"],
    createdAt: "2026-02-15T09:00:00Z",
  },
];

// ─── HELPERS ─────────────────────────────────────────────────

function genId() {
  return "coin-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
}

function truncateAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function truncate(str, n) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "…" : str;
}

function initials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── LINK ICONS ──────────────────────────────────────────────

const LINK_DEFS = [
  { key: "pump",       label: "PUMP",   icon: "🚀" },
  { key: "dex",        label: "DEX",    icon: "📊" },
  { key: "bubblemaps", label: "BUBBLE", icon: "🫧" },
  { key: "twitter",    label: "X",      icon: "𝕏" },
  { key: "telegram",   label: "TG",     icon: "✈" },
];

// ─── STAGE BADGE ─────────────────────────────────────────────

function StageBadge({ stage }) {
  const color = STAGE_COLOR[stage] || JK.muted;
  return (
    <span style={{
      display: "inline-block",
      background: `${color}22`,
      border: `1px solid ${color}66`,
      borderRadius: 20,
      fontSize: 9,
      fontWeight: 800,
      color,
      padding: "3px 10px",
      letterSpacing: 1.5,
    }}>
      {stage}
    </span>
  );
}

// ─── PLATFORM BADGE ──────────────────────────────────────────

function PlatformBadge({ platform }) {
  return (
    <span style={{
      display: "inline-block",
      background: `${JK.gold}18`,
      border: `1px solid ${JK.gold}44`,
      borderRadius: 20,
      fontSize: 9,
      fontWeight: 700,
      color: JK.gold,
      padding: "3px 10px",
      letterSpacing: 1,
    }}>
      {platform}
    </span>
  );
}

// ─── CHECKLIST PROGRESS BAR ──────────────────────────────────

function ChecklistBar({ checklist }) {
  if (!checklist || checklist.length === 0) return null;
  const done = checklist.filter((c) => c.done).length;
  const total = checklist.length;
  const pct = total > 0 ? (done / total) * 100 : 0;
  const barColor = pct === 100 ? JK.green : pct > 50 ? JK.gold : "#6B7280";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: JK.muted }}>Checklist</span>
        <span style={{ fontSize: 10, color: barColor, fontWeight: 700 }}>
          {done}/{total}
        </span>
      </div>
      <div style={{
        height: 4,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          background: barColor,
          borderRadius: 2,
          transition: "width 0.3s",
          boxShadow: pct === 100 ? `0 0 8px ${JK.green}88` : "none",
        }} />
      </div>
    </div>
  );
}

// ─── TEAM AVATARS ────────────────────────────────────────────

const AVATAR_COLORS = ["#F5A623", "#22C55E", "#3B82F6", "#A855F7", "#EF4444", "#F59E0B", "#10B981"];

function TeamAvatars({ team }) {
  if (!team || team.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {team.map((member, i) => (
        <div
          key={i}
          title={member}
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: `${AVATAR_COLORS[i % AVATAR_COLORS.length]}22`,
            border: `1px solid ${AVATAR_COLORS[i % AVATAR_COLORS.length]}66`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            fontWeight: 700,
            color: AVATAR_COLORS[i % AVATAR_COLORS.length],
          }}
        >
          {initials(member)}
        </div>
      ))}
    </div>
  );
}

// ─── COIN CARD ───────────────────────────────────────────────

function CoinCard({ coin, onClick }) {
  const [copied, setCopied] = useState(false);
  const stageColor = STAGE_COLOR[coin.stage] || JK.muted;

  function copyContract(e) {
    e.stopPropagation();
    if (!coin.contract) return;
    navigator.clipboard.writeText(coin.contract).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      onClick={() => onClick(coin)}
      style={{
        background: JK.card,
        border: `1px solid ${JK.border}`,
        borderRadius: 14,
        padding: "16px",
        cursor: "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        marginBottom: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = `1px solid ${stageColor}55`;
        e.currentTarget.style.boxShadow = `0 0 16px ${stageColor}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = `1px solid ${JK.border}`;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Left stage color stripe */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 3,
        height: "100%",
        background: stageColor,
        borderRadius: "14px 0 0 14px",
      }} />

      {/* Header row */}
      <div style={{ paddingLeft: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#fff",
                fontFamily: "'Cinzel', serif",
                letterSpacing: 1,
              }}>
                {coin.name}
              </span>
              <span style={{ fontSize: 11, color: JK.gold, fontWeight: 700 }}>
                ${coin.ticker}
              </span>
            </div>
            {coin.narrative && (
              <div style={{ fontSize: 10, color: JK.muted, marginTop: 2 }}>{coin.narrative}</div>
            )}
          </div>
          <StageBadge stage={coin.stage} />
        </div>

        {/* Platform + MC */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <PlatformBadge platform={coin.platform} />
          {coin.targetMC && (
            <span style={{ fontSize: 10, color: JK.muted }}>
              Target: <span style={{ color: JK.gold, fontWeight: 700 }}>{coin.targetMC}</span>
            </span>
          )}
          {coin.entryMC && (
            <span style={{ fontSize: 10, color: JK.muted }}>
              Entry: <span style={{ color: "#3B82F6", fontWeight: 700 }}>{coin.entryMC}</span>
            </span>
          )}
        </div>

        {/* Checklist bar */}
        {coin.checklist && coin.checklist.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <ChecklistBar checklist={coin.checklist} />
          </div>
        )}

        {/* Notes preview */}
        {coin.notes && (
          <div style={{
            fontSize: 11,
            color: JK.muted,
            marginBottom: 10,
            lineHeight: 1.5,
            borderLeft: `2px solid rgba(245,166,35,0.25)`,
            paddingLeft: 8,
          }}>
            {truncate(coin.notes, 80)}
          </div>
        )}

        {/* Contract */}
        {coin.contract && (
          <div
            onClick={copyContract}
            title="Click to copy"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 10,
              color: copied ? JK.green : JK.muted,
              cursor: "pointer",
              marginBottom: 10,
              fontFamily: "monospace",
              transition: "color 0.2s",
            }}
          >
            <span>{copied ? "✓ Copied" : `◈ ${truncateAddr(coin.contract)}`}</span>
          </div>
        )}

        {/* Bottom row: links + team */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Links */}
          <div style={{ display: "flex", gap: 4 }}>
            {LINK_DEFS.map(({ key, label, icon }) =>
              coin.links?.[key] ? (
                <a
                  key={key}
                  href={coin.links[key]}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 26,
                    height: 26,
                    background: `${JK.gold}14`,
                    border: `1px solid ${JK.gold}33`,
                    borderRadius: 6,
                    fontSize: 12,
                    textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${JK.gold}30`;
                    e.currentTarget.style.border = `1px solid ${JK.gold}66`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${JK.gold}14`;
                    e.currentTarget.style.border = `1px solid ${JK.gold}33`;
                  }}
                >
                  {icon}
                </a>
              ) : null
            )}
          </div>
          {/* Team */}
          <TeamAvatars team={coin.team} />
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL ────────────────────────────────────────────

function DetailModal({ coin, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({ ...coin });
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newTeamMember, setNewTeamMember] = useState("");

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function setLink(key, val) {
    setForm((f) => ({ ...f, links: { ...f.links, [key]: val } }));
  }

  function toggleCheck(idx) {
    const updated = form.checklist.map((c, i) =>
      i === idx ? { ...c, done: !c.done } : c
    );
    set("checklist", updated);
  }

  function deleteCheck(idx) {
    set("checklist", form.checklist.filter((_, i) => i !== idx));
  }

  function addCheck() {
    if (!newCheckItem.trim()) return;
    set("checklist", [...(form.checklist || []), { label: newCheckItem.trim(), done: false }]);
    setNewCheckItem("");
  }

  function addTeam() {
    if (!newTeamMember.trim()) return;
    set("team", [...(form.team || []), newTeamMember.trim()]);
    setNewTeamMember("");
  }

  function removeTeam(idx) {
    set("team", form.team.filter((_, i) => i !== idx));
  }

  function handleDelete() {
    if (window.confirm(`Delete ${coin.name} (${coin.ticker})? This cannot be undone.`)) {
      onDelete(coin.id);
    }
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${JK.border2}`,
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    color: "#fff",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
  };

  const labelStyle = {
    fontSize: 10,
    color: JK.muted,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
    display: "block",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111",
          border: `1px solid ${JK.border2}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 720,
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 28,
          position: "relative",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 800, color: JK.gold }}>
              {form.name || "New Coin"} <span style={{ color: JK.muted, fontSize: 13 }}>/ {form.ticker}</span>
            </div>
            <div style={{ fontSize: 11, color: JK.muted, marginTop: 2 }}>Edit launch details</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${JK.border2}`,
              borderRadius: 8,
              color: JK.muted,
              fontSize: 18,
              width: 36,
              height: 36,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Basic fields row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              style={inputStyle}
              value={form.name || ""}
              onChange={(e) => set("name", e.target.value)}
              placeholder="BANANA"
            />
          </div>
          <div>
            <label style={labelStyle}>Ticker</label>
            <input
              style={inputStyle}
              value={form.ticker || ""}
              onChange={(e) => set("ticker", e.target.value.toUpperCase())}
              placeholder="BANA"
            />
          </div>
          <div>
            <label style={labelStyle}>Narrative</label>
            <input
              style={inputStyle}
              value={form.narrative || ""}
              onChange={(e) => set("narrative", e.target.value)}
              placeholder="Meme Animal"
            />
          </div>
        </div>

        {/* Basic fields row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Platform</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.platform || "pump.fun"}
              onChange={(e) => set("platform", e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} style={{ background: "#111" }}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Target MC</label>
            <input
              style={inputStyle}
              value={form.targetMC || ""}
              onChange={(e) => set("targetMC", e.target.value)}
              placeholder="10M"
            />
          </div>
          <div>
            <label style={labelStyle}>Entry MC</label>
            <input
              style={inputStyle}
              value={form.entryMC || ""}
              onChange={(e) => set("entryMC", e.target.value)}
              placeholder="80K"
            />
          </div>
        </div>

        {/* Contract */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Contract Address</label>
          <input
            style={{ ...inputStyle, fontFamily: "monospace", fontSize: 12 }}
            value={form.contract || ""}
            onChange={(e) => set("contract", e.target.value)}
            placeholder="0x... or Solana address"
          />
        </div>

        {/* Stage selector */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Stage</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STAGES.map((s) => {
              const active = form.stage === s;
              const color = STAGE_COLOR[s];
              return (
                <button
                  key={s}
                  onClick={() => set("stage", s)}
                  style={{
                    background: active ? `${color}22` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? color + "88" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: active ? color : JK.muted,
                    cursor: "pointer",
                    letterSpacing: 1,
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Links */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Links</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {LINK_DEFS.map(({ key, label, icon }) => (
              <div key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>{icon}</span>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  value={form.links?.[key] || ""}
                  onChange={(e) => setLink(key, e.target.value)}
                  placeholder={label + " URL"}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center" }}>🗺</span>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={form.links?.bubblemaps || ""}
                onChange={(e) => setLink("bubblemaps", e.target.value)}
                placeholder="Bubblemaps URL"
              />
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Checklist</label>
          <div style={{ marginBottom: 8 }}>
            {(form.checklist || []).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "7px 0",
                  borderBottom: `1px solid rgba(255,255,255,0.04)`,
                }}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleCheck(idx)}
                  style={{ cursor: "pointer", accentColor: JK.green, width: 15, height: 15 }}
                />
                <span style={{
                  flex: 1,
                  fontSize: 13,
                  color: item.done ? JK.muted : "#fff",
                  textDecoration: item.done ? "line-through" : "none",
                }}>
                  {item.label}
                </span>
                <button
                  onClick={() => deleteCheck(idx)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#EF444466",
                    cursor: "pointer",
                    fontSize: 14,
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = JK.red; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#EF444466"; }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={newCheckItem}
              onChange={(e) => setNewCheckItem(e.target.value)}
              placeholder="Add checklist item..."
              onKeyDown={(e) => e.key === "Enter" && addCheck()}
            />
            <button
              onClick={addCheck}
              style={{
                background: `${JK.gold}22`,
                border: `1px solid ${JK.gold}55`,
                borderRadius: 8,
                color: JK.gold,
                fontSize: 18,
                width: 40,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            style={{
              ...inputStyle,
              minHeight: 80,
              resize: "vertical",
              lineHeight: 1.6,
            }}
            value={form.notes || ""}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Launch notes, strategy, observations..."
          />
        </div>

        {/* Team */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Team</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {(form.team || []).map((member, i) => (
              <div
                key={i}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: `${AVATAR_COLORS[i % AVATAR_COLORS.length]}18`,
                  border: `1px solid ${AVATAR_COLORS[i % AVATAR_COLORS.length]}44`,
                  borderRadius: 20,
                  padding: "5px 12px",
                  fontSize: 12,
                  color: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  fontWeight: 600,
                }}
              >
                {member}
                <button
                  onClick={() => removeTeam(i)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "currentColor",
                    cursor: "pointer",
                    fontSize: 13,
                    lineHeight: 1,
                    opacity: 0.5,
                    padding: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={newTeamMember}
              onChange={(e) => setNewTeamMember(e.target.value)}
              placeholder="Add team member..."
              onKeyDown={(e) => e.key === "Enter" && addTeam()}
            />
            <button
              onClick={addTeam}
              style={{
                background: `${JK.gold}22`,
                border: `1px solid ${JK.gold}55`,
                borderRadius: 8,
                color: JK.gold,
                fontSize: 18,
                width: 40,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              +
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button
            onClick={handleDelete}
            style={{
              background: `${JK.red}14`,
              border: `1px solid ${JK.red}44`,
              borderRadius: 10,
              padding: "11px 20px",
              color: JK.red,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.5,
            }}
          >
            Delete Coin
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: `1px solid ${JK.border2}`,
                borderRadius: 10,
                padding: "11px 20px",
                color: JK.muted,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              style={{
                background: JK.gold,
                border: "none",
                borderRadius: 10,
                padding: "11px 28px",
                color: "#000",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "'Cinzel', serif",
                letterSpacing: 1,
                boxShadow: `0 0 20px ${JK.gold}40`,
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADD COIN FORM ───────────────────────────────────────────

function AddCoinForm({ onAdd, onClose }) {
  const [form, setForm] = useState({
    name: "",
    ticker: "",
    narrative: "",
    platform: "pump.fun",
    stage: "CONCEPT",
  });

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function handleAdd() {
    if (!form.name.trim() || !form.ticker.trim()) return;
    const coin = {
      id: genId(),
      name: form.name.trim().toUpperCase(),
      ticker: form.ticker.trim().toUpperCase(),
      narrative: form.narrative.trim(),
      platform: form.platform,
      stage: form.stage,
      targetMC: "",
      entryMC: "",
      contract: "",
      links: { pump: "", dex: "", bubblemaps: "", twitter: "", telegram: "" },
      notes: "",
      checklist: [],
      team: [],
      createdAt: new Date().toISOString(),
    };
    onAdd(coin);
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${JK.border2}`,
    borderRadius: 8,
    padding: "9px 12px",
    fontSize: 13,
    color: "#fff",
    outline: "none",
    fontFamily: "'Inter', sans-serif",
  };

  const labelStyle = {
    fontSize: 10,
    color: JK.muted,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 5,
    display: "block",
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111",
          border: `1px solid ${JK.border2}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 480,
          padding: 28,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 17,
            fontWeight: 800,
            color: JK.gold,
            marginBottom: 4,
          }}>
            New Coin
          </div>
          <div style={{ fontSize: 11, color: JK.muted }}>Quick-add to pipeline</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="BANANA"
              autoFocus
            />
          </div>
          <div>
            <label style={labelStyle}>Ticker *</label>
            <input
              style={inputStyle}
              value={form.ticker}
              onChange={(e) => set("ticker", e.target.value.toUpperCase())}
              placeholder="BANA"
            />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Narrative</label>
          <input
            style={inputStyle}
            value={form.narrative}
            onChange={(e) => set("narrative", e.target.value)}
            placeholder="Meme Animal, Political Satire..."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div>
            <label style={labelStyle}>Platform</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.platform}
              onChange={(e) => set("platform", e.target.value)}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p} style={{ background: "#111" }}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Stage</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.stage}
              onChange={(e) => set("stage", e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s} value={s} style={{ background: "#111" }}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${JK.border2}`,
              borderRadius: 10,
              padding: "10px 20px",
              color: JK.muted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!form.name.trim() || !form.ticker.trim()}
            style={{
              background: (!form.name.trim() || !form.ticker.trim()) ? "rgba(245,166,35,0.3)" : JK.gold,
              border: "none",
              borderRadius: 10,
              padding: "10px 26px",
              color: "#000",
              fontSize: 13,
              fontWeight: 800,
              cursor: (!form.name.trim() || !form.ticker.trim()) ? "not-allowed" : "pointer",
              fontFamily: "'Cinzel', serif",
              letterSpacing: 1,
            }}
          >
            Launch It
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────

export default function CoinFactory() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeStageFilter, setActiveStageFilter] = useState("ALL");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const debounceRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Fetch on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/coin-factory`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setCoins(data);
        } else {
          setCoins(INITIAL_COINS);
        }
      })
      .catch(() => {
        setCoins(INITIAL_COINS);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => { isFirstLoad.current = false; }, 100);
      });
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (isFirstLoad.current || loading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus("saving");
    debounceRef.current = setTimeout(() => {
      fetch(`${API_BASE}/api/coin-factory`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coins),
      })
        .then((r) => {
          setSaveStatus(r.ok ? "saved" : "error");
          setTimeout(() => setSaveStatus("idle"), 2000);
        })
        .catch(() => {
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 2000);
        });
    }, 1500);
    return () => clearTimeout(debounceRef.current);
  }, [coins]);

  function handleSave(updated) {
    setCoins((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCoin(null);
  }

  function handleDelete(id) {
    setCoins((prev) => prev.filter((c) => c.id !== id));
    setSelectedCoin(null);
  }

  function handleAdd(coin) {
    setCoins((prev) => [coin, ...prev]);
    setShowAdd(false);
  }

  // Stats
  const total = coins.length;
  const active = coins.filter((c) => ["DEPLOY", "LIVE", "MOON"].includes(c.stage)).length;
  const exited = coins.filter((c) => c.stage === "EXITED").length;
  const dead = coins.filter((c) => c.stage === "DEAD").length;

  // Stage counts
  const stageCount = {};
  STAGES.forEach((s) => { stageCount[s] = coins.filter((c) => c.stage === s).length; });

  // Filter for pipeline
  const displayedCoins = activeStageFilter === "ALL"
    ? coins
    : coins.filter((c) => c.stage === activeStageFilter);

  // Kanban grouping
  function getCoinsForColumn(stages) {
    return coins.filter((c) => stages.includes(c.stage));
  }

  const saveStatusStyle = {
    fontSize: 11,
    color: saveStatus === "saved" ? JK.green : saveStatus === "error" ? JK.red : JK.muted,
    display: "flex",
    alignItems: "center",
    gap: 5,
  };

  return (
    <Shell
      title={<>Coin <span style={{ color: JK.gold }}>Factory</span></>}
      subtitle="Token launch pipeline — track from concept to moon"
      maxWidth={1100}
    >
      {/* Stats bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 12,
        marginBottom: 24,
      }}>
        {[
          { label: "TOTAL COINS", value: total, color: JK.gold },
          { label: "ACTIVE", value: active, color: JK.green },
          { label: "EXITS (WINS)", value: exited, color: "#10B981" },
          { label: "DEAD", value: dead, color: JK.red },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "rgba(20,20,20,0.85)",
              border: `1px solid ${JK.border}`,
              borderRadius: 14,
              padding: "18px 20px",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: 28,
              fontWeight: 900,
              color,
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 1.2, fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar: stage filter tabs + Add button */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        gap: 12,
        flexWrap: "wrap",
      }}>
        {/* Stage filter strip */}
        <div style={{
          display: "flex",
          gap: 6,
          overflowX: "auto",
          paddingBottom: 4,
          flex: 1,
        }}>
          <button
            onClick={() => setActiveStageFilter("ALL")}
            style={{
              background: activeStageFilter === "ALL" ? `${JK.gold}22` : "rgba(255,255,255,0.03)",
              border: `1px solid ${activeStageFilter === "ALL" ? JK.gold + "66" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 10,
              fontWeight: 700,
              color: activeStageFilter === "ALL" ? JK.gold : JK.muted,
              cursor: "pointer",
              whiteSpace: "nowrap",
              letterSpacing: 1,
            }}
          >
            ALL ({total})
          </button>
          {STAGES.map((s) => {
            const active = activeStageFilter === s;
            const color = STAGE_COLOR[s];
            return (
              <button
                key={s}
                onClick={() => setActiveStageFilter(s)}
                style={{
                  background: active ? `${color}22` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${active ? color + "88" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 10,
                  fontWeight: 700,
                  color: active ? color : JK.muted,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  letterSpacing: 1,
                  transition: "all 0.15s",
                }}
              >
                {s} {stageCount[s] > 0 && <span style={{ opacity: 0.7 }}>({stageCount[s]})</span>}
              </button>
            );
          })}
        </div>

        {/* Right side: save status + add button */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={saveStatusStyle}>
            {saveStatus === "saving" && <span>⟳ Saving...</span>}
            {saveStatus === "saved" && <span>✓ Saved</span>}
            {saveStatus === "error" && <span>✗ Save failed</span>}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: JK.gold,
              border: "none",
              borderRadius: 10,
              padding: "10px 20px",
              color: "#000",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'Cinzel', serif",
              letterSpacing: 1.5,
              boxShadow: `0 0 20px ${JK.gold}30`,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            + NEW COIN
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: JK.muted, fontSize: 14 }}>
          Loading pipeline...
        </div>
      ) : activeStageFilter !== "ALL" ? (
        /* Filtered list view */
        <div>
          {displayedCoins.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: 60,
              color: JK.muted,
              fontSize: 13,
              border: `1px dashed ${JK.border2}`,
              borderRadius: 14,
            }}>
              No coins in <strong style={{ color: STAGE_COLOR[activeStageFilter] }}>{activeStageFilter}</strong> stage.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 10,
            }}>
              {displayedCoins.map((coin) => (
                <CoinCard key={coin.id} coin={coin} onClick={setSelectedCoin} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Kanban view */
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          overflowX: "auto",
          minWidth: 0,
        }}>
          {KANBAN_COLUMNS.map((col) => {
            const colCoins = getCoinsForColumn(col.stages);
            return (
              <div key={col.key}>
                {/* Column header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  padding: "10px 14px",
                  background: `${col.color}0D`,
                  border: `1px solid ${col.color}22`,
                  borderRadius: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{col.icon}</span>
                    <div>
                      <div style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: 12,
                        fontWeight: 800,
                        color: col.color,
                        letterSpacing: 2,
                      }}>
                        {col.label}
                      </div>
                      <div style={{ fontSize: 9, color: JK.muted, letterSpacing: 1 }}>{col.desc}</div>
                    </div>
                  </div>
                  <div style={{
                    background: `${col.color}22`,
                    border: `1px solid ${col.color}44`,
                    borderRadius: 20,
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                    color: col.color,
                  }}>
                    {colCoins.length}
                  </div>
                </div>

                {/* Stage sub-labels within column */}
                <div style={{ marginBottom: 8 }}>
                  {col.stages.map((s) => {
                    const cnt = stageCount[s] || 0;
                    if (cnt === 0) return null;
                    return (
                      <div key={s} style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginRight: 6,
                        marginBottom: 4,
                      }}>
                        <div style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: STAGE_COLOR[s],
                        }} />
                        <span style={{ fontSize: 9, color: JK.muted }}>{s} ({cnt})</span>
                      </div>
                    );
                  })}
                </div>

                {/* Cards */}
                <div style={{ minHeight: 120 }}>
                  {colCoins.length === 0 ? (
                    <div style={{
                      border: `1px dashed ${JK.border}`,
                      borderRadius: 12,
                      padding: "28px 16px",
                      textAlign: "center",
                      color: JK.muted,
                      fontSize: 12,
                    }}>
                      No coins
                    </div>
                  ) : (
                    colCoins.map((coin) => (
                      <CoinCard key={coin.id} coin={coin} onClick={setSelectedCoin} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedCoin && (
        <DetailModal
          coin={selectedCoin}
          onClose={() => setSelectedCoin(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
      {showAdd && (
        <AddCoinForm
          onAdd={handleAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </Shell>
  );
}
