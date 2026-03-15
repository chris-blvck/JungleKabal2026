// ============================================================
// DIE IN THE JUNGLE — WEAPON SYSTEM
// Version 1.0 — Conforme GAME_LOGIC_MASTER.md v2.0 §6
// ============================================================

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type Archetype = 'blade' | 'staff' | 'shield' | 'totem' | 'cannon' | 'fang';
export type SpecialType = 'double_strike' | 'mend' | 'fortress' | 'reset' | 'overload' | 'inject';

export interface WeaponSpecial {
  name: string;
  desc: string;
  type: SpecialType;
  value: number;
  turns?: number;
}

export interface Weapon {
  id: string;
  name: string;
  archetype: Archetype;
  rarity: Rarity;
  passive: Record<string, number>;
  bonusStats: Record<string, number>;
  special: WeaponSpecial;
  cooldown: number;
  cooldownRemaining: number;
  legendaryPassive: string | null;
  legendaryPassiveDesc: string | null;
  shopCost: number;
  gemUnlockCost: number;
  flavor: string;
}

// ─────────────────────────────────────────────
// RARITY MODIFIERS (§6 tableau)
// ─────────────────────────────────────────────

export const RARITY_MODS: Record<Rarity, {
  statMult: number;
  specialBonus: number;
  cdReduction: number;
  shopCost: number;
  gemUnlock: number;
}> = {
  common: {
    statMult: 1.0,
    specialBonus: 0,
    cdReduction: 0,
    shopCost: 55,
    gemUnlock: 50,
  },
  rare: {
    statMult: 1.3,
    specialBonus: 2,
    cdReduction: 0,
    shopCost: 100,
    gemUnlock: 150,
  },
  epic: {
    statMult: 1.6,
    specialBonus: 5,
    cdReduction: 1,
    shopCost: 180,
    gemUnlock: 400,
  },
  legendary: {
    statMult: 2.0,
    specialBonus: 8,
    cdReduction: 2,
    shopCost: 320,
    gemUnlock: 1000,
  },
};

export const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    '#9ca3af',
  rare:      '#60a5fa',
  epic:      '#a78bfa',
  legendary: '#fbbf24',
};

// ─────────────────────────────────────────────
// LEGENDARY PASSIVES (§6)
// ─────────────────────────────────────────────

export const LEGENDARY_PASSIVES: Record<Archetype, { id: string; desc: string }> = {
  blade:  { id: 'blade_legendary',  desc: 'Chaque kill reset le cooldown de la spéciale.' },
  staff:  { id: 'staff_legendary',  desc: 'Les dés de soin donnent +1 heal supplémentaire permanent.' },
  shield: { id: 'shield_legendary', desc: 'Le bouclier ne décroît pas entre les combats.' },
  totem:  { id: 'totem_legendary',  desc: 'Cooldown tick +1 permanent.' },
  cannon: { id: 'cannon_legendary', desc: 'Top row bonus +1 permanent même sans spéciale active.' },
  fang:   { id: 'fang_legendary',   desc: 'DoT carries over to next combat with 1 turn remaining.' },
};

// ─────────────────────────────────────────────
// ARCHETYPES — définitions de base
// ─────────────────────────────────────────────

interface ArchetypeDef {
  name: string;
  specialType: SpecialType;
  cooldownBase: number;
  statPool: string[];
  special: (value: number) => WeaponSpecial;
}

