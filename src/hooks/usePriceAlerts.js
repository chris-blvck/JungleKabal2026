import { useState, useEffect, useRef, useCallback } from "react";

const ALERTS_KEY = "jk-price-alerts";
const NOTIFICATIONS_KEY = "jk-alert-notifications";
const POLL_INTERVAL_MS = 30000;

function loadFromStorage(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    // Clean up context after beep finishes
    setTimeout(() => {
      try { ctx.close(); } catch { /* ignore */ }
    }, 500);
  } catch {
    // AudioContext not supported or blocked
  }
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState(() => loadFromStorage(ALERTS_KEY, []));
  const [notifications, setNotifications] = useState(() => loadFromStorage(NOTIFICATIONS_KEY, []));
  const [prices, setPrices] = useState({});
  const [lastPoll, setLastPoll] = useState(null);
  const [isPolling, setIsPolling] = useState(false);

  // Keep refs so polling callback always sees latest values without re-registering interval
  const alertsRef = useRef(alerts);
  const notificationsRef = useRef(notifications);
  alertsRef.current = alerts;
  notificationsRef.current = notifications;

  // Persist alerts to localStorage whenever they change
  useEffect(() => {
    saveToStorage(ALERTS_KEY, alerts);
  }, [alerts]);

  // Persist notifications to localStorage whenever they change
  useEffect(() => {
    saveToStorage(NOTIFICATIONS_KEY, notifications);
  }, [notifications]);

  const pollPrices = useCallback(async () => {
    const currentAlerts = alertsRef.current;
    const activeAlerts = currentAlerts.filter((a) => a.active);
    if (!activeAlerts.length) {
      setLastPoll(new Date());
      return;
    }

    const uniqueIds = [...new Set(activeAlerts.map((a) => a.coinId).filter(Boolean))];
    if (!uniqueIds.length) return;

    setIsPolling(true);
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds.join(",")}&vs_currencies=usd`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`CoinGecko error ${res.status}`);
      const data = await res.json();

      const newPrices = {};
      for (const id of uniqueIds) {
        if (data[id]?.usd !== undefined) {
          newPrices[id] = data[id].usd;
        }
      }
      setPrices((prev) => ({ ...prev, ...newPrices }));
      setLastPoll(new Date());

      // Check which active alerts have been triggered
      const triggeredAlertIds = [];
      const newNotifications = [];

      for (const alert of activeAlerts) {
        const currentPrice = newPrices[alert.coinId];
        if (currentPrice === undefined) continue;

        const triggered =
          (alert.condition === "above" && currentPrice >= alert.targetPrice) ||
          (alert.condition === "below" && currentPrice <= alert.targetPrice);

        if (triggered) {
          triggeredAlertIds.push(alert.id);
          newNotifications.push({
            id: Date.now() + Math.random(), // ensure uniqueness if multiple fire simultaneously
            alertId: alert.id,
            name: alert.name,
            coinId: alert.coinId,
            condition: alert.condition,
            targetPrice: alert.targetPrice,
            triggeredPrice: currentPrice,
            triggeredAt: new Date().toISOString(),
            read: false,
          });
        }
      }

      if (triggeredAlertIds.length > 0) {
        // Deactivate triggered alerts so they don't re-fire
        setAlerts((prev) =>
          prev.map((a) =>
            triggeredAlertIds.includes(a.id) ? { ...a, active: false } : a
          )
        );
        // Add new notifications
        setNotifications((prev) => {
          const updated = [...newNotifications, ...prev];
          saveToStorage(NOTIFICATIONS_KEY, updated);
          return updated;
        });
        // Play beep once for all triggered alerts
        playBeep();
      }
    } catch {
      // Network error or CoinGecko unavailable — fail silently
    } finally {
      setIsPolling(false);
    }
  }, []);

  // Start polling on mount
  useEffect(() => {
    pollPrices();
    const intervalId = setInterval(pollPrices, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [pollPrices]);

  // ─── Public API ─────────────────────────────────────────────

  const addAlert = useCallback((alertObj) => {
    const newAlert = {
      id: Date.now(),
      name: "",
      coinId: "",
      targetPrice: 0,
      condition: "above",
      active: true,
      createdAt: new Date().toISOString(),
      ...alertObj,
    };
    setAlerts((prev) => {
      const updated = [newAlert, ...prev];
      saveToStorage(ALERTS_KEY, updated);
      return updated;
    });
    // Immediately poll to pick up the new coin
    setTimeout(pollPrices, 100);
  }, [pollPrices]);

  const removeAlert = useCallback((id) => {
    setAlerts((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveToStorage(ALERTS_KEY, updated);
      return updated;
    });
  }, []);

  const toggleAlert = useCallback((id) => {
    setAlerts((prev) => {
      const updated = prev.map((a) =>
        a.id === id ? { ...a, active: !a.active } : a
      );
      saveToStorage(ALERTS_KEY, updated);
      return updated;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveToStorage(NOTIFICATIONS_KEY, updated);
      return updated;
    });
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveToStorage(NOTIFICATIONS_KEY, updated);
      return updated;
    });
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    saveToStorage(NOTIFICATIONS_KEY, []);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
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
  };
}
