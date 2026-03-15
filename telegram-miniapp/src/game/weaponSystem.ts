// weaponSystem.ts — 6 archetypes × 3 variants × 4 rarities = 72 weapons

export type WeaponArchetype = 'blade' | 'staff' | 'shield' | 'totem' | 'cannon' | 'fang';
export type WeaponRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type WeaponSpecialType =
  | 'double_strike'  // blade: deal damage twice this turn
  | 'mend'           // staff: heal based on damage dealt
  | 'fortress'       // shield: triple shield this turn
  | 'reset'          // totem: reset all cooldowns
  | 'overload'       // cannon: +3 to all attack dice this turn
  | 'inject';        // fang: apply 3 turns of DoT to enemy

export type WeaponPassiveType =
  | 'attack_bonus'
  | 'heal_bonus'
  | 'shield_mult'
  | 'reroll_bonus'
  | 'cooldown_reduction'
  | 'max_hp_bonus'
  | 'dot_on_hit'
  | 'top_row_bonus';

export interface WeaponPassive {
  type: WeaponPassiveType;
  value: number;
  description: string;
}

export interface WeaponSpecial {
  type: WeaponSpecialType;
  cooldown: number;         // turns between uses
  currentCooldown: number;  // 0 = ready
  description: string;
}

export interface Weapon {
  id: string;
  variantId: string;
  name: string;
  archetype: WeaponArchetype;
  rarity: WeaponRarity;
  passive: WeaponPassive;
  special: WeaponSpecial;
  legendaryPassive?: string; // flavor text for legendary unique passive
}

// ── Rarity multipliers ────────────────────────────────────────────────────────

const RARITY_MULT: Record<WeaponRarity, number> = {
  common: 1.0,
  rare: 1.3,
  epic: 1.6,
  legendary: 2.0,
};

function scale(base: number, rarity: WeaponRarity): number {
  return Math.round(base * RARITY_MULT[rarity] * 10) / 10;
}

function rarityLabel(rarity: WeaponRarity): string {
  switch (rarity) {
    case 'common': return '';
    case 'rare': return 'Keen ';
    case 'epic': return 'Ancient ';
    case 'legendary': return 'Legendary ';
  }
}

// ── Weapon variants (18 variants × 4 rarities = 72) ─────────────────────────

interface VariantDef {
  id: string;
  baseName: string;
  archetype: WeaponArchetype;
  passive: { type: WeaponPassiveType; base: number; description: (v: number) => string };
  special: { type: WeaponSpecialType; baseCooldown: number; description: (r: WeaponRarity) => string };
  legendaryPassive?: string;
}

