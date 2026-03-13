import { useEffect, useMemo, useState } from "react";
import Shell, { JK, Card, Badge, SectionTitle, StatBox, Note } from "../components/JKShell";

const DEFAULT_FEED = "/track-record-feed.json";

function formatUsd(v) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function formatDate(v) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v));
}

export default function TrophyRoom() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const feed = import.meta.env.VITE_TRACK_RECORD_FEED_URL || DEFAULT_FEED;
    fetch(feed)
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]));
  }, []);

  const greenRecords = useMemo(
    () => records
      .filter((r) => Number(r.roi) > 0 && Number(r.pnlSol) > 0 && Number(r.pnlUsd) > 0)
      .sort((a, b) => Number(b.roi) - Number(a.roi)),
    [records]
  );

  const leaderboard = useMemo(() => {
    const map = new Map();
    greenRecords.forEach((r) => {
      const prev = map.get(r.trader) || { trader: r.trader, wins: 0, totalRoi: 0, totalUsd: 0, totalSol: 0 };
      map.set(r.trader, {
        ...prev,
        wins: prev.wins + 1,
        totalRoi: prev.totalRoi + Number(r.roi || 0),
        totalUsd: prev.totalUsd + Number(r.pnlUsd || 0),
        totalSol: prev.totalSol + Number(r.pnlSol || 0),
      });
    });

    return [...map.values()]
      .map((row) => ({ ...row, avgRoi: row.wins ? row.totalRoi / row.wins : 0 }))
      .sort((a, b) => b.totalUsd - a.totalUsd);
  }, [greenRecords]);

  const top3 = greenRecords.slice(0, 3);

  return (
    <Shell
      title={<>Trophy <span style={{ color: JK.gold }}>Room</span></>}
      subtitle="Page publique · uniquement les calls gagnants (verts) + leaderboard Kabal"
      maxWidth={1080}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
        <StatBox value={greenRecords.length} label="Calls verts" color="green" />
        <StatBox value={leaderboard.length} label="Traders classés" color="gold" />
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
        <SectionTitle style={{ marginBottom: 12 }}>Kabal <span style={{ color: JK.gold }}>Leaderboard</span></SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>
          {leaderboard.map((row, idx) => (
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

      <Card>
        <SectionTitle style={{ marginBottom: 12 }}>Alerts / Calls <span style={{ color: JK.gold }}>Archive</span></SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
          {greenRecords.map((r) => (
            <div key={r.id} style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 12, background: "rgba(15,15,15,0.85)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <strong style={{ color: "#e8d5a0", fontSize: 12 }}>{r.trader}</strong>
                <Badge color={JK.green}>GREEN CALL</Badge>
              </div>
              <div style={{ fontSize: 11, color: JK.muted, marginBottom: 8 }}>{formatDate(r.date)} · {r.market}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: JK.muted }}>ROI</span>
                <span style={{ color: JK.green, fontWeight: 700 }}>{r.roi.toFixed(1)}%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: JK.muted }}>SOL</span>
                <span style={{ color: JK.green }}>{r.pnlSol.toFixed(2)} SOL</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: JK.muted }}>USD</span>
                <span style={{ color: JK.green }}>{formatUsd(r.pnlUsd)}</span>
              </div>
            </div>
          ))}
        </div>

        <Note>
          Cette Trophy Room publique affiche uniquement les trades <strong className="green">verts</strong> (ROI, SOL et USD positifs).
          Le classement est recalculé automatiquement dès que <strong className="gold">/public/track-record-feed.json</strong> est mis à jour.
        </Note>
      </Card>
    </Shell>
  );
}
