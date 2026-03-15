// companions.ts — Companion definitions: passif + actif à cooldown

export type CompanionId = 'gecko' | 'croak' | 'oeil' | 'shaman' | 'sprout' | 'hoarder' | 'imp';

export interface CompanionActiveType {
  type: 'skip_intent' | 'flat_damage' | 'free_reroll_choice' | 'instant_heal' | 'instant_shield' | 'restore_reroll';
  value?: number;
}

export interface Companion {
  id: CompanionId;
  name: string;
  emoji: string;
  image?: string;
  archetype: string;
  flavor: string;
  unlockId: string;
  passive: {
    desc: string;
    attackDieBonus?: number;     // +N to every attack die value at roll time
    attackBonus?: number;        // flat attack bonus applied on companion pick
    healBonus?: number;          // flat heal bonus applied on companion pick
    shieldBonus?: number;        // +N combat start shield applied on companion pick
    rerollBonus?: number;        // +N rerolls per turn applied on companion pick
    revealExtraIntents?: boolean; // show 2 intents ahead
  };
  active: {
    name: string;
    desc: string;
    type: CompanionActiveType['type'];
    value?: number;
    cooldown: number;
    abilityEmoji: string;
  };
  cooldownRemaining: number;
}

export const COMPANIONS: Companion[] = [
  {
    id: 'gecko',
    name: 'Gecko Mystique',
    emoji: '🦎',
    image: 'https://i.postimg.cc/mkGFXx1g/chartreuse-swamp-sprite.png',
    archetype: 'Amplifier',
    flavor: '"It watches from the vines and amplifies your strikes."',
    unlockId: 'companion_gecko',
    passive: {
      desc: '+1 to all attack die values each roll.',
      attackDieBonus: 1,
    },
    active: {
      name: 'Hypnose',
      desc: 'Enemy skips their intent this turn.',
      type: 'skip_intent',
      cooldown: 4,
      abilityEmoji: '😴',
    },
    cooldownRemaining: 0,
  },
  {
    id: 'croak',
    name: 'Croak Jr.',
    emoji: '🐊',
    image: 'https://i.postimg.cc/MTYWSgrx/jade-toxic-hydra.png',
    archetype: 'Bruiser',
    flavor: '"Young, reckless, and absolutely lethal."',
    unlockId: 'companion_croak',
    passive: {
      desc: '+2 flat attack bonus.',
      attackBonus: 2,
    },
    active: {
      name: 'Leap',
      desc: 'Deal 8 flat damage to enemy, ignoring their shield.',
      type: 'flat_damage',
      value: 8,
      cooldown: 5,
      abilityEmoji: '💥',
    },
    cooldownRemaining: 0,
  },
  {
    id: 'oeil',
    name: "L'Œil",
    emoji: '👁️',
    image: 'https://i.postimg.cc/kXvWH5yw/olive-toxic-gazer.png',
    archetype: 'Oracle',
    flavor: '"It sees the jungle\'s intentions before they happen."',
    unlockId: 'companion_oeil',
    passive: {
      desc: 'Reveals enemy intent 2 turns ahead instead of 1.',
      revealExtraIntents: true,
    },
    active: {
      name: 'Vision',
      desc: 'Free reroll — see 2 possible dice sets and choose the best.',
      type: 'free_reroll_choice',
      cooldown: 6,
      abilityEmoji: '🔮',
    },
    cooldownRemaining: 0,
  },
  {
    id: 'shaman',
    name: 'Coral Shaman',
    emoji: '🌿',
    image: 'https://i.postimg.cc/rp344R8S/coral-jungle-shaman.png',
    archetype: 'Healer',
    flavor: '"Ancient roots, ancient cures."',
    unlockId: 'companion_shaman',
    passive: {
      desc: 'Heal dice restore +2 extra HP.',
      healBonus: 2,
    },
    active: {
      name: 'Totem',
      desc: 'Instantly heal 8 HP.',
      type: 'instant_heal',
      value: 8,
      cooldown: 4,
      abilityEmoji: '🌿',
    },
    cooldownRemaining: 0,
  },
  {
    id: 'sprout',
    name: 'Grove Sproutling',
    emoji: '🌱',
    image: 'https://i.postimg.cc/5Ns6vQgw/amber-grove-sproutling.png',
    archetype: 'Guardian',
    flavor: '"Small but unyielding. The jungle protects its own."',
    unlockId: 'companion_sprout',
    passive: {
      desc: '+3 shield at the start of each combat.',
      shieldBonus: 3,
    },
    active: {
      name: 'Barrier',
      desc: 'Gain 6 shield instantly.',
      type: 'instant_shield',
      value: 6,
      cooldown: 3,
      abilityEmoji: '🛡️',
    },
    cooldownRemaining: 0,
  },
  {
    id: 'hoarder',
    name: 'Spirit Hoarder',
    emoji: '💀',
    image: 'https://i.postimg.cc/nrswkD7p/jade-spirit-hoarder.png',
    archetype: 'Scavenger',
    flavor: '"It collects what the dead no longer need."',
    unlockId: 'companion_hoarder',
    passive: {
      desc: '+1 reroll per turn.',
      rerollBonus: 1,
    },
    active: {
      name: 'Soul Hoard',
      desc: 'Restore 1 reroll and heal 4 HP.',
      type: 'restore_reroll',
      value: 4,
      cooldown: 4,
      abilityEmoji: '👻',
    },
    cooldownRemaining: 0,
  },
  {
    id: 'imp',
    name: 'Toxic Imp',
    emoji: '😈',
    image: 'https://i.postimg.cc/gjftB2qh/jade-toxic-imp.png',
    archetype: 'Saboteur',
    flavor: '"Chaos is its native language."',
    unlockId: 'companion_imp',
    passive: {
      desc: 'Attack dice deal +1 damage (stacks with Gecko).',
      attackDieBonus: 1,
    },
    active: {
      name: 'Venom',
      desc: 'Deal 5 flat damage, ignore shield.',
      type: 'flat_damage',
      value: 5,
      cooldown: 3,
      abilityEmoji: '☠️',
    },
    cooldownRemaining: 0,
  },
];

export function getCompanion(id: CompanionId): Companion {
  const c = COMPANIONS.find(c => c.id === id);
  if (!c) throw new Error(`Unknown companion: ${id}`);
  return { ...c };
}

export function tickCompanionCooldown(companion: Companion): Companion {
  return {
    ...companion,
    cooldownRemaining: Math.max(0, companion.cooldownRemaining - 1),
  };
}

export function startCompanionCooldown(companion: Companion): Companion {
  return {
    ...companion,
    cooldownRemaining: companion.active.cooldown,
  };
}
