// relicSystem.ts — Permanent equippable relics for Die in the Jungle
// Version 1.0 — pre-run slot system, 3 slots unlocked by level

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type RelicTier = 'standard' | 'build_forcing' | 'legendary';

export interface RelicEffect {
  attackBonus?: number;
  attackDieValueBonus?: number;
  healBonus?: number;
  maxHpBonus?: number;
  combatStartShield?: number;
  cooldownTick?: number;
  cooldownBase?: number;
  topRowBonus?: number;
  shieldMultiplier?: number;
  rerollsPerTurn?: number;
  startCoins?: number;
  dicePerTurn?: number;
  enemyStartPoisonStacks?: number;
  selfBleedPerTurn?: number;
  hpLossOnCombatStart?: number;
  healMidRowBonus?: number;
  forcedPierceOnSix?: boolean;
  preventDuplicateDiceOnFirstRoll?: boolean;
  revealAllIntents?: number;
  revealEventChoices?: boolean;
  enemyZoneStartHpMult?: number;
  bossHpMult?: number;
  weaponPassiveMultiplier?: number;
  weaponCooldownPenalty?: number;
  saturationResetThreshold?: number;
}

export interface RelicConstraint {
  description: string;
  effect: Partial<RelicEffect>;
}

export interface Relic {
  id: string;
  name: string;
  emoji: string;
  tier: RelicTier;
  flavor: string;
  buildTag?: string;
  effect: RelicEffect;
  constraint?: RelicConstraint;
  gemCost: number;
  tokenCost?: number;
  dropEligible: boolean;
  affectsScore: boolean;
}

// ─────────────────────────────────────────────
// RELIC REGISTRY
// ─────────────────────────────────────────────