const VARIANT_DEFS: VariantDef[] = [
  // ── Blade (attack-focused) ──────────────────────────────────────────────────
  {
    id: 'blade-short',
    baseName: 'Short Blade',
    archetype: 'blade',
    passive: { type: 'attack_bonus', base: 1, description: v => `+${v} attack bonus to all dice.` },
    special: { type: 'double_strike', baseCooldown: 4, description: () => 'This turn, deal damage twice.' },
  },
  {
    id: 'blade-kukri',
    baseName: 'Kukri',
    archetype: 'blade',
    passive: { type: 'attack_bonus', base: 2, description: v => `+${v} attack bonus to all dice.` },
    special: { type: 'double_strike', baseCooldown: 5, description: () => 'This turn, deal damage twice.' },
  },
  {
    id: 'blade-longsword',
    baseName: 'Longsword',
    archetype: 'blade',
    passive: { type: 'top_row_bonus', base: 1, description: v => `Top row multiplier +${v}.` },
    special: { type: 'double_strike', baseCooldown: 4, description: () => 'This turn, deal damage twice.' },
    legendaryPassive: 'On kill: immediately reset double_strike cooldown.',
  },

  // ── Staff (heal-focused) ────────────────────────────────────────────────────
  {
    id: 'staff-bone',
    baseName: 'Bone Staff',
    archetype: 'staff',
    passive: { type: 'heal_bonus', base: 1, description: v => `+${v} to all heal dice.` },
    special: { type: 'mend', baseCooldown: 4, description: () => 'Convert this turn\'s total damage into bonus healing.' },
  },
  {
    id: 'staff-jungle',
    baseName: 'Jungle Staff',
    archetype: 'staff',
    passive: { type: 'heal_bonus', base: 2, description: v => `+${v} to all heal dice.` },
    special: { type: 'mend', baseCooldown: 5, description: () => 'Convert this turn\'s total damage into bonus healing.' },
  },
  {
    id: 'staff-spirit',
    baseName: 'Spirit Staff',
    archetype: 'staff',
    passive: { type: 'max_hp_bonus', base: 4, description: v => `+${v} max HP.` },
    special: { type: 'mend', baseCooldown: 3, description: () => 'Convert this turn\'s total damage into bonus healing.' },
    legendaryPassive: 'Mend also clears all enemy charge.',
  },

  // ── Shield (defense-focused) ────────────────────────────────────────────────
  {
    id: 'shield-bark',
    baseName: 'Bark Shield',
    archetype: 'shield',
    passive: { type: 'shield_mult', base: 0.3, description: v => `Shield dice ×${(1 + v).toFixed(1)}.` },
    special: { type: 'fortress', baseCooldown: 4, description: () => 'Shield dice ×3 this turn.' },
  },
  {
    id: 'shield-iron',
    baseName: 'Iron Buckler',
    archetype: 'shield',
    passive: { type: 'max_hp_bonus', base: 5, description: v => `+${v} max HP.` },
    special: { type: 'fortress', baseCooldown: 4, description: () => 'Shield dice ×3 this turn.' },
  },
  {
    id: 'shield-ka',
    baseName: 'Ka Ward',
    archetype: 'shield',
    passive: { type: 'shield_mult', base: 0.5, description: v => `Shield dice ×${(1 + v).toFixed(1)}.` },
    special: { type: 'fortress', baseCooldown: 3, description: () => 'Shield dice ×3 this turn.' },
    legendaryPassive: 'Fortress also heals HP equal to shield gained.',
  },

  // ── Totem (tempo/utility) ───────────────────────────────────────────────────
  {
    id: 'totem-wooden',
    baseName: 'Wooden Totem',
    archetype: 'totem',
    passive: { type: 'cooldown_reduction', base: 1, description: () => 'Cooldown tick +1.' },
    special: { type: 'reset', baseCooldown: 5, description: () => 'Reset all slot cooldowns immediately.' },
  },
  {
    id: 'totem-bone',
    baseName: 'Bone Totem',
    archetype: 'totem',
    passive: { type: 'reroll_bonus', base: 1, description: v => `+${v} reroll per turn.` },
    special: { type: 'reset', baseCooldown: 4, description: () => 'Reset all slot cooldowns immediately.' },
  },
  {
    id: 'totem-spirit',
    baseName: 'Spirit Totem',
    archetype: 'totem',
    passive: { type: 'cooldown_reduction', base: 1, description: () => 'Cooldown tick +1.' },
    special: { type: 'reset', baseCooldown: 3, description: () => 'Reset all slot cooldowns immediately.' },
    legendaryPassive: 'After reset: +1 reroll this turn.',
  },

  // ── Cannon (burst damage) ───────────────────────────────────────────────────
  {
    id: 'cannon-small',
    baseName: 'Small Cannon',
    archetype: 'cannon',
    passive: { type: 'attack_bonus', base: 1, description: v => `+${v} attack bonus.` },
    special: { type: 'overload', baseCooldown: 4, description: () => 'All attack dice +3 this turn.' },
  },
  {
    id: 'cannon-jungle',
    baseName: 'Jungle Cannon',
    archetype: 'cannon',
    passive: { type: 'top_row_bonus', base: 1, description: v => `Top row multiplier +${v}.` },
    special: { type: 'overload', baseCooldown: 4, description: () => 'All attack dice +3 this turn.' },
  },
  {
    id: 'cannon-ka',
    baseName: 'Ka Cannon',
    archetype: 'cannon',
    passive: { type: 'attack_bonus', base: 2, description: v => `+${v} attack bonus.` },
    special: { type: 'overload', baseCooldown: 3, description: () => 'All attack dice +3 this turn.' },
    legendaryPassive: 'Overload also grants +2 shield this turn.',
  },

  // ── Fang (poison/DoT) ───────────────────────────────────────────────────────
  {
    id: 'fang-snake',
    baseName: 'Snake Fang',
    archetype: 'fang',
    passive: { type: 'dot_on_hit', base: 1, description: v => `Attack hits apply ${v} poison tick.` },
    special: { type: 'inject', baseCooldown: 4, description: () => 'Apply 3 turns of 3-damage poison to enemy.' },
  },
  {
    id: 'fang-razor',
    baseName: 'Razor Fang',
    archetype: 'fang',
    passive: { type: 'dot_on_hit', base: 2, description: v => `Attack hits apply ${v} poison ticks.` },
    special: { type: 'inject', baseCooldown: 4, description: () => 'Apply 3 turns of 3-damage poison to enemy.' },
  },
  {
    id: 'fang-viper',
    baseName: 'Viper Fang',
    archetype: 'fang',
    passive: { type: 'attack_bonus', base: 1, description: v => `+${v} attack bonus and poison on hit.` },
    special: { type: 'inject', baseCooldown: 3, description: () => 'Apply 3 turns of 3-damage poison to enemy.' },
    legendaryPassive: 'Enemy poison damage also stacks: each new inject adds duration.',
  },
];

