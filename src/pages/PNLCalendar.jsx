import { useState, useEffect, useMemo, useCallback } from "react";
import { JKTopNav } from "../components/JKShell";

// ── Logo ────────────────────────────────────────────────────────────────────
const LOGO = "https://i.postimg.cc/fTGb8PWH/logo-jaune-rond.png";

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_SHORT = ["M","T","W","T","F","S","S"];

const TYPES = {
  kkm:   { label:"KKM",   color:"#F5A623", glow:"rgba(245,166,35,0.25)",  bg:"rgba(245,166,35,0.10)",  border:"rgba(245,166,35,0.35)"  },
  kabal: { label:"Kabal", color:"#22C55E", glow:"rgba(34,197,94,0.2)",    bg:"rgba(34,197,94,0.08)",   border:"rgba(34,197,94,0.3)"    },
  lp:    { label:"LP",    color:"#A78BFA", glow:"rgba(167,139,250,0.2)",  bg:"rgba(167,139,250,0.08)", border:"rgba(167,139,250,0.3)"  },
};

const STATUS = {
  win:     { label:"WIN",     color:"#22C55E", bg:"rgba(34,197,94,0.1)"    },
  loss:    { label:"LOSS",    color:"#EF4444", bg:"rgba(239,68,68,0.1)"    },
  moonbag: { label:"MOONBAG", color:"#F5A623", bg:"rgba(245,166,35,0.1)"   },
  open:    { label:"OPEN",    color:"#60A5FA", bg:"rgba(96,165,250,0.1)"   },
};

const TODAY = new Date().toISOString().slice(0,10);