export const RELIC_REGISTRY: Record<string, Relic> = {
  // ── Standard ──────────────────────────────────────────────────────────────
  'ember-core': {
    id: 'ember-core', name: 'Ember Core', emoji: '🔥', tier: 'standard',
    flavor: '"Le Ka brûle en toi. Difficile de l\'ignorer."',
    effect: { attackBonus: 2 },
    gemCost: 80, dropEligible: true, affectsScore: true,
  },
  'stone-heart': {
    id: 'stone-heart', name: 'Stone Heart', emoji: '🛡️', tier: 'standard',
    flavor: '"Les Kabalians qui survivent longtemps ont tous le même regard."',
    effect: { maxHpBonus: 5, combatStartShield: 3 },
    gemCost: 80, dropEligible: true, affectsScore: true,
  },
  'jungle-sap': {
    id: 'jungle-sap', name: 'Jungle Sap', emoji: '❤️', tier: 'standard',
    flavor: '"La jungle guérit ceux qui savent écouter."',
    effect: { healBonus: 2 },
    gemCost: 80, dropEligible: true, affectsScore: true,
  },
  'amber-clock': {
    id: 'amber-clock', name: 'Amber Clock', emoji: '⏱️', tier: 'standard',
    flavor: '"Le temps dans la jungle n\'est pas le même qu\'ailleurs."',
    effect: { cooldownTick: 1 },
    gemCost: 100, dropEligible: true, affectsScore: false,
  },
  'ka-hoard': {
    id: 'ka-hoard', name: 'Ka Hoard', emoji: '🪙', tier: 'standard',
    flavor: '"Certains préparent leur entrée dans la jungle."',
    effect: { startCoins: 25 },
    gemCost: 90, dropEligible: true, affectsScore: false,
  },
  'loaded-dice': {
    id: 'loaded-dice', name: 'Loaded Dice', emoji: '🎲', tier: 'standard',
    flavor: '"La chance, c\'est une compétence."',
    effect: { preventDuplicateDiceOnFirstRoll: true },
    gemCost: 100, dropEligible: true, affectsScore: false,
  },

  // ── Build-forcing ──────────────────────────────────────────────────────────
  'berserker-oath': {
    id: 'berserker-oath', name: 'Berserker Oath', emoji: '⚔️', tier: 'build_forcing',
    flavor: '"Le serment est simple : ne jamais défendre."',
    buildTag: 'Full Attack',
    effect: { attackDieValueBonus: 2 },
    constraint: { description: 'Shield dice give half value.', effect: { shieldMultiplier: 0.5 } },
    gemCost: 150, dropEligible: true, affectsScore: true,
  },
  'fortress-doctrine': {
    id: 'fortress-doctrine', name: 'Fortress Doctrine', emoji: '🛡️', tier: 'build_forcing',
    flavor: '"La meilleure attaque est de ne jamais être touché."',
    buildTag: 'Full Tank',
    effect: { shieldMultiplier: 1.5 },
    constraint: { description: 'Attack dice -1 value.', effect: { attackDieValueBonus: -1 } },
    gemCost: 150, dropEligible: true, affectsScore: true,
  },
  'blood-pact': {
    id: 'blood-pact', name: 'Blood Pact', emoji: '❤️', tier: 'build_forcing',
    flavor: '"Le Ka prend avant de donner."',
    buildTag: 'Full Heal',
    effect: { healBonus: 3 },
    constraint: { description: 'Start each combat with -4 HP (non-lethal).', effect: { hpLossOnCombatStart: 4 } },
    gemCost: 150, dropEligible: true, affectsScore: true,
  },
  'tempo-master': {
    id: 'tempo-master', name: 'Tempo Master', emoji: '🔄', tier: 'build_forcing',
    flavor: '"Contrôler le rythme, c\'est contrôler la bataille."',
    buildTag: 'Board Control',
    effect: { saturationResetThreshold: 2 },
    constraint: { description: 'Cooldown base +1.', effect: { cooldownBase: 1 } },
    gemCost: 160, dropEligible: true, affectsScore: false,
  },
  'venom-pact': {
    id: 'venom-pact', name: 'Venom Pact', emoji: '💀', tier: 'build_forcing',
    flavor: '"Dans la jungle, tout empoisonne. Y compris toi."',
    buildTag: 'DoT Build',
    effect: { enemyStartPoisonStacks: 2 },
    constraint: { description: 'You lose 1 HP per turn.', effect: { selfBleedPerTurn: 1 } },
    gemCost: 150, dropEligible: true, affectsScore: true,
  },
  'precision': {
    id: 'precision', name: 'Precision', emoji: '🎯', tier: 'build_forcing',
    flavor: '"Un seul coup, au bon endroit."',
    buildTag: 'Precision',
    effect: { forcedPierceOnSix: true },
    constraint: { description: 'Max 1 reroll per turn.', effect: { rerollsPerTurn: -99 } },
    gemCost: 180, dropEligible: false, affectsScore: true,
  },
  'natures-bargain': {
    id: 'natures-bargain', name: "Nature's Bargain", emoji: '🌿', tier: 'build_forcing',
    flavor: '"La jungle préfère ceux qui ne cherchent pas à dominer."',
    buildTag: 'Mid Row',
    effect: { healMidRowBonus: 3 },
    constraint: { description: 'Top row is ×2 instead of ×3.', effect: { topRowBonus: -1 } },
    gemCost: 170, dropEligible: true, affectsScore: true,
  },

  // ── Legendary ──────────────────────────────────────────────────────────────
  'ka-crown': {
    id: 'ka-crown', name: 'Ka Crown', emoji: '👑', tier: 'legendary',
    flavor: '"Le Ka reconnaît ses maîtres."',
    effect: { topRowBonus: 1 },
    gemCost: 400, dropEligible: false, affectsScore: true,
  },
  'prism-soul': {
    id: 'prism-soul', name: 'Prism Soul', emoji: '💎', tier: 'legendary',
    flavor: '"Le pouvoir de deux. Le prix du temps."',
    effect: { weaponPassiveMultiplier: 2 },
    constraint: { description: 'Weapon specials have +2 cooldown.', effect: { weaponCooldownPenalty: 2 } },
    gemCost: 500, dropEligible: false, affectsScore: true,
  },
  'oracle-sigil': {
    id: 'oracle-sigil', name: 'Oracle Sigil', emoji: '🔮', tier: 'legendary',
    flavor: '"Voir l\'avenir ne le change pas. Ça aide quand même."',
    effect: { revealAllIntents: 3, revealEventChoices: true },
    gemCost: 450, dropEligible: false, affectsScore: false,
  },
  'genesis-relic': {
    id: 'genesis-relic', name: 'Genesis Relic', emoji: '⚡', tier: 'legendary',
    flavor: '"Quatre. Toujours quatre."',
    effect: { dicePerTurn: 1 },
    tokenCost: 500,
    gemCost: 600, dropEligible: false, affectsScore: true,
  },
  'shadow-pact': {
    id: 'shadow-pact', name: 'Shadow Pact', emoji: '🌑', tier: 'legendary',
    flavor: '"La jungle donne d\'une main. Reprend de l\'autre."',
    effect: { enemyZoneStartHpMult: 0.7 },
    constraint: { description: 'Boss has +20% HP.', effect: { bossHpMult: 1.2 } },
    gemCost: 500, dropEligible: false, affectsScore: true,
  },
};

