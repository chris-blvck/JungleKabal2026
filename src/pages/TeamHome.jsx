import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, StatBox, Badge, Divider, SectionTitle } from "../components/JKShell";

const SECTIONS = [
  {
    id: "trading",
    label: "TRADING",
    color: JK.green,
    icon: "📈",
    tools: [
      { id: "trade-logs", icon: "📒", name: "TRADE LOGS", desc: "PNL calendar · Trade journal · Win/loss tracking", tag: "P&L", tagColor: JK.green, status: "LIVE", statusColor: JK.green, href: "/finance/pnl-calendar" },
      { id: "narrative-board", icon: "🗺", name: "NARRATIVE BOARD", desc: "Tokens by narrative · AI · RWA · DePIN · Meme", tag: "MARKET", tagColor: "#3B82F6", status: "LIVE", statusColor: JK.green, href: "/narrative-board" },
      { id: "risk-manager", icon: "🛡", name: "RISK MANAGER", desc: "Position sizing · Stops · Exposure tracker", tag: "RISK", tagColor: "#F97316", status: "LIVE", statusColor: JK.green, href: "/risk-manager" },
      { id: "kabal-kredo", icon: "📜", name: "KABAL KREDO", desc: "Our trading rules · Principles · Commandments", tag: "RULES", tagColor: JK.gold, status: "LIVE", statusColor: JK.gold, href: "/trading/kredo" },
    ],
  },
  {
    id: "marketing",
    label: "MARKETING",
    color: "#EC4899",
    icon: "📣",
    tools: [
      { id: "track-record", icon: "🏆", name: "TRACK RECORD", desc: "Top PNL cards · Full archive · Sort by ROI/SOL/USD", tag: "PROOF", tagColor: JK.gold, status: "LIVE", statusColor: JK.green, href: "/finance/track-record" },
      { id: "brand-kit", icon: "🎨", name: "BRAND KIT", desc: "Logos · Colors · Assets · Visual identity", tag: "BRAND", tagColor: "#EC4899", status: "SOON", statusColor: "#6B7280", href: "/brand-kit" },
    ],
  },
  {
    id: "growth",
    label: "GROWTH",
    color: "#A855F7",
    icon: "📊",
    tools: [
      { id: "crm-angel", icon: "🤝", name: "CRM ANGEL", desc: "Deal pipeline · Investor tracking · Angel round", tag: "DEALS", tagColor: "#A855F7", status: "LIVE", statusColor: JK.green, href: "/crm-angel" },
      { id: "angel-ops-dashboard", icon: "🦅", name: "ANGEL OPS DASHBOARD", desc: "Wallet equity · Epoch pulse · Choice center", tag: "OPS", tagColor: JK.gold, status: "MVP", statusColor: JK.gold, href: "/finance/angel-ops" },
    ],
  },
  {
    id: "academy",
    label: "KABAL ACADEMY",
    color: "#60A5FA",
    icon: "🎓",
    tools: [
      { id: "kabal-academy", icon: "🎓", name: "KABAL ACADEMY", desc: "Training modules · Quizzes · Exercises", tag: "LEARN", tagColor: "#60A5FA", status: "LIVE", statusColor: JK.green, href: "/academy" },
    ],
  },
  {
    id: "internal",
    label: "INTERNAL",
    color: "#60A5FA",
    icon: "🏠",
    tools: [
      { id: "sprint-board", icon: "🎯", name: "SPRINT BOARD", desc: "Roadmap · Tasks · Execution rhythm", tag: "OPS", tagColor: JK.gold, status: "LIVE", statusColor: JK.green, href: "/sprint-board" },
      { id: "team-wiki", icon: "📚", name: "TEAM WIKI", desc: "SOPs · Playbooks · Shared knowledge base", tag: "WIKI", tagColor: "#60A5FA", status: "SOON", statusColor: "#6B7280", href: "/wiki" },
    ],
  },
  {
    id: "finances",
    label: "FINANCES",
    color: JK.red,
    icon: "💰",
    tools: [
      { id: "war-room", icon: "⚔️", name: "WAR ROOM", desc: "Revenues · Treasury · Ops costs · Runway", tag: "TREASURY", tagColor: JK.red, status: "LIVE", statusColor: JK.green, href: "/war-room" },
    ],
  },
  {
    id: "onboarding",
    label: "ONBOARDING",
    color: "#F5A623",
    icon: "🚀",
    tools: [
      { id: "kkm-onboarding", icon: "💎", name: "KKM ONBOARDING", desc: "Copytrader setup · Welcome flow · Access guide", tag: "KKM", tagColor: "#F5A623", status: "LIVE", statusColor: JK.green, href: "/onboarding/kkm" },
    ],
  },
];

