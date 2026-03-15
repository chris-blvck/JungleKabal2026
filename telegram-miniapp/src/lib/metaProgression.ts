// metaProgression.ts — XP, gems, unlock tree for Die in the Jungle

export type UnlockId =
  | 'character_kkm'
  | 'weapon_slot_1'
  | 'companion_gecko'
  | 'companion_croak'
  | 'companion_oeil'
  | 'weapon_slot_2'
  | 'dice_specials'    // special faces on dice (face 5/6)
  | 'lane_bonuses';    // conditional lane bonuses

export interface MetaUnlock {
  id: UnlockId;
  name: string;
  description: string;
  category: 'character' | 'weapon' | 'companion' | 'gameplay';
  gemCost: number;
  achievementRequired?: string; // alt unlock via achievement
  achievementLabel?: string;
  order: number; // display order
}

export interface MetaProgressionState {
  xp: number;
  gems: number;
  unlockedIds: UnlockId[];
  achievements: string[];   // e.g. 'zone1_boss_first', 'zone2_boss_first'
  totalRuns: number;
  totalKills: number;
  bestScore: number;
}

// ── Unlock definitions ────────────────────────────────────────────────────────

export const UNLOCKS: MetaUnlock[] = [
  {
    id: 'character_kkm',
    name: 'KKM',
    description: 'Unlock KKM as a playable character. Tank archetype: 34 HP, +4 start shield.',
    category: 'character',
    gemCost: 100,
    achievementRequired: 'zone1_boss_first',
    achievementLabel: 'Kill Zone 1 boss for the first time',
    order: 1,
  },
  {
    id: 'weapon_slot_1',
    name: 'Weapon Slot',
    description: 'Unlock your weapon slot. Equip a weapon with a passive + special ability.',
    category: 'weapon',
    gemCost: 150,
    achievementRequired: 'zone2_boss_first',
    achievementLabel: 'Kill Zone 2 boss for the first time',
    order: 2,
  },
  {
    id: 'dice_specials',
    name: 'Special Dice Faces',
    description: 'Unlock special dice faces: Echo (face 5) and Pierce/Fortress/Nurture (face 6).',
    category: 'gameplay',
    gemCost: 75,
    achievementRequired: 'zone2_boss_first',
    achievementLabel: 'Kill Zone 2 boss for the first time',
    order: 3,
  },
  {
    id: 'lane_bonuses',
    name: 'Lane Conditionals',
    description: 'Unlock conditional lane bonuses: heal-in-top resets a cooldown slot, bot row earns coins.',
    category: 'gameplay',
    gemCost: 75,
    achievementRequired: 'zone2_boss_first',
    achievementLabel: 'Kill Zone 2 boss for the first time',
    order: 4,
  },
  {
    id: 'companion_gecko',
    name: 'Gecko Mystique 🦎',
    description: 'Companion: +1 on all attack dice (passive). Hypnose active — enemy skips intent (CD 4).',
    category: 'companion',
    gemCost: 200,
    achievementRequired: 'zone2_boss_first',
    achievementLabel: 'Kill Zone 2 boss for the first time',
    order: 5,
  },
  {
    id: 'companion_croak',
    name: 'Croak Jr. 🐊',
    description: 'Companion: +2 ATK bonus (passive). Leap active — 8 flat damage ignoring shield (CD 5).',
    category: 'companion',
    gemCost: 300,
    order: 6,
  },
  {
    id: 'weapon_slot_2',
    name: '2nd Weapon Slot',
    description: 'Unlock a second weapon slot for dual wielding.',
    category: 'weapon',
    gemCost: 250,
    achievementRequired: 'zone4_boss_first',
    achievementLabel: 'Kill Zone 4 boss for the first time',
    order: 7,
  },
  {
    id: 'companion_oeil',
    name: "L'Œil 👁️",
    description: "Companion: reveals enemy intent 2 turns ahead (passive). Vision — free reroll, pick best of 2 (CD 6).",
    category: 'companion',
    gemCost: 500,
    achievementRequired: 'zone3_boss_first',
    achievementLabel: 'Kill Zone 3 boss for the first time',
    order: 8,
  },
];

// ── XP levels ─────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = [0, 100, 250, 500, 900, 1500, 2500, 4000];

export function computeLevel(xp: number): number {
  for (let i = XP_PER_LEVEL.length - 1; i >= 0; i--) {
    if (xp >= XP_PER_LEVEL[i]) return i;
  }
  return 0;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; level: number } {
  const level = computeLevel(xp);
  const current = xp - XP_PER_LEVEL[level];
  const needed = level < XP_PER_LEVEL.length - 1
    ? XP_PER_LEVEL[level + 1] - XP_PER_LEVEL[level]
    : 0;
  return { current, needed, level };
}

// ── Storage ───────────────────────────────────────────────────────────────────

const META_KEY = 'jk_meta_progression_v1';

const DEFAULT_STATE: MetaProgressionState = {
  xp: 0,
  gems: 0,
  unlockedIds: [],
  achievements: [],
  totalRuns: 0,
  totalKills: 0,
  bestScore: 0,
};