export const RELIC_LIST = Object.values(RELIC_REGISTRY);

// ─────────────────────────────────────────────
// RARITY COLORS (for UI)
// ─────────────────────────────────────────────

export const RELIC_TIER_COLORS: Record<RelicTier, string> = {
  standard:      '#a3a3a3',
  build_forcing: '#f59e0b',
  legendary:     '#c084fc',
};

export const RELIC_TIER_LABELS: Record<RelicTier, string> = {
  standard:      'Standard',
  build_forcing: 'Build',
  legendary:     'Legendary',
};

// ─────────────────────────────────────────────
// SLOT UNLOCK BY LEVEL
// ─────────────────────────────────────────────

/**
 * Level 5  → slot 1 (with weapon_slot_2 unlock)
 * Level 10 → slot 2 (with companion_slot unlock)
 * Level 15 → slot 3 (final milestone)
 */
export function getRelicSlotCount(level: number): number {
  if (level >= 15) return 3;
  if (level >= 10) return 2;
  if (level >= 5)  return 1;
  return 0;
}

// ─────────────────────────────────────────────
// GLOBAL STAT CAPS — prevent infinite stacking
// ─────────────────────────────────────────────

export const STAT_CAPS = {
  attackBonus:        6,   // max +6 ATK total from all sources
  attackDieValueBonus:3,   // max +3 die value bonus
  healBonus:          5,   // max +5 heal bonus
  shieldMultiplier:   3,   // max ×3 shield multiplier
  topRowBonusMax:     5,   // top row: base 3 + max +2 = ×5 total
  cooldownTick:       3,   // max +3 cooldown tick
  dicePerTurn:        4,   // hard cap: never more than 4 dice/turn
} as const;

// ─────────────────────────────────────────────
// APPLY RELICS TO PLAYER
// ─────────────────────────────────────────────

/**
 * Applies all equipped relic effects to the player state at run start.
 * Call once in pickCharacter() after weapon passives are applied.
 */
