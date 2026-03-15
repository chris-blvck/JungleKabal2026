// ============================================================
// JUNGLE KABAL — AUTH GATE
// Simple password gate for the team site
// Password: "kabal" (stored hashed in localStorage)
// ============================================================
import { useState, useEffect } from "react";

const STORAGE_KEY = "jk-auth-v1";
const PASSWORD = "kabal";
// Simple hash check — not cryptographic, just obfuscation
const encode = (s) => btoa(s + ":jk2026");
const HASH = encode(PASSWORD);

export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === HASH) setAuthed(true);
  }, []);

  function attempt() {
    if (encode(input.trim().toLowerCase()) === HASH) {
      localStorage.setItem(STORAGE_KEY, HASH);
      setAuthed(true);
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  }

  if (authed) return children;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0D0D0D; color: #fff; font-family: 'Inter', sans-serif; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-8px); }
          40%,80% { transform: translateX(8px); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 30px rgba(245,166,35,0.3); }
          50% { box-shadow: 0 0 60px rgba(245,166,35,0.6); }
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0D0D0D",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background glow */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 40%, rgba(245,166,35,0.07) 0%, transparent 65%)",
          pointerEvents: "none",
        }} />

        <div style={{
          animation: "fadeIn 0.5s ease",
          textAlign: "center",
          padding: "0 24px",
          width: "100%",
          maxWidth: 420,
        }}>
          {/* Logo */}
          <img
            src="https://i.postimg.cc/d0vVYTyf/Logo-JK-Transparent-full.png"
            alt="Jungle Kabal"
            style={{
              height: 56, objectFit: "contain", marginBottom: 24,
              filter: "drop-shadow(0 0 24px rgba(245,166,35,0.5))",
              animation: "pulse 3s ease-in-out infinite",
            }}
          />

          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9, letterSpacing: 5,
            color: "#F5A623", opacity: 0.7,
            textTransform: "uppercase", marginBottom: 10,
          }}>
            Private Syndicate
          </div>

          <h1 style={{
            fontFamily: "'Cinzel Decorative', serif",
            fontSize: 22, fontWeight: 900,
            letterSpacing: 2, marginBottom: 8,
            color: "#fff",
          }}>
            JUNGLE KABAL
          </h1>

          <p style={{
            fontSize: 12, color: "#555", marginBottom: 36,
            letterSpacing: 1, fontFamily: "'Cinzel', serif",
          }}>
            ACCESS RESTRICTED
          </p>

          {/* Input card */}
          <div style={{
            background: "rgba(20,20,20,0.9)",
            border: `1px solid ${error ? "rgba(239,68,68,0.4)" : "rgba(245,166,35,0.2)"}`,
            borderRadius: 20,
            padding: "32px 28px",
            backdropFilter: "blur(20px)",
            animation: shake ? "shake 0.4s ease" : "none",
            transition: "border-color 0.3s",
          }}>
            <div style={{
              fontSize: 11, color: "#444", letterSpacing: 2,
              fontFamily: "'Cinzel', serif", marginBottom: 14, textAlign: "left",
            }}>
              PASSPHRASE
            </div>

            <div style={{ position: "relative", marginBottom: 16 }}>
              <input
                type={show ? "text" : "password"}
                value={input}
                onChange={e => { setInput(e.target.value); setError(false); }}
                onKeyDown={e => e.key === "Enter" && attempt()}
                placeholder="Enter passphrase..."
                autoFocus
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${error ? "rgba(239,68,68,0.5)" : "rgba(245,166,35,0.2)"}`,
                  borderRadius: 10,
                  padding: "14px 44px 14px 16px",
                  color: "#fff",
                  fontSize: 16,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  letterSpacing: show ? 1 : 4,
                  transition: "border-color 0.2s",
                }}
              />
              <button
                onClick={() => setShow(!show)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#444", fontSize: 14, padding: 4,
                }}
              >
                {show ? "🙈" : "👁"}
              </button>
            </div>

            {error && (
              <div style={{
                fontSize: 12, color: "#EF4444",
                marginBottom: 14, letterSpacing: 1,
                fontFamily: "'Cinzel', serif",
              }}>
                ✕ INVALID PASSPHRASE
              </div>
            )}

            <button
              onClick={attempt}
              style={{
                width: "100%",
                background: "#F5A623",
                color: "#000",
                fontFamily: "'Cinzel', serif",
                fontSize: 12, fontWeight: 700,
                letterSpacing: 3, textTransform: "uppercase",
                padding: "14px 0",
                borderRadius: 10, border: "none",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(245,166,35,0.35)",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => e.target.style.opacity = 0.85}
              onMouseLeave={e => e.target.style.opacity = 1}
            >
              ENTER THE JUNGLE
            </button>
          </div>

          <div style={{
            marginTop: 28, fontSize: 10,
            color: "rgba(255,255,255,0.1)",
            letterSpacing: 1, fontFamily: "'Cinzel', serif",
          }}>
            Jungle Kabal · Members Only
          </div>
        </div>
      </div>
    </>
  );
}
