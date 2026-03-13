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
        id: "trade-logs",
        icon: "📒",
        name: "TRADE LOGS",
        desc: "PNL calendar · Trade journal · Win/loss tracking",
        tag: "P&L",
        tagColor: JK.green,
        status: "LIVE",
        statusColor: JK.green,
        href: "/finance/pnl-calendar",
      },
      {
        id: "track-record",
        icon: "🏆",
        name: "TRACK RECORD",
        desc: "Top PNL cards · Full archive · Sort by ROI/SOL/USD",
        tag: "PROOF",
        tagColor: JK.gold,
        status: "LIVE",
        statusColor: JK.green,
        href: "/finance/track-record",
      },
      {
        id: "narrative-board",
        icon: "🗺",
        name: "NARRATIVE BOARD",
        desc: "Tokens by narrative · AI · RWA · DePIN · Meme",
        tag: "MARKET",
        tagColor: "#3B82F6",
        status: "LIVE",
        statusColor: JK.green,
        href: "/narrative-board",
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
      {
        id: "kabal-kredo",
        icon: "📜",
        name: "KABAL KREDO",
        desc: "Our trading rules · Principles · Commandments",
        tag: "RULES",
        tagColor: JK.gold,
        status: "LIVE",
        statusColor: JK.gold,
        href: "/trading/kredo",
      },
      {
        id: "kabal-academy",
        icon: "🎓",
        name: "KABAL ACADEMY",
        desc: "Training modules · Quizzes · Exercises",
        tag: "LEARN",
        tagColor: "#60A5FA",
        status: "LIVE",
        statusColor: JK.green,
        href: "/academy",
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
        desc: "Revenues · Treasury · Ops costs · Runway",
        tag: "TREASURY",
        tagColor: JK.red,
        status: "LIVE",
        statusColor: JK.green,
        href: "/war-room",
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
        desc: "90-day goals · Roadmap · Tasks · Epoch 1",
        tag: "OPS",
        tagColor: JK.gold,
        status: "LIVE",
        statusColor: JK.green,
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
        desc: "New member setup · Roles · Access protocols",
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
    color: "#F5A623",
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

const AGENT_PIPELINE = ["Scout", "OnChain", "Narrative", "Heat Engine", "Risk", "Trader"];

const AGENT_SECTIONS = [
  {
    id: "active",
    label: "ACTIVE AGENTS",
    color: JK.green,
    agents: [
      {
        id: "kabalian-scout",
        name: "Kabalian Scout",
        role: "Opportunity Hunter",
        mission: "Detect early Solana memecoin opportunities with strong momentum signals.",
        status: "🟢 Running",
        version: "v1.2",
        owner: "Kabal Core",
        dataSources: ["Dexscreener", "Birdeye", "Telegram alpha groups", "Twitter signals", "On-chain wallet tracking"],
        outputs: ["Token candidates", "Momentum score", "Narrative signals", "Watchlist alerts"],
        rules: ["Ignore liquidity < 30k", "Prioritize holder growth", "Detect volume acceleration", "Reject suspicious activity"],
        access: ["Telegram bot", "API endpoint", "Dashboard module", "Bot: @KabalScoutBot"],
        commands: ["/scan", "/trending", "/watchlist", "/report"],
        logs: ["Detected coins today: 47", "Escalated to analyst: 9", "High score candidates: 3"],
        permissions: ["View: Team", "Execute trades: Admin", "Modify rules: Core devs"],
      },
      {
        id: "kabalian-onchain-analyst",
        name: "Kabalian OnChain Analyst",
        role: "Blockchain Structure Auditor",
        mission: "Evaluate the on-chain safety and structural integrity of memecoins.",
        status: "🟢 Running",
        version: "v1.0",
        owner: "Kabal Core",
        dataSources: ["Solscan", "Helius", "Birdeye", "Solana RPC"],
        outputs: ["OnChain score", "Risk flags", "Structural verdict"],
        rules: ["Check dev wallet allocation", "Check holder concentration", "Verify liquidity safety", "Detect wallet clustering"],
        access: ["Telegram bot", "Dashboard module", "Bot: @KabalChainBot"],
        commands: ["/audit", "/risk", "/holders", "/struct"],
        logs: ["Audits completed today: 18", "Critical flags raised: 4", "Tokens rejected: 6"],
        permissions: ["View: Team", "Execute trades: No", "Modify rules: Core devs"],
      },
      {
        id: "meme-heat-engine",
        name: "Meme Heat Engine",
        role: "Momentum Prioritizer",
        mission: "Rank memecoin opportunities by cross-signal heat and timing quality.",
        status: "🟢 Running",
        version: "v0.9",
        owner: "Trading Desk",
        dataSources: ["Volume leaders", "Social trend trackers", "Whale activity", "Orderflow snapshots"],
        outputs: ["Heat score", "Top narratives", "Priority queue"],
        rules: ["Boost aligned narrative + volume", "Downrank low conviction setups", "Flag sudden reversals"],
        access: ["Dashboard module", "API endpoint"],
        commands: ["/heat", "/queue", "/narratives"],
        logs: ["Tokens ranked: 62", "Tier-1 setups: 8", "Alerts sent: 14"],
        permissions: ["View: Team", "Execute trades: Trader only", "Modify rules: Quant + Core devs"],
      },
      {
        id: "risk-manager-agent",
        name: "Risk Manager",
        role: "Exposure Guardian",
        mission: "Keep portfolio risk aligned with Kabal limits before and during execution.",
        status: "🟢 Running",
        version: "v1.4",
        owner: "Risk Desk",
        dataSources: ["Open positions", "PnL volatility", "Correlation map", "Liquidity conditions"],
        outputs: ["Position limits", "Stop suggestions", "Risk warnings"],
        rules: ["Cap exposure by narrative", "Force stop-loss discipline", "Reduce sizing on volatility spikes"],
        access: ["Dashboard module", "Telegram bot", "Bot: @KabalRiskBot"],
        commands: ["/risk", "/limits", "/stops"],
        logs: ["Risk checks today: 121", "Blocked orders: 5", "Adjusted positions: 11"],
        permissions: ["View: Team", "Execute trades: No", "Modify rules: Risk leads + Core devs"],
      },
      {
        id: "kkm-sentinel",
        name: "Agent KKM Sentinel",
        role: "Copytrading Performance Tracker",
        mission: "Track KKM results, inspect logs, and monitor copytrading stats in real time.",
        status: "🟢 Running",
        version: "v0.8",
        owner: "KKM Ops",
        dataSources: ["Copytrading fills", "Execution logs", "Follower performance", "Error stream"],
        outputs: ["Performance digest", "Incident alerts", "Winrate snapshots", "Daily KKM recap"],
        rules: ["Alert on slippage drift", "Escalate repeated execution errors", "Track per-wallet performance"],
        access: ["Dashboard module", "Telegram bot", "Bot: @KKMSentinelBot"],
        commands: ["/kkm-report", "/logs", "/copy-stats", "/alerts"],
        logs: ["Copytrades processed: 233", "Error alerts: 2", "Daily PnL sync: Completed"],
        permissions: ["View: Team", "Execute trades: No", "Modify rules: KKM ops + Core devs"],
      },
      {
        id: "trader-execution",
        name: "Trader Execution",
        role: "Order Commander",
        mission: "Execute approved setups with latency control and strict risk compliance.",
        status: "🟢 Running",
        version: "v1.1",
        owner: "Trading Desk",
        dataSources: ["Approved signals", "Exchange liquidity", "Risk limits", "Gas + latency monitor"],
        outputs: ["Executed orders", "Fill quality report", "Execution recap"],
        rules: ["Only execute validated signals", "Reject risk breaches", "Optimize entry/exit path"],
        access: ["API endpoint", "Dashboard module"],
        commands: ["/execute", "/fills", "/latency"],
        logs: ["Orders sent: 39", "Average slippage: 0.62%", "Rejected orders: 3"],
        permissions: ["View: Team", "Execute trades: Trader + Admin", "Modify rules: Core devs"],
      },
    ],
  },
  {
    id: "experimental",
    label: "EXPERIMENTAL AGENTS",
    color: "#60A5FA",
    agents: [
      { id: "smart-money-hunter", name: "Smart Money Hunter", role: "Wallet Pattern Miner", mission: "Placeholder for alpha wallet detection and lead scoring.", status: "🟡 Maintenance", version: "v0.2", owner: "R&D" },
      { id: "pump-detection-engine", name: "Pump Detection Engine", role: "Anomaly Detector", mission: "Placeholder for unusual momentum + social divergence monitoring.", status: "🟡 Maintenance", version: "v0.1", owner: "R&D" },
      { id: "narrative-tracker", name: "Narrative Tracker", role: "Theme Mapper", mission: "Placeholder for real-time narrative intelligence and rotation alerts.", status: "🟡 Maintenance", version: "v0.3", owner: "R&D" },
    ],
  },
  {
    id: "disabled",
    label: "DISABLED AGENTS",
    color: "#EF4444",
    agents: [
      { id: "whale-watcher", name: "Whale Watcher", role: "Large Wallet Monitor", mission: "Placeholder for whale movements and impact estimation.", status: "🔴 Offline", version: "v0.5", owner: "Archive" },
      { id: "marketing-forge", name: "Marketing Forge", role: "Content Automator", mission: "Placeholder for campaign generation, drafts, and distribution scheduling.", status: "🔴 Offline", version: "v0.4", owner: "Marketing" },
      { id: "ops-orchestrator", name: "Ops Orchestrator", role: "Internal Workflow Agent", mission: "Placeholder for sprint ops, reminders, and maintenance workflows.", status: "🔴 Offline", version: "v0.4", owner: "Ops" },
    ],
  },
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
        borderRadius: 14, padding: "16px 18px",
        backdropFilter: "blur(10px)", position: "relative", overflow: "hidden",
        transition: "all 0.2s",
        boxShadow: hovered ? `0 0 20px ${JK.gold}14` : "none",
        opacity: disabled ? 0.45 : 1,
        display: "flex", flexDirection: "column", gap: 8, height: "100%",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${JK.border2}, transparent)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: 22 }}>{tool.icon}</span>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: tool.tagColor, background: `${tool.tagColor}18`, border: `1px solid ${tool.tagColor}44`, borderRadius: 5, padding: "2px 7px" }}>
            {tool.tag}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: hovered ? JK.gold : "#e8d5a0", transition: "color 0.2s", marginBottom: 4 }}>
            {tool.name}
          </div>
          <div style={{ fontSize: 11, color: JK.muted, lineHeight: 1.5 }}>{tool.desc}</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: tool.statusColor, display: "inline-block", boxShadow: tool.status === "LIVE" ? `0 0 5px ${tool.statusColor}` : "none" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: tool.statusColor, letterSpacing: 1 }}>{tool.status}</span>
          </div>
          {!disabled && <span style={{ fontSize: 9, color: JK.gold, fontFamily: "'Cinzel', serif", letterSpacing: 1, opacity: hovered ? 1 : 0, transition: "opacity 0.2s" }}>OPEN →</span>}
        </div>
      </div>
    </div>
  );
}

