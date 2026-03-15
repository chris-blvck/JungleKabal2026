import { useState } from "react";
import Shell, { JK, Card, Badge, SectionTitle, Divider } from "../components/JKShell";
import { usePriceAlerts } from "../hooks/usePriceAlerts";

const COIN_REF = [
  { ticker: "SOL", id: "solana" },
  { ticker: "BTC", id: "bitcoin" },
  { ticker: "ETH", id: "ethereum" },
  { ticker: "BNB", id: "binancecoin" },
  { ticker: "DOGE", id: "dogecoin" },
  { ticker: "BONK", id: "bonk" },
  { ticker: "WIF", id: "dogwifcoin" },
  { ticker: "PEPE", id: "pepe" },
];

const EMPTY_FORM = {
  name: "",
  coinId: "",
  targetPrice: "",
  condition: "above",
};

function formatPrice(price) {
  if (price === undefined || price === null) return "--";
  if (price >= 1000) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
}

function formatTs(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function distancePct(current, target) {
  if (!current || !target) return null;
  const pct = ((current - target) / target) * 100;
  return pct;
}

export default function PriceAlerts() {
  const {
    alerts,
    notifications,
    unreadCount,
    addAlert,
    removeAlert,
    toggleAlert,
    markAllRead,
    markRead,
    clearNotifications,
    prices,
    lastPoll,
    isPolling,
  } = usePriceAlerts();

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // ─── Derived stats ───────────────────────────────────────────
  const activeCount = alerts.filter((a) => a.active).length;
  const watchedCoins = [...new Set(alerts.map((a) => a.coinId).filter(Boolean))].length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const triggeredToday = notifications.filter((n) => new Date(n.triggeredAt) >= todayStart).length;

  // ─── Form handlers ───────────────────────────────────────────
  const handleConditionToggle = (cond) => {
    setForm((prev) => ({ ...prev, condition: cond }));
  };

  const handleSubmit = () => {
    setFormError("");
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.coinId.trim()) { setFormError("CoinGecko ID is required."); return; }
    const price = parseFloat(form.targetPrice);
    if (isNaN(price) || price <= 0) { setFormError("Enter a valid target price."); return; }

    addAlert({
      name: form.name.trim(),
      coinId: form.coinId.trim().toLowerCase(),
      targetPrice: price,
      condition: form.condition,
    });
    setForm(EMPTY_FORM);
  };

  const currentPriceForForm = form.coinId ? prices[form.coinId.trim().toLowerCase()] : undefined;

  const inputStyle = {
    background: "rgba(0,0,0,0.4)",
    border: `1px solid ${JK.border}`,
    borderRadius: 8,
    color: "#F3F4F6",
    padding: "10px 12px",
    fontSize: 13,
    width: "100%",
    outline: "none",
  };

  const btnBase = {
    border: "none",
    borderRadius: 8,
    padding: "10px 16px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    cursor: "pointer",
  };

  return (
    <Shell
      title={<>PRICE <span style={{ color: JK.gold }}>ALERTS</span></>}
      subtitle="Real-time price monitoring — get notified when targets hit"
      maxWidth={900}
    >
      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 20 }}>
        {[
          { label: "ACTIVE ALERTS", value: activeCount, color: JK.gold },
          { label: "TRIGGERED TODAY", value: triggeredToday, color: JK.green },
          { label: "TOKENS WATCHED", value: watchedCoins, color: "#3B82F6" },
          { label: "UNREAD", value: unreadCount, color: unreadCount > 0 ? JK.red : JK.muted },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: JK.card, border: `1px solid ${JK.border}`, borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: JK.muted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Polling status ────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, fontSize: 11, color: JK.muted }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: isPolling ? JK.gold : JK.green, display: "inline-block", boxShadow: isPolling ? `0 0 6px ${JK.gold}` : `0 0 6px ${JK.green}` }} />
        {isPolling ? "Polling CoinGecko…" : lastPoll ? `Last poll: ${formatTs(lastPoll.toISOString())}` : "Awaiting first poll…"}
      </div>

      {/* ── Add Alert Form ────────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle style={{ marginBottom: 14, fontSize: 18 }}>
          Set New <span style={{ color: JK.gold }}>Alert</span>
        </SectionTitle>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>DISPLAY NAME</label>
            <input
              style={inputStyle}
              placeholder="e.g. Bitcoin"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>

          {/* CoinGecko ID */}
          <div>
            <label style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>
              COINGECKO ID
              {currentPriceForForm !== undefined && (
                <span style={{ marginLeft: 8, color: JK.green, fontWeight: 700 }}>
                  {formatPrice(currentPriceForForm)}
                </span>
              )}
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. bitcoin"
              value={form.coinId}
              onChange={(e) => setForm((p) => ({ ...p, coinId: e.target.value }))}
            />
            <div style={{ fontSize: 10, color: JK.muted, marginTop: 4 }}>Use the CoinGecko slug — see reference below</div>
          </div>

          {/* Target price */}
          <div>
            <label style={{ fontSize: 10, color: JK.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>TARGET PRICE (USD)</label>
            <input
              style={inputStyle}
              placeholder="e.g. 95000"
              type="number"
              min="0"
              step="any"
              value={form.targetPrice}
              onChange={(e) => setForm((p) => ({ ...p, targetPrice: e.target.value }))}
            />
          </div>

          {/* Condition + Submit */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
            <label style={{ fontSize: 10, color: JK.muted, letterSpacing: 1 }}>CONDITION</label>
            <div style={{ display: "flex", gap: 6 }}>
              {["above", "below"].map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => handleConditionToggle(cond)}
                  style={{
                    ...btnBase,
                    flex: 1,
                    background: form.condition === cond
                      ? cond === "above" ? JK.green : JK.red
                      : "rgba(255,255,255,0.06)",
                    color: form.condition === cond ? "#111" : JK.muted,
                    border: `1px solid ${form.condition === cond ? "transparent" : JK.border}`,
                  }}
                >
                  {cond.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {formError && (
          <div style={{ color: JK.red, fontSize: 12, marginBottom: 10 }}>{formError}</div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          style={{ ...btnBase, background: JK.gold, color: "#111", padding: "11px 28px", fontSize: 12 }}
        >
          SET ALERT
        </button>
      </Card>

      {/* ── CoinGecko ID Reference ────────────────────────────── */}
      <Card style={{ marginBottom: 20, padding: "16px 20px" }}>
        <div style={{ fontSize: 10, color: JK.muted, letterSpacing: 2, marginBottom: 10 }}>COMMON COINGECKO IDS</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COIN_REF.map(({ ticker, id }) => (
            <button
              key={id}
              type="button"
              onClick={() => setForm((p) => ({ ...p, coinId: id }))}
              title={`Use ID: ${id}`}
              style={{
                background: "rgba(245,166,35,0.08)",
                border: `1px solid ${JK.border2}`,
                borderRadius: 8,
                padding: "5px 10px",
                cursor: "pointer",
                color: "#e8d5a0",
                fontSize: 11,
                fontFamily: "'Cinzel', serif",
              }}
            >
              <span style={{ color: JK.gold, fontWeight: 700 }}>{ticker}</span>
              <span style={{ color: JK.muted, marginLeft: 5 }}>{id}</span>
              {prices[id] && (
                <span style={{ color: JK.green, marginLeft: 5 }}>{formatPrice(prices[id])}</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Active Alerts list ────────────────────────────────── */}
      <Card style={{ marginBottom: 20 }}>
        <SectionTitle style={{ marginBottom: 14, fontSize: 18 }}>
          Active <span style={{ color: JK.gold }}>Alerts</span>
          <span style={{ fontSize: 12, color: JK.muted, fontWeight: 400, marginLeft: 10 }}>({alerts.length} total)</span>
        </SectionTitle>

        {alerts.length === 0 && (
          <div style={{ textAlign: "center", color: JK.muted, fontSize: 13, padding: "24px 0" }}>
            No alerts set yet. Use the form above to create one.
          </div>
        )}

        <div style={{ display: "grid", gap: 10 }}>
          {alerts.map((alert) => {
            const current = prices[alert.coinId];
            const dist = distancePct(current, alert.targetPrice);

            return (
              <div
                key={alert.id}
                style={{
                  background: alert.active ? "rgba(245,166,35,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${alert.active ? JK.border2 : JK.border}`,
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  opacity: alert.active ? 1 : 0.6,
                }}
              >
                {/* Name + coin */}
                <div style={{ flex: "1 1 160px" }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: "#e8d5a0", fontWeight: 700 }}>{alert.name}</div>
                  <div style={{ fontSize: 10, color: JK.muted, marginTop: 2 }}>{alert.coinId}</div>
                </div>

                {/* Condition + target */}
                <div style={{ flex: "0 0 auto", textAlign: "center" }}>
                  <Badge color={alert.condition === "above" ? JK.green : JK.red}>
                    {alert.condition.toUpperCase()}
                  </Badge>
                  <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 14, color: JK.gold, marginTop: 4 }}>
                    {formatPrice(alert.targetPrice)}
                  </div>
                </div>

                {/* Current price */}
                <div style={{ flex: "0 0 auto", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: JK.muted, letterSpacing: 1, marginBottom: 3 }}>CURRENT</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: current !== undefined ? "#F3F4F6" : JK.muted }}>
                    {current !== undefined ? formatPrice(current) : "--"}
                  </div>
                </div>

                {/* Distance % */}
                <div style={{ flex: "0 0 auto", textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: JK.muted, letterSpacing: 1, marginBottom: 3 }}>DISTANCE</div>
                  {dist !== null ? (
                    <div style={{ fontSize: 13, fontWeight: 700, color: Math.abs(dist) < 5 ? JK.gold : "#F3F4F6" }}>
                      {dist >= 0 ? "+" : ""}{dist.toFixed(2)}%
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: JK.muted }}>--</div>
                  )}
                </div>

                {/* Toggle + Delete */}
                <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
                  <button
                    type="button"
                    onClick={() => toggleAlert(alert.id)}
                    style={{
                      ...btnBase,
                      background: alert.active ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)",
                      color: alert.active ? JK.green : JK.muted,
                      border: `1px solid ${alert.active ? "rgba(34,197,94,0.4)" : JK.border}`,
                      padding: "6px 12px",
                    }}
                  >
                    {alert.active ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAlert(alert.id)}
                    style={{
                      ...btnBase,
                      background: "rgba(239,68,68,0.12)",
                      color: JK.red,
                      border: `1px solid rgba(239,68,68,0.3)`,
                      padding: "6px 10px",
                    }}
                    title="Delete alert"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Notifications history ─────────────────────────────── */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
          <SectionTitle style={{ marginBottom: 0, fontSize: 18 }}>
            Notification <span style={{ color: JK.gold }}>History</span>
          </SectionTitle>
          {unreadCount > 0 && <Badge color={JK.red}>{unreadCount} unread</Badge>}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{ ...btnBase, background: "rgba(245,166,35,0.15)", color: JK.gold, border: `1px solid ${JK.border2}` }}
              >
                MARK ALL READ
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                style={{ ...btnBase, background: "rgba(239,68,68,0.1)", color: JK.red, border: "1px solid rgba(239,68,68,0.3)" }}
              >
                CLEAR ALL
              </button>
            )}
          </div>
        </div>

        {notifications.length === 0 && (
          <div style={{ textAlign: "center", color: JK.muted, fontSize: 13, padding: "24px 0" }}>
            No notifications yet. Alerts will appear here when prices cross your targets.
          </div>
        )}

        <div style={{ display: "grid", gap: 8 }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                background: notif.read ? "rgba(255,255,255,0.02)" : "rgba(245,166,35,0.06)",
                border: `1px solid ${notif.read ? JK.border : JK.border2}`,
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 16 }}>🔔</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: notif.read ? "#9CA3AF" : "#F3F4F6" }}>
                  <span style={{ fontWeight: 700, color: notif.read ? JK.muted : JK.gold }}>{notif.name}</span>
                  {" "}crossed{" "}
                  <span style={{ color: notif.condition === "above" ? JK.green : JK.red }}>
                    {notif.condition} {formatPrice(notif.targetPrice)}
                  </span>
                  {" "}— triggered at{" "}
                  <span style={{ fontWeight: 700, color: "#F3F4F6" }}>{formatPrice(notif.triggeredPrice)}</span>
                </div>
                <div style={{ fontSize: 10, color: JK.muted, marginTop: 3 }}>{formatTs(notif.triggeredAt)}</div>
              </div>
              {!notif.read && (
                <button
                  type="button"
                  onClick={() => markRead(notif.id)}
                  style={{ ...btnBase, background: "rgba(245,166,35,0.1)", color: JK.gold, border: `1px solid ${JK.border2}`, padding: "5px 10px", fontSize: 10 }}
                >
                  READ
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}
