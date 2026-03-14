import { useEffect, useMemo, useState } from "react";
import Shell, { JK, Card, Badge, SectionTitle, StatBox, Note } from "../components/JKShell";

const DEFAULT_FEED = "/track-record-feed.json";
const DEFAULT_PNL_SHOWCASE_FEED = "/pnl-showcase-feed.json";

function formatUsd(v) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function formatDate(v) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v));
}

const MASTER_STATS = {
  tokensAnalyzed: "2,000+",
  callsTracked: "1,800+",
  winRate: "35%",
  medianReturn: "+50%",
  reached2x: "~21%",
  totalAlpha: "15,000x+",
};

const CONSISTENCY_ROWS = [
  { period: "1 Month", calls: "1,099", winRate: "34%", median: "48%" },
  { period: "2 Months", calls: "1,856", winRate: "35%", median: "53%" },
  { period: "14 Days", calls: "594", winRate: "35%", median: "53%" },
  { period: "7 Days", calls: "375", winRate: "29%", median: "32%" },
];

const DISTRIBUTION_ROWS = [
  { performance: "> 2x", frequency: "~21%" },
  { performance: "> 5x", frequency: "~8–10%" },
  { performance: "> 10x", frequency: "~4–5%" },
  { performance: "> 100x", frequency: "~1%" },
  { performance: "> 1000x", frequency: "Extremely rare" },
];

const TOP_RESEARCHERS = ["Chris Black", "Kirsasp", "Krumiz", "Kaizzen4k", "Waifuwatchers"];

const VERIFIED_LEADERBOARD = [
  { trader: "Zed", wins: 18, avgRoi: 63.2, totalUsd: 49873 },
  { trader: "Malo", wins: 15, avgRoi: 71.3, totalUsd: 45380 },
  { trader: "Chris", wins: 14, avgRoi: 82.2, totalUsd: 38916 },
  { trader: "Nina", wins: 10, avgRoi: 76.7, totalUsd: 32740 },
  { trader: "Ilyes", wins: 9, avgRoi: 74.3, totalUsd: 27677 },
  { trader: "Luna", wins: 9, avgRoi: 45.4, totalUsd: 16031 },
];