function mkDateKey(y,m,d) { return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function getMonthDays(y,m) { return new Date(y,m+1,0).getDate(); }
function getFirstDOW(y,m) { const d = new Date(y,m,1).getDay(); return d===0?6:d-1; }
function fmtUSD(v) {
  if (v===null||v===undefined) return "—";
  const abs = Math.abs(v);
  const s = abs>=1000 ? (abs/1000).toFixed(1)+"k" : abs.toFixed(0);
  return (v>=0?"+":"-")+"$"+s;
}
function fmtSOL(v) {
  if (!v && v!==0) return "—";
  return (v>=0?"+":"")+parseFloat(v).toFixed(3)+" ◎";
}

const SEED_TRADES = [
  { id:1, date:"2025-03-07", type:"kkm",   ticker:"PEPE2",   entry:2.4,   exit:4.8,   moonbag:0.5,   status:"win",  ca:"",  socials:"",  reason:"Clean x2 setup, took profits perfectly", note:"Initials out at x2" },
  { id:2, date:"2025-03-07", type:"kabal",  ticker:"BONK",    entry:1.0,   exit:0.6,   moonbag:0,     status:"loss", ca:"",  socials:"",  reason:"Didn't respect stop loss", note:"Stop not respected" },
  { id:3, date:"2025-03-10", type:"kabal",  ticker:"WIF",     entry:3.5,   exit:7.2,   moonbag:1.0,   status:"win",  ca:"",  socials:"",  reason:"Great risk/reward ratio entry", note:"Nice asymmetry" },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function JungleKabalPNL() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [view, setView]   = useState("month"); // month | year | journal
  const [trades, setTrades] = useState(SEED_TRADES);
  const [solPrice, setSolPrice] = useState(130);
  const [solLoading, setSolLoading] = useState(true);
  const [filterTypes, setFilterTypes] = useState(["kkm","kabal","lp"]);
  const [filterStatus, setFilterStatus] = useState(["win","loss","moonbag","open"]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [tradeModal, setTradeModal] = useState(null);
  const [nextId, setNextId] = useState(100);
  const [dayNote, setDayNote] = useState({});

  const emptyDraft = { date: TODAY, type:"kabal", ticker:"", entry:"", exit:"", moonbag:"", status:"win", ca:"", socials:"", reason:"", note:"" };
  const [draft, setDraft] = useState(emptyDraft);

  // ── SOL price fetch ─────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const d = await r.json();
        if (d.solana?.usd) { setSolPrice(d.solana.usd); setSolLoading(false); }
      } catch { setSolLoading(false); }
    };
    fetchPrice();
    const iv = setInterval(fetchPrice, 60000);
    return () => clearInterval(iv);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const tradePnlSOL = (t) => {
    const e = parseFloat(t.entry)||0;
    const x = parseFloat(t.exit)||0;
    const mb = parseFloat(t.moonbag)||0;
    if (t.status==="loss") return x - e;
    if (t.status==="win" || t.status==="moonbag") return (x + mb) - e;
    return 0;
  };
  const tradePnlUSD = (t) => tradePnlSOL(t) * solPrice;

  const filteredTrades = useMemo(() => trades.filter(t =>
    filterTypes.includes(t.type) && filterStatus.includes(t.status)
  ), [trades, filterTypes, filterStatus]);

  const tradesByDate = useMemo(() => {
    const map = {};
    filteredTrades.forEach(t => { if (!map[t.date]) map[t.date] = []; map[t.date].push(t); });
    return map;
  }, [filteredTrades]);

  const dayPnlUSD = useCallback((dateKey) => {
    return (tradesByDate[dateKey]||[]).reduce((s,t) => s + tradePnlUSD(t), 0);
  }, [tradesByDate, solPrice]);

  const monthKeys = useMemo(() => {
    const n = getMonthDays(year, month);
    return Array.from({length:n}, (_,i) => mkDateKey(year,month,i+1));
  }, [year,month]);

  const monthStats = useMemo(() => {
    let total=0, wins=0, losses=0, traded=0, kkm=0, kabal=0, lp=0;
    const allT = [];
    monthKeys.forEach(k => {
      const ts = tradesByDate[k]||[];
      if (ts.length) { traded++; ts.forEach(t => { allT.push(t); const p=tradePnlUSD(t); total+=p; if(t.type==="kkm") kkm+=p; if(t.type==="kabal") kabal+=p; if(t.type==="lp") lp+=p; }); }
    });
    allT.forEach(t => { if(t.status==="win") wins++; if(t.status==="loss") losses++; });
    const wr = allT.length ? Math.round((wins/allT.length)*100) : 0;
    return { total, wins, losses, traded, kkm, kabal, lp, wr, total_trades:allT.length };
  }, [tradesByDate, monthKeys, solPrice]);

  const yearMonthTotals = useMemo(() => MONTHS_SHORT.map((_,mi) => {
    const n = getMonthDays(year,mi);
    let t=0;
    for(let d=1;d<=n;d++) t+=dayPnlUSD(mkDateKey(year,mi,d-1));
    return t;
  }), [tradesByDate, year, solPrice]);

  const ytd = yearMonthTotals.reduce((a,b)=>a+b,0);

  // ── Calendar grid ───────────────────────────────────────────────────────────
  const calCells = useMemo(() => {
    const cells = [];
    const offset = getFirstDOW(year,month);
    for(let i=0;i<offset;i++) cells.push(null);
    const n = getMonthDays(year,month);
    for(let d=1;d<=n;d++) cells.push(mkDateKey(year,month,d-1));
    return cells;
  }, [year,month]);

  // ── Trade form ──────────────────────────────────────────────────────────────
  function openNewTrade(date) {
    setDraft({...emptyDraft, date: date||TODAY});
    setTradeModal({mode:"new"});
  }
  function openEditTrade(t) {
    setDraft({...t, ca:t.ca||"", socials:t.socials||"", reason:t.reason||""});
    setTradeModal({mode:"edit"});
  }
  function saveTrade() {
    if (!draft.ticker.trim()) return;
    if (tradeModal?.mode==="edit") {
      setTrades(prev => prev.map(t => t.id===draft.id ? {...draft} : t));
    } else {
      setTrades(prev => [...prev, {...draft, id:nextId}]);
      setNextId(n=>n+1);
    }
    setTradeModal(null);
  }
  function deleteTrade(id) { setTrades(prev=>prev.filter(t=>t.id!==id)); }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const G = "#F5A623";
  const card = { background:"rgba(18,18,18,0.95)", border:"1px solid rgba(245,166,35,0.12)", borderRadius:14, padding:"18px 20px", position:"relative", overflow:"hidden" };
  const topLine = { position:"absolute", top:0, left:0, right:0, height:1, background:"linear-gradient(90deg,transparent,rgba(245,166,35,0.3),transparent)" };
  const inp = { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:8, padding:"10px 14px", color:"#fff", fontSize:14, fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };
  const inpFocus = { background:"rgba(245,166,35,0.06)", border:"1px solid rgba(245,166,35,0.4)" };
  const btn = (bg, fg="#000") => ({ background:bg, color:fg, border:"none", borderRadius:8, padding:"9px 18px", cursor:"pointer", fontWeight:700, fontSize:11, letterSpacing:1.5, fontFamily:"inherit", transition:"opacity 0.15s" });
  const tab = (active, color=G) => ({ ...btn(active ? `${color}22` : "transparent", active ? color : "#444"), border:`1px solid ${active ? color+"55" : "rgba(255,255,255,0.06)"}`, padding:"7px 14px" });

  function toggleFilter(arr, setArr, val) {
    setArr(prev => prev.includes(val) ? (prev.length>1 ? prev.filter(x=>x!==val) : prev) : [...prev,val]);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{minHeight:"100vh", background:"#0A0A0A", color:"#fff", fontFamily:"'Space Mono', monospace"}}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(245,166,35,0.3);border-radius:2px}
        input::placeholder,textarea::placeholder{color:#555}
        input:focus,textarea:focus,select:focus{background:rgba(245,166,35,0.06)!important;border-color:rgba(245,166,35,0.4)!important;outline:none;}
        select option{background:#1a1a1a;color:#fff}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <JKTopNav />
      {/* ── HEADER ── */}
      <div style={{borderBottom:"1px solid rgba(245,166,35,0.12)", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(20px)", padding:"12px 24px", display:"flex", alignItems:"center", gap:16, position:"sticky", top:0, zIndex:100}}>
        <img src={LOGO} alt="Jungle Kabal" style={{width:44, height:44, objectFit:"contain", filter:"drop-shadow(0 0 8px rgba(245,166,35,0.4))"}} />
        <div>
          <div style={{fontFamily:"'Cinzel',serif", fontSize:8, letterSpacing:5, color:G, opacity:0.7}}>JUNGLE KABAL · TRADING SYNDICATE</div>
          <div style={{fontFamily:"'Cinzel Decorative',serif", fontSize:17, fontWeight:900, letterSpacing:1, lineHeight:1.2}}>
            MEGA PNL <span style={{color:G}}>CALENDAR</span>
          </div>
        </div>
        <div style={{marginLeft:"auto", display:"flex", gap:16, alignItems:"center"}}>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9, color:"#444", letterSpacing:2, marginBottom:2}}>SOL LIVE</div>
            <div style={{display:"flex", alignItems:"center", gap:6}}>
              {solLoading && <div style={{width:6,height:6,borderRadius:"50%",background:G,animation:"pulse 1s infinite"}}/>}
              <div style={{fontFamily:"'Cinzel Decorative',serif", fontSize:15, fontWeight:900, color:G}}>${solPrice.toFixed(2)}</div>
              <input type="number" value={solPrice} onChange={e=>setSolPrice(Number(e.target.value)||130)}
                style={{...inp, width:80, fontSize:12, padding:"5px 9px"}} />
            </div>
          </div>
          <div style={{textAlign:"right", borderLeft:"1px solid rgba(245,166,35,0.15)", paddingLeft:16}}>
            <div style={{fontSize:9, color:"#444", letterSpacing:2, marginBottom:2}}>YTD {year}</div>
            <div style={{fontFamily:"'Cinzel Decorative',serif", fontSize:17, fontWeight:900, color:ytd>=0?"#22C55E":"#EF4444"}}>{fmtUSD(ytd)}</div>
          </div>
        </div>
      </div>

      <div style={{padding:"20px 24px", maxWidth:1100, margin:"0 auto"}}>

        {/* ── FILTERS ── */}
        <div style={{...card, marginBottom:16, padding:"12px 16px"}}>
          <div style={topLine}/>
          <div style={{display:"flex", gap:16, alignItems:"center", flexWrap:"wrap"}}>
            <div style={{fontSize:9, color:"#444", letterSpacing:3, fontFamily:"'Cinzel',serif"}}>FILTER</div>
            <div style={{display:"flex", gap:6}}>
              {Object.entries(TYPES).map(([k,t]) => (
                <button key={k} onClick={()=>toggleFilter(filterTypes,setFilterTypes,k)} style={{
                  ...tab(filterTypes.includes(k),t.color), fontSize:10, padding:"5px 12px"
                }}>{t.label}</button>
              ))}
            </div>
            <div style={{width:1, background:"rgba(255,255,255,0.08)", alignSelf:"stretch"}}/>
            <div style={{display:"flex", gap:6}}>
              {Object.entries(STATUS).map(([k,s]) => (
                <button key={k} onClick={()=>toggleFilter(filterStatus,setFilterStatus,k)} style={{
                  ...tab(filterStatus.includes(k),s.color), fontSize:10, padding:"5px 12px"
                }}>{s.label}</button>
              ))}
            </div>
            <button onClick={()=>openNewTrade(selectedDate||TODAY)} style={{...btn(`rgba(245,166,35,0.15)`,G), border:`1px solid rgba(245,166,35,0.4)`, marginLeft:"auto", padding:"7px 16px"}}>
              + ADD TRADE
            </button>
          </div>
        </div>

        {/* ── VIEW TABS + NAV ── */}
        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:10}}>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <button onClick={()=>{ if(view==="month"){month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1)}else setYear(y=>y-1); }} style={{...btn("rgba(255,255,255,0.05)","#666"), padding:"7px 14px"}}>‹</button>
            <div style={{fontFamily:"'Cinzel',serif", fontSize:16, fontWeight:700, color:G, minWidth:180, textAlign:"center", letterSpacing:1}}>
              {view==="month" ? `${MONTHS_EN[month]} ${year}` : `${year}`}
            </div>
            <button onClick={()=>{ if(view==="month"){month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1)}else setYear(y=>y+1); }} style={{...btn("rgba(255,255,255,0.05)","#666"), padding:"7px 14px"}}>›</button>
          </div>
          <div style={{display:"flex", gap:6}}>
            {[["month","MONTH"],["year","YEAR"],["journal","JOURNAL"]].map(([v,l])=>(
              <button key={v} onClick={()=>setView(v)} style={{...tab(view===v), textTransform:"uppercase", letterSpacing:2, fontSize:9}}>{l}</button>
            ))}
          </div>
        </div>

        {/* ══════════════ MONTH VIEW ══════════════ */}
        {view==="month" && (
          <div style={{animation:"fadeIn 0.2s ease"}}>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10, marginBottom:20}}>
              {[
                {l:"MONTH P&L", v:monthStats.total, color:monthStats.total>=0?"#22C55E":"#EF4444"},
                {l:"KKM",       v:monthStats.kkm,   color:TYPES.kkm.color},
                {l:"KABAL",     v:monthStats.kabal, color:TYPES.kabal.color},
                {l:"LP",        v:monthStats.lp,    color:TYPES.lp.color},
                {l:"WIN RATE",  raw:monthStats.wr+"%", color:monthStats.wr>=50?"#22C55E":"#EF4444"},
                {l:"TRADES",    raw:monthStats.total_trades, color:"#888"},
              ].map(({l,v,raw,color})=>(
                <div key={l} style={{...card, padding:"12px 14px"}}>
                  <div style={topLine}/>
                  <div style={{fontSize:8, color:"#444", letterSpacing:2, fontFamily:"'Cinzel',serif", marginBottom:5}}>{l}</div>
                  <div style={{fontFamily:"'Cinzel Decorative',serif", fontSize:16, fontWeight:900, color}}>
                    {v!==undefined ? fmtUSD(v) : raw}
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div style={{...card, padding:0, marginBottom:16}}>
              <div style={topLine}/>
              <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                {DAYS_SHORT.map((d,i)=>(
                  <div key={i} style={{textAlign:"center", padding:"10px 0", fontSize:9, color:"#2a2a2a", fontFamily:"'Cinzel',serif", letterSpacing:1}}>{d}</div>
                ))}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"repeat(7,1fr)"}}>
                {calCells.map((dateKey,i)=>{
                  if(!dateKey) return <div key={i} style={{minHeight:82, borderRight:"1px solid rgba(255,255,255,0.02)", borderBottom:"1px solid rgba(255,255,255,0.02)"}}/>;
                  const ts = tradesByDate[dateKey]||[];
                  const pnl = dayPnlUSD(dateKey);
                  const hasData = ts.length>0;
                  const isToday = dateKey===TODAY;
                  const isSel = selectedDate===dateKey;
                  const day = parseInt(dateKey.slice(-2));
                  const typesSeen = [...new Set(ts.map(t=>t.type))];

                  let bg = isSel ? "rgba(245,166,35,0.08)" : hasData ? pnl>500 ? "rgba(245,166,35,0.12)" : pnl>0 ? "rgba(34,197,94,0.08)" : pnl<-200 ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.01)";
                  let border = isSel ? `1px solid ${G}` : hasData ? pnl>0 ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.03)";

                  return (
                    <div key={dateKey} onClick={()=>setSelectedDate(dateKey===selectedDate?null:dateKey)}
                      style={{minHeight:82, padding:"7px 8px", background:bg, border, cursor:"pointer", transition:"all 0.12s", position:"relative"}}>
                      <div style={{fontSize:10, fontWeight:700, color:isToday?G:isSel?"#fff":"#333", marginBottom:4, display:"flex", alignItems:"center", gap:3}}>
                        {day}
                        {isToday&&<span style={{width:4,height:4,borderRadius:"50%",background:G,display:"inline-block"}}/>}
                      </div>
                      {hasData && <>
                        <div style={{fontSize:11, fontWeight:700, color:pnl>=0?"#22C55E":"#EF4444", marginBottom:3}}>
                          {fmtUSD(pnl)}
                        </div>
                        <div style={{display:"flex", gap:3, flexWrap:"wrap"}}>
                          {typesSeen.map(type=>(
                            <span key={type} style={{fontSize:7, color:TYPES[type].color, background:TYPES[type].bg, border:`1px solid ${TYPES[type].border}`, borderRadius:3, padding:"1px 4px", fontFamily:"'Cinzel',serif", letterSpacing:0.5}}>
                              {TYPES[type].label}
                            </span>
                          ))}
                          <span style={{fontSize:8, color:"#444"}}>{ts.length}t</span>
                        </div>
                      </>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Day detail panel */}
            {selectedDate && (
              <div style={{...card, animation:"fadeIn 0.15s ease", marginBottom:16}}>
                <div style={topLine}/>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14}}>
                  <div>
                    <div style={{fontFamily:"'Cinzel',serif", fontSize:13, fontWeight:700, color:G, letterSpacing:1}}>
                      {new Date(selectedDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",day:"2-digit",month:"long"}).toUpperCase()}
                    </div>
                    <div style={{fontSize:13, fontWeight:700, color:dayPnlUSD(selectedDate)>=0?"#22C55E":"#EF4444", marginTop:2}}>
                      {fmtUSD(dayPnlUSD(selectedDate))}
                      <span style={{fontSize:9, color:"#444", marginLeft:8}}>{fmtSOL(dayPnlUSD(selectedDate)/solPrice)}</span>
                    </div>
                  </div>
                  <button onClick={()=>openNewTrade(selectedDate)} style={{...btn("rgba(245,166,35,0.12)",G), border:`1px solid rgba(245,166,35,0.3)`, fontSize:10}}>
                    + ADD TRADE
                  </button>
                </div>
                <textarea value={dayNote[selectedDate]||""} onChange={e=>setDayNote(p=>({...p,[selectedDate]:e.target.value}))}
                  placeholder="Day note — mindset, setup, rules followed..."
                  style={{...inp, height:52, resize:"none", lineHeight:1.5, fontSize:13, marginBottom:12}} />
                {(tradesByDate[selectedDate]||[]).length===0
                  ? <div style={{textAlign:"center", color:"#2a2a2a", fontSize:12, padding:"16px 0"}}>No trades this day</div>
                  : (tradesByDate[selectedDate]||[]).map(t=>{
                    const p = tradePnlSOL(t);
                    const pu = p*solPrice;
                    return (
                      <div key={t.id} style={{background:"rgba(255,255,255,0.02)", border:`1px solid ${pu>=0?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)"}`, borderRadius:10, padding:"12px 16px", marginBottom:8}}>
                        <div style={{display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", marginBottom: (t.reason||t.ca||t.socials) ? 8 : 0}}>
                          <span style={{fontSize:9, color:TYPES[t.type].color, background:TYPES[t.type].bg, border:`1px solid ${TYPES[t.type].border}`, borderRadius:4, padding:"2px 6px", fontFamily:"'Cinzel',serif", letterSpacing:1}}>{TYPES[t.type].label}</span>
                          <span style={{fontSize:9, color:STATUS[t.status].color, background:STATUS[t.status].bg, borderRadius:4, padding:"2px 6px"}}>{STATUS[t.status].label}</span>
                          <span style={{fontWeight:700, fontSize:15, color:"#fff", minWidth:80}}>{t.ticker.toUpperCase()}</span>
                          <span style={{fontSize:12, color:"#555"}}>Entry <span style={{color:"#888"}}>{t.entry}◎</span></span>
                          <span style={{fontSize:12, color:"#555"}}>Exit <span style={{color:"#888"}}>{t.exit}◎</span></span>
                          {parseFloat(t.moonbag)>0&&<span style={{fontSize:12, color:TYPES.kkm.color}}>🌙{t.moonbag}◎</span>}
                          <span style={{fontFamily:"'Cinzel Decorative',serif", fontSize:14, fontWeight:900, color:pu>=0?"#22C55E":"#EF4444", marginLeft:"auto"}}>
                            {fmtSOL(p)} <span style={{fontSize:11}}>{fmtUSD(pu)}</span>
                          </span>
                          <button onClick={()=>openEditTrade(t)} style={{...btn("rgba(255,255,255,0.05)","#666"), fontSize:10, padding:"4px 10px"}}>✎</button>
                          <button onClick={()=>deleteTrade(t.id)} style={{...btn("rgba(239,68,68,0.1)","#EF4444"), fontSize:10, padding:"4px 10px"}}>✕</button>
                        </div>
                        {(t.reason||t.ca||t.socials||t.note) && (
                          <div style={{display:"flex", flexWrap:"wrap", gap:12, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                            {t.reason && <span style={{fontSize:11, color:"#666"}}><span style={{color:"#333", fontSize:9, letterSpacing:1}}>REASON </span>{t.reason}</span>}
                            {t.note && <span style={{fontSize:11, color:"#555"}}><span style={{color:"#333", fontSize:9, letterSpacing:1}}>NOTE </span>{t.note}</span>}
                            {t.ca && <span style={{fontSize:10, color:"#444", fontFamily:"monospace"}}><span style={{color:"#333", fontSize:9, letterSpacing:1}}>CA </span>{t.ca}</span>}
                            {t.socials && <a href={t.socials.startsWith("http")?t.socials:"https://"+t.socials} target="_blank" rel="noopener noreferrer" style={{fontSize:11, color:"#60A5FA", textDecoration:"none"}}>{t.socials}</a>}
                          </div>
                        )}
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        )}

        {/* ══════════════ YEAR VIEW ══════════════ */}
        {view==="year" && (
          <div style={{animation:"fadeIn 0.2s ease"}}>
            <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:20}}>
              {Object.entries(TYPES).map(([k,t])=>{
                const tot = yearMonthTotals.reduce((s,_,mi)=>{
                  const n=getMonthDays(year,mi);
                  let m=0;
                  for(let d=1;d<=n;d++){
                    const ts=filteredTrades.filter(tr=>tr.date===mkDateKey(year,mi,d-1)&&tr.type===k);
                    m+=ts.reduce((a,tr)=>a+tradePnlUSD(tr),0);
                  }
                  return s+m;
                },0);
                return (
                  <div key={k} style={{...card, padding:"14px 18px"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${t.color}44,transparent)`}}/>
                    <div style={{fontFamily:"'Cinzel',serif", fontSize:9, letterSpacing:2, color:t.color, marginBottom:6}}>TRADES {t.label}</div>
                    <div style={{fontFamily:"'Cinzel Decorative',serif", fontSize:22, fontWeight:900, color:tot>=0?t.color:"#EF4444"}}>{fmtUSD(tot)}</div>
                  </div>
                );
              })}
            </div>
            <div style={{...card, marginBottom:20}}>
              <div style={topLine}/>
              <div style={{fontFamily:"'Cinzel',serif", fontSize:8, letterSpacing:3, color:"#333", marginBottom:20}}>MONTHLY PERFORMANCE</div>
              <div style={{display:"flex", alignItems:"flex-end", gap:6, height:120}}>
                {yearMonthTotals.map((val,i)=>{
                  const maxAbs=Math.max(...yearMonthTotals.map(Math.abs),1);
                  const h=Math.max(val!==0?4:1,(Math.abs(val)/maxAbs)*105);
                  return (
                    <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer"}} onClick={()=>{setView("month");setMonth(i);}}>
                      {val!==0&&<div style={{fontSize:7,color:val>0?"#22C55E":"#EF4444",whiteSpace:"nowrap"}}>{val>0?"+":""}{(val/1000).toFixed(1)}k</div>}
                      <div style={{width:"100%",height:h,background:val>1000?"linear-gradient(180deg,#F5A623,rgba(245,166,35,0.3))":val>0?"linear-gradient(180deg,#22C55E,rgba(34,197,94,0.2))":val<0?"linear-gradient(0deg,#EF4444,rgba(239,68,68,0.2))":"rgba(255,255,255,0.04)",borderRadius:3,transition:"height 0.3s"}}/>
                      <div style={{fontSize:7,color:i===month?"#F5A623":"#333",fontFamily:"'Cinzel',serif",letterSpacing:1}}>{MONTHS_SHORT[i]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {MONTHS_EN.map((m,i)=>{
                const val=yearMonthTotals[i];
                return (
                  <div key={i} onClick={()=>{setView("month");setMonth(i);}} style={{background:"rgba(18,18,18,0.8)",border:`1px solid ${val>0?"rgba(34,197,94,0.15)":val<0?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.04)"}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"border-color 0.15s"}}>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:"#444",letterSpacing:1,marginBottom:5}}>{m.slice(0,3).toUpperCase()}</div>
                    <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:14,fontWeight:900,color:val>0?"#22C55E":val<0?"#EF4444":"#222"}}>{val!==0?fmtUSD(val):"—"}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ JOURNAL VIEW ══════════════ */}
        {view==="journal" && (
          <div style={{animation:"fadeIn 0.2s ease"}}>
            <div style={{...card, marginBottom:16, padding:"12px 16px"}}>
              <div style={topLine}/>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div style={{fontFamily:"'Cinzel',serif", fontSize:9, color:"#444", letterSpacing:3}}>
                  {filteredTrades.length} TRADES · {fmtUSD(filteredTrades.reduce((s,t)=>s+tradePnlUSD(t),0))}
                </div>
                <button onClick={()=>openNewTrade()} style={{...btn("rgba(245,166,35,0.12)",G),border:`1px solid rgba(245,166,35,0.3)`,fontSize:10}}>+ NEW TRADE</button>
              </div>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"70px 90px 80px 1fr 80px 80px 80px 100px 50px", gap:8, padding:"8px 16px", fontSize:8, color:"#333", letterSpacing:2, fontFamily:"'Cinzel',serif", borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
              <span>TYPE</span><span>DATE</span><span>STATUS</span><span>TOKEN</span><span>ENTRY</span><span>EXIT</span><span>MOONBAG</span><span>P&L</span><span></span>
            </div>
            {[...filteredTrades].sort((a,b)=>b.date.localeCompare(a.date)).map(t=>{
              const p=tradePnlSOL(t);
              const pu=p*solPrice;
              return (
                <div key={t.id} style={{display:"grid",gridTemplateColumns:"70px 90px 80px 1fr 80px 80px 80px 100px 50px",gap:8,padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.03)",alignItems:"center",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:8,color:TYPES[t.type].color,background:TYPES[t.type].bg,border:`1px solid ${TYPES[t.type].border}`,borderRadius:4,padding:"2px 6px",textAlign:"center",fontFamily:"'Cinzel',serif",letterSpacing:0.5}}>{TYPES[t.type].label}</span>
                  <span style={{fontSize:10,color:"#555"}}>{t.date.slice(5)}</span>
                  <span style={{fontSize:9,color:STATUS[t.status].color,background:STATUS[t.status].bg,borderRadius:4,padding:"2px 6px",textAlign:"center"}}>{STATUS[t.status].label}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:13}}>{t.ticker.toUpperCase()}</div>
                    {t.reason&&<div style={{fontSize:10,color:"#555",marginTop:2}}>{t.reason}</div>}
                    {t.note&&<div style={{fontSize:9,color:"#444",marginTop:1}}>{t.note}</div>}
                    {t.ca&&<div style={{fontSize:9,color:"#333",marginTop:1,fontFamily:"monospace"}}>CA: {t.ca}</div>}
                  </div>
                  <span style={{fontSize:11,color:"#666"}}>{t.entry}◎</span>
                  <span style={{fontSize:11,color:"#666"}}>{t.exit}◎</span>
                  <span style={{fontSize:11,color:parseFloat(t.moonbag)>0?TYPES.kkm.color:"#2a2a2a"}}>{parseFloat(t.moonbag)>0?t.moonbag+"◎":"—"}</span>
                  <div>
                    <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:13,fontWeight:900,color:pu>=0?"#22C55E":"#EF4444"}}>{fmtUSD(pu)}</div>
                    <div style={{fontSize:9,color:"#444"}}>{fmtSOL(p)}</div>
                  </div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>openEditTrade(t)} style={{...btn("rgba(255,255,255,0.05)","#555"),fontSize:10,padding:"3px 8px"}}>✎</button>
                    <button onClick={()=>deleteTrade(t.id)} style={{...btn("rgba(239,68,68,0.08)","#EF4444"),fontSize:10,padding:"3px 8px"}}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ TRADE MODAL ══ */}
      {tradeModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
          <div style={{...card, width:"100%",maxWidth:600, animation:"fadeIn 0.15s ease", margin:"auto"}}>
            <div style={topLine}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:700,color:G,letterSpacing:1}}>
                {tradeModal.mode==="new"?"NEW TRADE":"EDIT TRADE"}
              </div>
              <button onClick={()=>setTradeModal(null)} style={{background:"transparent",border:"none",color:"#555",cursor:"pointer",fontSize:20,lineHeight:1}}>✕</button>
            </div>

            {/* Type + Status */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:8,fontFamily:"'Cinzel',serif"}}>TYPE</div>
                <div style={{display:"flex",gap:6}}>
                  {Object.entries(TYPES).map(([k,t])=>(
                    <button key={k} onClick={()=>setDraft(p=>({...p,type:k}))} style={{...tab(draft.type===k,t.color),flex:1,fontSize:10,padding:"8px 0"}}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:8,fontFamily:"'Cinzel',serif"}}>STATUS</div>
                <div style={{display:"flex",gap:6}}>
                  {Object.entries(STATUS).map(([k,s])=>(
                    <button key={k} onClick={()=>setDraft(p=>({...p,status:k}))} style={{...tab(draft.status===k,s.color),flex:1,fontSize:9,padding:"8px 0"}}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 1: Date + Token */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>DATE</div>
                <input type="date" value={draft.date||""} onChange={e=>setDraft(p=>({...p,date:e.target.value}))} style={inp} />
              </div>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>TOKEN</div>
                <input type="text" value={draft.ticker||""} onChange={e=>setDraft(p=>({...p,ticker:e.target.value}))}
                  placeholder="BONK" style={inp} />
              </div>
            </div>

            {/* Row 2: Entry + Exit + Moonbag + P&L Preview */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>ENTRY (SOL)</div>
                <input type="text" value={draft.entry||""} onChange={e=>setDraft(p=>({...p,entry:e.target.value}))}
                  placeholder="2.5" style={inp} />
              </div>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>EXIT (SOL)</div>
                <input type="text" value={draft.exit||""} onChange={e=>setDraft(p=>({...p,exit:e.target.value}))}
                  placeholder="5.0" style={inp} />
              </div>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>MOONBAG (SOL)</div>
                <input type="text" value={draft.moonbag||""} onChange={e=>setDraft(p=>({...p,moonbag:e.target.value}))}
                  placeholder="0.5" style={inp} />
              </div>
              <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>EST. P&L</div>
                <div style={{...inp,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",gap:6,border:"1px solid rgba(255,255,255,0.06)"}}>
                  <span style={{fontFamily:"'Cinzel Decorative',serif",fontSize:13,fontWeight:900,color:tradePnlSOL(draft)>=0?"#22C55E":"#EF4444"}}>
                    {fmtSOL(tradePnlSOL(draft))}
                  </span>
                  <span style={{fontSize:10,color:"#555"}}>{fmtUSD(tradePnlUSD(draft))}</span>
                </div>
              </div>
            </div>

            {/* Row 3: CA + Socials */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>CONTRACT ADDRESS (CA)</div>
                <input type="text" value={draft.ca||""} onChange={e=>setDraft(p=>({...p,ca:e.target.value}))}
                  placeholder="0x... or pump.fun link" style={{...inp, fontFamily:"monospace", fontSize:12}} />
              </div>
              <div>
                <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>SOCIALS (Twitter / Link)</div>
                <input type="text" value={draft.socials||""} onChange={e=>setDraft(p=>({...p,socials:e.target.value}))}
                  placeholder="@handle or https://..." style={inp} />
              </div>
            </div>

            {/* Row 4: Reason of win/loss */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>REASON OF {draft.status==="loss"?"LOSS":"WIN"}</div>
              <textarea value={draft.reason||""} onChange={e=>setDraft(p=>({...p,reason:e.target.value}))}
                placeholder={draft.status==="loss" ? "Why did it go wrong? Stop not respected, bad entry timing, FUD..." : "Why did it work? Narrative play, perfect entry, strong fundamentals..."}
                style={{...inp,height:72,resize:"none",lineHeight:1.6,fontSize:13}}/>
            </div>

            {/* Row 5: Note */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:9,color:"#555",letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>NOTES</div>
              <textarea value={draft.note||""} onChange={e=>setDraft(p=>({...p,note:e.target.value}))}
                placeholder="Setup details, mindset, rules followed..." style={{...inp,height:56,resize:"none",lineHeight:1.6,fontSize:13}}/>
            </div>

            <div style={{display:"flex",gap:10}}>
              <button onClick={saveTrade} style={{...btn("rgba(245,166,35,0.15)",G),border:`1px solid rgba(245,166,35,0.4)`,flex:1,fontSize:12,padding:"12px 0",letterSpacing:2}}>
                {tradeModal.mode==="new"?"ADD TRADE":"SAVE CHANGES"}
              </button>
              <button onClick={()=>setTradeModal(null)} style={{...btn("rgba(255,255,255,0.04)","#555"),border:"1px solid rgba(255,255,255,0.06)",padding:"12px 22px",fontSize:12}}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{marginTop:40,padding:"16px 24px",borderTop:"1px solid rgba(245,166,35,0.06)",textAlign:"center"}}>
        <img src={LOGO} alt="" style={{width:32,height:32,objectFit:"contain",opacity:0.3,marginBottom:6,display:"block",margin:"0 auto 6px"}}/>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:8,letterSpacing:4,color:"#1a1a1a"}}>JUNGLE KABAL · TRADING SYNDICATE · {now.getFullYear()}</div>
      </div>
    </div>
  );
}