const MEMBERS = [
  { name: "CHRIS", role: "Commander", initial: "C", online: true },
  { name: "MEMBRE 2", role: "Trader", initial: "T", online: true },
  { name: "MEMBRE 3", role: "Analyst", initial: "A", online: false },
  { name: "MEMBRE 4", role: "Dev", initial: "D", online: true },
  { name: "MEMBRE 5", role: "Hunter", initial: "H", online: false },
];

const AGENT_PIPELINE = ["Scout", "OnChain", "Narrative", "Heat Engine", "Risk", "Trader"];
const UTILITY_COLORS = { TRADING: "#22C55E", ANALYTICS: "#3B82F6", MARKETING: "#EC4899", OPS: "#F59E0B", SECURITY: "#EF4444" };
const PIN_STORAGE_KEY = "jk-home-pins";
const CUSTOM_AGENTS_STORAGE_KEY = "jk-custom-agents";

const AGENT_SECTIONS = [
  {
    id: "active-trading",
    label: "TRADING AGENTS",
    color: JK.green,
    agents: [
      { id: "kabalian-scalper", name: "Kabalian Scalper", role: "Micro-move Executor", utility: "TRADING", costUsd: 2800, avatar: "/avatars/agent-blade.svg", status: "🟢 Running", quick: "Fast in/out scalp execution.", mission: "Scalp short momentum windows with strict stop discipline.", highlights: ["Holds minutes", "Kabal Kredo rules enforced"] },
      { id: "kabalian-breakout-holder", name: "Breakout Conviction", role: "Breakout Holder", utility: "TRADING", costUsd: 3000, avatar: "/avatars/agent-fire.svg", status: "🟢 Running", quick: "Buy breakout and hold few hours max.", mission: "Take high-conviction breakout entries and hold up to a few hours with risk controls.", highlights: ["2:1 R:R minimum", "Kabal Kredo compliance"] },
      { id: "risk-manager-agent", name: "Risk Manager", role: "Exposure Guardian", utility: "SECURITY", costUsd: 2400, avatar: "/avatars/agent-dizzy.svg", status: "🟢 Running", quick: "Protect portfolio limits.", mission: "Keep portfolio risk aligned before and during execution.", highlights: ["Risk caps", "Stop discipline"] },
      { id: "kkm-sentinel", name: "Agent KKM Sentinel", role: "Copytrading Tracker", utility: "ANALYTICS", costUsd: 2100, avatar: "/avatars/agent-hood.svg", status: "🟢 Running", quick: "Track KKM logs and results.", mission: "Track KKM results, logs and copytrading stats in real time.", highlights: ["PnL snapshots", "Error escalation"] },
    ],
  },
  {
    id: "coin-factory",
    label: "COIN FACTORY PIPELINE",
    color: "#A78BFA",
    agents: [
      { id: "token-architect", name: "Token Architect", role: "Idea Engine", utility: "MARKETING", costUsd: 40, avatar: "/avatars/agent-hood.svg", status: "🟡 Maintenance", quick: "Generate name, ticker, lore, tokenomics.", mission: "Create token concept package from prompt to launch-ready brief.", highlights: ["Name + ticker", "Narrative + meme concept"] },
      { id: "brand-generator", name: "Brand Generator", role: "Visual Creator", utility: "MARKETING", costUsd: 120, avatar: "/avatars/agent-love.svg", status: "🟡 Maintenance", quick: "Create logo + visual meme pack.", mission: "Produce social assets for X/Telegram around each token.", highlights: ["Banner + logo", "Meme bundle"] },
      { id: "token-deployer", name: "Token Deployer", role: "On-chain Launcher", utility: "OPS", costUsd: 280, avatar: "/avatars/agent-blade.svg", status: "🟡 Maintenance", quick: "Deploy token + LP flow.", mission: "Handle deployment, mint, liquidity add and lock sequence.", highlights: ["Pump.fun/Raydium", "LP lock checks"] },
    ],
  },
];

