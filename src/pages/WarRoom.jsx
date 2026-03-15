// ============================================================
// JUNGLE KABAL — WAR ROOM (React refactor)
// Financial dashboard · Fee log · Treasury tracker
// ============================================================
import { useEffect, useState } from "react";

const CSS = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
:root{
  --gold:#ffc300; --gold2:#ffd65a; --gold-dim:rgba(255,195,0,0.08);
  --green:#2ecc71; --green-dim:rgba(46,204,113,0.1); --blue:#3b82f6;
  --red:#ef4444; --btc:#f7931a; --sol:#9945ff; --sol-dim:rgba(153,69,255,0.1);
  --bg:#0d0f0d; --s1:#111111; --s2:#0f0f0f; --s3:#151515;
  --b1:#1f1f1f; --b2:#2a2a2a; --b3:#2b2b2b;
  --text:#e5e7eb; --text-mid:#9ca3af; --text-dim:#6b7280;
}
html,body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;}
input,button,select{font-family:'Inter',sans-serif;}
input[type=number]::-webkit-inner-spin-button{opacity:0.3;}
.font-title{font-family:'Cinzel',serif;}

@keyframes glowPulse{0%{box-shadow:0 0 18px rgba(255,195,0,0.1);}50%{box-shadow:0 0 32px rgba(255,195,0,0.35);}100%{box-shadow:0 0 18px rgba(255,195,0,0.1);}}
@keyframes buttonPulse{0%{box-shadow:0 0 0 0 rgba(255,195,0,0.6);}70%{box-shadow:0 0 0 14px rgba(255,195,0,0);}100%{box-shadow:0 0 0 0 rgba(255,195,0,0);}}
@keyframes pulseDot{0%,100%{opacity:1;}50%{opacity:0.3;}}
.pulse-glow{animation:glowPulse 6s ease-in-out infinite;}
.floating-card{box-shadow:0 18px 45px rgba(0,0,0,0.45);transition:transform 0.35s ease,box-shadow 0.35s ease;}
.floating-card:hover{transform:translateY(-4px);box-shadow:0 24px 60px rgba(255,195,0,0.10),0 18px 45px rgba(0,0,0,0.55);}

.layout{display:flex;min-height:100vh;}

.sidebar{
  width:220px;flex-shrink:0;
  background:#0a0c0a;
  border-right:1px solid var(--b1);
  display:flex;flex-direction:column;
  position:fixed;top:0;left:0;height:100vh;
  z-index:100;overflow:hidden;
}
.sb-top{padding:20px 16px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;}
.sb-logo-img{width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(255,195,0,0.4));}
.sb-name{font-family:'Cinzel',serif;font-size:12px;letter-spacing:2px;color:var(--gold);line-height:1.3;}
.sb-sub{font-size:9px;letter-spacing:1px;color:var(--text-dim);margin-top:2px;}
.sb-nav{flex:1;padding:14px 0;overflow-y:auto;}
.sb-group{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;padding:10px 16px 4px;}
.ni{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;border-left:2px solid transparent;transition:all 0.2s;color:var(--text-mid);text-decoration:none;}
.ni:hover{background:var(--gold-dim);color:var(--gold);border-left-color:rgba(255,195,0,0.4);}
.ni.active{background:var(--gold-dim);border-left-color:var(--gold);color:var(--gold);}
.ni .ico{font-size:14px;width:18px;text-align:center;flex-shrink:0;}
.ni .lbl{font-size:10px;letter-spacing:0.5px;font-weight:500;}
.ni .bdg{margin-left:auto;font-size:7px;padding:1px 6px;border:1px solid rgba(255,195,0,0.3);color:rgba(255,195,0,0.7);border-radius:2px;}
.sb-art{width:100%;display:block;opacity:0.09;filter:sepia(0.5) hue-rotate(10deg);}
.sb-foot{padding:10px 14px;border-top:1px solid var(--b1);font-size:8px;color:var(--text-dim);}
.sb-foot .sq{color:rgba(255,195,0,0.6);margin-bottom:3px;font-size:9px;}

.content{margin-left:220px;flex:1;}

.topbar{
  position:sticky;top:0;z-index:50;
  background:rgba(13,15,13,0.95);backdrop-filter:blur(16px);
  border-bottom:1px solid var(--b1);
  padding:0 28px;height:52px;
  display:flex;align-items:center;justify-content:space-between;
}
.tb-title{font-family:'Cinzel',serif;font-size:14px;letter-spacing:3px;color:var(--gold);}
.tb-date{font-size:9px;letter-spacing:1px;color:var(--text-dim);}
.save-btn{
  font-size:9px;letter-spacing:1px;font-weight:600;
  padding:7px 18px;
  background:var(--gold);color:#000;border:none;cursor:pointer;
  border-radius:9999px;transition:all 0.2s;text-transform:uppercase;
  animation:buttonPulse 4s infinite;
}
.save-btn:hover{background:var(--gold2);}

.page{display:none;}
.page.active{display:block;}
.page-content{padding:28px 32px 64px;}