// ── Build weapon from variant + rarity ───────────────────────────────────────

export function buildWeapon(variantId: string, rarity: WeaponRarity): Weapon {
  const def = VARIANT_DEFS.find(v => v.id === variantId);
  if (!def) throw new Error(`Unknown weapon variant: ${variantId}`);

  const passiveValue = scale(def.passive.base, rarity);
  const cooldown = Math.max(2, def.special.baseCooldown - (rarity === 'legendary' ? 1 : 0));

  const weapon: Weapon = {
    id: `${variantId}-${rarity}`,
    variantId,
    name: `${rarityLabel(rarity)}${def.baseName}`,
    archetype: def.archetype,
    rarity,
    passive: {
      type: def.passive.type,
      value: passiveValue,
      description: def.passive.description(passiveValue),
    },
    special: {
      type: def.special.type,
      cooldown,
      currentCooldown: 0,
      description: def.special.description(rarity),
    },
  };

  if (rarity === 'legendary' && def.legendaryPassive) {
    weapon.legendaryPassive = def.legendaryPassive;
  }

  return weapon;
}

export function buildAllWeapons(): Weapon[] {
  const rarities: WeaponRarity[] = ['common', 'rare', 'epic', 'legendary'];
  return VARIANT_DEFS.flatMap(def =>
    rarities.map(rarity => buildWeapon(def.id, rarity)),
  );
}

// ── Apply weapon passives to player stat object ───────────────────────────────

export function applyWeaponPassives(
  base: {
    attackBonus: number;
    healBonus: number;
    shieldMultiplier: number;
    rerollsPerTurn: number;
    cooldownTick: number;
    maxHp: number;
    topRowBonus: number;
  },
  weapons: Weapon[],
) {
  const result = { ...base };
  for (const w of weapons) {
    const p = w.passive;
    switch (p.type) {
      case 'attack_bonus':
        result.attackBonus += p.value;
        break;
      case 'heal_bonus':
        result.healBonus += p.value;
        break;
      case 'shield_mult':
        result.shieldMultiplier += p.value;
        break;
      case 'reroll_bonus':
        result.rerollsPerTurn += Math.round(p.value);
        break;
      case 'cooldown_reduction':
        result.cooldownTick += Math.round(p.value);
        break;
      case 'max_hp_bonus':
        result.maxHp += Math.round(p.value);
        break;
      case 'top_row_bonus':
        result.topRowBonus += Math.round(p.value);
        break;
    }
  }
  return result;
}

// ── Special activation ────────────────────────────────────────────────────────

export interface CombatState {
  totalAttack: number;
  totalHeal: number;
  totalShield: number;
  enemy: { hp: number; shield: number; charge: number; dotStacks?: number; dotTurns?: number };
  player: { hp: number; maxHp: number; shield: number };
}

