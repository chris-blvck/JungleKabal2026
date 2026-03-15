import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const BG_URL = "https://i.postimg.cc/YSmfqq2c/Background-desktop.png";
const LOGO_URL = "https://i.postimg.cc/rwdjP9rb/logo-jaune.png";
const PLAYER_AVATAR_URL = "https://i.postimg.cc/B6rBLmBt/Kabalian-Face.png";
const KKM_AVATAR_URL = "https://i.postimg.cc/Kv8zygVk/KKM-Mascot-2.png";
const KREX_AVATAR_URL = "https://i.postimg.cc/B6rBLmBt/Kabalian-Face.png";
const SHOPKEEPER_URL = "https://i.postimg.cc/Kv8zygVk/KKM-Mascot-2.png";
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

const PLAYER_CHARACTERS = {
  kabalian: {
    id: "kabalian",
    name: "Kabalian",
    avatar: PLAYER_AVATAR_URL,
    subtitle: "Aggro · 24 HP · +1 ATK · 2 rerolls",
    stats: { maxHp: 24, attackBonus: 1, rerollsPerTurn: 2, combatStartShield: 0 },
  },
  kkm: {
    id: "kkm",
    name: "KKM",
    avatar: KKM_AVATAR_URL,
    subtitle: "Tank · 34 HP · +4 start shield",
    stats: { maxHp: 34, attackBonus: 0, rerollsPerTurn: 1, combatStartShield: 4 },
  },
  krex: {
    id: "krex",
    name: "K REX",
    avatar: KREX_AVATAR_URL,
    subtitle: "Hybrid · 28 HP · +1 ATK · +1 shield start · 2 rerolls",
    stats: { maxHp: 28, attackBonus: 1, rerollsPerTurn: 2, combatStartShield: 1 },
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
const LEADERBOARD_STORAGE_KEY = "jungle_kabal_leaderboard_v1";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const SELECTED_COSMETIC_STORAGE_KEY = "jungle_kabal_selected_cosmetic_v1";

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

const SHOP_ITEM_POOL = [
  { key: "heal-8", name: "Heal 8 HP", cost: 30, rarity: "common", icon: "❤️", desc: "Consommable immédiat" },
  { key: "maxhp-5", name: "+5 Max HP", cost: 50, rarity: "common", icon: "🧬", desc: "Permanent pour le run" },
  { key: "weapon-common", name: "Arme (common)", cost: 60, rarity: "common", icon: "🗡️", desc: "Arme aléatoire common/gray" },
  { key: "weapon-rare", name: "Arme (rare)", cost: 120, rarity: "gold", icon: "✨", desc: "Arme aléatoire gold/chrome" },
  { key: "reroll-shop", name: "Reroll shop", cost: 15, rarity: "gray", icon: "🎲", desc: "Régénère l'inventaire" },
  { key: "reroll-artifact", name: "Reroll artifact", cost: 40, rarity: "gold", icon: "🎁", desc: "+1 token de reroll artifact" },
];

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

function shopRarityClasses(rarity = "common") {
  if (rarity === "chrome") return "border-cyan-300/40 bg-cyan-500/10";
  if (rarity === "gold") return "border-amber-300/40 bg-amber-500/10";
  if (rarity === "gray") return "border-zinc-300/30 bg-zinc-500/10";
  return "border-emerald-300/30 bg-emerald-500/10";
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
    const scale = floor - 1;
    const hpScale = type === "boss" ? 8 : type === "elite" ? 5 : 3;
    const dmgScale = type === "boss" ? 2 : 1;
    base.hp += scale * hpScale;
    base.maxHp = base.hp;
    base.damage += scale * dmgScale;
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

function buildMapChoices(nextIndex, floor = 1) {
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

    const nodeType = randFrom(["combat", "combat", "combat", "shop", "rest"]);
    const finalNodeType = randFrom([nodeType, "event"]);
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

function buildShopInventory() {
  return pickUnique(SHOP_ITEM_POOL, 4).map((item, idx) => ({
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

function rollDice(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    kind: DIE_KIND_ORDER[i % DIE_KIND_ORDER.length],
    value: Math.floor(Math.random() * 6) + 1,
  }));
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

function getStoryFragment(fragmentIndex, characterId, narrativeOverride = null) {
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

  const overrideSet = isKKM ? narrativeOverride?.kkm : narrativeOverride?.kabalian;
  const normalizedOverride = Array.isArray(overrideSet) ? overrideSet.filter((item) => item && Array.isArray(item.lines)) : [];
  const fragments = normalizedOverride.length ? normalizedOverride : (isKKM ? kkm : kabalian);
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
  let attackDiceCount = 0;
  const rowBreakdown = [];

  state.grid.forEach((row, rowIndex) => {
    let rowAttack = 0;
    let rowShield = 0;
    let rowHeal = 0;
    const mult = rowMultiplier(player, rowIndex);
    row.forEach((die) => {
      if (die === null) return;
      const meta = getDieMeta(die);
      if (meta.kind === "shield") {
        rowShield += die.value * mult;
      } else if (meta.kind === "heal") {
        rowHeal += (die.value + player.healBonus) * mult;
      } else {
        const attackValue = (die.value + player.attackDieValueBonus + player.attackBonus) * mult;
        rowAttack += attackValue;
        attackDiceCount += 1;
      }
    });

    if (rowAttack > 0) rowAttack += ROW_INFO[rowIndex].laneBonus.attack;
    if (rowShield > 0) rowShield += ROW_INFO[rowIndex].laneBonus.shield;
    if (rowHeal > 0) rowHeal += ROW_INFO[rowIndex].laneBonus.heal;

    totalAttack += rowAttack;
    totalShield += rowShield;
    totalHeal += rowHeal;
    rowBreakdown.push(`${ROW_INFO[rowIndex].emoji} x${mult}: ⚔️ ${rowAttack} · 🛡️ ${rowShield} · ❤️ ${rowHeal}`);
  });

  totalShield *= player.shieldMultiplier;

  if (attackDiceCount >= 3) {
    totalAttack += 5;
    rowBreakdown.unshift(`🔥 Combo: 3 attack dice = +5 damage`);
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

  if (enemy.modifier === "thorns" && totalAttack > 0) {
    player.hp -= 1;
    rowBreakdown.unshift(`🌵 Thorns recoil: lose 1 HP`);
  }

  enemy.hp -= totalAttack;
  player.shield += totalShield;
  player.hp = Math.min(player.maxHp, player.hp + totalHeal);

  const overkillBreak = totalAttack >= 15;
  if (overkillBreak && enemy.hp > 0) {
    enemy.charge = 0;
    rowBreakdown.unshift(`💥 Overkill broke enemy charge`);
  }

  return {
    player,
    enemy,
    totals: {
      attack: Math.max(0, totalAttack),
      shield: Math.max(0, totalShield),
      heal: Math.max(0, totalHeal),
    },
    log: [
      ...rowBreakdown,
      `⚔️ Total Attack ${Math.max(0, totalAttack)}`,
      `🛡️ Total Shield +${Math.max(0, totalShield)}`,
      `❤️ Total Heal +${Math.max(0, totalHeal)}`,
    ],
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
    cooldownBase: 3,
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
    runSeed: generateRunSeed(),
    runEnded: false,
    avatarMood: "focus",
    actionFlash: null,
    enemyAttackPulse: 0,
    enemyHitPulse: 0,
    damagePopups: [],
    scorePopups: [],
    comboPopup: null,
    lastOutcome: null,
    pathChoices: [],
    mapChoices: [],
    shopItems: [],
    pendingEnemy: null,
    coins: 0,
    gems: 0,
    artifactRerollTokens: 0,
  };
  safe.artifactsOffered = (safe.artifactsOffered || []).map((id) => byId.get(id)).filter(Boolean);
  safe.enemyAttackPulse = 0;
  safe.damagePopups = [];
  safe.actionFlash = null;
  safe.killPopup = null;
  return safe;
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
  safe.pathChoices = Array.isArray(safe.pathChoices) ? safe.pathChoices : [];
  safe.mapChoices = Array.isArray(safe.mapChoices) ? safe.mapChoices : [];
  safe.shopItems = Array.isArray(safe.shopItems) ? safe.shopItems : [];
  safe.pendingEnemy = safe.pendingEnemy || null;
  safe.coins = Number.isFinite(safe.coins) ? safe.coins : 0;
  safe.gems = Number.isFinite(safe.gems) ? safe.gems : 0;
  safe.artifactRerollTokens = Number.isFinite(safe.artifactRerollTokens) ? safe.artifactRerollTokens : 0;
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

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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


function enemyLoreLine(enemy) {
  if (enemy?.lore) return enemy.lore;
  const action = enemy?.intents?.[0]?.label || "Hunts in silence";
  return `${enemy.name} — ${enemy.mood || "Ancient predator"} · ${action}.`;
}

function artifactLoreLine(artifact) {
  if (artifact?.lore) return artifact.lore;
  const map = {
    relic: "Recovered from forgotten temples between two blood moons.",
    charm: "Crafted by jungle shamans to bend luck in brutal battles.",
    totem: "Carved from wardwood to absorb the jungle's wrath.",
    fang: "Taken from a cursed beast that never stopped hunting.",
    sigil: "Inscribed by the first Kabalians before the great collapse.",
    crown: "Worn by warlords who conquered entire jungle zones.",
    coin: "An old contract token traded for impossible favors.",
    trinket: "A survivor keepsake charged with feral memory.",
    bracelet: "Bound to the pulse of predators and healers alike.",
  };
  return map[artifact?.category] || "An artifact with a past drenched in jungle legend.";
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
      <div className="mt-1 text-[11px] text-zinc-300">📜 {artifactLoreLine(artifact)}</div>
    </button>
  );
}

export default function DieInTheJungleUpgraded() {
  const [game, setGame] = useState(loadSavedGameState);
  const [leaderboard, setLeaderboard] = useState(loadLeaderboard);
  const [mobilePanel, setMobilePanel] = useState("enemy");
  const [hoveredSlot, setHoveredSlot] = useState(null);
  // Loadout state (used during character selection)
  const [pendingCharId, setPendingCharId] = useState(null);
  const [loadout, setLoadout] = useState({ weapon1: null, weapon2: null, companion: null, relic1: null });
  const [wRarityFilter, setWRarityFilter] = useState("All");
  const [wTypeFilter, setWTypeFilter] = useState("All");
  const [loadoutWeaponSlot, setLoadoutWeaponSlot] = useState(1); // which weapon slot is being filled
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
  const intent = getIntentPreview(game.enemy);
  const intentTimeline = getIntentTimeline(game.enemy, 3);
  const expectedOutcome = estimatePlayerOutcome(game.grid, game.player);
  const streakMultiplier = getNoHitMultiplier(game.noHitTurns);
  const topLeaderboardScore = leaderboard[0]?.score || 0;
  const nextBeatTarget = leaderboard.find((entry) => entry.score > game.score)?.score || null;
  const pointsToNextRank = nextBeatTarget ? Math.max(0, nextBeatTarget - game.score + 1) : 0;
  const runtimeVisuals = remoteAdminConfig?.visuals || {};
  const runtimeLogoUrl = runtimeVisuals.logoUrl || LOGO_URL;
  const runtimeBgUrl = runtimeVisuals.backgroundUrl || BG_URL;
  const runtimeStoryImageUrl = runtimeVisuals.storyFragmentImageUrl || STORY_FRAGMENT_IMAGE_URL;
  const runtimeEmotionUrls = { ...PLAYER_EMOTION_URLS, ...(remoteAdminConfig?.characters?.emotionUrls || {}) };
  const runtimeCharacters = { ...PLAYER_CHARACTERS, ...(remoteAdminConfig?.characters?.playable || {}) };
  const storyFragment = getStoryFragment(game.floor + game.room, game.player.characterId, remoteAdminConfig?.narrative);

  function shiftSelectedDie(direction) {
    if (game.characterSelectPending || game.phase !== "place") return;
    setGame((g) => ({
      ...g,
      selectedDieIndex: cycleDieIndex(g.dice, activeDieIndex, direction),
    }));
  }

  function connectWallet() {
    const provider = (window as any).solana;
    if (!provider?.connect) {
      setGame((g) => ({ ...g, actionFlash: { id: Date.now(), text: "⚠️ Phantom wallet not found", tone: "rose" } }));
      return;
    }
    provider.connect()
      .then((response) => {
        const address = response?.publicKey?.toString?.() || "";
        setWalletAddress(address);
        refreshCosmetics(address);
        setGame((g) => ({ ...g, actionFlash: { id: Date.now(), text: "✅ Wallet connected", tone: "emerald" } }));
      })
      .catch(() => {
        setGame((g) => ({ ...g, actionFlash: { id: Date.now(), text: "❌ Wallet connect failed", tone: "rose" } }));
      });
  }

  async function refreshCosmetics(overrideWallet = walletAddress) {
    const wallet = (overrideWallet || "").trim();
    if (!wallet && !tgUserId) {
      setOwnedCosmetics([]);
      return;
    }

    setCosmeticsLoading(true);
    try {
      const search = new URLSearchParams();
      if (wallet) search.set("wallet", wallet);
      if (tgUserId) search.set("telegramId", tgUserId);
      const response = await fetch(`${API_BASE}/api/access/list?${search.toString()}`);
      const payload = await response.json();
      const entitlements = payload.entitlements || [];
      const diejungleOwned = entitlements.filter((entry) => entry?.product?.app === "diejungle");
      setOwnedCosmetics(diejungleOwned);
      if (selectedCosmeticId && !diejungleOwned.some((entry) => entry.productId === selectedCosmeticId)) {
        setSelectedCosmeticId("");
        localStorage.removeItem(SELECTED_COSMETIC_STORAGE_KEY);
      }
    } catch {
      setOwnedCosmetics([]);
    } finally {
      setCosmeticsLoading(false);
    }
  }

  function submitScoreToLeaderboard() {
    if (!game.runEnded) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      wallet: "guest",
      score: game.score,
      zone: game.floor,
      at: new Date().toISOString(),
    };
    const next = [entry, ...leaderboard]
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    setLeaderboard(next);
    localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(next));
    setGame((g) => ({ ...g, actionFlash: { id: Date.now(), text: "🏁 Score submitted", tone: "emerald" } }));
  }

  function shareRun() {
    const characterName = game.player.characterId === "kkm" ? "KKM" : "Kabalian";
    const text = `Reached Zone ${game.floor} in Die in the Jungle%0AScore: ${game.score}%0ACharacter: ${characterName}%0ASeed: ${game.runSeed}%0A%23KabalBlessing`;
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
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
        const dice = rollDice(g.player.dicePerTurn);
        return {
          ...g,
          dice,
          grid: emptyGrid(),
          phase: g.player.hp <= 0 ? "gameover" : "place",
          rolling: false,
          selectedDieIndex: 0,
          avatarMood: "focus",
          actionFlash: { id: Date.now(), text: `🎲 ${dice.map((d) => `${getDieMeta(d).emoji}${d.value}`).join(" · ")}`, tone: "amber" },
          log: [`🎲 Rolled: ${dice.map((d) => `${getDieMeta(d).label} ${d.value}`).join(" - ")}`, ...g.log].slice(0, 40),
        };
      });
    }, 700);
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

    setGame((g) => ({
      ...g,
      dice: newDice,
      grid: newGrid,
      cooldowns: newCooldowns,
      phase: allPlaced ? "resolve" : "place",
      selectedDieIndex: nextIndex,
      avatarMood: placedMeta.kind === "attack" ? "fierce" : placedMeta.kind === "heal" ? "joy" : "guard",
      log: [`${lane.emoji} Put ${placedMeta.emoji} ${placedDie.value} in ${lane.name} x${rowMultiplier(g.player, y)}`, ...g.log].slice(0, 40),
    }));

    if (allPlaced) {
      window.setTimeout(() => resolveTurn(newGrid, newCooldowns), 320);
    }
  }

  function resolveTurn(gridRef, cooldownRef) {
    setGame((g) => {
      const playerResult = resolvePlayerGrid({ ...g, grid: gridRef, enemy: g.enemy, player: g.player });
      let enemy = playerResult.enemy;
      let player = playerResult.player;
      const preRetaliationShield = player.shield;
      const preRetaliationHp = player.hp;
      const totals = playerResult.totals;
      let log = [...playerResult.log];
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
      const randomPos = (target) => ({
        left: target === "enemy" ? `${12 + Math.floor(Math.random() * 24)}%` : `${58 + Math.floor(Math.random() * 24)}%`,
        top: `${20 + Math.floor(Math.random() * 30)}%`,
      });

      if (totals.attack > 0) {
        enemyHitPulse = Date.now();
        damagePopups.push({ id: `${Date.now()}-enemy-hit`, target: "enemy", tone: "damage", text: `-${totals.attack}`, ...randomPos("enemy") });
      }
      if (totals.heal > 0) {
        damagePopups.push({ id: `${Date.now()}-player-heal`, target: "player", tone: "heal", text: `+${totals.heal}`, ...randomPos("player") });
      }
      if (totals.shield > 0) {
        damagePopups.push({ id: `${Date.now()}-player-shield`, target: "player", tone: "shield", text: `🛡️ +${totals.shield}`, ...randomPos("player") });
      }

      if (!enemyDied) {
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
            damagePopups.push({ id: `${Date.now()}-player-hit`, target: "player", tone: "damage", text: `-${hpLoss}`, ...randomPos("player") });
          }
          if (shieldBlocked > 0) {
            damagePopups.push({ id: `${Date.now()}-player-block`, target: "player", tone: "shield", text: `🛡️ ${shieldBlocked}`, ...randomPos("player") });
          }
        }
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
      let coins = g.coins;
      let gems = g.gems;
      let winStreak = enemyDied ? g.winStreak + 1 : 0;
      let phase = player.hp <= 0 ? "gameover" : "roll";
      let room = g.room;
      let route = g.route;
      let combatRewardPending = false;
      let artifactsOffered = [];
      let pathChoices = [];
      let mapChoices = [];
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

        const coinGain = g.enemy.tier === "boss" ? 80 : g.enemy.elite ? 45 : 25;
        coins += coinGain;
        log.unshift(`🪙 Coins +${coinGain}`);
        if (g.enemy.tier === "boss") {
          gems += 1;
          log.unshift("💎 Gem +1");
        }

        if (g.startRewardPending) {
          combatRewardPending = true;
          artifactsOffered = buildStarterArtifactChoices(player);
          phase = "reward";
        } else if (g.enemy.tier === "boss") {
          combatRewardPending = true;
          artifactsOffered = buildArtifactChoices(player);
          phase = "reward";
        } else if (g.room >= g.route.length - 1) {
          phase = "victory";
        } else {
          phase = "path";
          pathChoices = buildPathChoices(g.room + 1, g.floor);
          mapChoices = buildMapChoices(g.room + 1, g.floor);
          actionFlash = { id: Date.now() + 2, text: "🗺️ Choose your map card", tone: "sky" };
          log.unshift("🗺️ Random map cards generated: choose where to move");
        }
      }

      return {
        ...g,
        score,
        coins,
        gems,
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
        pathChoices,
        mapChoices,
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
        const nextRoom = Math.min(g.route.length - 1, g.room + 1);
        const nextEnemy = { ...g.route[nextRoom] };
        return {
          ...g,
          player: { ...player, shield: player.combatStartShield },
          room: nextRoom,
          enemy: nextEnemy,
          phase: "roll",
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          pathChoices: [],
          mapChoices: [],
          actionFlash: { id: Date.now(), text: `🏆 Start relic: ${artifact.name}`, tone: "amber" },
          lastOutcome: null,
          log: [`🏆 Starting artifact: ${artifact.name}`, `✅ Next enemy: ${nextEnemy.emoji} ${nextEnemy.name}`, ...g.log].slice(0, 40),
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
          shopItems: buildShopInventory(),
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
        player: { ...player, shield: player.combatStartShield },
        room: nextRoom,
        enemy: nextEnemy,
        phase: "roll",
        avatarMood: "focus",
        actionFlash: { id: Date.now(), text: `🏆 ${artifact.name}`, tone: "amber" },
        lastOutcome: null,
        artifactsOffered: [],
        combatRewardPending: false,
        startRewardPending: false,
        pathChoices: [],
        mapChoices: [],
        log: [`🏆 Chose ${artifact.name}`, `✅ Next enemy: ${nextEnemy.emoji} ${nextEnemy.name}`, ...g.log].slice(0, 40),
      };
    });
  }

  function skipArtifactReward() {
    setGame((g) => {
      if (!g.combatRewardPending && g.phase !== "reward") return g;

      if (g.startRewardPending) {
        const nextRoom = Math.min(g.route.length - 1, g.room + 1);
        const nextEnemy = { ...g.route[nextRoom] };
        return {
          ...g,
          room: nextRoom,
          enemy: nextEnemy,
          phase: "roll",
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          pathChoices: [],
          mapChoices: [],
          actionFlash: { id: Date.now(), text: "⏭️ Reward skipped", tone: "sky" },
          log: ["⏭️ You skipped the artifact reward", `✅ Next enemy: ${nextEnemy.emoji} ${nextEnemy.name}`, ...g.log].slice(0, 40),
        };
      }

      const finishedRoute = g.room >= g.route.length - 1;
      if (finishedRoute) {
        const nextFloor = g.floor + 1;
        const nextRoute = buildRoute(nextFloor);
        return {
          ...g,
          floor: nextFloor,
          room: 0,
          route: nextRoute,
          enemy: { ...nextRoute[0] },
          pendingEnemy: { ...nextRoute[0] },
          player: { ...g.player, shield: g.player.combatStartShield, rerollsLeft: g.player.rerollsPerTurn },
          phase: "shop",
          shopItems: buildShopInventory(),
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          cooldowns: emptyCooldowns(),
          grid: emptyGrid(),
          dice: [],
          selectedDieIndex: null,
          actionFlash: { id: Date.now(), text: "⏭️ Reward skipped · 🏪 Shop opened", tone: "sky" },
          pathChoices: [],
          mapChoices: [],
          log: ["⏭️ You skipped the artifact reward", `🏪 Shop unlocked before Zone ${nextFloor}`, ...g.log].slice(0, 40),
        };
      }

      const nextRoom = g.room + 1;
      const nextEnemy = { ...g.route[nextRoom] };
      return {
        ...g,
        room: nextRoom,
        enemy: nextEnemy,
        phase: "roll",
        artifactsOffered: [],
        combatRewardPending: false,
        startRewardPending: false,
        pathChoices: [],
        mapChoices: [],
        actionFlash: { id: Date.now(), text: "⏭️ Reward skipped", tone: "sky" },
        log: ["⏭️ You skipped the artifact reward", `✅ Next enemy: ${nextEnemy.emoji} ${nextEnemy.name}`, ...g.log].slice(0, 40),
      };
    });
  }

  function pickPathEnemy(pathEnemy) {
    setGame((g) => {
      if (g.phase !== "path") return g;
      const nextRoom = Math.min(g.route.length - 1, g.room + 1);
      const nextEnemy = { ...pathEnemy, shield: 0, charge: 0, intentIndex: 0, firstIntentUsed: false };
      const nextRoute = [...g.route];
      nextRoute[nextRoom] = nextEnemy;
      return {
        ...g,
        room: nextRoom,
        route: nextRoute,
        enemy: nextEnemy,
        player: { ...g.player, shield: g.player.combatStartShield },
        phase: "roll",
        pathChoices: [],
        mapChoices: [],
        avatarMood: "focus",
        actionFlash: { id: Date.now(), text: `🧭 Path chosen: ${nextEnemy.name}`, tone: "sky" },
        log: [`🧭 Chose path → ${nextEnemy.emoji} ${nextEnemy.name}`, ...g.log].slice(0, 40),
      };
    });
  }

  function pickMapCard(card) {
    if (!card?.enemy) return;

    if (card.nodeType === "event") {
      setGame((g) => {
        if (g.phase !== "path") return g;
        const roll = Math.random();
        let next = { ...g };
        if (roll < 0.33) {
          next.coins = g.coins + 35;
          next.actionFlash = { id: Date.now(), text: "❓ Event: hidden cache +35🪙", tone: "amber" };
        } else if (roll < 0.66) {
          const heal = Math.min(g.player.maxHp - g.player.hp, 7);
          next.player = { ...g.player, hp: g.player.hp + heal };
          next.actionFlash = { id: Date.now(), text: `❓ Event: jungle spring +${heal}HP`, tone: "emerald" };
        } else {
          next.coins = Math.max(0, g.coins - 20);
          next.actionFlash = { id: Date.now(), text: "❓ Event: ambush -20🪙", tone: "rose" };
        }
        next.log = ["❓ Random event resolved", ...g.log].slice(0, 40);
        return next;
      });
      pickPathEnemy(card.enemy);
      return;
    }

    if (card.nodeType === "rest") {
      setGame((g) => {
        if (g.phase !== "path") return g;
        const heal = Math.max(4, Math.round(g.player.maxHp * 0.2));
        const healed = Math.min(g.player.maxHp, g.player.hp + heal);
        return {
          ...g,
          player: { ...g.player, hp: healed, shield: g.player.combatStartShield },
          actionFlash: { id: Date.now(), text: `🏕️ Rest +${healed - g.player.hp} HP`, tone: "emerald" },
        };
      });
      pickPathEnemy(card.enemy);
      return;
    }

    if (card.nodeType === "shop") {
      setGame((g) => {
        if (g.phase !== "path") return g;
        return {
          ...g,
          phase: "shop",
          pendingEnemy: card.enemy,
          shopItems: buildShopInventory(),
          pathChoices: [],
          mapChoices: [],
          actionFlash: { id: Date.now(), text: "🏪 Entering shop", tone: "amber" },
          log: [`🏪 Shop node selected`, ...g.log].slice(0, 40),
        };
      });
      return;
    }

    pickPathEnemy(card.enemy);
  }

  function buyShopItem(item) {
    setGame((g) => {
      if (g.phase !== "shop") return g;
      if (g.coins < item.cost) {
        return { ...g, actionFlash: { id: Date.now(), text: "❌ Not enough coins", tone: "rose" } };
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
        next.shopItems = buildShopInventory();
        next.actionFlash = { id: Date.now(), text: "🎲 Shop rerolled", tone: "sky" };
      } else if (item.key === "reroll-artifact") {
        next.artifactRerollTokens = (g.artifactRerollTokens || 0) + 1;
        next.actionFlash = { id: Date.now(), text: "🎁 +1 artifact reroll token", tone: "sky" };
      }

      next.log = [`🏪 Bought ${item.name} (-${item.cost}🪙)`, ...g.log].slice(0, 40);
      return next;
    });
  }

  function leaveShop() {
    setGame((g) => {
      if (g.phase !== "shop") return g;
      const nextEnemy = g.pendingEnemy || g.enemy;
      return {
        ...g,
        phase: "roll",
        enemy: { ...nextEnemy, shield: 0, charge: 0, intentIndex: 0, firstIntentUsed: false },
        pendingEnemy: null,
        shopItems: [],
        actionFlash: { id: Date.now(), text: "🚪 Leaving shop", tone: "sky" },
        log: ["🚪 Left shop", ...g.log].slice(0, 40),
      };
    });
  }

  function rerollArtifactChoices() {
    setGame((g) => {
      if (g.phase !== "reward" || (g.artifactRerollTokens || 0) <= 0) return g;
      const nextOffers = g.startRewardPending ? buildStarterArtifactChoices(g.player) : buildArtifactChoices(g.player);
      return {
        ...g,
        artifactsOffered: nextOffers,
        artifactRerollTokens: Math.max(0, (g.artifactRerollTokens || 0) - 1),
        actionFlash: { id: Date.now(), text: "🎁 Artifact rerolled", tone: "sky" },
        log: ["🎁 Artifact choices rerolled", ...g.log].slice(0, 40),
      };
    });
  }

  function restart() {
    setGame((g) => {
      const fresh = makeInitialState();
      fresh.gems = g.gems || 0;
      return fresh;
    });
  }

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
        });
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

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

  const totalArtifacts = game.player.artifacts.length;
  const avatarUrl = selectedCosmetic?.product?.type === "skin"
    ? (selectedCosmetic.product.cover || game.player.avatar || PLAYER_AVATAR_URL)
    : (game.player.characterId === "kkm" ? game.player.avatar : (PLAYER_EMOTION_URLS[game.avatarMood] || game.player.avatar || PLAYER_AVATAR_URL));
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
      const meta = getDieMeta(activeDieValue);
      if (meta.kind === "shield") return `${meta.emoji} ${activeDieValue.value} ×${mult} = ${activeDieValue.value * mult}`;
      if (meta.kind === "heal") return `${meta.emoji} ${activeDieValue.value} ×${mult} = ${(activeDieValue.value + game.player.healBonus) * mult}`;
      return `${meta.emoji} ${activeDieValue.value} ×${mult} = ${(activeDieValue.value + game.player.attackBonus + game.player.attackDieValueBonus) * mult}`;
    })()
    : null;

  const telegramUserLabel = useMemo(() => {
    const webApp = (window as any)?.Telegram?.WebApp;
    const user = webApp?.initDataUnsafe?.user;
    if (!user) return "Guest";
    if (user.username) return `@${user.username}`;
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || `ID ${user.id}`;
  }, []);

  return (
    <div className="min-h-screen overflow-y-auto bg-cover bg-center bg-no-repeat p-1.5 text-white md:p-2" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.62), rgba(0,0,0,.78)), url(${BG_URL})` }}>
      <div className="mx-auto flex min-h-screen max-w-[520px] flex-col gap-1.5 pb-24 md:max-w-6xl md:gap-2 md:pb-4">
        <div className="sticky top-1 z-30 rounded-[20px] border border-amber-300/25 bg-black/55 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md md:static md:rounded-[22px] md:p-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src={runtimeLogoUrl} alt="Kabal logo" className="h-9 w-9 object-contain" />
              <div>
                <h1 className="font-serif text-sm italic tracking-wide text-amber-300 md:text-2xl">Die in the Jungle</h1>
                <p className="text-[10px] text-zinc-100 md:text-xs">Telegram-ready roguelite · fast touch gameplay</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-2">
              <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Zone</div>
                <div className="text-xs font-black text-amber-300 md:text-sm">{game.floor}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Phase</div>
                <div className="text-xs font-black uppercase text-amber-300 md:text-sm">{game.phase}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Seed</div>
                <div className="text-xs font-black text-cyan-200 md:text-sm">#{game.runSeed}</div>
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
              <Button onClick={() => setGame((g) => ({ ...g, showHowToPlay: true }))} className="rounded-xl bg-white/10 px-2.5 py-2 text-white hover:bg-white/20">❓</Button>
              <a
                href={`/telegram-miniapp?shop=diejungle${tgUserId ? `&tgUserId=${encodeURIComponent(tgUserId)}` : ""}${walletAddress ? `&wallet=${encodeURIComponent(walletAddress)}` : ""}`}
                className="rounded-xl bg-amber-400 px-2.5 py-2 text-xs font-semibold text-black hover:bg-amber-300"
              >
                🛒 Jungle Shop
              </a>
            </div>
          </div>
          <div className="mt-2 rounded-xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-200">Owned cosmetics</p>
              <button onClick={() => refreshCosmetics()} className="rounded-lg border border-white/20 px-2 py-1 text-[10px] text-zinc-200">Refresh</button>
            </div>
            {cosmeticsLoading && <p className="mt-1 text-[11px] text-zinc-300">Loading cosmetics...</p>}
            {!cosmeticsLoading && ownedCosmetics.length === 0 && <p className="mt-1 text-[11px] text-zinc-300">No cosmetics unlocked yet. Open Jungle Shop to buy skins.</p>}
            {ownedCosmetics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ownedCosmetics.slice(0, 8).map((entry) => {
                  const selected = selectedCosmeticId === entry.productId;
                  return (
                    <button
                      key={entry.id}
                      onClick={() => equipCosmetic(entry.productId)}
                      className={`rounded-full border px-2 py-1 text-[10px] ${selected ? "border-amber-300/70 bg-amber-400/20 text-amber-100" : "border-fuchsia-300/40 bg-black/30 text-fuchsia-100"}`}
                    >
                      {selected ? "✅ " : ""}{entry.product?.name || entry.productId}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <SectionCard title="Dice + Action" className="mt-1" right={<div className="text-[9px] text-zinc-300">Primary controls (top)</div>}>
          <div className="mb-1 flex flex-wrap justify-center gap-1 text-[9px] md:text-[10px]">
            <div className="rounded-xl border border-zinc-300/30 bg-zinc-900/70 px-2 py-1">⚔️ Attack die 1-6 (black)</div>
            <div className="rounded-xl border border-pink-200/35 bg-pink-500/20 px-2 py-1">❤️ Health die 1-6</div>
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
          <div className="mb-2 flex min-h-[56px] items-center justify-center gap-2">
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

          <div className="flex flex-wrap items-center justify-center gap-2 rounded-[12px] border border-white/10 bg-black/35 p-2">
            {game.phase === "roll" ? <div className="w-full text-center text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Start turn: press roll, then place dice on board</div> : null}
            {(game.phase === "roll" || game.phase === "rolling") ? (
              <Button onClick={startRoll} disabled={game.rolling} className={`rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black hover:bg-amber-300 disabled:opacity-60 ${game.phase === "roll" && !game.rolling ? "animate-pulse shadow-[0_0_0_6px_rgba(252,211,77,0.20)]" : ""}`}>
                {game.rolling ? "🎲 Rolling..." : "🎲 ROLL"}
              </Button>
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
                <div className="text-lg font-black md:text-xl">{game.phase === "victory" ? "🏆 YOU WIN" : "💀 YOU DIED"}</div>
                <Button onClick={submitScoreToLeaderboard} className="rounded-2xl bg-violet-500/30 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-500/45">Submit score</Button>
                <Button onClick={shareRun} className="rounded-2xl bg-sky-500/35 px-4 py-2.5 text-sm font-black text-white hover:bg-sky-500/50">Share run</Button>
                <Button onClick={restart} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-zinc-200">Play again</Button>
              </>
            ) : null}
          </div>
        </SectionCard>

        <div className="grid shrink-0 gap-1.5 md:gap-2 md:grid-cols-[1.15fr_1fr_1.15fr]">
          <SectionCard title="Enemy panel" className={`${mobilePanel === "enemy" ? "" : "hidden"} md:block`}>
            <div className="rounded-[18px] border border-rose-300/30 bg-gradient-to-b from-rose-950/45 to-black/85 p-2">
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[14px] border border-rose-300/40 bg-black/35 p-2 text-center">
                <motion.img
                  src={game.enemy.image}
                  alt={game.enemy.name}
                  animate={game.enemyHitPulse ? { scale: [1, 1.12, 0.96, 1], filter: ["brightness(1)", "brightness(1.55)", "brightness(1)"] } : game.enemyAttackPulse ? { x: [0, -10, 10, -8, 8, 0], scale: [1, 1.06, 1] } : intent.type === "attack" ? { scale: [1, 1.03, 1], x: [0, -2, 2, 0] } : { scale: 1, x: 0 }}
                  transition={{ duration: 0.45 }}
                  className="h-[128px] w-full object-contain contrast-110 saturate-110 drop-shadow-[0_14px_24px_rgba(0,0,0,0.6)] md:h-[175px]"
                />
                <div className="text-xs font-black md:text-sm">{game.enemy.emoji} {game.enemy.name}{game.enemy.elite ? ` ${"⭐".repeat(game.enemy.eliteStars || 1)}` : ""}</div>
                <div className="text-[9px] text-zinc-300">{game.enemy.mood}</div>
                <div className="text-[9px] text-zinc-400">{enemyLoreLine(game.enemy)}</div>
                <div className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-zinc-200">
                  {getTierLabel(game.enemy)}
                </div>
                <LifeBar label="Enemy HP" current={game.enemy.hp} max={game.enemy.maxHp} tone="enemy" size={game.enemy.maxHp >= 55 ? "lg" : "md"} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Combat center" className={`${mobilePanel === "combat" ? "" : "hidden"} md:block`}>
            <div className="grid grid-cols-2 gap-1.5 rounded-[16px] border border-white/10 bg-black/35 p-2">
              <CompactStat label="Room" value={`${game.room + 1}/${game.route.length}`} accent="text-amber-300" />
              <CompactStat label="Score" value={`${game.score}`} accent="text-violet-300" />
              <CompactStat label="Coins" value={`${game.coins} 🪙`} accent="text-amber-200" />
              <CompactStat label="Gems" value={`${game.gems} 💎`} accent="text-cyan-200" />
              <CompactStat label="Intent" value={`${intentMeta(intent.type).emoji} ${intent.type}`} accent={intentMeta(intent.type).color} />
              <CompactStat label="Value" value={`${intent.value}`} accent="text-rose-300" />
              <CompactStat label="Modifier" value={intent.mod.badge} accent={modifierClass(game.enemy.modifier)} />
              <CompactStat label="Streak" value={`${game.winStreak}`} accent="text-emerald-300" />
              <CompactStat label="No-hit" value={`${game.noHitTurns}T · x${streakMultiplier.toFixed(1)}`} accent="text-lime-300" />
              <CompactStat label="Enemy Shield" value={`${game.enemy.shield || 0}`} accent="text-rose-200" />
              <div className="rounded-[16px] border border-white/10 bg-black/35 p-2 text-center">
                <div className="text-[9px] uppercase tracking-[0.16em] text-zinc-300">Outcome</div>
                <div className="mt-1 text-xs font-black text-cyan-100">{game.lastOutcome || "—"}</div>
              </div>
              <div className="col-span-2 rounded-[12px] border border-white/10 bg-black/40 p-2">
                <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-zinc-300">Intent timeline</div>
                <div className="space-y-1 text-[11px]">
                  {intentTimeline.map((entry, idx) => (
                    <div key={`${entry.type}-${idx}-${entry.value}`} className={`rounded-lg border border-white/10 px-2 py-1 ${idx === 0 ? "bg-white/10" : "bg-black/35"}`}>
                      <span className={intentMeta(entry.type).color}>{intentMeta(entry.type).emoji} {entry.label}</span>
                      <span className="ml-1 text-zinc-200">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Player panel" className={`${mobilePanel === "player" ? "" : "hidden"} md:block`}>
            <div className="rounded-[18px] border border-cyan-300/30 bg-gradient-to-b from-cyan-950/40 to-black/85 p-2">
              <div className="grid grid-cols-2 gap-1.5 rounded-[14px] border border-cyan-300/30 bg-black/35 p-2">
                <div className="col-span-2 flex flex-col items-center gap-2 rounded-[16px] border border-white/10 bg-black/35 p-2 text-center">
                <motion.img
                  src={avatarUrl}
                  alt="Kabalian"
                  animate={game.avatarMood === "hurt" ? { x: [0, -2, 2, -2, 0] } : game.avatarMood === "victory" ? { y: [0, -3, 0] } : { x: 0, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className={`h-[128px] w-full rounded-2xl border border-white/10 bg-black/40 object-contain md:h-[175px] ${avatarRing}`} style={{ transform: "scaleX(-1)" }}
                />
                <div className="min-w-0">
                  <div className="font-black">{game.player.characterId === "kkm" ? "KKM" : "Kabalian"}</div>
                  <div className="text-[10px] text-zinc-300">CD {game.player.cooldownBase} · Tick {game.player.cooldownTick} · Artifacts {totalArtifacts}</div>
                  {selectedCosmetic && <div className="text-[10px] text-fuchsia-200">Equipped: {selectedCosmetic.product?.name || selectedCosmetic.productId}</div>}
                </div>
                <img src={runtimeLogoUrl} alt="Kabal logo" className="h-7 w-7 object-contain opacity-90" />
              </div>
                <div className="col-span-2">
                  <LifeBar label="Player HP" current={game.player.hp} max={game.player.maxHp} tone="player" />
                </div>
                <CompactStat label="🛡️ Shield" value={`${game.player.shield}`} accent="text-cyan-200" />
                <CompactStat label="Reroll" value={`${game.player.rerollsLeft}`} accent="text-amber-300" />
                {game.player.companionId ? (() => {
                  const comp = COMPANIONS.find((c) => c.id === game.player.companionId);
                  if (!comp) return null;
                  const ready = game.player.companionCooldown === 0;
                  return (
                    <div className="col-span-2 rounded-[12px] border border-emerald-400/25 bg-emerald-900/15 p-2">
                      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Companion</div>
                      <div className="flex items-center gap-2">
                        <img src={comp.image} alt={comp.name} className="h-10 w-10 rounded-xl object-contain" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-black text-zinc-100">{comp.emoji} {comp.name}</div>
                          <div className="text-[9px] text-zinc-400">{comp.passiveDesc}</div>
                          <div className={`mt-0.5 text-[9px] font-black ${ready ? "text-emerald-300" : "text-zinc-500"}`}>{comp.abilityEmoji} {comp.abilityName} · {ready ? "READY" : `CD ${game.player.companionCooldown}`}</div>
                        </div>
                      </div>
                    </div>
                  );
                })() : null}
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Board" className="order-3 md:order-none" right={<div className="text-[9px] text-zinc-300">Place dice on available slots</div>}>
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


        <SectionCard title="Combat log" className="order-4 hidden md:block md:order-none" right={<button onClick={() => setGame((g) => ({ ...g, showAllLogs: !g.showAllLogs }))} className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20">{game.showAllLogs ? "▲" : "▼"}</button>}>
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
          <AnimatePresence>
            {game.showAllLogs ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="max-h-40 space-y-1 overflow-auto pt-1.5 md:max-h-28">
                  {game.log.slice(3).map((line, i) => (
                    <div key={`${line}-${i}`} className="rounded-[12px] border border-white/10 bg-black/35 px-2.5 py-1.5 text-[10px] text-zinc-100">{line}</div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SectionCard>

        <SectionCard title="Leaderboard" className="hidden md:block">
          <div className="space-y-1">
            {leaderboard.length ? leaderboard.slice(0, 5).map((entry, index) => (
              <div key={entry.id} className="flex items-center justify-between rounded-[12px] border border-white/10 bg-black/35 px-2.5 py-1.5 text-[11px]">
                <span>#{index + 1} · {entry.wallet === "guest" ? "guest" : `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}`}</span>
                <span>🏆 {entry.score} · Zone {entry.zone}</span>
              </div>
            )) : <div className="text-[11px] text-zinc-300">No score yet. Finish a run and submit.</div>}
          </div>
        </SectionCard>

        <div className="md:hidden space-y-1">
          <details className="rounded-[14px] border border-white/15 bg-black/40 p-2">
            <summary className="cursor-pointer text-xs font-black text-zinc-100">Combat log</summary>
            <div className="mt-2 space-y-1">
              {latestLogs.slice(0, 5).map((line, i) => (
                <div key={`m-${line}-${i}`} className="rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[11px]">{line}</div>
              ))}
            </div>
          </details>
          <details className="rounded-[14px] border border-white/15 bg-black/40 p-2">
            <summary className="cursor-pointer text-xs font-black text-zinc-100">Leaderboard</summary>
            <div className="mt-2 space-y-1">
              {leaderboard.length ? leaderboard.slice(0, 3).map((entry, index) => (
                <div key={`m-lb-${entry.id}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/35 px-2 py-1 text-[11px]">
                  <span>#{index + 1} · {entry.wallet === "guest" ? "guest" : `${entry.wallet.slice(0, 4)}...${entry.wallet.slice(-4)}`}</span>
                  <span>🏆 {entry.score}</span>
                </div>
              )) : <div className="text-[11px] text-zinc-300">No score yet.</div>}
            </div>
          </details>
        </div>


        <AnimatePresence>
          {game.damagePopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 12, scale: 0.8 }}
              animate={{ opacity: 1, y: -12, scale: 1.15 }}
              exit={{ opacity: 0, y: -24, scale: 0.9 }}
              style={{ left: popup.left, top: popup.top }}
              className={`pointer-events-none fixed z-50 rounded-xl border px-4 py-2 text-3xl font-black shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
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

        <AnimatePresence>
          {(game.phase === "gameover" || game.phase === "victory") ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
              <div className="w-full max-w-xl rounded-[28px] border border-amber-300/25 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-3 text-center font-serif text-2xl italic text-amber-300">{game.phase === "victory" ? "RUN SUMMARY · KABAL BLESSING" : "RUN SUMMARY · LIQUIDATED"}</div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">Character: <span className="font-black">{game.player.characterId === "kkm" ? "KKM" : "Kabalian"}</span></div>
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">Zone: <span className="font-black">{game.floor}</span></div>
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">Score: <span className="font-black">{game.score}</span></div>
                  <div className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">No-hit: <span className="font-black">{game.noHitTurns}T</span></div>
                  <div className="col-span-2 rounded-xl border border-white/10 bg-black/35 px-3 py-2">Seed: <span className="font-black text-cyan-200">#{game.runSeed}</span></div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Button onClick={submitScoreToLeaderboard} className="rounded-xl bg-violet-500/30 px-4 py-2 text-white hover:bg-violet-500/45">Submit score</Button>
                  <Button onClick={shareRun} className="rounded-xl bg-sky-500/35 px-4 py-2 text-white hover:bg-sky-500/50">Share run</Button>
                  <Button onClick={restart} className="rounded-xl bg-white px-4 py-2 text-black hover:bg-zinc-200">Play again</Button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.phase === "path" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-3xl rounded-[28px] border border-sky-300/30 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-serif text-xl italic text-sky-200 md:text-2xl">Choose your map card</div>
                    <div className="text-sm text-zinc-300">Cartes aléatoires: choisis ta direction et ton prochain combat.</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs text-zinc-300">Zone {game.floor} · Room {game.room + 1}</div>
                </div>
                <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs text-zinc-300">
                  <div className="rounded-xl border border-white/10 bg-black/35 px-2 py-1">✅ Current room cleared</div>
                  <div className="text-center text-sky-200">⬇️ move</div>
                  <div className="rounded-xl border border-sky-300/25 bg-sky-500/15 px-2 py-1 text-sky-100">Map node preview</div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(game.mapChoices?.length ? game.mapChoices : game.pathChoices.map((enemy, i) => ({ id: `legacy-${i}`, lane: i === 0 ? "left" : "right", rewardHint: "🎁", enemy }))).map((card) => {
                    const pathEnemy = card.enemy;
                    return (
                    <button key={`${card.id}-${pathEnemy.name}-${pathEnemy.modifier}-${pathEnemy.hp}`} onClick={() => pickMapCard(card)} className="rounded-2xl border border-sky-300/30 bg-sky-950/20 p-3 text-left transition hover:-translate-y-0.5 hover:bg-sky-900/25">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-sky-200">{card.lane} path · {card.nodeType}</div>
                          <div className="text-sm font-black text-zinc-100">{pathEnemy.emoji} {pathEnemy.name}</div>
                        </div>
                        <div className="rounded-lg border border-white/15 bg-black/35 px-2 py-1 text-[10px] text-zinc-200">{getTierLabel(pathEnemy)}</div>
                      </div>
                      <img src={pathEnemy.image} alt={pathEnemy.name} className="mb-2 h-24 w-full rounded-xl border border-white/10 bg-black/30 object-contain" />
                      <div className="grid grid-cols-3 gap-1 text-[11px]">
                        <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-1">❤️ HP {pathEnemy.hp}</div>
                        <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-1">⚔️ DMG {pathEnemy.damage}</div>
                        <div className="rounded-lg border border-white/10 bg-black/35 px-2 py-1">☠️ {pathEnemy.modifier || "none"}</div>
                      </div>
                      <div className="mt-2 text-xs text-sky-100">{card.rewardHint} · Tap to move here</div>
                    </button>
                  )})}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {game.phase === "shop" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-4xl rounded-[28px] border border-amber-300/25 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={SHOPKEEPER_URL} alt="Shopkeeper" className="h-14 w-14 rounded-2xl border border-amber-300/35 bg-black/35 object-cover" />
                    <div>
                      <div className="font-serif text-xl italic text-amber-300 md:text-2xl">Jungle Shop</div>
                      <div className="text-sm text-zinc-300">Dépense tes coins pour renforcer ton run. Les armes du shop sont aléatoires selon leur rareté.</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="rounded-xl border border-amber-300/25 bg-amber-500/20 px-3 py-2 text-amber-100">🪙 {game.coins}</div>
                    <div className="rounded-xl border border-cyan-300/25 bg-cyan-500/20 px-3 py-2 text-cyan-100">💎 {game.gems}</div>
                    <button onClick={leaveShop} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 font-bold text-white hover:bg-white/20">Leave shop</button>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(game.shopItems || []).map((item) => (
                    <div key={item.id} className={`rounded-2xl border p-3 ${shopRarityClasses(item.rarity)}`}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.icon || "🛒"}</span>
                          <div className="text-sm font-black text-zinc-100">{item.name}</div>
                        </div>
                        <div className="rounded-lg border border-amber-300/30 bg-amber-500/20 px-2 py-1 text-xs text-amber-100">{item.cost} 🪙</div>
                      </div>
                      <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-zinc-300">{item.rarity}</div>
                      <div className="mb-3 text-xs text-zinc-300">{item.desc}</div>
                      <button onClick={() => buyShopItem(item)} disabled={game.coins < item.cost} className="rounded-xl border border-white/20 bg-zinc-800 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-700 disabled:opacity-40">{game.coins < item.cost ? "Not enough coins" : "Buy"}</button>
                    </div>
                  ))}
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
                    <img src={runtimeLogoUrl} alt="Kabal logo" className="h-10 w-10 object-contain" />
                    <div>
                      <div className="font-serif text-xl italic text-amber-300 md:text-2xl">Choose 1 Artifact</div>
                      <div className="text-sm text-zinc-300">{game.startRewardPending ? "First reward after your opening win." : "Boss down. Build your run."}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={rerollArtifactChoices} disabled={(game.artifactRerollTokens || 0) <= 0} className="rounded-xl border border-sky-300/30 bg-sky-500/20 px-3 py-2 text-xs font-bold text-sky-100 disabled:opacity-40">🎁 Reroll ({game.artifactRerollTokens || 0})</button>
                    <button onClick={skipArtifactReward} className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-zinc-100 hover:bg-white/20">Skip reward</button>
                    <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">Zone {game.floor}</div>
                  </div>
                </div>
                <div className="mb-4 rounded-2xl border border-cyan-300/25 bg-cyan-950/25 p-3">
                  <div className="mb-2 text-sm font-black tracking-[0.05em] text-cyan-200 md:text-base">{storyFragment.title}</div>
                  <div className="space-y-3">
                    <img src={runtimeStoryImageUrl} alt="Chronicle fragment" className="h-[260px] w-full rounded-xl border border-white/10 bg-black/35 object-cover md:h-[420px]" />
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
              <div className="w-full max-w-xl rounded-[28px] border border-amber-300/20 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={runtimeLogoUrl} alt="Kabal logo" className="h-10 w-10 object-contain" />
                    <div>
                      <div className="font-serif text-xl italic text-amber-300 md:text-2xl">How to play</div>
                      <div className="text-sm text-zinc-300">Updated prototype rules</div>
                    </div>
                  </div>
                  <Button onClick={() => setGame((g) => ({ ...g, showHowToPlay: false }))} className="rounded-xl bg-white/10 px-4 py-2 text-white hover:bg-white/20">✕</Button>
                </div>
                <div className="space-y-2 text-sm text-white md:text-base">
                  <div>1️⃣ Click <span className="font-black text-amber-300">ROLL</span></div>
                  <div>2️⃣ You can use <span className="font-black text-amber-300">1 reroll</span> per turn unless cursed</div>
                  <div>3️⃣ Tap a die, then place it on a free slot</div>
                  <div>4️⃣ 🔥 Top row = x3 · ✨ Mid row = x2 · 🪨 Bottom row = x1</div>
                  <div>5️⃣ Used slots gain cooldown</div>
                  <div>6️⃣ If the board saturates, all cooldowns reset</div>
                  <div>7️⃣ Enemies have visible intents and combat modifiers</div>
                  <div>8️⃣ Beat elites and bosses, pick artifacts, continue to higher zones</div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
