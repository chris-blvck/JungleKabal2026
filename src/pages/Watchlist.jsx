// ============================================================
// JUNGLE KABAL — WATCHLIST
// Real-time token tracking for the squad
// ============================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Shell, { JK, Card, Badge, Divider, SectionTitle } from "../components/JKShell";

const INITIAL_TOKENS = [
  { id: "solana",       symbol: "SOL",      name: "Solana",        category: "L1",      alert: 180,  notes: "Main chain" },
  { id: "bonk",         symbol: "BONK",     name: "Bonk",          category: "MEME",    alert: null, notes: "" },
  { id: "jupiter",      symbol: "JUP",      name: "Jupiter",       category: "DEX",     alert: 1.5,  notes: "DEX aggregator play" },
  { id: "raydium",      symbol: "RAY",      name: "Raydium",       category: "DEX",     alert: null, notes: "" },
  { id: "helium",       symbol: "HNT",      name: "Helium",        category: "INFRA",   alert: null, notes: "" },
  { id: "popcat",       symbol: "POPCAT",   name: "Popcat",        category: "MEME",    alert: null, notes: "KKM watchlist" },
];

const CATEGORY_COLORS = {
  L1:    "#9945FF",
  MEME:  "#F5A623",
  DEX:   "#22C55E",
  INFRA: "#3B82F6",
  AI:    "#EC4899",
  DEFI:  "#14B8A6",
};

const G = "#F5A623";
const inp = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "9px 13px", color: "#fff", fontSize: 13, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" };

function PriceTag({ price, change24h }) {
  if (!price) return <span style={{ color: "#333", fontSize: 12 }}>loading…</span>;
  const up = change24h >= 0;
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Space Mono', monospace" }}>
        ${price < 0.01 ? price.toExponential(2) : price < 1 ? price.toFixed(4) : price.toFixed(2)}
      </div>
      <div style={{ fontSize: 10, color: up ? JK.green : JK.red, marginTop: 1 }}>
        {up ? "▲" : "▼"} {Math.abs(change24h || 0).toFixed(1)}%
      </div>
    </div>
  );
}

