const API_BASE = import.meta.env.VITE_ACADEMY_API_URL || "http://localhost:8787";
const LS_KEY = "jk-academy-content-v1";

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