const ARCHETYPES: Record<Archetype, ArchetypeDef> = {
  blade: {
    name: 'Blade',
    specialType: 'double_strike',
    cooldownBase: 4,
    statPool: ['attackBonus', 'attackDieValueBonus'],
    special: (value) => ({
      name: 'Double Strike',
      desc: `Frappe 2× ce tour (×${value} dégâts totaux).`,
      type: 'double_strike',
      value,
    }),
  },
  staff: {
    name: 'Staff',
    specialType: 'mend',
    cooldownBase: 3,
    statPool: ['healBonus', 'maxHp'],
    special: (value) => ({
      name: 'Mend',
      desc: `Soin instantané de ${value} HP.`,
      type: 'mend',
      value,
    }),
  },
  shield: {
    name: 'Shield',
    specialType: 'fortress',
    cooldownBase: 3,
    statPool: ['combatStartShield', 'maxHp'],
    special: (value) => ({
      name: 'Fortress',
      desc: `Gagne ${value} bouclier instantanément.`,
      type: 'fortress',
      value,
    }),
  },
  totem: {
    name: 'Totem',
    specialType: 'reset',
    cooldownBase: 4,
    statPool: ['cooldownTick', 'cooldownBase'],
    special: () => ({
      name: 'Reset',
      desc: 'Reset tous les cooldowns de slots immédiatement.',
      type: 'reset',
      value: 0,
    }),
  },
  cannon: {
    name: 'Cannon',
    specialType: 'overload',
    cooldownBase: 6,
    statPool: ['attackBonus', 'topRowBonus'],
    special: (value) => ({
      name: 'Overload',
      desc: `La top row est ×${value} ce tour.`,
      type: 'overload',
      value,
    }),
  },
  fang: {
    name: 'Fang',
    specialType: 'inject',
    cooldownBase: 5,
    statPool: ['attackBonus', 'attackDieValueBonus'],
    special: (value) => ({
      name: 'Inject',
      desc: `L'ennemi perd ${value} HP/tour pendant 3 tours.`,
      type: 'inject',
      value,
      turns: 3,
    }),
  },
};

// ─────────────────────────────────────────────
// VARIANTS — 3 par archetype
// ─────────────────────────────────────────────

interface VariantDef {
  archetype: Archetype;
  name: string;
  flavor: string;
  basePassive: Record<string, number>;
  baseSpecialValue: number;
  cdOverride: number | null;
}

const VARIANTS: Record<string, VariantDef> = {
  // ── BLADE
  'jungle-blade': {
    archetype: 'blade',
    name: 'Jungle Blade',
    flavor: "Taillée dans l'os d'un prédateur. Elle sait déjà où frapper.",
    basePassive: { attackBonus: 2 },
    baseSpecialValue: 2,
    cdOverride: null,
  },
  'shadow-blade': {
    archetype: 'blade',
    name: 'Shadow Blade',
    flavor: "Invisible jusqu'à l'impact. La jungle apprend ainsi.",
    basePassive: { attackBonus: 1, attackDieValueBonus: 1 },
    baseSpecialValue: 2,
    cdOverride: null,
  },
  'ka-blade': {
    archetype: 'blade',
    name: 'Ka Blade',
    flavor: 'Forgée dans le Ka pur. Trois attaques en un souffle.',
    basePassive: { attackBonus: 3 },
    baseSpecialValue: 2,
    cdOverride: 5,
  },
  // ── STAFF
  'amber-staff': {
    archetype: 'staff',
    name: 'Amber Staff',
    flavor: "L'ambre conserve. Même la vie.",
    basePassive: { healBonus: 2 },
    baseSpecialValue: 8,
    cdOverride: null,
  },
  'root-staff': {
    archetype: 'staff',
    name: 'Root Staff',
    flavor: 'Taillée dans une racine Ka. Elle nourrit autant qu\'elle soigne.',
    basePassive: { healBonus: 1, maxHp: 3 },
    baseSpecialValue: 6,
    cdOverride: null,
  },
  'jungle-staff': {
    archetype: 'staff',
    name: 'Jungle Staff',
    flavor: 'La jungle entière canalise sa vie à travers ce bâton.',
    basePassive: { healBonus: 3 },
    baseSpecialValue: 10,
    cdOverride: 4,
  },
  // ── SHIELD
  'stone-shield': {
    archetype: 'shield',
    name: 'Stone Shield',
    flavor: 'Lourd comme une promesse. Solide comme une tombe.',
    basePassive: { maxHp: 3 },
    baseSpecialValue: 12,
    cdOverride: null,
  },
  'iron-shield': {
    archetype: 'shield',
    name: 'Iron Shield',
    flavor: 'Chaque coup reçu lui apprend quelque chose.',
    basePassive: { combatStartShield: 2 },
    baseSpecialValue: 10,
    cdOverride: null,
  },
  'ka-shield': {
    archetype: 'shield',
    name: 'Ka Shield',
    flavor: 'Le Ka se solidifie devant toi. Les ennemis apprennent la peur.',
    basePassive: { maxHp: 4 },
    baseSpecialValue: 15,
    cdOverride: 4,
  },
  // ── TOTEM
  'ka-totem': {
    archetype: 'totem',
    name: 'Ka Totem',
    flavor: 'Le Ka accélère. Les dés répondent plus vite.',
    basePassive: { cooldownTick: 1 },
    baseSpecialValue: 0,
    cdOverride: null,
  },
  'drum-totem': {
    archetype: 'totem',
    name: 'Drum Totem',
    flavor: 'Un rythme primaire. Les slots s\'y plient.',
    basePassive: { cooldownBase: -1 },
    baseSpecialValue: 0,
    cdOverride: null,
  },
  'amber-totem': {
    archetype: 'totem',
    name: 'Amber Totem',
    flavor: "L'ambre fixe le temps. Et le Ka frappe plus fort.",
    basePassive: { cooldownTick: 1, attackBonus: 2 },
    baseSpecialValue: 0,
    cdOverride: 5,
  },
  // ── CANNON
  'chrome-cannon': {
    archetype: 'cannon',
    name: 'Chrome Cannon',
    flavor: 'La puissance brute. Pas de subtilité. Juste la destruction.',
    basePassive: { attackBonus: 3 },
    baseSpecialValue: 5,
    cdOverride: null,
  },
  'jungle-cannon': {
    archetype: 'cannon',
    name: 'Jungle Cannon',
    flavor: 'La jungle concentrée dans un seul tir.',
    basePassive: { attackBonus: 2, topRowBonus: 1 },
    baseSpecialValue: 5,
    cdOverride: null,
  },
  'ka-cannon': {
    archetype: 'cannon',
    name: 'Ka Cannon',
    flavor: "Quand le Ka explose, tout le reste s'efface.",
    basePassive: { attackBonus: 4 },
    baseSpecialValue: 5,
    cdOverride: 7,
  },
  // ── FANG
  'venom-fang': {
    archetype: 'fang',
    name: 'Venom Fang',
    flavor: 'Lente. Certaine. La mort qui s\'installe.',
    basePassive: { attackBonus: 1 },
    baseSpecialValue: 3,
    cdOverride: null,
  },
  'shadow-fang': {
    archetype: 'fang',
    name: 'Shadow Fang',
    flavor: "Invisible jusqu'à ce que le poison parle.",
    basePassive: { attackDieValueBonus: 2 },
    baseSpecialValue: 2,
    cdOverride: null,
  },
  'ka-fang': {
    archetype: 'fang',
    name: 'Ka Fang',
    flavor: 'Le Ka corrompt. Pas de remède dans la jungle.',
    basePassive: { attackBonus: 2 },
    baseSpecialValue: 4,
    cdOverride: 6,
  },
};

