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

const BG_URL = "https://i.postimg.cc/YSmfqq2c/Background-desktop.png";

// Button image URLs — replace with real assets when available
// Can be overridden via config.visuals.buttonImages from admin panel
const BTN_IMAGES: Record<string, string> = {
  roll:    '',
  reroll:  '',
  resolve: '',
  restart: '',
};

type RunSummary = {
  score: number;
  floor: number;
  runSeed: string;
  characterId: string;
};

type DieInTheJungleProps = {
  onRunEnded?: (summary: RunSummary) => void;
  onBeforeRestart?: () => boolean;
};

const LOGO_URL = "https://i.postimg.cc/rwdjP9rb/logo-jaune.png";
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

const KREX_AVATAR_URL = "https://i.postimg.cc/Kv8zygVk/KKM-Mascot-2.png"; // placeholder — replace with real K-REX asset

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
  0: "https://i.postimg.cc/xdqv6wsH/Chat-GPT-Image-Mar-12-2026-02-29-33-PM.png",
  1: "https://i.postimg.cc/66CdbLhg/Chat-GPT-Image-Mar-12-2026-02-31-00-PM.png",
  2: "https://i.postimg.cc/BvdqdFg9/Chat-GPT-Image-Mar-12-2026-02-24-25-PM.png",
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
      name: "Carnivor Plant",
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
      name: "Carnivor Tree",
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

