import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  type MapLayer,
  type MapNode,
  type MapEvent,
  type ShopItem,
  generateZoneMap,
  updateFogOfWar,
  getAvailableNodes,
  getNodeEmoji,
  getNodeLabel,
  pickRandomEvent,
  resolveEventChoice,
  generateShopItems,
  REST_OPTIONS,
  createRng,
} from "@/game/mapSystem";
import {
  type Companion,
  type CompanionId,
  COMPANIONS,
  getCompanion,
  tickCompanionCooldown,
  startCompanionCooldown,
} from "@/game/companions";
import {
  type MetaProgressionState,
  type UnlockId,
  type RunReward,
  type LevelReward,
  UNLOCKS,
  LEVEL_REWARDS,
  loadMeta,
  saveMeta,
  recordRunEnd,
  tryUnlockWithGems,
  computeLevel,
  xpToNextLevel,
  canPlayKKM,
  canPlayKRex,
  hasWeaponSlot,
  hasCompanionSlot,
  hasDiceSpecials,
  hasLaneBonuses,
  getUnlockedCompanions,
  getRelicSlotCount,
} from "@/lib/metaProgression";
import {
  type BiomeId,
  BIOMES,
  getBiomeBackground,
  pickNextBiome,
  ENEMY_BIOME_MAP,
} from "@/game/biomeSystem";
import {
  type Weapon,
  type Rarity,
  RARITY_COLORS,
  STARTER_WEAPONS,
  buildWeapon,
  applyWeaponPassives,
  activateWeaponSpecial,
  tickWeaponCooldowns,
  tickEnemyDot,
  onKillLegendaryTrigger,
  getWeaponDisplayInfo,
  shouldPersistShield,
  getStaffLegendaryHealBonus,
} from "@/game/weapons";

const BG_URL = "https://i.postimg.cc/hGqqmWDN/Chat-GPT-Image-15-mars-2026-00-24-52.png";
const SHOP_GUY_URL = "https://i.postimg.cc/t4Wkm7Pr/Chat-GPT-Image-15-mars-2026-19-30-40.png";

// Button image URLs — replace with real assets when available
// Can be overridden via config.visuals.buttonImages from admin panel
const BTN_IMAGES: Record<string, string> = {
  roll:    'https://i.postimg.cc/LsgK95Nh/Chat-GPT-Image-15-mars-2026-23-18-33.png',
  reroll:  '',
  resolve: 'https://i.postimg.cc/T37f2ZGX/82d42001-27b5-45f3-8f67-22d978a4ae54.png',
  restart: '',
};

type RunSummary = {
  score: number;
  floor: number;
  runSeed: string;
  characterId: string;
};

type KaPower = {
  id: string
  name: string
  desc: string
  icon: string
  activate: (state: any) => any // pure function
}

type KillReward = {
  id: string
  icon: string
  name: string
  desc: string
  weight: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  apply: (player: any, state: any) => Partial<any>
}

type LaneBonus = {
  stat: 'attack' | 'shield' | 'heal' | 'coins' | 'ka_fragment' | 'xp'
  value: number
  isMalus: boolean
  display: string
}

type DieInTheJungleProps = {
  onRunEnded?: (summary: RunSummary) => void;
  onBeforeRestart?: () => boolean;
};

const LOGO_URL = "https://i.postimg.cc/pTXBTZ79/Chat-GPT-Image-15-mars-2026-00-13-27.png";
const PLAYER_AVATAR_URL = "https://i.postimg.cc/B6rBLmBt/Kabalian-Face.png";
const KKM_AVATAR_URL = "https://i.postimg.cc/Kv8zygVk/KKM-Mascot-2.png";
const STORY_FRAGMENT_IMAGE_URL = "https://i.postimg.cc/DwMdGXHm/Kabalian-or-KKM.png";
const PLAYER_EMOTION_URLS = {
  focus: "https://i.postimg.cc/K8xhZnpB/Chat-GPT-Image-Mar-12-2026-03-09-30-PM.png",
  fierce: "https://i.postimg.cc/K8xhZnpB/Chat-GPT-Image-Mar-12-2026-03-09-30-PM.png",
  guard: "https://i.postimg.cc/J7kfZT90/Chat-GPT-Image-Mar-12-2026-03-00-38-PM.png",
  joy: "https://i.postimg.cc/WzLf5vQZ/Chat-GPT-Image-Mar-12-2026-03-04-11-PM.png",
  hurt: "https://i.postimg.cc/FKCMgwrc/Chat-GPT-Image-Mar-12-2026-03-06-38-PM.png",
  almostDead: "https://i.postimg.cc/Df4T5fbm/Chat-GPT-Image-Mar-12-2026-03-00-52-PM.png",
  shocked: "https://i.postimg.cc/FKCMgwrc/Chat-GPT-Image-Mar-12-2026-03-06-38-PM.png",
  victory: PLAYER_AVATAR_URL,
};

const KREX_AVATAR_URL = "https://i.postimg.cc/0Q3R0ZLZ/K-Rex.png";

const PLAYER_CHARACTERS = {
  kabalian: {
    id: "kabalian",
    name: "Kabalian",
    avatar: PLAYER_AVATAR_URL,
    subtitle: "Aggro · 24 HP · +1 ATK · 2 rerolls",
    stats: { maxHp: 24, attackBonus: 1, rerollsPerTurn: 2, combatStartShield: 0, cooldownBase: 3 },
  },
  kkm: {
    id: "kkm",
    name: "KKM",
    avatar: KKM_AVATAR_URL,
    subtitle: "Tank · 34 HP · +4 start shield",
    stats: { maxHp: 34, attackBonus: 0, rerollsPerTurn: 1, combatStartShield: 4, cooldownBase: 3 },
  },
  krex: {
    id: "krex",
    name: "K-REX",
    avatar: KREX_AVATAR_URL,
    subtitle: "Brute · 42 HP · +3 ATK · 1 reroll · CD base +1",
    // Lumbering T-Rex: powerful but slow. Thick hide = high HP, big claws = +3 ATK,
    // heavy limbs = only 1 reroll + cooldown base 4 (harder to reset grid).
    stats: { maxHp: 42, attackBonus: 3, rerollsPerTurn: 1, combatStartShield: 0, cooldownBase: 4 },
  },
};

// ── Starter weapons ──────────────────────────────────────────────────────────
const STARTER_WEAPONS = [
  {
    id: "jungle-blade", name: "Jungle Blade", type: "blade", rarity: "Common",
    image: "https://i.postimg.cc/bwdH2hxw/Chat-GPT-Image-Mar-15-2026-01-07-26-AM.png",
    ability: "Double Strike", abilityDesc: "Attack die value +1",
    effectText: "⚔️ Attack die value +1.",
    apply: (player) => ({ ...player, attackDieValueBonus: player.attackDieValueBonus + 1 }),
  },
  {
    id: "amber-staff", name: "Amber Staff", type: "staff", rarity: "Common",
    image: "https://i.postimg.cc/XYhKfzLq/Chat-GPT-Image-Mar-15-2026-01-07-27-AM.png",
    ability: "Mend", abilityDesc: "Heal dice restore +2 extra",
    effectText: "❤️ Heal dice restore +2 extra.",
    apply: (player) => ({ ...player, healBonus: player.healBonus + 2 }),
  },
  {
    id: "stone-shield", name: "Stone Shield", type: "shield", rarity: "Common",
    image: "https://i.postimg.cc/C1CjVLg4/Chat-GPT-Image-Mar-15-2026-01-07-30-AM.png",
    ability: "Fortress", abilityDesc: "+3 combat start shield",
    effectText: "🛡️ +3 combat start shield.",
    apply: (player) => ({ ...player, combatStartShield: player.combatStartShield + 3 }),
  },
  {
    id: "ka-totem-weapon", name: "Ka Totem", type: "totem", rarity: "Common",
    image: "https://i.postimg.cc/Fz90F5rp/Chat-GPT-Image-Mar-15-2026-01-07-35-AM.png",
    ability: "Reset", abilityDesc: "Cooldown tick +1",
    effectText: "♻️ Cooldown tick +1.",
    apply: (player) => ({ ...player, cooldownTick: player.cooldownTick + 1 }),
  },
  {
    id: "chrome-cannon", name: "Chrome Cannon", type: "cannon", rarity: "Common",
    image: "https://i.postimg.cc/fywYWnzv/Chat-GPT-Image-Mar-15-2026-01-17-23-AM.png",
    ability: "Overload", abilityDesc: "Top row multiplier +1",
    effectText: "🔥 Top row bonus +1.",
    apply: (player) => ({ ...player, topRowBonus: player.topRowBonus + 1 }),
  },
  {
    id: "venom-fang", name: "Venom Fang", type: "fang", rarity: "Common",
    image: "https://i.postimg.cc/ZRvMPNpM/golden-venom-serpent.png",
    ability: "Inject", abilityDesc: "+2 attack bonus",
    effectText: "⚔️ +2 attack bonus.",
    apply: (player) => ({ ...player, attackBonus: player.attackBonus + 2 }),
  },
];

// ── Companions ────────────────────────────────────────────────────────────────
const COMPANIONS = [
  {
    id: "gecko", name: "Gecko Mystique", emoji: "🦎",
    image: "https://i.postimg.cc/mkGFXx1g/chartreuse-swamp-sprite.png",
    passiveDesc: "+1 attack die value",
    applyPassive: (player) => ({ ...player, attackDieValueBonus: player.attackDieValueBonus + 1 }),
    abilityEmoji: "😴", abilityName: "Hypnose", abilityDesc: "Enemy skips next intent", abilityCooldown: 3,
  },
  {
    id: "croak", name: "Croak Jr.", emoji: "🐸",
    image: "https://i.postimg.cc/MTYWSgrx/jade-toxic-hydra.png",
    passiveDesc: "+2 attack bonus",
    applyPassive: (player) => ({ ...player, attackBonus: player.attackBonus + 2 }),
    abilityEmoji: "💥", abilityName: "Leap", abilityDesc: "Deal 8 flat damage", abilityCooldown: 3,
  },
  {
    id: "oeil", name: "L'Œil", emoji: "👁️",
    image: "https://i.postimg.cc/kXvWH5yw/olive-toxic-gazer.png",
    passiveDesc: "+1 reroll per turn",
    applyPassive: (player) => ({ ...player, rerollsPerTurn: player.rerollsPerTurn + 1, rerollsLeft: player.rerollsLeft + 1 }),
    abilityEmoji: "🔮", abilityName: "Vision", abilityDesc: "Free reroll (no cost)", abilityCooldown: 3,
  },
  {
    id: "shaman", name: "Coral Shaman", emoji: "🧙",
    image: "https://i.postimg.cc/rp344R8S/coral-jungle-shaman.png",
    passiveDesc: "+2 heal bonus",
    applyPassive: (player) => ({ ...player, healBonus: player.healBonus + 2 }),
    abilityEmoji: "🌿", abilityName: "Totem", abilityDesc: "Heal 8 HP", abilityCooldown: 3,
  },
  {
    id: "sprout", name: "Grove Sproutling", emoji: "🌱",
    image: "https://i.postimg.cc/5Ns6vQgw/amber-grove-sproutling.png",
    passiveDesc: "+3 combat start shield",
    applyPassive: (player) => ({ ...player, combatStartShield: player.combatStartShield + 3 }),
    abilityEmoji: "🛡️", abilityName: "Barrier", abilityDesc: "+6 shield now", abilityCooldown: 3,
  },
  {
    id: "hoarder", name: "Spirit Hoarder", emoji: "👻",
    image: "https://i.postimg.cc/nrswkD7p/jade-spirit-hoarder.png",
    passiveDesc: "+1 reroll per turn",
    applyPassive: (player) => ({ ...player, rerollsPerTurn: player.rerollsPerTurn + 1, rerollsLeft: player.rerollsLeft + 1 }),
    abilityEmoji: "👻", abilityName: "Soul Hoard", abilityDesc: "+1 reroll + heal 4", abilityCooldown: 2,
  },
  {
    id: "imp", name: "Toxic Imp", emoji: "😈",
    image: "https://i.postimg.cc/gjftB2qh/jade-toxic-imp.png",
    passiveDesc: "+1 attack die value",
    applyPassive: (player) => ({ ...player, attackDieValueBonus: player.attackDieValueBonus + 1 }),
    abilityEmoji: "☠️", abilityName: "Venom", abilityDesc: "Deal 5 flat damage", abilityCooldown: 2,
  },
];

// ── Starter relics ────────────────────────────────────────────────────────────
const STARTER_RELICS = [
  {
    id: "ka-totem-relic", name: "Ka Totem", slotIndex: 0,
    image: "https://i.postimg.cc/jSvmRtRF/golden-toxic-totem.png",
    effectText: "♻️ Cooldown tick +1.",
    apply: (player) => ({ ...player, cooldownTick: player.cooldownTick + 1 }),
  },
];

const DEFAULT_REMOTE_ADMIN_CONFIG = {
  visuals: { backgroundUrl: "", logoUrl: "", storyFragmentImageUrl: "" },
  characters: { playable: {}, emotionUrls: {} },
  narrative: { kabalian: [], kkm: [] },
  pools: {
    artifactWeights: { gray: 4, gold: 3, chrome: 1 },
    starterWeights: { gray: 6, gold: 3, chrome: 1 },
    // shop item keys that are enabled in the shop pool
    shopItemEnabled: {} as Record<string, boolean>,
    // map node type weights: [combat, shop, rest, event] as relative weights
    mapNodeWeights: { combat: 3, shop: 1, rest: 1, event: 1 },
  },
};

const DICE_IMAGES = {
  1: "https://i.postimg.cc/mk4Rdw2K/Dice-1.png",
  2: "https://i.postimg.cc/NFtYN4jq/Dice-2.png",
  3: "https://i.postimg.cc/4yGZ85xs/Dice-3.png",
  4: "https://i.postimg.cc/qqr0mLvJ/Dice-4.png",
  5: "https://i.postimg.cc/x8QYsR1j/Dice-5.png",
  6: "https://i.postimg.cc/gjpdMD2J/Dice-6.png",
};

const DICE_IMAGES_BY_KIND = {
  attack: {
    1: "https://i.postimg.cc/mk4Rdw2K/Dice-1.png",
    2: "https://i.postimg.cc/NFtYN4jq/Dice-2.png",
    3: "https://i.postimg.cc/4yGZ85xs/Dice-3.png",
    4: "https://i.postimg.cc/qqr0mLvJ/Dice-4.png",
    5: "https://i.postimg.cc/x8QYsR1j/Dice-5.png",
    6: "https://i.postimg.cc/gjpdMD2J/Dice-6.png",
  },
  heal: {
    1: "https://i.postimg.cc/k4T1QSqL/Dice-health-1.png",
    2: "https://i.postimg.cc/hvhCpGGd/Dice-Health-2.png",
    3: "https://i.postimg.cc/BbthMvv1/Dice-Health-3.png",
    4: "https://i.postimg.cc/QCV60MM1/Dice-Health-4.png",
    5: "https://i.postimg.cc/brd63vv3/Dice-Helath-5.png",
    6: "https://i.postimg.cc/mkhd8rr1/Dice-Health-6.png",
  },
  shield: {
    1: "https://i.postimg.cc/x8qstddp/Dice-shield-1.png",
    2: "https://i.postimg.cc/Zngwgh9P/Dice-Shield-2.png",
    3: "https://i.postimg.cc/9MQCpGHw/Chat-GPT-Image-Mar-12-2026-09-40-50-PM.png",
    4: "https://i.postimg.cc/L57x7Mq3/Dice-Shield-4.png",
    5: "https://i.postimg.cc/mkqmqGcp/Dice-Shield-5.png",
    6: "https://i.postimg.cc/90SLSj4K/Dice-Shield-6.png",
  },
};

const GAME_STATE_STORAGE_KEY = "jungle_kabal_run_state_v1";

const DIE_KIND_ORDER = ["attack", "shield", "heal"];

const TAG_EMOJIS = {
  attack: "⚔️",
  shield: "🛡️",
  heal: "❤️",
  survival: "🧬",
  tempo: "⏱️",
  curse: "☠️",
};

const LANE_IMAGES = {
  0: "https://i.postimg.cc/65BXr95n/Chat-GPT-Image-15-mars-2026-23-23-55.png",
  1: "https://i.postimg.cc/65BXr95n/Chat-GPT-Image-15-mars-2026-23-23-55.png",
  2: "https://i.postimg.cc/65BXr95n/Chat-GPT-Image-15-mars-2026-23-23-55.png",
};

const ROW_INFO = [
  { name: "Top", emoji: "🔥", mult: 3, role: "+1 ATK", laneBonus: { attack: 1, shield: 0, heal: 0 } },
  { name: "Mid", emoji: "✨", mult: 2, role: "+1 HEAL", laneBonus: { attack: 0, shield: 0, heal: 1 } },
  { name: "Bot", emoji: "🪨", mult: 1, role: "+1 SHIELD", laneBonus: { attack: 0, shield: 1, heal: 0 } },
];

const ENEMY_POOLS = {
  mob: [
    {
      tier: "mob",
      name: "Magic Devil Book",
      hp: 15,
      damage: 4,
      emoji: "📕",
      mood: "Hex pages",
      image: "https://i.postimg.cc/XYDpJTQK/Magic-Book-1.png",
      intents: [
        { type: "attack", value: 4, label: "Hex Slash" },
        { type: "shield", value: 3, label: "Page Ward" },
        { type: "attack", value: 5, label: "Dark Swipe" },
      ],
      modifierPool: ["stoneSkin", "thorns"],
    },
    {
      tier: "mob",
      name: "Crazy Drums",
      hp: 16,
      damage: 5,
      emoji: "🥁",
      mood: "War rhythm",
      image: "https://i.postimg.cc/nzF5PPfy/Drums.png",
      intents: [
        { type: "charge", value: 2, label: "War Rhythm" },
        { type: "attack", value: 7, label: "Shock Beat" },
        { type: "attack", value: 5, label: "Bass Slam" },
      ],
      modifierPool: ["berserk", "swift"],
    },
    {
      tier: "mob",
      name: "River Scum",
      hp: 18,
      damage: 5,
      emoji: "🧪",
      mood: "Swamp splash",
      image: "https://i.postimg.cc/prtBS9jQ/River-Scum.png",
      intents: [
        { type: "shield", value: 4, label: "Slime Coat" },
        { type: "attack", value: 5, label: "Toxic Splash" },
        { type: "attack", value: 6, label: "Mud Bite" },
      ],
      modifierPool: ["venom", "thorns"],
    },
    {
      tier: "mob",
      name: "Jar",
      hp: 17,
      damage: 4,
      emoji: "🏺",
      mood: "Cursed crack",
      image: "https://i.postimg.cc/G2S4B6LD/Chat-GPT-Image-Mar-12-2026-01-57-49-PM.png",
      intents: [
        { type: "attack", value: 4, label: "Clay Hit" },
        { type: "heal", value: 3, label: "Dust Mend" },
        { type: "attack", value: 6, label: "Shatter Rush" },
      ],
      modifierPool: ["stoneSkin", "regen"],
    },
    {
      tier: "mob",
      name: "Kukri",
      hp: 19,
      damage: 6,
      emoji: "🗡️",
      mood: "Sharp rush",
      image: "https://i.postimg.cc/Hsbwr0Kd/Chat-GPT-Image-Mar-12-2026-01-58-05-PM.png",
      intents: [
        { type: "attack", value: 6, label: "Quick Cut" },
        { type: "charge", value: 2, label: "Aim" },
        { type: "attack", value: 9, label: "Execution" },
      ],
      modifierPool: ["berserk", "swift"],
    },
    {
      tier: "mob",
      name: "Devil Rat",
      hp: 18,
      damage: 6,
      emoji: "🐀",
      mood: "Rabid bite",
      image: "https://i.postimg.cc/W3DrT0ry/Chat-GPT-Image-Mar-12-2026-02-00-15-PM.png",
      intents: [
        { type: "attack", value: 5, label: "Gnaw" },
        { type: "attack", value: 6, label: "Skitter Bite" },
        { type: "shield", value: 3, label: "Hide" },
      ],
      modifierPool: ["venom", "swift"],
    },
    {
      tier: "mob",
      name: "Amulet",
      hp: 15,
      damage: 5,
      emoji: "📿",
      mood: "Evil pulse",
      image: "https://i.postimg.cc/HxJ5dbXg/Chat-GPT-Image-Mar-12-2026-02-00-17-PM.png",
      intents: [
        { type: "curse", value: 1, label: "Hex Smoke" },
        { type: "attack", value: 6, label: "Soul Pulse" },
        { type: "shield", value: 4, label: "Amber Ward" },
      ],
      modifierPool: ["stoneSkin", "regen"],
    },
  ],
  medium: [
    {
      tier: "medium",
      name: "Karnivor",
      hp: 30,
      damage: 8,
      emoji: "🌿",
      mood: "Snap attack",
      image: "https://i.postimg.cc/Kjv2tYYn/Carnivorous-4.png",
      intents: [
        { type: "charge", value: 2, label: "Open Maw" },
        { type: "attack", value: 12, label: "Devour" },
        { type: "shield", value: 5, label: "Leaf Armor" },
      ],
      modifierPool: ["berserk", "stoneSkin", "thorns"],
    },
    {
      tier: "medium",
      name: "Yellow Ghost",
      hp: 26,
      damage: 9,
      emoji: "👻",
      mood: "Soul drain",
      image: "https://i.postimg.cc/B6J9Gv2n/Ghost-Yellow.png",
      intents: [
        { type: "attack", value: 7, label: "Spirit Touch" },
        { type: "heal", value: 5, label: "Soul Mend" },
        { type: "attack", value: 10, label: "Wail" },
      ],
      modifierPool: ["regen", "swift", "venom"],
    },
    {
      tier: "medium",
      name: "Water Monster",
      hp: 31,
      damage: 8,
      emoji: "🌊",
      mood: "Tidal slam",
      image: "https://i.postimg.cc/nz9dgbw2/Water-Monster-1.png",
      intents: [
        { type: "shield", value: 5, label: "Deep Coat" },
        { type: "charge", value: 2, label: "Wave Rise" },
        { type: "attack", value: 13, label: "Tide Crash" },
      ],
      modifierPool: ["stoneSkin", "thorns", "regen"],
    },
    {
      tier: "medium",
      name: "Greedy Bat",
      hp: 25,
      damage: 9,
      emoji: "🦇",
      mood: "Dive steal",
      image: "https://i.postimg.cc/d3BGS5vf/Bat-1-(1).png",
      intents: [
        { type: "attack", value: 8, label: "Dive" },
        { type: "curse", value: 1, label: "Blind Dust" },
        { type: "attack", value: 11, label: "Greed Bite" },
      ],
      modifierPool: ["swift", "berserk", "venom"],
    },
    {
      tier: "medium",
      name: "Water Eel",
      hp: 29,
      damage: 10,
      emoji: "🐍",
      mood: "Shock bite",
      image: "https://i.postimg.cc/MHWQR1RF/Water-Eel.png",
      intents: [
        { type: "attack", value: 9, label: "Shock Bite" },
        { type: "attack", value: 10, label: "Tail Lash" },
        { type: "shield", value: 5, label: "Slip Away" },
      ],
      modifierPool: ["venom", "swift", "thorns"],
    },
    {
      tier: "medium",
      name: "Fire Altar",
      hp: 33,
      damage: 10,
      emoji: "🔥",
      mood: "Burn wave",
      image: "https://i.postimg.cc/26Ywcbh4/Chat-GPT-Image-Mar-12-2026-01-55-03-PM.png",
      intents: [
        { type: "charge", value: 2, label: "Flame Rise" },
        { type: "attack", value: 14, label: "Burn Wave" },
        { type: "shield", value: 6, label: "Ash Guard" },
      ],
      modifierPool: ["berserk", "stoneSkin", "thorns"],
    },
  ],
  boss: [
    {
      tier: "boss",
      name: "Karnivor Tree",
      hp: 56,
      damage: 14,
      emoji: "🌳",
      mood: "Root devour",
      image: "https://i.postimg.cc/qMwGmvv2/Carnivor-tree-5.png",
      intents: [
        { type: "shield", value: 8, label: "Bark Wall" },
        { type: "charge", value: 2, label: "Root Charge" },
        { type: "attack", value: 20, label: "Devour Slam" },
      ],
      modifierPool: ["stoneSkin", "thorns", "regen"],
    },
    {
      tier: "boss",
      name: "Water Dinosaur",
      hp: 60,
      damage: 15,
      emoji: "🦕",
      mood: "Flood crush",
      image: "https://i.postimg.cc/Bb8hWWY7/Lok-Ness-2.png",
      intents: [
        { type: "attack", value: 13, label: "Tail Crash" },
        { type: "shield", value: 9, label: "Flood Skin" },
        { type: "attack", value: 18, label: "Abyss Bite" },
      ],
      modifierPool: ["stoneSkin", "berserk", "thorns"],
    },
    {
      tier: "boss",
      name: "Yeti",
      hp: 64,
      damage: 16,
      emoji: "👹",
      mood: "Frozen smash",
      image: "https://i.postimg.cc/Y0gsGK6R/Yeti-1.png",
      intents: [
        { type: "charge", value: 2, label: "Frozen Breath" },
        { type: "attack", value: 19, label: "Ice Crush" },
        { type: "heal", value: 6, label: "Snow Hide" },
      ],
      modifierPool: ["berserk", "stoneSkin", "regen"],
    },
  ],
};

const MODIFIERS = {
  none: { name: "None", desc: "No extra effect.", badge: "—" },
  berserk: { name: "Berserk", desc: "Enemy attacks deal +2 damage.", badge: "+2 DMG" },
  stoneSkin: { name: "Stone Skin", desc: "Ignore the first hit each combat.", badge: "1st hit immune" },
  thorns: { name: "Thorns", desc: "When you attack, take 1 recoil.", badge: "Recoil 1" },
  swift: { name: "Swift", desc: "First intent each combat gets +2 value.", badge: "+2 first intent" },
  venom: { name: "Venom", desc: "If the enemy hits HP, lose +1 HP.", badge: "+1 poison" },
  regen: { name: "Regen", desc: "Enemy heals 2 at end of its turn.", badge: "+2 regen" },
};

const KA_POWERS: Record<string, KaPower> = {
  kabalian: {
    id: 'ka_rage',
    name: 'Ka Rage',
    desc: 'All attack dice max out (value 6) · Ignore enemy shield this turn.',
    icon: '⚡',
    activate: (state: any) => {
      const newDice = state.dice.map((d: any) =>
        d && d.kind === 'attack' ? { ...d, value: 6 } : d
      )
      return {
        ...state,
        dice: newDice,
        kaRageActive: true,
        actionFlash: { id: Date.now(), text: '⚡ KA RAGE — Attack maxed!', tone: 'amber' },
        log: ['⚡ Ka Rage activated! All attack dice → 6, shield pierced.', ...state.log].slice(0, 40),
      }
    },
  },
  kkm: {
    id: 'ka_fortress',
    name: 'Ka Fortress',
    desc: 'Gain +15 shield · Enemy skips their next intent.',
    icon: '🛡️',
    activate: (state: any) => {
      return {
        ...state,
        player: { ...state.player, shield: (state.player.shield || 0) + 15 },
        kaFortressActive: true,
        actionFlash: { id: Date.now(), text: '🛡️ KA FORTRESS — +15 shield!', tone: 'sky' },
        log: ['🛡️ Ka Fortress activated! +15 shield, enemy intent skipped.', ...state.log].slice(0, 40),
      }
    },
  },
  krex: {
    id: 'ka_stomp',
    name: 'Ka Stomp',
    desc: 'Deal 8 direct damage · Stun enemy for 1 turn.',
    icon: '🦶',
    activate: (state: any) => {
      const newHp = Math.max(0, state.enemy.hp - 8)
      return {
        ...state,
        enemy: { ...state.enemy, hp: newHp },
        kaStompActive: true,
        actionFlash: { id: Date.now(), text: '🦶 KA STOMP — 8 direct damage!', tone: 'amber' },
        log: ['🦶 Ka Stomp! Enemy hit for 8, stunned next turn.', ...state.log].slice(0, 40),
      }
    },
  },
}

