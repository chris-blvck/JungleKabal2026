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
  competitiveBonusTickets: number;
  gems: number;
  unlockedCharacters: string[];
  unlockedWeapons: string[];
  selectedCompanionId: string | null;
  selectedStarterWeaponId: string | null;
  referralsClaimed: string[];
  totalReferrals: number;
  daily: {
    key: string;
    missions: DailyMission[];
    competitiveRunsPlayed: number;
    practiceRunsPlayed: number;
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
  competitiveBonusTickets: 0,
  gems: 120,
  unlockedCharacters: ['kabalian', 'kkm'],
  unlockedWeapons: ['jungle-blade-common'],
  selectedCompanionId: 'momo',
  selectedStarterWeaponId: 'jungle-blade-common',
  referralsClaimed: [],
  totalReferrals: 0,
  daily: {
    key: dayKey(),
    missions: createDailyMissions(),
    competitiveRunsPlayed: 0,
    practiceRunsPlayed: 0,
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

  return {
    key,
    missions,
    competitiveRunsPlayed: Number.isFinite(daily?.competitiveRunsPlayed) ? Math.max(0, Number(daily?.competitiveRunsPlayed)) : 0,
    practiceRunsPlayed: Number.isFinite(daily?.practiceRunsPlayed) ? Math.max(0, Number(daily?.practiceRunsPlayed)) : 0,
  };
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
      competitiveBonusTickets: Number.isFinite(parsed.competitiveBonusTickets) ? Math.max(0, Number(parsed.competitiveBonusTickets)) : 0,
      gems: Number.isFinite(parsed.gems) ? Math.max(0, Number(parsed.gems)) : DEFAULT_STATE.gems,
      unlockedCharacters: Array.isArray(parsed.unlockedCharacters) && parsed.unlockedCharacters.length ? parsed.unlockedCharacters.filter(Boolean) : DEFAULT_STATE.unlockedCharacters,
      unlockedWeapons: Array.isArray(parsed.unlockedWeapons) && parsed.unlockedWeapons.length ? parsed.unlockedWeapons.filter(Boolean) : DEFAULT_STATE.unlockedWeapons,
      selectedCompanionId: typeof parsed.selectedCompanionId === 'string' ? parsed.selectedCompanionId : DEFAULT_STATE.selectedCompanionId,
      selectedStarterWeaponId: typeof parsed.selectedStarterWeaponId === 'string' ? parsed.selectedStarterWeaponId : DEFAULT_STATE.selectedStarterWeaponId,
      referralsClaimed: Array.isArray(parsed.referralsClaimed) ? parsed.referralsClaimed.filter(Boolean) : [],
      totalReferrals: Number.isFinite(parsed.totalReferrals) ? Math.max(0, Number(parsed.totalReferrals)) : 0,
      daily: daily.key === today
        ? daily
        : { key: today, missions: createDailyMissions(), competitiveRunsPlayed: 0, practiceRunsPlayed: 0 },
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

export function setBuildLoadout(state: ProgressionState, payload: { companionId?: string | null; starterWeaponId?: string | null }) {
  return {
    ...state,
    selectedCompanionId: payload.companionId === undefined ? state.selectedCompanionId : payload.companionId,
    selectedStarterWeaponId: payload.starterWeaponId === undefined ? state.selectedStarterWeaponId : payload.starterWeaponId,
  };
}

export function unlockCharacter(state: ProgressionState, characterId: string, gemCost: number) {
  if (!characterId || state.unlockedCharacters.includes(characterId)) return { next: state, unlocked: false };
  if (state.gems < gemCost) return { next: state, unlocked: false, reason: 'not-enough-gems' as const };
  return {
    next: {
      ...state,
      gems: state.gems - gemCost,
      unlockedCharacters: [...state.unlockedCharacters, characterId],
    },
    unlocked: true,
  };
}

export function unlockWeapon(state: ProgressionState, weaponId: string, gemCost: number) {
  if (!weaponId || state.unlockedWeapons.includes(weaponId)) return { next: state, unlocked: false };
  if (state.gems < gemCost) return { next: state, unlocked: false, reason: 'not-enough-gems' as const };
  return {
    next: {
      ...state,
      gems: state.gems - gemCost,
      unlockedWeapons: [...state.unlockedWeapons, weaponId],
      selectedStarterWeaponId: weaponId,
    },
    unlocked: true,
  };
}

export function consumeRunTicket(state: ProgressionState) {
  if (state.runTickets <= 0) return { next: state, ok: false };
  return {
    next: { ...state, runTickets: state.runTickets - 1 },
    ok: true,
  };
}

export function getModeLimits(state: ProgressionState) {
  const competitiveMax = 1 + state.competitiveBonusTickets;
  const competitiveRemaining = Math.max(0, competitiveMax - state.daily.competitiveRunsPlayed);
  const practiceMax = 10;
  const practiceRemaining = Math.max(0, practiceMax - state.daily.practiceRunsPlayed);
  return {
    competitiveMax,
    competitiveRemaining,
    practiceMax,
    practiceRemaining,
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

export function markRunFinished(state: ProgressionState, floor: number, mode: 'competitive' | 'practice') {
  const today = dayKey();
  let next = state;

  if (next.daily.key !== today) {
    next = {
      ...next,
      daily: { key: today, missions: createDailyMissions(), competitiveRunsPlayed: 0, practiceRunsPlayed: 0 },
    };
  }

  if (mode === 'competitive') {
    next = {
      ...next,
      daily: { ...next.daily, competitiveRunsPlayed: next.daily.competitiveRunsPlayed + 1 },
    };
    if (floor >= 6) {
      next = { ...next, competitiveBonusTickets: next.competitiveBonusTickets + 1 };
    }
  } else {
    next = {
      ...next,
      daily: { ...next.daily, practiceRunsPlayed: next.daily.practiceRunsPlayed + 1 },
    };
  }

  const gemsFromRun = Math.max(5, floor * 5);
  next = { ...next, gems: next.gems + gemsFromRun };

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
