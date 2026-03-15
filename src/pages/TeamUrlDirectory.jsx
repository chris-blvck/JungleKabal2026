import Shell, { JK, Card, Badge, SectionTitle } from "../components/JKShell";

const TEAM_LINKS = {
  "Core (Live)": [
    { label: "Team Home", path: "/", status: "LIVE" },
    { label: "P&L Calendar", path: "/finance/pnl-calendar", status: "LIVE" },
    { label: "Track Record", path: "/finance/track-record", status: "LIVE" },
    { label: "Narrative Board", path: "/narrative-board", status: "LIVE" },
    { label: "Risk Manager", path: "/risk-manager", status: "LIVE" },
    { label: "Kabal Kredo", path: "/trading/kredo", status: "LIVE" },
    { label: "War Room", path: "/war-room", status: "LIVE" },
    { label: "CRM Angel", path: "/crm-angel", status: "LIVE" },
    { label: "Sprint Board", path: "/sprint-board", status: "LIVE" },
    { label: "Arsenal", path: "/arsenal", status: "LIVE" },
    { label: "Kabal Academy", path: "/academy", status: "LIVE" },
    { label: "Academy Admin", path: "/academy/admin", status: "LIVE" },
    { label: "Academy Checkout", path: "/academy/checkout", status: "LIVE" },
  ],
  "Team Draft / Soon": [
    { label: "Brand Kit", path: "/brand-kit", status: "DRAFT" },
    { label: "Team Wiki", path: "/wiki", status: "DRAFT" },
    { label: "KKM Onboarding", path: "/onboarding/kkm", status: "DRAFT" },
    { label: "URL Directory (this page)", path: "/url", status: "LIVE" },
  ],
};

const PUBLIC_LINKS = [
  { label: "Public Landing", url: "https://junglekabal.meme/", status: "LIVE" },
  { label: "Die in the Jungle", url: "https://junglekabal.meme/diejungle", status: "LIVE" },
  { label: "Trophy Room", url: "https://junglekabal.meme/trophy-room", status: "LIVE" },
  { label: "Trading Deal", url: "https://junglekabal.meme/trading-deal.html", status: "LIVE" },
];

function UrlRow({ label, href, status }) {
  const isDraft = status === "DRAFT";
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 10,
        textDecoration: "none",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${JK.border}`,
        borderRadius: 12,
        padding: "10px 12px",
        opacity: isDraft ? 0.75 : 1,
      }}
    >
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#F5DE9B", marginBottom: 4 }}>{label}</div>
        <code style={{ fontSize: 11, color: "#D1D5DB" }}>{href}</code>
      </div>
      <Badge color={isDraft ? "#9CA3AF" : JK.green}>{status}</Badge>
    </a>
  );
}

export default function TeamUrlDirectory() {
  return (
    <Shell title={<>KABAL <span style={{ color: JK.gold }}>URL Directory</span></>} subtitle="Toutes les pages Team/Public classées (live + draft)" maxWidth={980}>
      <Card>
        <SectionTitle>Team <span style={{ color: JK.gold }}>Pages</span></SectionTitle>
        {Object.entries(TEAM_LINKS).map(([group, links]) => (
          <div key={group} style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: 2, color: JK.gold, marginBottom: 10 }}>{group.toUpperCase()}</div>
            <div style={{ display: "grid", gap: 8 }}>
              {links.map((link) => <UrlRow key={`${group}-${link.path}`} label={link.label} href={`https://team.junglekabal.meme${link.path}`} status={link.status} />)}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <SectionTitle>Public <span style={{ color: JK.gold }}>Pages</span></SectionTitle>
        <div style={{ display: "grid", gap: 8 }}>
          {PUBLIC_LINKS.map((link) => <UrlRow key={link.url} label={link.label} href={link.url} status={link.status} />)}
        </div>
      </Card>
    </Shell>
  );
}
