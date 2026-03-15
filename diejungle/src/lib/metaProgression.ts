// metaProgression.ts — Meta progression, XP, gems, unlock tree
// Die in the Jungle — Telegram Mini App

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type UnlockId =
  | 'character_kkm'
  | 'weapon_slot_2'
  | 'companion_slot'
  | 'companion_gecko'
  | 'companion_croak'
  | 'companion_oeil'
  | 'dice_specials'
  | 'lane_bonuses'
  | 'relic_slot_1'       // level 5
  | 'relic_slot_2'       // level 10
  | 'relic_slot_3'       // level 15
  | 'starter_weapon_blade'
  | 'starter_weapon_staff'
  | 'starter_weapon_shield'
  | 'starter_weapon_totem'
  | 'starter_weapon_cannon'
  | 'starter_weapon_fang';

export type UnlockCurrency = 'xp' | 'gems';

export interface Unlock {
  id: UnlockId;
  name: string;
  desc: string;
  emoji: string;
  currency: UnlockCurrency;
  cost: number;
  requires?: UnlockId;
}

export interface MetaProgressionState {
  xp: number;
  gems: number;
  unlocked: UnlockId[];
  totalRuns: number;
  totalBossKills: number;
  bestScore: number;
  bestFloor: number;
  // Daily login system
  lastLoginDate: string | null;  // "YYYY-MM-DD"
  loginStreak: number;
  totalLogins: number;
  // Relic ownership (permanent collection, separate from equipped)
  ownedRelics: string[];         // relic IDs permanently owned
}

export interface DailyLoginReward {
  gems: number;
  streak: number;
  milestone: boolean;
  bonusTickets?: number;
}

export interface RunReward {
  xpGained: number;
  gemsGained: number;
  leveledUp: boolean;
  newLevel: number;
  levelRewards: LevelReward[];
}

export interface LevelReward {
  level: number;
  desc: string;
  unlockId?: UnlockId;
}

// ─────────────────────────────────────────────
// UNLOCK TREE
// ─────────────────────────────────────────────