const KILL_REWARD_POOL: KillReward[] = [
  {
    id: 'heal_10', icon: '❤️', name: '+10 HP', desc: 'Soin immédiat.',
    weight: 28, rarity: 'common',
    apply: (player: any) => ({ player: { ...player, hp: Math.min(player.maxHp, player.hp + 10) } }),
  },
  {
    id: 'maxhp_1', icon: '🧬', name: '+1 HP max', desc: 'HP max permanent ce run.',
    weight: 20, rarity: 'common',
    apply: (player: any) => ({ player: { ...player, maxHp: player.maxHp + 1, hp: player.hp + 1 } }),
  },
  {
    id: 'coins_10', icon: '🪙', name: '+10 Coins', desc: 'Monnaie pour le shop.',
    weight: 20, rarity: 'common',
    apply: (player: any) => ({ player: { ...player, coins: (player.coins || 0) + 10 } }),
  },
  {
    id: 'ka_fragment', icon: '◆', name: 'Ka Fragment', desc: '+1 fragment Ka.',
    weight: 15, rarity: 'common',
    apply: (player: any) => {
      const newF = Math.min(4, (player.kaFragments || 0) + 1);
      return { player: { ...player, kaFragments: newF, kaCharged: newF >= 4 } };
    },
  },
  {
    id: 'bonus_die', icon: '🎲', name: '+1 Bonus die', desc: 'Next combat: 4 dice.',
    weight: 8, rarity: 'rare',
    apply: (player: any) => ({ player: { ...player, bonusDiceNextCombat: (player.bonusDiceNextCombat || 0) + 1 } }),
  },
  {
    id: 'crit_chance', icon: '🎯', name: '+0.5% Crit', desc: 'Max 15% crit chance.',
    weight: 5, rarity: 'rare',
    apply: (player: any) => ({ player: { ...player, critChance: Math.min(0.15, (player.critChance || 0) + 0.005) } }),
  },
  {
    id: 'shield_5', icon: '🛡️', name: '+5 Shield', desc: 'Bouclier immédiat.',
    weight: 12, rarity: 'common',
    apply: (player: any) => ({ player: { ...player, shield: (player.shield || 0) + 5 } }),
  },
]

const LANE_BONUS_POOL: LaneBonus[] = [
  { stat: 'attack',      value: 1,  isMalus: false, display: '+1 ⚔️' },
  { stat: 'attack',      value: 2,  isMalus: false, display: '+2 ⚔️' },
  { stat: 'shield',      value: 1,  isMalus: false, display: '+1 🛡️' },
  { stat: 'shield',      value: 2,  isMalus: false, display: '+2 🛡️' },
  { stat: 'heal',        value: 1,  isMalus: false, display: '+1 ❤️' },
  { stat: 'heal',        value: 2,  isMalus: false, display: '+2 ❤️' },
  { stat: 'coins',       value: 5,  isMalus: false, display: '+5 🪙' },
  { stat: 'coins',       value: 10, isMalus: false, display: '+10 🪙' },
  { stat: 'ka_fragment', value: 1,  isMalus: false, display: '+1 ◆' },
  { stat: 'xp',          value: 3,  isMalus: false, display: '+3 ✨' },
  { stat: 'attack',      value: -1, isMalus: true,  display: '-1 ⚔️' },
  { stat: 'attack',      value: -2, isMalus: true,  display: '-2 ⚔️' },
  { stat: 'shield',      value: -1, isMalus: true,  display: '-1 🛡️' },
  { stat: 'heal',        value: -1, isMalus: true,  display: '-1 ❤️' },
];

function rollLaneBonuses(): [LaneBonus, LaneBonus, LaneBonus] {
  const results: LaneBonus[] = [];
  for (let i = 0; i < 3; i++) {
    const isMalus = Math.random() < 0.20;
    const pool = LANE_BONUS_POOL.filter(b => b.isMalus === isMalus);
    const item = pool[Math.floor(Math.random() * pool.length)];
    results.push({ ...item });
  }
  // Guarantee at least 1 positive ATK+ or HEAL+
  const hasPositive = results.some(b => !b.isMalus && (b.stat === 'attack' || b.stat === 'heal'));
  if (!hasPositive) {
    results[0] = { stat: 'attack', value: 1, isMalus: false, display: '+1 ⚔️' };
  }
  return results as [LaneBonus, LaneBonus, LaneBonus];
}

function drawKillRewards(count: number, excludeIds: string[] = []): KillReward[] {
  const pool = KILL_REWARD_POOL.filter(r => !excludeIds.includes(r.id));
  const drawn: KillReward[] = [];
  const usedIds = new Set<string>();
  let attempts = 0;
  while (drawn.length < count && attempts < 100) {
    attempts++;
    const totalWeight = pool.filter(r => !usedIds.has(r.id)).reduce((s, r) => s + r.weight, 0);
    if (totalWeight <= 0) break;
    const roll = Math.random() * totalWeight;
    let cumul = 0;
    for (const r of pool) {
      if (usedIds.has(r.id)) continue;
      cumul += r.weight;
      if (roll <= cumul) { drawn.push(r); usedIds.add(r.id); break; }
    }
  }
  return drawn;
}

const ARTIFACT_POOL = [
  {
    id: "amber-heart",
    name: "Amber Heart",
    rarity: "gold",
    category: "relic",
    tags: ["survival"],
    image: "https://i.postimg.cc/0jTsM1zb/Chat-GPT-Image-Mar-12-2026-03-01-43-PM.png",
    effectText: "🧬 +6 Max HP · ❤️ Heal 6.",
    apply: (player) => ({ ...player, maxHp: player.maxHp + 6, hp: Math.min(player.maxHp + 6, player.hp + 6) }),
  },
  {
    id: "war-paint",
    name: "War Paint",
    rarity: "gold",
    category: "charm",
    tags: ["attack"],
    image: "https://i.postimg.cc/T2WJnvSy/Chat-GPT-Image-Mar-12-2026-02-49-28-PM.png",
    effectText: "⚔️ Attack dice deal +1 damage.",
    apply: (player) => ({ ...player, attackBonus: player.attackBonus + 1 }),
  },
  {
    id: "sacred-moss",
    name: "Sacred Moss",
    rarity: "gold",
    category: "idol",
    tags: ["heal"],
    image: "https://i.postimg.cc/vTRq5Yt6/Chat-GPT-Image-Mar-12-2026-02-58-04-PM.png",
    effectText: "❤️ Heal dice restore +1 extra heal.",
    apply: (player) => ({ ...player, healBonus: player.healBonus + 1 }),
  },
  {
    id: "golden-bark",
    name: "Golden Bark",
    rarity: "gold",
    category: "totem",
    tags: ["shield"],
    image: "https://i.postimg.cc/prwZnRKp/Chat-GPT-Image-Mar-12-2026-03-09-00-PM.png",
    effectText: "🛡️ Start each combat with 4 shield.",
    apply: (player) => ({ ...player, combatStartShield: player.combatStartShield + 4 }),
  },
  {
    id: "cooldown-drum",
    name: "Cooldown Drum",
    rarity: "gold",
    category: "relic",
    tags: ["tempo"],
    image: "https://i.postimg.cc/fy6sDpt3/Chat-GPT-Image-Mar-12-2026-03-17-32-PM.png",
    effectText: "⏱️ Cooldowns tick +1 faster.",
    apply: (player) => ({ ...player, cooldownTick: player.cooldownTick + 1 }),
  },
  {
    id: "cursed-fang",
    name: "Cursed Fang",
    rarity: "gray",
    category: "fang",
    tags: ["attack", "curse"],
    image: "https://i.postimg.cc/MpxGd1Gc/Chat-GPT-Image-Mar-12-2026-03-04-39-PM.png",
    effectText: "⚔️ +2 attack damage · ☠️ lose 3 max HP.",
    apply: (player) => {
      const nextMaxHp = Math.max(8, player.maxHp - 3);
      return { ...player, attackBonus: player.attackBonus + 2, maxHp: nextMaxHp, hp: Math.min(nextMaxHp, player.hp) };
    },
  },
  {
    id: "rust-totem",
    name: "Rust Totem",
    rarity: "gray",
    category: "totem",
    tags: ["shield", "curse"],
    image: "https://i.postimg.cc/d1RHmMNs/Chat-GPT-Image-Mar-12-2026-03-05-52-PM.png",
    effectText: "🛡️ Start with 3 shield · ☠️ cooldown base +1.",
    apply: (player) => ({ ...player, combatStartShield: player.combatStartShield + 3, cooldownBase: player.cooldownBase + 1 }),
  },
  {
    id: "bleeding-charm",
    name: "Bleeding Charm",
    rarity: "gray",
    category: "charm",
    tags: ["attack", "curse"],
    image: "https://i.postimg.cc/HsyHBYRw/Chat-GPT-Image-Mar-12-2026-03-25-24-PM.png",
    effectText: "⚔️ Attack dice +1 value · ☠️ lose 1 HP at turn start.",
    apply: (player) => ({ ...player, attackDieValueBonus: player.attackDieValueBonus + 1, selfBleed: player.selfBleed + 1 }),
  },
  {
    id: "solana-crown",
    name: "Solana Crown",
    rarity: "chrome",
    category: "crown",
    tags: ["attack", "tempo"],
    image: "https://i.postimg.cc/fy6sDpt3/Chat-GPT-Image-Mar-12-2026-03-17-32-PM.png",
    effectText: "🔥 Top row multiplier +1.",
    apply: (player) => ({ ...player, topRowBonus: player.topRowBonus + 1 }),
  },
  {
    id: "genesis-dice",
    name: "Genesis Dice",
    rarity: "chrome",
    category: "relic",
    tags: ["tempo"],
    image: "https://i.postimg.cc/CKFghj12/Chat-GPT-Image-Mar-12-2026-03-01-26-PM.png",
    effectText: "🎲 Roll 4 dice each turn instead of 3.",
    apply: (player) => ({ ...player, dicePerTurn: Math.min(4, player.dicePerTurn + 1) }),
  },
  {
    id: "prism-totem",
    name: "Prism Totem",
    rarity: "chrome",
    category: "totem",
    tags: ["shield"],
    image: "https://i.postimg.cc/bJ5c9WTX/Chat-GPT-Image-Mar-12-2026-04-15-09-PM.png",
    effectText: "🛡️ All shield gained is doubled.",
    apply: (player) => ({ ...player, shieldMultiplier: player.shieldMultiplier * 2 }),
  },
  {
    id: "time-engine",
    name: "Time Engine",
    rarity: "chrome",
    category: "sigil",
    tags: ["tempo"],
    image: "https://i.postimg.cc/LsXbp0sn/Chat-GPT-Image-Mar-12-2026-02-59-23-PM.png",
    effectText: "♻️ Every 3 turns, reset all cooldowns.",
    apply: (player) => ({ ...player, timedResetEvery: 3 }),
  },
  {
    id: "kabal-sigil",
    name: "Kabal Sigil",
    rarity: "chrome",
    category: "sigil",
    tags: ["survival"],
    image: "https://i.postimg.cc/Dy4GtQFd/Chat-GPT-Image-Mar-12-2026-03-09-46-PM.png",
    effectText: "✨ Gain one revive per zone (revive at 40% HP).",
    apply: (player) => ({ ...player, reviveOnce: true }),
  },
  {
    id: "golden-coin",
    name: "Golden Coin",
    rarity: "gold",
    category: "coin",
    tags: ["survival", "tempo"],
    image: "https://i.postimg.cc/0jTsM1zb/Chat-GPT-Image-Mar-12-2026-03-01-43-PM.png",
    effectText: "🧬 +3 max HP · 🔁 +1 reroll per turn.",
    apply: (player) => ({ ...player, maxHp: player.maxHp + 3, hp: player.hp + 3, rerollsPerTurn: player.rerollsPerTurn + 1, rerollsLeft: player.rerollsLeft + 1 }),
  },
  {
    id: "frozen-trinket",
    name: "Frozen Trinket",
    rarity: "gray",
    category: "trinket",
    tags: ["shield", "tempo"],
    image: "https://i.postimg.cc/CKFghj12/Chat-GPT-Image-Mar-12-2026-03-01-26-PM.png",
    effectText: "🛡️ +2 combat start shield · ⏱️ cooldown tick +1.",
    apply: (player) => ({ ...player, combatStartShield: player.combatStartShield + 2, cooldownTick: player.cooldownTick + 1 }),
  },
  {
    id: "eye-bracelet",
    name: "Eye Bracelet",
    rarity: "gold",
    category: "bracelet",
    tags: ["heal", "tempo"],
    image: "https://i.postimg.cc/bJ5c9WTX/Chat-GPT-Image-Mar-12-2026-04-15-09-PM.png",
    effectText: "❤️ +2 heal bonus · 🔁 +1 reroll each turn.",
    apply: (player) => ({ ...player, healBonus: player.healBonus + 2, rerollsPerTurn: player.rerollsPerTurn + 1, rerollsLeft: player.rerollsLeft + 1 }),
  },

];

const KILL_WORDS = ["Slashed", "Crushed", "Berserk Mode", "Kabal Style", "Savage", "Annihilated"];
const ROUTE_TEMPLATE = ["mob", "elite", "mob", "elite", "boss"];