/* DASHBOARD */
.dash-hero{
  position:relative;overflow:hidden;
  border-radius:24px;border:1px solid var(--b1);
  background:linear-gradient(135deg,#111 0%,#0d0f0d 100%);
  padding:28px 32px;margin-bottom:24px;
  display:flex;align-items:center;gap:20px;
  box-shadow:0 20px 60px rgba(0,0,0,0.5);
  min-height:130px;
}
.dash-hero-encart-l{position:absolute;left:-8px;top:-8px;width:130px;pointer-events:none;opacity:0.9;}
.dash-hero-encart-r{position:absolute;right:-8px;bottom:-8px;width:130px;pointer-events:none;opacity:0.9;transform:rotate(180deg);}
.dash-hero-char{position:absolute;right:130px;bottom:0;width:120px;pointer-events:none;}
.dash-hero-logo{width:56px;height:56px;object-fit:contain;position:relative;z-index:2;filter:drop-shadow(0 0 16px rgba(255,195,0,0.5));}
.dash-hero-text{position:relative;z-index:2;flex:1;}
.dash-hero-title{font-family:'Cinzel',serif;font-size:26px;font-weight:700;color:var(--gold);letter-spacing:2px;line-height:1.1;}
.dash-hero-sub{font-size:10px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-top:6px;}
.dash-hero-badges{position:relative;z-index:2;display:flex;flex-direction:column;gap:6px;align-items:flex-end;}
.hbadge{font-size:9px;padding:5px 14px;border:1px solid;border-radius:9999px;font-weight:600;letter-spacing:1px;text-transform:uppercase;}
.hbadge.gold{border-color:var(--gold);color:var(--gold);}
.hbadge.green{border-color:var(--green);color:var(--green);}

.divider-img{width:100%;height:auto;display:block;max-height:60px;object-fit:contain;object-position:center;margin:8px 0;}

.worth-wrap{
  border-radius:20px;border:1px solid var(--b1);
  overflow:hidden;margin-bottom:20px;
  background:var(--s1);
  box-shadow:0 20px 60px rgba(0,0,0,0.4);
}
.tier{border-bottom:1px solid var(--b1);}
.tier:last-child{border-bottom:none;}
.tier-body{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;padding:20px 24px;}
.tier-tag{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:6px;}
.tier-sources{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;}
.tier-src{font-size:9px;color:var(--text-dim);display:flex;align-items:center;gap:4px;}
.tier-src b{margin-left:4px;}
.tier-val{font-family:'Cinzel',serif;font-size:36px;font-weight:700;letter-spacing:1px;line-height:1;}
.tier-val.green{color:var(--green);}
.tier-val.gold{color:var(--gold);}
.tier-val.white{color:#fff;}
.tier-note{font-size:8px;color:var(--text-dim);margin-top:5px;letter-spacing:0.5px;}
.tier-icon{width:60px;height:60px;object-fit:contain;}

.alloc-wrap{padding:14px 24px 18px;}
.alloc-label{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:7px;}
.alloc-track{height:7px;background:#0b0c0b;border:1px solid var(--b2);border-radius:4px;display:flex;overflow:hidden;}
.alloc-seg{height:100%;transition:width 0.5s ease;}
.alloc-leg{display:flex;gap:14px;flex-wrap:wrap;margin-top:7px;}
.al-item{display:flex;align-items:center;gap:5px;font-size:8px;color:var(--text-dim);}
.al-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}

.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.kpi{
  border-radius:16px;border:1px solid var(--b1);
  background:var(--s1);padding:16px 18px;
  position:relative;overflow:hidden;
}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.kpi.k-green::before{background:var(--green);}
.kpi.k-gold::before{background:var(--gold);}
.kpi.k-btc::before{background:var(--btc);}
.kpi.k-sol::before{background:var(--sol);}
.kpi-tag{font-size:8px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:5px;}
.kpi-tag img{width:16px;height:16px;object-fit:contain;}
.kpi-val{font-family:'Cinzel',serif;font-size:24px;font-weight:700;line-height:1;}
.kpi-val.green{color:var(--green);}
.kpi-val.gold{color:var(--gold);}
.kpi-val.btc{color:var(--btc);}
.kpi-val.sol{color:var(--sol);}
.kpi-sub{font-size:8px;color:var(--text-dim);margin-top:5px;line-height:1.5;}

.kkm-block{
  border-radius:16px;border:1px solid rgba(153,69,255,0.25);
  background:var(--sol-dim);padding:18px 22px;
  margin-bottom:20px;
  display:flex;align-items:center;gap:20px;flex-wrap:wrap;
}
.kkm-header{flex-shrink:0;}
.kkm-label{font-size:8px;letter-spacing:2px;color:var(--sol);text-transform:uppercase;margin-bottom:4px;}
.kkm-desc{font-size:8px;color:var(--text-dim);}
.kkm-vals{display:flex;gap:24px;flex:1;flex-wrap:wrap;}
.kkm-item{}
.kkm-v{font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--sol);}
.kkm-s{font-size:7px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;}
.kkm-ico{width:48px;height:48px;object-fit:contain;}

.runway{
  border-radius:16px;border:1px solid var(--b1);
  background:var(--s1);padding:16px 22px;
  margin-bottom:20px;
  display:flex;align-items:center;gap:16px;flex-wrap:wrap;
  border-left:3px solid var(--green);
}
.rw-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.rw-dot.green{background:var(--green);box-shadow:0 0 8px var(--green);animation:pulseDot 2s infinite;}
.rw-dot.yellow{background:var(--gold);box-shadow:0 0 8px var(--gold);animation:pulseDot 1s infinite;}
.rw-dot.red{background:var(--red);box-shadow:0 0 8px var(--red);}
.rw-text{flex:1;}
.rw-title{font-size:11px;font-weight:600;letter-spacing:1px;margin-bottom:2px;}
.rw-sub{font-size:8px;color:var(--text-dim);}
.rw-weeks{font-family:'Cinzel',serif;font-size:26px;font-weight:700;}
.rw-weeks-label{font-size:7px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;}

.prog-block{
  border-radius:16px;border:1px solid var(--b1);
  background:var(--s1);padding:16px 22px;
  margin-bottom:20px;
  border-left:3px solid var(--gold);
}
.prog-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
.prog-lbl{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;width:90px;flex-shrink:0;}
.prog-track{flex:1;height:7px;background:#0b0c0b;border:1px solid var(--b2);border-radius:4px;min-width:120px;position:relative;overflow:hidden;}
.prog-fill{height:100%;background:linear-gradient(to right,var(--gold),var(--gold2));border-radius:4px;transition:width 0.6s ease;}
.prog-stats{display:flex;gap:20px;flex-wrap:wrap;}
.ps{text-align:center;}
.ps-val{font-family:'Cinzel',serif;font-size:15px;font-weight:700;}
.ps-lbl{font-size:7px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;}

/* WAR ROOM */
.wr-section-title{
  font-family:'Cinzel',serif;font-size:13px;font-weight:600;
  letter-spacing:2px;color:var(--gold);
  margin-bottom:14px;padding-bottom:8px;
  border-bottom:1px solid var(--b1);
  display:flex;align-items:center;gap:10px;
}

.acc{border-radius:16px;border:1px solid var(--b1);overflow:hidden;margin-bottom:12px;}
.acc-hdr{
  display:flex;align-items:center;gap:10px;padding:14px 18px;
  cursor:pointer;transition:background 0.2s;
  background:var(--s1);user-select:none;
}
.acc-hdr:hover{background:#131513;}
.acc-hdr.open{border-bottom:1px solid var(--b1);background:#131513;}
.acc-hdr-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:1px;flex:1;color:var(--text);}
.acc-badge{font-size:7px;padding:2px 8px;border:1px solid rgba(255,195,0,0.3);color:rgba(255,195,0,0.7);border-radius:9999px;letter-spacing:1px;}
.acc-chevron{color:var(--text-dim);font-size:10px;transition:transform 0.3s;}
.acc-hdr.open .acc-chevron{transform:rotate(180deg);}
.acc-body{background:var(--s2);padding:18px;}

.input-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:14px;}
.fg{display:flex;flex-direction:column;gap:4px;}
.fl{font-size:8px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;}
.fi{
  background:#0d0f0d;border:1px solid var(--b2);
  color:var(--text);font-size:10px;
  padding:8px 10px;outline:none;width:100%;
  border-radius:8px;transition:border-color 0.2s;
}
.fi:focus{border-color:var(--gold);}
.fi.gold{color:var(--gold);}
.fi.green{color:var(--green);}
.fi.blue{color:var(--blue);}
.fi.red{color:var(--red);}
.fi.sol{color:var(--sol);}
.fi.btc{color:var(--btc);}

.btn{
  display:inline-flex;align-items:center;justify-content:center;
  font-size:9px;font-weight:600;letter-spacing:1px;
  padding:8px 18px;border:1px solid var(--gold);
  color:var(--gold);background:transparent;cursor:pointer;
  text-transform:uppercase;border-radius:9999px;
  transition:all 0.2s;
}
.btn:hover{background:var(--gold);color:#000;}
.btn.sec{border-color:var(--b2);color:var(--text-mid);}
.btn.sec:hover{background:var(--b2);color:var(--text);}

.card{
  border-radius:12px;border:1px solid var(--b1);
  background:var(--s2);padding:14px 16px;position:relative;overflow:hidden;
}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.card.c-gold::before{background:var(--gold);}
.card.c-green::before{background:var(--green);}
.card.c-sol::before{background:var(--sol);}
.card.c-dim::before{background:var(--b2);}
.card-tag{font-size:7px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:8px;}
.card-val{font-family:'Cinzel',serif;font-size:22px;font-weight:700;}
.card-val.gold{color:var(--gold);}
.card-val.green{color:var(--green);}
.card-val.sol{color:var(--sol);}
.card-val.dim{color:var(--text-mid);}

.add-form{background:#0b0c0b;border:1px solid rgba(255,195,0,0.2);border-radius:12px;padding:14px;margin-top:10px;gap:10px;flex-wrap:wrap;align-items:flex-end;}

.log-wrap{border-radius:16px;border:1px solid var(--b1);background:var(--s1);overflow:hidden;margin-bottom:12px;}
.log-hdr{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--b1);}
.log-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:1px;color:var(--gold);}
.tbl-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:9px;}
th{text-align:left;font-size:7px;letter-spacing:1px;color:var(--text-dim);padding:8px 12px;border-bottom:1px solid var(--b1);text-transform:uppercase;white-space:nowrap;}
td{padding:10px 12px;border-bottom:1px solid #0f1010;vertical-align:middle;}
tr:last-child td{border-bottom:none;}
tbody tr:hover td{background:rgba(255,255,255,0.02);}
.td-gold{color:var(--gold);font-weight:600;}
.td-green{color:var(--green);font-weight:600;}
.td-red{color:var(--red);font-weight:600;}
.td-sol{color:var(--sol);font-weight:600;}
.td-btc{color:var(--btc);font-weight:600;}
.td-dim{color:var(--text-mid);}
.del-btn{background:none;border:none;color:#2a2a2a;cursor:pointer;font-size:12px;padding:2px 8px;transition:color 0.2s;border-radius:4px;}
.del-btn:hover{color:var(--red);background:rgba(239,68,68,0.1);}

.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}
@media(max-width:900px){.g2,.g3,.g4,.kpi-grid{grid-template-columns:1fr;}}

/* TREASURY */
.sum-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}
.sc{border-radius:12px;border:1px solid var(--b1);background:var(--s1);padding:14px 16px;position:relative;overflow:hidden;}
.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.sc.gold::before{background:var(--gold);}
.sc.blue::before{background:var(--blue);}
.sc.btc::before{background:var(--btc);}
.sc.green::before{background:var(--green);}
.sc-tag{font-size:7px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;}
.sc-val{font-family:'Cinzel',serif;font-size:22px;font-weight:700;line-height:1;}
.sc-sub{font-size:8px;color:var(--text-dim);margin-top:4px;}

.chart-outer{border-radius:16px;border:1px solid var(--b1);background:var(--s1);padding:16px;margin-bottom:12px;}
.chart-bars{display:flex;align-items:flex-end;gap:5px;height:110px;padding:0 2px;}
.cg{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;min-width:24px;}
.ci{display:flex;gap:2px;align-items:flex-end;width:100%;}
.cb{flex:1;border-radius:2px 2px 0 0;transition:height 0.5s ease;}
.cb-usdc{background:linear-gradient(to top,var(--blue),#60a5fa);}
.cb-btc{background:linear-gradient(to top,var(--btc),#fbbf24);}
.cl{font-size:5px;letter-spacing:0.5px;color:var(--text-dim);text-align:center;}
.chart-legend{display:flex;gap:14px;margin-top:8px;flex-wrap:wrap;}
.cleg{display:flex;align-items:center;gap:5px;font-size:8px;color:var(--text-dim);}
.cdot{width:8px;height:8px;border-radius:2px;}

.badge{display:inline-flex;align-items:center;font-size:7px;letter-spacing:0.5px;padding:2px 8px;border:1px solid;border-radius:9999px;text-transform:uppercase;}
.badge-up{border-color:var(--green);color:var(--green);}
.badge-down{border-color:var(--red);color:var(--red);}
.badge-flat{border-color:var(--b3);color:var(--text-dim);}

.obj-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.obj-card{border-radius:16px;border:1px solid var(--b1);background:var(--s1);padding:16px;position:relative;overflow:hidden;}
.obj-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
.obj-card.gold::before{background:var(--gold);}
.obj-card.blue::before{background:var(--blue);}
.obj-card.btc::before{background:var(--btc);}
.obj-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;margin-bottom:10px;}
.obj-line{font-size:8px;color:var(--text-dim);line-height:2;}
.obj-line b{color:var(--text);}

.toast-bar{position:fixed;bottom:24px;right:24px;background:var(--gold);color:#000;font-size:9px;letter-spacing:2px;padding:10px 22px;text-transform:uppercase;font-weight:700;z-index:999;border-radius:9999px;transition:all 0.3s;}
`;

const PAGE_TITLES = { dash: "DASHBOARD", warroom: "WAR ROOM", treasury: "TREASURY" };
const LOGO = "https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png";

const INITIAL_RESERVES = {
  usdc: 0, btc: 0, btcP: 85000, eth: 0, ethP: 3000,
  sol: 0, solP: 140, others: 0, ops: 0, lpU: 0, lpS: 0, burn: 0,
  kkmG: 0, kkmP: 140, daily: 0,
};

function fmt$(n) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`; }
function fmtSol(n) { return `◎${parseFloat(n).toFixed(2)}`; }
function fmtBtc(n) { return `₿${parseFloat(n).toFixed(4)}`; }

export default function WarRoom() {
  const [activePage, setActivePage] = useState("dash");
  const [openAcc, setOpenAcc] = useState(new Set(["wr-reserves", "wr-kkm", "tr-log", "tr-summary"]));
  const [reserves, setReserves] = useState(INITIAL_RESERVES);
  const [showWrForm, setShowWrForm] = useState(false);
  const [wrForm, setWrForm] = useState({ date: new Date().toISOString().slice(0, 10), gross: "", source: "KKM", note: "" });
  const [wrEntries, setWrEntries] = useState([]);
  const [trForm, setTrForm] = useState({ week: "", gross: "", burn: "", usdc: "", btc: "", solP: "140", note: "" });
  const [trEntries, setTrEntries] = useState([]);
  const [toast, setToast] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const r = localStorage.getItem("jk-wr-reserves");
      const we = localStorage.getItem("jk-wr-entries");
      const te = localStorage.getItem("jk-tr-entries");
      if (r) setReserves(JSON.parse(r));
      if (we) setWrEntries(JSON.parse(we));
      if (te) setTrEntries(JSON.parse(te));
    } catch {}
  }, []);

  function toggleAcc(id) {
    setOpenAcc(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function setR(key, val) {
    setReserves(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  }

  // Computed financial values
  const btcUsd = reserves.btc * reserves.btcP;
  const ethUsd = reserves.eth * reserves.ethP;
  const solUsd = reserves.sol * reserves.solP;
  const lpSolUsd = reserves.lpS * reserves.solP;
  const realNet = reserves.usdc + btcUsd + ethUsd + reserves.others;
  const netWithSol = realNet + solUsd;
  const total = netWithSol + reserves.ops + reserves.lpU + lpSolUsd;
  const totalAlloc = total || 1;
  const runway = reserves.burn > 0 ? (realNet / reserves.burn).toFixed(1) : "—";
  const runwayNum = parseFloat(runway);
  const runwayOk = runway === "—" || runwayNum >= 6;
  const runwayWarn = runway !== "—" && runwayNum < 6 && runwayNum >= 3;
  const kkmNet = reserves.kkmG * 0.75;
  const kkmUsd = kkmNet * reserves.kkmP;
  const kkmMonthly = kkmUsd * 4;

  // KKM form auto-net
  const wrFormNet = wrForm.gross ? (parseFloat(wrForm.gross) * 0.75 * reserves.solP).toFixed(2) : "";

  function wrAdd() {
    if (!wrForm.date || !wrForm.gross) return;
    const gross = parseFloat(wrForm.gross);
    const tugan = (gross * 0.25).toFixed(3);
    const kabalSol = (gross * 0.75).toFixed(3);
    const kabalUsd = (gross * 0.75 * reserves.solP).toFixed(2);
    setWrEntries(prev => [...prev, { id: Date.now(), ...wrForm, gross, tugan, kabalSol, kabalUsd }]);
    setWrForm(p => ({ ...p, gross: "", source: "KKM", note: "" }));
    setShowWrForm(false);
  }

  // Treasury form auto-calc
  const trFormNet = trForm.gross ? (parseFloat(trForm.gross) * 0.75).toFixed(3) : "";

  function trAdd() {
    if (!trForm.week) return;
    const gross = parseFloat(trForm.gross) || 0;
    const solP = parseFloat(trForm.solP) || 140;
    const kabalSol = (gross * 0.75).toFixed(3);
    const kabalUsd = (gross * 0.75 * solP).toFixed(2);
    const burn = parseFloat(trForm.burn) || 0;
    const net = (parseFloat(kabalUsd) - burn).toFixed(2);
    const prev = trEntries[trEntries.length - 1];
    const trend = prev ? (parseFloat(kabalUsd) >= parseFloat(prev.kabalUsd) ? "up" : "down") : "flat";
    setTrEntries(p => [...p, { id: Date.now(), ...trForm, gross, kabalSol, kabalUsd, netPnl: net, trend }]);
    setTrForm({ week: "", gross: "", burn: "", usdc: "", btc: "", solP: "140", note: "" });
  }

  function trClear() {
    setTrForm({ week: "", gross: "", burn: "", usdc: "", btc: "", solP: "140", note: "" });
  }

  // Treasury summary computed from entries
  const lastEntry = trEntries[trEntries.length - 1];
  const trTotalRev = trEntries.reduce((s, e) => s + parseFloat(e.kabalUsd || 0), 0);
  const trTotalNet = trEntries.reduce((s, e) => s + parseFloat(e.netPnl || 0), 0);

  // Chart max for treasury bar chart
  const chartMax = Math.max(...trEntries.map(e => (parseFloat(e.usdc) || 0) + (parseFloat(e.btc) || 0) * 85000), 1);

  function saveAll() {
    localStorage.setItem("jk-wr-reserves", JSON.stringify(reserves));
    localStorage.setItem("jk-wr-entries", JSON.stringify(wrEntries));
    localStorage.setItem("jk-tr-entries", JSON.stringify(trEntries));
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  const nowStr = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

  // Sprint progress (March 1 - May 30)
  const sprintStart = new Date("2026-03-01");
  const sprintEnd = new Date("2026-05-30");
  const now = new Date();
  const elapsed = Math.max(0, Math.floor((now - sprintStart) / 86400000));
  const sprintTotal = Math.floor((sprintEnd - sprintStart) / 86400000);
  const sprintPct = Math.min(100, Math.round((elapsed / sprintTotal) * 100));
  const monthTotal = wrEntries.filter(e => e.date?.slice(0, 7) === now.toISOString().slice(0, 7))
    .reduce((s, e) => s + parseFloat(e.kabalUsd || 0), 0);

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {toast && <div className="toast-bar">Saved ✓</div>}

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-top">
            <img className="sb-logo-img" src={LOGO} alt="JK" />
            <div>
              <div className="sb-name">JUNGLE<br />KABAL</div>
              <div className="sb-sub">Internal HQ v3</div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="sb-group">Live</div>
            {[
              { id: "dash", ico: "👁", lbl: "Dashboard", bdg: "LIVE" },
              { id: "warroom", ico: "⚔", lbl: "War Room" },
              { id: "treasury", ico: "🏦", lbl: "Treasury" },
            ].map(({ id, ico, lbl, bdg }) => (
              <div key={id} className={`ni${activePage === id ? " active" : ""}`} onClick={() => setActivePage(id)}>
                <span className="ico">{ico}</span>
                <span className="lbl">{lbl}</span>
                {bdg && <span className="bdg">{bdg}</span>}
              </div>
            ))}
            <div className="sb-group" style={{ marginTop: 6 }}>Coming Soon</div>
            <div className="ni" style={{ opacity: 0.3, cursor: "default" }}>
              <span className="ico">🗺</span><span className="lbl">Roadmap</span><span className="bdg">SOON</span>
            </div>
            <div className="ni" style={{ opacity: 0.3, cursor: "default" }}>
              <span className="ico">👼</span><span className="lbl">Angels CRM</span><span className="bdg">SOON</span>
            </div>
          </nav>
          <img className="sb-art" src={LOGO} alt="" />
          <div className="sb-foot">
            <div className="sq">⚡ Squad of 5 — Bite &amp; Knife</div>
            <div>90-Day Sprint · Mar → May 2026</div>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="content">
          <div className="topbar">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="tb-title">{PAGE_TITLES[activePage]}</div>
              <div style={{ width: 1, height: 14, background: "var(--b1)" }} />
              <div className="tb-date">{nowStr}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.5px", padding: "4px 12px", borderRadius: 9999, border: "1px solid var(--green)", color: "var(--green)" }}>
                ● ONLINE
              </div>
              <button className="save-btn" onClick={saveAll}>Save ◈</button>
            </div>
          </div>

          {/* ── DASHBOARD ── */}
          <div className={`page${activePage === "dash" ? " active" : ""}`}>
            <div className="page-content">
              {/* Hero */}
              <div className="dash-hero pulse-glow">
                <img className="dash-hero-encart-l" src={LOGO} alt="" />
                <img className="dash-hero-encart-r" src={LOGO} alt="" />
                <img className="dash-hero-char" src={LOGO} alt="" />
                <img className="dash-hero-logo" src={LOGO} alt="" />
                <div className="dash-hero-text">
                  <div className="dash-hero-title">KABAL COMMAND CENTER</div>
                  <div className="dash-hero-sub">Internal financial dashboard · Squad of 5 · 90-Day Sprint</div>
                </div>
                <div className="dash-hero-badges">
                  <div className="hbadge gold">Only The Chosen</div>
                  <div className="hbadge green">March — Phase 1</div>
                </div>
              </div>

              <img className="divider-img" src={LOGO} alt="" />

              {/* Net Worth Tiers */}
              <div className="worth-wrap">
                <div className="tier">
                  <div className="tier-body">
                    <div>
                      <div className="tier-tag">🏆 Kabal Real Net Worth</div>
                      <div className="tier-sources">
                        <div className="tier-src">USDC Reserve <b style={{ color: "var(--blue)" }}>{fmt$(reserves.usdc)}</b></div>
                        <div className="tier-src">BTC Reserve <b style={{ color: "var(--btc)" }}>{fmtBtc(reserves.btc)}</b></div>
                      </div>
                      <div className="tier-val green">{fmt$(realNet)}</div>
                      <div className="tier-note">Stable reserves only — USDC + BTC · No SOL counted</div>
                    </div>
                    <img className="tier-icon" src={LOGO} alt="" />
                  </div>
                </div>
                <div className="tier">
                  <div className="tier-body">
                    <div>
                      <div className="tier-tag">⚡ Kabal Net Worth <span style={{ fontSize: 7, color: "var(--text-dim)", marginLeft: 4 }}>incl. SOL ammo</span></div>
                      <div className="tier-sources">
                        <div className="tier-src">Real Net Worth</div>
                        <div className="tier-src">+ SOL Ammo <b style={{ color: "var(--sol)" }}>{fmtSol(reserves.sol)}</b></div>
                      </div>
                      <div className="tier-val gold">{fmt$(netWithSol)}</div>
                      <div className="tier-note">Real Net Worth + SOL ammunition at current price</div>
                    </div>
                    <img className="tier-icon" src={LOGO} alt="" />
                  </div>
                </div>
                <div className="tier">
                  <div className="tier-body">
                    <div>
                      <div className="tier-tag">🌐 Total Kabal Worth</div>
                      <div className="tier-sources">
                        <div className="tier-src">Net Worth + SOL</div>
                        <div className="tier-src">Ops Wallet <b style={{ color: "var(--blue)" }}>{fmt$(reserves.ops)}</b></div>
                        <div className="tier-src">LP Reserve <b style={{ color: "var(--sol)" }}>{fmt$(reserves.lpU + lpSolUsd)}</b></div>
                      </div>
                      <div className="tier-val white">{fmt$(total)}</div>
                      <div className="tier-note">Everything combined — full picture</div>
                    </div>
                    <img className="tier-icon" src={LOGO} alt="" />
                  </div>
                  <div className="alloc-wrap">
                    <div className="alloc-label">Capital Allocation</div>
                    <div className="alloc-track">
                      <div className="alloc-seg" style={{ background: "var(--blue)", width: `${(reserves.usdc / totalAlloc * 100).toFixed(1)}%` }} />
                      <div className="alloc-seg" style={{ background: "var(--btc)", width: `${(btcUsd / totalAlloc * 100).toFixed(1)}%` }} />
                      <div className="alloc-seg" style={{ background: "var(--sol)", width: `${(solUsd / totalAlloc * 100).toFixed(1)}%` }} />
                      <div className="alloc-seg" style={{ background: "rgba(59,130,246,0.5)", width: `${((reserves.ops + reserves.lpU + lpSolUsd) / totalAlloc * 100).toFixed(1)}%` }} />
                    </div>
                    <div className="alloc-leg">
                      {[
                        { label: "USDC", color: "var(--blue)", pct: (reserves.usdc / totalAlloc * 100).toFixed(0) },
                        { label: "BTC", color: "var(--btc)", pct: (btcUsd / totalAlloc * 100).toFixed(0) },
                        { label: "SOL", color: "var(--sol)", pct: (solUsd / totalAlloc * 100).toFixed(0) },
                        { label: "Ops+LP", color: "rgba(59,130,246,0.5)", pct: ((reserves.ops + reserves.lpU + lpSolUsd) / totalAlloc * 100).toFixed(0) },
                      ].map(({ label, color, pct }) => (
                        <div key={label} className="al-item">
                          <div className="al-dot" style={{ background: color }} />
                          {label} <b style={{ color: "var(--text)", marginLeft: 3 }}>{pct}%</b>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <img className="divider-img" src={LOGO} alt="" style={{ transform: "scaleX(-1)" }} />

              {/* KKM Block */}
              <div className="kkm-block">
                <img className="kkm-ico" src={LOGO} alt="" />
                <div className="kkm-header">
                  <div className="kkm-label">⚡ KKM — Tugan Partnership</div>
                  <div className="kkm-desc">Joint operation · 75% Kabal / 25% Tugan · Not in net worth</div>
                </div>
                <div className="kkm-vals">
                  <div className="kkm-item">
                    <div className="kkm-v">{fmtSol(kkmNet)}</div>
                    <div className="kkm-s">Weekly Fees (Kabal 75%)</div>
                  </div>
                  <div className="kkm-item">
                    <div className="kkm-v" style={{ fontSize: 14, marginTop: 5 }}>{fmt$(kkmUsd)}</div>
                    <div className="kkm-s">USD equiv.</div>
                  </div>
                  <div className="kkm-item">
                    <div className="kkm-v">{fmt$(kkmMonthly)}</div>
                    <div className="kkm-s">Est. Monthly (×4)</div>
                  </div>
                </div>
              </div>

              {/* Runway */}
              <div className="runway" style={{ borderLeftColor: runwayOk ? "var(--green)" : runwayWarn ? "var(--gold)" : "var(--red)" }}>
                <div className={`rw-dot ${runwayOk ? "green" : runwayWarn ? "yellow" : "red"}`} />
                <div className="rw-text">
                  <div className="rw-title" style={{ color: runwayOk ? "var(--green)" : runwayWarn ? "var(--gold)" : "var(--red)" }}>
                    OPS RUNWAY — {runwayOk ? "HEALTHY" : runwayWarn ? "WARNING" : "CRITICAL"}
                  </div>
                  <div className="rw-sub">{reserves.burn > 0 ? `Weekly burn: ${fmt$(reserves.burn)} · Real net: ${fmt$(realNet)}` : "Enter weekly burn in War Room to calculate"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="rw-weeks-label">Weeks of runway</div>
                  <div className="rw-weeks" style={{ color: runwayOk ? "var(--green)" : runwayWarn ? "var(--gold)" : "var(--red)" }}>{runway}</div>
                </div>
              </div>

              {/* Sprint Progress */}
              <div className="prog-block">
                <div className="prog-row">
                  <div className="prog-lbl">March Sprint</div>
                  <div className="prog-track">
                    <div className="prog-fill" style={{ width: `${Math.min(100, (monthTotal / 31000) * 100)}%` }} />
                  </div>
                  <div className="prog-stats">
                    <div className="ps">
                      <div className="ps-val" style={{ color: "var(--gold)" }}>{fmt$(monthTotal)}</div>
                      <div className="ps-lbl">Month Total</div>
                    </div>
                    <div className="ps">
                      <div className="ps-val" style={{ color: "var(--text-dim)" }}>$15.5k</div>
                      <div className="ps-lbl">Min Target</div>
                    </div>
                    <div className="ps">
                      <div className="ps-val" style={{ color: "var(--text-dim)" }}>$31k</div>
                      <div className="ps-lbl">Max Target</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi k-gold">
                  <div className="kpi-tag">Daily Fees (KKM)</div>
                  <div className="kpi-val gold">{fmt$(reserves.daily)}</div>
                  <div className="kpi-sub">Kabal 75% net · today</div>
                </div>
                <div className="kpi k-sol">
                  <div className="kpi-tag">SOL Ammo</div>
                  <div className="kpi-val sol">{fmtSol(reserves.sol)}</div>
                  <div className="kpi-sub">Trading bullets — off balance</div>
                </div>
                <div className="kpi k-green">
                  <div className="kpi-tag">USDC Reserve</div>
                  <div className="kpi-val green">{fmt$(reserves.usdc)}</div>
                  <div className="kpi-sub">Primary net KPI</div>
                </div>
                <div className="kpi k-btc">
                  <div className="kpi-tag">BTC Reserve</div>
                  <div className="kpi-val btc">{fmtBtc(reserves.btc)}</div>
                  <div className="kpi-sub">Long-term accumulation</div>
                </div>
              </div>

              {/* Footer art */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 24, opacity: 0.5 }}>
                <img src={LOGO} alt="" style={{ width: 60, height: 60, objectFit: "contain" }} />
                <div style={{ fontFamily: '"Cinzel",serif', fontSize: 9, letterSpacing: 3, color: "var(--text-dim)", textTransform: "uppercase" }}>Only The Chosen</div>
                <img src={LOGO} alt="" style={{ width: 60, height: 60, objectFit: "contain", transform: "scaleX(-1)" }} />
              </div>
            </div>
          </div>

          {/* ── WAR ROOM ── */}
          <div className={`page${activePage === "warroom" ? " active" : ""}`}>
            <div className="page-content">
              <div className="wr-section-title">💰 Reserves &amp; Net Worth</div>

              {/* Accordion: Stable Reserves */}
              <div className="acc">
                <div className={`acc-hdr${openAcc.has("wr-reserves") ? " open" : ""}`} onClick={() => toggleAcc("wr-reserves")}>
                  <span>🏦</span>
                  <span className="acc-hdr-title">Stable Reserves (USDC + BTC)</span>
                  <span className="acc-badge">Real Net Worth</span>
                  <span className="acc-chevron">▼</span>
                </div>
                {openAcc.has("wr-reserves") && (
                  <div className="acc-body">
                    <div className="input-grid">
                      {[
                        { k: "usdc", l: "💵 USDC Reserve", cls: "gold" },
                        { k: "btc", l: "₿ BTC Reserve", cls: "btc", step: "0.0001" },
                        { k: "btcP", l: "BTC Price ($)", note: "● live" },
                        { k: "eth", l: "ETH Reserve", step: "0.001", style: { borderColor: "rgba(100,150,255,0.4)" } },
                        { k: "ethP", l: "ETH Price ($)", note: "● live" },
                        { k: "sol", l: "◎ SOL Ammo", cls: "sol", step: "0.1" },
                        { k: "solP", l: "SOL Price ($)", note: "● live" },
                        { k: "others", l: "Autres Cryptos ($)", note: "valeur totale USD", style: { borderColor: "rgba(180,180,180,0.3)" } },
                        { k: "ops", l: "💼 Ops Wallet (USDC)", cls: "blue" },
                        { k: "lpU", l: "🌊 LP Reserve (USDC)", cls: "blue" },
                        { k: "lpS", l: "🌊 LP Reserve (SOL)", cls: "sol", step: "0.1" },
                        { k: "burn", l: "Weekly Team Burn ($)", cls: "red" },
                      ].map(({ k, l, cls, step, note, style }) => (
                        <div key={k} className="fg">
                          <div className="fl">{l} {note && <span style={{ fontSize: 8, color: note.includes("live") ? "var(--green)" : "var(--text-dim)" }}>● {note.replace("● ", "")}</span>}</div>
                          <input className={`fi${cls ? ` ${cls}` : ""}`} type="number" value={reserves[k] || ""} step={step} style={style}
                            onChange={e => setR(k, e.target.value)} placeholder={k === "btcP" ? "85000" : k === "solP" || k === "kkmP" ? "140" : k === "ethP" ? "3000" : "0"} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion: KKM Weekly Fees */}
              <div className="acc">
                <div className={`acc-hdr${openAcc.has("wr-kkm") ? " open" : ""}`} onClick={() => toggleAcc("wr-kkm")}>
                  <span>⚡</span>
                  <span className="acc-hdr-title">KKM Weekly Fees — SOL Entry</span>
                  <span className="acc-badge">75% Kabal · 25% Tugan</span>
                  <span className="acc-chevron">▼</span>
                </div>
                {openAcc.has("wr-kkm") && (
                  <div className="acc-body">
                    <div style={{ fontSize: 9, color: "var(--text-dim)", marginBottom: 12 }}>
                      Enter GROSS SOL fees generated by KKM this week. The Tugan 25% split is auto-calculated.
                    </div>
                    <div className="input-grid">
                      <div className="fg">
                        <div className="fl">Gross Fees (SOL)</div>
                        <input className="fi sol" type="number" value={reserves.kkmG || ""} step="0.01" onChange={e => setR("kkmG", e.target.value)} placeholder="0" />
                      </div>
                      <div className="fg">
                        <div className="fl">SOL Price at recording</div>
                        <input className="fi" type="number" value={reserves.kkmP || ""} onChange={e => setR("kkmP", e.target.value)} placeholder="140" />
                      </div>
                      <div className="fg">
                        <div className="fl">Daily Fees (Kabal $, manual)</div>
                        <input className="fi gold" type="number" value={reserves.daily || ""} onChange={e => setR("daily", e.target.value)} placeholder="0" />
                      </div>
                    </div>
                    <div className="g4">
                      <div className="card c-sol">
                        <div className="card-tag">Gross Fees</div>
                        <div className="card-val sol">{fmtSol(reserves.kkmG)}</div>
                      </div>
                      <div className="card c-dim">
                        <div className="card-tag">Tugan 25%</div>
                        <div className="card-val dim">{fmtSol(reserves.kkmG * 0.25)}</div>
                      </div>
                      <div className="card c-gold">
                        <div className="card-tag">Kabal Net 75%</div>
                        <div className="card-val gold">{fmtSol(kkmNet)}</div>
                      </div>
                      <div className="card c-green">
                        <div className="card-tag">USD Equiv.</div>
                        <div className="card-val green">{fmt$(kkmUsd)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fee Log */}
              <div className="wr-section-title" style={{ marginTop: 20 }}>📋 Daily Fee Log</div>
              <div className="log-wrap">
                <div className="log-hdr">
                  <div className="log-title">Fee Entries</div>
                  <button className="btn" onClick={() => setShowWrForm(v => !v)}>
                    {showWrForm ? "✕ Cancel" : "+ Add Entry"}
                  </button>
                </div>
                {showWrForm && (
                  <div className="add-form" style={{ display: "flex" }}>
                    <div className="fg">
                      <div className="fl">Date</div>
                      <input className="fi" type="date" value={wrForm.date} style={{ width: 130 }} onChange={e => setWrForm(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div className="fg">
                      <div className="fl">Gross Fees (SOL)</div>
                      <input className="fi sol" type="number" value={wrForm.gross} placeholder="0.0" style={{ width: 120 }} onChange={e => setWrForm(p => ({ ...p, gross: e.target.value }))} />
                    </div>
                    <div className="fg">
                      <div className="fl">Kabal Net ($)</div>
                      <input className="fi gold" type="number" value={wrFormNet} placeholder="auto" style={{ width: 110 }} readOnly />
                    </div>
                    <div className="fg">
                      <div className="fl">Source</div>
                      <input className="fi" type="text" value={wrForm.source} placeholder="KKM" style={{ width: 140 }} onChange={e => setWrForm(p => ({ ...p, source: e.target.value }))} />
                    </div>
                    <div className="fg">
                      <div className="fl">Note</div>
                      <input className="fi" type="text" value={wrForm.note} placeholder="Optional" style={{ width: 140 }} onChange={e => setWrForm(p => ({ ...p, note: e.target.value }))} />
                    </div>
                    <button className="btn" onClick={wrAdd}>✓ Add</button>
                  </div>
                )}
                <div className="tbl-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th><th>Gross (SOL)</th><th>Tugan 25%</th><th>Kabal 75%</th><th>Kabal ($)</th><th>Source</th><th>Note</th><th />
                      </tr>
                    </thead>
                    <tbody>
                      {wrEntries.length === 0 ? (
                        <tr><td colSpan={8} style={{ color: "var(--text-dim)", fontSize: 8, textAlign: "center", padding: 24, letterSpacing: 1 }}>— No entries yet. Start logging. —</td></tr>
                      ) : wrEntries.map(e => (
                        <tr key={e.id}>
                          <td className="td-dim">{e.date}</td>
                          <td className="td-sol">{fmtSol(e.gross)}</td>
                          <td className="td-dim">{fmtSol(e.tugan)}</td>
                          <td className="td-gold">{fmtSol(e.kabalSol)}</td>
                          <td className="td-green">${e.kabalUsd}</td>
                          <td className="td-dim">{e.source}</td>
                          <td className="td-dim">{e.note || "—"}</td>
                          <td><button className="del-btn" onClick={() => setWrEntries(p => p.filter(x => x.id !== e.id))}>✕</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── TREASURY ── */}
          <div className={`page${activePage === "treasury" ? " active" : ""}`}>
            <div className="page-content">

              {/* Log a Week */}
              <div className="acc">
                <div className={`acc-hdr${openAcc.has("tr-log") ? " open" : ""}`} onClick={() => toggleAcc("tr-log")}>
                  <span>➕</span>
                  <span className="acc-hdr-title">Log a Week</span>
                  <span className="acc-chevron">▼</span>
                </div>
                {openAcc.has("tr-log") && (
                  <div className="acc-body">
                    <div className="input-grid">
                      <div className="fg">
                        <div className="fl">Week Label</div>
                        <input className="fi" type="text" value={trForm.week} placeholder="W01 March" style={{ width: "100%" }} onChange={e => setTrForm(p => ({ ...p, week: e.target.value }))} />
                      </div>
                      <div className="fg">
                        <div className="fl">KKM Gross Fees (SOL)</div>
                        <input className="fi sol" type="number" value={trForm.gross} placeholder="0.0" step="0.01" onChange={e => setTrForm(p => ({ ...p, gross: e.target.value }))} />
                      </div>
                      <div className="fg">
                        <div className="fl">KKM Kabal Net SOL (75%)</div>
                        <input className="fi gold" type="number" value={trFormNet} placeholder="auto" readOnly />
                      </div>
                      <div className="fg">
                        <div className="fl">Team Burn ($)</div>
                        <input className="fi red" type="number" value={trForm.burn} placeholder="0" onChange={e => setTrForm(p => ({ ...p, burn: e.target.value }))} />
                      </div>
                      <div className="fg">
                        <div className="fl">USDC Reserve ($)</div>
                        <input className="fi blue" type="number" value={trForm.usdc} placeholder="0" onChange={e => setTrForm(p => ({ ...p, usdc: e.target.value }))} />
                      </div>
                      <div className="fg">
                        <div className="fl">BTC Reserve (₿)</div>
                        <input className="fi btc" type="number" value={trForm.btc} placeholder="0.0" step="0.0001" onChange={e => setTrForm(p => ({ ...p, btc: e.target.value }))} />
                      </div>
                      <div className="fg">
                        <div className="fl">SOL Price at recording</div>
                        <input className="fi" type="number" value={trForm.solP} placeholder="140" onChange={e => setTrForm(p => ({ ...p, solP: e.target.value }))} />
                      </div>
                      <div className="fg">
                        <div className="fl">Note</div>
                        <input className="fi" type="text" value={trForm.note} placeholder="3 new Angels..." style={{ width: "100%" }} onChange={e => setTrForm(p => ({ ...p, note: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
                      <button className="btn" onClick={trAdd}>✓ Add Week</button>
                      <button className="btn sec" onClick={trClear}>Clear</button>
                      <span style={{ fontSize: 8, color: "var(--text-dim)" }}>Net Kabal = Gross × 0.75 × SOL price (auto)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="acc">
                <div className={`acc-hdr${openAcc.has("tr-summary") ? " open" : ""}`} onClick={() => toggleAcc("tr-summary")}>
                  <span>📊</span>
                  <span className="acc-hdr-title">Summary</span>
                  <span className="acc-chevron">▼</span>
                </div>
                {openAcc.has("tr-summary") && (
                  <div className="acc-body">
                    <div className="sum-grid">
                      <div className="sc gold">
                        <div className="sc-tag">Cumul. KKM Revenue (Kabal)</div>
                        <div className="sc-val" style={{ color: "var(--gold)" }}>{fmt$(trTotalRev)}</div>
                        <div className="sc-sub">{trEntries.length} weeks logged</div>
                      </div>
                      <div className="sc blue">
                        <div className="sc-tag">Current USDC Reserve</div>
                        <div className="sc-val" style={{ color: "var(--blue)" }}>{lastEntry ? fmt$(parseFloat(lastEntry.usdc) || 0) : "$0"}</div>
                        <div className="sc-sub">{lastEntry ? `as of ${lastEntry.week}` : "—"}</div>
                      </div>
                      <div className="sc btc">
                        <div className="sc-tag">Current BTC Reserve</div>
                        <div className="sc-val" style={{ color: "var(--btc)" }}>{lastEntry ? fmtBtc(parseFloat(lastEntry.btc) || 0) : "₿0.0000"}</div>
                        <div className="sc-sub">{lastEntry ? `as of ${lastEntry.week}` : "—"}</div>
                      </div>
                      <div className="sc green">
                        <div className="sc-tag">Net (Rev − Burn)</div>
                        <div className="sc-val" style={{ color: trTotalNet >= 0 ? "var(--green)" : "var(--red)" }}>{fmt$(trTotalNet)}</div>
                        <div className="sc-sub">cumulative</div>
                      </div>
                    </div>
                    <div className="chart-outer">
                      <div className="chart-bars">
                        {trEntries.length === 0 ? (
                          <div style={{ color: "var(--text-dim)", fontSize: 8, letterSpacing: 1, margin: "auto" }}>No data yet</div>
                        ) : trEntries.map(e => {
                          const usdcH = Math.round(((parseFloat(e.usdc) || 0) / chartMax) * 100);
                          const btcH = Math.round(((parseFloat(e.btc) || 0) * 85000 / chartMax) * 100);
                          return (
                            <div key={e.id} className="cg">
                              <div className="ci">
                                <div className="cb cb-usdc" style={{ height: usdcH }} />
                                <div className="cb cb-btc" style={{ height: btcH }} />
                              </div>
                              <div className="cl">{e.week}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="chart-legend">
                        <div className="cleg"><div className="cdot" style={{ background: "var(--blue)" }} />USDC Reserve</div>
                        <div className="cleg"><div className="cdot" style={{ background: "var(--btc)" }} />BTC (×price)</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly History */}
              <div className="acc">
                <div className={`acc-hdr${openAcc.has("tr-history") ? " open" : ""}`} onClick={() => toggleAcc("tr-history")}>
                  <span>🗓</span>
                  <span className="acc-hdr-title">Weekly History</span>
                  <span className="acc-chevron">▼</span>
                </div>
                {openAcc.has("tr-history") && (
                  <div className="acc-body" style={{ padding: 0 }}>
                    <div className="tbl-wrap">
                      <table style={{ minWidth: 680 }}>
                        <thead>
                          <tr>
                            <th>Week</th><th>Gross (SOL)</th><th>Kabal Net (SOL)</th><th>Kabal ($)</th><th>Burn</th><th>Net P&L</th><th>USDC</th><th>BTC</th><th>Trend</th><th>Note</th><th />
                          </tr>
                        </thead>
                        <tbody>
                          {trEntries.length === 0 ? (
                            <tr><td colSpan={11} style={{ color: "var(--text-dim)", fontSize: 8, textAlign: "center", padding: 24, letterSpacing: 1 }}>— No weeks logged —</td></tr>
                          ) : trEntries.map(e => (
                            <tr key={e.id}>
                              <td className="td-dim">{e.week}</td>
                              <td className="td-sol">{fmtSol(e.gross)}</td>
                              <td className="td-gold">{fmtSol(e.kabalSol)}</td>
                              <td className="td-green">${e.kabalUsd}</td>
                              <td className="td-red">{e.burn ? fmt$(parseFloat(e.burn)) : "—"}</td>
                              <td className={parseFloat(e.netPnl) >= 0 ? "td-green" : "td-red"}>{parseFloat(e.netPnl) >= 0 ? "+" : ""}{fmt$(parseFloat(e.netPnl))}</td>
                              <td className="td-dim">{e.usdc ? fmt$(parseFloat(e.usdc)) : "—"}</td>
                              <td className="td-btc">{e.btc ? fmtBtc(parseFloat(e.btc)) : "—"}</td>
                              <td>
                                <span className={`badge badge-${e.trend === "up" ? "up" : e.trend === "down" ? "down" : "flat"}`}>
                                  {e.trend === "up" ? "▲" : e.trend === "down" ? "▼" : "—"}
                                </span>
                              </td>
                              <td className="td-dim">{e.note || "—"}</td>
                              <td><button className="del-btn" onClick={() => setTrEntries(p => p.filter(x => x.id !== e.id))}>✕</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 90-Day Targets */}
              <div className="acc">
                <div className={`acc-hdr${openAcc.has("tr-targets") ? " open" : ""}`} onClick={() => toggleAcc("tr-targets")}>
                  <span>🎯</span>
                  <span className="acc-hdr-title">90-Day Targets</span>
                  <span className="acc-chevron">▼</span>
                </div>
                {openAcc.has("tr-targets") && (
                  <div className="acc-body">
                    <div className="obj-grid">
                      {[
                        { cls: "gold", color: "var(--gold)", ico: "🔥", label: "March", lines: [["USDC net", "+$5k"], ["Weekly KKM", "$500–$1k"], ["BTC", "Start accumulating"]] },
                        { cls: "blue", color: "var(--blue)", ico: "⚡", label: "April", lines: [["USDC net", "+$25k"], ["Weekly KKM", "$5k+"], ["BTC", "+0.1 BTC"]] },
                        { cls: "btc", color: "var(--btc)", ico: "🚀", label: "May", lines: [["USDC net", "+$100k"], ["Weekly KKM", "$20k+"], ["BTC", "+0.5 BTC"]] },
                      ].map(({ cls, color, ico, label, lines }) => (
                        <div key={label} className={`obj-card ${cls}`}>
                          <div className="obj-title" style={{ color }}>{ico} {label}</div>
                          {lines.map(([l, v]) => (
                            <div key={l} className="obj-line">{l}: <b>{v}</b></div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
