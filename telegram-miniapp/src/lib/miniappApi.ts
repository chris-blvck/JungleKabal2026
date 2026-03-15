const API_BASE = import.meta.env.VITE_MINIAPP_API_BASE || 'http://localhost:8787';

export type RunFinishPayload = {
  telegramUserId?: string;
  referralCodeUsed?: string | null;
  runSeed: string;
  score: number;
  floor: number;
  characterId: string;
  mode?: 'competitive' | 'practice';
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
  telegramInitData?: string;
};

async function request(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.telegramInitData) {
    headers['X-Telegram-Init-Data'] = options.telegramInitData;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `HTTP ${response.status}`);
  }
  return payload;
}

export async function submitRun(payload: RunFinishPayload, telegramInitData = '') {
  return request('/api/runs/finish', {
    method: 'POST',
    body: payload,
    telegramInitData,
  });
}

export async function fetchLeaderboard(limit = 10) {
  return request(`/api/runs/leaderboard?limit=${limit}`);
}

export async function fetchFriendsLeaderboard(ids: string[]) {
  return request('/api/runs/friends-leaderboard', {
    method: 'POST',
    body: { ids },
  });
}

export async function claimReferral(inviterCode: string, invitedUserId: string, telegramInitData = '') {
  return request('/api/referrals/claim', {
    method: 'POST',
    body: { inviterCode, invitedUserId },
    telegramInitData,
  });
}

export async function fetchReferralStats(code: string) {
  return request(`/api/referrals/stats/${encodeURIComponent(code)}`);
}

export async function checkMiniappAuth(telegramUserId: string, telegramInitData = '') {
  return request('/api/miniapp/auth/check', {
    method: 'POST',
    body: { telegramUserId },
    telegramInitData,
  });
}

export async function trackEvent(event: string, telegramUserId: string, meta: Record<string, unknown> = {}, telegramInitData = '') {
  return request('/api/telemetry/event', {
    method: 'POST',
    body: { event, telegramUserId, meta },
    telegramInitData,
  });
}