function emptyGrid() {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

function emptyCooldowns() {
  return [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
}

function cloneEnemy(enemy) {
  return {
    ...enemy,
    maxHp: enemy.hp,
    shield: 0,
    intentIndex: 0,
    charge: 0,
    modifier: "none",
    firstHitIgnored: false,
    firstIntentUsed: false,
    elite: false,
    eliteStars: 0,
  };
}

function randFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateRunSeed() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function pickUnique(items, count) {
  return shuffle(items).slice(0, count);
}

function getEliteStarCount(floor = 1) {
  return Math.min(3, Math.max(1, 1 + Math.floor((floor - 1) / 2)));
}

function getTierLabel(enemy) {
  if (enemy.tier === "boss") return "Boss";
  if (enemy.elite) return `Champion ${"⭐".repeat(enemy.eliteStars || 1)}`;
  if (enemy.tier === "medium") return "Champion";
  return "Mob";
}

function buildRoute(floor = 1) {
  const mobA = pickUnique(ENEMY_POOLS.mob, 2);
  const eliteA = pickUnique(ENEMY_POOLS.medium, 2);
  const bossA = pickUnique(ENEMY_POOLS.boss, 1);
  const enemyBuckets = {
    mob: mobA,
    elite: eliteA,
    boss: bossA,
  };
  const used = { mob: 0, elite: 0, boss: 0 };

  return ROUTE_TEMPLATE.map((type, index) => {
    const source = enemyBuckets[type][used[type]++];
    const base = cloneEnemy(source);
    // Non-linear scaling: fast ramp to floor 5, soft-cap after (reduces casual/hardcore gap)
    const rawFloor = floor - 1;
    const scale = Math.min(rawFloor, 4) * 0.8 + Math.max(0, rawFloor - 4) * 0.3;
    const hpScale = type === "boss" ? 8 : type === "elite" ? 5 : 3;
    const dmgScale = type === "boss" ? 2 : 1;
    base.hp += Math.round(scale * hpScale);
    base.maxHp = base.hp;
    base.damage += Math.round(scale * dmgScale);
    if (type === "elite") {
      base.elite = true;
      base.eliteStars = getEliteStarCount(floor);
      base.hp = Math.round(base.hp * (1.25 + (base.eliteStars - 1) * 0.1));
      base.maxHp = base.hp;
      base.damage += 2 + (base.eliteStars - 1);
      base.tier = "medium";
      base.name = `${"⭐".repeat(base.eliteStars)} ${base.name}`;
    }
    const mod = randFrom(source.modifierPool || ["none"]);
    base.modifier = mod || "none";
    if (base.modifier === "stoneSkin") base.firstHitIgnored = true;
    return base;
  });
}

function buildPathChoices(nextIndex, floor = 1) {
  const nextType = ROUTE_TEMPLATE[Math.max(0, Math.min(ROUTE_TEMPLATE.length - 1, nextIndex))] || "mob";
  const poolKey = nextType === "elite" ? "medium" : nextType;
  const picked = pickUnique(ENEMY_POOLS[poolKey] || ENEMY_POOLS.mob, 2);
  return picked.map((source) => {
    const base = cloneEnemy(source);
    const scale = floor - 1;
    const hpScale = nextType === "boss" ? 8 : nextType === "elite" ? 5 : 3;
    const dmgScale = nextType === "boss" ? 2 : 1;
    base.hp += scale * hpScale;
    base.maxHp = base.hp;
    base.damage += scale * dmgScale;
    if (nextType === "elite") {
      base.elite = true;
      base.eliteStars = getEliteStarCount(floor);
      base.hp = Math.round(base.hp * (1.25 + (base.eliteStars - 1) * 0.1));
      base.maxHp = base.hp;
      base.damage += 2 + (base.eliteStars - 1);
      base.tier = "medium";
      base.name = `${"⭐".repeat(base.eliteStars)} ${base.name}`;
    }
    const mod = randFrom(source.modifierPool || ["none"]);
    base.modifier = mod || "none";
    if (base.modifier === "stoneSkin") base.firstHitIgnored = true;
    return base;
  });
}

function buildMapChoices(nextIndex, floor = 1, poolsCfg?) {
  const lanes = shuffle(["left", "mid", "right"]);
  const nextType = ROUTE_TEMPLATE[Math.max(0, Math.min(ROUTE_TEMPLATE.length - 1, nextIndex))] || "mob";
  const poolKey = nextType === "elite" ? "medium" : nextType;
  let picked = pickUnique(ENEMY_POOLS[poolKey] || ENEMY_POOLS.mob, 3);
  if (picked.length < 3) {
    const fallback = shuffle(ENEMY_POOLS[poolKey] || ENEMY_POOLS.mob);
    while (picked.length < 3 && fallback.length) picked.push(fallback[picked.length % fallback.length]);
  }

  return picked.map((source, i) => {
    const enemy = cloneEnemy(source);
    const scale = floor - 1;
    const hpScale = nextType === "boss" ? 8 : nextType === "elite" ? 5 : 3;
    const dmgScale = nextType === "boss" ? 2 : 1;
    enemy.hp += scale * hpScale;
    enemy.maxHp = enemy.hp;
    enemy.damage += scale * dmgScale;
    if (nextType === "elite") {
      enemy.elite = true;
      enemy.eliteStars = getEliteStarCount(floor);
      enemy.hp = Math.round(enemy.hp * (1.25 + (enemy.eliteStars - 1) * 0.1));
      enemy.maxHp = enemy.hp;
      enemy.damage += 2 + (enemy.eliteStars - 1);
      enemy.tier = "medium";
      enemy.name = `${"⭐".repeat(enemy.eliteStars)} ${enemy.name}`;
    }
    const mod = randFrom(source.modifierPool || ["none"]);
    enemy.modifier = mod || "none";
    if (enemy.modifier === "stoneSkin") enemy.firstHitIgnored = true;

    const w = poolsCfg?.mapNodeWeights || { combat: 3, shop: 1, rest: 1, event: 1 };
    const nodeBag: string[] = [];
    Object.entries(w).forEach(([t, n]) => { for (let i = 0; i < (n as number); i++) nodeBag.push(t); });
    const nodeType = randFrom(nodeBag.length ? nodeBag : ["combat", "combat", "combat", "shop", "rest"]);
    const finalNodeType = nodeType;
    const hint = nodeType === "shop"
      ? "🏪 Shop stop"
      : nodeType === "rest"
        ? "🏕️ Rest stop"
        : finalNodeType === "event"
          ? "❓ Random event"
        : randFrom(["💰 Bonus score", "🛡️ Safer fight", "⚡ Fast route", "🎁 Better drop chance"]);
    return ({
      id: `${Date.now()}-${i}-${enemy.name}`,
      lane: lanes[i] || "mid",
      nodeType: finalNodeType,
      rewardHint: hint,
      enemy,
    });
  });
}

function buildShopInventory(poolsCfg?) {
  const enabledKeys = poolsCfg?.shopItemEnabled || {};
  // If no overrides exist, use full pool; otherwise filter to enabled items (undefined = enabled by default)
  const activePool = SHOP_ITEM_POOL.filter((item) => enabledKeys[item.key] !== false);
  const source = activePool.length >= 4 ? activePool : SHOP_ITEM_POOL;
  return pickUnique(source, 4).map((item, idx) => ({
    ...item,
    id: `${Date.now()}-${idx}-${item.key}`,
  }));
}

function pickArtifactByRarity(playerArtifacts, rarityList) {
  const owned = new Set((playerArtifacts || []).map((a) => a.id));
  const pool = ARTIFACT_POOL.filter((a) => rarityList.includes(a.rarity) && !owned.has(a.id));
  if (!pool.length) return null;
  return randFrom(pool);
}

function getDieMeta(die) {
  if (!die) return { kind: "attack", label: "Attack", emoji: "⚔️", desc: "" };
  if (die.kind === "shield") return { kind: "shield", label: "Shield", emoji: "🛡️", desc: `Gain ${die.value} shield before row multiplier.` };
  if (die.kind === "heal") return { kind: "heal", label: "Health", emoji: "❤️", desc: `Heal ${die.value} before row multiplier.` };
  return { kind: "attack", label: "Attack", emoji: "⚔️", desc: `Deal ${die.value} damage before row multiplier.` };
}

function getDieImage(die) {
  if (!die) return DICE_IMAGES[1];
  return DICE_IMAGES_BY_KIND[die.kind]?.[die.value] || DICE_IMAGES[die.value];
}

function cycleDieIndex(dice, startIndex, direction) {
  const available = dice.map((die, i) => (die !== null ? i : null)).filter((i) => i !== null);
  if (!available.length) return null;
  const current = startIndex !== null && available.includes(startIndex) ? startIndex : available[0];
  const pos = available.indexOf(current);
  const nextPos = (pos + direction + available.length) % available.length;
  return available[nextPos];
}

function dieStyleByKind(kind) {
  if (kind === "attack") return { shell: "from-zinc-900/90 to-black/95 border-zinc-200/30", tag: "bg-zinc-950/80 text-zinc-100" };
  if (kind === "heal") return { shell: "from-pink-300/25 to-rose-500/35 border-pink-200/40", tag: "bg-pink-500/35 text-pink-100" };
  return { shell: "from-zinc-100/30 to-white/35 border-white/60", tag: "bg-white/35 text-white" };
}

function rollDice(count, specialFacesEnabled = false, attackDieBonus = 0) {
  return Array.from({ length: count }, (_, i) => {
    const kind = DIE_KIND_ORDER[i % DIE_KIND_ORDER.length];
    const value = Math.floor(Math.random() * 6) + 1;
    let special = null;
    if (specialFacesEnabled) {
      // Face 1 attack = curse enemy (disables their next regen/charge)
      if (kind === 'attack' && value === 1) special = 'curse';
      // Face 6 attack = pierce (bypasses enemy shield)
      else if (kind === 'attack' && value === 6) special = 'pierce';
      // Face 6 heal = nurture (also grants shield equal to half heal)
      else if (kind === 'heal' && value === 6) special = 'nurture';
      // Face 6 shield = fortress (persists next turn)
      else if (kind === 'shield' && value === 6) special = 'fortress';
    }
    // Gecko companion: +attackDieBonus to attack dice (min 1 to preserve curse on 1)
    const finalValue = kind === 'attack' && attackDieBonus > 0
      ? Math.min(6, Math.max(1, value + attackDieBonus))
      : value;
    return {
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      value: finalValue,
      special,
    };
  });
}

function nextAvailableDieIndex(dice) {
  const i = dice.findIndex((d) => d !== null);
  return i === -1 ? null : i;
}

function boardIsSaturated(grid, cooldowns) {
  return grid.every((row, y) => row.every((cell, x) => cell !== null || cooldowns[y][x] > 0));
}

function tickCooldowns(cooldowns, step) {
  return cooldowns.map((row) => row.map((value) => Math.max(0, value - step)));
}

function rowMultiplier(player, rowIndex) {
  return ROW_INFO[rowIndex].mult + (rowIndex === 0 ? player.topRowBonus : 0);
}

function pickKillWord(streak) {
  if (streak >= 3) return "Kabal Style";
  return randFrom(KILL_WORDS);
}

function getNoHitMultiplier(noHitTurns) {
  if (noHitTurns >= 6) return 2;
  if (noHitTurns >= 3) return 1.5;
  return 1;
}

function getStoryFragment(fragmentIndex, characterId) {
  const isKKM = characterId === "kkm";
  const kabalian = [
    {
      title: "Kabalian Chronicle — Fragment I · The Falling Light",
      lines: [
        "The sky did not crack by chance.",
        "A light fell into the jungle and the earth awakened.",
        "That light was the first fragment of Ka.",
      ],
    },
    {
      title: "Kabalian Chronicle — Fragment II · The First Oath",
      lines: [
        "Many came seeking gold.",
        "Only a few understood the danger.",
        "Those few became the first Kabalians.",
      ],
    },
    {
      title: "Kabalian Chronicle — Fragment III · The Price of Power",
      lines: [
        "The Ka does not give power freely.",
        "Every fragment sharpens the spirit…",
        "or breaks it.",
      ],
    },
    {
      title: "Kabalian Chronicle — Fragment IV · The Watching Jungle",
      lines: [
        "The jungle is not silent.",
        "It watches those who touch the Ka.",
        "And it remembers every choice.",
      ],
    },
    {
      title: "Kabalian Chronicle — Fragment V · The Hidden Truth",
      lines: [
        "The Ka does not choose the cautious.",
        "It reveals itself only to those who risk everything.",
        "That is the law of the Kabal.",
      ],
    },
    {
      title: "Kabalian Chronicle — Fragment VI · The Final Warning",
      lines: [
        "If one soul gathers every fragment…",
        "the jungle itself will bow.",
        "Or burn.",
      ],
    },
  ];

  const kkm = [
    {
      title: "KKM Chronicle — Fragment I · The Crash",
      lines: [
        "Kabalian says the sky broke.",
        "My logs say something crashed.",
        "Either way, the jungle went crazy after that.",
      ],
    },
    {
      title: "KKM Chronicle — Fragment II · The First Traders",
      lines: [
        "People didn’t come for wisdom.",
        "They came for power.",
        "Same story every cycle.",
      ],
    },
    {
      title: "KKM Chronicle — Fragment III · The Ka Problem",
      lines: [
        "Kabalian calls the Ka sacred.",
        "I call it unstable energy.",
        "Still… it works.",
      ],
    },
    {
      title: "KKM Chronicle — Fragment IV · Jungle Logic",
      lines: [
        "The jungle doesn’t care about your plans.",
        "It only reacts to your mistakes.",
        "I like this place.",
      ],
    },
    {
      title: "KKM Chronicle — Fragment V · The Real Rule",
      lines: [
        "Kabalian says courage reveals the Ka.",
        "From my calculations…",
        "it’s mostly bad decisions.",
      ],
    },
    {
      title: "KKM Chronicle — Fragment VI · The Endgame",
      lines: [
        "If someone collects every fragment…",
        "the jungle will change forever.",
        "I’m curious to see what breaks first.",
      ],
    },
  ];

  const fragments = isKKM ? kkm : kabalian;
  return fragments[Math.abs(fragmentIndex) % fragments.length];
}

function buildArtifactChoices(player, poolsCfg?) {
  const weights = poolsCfg?.artifactWeights || { gray: 4, gold: 3, chrome: 1 };
  const pool = shuffle(ARTIFACT_POOL).filter((a) => !player.artifacts.find((owned) => owned.id === a.id));
  const chosen = [];
  const rarities = [];

  while (rarities.length < 3) {
    const bag = [];
    Object.entries(weights).forEach(([rarity, amount]) => {
      for (let i = 0; i < amount; i += 1) bag.push(rarity);
    });
    rarities.push(randFrom(bag));
  }

  rarities.forEach((rarity) => {
    const found = pool.find((a) => a.rarity === rarity && !chosen.find((c) => c.id === a.id));
    if (found) chosen.push(found);
  });

  while (chosen.length < 3) {
    const fill = pool.find((a) => !chosen.find((c) => c.id === a.id));
    if (!fill) break;
    chosen.push(fill);
  }

  return chosen.slice(0, 3);
}

function buildStarterArtifactChoices(player, poolsCfg?) {
  const starterWeights = poolsCfg?.starterWeights || { gray: 6, gold: 3, chrome: 1 };
  const pool = shuffle(ARTIFACT_POOL).filter((a) => !player.artifacts.find((owned) => owned.id === a.id));
  const chosen = [];
  const rarities = [];

  while (rarities.length < 3) {
    const bag = [];
    Object.entries(starterWeights).forEach(([rarity, amount]) => {
      for (let i = 0; i < amount; i += 1) bag.push(rarity);
    });
    rarities.push(randFrom(bag));
  }

  rarities.forEach((rarity) => {
    const found = pool.find((a) => a.rarity === rarity && !chosen.find((c) => c.id === a.id));
    if (found) chosen.push(found);
  });

  while (chosen.length < 3) {
    const fill = pool.find((a) => !chosen.find((c) => c.id === a.id));
    if (!fill) break;
    chosen.push(fill);
  }

  return chosen.slice(0, 3);
}

function rarityClasses(rarity) {
  if (rarity === "chrome") return "border-cyan-300/50 bg-cyan-300/10 text-cyan-200";
  if (rarity === "gold") return "border-amber-300/50 bg-amber-300/10 text-amber-200";
  return "border-zinc-300/30 bg-zinc-200/5 text-zinc-200";
}

function getIntentPreview(enemy) {
  const baseIntent = enemy.intents[enemy.intentIndex % enemy.intents.length];
  const mod = MODIFIERS[enemy.modifier] || MODIFIERS.none;
  let value = baseIntent.value + enemy.charge;
  if (!enemy.firstIntentUsed && enemy.modifier === "swift") value += 2;
  if (baseIntent.type === "attack" && enemy.modifier === "berserk") value += 2;
  return { ...baseIntent, value, mod };
}

function intentMeta(type) {
  if (type === "attack") return { emoji: "⚔️", color: "text-rose-300" };
  if (type === "charge") return { emoji: "⚡", color: "text-amber-300" };
  if (type === "heal") return { emoji: "❤️", color: "text-emerald-300" };
  if (type === "shield") return { emoji: "🛡️", color: "text-cyan-300" };
  if (type === "rage") return { emoji: "🔥", color: "text-orange-300" };
  if (type === "curse") return { emoji: "☠️", color: "text-violet-300" };
  return { emoji: "🔥", color: "text-orange-300" };
}

function modifierClass(modifier) {
  if (modifier === "berserk") return "text-rose-300";
  if (modifier === "stoneSkin") return "text-zinc-200";
  if (modifier === "thorns") return "text-lime-300";
  if (modifier === "swift") return "text-amber-300";
  if (modifier === "venom") return "text-violet-300";
  if (modifier === "regen") return "text-emerald-300";
  return "text-zinc-200";
}

function getIntentTimeline(enemy, count = 3) {
  const timeline = [];
  for (let step = 0; step < count; step += 1) {
    const simulated = { ...enemy, intentIndex: enemy.intentIndex + step, charge: step > 0 ? 0 : enemy.charge };
    timeline.push(getIntentPreview(simulated));
  }
  return timeline;
}

function resolveEnemyIntent(enemy, player, log, state?: any) {
  if (state && state.kaFortressActive) {
    log.unshift('🛡️ Ka Fortress — enemy intent skipped!');
    state.kaFortressActive = false;
    return { enemy: { ...enemy }, player: { ...player }, log: log || [] };
  }
  const preview = getIntentPreview(enemy);
  const nextEnemy = { ...enemy, intentIndex: enemy.intentIndex + 1, firstIntentUsed: true };
  const nextPlayer = { ...player };

  if (preview.type === "charge") {
    nextEnemy.charge += preview.value;
    log.unshift(`${enemy.emoji} ${enemy.name} is charging +${preview.value}`);
  }

  if (preview.type === "shield") {
    nextEnemy.shield += preview.value;
    log.unshift(`${enemy.emoji} ${enemy.name} gains ${preview.value} shield`);
  }

  if (preview.type === "heal") {
    nextEnemy.hp = Math.min(nextEnemy.maxHp, nextEnemy.hp + preview.value);
    log.unshift(`${enemy.emoji} ${enemy.name} heals ${preview.value}`);
  }

  if (preview.type === "curse") {
    nextPlayer.curseNextTurn = nextPlayer.curseNextTurn + preview.value;
    log.unshift(`${enemy.emoji} ${enemy.name} curses you: next turn reroll disabled`);
  }

  if (preview.type === "attack") {
    let damage = preview.value;
    const blocked = Math.min(nextPlayer.shield, damage);
    nextPlayer.shield -= blocked;
    damage -= blocked;
    if (damage > 0) {
      nextPlayer.hp -= damage;
      if (enemy.modifier === "venom") {
        nextPlayer.hp -= 1;
        log.unshift(`☠️ Venom deals +1 HP loss`);
      }
    }
    nextEnemy.charge = 0;
    log.unshift(`${enemy.emoji} ${enemy.name} attacks for ${preview.value}`);
  }

  if (enemy.modifier === "regen") {
    nextEnemy.hp = Math.min(nextEnemy.maxHp, nextEnemy.hp + 2);
    log.unshift(`🌿 ${enemy.name} regenerates 2`);
  }

  return { enemy: nextEnemy, player: nextPlayer };
}

function resolvePlayerGrid(state) {
  const player = { ...state.player };
  const enemy = { ...state.enemy };
  let totalAttack = 0;
  let totalShield = 0;
  let totalHeal = 0;
  let pierceAttack = 0;  // Pierce dice bypass shield
  let fortressActive = false;  // Shield persists next turn
  let hasCurse = false;  // Curse face 1: enemy loses their next regen/charge
  const rowBreakdown = [];

  // Count dice per type across entire grid (for SURGE)
  const allDice = state.grid.flat().filter(Boolean);
  const atkCount = allDice.filter(d => getDieMeta(d).kind === 'attack').length;
  const healCount = allDice.filter(d => getDieMeta(d).kind === 'heal').length;
  const shieldCount = allDice.filter(d => getDieMeta(d).kind === 'shield').length;

  state.grid.forEach((row, rowIndex) => {
    let rowAttack = 0;
    let rowShield = 0;
    let rowHeal = 0;
    const mult = rowMultiplier(player, rowIndex);

    // Mid row: count dice per type for combo bonus (+5 if 2 same type)
    const midRowKinds = rowIndex === 1
      ? { attack: row.filter(d => d && getDieMeta(d).kind === 'attack').length,
          heal:   row.filter(d => d && getDieMeta(d).kind === 'heal').length,
          shield: row.filter(d => d && getDieMeta(d).kind === 'shield').length }
      : null;

    row.forEach((die) => {
      if (die === null) return;
      const meta = getDieMeta(die);
      if (meta.kind === "shield") {
        if (die.special === 'fortress') fortressActive = true;
        rowShield += die.value * mult;
      } else if (meta.kind === "heal") {
        const healAmt = (die.value + player.healBonus) * mult;
        rowHeal += healAmt;
        // Nurture (face 6 heal): also grants +shield equal to half heal
        if (die.special === 'nurture') {
          rowShield += Math.round(healAmt * 0.5);
          rowBreakdown.push(`☀️ Nurture: heal also grants +${Math.round(healAmt * 0.5)} shield`);
        }
      } else {
        const attackValue = (die.value + player.attackDieValueBonus + player.attackBonus) * mult;
        if (die.special === 'pierce') {
          // Face 6: Pierce bypasses enemy shield — tracked separately
          pierceAttack += attackValue;
          rowBreakdown.push(`🔱 Pierce (face 6): ${attackValue} dmg ignores shield`);
        } else if (die.special === 'curse') {
          // Face 1: Curse — still deals damage but also curses enemy (resets charge, disables regen)
          rowAttack += attackValue;
          hasCurse = true;
          rowBreakdown.push(`☠️ Curse (face 1): ${attackValue} dmg + enemy charge reset`);
        } else {
          rowAttack += attackValue;
        }
      }
    });

    // Apply dynamic lane bonuses
    const dynLane = state.laneBonuses?.[rowIndex];
    const hasAnyDieInRow = row.some(Boolean);
    if (dynLane && hasAnyDieInRow) {
      if (dynLane.stat === 'attack') rowAttack += dynLane.value;
      else if (dynLane.stat === 'shield') rowShield += dynLane.value;
      else if (dynLane.stat === 'heal') rowHeal += dynLane.value;
      else if (dynLane.stat === 'coins') player.coins = (player.coins || 0) + dynLane.value;
      else if (dynLane.stat === 'ka_fragment') {
        player.kaFragments = Math.min(4, (player.kaFragments || 0) + dynLane.value);
        player.kaCharged = player.kaFragments >= 4;
      }
    } else if (!dynLane) {
      // Fallback to static lane bonuses
      if (rowAttack > 0) rowAttack += ROW_INFO[rowIndex].laneBonus.attack;
      if (rowShield > 0) rowShield += ROW_INFO[rowIndex].laneBonus.shield;
      if (rowHeal > 0) rowHeal += ROW_INFO[rowIndex].laneBonus.heal;
    }

    // Mid row combo: 2+ of same type → +5 bonus
    if (midRowKinds) {
      if (midRowKinds.attack >= 2) { rowAttack += 5; rowBreakdown.push('✨ Mid combo: 2 attack → +5 dmg'); }
      if (midRowKinds.heal >= 2) { rowHeal += 5; rowBreakdown.push('✨ Mid combo: 2 heal → +5 HP'); }
      if (midRowKinds.shield >= 2) { rowShield += 5; rowBreakdown.push('✨ Mid combo: 2 shield → +5 shield'); }
    }

    totalAttack += rowAttack;
    totalShield += rowShield;
    totalHeal += rowHeal;
    rowBreakdown.push(`${ROW_INFO[rowIndex].emoji} x${mult}: ⚔️ ${rowAttack} · 🛡️ ${rowShield} · ❤️ ${rowHeal}`);
  });

  totalShield *= player.shieldMultiplier;

  // SURGE: 3 dice of same type in one turn → big bonus
  if (atkCount >= 3) {
    totalAttack += 10;
    rowBreakdown.unshift(`⚡ SURGE Attack! +10 damage`);
  } else if (healCount >= 3) {
    totalHeal += 8;
    rowBreakdown.unshift(`⚡ SURGE Heal! +8 HP`);
  } else if (shieldCount >= 3) {
    totalShield += 8;
    rowBreakdown.unshift(`⚡ SURGE Shield! +8 shield`);
  }

  // Apply pierce damage first (bypasses shield)
  if (pierceAttack > 0) {
    enemy.hp -= pierceAttack;
    rowBreakdown.unshift(`⚡ Pierce: ${pierceAttack} dmg bypassed shield`);
  }

  if (enemy.firstHitIgnored && totalAttack > 0) {
    enemy.firstHitIgnored = false;
    totalAttack = 0;
    rowBreakdown.unshift(`🪨 Stone Skin ignored the first hit`);
  }

  // Ka Rage: bypass enemy shield entirely
  if (state.kaRageActive) {
    if (enemy.shield > 0) {
      rowBreakdown.unshift(`⚡ Ka Rage — pierced through enemy shield!`);
    }
    enemy.shield = 0;
  } else if (enemy.shield > 0 && totalAttack > 0) {
    const blocked = Math.min(enemy.shield, totalAttack);
    enemy.shield -= blocked;
    totalAttack -= blocked;
    rowBreakdown.unshift(`🛡️ Enemy shield blocked ${blocked}`);
  }

  if (enemy.modifier === "thorns" && (totalAttack + pierceAttack) > 0) {
    player.hp -= 1;
    rowBreakdown.unshift(`🌵 Thorns recoil: lose 1 HP`);
  }

  enemy.hp -= totalAttack;
  player.shield += totalShield;
  player.hp = Math.min(player.maxHp, player.hp + totalHeal);

  // Fortress: mark shield for persistence
  if (fortressActive) {
    player._fortressShield = (player._fortressShield || 0) + Math.round(totalShield);
  }

  const overkillBreak = (totalAttack + pierceAttack) >= 15;
  if (overkillBreak && enemy.hp > 0) {
    enemy.charge = 0;
    rowBreakdown.unshift(`💥 Overkill broke enemy charge`);
  }

  return {
    player,
    enemy,
    totals: {
      attack: Math.max(0, totalAttack + pierceAttack),
      shield: Math.max(0, totalShield),
      heal: Math.max(0, totalHeal),
    },
    log: [
      ...rowBreakdown,
      `⚔️ Total Attack ${Math.max(0, totalAttack + pierceAttack)}`,
      `🛡️ Total Shield +${Math.max(0, totalShield)}`,
      `❤️ Total Heal +${Math.max(0, totalHeal)}`,
    ],
    topRowHasHeal: state.grid[0].some(d => d && getDieMeta(d).kind === 'heal'),
    botRowDiceCount: state.grid[2].filter(Boolean).length,
    surgeType: atkCount >= 3 ? 'attack' : healCount >= 3 ? 'heal' : shieldCount >= 3 ? 'shield' : null,
  };
}

function estimatePlayerOutcome(grid, player) {
  let totalAttack = 0;
  let totalShield = 0;
  let totalHeal = 0;
  let attackDiceCount = 0;

  grid.forEach((row, rowIndex) => {
    let rowAttack = 0;
    let rowShield = 0;
    let rowHeal = 0;
    const mult = rowMultiplier(player, rowIndex);
    row.forEach((die) => {
      if (!die) return;
      const meta = getDieMeta(die);
      if (meta.kind === "shield") rowShield += die.value * mult;
      else if (meta.kind === "heal") rowHeal += (die.value + player.healBonus) * mult;
      else {
        rowAttack += (die.value + player.attackDieValueBonus + player.attackBonus) * mult;
        attackDiceCount += 1;
      }
    });

    if (rowAttack > 0) rowAttack += ROW_INFO[rowIndex].laneBonus.attack;
    if (rowShield > 0) rowShield += ROW_INFO[rowIndex].laneBonus.shield;
    if (rowHeal > 0) rowHeal += ROW_INFO[rowIndex].laneBonus.heal;

    totalAttack += rowAttack;
    totalShield += rowShield;
    totalHeal += rowHeal;
  });

  if (attackDiceCount >= 3) totalAttack += 5;
  totalShield *= player.shieldMultiplier;

  return { attack: Math.max(0, totalAttack), shield: Math.max(0, totalShield), heal: Math.max(0, totalHeal) };
}

function applyArtifactToPlayer(player, artifact) {
  const nextBase = artifact.apply(player);
  return {
    ...nextBase,
    artifacts: [...player.artifacts, artifact],
  };
}

function makeInitialPlayer(characterId = "kabalian") {
  const selected = PLAYER_CHARACTERS[characterId] || PLAYER_CHARACTERS.kabalian;
  return {
    hp: selected.stats.maxHp,
    maxHp: selected.stats.maxHp,
    shield: 0,
    avatar: selected.avatar,
    characterId: selected.id,
    cooldownBase: selected.stats.cooldownBase ?? 3,
    cooldownTick: 1,
    dicePerTurn: 3,
    rerollsPerTurn: selected.stats.rerollsPerTurn,
    rerollsLeft: selected.stats.rerollsPerTurn,
    attackBonus: selected.stats.attackBonus,
    attackDieValueBonus: 0,
    healBonus: 0,
    shieldMultiplier: 1,
    topRowBonus: 0,
    timedResetEvery: 0,
    combatStartShield: selected.stats.combatStartShield || 0,
    selfBleed: 0,
    curseNextTurn: 0,
    artifacts: [],
    reviveOnce: false,
    companionId: null,
    companionCooldown: 0,
  };
}

function makeInitialState() {
  const floor = 1;
  const route = buildRoute(floor);
  const player = makeInitialPlayer();
  player.shield = player.combatStartShield;
  const runSeed = generateRunSeed();
  return {
    floor,
    room: 0,
    phase: "reward",
    route,
    enemy: { ...route[0] },
    dice: [],
    grid: emptyGrid(),
    cooldowns: emptyCooldowns(),
    selectedDieIndex: null,
    player,
    winStreak: 0,
    turn: 0,
    log: ["Click ROLL to start."],
    killPopup: null,
    showHowToPlay: false,
    showAllLogs: false,
    rolling: false,
    artifactsOffered: [],
    combatRewardPending: false,
    startRewardPending: true,
    characterSelectPending: true,
    score: 0,
    noHitTurns: 0,
    runSeed,
    runEnded: false,
    avatarMood: "focus",
    actionFlash: null,
    enemyAttackPulse: 0,
    enemyHitPulse: 0,
    damagePopups: [],
    scorePopups: [],
    comboPopup: null,
    lastOutcome: null,
    // Map system
    mapLayers: null as MapLayer[] | null,
    currentMapNodeId: null as string | null,
    pendingEvent: null as MapEvent | null,
    shopInventory: null as ShopItem[] | null,
    // Saturation warning (shown when board will be full next turn)
    boardWillSaturateWarning: false,
    // Track last floor where a boss was killed (for meta progression)
    lastBossFloor: null as number | null,
    // Current biome (changes after each boss kill)
    currentBiome: 'jungle' as BiomeId,
    // Ka Power runtime flags
    kaRageActive: false,
    kaFortressActive: false,
    kaStompActive: false,
    // Kill reward system
    killRewardPending: false,
    killRewardsOffered: [] as KillReward[],
    killRewardsPicked: [] as string[],
    killRewardPicksAllowed: 0,
    killRewardMustPick: true,
    // Dynamic lanes
    laneBonuses: rollLaneBonuses() as [LaneBonus, LaneBonus, LaneBonus],
  };
}

function serializeGameState(game) {
  return {
    ...game,
    player: {
      ...game.player,
      artifacts: game.player.artifacts.map((artifact) => artifact.id),
    },
    artifactsOffered: game.artifactsOffered.map((artifact) => artifact.id),
  };
}

function hydrateGameState(rawState) {
  if (!rawState || typeof rawState !== "object") return null;
  const safe = { ...rawState };
  const byId = new Map(ARTIFACT_POOL.map((artifact) => [artifact.id, artifact]));
  safe.player = {
    ...safe.player,
    characterId: safe.player?.characterId || "kabalian",
    avatar: safe.player?.avatar || PLAYER_CHARACTERS.kabalian.avatar,
    artifacts: (safe.player?.artifacts || []).map((id) => byId.get(id)).filter(Boolean),
  };
  safe.artifactsOffered = (safe.artifactsOffered || []).map((id) => byId.get(id)).filter(Boolean);
  safe.enemyAttackPulse = 0;
  safe.enemyHitPulse = 0;
  safe.damagePopups = [];
  safe.scorePopups = [];
  safe.comboPopup = null;
  safe.actionFlash = null;
  safe.killPopup = null;
  safe.lastOutcome = null;
  safe.noHitTurns = Number.isFinite(safe.noHitTurns) ? safe.noHitTurns : 0;
  safe.runSeed = safe.runSeed || generateRunSeed();
  safe.characterSelectPending = Boolean(safe.characterSelectPending);
  safe.mapLayers = safe.mapLayers ?? null;
  safe.currentMapNodeId = safe.currentMapNodeId ?? null;
  safe.pendingEvent = safe.pendingEvent ?? null;
  safe.shopInventory = safe.shopInventory ?? null;
  safe.currentBiome = safe.currentBiome ?? 'jungle';
  safe.lastBossFloor = safe.lastBossFloor ?? null;
  if (!safe.player.coins) safe.player.coins = 0;
  if (safe.player.companion === undefined) safe.player.companion = null;
  if (!safe.player._fortressShield) safe.player._fortressShield = 0;
  if (!safe.player.companionHypnosisActive) safe.player.companionHypnosisActive = false;
  if (!safe.player.weaponSlots) safe.player.weaponSlots = [null, null];
  // Ka Power hydration
  safe.player.kaFragments = safe.player.kaFragments ?? 0;
  safe.player.kaCharged = safe.player.kaCharged ?? false;
  safe.player.kaPower = KA_POWERS[safe.player.characterId] || KA_POWERS.kabalian;
  safe.player.bonusDiceNextCombat = safe.player.bonusDiceNextCombat ?? 0;
  safe.player.critChance = safe.player.critChance ?? 0;
  safe.kaRageActive = false; // always reset runtime flags
  safe.kaFortressActive = false;
  safe.kaStompActive = false;
  // Kill reward hydration
  safe.killRewardPending = safe.killRewardPending || false;
  safe.killRewardsOffered = safe.killRewardsOffered || [];
  safe.killRewardsPicked = safe.killRewardsPicked || [];
  safe.killRewardPicksAllowed = safe.killRewardPicksAllowed || 0;
  safe.killRewardMustPick = safe.killRewardMustPick ?? true;
  // Dynamic lanes hydration
  safe.laneBonuses = safe.laneBonuses || rollLaneBonuses();
  return safe;
}

function loadSavedGameState() {
  try {
    const raw = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (!raw) return makeInitialState();
    const parsed = JSON.parse(raw);
    return hydrateGameState(parsed) || makeInitialState();
  } catch {
    return makeInitialState();
  }
}

function SectionCard({ title, children, right, className = "" }) {
  return (
    <div className={`rounded-[20px] border border-white/15 bg-black/45 p-1.5 shadow-[0_14px_30px_rgba(0,0,0,0.28)] backdrop-blur-md md:p-2.5 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-serif text-[11px] italic uppercase tracking-[0.22em] text-amber-300">{title}</div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

function CompactStat({ label, value, accent = "text-white" }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-black/35 p-2 text-center">
      <div className="text-[9px] uppercase tracking-[0.16em] text-zinc-300">{label}</div>
      <div className={`mt-1 text-sm font-black md:text-base ${accent}`}>{value}</div>
    </div>
  );
}

function LifeBar({ label, current, max, tone, size = "md" }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const fill = tone === "enemy" ? "from-red-500 via-orange-400 to-yellow-300" : "from-emerald-500 via-lime-400 to-cyan-300";
  const heightClass = size === "lg" ? "h-5" : "h-3.5";

  return (
    <div className="rounded-[16px] border border-white/10 bg-black/35 p-2">
      <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-zinc-300">
        <span>{label}</span>
        <span>{Math.max(0, current)}/{max}</span>
      </div>
      <div className={`${heightClass} overflow-hidden rounded-full border border-white/10 bg-zinc-900 shadow-inner`}>
        <div className={`h-full rounded-full bg-gradient-to-r ${fill} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ActionBtn({ imgSrc, label, onClick, disabled = false, pulse = false, className = "", imgClassName = "" }: {
  imgSrc?: string; label: string; onClick?: () => void; disabled?: boolean; pulse?: boolean; className?: string; imgClassName?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative transition-all select-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={label} className={`h-12 w-auto max-w-[140px] object-contain drop-shadow-lg ${imgClassName}`} />
      ) : (
        <span className="inline-block rounded-2xl px-4 py-2.5 text-sm font-black">{label}</span>
      )}
    </button>
  );
}

function DiceFace({ value, selected = false, rolling = false, onClick, disabled = false }) {
  const meta = getDieMeta(value);
  const palette = dieStyleByKind(meta.kind);
  const isGolden = value?.isKabalDie === true;
  return (
    <motion.button
      whileHover={onClick && !disabled ? { y: -2 } : {}}
      whileTap={onClick && !disabled ? { scale: 0.97 } : {}}
      animate={rolling ? { rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.06, 0.98, 1.04, 1] } : isGolden ? { scale: [1, 1.04, 1], opacity: [1, 0.9, 1] } : { rotate: 0, scale: selected ? 1.05 : 1 }}
      transition={{ duration: rolling ? 0.7 : isGolden ? 1.4 : 0.18, repeat: isGolden && !rolling ? Infinity : 0 }}
      onClick={disabled ? undefined : onClick}
      className={`relative h-16 w-16 overflow-hidden rounded-[18px] border bg-gradient-to-br md:h-[74px] md:w-[74px]
        ${isGolden
          ? "border-amber-300 bg-gradient-to-br from-amber-900/80 to-yellow-800/90 shadow-[0_0_12px_3px_rgba(252,211,77,0.45)]"
          : palette.shell}
        ${selected ? "border-amber-300 shadow-[0_0_0_3px_rgba(252,211,77,0.25)]" : ""}
        ${disabled ? "opacity-60" : ""}`}
    >
      {isGolden && (
        <div className="absolute inset-0 rounded-[17px] pointer-events-none border-2 border-amber-300/60 z-10" />
      )}
      <img src={getDieImage(value)} alt={`${meta.label} die ${value.value}`} className={`absolute inset-0 h-full w-full object-contain p-1 ${isGolden ? "drop-shadow-[0_0_6px_rgba(252,211,77,0.8)]" : ""}`} />
      <div className={`absolute bottom-0.5 left-0.5 right-0.5 flex items-center justify-center gap-1 rounded-lg px-1 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${isGolden ? "bg-amber-500/60 text-amber-100" : palette.tag}`}>
        {isGolden ? <span>✨</span> : <span>{meta.emoji}</span>}
        <span>{isGolden ? "GOLD" : meta.kind}</span>
      </div>
      {selected ? <div className="absolute -right-1 -top-1 rounded-full bg-amber-300 px-1.5 py-0.5 text-[9px] font-black text-black">NEXT</div> : null}
    </motion.button>
  );
}

function RouteCard({ enemy, state }) {
  const classes = state === "done"
    ? "border-emerald-400/40 bg-emerald-500/10"
    : state === "current"
      ? "border-amber-300/50 bg-amber-300/10"
      : "border-white/10 bg-black/30";
  return (
    <div className={`relative rounded-[12px] border p-1.5 text-center ${classes}`}>
      <div className={`${state === "hidden" ? "blur-[4px] grayscale opacity-60" : ""}`}>
        <img src={enemy.image} alt={enemy.name} className="mx-auto h-9 w-full object-contain" />
      </div>
      {enemy.elite && state !== "hidden" ? <div className="absolute left-1 top-1 text-[9px] text-red-300">ELITE {"⭐".repeat(enemy.eliteStars || 1)}</div> : null}
      {enemy.tier === "boss" && state !== "hidden" ? <div className="absolute left-1 top-1 text-[9px] text-cyan-300">BOSS</div> : null}
      {state === "hidden" ? <div className="absolute inset-0 flex items-center justify-center text-lg">❓</div> : null}
      {state === "done" ? <div className="absolute right-1 top-1 text-[10px]">✅</div> : null}
    </div>
  );
}

function ArtifactCard({ artifact, onPick }) {
  return (
    <button onClick={() => onPick(artifact)} className={`rounded-[20px] border p-3 text-left transition hover:-translate-y-0.5 ${rarityClasses(artifact.rarity)}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] opacity-80">{artifact.rarity} {artifact.category}</div>
          <div className="text-sm font-black md:text-base">{artifact.name}</div>
        </div>
        {artifact.image ? <img src={artifact.image} alt={artifact.name} className="h-10 w-10 rounded-lg border border-white/20 bg-black/40 object-cover" /> : null}
      </div>
      <div className="mb-2 flex flex-wrap gap-1">
        {artifact.tags.map((tag) => (
          <div key={`${artifact.id}-${tag}`} className="rounded-full border border-current/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]">
            {(TAG_EMOJIS[tag] || "✨")} {tag}
          </div>
        ))}
      </div>
      <div className="text-xs md:text-sm">{artifact.effectText}</div>
    </button>
  );
}

// Haptic feedback helper (Telegram WebApp)
function haptic(type: 'impact' | 'notification' | 'selection', style?: string) {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.HapticFeedback) return;
    if (type === 'impact') tg.HapticFeedback.impactOccurred(style || 'medium');
    else if (type === 'notification') tg.HapticFeedback.notificationOccurred(style || 'success');
    else tg.HapticFeedback.selectionChanged();
  } catch {}
}

export default function DieInTheJungleUpgraded({ onRunEnded, onBeforeRestart }: DieInTheJungleProps = {}) {
  const [game, setGame] = useState(loadSavedGameState);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  // Loadout state (used during character selection)
  const [pendingCharId, setPendingCharId] = useState(null);
  const [loadout, setLoadout] = useState({ weapon1: null, weapon2: null, companion: null, relic1: null });
  const [wRarityFilter, setWRarityFilter] = useState("All");
  const [wTypeFilter, setWTypeFilter] = useState("All");
  const [loadoutWeaponSlot, setLoadoutWeaponSlot] = useState(1); // which weapon slot is being filled
  const [remoteAdminConfig, setRemoteAdminConfig] = useState(DEFAULT_REMOTE_ADMIN_CONFIG);
  const [turnTimer, setTurnTimer] = useState(0); // countdown seconds remaining
  const turnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ownedCosmetics, setOwnedCosmetics] = useState([]);
  const [cosmeticsLoading, setCosmeticsLoading] = useState(false);
  const [selectedCosmeticId, setSelectedCosmeticId] = useState(() => (typeof window === "undefined" ? "" : localStorage.getItem(SELECTED_COSMETIC_STORAGE_KEY) || ""));

  const tgUserId = useMemo(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    return url.searchParams.get("tgUserId") || "";
  }, []);


  const selectedCosmetic = useMemo(() => ownedCosmetics.find((entry) => entry.productId === selectedCosmeticId) || null, [ownedCosmetics, selectedCosmeticId]);

  function equipCosmetic(productId) {
    setSelectedCosmeticId(productId);
    localStorage.setItem(SELECTED_COSMETIC_STORAGE_KEY, productId);
    setGame((g) => ({ ...g, actionFlash: { id: Date.now(), text: `✨ Cosmetic equipped`, tone: "sky" } }));
  }

  const activeDieIndex = useMemo(() => {
    if (game.selectedDieIndex !== null && game.dice[game.selectedDieIndex] !== null) return game.selectedDieIndex;
    return nextAvailableDieIndex(game.dice);
  }, [game.dice, game.selectedDieIndex]);

  const activeDieValue = activeDieIndex !== null ? game.dice[activeDieIndex] : null;
  const activeDieMeta = activeDieValue !== null ? getDieMeta(activeDieValue) : null;
  const latestLogs = game.log.slice(0, 3);
  const latestAction = game.log[0] || "No action yet. Press ROLL.";
  const intent = getIntentPreview(game.enemy);
  const intentTimeline = getIntentTimeline(game.enemy, 3);
  const expectedOutcome = estimatePlayerOutcome(game.grid, game.player);
  const streakMultiplier = getNoHitMultiplier(game.noHitTurns);

  // Preview projected HP/shield changes before Resolve
  const resolvePreview = useMemo(() => {
    const hasAnyDie = game.grid.some(row => row.some(cell => cell !== null));
    if (!hasAnyDie || game.phase !== "place") return null;
    const result = resolvePlayerGrid({ ...game, grid: game.grid, enemy: game.enemy, player: game.player });
    return {
      playerHpAfter: Math.min(game.player.maxHp, result.player.hp),
      playerShieldAfter: result.player.shield,
      enemyHpAfter: Math.max(0, result.enemy.hp),
      totals: result.totals,
    };
  }, [game.grid, game.phase, game.player, game.enemy]);
  const enemyAnchorRef = useRef(null);
  const playerAnchorRef = useRef(null);

  function getPopupPosition(target) {
    const node = target === "enemy" ? enemyAnchorRef.current : playerAnchorRef.current;
    if (node) {
      const rect = node.getBoundingClientRect();
      const x = rect.left + rect.width * 0.5 + (Math.random() * 70 - 35);
      const y = rect.top + rect.height * 0.35 + (Math.random() * 44 - 22);
      return {
        left: `${Math.round(Math.max(8, Math.min(window.innerWidth - 8, x)))}px`,
        top: `${Math.round(Math.max(8, Math.min(window.innerHeight - 8, y)))}px`,
      };
    }

    return {
      left: target === "enemy" ? `${16 + Math.floor(Math.random() * 20)}%` : `${62 + Math.floor(Math.random() * 18)}%`,
      top: `${22 + Math.floor(Math.random() * 24)}%`,
    };
  }

  const storyFragment = getStoryFragment(game.floor + game.room, game.player.characterId);

  function shiftSelectedDie(direction) {
    if (game.characterSelectPending || game.phase !== "place") return;
    setGame((g) => ({
      ...g,
      selectedDieIndex: cycleDieIndex(g.dice, activeDieIndex, direction),
    }));
  }

  function shareRun() {
    const characterName = game.player.PLAYER_CHARACTERS[game.player.characterId]?.name ?? game.player.characterId;
    const text = `I reached Zone ${game.floor} in DIE JUNGLE 🌴\nScore: ${game.score} | ${characterName}\nSeed: ${game.runSeed}\n#KabalBlessing\ndiejungle.fun`;
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.shareUrl) {
      tg.shareUrl(`https://diejungle.fun`, text);
    } else if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=https://diejungle.fun&text=${encodeURIComponent(text)}`);
    } else {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    }
  }

  function pushLog(lines) {
    setGame((g) => ({ ...g, log: [...lines, ...g.log].slice(0, 40) }));
  }

  function pickCharacter(characterId, currentLoadout) {
    const selected = runtimeCharacters[characterId] || runtimeCharacters.kabalian || PLAYER_CHARACTERS.kabalian;
    const lout = currentLoadout || loadout;
    setGame((g) => {
      let nextPlayer = {
        ...g.player,
        characterId: selected.id,
        avatar: selected.avatar,
        maxHp: selected.stats.maxHp,
        hp: selected.stats.maxHp,
        attackBonus: selected.stats.attackBonus,
        attackDieValueBonus: 0,
        healBonus: 0,
        combatStartShield: selected.stats.combatStartShield || 0,
        shield: selected.stats.combatStartShield || 0,
        rerollsPerTurn: selected.stats.rerollsPerTurn,
        rerollsLeft: selected.stats.rerollsPerTurn,
        topRowBonus: 0,
        cooldownTick: 1,
        companionId: lout.companion || null,
        companionCooldown: 0,
      };
      const logLines = [`🧭 ${selected.name} selected`];
      // Apply weapon 1
      if (lout.weapon1) {
        const w = STARTER_WEAPONS.find((ww) => ww.id === lout.weapon1);
        if (w) { nextPlayer = w.apply(nextPlayer); logLines.push(`⚔️ Weapon: ${w.name}`); }
      }
      // Apply weapon 2
      if (lout.weapon2) {
        const w = STARTER_WEAPONS.find((ww) => ww.id === lout.weapon2);
        if (w) { nextPlayer = w.apply(nextPlayer); logLines.push(`⚔️ Weapon 2: ${w.name}`); }
      }
      // Apply companion passive
      if (lout.companion) {
        const comp = COMPANIONS.find((c) => c.id === lout.companion);
        if (comp) { nextPlayer = comp.applyPassive(nextPlayer); logLines.push(`${comp.abilityEmoji} Companion: ${comp.name}`); }
      }
      // Apply relic 1
      if (lout.relic1) {
        const relic = STARTER_RELICS.find((r) => r.id === lout.relic1);
        if (relic) { nextPlayer = relic.apply(nextPlayer); logLines.push(`🗿 Relic: ${relic.name}`); }
      }
      nextPlayer.shield = nextPlayer.combatStartShield;
      return {
        ...g,
        player: nextPlayer,
        characterSelectPending: false,
        phase: "map",
        mapLayers,
        currentMapNodeId: null,
        avatarMood: "focus",
        actionFlash: { id: Date.now(), text: `🧭 ${selected.name} · Run started`, tone: "sky" },
        log: [...logLines, ...g.log].slice(0, 40),
      };
    });
    // Reset loadout state
    setPendingCharId(null);
    setLoadout({ weapon1: null, weapon2: null, companion: null, relic1: null });
  }

  function useCompanionAbility() {
    setGame((g) => {
      const comp = COMPANIONS.find((c) => c.id === g.player.companionId);
      if (!comp || g.player.companionCooldown > 0) return g;
      let player = { ...g.player, companionCooldown: comp.abilityCooldown };
      let enemy = { ...g.enemy };
      const logLines = [];
      switch (comp.id) {
        case "gecko":
          enemy.hypnosedTurns = (enemy.hypnosedTurns || 0) + 1;
          logLines.push(`😴 Hypnose: enemy skips next intent!`);
          break;
        case "croak":
          { const dmg = Math.max(0, 8 - (enemy.shield || 0)); enemy.shield = Math.max(0, (enemy.shield || 0) - 8); enemy.hp = Math.max(0, enemy.hp - dmg); logLines.push(`💥 Leap: ${dmg} damage!`); break; }
        case "oeil":
          player.rerollsLeft = player.rerollsLeft + 1;
          logLines.push(`🔮 Vision: +1 free reroll!`);
          break;
        case "shaman":
          player.hp = Math.min(player.maxHp, player.hp + 8);
          logLines.push(`🌿 Totem: +8 HP!`);
          break;
        case "sprout":
          player.shield = player.shield + 6;
          logLines.push(`🛡️ Barrier: +6 shield!`);
          break;
        case "hoarder":
          player.rerollsLeft = player.rerollsLeft + 1;
          player.hp = Math.min(player.maxHp, player.hp + 4);
          logLines.push(`👻 Soul Hoard: +1 reroll + heal 4!`);
          break;
        case "imp":
          { const dmg2 = Math.max(0, 5 - (enemy.shield || 0)); enemy.shield = Math.max(0, (enemy.shield || 0) - 5); enemy.hp = Math.max(0, enemy.hp - dmg2); logLines.push(`☠️ Venom: ${dmg2} damage!`); break; }
        default: break;
      }
      return { ...g, player, enemy, log: [...logLines, ...g.log].slice(0, 40) };
    });
  }

  function startRoll() {
    if (game.characterSelectPending || game.rolling || game.phase !== "roll" || game.combatRewardPending) return;

    setGame((g) => {
      const player = { ...g.player };
      let lines = [];
      // Fortress: restore fortress shield at start of next turn
      if ((player._fortressShield || 0) > 0) {
        player.shield = (player.shield || 0) + player._fortressShield;
        lines.push(`🏰 Fortress: +${player._fortressShield} shield carried over`);
        player._fortressShield = 0;
      }
      if (player.selfBleed > 0) {
        player.hp -= player.selfBleed;
        lines.push(`🩸 Bleeding charm: lose ${player.selfBleed} HP`);
      }
      player.rerollsLeft = player.curseNextTurn > 0 ? 0 : player.rerollsPerTurn;
      if (player.curseNextTurn > 0) {
        lines.push(`☠️ Cursed turn: reroll disabled`);
        player.curseNextTurn = 0;
      }
      if (player.companionCooldown > 0) player.companionCooldown -= 1;
      return {
        ...g,
        player,
        rolling: true,
        phase: "rolling",
        avatarMood: player.selfBleed > 0 ? "hurt" : "focus",
        dice: Array.from({ length: player.dicePerTurn }, (_, i) => ({
          id: `preview-${Date.now()}-${i}`,
          kind: DIE_KIND_ORDER[i % DIE_KIND_ORDER.length],
          value: (i % 6) + 1,
        })),
        selectedDieIndex: null,
        log: [...lines, ...g.log].slice(0, 40),
      };
    });

    window.setTimeout(() => {
      setGame((g) => {
        const meta = loadMeta();
        const specialFaces = hasDiceSpecials(meta);
        const geckoBonus = g.player.companion?.passive?.attackDieBonus ?? 0;
        const dice = rollDice(g.player.dicePerTurn, specialFaces, geckoBonus);

        // 🌟 Golden Kabal Dice: 10% chance per combat (all characters) — player chooses type
        let kabalDieAvailableThisCombat = g.kabalDieAvailableThisCombat;
        let goldenDicePending = false;
        let kabalDieLog = '';
        if (kabalDieAvailableThisCombat && Math.random() < 0.10) {
          kabalDieAvailableThisCombat = false;
          goldenDicePending = true;
          kabalDieLog = ` · ✨ Golden Kabal Dice — choose your type!`;
        }

        return {
          ...g,
          dice,
          kabalDieAvailableThisCombat,
          goldenDicePending,
          grid: emptyGrid(),
          phase: g.player.hp <= 0 ? "gameover" : "place",
          rolling: false,
          selectedDieIndex: 0,
          avatarMood: "focus",
          actionFlash: { id: Date.now(), text: `🎲 ${dice.map((d) => `${getDieMeta(d).emoji}${d.value}${d.special ? '✦' : ''}`).join(" · ")}${kabalDieLog}`, tone: goldenDicePending ? "amber" : "amber" },
          log: [`🎲 Rolled: ${dice.map((d) => `${getDieMeta(d).label} ${d.value}${d.special ? ` (${d.special})` : ''}`).join(" - ")}${kabalDieLog}`, ...g.log].slice(0, 40),
        };
      });
    }, 700);
  }

  function submitToLeaderboard(score: number, floor: number, seed: number) {
    const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
    const name = tgUser?.first_name || tgUser?.username || 'Kabalian';
    const entry = { name, score, floor, date: new Date().toLocaleDateString(), seed };
    setLeaderboard((prev) => {
      const next = [entry, ...prev].sort((a, b) => b.score - a.score).slice(0, 10);
      try { localStorage.setItem('jungle_kabal_leaderboard_v1', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // Spend 1 reroll to free the longest-blocked cooldown slot
  function freeCooldownSlot() {
    if (game.phase !== "place") return;
    if (game.player.rerollsLeft <= 0) return;
    // Find slot with highest cooldown value
    let bestY = -1, bestX = -1, bestVal = 0;
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        if (game.cooldowns[y][x] > bestVal) {
          bestVal = game.cooldowns[y][x];
          bestY = y; bestX = x;
        }
      }
    }
    if (bestY === -1) return; // no blocked slots
    setGame((g) => {
      const newCooldowns = g.cooldowns.map((row, ry) => row.map((v, rx) => ry === bestY && rx === bestX ? 0 : v));
      return {
        ...g,
        cooldowns: newCooldowns,
        player: { ...g.player, rerollsLeft: g.player.rerollsLeft - 1 },
        actionFlash: { id: Date.now(), text: `🔓 Slot (${bestY},${bestX}) freed!`, tone: "sky" },
        log: [`🔓 Free CD: slot row${bestY + 1} col${bestX + 1} freed (-1 reroll)`, ...g.log].slice(0, 40),
      };
    });
  }

  // ✨ Golden Kabal Dice — player picks type (attack / heal / shield)
  function chooseGoldenDice(kind: 'attack' | 'heal' | 'shield') {
    const specialMap = { attack: 'pierce', shield: 'fortress', heal: 'nurture' } as const;
    const goldenDie = {
      id: `golden-${Date.now()}`,
      kind,
      value: 6,
      special: specialMap[kind],
      isKabalDie: true,
    };
    setGame((g) => {
      const newDice = [...g.dice, goldenDie];
      const emoji = kind === 'attack' ? '⚔️' : kind === 'shield' ? '🛡️' : '❤️';
      return {
        ...g,
        dice: newDice,
        goldenDicePending: false,
        selectedDieIndex: newDice.length - 1,
        actionFlash: { id: Date.now(), text: `✨ Golden ${emoji} Dice added — value 6, ${specialMap[kind]}!`, tone: "amber" },
        log: [`✨ Golden Kabal Dice: ${emoji} ${kind} 6 (${specialMap[kind]}) chosen`, ...g.log].slice(0, 40),
      };
    });
  }

  // K-REX: TREMOR — destroy selected die for +5 ATK this turn
  function krexTremor() {
    if (game.player.characterId !== 'krex') return;
    if (game.phase !== "place") return;
    if (activeDieIndex === null || game.dice[activeDieIndex] === null) return;
    const sacrificed = getDieMeta(game.dice[activeDieIndex]);
    setGame((g) => {
      const newDice = [...g.dice];
      newDice[activeDieIndex] = null;
      return {
        ...g,
        dice: newDice,
        player: {
          ...g.player,
          attackBonus: g.player.attackBonus + 5,
          _krexTremorBonus: (g.player._krexTremorBonus || 0) + 5,
        },
        selectedDieIndex: nextAvailableDieIndex(newDice),
        actionFlash: { id: Date.now(), text: `💥 TREMOR — ${sacrificed.emoji} sacrificed · +5 ATK`, tone: 'rose' },
        log: [`💥 TREMOR — ${sacrificed.label} die sacrificed for +5 ATK this turn`, ...g.log].slice(0, 40),
      };
    });
  }

  function rerollActiveDie() {
    if (game.phase !== "place") return;
    if (game.player.rerollsLeft <= 0) return;
    if (activeDieIndex === null || game.dice[activeDieIndex] === null) return;

    setGame((g) => {
      const dice = [...g.dice];
      const oldDie = dice[activeDieIndex];
      let next = Math.floor(Math.random() * 6) + 1;
      if (next === oldDie.value) next = ((next % 6) + 1);
      dice[activeDieIndex] = { ...oldDie, value: next };
      return {
        ...g,
        dice,
        avatarMood: "focus",
        actionFlash: { id: Date.now(), text: `🔁 ${getDieMeta(oldDie).label} ${oldDie.value} → ${next}`, tone: "sky" },
        player: { ...g.player, rerollsLeft: g.player.rerollsLeft - 1 },
        log: [`🎯 Reroll: ${getDieMeta(oldDie).label} ${oldDie.value} → ${next}`, ...g.log].slice(0, 40),
      };
    });
  }

  function placeDie(dieIndex, x, y) {
    if (game.characterSelectPending || game.phase !== "place") return;
    if (game.grid[y][x] !== null) return;
    if (game.cooldowns[y][x] > 0) return;
    if (game.dice[dieIndex] === null) return;

    const placedDie = game.dice[dieIndex];
    const placedMeta = getDieMeta(placedDie);
    const lane = ROW_INFO[y];
    const newGrid = game.grid.map((row) => [...row]);
    const newCooldowns = game.cooldowns.map((row) => [...row]);
    const newDice = [...game.dice];

    newGrid[y][x] = placedDie;
    newCooldowns[y][x] = game.player.cooldownBase;
    newDice[dieIndex] = null;

    const nextIndex = nextAvailableDieIndex(newDice);
    const allPlaced = nextIndex === null;

    // Haptic on place
    haptic('selection');

    setGame((g) => ({
      ...g,
      dice: newDice,
      grid: newGrid,
      cooldowns: newCooldowns,
      // Always stay in "place" — player must click Resolve (or use auto-resolve toggle)
      phase: "place",
      selectedDieIndex: nextIndex,
      avatarMood: placedMeta.kind === "attack" ? "fierce" : placedMeta.kind === "heal" ? "joy" : "guard",
      log: [`${lane.emoji} Put ${placedMeta.emoji} ${placedDie.value} in ${lane.name} x${rowMultiplier(g.player, y)}`, ...g.log].slice(0, 40),
    }));

    if (autoResolve && allPlaced) {
      window.setTimeout(() => resolveTurn(newGrid, newCooldowns), 320);
    }
  }

  // Manual resolve: available when at least 1 die is placed (phase === "place" with some grid dice)
  function manualResolve() {
    const currentGrid = game.grid;
    const currentCooldowns = game.cooldowns;
    const hasAnyDie = currentGrid.some(row => row.some(cell => cell !== null));
    if (!hasAnyDie) return;
    haptic('impact', 'medium');
    resolveTurn(currentGrid, currentCooldowns);
  }

  function useWeaponSpecial(slotIndex: number) {
    setGame((g) => {
      const weapons: (Weapon | null)[] = g.player.weaponSlots || [null, null];
      const weapon = weapons[slotIndex];
      if (!weapon || weapon.cooldownRemaining > 0) return g;
      if (g.phase !== 'place' && g.phase !== 'roll') return g;

      const { newCombatState, log: wLog, sideEffects } = activateWeaponSpecial(weapon, {
        player: g.player,
        enemy: g.enemy,
        grid: g.grid,
        turn: g.turn,
        weapons,
        doubleStrikeActive: g.doubleStrikeActive,
        overloadActive: g.overloadActive,
        overloadValue: g.overloadValue,
      });

      haptic('impact', 'medium');

      let nextCooldowns = g.cooldowns;
      if (sideEffects.some(e => e.type === 'reset_slot_cooldowns')) {
        nextCooldowns = emptyCooldowns();
      }

      return {
        ...g,
        player: { ...g.player, ...newCombatState.player, weaponSlots: newCombatState.weapons || weapons },
        enemy: newCombatState.enemy,
        cooldowns: nextCooldowns,
        doubleStrikeActive: newCombatState.doubleStrikeActive || false,
        overloadActive: newCombatState.overloadActive || false,
        overloadValue: newCombatState.overloadValue || 1,
        log: [wLog, ...g.log].slice(0, 40),
        actionFlash: { id: Date.now(), text: wLog, tone: 'violet' },
      };
    });
  }

  function resolveTurn(gridRef, cooldownRef) {
    setGame((g) => {
      // Weapon: apply double strike flag before resolving (doubles total attack)
      const doubleStrike = g.doubleStrikeActive || false;
      const overloadActive = g.overloadActive || false;
      const overloadValue = g.overloadValue || 1;

      const playerResult = resolvePlayerGrid({
        ...g,
        grid: gridRef,
        enemy: g.enemy,
        player: g.player,
        doubleStrike,
        overloadActive,
        overloadValue,
      });
      let enemy = playerResult.enemy;
      let player = playerResult.player;
      const totals = playerResult.totals;
      let log = [...playerResult.log];

      // K-REX STOMP: if 2+ attack dice placed this turn → +2 ATK (max +8 stacked per combat)
      if (player.characterId === 'krex') {
        const attackDicePlaced = gridRef.flat().filter((d) => d && getDieMeta(d).kind === 'attack').length;
        if (attackDicePlaced >= 2) {
          const stompGain = 2;
          const newStompBonus = Math.min(8, (player._krexStompBonus || 0) + stompGain);
          const actualGain = newStompBonus - (player._krexStompBonus || 0);
          if (actualGain > 0) {
            player._krexStompBonus = newStompBonus;
            player.attackBonus = (player._krexBaseAttack || 3) + newStompBonus;
            log.unshift(`🦖 STOMP — ${attackDicePlaced} ATK dice · +${actualGain} ATK (total stomp: +${newStompBonus})`);
          }
        }
      }

      // Weapon DoT tick
      const dotResult = tickEnemyDot(enemy);
      if (dotResult.damage > 0) {
        enemy = dotResult.newEnemy;
        log.unshift(`☠️ DoT: -${dotResult.damage} HP ennemi`);
      }
      const preRetaliationShield = player.shield;
      const preRetaliationHp = player.hp;
      const enemyDied = enemy.hp <= 0;
      let nextCooldowns = cooldownRef;
      const saturated = boardIsSaturated(gridRef, cooldownRef);
      const nextTurn = g.turn + 1;
      const damagePopups = [];
      const scorePopups = [];
      let enemyAttackPulse = 0;
      let enemyHitPulse = 0;
      let comboPopup = null;
      let hpDamageTaken = 0;

      if (totals.attack > 0) {
        enemyHitPulse = Date.now();
        damagePopups.push({ id: `${Date.now()}-enemy-hit`, target: "enemy", tone: "damage", text: `⚔️ -${totals.attack}`, ...getPopupPosition("enemy") });
      }
      if (totals.heal > 0) {
        damagePopups.push({ id: `${Date.now()}-player-heal`, target: "player", tone: "heal", text: `❤️ +${totals.heal}`, yShift: 0, ...getPopupPosition("player") });
      }
      if (totals.shield > 0) {
        damagePopups.push({ id: `${Date.now()}-player-shield`, target: "player", tone: "shield", text: `🛡️ +${totals.shield}`, yShift: totals.heal > 0 ? 1 : 0, ...getPopupPosition("player") });
      }

      if (!enemyDied) {
        // Companion hypnosis: skip enemy intent this turn
        if (player.companionHypnosisActive) {
          player.companionHypnosisActive = false;
          log.unshift(`🦎 Hypnose — enemy intent skipped!`);
        } else {
          const intentNow = getIntentPreview(enemy);
          const retaliation = resolveEnemyIntent(enemy, player, log, g);
          enemy = retaliation.enemy;
          player = retaliation.player;
          if (intentNow.type === "attack") {
            enemyAttackPulse = Date.now();
            const hpLoss = Math.max(0, preRetaliationHp - player.hp);
            hpDamageTaken = hpLoss;
            const shieldBlocked = Math.max(0, preRetaliationShield - player.shield - hpLoss);
            if (hpLoss > 0) {
              damagePopups.push({ id: `${Date.now()}-player-hit`, target: "player", tone: "damage", text: `💥 -${hpLoss}`, yShift: 0, ...getPopupPosition("player") });
            }
            if (shieldBlocked > 0) {
              damagePopups.push({ id: `${Date.now()}-player-block`, target: "player", tone: "shield", text: `🛡️ -${shieldBlocked}`, yShift: hpLoss > 0 ? 1 : 0, ...getPopupPosition("player") });
            }
          }
        }
      }

      // Bot row: each die placed there gives +1 coin (using lane bonuses feature)
      const meta = loadMeta();
      if (hasLaneBonuses(meta) && playerResult.botRowDiceCount > 0) {
        player.coins = (player.coins || 0) + playerResult.botRowDiceCount;
        log.unshift(`🪨 Bot row sacrifice: +${playerResult.botRowDiceCount} coin${playerResult.botRowDiceCount > 1 ? 's' : ''}`);
      }

      if (player.timedResetEvery > 0 && nextTurn % player.timedResetEvery === 0) {
        nextCooldowns = emptyCooldowns();
        log.unshift(`⏳ Time Engine resets all cooldowns`);
      } else if (saturated) {
        nextCooldowns = emptyCooldowns();
        log.unshift(`♻️ Board full: all cooldowns reset`);
      } else {
        nextCooldowns = tickCooldowns(cooldownRef, player.cooldownTick);
      }

      // Top row heal: reset one blocked cooldown slot
      if (hasLaneBonuses(meta) && playerResult.topRowHasHeal) {
        let freed = false;
        outer: for (let y = 0; y < 3; y++) {
          for (let x = 0; x < 3; x++) {
            if (nextCooldowns[y][x] > 0) {
              nextCooldowns = nextCooldowns.map((row, ry) => row.map((v, rx) => ry === y && rx === x ? 0 : v));
              log.unshift(`🔄 Heal in top row — slot (${y},${x}) cooldown freed!`);
              freed = true;
              break outer;
            }
          }
        }
        if (!freed) log.unshift(`🔄 Heal in top row — no blocked slots`);
      }

      // Surge flash
      if (playerResult.surgeType) {
        log.unshift(`⚡ SURGE ${playerResult.surgeType.toUpperCase()}!`);
      }

      // Tick companion cooldown
      if (player.companion) {
        player.companion = tickCompanionCooldown(player.companion);
      }

      if (player.hp <= 0 && player.reviveOnce) {
        player.hp = Math.round(player.maxHp * 0.4);
        player.reviveOnce = false;
        log.unshift(`✨ Kabal Sigil revives you at ${player.hp} HP`);
      }

      const nextNoHitTurns = hpDamageTaken > 0 ? 0 : g.noHitTurns + 1;
      const streakMult = getNoHitMultiplier(nextNoHitTurns);
      const zoneMult = Math.min(2.5, 1 + (g.floor - 1) * 0.2);
      const scoreTags = [];
      let scoreGain = enemyDied ? 120 : 20;
      if (enemyDied) scoreTags.push(`Kill +${scoreGain}`);
      const overkillAmount = enemyDied ? Math.max(0, -enemy.hp) : 0;
      if (overkillAmount > 0) {
        const overkillBonus = overkillAmount * 5;
        scoreGain += overkillBonus;
        scoreTags.push(`Overkill +${overkillBonus}`);
      }
      const oneShot = enemyDied && g.enemy.intentIndex === 0;
      if (oneShot) {
        scoreGain += 100;
        scoreTags.push('ONE SHOT +100');
      }
      const perfectFight = enemyDied && hpDamageTaken === 0;
      if (perfectFight) {
        scoreGain += 150;
        scoreTags.push('PERFECT +150');
      }
      const scoreAfterMult = Math.round(scoreGain * streakMult * zoneMult);
      if (streakMult > 1) scoreTags.push(`No-hit x${streakMult.toFixed(1)}`);
      if (zoneMult > 1) scoreTags.push(`Zone x${zoneMult.toFixed(1)}`);
      let score = g.score + scoreAfterMult;
      let winStreak = enemyDied ? g.winStreak + 1 : 0;
      let phase = player.hp <= 0 ? "gameover" : "roll";
      let room = g.room;
      let route = g.route;
      let combatRewardPending = false;
      let artifactsOffered = [];
      let killPopup = null;
      const playerTookDamage = player.hp < g.player.hp;
      const playerRecovered = player.hp > g.player.hp;
      const lowHpThreshold = Math.ceil(player.maxHp * 0.25);
      let avatarMood = player.hp <= lowHpThreshold
        ? "almostDead"
        : enemyDied
          ? "victory"
          : playerTookDamage
            ? "hurt"
            : playerRecovered
              ? "joy"
              : totals.shield > 0
                ? "guard"
                : "focus";
      let actionFlash = null;
      const lastOutcome = `⚔️ ${totals.attack} · 🛡️ ${totals.shield} · ❤️ ${totals.heal}`;

      if (totals.attack > 0) {
        actionFlash = { id: Date.now(), text: `⚔️ ${totals.attack} DMG`, tone: "rose" };
      } else if (totals.shield > 0) {
        actionFlash = { id: Date.now(), text: `🛡️ +${totals.shield} Shield`, tone: "cyan" };
      } else if (totals.heal > 0) {
        actionFlash = { id: Date.now(), text: `❤️ +${totals.heal} Heal`, tone: "emerald" };
      }

      // Ka fragments
      const surgeTriggered = !!playerResult.surgeType;
      const kaGained = (() => {
        let f = 0;
        if (enemyDied) {
          if (g.enemy.tier === 'boss') f += 3;
          else if (g.enemy.elite || g.enemy.tier === 'medium') f += 2;
          else f += 1;
        }
        if (surgeTriggered) f += 1;
        return f;
      })();
      const newKaFragments = Math.min(4, (player.kaFragments || 0) + kaGained);
      const newKaCharged = newKaFragments >= 4;
      const justCharged = newKaCharged && !((player.kaFragments || 0) >= 4);
      if (kaGained > 0) {
        log.unshift(`◆ Ka: +${kaGained} fragment${kaGained > 1 ? 's' : ''} (${newKaFragments}/4)`);
      }
      if (justCharged) {
        actionFlash = { id: Date.now(), text: '◆◆◆◆ KA CHARGÉ — Pouvoir prêt!', tone: 'amber' };
      }

      log.unshift(`🏆 Score +${scoreAfterMult}${scoreTags.length ? ` · ${scoreTags.join(' · ')}` : ''}`);
      scorePopups.push({ id: `${Date.now()}-score-main`, tone: "amber", text: `+${scoreAfterMult}` });
      if (scoreTags.some((tag) => tag.includes("Overkill"))) scorePopups.push({ id: `${Date.now()}-score-overkill`, tone: "rose", text: "OVERKILL" });
      if (scoreTags.some((tag) => tag.includes("ONE SHOT"))) scorePopups.push({ id: `${Date.now()}-score-oneshot`, tone: "violet", text: "ONE SHOT" });
      if (scoreTags.some((tag) => tag.includes("PERFECT"))) scorePopups.push({ id: `${Date.now()}-score-perfect`, tone: "emerald", text: "PERFECT" });
      if (scoreTags.length >= 3) comboPopup = `COMBO BONUS +${scoreAfterMult}`;

      if (!enemyDied && playerTookDamage) {
        actionFlash = { id: Date.now() + 1, text: `💥 -${g.player.hp - player.hp} HP`, tone: "rose" };
        avatarMood = "shocked";
      }

      // Haptic feedback
      if (enemyDied) haptic('notification', 'success');
      else if (player.hp <= 0) haptic('notification', 'error');
      else if (playerResult.surgeType) haptic('impact', 'heavy');
      else if (totals.attack > 0) haptic('impact', 'light');

      let killRewardPending = false;
      let killRewardsOffered: KillReward[] = [];
      let killRewardsPicked: string[] = [];
      let killRewardPicksAllowed = 0;
      let killRewardMustPick = true;

      if (enemyDied) {
        killPopup = `💀 ${pickKillWord(winStreak)} 💀`;
        log.unshift(`☠️ ${g.enemy.name} defeated · ${killPopup}`);
        if (g.enemy.tier === "boss") {
          score += 500;
          comboPopup = "👑 BOSS DESTROYED";
          actionFlash = { id: Date.now() + 2, text: `👑 BOSS DESTROYED · +${scoreAfterMult + 500} SCORE`, tone: "amber" };
        } else {
          actionFlash = { id: Date.now() + 2, text: `🏆 +${scoreAfterMult} SCORE`, tone: "amber" };
        }
        if (g.enemy.elite) score += 150;

        const isBoss = g.enemy.tier === 'boss';
        const isElite = g.enemy.elite || g.enemy.tier === 'medium';

        if (g.startRewardPending) {
          combatRewardPending = true;
          artifactsOffered = buildStarterArtifactChoices(player, remoteAdminConfig.pools);
          phase = "reward";
        } else if (g.enemy.tier === "boss") {
          combatRewardPending = true;
          artifactsOffered = buildArtifactChoices(player, remoteAdminConfig.pools);
          phase = "reward";
        } else if (g.room >= g.route.length - 1) {
          phase = "victory";
        } else {
          phase = "path";
          pathChoices = buildPathChoices(g.room + 1, g.floor);
          mapChoices = buildMapChoices(g.room + 1, g.floor, remoteAdminConfig.pools);
          actionFlash = { id: Date.now() + 2, text: "🗺️ Choose your map card", tone: "sky" };
          log.unshift("🗺️ Random map cards generated: choose where to move");
        }
      }

      // Weapon: tick cooldowns + legendary kill trigger
      let weaponSlots = player.weaponSlots as (Weapon | null)[] || [null, null];
      if (enemyDied) {
        weaponSlots = onKillLegendaryTrigger(weaponSlots);
      }
      weaponSlots = tickWeaponCooldowns(weaponSlots, player);
      player.weaponSlots = weaponSlots;

      // Reset weapon flags for next turn
      player = { ...player, weaponSlots };

      // Track boss floor for meta achievement (boss kill on this floor)
      const lastBossFloor = (enemyDied && g.enemy.tier === "boss") ? g.floor : (g.lastBossFloor ?? null);

      // Switch biome after boss kill
      const currentBiome: BiomeId = (enemyDied && g.enemy.tier === "boss")
        ? pickNextBiome(g.floor, g.runSeed + ':' + g.floor)
        : (g.currentBiome ?? 'jungle');

      return {
        ...g,
        score,
        noHitTurns: nextNoHitTurns,
        turn: nextTurn,
        room,
        route,
        enemy,
        player: {
          ...player,
          kaFragments: newKaFragments,
          kaCharged: newKaCharged,
          kaPower: player.kaPower || KA_POWERS[player.characterId] || KA_POWERS.kabalian,
        },
        cooldowns: nextCooldowns,
        phase,
        grid: emptyGrid(),
        dice: [],
        selectedDieIndex: null,
        winStreak,
        artifactsOffered,
        combatRewardPending,
        startRewardPending: g.startRewardPending && phase !== "reward" ? true : false,
        killPopup,
        log: [...log, ...g.log].slice(0, 40),
        runEnded: phase === "gameover" || phase === "victory",
        avatarMood,
        actionFlash,
        enemyAttackPulse,
        enemyHitPulse,
        damagePopups,
        scorePopups,
        comboPopup,
        lastOutcome,
        lastBossFloor,
        currentBiome,
        doubleStrikeActive: false,
        overloadActive: false,
        overloadValue: 1,
        kaRageActive: false,
        kaFortressActive: false,
        kaStompActive: false,
        killRewardPending,
        killRewardsOffered,
        killRewardsPicked,
        killRewardPicksAllowed,
        killRewardMustPick,
        laneBonuses: rollLaneBonuses(),
      };
    });

    window.setTimeout(() => {
      setGame((g) => ({ ...g, killPopup: null }));
    }, 1200);
  }

  function pickArtifact(artifact) {
    setGame((g) => {
      const player = applyArtifactToPlayer(g.player, artifact);

      if (g.startRewardPending) {
        // After first artifact reward → go to map
        return {
          ...g,
          player: { ...player, shield: 0 },
          phase: "map",
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          actionFlash: { id: Date.now(), text: `🏆 ${artifact.name} — choose your path`, tone: "amber" },
          lastOutcome: null,
          log: [`🏆 Starting artifact: ${artifact.name}`, `🗺️ Choose your path`, ...g.log].slice(0, 40),
        };
      }

      const finishedRoute = g.room >= g.route.length - 1;

      if (finishedRoute) {
        const nextFloor = g.floor + 1;
        const nextRoute = buildRoute(nextFloor);
        const nextPlayer = { ...player, shield: player.combatStartShield, rerollsLeft: player.rerollsPerTurn };
        return {
          ...g,
          floor: nextFloor,
          room: 0,
          route: nextRoute,
          enemy: { ...nextRoute[0] },
          pendingEnemy: { ...nextRoute[0] },
          player: nextPlayer,
          phase: "shop",
          shopItems: buildShopInventory(remoteAdminConfig.pools),
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          cooldowns: emptyCooldowns(),
          grid: emptyGrid(),
          dice: [],
          selectedDieIndex: null,
          avatarMood: "victory",
          actionFlash: { id: Date.now(), text: `🏆 ${artifact.name} · 🏪 Shop opened`, tone: "amber" },
          lastOutcome: null,
          pathChoices: [],
          mapChoices: [],
          log: [`🏆 Chose ${artifact.name}`, `🏪 Shop unlocked before Zone ${nextFloor}`, ...g.log].slice(0, 40),
        };
      }

      const nextRoom = g.room + 1;
      const nextEnemy = { ...g.route[nextRoom] };
      return {
        ...g,
        floor: nextFloor,
        room: 0,
        route: nextRoute,
        enemy: { ...nextRoute[0] },
        player: nextPlayer,
        phase: "map",
        mapLayers: nextMapLayers,
        currentMapNodeId: null,
        artifactsOffered: [],
        combatRewardPending: false,
        startRewardPending: false,
        cooldowns: emptyCooldowns(),
        grid: emptyGrid(),
        dice: [],
        selectedDieIndex: null,
        avatarMood: "victory",
        actionFlash: { id: Date.now(), text: `🌴 Zone ${nextFloor} — choose your path`, tone: "amber" },
        lastOutcome: null,
        log: [`🏆 Chose ${artifact.name}`, `🌴 Zone ${nextFloor} begins`, ...g.log].slice(0, 40),
      };
    });
  }

  function skipArtifactReward() {
    setGame((g) => {
      if (!g.combatRewardPending && g.phase !== "reward") return g;

      if (g.startRewardPending) {
        return {
          ...g,
          phase: "map",
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          actionFlash: { id: Date.now(), text: "⏭️ Skipped — choose your path", tone: "sky" },
          log: ["⏭️ Skipped start reward", "🗺️ Choose your path", ...g.log].slice(0, 40),
        };
      }

      // Boss kill skip → advance to next zone
      const nextFloor = g.floor + 1;
      const nextRoute = buildRoute(nextFloor);
      const nextMapLayers = generateZoneMap(nextFloor, g.runSeed + ':' + nextFloor);
      return {
        ...g,
        floor: nextFloor,
        room: 0,
        route: nextRoute,
        enemy: { ...nextRoute[0] },
        player: { ...g.player, shield: 0, rerollsLeft: g.player.rerollsPerTurn },
        phase: "map",
        mapLayers: nextMapLayers,
        currentMapNodeId: null,
        artifactsOffered: [],
        combatRewardPending: false,
        startRewardPending: false,
        cooldowns: emptyCooldowns(),
        grid: emptyGrid(),
        dice: [],
        selectedDieIndex: null,
        actionFlash: { id: Date.now(), text: `🌴 Zone ${nextFloor} — choose your path`, tone: "sky" },
        log: ["⏭️ Skipped reward", `🌴 Zone ${nextFloor} begins`, ...g.log].slice(0, 40),
      };
    });
  }

  function enterMapNode(nodeId: string) {
    setGame((g) => {
      if (!g.mapLayers) return g;
      // Block navigation if map opened mid-combat — view only
      if (g.combatMapView) return g;
      const allNodes = g.mapLayers.flatMap((l) => l.nodes);
      const node = allNodes.find((n) => n.id === nodeId);
      if (!node || node.visited) return g;

      // Update fog of war and mark visited
      const updatedLayers = updateFogOfWar(g.mapLayers, nodeId);

      if (node.type === "mob" || node.type === "elite" || node.type === "boss") {
        // Pick enemy from existing route scaled to floor
        const tier = node.type === "elite" ? "medium" : node.type === "mob" ? "mob" : "boss";
        const sourcePool = (ENEMY_POOLS as Record<string, typeof ENEMY_POOLS.mob>)[tier] || ENEMY_POOLS.mob;
        const rng = createRng(g.runSeed + ':' + nodeId);
        const source = sourcePool[Math.floor(rng() * sourcePool.length)];
        const base = cloneEnemy(source);
        const rawFloor2 = g.floor - 1;
        const scale = Math.min(rawFloor2, 4) * 0.8 + Math.max(0, rawFloor2 - 4) * 0.3;
        const hpScale = tier === "boss" ? 8 : tier === "medium" ? 5 : 3;
        const dmgScale = tier === "boss" ? 2 : 1;
        base.hp += Math.round(scale * hpScale);
        base.maxHp = base.hp;
        base.damage += Math.round(scale * dmgScale);
        if (tier === "medium") {
          base.elite = true;
          base.eliteStars = Math.min(3, g.floor);
          base.hp = Math.round(base.hp * 1.25);
          base.maxHp = base.hp;
          base.damage += 2;
          base.tier = "medium";
          base.name = `${"⭐".repeat(base.eliteStars)} ${base.name}`;
        }
        const mod = randFrom(source.modifierPool || ["none"]);
        base.modifier = mod || "none";
        if (base.modifier === "stoneSkin") base.firstHitIgnored = true;
        const tierLabel = node.type === "boss" ? "👑 BOSS" : node.type === "elite" ? "⭐ Elite" : "⚔️ Combat";
        return {
          ...g,
          floor: nextFloor,
          room: 0,
          route: nextRoute,
          enemy: { ...nextRoute[0] },
          pendingEnemy: { ...nextRoute[0] },
          player: { ...g.player, shield: g.player.combatStartShield, rerollsLeft: g.player.rerollsPerTurn },
          phase: "shop",
          shopItems: buildShopInventory(remoteAdminConfig.pools),
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          cooldowns: emptyCooldowns(),
          grid: emptyGrid(),
          dice: [],
          selectedDieIndex: null,
          log: [`${tierLabel}: ${base.emoji} ${base.name}`, ...g.log].slice(0, 40),
          actionFlash: { id: Date.now(), text: `${tierLabel}: ${base.name}`, tone: node.type === "boss" ? "amber" : "rose" },
        };
      }

      if (node.type === "shop") {
        const shopRng = createRng(g.runSeed + ':shop:' + nodeId);
        const shopInventory = generateShopItems(g.floor, shopRng);
        return {
          ...g,
          mapLayers: updatedLayers,
          currentMapNodeId: nodeId,
          shopInventory,
          phase: "shop",
          pendingEnemy: card.enemy,
          shopItems: buildShopInventory(remoteAdminConfig.pools),
          pathChoices: [],
          mapChoices: [],
          actionFlash: { id: Date.now(), text: "🏪 Entering shop", tone: "amber" },
          log: [`🏪 Shop node selected`, ...g.log].slice(0, 40),
        };
      }

      let next = {
        ...g,
        coins: g.coins - item.cost,
        shopItems: g.shopItems.filter((s) => s.id !== item.id),
      };

      if (item.key === "heal-8") {
        const healed = Math.min(g.player.maxHp, g.player.hp + 8);
        next.player = { ...g.player, hp: healed };
        next.actionFlash = { id: Date.now(), text: `❤️ +${healed - g.player.hp} HP`, tone: "emerald" };
      } else if (item.key === "maxhp-5") {
        next.player = { ...g.player, maxHp: g.player.maxHp + 5, hp: g.player.hp + 5 };
        next.actionFlash = { id: Date.now(), text: "💪 +5 Max HP", tone: "emerald" };
      } else if (item.key === "weapon-common") {
        const artifact = pickArtifactByRarity(g.player.artifacts, ["gray", "common"]);
        if (artifact) next.player = applyArtifactToPlayer(next.player, artifact);
        next.actionFlash = { id: Date.now(), text: artifact ? `🗡️ ${artifact.name}` : "🗡️ No common left", tone: "amber" };
      } else if (item.key === "weapon-rare") {
        const artifact = pickArtifactByRarity(g.player.artifacts, ["gold", "rare", "chrome"]);
        if (artifact) next.player = applyArtifactToPlayer(next.player, artifact);
        next.actionFlash = { id: Date.now(), text: artifact ? `✨ ${artifact.name}` : "✨ No rare left", tone: "amber" };
      } else if (item.key === "reroll-shop") {
        next.shopItems = buildShopInventory(remoteAdminConfig.pools);
        next.actionFlash = { id: Date.now(), text: "🎲 Shop rerolled", tone: "sky" };
      } else if (item.key === "reroll-artifact") {
        next.artifactRerollTokens = (g.artifactRerollTokens || 0) + 1;
        next.actionFlash = { id: Date.now(), text: "🎁 +1 artifact reroll token", tone: "sky" };
      }

      if (node.type === "rest") {
        return {
          ...g,
          mapLayers: updatedLayers,
          currentMapNodeId: nodeId,
          phase: "rest",
          log: ["🏕️ You found a rest site.", ...g.log].slice(0, 40),
          actionFlash: { id: Date.now(), text: "🏕️ Rest", tone: "emerald" },
        };
      }

      return g;
    });
  }

  function handleEventChoice(choiceIndex: number) {
    setGame((g) => {
      if (!g.pendingEvent) return g;
      const rng = createRng(g.runSeed + ':ev-result:' + g.currentMapNodeId);
      const result = resolveEventChoice(g.pendingEvent, choiceIndex, { hp: g.player.hp, maxHp: g.player.maxHp, coins: g.player.coins }, rng);
      let player = { ...g.player };
      if (result.hpDelta) player.hp = Math.max(1, Math.min(player.maxHp, player.hp + result.hpDelta));
      if (result.coinDelta) player.coins = Math.max(0, (player.coins || 0) + result.coinDelta);
      if (result.maxHpDelta) { player.maxHp += result.maxHpDelta; player.hp += result.maxHpDelta; }
      if (result.attackBonusDelta) player.attackBonus += result.attackBonusDelta;
      if (result.healBonusDelta) player.healBonus += result.healBonusDelta;
      if (result.rerollDelta) { player.rerollsPerTurn += result.rerollDelta; player.rerollsLeft += result.rerollDelta; }
      if (result.combatStartShieldDelta) player.combatStartShield += result.combatStartShieldDelta;
      return {
        ...g,
        player,
        phase: "map",
        pendingEvent: null,
        log: [result.text, ...g.log].slice(0, 40),
        actionFlash: { id: Date.now(), text: result.text.slice(0, 40), tone: "emerald" },
      };
    });
  }

  function handleShopBuy(itemIndex: number) {
    setGame((g) => {
      if (g.phase !== "reward" || (g.artifactRerollTokens || 0) <= 0) return g;
      const nextOffers = g.startRewardPending ? buildStarterArtifactChoices(g.player, remoteAdminConfig.pools) : buildArtifactChoices(g.player, remoteAdminConfig.pools);
      return {
        ...g,
        player,
        shopInventory: newInventory,
        log: [`🛒 Bought: ${item.name}`, ...g.log].slice(0, 40),
        actionFlash: { id: Date.now(), text: `🛒 ${item.name} purchased`, tone: "emerald" },
      };
    });
  }

  function handleShopLeave() {
    setGame((g) => ({ ...g, phase: "map", shopInventory: null, actionFlash: { id: Date.now(), text: "🛒 Left the shop", tone: "sky" } }));
  }

  function handleRestChoice(optionId: string) {
    setGame((g) => {
      const option = REST_OPTIONS.find((r) => r.id === optionId);
      if (!option) return g;
      let player = { ...g.player };
      const e = option.effect;
      if (e.hpPctHeal) player.hp = Math.min(player.maxHp, player.hp + Math.round(player.maxHp * e.hpPctHeal));
      if (e.maxHpDelta) { player.maxHp += e.maxHpDelta; player.hp += e.maxHpDelta; }
      if (e.attackBonusDelta) player.attackBonus += e.attackBonusDelta;
      if (e.healBonusDelta) player.healBonus += e.healBonusDelta;
      if (e.coinDelta) player.coins = (player.coins || 0) + e.coinDelta;
      if (e.rerollDelta) { player.rerollsPerTurn += e.rerollDelta; player.rerollsLeft += e.rerollDelta; }
      return {
        ...g,
        player,
        phase: "map",
        log: [`🏕️ ${option.label}`, ...g.log].slice(0, 40),
        actionFlash: { id: Date.now(), text: `🏕️ ${option.label}`, tone: "emerald" },
      };
    });
  }

  function activateCompanionActive() {
    setGame((g) => {
      const companion = g.player.companion;
      if (!companion || companion.cooldownRemaining > 0) return g;
      let player = { ...g.player };
      let enemy = { ...g.enemy };
      const log = [];

      if (companion.active.type === 'skip_intent') {
        player.companionHypnosisActive = true;
        log.unshift(`🦎 Hypnose — enemy will skip their next intent!`);
      } else if (companion.active.type === 'flat_damage') {
        const dmg = companion.active.value ?? 8;
        enemy.hp -= dmg;
        log.unshift(`🐊 Leap — ${dmg} flat damage, ignores shield!`);
      } else if (companion.active.type === 'free_reroll_choice') {
        // Free reroll all current dice
        const meta = loadMeta();
        const geckoBonus = player.companion?.passive?.attackDieBonus ?? 0;
        const specialFaces = hasDiceSpecials(meta);
        const newDice = rollDice(g.player.dicePerTurn, specialFaces, geckoBonus);
        player.companion = startCompanionCooldown(companion);
        log.unshift(`👁️ Vision — free reroll! Pick the best dice.`);
        return {
          ...g,
          player,
          enemy,
          dice: newDice,
          selectedDieIndex: 0,
          log: [...log, ...g.log].slice(0, 40),
          actionFlash: { id: Date.now(), text: `👁️ Vision — free reroll!`, tone: 'sky' },
        };
      }

      player.companion = startCompanionCooldown(companion);
      return {
        ...g,
        player,
        enemy,
        log: [...log, ...g.log].slice(0, 40),
        actionFlash: { id: Date.now(), text: log[0] || `Companion ability used`, tone: 'emerald' },
      };
    });
  }

  function activateKaPower() {
    setGame((g: any) => {
      if (!g.player.kaCharged) return g;
      if (g.phase !== 'place') return g;
      const power = g.player.kaPower;
      if (!power) return g;
      const newState = power.activate({ ...g });
      // Haptic
      const tg = (window as any).Telegram?.WebApp;
      tg?.HapticFeedback?.impactOccurred('rigid');
      setTimeout(() => tg?.HapticFeedback?.impactOccurred('rigid'), 150);
      setTimeout(() => tg?.HapticFeedback?.impactOccurred('rigid'), 300);
      return {
        ...newState,
        player: {
          ...newState.player,
          kaFragments: 0,
          kaCharged: false,
        }
      };
    });
  }

  function applyKillRewardPick(rewardId: string) {
    setGame((g: any) => {
      if (!g.killRewardPending) return g;
      if (g.killRewardsPicked.includes(rewardId)) return g;
      if (g.killRewardsPicked.length >= g.killRewardPicksAllowed) return g;
      const reward = g.killRewardsOffered.find((r: any) => r.id === rewardId);
      if (!reward) return g;
      const applied = reward.apply(g.player, g);
      const newPicked = [...g.killRewardsPicked, rewardId];
      const done = newPicked.length >= g.killRewardPicksAllowed;
      const nextPhase = done
        ? (g.enemy?.tier === 'boss' ? 'reward' : (g.mapLayers ? 'map' : 'roll'))
        : 'kill_reward';
      // For boss: set up artifact reward when done
      let combatRewardPending = g.combatRewardPending;
      let artifactsOffered = g.artifactsOffered;
      if (done && g.enemy?.tier === 'boss') {
        combatRewardPending = true;
        artifactsOffered = buildArtifactChoices(applied?.player || g.player);
      }
      return {
        ...g,
        ...(applied || {}),
        player: { ...(applied?.player || g.player) },
        killRewardsPicked: newPicked,
        killRewardPending: !done,
        phase: nextPhase,
        combatRewardPending,
        artifactsOffered,
        log: [`🎁 ${reward.icon} ${reward.name} picked!`, ...g.log].slice(0, 40),
        actionFlash: { id: Date.now(), text: `${reward.icon} ${reward.name}!`, tone: 'amber' },
      };
    });
  }

  function skipKillRewards() {
    setGame((g: any) => {
      if (g.killRewardMustPick) return g;
      const nextPhase = g.enemy?.tier === 'boss' ? 'reward' : (g.mapLayers ? 'map' : 'roll');
      let combatRewardPending = g.combatRewardPending;
      let artifactsOffered = g.artifactsOffered;
      if (g.enemy?.tier === 'boss') {
        combatRewardPending = true;
        artifactsOffered = buildArtifactChoices(g.player);
      }
      return {
        ...g,
        killRewardPending: false,
        phase: nextPhase,
        combatRewardPending,
        artifactsOffered,
      };
    });
  }

  function restart() {
    if (onBeforeRestart && !onBeforeRestart()) {
      setGame((g) => ({ ...g, actionFlash: { id: Date.now(), text: "🚫 No run tickets left", tone: "rose" } }));
      return;
    }
    setLastRunReward(null);
    setShowRestartConfirm(false);
    setGame(makeInitialState());
  }

  // Welcome bonus: +50 gems on first ever launch
  useEffect(() => {
    let mounted = true;
    fetch('/api/miniapp/config')
      .then((res) => res.json())
      .then((payload) => {
        if (!mounted || !payload?.ok) return;
        const cfg = payload.config || {};
        setRemoteAdminConfig({
          ...DEFAULT_REMOTE_ADMIN_CONFIG,
          ...cfg,
          visuals: { ...DEFAULT_REMOTE_ADMIN_CONFIG.visuals, ...(cfg.visuals || {}) },
          characters: {
            playable: { ...(cfg.characters?.playable || {}) },
            emotionUrls: { ...(cfg.characters?.emotionUrls || {}) },
          },
          narrative: {
            kabalian: Array.isArray(cfg.narrative?.kabalian) ? cfg.narrative.kabalian : [],
            kkm: Array.isArray(cfg.narrative?.kkm) ? cfg.narrative.kkm : [],
          },
          pools: {
            ...DEFAULT_REMOTE_ADMIN_CONFIG.pools,
            ...(cfg.pools || {}),
          },
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const notifiedRunRef = useRef<string | null>(null);

  useEffect(() => {
    if (!game.runEnded) return;
    const runId = `${game.runSeed}:${game.score}:${game.floor}`;
    if (notifiedRunRef.current === runId) return;
    notifiedRunRef.current = runId;

    // Award XP/gems and update unlock tree
    const currentMeta = loadMeta();
    const bossZone = game.lastBossFloor ?? undefined;
    const { next, reward } = recordRunEnd(currentMeta, {
      score: game.score,
      floor: game.floor,
      kills: game.winStreak,
      bossZone,
    });
    saveMeta(next);
    setMeta(next);
    setLastRunReward(reward);
    submitToLeaderboard(game.score, game.floor, game.runSeed);

    if (onRunEnded) {
      onRunEnded({
        score: game.score,
        floor: game.floor,
        runSeed: game.runSeed,
        characterId: game.player.characterId,
      });
    }
  }, [game.runEnded, game.runSeed, game.score, game.floor, game.player.characterId, game.winStreak, game.phase, onRunEnded]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setGame((g) => ({ ...g, showAllLogs: false, showHowToPlay: false }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!game.actionFlash) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => (g.actionFlash ? { ...g, actionFlash: null } : g));
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [game.actionFlash]);

  useEffect(() => {
    localStorage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(serializeGameState(game)));
  }, [game]);

  useEffect(() => {
    if (!game.enemyAttackPulse) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => (g.enemyAttackPulse ? { ...g, enemyAttackPulse: 0 } : g));
    }, 420);
    return () => window.clearTimeout(timeout);
  }, [game.enemyAttackPulse]);

  useEffect(() => {
    if (!game.enemyHitPulse) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => (g.enemyHitPulse ? { ...g, enemyHitPulse: 0 } : g));
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [game.enemyHitPulse]);

  useEffect(() => {
    if (!game.damagePopups.length) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => ({ ...g, damagePopups: [] }));
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [game.damagePopups]);

  useEffect(() => {
    if (!game.scorePopups.length) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => ({ ...g, scorePopups: [], comboPopup: null }));
    }, 1400);
    return () => window.clearTimeout(timeout);
  }, [game.scorePopups]);

  useEffect(() => {
    if (!game.lastOutcome) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => (g.lastOutcome ? { ...g, lastOutcome: null } : g));
    }, 2600);
    return () => window.clearTimeout(timeout);
  }, [game.lastOutcome]);


  useEffect(() => {
    if (tgUserId && !walletAddress) refreshCosmetics("");
  }, [tgUserId]);

  // Auto-resolve listener (called by countdown when time runs out)
  useEffect(() => {
    function handleAutoResolve() {
      setGame((g) => {
        if (g.phase !== "place") return g;
        const newGrid = g.grid.map((row) => [...row]);
        const newCooldowns = g.cooldowns.map((row) => [...row]);
        // Mark placed slots with cooldown
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
          if (newGrid[y][x] !== null) newCooldowns[y][x] = g.player.cooldownBase;
        }
        window.setTimeout(() => resolveTurn(newGrid, newCooldowns), 50);
        return { ...g, grid: newGrid, cooldowns: newCooldowns, phase: "resolving", dice: [] };
      });
    }
    window.addEventListener("diejungle:autoresolve", handleAutoResolve);
    return () => window.removeEventListener("diejungle:autoresolve", handleAutoResolve);
  }, []);

  // ── 7-second turn countdown ─────────────────────────────────────────────────
  useEffect(() => {
    if (game.phase !== "place" || game.characterSelectPending) {
      setTurnTimer(0);
      if (turnTimerRef.current) { clearInterval(turnTimerRef.current); turnTimerRef.current = null; }
      return;
    }
    setTurnTimer(7);
    turnTimerRef.current = setInterval(() => {
      setTurnTimer((t) => {
        if (t <= 1) {
          clearInterval(turnTimerRef.current as ReturnType<typeof setInterval>);
          turnTimerRef.current = null;
          // Auto-fill empty slots with current dice and resolve
          setGame((g) => {
            if (g.phase !== "place") return g;
            const grid = g.grid.map((row) => [...row]);
            const dice = [...g.dice];
            // Place remaining dice into first available empty slots
            for (let di = 0; di < dice.length; di++) {
              if (dice[di] === null) continue;
              let placed = false;
              for (let y = 0; y < 3 && !placed; y++) {
                for (let x = 0; x < 3 && !placed; x++) {
                  if (grid[y][x] === null && g.cooldowns[y][x] === 0) {
                    grid[y][x] = dice[di];
                    dice[di] = null;
                    placed = true;
                  }
                }
              }
            }
            return { ...g, grid, dice, log: ["⏱️ Time's up! Auto-placed remaining dice.", ...g.log].slice(0, 40) };
          });
          // Trigger resolve after brief delay
          window.setTimeout(() => {
            setGame((g) => {
              if (g.phase === "place") {
                // Trigger resolve by simulating all dice placed
                window.dispatchEvent(new CustomEvent("diejungle:autoresolve"));
              }
              return g;
            });
          }, 200);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (turnTimerRef.current) { clearInterval(turnTimerRef.current); turnTimerRef.current = null; } };
  }, [game.phase, game.characterSelectPending]);

  const totalArtifacts = game.player.artifacts.length;
  const avatarUrl = game.player.characterId === "kkm" ? game.player.avatar : (PLAYER_EMOTION_URLS[game.avatarMood] || game.player.avatar || PLAYER_AVATAR_URL);
  const avatarRing = game.avatarMood === "hurt"
    ? "ring-2 ring-rose-400/70"
    : game.avatarMood === "almostDead"
      ? "ring-2 ring-red-500/80"
      : game.avatarMood === "shocked"
        ? "ring-2 ring-fuchsia-300/75"
    : game.avatarMood === "victory"
      ? "ring-2 ring-amber-300/75"
      : game.avatarMood === "fierce"
        ? "ring-2 ring-orange-400/70"
        : "";

  const flashTone = {
    rose: "border-rose-300/50 bg-rose-500/20 text-rose-100",
    cyan: "border-cyan-300/50 bg-cyan-500/20 text-cyan-100",
    emerald: "border-emerald-300/50 bg-emerald-500/20 text-emerald-100",
    amber: "border-amber-300/50 bg-amber-500/20 text-amber-100",
    sky: "border-sky-300/50 bg-sky-500/20 text-sky-100",
  };

  const hoveredPreview = hoveredSlot && activeDieValue
    ? (() => {
      const mult = rowMultiplier(game.player, hoveredSlot.y);
      const dieMeta = getDieMeta(activeDieValue);
      if (dieMeta.kind === "shield") return `${dieMeta.emoji} ${activeDieValue.value} ×${mult} = ${activeDieValue.value * mult}`;
      if (dieMeta.kind === "heal") return `${dieMeta.emoji} ${activeDieValue.value} ×${mult} = ${(activeDieValue.value + game.player.healBonus) * mult}`;
      return `${dieMeta.emoji} ${activeDieValue.value} ×${mult} = ${(activeDieValue.value + game.player.attackBonus + game.player.attackDieValueBonus) * mult}`;
    })()
    : null;

  // Biome background
  const biome = BIOMES[game.currentBiome ?? 'jungle'] ?? BIOMES.jungle;
  const bgUrl = getBiomeBackground(game.currentBiome ?? 'jungle');
  const effectiveBg = bgUrl || BG_URL;

  // XP bar
  const xpInfo = xpToNextLevel(meta.xp);
  const xpPct = xpInfo.needed > 0 ? Math.min(100, (xpInfo.current / xpInfo.needed) * 100) : 100;

  const boardRightContent = game.phase === "place" && turnTimer > 0 ? (
    <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-black text-lg transition-all ${
      turnTimer <= 3
        ? "animate-pulse border-rose-400/70 bg-rose-500/20 text-rose-200 shadow-[0_0_12px_rgba(239,68,68,0.35)]"
        : "border-amber-300/40 bg-amber-400/15 text-amber-200"
    }`}>
      {turnTimer <= 3 ? "⚠️" : "⏱️"} <span className="text-2xl">{turnTimer}</span>
    </div>
  ) : (
    <div className="text-[9px] text-zinc-300">Place dice on available slots</div>
  );

  return (
    <div className="min-h-screen overflow-y-auto bg-cover bg-center bg-no-repeat p-2 text-white" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.62), rgba(0,0,0,.78)), url(${effectiveBg})` }}>
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-1.5 pb-3 md:gap-2">
        <div className="rounded-[22px] border border-amber-300/20 bg-black/35 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            {/* Left: logo + title */}
            <div className="flex items-center gap-1.5">
              <img src={LOGO_URL} alt="Kabal logo" className="h-8 w-8 object-contain md:h-9 md:w-9" />
              <div>
                <h1 className="font-serif text-sm italic tracking-wide text-amber-300 md:text-2xl">DIE JUNGLE</h1>
                <p className="text-[9px] text-zinc-100 md:text-xs">{biome.emoji} {biome.name} · Z{game.floor}</p>
              </div>
            </div>
            {/* Center chips: Score · Coins · Room · Streak */}
            <div className="flex flex-wrap items-center gap-1">
              {/* Score — prominent violet */}
              <div className="flex items-center gap-1 rounded-lg border border-violet-400/25 bg-violet-900/20 px-2 py-1">
                <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-400">Score</span>
                <span className="text-sm font-black text-violet-300 md:text-base">{game.score}</span>
              </div>
              {/* Coins */}
              <div className="flex items-center gap-0.5 rounded-lg border border-yellow-400/20 bg-yellow-900/15 px-2 py-1 text-[11px] font-black text-yellow-300">
                🪙 {game.player.coins || 0}
              </div>
              {/* Room */}
              <div className="flex items-center gap-0.5 rounded-lg border border-amber-400/20 bg-amber-900/15 px-2 py-1 text-[10px] font-black text-amber-200">
                R{game.room + 1}/{game.route.length}
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-black/40 px-2 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Coins</div>
                <div className="text-xs font-black text-amber-300 md:text-sm">🪙 {game.coins}</div>
              </div>
              <div className="rounded-xl border border-cyan-300/25 bg-black/40 px-2 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Gems</div>
                <div className="text-xs font-black text-cyan-200 md:text-sm">💎 {game.gems}</div>
              </div>
              <div className="rounded-xl border border-sky-300/30 bg-sky-500/20 px-2.5 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-200">Player</div>
                <div className="max-w-[130px] truncate text-xs font-black text-sky-100 md:max-w-[190px] md:text-sm">{telegramUserLabel}</div>
              </div>
            </div>
            {/* Right: XP chip + gems + help + restart */}
            <div className="flex items-center gap-1 md:gap-1.5">
              {/* Clickable XP chip */}
              <button
                onClick={() => setShowXpPanel(true)}
                className="flex flex-col items-end gap-0.5 rounded-xl border border-amber-400/20 bg-amber-950/20 px-2 py-1 hover:bg-amber-950/35 transition"
              >
                <span className="text-[9px] text-amber-300 font-black">Lv.{xpInfo.level}</span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-800 border border-zinc-700">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${xpPct}%` }} />
                </div>
              </button>
              <button onClick={() => setShowArsenal(true)} className="rounded-xl border border-violet-400/20 bg-black/40 px-2 py-1.5 text-right hover:bg-violet-900/30 transition">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Gems</div>
                <div className="text-xs font-black text-violet-300">💎 {meta.gems}</div>
              </button>
              <Button onClick={() => setGame((g) => ({ ...g, showHowToPlay: true }))} className="rounded-xl bg-white/10 px-2 py-1.5 text-white hover:bg-white/20 text-xs">❓</Button>
              {!game.runEnded && game.phase !== 'reward' && game.phase !== 'map' && (
                <Button
                  onClick={() => setShowRestartConfirm(true)}
                  className="rounded-xl bg-rose-500/15 px-2 py-1.5 text-rose-300 hover:bg-rose-500/30 text-xs"
                >↺</Button>
              )}
            </div>
          </div>
        </div>

        {/* ✨ GOLDEN KABAL DICE — choice overlay */}
        {game.phase === "place" && game.goldenDicePending && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[18px] border-2 border-amber-300/70 bg-gradient-to-r from-amber-900/80 via-yellow-900/70 to-amber-900/80 px-4 py-3 shadow-[0_0_24px_4px_rgba(252,211,77,0.25)] backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-2">
                <motion.span
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-2xl"
                >✨</motion.span>
                <span className="font-black text-amber-200 text-sm md:text-base">Golden Kabal Dice appeared!</span>
                <motion.span
                  animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-2xl"
                >✨</motion.span>
              </div>
              <p className="text-xs text-amber-300/80">Value 6 · Auto special · Choose your die type:</p>
              <div className="flex gap-2">
                {([
                  { kind: 'attack', emoji: '⚔️', label: 'Attack', special: 'Pierce', cls: 'border-rose-400/60 bg-rose-800/60 hover:bg-rose-700/80 text-rose-100' },
                  { kind: 'shield', emoji: '🛡️', label: 'Shield', special: 'Fortress', cls: 'border-sky-400/60 bg-sky-800/60 hover:bg-sky-700/80 text-sky-100' },
                  { kind: 'heal',   emoji: '❤️', label: 'Heal',   special: 'Nurture', cls: 'border-pink-400/60 bg-pink-800/60 hover:bg-pink-700/80 text-pink-100' },
                ] as const).map(opt => (
                  <button
                    key={opt.kind}
                    onClick={() => chooseGoldenDice(opt.kind as any)}
                    className={`flex flex-col items-center gap-1 rounded-[14px] border px-4 py-2.5 text-sm font-black transition active:scale-95 ${opt.cls}`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span>{opt.label}</span>
                    <span className="text-[9px] font-normal opacity-70">{opt.special}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── COMBAT 6-BAND LAYOUT (mobile-first, no-scroll) ─────────────────── */}
        <div className="flex flex-1 flex-col gap-1 overflow-hidden">

          {/* ── Band 2: ARENA ─────────────────────────────────────── */}
          <div className="shrink-0 rounded-[16px] border border-white/10 bg-gradient-to-r from-cyan-950/40 via-black/50 to-rose-950/40 px-2 py-1.5" style={{ minHeight: 90, maxHeight: 104 }}>
            <div className="flex items-center justify-between gap-1 h-full">
              {/* Player half (LEFT) */}
              <div className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
                <button
                  onClick={() => setShowPlayerDrawer(v => !v)}
                  className="relative h-16 w-full"
                  aria-label="Player info"
                >
                  <motion.img
                    ref={playerAnchorRef}
                    src={avatarUrl}
                    alt="Kabalian"
                    animate={game.avatarMood === "hurt" ? { x: [0, -2, 2, -2, 0] } : game.avatarMood === "victory" ? { y: [0, -3, 0] } : { x: 0, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className={`h-full w-full rounded-xl border border-white/10 bg-black/30 object-contain ${avatarRing}`}
                  />
                  <span className="absolute bottom-0.5 left-0.5 rounded bg-black/60 px-1 text-[7px] text-zinc-300">tap &#x25BE;</span>
                </button>
                <div className="truncate text-[10px] font-black text-cyan-100 leading-none">
                  {game.player.PLAYER_CHARACTERS?.[game.player.characterId]?.name ?? game.player.characterId}
                </div>
                <div className="flex w-full items-center gap-0.5">
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (game.player.hp / game.player.maxHp) * 100))}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-cyan-300 shrink-0">{game.player.hp}/{game.player.maxHp}</span>
                </div>
                <div className="flex items-center gap-0.5 flex-wrap justify-center">
                  {(game.player.shield || 0) > 0 && (
                    <span className="rounded-full border border-cyan-400/30 bg-cyan-900/40 px-1.5 py-0.5 text-[9px] font-black text-cyan-200">&#x1F6E1;&#xFE0F;{game.player.shield}</span>
                  )}
                  <span className="rounded-full border border-amber-400/20 bg-amber-900/20 px-1.5 py-0.5 text-[9px] text-amber-300">&#x1F501;{game.player.rerollsLeft}</span>
                </div>
              </div>

              {/* VS center */}
              <div className="flex shrink-0 flex-col items-center gap-0.5 px-1">
                <span className="text-[10px] font-black text-zinc-400">VS</span>
              </div>

              {/* Enemy half (RIGHT) */}
              <div className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
                <button onClick={() => setShowEnemyDrawer(v => !v)} className="relative h-16 w-full" aria-label="Enemy info">
                  <motion.img
                    ref={enemyAnchorRef}
                    src={game.enemy.image}
                    alt={game.enemy.name}
                    animate={game.enemyHitPulse ? { scale: [1, 1.12, 0.96, 1], filter: ["brightness(1)", "brightness(1.55)", "brightness(1)"] } : game.enemyAttackPulse ? { x: [0, -10, 10, -8, 8, 0], scale: [1, 1.06, 1] } : intent.type === "attack" ? { scale: [1, 1.03, 1], x: [0, -2, 2, 0] } : { scale: 1, x: 0 }}
                    transition={{ duration: 0.45 }}
                    className="h-full w-full object-contain contrast-110 saturate-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                  />
                  <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[7px] text-zinc-300">tap &#x25BE;</span>
                </button>
                <div className="truncate text-[10px] font-black text-rose-100 leading-none">{game.enemy.emoji} {game.enemy.name}{game.enemy.elite ? ` ${"⭐".repeat(game.enemy.eliteStars || 1)}` : ""}</div>
                <div className="flex w-full items-center gap-0.5">
                  <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (game.enemy.hp / game.enemy.maxHp) * 100))}%` }} />
                  </div>
                  <span className="text-[9px] font-black text-rose-300 shrink-0">{game.enemy.hp}/{game.enemy.maxHp}</span>
                </div>
                <div className="flex items-center gap-0.5 flex-wrap justify-center">
                  <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black leading-none ${intentMeta(intent.type).color} border-current/30 bg-black/40`}>
                    {intentMeta(intent.type).emoji} {intent.type} {intent.value}
                  </span>
                  {(game.enemy.shield || 0) > 0 && (
                    <span className="rounded-full border border-rose-400/30 bg-rose-900/40 px-1 py-0.5 text-[9px] text-rose-200">&#x1F6E1;{game.enemy.shield}</span>
                  )}
                  {(game.enemy.charge || 0) > 0 && (
                    <motion.span
                      animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="rounded-full border border-amber-400/50 bg-amber-600/30 px-1 py-0.5 text-[9px] font-black text-amber-100"
                    >
                      &#x26A1;+{game.enemy.charge}
                    </motion.span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Enemy Drawer ─────────────────────────────────────── */}
          <AnimatePresence>
            {showEnemyDrawer && game.enemy && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="shrink-0 overflow-hidden rounded-[14px] border border-rose-400/20 bg-rose-950/40"
              >
                <div className="px-2 py-1.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">
                      {game.enemy.emoji} {game.enemy.name} — Détails
                    </span>
                    <button onClick={() => setShowEnemyDrawer(false)} className="text-[10px] text-zinc-400 hover:text-white">&#x2715;</button>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[9px]">
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-zinc-200">
                      {game.enemy.tier === "boss" ? "👑 Boss" : game.enemy.tier === "medium" ? "⚔️ Champion" : "💀 Mob"}
                    </span>
                    <span className="rounded-full border border-rose-400/20 bg-rose-900/20 px-2 py-0.5 text-rose-300">
                      ❤️ {game.enemy.hp}/{game.enemy.maxHp} HP
                    </span>
                    {(game.enemy.atk || game.enemy.atkMin) ? (
                      <span className="rounded-full border border-rose-400/20 bg-rose-900/20 px-2 py-0.5 text-rose-300">
                        ⚔️ {game.enemy.atkMin ?? game.enemy.atk}–{game.enemy.atkMax ?? game.enemy.atk} ATK
                      </span>
                    ) : null}
                    {(game.enemy.shield || 0) > 0 && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-900/20 px-2 py-0.5 text-cyan-300">
                        🛡️ {game.enemy.shield} shield
                      </span>
                    )}
                    {(game.enemy.charge || 0) > 0 && (
                      <span className="rounded-full border border-amber-400/20 bg-amber-900/20 px-2 py-0.5 text-amber-300">
                        ⚡ +{game.enemy.charge} charge
                      </span>
                    )}
                    {game.enemy.modifier && game.enemy.modifier !== "none" && (() => {
                      const mod = MODIFIERS[game.enemy.modifier] || null;
                      return mod ? (
                        <span className="rounded-full border border-violet-400/30 bg-violet-900/30 px-2 py-0.5 text-violet-300">
                          ✨ {mod.name} — {mod.desc}
                        </span>
                      ) : null;
                    })()}
                    {game.enemy.elite && (
                      <span className="rounded-full border border-amber-400/40 bg-amber-800/30 px-2 py-0.5 text-amber-200 font-black">
                        {"⭐".repeat(game.enemy.eliteStars || 1)} Élite
                      </span>
                    )}
                  </div>
                  {/* Next intent preview */}
                  <div className="mt-1 flex items-center gap-1 rounded-[10px] border border-rose-400/15 bg-black/30 px-2 py-1 text-[9px]">
                    <span className="text-zinc-400">Prochain intent :</span>
                    <span className={`font-black ${intentMeta(intent.type).color}`}>
                      {intentMeta(intent.type).emoji} {intent.type} {intent.value}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Player Drawer (slide-up sheet) ───────────────────── */}
          <AnimatePresence>
            {showPlayerDrawer && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="shrink-0 overflow-hidden rounded-[14px] border border-cyan-400/20 bg-cyan-950/40"
              >
                <div className="px-2 py-1.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Player Info</span>
                    <button onClick={() => setShowPlayerDrawer(false)} className="text-[10px] text-zinc-400 hover:text-white">&#x2715;</button>
                  </div>
                  <div className="flex flex-wrap gap-1 text-[9px]">
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-zinc-200">CD {game.player.cooldownBase} &middot; Tick {game.player.cooldownTick}</span>
                    <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-zinc-200">Arts {totalArtifacts}</span>
                    {(game.player.attackBonus || 0) !== 0 && <span className="rounded-full border border-rose-400/20 bg-rose-900/20 px-2 py-0.5 text-rose-300">+{game.player.attackBonus} ATK</span>}
                    {(game.player.healBonus || 0) !== 0 && <span className="rounded-full border border-emerald-400/20 bg-emerald-900/20 px-2 py-0.5 text-emerald-300">+{game.player.healBonus} HEAL</span>}
                  </div>
                  {game.player.companion && (
                    <div className="mt-1 flex items-center gap-1 rounded-[10px] border border-emerald-400/20 bg-emerald-900/15 px-2 py-1 text-[9px]">
                      <span>{game.player.companion.emoji} {game.player.companion.name}</span>
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-[8px] font-black border ${game.player.companion.cooldownRemaining === 0 ? 'bg-emerald-600/40 border-emerald-400/50 text-emerald-200' : 'bg-zinc-800 border-zinc-600 text-zinc-400'}`}>
                        {game.player.companion.cooldownRemaining === 0 ? 'READY' : `CD ${game.player.companion.cooldownRemaining}`}
                      </span>
                    </div>
                  )}
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-[0.1em] text-zinc-500">Ka</span>
                    {[0,1,2,3].map(i => (
                      <span key={i} className={`text-[11px] transition-colors ${i < game.player.kaFragments ? 'text-amber-400' : 'text-zinc-700'}`}>◆</span>
                    ))}
                    {game.player.kaCharged && (
                      <span className="text-[9px] font-black text-amber-400 tracking-wide animate-pulse">PRÊT</span>
                    )}
                  </div>
                  {game.player.artifacts.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 max-h-14 overflow-auto">
                      {game.player.artifacts.map((artifact) => (
                        <div key={`drawer-${artifact.id}`} className="flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[8px]">
                          {artifact.image ? <img src={artifact.image} alt={artifact.name} className="h-3 w-3 rounded-full object-cover" /> : <span>&#x2728;</span>}
                          <span>{artifact.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Band 3: DICE ROW ──────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-center gap-1.5 py-0.5" style={{ minHeight: 48 }}>
            {game.phase === "place" ? (
              <button onClick={() => shiftSelectedDie(-1)} className="h-10 rounded-xl border border-white/20 bg-gradient-to-b from-zinc-800/80 to-zinc-900 px-3 text-white font-black hover:from-zinc-700">&lt;</button>
            ) : null}
            {game.dice.some((d) => d !== null) ? (
              game.dice.map((die, i) => die !== null ? (
                <DiceFace
                  key={`${die.id}-${i}-${game.rolling}`}
                  value={die}
                  selected={i === activeDieIndex && game.phase === "place"}
                  rolling={game.rolling}
                  onClick={game.phase === "place" ? () => setGame((g) => ({ ...g, selectedDieIndex: i })) : undefined}
                />
              ) : null)
            ) : (
              <div className="text-[11px] text-zinc-100">&#x1F3B2; No dice yet. Press <span className="font-black text-amber-300">ROLL</span>.</div>
            )}
            {game.phase === "place" ? (
              <button onClick={() => shiftSelectedDie(1)} className="h-10 rounded-xl border border-white/20 bg-gradient-to-b from-zinc-800/80 to-zinc-900 px-3 text-white font-black hover:from-zinc-700">&gt;</button>
            ) : null}
          </div>

          {/* ── Band 4: GRID 3x3 with lane labels ────────────────── */}
          <div className="shrink-0">
            {activeDieMeta && game.phase === "place" ? (
              <div className="mb-1 flex items-center gap-1.5 rounded-[10px] border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[10px] text-white">
                <span className="text-base">{activeDieMeta.emoji}</span>
                <span className="font-black text-amber-300">{activeDieMeta.label}</span>
                <span className="text-[9px] text-zinc-200 truncate">{activeDieMeta.desc}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-1 justify-center">
              {/* Grid */}
              <div
                className="grid gap-0.5"
                style={{
                  width: 'min(240px, calc(100vw - 80px))',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gridTemplateRows: 'repeat(3, minmax(0, 1fr))',
                }}
              >
                {game.grid.map((row, y) =>
                  row.map((cell, x) => {
                    const cooldown = game.cooldowns[y][x];
                    const blocked = cooldown > 0;
                    const canPlace = game.phase === "place" && !blocked && cell === null && activeDieIndex !== null;
                    const cellMeta = cell !== null ? getDieMeta(cell) : null;
                    return (
                      <button
                        key={`${x}-${y}`}
                        onClick={() => activeDieIndex !== null && placeDie(activeDieIndex, x, y)}
                        onMouseEnter={() => setHoveredSlot({ x, y })}
                        onMouseLeave={() => setHoveredSlot(null)}
                        className={`relative aspect-square overflow-hidden rounded-[8px] border text-white transition ${canPlace ? "border-amber-300/60 ring-2 ring-amber-300/20" : "border-white/20"}`}
                      >
                        <img src={LANE_IMAGES[y]} className="absolute inset-0 h-full w-full object-contain" />
                        {cell !== null ? (
                          <>
                            <div className="absolute inset-0 bg-black/10" />
                            <img src={getDieImage(cell)} className="absolute inset-0 h-full w-full object-contain" />
                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1 text-[8px] font-black">
                              {cellMeta?.emoji} {cell.value}
                            </div>
                          </>
                        ) : blocked ? (
                          <>
                            <div className="absolute inset-0 bg-red-950/60" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[9px] font-bold">
                              &#x23F3; {cooldown}
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-black/25" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-[11px] font-bold tracking-[0.06em]">
                              PLACE
                              {canPlace ? <span className="text-[9px] text-amber-200">{activeDieMeta?.emoji}</span> : null}
                            </div>
                          </>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
              {/* Lane bonus labels on the right */}
              <div
                className="flex flex-col justify-between gap-0.5 shrink-0"
                style={{ height: 'min(240px, calc(100vw - 80px))' }}
              >
                {[0, 1, 2].map(rowIndex => (
                  <div key={rowIndex} className="flex flex-col items-start justify-center flex-1 px-1">
                    <span className="text-[7px] text-zinc-400">x{rowMultiplier(game.player, rowIndex)}</span>
                    <span className={`text-[8px] font-black mt-0.5 ${
                      game.laneBonuses?.[rowIndex]?.isMalus ? 'text-red-400' : 'text-amber-300'
                    }`}>
                      {game.laneBonuses?.[rowIndex]?.display ?? (
                        rowIndex === 0 ? '+1 ⚔️' : rowIndex === 1 ? '+1 ❤️' : '+1 🛡️'
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Band 5: ACTION BUTTONS ────────────────────────────── */}
          <div className="shrink-0 flex gap-1.5 px-0.5" style={{ minHeight: 44 }}>
            {/* Ka bar + power button */}
            {(game.phase === 'place' || game.phase === 'roll') && (
              <div className="flex items-center gap-1.5">
                {/* Ka fragments */}
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: 3,
                    border: `1px solid ${i < (game.player.kaFragments || 0) ? '#fbbf24' : 'rgba(255,255,255,0.15)'}`,
                    background: i < (game.player.kaFragments || 0) ? '#854f0b' : 'transparent',
                    transition: 'all 0.2s',
                  }} />
                ))}
                {/* Ka Power button */}
                {game.phase === 'place' && (
                  <button
                    onClick={activateKaPower}
                    disabled={!game.player.kaCharged}
                    className={`rounded-lg border px-2 py-1 text-[10px] font-black transition ${
                      game.player.kaCharged
                        ? 'border-amber-400/80 bg-amber-900/40 text-amber-300 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                        : 'border-white/10 bg-black/30 text-zinc-600 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    {game.player.kaPower?.icon} {game.player.kaPower?.name || 'Ka'}
                  </button>
                )}
              </div>
            )}
            {game.phase === "roll" ? (
              <div className="flex-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200 self-center">
                Press ROLL to start turn
              </div>
            ) : null}
            {(game.phase === "roll" || game.phase === "rolling") ? (
              BTN_IMAGES.roll ? (
                <div className="w-full flex justify-center">
                  <ActionBtn
                    imgSrc={BTN_IMAGES.roll}
                    label={game.rolling ? "Rolling..." : "ROLL"}
                    onClick={startRoll}
                    disabled={game.rolling}
                    pulse={game.phase === "roll" && !game.rolling}
                    imgClassName="!h-24 !max-w-[280px]"
                  />
                </div>
              ) : (
                <Button
                  onClick={startRoll}
                  disabled={game.rolling}
                  className={`flex-1 rounded-2xl bg-amber-400 py-2.5 text-sm font-black text-black hover:bg-amber-300 disabled:opacity-60 ${game.phase === "roll" && !game.rolling ? "animate-pulse shadow-[0_0_0_6px_rgba(252,211,77,0.20)]" : ""}`}
                >
                  {game.rolling ? "&#x1F3B2; Rolling..." : "&#x1F3B2; ROLL"}
                </Button>
              )
            ) : null}
            {game.phase === "place" ? (
              <Button onClick={rerollActiveDie} disabled={game.player.rerollsLeft <= 0 || activeDieIndex === null} className="rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-700/90 to-zinc-900 px-5 py-2.5 text-sm font-black text-white hover:from-zinc-600 hover:to-zinc-800 disabled:opacity-40">
                🔁 REROLL
              </Button>
            ) : null}
            {game.player.companionId && (game.phase === "place" || game.phase === "roll") ? (() => {
              const comp = COMPANIONS.find((c) => c.id === game.player.companionId);
              if (!comp) return null;
              const ready = game.player.companionCooldown === 0;
              return (
                <Button
                  onClick={useCompanionAbility}
                  disabled={!ready}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-black transition ${ready ? "border-emerald-300/50 bg-emerald-700/30 text-emerald-100 hover:bg-emerald-700/45 shadow-[0_0_0_4px_rgba(110,231,183,0.12)]" : "border-white/15 bg-black/35 text-zinc-500 disabled:opacity-40"}`}
                >
                  {comp.abilityEmoji} {comp.abilityName} {ready ? "READY" : `CD ${game.player.companionCooldown}`}
                </Button>
              );
            })() : null}
            {(game.phase === "gameover" || game.phase === "victory") ? (
              <>
                {BTN_IMAGES.reroll ? (
                  <ActionBtn
                    imgSrc={BTN_IMAGES.reroll}
                    label="REROLL"
                    onClick={rerollActiveDie}
                    disabled={game.player.rerollsLeft <= 0 || activeDieIndex === null}
                  />
                ) : (
                  <Button
                    onClick={rerollActiveDie}
                    disabled={game.player.rerollsLeft <= 0 || activeDieIndex === null}
                    className="flex-1 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-700/90 to-zinc-900 py-2.5 text-sm font-black text-white hover:from-zinc-600 hover:to-zinc-800 disabled:opacity-40"
                  >
                    &#x1F501; REROLL
                  </Button>
                )}
                {game.cooldowns.some(row => row.some(v => v > 0)) && (
                  <Button
                    onClick={freeCooldownSlot}
                    disabled={game.player.rerollsLeft <= 0}
                    title="Spend 1 reroll to free the most blocked cooldown slot"
                    className="flex-1 rounded-2xl border border-sky-400/30 bg-gradient-to-b from-sky-800/50 to-sky-900/70 py-2.5 text-sm font-black text-sky-200 hover:from-sky-700/60 hover:to-sky-800/80 disabled:opacity-40"
                  >
                    &#x1F513; FREE CD
                  </Button>
                )}
              </>
            ) : null}
            {game.player.companion && (game.phase === "roll" || game.phase === "place") ? (
              <Button
                onClick={activateCompanionActive}
                disabled={game.player.companion.cooldownRemaining > 0}
                className={`rounded-2xl border py-2.5 text-sm font-black transition ${
                  game.player.companion.cooldownRemaining === 0
                    ? 'border-emerald-400/50 bg-emerald-600/25 text-emerald-100 hover:bg-emerald-600/40'
                    : 'border-zinc-600/40 bg-zinc-800/50 text-zinc-500 cursor-not-allowed opacity-60'
                }`}
              >
                {game.player.companion.emoji}
                {game.player.companion.cooldownRemaining > 0 ? ` (${game.player.companion.cooldownRemaining})` : ' ✓'}
              </Button>
            ) : null}
            {hasWeaponSlot(loadMeta()) && (game.phase === "roll" || game.phase === "place") ? (
              (game.player.weaponSlots || []).map((weapon, slotIndex) => {
                if (!weapon) return null;
                const info = getWeaponDisplayInfo(weapon);
                if (!info) return null;
                const ready = weapon.cooldownRemaining === 0;
                return (
                  <Button
                    key={`weapon-slot-${slotIndex}`}
                    onClick={() => useWeaponSpecial(slotIndex)}
                    disabled={!ready}
                    className={`rounded-2xl border py-2.5 text-sm font-black transition ${
                      ready
                        ? 'border-amber-400/50 bg-amber-600/20 text-amber-100 hover:bg-amber-600/35'
                        : 'border-zinc-600/40 bg-zinc-800/50 text-zinc-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <span style={{ color: RARITY_COLORS[weapon.rarity] }}>&#x2694;&#xFE0F;</span>{' '}
                    <span className="text-[10px]">{ready ? 'READY' : `${weapon.cooldownRemaining}/${weapon.cooldown}`}</span>
                  </Button>
                );
              })
            ) : null}
            {game.phase === "place" && game.grid.some(row => row.some(cell => cell !== null)) ? (
              BTN_IMAGES.resolve ? (
                <ActionBtn
                  imgSrc={BTN_IMAGES.resolve}
                  label="RESOLVE"
                  onClick={manualResolve}
                />
              ) : (
                <Button onClick={manualResolve} className="rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-emerald-700/70 to-emerald-900/80 py-2.5 text-sm font-black text-white hover:from-emerald-600/80 hover:to-emerald-800">
                  ✅ RESOLVE
                </Button>
              )
            ) : null}
          </div>

          {activeDieMeta && game.phase === "place" ? (
            <div className="mb-2 flex items-center gap-2 rounded-[12px] border border-amber-300/20 bg-amber-300/10 px-2 py-1.5 text-[11px] text-white">
              <span className="text-lg">{activeDieMeta.emoji}</span>
              <div>
                <div className="text-[12px] font-black text-amber-300">Next die: {activeDieMeta.label}</div>
                <div className="text-[10px] text-zinc-100">{activeDieMeta.desc}</div>
              </div>
            </div>
          ) : null}

          {/* Auto-resolve toggle */}
          <label className="shrink-0 flex cursor-pointer items-center justify-center gap-1.5 text-[10px] text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={autoResolve}
              onChange={(e) => {
                setAutoResolve(e.target.checked);
                try { localStorage.setItem('jk_auto_resolve', String(e.target.checked)); } catch {}
              }}
              className="h-3 w-3 accent-emerald-400"
            />
            <span>Auto-resolve</span>
          </label>

          {/* ── Band 6: BOTTOM STATUS BAR ─────────────────────────── */}
          <div className="shrink-0 flex items-center justify-between rounded-[12px] border border-white/10 bg-black/40 px-3 py-1" style={{ minHeight: 28 }}>
            <span className="text-[11px] font-black text-yellow-300">&#x1FA99; {game.player.coins || 0}</span>
            <span className="flex-1 mx-2 truncate text-center text-[9px] text-zinc-300">{latestAction.slice(0, 40)}</span>
            <div className="flex items-center gap-1.5">
              {game.noHitTurns > 0 ? (
                <span className="text-[10px] font-black text-lime-300">&#x1F525; {game.noHitTurns}</span>
              ) : (
                <span className="text-[9px] uppercase tracking-[0.12em] text-zinc-500">{game.phase}</span>
              )}
              <button
                onClick={() => setGame((g) => ({ ...g, showAllLogs: !g.showAllLogs }))}
                className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold text-white hover:bg-white/20"
              >
                {game.showAllLogs ? "▲" : "▼"}
              </button>
            </div>
          </div>

          {/* Expandable log */}
          <AnimatePresence>
            {game.showAllLogs ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="shrink-0 overflow-hidden"
              >
                <div className="max-h-28 space-y-0.5 overflow-auto pr-1">
                  {game.log.slice(0, 12).map((line, i) => (
                    <div key={`${line}-${i}`} className="rounded-[8px] border border-white/10 bg-black/35 px-2 py-0.5 text-[9px] text-zinc-100">{line}</div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

        </div>
        {/* ── END COMBAT 6-BAND LAYOUT ──────────────────────────── */}




        <AnimatePresence>
          {game.damagePopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 12, scale: 0.8 }}
              animate={{ opacity: 1, y: -12, scale: 1.15 }}
              exit={{ opacity: 0, y: -24, scale: 0.9 }}
              style={{ left: popup.left, top: `calc(${popup.top} - ${(popup.yShift || 0) * 44}px)` }}
              className={`pointer-events-none fixed z-50 rounded-xl border px-4 py-2 text-2xl font-black shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
                popup.tone === "damage"
                  ? "border-rose-300/60 bg-rose-600/35 text-rose-100"
                  : popup.tone === "heal"
                    ? "border-emerald-300/60 bg-emerald-600/30 text-emerald-100"
                    : "border-cyan-300/60 bg-cyan-600/30 text-cyan-100"
              }`}
            >
              {popup.text}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {game.actionFlash ? (
            <motion.div
              key={game.actionFlash.id}
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.9 }}
              className={`pointer-events-none fixed left-1/2 top-16 z-40 -translate-x-1/2 rounded-xl border px-3 py-1.5 text-sm font-black shadow-[0_18px_45px_rgba(0,0,0,0.4)] ${flashTone[game.actionFlash.tone] || flashTone.amber}`}
            >
              {game.actionFlash.text}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.killPopup ? (
            <motion.div initial={{ opacity: 0, y: 18, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1.08 }} exit={{ opacity: 0, y: -18, scale: 0.9 }} className="pointer-events-none fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-2xl border border-rose-300/40 bg-black/85 px-6 py-3 text-3xl font-black text-rose-200 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              {game.killPopup}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.killPopup ? Array.from({ length: 14 }).map((_, i) => (
            <motion.div
              key={`skull-rain-${i}`}
              initial={{ opacity: 0, y: -40, x: 0, rotate: -10 }}
              animate={{ opacity: [0, 1, 1, 0], y: [0, 220 + (i % 4) * 50], x: [0, (i % 2 === 0 ? -24 : 24)], rotate: [0, i % 2 === 0 ? -18 : 18] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.3, delay: i * 0.04 }}
              className="pointer-events-none fixed top-8 z-40 text-2xl"
              style={{ left: `${8 + i * 6}%` }}
            >
              {i % 3 === 0 ? "🎉" : i % 2 === 0 ? "💀" : "✨"}
            </motion.div>
          )) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.characterSelectPending ? (() => {
            const activePendingId = pendingCharId;
            const filteredWeapons = STARTER_WEAPONS.filter((w) => {
              if (wRarityFilter !== "All" && w.rarity !== wRarityFilter) return false;
              if (wTypeFilter !== "All" && w.type !== wTypeFilter) return false;
              return true;
            });
            const rarities = ["All", "Common", "Rare", "Epic", "Legendary"];
            const types = ["All", ...Array.from(new Set(STARTER_WEAPONS.map((w) => w.type)))];
            return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-3 backdrop-blur-sm">
              <div className="mx-auto w-full max-w-3xl rounded-[28px] border border-cyan-300/20 bg-zinc-950/98 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.65)] my-4">
                {/* Header */}
                <div className="mb-4 text-center">
                  <div className="font-serif text-2xl italic text-amber-300">Choose your character</div>
                  <div className="text-xs text-zinc-400">Select a character then configure your loadout</div>
                </div>

                {/* Character cards */}
                <div className="grid gap-3 md:grid-cols-3 mb-5">
                  {Object.values(runtimeCharacters).map((character) => {
                    const isSelected = activePendingId === character.id;
                    const isLocked = character.id === "krex";
                    return (
                      <button
                        key={character.id}
                        onClick={() => !isLocked && setPendingCharId(character.id)}
                        disabled={isLocked}
                        className={`relative rounded-2xl border p-3 text-left transition ${isSelected ? "border-amber-300/80 bg-amber-900/20 shadow-[0_0_0_3px_rgba(252,211,77,0.18)]" : isLocked ? "border-zinc-700/40 bg-black/30 opacity-55 cursor-not-allowed" : "border-white/15 bg-black/45 hover:border-amber-300/50 hover:bg-black/60"}`}
                      >
                        {isSelected && <div className="absolute -top-2 -right-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-black">✓</div>}
                        {isLocked && <div className="absolute inset-0 flex items-center justify-center rounded-2xl text-3xl">🔒</div>}
                        <img src={character.avatar} alt={character.name} className="mb-2 h-36 w-full rounded-xl border border-white/10 bg-black/40 object-contain" style={{ transform: "scaleX(-1)" }} />
                        <div className="font-black text-amber-200">{character.name} {isLocked ? "🔒" : ""}</div>
                        <div className="text-[11px] text-zinc-300">{isLocked ? "Unlock at Level 8" : character.subtitle}</div>
                      </button>
                    );
                  })}
                </div>

                {/* LOADOUT section — only shown once a character is picked */}
                {activePendingId ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black uppercase tracking-[0.18em] text-zinc-200">⚙️ Loadout</span>
                      <div className="flex-1 border-t border-white/10" />
                    </div>

                    {/* COMPANION */}
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-300">🐾 Companion</div>
                      <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-7">
                        {COMPANIONS.map((comp) => {
                          const sel = loadout.companion === comp.id;
                          return (
                            <button
                              key={comp.id}
                              onClick={() => setLoadout((l) => ({ ...l, companion: sel ? null : comp.id }))}
                              className={`rounded-2xl border p-2 text-center transition ${sel ? "border-emerald-300/70 bg-emerald-900/25 shadow-[0_0_0_2px_rgba(110,231,183,0.18)]" : "border-white/15 bg-black/40 hover:border-emerald-300/40 hover:bg-black/60"}`}
                            >
                              <img src={comp.image} alt={comp.name} className="mx-auto mb-1 h-14 w-full rounded-xl object-contain" />
                              <div className="text-[9px] font-black text-zinc-100 leading-tight">{comp.name}</div>
                              <div className="mt-0.5 text-[9px] text-zinc-400">{comp.passiveDesc}</div>
                              <div className={`mt-1 rounded-full px-1 py-0.5 text-[9px] font-black ${sel ? "bg-emerald-600/30 text-emerald-200" : "bg-black/30 text-zinc-300"}`}>{comp.abilityEmoji} {comp.abilityName}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* STARTER WEAPONS */}
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-300">✕ Starter Weapon <span className="font-normal text-zinc-400">(Optional)</span></div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          Slot:
                          <button onClick={() => setLoadoutWeaponSlot(1)} className={`rounded-lg border px-2 py-0.5 ${loadoutWeaponSlot === 1 ? "border-amber-300/60 text-amber-300" : "border-white/15 text-zinc-400"}`}>1</button>
                          <button onClick={() => setLoadoutWeaponSlot(2)} className={`rounded-lg border px-2 py-0.5 ${loadoutWeaponSlot === 2 ? "border-amber-300/60 text-amber-300" : "border-white/15 text-zinc-400"}`}>2</button>
                        </div>
                      </div>
                      {/* Filters */}
                      <div className="mb-2 flex flex-wrap gap-1">
                        {rarities.map((r) => (
                          <button key={r} onClick={() => setWRarityFilter(r)} className={`rounded-full border px-2 py-0.5 text-[10px] font-black transition ${wRarityFilter === r ? "border-amber-300/70 bg-amber-400/20 text-amber-200" : "border-white/15 bg-black/30 text-zinc-400 hover:border-white/30"}`}>{r}</button>
                        ))}
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1">
                        {types.map((t) => (
                          <button key={t} onClick={() => setWTypeFilter(t)} className={`rounded-full border px-2 py-0.5 text-[10px] font-black transition ${wTypeFilter === t ? "border-sky-300/70 bg-sky-400/15 text-sky-200" : "border-white/15 bg-black/30 text-zinc-400 hover:border-white/30"}`}>
                            {t === "blade" ? "✕ blade" : t === "staff" ? "✏️ staff" : t === "shield" ? "🛡 shield" : t === "totem" ? "🗿 totem" : t === "cannon" ? "💥 cannon" : t === "fang" ? "🐍 fang" : t}
                          </button>
                        ))}
                      </div>
                      {/* Weapon grid */}
                      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                        {filteredWeapons.map((w) => {
                          const slot1 = loadout.weapon1 === w.id;
                          const slot2 = loadout.weapon2 === w.id;
                          const sel = slot1 || slot2;
                          return (
                            <button
                              key={w.id}
                              onClick={() => {
                                if (loadoutWeaponSlot === 1) setLoadout((l) => ({ ...l, weapon1: l.weapon1 === w.id ? null : w.id }));
                                else setLoadout((l) => ({ ...l, weapon2: l.weapon2 === w.id ? null : w.id }));
                              }}
                              className={`rounded-2xl border p-2.5 text-left transition ${sel ? "border-amber-300/70 bg-amber-900/20" : "border-white/15 bg-black/40 hover:border-amber-300/40"}`}
                            >
                              <div className="mb-1 flex items-center gap-1.5">
                                <img src={w.image} alt={w.name} className="h-8 w-8 rounded-lg object-contain" />
                                <div>
                                  <div className="text-[11px] font-black text-zinc-100">{w.name}</div>
                                  <div className="text-[9px] text-zinc-400">{w.type} · {w.rarity}</div>
                                </div>
                              </div>
                              <div className="text-[10px] text-zinc-300">{w.ability}</div>
                              {sel && <div className="mt-1 text-[9px] font-black text-amber-300">✓ Slot {slot1 ? "1" : "2"}</div>}
                            </button>
                          );
                        })}
                      </div>
                      {/* Active weapon selection recap */}
                      <div className="mt-2 flex gap-2 text-[10px] text-zinc-400">
                        <span className={`rounded-lg border px-2 py-1 ${loadout.weapon1 ? "border-amber-300/40 text-amber-200" : "border-white/10"}`}>Slot 1: {loadout.weapon1 ? STARTER_WEAPONS.find(w=>w.id===loadout.weapon1)?.name || "—" : "Empty"}</span>
                        <span className={`rounded-lg border px-2 py-1 ${loadout.weapon2 ? "border-amber-300/40 text-amber-200" : "border-white/10"}`}>Slot 2: {loadout.weapon2 ? STARTER_WEAPONS.find(w=>w.id===loadout.weapon2)?.name || "—" : "Empty"}</span>
                      </div>
                    </div>

                    {/* RELICS */}
                    <div>
                      <div className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-violet-300">🗿 Relics</div>
                      <div className="flex gap-2">
                        {/* Slot 1 — unlocked */}
                        {STARTER_RELICS.map((relic) => {
                          const sel = loadout.relic1 === relic.id;
                          return (
                            <button
                              key={relic.id}
                              onClick={() => setLoadout((l) => ({ ...l, relic1: sel ? null : relic.id }))}
                              className={`flex flex-col items-center rounded-2xl border p-2.5 transition w-28 ${sel ? "border-violet-300/60 bg-violet-900/20" : "border-white/20 bg-black/40 hover:border-violet-300/40"}`}
                            >
                              <img src={relic.image} alt={relic.name} className="h-12 w-12 rounded-xl object-contain mb-1" />
                              <div className="text-[10px] font-black text-zinc-100">{relic.name}</div>
                              <div className="text-[9px] text-zinc-400 text-center">{relic.effectText}</div>
                              {sel && <div className="mt-1 text-[9px] font-black text-violet-300">✓ Equipped</div>}
                            </button>
                          );
                        })}
                        {/* Locked slots */}
                        {[2, 3].map((n) => (
                          <div key={n} className="flex flex-col items-center rounded-2xl border border-white/10 bg-black/25 p-2.5 w-28 opacity-40">
                            <div className="mb-1 text-3xl">🔒</div>
                            <div className="text-[10px] text-zinc-400">Relic slot {n}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Start button */}
                    <button
                      onClick={() => pickCharacter(activePendingId, loadout)}
                      className="w-full rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500/30 to-amber-600/20 py-3.5 text-center font-black text-amber-200 text-lg transition hover:from-amber-500/45 hover:to-amber-600/35 hover:border-amber-300/60 active:scale-[0.98]"
                    >
                      Start as {runtimeCharacters[activePendingId]?.name || activePendingId} →
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 py-6 text-center text-sm text-zinc-400">
                    ☝️ Select a character above to configure your loadout
                  </div>
                )}
              </div>
            </motion.div>
            );
          })() : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.scorePopups.map((popup, i) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 16, scale: 0.75 }}
              animate={{ opacity: 1, y: -8 - i * 10, scale: 1.05 }}
              exit={{ opacity: 0, y: -30, scale: 0.8 }}
              className={`pointer-events-none fixed left-1/2 top-1/3 z-40 -translate-x-1/2 rounded-xl border px-4 py-2 text-lg font-black shadow-[0_20px_60px_rgba(0,0,0,0.45)] ${popup.tone === "rose" ? "border-rose-300/60 bg-rose-500/30 text-rose-100" : popup.tone === "emerald" ? "border-emerald-300/60 bg-emerald-500/25 text-emerald-100" : popup.tone === "violet" ? "border-violet-300/60 bg-violet-500/25 text-violet-100" : "border-amber-300/60 bg-amber-500/25 text-amber-100"}`}
            >
              {popup.text}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {game.comboPopup ? (
            <motion.div initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1.05 }} exit={{ opacity: 0, scale: 0.9 }} className="pointer-events-none fixed left-1/2 top-44 z-40 -translate-x-1/2 rounded-2xl border border-amber-300/45 bg-black/85 px-6 py-3 text-2xl font-black text-amber-200 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
              {game.comboPopup}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Kill Reward Overlay */}
        <AnimatePresence>
          {game.phase === 'kill_reward' && game.killRewardPending ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
                className="w-full max-w-sm rounded-[24px] border border-amber-300/20 bg-zinc-950/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                <div className="mb-4 text-center">
                  <div className="font-serif text-lg text-amber-300">
                    {game.enemy?.tier === 'boss' ? '👑 Boss vaincu !' : '💀 Kill !'}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Choisis {Math.max(0, game.killRewardPicksAllowed - game.killRewardsPicked.length)} récompense
                    {game.killRewardPicksAllowed - game.killRewardsPicked.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {game.killRewardsOffered.map((reward: any) => {
                    const picked = game.killRewardsPicked.includes(reward.id);
                    const canPick = game.killRewardsPicked.length < game.killRewardPicksAllowed;
                    const rarityColor = reward.rarity === 'legendary' ? 'text-orange-300' : reward.rarity === 'epic' ? 'text-violet-300' : reward.rarity === 'rare' ? 'text-amber-300' : 'text-zinc-400';
                    return (
                      <button key={reward.id}
                        onClick={() => applyKillRewardPick(reward.id)}
                        disabled={picked || !canPick}
                        className={`rounded-xl border p-3 text-left transition active:scale-95 ${
                          picked ? 'border-amber-400/60 bg-amber-900/30' :
                          canPick ? 'border-white/15 bg-black/40 hover:border-amber-400/30 hover:bg-black/60' :
                          'border-white/5 bg-black/20 opacity-40 cursor-not-allowed'
                        }`}>
                        <div className="text-xl mb-1">{reward.icon}</div>
                        <div className="text-xs font-black text-white">{reward.name}</div>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{reward.desc}</div>
                        <div className={`text-[9px] mt-1 font-black ${rarityColor}`}>{reward.rarity}</div>
                      </button>
                    );
                  })}
                </div>
                {!game.killRewardMustPick && (
                  <button onClick={skipKillRewards} className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 transition">
                    Passer →
                  </button>
                )}
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Map overlay ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {game.phase === "map" && game.mapLayers && !game.characterSelectPending ? (() => {
            const available = getAvailableNodes(game.mapLayers, game.currentMapNodeId);
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
                <div className="w-full max-w-lg rounded-[28px] border border-amber-300/20 bg-zinc-950/98 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="font-serif text-xl italic text-amber-300">Zone {game.floor} — Choose Your Path</div>
                      <div className="text-[11px] text-zinc-400">🪙 {game.player.coins || 0} coins · {game.player.hp}/{game.player.maxHp} HP</div>
                    </div>
                    <div className="rounded-xl border border-amber-300/20 bg-black/40 px-2 py-1 text-[10px] text-amber-200">Room {game.room + 1}</div>
                  </div>

                  {/* Combat view-only banner */}
                  {game.combatMapView && (
                    <div className="mb-3 rounded-xl border border-rose-400/40 bg-rose-950/60 px-3 py-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setGame(g => ({ ...g, phase: g.prevCombatPhase || 'place', combatMapView: false, prevCombatPhase: null }))}
                        className="flex items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-700/60 px-3 py-1.5 text-sm font-black text-rose-100 hover:bg-rose-600/70 active:scale-95 transition"
                      >
                        ← Back to combat
                      </button>
                      <span className="text-[10px] text-rose-400">⚔️ Map — vue seule</span>
                    </div>
                  )}

                  {/* Map layers */}
                  <div className="mb-3 space-y-2 overflow-y-auto" style={{ maxHeight: '55vh' }}>
                    {game.mapLayers.map((layer) => (
                      <div key={layer.layerIndex} className="flex items-center justify-center gap-2">
                        {layer.nodes.map((node) => {
                          const isAvailable = available.some((n) => n.id === node.id);
                          const isCurrent = node.id === game.currentMapNodeId;
                          const isDone = node.visited;
                          const isRevealed = node.revealed;
                          const borderClass = isDone
                            ? "border-emerald-400/50 bg-emerald-900/30"
                            : isCurrent
                              ? "border-amber-300/60 bg-amber-900/25"
                              : isAvailable
                                ? "border-amber-300/70 bg-amber-300/10 shadow-[0_0_12px_rgba(252,211,77,0.18)] cursor-pointer hover:bg-amber-300/20"
                                : isRevealed
                                  ? "border-white/20 bg-black/40"
                                  : "border-white/10 bg-black/30 opacity-50";
                          return (
                            <button
                              key={node.id}
                              disabled={!isAvailable || game.combatMapView}
                              onClick={() => isAvailable && !game.combatMapView && enterMapNode(node.id)}
                              className={`flex min-w-[72px] flex-col items-center rounded-2xl border p-2 transition ${borderClass} ${game.combatMapView && isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isRevealed || isDone ? (
                                <>
                                  <span className="text-xl">{getNodeEmoji(node.type)}</span>
                                  <span className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-100">{getNodeLabel(node.type)}</span>
                                  {isDone ? <span className="text-[9px] text-emerald-400">✓ done</span> : null}
                                  {isAvailable ? <span className="mt-1 animate-pulse text-[9px] text-amber-300">TAP</span> : null}
                                </>
                              ) : (
                                <>
                                  <span className="text-xl">❓</span>
                                  <span className="text-[9px] text-zinc-400">hidden</span>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {available.length === 0 ? (
                    <div className="rounded-xl border border-rose-300/30 bg-rose-900/20 p-3 text-center text-sm text-rose-200">
                      No paths available. The boss must already be cleared.
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-zinc-400">Tap a highlighted node to travel there.</div>
                  )}
                </div>
              </motion.div>
            );
          })() : null}
        </AnimatePresence>

        {/* ── Event overlay ─────────────────────────────────────────────────── */}
        <AnimatePresence>
          {game.phase === "event" && game.pendingEvent ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-[28px] border border-cyan-300/20 bg-zinc-950/98 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-cyan-400">❓ Random Event</div>
                <div className="mb-2 font-serif text-xl italic text-amber-300">{game.pendingEvent.title}</div>
                <div className="mb-4 rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-zinc-200">{game.pendingEvent.description}</div>
                <div className="space-y-2">
                  {game.pendingEvent.choices.map((choice, idx) => (
                    <button
                      key={`choice-${idx}`}
                      onClick={() => handleEventChoice(idx)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/20"
                    >
                      <div className="font-black text-sm text-white">{choice.label}</div>
                      <div className="text-[11px] text-zinc-300">{choice.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Shop overlay ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {game.phase === "shop" && game.shopInventory ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-[28px] border border-amber-300/20 bg-zinc-950/98 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">

                {/* Shop header with characters */}
                <div className="mb-3 flex items-end gap-3">
                  {/* Shop guy */}
                  <img
                    src={SHOP_GUY_URL}
                    alt="Shopkeeper"
                    className="h-20 w-20 shrink-0 rounded-2xl border border-amber-300/20 object-cover shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  />
                  {/* Dialogue + player */}
                  <div className="flex-1 min-w-0">
                    {/* Shopkeeper dialogue */}
                    <div className="mb-2 rounded-2xl rounded-bl-sm border border-amber-300/25 bg-amber-900/20 px-3 py-2 text-xs text-amber-200 italic relative">
                      "Bienvenue, guerrier… Mes reliques valent chaque pièce — <span className="font-black not-italic">🪙 {game.player.coins || 0}</span> en poche."
                      <div className="absolute -bottom-1.5 left-3 h-3 w-3 rotate-45 border-b border-l border-amber-300/25 bg-amber-900/20" />
                    </div>
                    {/* Player character small + zone */}
                    <div className="flex items-center gap-2">
                      <img
                        src={avatarUrl}
                        alt="player"
                        className="h-8 w-8 rounded-xl border border-white/15 object-contain bg-black/30"
                      />
                      <div>
                        <div className="text-[10px] font-black text-cyan-200">
                          {game.player.PLAYER_CHARACTERS?.[game.player.characterId]?.name ?? game.player.characterId}
                        </div>
                        <div className="text-[9px] text-zinc-400">Zone {game.floor} · ❤️ {game.player.hp}/{game.player.maxHp}</div>
                      </div>
                      <button onClick={handleShopLeave} className="ml-auto rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20">Partir</button>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {game.shopInventory.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/15 bg-black/40 p-3">
                      <div className="flex-1">
                        <div className="font-black text-sm text-white">{item.name}</div>
                        <div className="text-[10px] text-zinc-300">{item.description}</div>
                      </div>
                      <button
                        onClick={() => handleShopBuy(idx)}
                        disabled={(game.player.coins || 0) < item.cost}
                        className="rounded-xl border border-amber-300/30 bg-amber-500/20 px-3 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-500/35 disabled:opacity-40"
                      >
                        🪙 {item.cost}
                      </button>
                    </div>
                  ))}
                  {game.shopInventory.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-black/35 p-3 text-center text-sm text-zinc-400">Sold out.</div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── Rest overlay ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {game.phase === "rest" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-[28px] border border-emerald-300/20 bg-zinc-950/98 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
                <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-emerald-400">🏕️ Rest Site</div>
                <div className="mb-2 font-serif text-xl italic text-amber-300">A Moment of Calm</div>
                <div className="mb-4 rounded-xl border border-white/10 bg-black/35 p-3 text-sm text-zinc-300">
                  The jungle quiets around you. <span className="text-white font-black">{game.player.hp}/{game.player.maxHp} HP</span>. Choose how to spend this moment.
                </div>
                <div className="space-y-2">
                  {REST_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleRestChoice(option.id)}
                      className="w-full rounded-xl border border-white/20 bg-white/10 p-3 text-left transition hover:bg-white/20"
                    >
                      <div className="font-black text-sm text-white">{option.label}</div>
                      <div className="text-[11px] text-zinc-300">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {(game.phase === "gameover" || game.phase === "victory") ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-[28px] border border-amber-300/25 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-3 text-center font-serif text-2xl italic text-amber-300">{game.phase === "victory" ? "RUN SUMMARY · KABAL BLESSING" : "RUN SUMMARY · LIQUIDATED"}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">Character: <span className="font-black">{game.player.PLAYER_CHARACTERS[game.player.characterId]?.name ?? game.player.characterId}</span></div>
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">Zone: <span className="font-black">{game.floor}</span></div>
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">Score: <span className="font-black">{game.score}</span></div>
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">No-hit: <span className="font-black">{game.noHitTurns}T</span></div>
                  <div className="col-span-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">Seed: <span className="font-black text-cyan-200">#{game.runSeed}</span></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={shareRun} className="rounded-xl bg-sky-500/35 px-4 py-2 text-white hover:bg-sky-500/50">Share run</Button>
                  <Button onClick={restart} className="rounded-xl bg-white px-4 py-2 text-black hover:bg-zinc-200">Play again</Button>
                  <Button
                    onClick={() => {
                      const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
                      const refId = tgUser?.id || 'kabal';
                      const inviteUrl = `https://t.me/JungleKabalBot?start=ref_${refId}`;
                      const inviteText = `Je joue à DIE JUNGLE 🌴 — viens battre mon score de ${game.score}! ${inviteUrl}`;
                      const tg = (window as any).Telegram?.WebApp;
                      if (tg?.shareUrl) {
                        tg.shareUrl(inviteUrl, inviteText);
                      } else {
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(inviteText)}`, '_blank');
                      }
                    }}
                    className="rounded-xl bg-violet-500/30 px-4 py-2 text-white hover:bg-violet-500/50"
                  >
                    👥 Invite a friend (+150 💎)
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.phase === "reward" && !game.characterSelectPending ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-5xl rounded-[28px] border border-amber-300/20 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={LOGO_URL} alt="Kabal logo" className="h-10 w-10 object-contain" />
                    <div>
                      <div className="font-serif text-xl italic text-amber-300 md:text-2xl">Choose 1 Artifact</div>
                      <div className="text-sm text-zinc-300">{game.startRewardPending ? "First reward after your opening win." : "Boss down. Build your run."}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={skipArtifactReward} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-zinc-100 hover:bg-white/20">Skip reward</button>
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">Zone {game.floor}</div>
                  </div>
                </div>
                <div className="mb-4 rounded-2xl border border-cyan-300/25 bg-cyan-950/25 p-3">
                  <div className="mb-2 text-sm font-black tracking-[0.05em] text-cyan-200 md:text-base">{storyFragment.title}</div>
                  <div className="space-y-3">
                    <img src={STORY_FRAGMENT_IMAGE_URL} alt="Chronicle fragment" className="h-[260px] w-full rounded-xl border border-white/10 bg-black/35 object-cover md:h-[420px]" />
                    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                      <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200/80">Narrative legend</div>
                      <div className="space-y-3 text-xl italic leading-relaxed text-zinc-100 md:text-3xl" style={{ fontFamily: '"Caveat", "Patrick Hand", "Segoe Script", cursive' }}>
                        {storyFragment.lines.map((line) => (
                          <div key={line}>“{line}”</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {game.artifactsOffered.length ? game.artifactsOffered.map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} onPick={pickArtifact} />
                  )) : (
                    <div className="md:col-span-3 rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-zinc-200">No artifact available right now. You can continue with <button onClick={skipArtifactReward} className="ml-1 font-black text-amber-300 underline">Skip reward</button>.</div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.showHowToPlay ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-[28px] border border-amber-300/20 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={LOGO_URL} alt="Kabal logo" className="h-10 w-10 object-contain" />
                    <div>
                      <div className="font-serif text-xl italic text-amber-300 md:text-2xl">How to Score More</div>
                      <div className="text-sm text-zinc-300">DIE JUNGLE — scoring guide</div>
                    </div>
                  </div>
                  <Button onClick={() => setGame((g) => ({ ...g, showHowToPlay: false }))} className="rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/20">✕</Button>
                </div>

                {/* Score multipliers */}
                <div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-950/20 p-3 space-y-1.5 text-[12px]">
                  <div className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Score sources</div>
                  <div>⚔️ <span className="font-black text-amber-200">Kill +120</span> — base score per enemy killed</div>
                  <div>💥 <span className="font-black text-amber-200">Overkill</span> — excess damage × 5 bonus points</div>
                  <div>⚡ <span className="font-black text-amber-200">One Shot +100</span> — kill enemy on their first intent</div>
                  <div>🎯 <span className="font-black text-amber-200">No-hit streak</span> — multiplier grows every turn you don't take HP damage</div>
                  <div>🌴 <span className="font-black text-amber-200">Zone mult</span> — deeper zones multiply all score (Zone 2 = ×1.2, Zone 3 = ×1.4...)</div>
                  <div>✨ <span className="font-black text-amber-200">Perfect +150</span> — kill enemy without taking any HP damage this fight</div>
                  <div>👑 <span className="font-black text-amber-200">Boss +500</span> — flat bonus on boss kill</div>
                </div>

                {/* Top tips */}
                <div className="mb-3 rounded-xl border border-emerald-300/20 bg-emerald-950/20 p-3 space-y-1.5 text-[12px]">
                  <div className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Top tips to score high</div>
                  <div>🎯 <span className="font-black">Don't get hit.</span> The no-hit streak multiplier is your biggest score lever.</div>
                  <div>🔱 <span className="font-black">Pierce + Top row.</span> Top row ×3 multiplier + pierce ignores shield = massive overkill combos.</div>
                  <div>☠️ <span className="font-black">Reset charge with Curse.</span> Face 1 attack resets enemy charge bar — never let them SURGE.</div>
                  <div>⚡ <span className="font-black">One Shot on first intent.</span> Plan your board so enemy dies before they even act. +100 bonus.</div>
                  <div>🌴 <span className="font-black">Survive deep.</span> Zone 5 = ×1.8 multiplier on every kill. Rush depth over kills.</div>
                </div>

                {/* Quick rules */}
                <div className="mb-3 rounded-xl border border-white/10 bg-black/30 p-3 space-y-1.5 text-[12px] text-zinc-200">
                  <div className="mb-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-300">Quick rules</div>
                  <div>1️⃣ ROLL → place dice on the 3×3 grid → RESOLVE</div>
                  <div>🔥 <span className="font-black">Top row ×3</span> · ✨ <span className="font-black">Mid ×2</span> · 🪨 <span className="font-black">Bot ×1</span></div>
                  <div>⏳ Used slots go on cooldown for a few turns</div>
                  <div>🔁 <span className="font-black">Reroll</span> a die if you got a bad face — tap die first, then REROLL</div>
                  <div>🗺️ Between fights: choose your path on the <span className="font-black">map</span> — shop, events, rest or fight</div>
                </div>

                {/* Build archetypes toggle */}
                <button
                  onClick={() => setShowAdvancedGuide((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-black text-zinc-300 hover:bg-white/10"
                >
                  <span>📚 Build archetypes</span>
                  <span>{showAdvancedGuide ? '▲' : '▼'}</span>
                </button>
                {showAdvancedGuide ? (
                  <div className="mt-2 space-y-3 rounded-xl border border-white/10 bg-black/40 p-3 text-[12px] text-zinc-100">
                    <div>
                      <div className="mb-1 font-black text-red-300">⚔️ Berserker — highest score potential</div>
                      <div>Stack top row (×3) attack slots + Pierce artifacts. Kill enemies before they act = One Shot bonuses + perfect runs.</div>
                    </div>
                    <div>
                      <div className="mb-1 font-black text-cyan-300">🛡️ Fortress — consistent deep runs</div>
                      <div>Shield dice + Fortress face (🛡️6) + regen artifacts. Shield carries over turns. Outlast everything for zone depth bonus.</div>
                    </div>
                    <div>
                      <div className="mb-1 font-black text-violet-300">✨ Surge Control — safe & reliable</div>
                      <div>Use Curse (⚔️ face 1) to reset enemy charge every turn. Mid-row ×2 for consistent damage. Never die to SURGE. No-hit streak ×.</div>
                    </div>
                    <div>
                      <div className="mb-1 font-black text-amber-300">Special dice faces (unlock required)</div>
                      <div className="space-y-0.5 text-zinc-300">
                        <div>☠️ <span className="font-black text-white">Curse</span> (⚔️1) — damage + resets enemy charge bar</div>
                        <div>🔱 <span className="font-black text-white">Pierce</span> (⚔️6) — ignores enemy shield</div>
                        <div>💚 <span className="font-black text-white">Nurture</span> (❤️6) — heals double</div>
                        <div>🏰 <span className="font-black text-white">Fortress</span> (🛡️6) — shield persists next turn</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Restart confirm modal */}
        <AnimatePresence>
          {showRestartConfirm ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm rounded-[24px] border border-rose-300/30 bg-zinc-950/95 p-6 text-center shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
              >
                <div className="mb-2 text-4xl">⚠️</div>
                <div className="mb-1 font-serif text-xl italic text-rose-300">Abandon Run?</div>
                <div className="mb-5 text-sm text-zinc-400">Your current run progress will be lost. Are you sure?</div>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowRestartConfirm(false)} className="rounded-2xl border border-white/15 bg-zinc-800/80 px-5 py-2.5 text-sm font-black text-white hover:bg-zinc-700">
                    Cancel
                  </Button>
                  <Button onClick={restart} className="rounded-2xl bg-rose-600 px-5 py-2.5 text-sm font-black text-white hover:bg-rose-500">
                    ↺ Restart
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Battle Pass run reward panel */}
        <AnimatePresence>
          {lastRunReward && game.runEnded ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[55] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center"
            >
              <motion.div
                initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                className="w-full max-w-sm rounded-[24px] border border-amber-300/25 bg-zinc-950/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.65)]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-serif text-lg italic text-amber-300">Run Complete</div>
                  <Button onClick={() => setLastRunReward(null)} className="rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">✕</Button>
                </div>
                {/* XP gain */}
                <div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-950/25 p-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-black">XP Gained</span>
                    <span className="text-amber-200">+{lastRunReward.xpGained} XP · +{lastRunReward.gemsGained} 💎</span>
                  </div>
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <span>Lv.{lastRunReward.oldLevel}</span>
                    <div className="flex-1 h-2 overflow-hidden rounded-full bg-zinc-800 border border-zinc-700">
                      <motion.div
                        initial={{ width: `${(lastRunReward.oldLevel / 20) * 100}%` }}
                        animate={{ width: `${(lastRunReward.newLevel / 20) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full bg-amber-400"
                      />
                    </div>
                    <span>Lv.{lastRunReward.newLevel}</span>
                  </div>
                  {lastRunReward.newLevel > lastRunReward.oldLevel && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.5 }}
                      className="text-center text-sm font-black text-amber-300"
                    >
                      ⬆️ Level Up! {lastRunReward.oldLevel} → {lastRunReward.newLevel}
                    </motion.div>
                  )}
                </div>
                {/* Level rewards */}
                {lastRunReward.levelUpRewards.length > 0 && (
                  <div className="mb-3 space-y-1.5">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Battle Pass Rewards</div>
                    {lastRunReward.levelUpRewards.map((r, i) => (
                      <motion.div
                        key={r.level}
                        initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-950/25 px-3 py-2 text-xs"
                      >
                        <span className="text-base">{r.emoji}</span>
                        <span className="font-black text-emerald-300">Lv.{r.level}</span>
                        <span className="text-zinc-200">{r.label}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
                {/* New unlocks */}
                {lastRunReward.newUnlocks.length > 0 && (
                  <div className="mb-3 space-y-1">
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-violet-300">Unlocked</div>
                    {lastRunReward.newUnlocks.map((id) => {
                      const def = UNLOCKS[id];
                      return def ? (
                        <div key={id} className="flex items-center gap-2 rounded-xl border border-violet-400/25 bg-violet-950/25 px-3 py-2 text-xs">
                          <span>✨</span>
                          <span className="font-black text-violet-300">{def.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                <Button onClick={restart} className="w-full rounded-2xl bg-amber-400 py-2.5 text-sm font-black text-black hover:bg-amber-300">
                  ↺ Play Again
                </Button>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ── XP Panel overlay ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {showXpPanel ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[62] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
              onClick={() => setShowXpPanel(false)}
            >
              <motion.div
                initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
                className="w-full max-w-sm rounded-[28px] border border-amber-400/30 bg-zinc-950/97 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.7)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="font-serif text-xl italic text-amber-300">Battle Pass</div>
                  <button onClick={() => setShowXpPanel(false)} className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">✕</button>
                </div>
                {/* Big level number */}
                <div className="mb-4 flex flex-col items-center gap-2">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400/50 bg-amber-950/40 text-4xl font-black text-amber-300">
                    {xpInfo.level}
                  </div>
                  <div className="text-sm font-black text-zinc-300">Level {xpInfo.level}</div>
                </div>
                {/* XP progress bar */}
                <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-950/20 p-3">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-black text-amber-300">XP Progress</span>
                    <span className="text-zinc-400">{xpInfo.current} / {xpInfo.needed > 0 ? xpInfo.needed : '∞'}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-zinc-800 border border-zinc-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${xpPct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-zinc-500">{Math.round(xpPct)}% to next level</div>
                </div>
                {/* Relic slots */}
                <div className="mb-3 flex items-center justify-between rounded-xl border border-violet-400/20 bg-violet-950/20 px-3 py-2">
                  <span className="text-[11px] text-zinc-300">Relic Slots</span>
                  <span className="font-black text-violet-300">{getRelicSlotCount(meta)}</span>
                </div>
                {/* Next unlocks */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">Upcoming unlocks</div>
                  {LEVEL_REWARDS.filter((r) => r.level > xpInfo.level).slice(0, 3).map((reward) => (
                    <div key={reward.level} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-[11px]">
                      <span className="text-base">{reward.emoji}</span>
                      <span className="font-black text-zinc-200">Lv.{reward.level}</span>
                      <span className="text-zinc-400 flex-1">{reward.label}</span>
                    </div>
                  ))}
                  {LEVEL_REWARDS.filter((r) => r.level > xpInfo.level).length === 0 && (
                    <div className="text-center text-[11px] text-zinc-400">All rewards unlocked!</div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Arsenal / Gems screen */}
        <AnimatePresence>
          {showArsenal ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
                className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-[28px] border border-violet-400/25 bg-zinc-950/96 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.65)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="font-serif text-xl italic text-violet-300">💎 Arsenal</div>
                    <div className="text-[11px] text-zinc-400">Spend gems to unlock permanent upgrades</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl border border-violet-400/25 bg-violet-950/30 px-3 py-1.5 text-sm font-black text-violet-300">💎 {meta.gems}</div>
                    <Button onClick={() => setShowArsenal(false)} className="rounded-xl bg-white/10 px-3 py-2 text-white hover:bg-white/20">✕</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {Object.values(UNLOCKS).map((unlock) => {
                    const isUnlocked = (meta.unlocks ?? []).includes(unlock.id);
                    const canAfford = meta.gems >= unlock.gemCost;
                    return (
                      <div
                        key={unlock.id}
                        className={`flex items-center gap-3 rounded-2xl border p-3 transition ${isUnlocked ? 'border-emerald-400/25 bg-emerald-950/20' : 'border-white/10 bg-black/35'}`}
                      >
                        <div className="text-2xl">{isUnlocked ? '✅' : '🔒'}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-black text-sm text-white">{unlock.name}</div>
                          <div className="text-[10px] text-zinc-400">{unlock.description}</div>
                        </div>
                        {isUnlocked ? (
                          <div className="text-[10px] text-emerald-400 font-black">Owned</div>
                        ) : (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              const result = tryUnlockWithGems(meta, unlock.id);
                              if (result) {
                                saveMeta(result);
                                setMeta(result);
                              }
                            }}
                            className="rounded-xl border border-violet-400/30 bg-violet-500/20 px-3 py-1.5 text-xs font-black text-violet-200 hover:bg-violet-500/35 disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >
                            💎 {unlock.gemCost}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ── Leaderboard (bottom of page) ──────────────────────────────────── */}
      {leaderboard.length > 0 && (
        <div className="mx-auto mt-4 w-full max-w-xl px-3 pb-6">
          <div className="rounded-2xl border border-violet-300/20 bg-zinc-900/80 p-4">
            <div className="mb-3 text-center text-xs font-black uppercase tracking-widest text-violet-300">🏆 Top Runs</div>
            <div className="space-y-1.5">
              {leaderboard.slice(0, 5).map((entry, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-white/8 bg-black/30 px-3 py-2 text-xs">
                  <span className={`font-black w-5 text-center ${i === 0 ? 'text-amber-300' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-orange-400' : 'text-zinc-500'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                  </span>
                  <span className="flex-1 ml-2 text-zinc-200 truncate">{entry.name}</span>
                  <span className="font-black text-violet-300">{entry.score.toLocaleString()}</span>
                  <span className="ml-2 text-zinc-500">Z{entry.floor}</span>
                  <span className="ml-2 text-zinc-600">{entry.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