export interface SpecialResult {
  modifiedCombat: CombatState;
  log: string;
  newCooldown: number;
}

export function activateWeaponSpecial(weapon: Weapon, combat: CombatState): SpecialResult {
  const c = JSON.parse(JSON.stringify(combat)) as CombatState;
  const cd = weapon.special.cooldown;
  let log = '';

  switch (weapon.special.type) {
    case 'double_strike':
      c.totalAttack *= 2;
      log = `⚔️ ${weapon.name}: Double Strike! Attack ×2 = ${c.totalAttack}`;
      break;

    case 'mend':
      c.totalHeal += c.totalAttack;
      log = `🌿 ${weapon.name}: Mend! +${c.totalAttack} bonus heal from damage.`;
      break;

    case 'fortress':
      c.totalShield *= 3;
      log = `🛡️ ${weapon.name}: Fortress! Shield ×3 = ${c.totalShield}`;
      break;

    case 'reset':
      // Cooldown reset is handled by the caller (sets emptyCooldowns)
      log = `⏳ ${weapon.name}: All slot cooldowns reset!`;
      break;

    case 'overload':
      c.totalAttack += 9; // roughly 3 dice × 3 bonus each
      log = `💥 ${weapon.name}: Overload! +9 bonus attack damage.`;
      break;

    case 'inject':
      c.enemy.dotStacks = (c.enemy.dotStacks ?? 0) + 3;
      c.enemy.dotTurns = 3;
      log = `☠️ ${weapon.name}: Injected! 3 turns of 3-damage poison.`;
      break;
  }

  return { modifiedCombat: c, log, newCooldown: cd };
}

// ── Cooldown ticking ──────────────────────────────────────────────────────────

export function tickWeaponCooldowns(weapons: Weapon[]): Weapon[] {
  return weapons.map(w => ({
    ...w,
    special: {
      ...w.special,
      currentCooldown: Math.max(0, w.special.currentCooldown - 1),
    },
  }));
}

// ── Enemy DoT (fang poison) ───────────────────────────────────────────────────

export function tickEnemyDot(enemy: {
  hp: number;
  dotStacks?: number;
  dotTurns?: number;
}): { enemy: typeof enemy; damage: number } {
  if (!enemy.dotStacks || !enemy.dotTurns || enemy.dotTurns <= 0) {
    return { enemy, damage: 0 };
  }
  const damage = enemy.dotStacks;
  return {
    enemy: {
      ...enemy,
      hp: enemy.hp - damage,
      dotTurns: enemy.dotTurns - 1,
    },
    damage,
  };
}

// ── Legendary kill trigger ────────────────────────────────────────────────────

export function onKillLegendaryTrigger(weapons: Weapon[]): Weapon[] {
  return weapons.map(w => {
    if (w.rarity === 'legendary' && w.archetype === 'blade') {
      // Reset double_strike cooldown on kill
      return { ...w, special: { ...w.special, currentCooldown: 0 } };
    }
    return w;
  });
}

// ── Weapon display helpers ────────────────────────────────────────────────────

export function getWeaponArchetypeEmoji(archetype: WeaponArchetype): string {
  switch (archetype) {
    case 'blade': return '⚔️';
    case 'staff': return '🪄';
    case 'shield': return '🛡️';
    case 'totem': return '🗿';
    case 'cannon': return '💣';
    case 'fang': return '🐍';
  }
}

export function getWeaponRarityColor(rarity: WeaponRarity): string {
  switch (rarity) {
    case 'common': return 'text-zinc-200';
    case 'rare': return 'text-blue-300';
    case 'epic': return 'text-purple-300';
    case 'legendary': return 'text-amber-300';
  }
}

export function getWeaponRarityBorder(rarity: WeaponRarity): string {
  switch (rarity) {
    case 'common': return 'border-zinc-400/30';
    case 'rare': return 'border-blue-400/50';
    case 'epic': return 'border-purple-400/50';
    case 'legendary': return 'border-amber-300/60';
  }
}
