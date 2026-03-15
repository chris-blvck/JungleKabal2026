// biomeSystem.ts — Biome definitions and enemy-biome mapping for DIE JUNGLE

export type BiomeId = 'jungle' | 'ruins' | 'temple' | 'abyss' | 'void';

export interface Biome {
  id: BiomeId;
  name: string;
  emoji: string;
  backgroundUrl: string;
  colorTheme: { primary: string; border: string };
}

// Background URLs — use placeholder or config-provided URLs
// These can be overridden by config.visuals.biomeBackgrounds from the admin panel
export const BIOME_DEFAULT_BACKGROUNDS: Record<BiomeId, string> = {
  jungle: 'https://i.postimg.cc/hGqqmWDN/Chat-GPT-Image-15-mars-2026-00-24-52.png', // zone 1 — always first combat
  ruins:  'https://i.postimg.cc/QCz2xvnC/Chat-GPT-Image-15-mars-2026-01-27-54.png',  // zone 2
  temple: 'https://i.postimg.cc/7PQ8VTPg/Chat-GPT-Image-15-mars-2026-01-36-50.png',  // zone 3
  abyss:  'https://i.postimg.cc/sf0dcZf7/Chat-GPT-Image-15-mars-2026-10-55-43.png',  // zone 4
  void:   'https://i.postimg.cc/hGqqmWDN/Chat-GPT-Image-15-mars-2026-00-24-52.png',  // PENDING: void bg (reuse jungle for now)
};

export const BIOMES: Record<BiomeId, Biome> = {
  jungle: {
    id: 'jungle',
    name: 'Jungle Profonde',
    emoji: '🌿',
    backgroundUrl: BIOME_DEFAULT_BACKGROUNDS.jungle,
    colorTheme: { primary: 'text-emerald-300', border: 'border-emerald-400/30' },
  },
  ruins: {
    id: 'ruins',
    name: 'Ruines Ka',
    emoji: '🏛️',
    backgroundUrl: BIOME_DEFAULT_BACKGROUNDS.ruins,
    colorTheme: { primary: 'text-amber-300', border: 'border-amber-400/30' },
  },
  temple: {
    id: 'temple',
    name: 'Temple Maudit',
    emoji: '⛩️',
    backgroundUrl: BIOME_DEFAULT_BACKGROUNDS.temple,
    colorTheme: { primary: 'text-violet-300', border: 'border-violet-400/30' },
  },
  abyss: {
    id: 'abyss',
    name: 'Abysse',
    emoji: '🌑',
    backgroundUrl: BIOME_DEFAULT_BACKGROUNDS.abyss,
    colorTheme: { primary: 'text-rose-300', border: 'border-rose-400/30' },
  },
  void: {
    id: 'void',
    name: 'Vide Éternel',
    emoji: '⚡',
    backgroundUrl: BIOME_DEFAULT_BACKGROUNDS.void,
    colorTheme: { primary: 'text-cyan-300', border: 'border-cyan-400/30' },
  },
};

// Which biomes can appear after each boss zone (zone 1 boss → zone 2 picks from this)
export const BIOME_AFTER_ZONE: Record<number, BiomeId[]> = {
  1: ['jungle', 'ruins'],
  2: ['ruins', 'temple'],
  3: ['temple', 'abyss'],
  4: ['abyss', 'void'],
};

// All enemy names and which biomes they appear in ('all' = universal)
export const ENEMY_BIOME_MAP: Record<string, BiomeId[] | 'all'> = {
  // Mobs — universal
  'Magic Devil Book': 'all',
  'Crazy Drums': 'all',
  'Jar': 'all',
  // Mobs — biome specific
  'River Scum': ['jungle', 'abyss'],
  'Kukri': ['ruins', 'temple'],
  'Devil Rat': ['jungle', 'ruins'],
  'Amulet': ['temple', 'void'],
  // Elites
  'Carnivor Plant': ['jungle'],
  'Yellow Ghost': ['void', 'temple'],
  // Bosses
  'Carnivor Tree': ['jungle'],
};

/** Pick the next biome after killing a zone boss */
export function pickNextBiome(currentZone: number, rngSeed: string): BiomeId {
  const pool = BIOME_AFTER_ZONE[currentZone] ?? ['jungle', 'ruins', 'temple', 'abyss', 'void'];
  // Deterministic pick from seed
  let h = 0;
  for (let i = 0; i < rngSeed.length; i++) h = ((h << 5) - h + rngSeed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

/** Get effective background URL for a biome, with config override support */
export function getBiomeBackground(
  biomeId: BiomeId,
  configOverrides?: Partial<Record<BiomeId, string>>,
): string {
  const override = configOverrides?.[biomeId];
  if (override) return override;
  return BIOMES[biomeId]?.backgroundUrl || BIOME_DEFAULT_BACKGROUNDS.jungle;
}
