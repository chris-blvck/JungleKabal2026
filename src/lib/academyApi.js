const API_BASE = import.meta.env.VITE_ACADEMY_API_URL || "http://localhost:8787";
const LS_KEY = "jk-academy-content-v1";
const LS_LEADERBOARD_KEY = "jk-academy-leaderboard-v1";
const LS_NOTIFICATIONS_KEY = "jk-academy-notifications-v1";

export async function loadAcademyContent(seedContent) {
  try {
    const res = await fetch(`${API_BASE}/api/academy/content`);
    if (!res.ok) throw new Error("API unavailable");
    return await res.json();
  } catch {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(LS_KEY, JSON.stringify(seedContent));
    return seedContent;
  }
}

export async function saveAcademyContent(content) {
  try {
    const res = await fetch(`${API_BASE}/api/academy/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
    if (!res.ok) throw new Error("API save failed");
    return await res.json();
  } catch {
    localStorage.setItem(LS_KEY, JSON.stringify(content));
    return { ok: true, mode: "localStorage" };
  }
}

export async function loadLeaderboard() {
  try {
    const res = await fetch(`${API_BASE}/api/academy/leaderboard`);
    if (!res.ok) throw new Error("leaderboard unavailable");
    const data = await res.json();
    localStorage.setItem(LS_LEADERBOARD_KEY, JSON.stringify(data));
    return data;
  } catch {
    const raw = localStorage.getItem(LS_LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}

export async function subscribeNotifications(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/academy/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("subscribe failed");
    return await res.json();
  } catch {
    const previous = JSON.parse(localStorage.getItem(LS_NOTIFICATIONS_KEY) || "[]");
    const next = [{ id: `local-${Date.now()}`, ...payload, createdAt: new Date().toISOString() }, ...previous].slice(0, 100);
    localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(next));
    return { ok: true, mode: "localStorage" };
  }
}