export const UNLOCKS: Record<UnlockId, Unlock> = {
  character_kkm: {
    id: 'character_kkm',
    name: 'KKM',
    desc: 'Unlock KKM as a playable character. Tank — 34 HP, +4 start shield.',
    emoji: '🤖',
    currency: 'gems',
    cost: 200,
  },
  weapon_slot_2: {
    id: 'weapon_slot_2',
    name: 'Off-Hand Slot',
    desc: 'Unlock a second weapon slot (off-hand). Equip 2 weapons simultaneously.',
    emoji: '⚔️',
    currency: 'gems',
    cost: 500,
    requires: 'starter_weapon_blade',
  },
  companion_slot: {
    id: 'companion_slot',
    name: 'Companion Slot',
    desc: 'Unlock the companion system. Bring a companion on your runs.',
    emoji: '🦎',
    currency: 'xp',
    cost: 300,
  },
  companion_gecko: {
    id: 'companion_gecko',
    name: 'Gecko Mystique',
    desc: 'Unlock Gecko Mystique companion. +1 attack die values + Hypnose active.',
    emoji: '🦎',
    currency: 'gems',
    cost: 200,
    requires: 'companion_slot',
  },
  companion_croak: {
    id: 'companion_croak',
    name: 'Croak Jr.',
    desc: 'Unlock Croak Jr. companion. +2 ATK passive + Leap active (8 flat dmg).',
    emoji: '🐊',
    currency: 'gems',
    cost: 300,
    requires: 'companion_slot',
  },
  companion_oeil: {
    id: 'companion_oeil',
    name: "L'Œil",
    desc: "Unlock L'Œil companion. See 2 intents ahead + Vision free reroll active.",
    emoji: '👁️',
    currency: 'gems',
    cost: 500,
    requires: 'companion_slot',
  },
  dice_specials: {
    id: 'dice_specials',
    name: 'Special Faces',
    desc: 'Unlock special die faces. Face 6 attack = Pierce. Face 5 = Echo. Face 6 shield = Fortress.',
    emoji: '🎲',
    currency: 'xp',
    cost: 150,
  },
  lane_bonuses: {
    id: 'lane_bonuses',
    name: 'Lane Bonuses',
    desc: 'Unlock conditional lane bonuses. Heal in top row frees a cooldown. Bot row dice generate coins.',
    emoji: '🔥',
    currency: 'xp',
    cost: 200,
  },
  relic_slot_1: {
    id: 'relic_slot_1',
    name: 'Relic Slot 1',
    desc: 'Unlock your first relic slot. Equip a permanent relic before each run.',
    emoji: '💠',
    currency: 'xp',
    cost: 0, // auto-unlocked at level 5
  },
  relic_slot_2: {
    id: 'relic_slot_2',
    name: 'Relic Slot 2',
    desc: 'Unlock a second relic slot. Stack two relics for powerful synergies.',
    emoji: '💠',
    currency: 'xp',
    cost: 0, // auto-unlocked at level 10
    requires: 'relic_slot_1',
  },
  relic_slot_3: {
    id: 'relic_slot_3',
    name: 'Relic Slot 3',
    desc: 'Unlock the final relic slot. The endgame of meta-progression.',
    emoji: '💠',
    currency: 'xp',
    cost: 0, // auto-unlocked at level 15
    requires: 'relic_slot_2',
  },
  starter_weapon_blade: {
    id: 'starter_weapon_blade',
    name: 'Jungle Blade (Starter)',
    desc: 'Start runs with Jungle Blade equipped. +2 ATK passive + Double Strike special.',
    emoji: '🗡️',
    currency: 'gems',
    cost: 150,
  },
  starter_weapon_staff: {
    id: 'starter_weapon_staff',
    name: 'Amber Staff (Starter)',
    desc: 'Start runs with Amber Staff equipped. +2 Heal Bonus passive + Mend special.',
    emoji: '🪄',
    currency: 'gems',
    cost: 150,
  },
  starter_weapon_shield: {
    id: 'starter_weapon_shield',
    name: 'Stone Shield (Starter)',
    desc: 'Start runs with Stone Shield equipped. +3 Max HP passive + Fortress special.',
    emoji: '🛡️',
    currency: 'gems',
    cost: 150,
  },
  starter_weapon_totem: {
    id: 'starter_weapon_totem',
    name: 'Ka Totem (Starter)',
    desc: 'Start runs with Ka Totem equipped. +1 Cooldown Tick passive + Reset special.',
    emoji: '🪬',
    currency: 'gems',
    cost: 150,
  },
  starter_weapon_cannon: {
    id: 'starter_weapon_cannon',
    name: 'Chrome Cannon (Starter)',
    desc: 'Start runs with Chrome Cannon equipped. +3 ATK passive + Overload special.',
    emoji: '💥',
    currency: 'gems',
    cost: 150,
  },
  starter_weapon_fang: {
    id: 'starter_weapon_fang',
    name: 'Venom Fang (Starter)',
    desc: 'Start runs with Venom Fang equipped. +1 ATK passive + Inject DoT special.',
    emoji: '🐍',
    currency: 'gems',
    cost: 150,
  },
};

// ─────────────────────────────────────────────
// XP LEVEL TABLE
// ─────────────────────────────────────────────

const LEVEL_XP_TABLE = [
  0,    // level 1
  100,  // level 2
  250,  // level 3
  450,  // level 4
  700,  // level 5
  1000, // level 6
  1400, // level 7
  1900, // level 8
  2500, // level 9
  3200, // level 10
  4000, // level 11
  5000, // level 12
];

export const LEVEL_REWARDS: LevelReward[] = [
  { level: 2,  desc: '+50 gems' },
  { level: 3,  desc: 'Unlock: Special Die Faces', unlockId: 'dice_specials' },
  { level: 4,  desc: '+100 gems' },
  { level: 5,  desc: 'Unlock: Lane Bonuses + Relic Slot 1', unlockId: 'lane_bonuses' },
  { level: 6,  desc: '+150 gems' },
  { level: 7,  desc: 'Unlock: Companion Slot',    unlockId: 'companion_slot' },
  { level: 8,  desc: '+200 gems' },
  { level: 9,  desc: '+200 gems' },
  { level: 10, desc: '+300 gems — Relic Slot 2 · You are a Kabalian', unlockId: 'relic_slot_2' },
  { level: 11, desc: '+200 gems' },
  { level: 12, desc: '+250 gems' },
  { level: 13, desc: '+250 gems' },
  { level: 14, desc: '+300 gems' },
  { level: 15, desc: '+400 gems — Relic Slot 3 · Titre "Maître Kabal"', unlockId: 'relic_slot_3' },
];

