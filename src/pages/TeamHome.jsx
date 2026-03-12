// ============================================================
// JUNGLE KABAL — TEAM HOME PAGE
// team.junglekabal.meme · Internal HQ
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, StatBox, Badge, Divider, SectionTitle } from "../components/JKShell";

// ─── SECTIONS ────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "trading",
    label: "TRADING",
    color: JK.green,
    icon: "📈",
    tools: [
      {
        id: "watchlist",
        icon: "👁",
        name: "WATCHLIST",
        desc: "Real-time token tracking · Squad market radar",
        tag: "MARKET",
        tagColor: "#3B82F6",
        status: "LIVE",
        statusColor: JK.green,
        href: "/watchlist",
      },
      {
        id: "risk-manager",
        icon: "🛡",
        name: "RISK MANAGER",
        desc: "Position sizing · Stops · Exposure tracker",
        tag: "RISK",
        tagColor: "#F97316",
        status: "LIVE",
        statusColor: JK.green,
        href: "/risk-manager",
      },
    ],
  },
  {
    id: "finances",
    label: "FINANCES",
    color: JK.red,
    icon: "💰",
    tools: [
      {
        id: "war-room",
        icon: "⚔️",
        name: "WAR ROOM",
        desc: "PNL Calendar · Trade journal · Squad P&L",
        tag: "P&L",
        tagColor: JK.red,
        status: "LIVE",
        statusColor: JK.green,
        href: "/finance/pnl-calendar",
      },
    ],
  },
  {
    id: "sales",
    label: "SALES",
    color: "#A855F7",
    icon: "🤝",
    tools: [
      {
        id: "crm-angel",
        icon: "🤝",
        name: "CRM ANGEL",
        desc: "Deal pipeline · Investor tracking · Angel round",
        tag: "DEALS",
        tagColor: "#A855F7",
        status: "LIVE",
        statusColor: JK.green,
        href: "/crm-angel",
      },
    ],
  },
  {
    id: "internal",
    label: "INTERNAL",
    color: "#60A5FA",
    icon: "🏠",
    tools: [
      {
        id: "sprint-board",
        icon: "🎯",
        name: "SPRINT BOARD",
        desc: "90-day goals · Epoch 1 · March–May 2026",
        tag: "OPS",
        tagColor: JK.gold,
        status: "ACTIVE",
        statusColor: JK.gold,
        href: "/sprint-board",
      },
      {
        id: "team-wiki",
        icon: "📚",
        name: "TEAM WIKI",
        desc: "SOPs · Playbooks · Shared knowledge base",
        tag: "WIKI",
        tagColor: "#60A5FA",
        status: "SOON",
        statusColor: "#444",
        href: "/wiki",
      },
      {
        id: "team-onboarding",
        icon: "🧭",
        name: "TEAM ONBOARDING",
        desc: "New member setup · Roles · Access & protocols",
        tag: "INTERNAL",
        tagColor: "#60A5FA",
        status: "SOON",
        statusColor: "#444",
        href: "/onboarding/team",
      },
    ],
  },
  {
    id: "marketing",
    label: "MARKETING",
    color: "#EC4899",
    icon: "📣",
    tools: [
      {
        id: "brand-kit",
        icon: "🎨",
        name: "BRAND KIT",
        desc: "Logos · Colors · Assets · Visual identity",
        tag: "BRAND",
        tagColor: "#EC4899",
        status: "SOON",
        statusColor: "#444",
        href: "/brand-kit",
      },
    ],
  },
  {
    id: "onboarding",
    label: "ONBOARDING",
    color: G => G,
    icon: "🚀",
    tools: [
      {
        id: "kkm-onboarding",
        icon: "💎",
        name: "KKM ONBOARDING",
        desc: "Copytrader setup · Welcome flow · Access guide",
        tag: "KKM",
        tagColor: "#F5A623",
        status: "LIVE",
        statusColor: JK.green,
        href: "/onboarding/kkm",
      },
    ],
  },
  {
    id: "arsenal",
    label: "ARSENAL",
    color: JK.green,
    icon: "🔧",
    tools: [
      {
        id: "tools",
        icon: "🔧",
        name: "TOOLS & LINKS",
        desc: "Dexscreener · Padre · Stalk.chain · Affiliates",
        tag: "TOOLS",
        tagColor: JK.green,
        status: "LIVE",
        statusColor: JK.gold,
        href: "/arsenal",
      },
    ],
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
  const disabled = tool.status === "SOON";
  return (
    <div
      onClick={() => !disabled && navigate(tool.href)}
      style={{ cursor: disabled ? "default" : "pointer" }}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: hovered ? "rgba(245,166,35,0.06)" : JK.card,
        border: `1px solid ${hovered ? JK.border2 : JK.border}`,
        borderRadius: 14,
        padding: "16px 18px",
        backdropFilter: "blur(10px)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s",
        boxShadow: hovered ? `0 0 20px ${JK.gold}14` : "none",
        opacity: disabled ? 0.5 : 1,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        height: "100%",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${JK.border2}, transparent)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 22 }}>{tool.icon}</span>
          <span style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 1,
            color: tool.tagColor,
            background: `${tool.tagColor}18`,
            border: `1px solid ${tool.tagColor}44`,
            borderRadius: 5, padding: "2px 7px",
          }}>
            {tool.tag}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
            color: hovered ? JK.gold : "#e8d5a0",
            transition: "color 0.2s", marginBottom: 4,
          }}>
            {tool.name}
          </div>
          <div style={{ fontSize: 11, color: JK.muted, lineHeight: 1.5 }}>{tool.desc}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%",
              background: tool.statusColor,
              display: "inline-block",
              boxShadow: tool.status === "LIVE" ? `0 0 5px ${tool.statusColor}` : "none",
            }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: tool.statusColor, letterSpacing: 1 }}>
              {tool.status}
            </span>
          </div>
          {!disabled && (
            <span style={{
              fontSize: 9, color: JK.gold, fontFamily: "'Cinzel', serif",
              letterSpacing: 1, opacity: hovered ? 1 : 0, transition: "opacity 0.2s",
            }}>
              OPEN →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION ROW ─────────────────────────────────────────────

function SectionRow({ section }) {
  const color = typeof section.color === "function" ? "#F5A623" : section.color;
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 14 }}>{section.icon}</span>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 10, fontWeight: 700, letterSpacing: 3,
          color: color,
        }}>
          {section.label}
        </span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${color}33, transparent)` }} />
      </div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 10,
      }}>
        {section.tools.map(tool => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
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
        width: 30, height: 30, borderRadius: "50%",
        background: "rgba(245,166,35,0.10)",
        border: `1px solid ${JK.border2}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700,
        color: JK.gold,
      }}>
        {member.initial}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#e8d5a0" }}>{member.name}</div>
        <div style={{ fontSize: 10, color: JK.muted }}>{member.role}</div>
      </div>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", marginLeft: "auto",
        background: member.online ? JK.green : "rgba(255,255,255,0.12)",
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
      subtitle="Private Syndicate · Internal Operations Base"
      maxWidth={900}
    >
      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
        <StatBox value="90"   label="Sprint days"      color="gold" />
        <StatBox value="5"    label="Active members"   color="gold" />
        <StatBox value="$31K" label="Sprint target"    color="green" />
        <StatBox value="7"    label="Live tools"       color="gold" badge="↑ LIVE" />
      </div>

      {/* SECTIONS */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle style={{ marginBottom: 20 }}>
          Command <span style={{ color: JK.gold }}>Center</span>
        </SectionTitle>
        {SECTIONS.map(section => (
          <SectionRow key={section.id} section={section} />
        ))}
      </Card>

      {/* SQUAD */}
      <Card>
        <SectionTitle>
          Inner <span style={{ color: JK.gold }}>Circle</span>
        </SectionTitle>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 8, marginBottom: 16,
        }}>
          {MEMBERS.map(m => <MemberChip key={m.name} member={m} />)}
        </div>
        <Divider />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge color={JK.green}>3 online</Badge>
          <Badge>Epoch 1 — Sprint active</Badge>
          <Badge color={JK.gold}>90-Day Mode</Badge>
        </div>
      </Card>
    </Shell>
  );
}