// ─────────────────────────────────────────────
// buildWeapon() — fabrique finale
// ─────────────────────────────────────────────

export function buildWeapon(variantId: string, rarity: Rarity): Weapon {
  const variant = VARIANTS[variantId];
  if (!variant) throw new Error(`Unknown weapon variant: ${variantId}`);

  const archDef = ARCHETYPES[variant.archetype];
  const rarityDef = RARITY_MODS[rarity];

  // Passives avec multiplicateur de rareté
  const passive: Record<string, number> = {};
  for (const [stat, val] of Object.entries(variant.basePassive)) {
    passive[stat] = Math.round(val * rarityDef.statMult);
  }

  // Bonus stats de rareté
  const bonusStats: Record<string, number> = {};
  if (rarity === 'epic' || rarity === 'legendary') {
    bonusStats.rerollPerTurn = 1;
  }

  const specialValue = variant.baseSpecialValue + rarityDef.specialBonus;
  const cdBase = variant.cdOverride ?? archDef.cooldownBase;
  const cooldown = Math.max(1, cdBase - rarityDef.cdReduction);
  const special = archDef.special(specialValue);

  const legendaryPassiveEntry = rarity === 'legendary' ? LEGENDARY_PASSIVES[variant.archetype] : null;

  return {
    id: `${variantId}-${rarity}`,
    name: variant.name,
    archetype: variant.archetype,
    rarity,
    passive,
    bonusStats,
    special,
    cooldown,
    cooldownRemaining: 0,
    legendaryPassive: legendaryPassiveEntry?.id ?? null,
    legendaryPassiveDesc: legendaryPassiveEntry?.desc ?? null,
    shopCost: rarityDef.shopCost,
    gemUnlockCost: rarityDef.gemUnlock,
    flavor: variant.flavor,
  };
}

export function buildAllWeapons(): Weapon[] {
  const all: Weapon[] = [];
  for (const variantId of Object.keys(VARIANTS)) {
    for (const rarity of RARITIES) {
      all.push(buildWeapon(variantId, rarity));
    }
  }
  return all;
}

