export type DailyMission = {
  id: 'play_run' | 'reach_zone_3' | 'share_once';
  label: string;
  progress: number;
  target: number;
  rewardTickets: number;
  claimed: boolean;
};

export type ProgressionState = {
  runTickets: number;
  referralsClaimed: string[];
  totalReferrals: number;
  daily: {
    key: string;
    missions: DailyMission[];
  };
  streak: {
    lastRunDay: string | null;
    current: number;
    best: number;
  };
};

const PROGRESSION_KEY = 'jk_telegram_progression_v1';

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function createDailyMissions(): DailyMission[] {
  return [
    { id: 'play_run', label: 'Finish 1 run', progress: 0, target: 1, rewardTickets: 1, claimed: false },
    { id: 'reach_zone_3', label: 'Reach zone 3+', progress: 0, target: 1, rewardTickets: 1, claimed: false },
    { id: 'share_once', label: 'Share the game once', progress: 0, target: 1, rewardTickets: 1, claimed: false },
  ];
}

const DEFAULT_STATE: ProgressionState = {
  runTickets: 3,
  referralsClaimed: [],
  totalReferrals: 0,
  daily: {
    key: dayKey(),
    missions: createDailyMissions(),
  },
  streak: {
    lastRunDay: null,
    current: 0,
    best: 0,
  },
};

function normalizeDaily(daily?: Partial<ProgressionState['daily']>) {
  const key = daily?.key || dayKey();
  const missions = Array.isArray(daily?.missions) && daily.missions.length
    ? daily.missions.map((m) => ({
      id: m.id as DailyMission['id'],
      label: m.label || 'Mission',
      progress: Math.max(0, Number(m.progress || 0)),
      target: Math.max(1, Number(m.target || 1)),
      rewardTickets: Math.max(1, Number(m.rewardTickets || 1)),
      claimed: Boolean(m.claimed),
    }))
    : createDailyMissions();

  return { key, missions };
}

export function loadProgression(): ProgressionState {
  try {
    const raw = localStorage.getItem(PROGRESSION_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<ProgressionState>;

    const daily = normalizeDaily(parsed.daily);
    const today = dayKey();

    return {
      runTickets: Number.isFinite(parsed.runTickets) ? Math.max(0, Number(parsed.runTickets)) : DEFAULT_STATE.runTickets,
      referralsClaimed: Array.isArray(parsed.referralsClaimed) ? parsed.referralsClaimed.filter(Boolean) : [],
      totalReferrals: Number.isFinite(parsed.totalReferrals) ? Math.max(0, Number(parsed.totalReferrals)) : 0,
      daily: daily.key === today ? daily : { key: today, missions: createDailyMissions() },
      streak: {
        lastRunDay: parsed.streak?.lastRunDay || null,
        current: Number.isFinite(parsed.streak?.current) ? Math.max(0, Number(parsed.streak?.current)) : 0,
        best: Number.isFinite(parsed.streak?.best) ? Math.max(0, Number(parsed.streak?.best)) : 0,
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveProgression(state: ProgressionState) {
  localStorage.setItem(PROGRESSION_KEY, JSON.stringify(state));
}

export function claimReferralBonus(state: ProgressionState, referralCode: string) {
  if (!referralCode || state.referralsClaimed.includes(referralCode)) {
    return { next: state, claimed: false };
  }
  const next = {
    ...state,
    runTickets: state.runTickets + 1,
    totalReferrals: state.totalReferrals + 1,
    referralsClaimed: [...state.referralsClaimed, referralCode],
  };
  return { next, claimed: true };
}

export function consumeRunTicket(state: ProgressionState) {
  if (state.runTickets <= 0) return { next: state, ok: false };
  return {
    next: { ...state, runTickets: state.runTickets - 1 },
    ok: true,
  };
}

function incrementMission(state: ProgressionState, missionId: DailyMission['id'], amount = 1) {
  const missions = state.daily.missions.map((mission) =>
    mission.id === missionId
      ? { ...mission, progress: Math.min(mission.target, mission.progress + amount) }
      : mission,
  );
  return { ...state, daily: { ...state.daily, missions } };
}

export function markMissionShare(state: ProgressionState) {
  return incrementMission(state, 'share_once', 1);
}

export function markRunFinished(state: ProgressionState, floor: number) {
  const today = dayKey();
  let next = state;

  if (next.daily.key !== today) {
    next = { ...next, daily: { key: today, missions: createDailyMissions() } };
  }

  next = incrementMission(next, 'play_run', 1);
  if (floor >= 3) next = incrementMission(next, 'reach_zone_3', 1);

  const last = next.streak.lastRunDay;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = dayKey(yesterday);

  let current = next.streak.current;
  if (last === today) {
    // unchanged
  } else if (last === yKey) {
    current += 1;
  } else {
    current = 1;
  }

  next = {
    ...next,
    streak: {
      lastRunDay: today,
      current,
      best: Math.max(next.streak.best, current),
    },
  };

  return next;
}

export function claimMissionReward(state: ProgressionState, missionId: DailyMission['id']) {
  const mission = state.daily.missions.find((m) => m.id === missionId);
  if (!mission) return { next: state, claimed: false, reward: 0 };
  if (mission.claimed || mission.progress < mission.target) return { next: state, claimed: false, reward: 0 };

  const missions = state.daily.missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
  const reward = mission.rewardTickets;
  return {
    next: {
      ...state,
      runTickets: state.runTickets + reward,
      daily: { ...state.daily, missions },
    },
    claimed: true,
    reward,
  };
}