function ToolCard({ tool, pinned, onTogglePin }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const disabled = tool.status !== "LIVE";

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && navigate(tool.href)}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          navigate(tool.href);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: hovered ? "rgba(245,166,35,0.06)" : JK.card, border: `1px solid ${hovered ? JK.border2 : JK.border}`, borderRadius: 14, padding: "16px 18px", transition: "all 0.2s", opacity: disabled ? 0.55 : 1, display: "flex", flexDirection: "column", gap: 8, height: "100%", cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>{tool.icon}</span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: 1.2, color: hovered ? JK.gold : "#e8d5a0" }}>{tool.name}</span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onTogglePin(tool.id);
          }}
          style={{ border: "none", background: "transparent", color: pinned ? JK.gold2 : "#6B7280", cursor: "pointer", fontSize: 16 }}
          title={pinned ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          {pinned ? "★" : "☆"}
        </button>
      </div>

      <div style={{ fontSize: 11, color: JK.muted, lineHeight: 1.5, flex: 1 }}>{tool.desc}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: tool.tagColor, background: `${tool.tagColor}18`, border: `1px solid ${tool.tagColor}44`, borderRadius: 5, padding: "2px 7px" }}>{tool.tag}</span>
        <span style={{ fontSize: 9, fontWeight: 700, color: tool.statusColor, letterSpacing: 1 }}>{tool.status}</span>
      </div>
    </div>
  );
}

function SectionRow({ section, pinnedIds, onTogglePin }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 13 }}>{section.icon}</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700, letterSpacing: 3, color: section.color }}>{section.label}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${section.color}44, transparent)` }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
        {section.tools.map((tool) => <ToolCard key={tool.id} tool={tool} pinned={pinnedIds.includes(tool.id)} onTogglePin={onTogglePin} />)}
      </div>
    </div>
  );
}

function MemberChip({ member }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(10,10,10,0.8)", border: `1px solid ${JK.border}`, borderRadius: 12, padding: "10px 14px" }}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(245,166,35,0.10)", border: `1px solid ${JK.border2}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: JK.gold }}>{member.initial}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "#e8d5a0" }}>{member.name}</div>
        <div style={{ fontSize: 11, color: "#D7D7D7" }}>{member.role}</div>
      </div>
      <span style={{ width: 6, height: 6, borderRadius: "50%", marginLeft: "auto", background: member.online ? JK.green : "rgba(255,255,255,0.12)", boxShadow: member.online ? `0 0 6px ${JK.green}` : "none" }} />
    </div>
  );
}

function AgentCard({ agent, data, setData }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);
  const utilityColor = UTILITY_COLORS[agent.utility] || JK.gold;

  const onFileChange = (ev) => {
    const names = Array.from(ev.target.files || []).map((file) => file.name);
    setData((prev) => ({ ...prev, [agent.id]: { ...prev[agent.id], files: names } }));
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${JK.border2}`, borderRadius: 14, padding: 14, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src={agent.avatar} alt={agent.name} style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${JK.border2}`, objectFit: "cover" }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: "#e8d5a0", letterSpacing: 1 }}>{agent.name}</div>
          <div style={{ fontSize: 10, color: "#D7D7D7" }}>{agent.role}</div>
        </div>
        <Badge color={agent.status.includes("🟢") ? JK.green : JK.gold}>{agent.status}</Badge>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        <Badge color={utilityColor}>{agent.utility}</Badge>
        <Badge>${agent.costUsd}/mo</Badge>
      </div>

      <div style={{ fontSize: 12, color: "#F7F7F7", lineHeight: 1.5 }}><strong style={{ color: JK.gold }}>Use:</strong> {agent.quick}</div>
      <div style={{ display: "grid", gap: 2 }}>
        {agent.highlights.map((point) => <div key={point} style={{ fontSize: 10, color: "#BDBDBD" }}>• {point}</div>)}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button type="button" onClick={() => setOpen(!open)} style={{ background: "rgba(245,166,35,0.15)", border: `1px solid ${JK.border2}`, color: JK.gold, borderRadius: 8, padding: "6px 10px", fontSize: 10, cursor: "pointer" }}>{open ? "Hide details" : "Details"}</button>
        <button type="button" onClick={() => fileRef.current?.click()} style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.4)", color: "#93C5FD", borderRadius: 8, padding: "6px 10px", fontSize: 10, cursor: "pointer" }}>Upload TXT/MD/CSV</button>
        <input ref={fileRef} type="file" accept=".txt,.md,.csv,text/plain,text/csv" multiple onChange={onFileChange} style={{ display: "none" }} />
      </div>

      {!!data[agent.id]?.files?.length && <div style={{ fontSize: 10, color: "#E5E7EB" }}>Files: {data[agent.id].files.join(" · ")}</div>}

      <textarea
        placeholder="Team notes (improvements, prompts, ideas)..."
        value={data[agent.id]?.note || ""}
        onChange={(ev) => setData((prev) => ({ ...prev, [agent.id]: { ...prev[agent.id], note: ev.target.value } }))}
        style={{ minHeight: 68, background: "rgba(0,0,0,0.35)", border: `1px solid ${JK.border}`, color: "#F2F2F2", borderRadius: 8, fontSize: 10, padding: 8 }}
      />

      {open && (
        <div style={{ borderTop: `1px solid ${JK.border}`, paddingTop: 8, display: "grid", gap: 4 }}>
          <div style={{ fontSize: 10, color: "#D1D5DB" }}><strong style={{ color: JK.gold }}>Mission:</strong> {agent.mission}</div>
        </div>
      )}
    </div>
  );
}

