export default function WarRoom() {
  return (
<>
  <meta charSet="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>Jungle Kabal — Internal HQ</title>
  <link
    href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
  <style
    dangerouslySetInnerHTML={{
      __html:
        "\n*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}\n:root{\n  --gold:#ffc300; --gold2:#ffd65a; --gold-dim:rgba(255,195,0,0.08);\n  --green:#2ecc71; --green-dim:rgba(46,204,113,0.1); --blue:#3b82f6;\n  --red:#ef4444; --btc:#f7931a; --sol:#9945ff; --sol-dim:rgba(153,69,255,0.1);\n  --bg:#0d0f0d; --s1:#111111; --s2:#0f0f0f; --s3:#151515;\n  --b1:#1f1f1f; --b2:#2a2a2a; --b3:#2b2b2b;\n  --text:#e5e7eb; --text-mid:#9ca3af; --text-dim:#6b7280;\n}\nhtml,body{min-height:100vh;background:var(--bg);color:var(--text);font-family:'Inter',sans-serif;}\ninput,button,select{font-family:'Inter',sans-serif;}\ninput[type=number]::-webkit-inner-spin-button{opacity:0.3;}\n.font-title{font-family:'Cinzel',serif;}\n\n/* ======= ANIMATIONS ======= */\n@keyframes glowPulse{0%{box-shadow:0 0 18px rgba(255,195,0,0.1);}50%{box-shadow:0 0 32px rgba(255,195,0,0.35);}100%{box-shadow:0 0 18px rgba(255,195,0,0.1);}}\n@keyframes buttonPulse{0%{box-shadow:0 0 0 0 rgba(255,195,0,0.6);}70%{box-shadow:0 0 0 14px rgba(255,195,0,0);}100%{box-shadow:0 0 0 0 rgba(255,195,0,0);}}\n@keyframes pulseDot{0%,100%{opacity:1;}50%{opacity:0.3;}}\n.pulse-glow{animation:glowPulse 6s ease-in-out infinite;}\n.floating-card{box-shadow:0 18px 45px rgba(0,0,0,0.45);transition:transform 0.35s ease,box-shadow 0.35s ease;}\n.floating-card:hover{transform:translateY(-4px);box-shadow:0 24px 60px rgba(255,195,0,0.10),0 18px 45px rgba(0,0,0,0.55);}\n\n/* ======= LAYOUT ======= */\n.layout{display:flex;min-height:100vh;}\n\n/* ======= SIDEBAR ======= */\n.sidebar{\n  width:220px;flex-shrink:0;\n  background:#0a0c0a;\n  border-right:1px solid var(--b1);\n  display:flex;flex-direction:column;\n  position:fixed;top:0;left:0;height:100vh;\n  z-index:100;overflow:hidden;\n}\n.sb-top{padding:20px 16px 16px;border-bottom:1px solid var(--b1);display:flex;align-items:center;gap:10px;}\n.sb-logo-img{width:38px;height:38px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(255,195,0,0.4));}\n.sb-name{font-family:'Cinzel',serif;font-size:12px;letter-spacing:2px;color:var(--gold);line-height:1.3;}\n.sb-sub{font-size:9px;letter-spacing:1px;color:var(--text-dim);margin-top:2px;}\n.sb-nav{flex:1;padding:14px 0;overflow-y:auto;}\n.sb-group{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;padding:10px 16px 4px;}\n.ni{display:flex;align-items:center;gap:10px;padding:10px 16px;cursor:pointer;border-left:2px solid transparent;transition:all 0.2s;color:var(--text-mid);text-decoration:none;}\n.ni:hover{background:var(--gold-dim);color:var(--gold);border-left-color:rgba(255,195,0,0.4);}\n.ni.active{background:var(--gold-dim);border-left-color:var(--gold);color:var(--gold);}\n.ni .ico{font-size:14px;width:18px;text-align:center;flex-shrink:0;}\n.ni .lbl{font-size:10px;letter-spacing:0.5px;font-weight:500;}\n.ni .bdg{margin-left:auto;font-size:7px;padding:1px 6px;border:1px solid rgba(255,195,0,0.3);color:rgba(255,195,0,0.7);border-radius:2px;}\n.sb-art{width:100%;display:block;opacity:0.09;filter:sepia(0.5) hue-rotate(10deg);}\n.sb-foot{padding:10px 14px;border-top:1px solid var(--b1);font-size:8px;color:var(--text-dim);}\n.sb-foot .sq{color:rgba(255,195,0,0.6);margin-bottom:3px;font-size:9px;}\n\n/* ======= CONTENT ======= */\n.content{margin-left:220px;flex:1;}\n\n/* ======= TOPBAR ======= */\n.topbar{\n  position:sticky;top:0;z-index:50;\n  background:rgba(13,15,13,0.95);backdrop-filter:blur(16px);\n  border-bottom:1px solid var(--b1);\n  padding:0 28px;height:52px;\n  display:flex;align-items:center;justify-content:space-between;\n}\n.tb-title{font-family:'Cinzel',serif;font-size:14px;letter-spacing:3px;color:var(--gold);}\n.tb-date{font-size:9px;letter-spacing:1px;color:var(--text-dim);}\n.save-btn{\n  font-size:9px;letter-spacing:1px;font-weight:600;\n  padding:7px 18px;\n  background:var(--gold);color:#000;border:none;cursor:pointer;\n  border-radius:9999px;transition:all 0.2s;text-transform:uppercase;\n  animation:buttonPulse 4s infinite;\n}\n.save-btn:hover{background:var(--gold2);}\n\n/* ======= PAGES ======= */\n.page{display:none;}\n.page.active{display:block;}\n.page-content{padding:28px 32px 64px;}\n\n/* ======= DASHBOARD ======= */\n\n/* Hero */\n.dash-hero{\n  position:relative;overflow:hidden;\n  border-radius:24px;border:1px solid var(--b1);\n  background:linear-gradient(135deg,#111 0%,#0d0f0d 100%);\n  padding:28px 32px;margin-bottom:24px;\n  display:flex;align-items:center;gap:20px;\n  box-shadow:0 20px 60px rgba(0,0,0,0.5);\n  min-height:130px;\n}\n.dash-hero-encart-l{position:absolute;left:-8px;top:-8px;width:130px;pointer-events:none;opacity:0.9;}\n.dash-hero-encart-r{position:absolute;right:-8px;bottom:-8px;width:130px;pointer-events:none;opacity:0.9;transform:rotate(180deg);}\n.dash-hero-char{position:absolute;right:130px;bottom:0;width:120px;pointer-events:none;}\n.dash-hero-logo{width:56px;height:56px;object-fit:contain;position:relative;z-index:2;filter:drop-shadow(0 0 16px rgba(255,195,0,0.5));}\n.dash-hero-text{position:relative;z-index:2;flex:1;}\n.dash-hero-title{font-family:'Cinzel',serif;font-size:26px;font-weight:700;color:var(--gold);letter-spacing:2px;line-height:1.1;}\n.dash-hero-sub{font-size:10px;color:var(--text-dim);letter-spacing:2px;text-transform:uppercase;margin-top:6px;}\n.dash-hero-badges{position:relative;z-index:2;display:flex;flex-direction:column;gap:6px;align-items:flex-end;}\n.hbadge{font-size:9px;padding:5px 14px;border:1px solid;border-radius:9999px;font-weight:600;letter-spacing:1px;text-transform:uppercase;}\n.hbadge.gold{border-color:var(--gold);color:var(--gold);}\n.hbadge.green{border-color:var(--green);color:var(--green);}\n\n/* Divider */\n.divider-img{width:100%;height:auto;display:block;max-height:60px;object-fit:contain;object-position:center;margin:8px 0;}\n\n/* Worth Section */\n.worth-wrap{\n  border-radius:20px;border:1px solid var(--b1);\n  overflow:hidden;margin-bottom:20px;\n  background:var(--s1);\n  box-shadow:0 20px 60px rgba(0,0,0,0.4);\n}\n.tier{border-bottom:1px solid var(--b1);}\n.tier:last-child{border-bottom:none;}\n.tier-body{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px;padding:20px 24px;}\n.tier-tag{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:6px;}\n.tier-sources{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px;}\n.tier-src{font-size:9px;color:var(--text-dim);display:flex;align-items:center;gap:4px;}\n.tier-src b{margin-left:4px;}\n.tier-val{font-family:'Cinzel',serif;font-size:36px;font-weight:700;letter-spacing:1px;line-height:1;}\n.tier-val.green{color:var(--green);}\n.tier-val.gold{color:var(--gold);}\n.tier-val.white{color:#fff;}\n.tier-note{font-size:8px;color:var(--text-dim);margin-top:5px;letter-spacing:0.5px;}\n.tier-icon{width:60px;height:60px;object-fit:contain;}\n\n/* Alloc */\n.alloc-wrap{padding:14px 24px 18px;}\n.alloc-label{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:7px;}\n.alloc-track{height:7px;background:#0b0c0b;border:1px solid var(--b2);border-radius:4px;display:flex;overflow:hidden;}\n.alloc-seg{height:100%;transition:width 0.5s ease;}\n.alloc-leg{display:flex;gap:14px;flex-wrap:wrap;margin-top:7px;}\n.al-item{display:flex;align-items:center;gap:5px;font-size:8px;color:var(--text-dim);}\n.al-dot{width:8px;height:8px;border-radius:2px;flex-shrink:0;}\n\n/* KPI Grid */\n.kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}\n.kpi{\n  border-radius:16px;border:1px solid var(--b1);\n  background:var(--s1);padding:16px 18px;\n  position:relative;overflow:hidden;\n}\n.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}\n.kpi.k-green::before{background:var(--green);}\n.kpi.k-gold::before{background:var(--gold);}\n.kpi.k-btc::before{background:var(--btc);}\n.kpi.k-sol::before{background:var(--sol);}\n.kpi-tag{font-size:8px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;display:flex;align-items:center;gap:5px;}\n.kpi-tag img{width:16px;height:16px;object-fit:contain;}\n.kpi-val{font-family:'Cinzel',serif;font-size:24px;font-weight:700;line-height:1;}\n.kpi-val.green{color:var(--green);}\n.kpi-val.gold{color:var(--gold);}\n.kpi-val.btc{color:var(--btc);}\n.kpi-val.sol{color:var(--sol);}\n.kpi-sub{font-size:8px;color:var(--text-dim);margin-top:5px;line-height:1.5;}\n\n/* KKM Block */\n.kkm-block{\n  border-radius:16px;border:1px solid rgba(153,69,255,0.25);\n  background:var(--sol-dim);padding:18px 22px;\n  margin-bottom:20px;\n  display:flex;align-items:center;gap:20px;flex-wrap:wrap;\n}\n.kkm-header{flex-shrink:0;}\n.kkm-label{font-size:8px;letter-spacing:2px;color:var(--sol);text-transform:uppercase;margin-bottom:4px;}\n.kkm-desc{font-size:8px;color:var(--text-dim);}\n.kkm-vals{display:flex;gap:24px;flex:1;flex-wrap:wrap;}\n.kkm-item{}\n.kkm-v{font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--sol);}\n.kkm-s{font-size:7px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;}\n.kkm-ico{width:48px;height:48px;object-fit:contain;}\n\n/* Runway */\n.runway{\n  border-radius:16px;border:1px solid var(--b1);\n  background:var(--s1);padding:16px 22px;\n  margin-bottom:20px;\n  display:flex;align-items:center;gap:16px;flex-wrap:wrap;\n  border-left:3px solid var(--green);\n}\n.rw-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}\n.rw-dot.green{background:var(--green);box-shadow:0 0 8px var(--green);animation:pulseDot 2s infinite;}\n.rw-dot.yellow{background:var(--gold);box-shadow:0 0 8px var(--gold);animation:pulseDot 1s infinite;}\n.rw-dot.red{background:var(--red);box-shadow:0 0 8px var(--red);}\n.rw-text{flex:1;}\n.rw-title{font-size:11px;font-weight:600;letter-spacing:1px;margin-bottom:2px;}\n.rw-sub{font-size:8px;color:var(--text-dim);}\n.rw-weeks{font-family:'Cinzel',serif;font-size:26px;font-weight:700;}\n.rw-weeks-label{font-size:7px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;}\n\n/* Progress */\n.prog-block{\n  border-radius:16px;border:1px solid var(--b1);\n  background:var(--s1);padding:16px 22px;\n  margin-bottom:20px;\n  border-left:3px solid var(--gold);\n}\n.prog-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}\n.prog-lbl{font-size:8px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;width:90px;flex-shrink:0;}\n.prog-track{flex:1;height:7px;background:#0b0c0b;border:1px solid var(--b2);border-radius:4px;min-width:120px;position:relative;overflow:hidden;}\n.prog-fill{height:100%;background:linear-gradient(to right,var(--gold),var(--gold2));border-radius:4px;transition:width 0.6s ease;}\n.prog-stats{display:flex;gap:20px;flex-wrap:wrap;}\n.ps{text-align:center;}\n.ps-val{font-family:'Cinzel',serif;font-size:15px;font-weight:700;}\n.ps-lbl{font-size:7px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-top:2px;}\n\n/* ======= WAR ROOM ======= */\n.wr-section-title{\n  font-family:'Cinzel',serif;font-size:13px;font-weight:600;\n  letter-spacing:2px;color:var(--gold);\n  margin-bottom:14px;padding-bottom:8px;\n  border-bottom:1px solid var(--b1);\n  display:flex;align-items:center;gap:10px;\n}\n\n.acc{border-radius:16px;border:1px solid var(--b1);overflow:hidden;margin-bottom:12px;}\n.acc-hdr{\n  display:flex;align-items:center;gap:10px;padding:14px 18px;\n  cursor:pointer;transition:background 0.2s;\n  background:var(--s1);user-select:none;\n}\n.acc-hdr:hover{background:#131513;}\n.acc-hdr.open{border-bottom:1px solid var(--b1);background:#131513;}\n.acc-hdr-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:1px;flex:1;color:var(--text);}\n.acc-badge{font-size:7px;padding:2px 8px;border:1px solid rgba(255,195,0,0.3);color:rgba(255,195,0,0.7);border-radius:9999px;letter-spacing:1px;}\n.acc-chevron{color:var(--text-dim);font-size:10px;transition:transform 0.3s;}\n.acc-hdr.open .acc-chevron{transform:rotate(180deg);}\n.acc-body{display:none;background:var(--s2);padding:18px;}\n.acc-hdr.open+.acc-body{display:block;}\n\n.input-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:14px;}\n.fg{display:flex;flex-direction:column;gap:4px;}\n.fl{font-size:8px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;}\n.fi{\n  background:#0d0f0d;border:1px solid var(--b2);\n  color:var(--text);font-size:10px;\n  padding:8px 10px;outline:none;width:100%;\n  border-radius:8px;transition:border-color 0.2s;\n}\n.fi:focus{border-color:var(--gold);}\n.fi.gold{color:var(--gold);}\n.fi.green{color:var(--green);}\n.fi.blue{color:var(--blue);}\n.fi.red{color:var(--red);}\n.fi.sol{color:var(--sol);}\n.fi.btc{color:var(--btc);}\n\n.btn{\n  display:inline-flex;align-items:center;justify-content:center;\n  font-size:9px;font-weight:600;letter-spacing:1px;\n  padding:8px 18px;border:1px solid var(--gold);\n  color:var(--gold);background:transparent;cursor:pointer;\n  text-transform:uppercase;border-radius:9999px;\n  transition:all 0.2s;\n}\n.btn:hover{background:var(--gold);color:#000;}\n.btn.sec{border-color:var(--b2);color:var(--text-mid);}\n.btn.sec:hover{background:var(--b2);color:var(--text);}\n\n.card{\n  border-radius:12px;border:1px solid var(--b1);\n  background:var(--s2);padding:14px 16px;position:relative;overflow:hidden;\n}\n.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}\n.card.c-gold::before{background:var(--gold);}\n.card.c-green::before{background:var(--green);}\n.card.c-sol::before{background:var(--sol);}\n.card.c-dim::before{background:var(--b2);}\n.card-tag{font-size:7px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;margin-bottom:8px;}\n.card-val{font-family:'Cinzel',serif;font-size:22px;font-weight:700;}\n.card-val.gold{color:var(--gold);}\n.card-val.green{color:var(--green);}\n.card-val.sol{color:var(--sol);}\n.card-val.dim{color:var(--text-mid);}\n\n.add-form{display:none;background:#0b0c0b;border:1px solid rgba(255,195,0,0.2);border-radius:12px;padding:14px;margin-top:10px;gap:10px;flex-wrap:wrap;align-items:flex-end;}\n.add-form.open{display:flex;}\n\n/* Log table */\n.log-wrap{border-radius:16px;border:1px solid var(--b1);background:var(--s1);overflow:hidden;margin-bottom:12px;}\n.log-hdr{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--b1);}\n.log-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;letter-spacing:1px;color:var(--gold);}\n.tbl-wrap{overflow-x:auto;}\ntable{width:100%;border-collapse:collapse;font-size:9px;}\nth{text-align:left;font-size:7px;letter-spacing:1px;color:var(--text-dim);padding:8px 12px;border-bottom:1px solid var(--b1);text-transform:uppercase;white-space:nowrap;}\ntd{padding:10px 12px;border-bottom:1px solid #0f1010;vertical-align:middle;}\ntr:last-child td{border-bottom:none;}\ntbody tr:hover td{background:rgba(255,255,255,0.02);}\n.td-gold{color:var(--gold);font-weight:600;}\n.td-green{color:var(--green);font-weight:600;}\n.td-red{color:var(--red);font-weight:600;}\n.td-sol{color:var(--sol);font-weight:600;}\n.td-btc{color:var(--btc);font-weight:600;}\n.td-dim{color:var(--text-mid);}\n.del-btn{background:none;border:none;color:#2a2a2a;cursor:pointer;font-size:12px;padding:2px 8px;transition:color 0.2s;border-radius:4px;}\n.del-btn:hover{color:var(--red);background:rgba(239,68,68,0.1);}\n.current-row td{background:rgba(255,195,0,0.04);}\n\n/* Grid helpers */\n.g2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;}\n.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:14px;}\n.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}\n@media(max-width:900px){.g2,.g3,.g4,.kpi-grid{grid-template-columns:1fr;}}\n\n/* Treasury */\n.sum-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}\n.sc{border-radius:12px;border:1px solid var(--b1);background:var(--s1);padding:14px 16px;position:relative;overflow:hidden;}\n.sc::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}\n.sc.gold::before{background:var(--gold);}\n.sc.blue::before{background:var(--blue);}\n.sc.btc::before{background:var(--btc);}\n.sc.green::before{background:var(--green);}\n.sc-tag{font-size:7px;letter-spacing:1px;color:var(--text-dim);text-transform:uppercase;margin-bottom:6px;}\n.sc-val{font-family:'Cinzel',serif;font-size:22px;font-weight:700;line-height:1;}\n.sc-sub{font-size:8px;color:var(--text-dim);margin-top:4px;}\n\n.chart-outer{border-radius:16px;border:1px solid var(--b1);background:var(--s1);padding:16px;margin-bottom:12px;}\n.chart-bars{display:flex;align-items:flex-end;gap:5px;height:110px;padding:0 2px;}\n.cg{display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;min-width:24px;}\n.ci{display:flex;gap:2px;align-items:flex-end;width:100%;}\n.cb{flex:1;border-radius:2px 2px 0 0;transition:height 0.5s ease;}\n.cb-usdc{background:linear-gradient(to top,var(--blue),#60a5fa);}\n.cb-btc{background:linear-gradient(to top,var(--btc),#fbbf24);}\n.cl{font-size:5px;letter-spacing:0.5px;color:var(--text-dim);text-align:center;}\n.chart-legend{display:flex;gap:14px;margin-top:8px;flex-wrap:wrap;}\n.cleg{display:flex;align-items:center;gap:5px;font-size:8px;color:var(--text-dim);}\n.cdot{width:8px;height:8px;border-radius:2px;}\n\n.badge{display:inline-flex;align-items:center;font-size:7px;letter-spacing:0.5px;padding:2px 8px;border:1px solid;border-radius:9999px;text-transform:uppercase;}\n.badge-up{border-color:var(--green);color:var(--green);}\n.badge-down{border-color:var(--red);color:var(--red);}\n.badge-flat{border-color:var(--b3);color:var(--text-dim);}\n\n.obj-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}\n.obj-card{border-radius:16px;border:1px solid var(--b1);background:var(--s1);padding:16px;position:relative;overflow:hidden;}\n.obj-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}\n.obj-card.gold::before{background:var(--gold);}\n.obj-card.blue::before{background:var(--blue);}\n.obj-card.btc::before{background:var(--btc);}\n.obj-title{font-family:'Cinzel',serif;font-size:12px;font-weight:600;margin-bottom:10px;}\n.obj-line{font-size:8px;color:var(--text-dim);line-height:2;}\n.obj-line b{color:var(--text);}\n\n/* Toast */\n.toast{position:fixed;bottom:24px;right:24px;background:var(--gold);color:#000;font-size:9px;letter-spacing:2px;padding:10px 22px;text-transform:uppercase;font-weight:700;transform:translateY(80px);opacity:0;transition:all 0.3s;z-index:999;border-radius:9999px;}\n.toast.show{transform:translateY(0);opacity:1;}\n"
    }}
  />
  <div className="toast" id="toast">
    Saved ✓
  </div>
  <div className="layout">
    {/* SIDEBAR */}
    <aside className="sidebar">
      <div className="sb-top">
        <img
          className="sb-logo-img"
          src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
          alt="JK"
        />
        <div>
          <div className="sb-name">
            JUNGLE
            <br />
            KABAL
          </div>
          <div className="sb-sub">Internal HQ v3</div>
        </div>
      </div>
      <nav className="sb-nav">
        <div className="sb-group">Live</div>
        <div className="ni active" onclick="showPage('dash',this)">
          <span className="ico">👁</span>
          <span className="lbl">Dashboard</span>
          <span className="bdg">LIVE</span>
        </div>
        <div className="ni" onclick="showPage('warroom',this)">
          <span className="ico">⚔</span>
          <span className="lbl">War Room</span>
        </div>
        <div className="ni" onclick="showPage('treasury',this)">
          <span className="ico">🏦</span>
          <span className="lbl">Treasury</span>
        </div>
        <div className="sb-group" style={{ marginTop: 6 }}>
          Coming Soon
        </div>
        <div className="ni" style={{ opacity: "0.3", cursor: "default" }}>
          <span className="ico">🗺</span>
          <span className="lbl">Roadmap</span>
          <span className="bdg">SOON</span>
        </div>
        <div className="ni" style={{ opacity: "0.3", cursor: "default" }}>
          <span className="ico">👼</span>
          <span className="lbl">Angels CRM</span>
          <span className="bdg">SOON</span>
        </div>
      </nav>
      <img
        className="sb-art"
        src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
        alt=""
      />
      <div className="sb-foot">
        <div className="sq">⚡ Squad of 5 — Bite &amp; Knife</div>
        <div>90-Day Sprint · Mar → May 2026</div>
      </div>
    </aside>
    {/* CONTENT */}
    <div className="content">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="tb-title" id="tb-title">
            DASHBOARD
          </div>
          <div style={{ width: 1, height: 14, background: "var(--b1)" }} />
          <div className="tb-date" id="tb-date" />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap"
          }}
        >
          <div
            id="sync-badge"
            style={{
              fontSize: 9,
              letterSpacing: "0.5px",
              padding: "4px 12px",
              background: "rgba(46,204,113,0.06)",
              border: "1px solid rgba(46,204,113,0.2)",
              color: "var(--text-mid)",
              borderRadius: 9999
            }}
          >
            ○ Mode local
          </div>
          <div
            id="price-badge"
            style={{
              fontSize: 9,
              letterSpacing: "0.5px",
              padding: "4px 12px",
              background: "rgba(255,195,0,0.06)",
              border: "1px solid rgba(255,195,0,0.2)",
              color: "var(--text-mid)",
              borderRadius: 9999,
              fontFamily: '"Inter",sans-serif'
            }}
          >
            ⏳ Chargement des prix...
          </div>
          <div
            id="tb-status"
            style={{
              fontSize: 8,
              letterSpacing: 1,
              padding: "4px 14px",
              border: "1px solid var(--green)",
              color: "var(--green)",
              borderRadius: 9999
            }}
          >
            ● ONLINE
          </div>
          <button className="save-btn" onclick="saveAll()">
            Save ◈
          </button>
        </div>
      </div>
      {/* ============================================================
     DASHBOARD
============================================================ */}
      <div className="page active" id="page-dash">
        <div className="page-content">
          {/* HERO */}
          <div className="dash-hero pulse-glow">
            <img
              className="dash-hero-encart-l"
              src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
              alt=""
            />
            <img
              className="dash-hero-encart-r"
              src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
              alt=""
            />
            <img
              className="dash-hero-char"
              src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
              alt=""
            />
            <img
              className="dash-hero-logo"
              src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
              alt=""
            />
            <div className="dash-hero-text">
              <div className="dash-hero-title">KABAL COMMAND CENTER</div>
              <div className="dash-hero-sub">
                Internal financial dashboard · Squad of 5 · 90-Day Sprint
              </div>
            </div>
            <div className="dash-hero-badges">
              <div className="hbadge gold">Only The Chosen</div>
              <div className="hbadge green" id="sprint-badge">
                March — Phase 1
              </div>
            </div>
          </div>
          {/* DIVIDER */}
          <img
            className="divider-img"
            src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
            alt=""
          />
          {/* WORTH */}
          <div className="worth-wrap">
            <div className="tier">
              <div className="tier-body">
                <div>
                  <div className="tier-tag">🏆 Kabal Real Net Worth</div>
                  <div className="tier-sources">
                    <div className="tier-src">
                      USDC Reserve{" "}
                      <b id="d-usdc" style={{ color: "var(--blue)" }}>
                        $0
                      </b>
                    </div>
                    <div className="tier-src">
                      BTC Reserve{" "}
                      <b id="d-btc" style={{ color: "var(--btc)" }}>
                        ₿0.0000
                      </b>
                    </div>
                  </div>
                  <div className="tier-val green" id="d-net">
                    $0
                  </div>
                  <div className="tier-note">
                    Stable reserves only — USDC + BTC · No SOL counted
                  </div>
                </div>
                <img
                  className="tier-icon"
                  src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
                  alt=""
                />
              </div>
            </div>
            <div className="tier">
              <div className="tier-body">
                <div>
                  <div className="tier-tag">
                    ⚡ Kabal Net Worth{" "}
                    <span
                      style={{
                        fontSize: 7,
                        color: "var(--text-dim)",
                        marginLeft: 4
                      }}
                    >
                      incl. SOL ammo
                    </span>
                  </div>
                  <div className="tier-sources">
                    <div className="tier-src">Real Net Worth</div>
                    <div className="tier-src">
                      + SOL Ammo{" "}
                      <b id="d-sol" style={{ color: "var(--sol)" }}>
                        ◎0
                      </b>
                    </div>
                  </div>
                  <div className="tier-val gold" id="d-net-sol">
                    $0
                  </div>
                  <div className="tier-note">
                    Real Net Worth + SOL ammunition at current price
                  </div>
                </div>
                <img
                  className="tier-icon"
                  src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
                  alt=""
                />
              </div>
            </div>
            <div className="tier">
              <div className="tier-body">
                <div>
                  <div className="tier-tag">🌐 Total Kabal Worth</div>
                  <div className="tier-sources">
                    <div className="tier-src">Net Worth + SOL</div>
                    <div className="tier-src">
                      Ops Wallet{" "}
                      <b id="d-ops" style={{ color: "var(--blue)" }}>
                        $0
                      </b>
                    </div>
                    <div className="tier-src">
                      LP Reserve{" "}
                      <b id="d-lp" style={{ color: "var(--sol)" }}>
                        $0
                      </b>
                    </div>
                  </div>
                  <div className="tier-val white" id="d-total">
                    $0
                  </div>
                  <div className="tier-note">
                    Everything combined — full picture
                  </div>
                </div>
                <img
                  className="tier-icon"
                  src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
                  alt=""
                />
              </div>
              <div className="alloc-wrap">
                <div className="alloc-label">Capital Allocation</div>
                <div className="alloc-track">
                  <div
                    className="alloc-seg"
                    id="a-usdc"
                    style={{ background: "var(--blue)", width: "0%" }}
                  />
                  <div
                    className="alloc-seg"
                    id="a-btc"
                    style={{ background: "var(--btc)", width: "0%" }}
                  />
                  <div
                    className="alloc-seg"
                    id="a-sol"
                    style={{ background: "var(--sol)", width: "0%" }}
                  />
                  <div
                    className="alloc-seg"
                    id="a-ops"
                    style={{ background: "rgba(59,130,246,0.5)", width: "0%" }}
                  />
                </div>
                <div className="alloc-leg">
                  <div className="al-item">
                    <div
                      className="al-dot"
                      style={{ background: "var(--blue)" }}
                    />
                    USDC{" "}
                    <b
                      id="pct-usdc"
                      style={{ color: "var(--text)", marginLeft: 3 }}
                    >
                      0%
                    </b>
                  </div>
                  <div className="al-item">
                    <div
                      className="al-dot"
                      style={{ background: "var(--btc)" }}
                    />
                    BTC{" "}
                    <b
                      id="pct-btc"
                      style={{ color: "var(--text)", marginLeft: 3 }}
                    >
                      0%
                    </b>
                  </div>
                  <div className="al-item">
                    <div
                      className="al-dot"
                      style={{ background: "var(--sol)" }}
                    />
                    SOL{" "}
                    <b
                      id="pct-sol"
                      style={{ color: "var(--text)", marginLeft: 3 }}
                    >
                      0%
                    </b>
                  </div>
                  <div className="al-item">
                    <div
                      className="al-dot"
                      style={{ background: "rgba(59,130,246,0.5)" }}
                    />
                    Ops+LP{" "}
                    <b
                      id="pct-ops"
                      style={{ color: "var(--text)", marginLeft: 3 }}
                    >
                      0%
                    </b>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* DIVIDER */}
          <img
            className="divider-img"
            src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
            alt=""
            style={{ transform: "scaleX(-1)" }}
          />
          {/* KKM — separate from net worth */}
          <div className="kkm-block">
            <img
              className="kkm-ico"
              src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
              alt=""
            />
            <div className="kkm-header">
              <div className="kkm-label">⚡ KKM — Tugan Partnership</div>
              <div className="kkm-desc">
                Joint operation · 75% Kabal / 25% Tugan · Not in net worth
              </div>
            </div>
            <div className="kkm-vals">
              <div className="kkm-item">
                <div className="kkm-v" id="d-kkm-sol">
                  ◎0.00
                </div>
                <div className="kkm-s">Weekly Fees (Kabal 75%)</div>
              </div>
              <div className="kkm-item">
                <div
                  className="kkm-v"
                  id="d-kkm-usd"
                  style={{ fontSize: 14, marginTop: 5 }}
                >
                  $0
                </div>
                <div className="kkm-s">USD equiv.</div>
              </div>
              <div className="kkm-item">
                <div className="kkm-v" id="d-kkm-monthly">
                  $0
                </div>
                <div className="kkm-s">Est. Monthly (×4)</div>
              </div>
            </div>
          </div>
          {/* RUNWAY */}
          <div className="runway" id="runway">
            <div className="rw-dot green" id="rw-dot" />
            <div className="rw-text">
              <div
                className="rw-title"
                id="rw-title"
                style={{ color: "var(--green)" }}
              >
                OPS RUNWAY — HEALTHY
              </div>
              <div className="rw-sub" id="rw-sub">
                Enter weekly burn in War Room to calculate
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="rw-weeks-label">Weeks of runway</div>
              <div
                className="rw-weeks"
                id="rw-weeks"
                style={{ color: "var(--green)" }}
              >
                —
              </div>
            </div>
          </div>
          {/* PROGRESS */}
          <div className="prog-block">
            <div className="prog-row">
              <div className="prog-lbl">March Sprint</div>
              <div className="prog-track">
                <div
                  className="prog-fill"
                  id="d-prog"
                  style={{ width: "0%" }}
                />
              </div>
              <div className="prog-stats">
                <div className="ps">
                  <div
                    className="ps-val"
                    id="d-month"
                    style={{ color: "var(--gold)" }}
                  >
                    $0
                  </div>
                  <div className="ps-lbl">Month Total</div>
                </div>
                <div className="ps">
                  <div className="ps-val" style={{ color: "var(--text-dim)" }}>
                    $15.5k
                  </div>
                  <div className="ps-lbl">Min Target</div>
                </div>
                <div className="ps">
                  <div className="ps-val" style={{ color: "var(--text-dim)" }}>
                    $31k
                  </div>
                  <div className="ps-lbl">Max Target</div>
                </div>
              </div>
            </div>
          </div>
          {/* KPI CARDS */}
          <div className="kpi-grid">
            <div className="kpi k-gold">
              <div className="kpi-tag">Daily Fees (KKM)</div>
              <div className="kpi-val gold" id="d-daily">
                $0
              </div>
              <div className="kpi-sub">Kabal 75% net · today</div>
            </div>
            <div className="kpi k-sol">
              <div className="kpi-tag">
                <img
                  src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
                  alt=""
                />
                SOL Ammo
              </div>
              <div className="kpi-val sol" id="d-sol-kpi">
                ◎0
              </div>
              <div className="kpi-sub">Trading bullets — off balance</div>
            </div>
            <div className="kpi k-green">
              <div className="kpi-tag">USDC Reserve</div>
              <div className="kpi-val green" id="d-usdc-kpi">
                $0
              </div>
              <div className="kpi-sub">Primary net KPI</div>
            </div>
            <div className="kpi k-btc">
              <div className="kpi-tag">BTC Reserve</div>
              <div className="kpi-val btc" id="d-btc-kpi">
                ₿0.0000
              </div>
              <div className="kpi-sub">Long-term accumulation</div>
            </div>
          </div>
          {/* FOOTER ART */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginTop: 24,
              opacity: "0.5"
            }}
          >
            <img
              src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
              alt=""
              style={{ width: 60, height: 60, objectFit: "contain" }}
            />
            <div
              style={{
                fontFamily: '"Cinzel",serif',
                fontSize: 9,
                letterSpacing: 3,
                color: "var(--text-dim)",
                textTransform: "uppercase"
              }}
            >
              Only The Chosen
            </div>
            <img
              src="https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png"
              alt=""
              style={{
                width: 60,
                height: 60,
                objectFit: "contain",
                transform: "scaleX(-1)"
              }}
            />
          </div>
        </div>
      </div>
      {/* /page dash */}
      {/* ============================================================
     WAR ROOM
============================================================ */}
      <div className="page" id="page-warroom">
        <div className="page-content">
          <div className="wr-section-title">💰 Reserves &amp; Net Worth</div>
          <div className="acc">
            <div className="acc-hdr open" onclick="toggleAcc(this)">
              <span>🏦</span>
              <span className="acc-hdr-title">
                Stable Reserves (USDC + BTC)
              </span>
              <span className="acc-badge">Real Net Worth</span>
              <span className="acc-chevron">▼</span>
            </div>
            <div className="acc-body">
              <div className="input-grid">
                <div className="fg">
                  <div className="fl">💵 USDC Reserve</div>
                  <input
                    className="fi gold"
                    type="number"
                    id="w-usdc"
                    defaultValue={0}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">₿ BTC Reserve</div>
                  <input
                    className="fi btc"
                    type="number"
                    id="w-btc"
                    defaultValue={0}
                    step="0.0001"
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">
                    BTC Price ($){" "}
                    <span style={{ fontSize: 8, color: "var(--green)" }}>
                      ● live
                    </span>
                  </div>
                  <input
                    className="fi"
                    type="number"
                    id="w-btcP"
                    defaultValue={85000}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">ETH Reserve</div>
                  <input
                    className="fi"
                    style={{ borderColor: "rgba(100,150,255,0.4)" }}
                    type="number"
                    id="w-eth"
                    defaultValue={0}
                    step="0.001"
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">
                    ETH Price ($){" "}
                    <span style={{ fontSize: 8, color: "var(--green)" }}>
                      ● live
                    </span>
                  </div>
                  <input
                    className="fi"
                    type="number"
                    id="w-ethP"
                    defaultValue={3000}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">◎ SOL Ammo</div>
                  <input
                    className="fi sol"
                    type="number"
                    id="w-sol"
                    defaultValue={0}
                    step="0.1"
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">
                    SOL Price ($){" "}
                    <span style={{ fontSize: 8, color: "var(--green)" }}>
                      ● live
                    </span>
                  </div>
                  <input
                    className="fi"
                    type="number"
                    id="w-solP"
                    defaultValue={140}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">
                    Autres Cryptos ($){" "}
                    <span style={{ fontSize: 8, color: "var(--text-dim)" }}>
                      valeur totale USD
                    </span>
                  </div>
                  <input
                    className="fi"
                    style={{ borderColor: "rgba(180,180,180,0.3)" }}
                    type="number"
                    id="w-others"
                    defaultValue={0}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">💼 Ops Wallet (USDC)</div>
                  <input
                    className="fi blue"
                    type="number"
                    id="w-ops"
                    defaultValue={0}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">🌊 LP Reserve (USDC)</div>
                  <input
                    className="fi blue"
                    type="number"
                    id="w-lpU"
                    defaultValue={0}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">🌊 LP Reserve (SOL)</div>
                  <input
                    className="fi sol"
                    type="number"
                    id="w-lpS"
                    defaultValue={0}
                    step="0.1"
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">Weekly Team Burn ($)</div>
                  <input
                    className="fi red"
                    type="number"
                    id="w-burn"
                    defaultValue={0}
                    oninput="calcAll()"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="acc">
            <div className="acc-hdr open" onclick="toggleAcc(this)">
              <span>⚡</span>
              <span className="acc-hdr-title">KKM Weekly Fees — SOL Entry</span>
              <span className="acc-badge">75% Kabal · 25% Tugan</span>
              <span className="acc-chevron">▼</span>
            </div>
            <div className="acc-body">
              <div
                style={{
                  fontSize: 9,
                  color: "var(--text-dim)",
                  marginBottom: 12
                }}
              >
                Enter GROSS SOL fees generated by KKM this week. The Tugan 25%
                split is auto-calculated.
              </div>
              <div className="input-grid">
                <div className="fg">
                  <div className="fl">Gross Fees (SOL)</div>
                  <input
                    className="fi sol"
                    type="number"
                    id="w-kkmG"
                    defaultValue={0}
                    step="0.01"
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">SOL Price at recording</div>
                  <input
                    className="fi"
                    type="number"
                    id="w-kkmP"
                    defaultValue={140}
                    oninput="calcAll()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">Daily Fees (Kabal $, manual)</div>
                  <input
                    className="fi gold"
                    type="number"
                    id="w-daily"
                    defaultValue={0}
                    oninput="calcAll()"
                  />
                </div>
              </div>
              <div className="g4">
                <div className="card c-sol">
                  <div className="card-tag">Gross Fees</div>
                  <div className="card-val sol" id="wr-gross">
                    ◎0.00
                  </div>
                </div>
                <div className="card c-dim">
                  <div className="card-tag">Tugan 25%</div>
                  <div className="card-val dim" id="wr-tugan">
                    ◎0.00
                  </div>
                </div>
                <div className="card c-gold">
                  <div className="card-tag">Kabal Net 75%</div>
                  <div className="card-val gold" id="wr-net">
                    ◎0.00
                  </div>
                </div>
                <div className="card c-green">
                  <div className="card-tag">USD Equiv.</div>
                  <div className="card-val green" id="wr-usd">
                    $0
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="wr-section-title" style={{ marginTop: 20 }}>
            📋 Daily Fee Log
          </div>
          <div className="log-wrap">
            <div className="log-hdr">
              <div className="log-title">Fee Entries</div>
              <button className="btn" onclick="toggleForm('wr-form')">
                + Add Entry
              </button>
            </div>
            <div className="add-form" id="wr-form">
              <div className="fg">
                <div className="fl">Date</div>
                <input
                  className="fi"
                  type="date"
                  id="wr-fDate"
                  style={{ width: 130 }}
                />
              </div>
              <div className="fg">
                <div className="fl">Gross Fees (SOL)</div>
                <input
                  className="fi sol"
                  type="number"
                  id="wr-fG"
                  placeholder={0.0}
                  style={{ width: 120 }}
                  oninput="wrAutoNet()"
                />
              </div>
              <div className="fg">
                <div className="fl">Kabal Net ($)</div>
                <input
                  className="fi gold"
                  type="number"
                  id="wr-fNet"
                  placeholder="auto"
                  style={{ width: 110 }}
                  readOnly=""
                />
              </div>
              <div className="fg">
                <div className="fl">Source</div>
                <input
                  className="fi"
                  type="text"
                  id="wr-fSrc"
                  placeholder="KKM"
                  style={{ width: 140 }}
                />
              </div>
              <div className="fg">
                <div className="fl">Note</div>
                <input
                  className="fi"
                  type="text"
                  id="wr-fNote"
                  placeholder="Optional"
                  style={{ width: 140 }}
                />
              </div>
              <button className="btn" onclick="wrAdd()">
                ✓ Add
              </button>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Gross (SOL)</th>
                    <th>Tugan 25%</th>
                    <th>Kabal 75%</th>
                    <th>Kabal ($)</th>
                    <th>Source</th>
                    <th>Note</th>
                    <th />
                  </tr>
                </thead>
                <tbody id="wr-body">
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        color: "var(--text-dim)",
                        fontSize: 8,
                        textAlign: "center",
                        padding: 24,
                        letterSpacing: 1
                      }}
                    >
                      — No entries yet. Start logging. —
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* ============================================================
     TREASURY