export default function TrophyRoom() {
  const [records, setRecords] = useState([]);
  const [pnlShowcase, setPnlShowcase] = useState([]);

  useEffect(() => {
    const feed = import.meta.env.VITE_TRACK_RECORD_FEED_URL || DEFAULT_FEED;
    fetch(feed)
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]));

    const pnlFeed = import.meta.env.VITE_PNL_SHOWCASE_FEED_URL || DEFAULT_PNL_SHOWCASE_FEED;
    fetch(pnlFeed)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPnlShowcase(data.slice(0, 100));
          return;
        }
        setPnlShowcase([]);
      })
      .catch(() => setPnlShowcase([]));
  }, []);

  const greenRecords = useMemo(
    () => records
      .filter((r) => Number(r.roi) > 0 && Number(r.pnlSol) > 0 && Number(r.pnlUsd) > 0)
      .sort((a, b) => Number(b.roi) - Number(a.roi)),
    [records]
  );

  const top3 = greenRecords.slice(0, 3);

  return (
    <Shell
      title={<>Trophy <span style={{ color: JK.gold }}>Room</span></>}
      subtitle="Page publique · master stats + leaderboard vérifié + PNL showcase visuel"
      maxWidth={1080}
    >
      <Card style={{ marginBottom: 14 }}>
        <SectionTitle style={{ marginBottom: 12 }}>Jungle Kabal <span style={{ color: JK.gold }}>Master Stats</span></SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 12 }}>
          <StatBox value={MASTER_STATS.tokensAnalyzed} label="Tokens analyzed" color="gold" />
          <StatBox value={MASTER_STATS.callsTracked} label="Calls tracked" color="green" />
          <StatBox value={MASTER_STATS.winRate} label="Winning calls" color="green" />
          <StatBox value={MASTER_STATS.medianReturn} label="Median return" color="green" />
          <StatBox value={MASTER_STATS.totalAlpha} label="Cumulative gains" color="gold" />
          <StatBox value={MASTER_STATS.reached2x} label="Calls reaching 2x+" color="green" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 10 }}>
          <div style={{ border: `1px solid ${JK.border2}`, borderRadius: 12, padding: 12, background: "rgba(34,197,94,0.06)" }}>
            <div style={{ fontSize: 12, color: JK.muted, marginBottom: 8 }}>🌙 Moonshot Discoveries</div>
            <div style={{ color: "#eed7a0", fontWeight: 700, marginBottom: 6 }}>5 calls above 1,000x</div>
            <div style={{ fontSize: 13, color: JK.muted }}>2,042x · 1,917x · 1,430x · 1,132x · 928x</div>
          </div>
          <div style={{ border: `1px solid ${JK.border2}`, borderRadius: 12, padding: 12, background: "rgba(244,177,70,0.08)" }}>
            <div style={{ fontSize: 12, color: JK.muted, marginBottom: 8 }}>🔥 Mega Runs</div>
            <div style={{ color: "#eed7a0", fontWeight: 700, marginBottom: 6 }}>15+ calls above 100x</div>
            <div style={{ fontSize: 13, color: JK.muted }}>338x · 313x · 200x · 176x · 170x · 133x · 128x · 105x · 93x</div>
          </div>
          <div style={{ border: `1px solid ${JK.border2}`, borderRadius: 12, padding: 12, background: "rgba(34,197,94,0.06)" }}>
            <div style={{ fontSize: 12, color: JK.muted, marginBottom: 8 }}>💸 Big Winners</div>
            <div style={{ color: "#eed7a0", fontWeight: 700, marginBottom: 6 }}>50+ calls above 20x</div>
            <div style={{ fontSize: 13, color: JK.muted }}>89x · 71x · 67x · 63x · 59x · 48x · 47x · 46x · 42x</div>
          </div>
        </div>

        <div style={{ marginTop: 12, fontSize: 13, color: JK.muted }}>
          Jungle Kabal Research scans thousands of tokens to identify ultra-early memecoin opportunities, often between <span style={{ color: JK.gold }}>$30K–$500K marketcap</span>.
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        <StatBox value={greenRecords.length} label="Calls verts" color="green" />
        <StatBox value={VERIFIED_LEADERBOARD.length} label="Traders classés" color="gold" />
        <StatBox value={`${greenRecords.reduce((a, r) => a + r.pnlSol, 0).toFixed(2)} SOL`} label="PNL vert total" color="green" />
        <StatBox value={formatUsd(greenRecords.reduce((a, r) => a + r.pnlUsd, 0))} label="USD gagné" color="green" />
      </div>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle style={{ marginBottom: 12 }}>Top <span style={{ color: JK.gold }}>Trophies</span></SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
          {top3.map((r, idx) => (
            <div key={r.id} style={{ border: `1px solid ${JK.border2}`, background: "rgba(34,197,94,0.08)", borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Badge color={JK.green}>#{idx + 1} WIN</Badge>
                <span style={{ fontSize: 11, color: JK.muted }}>{formatDate(r.date)}</span>
              </div>
              <div style={{ fontFamily: "'Cinzel', serif", color: "#eed7a0", marginBottom: 4 }}>{r.trader}</div>
              <div style={{ fontSize: 20, color: JK.green, fontWeight: 700 }}>{r.roi.toFixed(1)}%</div>
              <div style={{ fontSize: 12, color: JK.muted }}>{r.market} · {r.pnlSol.toFixed(2)} SOL · {formatUsd(r.pnlUsd)}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle style={{ marginBottom: 12 }}>Stats <span style={{ color: JK.gold }}>Consistency</span></SectionTitle>
        <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
          {CONSISTENCY_ROWS.map((row) => (
            <div key={row.period} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr", gap: 8, border: `1px solid ${JK.border}`, borderRadius: 10, padding: 10 }}>
              <div style={{ color: "#e8d5a0", fontWeight: 700 }}>{row.period}</div>
              <div style={{ color: JK.muted }}>Calls: <span style={{ color: JK.green }}>{row.calls}</span></div>
              <div style={{ color: JK.muted }}>Win: <span style={{ color: JK.green }}>{row.winRate}</span></div>
              <div style={{ color: JK.muted }}>Median: <span style={{ color: JK.green }}>{row.median}</span></div>
            </div>
          ))}
        </div>

        <SectionTitle style={{ marginBottom: 10 }}>Call <span style={{ color: JK.gold }}>Distribution</span></SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 8 }}>
          {DISTRIBUTION_ROWS.map((row) => (
            <div key={row.performance} style={{ border: `1px solid ${JK.border2}`, borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#e8d5a0" }}>{row.performance}</span>
              <strong style={{ color: JK.green }}>{row.frequency}</strong>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle style={{ marginBottom: 12 }}>Top <span style={{ color: JK.gold }}>Researchers</span></SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TOP_RESEARCHERS.map((name) => <Badge key={name} color={JK.gold}>{name}</Badge>)}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle style={{ marginBottom: 12 }}>PNL <span style={{ color: JK.gold }}>Showcase</span></SectionTitle>
        <div style={{ color: JK.muted, fontSize: 12, marginBottom: 12 }}>
          Galerie publique en lecture seule (max 100 items). L&apos;ajout des PNL se fait via le backend admin.
        </div>

        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6, scrollSnapType: "x mandatory" }}>
          {pnlShowcase.map((item) => (
            <div
              key={item.id}
              style={{
                minWidth: 320,
                maxWidth: 340,
                flex: "0 0 auto",
                border: `1px solid ${JK.border2}`,
                borderRadius: 14,
                overflow: "hidden",
                background: "#0d100d",
                scrollSnapAlign: "start",
                boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ position: "relative", aspectRatio: "16 / 10", background: "#111" }}>
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  loading="lazy"
                />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.72) 100%)" }} />
                <div style={{ position: "absolute", left: 10, right: 10, bottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Badge color={JK.green}>{item.multiple}</Badge>
                  <span style={{ color: "#d2d2d2", fontSize: 11 }}>{item.period}</span>
                </div>
              </div>
              <div style={{ padding: 12 }}>
                <div style={{ color: "#eed7a0", fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: JK.muted }}>PNL</span>
                  <span style={{ color: JK.green, fontWeight: 800 }}>{item.pnl}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <SectionTitle style={{ marginBottom: 12 }}>Kabal <span style={{ color: JK.gold }}>Leaderboard</span></SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {VERIFIED_LEADERBOARD.map((row, idx) => (
            <div key={row.trader} style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 12, background: "rgba(15,15,15,0.85)", display: "grid", gridTemplateColumns: "60px 1.2fr 1fr 1fr 1fr", alignItems: "center", gap: 8 }}>
              <div style={{ color: JK.gold, fontWeight: 800 }}>#{idx + 1}</div>
              <div style={{ color: "#e8d5a0", fontWeight: 700 }}>{row.trader}</div>
              <div style={{ fontSize: 12, color: JK.muted }}>Wins: <span style={{ color: JK.green }}>{row.wins}</span></div>
              <div style={{ fontSize: 12, color: JK.muted }}>Avg ROI: <span style={{ color: JK.green }}>{row.avgRoi.toFixed(1)}%</span></div>
              <div style={{ fontSize: 12, color: JK.muted }}>Total: <span style={{ color: JK.green }}>{formatUsd(row.totalUsd)}</span></div>
            </div>
          ))}
        </div>
      </Card>

      <Note>
        Le leaderboard utilise les stats validées du snapshot partagé. Les visuels PNL sont chargés depuis <strong className="gold">/public/pnl-showcase-feed.json</strong> (flux admin, lecture seule côté public).
      </Note>
    </Shell>
  );
}