function AgentSection({ section, data, setData }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, color: section.color, fontFamily: "'Cinzel', serif" }}>{section.label}</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${section.color}66, transparent)` }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
        {section.agents.map((agent) => <AgentCard key={agent.id} agent={agent} data={data} setData={setData} />)}
      </div>
    </div>
  );
}

function emptyAgentForm() {
  return {
    name: "",
    role: "",
    utility: "TRADING",
    costUsd: "",
    quick: "",
    mission: "",
    highlights: "",
    avatar: "",
    docs: [],
  };
}

export default function TeamHome() {
  const [solPrice, setSolPrice] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pinnedIds, setPinnedIds] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(PIN_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [agentNotes, setAgentNotes] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("jk-agent-notes") || "{}");
    } catch {
      return {};
    }
  });
  const [customAgents, setCustomAgents] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(CUSTOM_AGENTS_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [agentForm, setAgentForm] = useState(emptyAgentForm());

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SECTIONS.map((section) => ({
      ...section,
      tools: section.tools.filter((tool) => {
        const matchesQuery = !normalized || `${tool.name} ${tool.desc} ${tool.tag}`.toLowerCase().includes(normalized);
        const matchesStatus = statusFilter === "ALL" || tool.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    })).filter((section) => section.tools.length > 0);
  }, [query, statusFilter]);

  const allTools = useMemo(() => SECTIONS.flatMap((section) => section.tools), []);
  const pinnedTools = useMemo(() => allTools.filter((tool) => pinnedIds.includes(tool.id)), [allTools, pinnedIds]);
  const agentSections = useMemo(() => {
    if (!customAgents.length) return AGENT_SECTIONS;
    return [
      {
        id: "custom-agents",
        label: "CUSTOM AGENTS",
        color: JK.gold,
        agents: customAgents,
      },
      ...AGENT_SECTIONS,
    ];
  }, [customAgents]);

  const filteredSections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return SECTIONS.map((section) => ({
      ...section,
      tools: section.tools.filter((tool) => {
        const matchesQuery = !normalized || `${tool.name} ${tool.desc} ${tool.tag}`.toLowerCase().includes(normalized);
        const matchesStatus = statusFilter === "ALL" || tool.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    })).filter((section) => section.tools.length > 0);
  }, [query, statusFilter]);

  const allTools = useMemo(() => SECTIONS.flatMap((section) => section.tools), []);
  const pinnedTools = useMemo(() => allTools.filter((tool) => pinnedIds.includes(tool.id)), [allTools, pinnedIds]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("jk-agent-notes", JSON.stringify(agentNotes));
  }, [agentNotes]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(CUSTOM_AGENTS_STORAGE_KEY, JSON.stringify(customAgents));
  }, [customAgents]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const data = await res.json();
        if (active && data?.solana?.usd) setSolPrice(data.solana.usd);
      } catch {
        if (active) setSolPrice(null);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const togglePin = (toolId) => {
    setPinnedIds((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]));
  };

  const onAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAgentForm((prev) => ({ ...prev, avatar: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  };

  const onDocsUpload = (event) => {
    const names = Array.from(event.target.files || []).map((file) => file.name);
    setAgentForm((prev) => ({ ...prev, docs: names }));
  };

  const createAgent = () => {
    if (!agentForm.name.trim()) return;
    const highlights = agentForm.highlights
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const created = {
      id: `custom-${Date.now()}`,
      name: agentForm.name.trim(),
      role: agentForm.role.trim() || "Custom Role",
      utility: agentForm.utility,
      costUsd: Number(agentForm.costUsd || 0),
      avatar: agentForm.avatar || "/avatars/agent-hood.svg",
      status: "🟢 Running",
      quick: agentForm.quick.trim() || "Custom quick usage.",
      mission: agentForm.mission.trim() || "Custom mission.",
      highlights: highlights.length ? highlights : ["Custom setup"],
      docs: agentForm.docs,
    };

    setCustomAgents((prev) => [created, ...prev]);
    setAgentForm(emptyAgentForm());
    setShowCreateAgent(false);
  };

  return (
    <Shell title={<>KABAL <span style={{ color: JK.gold }}>HQ</span></>} subtitle="Private Syndicate · Internal Operations Base" maxWidth={940}>
      <Card style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(245,166,35,0.08)", border: `1px solid ${JK.border2}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 11, color: "#FDE68A", letterSpacing: 1 }}>SOL REALTIME</div>
          <div style={{ fontFamily: "'Cinzel', serif", color: "#FFD037", fontSize: 15 }}>{solPrice ? `$${solPrice.toFixed(2)}` : "--"}</div>
          <div style={{ fontSize: 10, color: "#D1D5DB" }}>refresh 60s</div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
        <StatBox value="100K$" label="Sprint target / month" color="green" />
        <StatBox value={String(MEMBERS.length)} label="Membres Jungle Kabal" color="gold" />
        <StatBox value={String(MEMBERS.filter((m) => m.online).length)} label="Team online" color="gold" />
        <StatBox value={String(allTools.filter((tool) => tool.status === "LIVE").length)} label="Modules live" color="gold" />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <SectionTitle style={{ marginBottom: 14 }}>Command <span style={{ color: JK.gold }}>Center</span></SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 16 }}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools, tags, descriptions..."
            style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: `1px solid ${JK.border}`, borderRadius: 10, color: "#F3F4F6", padding: "11px 12px", fontSize: 13 }}
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ background: "rgba(0,0,0,0.4)", border: `1px solid ${JK.border}`, borderRadius: 10, color: "#F3F4F6", padding: "11px 12px", fontSize: 13 }}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="LIVE">Live</option>
            <option value="SOON">Soon</option>
          </select>
        </div>

        {!!pinnedTools.length && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700, letterSpacing: 3, color: JK.gold }}>FAVORITES</span>
              <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${JK.gold}44, transparent)` }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {pinnedTools.map((tool) => <ToolCard key={tool.id} tool={tool} pinned onTogglePin={togglePin} />)}
            </div>
          </div>
        )}

        {!filteredSections.length && (
          <div style={{ border: `1px dashed ${JK.border2}`, borderRadius: 10, padding: 16, color: "#9CA3AF", textAlign: "center" }}>
            No module found with current filters.
          </div>
        )}

        {filteredSections.map((section) => <SectionRow key={section.id} section={section} pinnedIds={pinnedIds} onTogglePin={togglePin} />)}
      </Card>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <a href="/url" style={{ textDecoration: "none" }}><Badge color="#60A5FA">📚 URL DIRECTORY (/url)</Badge></a>
        <Badge color={JK.gold}>Live + Draft + Public links</Badge>
      </div>

      <Card style={{ marginBottom: 20, background: "rgba(28,28,28,0.95)" }}>
        <SectionTitle>Agent <span style={{ color: JK.gold }}>AI</span></SectionTitle>
        <div style={{ fontSize: 12, color: "#DADADA", marginBottom: 12, lineHeight: 1.6 }}>
          Fast cards: role + utility + cost + quick purpose. Use upload for TXT/MD/CSV and team notes directly in each agent card.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <button type="button" onClick={() => setShowCreateAgent((prev) => !prev)} style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.45)", color: "#86EFAC", borderRadius: 8, padding: "7px 12px", fontSize: 11, cursor: "pointer" }}>
            {showCreateAgent ? "Close creator" : "+ Create Agent"}
          </button>
          <Badge color="#93C5FD">Upload photo + docs</Badge>
        </div>

        {showCreateAgent && (
          <div style={{ border: `1px solid ${JK.border2}`, borderRadius: 12, padding: 12, marginBottom: 14, display: "grid", gap: 10, background: "rgba(0,0,0,0.28)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 8 }}>
              <input value={agentForm.name} onChange={(event) => setAgentForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="Agent name" style={{ background: "rgba(0,0,0,0.35)", color: "#F3F4F6", border: `1px solid ${JK.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
              <input value={agentForm.role} onChange={(event) => setAgentForm((prev) => ({ ...prev, role: event.target.value }))} placeholder="Role" style={{ background: "rgba(0,0,0,0.35)", color: "#F3F4F6", border: `1px solid ${JK.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
              <select value={agentForm.utility} onChange={(event) => setAgentForm((prev) => ({ ...prev, utility: event.target.value }))} style={{ background: "rgba(0,0,0,0.35)", color: "#F3F4F6", border: `1px solid ${JK.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                {Object.keys(UTILITY_COLORS).map((utility) => <option key={utility} value={utility}>{utility}</option>)}
              </select>
              <input value={agentForm.costUsd} onChange={(event) => setAgentForm((prev) => ({ ...prev, costUsd: event.target.value }))} placeholder="Cost USD / month" type="number" style={{ background: "rgba(0,0,0,0.35)", color: "#F3F4F6", border: `1px solid ${JK.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
            </div>

            <input value={agentForm.quick} onChange={(event) => setAgentForm((prev) => ({ ...prev, quick: event.target.value }))} placeholder="Quick use" style={{ background: "rgba(0,0,0,0.35)", color: "#F3F4F6", border: `1px solid ${JK.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
            <input value={agentForm.mission} onChange={(event) => setAgentForm((prev) => ({ ...prev, mission: event.target.value }))} placeholder="Mission" style={{ background: "rgba(0,0,0,0.35)", color: "#F3F4F6", border: `1px solid ${JK.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />
            <input value={agentForm.highlights} onChange={(event) => setAgentForm((prev) => ({ ...prev, highlights: event.target.value }))} placeholder="Highlights (comma separated)" style={{ background: "rgba(0,0,0,0.35)", color: "#F3F4F6", border: `1px solid ${JK.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }} />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ fontSize: 11, color: "#D1D5DB" }}>Photo: <input type="file" accept="image/*" onChange={onAvatarUpload} /></label>
              <label style={{ fontSize: 11, color: "#D1D5DB" }}>Documents: <input type="file" multiple onChange={onDocsUpload} /></label>
              {!!agentForm.docs.length && <span style={{ fontSize: 11, color: "#93C5FD" }}>Docs: {agentForm.docs.join(" · ")}</span>}
            </div>

            <div>
              <button type="button" onClick={createAgent} style={{ background: JK.gold, border: "none", color: "#111", borderRadius: 8, padding: "8px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Save Agent
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {AGENT_PIPELINE.map((step, index) => <Badge key={step} color={index === AGENT_PIPELINE.length - 1 ? JK.gold : undefined}>{step}{index < AGENT_PIPELINE.length - 1 ? " ↓" : ""}</Badge>)}
        </div>

        {agentSections.map((section) => <AgentSection key={section.id} section={section} data={agentNotes} setData={setAgentNotes} />)}
      </Card>

      <Card>
        <SectionTitle>Inner <span style={{ color: JK.gold }}>Circle</span></SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 8, marginBottom: 16 }}>
          {MEMBERS.map((m) => <MemberChip key={m.name} member={m} />)}
        </div>
        <Divider />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge color={JK.green}>{MEMBERS.filter((m) => m.online).length} online</Badge>
          <Badge>Epoch 1 — Sprint active</Badge>
          <Badge color={JK.gold}>Execution Mode</Badge>
        </div>
      </Card>
    </Shell>
  );
}
