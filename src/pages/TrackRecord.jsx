import { useEffect, useMemo, useState } from "react";
import Shell, { JK, Card, Badge, SectionTitle, StatBox, Note } from "../components/JKShell";

const DEFAULT_FEED = "/track-record-feed.json";
const SORT_OPTIONS = [
  { value: "roi", label: "ROI %" },
  { value: "pnlSol", label: "PNL SOL" },
  { value: "pnlUsd", label: "PNL USD" },
  { value: "date", label: "Date" },
];

function formatUsd(v) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function formatDate(v) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(v));
}

export default function TrackRecord() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("roi");
  const [onlyTeam, setOnlyTeam] = useState(false);

  useEffect(() => {
    const feed = import.meta.env.VITE_TRACK_RECORD_FEED_URL || DEFAULT_FEED;
    fetch(feed)
      .then((res) => res.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch(() => setRecords([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const base = onlyTeam ? records.filter((r) => r.source === "team") : records;
    return [...base].sort((a, b) => {
      if (sortBy === "date") return new Date(b.date) - new Date(a.date);
      return Number(b[sortBy] || 0) - Number(a[sortBy] || 0);
    });
  }, [onlyTeam, records, sortBy]);

  const headline = filtered.slice(0, 3);
  const avgRoi = filtered.length ? filtered.reduce((acc, r) => acc + r.roi, 0) / filtered.length : 0;
  const totalUsd = filtered.reduce((acc, r) => acc + r.pnlUsd, 0);
  const totalSol = filtered.reduce((acc, r) => acc + r.pnlSol, 0);

  return (
    <Shell
      title={<>Track <span style={{ color: JK.gold }}>Record</span></>}
      subtitle="Toutes les cartes PNL de l'équipe · triables en live"
      maxWidth={980}
    >
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0", color: JK.muted }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: 3, color: JK.gold, marginBottom: 12, animation: "marqueeScroll 2s linear infinite" }}>
            ◈ &nbsp; LOADING PNL DATA &nbsp; ◈
          </div>
          <div style={{ width: 200, height: 2, background: `linear-gradient(90deg, transparent, ${JK.gold}, transparent)`, margin: "0 auto", animation: "marqueeScroll 1.5s linear infinite" }} />
        </div>
      )}

      {!loading && records.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 24px", border: `1px dashed rgba(245,166,35,0.2)`, borderRadius: 16 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 14, color: JK.gold, marginBottom: 8, letterSpacing: 2 }}>NO PNL CARDS YET</div>
          <div style={{ fontSize: 12, color: JK.muted, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
            Configure <strong style={{ color: JK.gold }}>VITE_TRACK_RECORD_FEED_URL</strong> or add entries to <strong style={{ color: JK.gold }}>/public/track-record-feed.json</strong>
          </div>
        </div>
      )}

      {!loading && records.length > 0 && (<>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 18 }}>
          <StatBox value={filtered.length} label="PNL cards" color="gold" />
          <StatBox value={`${avgRoi.toFixed(1)}%`} label="ROI moyen" color={avgRoi >= 0 ? "green" : "red"} />
          <StatBox value={`${totalSol.toFixed(2)} SOL`} label="PNL total SOL" color={totalSol >= 0 ? "green" : "red"} />
          <StatBox value={formatUsd(totalUsd)} label="PNL total USD" color={totalUsd >= 0 ? "green" : "red"} />
        </div>

        <Card style={{ marginBottom: 14 }}>
          <SectionTitle style={{ marginBottom: 12 }}>Best <span style={{ color: JK.gold }}>PNL</span></SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
            {headline.map((r) => (
              <div key={r.id} style={{ border: `1px solid ${JK.border2}`, background: "rgba(245,166,35,0.08)", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <Badge color={r.source === "team" ? JK.green : JK.gold}>{r.source.toUpperCase()}</Badge>
                  <span style={{ fontSize: 11, color: JK.muted }}>{formatDate(r.date)}</span>
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", color: "#eed7a0", marginBottom: 4 }}>{r.trader}</div>
                <div style={{ fontSize: 20, color: JK.green, fontWeight: 700 }}>{r.roi.toFixed(1)}%</div>
                <div style={{ fontSize: 12, color: JK.muted }}>{r.pnlSol.toFixed(2)} SOL · {formatUsd(r.pnlUsd)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <SectionTitle style={{ marginBottom: 0 }}>All <span style={{ color: JK.gold }}>PNL Cards</span></SectionTitle>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 11, color: JK.muted }}>
                <input type="checkbox" checked={onlyTeam} onChange={(e) => setOnlyTeam(e.target.checked)} style={{ marginRight: 6 }} />
                Team only
              </label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ background: "#111", color: "#fff", border: `1px solid ${JK.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>Sort by {opt.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 10 }}>
            {filtered.map((r) => (
              <div key={r.id} style={{ border: `1px solid ${JK.border}`, borderRadius: 12, padding: 12, background: "rgba(15,15,15,0.85)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ color: "#e8d5a0", fontSize: 12 }}>{r.trader}</strong>
                  <Badge color={r.source === "team" ? JK.green : JK.gold}>{r.source}</Badge>
                </div>
                <div style={{ fontSize: 11, color: JK.muted, marginBottom: 8 }}>{formatDate(r.date)} · {r.market}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: JK.muted }}>ROI</span>
                  <span style={{ color: r.roi >= 0 ? JK.green : JK.red, fontWeight: 700 }}>{r.roi.toFixed(1)}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: JK.muted }}>SOL</span>
                  <span style={{ color: r.pnlSol >= 0 ? JK.green : JK.red }}>{r.pnlSol.toFixed(2)} SOL</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: JK.muted }}>USD</span>
                  <span style={{ color: r.pnlUsd >= 0 ? JK.green : JK.red }}>{formatUsd(r.pnlUsd)}</span>
                </div>
              </div>
            ))}
          </div>
          <Note>
            Feed auto: configure <strong className="gold">VITE_TRACK_RECORD_FEED_URL</strong> or update <strong className="gold">/public/track-record-feed.json</strong> via Telegram bot / Drive automation.
            Format: <code>{`[{id,trader,source,market,roi,pnlSol,pnlUsd,date}]`}</code>.
          </Note>
        </Card>
      </>)}
    </Shell>
  );
}