export function applyRelicsToPlayer(basePlayer: any, equippedRelicIds: string[]): any {
  let p = { ...basePlayer };

  // Initialize relic runtime flags
  p.shieldMultiplier      = p.shieldMultiplier      ?? 1;
  p.attackDieValueBonus   = p.attackDieValueBonus   ?? 0;
  p._relicHpLossOnCombatStart    = 0;
  p._relicEnemyStartPoison       = 0;
  p._relicForcedPierceOnSix      = false;
  p._relicPreventDuplicateDice   = false;
  p._relicRevealIntents          = 1;
  p._relicRevealEventChoices     = false;
  p._relicWeaponPassiveMult      = 1;
  p._relicWeaponCooldownPenalty  = 0;
  p._relicEnemyZoneStartHpMult   = 1;
  p._relicBossHpMult             = 1;
  p._relicHealMidRowBonus        = 0;
  p._saturationResetThreshold    = 9;
  p.selfBleed                    = 0;

  const relics = equippedRelicIds.map(id => RELIC_REGISTRY[id]).filter(Boolean);
  const statSources: Record<string, number> = {};

  for (const relic of relics) {
    const e = relic.effect;
    const c = relic.constraint?.effect ?? {};

    // ── Positive effects ────────────────────────────────────────────────────
    if (e.attackBonus)         p.attackBonus           += applyDR(e.attackBonus,        'attackBonus',        statSources);
    if (e.attackDieValueBonus) p.attackDieValueBonus   += applyDR(e.attackDieValueBonus,'attackDieValueBonus',statSources);
    if (e.healBonus)           p.healBonus             += applyDR(e.healBonus,           'healBonus',          statSources);
    if (e.maxHpBonus)          { p.maxHp += e.maxHpBonus; p.hp += e.maxHpBonus; }
    if (e.combatStartShield)   p.combatStartShield     += e.combatStartShield;
    if (e.cooldownTick)        p.cooldownTick          += e.cooldownTick;
    if (e.topRowBonus)         p.topRowBonus            = (p.topRowBonus || 0) + e.topRowBonus;
    if (e.startCoins)          p.coins                  = (p.coins || 0) + e.startCoins;
    if (e.dicePerTurn)         p.dicePerTurn            = Math.min(4, (p.dicePerTurn || 3) + e.dicePerTurn);
    if (e.shieldMultiplier)    p.shieldMultiplier      *= e.shieldMultiplier;
    if (e.selfBleedPerTurn)    p.selfBleed             += e.selfBleedPerTurn;
    if (e.hpLossOnCombatStart) p._relicHpLossOnCombatStart += e.hpLossOnCombatStart;
    if (e.saturationResetThreshold) p._saturationResetThreshold = e.saturationResetThreshold;
    if (e.enemyStartPoisonStacks)   p._relicEnemyStartPoison   += e.enemyStartPoisonStacks;
    if (e.forcedPierceOnSix)        p._relicForcedPierceOnSix   = true;
    if (e.preventDuplicateDiceOnFirstRoll) p._relicPreventDuplicateDice = true;
    if (e.revealAllIntents)         p._relicRevealIntents  = Math.max(p._relicRevealIntents, e.revealAllIntents);
    if (e.revealEventChoices)       p._relicRevealEventChoices  = true;
    if (e.weaponPassiveMultiplier)  p._relicWeaponPassiveMult   = e.weaponPassiveMultiplier;
    if (e.weaponCooldownPenalty)    p._relicWeaponCooldownPenalty += e.weaponCooldownPenalty;
    if (e.enemyZoneStartHpMult)     p._relicEnemyZoneStartHpMult = e.enemyZoneStartHpMult;
    if (e.bossHpMult)               p._relicBossHpMult = e.bossHpMult;
    if (e.healMidRowBonus)          p._relicHealMidRowBonus += e.healMidRowBonus;

    // ── Constraints (negative effects) ──────────────────────────────────────
    if (c.attackDieValueBonus) p.attackDieValueBonus += c.attackDieValueBonus;
    if (c.cooldownBase)        p.cooldownBase = Math.max(1, (p.cooldownBase || 2) + c.cooldownBase);
    if (c.selfBleedPerTurn)    p.selfBleed += c.selfBleedPerTurn;
    if (c.rerollsPerTurn === -99) p.rerollsPerTurn = Math.min(1, p.rerollsPerTurn ?? 2); // Precision: cap to 1
    if (c.shieldMultiplier)    p.shieldMultiplier *= c.shieldMultiplier;
    if (c.topRowBonus)         p.topRowBonus = (p.topRowBonus || 0) + c.topRowBonus;
  }

  // ── Apply global stat caps ───────────────────────────────────────────────
  p.attackBonus         = Math.min(p.attackBonus,         STAT_CAPS.attackBonus);
  p.attackDieValueBonus = Math.min(p.attackDieValueBonus, STAT_CAPS.attackDieValueBonus);
  p.healBonus           = Math.min(p.healBonus,           STAT_CAPS.healBonus);
  p.shieldMultiplier    = Math.min(
    Math.max(0.1, p.shieldMultiplier),
    STAT_CAPS.shieldMultiplier,
  );
  p.topRowBonus         = Math.min(p.topRowBonus || 0,    STAT_CAPS.topRowBonusMax - 3); // base is 3, cap bonus at +2
  p.cooldownTick        = Math.min(p.cooldownTick,        STAT_CAPS.cooldownTick);
  p.dicePerTurn         = Math.min(p.dicePerTurn,         STAT_CAPS.dicePerTurn);

  return p;
}

