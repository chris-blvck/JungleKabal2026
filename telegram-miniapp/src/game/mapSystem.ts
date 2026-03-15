// mapSystem.ts — Zone map generation, fog of war, events, shop, rest

export type MapNodeType = 'mob' | 'elite' | 'boss' | 'shop' | 'event' | 'rest';

export interface MapNode {
  id: string;
  type: MapNodeType;
  layerIndex: number;
  branchIndex: number;
  nextNodeIds: string[];
  revealed: boolean;
  visited: boolean;
}

export interface MapLayer {
  layerIndex: number;
  nodes: MapNode[];
}

export interface MapEvent {
  id: string;
  title: string;
  description: string;
  choices: { label: string; desc: string }[];
}

export interface EventResult {
  text: string;
  hpDelta?: number;
  coinDelta?: number;
  maxHpDelta?: number;
  attackBonusDelta?: number;
  healBonusDelta?: number;
  rerollDelta?: number;
  combatStartShieldDelta?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: {
    hpDelta?: number;
    maxHpDelta?: number;
    attackBonusDelta?: number;
    healBonusDelta?: number;
    rerollDelta?: number;
    combatStartShieldDelta?: number;
  };
}

export interface RestOption {
  id: string;
  label: string;
  description: string;
  effect: {
    hpPctHeal?: number;
    maxHpDelta?: number;
    attackBonusDelta?: number;
    healBonusDelta?: number;
    coinDelta?: number;
    rerollDelta?: number;
  };
}

// ── Seeded RNG ────────────────────────────────────────────────────────────────

export function createRng(seed: string | number): () => number {
  let s = typeof seed === 'string'
    ? seed.split('').reduce((acc, c) => (Math.imul(acc, 31) + c.charCodeAt(0)) | 0, 0x12345678)
    : (seed | 0);
  s = s || 0xdeadbeef;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0x100000000;
  };
}

function rngPick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Zone configs ──────────────────────────────────────────────────────────────

// Each zone template: array of layers, each layer is array of node types.
// The first element in a zone template = first layer the player fights.
// Last layer always has a single 'boss'.
// Connections: each node in layer N connects to 0-2 nodes in layer N+1.

type ZoneTemplate = MapNodeType[][];

const ZONE_TEMPLATES: Record<number, ZoneTemplate> = {
  1: [
    ['mob'],
    ['event', 'rest'],   // player picks one path from L0 to here
    ['elite'],
    ['shop', 'rest'],
    ['boss'],
  ],
  2: [
    ['mob'],
    ['mob', 'shop'],
    ['elite', 'event'],
    ['mob'],
    ['rest', 'event'],
    ['boss'],
  ],
  3: [
    ['mob'],
    ['mob', 'shop', 'event'],
    ['elite', 'mob', 'rest'],
    ['mob', 'elite'],
    ['shop', 'rest'],
    ['mob'],
    ['boss'],
  ],
  4: [
    ['mob'],
    ['mob', 'elite', 'shop'],
    ['elite', 'mob', 'event'],
    ['mob', 'shop', 'rest'],
    ['elite', 'mob'],
    ['event', 'rest'],
    ['mob'],
    ['boss'],
  ],
};

// For zones beyond 4, scale up using zone 4 template
function getZoneTemplate(zone: number): ZoneTemplate {
  return ZONE_TEMPLATES[Math.min(zone, 4)];
}

// ── Map generation ────────────────────────────────────────────────────────────