export function getWeaponsByRarity(rarity: Rarity): Weapon[] {
  return Object.keys(VARIANTS).map(id => buildWeapon(id, rarity));
}

// ─────────────────────────────────────────────
// APPLY PASSIVES (au joueur)
// ─────────────────────────────────────────────

export function applyWeaponPassives(basePlayer: Record<string, any>, weapons: (Weapon | null)[]): Record<string, any> {
  let p = { ...basePlayer };

  for (const weapon of weapons) {
    if (!weapon) continue;

    for (const [stat, val] of Object.entries(weapon.passive)) {
      if (stat === 'cooldownBase') {
        p.cooldownBase = Math.max(1, (p.cooldownBase || 3) + val);
      } else if (stat === 'maxHp') {
        p.maxHp = (p.maxHp || 24) + val;
        p.hp = Math.min(p.maxHp, (p.hp || 24) + val);
      } else {
        p[stat] = (p[stat] || 0) + val;
      }
    }

    if (weapon.bonusStats?.rerollPerTurn) {
      p.rerollsPerTurn = (p.rerollsPerTurn || 1) + weapon.bonusStats.rerollPerTurn;
    }

    applyLegendaryPassive(p, weapon);
  }

  return p;
}

function applyLegendaryPassive(player: Record<string, any>, weapon: Weapon): void {
  if (!weapon.legendaryPassive) return;
  switch (weapon.legendaryPassive) {
    case 'totem_legendary':
      player.cooldownTick = (player.cooldownTick || 1) + 1;
      break;
    case 'cannon_legendary':
      player.topRowBonus = (player.topRowBonus || 0) + 1;
      break;
  }
}

// ─────────────────────────────────────────────
// ACTIVATE SPECIAL
// ─────────────────────────────────────────────

export interface CombatState {
  player: Record<string, any>;
  enemy: Record<string, any>;
  grid?: any[][];
  turn?: number;
  weapons?: (Weapon | null)[];
  doubleStrikeActive?: boolean;
  overloadActive?: boolean;
  overloadValue?: number;
}

export function activateWeaponSpecial(
  weapon: Weapon,
  combatState: CombatState,
): { newCombatState: CombatState; log: string; sideEffects: { type: string }[] } {
  if (weapon.cooldownRemaining > 0) {
    return { newCombatState: combatState, log: 'Spéciale en cooldown !', sideEffects: [] };
  }

  const { player, enemy } = combatState;
  let newState: CombatState = { ...combatState };
  let log = '';
  const sideEffects: { type: string }[] = [];

  switch (weapon.special.type) {
    case 'double_strike': {
      newState.doubleStrikeActive = true;
      log = `${weapon.name} — Double Strike activé ! Les dégâts sont doublés ce tour.`;
      break;
    }
    case 'mend': {
      const healAmt = weapon.special.value;
      newState.player = { ...player, hp: Math.min(player.maxHp, player.hp + healAmt) };
      log = `${weapon.name} — Mend : +${healAmt} HP.`;
      break;
    }
    case 'fortress': {
      const shieldAmt = weapon.special.value;
      newState.player = { ...player, shield: (player.shield || 0) + shieldAmt };
      log = `${weapon.name} — Fortress : +${shieldAmt} bouclier.`;
      break;
    }
    case 'reset': {
      sideEffects.push({ type: 'reset_slot_cooldowns' });
      log = `${weapon.name} — Reset ! Tous les slots de dés sont libérés.`;
      break;
    }
    case 'overload': {
      newState.overloadActive = true;
      newState.overloadValue = weapon.special.value;
      log = `${weapon.name} — Overload ! La ligne du haut est ×${weapon.special.value} ce tour.`;
      break;
    }
    case 'inject': {
      const dotPerTurn = weapon.special.value;
      const dotTurns = weapon.special.turns || 3;
      newState.enemy = { ...enemy, dotStacks: dotPerTurn, dotTurnsLeft: dotTurns };
      log = `${weapon.name} — Inject ! ${dotPerTurn} dégâts/tour pendant ${dotTurns} tours.`;
      break;
    }
  }

  // Set cooldown
  newState.weapons = (combatState.weapons || []).map(w =>
    w?.id === weapon.id ? { ...w, cooldownRemaining: w.cooldown } : w,
  );

  return { newCombatState: newState, log, sideEffects };
}

