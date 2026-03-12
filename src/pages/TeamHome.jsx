// ============================================================
// JUNGLE KABAL — TEAM HOME PAGE
// team.junglekabal.meme · Accès rapide aux outils du squad
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, StatBox, Badge, Divider, SectionTitle } from "../components/JKShell";

// ─── DATA ───────────────────────────────────────────────────

const TOOLS = [
  {
    id: "watchlist",
    icon: "👁",
    name: "WATCHLIST",
    desc: "Tokens surveillés en temps réel",
    tag: "MARKET",
    tagColor: "#3B82F6",
    status: "LIVE",
    statusColor: JK.green,
    href: "/watchlist",
  },
  {
    id: "war-room",
    icon: "⚔️",
    name: "WAR ROOM",
    desc: "PNL Calendar & journal de trades",
    tag: "FINANCES",
    tagColor: JK.red,
    status: "LIVE",
    statusColor: JK.green,
    href: "/finance/pnl-calendar",
  },
  {
    id: "crm-angel",
    icon: "🤝",
    name: "CRM ANGEL",
    desc: "Pipeline deals & investisseurs",
    tag: "DEALS",
    tagColor: "#A855F7",
    status: "LIVE",
    statusColor: JK.green,
    href: "/crm-angel",
  },
  {
    id: "risk-manager",
    icon: "🛡",
    name: "RISK MANAGER",
    desc: "Exposition, stops & sizing",
    tag: "RISK",
    tagColor: "#F97316",
    status: "LIVE",
    statusColor: JK.green,
    href: "/risk-manager",
  },
  {
    id: "sprint-board",
    icon: "🎯",
    name: "SPRINT BOARD",
    desc: "Objectifs 90 jours · Mars–Mai 2026",
    tag: "OPS",
    tagColor: JK.gold,
    status: "ACTIVE",
    statusColor: JK.gold,
    href: "/sprint-board",
  },
  {
    id: "arsenal",
    icon: "🔧",
    name: "ARSENAL",
    desc: "Outils, scripts & ressources",
    tag: "TOOLS",
    tagColor: JK.green,
    status: "ACTIVE",
    statusColor: JK.gold,
    href: "/arsenal",
  },
];

const MEMBERS = [
  { name: "CHRIS",    role: "Commander", initial: "C", online: true },
  { name: "MEMBRE 2", role: "Trader",    initial: "T", online: true },
  { name: "MEMBRE 3", role: "Analyst",   initial: "A", online: false },
  { name: "MEMBRE 4", role: "Dev",       initial: "D", online: true },
  { name: "MEMBRE 5", role: "Hunter",    initial: "H", online: false },
];

// ─── TOOL CARD ───────────────────────────────────────────────

function ToolCard({ tool }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(tool.href)}
      style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: hovered ? "rgba(245,166,35,0.06)" : JK.card,
        border: `1px solid ${hovered ? JK.border2 : JK.border}`,
        borderRadius: 16,
        padding: "20px 20px 16px",
        backdropFilter: "blur(10px)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s",
        boxShadow: hovered ? `0 0 24px ${JK.gold}18` : "none",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}>
        {/* shimmer top border */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${JK.border2}, transparent)`,
        }} />

        {/* Top row: icon + tag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 24 }}>{tool.icon}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 1,
            color: tool.tagColor,
            background: `${tool.tagColor}18`,
            border: `1px solid ${tool.tagColor}44`,
            borderRadius: 6, padding: "3px 8px",
          }}>
            {tool.tag}
          </span>
        </div>

        {/* Name + desc */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 13, fontWeight: 700, letterSpacing: 2,
            color: hovered ? JK.gold : "#e8d5a0",
            transition: "color 0.2s",
            marginBottom: 5,
          }}>
            {tool.name}
          </div>
          <div style={{ fontSize: 12, color: JK.muted, lineHeight: 1.5 }}>
            {tool.desc}
          </div>
        </div>

        {/* Status + hover arrow */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: tool.statusColor,
              display: "inline-block",
              boxShadow: tool.status === "LIVE" ? `0 0 6px ${tool.statusColor}` : "none",
            }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: tool.statusColor, letterSpacing: 1 }}>
              {tool.status}
            </span>
          </div>
          <span style={{
            fontSize: 10, color: JK.gold, fontFamily: "'Cinzel', serif",
            letterSpacing: 1, opacity: hovered ? 1 : 0, transition: "opacity 0.2s",
          }}>
            ACCÉDER →
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MEMBER CHIP ─────────────────────────────────────────────

function MemberChip({ member }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(10,10,10,0.8)",
      border: `1px solid ${JK.border}`,
      borderRadius: 12, padding: "10px 14px",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "rgba(245,166,35,0.10)",
        border: `1px solid ${JK.border2}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
        color: JK.gold,
      }}>
        {member.initial}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#e8d5a0" }}>
          {member.name}
        </div>
        <div style={{ fontSize: 10, color: JK.muted }}>{member.role}</div>
      </div>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", marginLeft: 4,
        background: member.online ? JK.green : "rgba(255,255,255,0.15)",
        boxShadow: member.online ? `0 0 6px ${JK.green}` : "none",
        flexShrink: 0,
      }} />
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────

export default function TeamHome() {
  return (
    <Shell
      title={<>KABAL <span style={{ color: JK.gold }}>HQ</span></>}
      subtitle="Base opérationnelle · Sprint 90 jours · Mars – Mai 2026"
      maxWidth={860}
    >
      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <StatBox value="90"   label="Jours de sprint"  color="gold" />
        <StatBox value="5"    label="Membres actifs"   color="gold" />
        <StatBox value="$31K" label="Target max"       color="green" />
        <StatBox value="6"    label="Tools actifs"     color="gold" badge="↑ LIVE" />
      </div>

      {/* TOOLS GRID */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>
          Command <span style={{ color: JK.gold }}>Center</span>
        </SectionTitle>
        <p style={{ fontSize: 13, color: JK.muted, marginBottom: 20 }}>
          Accès direct à tous les outils du squad. Clique pour ouvrir.
        </p>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}>
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </Card>

      {/* SQUAD */}
      <Card>
        <SectionTitle>
          Inner <span style={{ color: JK.gold }}>Circle</span>
        </SectionTitle>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 10,
        }}>
          {MEMBERS.map((m) => (
            <MemberChip key={m.name} member={m} />
          ))}
        </div>
        <Divider />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge color={JK.green}>3 online</Badge>
          <Badge>Epoch 1 — Sprint actif</Badge>
          <Badge color={JK.gold}>90-Day Mode</Badge>
        </div>
      </Card>
    </Shell>
  );
}