function buildArtifactChoices(player) {
  const weights = { gray: 4, gold: 3, chrome: 1 };
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

function buildStarterArtifactChoices(player) {
  const starterWeights = { gray: 6, gold: 3, chrome: 1 };
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

function resolveEnemyIntent(enemy, player, log) {
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

    if (rowAttack > 0) rowAttack += ROW_INFO[rowIndex].laneBonus.attack;
    if (rowShield > 0) rowShield += ROW_INFO[rowIndex].laneBonus.shield;
    if (rowHeal > 0) rowHeal += ROW_INFO[rowIndex].laneBonus.heal;

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

  if (enemy.shield > 0 && totalAttack > 0) {
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
    coins: 0,
    companion: null as Companion | null,
    _fortressShield: 0,
    companionHypnosisActive: false,
    weaponSlots: [null, null] as (Weapon | null)[],
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

function ActionBtn({ imgSrc, label, onClick, disabled = false, pulse = false, className = "" }: {
  imgSrc?: string; label: string; onClick?: () => void; disabled?: boolean; pulse?: boolean; className?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`relative transition-all select-none ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${pulse ? 'animate-pulse' : ''} ${className}`}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={label} className="h-12 w-auto max-w-[140px] object-contain drop-shadow-lg" />
      ) : (
        <span className="inline-block rounded-2xl px-4 py-2.5 text-sm font-black">{label}</span>
      )}
    </button>
  );
}

function DiceFace({ value, selected = false, rolling = false, onClick, disabled = false }) {
  const meta = getDieMeta(value);
  const palette = dieStyleByKind(meta.kind);
  return (
    <motion.button
      whileHover={onClick && !disabled ? { y: -2 } : {}}
      whileTap={onClick && !disabled ? { scale: 0.97 } : {}}
      animate={rolling ? { rotate: [0, -12, 12, -8, 8, 0], scale: [1, 1.06, 0.98, 1.04, 1] } : { rotate: 0, scale: selected ? 1.05 : 1 }}
      transition={{ duration: rolling ? 0.7 : 0.18 }}
      onClick={disabled ? undefined : onClick}
      className={`relative h-16 w-16 overflow-hidden rounded-[18px] border bg-gradient-to-br ${palette.shell} md:h-[74px] md:w-[74px] ${selected ? "border-amber-300 shadow-[0_0_0_3px_rgba(252,211,77,0.25)]" : ""} ${disabled ? "opacity-60" : ""}`}
    >
      <img src={getDieImage(value)} alt={`${meta.label} die ${value.value}`} className="absolute inset-0 h-full w-full object-contain p-1" />
      <div className={`absolute bottom-0.5 left-0.5 right-0.5 flex items-center justify-center gap-1 rounded-lg px-1 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] ${palette.tag}`}>
        <span>{meta.emoji}</span>
        <span>{meta.kind}</span>
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
  const [autoResolve, setAutoResolve] = useState(() => {
    try { return localStorage.getItem('jk_auto_resolve') === 'true'; } catch { return false; }
  });
  const [showAdvancedGuide, setShowAdvancedGuide] = useState(false);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [showArsenal, setShowArsenal] = useState(false);
  const [selectedStartWeapon, setSelectedStartWeapon] = useState<Weapon | null>(null);
  const [selectedStartCompanion, setSelectedStartCompanion] = useState<Companion | null>(null);
  const [selectedStartCharacter, setSelectedStartCharacter] = useState<string | null>(null);
  const [selectedStartRelics, setSelectedStartRelics] = useState<any[]>([]); // placeholder, user will add relic logic
  const [weaponRarityFilter, setWeaponRarityFilter] = useState<string>('all');
  const [weaponArchFilter, setWeaponArchFilter] = useState<string>('all');
  const [meta, setMeta] = useState<MetaProgressionState>(loadMeta);
  const [showXpPanel, setShowXpPanel] = useState(false);
  const [showPlayerDrawer, setShowPlayerDrawer] = useState(false);
  const [lastRunReward, setLastRunReward] = useState<RunReward | null>(null);
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; score: number; floor: number; date: string; seed: number }>>(() => {
    try { const raw = localStorage.getItem('jungle_kabal_leaderboard_v1'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

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

  function pickCharacter(characterId) {
    const selected = PLAYER_CHARACTERS[characterId] || PLAYER_CHARACTERS.kabalian;
    const currentMeta = loadMeta();
    setGame((g) => {
      let nextPlayer: any = {
        ...g.player,
        characterId: selected.id,
        avatar: selected.avatar,
        maxHp: selected.stats.maxHp,
        hp: selected.stats.maxHp,
        attackBonus: selected.stats.attackBonus,
        combatStartShield: selected.stats.combatStartShield || 0,
        shield: selected.stats.combatStartShield || 0,
        rerollsPerTurn: selected.stats.rerollsPerTurn,
        rerollsLeft: selected.stats.rerollsPerTurn,
        cooldownBase: selected.stats.cooldownBase ?? 3,
        coins: 0,
      };
      // Apply starter weapon if selected
      if (hasWeaponSlot(currentMeta) && selectedStartWeapon) {
        const slots: (Weapon | null)[] = [null, null];
        slots[0] = selectedStartWeapon;
        nextPlayer = applyWeaponPassives(nextPlayer, slots);
        nextPlayer.weaponSlots = slots;
      }
      // Apply starter companion if selected
      if (hasCompanionSlot(currentMeta) && selectedStartCompanion) {
        nextPlayer.companion = { ...selectedStartCompanion, cooldownRemaining: 0 };
      }
      const mapLayers = generateZoneMap(g.floor, g.runSeed);
      return {
        ...g,
        player: nextPlayer,
        characterSelectPending: false,
        phase: "map",
        mapLayers,
        currentMapNodeId: null,
        avatarMood: "focus",
        actionFlash: { id: Date.now(), text: `🧭 ${selected.name} — choose your path`, tone: "sky" },
        log: [`🧭 Character selected: ${selected.name}`, `🗺️ Zone ${g.floor} map generated`, ...g.log].slice(0, 40),
      };
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
        return {
          ...g,
          dice,
          grid: emptyGrid(),
          phase: g.player.hp <= 0 ? "gameover" : "place",
          rolling: false,
          selectedDieIndex: 0,
          avatarMood: "focus",
          actionFlash: { id: Date.now(), text: `🎲 ${dice.map((d) => `${getDieMeta(d).emoji}${d.value}${d.special ? '✦' : ''}`).join(" · ")}`, tone: "amber" },
          log: [`🎲 Rolled: ${dice.map((d) => `${getDieMeta(d).label} ${d.value}${d.special ? ` (${d.special})` : ''}`).join(" - ")}`, ...g.log].slice(0, 40),
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
          const retaliation = resolveEnemyIntent(enemy, player, log);
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

        if (g.startRewardPending) {
          combatRewardPending = true;
          artifactsOffered = buildStarterArtifactChoices(player);
          phase = "reward";
        } else if (g.enemy.tier === "boss") {
          combatRewardPending = true;
          artifactsOffered = buildArtifactChoices(player);
          phase = "reward";
        } else {
          // Go to map to choose next node
          phase = "map";
          room = g.room + 1;
          player.shield = 0;
          const coinsEarned = g.enemy.tier === "medium" ? 2 : 1;
          player.coins = (player.coins || 0) + coinsEarned;
          log.unshift(`🗺️ Choose your next path · +${coinsEarned} coin${coinsEarned > 1 ? 's' : ''}`);
          avatarMood = "victory";
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
        player,
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

      // Boss kill reward → advance to next zone with new map
      const nextFloor = g.floor + 1;
      const nextRoute = buildRoute(nextFloor);
      const nextMapLayers = generateZoneMap(nextFloor, g.runSeed + ':' + nextFloor);
      const nextPlayer = { ...player, shield: 0, rerollsLeft: player.rerollsPerTurn };
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
          mapLayers: updatedLayers,
          currentMapNodeId: nodeId,
          enemy: base,
          phase: "roll",
          player: (() => {
            const base = { ...g.player, shield: g.player.combatStartShield, rerollsLeft: g.player.rerollsPerTurn };
            // Re-apply weapon passives (non-cumulative) at combat start
            // (they are already baked in from equip; only shield persists here)
            const wpSlots: (Weapon | null)[] = base.weaponSlots || [null, null];
            const shieldBonus = wpSlots.reduce((acc, w) => acc + (w?.passive?.combatStartShield || 0), 0);
            return { ...base, shield: base.shield + shieldBonus };
          })(),
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
          log: ["🛒 You entered the jungle shop.", ...g.log].slice(0, 40),
          actionFlash: { id: Date.now(), text: "🛒 Shop", tone: "sky" },
        };
      }

      if (node.type === "event") {
        const evRng = createRng(g.runSeed + ':event:' + nodeId);
        const pendingEvent = pickRandomEvent(evRng);
        return {
          ...g,
          mapLayers: updatedLayers,
          currentMapNodeId: nodeId,
          pendingEvent,
          phase: "event",
          log: [`❓ Event: ${pendingEvent.title}`, ...g.log].slice(0, 40),
          actionFlash: { id: Date.now(), text: `❓ ${pendingEvent.title}`, tone: "sky" },
        };
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
      if (!g.shopInventory) return g;
      const item = g.shopInventory[itemIndex];
      if (!item) return g;
      const coins = g.player.coins || 0;
      if (coins < item.cost) {
        return { ...g, actionFlash: { id: Date.now(), text: `🚫 Need ${item.cost} coins (you have ${coins})`, tone: "rose" } };
      }
      let player = { ...g.player, coins: coins - item.cost };
      const e = item.effect;
      if (e.hpDelta) player.hp = Math.min(player.maxHp, player.hp + e.hpDelta);
      if (e.maxHpDelta) { player.maxHp += e.maxHpDelta; player.hp += e.maxHpDelta; }
      if (e.attackBonusDelta) player.attackBonus += e.attackBonusDelta;
      if (e.healBonusDelta) player.healBonus += e.healBonusDelta;
      if (e.rerollDelta) { player.rerollsPerTurn += e.rerollDelta; player.rerollsLeft += e.rerollDelta; }
      if (e.combatStartShieldDelta) player.combatStartShield += e.combatStartShieldDelta;
      const newInventory = g.shopInventory.filter((_, i) => i !== itemIndex);
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
    const welcomed = localStorage.getItem('jk_welcomed');
    if (!welcomed) {
      setMeta((m) => {
        const updated = { ...m, gems: m.gems + 50 };
        saveMeta(updated);
        return updated;
      });
      localStorage.setItem('jk_welcomed', '1');
      setGame((g) => ({ ...g, actionFlash: { id: Date.now(), text: '🎁 Welcome! +50 gems', tone: 'amber' } }));
    }
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
              {/* Win streak — only when > 0 */}
              {game.winStreak > 0 && (
                <div className="flex items-center gap-0.5 rounded-lg border border-emerald-400/20 bg-emerald-900/15 px-2 py-1 text-[10px] font-black text-emerald-300">
                  🔥{game.winStreak}
                </div>
              )}
              {/* Phase chip */}
              <div className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-[10px] font-black uppercase text-amber-300">
                {game.phase}
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

        <div className="grid shrink-0 gap-1.5 md:gap-2 md:grid-cols-[1.15fr_1fr_1.15fr]">
          <SectionCard title="Enemy panel" className="order-3 md:order-3">
            <div className="rounded-[18px] border border-rose-300/30 bg-gradient-to-b from-rose-950/45 to-black/85 p-1.5">
              <div className="flex h-full flex-col items-center justify-center gap-1.5 rounded-[14px] border border-rose-300/40 bg-black/35 p-1.5 text-center">
                <motion.img
                  ref={enemyAnchorRef}
                  src={game.enemy.image}
                  alt={game.enemy.name}
                  animate={game.enemyHitPulse ? { scale: [1, 1.12, 0.96, 1], filter: ["brightness(1)", "brightness(1.55)", "brightness(1)"] } : game.enemyAttackPulse ? { x: [0, -10, 10, -8, 8, 0], scale: [1, 1.06, 1] } : intent.type === "attack" ? { scale: [1, 1.03, 1], x: [0, -2, 2, 0] } : { scale: 1, x: 0 }}
                  transition={{ duration: 0.45 }}
                  className="h-[90px] w-full object-contain contrast-110 saturate-110 drop-shadow-[0_14px_24px_rgba(0,0,0,0.6)] md:h-[128px]"
                />
                <div className="text-[11px] font-black md:text-sm">{game.enemy.emoji} {game.enemy.name}{game.enemy.elite ? ` ${"⭐".repeat(game.enemy.eliteStars || 1)}` : ""}</div>
                <div className="text-[9px] text-zinc-300">{game.enemy.mood}</div>
                <div className="flex items-center gap-1">
                  <div className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-zinc-200">
                    {getTierLabel(game.enemy)}
                  </div>
                  {(game.enemy.charge || 0) > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], opacity: [0.85, 1, 0.85] }}
                      transition={{ duration: 0.9, repeat: Infinity }}
                      className="rounded-full border border-rose-400/70 bg-rose-600/50 px-2 py-1 text-[9px] font-black text-rose-100"
                    >
                      ⚡ +{game.enemy.charge} READY
                    </motion.div>
                  )}
                </div>
                <LifeBar label="Enemy HP" current={game.enemy.hp} max={game.enemy.maxHp} tone="enemy" size={game.enemy.maxHp >= 55 ? "lg" : "md"} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Combat center" className="order-2 md:order-2">
            <div className="grid grid-cols-2 gap-1 rounded-[16px] border border-white/10 bg-black/35 p-1.5">
              <CompactStat label="Intent" value={`${intentMeta(intent.type).emoji} ${intent.type}`} accent={intentMeta(intent.type).color} />
              <CompactStat label="Value" value={`${intent.value}`} accent="text-rose-300" />
              <CompactStat label="Modifier" value={intent.mod.badge} accent={modifierClass(game.enemy.modifier)} />
              <CompactStat label="No-hit" value={`${game.noHitTurns}T · x${streakMultiplier.toFixed(1)}`} accent="text-lime-300" />
              <CompactStat label="Enemy Shield" value={`${game.enemy.shield || 0}`} accent="text-rose-200" />
              <div className="rounded-[12px] border border-white/10 bg-black/35 p-1.5 text-center">
                <div className="text-[9px] uppercase tracking-[0.14em] text-zinc-300">Outcome</div>
                <div className="mt-0.5 text-[11px] font-black text-cyan-100">{game.lastOutcome || "—"}</div>
              </div>
              <div className="col-span-2 rounded-[12px] border border-white/10 bg-black/40 p-1.5">
                <div className="mb-1 text-[9px] uppercase tracking-[0.14em] text-zinc-300">Intent timeline</div>
                <div className="space-y-0.5 text-[10px]">
                  {intentTimeline.slice(0, 2).map((entry, idx) => (
                    <div key={`${entry.type}-${idx}-${entry.value}`} className={`rounded-lg border border-white/10 px-2 py-0.5 ${idx === 0 ? "bg-white/10" : "bg-black/35"}`}>
                      <span className={intentMeta(entry.type).color}>{intentMeta(entry.type).emoji} {entry.label}</span>
                      <span className="ml-1 text-zinc-200">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Player panel" className="order-1 md:order-1">
            <div className="rounded-[18px] border border-cyan-300/30 bg-gradient-to-b from-cyan-950/40 to-black/85 p-1.5">
              <div className="grid grid-cols-2 gap-1 rounded-[14px] border border-cyan-300/30 bg-black/35 p-1.5">
                <div className="col-span-2 flex flex-col items-center gap-1.5 rounded-[16px] border border-white/10 bg-black/35 p-1.5 text-center">
                <motion.img
                  ref={playerAnchorRef}
                  src={avatarUrl}
                  alt="Kabalian"
                  animate={game.avatarMood === "hurt" ? { x: [0, -2, 2, -2, 0] } : game.avatarMood === "victory" ? { y: [0, -3, 0] } : { x: 0, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className={`h-[90px] w-full rounded-2xl border border-white/10 bg-black/40 object-contain md:h-[128px] ${avatarRing}`}
                />
                <div className="min-w-0">
                  <div className="text-sm font-black">{game.player.PLAYER_CHARACTERS[game.player.characterId]?.name ?? game.player.characterId}</div>
                  <div className="text-[9px] text-zinc-300">CD {game.player.cooldownBase} · Tick {game.player.cooldownTick} · Arts {totalArtifacts}</div>
                </div>
                <img src={LOGO_URL} alt="Kabal logo" className="h-6 w-6 object-contain opacity-90" />
              </div>
                <div className="col-span-2">
                  <LifeBar label="Player HP" current={game.player.hp} max={game.player.maxHp} tone="player" />
                </div>
                <CompactStat label="🛡️ Shield" value={`${game.player.shield}`} accent="text-cyan-200" />
                <CompactStat label="Reroll" value={`${game.player.rerollsLeft}`} accent="text-amber-300" />
                {game.player.companion ? (
                  <div className="col-span-2 rounded-[12px] border border-emerald-400/25 bg-emerald-900/20 p-2">
                    <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Companion</div>
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span>{game.player.companion.emoji} {game.player.companion.name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black border ${game.player.companion.cooldownRemaining === 0 ? 'bg-emerald-600/40 border-emerald-400/50 text-emerald-200' : 'bg-zinc-800 border-zinc-600 text-zinc-400'}`}>
                        {game.player.companion.cooldownRemaining === 0 ? 'READY' : `CD ${game.player.companion.cooldownRemaining}`}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="col-span-2 rounded-[12px] border border-white/10 bg-black/45 p-2">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Owned artifacts</div>
                  {game.player.artifacts.length ? (
                    <div className="flex max-h-20 flex-wrap gap-1 overflow-auto pr-1">
                      {game.player.artifacts.map((artifact) => (
                        <div key={`owned-${artifact.id}`} className="flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2 py-1 text-[9px]">
                          {artifact.image ? <img src={artifact.image} alt={artifact.name} className="h-4 w-4 rounded-full object-cover" /> : <span>✨</span>}
                          <span>{artifact.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-[10px] text-zinc-300">No artifacts yet.</div>}
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Last action"
          className="order-1"
          right={(
            <button
              onClick={() => setGame((g) => ({ ...g, showAllLogs: !g.showAllLogs }))}
              className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20"
            >
              {game.showAllLogs ? "▲" : "▼"}
            </button>
          )}
        >
          <div className="rounded-[12px] border border-white/10 bg-zinc-900/80 px-2.5 py-1.5 text-[11px] md:text-xs">{latestAction}</div>
          <AnimatePresence>
            {game.showAllLogs ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-2 max-h-32 space-y-1 overflow-auto pr-1">
                  {game.log.slice(1, 12).map((line, i) => (
                    <div key={`${line}-${i}`} className="rounded-[10px] border border-white/10 bg-black/35 px-2 py-1 text-[10px] text-zinc-100">{line}</div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SectionCard>

        <SectionCard title="Dice + Action" className="order-2" right={<div className="text-[9px] text-zinc-300">Tap die, then slot</div>}>
          <div className="mb-1 flex flex-wrap justify-center gap-1 text-[9px] md:text-[10px]">
            <div className="rounded-xl border border-zinc-300/30 bg-zinc-900/70 px-2 py-1">⚔️ Attack die 1-6 (black)</div>
            <div className="rounded-xl border border-pink-200/35 bg-pink-500/20 px-2 py-1">❤️ Dé Health 1-6</div>
            <div className="rounded-xl border border-white/50 bg-white/15 px-2 py-1">🛡️ Shield die 1-6 (white)</div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-2 py-1">🔥 Combo = 3 attack dice</div>
          </div>
          <div className="mb-1 grid gap-1 rounded-[12px] border border-white/10 bg-black/35 p-2 text-[11px] md:grid-cols-2">
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-zinc-300">Damage forecast</div>
              <div className="font-black text-zinc-100">⚔️ {expectedOutcome.attack} · 🛡️ +{expectedOutcome.shield} · ❤️ +{expectedOutcome.heal}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-zinc-300">Slot preview</div>
              <div className="font-black text-amber-200">{hoveredPreview || "Hover a slot to preview final value"}</div>
            </div>
          </div>
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
            {game.phase === "roll" ? <div className="w-full text-center text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Start turn: press roll, then place dice on board</div> : null}
            {(game.phase === "roll" || game.phase === "rolling") ? (
              BTN_IMAGES.roll ? (
                <ActionBtn
                  imgSrc={BTN_IMAGES.roll}
                  label={game.rolling ? "🎲 Rolling..." : "🎲 ROLL"}
                  onClick={startRoll}
                  disabled={game.rolling}
                  pulse={game.phase === "roll" && !game.rolling}
                />
              ) : (
                <Button onClick={startRoll} disabled={game.rolling} className={`rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black hover:bg-amber-300 disabled:opacity-60 ${game.phase === "roll" && !game.rolling ? "animate-pulse shadow-[0_0_0_6px_rgba(252,211,77,0.20)]" : ""}`}>
                  {game.rolling ? "🎲 Rolling..." : "🎲 ROLL"}
                </Button>
              )
            ) : null}
            {game.phase === "place" ? (
              <div className="flex w-full gap-2">
                {BTN_IMAGES.reroll ? (
                  <ActionBtn
                    imgSrc={BTN_IMAGES.reroll}
                    label="🔁 REROLL"
                    onClick={rerollActiveDie}
                    disabled={game.player.rerollsLeft <= 0 || activeDieIndex === null}
                  />
                ) : (
                  <Button onClick={rerollActiveDie} disabled={game.player.rerollsLeft <= 0 || activeDieIndex === null} className="flex-1 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-700/90 to-zinc-900 px-3 py-2.5 text-sm font-black text-white hover:from-zinc-600 hover:to-zinc-800 disabled:opacity-40">
                    🔁 REROLL
                  </Button>
                )}
                {game.cooldowns.some(row => row.some(v => v > 0)) && (
                  <Button
                    onClick={freeCooldownSlot}
                    disabled={game.player.rerollsLeft <= 0}
                    title="Spend 1 reroll to free the most blocked cooldown slot"
                    className="flex-1 rounded-2xl border border-sky-400/30 bg-gradient-to-b from-sky-800/50 to-sky-900/70 px-3 py-2.5 text-sm font-black text-sky-200 hover:from-sky-700/60 hover:to-sky-800/80 disabled:opacity-40"
                  >
                    🔓 FREE CD
                  </Button>
                )}
              </div>
            ) : null}
            {resolvePreview ? (
              <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-[11px]">
                <div className="mb-1.5 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400">If you resolve now</div>
                <div className="flex items-center justify-center gap-4">
                  {/* Enemy */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-zinc-500">Enemy HP</span>
                    <div className="flex items-center gap-1 font-black">
                      <span className="text-red-400">{game.enemy.hp}</span>
                      <span className="text-zinc-500">→</span>
                      <span className={resolvePreview.enemyHpAfter <= 0 ? "text-emerald-400" : "text-orange-300"}>{Math.max(0, resolvePreview.enemyHpAfter)}</span>
                    </div>
                    {resolvePreview.totals.attack > 0 && <span className="text-[10px] text-red-400">⚔️ -{resolvePreview.totals.attack}</span>}
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  {/* Player HP */}
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-zinc-500">Your HP</span>
                    <div className="flex items-center gap-1 font-black">
                      <span className="text-zinc-300">{game.player.hp}</span>
                      <span className="text-zinc-500">→</span>
                      <span className={resolvePreview.playerHpAfter > game.player.hp ? "text-emerald-400" : "text-zinc-300"}>{resolvePreview.playerHpAfter}</span>
                    </div>
                    {resolvePreview.totals.heal > 0 && <span className="text-[10px] text-emerald-400">❤️ +{resolvePreview.totals.heal}</span>}
                  </div>
                  {resolvePreview.totals.shield > 0 && (
                    <>
                      <div className="h-8 w-px bg-white/10" />
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] text-zinc-500">Shield</span>
                        <span className="font-black text-sky-300">+{resolvePreview.totals.shield}</span>
                        <span className="text-[9px] text-sky-400/70">blocks first</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : null}
            {game.phase === "place" && game.grid.some(row => row.some(cell => cell !== null)) ? (
              BTN_IMAGES.resolve ? (
                <ActionBtn
                  imgSrc={BTN_IMAGES.resolve}
                  label="✅ RESOLVE"
                  onClick={manualResolve}
                />
              ) : (
                <Button onClick={manualResolve} className="rounded-2xl border border-emerald-400/40 bg-gradient-to-b from-emerald-700/70 to-emerald-900/80 px-5 py-2.5 text-sm font-black text-white hover:from-emerald-600/80 hover:to-emerald-800 shadow-[0_0_0_4px_rgba(52,211,153,0.15)]">
                  ✅ RESOLVE
                </Button>
              )
            ) : null}
            {game.player.companion && (game.phase === "roll" || game.phase === "place") ? (
              <Button
                onClick={activateCompanionActive}
                disabled={game.player.companion.cooldownRemaining > 0}
                className={`rounded-2xl border px-3 py-2.5 text-sm font-black transition ${game.player.companion.cooldownRemaining === 0 ? 'border-emerald-400/50 bg-emerald-600/25 text-emerald-100 hover:bg-emerald-600/40' : 'border-zinc-600/40 bg-zinc-800/50 text-zinc-500 cursor-not-allowed opacity-60'}`}
              >
                {game.player.companion.emoji} {game.player.companion.active.name}
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
                    className={`rounded-2xl border px-3 py-2.5 text-sm font-black transition ${ready ? 'border-amber-400/50 bg-amber-600/20 text-amber-100 hover:bg-amber-600/35' : 'border-zinc-600/40 bg-zinc-800/50 text-zinc-500 cursor-not-allowed opacity-60'}`}
                  >
                    <span style={{ color: RARITY_COLORS[weapon.rarity] }}>⚔️</span>{' '}
                    <span>{weapon.name}</span>{' '}
                    <span className="text-[10px]">{ready ? 'READY' : `${weapon.cooldownRemaining}/${weapon.cooldown}`}</span>
                  </Button>
                );
              })
            ) : null}
            {(game.phase === "roll" || game.phase === "place") && game.mapLayers && (
              <Button
                onClick={() => setGame(g => ({ ...g, phase: 'map' }))}
                className="rounded-xl border border-amber-400/25 bg-amber-900/30 px-3 py-1.5 text-xs font-black text-amber-200 hover:bg-amber-900/50"
              >
                🗺️ MAP
              </Button>
            )}
            {(game.phase === "gameover" || game.phase === "victory") ? (
              <>
                <Button onClick={shareRun} className="rounded-2xl bg-sky-500/35 px-4 py-2.5 text-sm font-black text-white hover:bg-sky-500/50">Share run</Button>
                {BTN_IMAGES.restart ? (
                  <ActionBtn imgSrc={BTN_IMAGES.restart} label="↺ RESTART" onClick={restart} />
                ) : (
                  <Button onClick={restart} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-zinc-200">↺ Play again</Button>
                )}
              </>
            ) : null}
          </div>

          <div className="flex min-h-[56px] items-center justify-center gap-2">
            {game.phase === "place" ? (
              <Button onClick={() => shiftSelectedDie(-1)} className="h-10 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-800/80 to-zinc-900 px-4 text-white hover:from-zinc-700 hover:to-zinc-800">⬅️</Button>
            ) : null}
            <div className="flex min-h-[56px] flex-wrap items-start justify-center gap-1.5">
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
              <div className="text-[11px] text-zinc-100">🎲 No dice yet. Press <span className="font-black text-amber-300">ROLL</span>.</div>
            )}
            </div>
            {game.phase === "place" ? (
              <Button onClick={() => shiftSelectedDie(1)} className="h-10 rounded-2xl border border-white/20 bg-gradient-to-b from-zinc-800/80 to-zinc-900 px-4 text-white hover:from-zinc-700 hover:to-zinc-800">➡️</Button>
            ) : null}
          </div>
          <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 text-[11px] text-zinc-400 select-none">
            <input
              type="checkbox"
              checked={autoResolve}
              onChange={(e) => {
                setAutoResolve(e.target.checked);
                try { localStorage.setItem('jk_auto_resolve', String(e.target.checked)); } catch {}
              }}
              className="h-3.5 w-3.5 accent-emerald-400"
            />
            <span>Auto-resolve <span className="text-zinc-500">(place all dice = instant resolve)</span></span>
          </label>
        </SectionCard>





        <SectionCard title="Board" className="order-3 md:order-3" right={<div className="text-[9px] text-zinc-300">Place dice on available slots</div>}>
          {activeDieMeta && game.phase === "place" ? (
            <div className="mb-2 flex items-center gap-2 rounded-[12px] border border-amber-300/20 bg-amber-300/10 px-2 py-1.5 text-[11px] text-white">
              <span className="text-lg">{activeDieMeta.emoji}</span>
              <div>
                <div className="text-[12px] font-black text-amber-300">Next die: {activeDieMeta.label}</div>
                <div className="text-[10px] text-zinc-100">{activeDieMeta.desc}</div>
              </div>
            </div>
          ) : null}

          <div className="grid justify-center gap-1 [grid-template-columns:32px_repeat(3,72px)] md:[grid-template-columns:40px_repeat(3,84px)]">
            {ROW_INFO.map((row, y) => (
              <React.Fragment key={row.name}>
                <div className="h-[72px] rounded-[10px] border border-white/15 bg-black flex flex-col items-center justify-center text-[9px] font-black text-white md:h-[84px] md:text-[10px]">
                  <span>{row.emoji}</span>
                  <span>x{rowMultiplier(game.player, y)}</span>
                  <span className="text-[8px] text-zinc-300">{row.role}</span>
                </div>
                {game.grid[y].map((cell, x) => {
                  const cooldown = game.cooldowns[y][x];
                  const blocked = cooldown > 0;
                  const canPlace = game.phase === "place" && !blocked && cell === null && activeDieIndex !== null;
                  const meta = cell !== null ? getDieMeta(cell) : null;
                  return (
                    <button
                      key={`${x}-${y}`}
                      onClick={() => activeDieIndex !== null && placeDie(activeDieIndex, x, y)}
                      onMouseEnter={() => setHoveredSlot({ x, y })}
                      onMouseLeave={() => setHoveredSlot(null)}
                      className={`relative h-[72px] w-[72px] overflow-hidden rounded-[10px] border text-white transition md:h-[84px] md:w-[84px] ${canPlace ? "border-amber-300/60 ring-2 ring-amber-300/20" : "border-white/20"}`}
                    >
                      <img src={LANE_IMAGES[y]} className="absolute inset-0 h-full w-full object-contain" />
                      {cell !== null ? (
                        <>
                          <div className="absolute inset-0 bg-black/10" />
                          <img src={getDieImage(cell)} className="absolute inset-0 h-full w-full object-contain" />
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded bg-black/60 px-1 text-[9px] font-black">
                            {meta?.emoji} {cell.value}
                          </div>
                        </>
                      ) : blocked ? (
                        <>
                          <div className="absolute inset-0 bg-red-950/60" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-bold">
                            ⏳ {cooldown}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-black/25" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-[13px] font-bold tracking-[0.08em]">
                            PLACE
                            {canPlace ? <span className="text-[10px] text-amber-200">{activeDieMeta?.emoji}</span> : null}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </SectionCard>


        <SectionCard title="Combat log" className="order-4 md:order-4">
          <div className="space-y-1">
            {latestLogs.map((line, i) => (
              <div key={`${line}-${i}`} className="rounded-[12px] border border-white/10 bg-zinc-900/80 px-2.5 py-1.5 text-[11px] md:text-xs">{line}</div>
            ))}
          </div>
          <div className="my-2 grid max-w-[360px] grid-cols-5 gap-1">
            {game.route.map((enemy, index) => {
              const state = index < game.room ? "done" : index === game.room ? "current" : "hidden";
              return <RouteCard key={`${enemy.name}-${index}`} enemy={enemy} state={state} />;
            })}
          </div>
          <div className="max-h-32 space-y-1 overflow-auto pt-1.5 md:max-h-28">
            {game.log.slice(3, 20).map((line, i) => (
              <div key={`${line}-${i}`} className="rounded-[12px] border border-white/10 bg-black/35 px-2.5 py-1.5 text-[10px] text-zinc-100">{line}</div>
            ))}
          </div>
        </SectionCard>



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
            const charSelectMeta = loadMeta();
            const showWeaponPick = hasWeaponSlot(charSelectMeta);
            const showCompanionPick = hasCompanionSlot(charSelectMeta);
            const unlockedCompanionIds = getUnlockedCompanions(charSelectMeta);
            const availableCompanions = COMPANIONS.filter(c => unlockedCompanionIds.includes(c.id));
            const ARCH_EMOJIS: Record<string, string> = { blade: '⚔️', staff: '🪄', shield: '🛡️', totem: '🪬', cannon: '💥', fang: '🐍' };
            const filteredWeapons = STARTER_WEAPONS.filter(w => {
              const rarityOk = weaponRarityFilter === 'all' || w.rarity === weaponRarityFilter;
              const archOk = weaponArchFilter === 'all' || w.archetype === weaponArchFilter;
              return rarityOk && archOk;
            });
            const selectedCharObj = selectedStartCharacter ? (PLAYER_CHARACTERS as any)[selectedStartCharacter] : null;
            return (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
                <div className="w-full max-w-3xl rounded-[28px] border border-cyan-300/25 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)] max-h-[90vh] overflow-y-auto my-4">

                  {/* STEP 1 — Character */}
                  <div className="mb-5">
                    <div className="mb-3 text-center">
                      <div className="font-serif text-xl italic text-amber-300">Choose your character</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Select a character to reveal loadout options</div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.values(PLAYER_CHARACTERS).map((character: any) => {
                        const isLocked =
                          (character.id === 'kkm'  && !canPlayKKM(charSelectMeta)) ||
                          (character.id === 'krex' && !canPlayKRex(charSelectMeta));
                        const isSelected = selectedStartCharacter === character.id;
                        const lockLabel =
                          character.id === 'kkm'  ? 'Unlock with 200 gems' :
                          character.id === 'krex' ? 'Unlock at Level 8'    : '';
                        return (
                          <button
                            key={character.id}
                            onClick={() => !isLocked && setSelectedStartCharacter(isSelected ? null : character.id)}
                            disabled={isLocked}
                            className={`rounded-2xl border p-3 text-left transition relative ${isLocked ? 'border-zinc-700/50 bg-black/30 opacity-60 cursor-not-allowed' : isSelected ? 'border-amber-300/70 bg-amber-950/30 shadow-[0_0_16px_rgba(252,211,77,0.18)]' : 'border-white/15 bg-black/45 hover:border-amber-300/40 hover:bg-black/70'}`}
                          >
                            <div className="relative">
                              <img src={character.avatar} alt={character.name} className="mb-2 h-28 w-full rounded-xl border border-white/10 bg-black/40 object-contain" />
                              {isLocked && <div className="absolute inset-0 flex items-center justify-center text-4xl">🔒</div>}
                              {isSelected && (
                                <div className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-black text-xs font-black">✓</div>
                              )}
                            </div>
                            <div className="font-black text-sm text-amber-200">{character.name} {isLocked ? '🔒' : ''}</div>
                            <div className="text-[10px] text-zinc-300">{isLocked ? lockLabel : character.subtitle}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* STEP 2 — Loadout (visible only after character selected) */}
                  {selectedStartCharacter !== null && (
                    <div className="space-y-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 border-t border-white/10 pt-4">⚙️ Loadout</div>

                      {/* A) Weapon slot */}
                      {showWeaponPick && (
                        <div>
                          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-300">⚔️ Starter Weapon (optional)</div>
                          {/* Filter bar */}
                          <div className="mb-2 space-y-1">
                            <div className="overflow-x-auto whitespace-nowrap">
                              <div className="inline-flex gap-1">
                                {['all', 'common', 'rare', 'epic', 'legendary'].map(r => (
                                  <button
                                    key={r}
                                    onClick={() => setWeaponRarityFilter(r)}
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-black border transition ${weaponRarityFilter === r ? 'bg-amber-400/30 border-amber-400/60 text-amber-200' : 'border-white/15 bg-black/30 text-zinc-400 hover:border-white/30'}`}
                                    style={r !== 'all' ? { color: (RARITY_COLORS as any)[r] } : {}}
                                  >
                                    {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="overflow-x-auto whitespace-nowrap">
                              <div className="inline-flex gap-1">
                                {['all', 'blade', 'staff', 'shield', 'totem', 'cannon', 'fang'].map(a => (
                                  <button
                                    key={a}
                                    onClick={() => setWeaponArchFilter(a)}
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-black border transition ${weaponArchFilter === a ? 'bg-cyan-400/20 border-cyan-400/50 text-cyan-200' : 'border-white/15 bg-black/30 text-zinc-400 hover:border-white/30'}`}
                                  >
                                    {a === 'all' ? 'All' : `${ARCH_EMOJIS[a] || ''} ${a}`}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* Weapon grid */}
                          <div className="max-h-48 overflow-y-auto pr-1">
                            <div className="grid gap-1.5 grid-cols-2 md:grid-cols-3">
                              {filteredWeapons.length === 0 && (
                                <div className="col-span-3 text-center text-[10px] text-zinc-500 py-4">No weapons match this filter</div>
                              )}
                              {filteredWeapons.map((weapon) => {
                                const isSelected = selectedStartWeapon?.id === weapon.id;
                                return (
                                  <button
                                    key={weapon.id}
                                    onClick={() => setSelectedStartWeapon(isSelected ? null : weapon)}
                                    className={`rounded-xl border p-2 text-left transition ${isSelected ? 'border-amber-300/60 bg-amber-950/30' : 'border-white/10 bg-black/35 hover:border-white/25'}`}
                                  >
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-[10px]">{ARCH_EMOJIS[weapon.archetype] || '⚔️'}</span>
                                      <span className="text-[10px] font-black leading-tight" style={{ color: (RARITY_COLORS as any)[weapon.rarity] }}>{weapon.name}</span>
                                    </div>
                                    <div className="text-[9px] text-zinc-500 capitalize mb-0.5">{weapon.archetype} · {weapon.rarity}</div>
                                    {weapon.passive?.desc && <div className="text-[9px] text-zinc-400 leading-tight mb-0.5">{weapon.passive.desc}</div>}
                                    <div className="text-[9px] text-zinc-500 leading-tight">{weapon.special.name}</div>
                                    {isSelected && <div className="mt-1 text-[9px] font-black text-amber-300">✓ Selected</div>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* B) Companion slot */}
                      {showCompanionPick && availableCompanions.length > 0 && (
                        <div>
                          <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">🐾 Starter Companion (optional)</div>
                          <div className="grid gap-1.5 grid-cols-2 md:grid-cols-3">
                            {availableCompanions.map((companion) => {
                              const isSelected = selectedStartCompanion?.id === companion.id;
                              return (
                                <button
                                  key={companion.id}
                                  onClick={() => setSelectedStartCompanion(isSelected ? null : companion)}
                                  className={`rounded-xl border p-2 text-left transition ${isSelected ? 'border-emerald-300/60 bg-emerald-950/30' : 'border-white/10 bg-black/35 hover:border-white/25'}`}
                                >
                                  <div className="text-base">{companion.emoji}</div>
                                  <div className="text-xs font-black text-white">{companion.name}</div>
                                  <div className="text-[10px] text-zinc-400">{companion.active.name}</div>
                                  {isSelected && <div className="mt-1 text-[10px] font-black text-emerald-300">✓ Selected</div>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* C) Relic slots (placeholder) */}
                      <div>
                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-400">🔮 Relics — coming soon</div>
                        <div className="flex gap-2">
                          {[1, 2, 3].map(n => (
                            <div key={n} className="flex-1 rounded-xl border border-white/10 bg-black/30 p-3 flex flex-col items-center gap-1 opacity-50">
                              <div className="text-xl">🔒</div>
                              <div className="text-[9px] text-zinc-500">Relic slot {n}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* START RUN button */}
                  <div className="mt-5 pt-4 border-t border-white/10">
                    <button
                      onClick={() => selectedStartCharacter && pickCharacter(selectedStartCharacter)}
                      disabled={!selectedStartCharacter}
                      className={`w-full rounded-2xl py-3 text-sm font-black transition ${selectedStartCharacter ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_0_6px_rgba(252,211,77,0.18)]' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'}`}
                    >
                      {selectedCharObj ? `Start as ${selectedCharObj.name} →` : 'Select a character to start'}
                    </button>
                  </div>

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
                              disabled={!isAvailable}
                              onClick={() => isAvailable && enterMapNode(node.id)}
                              className={`flex min-w-[72px] flex-col items-center rounded-2xl border p-2 transition ${borderClass}`}
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
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <div className="font-serif text-xl italic text-amber-300">🛒 Jungle Shop</div>
                    <div className="text-[11px] text-zinc-400">Zone {game.floor} · Your coins: <span className="text-amber-300 font-black">{game.player.coins || 0}</span></div>
                  </div>
                  <button onClick={handleShopLeave} className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20">Leave</button>
                </div>
                <div className="mt-3 space-y-2">
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
                      const def = UNLOCKS.find(u => u.id === id);
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
                  {UNLOCKS.map((unlock) => {
                    const isUnlocked = meta.unlocks.includes(unlock.id);
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