============================================================ */}
      <div className="page" id="page-treasury">
        <div className="page-content">
          <div className="acc">
            <div className="acc-hdr open" onclick="toggleAcc(this)">
              <span>➕</span>
              <span className="acc-hdr-title">Log a Week</span>
              <span className="acc-chevron">▼</span>
            </div>
            <div className="acc-body">
              <div className="input-grid">
                <div className="fg">
                  <div className="fl">Week Label</div>
                  <input
                    className="fi"
                    type="text"
                    id="tr-week"
                    placeholder="W01 March"
                    style={{ width: "100%" }}
                  />
                </div>
                <div className="fg">
                  <div className="fl">KKM Gross Fees (SOL)</div>
                  <input
                    className="fi sol"
                    type="number"
                    id="tr-fG"
                    placeholder={0.0}
                    step="0.01"
                    oninput="trCalc()"
                  />
                </div>
                <div className="fg">
                  <div className="fl">KKM Kabal Net SOL (75%)</div>
                  <input
                    className="fi gold"
                    type="number"
                    id="tr-fN"
                    placeholder="auto"
                    readOnly=""
                  />
                </div>
                <div className="fg">
                  <div className="fl">Team Burn ($)</div>
                  <input
                    className="fi red"
                    type="number"
                    id="tr-burn"
                    placeholder={0}
                  />
                </div>
                <div className="fg">
                  <div className="fl">USDC Reserve ($)</div>
                  <input
                    className="fi blue"
                    type="number"
                    id="tr-usdc"
                    placeholder={0}
                  />
                </div>
                <div className="fg">
                  <div className="fl">BTC Reserve (₿)</div>
                  <input
                    className="fi btc"
                    type="number"
                    id="tr-btc"
                    placeholder={0.0}
                    step="0.0001"
                  />
                </div>
                <div className="fg">
                  <div className="fl">SOL Price at recording</div>
                  <input
                    className="fi"
                    type="number"
                    id="tr-solP"
                    placeholder={140}
                  />
                </div>
                <div className="fg">
                  <div className="fl">Note</div>
                  <input
                    className="fi"
                    type="text"
                    id="tr-note"
                    placeholder="3 new Angels..."
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  alignItems: "center",
                  marginTop: 8
                }}
              >
                <button className="btn" onclick="trAdd()">
                  ✓ Add Week
                </button>
                <button className="btn sec" onclick="trClear()">
                  Clear
                </button>
                <span style={{ fontSize: 8, color: "var(--text-dim)" }}>
                  Net Kabal = Gross × 0.75 × SOL price (auto)
                </span>
              </div>
            </div>
          </div>
          <div className="acc">
            <div className="acc-hdr open" onclick="toggleAcc(this)">
              <span>📊</span>
              <span className="acc-hdr-title">Summary</span>
              <span className="acc-chevron">▼</span>
            </div>
            <div className="acc-body">
              <div className="sum-grid">
                <div className="sc gold">
                  <div className="sc-tag">Cumul. KKM Revenue (Kabal)</div>
                  <div
                    className="sc-val"
                    style={{ color: "var(--gold)" }}
                    id="tr-s-rev"
                  >
                    $0
                  </div>
                  <div className="sc-sub" id="tr-s-rev-d">
                    —
                  </div>
                </div>
                <div className="sc blue">
                  <div className="sc-tag">Current USDC Reserve</div>
                  <div
                    className="sc-val"
                    style={{ color: "var(--blue)" }}
                    id="tr-s-usdc"
                  >
                    $0
                  </div>
                  <div className="sc-sub" id="tr-s-usdc-d">
                    —
                  </div>
                </div>
                <div className="sc btc">
                  <div className="sc-tag">Current BTC Reserve</div>
                  <div
                    className="sc-val"
                    style={{ color: "var(--btc)" }}
                    id="tr-s-btc"
                  >
                    ₿0.0000
                  </div>
                  <div className="sc-sub" id="tr-s-btc-d">
                    —
                  </div>
                </div>
                <div className="sc green">
                  <div className="sc-tag">Net (Rev − Burn)</div>
                  <div
                    className="sc-val"
                    style={{ color: "var(--green)" }}
                    id="tr-s-net"
                  >
                    $0
                  </div>
                  <div className="sc-sub" id="tr-s-net-d">
                    —
                  </div>
                </div>
              </div>
              <div className="chart-outer">
                <div className="chart-bars" id="tr-chart">
                  <div
                    style={{
                      color: "var(--text-dim)",
                      fontSize: 8,
                      letterSpacing: 1,
                      margin: "auto"
                    }}
                  >
                    No data yet
                  </div>
                </div>
                <div className="chart-legend">
                  <div className="cleg">
                    <div
                      className="cdot"
                      style={{ background: "var(--blue)" }}
                    />
                    USDC Reserve
                  </div>
                  <div className="cleg">
                    <div
                      className="cdot"
                      style={{ background: "var(--btc)" }}
                    />
                    BTC (×price)
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="acc">
            <div className="acc-hdr" onclick="toggleAcc(this)">
              <span>🗓</span>
              <span className="acc-hdr-title">Weekly History</span>
              <span className="acc-chevron">▼</span>
            </div>
            <div className="acc-body" style={{ padding: 0 }}>
              <div className="tbl-wrap">
                <table style={{ minWidth: 680 }}>
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Gross (SOL)</th>
                      <th>Kabal Net (SOL)</th>
                      <th>Kabal ($)</th>
                      <th>Burn</th>
                      <th>Net P&amp;L</th>
                      <th>USDC</th>
                      <th>BTC</th>
                      <th>Trend</th>
                      <th>Note</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody id="tr-body">
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          color: "var(--text-dim)",
                          fontSize: 8,
                          textAlign: "center",
                          padding: 24,
                          letterSpacing: 1
                        }}
                      >
                        — No weeks logged —
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="acc">
            <div className="acc-hdr" onclick="toggleAcc(this)">
              <span>🎯</span>
              <span className="acc-hdr-title">90-Day Targets</span>
              <span className="acc-chevron">▼</span>
            </div>
            <div className="acc-body">
              <div className="obj-grid">
                <div className="obj-card gold">
                  <div className="obj-title" style={{ color: "var(--gold)" }}>
                    🔥 March
                  </div>
                  <div className="obj-line">
                    USDC net: <b>+$5k</b>
                  </div>
                  <div className="obj-line">
                    Weekly KKM: <b>$500–$1k</b>
                  </div>
                  <div className="obj-line">
                    BTC: <b>Start accumulating</b>
                  </div>
                </div>
                <div className="obj-card blue">
                  <div className="obj-title" style={{ color: "var(--blue)" }}>
                    ⚡ April
                  </div>
                  <div className="obj-line">
                    USDC net: <b>+$25k</b>
                  </div>
                  <div className="obj-line">
                    Weekly KKM: <b>$5k+</b>
                  </div>
                  <div className="obj-line">
                    BTC: <b>+0.1 BTC</b>
                  </div>
                </div>
                <div className="obj-card btc">
                  <div className="obj-title" style={{ color: "var(--btc)" }}>
                    🚀 May
                  </div>
                  <div className="obj-line">
                    USDC net: <b>+$100k</b>
                  </div>
                  <div className="obj-line">
                    Weekly KKM: <b>$20k+</b>
                  </div>
                  <div className="obj-line">
                    BTC: <b>+0.5 BTC</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /treasury */}
    </div>
    {/* /content */}
  </div>
  {/* /layout */}
</>

  );
}