// ─────────────────────────────────────────────
// TICK COOLDOWNS (fin de tour)
// ─────────────────────────────────────────────

export function tickWeaponCooldowns(weapons: (Weapon | null)[], player: Record<string, any>): (Weapon | null)[] {
  const tick = player.cooldownTick || 1;
  return weapons.map(w => {
    if (!w) return null;
    return { ...w, cooldownRemaining: Math.max(0, (w.cooldownRemaining || 0) - tick) };
  });
}

export function tickEnemyDot(enemy: Record<string, any>): { damage: number; newEnemy: Record<string, any> } {
  if (!enemy.dotStacks || !enemy.dotTurnsLeft || enemy.dotTurnsLeft <= 0) {
    return { damage: 0, newEnemy: enemy };
  }
  const damage = enemy.dotStacks;
  const newEnemy = {
    ...enemy,
    hp: Math.max(0, enemy.hp - damage),
    dotTurnsLeft: enemy.dotTurnsLeft - 1,
  };
  if (newEnemy.dotTurnsLeft === 0) newEnemy.dotStacks = 0;
  return { damage, newEnemy };
}

// ─────────────────────────────────────────────
// LEGENDARY RUNTIME TRIGGERS
// ─────────────────────────────────────────────

export function onKillLegendaryTrigger(weapons: (Weapon | null)[]): (Weapon | null)[] {
  return weapons.map(w => {
    if (!w) return null;
    if (w.legendaryPassive === 'blade_legendary') return { ...w, cooldownRemaining: 0 };
    return w;
  });
}

export function onCombatEndFangLegendary(
  weapons: (Weapon | null)[],
  currentEnemy: Record<string, any>,
): { dotStacks: number; dotTurnsLeft: number } | null {
  const hasFangLegendary = weapons.some(w => w?.legendaryPassive === 'fang_legendary');
  if (!hasFangLegendary) return null;
  if (!currentEnemy?.dotStacks || !currentEnemy.dotTurnsLeft || currentEnemy.dotTurnsLeft <= 0) return null;
  return { dotStacks: currentEnemy.dotStacks, dotTurnsLeft: 1 };
}

export function getStaffLegendaryHealBonus(weapons: (Weapon | null)[]): number {
  return weapons.some(w => w?.legendaryPassive === 'staff_legendary') ? 1 : 0;
}

export function shouldPersistShield(weapons: (Weapon | null)[]): boolean {
  return weapons.some(w => w?.legendaryPassive === 'shield_legendary');
}

// ─────────────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────────────

function _statLabel(stat: string): string {
  const labels: Record<string, string> = {
    attackBonus: 'ATK bonus',
    attackDieValueBonus: 'ATK die +val',
    healBonus: 'Heal bonus',
    maxHp: 'HP max',
    combatStartShield: 'Shield départ',
    cooldownTick: 'CD tick',
    cooldownBase: 'CD base',
    topRowBonus: 'Top row bonus',
    shieldMultiplier: 'Mult bouclier',
  };
  return labels[stat] || stat;
}

export function getWeaponDisplayInfo(weapon: Weapon | null) {
  if (!weapon) return null;
  return {
    id: weapon.id,
    name: weapon.name,
    rarity: weapon.rarity,
    color: RARITY_COLORS[weapon.rarity],
    archetype: weapon.archetype,
    passiveLines: Object.entries(weapon.passive).map(
      ([k, v]) => `${_statLabel(k)}: ${v > 0 ? '+' : ''}${v}`,
    ),
    specialName: weapon.special.name,
    specialDesc: weapon.special.desc,
    cooldown: weapon.cooldown,
    cdRemaining: weapon.cooldownRemaining,
    isReady: weapon.cooldownRemaining === 0,
    legendaryPassiveDesc: weapon.legendaryPassiveDesc,
    flavor: weapon.flavor,
    shopCost: weapon.shopCost,
  };
}

// ─────────────────────────────────────────────
// EXPORTS — LISTES
// ─────────────────────────────────────────────

export const ALL_VARIANT_IDS = Object.keys(VARIANTS);

export const STARTER_WEAPONS: Weapon[] = [
  buildWeapon('jungle-blade', 'common'),
  buildWeapon('amber-staff',  'common'),
  buildWeapon('stone-shield', 'common'),
  buildWeapon('ka-totem',     'common'),
  buildWeapon('chrome-cannon','common'),
  buildWeapon('venom-fang',   'common'),
];