export function generateZoneMap(zone: number, seed: string | number): MapLayer[] {
  const rng = createRng(seed + ':' + zone);
  const template = getZoneTemplate(zone);

  // Build nodes
  const layers: MapLayer[] = template.map((nodeTypes, layerIndex) => {
    // Shuffle node types within layer to randomize branches
    const shuffled = [...nodeTypes].sort(() => rng() - 0.5);
    const nodes: MapNode[] = shuffled.map((type, branchIndex) => ({
      id: `z${zone}-l${layerIndex}-b${branchIndex}`,
      type,
      layerIndex,
      branchIndex,
      nextNodeIds: [],
      revealed: layerIndex === 0, // only first layer revealed initially
      visited: false,
    }));
    return { layerIndex, nodes };
  });

  // Build connections between layers
  for (let li = 0; li < layers.length - 1; li++) {
    const currLayer = layers[li];
    const nextLayer = layers[li + 1];

    if (currLayer.nodes.length === 1) {
      // Single node connects to all nodes in next layer
      currLayer.nodes[0].nextNodeIds = nextLayer.nodes.map(n => n.id);
    } else if (nextLayer.nodes.length === 1) {
      // All nodes connect to single next node
      currLayer.nodes.forEach(n => {
        n.nextNodeIds = [nextLayer.nodes[0].id];
      });
    } else {
      // Multi-to-multi: each node connects to 1-2 nodes in next layer
      // Ensure every next-layer node is reachable from at least one current node
      const nextIds = nextLayer.nodes.map(n => n.id);

      // First assign one guaranteed connection per current node
      currLayer.nodes.forEach((node, i) => {
        // Prefer staying on the same branch index
        const preferred = nextLayer.nodes[i % nextLayer.nodes.length];
        node.nextNodeIds = [preferred.id];
      });

      // Ensure each next-layer node has at least one incoming connection
      nextLayer.nodes.forEach(nextNode => {
        const hasIncoming = currLayer.nodes.some(n => n.nextNodeIds.includes(nextNode.id));
        if (!hasIncoming) {
          // Add connection from a random current node
          const giver = currLayer.nodes[Math.floor(rng() * currLayer.nodes.length)];
          if (!giver.nextNodeIds.includes(nextNode.id)) {
            giver.nextNodeIds.push(nextNode.id);
          }
        }
      });

      // Optionally add a cross-branch connection (15% chance per node)
      currLayer.nodes.forEach(node => {
        if (rng() < 0.15 && nextIds.length > 1) {
          const candidate = rngPick(rng, nextIds.filter(id => !node.nextNodeIds.includes(id)));
          if (candidate) node.nextNodeIds.push(candidate);
        }
      });
    }
  }

  return layers;
}

// ── Fog of war ────────────────────────────────────────────────────────────────

export function updateFogOfWar(layers: MapLayer[], visitedNodeId: string): MapLayer[] {
  // Find the visited node and reveal its nextNodeIds
  const visited = layers.flatMap(l => l.nodes).find(n => n.id === visitedNodeId);
  if (!visited) return layers;

  const toReveal = new Set(visited.nextNodeIds);

  return layers.map(layer => ({
    ...layer,
    nodes: layer.nodes.map(node => ({
      ...node,
      revealed: node.revealed || toReveal.has(node.id),
      visited: node.visited || node.id === visitedNodeId,
    })),
  }));
}

export function getAvailableNodes(layers: MapLayer[], currentNodeId: string | null): MapNode[] {
  if (currentNodeId === null) {
    // Start: return first layer nodes
    return layers[0]?.nodes ?? [];
  }
  const current = layers.flatMap(l => l.nodes).find(n => n.id === currentNodeId);
  if (!current) return [];

  return layers
    .flatMap(l => l.nodes)
    .filter(n => current.nextNodeIds.includes(n.id) && !n.visited);
}

export function isBossNode(node: MapNode): boolean {
  return node.type === 'boss';
}

export function getNodeEmoji(type: MapNodeType): string {
  switch (type) {
    case 'mob': return '⚔️';
    case 'elite': return '⭐';
    case 'boss': return '👑';
    case 'shop': return '🛒';
    case 'event': return '❓';
    case 'rest': return '🏕️';
  }
}