// ─────────────────────────────────────────────
// LEVEL HELPERS
// ─────────────────────────────────────────────

export function computeLevel(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_XP_TABLE.length; i++) {
    if (xp >= LEVEL_XP_TABLE[i]) level = i + 1;
    else break;
  }
  if (xp >= LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1]) {
    const overflow = xp - LEVEL_XP_TABLE[LEVEL_XP_TABLE.length - 1];
    level = LEVEL_XP_TABLE.length + Math.floor(overflow / 1000);
  }
  return level;
}

export function xpToNextLevel(xp: number): { current: number; needed: number; level: number } {
  const level = computeLevel(xp);
  const tableMax = LEVEL_XP_TABLE.length;
  if (level < tableMax) {
    const currentLevelXp = LEVEL_XP_TABLE[level - 1];
    const nextLevelXp    = LEVEL_XP_TABLE[level];
    return { level, current: xp - currentLevelXp, needed: nextLevelXp - currentLevelXp };
  }
  const overflow = xp - LEVEL_XP_TABLE[tableMax - 1];
  return { level, current: overflow % 1000, needed: 1000 };
}

// ─────────────────────────────────────────────
// XP + GEMS EARNED PER RUN
// ─────────────────────────────────────────────

export function computeRunRewards(params: {
  score: number;
  floor: number;
  kills: number;
  bossZone?: number;
}): { xpGained: number; gemsGained: number } {
  const { score, floor, bossZone } = params;
  const xpGained  = Math.floor(score / 10) + (floor - 1) * 20;
  const floorGems: Record<number, number> = { 1: 15, 2: 25, 3: 35 };
  const gemsGained = (floorGems[floor] ?? 35) + (bossZone ? 10 : 0);
  return { xpGained, gemsGained };
}

// ─────────────────────────────────────────────
// RECORD RUN END
// ─────────────────────────────────────────────

export function recordRunEnd(
  current: MetaProgressionState,
  params: { score: number; floor: number; kills: number; bossZone?: number },
): { next: MetaProgressionState; reward: RunReward } {
  const { xpGained, gemsGained } = computeRunRewards(params);
  const prevLevel = computeLevel(current.xp);
  const newXp     = current.xp + xpGained;
  const newLevel  = computeLevel(newXp);
  const leveledUp = newLevel > prevLevel;

  const levelRewards: LevelReward[] = [];
  let autoUnlocked: UnlockId[] = [...current.unlocked];
  let bonusGems = 0;

  if (leveledUp) {
    for (let lvl = prevLevel + 1; lvl <= newLevel; lvl++) {
      const reward = LEVEL_REWARDS.find(r => r.level === lvl);
      if (reward) {
        levelRewards.push(reward);
        if (reward.unlockId && !autoUnlocked.includes(reward.unlockId)) {
          autoUnlocked.push(reward.unlockId);
        }
        // Level 5 also unlocks relic_slot_1
        if (lvl === 5 && !autoUnlocked.includes('relic_slot_1')) {
          autoUnlocked.push('relic_slot_1');
        }
        const gemMatch = reward.desc.match(/\+(\d+) gems/);
        if (gemMatch) bonusGems += parseInt(gemMatch[1], 10);
      }
    }
  }

  const next: MetaProgressionState = {
    xp:             newXp,
    gems:           current.gems + gemsGained + bonusGems,
    unlocked:       autoUnlocked,
    totalRuns:      current.totalRuns + 1,
    totalBossKills: current.totalBossKills + (params.bossZone ? 1 : 0),
    bestScore:      Math.max(current.bestScore, params.score),
    bestFloor:      Math.max(current.bestFloor, params.floor),
    // Preserve daily login fields
    lastLoginDate:  current.lastLoginDate  ?? null,
    loginStreak:    current.loginStreak    ?? 0,
    totalLogins:    current.totalLogins    ?? 0,
  };

  return {
    next,
    reward: { xpGained, gemsGained: gemsGained + bonusGems, leveledUp, newLevel, levelRewards },
  };
}

