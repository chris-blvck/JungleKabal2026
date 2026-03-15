// companions.ts — Companion definitions: passif + actif à cooldown

export type CompanionId = 'gecko' | 'croak' | 'oeil';

export interface CompanionActiveType {
  type: 'skip_intent' | 'flat_damage' | 'free_reroll_choice';
  value?: number;
}

export interface Companion {
  id: CompanionId;
  name: string;
  emoji: string;
  archetype: string;
  flavor: string;
  unlockId: string;
  passive: {
    desc: string;
    attackDieBonus?: number;   // +N to every attack die value
    attackBonus?: number;      // flat attack bonus
    revealExtraIntents?: boolean; // show 2 intents ahead
  };
  active: {
    name: string;
    desc: string;
    type: CompanionActiveType['type'];
    value?: number;
    cooldown: number;
  };
  cooldownRemaining: number;
}

export const COMPANIONS: Companion[] = [
  {
    id: 'gecko',
    name: 'Gecko Mystique',
    emoji: '🦎',
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
    },
    cooldownRemaining: 0,
  },
  {
    id: 'croak',
    name: 'Croak Jr.',
    emoji: '🐊',
    archetype: 'Bruiser',
    flavor: '"Young, reckless, and absolutely lethal."',
    unlockId: 'companion_croak',
    passive: {
      desc: '+2 attack bonus permanently.',
      attackBonus: 2,
    },
    active: {
      name: 'Leap',
      desc: 'Deal 8 flat damage to enemy, ignoring their shield.',
      type: 'flat_damage',
      value: 8,
      cooldown: 5,
    },
    cooldownRemaining: 0,
  },
  {
    id: 'oeil',
    name: "L'Œil",
    emoji: '👁️',
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