export function getNodeLabel(type: MapNodeType): string {
  switch (type) {
    case 'mob': return 'Combat';
    case 'elite': return 'Elite';
    case 'boss': return 'Boss';
    case 'shop': return 'Shop';
    case 'event': return 'Event';
    case 'rest': return 'Rest';
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

export const EVENTS: MapEvent[] = [
  {
    id: 'ancient-shrine',
    title: 'Ancient Shrine',
    description: 'A stone idol glowing with Ka energy stands before you. The jungle holds its breath.',
    choices: [
      { label: 'Pray', desc: 'Gain 5 HP from the Ka blessing.' },
      { label: 'Steal the gem', desc: 'Gain 2 coins but lose 3 HP from the curse.' },
    ],
  },
  {
    id: 'mysterious-merchant',
    title: 'Wandering Merchant',
    description: 'A cloaked figure offers a deal in hushed tones. Their eyes glow amber.',
    choices: [
      { label: 'Trade (cost 2 coins)', desc: 'Spend 2 coins, gain 6 HP and +1 heal bonus.' },
      { label: 'Ignore', desc: 'Nothing happens. You keep your coins.' },
    ],
  },
  {
    id: 'jungle-fruit',
    title: 'Strange Fruit',
    description: 'A pulsing fruit hangs from a dark vine. Sweet, but the color is wrong.',
    choices: [
      { label: 'Eat it', desc: 'Either gain 6 HP or lose 4 HP. The jungle decides.' },
      { label: 'Leave it', desc: 'Gain 1 coin from caution. Safety first.' },
    ],
  },
  {
    id: 'lost-warrior',
    title: 'Lost Warrior',
    description: 'A jungle fighter is separated from their squad. They recognize your resolve.',
    choices: [
      { label: 'Train together', desc: 'Gain +1 attack bonus permanently.' },
      { label: 'Challenge them', desc: 'Fight lessons: gain +1 reroll per turn.' },
    ],
  },
  {
    id: 'dark-altar',
    title: 'Dark Altar',
    description: 'An obsidian altar drips with shadow energy. The Ka here is corrupted.',
    choices: [
      { label: 'Sacrifice HP', desc: 'Lose 6 HP, gain +2 max HP permanently.' },
      { label: 'Walk away', desc: 'Gain 1 coin from restraint. Wisdom costs nothing.' },
    ],
  },
  {
    id: 'treasure-cache',
    title: 'Buried Cache',
    description: 'You find a hidden stash under jungle roots. Someone left this deliberately.',
    choices: [
      { label: 'Take the coins', desc: 'Gain 3 coins.' },
      { label: 'Take the rune', desc: 'Gain +1 heal bonus permanently.' },
    ],
  },
  {
    id: 'wounded-animal',
    title: 'Wounded Creature',
    description: 'A jungle beast lies injured on your path. It watches you with wary eyes.',
    choices: [
      { label: 'Heal it', desc: 'Heal yourself 4 HP as the Ka flows through you.' },
      { label: 'Pass by', desc: 'Gain 2 coins from time saved.' },
    ],
  },
  {
    id: 'jungle-spirit',
    title: 'Jungle Spirit',
    description: 'A translucent spirit manifests from the mist. It speaks without words.',
    choices: [
      { label: 'Listen', desc: 'Gain +1 heal bonus and 3 HP from its blessing.' },
      { label: 'Challenge it', desc: 'Gain +2 attack bonus but lose 5 HP from exertion.' },
    ],
  },
  {
    id: 'cursed-idol',
    title: 'Cursed Idol',
    description: 'A golden idol on a pedestal radiates dread. The air smells of old blood.',
    choices: [
      { label: 'Smash it', desc: 'Gain 2 coins and +1 combat start shield from the shards.' },
      { label: 'Bow before it', desc: 'Lose 2 HP but gain +1 max HP and 1 coin as tribute.' },
    ],
  },
  {
    id: 'ancient-scroll',
    title: 'Ancient Scroll',
    description: 'A weathered scroll in Kabalian script. The symbols pulse with meaning.',
    choices: [
      { label: 'Read it', desc: 'Gain +1 attack bonus and +1 heal bonus from ancient knowledge.' },
      { label: 'Sell it', desc: 'Gain 3 coins at the next camp.' },
    ],
  },
];

export function pickRandomEvent(rng: () => number): MapEvent {
  return rngPick(rng, EVENTS);
}

export function resolveEventChoice(
  event: MapEvent,
  choiceIndex: number,
  player: { hp: number; maxHp: number; coins?: number },
  rng: () => number,
): EventResult {
  switch (event.id) {
    case 'ancient-shrine':
      if (choiceIndex === 0) return { text: 'You prayed at the shrine. +5 HP.', hpDelta: 5 };
      return { text: 'The idol curses you for your greed. +2 coins, -3 HP.', coinDelta: 2, hpDelta: -3 };

    case 'mysterious-merchant':
      if (choiceIndex === 0) {
        const coins = player.coins ?? 0;
        if (coins < 2) return { text: 'You cannot afford the trade. (Need 2 coins)', coinDelta: 0 };
        return { text: 'The merchant smiles. -2 coins, +6 HP, +1 heal bonus.', coinDelta: -2, hpDelta: 6, healBonusDelta: 1 };
      }
      return { text: 'You ignore the merchant. Nothing happens.' };

    case 'jungle-fruit':
      if (choiceIndex === 0) {
        const lucky = rng() > 0.5;
        return lucky
          ? { text: 'The fruit was sweet. +6 HP.', hpDelta: 6 }
          : { text: 'The fruit was poison. -4 HP.', hpDelta: -4 };
      }
      return { text: 'You leave the fruit. +1 coin from caution.', coinDelta: 1 };

    case 'lost-warrior':
      if (choiceIndex === 0) return { text: 'Training with the warrior. +1 attack bonus.', attackBonusDelta: 1 };
      return { text: 'Their lessons improve your roll game. +1 reroll.', rerollDelta: 1 };

    case 'dark-altar':
      if (choiceIndex === 0) return { text: 'You pay the price. -6 HP, +2 max HP.', hpDelta: -6, maxHpDelta: 2 };
      return { text: 'You walk away. +1 coin.', coinDelta: 1 };

    case 'treasure-cache':
      if (choiceIndex === 0) return { text: 'You take the coins. +3 coins.', coinDelta: 3 };
      return { text: 'The rune sharpens your healing. +1 heal bonus.', healBonusDelta: 1 };

    case 'wounded-animal':
      if (choiceIndex === 0) return { text: 'The Ka flows. You heal too. +4 HP.', hpDelta: 4 };
      return { text: 'You save the time. +2 coins.', coinDelta: 2 };

    case 'jungle-spirit':
      if (choiceIndex === 0) return { text: 'The spirit blesses you. +1 heal bonus, +3 HP.', healBonusDelta: 1, hpDelta: 3 };
      return { text: 'You challenge the spirit. +2 attack bonus, -5 HP.', attackBonusDelta: 2, hpDelta: -5 };

    case 'cursed-idol':
      if (choiceIndex === 0) return { text: 'The idol shatters. +2 coins, +1 combat start shield.', coinDelta: 2, combatStartShieldDelta: 1 };
      return { text: 'You bow. -2 HP, +1 max HP, +1 coin.', hpDelta: -2, maxHpDelta: 1, coinDelta: 1 };

    case 'ancient-scroll':
      if (choiceIndex === 0) return { text: 'Ancient knowledge flows in. +1 ATK, +1 HEAL.', attackBonusDelta: 1, healBonusDelta: 1 };
      return { text: 'Sold at the next camp. +3 coins.', coinDelta: 3 };

    default:
      return { text: 'Nothing happened.' };
  }
}

// ── Shop ──────────────────────────────────────────────────────────────────────

const SHOP_ITEM_POOL: ShopItem[] = [
  {
    id: 'healing-potion',
    name: 'Healing Potion',
    description: 'Restore 8 HP.',
    cost: 2,
    effect: { hpDelta: 8 },
  },
  {
    id: 'battle-shroom',
    name: 'Battle Shroom',
    description: '+1 attack bonus permanently.',
    cost: 3,
    effect: { attackBonusDelta: 1 },
  },
  {
    id: 'shield-charm',
    name: 'Shield Charm',
    description: '+3 max HP and +2 combat start shield.',
    cost: 3,
    effect: { maxHpDelta: 3, combatStartShieldDelta: 2 },
  },
  {
    id: 'focus-stone',
    name: 'Focus Stone',
    description: '+1 reroll per turn.',
    cost: 2,
    effect: { rerollDelta: 1 },
  },
  {
    id: 'ka-crystal',
    name: 'Ka Crystal',
    description: '+1 heal bonus permanently.',
    cost: 3,
    effect: { healBonusDelta: 1 },
  },
  {
    id: 'power-shard',
    name: 'Power Shard',
    description: '+2 attack bonus permanently.',
    cost: 5,
    effect: { attackBonusDelta: 2 },
  },
  {
    id: 'life-essence',
    name: 'Life Essence',
    description: 'Heal to full HP.',
    cost: 4,
    effect: { hpDelta: 999 }, // capped to maxHp in handler
  },
  {
    id: 'jungle-rune',
    name: 'Jungle Rune',
    description: '+4 combat start shield.',
    cost: 3,
    effect: { combatStartShieldDelta: 4 },
  },
  {
    id: 'quick-sip',
    name: 'Quick Sip',
    description: 'Restore 4 HP. Cheap and fast.',
    cost: 1,
    effect: { hpDelta: 4 },
  },
  {
    id: 'warriors-brew',
    name: "Warrior's Brew",
    description: '+1 attack bonus, +1 heal bonus.',
    cost: 4,
    effect: { attackBonusDelta: 1, healBonusDelta: 1 },
  },
];

export function generateShopItems(zone: number, rng: () => number): ShopItem[] {
  const count = zone >= 3 ? 4 : 3;
  const shuffled = [...SHOP_ITEM_POOL].sort(() => rng() - 0.5);
  // Scale costs slightly for higher zones
  return shuffled.slice(0, count).map(item => ({
    ...item,
    cost: Math.max(1, item.cost + Math.floor((zone - 1) * 0.5)),
  }));
}

// ── Rest ──────────────────────────────────────────────────────────────────────

export const REST_OPTIONS: RestOption[] = [
  {
    id: 'rest-heal',
    label: 'Rest and Recover',
    description: 'Heal 35% of your max HP.',
    effect: { hpPctHeal: 0.35 },
  },
  {
    id: 'rest-train',
    label: 'Train',
    description: '+1 attack bonus permanently.',
    effect: { attackBonusDelta: 1 },
  },
  {
    id: 'rest-meditate',
    label: 'Meditate',
    description: '+1 heal bonus permanently.',
    effect: { healBonusDelta: 1 },
  },
  {
    id: 'rest-forage',
    label: 'Forage',
    description: 'Find 2 coins in the jungle.',
    effect: { coinDelta: 2 },
  },
];
