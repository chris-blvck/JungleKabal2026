// ============================================================
// JUNGLE KABAL — SHARED COMPONENTS & SHELL
// Import depuis n'importe quelle page :
//   import Shell, { JK, Card, StatBox, ... } from '../components/JKShell'
// ============================================================
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── DESIGN TOKENS ──────────────────────────────────────────
export const JK = {
  gold:    "#F5A623",
  gold2:   "#FFD037",
  bg:      "#0D0D0D",
  card:    "rgba(20,20,20,0.85)",
  border:  "rgba(245,166,35,0.15)",
  border2: "rgba(245,166,35,0.35)",
  muted:   "#888888",
  green:   "#22C55E",
  red:     "#EF4444",
};

// ─── SHARED COMPONENTS ──────────────────────────────────────

/** Titre de section avec mot en or */
export function SectionTitle({ children, style }) {
  return (
    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 16, ...style }}>
      {children}
    </h2>
  );
}

/** Card glassmorphism standard */
export function Card({ children, style, onClick, hoverable }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: hovered ? "rgba(245,166,35,0.06)" : JK.card,
        border: `1px solid ${hovered ? JK.border2 : JK.border}`,
        borderRadius: 16,
        padding: 24,
        backdropFilter: "blur(10px)",
        marginBottom: 14,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        boxShadow: hovered ? `0 0 24px ${JK.gold}18` : "none",
        ...style,
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${JK.border2}, transparent)`,
      }} />
      {children}
    </div>
  );
}

/** Stat box avec valeur colorée */
export function StatBox({ value, label, badge, color = "gold" }) {
  const colors = { gold: JK.gold, green: JK.green, red: JK.red, muted: JK.muted };
  return (
    <div style={{
      background: "rgba(245,166,35,0.10)",
      border: `1px solid ${JK.border2}`,
      borderRadius: 14,
      padding: "20px 12px",
      textAlign: "center",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{
        fontFamily: "'Cinzel Decorative', serif",
        fontSize: 26, fontWeight: 900,
        color: colors[color] || color,
        lineHeight: 1, marginBottom: 6,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: JK.muted }}>{label}</div>
      {badge && (
        <div style={{
          display: "inline-block",
          background: "rgba(245,166,35,0.12)",
          border: `1px solid ${JK.border2}`,
          borderRadius: 6, fontSize: 9,
          color: JK.gold, padding: "3px 8px",
          marginTop: 6, fontWeight: 600,
        }}>
          {badge}
        </div>
      )}
    </div>
  );
}

/** Badge pill */
export function Badge({ children, color = JK.gold }) {
  return (
    <span style={{
      display: "inline-block",
      background: `${color}18`,
      border: `1px solid ${color}55`,
      borderRadius: 20,
      fontSize: 10, fontWeight: 700,
      color, padding: "3px 10px",
      letterSpacing: 1,
    }}>
      {children}
    </span>
  );
}

/** Ligne séparateur dégradé */
export function Divider() {
  return (
    <div style={{
      height: 1,
      background: `linear-gradient(90deg, transparent, ${JK.border2}, transparent)`,
      margin: "22px 0",
    }} />
  );
}

/** Note avec bordure gauche dorée */
export function Note({ children }) {
  return (
    <div style={{
      background: "rgba(10,10,10,0.8)",
      borderLeft: `3px solid ${JK.gold}`,
      padding: "14px 18px",
      borderRadius: "0 10px 10px 0",
      fontSize: 13, color: JK.muted, lineHeight: 1.7,
    }}>
      {children}
    </div>
  );
}

/** Bouton CTA doré */
export function CTAButton({ href, onClick, children }) {
  const style = {
    display: "inline-block",
    background: JK.gold,
    color: "#000",
    fontFamily: "'Cinzel', serif",
    fontSize: 13, fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    padding: "16px 40px",
    borderRadius: 10,
    textDecoration: "none",
    boxShadow: `0 0 30px ${JK.gold}40`,
    cursor: "pointer",
    border: "none",
  };
  if (href) return <a href={href} target="_blank" rel="noreferrer" style={style}>{children}</a>;
  return <button onClick={onClick} style={style}>{children}</button>;
}

/** FAQ accordion item */
export function FAQItem({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: JK.card,
      border: `1px solid ${JK.border}`,
      borderRadius: 12, overflow: "hidden",
      backdropFilter: "blur(8px)",
      marginBottom: 9,
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "17px 20px",
          fontSize: 14, fontWeight: 600,
          cursor: "pointer",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          userSelect: "none",
          background: open ? "rgba(245,166,35,0.04)" : "transparent",
        }}
      >
        {q}
        <span style={{ color: JK.gold, fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▼</span>
      </div>
      {open && (
        <div style={{
          padding: "16px 20px 18px",
          fontSize: 13, color: JK.muted, lineHeight: 1.9,
          borderTop: `1px solid rgba(245,166,35,0.08)`,
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── GLOBAL NAV ─────────────────────────────────────────────
const NAV_ITEMS = [
  { label: "HQ",        path: "/",                    icon: "◈" },
  { label: "Board",     path: "/narrative-board",      icon: "🃏" },
  { label: "Risk",      path: "/risk-manager",         icon: "⚡" },
  { label: "War Room",  path: "/war-room",             icon: "⚔" },
  { label: "Sprint",    path: "/sprint-board",         icon: "🎯" },
  { label: "CRM",       path: "/crm-angel",            icon: "👼" },
  { label: "Arsenal",   path: "/arsenal",              icon: "🛠" },
  { label: "Academy",   path: "/academy",              icon: "🎓" },
];

export function JKTopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 200,
      background: "rgba(13,13,13,0.97)", backdropFilter: "blur(20px)",
      borderBottom: `1px solid rgba(245,166,35,0.12)`,
      padding: "0 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 0, height: 46 }}>
        {/* Logo */}
        <div onClick={() => navigate("/")} style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12, cursor: "pointer", flexShrink: 0 }}>
          <img
            src="https://i.postimg.cc/fTGb8PWH/logo-jaune-rond.png"
            alt="JK"
            style={{ width: 26, height: 26, objectFit: "contain", filter: "drop-shadow(0 0 6px rgba(245,166,35,0.5))" }}
          />
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, fontWeight: 700, letterSpacing: 3, color: JK.gold, opacity: 0.8, whiteSpace: "nowrap" }}>JUNGLE KABAL</span>
        </div>
        <div style={{ width: 1, height: 22, background: "rgba(245,166,35,0.15)", marginRight: 12, flexShrink: 0 }} />
        {/* Nav items */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, overflowX: "auto", flex: 1 }}>
          {NAV_ITEMS.map(({ label, path, icon }) => {
            const active = location.pathname === path;
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                background: active ? "rgba(245,166,35,0.15)" : "transparent",
                border: `1px solid ${active ? "rgba(245,166,35,0.4)" : "transparent"}`,
                borderRadius: 7, padding: "5px 10px",
                color: active ? JK.gold : "#555",
                fontFamily: "'Cinzel', serif",
                fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{ fontSize: 11 }}>{icon}</span> {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE SHELL ─────────────────────────────────────────────
/**
 * Shell wraps every page.
 * Props:
 *   title     — JSX, le titre principal (peut contenir <span style={{color:JK.gold}}>)
 *   subtitle  — string, affiché sous le titre (optionnel)
 *   maxWidth  — number, défaut 780
 */
export default function Shell({ children, title, subtitle, maxWidth = 780 }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        body { background:#0D0D0D; color:#fff; font-family:'Inter',sans-serif; }
        a { color: inherit; }
        strong.gold { color: #F5A623; }
        strong.green { color: #22C55E; }
        strong.red { color: #EF4444; }
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(245,166,35,0.25); border-radius: 2px; }
      `}</style>

      <JKTopNav />

      {/* BG gradient subtil */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse at 50% 0%, rgba(245,166,35,0.06) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 1,
        textAlign: "center", padding: "36px 20px 24px",
      }}>
        <img
          src="https://i.postimg.cc/d0vVYTyf/Logo-JK-Transparent-full.png"
          alt="Jungle Kabal"
          style={{ height: 48, objectFit: "contain", marginBottom: 14, filter: `drop-shadow(0 0 20px ${JK.gold}44)` }}
        />
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 9, letterSpacing: 4,
          color: JK.gold, opacity: 0.6,
          textTransform: "uppercase", marginBottom: 8,
        }}>
          Private Syndicate
        </div>
        <h1 style={{
          fontFamily: "'Cinzel Decorative', serif",
          fontSize: 34, fontWeight: 900,
          letterSpacing: 2, lineHeight: 1.1,
          textShadow: `0 0 40px ${JK.gold}44`,
        }}>
          {title || "Page"}
        </h1>
        {subtitle && (
          <p style={{ color: JK.muted, fontSize: 13, marginTop: 10, letterSpacing: 1 }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth, margin: "0 auto",
        padding: "0 24px 80px",
      }}>
        {children}
      </div>

      {/* Footer */}
      <div style={{
        position: "relative", zIndex: 1,
        textAlign: "center", padding: "0 0 28px",
        fontSize: 10, color: "rgba(255,255,255,0.15)",
        letterSpacing: 1, fontFamily: "'Cinzel', serif",
      }}>
        Jungle Kabal · junglekabal.meme
      </div>
    </>
  );
}
