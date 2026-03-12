// ============================================================
// JUNGLE KABAL — ARSENAL
// Scripts, tools & resources
// ============================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const G = "#F5A623";

const TOOLS = [
  {
    category: "TRADING",
    items: [
      { name: "Photon",         desc: "Solana trading terminal — fastest execution",    url: "https://photon-sol.tinyastro.io/", icon: "⚡" },
      { name: "BullX",          desc: "Multi-chain degen terminal",                     url: "https://bullx.io/",                icon: "🐂" },
      { name: "Dexscreener",    desc: "Real-time DEX charts & token discovery",         url: "https://dexscreener.com/",         icon: "📊" },
      { name: "Birdeye",        desc: "Solana analytics + portfolio tracker",           url: "https://birdeye.so/",              icon: "🦅" },
      { name: "GMGN",           desc: "Smart money tracking + sniping",                url: "https://gmgn.ai/",                 icon: "🧠" },
      { name: "Defined",        desc: "Token charts & on-chain analytics",             url: "https://www.defined.fi/",          icon: "📈" },
    ]
  },
  {
    category: "RESEARCH",
    items: [
      { name: "Solscan",        desc: "Solana explorer — verify contracts & wallets",   url: "https://solscan.io/",              icon: "🔍" },
      { name: "Bubblemaps",     desc: "Token holder distribution visualization",        url: "https://bubblemaps.io/",           icon: "🫧" },
      { name: "Rugcheck",       desc: "Token security audit — check before buy",       url: "https://rugcheck.xyz/",            icon: "🛡" },
      { name: "CoinGecko",      desc: "Price data, market cap, token info",            url: "https://coingecko.com/",           icon: "🦎" },
      { name: "Coinglass",      desc: "Liquidations, OI, funding rates",               url: "https://www.coinglass.com/",       icon: "🔮" },
    ]
  },
  {
    category: "SOCIALS",
    items: [
      { name: "Twitter / X",    desc: "Alpha hunting — follow KOLs & CT",             url: "https://x.com/",                  icon: "𝕏" },
      { name: "Telegram",       desc: "Alpha groups & announcements",                  url: "https://t.me/",                   icon: "✈️" },
      { name: "Discord Radar",  desc: "Monitor launch announcements",                  url: "https://discord.com/",            icon: "💬" },
    ]
  },
  {
    category: "OPS",
    items: [
      { name: "Notion",         desc: "Docs, SOPs & team knowledge base",             url: "https://notion.so/",              icon: "📋" },
      { name: "Typeform",       desc: "KKM onboarding forms",                          url: "https://typeform.com/",           icon: "📝" },
      { name: "Loom",           desc: "Video updates for the squad",                   url: "https://loom.com/",               icon: "🎥" },
      { name: "Asana",          desc: "Task & project management",                    url: "https://asana.com/",              icon: "✅" },
    ]
  },
];

const CAT_COLORS = {
  TRADING:  JK.green,
  RESEARCH: "#3B82F6",
  SOCIALS:  "#EC4899",
  OPS:      G,
};

function ToolItem({ item }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: "none", color: "inherit" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
        background: hovered ? "rgba(245,166,35,0.05)" : "rgba(255,255,255,0.015)",
        border: `1px solid ${hovered ? G + "33" : "rgba(255,255,255,0.05)"}`,
        borderRadius: 10, transition: "all 0.15s", cursor: "pointer",
      }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: hovered ? G : "#e8d5a0" }}>{item.name}</div>
          <div style={{ fontSize: 11, color: JK.muted, marginTop: 2 }}>{item.desc}</div>
        </div>
        <span style={{ fontSize: 10, color: G, opacity: hovered ? 1 : 0, transition: "opacity 0.15s", letterSpacing: 1 }}>OPEN →</span>
      </div>
    </a>
  );
}

export default function Arsenal() {
  const navigate = useNavigate();
  const [customTools, setCustomTools] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [draft, setDraft] = useState({ name: "", desc: "", url: "", icon: "🔗", category: "TRADING" });
  const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

  function addTool() {
    if (!draft.name || !draft.url) return;
    setCustomTools(prev => [...prev, { ...draft, id: Date.now() }]);
    setDraft({ name: "", desc: "", url: "", icon: "🔗", category: "TRADING" });
    setAddMode(false);
  }

  const allGroups = [
    ...TOOLS,
    ...(customTools.length ? [{ category: "CUSTOM", items: customTools }] : []),
  ];

  return (
    <Shell
      title={<>ARSE<span style={{ color: JK.gold }}>NAL</span></>}
      subtitle="Tools, scripts & resources — all the squad's weapons"
      maxWidth={920}
    >
      <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: JK.muted, cursor: "pointer", fontSize: 12, letterSpacing: 1, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
        ← BACK TO HQ
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: JK.muted }}>
          {TOOLS.reduce((s, g) => s + g.items.length, 0) + customTools.length} tools · {TOOLS.length + (customTools.length ? 1 : 0)} categories
        </div>
        <button onClick={() => setAddMode(!addMode)} style={{ background: `rgba(245,166,35,0.12)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "9px 18px", cursor: "pointer", fontFamily: "inherit" }}>+ ADD TOOL</button>
      </div>

      {addMode && (
        <Card style={{ marginBottom: 20 }}>
          <SectionTitle>Add <span style={{ color: JK.gold }}>Custom Tool</span></SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 14 }}>
            {[
              { k: "name", l: "NAME", ph: "Tool name" },
              { k: "url",  l: "URL",  ph: "https://..." },
              { k: "desc", l: "DESCRIPTION", ph: "What it does" },
              { k: "icon", l: "EMOJI ICON",  ph: "🔗" },
            ].map(({ k, l, ph }) => (
              <div key={k}>
                <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>{l}</div>
                <input value={draft[k]} onChange={e => setDraft(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} style={inp} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>CATEGORY</div>
              <select value={draft.category} onChange={e => setDraft(p => ({ ...p, category: e.target.value }))} style={inp}>
                {["TRADING","RESEARCH","SOCIALS","OPS","CUSTOM"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addTool} style={{ background: `rgba(245,166,35,0.15)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "9px 20px", cursor: "pointer", fontFamily: "inherit" }}>ADD</button>
            <button onClick={() => setAddMode(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#555", fontSize: 11, letterSpacing: 1, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
          </div>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(400px,1fr))", gap: 20 }}>
        {allGroups.map(group => {
          const catColor = CAT_COLORS[group.category] || G;
          return (
            <Card key={group.category}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 8, color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}33`, borderRadius: 4, padding: "3px 8px", fontFamily: "'Cinzel',serif", letterSpacing: 1 }}>{group.category}</span>
                <span style={{ fontSize: 10, color: "#444" }}>{group.items.length} tools</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {group.items.map(item => <ToolItem key={item.name + (item.url || "")} item={item} />)}
              </div>
            </Card>
          );
        })}
      </div>
    </Shell>
  );
}