// ─────────────────────────────────────────────
// UNLOCK WITH GEMS/XP
// ─────────────────────────────────────────────

export function tryUnlockWithGems(
  current: MetaProgressionState,
  unlockId: UnlockId,
): { next: MetaProgressionState; success: boolean; reason?: string } {
  const unlock = UNLOCKS[unlockId];
  if (!unlock) return { next: current, success: false, reason: 'Unknown unlock' };
  if (current.unlocked.includes(unlockId)) return { next: current, success: false, reason: 'Already unlocked' };
  if (unlock.requires && !current.unlocked.includes(unlock.requires)) {
    return { next: current, success: false, reason: `Requires ${UNLOCKS[unlock.requires]?.name} first` };
  }
  if (unlock.currency === 'gems' && current.gems < unlock.cost) {
    return { next: current, success: false, reason: `Need ${unlock.cost} gems (you have ${current.gems})` };
  }
  if (unlock.currency === 'xp' && current.xp < unlock.cost) {
    return { next: current, success: false, reason: `Need ${unlock.cost} XP (you have ${current.xp})` };
  }
  const next: MetaProgressionState = {
    ...current,
    gems:     unlock.currency === 'gems' ? current.gems - unlock.cost : current.gems,
    unlocked: [...current.unlocked, unlockId],
  };
  return { next, success: true };
}

// ─────────────────────────────────────────────
// FEATURE FLAGS
// ─────────────────────────────────────────────

export function canPlayKKM(meta: MetaProgressionState): boolean {
  return meta.unlocked.includes('character_kkm');
}

export function hasWeaponSlot(meta: MetaProgressionState, slot: 1 | 2 = 1): boolean {
  if (slot === 1) return true;
  return meta.unlocked.includes('weapon_slot_2');
}

export function hasCompanionSlot(meta: MetaProgressionState): boolean {
  return meta.unlocked.includes('companion_slot');
}

export function hasDiceSpecials(meta: MetaProgressionState): boolean {
  return meta.unlocked.includes('dice_specials');
}

export function hasLaneBonuses(meta: MetaProgressionState): boolean {
  return meta.unlocked.includes('lane_bonuses');
}

export function getUnlockedCompanions(meta: MetaProgressionState): string[] {
  return (['companion_gecko', 'companion_croak', 'companion_oeil'] as UnlockId[])
    .filter(id => meta.unlocked.includes(id))
    .map(id => id.replace('companion_', ''));
}

export function getUnlockedStarterWeapons(meta: MetaProgressionState): string[] {
  const starterMap: Record<string, string> = {
    starter_weapon_blade:  'jungle-blade',
    starter_weapon_staff:  'amber-staff',
    starter_weapon_shield: 'stone-shield',
    starter_weapon_totem:  'ka-totem',
    starter_weapon_cannon: 'chrome-cannon',
    starter_weapon_fang:   'venom-fang',
  };
  return Object.entries(starterMap)
    .filter(([unlockId]) => meta.unlocked.includes(unlockId as UnlockId))
    .map(([, variantId]) => variantId);
}

// ─────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────

const META_STORAGE_KEY = 'jungle_kabal_meta_v1';

// Legacy key migration
const LEGACY_META_KEY = 'jk_meta_progression_v1';

export function makeInitialMeta(): MetaProgressionState {
  return {
    xp: 0, gems: 0, unlocked: [],
    totalRuns: 0, totalBossKills: 0, bestScore: 0, bestFloor: 0,
    lastLoginDate: null,
    loginStreak: 0,
    totalLogins: 0,
    ownedRelics: [],
  };
}

// ─────────────────────────────────────────────
// RELIC HELPERS
// ─────────────────────────────────────────────

export function getRelicSlotCount(meta: MetaProgressionState): number {
  if (meta.unlocked.includes('relic_slot_3')) return 3;
  if (meta.unlocked.includes('relic_slot_2')) return 2;
  if (meta.unlocked.includes('relic_slot_1')) return 1;
  return 0;
}

/** Add a relic to the player's permanent collection. */
export function addOwnedRelic(meta: MetaProgressionState, relicId: string): MetaProgressionState {
  if (meta.ownedRelics.includes(relicId)) return meta;
  return { ...meta, ownedRelics: [...meta.ownedRelics, relicId] };
}