export default function Watchlist() {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(INITIAL_TOKENS);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [addMode, setAddMode] = useState(false);
  const [newToken, setNewToken] = useState({ id: "", symbol: "", name: "", category: "MEME", alert: "", notes: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    const ids = tokens.map(t => t.id).join(",");
    const fetchPrices = async () => {
      try {
        const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
        const d = await r.json();
        setPrices(d);
        setLoading(false);
      } catch { setLoading(false); }
    };
    fetchPrices();
    const iv = setInterval(fetchPrices, 60000);
    return () => clearInterval(iv);
  }, [tokens]);

  const filtered = tokens.filter(t =>
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  function addToken() {
    if (!newToken.symbol.trim()) return;
    setTokens(prev => [...prev, { ...newToken, id: newToken.id || newToken.symbol.toLowerCase() }]);
    setNewToken({ id: "", symbol: "", name: "", category: "MEME", alert: "", notes: "" });
    setAddMode(false);
  }

  function removeToken(symbol) {
    setTokens(prev => prev.filter(t => t.symbol !== symbol));
  }

  return (
    <Shell
      title={<>WATCH<span style={{ color: JK.gold }}>LIST</span></>}
      subtitle="Real-time token tracking · Squad market intelligence"
      maxWidth={900}
    >
      <button onClick={() => navigate("/")} style={{ background: "transparent", border: "none", color: JK.muted, cursor: "pointer", fontSize: 12, letterSpacing: 1, marginBottom: 20, padding: 0, fontFamily: "inherit" }}>
        ← BACK TO HQ
      </button>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { l: "TOKENS", v: tokens.length },
          { l: "WITH ALERT", v: tokens.filter(t => t.alert).length },
          { l: "MEME", v: tokens.filter(t => t.category === "MEME").length, color: G },
          { l: "SOL PRICE", v: prices["solana"] ? `$${prices["solana"].usd?.toFixed(2)}` : "…", color: "#9945FF" },
        ].map(({ l, v, color }) => (
          <Card key={l} style={{ padding: "12px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 8, color: "#444", letterSpacing: 2, marginBottom: 5, fontFamily: "'Cinzel',serif" }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 900, fontFamily: "'Cinzel Decorative',serif", color: color || G }}>{v}</div>
          </Card>
        ))}
      </div>

      <Card>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <SectionTitle style={{ marginBottom: 0 }}>
            Token <span style={{ color: JK.gold }}>Radar</span>
          </SectionTitle>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ ...inp, width: 160 }} />
            <button onClick={() => setAddMode(!addMode)} style={{
              background: `rgba(245,166,35,0.12)`, border: `1px solid ${G}44`, borderRadius: 8,
              color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "9px 16px", cursor: "pointer", fontFamily: "inherit"
            }}>+ ADD</button>
          </div>
        </div>

        {/* Add form */}
        {addMode && (
          <div style={{ background: "rgba(245,166,35,0.05)", border: `1px solid ${G}22`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginBottom: 12 }}>
              {[
                { k: "symbol", l: "SYMBOL", ph: "BONK" },
                { k: "name",   l: "NAME",   ph: "Bonk" },
                { k: "id",     l: "COINGECKO ID", ph: "bonk" },
                { k: "alert",  l: "ALERT PRICE", ph: "0.05" },
                { k: "notes",  l: "NOTES", ph: "KKM watchlist" },
              ].map(({ k, l, ph }) => (
                <div key={k}>
                  <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 4, fontFamily: "'Cinzel',serif" }}>{l}</div>
                  <input value={newToken[k]} onChange={e => setNewToken(p => ({ ...p, [k]: e.target.value }))}
                    placeholder={ph} style={inp} />
                </div>
              ))}
              <div>
                <div style={{ fontSize: 8, color: "#555", letterSpacing: 2, marginBottom: 4, fontFamily: "'Cinzel',serif" }}>CATEGORY</div>
                <select value={newToken.category} onChange={e => setNewToken(p => ({ ...p, category: e.target.value }))}
                  style={{ ...inp }}>
                  {Object.keys(CATEGORY_COLORS).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={addToken} style={{ background: `rgba(245,166,35,0.15)`, border: `1px solid ${G}44`, borderRadius: 8, color: G, fontWeight: 700, fontSize: 11, letterSpacing: 1.5, padding: "8px 20px", cursor: "pointer", fontFamily: "inherit" }}>ADD TOKEN</button>
              <button onClick={() => setAddMode(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#555", fontSize: 11, letterSpacing: 1, padding: "8px 16px", cursor: "pointer", fontFamily: "inherit" }}>CANCEL</button>
            </div>
          </div>
        )}

        {/* Table header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 100px 80px 1fr 40px", gap: 10, padding: "8px 12px", fontSize: 8, color: "#333", letterSpacing: 2, fontFamily: "'Cinzel',serif", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span>TOKEN</span><span>CATEGORY</span><span>PRICE</span><span>ALERT</span><span>NOTES</span><span></span>
        </div>

        {/* Rows */}
        {filtered.map(t => {
          const data = prices[t.id];
          const price = data?.usd;
          const change = data?.usd_24h_change;
          const catColor = CATEGORY_COLORS[t.category] || G;
          const atAlert = t.alert && price && price >= t.alert * 0.95;
          return (
            <div key={t.symbol} style={{
              display: "grid", gridTemplateColumns: "1fr 90px 100px 80px 1fr 40px", gap: 10,
              padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.03)",
              alignItems: "center", background: atAlert ? "rgba(245,166,35,0.04)" : "transparent",
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.symbol}</div>
                <div style={{ fontSize: 10, color: JK.muted }}>{t.name}</div>
              </div>
              <span style={{ fontSize: 9, color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}33`, borderRadius: 4, padding: "2px 7px", textAlign: "center", fontFamily: "'Cinzel',serif", letterSpacing: 0.5 }}>{t.category}</span>
              <PriceTag price={price} change24h={change} />
              <div style={{ fontSize: 12, color: atAlert ? G : "#444" }}>
                {t.alert ? `$${t.alert}` : "—"}
                {atAlert && <span style={{ fontSize: 8, color: G, display: "block", letterSpacing: 1 }}>⚡ ALERT</span>}
              </div>
              <div style={{ fontSize: 11, color: "#555" }}>{t.notes || "—"}</div>
              <button onClick={() => removeToken(t.symbol)} style={{ background: "transparent", border: "none", color: "#333", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#2a2a2a", fontSize: 12, padding: "24px 0" }}>No tokens match your search</div>
        )}
      </Card>

      <div style={{ marginTop: 12, fontSize: 10, color: "#2a2a2a", textAlign: "center", letterSpacing: 1 }}>
        Prices via CoinGecko · Auto-refresh every 60s
      </div>
    </Shell>
  );
}