// ─── SECTION ROW ─────────────────────────────────────────────

function SectionRow({ section }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 13 }}>{section.icon}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700, letterSpacing: 3, color: section.color }}>{section.label}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${section.color}44, transparent)` }} />
        <span style={{ fontSize: 9, color: "#333" }}>{section.tools.filter(t => t.status !== "SOON").length} live</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {section.tools.map(tool => <ToolCard key={tool.id} tool={tool} />)}
      </div>
    </div>
  );
}

// ─── MEMBER CHIP ─────────────────────────────────────────────

function MemberChip({ member }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(10,10,10,0.8)", border: `1px solid ${JK.border}`, borderRadius: 12, padding: "10px 14px" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(245,166,35,0.10)", border: `1px solid ${JK.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: JK.gold }}>
        {member.initial}
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#e8d5a0" }}>{member.name}</div>
        <div style={{ fontSize: 10, color: JK.muted }}>{member.role}</div>
      </div>
      <span style={{ width: 6, height: 6, borderRadius: "50%", marginLeft: "auto", background: member.online ? JK.green : "rgba(255,255,255,0.12)", boxShadow: member.online ? `0 0 6px ${JK.green}` : "none", flexShrink: 0 }} />
    </div>
  );
}

function AgentDetailBlock({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ fontSize: 9, letterSpacing: 1.2, color: JK.gold, marginBottom: 5 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 3 }}>
        {items.map(item => (
          <li key={item} style={{ fontSize: 10, color: JK.muted, lineHeight: 1.4 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function AgentCard({ agent, expanded, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: expanded ? "rgba(245,166,35,0.08)" : JK.card,
        border: `1px solid ${expanded ? JK.border2 : JK.border}`,
        borderRadius: 14,
        padding: "14px 16px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${JK.border2}`, display: "grid", placeItems: "center", background: "rgba(245,166,35,0.10)", fontSize: 16 }}>
          🐆
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: 1, color: "#e8d5a0" }}>{agent.name}</div>
          <div style={{ fontSize: 10, color: JK.muted }}>{agent.role}</div>
        </div>
        <span style={{ fontSize: 9, color: JK.gold }}>{expanded ? "HIDE" : "VIEW"}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <Badge color={JK.green}>{agent.status}</Badge>
        <Badge>{agent.version}</Badge>
        <Badge>{agent.owner}</Badge>
      </div>

      <div style={{ fontSize: 10, color: JK.muted, lineHeight: 1.5 }}>
        <span style={{ color: JK.gold }}>Mission:</span> {agent.mission}
      </div>

      {expanded && (
        <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
          <AgentDetailBlock title="DATA SOURCES" items={agent.dataSources} />
          <AgentDetailBlock title="OUTPUTS" items={agent.outputs} />
          <AgentDetailBlock title="RULES" items={agent.rules} />
          <AgentDetailBlock title="ACCESS" items={agent.access} />
          <AgentDetailBlock title="COMMANDS" items={agent.commands} />
          <AgentDetailBlock title="RECENT ACTIVITY" items={agent.logs} />
          <AgentDetailBlock title="PERMISSIONS" items={agent.permissions} />
        </div>
      )}
    </div>
  );
}

function AgentSection({ section, expandedId, setExpandedId }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, color: section.color, fontFamily: "'Cinzel', serif" }}>{section.label}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${section.color}66, transparent)` }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
        {section.agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            expanded={expandedId === agent.id}
            onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── PAGE ────────────────────────────────────────────────────

export default function TeamHome() {
  const [expandedAgentId, setExpandedAgentId] = useState(null);

  return (
    <Shell
      title={<>KABAL <span style={{ color: JK.gold }}>HQ</span></>}
      subtitle="Private Syndicate · Internal Operations Base"
      maxWidth={920}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
        <StatBox value="90"   label="Sprint days"    color="gold" />
        <StatBox value="5"    label="Active members" color="gold" />
        <StatBox value="$31K" label="Sprint target"  color="green" />
        <StatBox value="9"    label="Live tools"     color="gold" badge="↑ LIVE" />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle style={{ marginBottom: 24 }}>
          Command <span style={{ color: JK.gold }}>Center</span>
        </SectionTitle>
        {SECTIONS.map(section => <SectionRow key={section.id} section={section} />)}
      </Card>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle>Agent <span style={{ color: JK.gold }}>AI</span></SectionTitle>
        <div style={{ fontSize: 11, color: JK.muted, marginBottom: 12 }}>
          Multi-agent stack with trading, marketing/content and ops placeholders. Click an agent card to inspect its identity, mission, inputs, outputs, commands, logs and permissions.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {AGENT_PIPELINE.map((step, index) => (
            <Badge key={step} color={index === AGENT_PIPELINE.length - 1 ? JK.gold : undefined}>{step}{index < AGENT_PIPELINE.length - 1 ? " ↓" : ""}</Badge>
          ))}
        </div>

        {AGENT_SECTIONS.map(section => (
          <AgentSection
            key={section.id}
            section={section}
            expandedId={expandedAgentId}
            setExpandedId={setExpandedAgentId}
          />
        ))}
      </Card>

      <Card>
        <SectionTitle>Inner <span style={{ color: JK.gold }}>Circle</span></SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8, marginBottom: 16 }}>
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