/** Diminishing returns: second relic boosting same stat gets 50% of bonus. */
function applyDR(value: number, statKey: string, sources: Record<string, number>): number {
  sources[statKey] = (sources[statKey] || 0) + 1;
  return sources[statKey] === 1 ? value : Math.round(value * 0.5);
}

// ─────────────────────────────────────────────
// RELIC DROP SYSTEM
// ─────────────────────────────────────────────

const BOSS_DROP_CHANCE      = 0.15;
const BOSS_DROP_CHANCE_PERF = 0.25;

/**
 * After a boss kill, determine if a relic drops.
 * Returns the relic, or null if no drop.
 * If all eligible relics are owned, returns null and caller should award +50 gems.
 */
export function tryDropRelic(
  ownedRelicIds: string[],
  isPerfectKill: boolean,
  rng: () => number,
): Relic | null {
  const dropChance = isPerfectKill ? BOSS_DROP_CHANCE_PERF : BOSS_DROP_CHANCE;
  if (rng() > dropChance) return null;

  const eligible = RELIC_LIST.filter(r => r.dropEligible && !ownedRelicIds.includes(r.id));
  if (eligible.length === 0) return null;

  // Weighted: standard=6, build_forcing=3, legendary=1
  const bag: Relic[] = [];
  for (const r of eligible) {
    const weight = r.tier === 'standard' ? 6 : r.tier === 'build_forcing' ? 3 : 1;
    for (let i = 0; i < weight; i++) bag.push(r);
  }
  return bag[Math.floor(rng() * bag.length)];
}

// ─────────────────────────────────────────────
// DAILY SEED FILTER
// ─────────────────────────────────────────────

/** Filter relics to those allowed on official daily seed attempts. */
export function filterRelicsForDailySeed(relicIds: string[]): string[] {
  return relicIds.filter(id => {
    const relic = RELIC_REGISTRY[id];
    return relic && !relic.affectsScore;
  });
}

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────

/** Get relic effect summary as a single string for display. */
export function getRelicEffectSummary(relic: Relic): string {
  const e = relic.effect;
  const parts: string[] = [];
  if (e.attackBonus)         parts.push(`+${e.attackBonus} ATK`);
  if (e.attackDieValueBonus) parts.push(`Atk dice +${e.attackDieValueBonus}`);
  if (e.healBonus)           parts.push(`+${e.healBonus} Heal`);
  if (e.maxHpBonus)          parts.push(`+${e.maxHpBonus} MaxHP`);
  if (e.combatStartShield)   parts.push(`+${e.combatStartShield} Start Shield`);
  if (e.cooldownTick)        parts.push(`+${e.cooldownTick} CD Tick`);
  if (e.topRowBonus)         parts.push(`Top row ×${3 + e.topRowBonus}`);
  if (e.startCoins)          parts.push(`+${e.startCoins} coins`);
  if (e.dicePerTurn)         parts.push(`+${e.dicePerTurn} die/turn`);
  if (e.shieldMultiplier)    parts.push(`Shield ×${e.shieldMultiplier}`);
  if (e.enemyStartPoisonStacks) parts.push(`Enemy starts with ${e.enemyStartPoisonStacks} poison`);
  if (e.forcedPierceOnSix)   parts.push(`Face 6 = Pierce`);
  if (e.preventDuplicateDiceOnFirstRoll) parts.push(`No duplicate on first roll`);
  if (e.revealAllIntents)    parts.push(`Reveal ${e.revealAllIntents} intents`);
  if (e.weaponPassiveMultiplier) parts.push(`Weapon passives ×${e.weaponPassiveMultiplier}`);
  if (e.enemyZoneStartHpMult) parts.push(`First enemy −${Math.round((1 - e.enemyZoneStartHpMult) * 100)}% HP`);
  if (e.healMidRowBonus)     parts.push(`Mid heal +${e.healMidRowBonus}`);
  return parts.join(' · ') || 'Special effect';
}