/** Purchase a relic with gems. Returns updated meta or null if not enough gems. */
export function buyRelicWithGems(
  meta: MetaProgressionState,
  relicId: string,
  gemCost: number,
): MetaProgressionState | null {
  if (meta.ownedRelics.includes(relicId)) return null;
  if (meta.gems < gemCost) return null;
  return { ...meta, gems: meta.gems - gemCost, ownedRelics: [...meta.ownedRelics, relicId] };
}

// ─────────────────────────────────────────────
// DAILY LOGIN
// ─────────────────────────────────────────────

function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Claim the daily login reward.
 * Returns null if already claimed today.
 * Returns { next, reward } otherwise.
 */
export function claimDailyLogin(
  meta: MetaProgressionState,
): { next: MetaProgressionState; reward: DailyLoginReward } | null {
  const today     = getTodayDateString();
  const yesterday = getYesterdayDateString();

  if (meta.lastLoginDate === today) {
    // Already claimed today
    return null;
  }

  const newStreak = meta.lastLoginDate === yesterday
    ? (meta.loginStreak ?? 0) + 1
    : 1;

  let gems = 0;
  let bonusTickets: number | undefined;
  let milestone = false;

  if (newStreak === 30) {
    gems      = 400;
    milestone = true;
  } else if (newStreak === 14) {
    gems         = 150;
    bonusTickets = 2;
    milestone    = true;
  } else if (newStreak === 7) {
    gems         = 80;
    bonusTickets = 1;
    milestone    = true;
  } else {
    // streak 1-6 (and 8-13, 15-29)
    gems = 15 + (Math.min(newStreak, 6) - 1) * 5;
  }

  const next: MetaProgressionState = {
    ...meta,
    gems:          meta.gems + gems,
    lastLoginDate: today,
    loginStreak:   newStreak,
    totalLogins:   (meta.totalLogins ?? 0) + 1,
  };

  const reward: DailyLoginReward = {
    gems,
    streak:  newStreak,
    milestone,
    ...(bonusTickets !== undefined ? { bonusTickets } : {}),
  };

  return { next, reward };
}

export function loadMeta(): MetaProgressionState {
  try {
    // Try new key first
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        xp:             parsed.xp             ?? 0,
        gems:           parsed.gems           ?? 0,
        // Support both old "unlockedIds" and new "unlocked" field names
        unlocked:       parsed.unlocked       ?? parsed.unlockedIds ?? [],
        totalRuns:      parsed.totalRuns      ?? 0,
        totalBossKills: parsed.totalBossKills ?? parsed.totalKills ?? 0,
        bestScore:      parsed.bestScore      ?? 0,
        bestFloor:      parsed.bestFloor      ?? 0,
        // Daily login fields — default if missing (existing saves)
        lastLoginDate:  parsed.lastLoginDate  ?? null,
        loginStreak:    parsed.loginStreak    ?? 0,
        totalLogins:    parsed.totalLogins    ?? 0,
        ownedRelics:    Array.isArray(parsed.ownedRelics) ? parsed.ownedRelics : [],
      };
    }
    // Try legacy key migration
    const legacy = localStorage.getItem(LEGACY_META_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      const migrated: MetaProgressionState = {
        xp:             parsed.xp             ?? 0,
        gems:           parsed.gems           ?? 0,
        unlocked:       parsed.unlockedIds    ?? [],
        totalRuns:      parsed.totalRuns      ?? 0,
        totalBossKills: parsed.totalKills     ?? 0,
        bestScore:      parsed.bestScore      ?? 0,
        bestFloor:      0,
        lastLoginDate:  null,
        loginStreak:    0,
        totalLogins:    0,
        ownedRelics:    [],
      };
      // Save to new key
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return makeInitialMeta();
  } catch {
    return makeInitialMeta();
  }
}

export function saveMeta(meta: MetaProgressionState): void {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(meta));
  } catch {
    // Storage unavailable — fail silently
  }
}

// ─────────────────────────────────────────────
// LEGACY COMPAT EXPORTS (so old code still works)
// ─────────────────────────────────────────────

/** @deprecated Use UNLOCKS[id] instead */
export const UNLOCKS_ARRAY = Object.values(UNLOCKS);