export function loadMeta(): MetaProgressionState {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<MetaProgressionState>;
    return {
      xp: parsed.xp ?? 0,
      gems: parsed.gems ?? 0,
      unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      totalRuns: parsed.totalRuns ?? 0,
      totalKills: parsed.totalKills ?? 0,
      bestScore: parsed.bestScore ?? 0,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveMeta(state: MetaProgressionState): void {
  localStorage.setItem(META_KEY, JSON.stringify(state));
}

// ── Unlock checks ─────────────────────────────────────────────────────────────

export function isUnlocked(meta: MetaProgressionState, id: UnlockId): boolean {
  return meta.unlockedIds.includes(id);
}

export function unlock(meta: MetaProgressionState, id: UnlockId): MetaProgressionState {
  if (meta.unlockedIds.includes(id)) return meta;
  return { ...meta, unlockedIds: [...meta.unlockedIds, id] };
}

export function tryUnlockWithGems(
  meta: MetaProgressionState,
  id: UnlockId,
): { next: MetaProgressionState; success: boolean; reason?: string } {
  const def = UNLOCKS.find(u => u.id === id);
  if (!def) return { next: meta, success: false, reason: 'Unknown unlock' };
  if (meta.unlockedIds.includes(id)) return { next: meta, success: false, reason: 'Already unlocked' };
  if (meta.gems < def.gemCost) return { next: meta, success: false, reason: `Need ${def.gemCost} gems (you have ${meta.gems})` };
  return {
    next: { ...meta, gems: meta.gems - def.gemCost, unlockedIds: [...meta.unlockedIds, id] },
    success: true,
  };
}

// ── Achievement + XP/gems earning ────────────────────────────────────────────

export function recordAchievement(
  meta: MetaProgressionState,
  achievement: string,
): MetaProgressionState {
  if (meta.achievements.includes(achievement)) return meta;
  let next = { ...meta, achievements: [...meta.achievements, achievement] };

  // Auto-unlock from achievement
  for (const unlock of UNLOCKS) {
    if (unlock.achievementRequired === achievement && !next.unlockedIds.includes(unlock.id)) {
      next = { ...next, unlockedIds: [...next.unlockedIds, unlock.id] };
    }
  }

  return next;
}

export interface RunReward {
  xpGained: number;
  gemsGained: number;
  newAchievements: string[];
  newUnlocks: UnlockId[];
}

export function recordRunEnd(
  meta: MetaProgressionState,
  run: { score: number; floor: number; kills: number; bossZone?: number },
): { next: MetaProgressionState; reward: RunReward } {
  const xpGained = run.floor * 40 + Math.floor(run.score / 100) * 5;
  const gemsGained = run.floor * 5 + (run.bossZone ? run.bossZone * 10 : 0);

  const newAchievements: string[] = [];
  if (run.bossZone) {
    const key = `zone${run.bossZone}_boss_first`;
    if (!meta.achievements.includes(key)) newAchievements.push(key);
  }

  let next: MetaProgressionState = {
    ...meta,
    xp: meta.xp + xpGained,
    gems: meta.gems + gemsGained,
    totalRuns: meta.totalRuns + 1,
    totalKills: meta.totalKills + run.kills,
    bestScore: Math.max(meta.bestScore, run.score),
  };

  const prevUnlocks = new Set(next.unlockedIds);
  for (const ach of newAchievements) {
    next = recordAchievement(next, ach);
  }
  const newUnlocks = next.unlockedIds.filter(id => !prevUnlocks.has(id)) as UnlockId[];

  return { next, reward: { xpGained, gemsGained, newAchievements, newUnlocks } };
}

// ── Feature gating helpers ────────────────────────────────────────────────────

export function canPlayKKM(meta: MetaProgressionState): boolean {
  return computeLevel(meta.xp) >= 3 && isUnlocked(meta, 'character_kkm');
}

export function hasWeaponSlot(meta: MetaProgressionState): boolean {
  return isUnlocked(meta, 'weapon_slot_1');
}

export function hasDualWeaponSlot(meta: MetaProgressionState): boolean {
  return computeLevel(meta.xp) >= 7 && isUnlocked(meta, 'weapon_slot_2');
}

export function hasCompanionSlot(meta: MetaProgressionState): boolean {
  return (
    isUnlocked(meta, 'companion_gecko') ||
    isUnlocked(meta, 'companion_croak') ||
    isUnlocked(meta, 'companion_oeil')
  );
}

export function hasDiceSpecials(meta: MetaProgressionState): boolean {
  return isUnlocked(meta, 'dice_specials');
}

export function hasLaneBonuses(meta: MetaProgressionState): boolean {
  return isUnlocked(meta, 'lane_bonuses');
}

export function getUnlockedCompanions(meta: MetaProgressionState): UnlockId[] {
  return (['companion_gecko', 'companion_croak', 'companion_oeil'] as UnlockId[]).filter(id =>
    isUnlocked(meta, id),
  );
}
