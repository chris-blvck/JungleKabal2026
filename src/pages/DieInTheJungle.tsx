import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const BG_URL = "https://i.postimg.cc/YSmfqq2c/Background-desktop.png";
const LOGO_URL = "https://i.postimg.cc/rwdjP9rb/logo-jaune.png";
const PLAYER_AVATAR_URL = "https://i.postimg.cc/B6rBLmBt/Kabalian-Face.png";
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
    1: "https://i.postimg.cc/9MQCpGHw/Chat-GPT-Image-Mar-12-2026-09-40-50-PM.png",
    2: "https://i.postimg.cc/9MQCpGHw/Chat-GPT-Image-Mar-12-2026-09-40-50-PM.png",
    3: "https://i.postimg.cc/9MQCpGHw/Chat-GPT-Image-Mar-12-2026-09-40-50-PM.png",
    4: "https://i.postimg.cc/9MQCpGHw/Chat-GPT-Image-Mar-12-2026-09-40-50-PM.png",
    5: "https://i.postimg.cc/9MQCpGHw/Chat-GPT-Image-Mar-12-2026-09-40-50-PM.png",
    6: "https://i.postimg.cc/9MQCpGHw/Chat-GPT-Image-Mar-12-2026-09-40-50-PM.png",
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
    4: "https://i.postimg.cc/L57x7Mq3/Dice-Shield-4.png",
    5: "https://i.postimg.cc/mkqmqGcp/Dice-Shield-5.png",
    6: "https://i.postimg.cc/90SLSj4K/Dice-Shield-6.png",
  },
};

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

function pickUnique(items, count) {
  return shuffle(items).slice(0, count);
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
      base.hp = Math.round(base.hp * 1.25);
      base.maxHp = base.hp;
      base.damage += 2;
      base.tier = "medium";
      base.name = `Elite ${base.name}`;
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
  return { kind: "attack", label: "Dice", emoji: "🎲", desc: `Deal ${die.value} damage before row multiplier.` };
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

function applyArtifactToPlayer(player, artifact) {
  const nextBase = artifact.apply(player);
  return {
    ...nextBase,
    artifacts: [...player.artifacts, artifact],
  };
}

function makeInitialPlayer() {
  return {
    hp: 28,
    maxHp: 28,
    shield: 0,
    avatar: PLAYER_AVATAR_URL,
    cooldownBase: 3,
    cooldownTick: 1,
    dicePerTurn: 3,
    rerollsPerTurn: 1,
    rerollsLeft: 1,
    attackBonus: 0,
    attackDieValueBonus: 0,
    healBonus: 0,
    shieldMultiplier: 1,
    topRowBonus: 0,
    timedResetEvery: 0,
    combatStartShield: 0,
    selfBleed: 0,
    curseNextTurn: 0,
    artifacts: [],
    reviveOnce: false,
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
    artifactsOffered: buildStarterArtifactChoices(player),
    combatRewardPending: true,
    startRewardPending: true,
    score: 0,
    runEnded: false,
    avatarMood: "focus",
    actionFlash: null,
    enemyAttackPulse: 0,
    damagePopups: [],
  };
}

function SectionCard({ title, children, right }) {
  return (
    <div className="rounded-[20px] border border-white/15 bg-black/45 p-2 shadow-[0_14px_30px_rgba(0,0,0,0.28)] backdrop-blur-md md:p-2.5">
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

function LifeBar({ label, current, max, tone }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const fill = tone === "enemy" ? "from-red-500 via-orange-400 to-yellow-300" : "from-emerald-500 via-lime-400 to-cyan-300";
  return (
    <div className="rounded-[16px] border border-white/10 bg-black/35 p-2">
      <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-zinc-300">
        <span>{label}</span>
        <span>{Math.max(0, current)}/{max}</span>
      </div>
      <div className="h-3.5 overflow-hidden rounded-full border border-white/10 bg-zinc-900 shadow-inner">
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
      {enemy.elite && state !== "hidden" ? <div className="absolute left-1 top-1 text-[9px] text-red-300">ELITE</div> : null}
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

export default function DieInTheJungleUpgraded() {
  const [game, setGame] = useState(makeInitialState);

  const activeDieIndex = useMemo(() => {
    if (game.selectedDieIndex !== null && game.dice[game.selectedDieIndex] !== null) return game.selectedDieIndex;
    return nextAvailableDieIndex(game.dice);
  }, [game.dice, game.selectedDieIndex]);

  const activeDieValue = activeDieIndex !== null ? game.dice[activeDieIndex] : null;
  const activeDieMeta = activeDieValue !== null ? getDieMeta(activeDieValue) : null;
  const latestLogs = game.log.slice(0, 3);
  const intent = getIntentPreview(game.enemy);

  function shiftSelectedDie(direction) {
    if (game.phase !== "place") return;
    setGame((g) => ({
      ...g,
      selectedDieIndex: cycleDieIndex(g.dice, activeDieIndex, direction),
    }));
  }

  function pushLog(lines) {
    setGame((g) => ({ ...g, log: [...lines, ...g.log].slice(0, 40) }));
  }

  function startRoll() {
    if (game.rolling || game.phase !== "roll" || game.combatRewardPending) return;

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
    if (game.phase !== "place") return;
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
      let enemyAttackPulse = 0;

      if (totals.attack > 0) {
        damagePopups.push({ id: `${Date.now()}-enemy-hit`, target: "enemy", tone: "damage", text: `-${totals.attack}` });
      }
      if (totals.heal > 0) {
        damagePopups.push({ id: `${Date.now()}-player-heal`, target: "player", tone: "heal", text: `+${totals.heal}` });
      }
      if (totals.shield > 0) {
        damagePopups.push({ id: `${Date.now()}-player-shield`, target: "player", tone: "shield", text: `🛡️ +${totals.shield}` });
      }

      if (!enemyDied) {
        const intentNow = getIntentPreview(enemy);
        const retaliation = resolveEnemyIntent(enemy, player, log);
        enemy = retaliation.enemy;
        player = retaliation.player;
        if (intentNow.type === "attack") {
          enemyAttackPulse = Date.now();
          const hpLoss = Math.max(0, preRetaliationHp - player.hp);
          const shieldBlocked = Math.max(0, preRetaliationShield - player.shield - hpLoss);
          if (hpLoss > 0) {
            damagePopups.push({ id: `${Date.now()}-player-hit`, target: "player", tone: "damage", text: `-${hpLoss}` });
          }
          if (shieldBlocked > 0) {
            damagePopups.push({ id: `${Date.now()}-player-block`, target: "player", tone: "shield", text: `🛡️ ${shieldBlocked}` });
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

      let score = g.score + (enemyDied ? 100 : 10);
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

      if (totals.attack > 0) {
        actionFlash = { id: Date.now(), text: `⚔️ ${totals.attack} DMG`, tone: "rose" };
      } else if (totals.shield > 0) {
        actionFlash = { id: Date.now(), text: `🛡️ +${totals.shield} Shield`, tone: "cyan" };
      } else if (totals.heal > 0) {
        actionFlash = { id: Date.now(), text: `❤️ +${totals.heal} Heal`, tone: "emerald" };
      }

      if (!enemyDied && playerTookDamage) {
        actionFlash = { id: Date.now() + 1, text: `💥 -${g.player.hp - player.hp} HP`, tone: "rose" };
        avatarMood = "shocked";
      }

      if (enemyDied) {
        killPopup = `💀 ${pickKillWord(winStreak)} 💀`;
        log.unshift(`☠️ ${g.enemy.name} defeated · ${killPopup}`);
        if (g.enemy.tier === "boss") score += 500;
        if (g.enemy.elite) score += 150;

        if (g.enemy.tier === "boss") {
          combatRewardPending = true;
          artifactsOffered = buildArtifactChoices(player);
          phase = "reward";
        } else if (g.room >= g.route.length - 1) {
          phase = "victory";
        } else {
          room = g.room + 1;
          const nextEnemy = { ...g.route[room] };
          nextEnemy.shield = 0;
          nextEnemy.charge = 0;
          player.shield = player.combatStartShield;
          log.unshift(`✅ Next enemy: ${nextEnemy.emoji} ${nextEnemy.name}`);
          enemy = nextEnemy;
          avatarMood = "focus";
        }
      }

      return {
        ...g,
        score,
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
        startRewardPending: false,
        killPopup,
        log: [...log, ...g.log].slice(0, 40),
        runEnded: phase === "gameover" || phase === "victory",
        avatarMood,
        actionFlash,
        enemyAttackPulse,
        damagePopups,
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
        return {
          ...g,
          player: { ...player, shield: player.combatStartShield },
          phase: "roll",
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          actionFlash: { id: Date.now(), text: `🏆 Start relic: ${artifact.name}`, tone: "amber" },
          log: [`🏆 Starting artifact: ${artifact.name}`, ...g.log].slice(0, 40),
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
          player: nextPlayer,
          phase: "roll",
          artifactsOffered: [],
          combatRewardPending: false,
          startRewardPending: false,
          cooldowns: emptyCooldowns(),
          grid: emptyGrid(),
          dice: [],
          selectedDieIndex: null,
          avatarMood: "victory",
          actionFlash: { id: Date.now(), text: `🏆 ${artifact.name}`, tone: "amber" },
          log: [`🏆 Chose ${artifact.name}`, `🌴 Zone ${nextFloor} begins`, ...g.log].slice(0, 40),
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
        artifactsOffered: [],
        combatRewardPending: false,
        startRewardPending: false,
        log: [`🏆 Chose ${artifact.name}`, `✅ Next enemy: ${nextEnemy.emoji} ${nextEnemy.name}`, ...g.log].slice(0, 40),
      };
    });
  }

  function restart() {
    setGame(makeInitialState());
  }

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
    if (!game.enemyAttackPulse) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => (g.enemyAttackPulse ? { ...g, enemyAttackPulse: 0 } : g));
    }, 420);
    return () => window.clearTimeout(timeout);
  }, [game.enemyAttackPulse]);

  useEffect(() => {
    if (!game.damagePopups.length) return;
    const timeout = window.setTimeout(() => {
      setGame((g) => ({ ...g, damagePopups: [] }));
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [game.damagePopups]);

  const totalArtifacts = game.player.artifacts.length;
  const avatarUrl = PLAYER_EMOTION_URLS[game.avatarMood] || PLAYER_AVATAR_URL;
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

  return (
    <div className="h-screen overflow-hidden bg-cover bg-center bg-no-repeat p-2 text-white" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.62), rgba(0,0,0,.78)), url(${BG_URL})` }}>
      <div className="mx-auto flex h-full max-w-6xl flex-col gap-2">
        <div className="rounded-[22px] border border-amber-300/20 bg-black/35 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src={LOGO_URL} alt="Kabal logo" className="h-9 w-9 object-contain" />
              <div>
                <h1 className="font-serif text-lg italic tracking-wide text-amber-300 md:text-2xl">Die in the Jungle</h1>
                <p className="text-[10px] text-zinc-100 md:text-xs">Roguelite run · intents · reroll · artifacts · endless zones</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Zone</div>
                <div className="text-xs font-black text-amber-300 md:text-sm">{game.floor}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-right">
                <div className="text-[8px] uppercase tracking-[0.2em] text-zinc-300">Phase</div>
                <div className="text-xs font-black uppercase text-amber-300 md:text-sm">{game.phase}</div>
              </div>
              <Button onClick={() => setGame((g) => ({ ...g, showHowToPlay: true }))} className="rounded-xl bg-white/10 px-2.5 py-2 text-white hover:bg-white/20">❓</Button>
            </div>
          </div>
        </div>

        <div className="grid shrink-0 gap-2 md:grid-cols-[1.15fr_1fr_1.15fr]">
          <SectionCard title="Enemy panel">
            <div className="rounded-[18px] border border-rose-300/30 bg-gradient-to-b from-rose-950/45 to-black/85 p-2">
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[14px] border border-rose-300/40 bg-black/35 p-2 text-center">
                <motion.img
                  src={game.enemy.image}
                  alt={game.enemy.name}
                  animate={game.enemyAttackPulse ? { x: [0, -10, 10, -8, 8, 0], scale: [1, 1.06, 1] } : intent.type === "attack" ? { scale: [1, 1.03, 1], x: [0, -2, 2, 0] } : { scale: 1, x: 0 }}
                  transition={{ duration: 0.45 }}
                  className="h-[175px] w-full object-contain contrast-110 saturate-110 drop-shadow-[0_14px_24px_rgba(0,0,0,0.6)]"
                />
                <div className="text-xs font-black md:text-sm">{game.enemy.emoji} {game.enemy.name}</div>
                <div className="text-[9px] text-zinc-300">{game.enemy.mood}</div>
                <div className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] uppercase tracking-[0.18em] text-zinc-200">
                  {game.enemy.elite ? "Elite" : game.enemy.tier}
                </div>
                <LifeBar label="Enemy HP" current={game.enemy.hp} max={game.enemy.maxHp} tone="enemy" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Combat center">
            <div className="grid grid-cols-2 gap-1.5 rounded-[16px] border border-white/10 bg-black/35 p-2">
              <CompactStat label="Room" value={`${game.room + 1}/${game.route.length}`} accent="text-amber-300" />
              <CompactStat label="Score" value={`${game.score}`} accent="text-violet-300" />
              <CompactStat label="Intent" value={`${intent.type}`} accent="text-white" />
              <CompactStat label="Value" value={`${intent.value}`} accent="text-rose-300" />
              <CompactStat label="Modifier" value={intent.mod.badge} accent="text-cyan-200" />
              <CompactStat label="Streak" value={`${game.winStreak}`} accent="text-emerald-300" />
              <CompactStat label="Enemy Shield" value={`${game.enemy.shield || 0}`} accent="text-rose-200" />
              <CompactStat label="Player Shield" value={`${game.player.shield}`} accent="text-cyan-200" />
            </div>
          </SectionCard>

          <SectionCard title="Kabalian panel">
            <div className="rounded-[18px] border border-cyan-300/30 bg-gradient-to-b from-cyan-950/40 to-black/85 p-2">
              <div className="grid grid-cols-2 gap-1.5 rounded-[14px] border border-cyan-300/30 bg-black/35 p-2">
                <div className="col-span-2 flex flex-col items-center gap-2 rounded-[16px] border border-white/10 bg-black/35 p-2 text-center">
                <motion.img
                  src={avatarUrl}
                  alt="Kabalian"
                  animate={game.avatarMood === "hurt" ? { x: [0, -2, 2, -2, 0] } : game.avatarMood === "victory" ? { y: [0, -3, 0] } : { x: 0, y: 0 }}
                  transition={{ duration: 0.45 }}
                  className={`h-[175px] w-full rounded-2xl border border-white/10 bg-black/40 object-contain ${avatarRing}`}
                />
                <div className="min-w-0">
                  <div className="font-black">Kabalian</div>
                  <div className="text-[10px] text-zinc-300">Mood {game.avatarMood} · CD {game.player.cooldownBase} · Tick {game.player.cooldownTick} · Artifacts {totalArtifacts}</div>
                </div>
                <img src={LOGO_URL} alt="Kabal logo" className="h-7 w-7 object-contain opacity-90" />
              </div>
                <div className="col-span-2">
                  <LifeBar label="Player HP" current={game.player.hp} max={game.player.maxHp} tone="player" />
                </div>
                <CompactStat label="Shield" value={`${game.player.shield}`} accent="text-cyan-200" />
                <CompactStat label="Reroll" value={`${game.player.rerollsLeft}`} accent="text-amber-300" />
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

        <SectionCard title="Dice + Action" right={<div className="text-[9px] text-zinc-300">Tap die, then slot</div>}>
          <div className="mb-1 flex flex-wrap justify-center gap-1 text-[9px] md:text-[10px]">
            <div className="rounded-xl border border-zinc-300/30 bg-zinc-900/70 px-2 py-1">🎲 Dice 1-6 (black)</div>
            <div className="rounded-xl border border-pink-200/35 bg-pink-500/20 px-2 py-1">❤️ Dé Health 1-6</div>
            <div className="rounded-xl border border-white/50 bg-white/15 px-2 py-1">🛡️ Dé Shield 1-6</div>
            <div className="rounded-xl border border-white/10 bg-black/35 px-2 py-1">🔥 Combo = 3 attack dice</div>
          </div>
          <div className="flex min-h-[56px] items-center justify-center gap-2">
            {game.phase === "place" ? (
              <Button onClick={() => shiftSelectedDie(-1)} className="h-9 rounded-xl bg-white/10 px-3 text-white hover:bg-white/20">⬅️</Button>
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
              <Button onClick={() => shiftSelectedDie(1)} className="h-9 rounded-xl bg-white/10 px-3 text-white hover:bg-white/20">➡️</Button>
            ) : null}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
            {(game.phase === "roll" || game.phase === "rolling") ? (
              <Button onClick={startRoll} disabled={game.rolling} className="rounded-2xl bg-amber-400 px-4 py-2.5 text-sm font-black text-black hover:bg-amber-300 disabled:opacity-60">
                {game.rolling ? "🎲 Rolling..." : "🎲 ROLL"}
              </Button>
            ) : null}
            {game.phase === "place" ? (
              <Button onClick={rerollActiveDie} disabled={game.player.rerollsLeft <= 0 || activeDieIndex === null} className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-black text-white hover:bg-white/20 disabled:opacity-40">
                🔁 REROLL
              </Button>
            ) : null}
            {(game.phase === "gameover" || game.phase === "victory") ? (
              <>
                <div className="text-lg font-black md:text-xl">{game.phase === "victory" ? "🏆 YOU WIN" : "💀 YOU DIED"}</div>
                <Button onClick={restart} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-black hover:bg-zinc-200">Restart</Button>
              </>
            ) : null}
          </div>
        </SectionCard>





        <SectionCard title="Board" right={<div className="text-[9px] text-zinc-300">Place dice on available slots</div>}>
          {activeDieMeta && game.phase === "place" ? (
            <div className="mb-2 flex items-center gap-2 rounded-[12px] border border-amber-300/20 bg-amber-300/10 px-2 py-1.5 text-[11px] text-white">
              <span className="text-lg">{activeDieMeta.emoji}</span>
              <div>
                <div className="text-[12px] font-black text-amber-300">Next die: {activeDieMeta.label}</div>
                <div className="text-[10px] text-zinc-100">{activeDieMeta.desc}</div>
              </div>
            </div>
          ) : null}

          <div className="grid justify-center gap-1" style={{ gridTemplateColumns: "40px repeat(3, 84px)" }}>
            {ROW_INFO.map((row, y) => (
              <React.Fragment key={row.name}>
                <div className="h-[84px] rounded-[10px] border border-white/15 bg-black flex flex-col items-center justify-center text-[10px] font-black text-white">
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
                      className={`relative h-[84px] w-[84px] overflow-hidden rounded-[10px] border text-white transition ${canPlace ? "border-amber-300/60 ring-2 ring-amber-300/20" : "border-white/20"}`}
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


        <SectionCard title="Combat log" right={<button onClick={() => setGame((g) => ({ ...g, showAllLogs: !g.showAllLogs }))} className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20">{game.showAllLogs ? "▲" : "▼"}</button>}>
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
                <div className="max-h-28 space-y-1 overflow-auto pt-1.5">
                  {game.log.slice(3).map((line, i) => (
                    <div key={`${line}-${i}`} className="rounded-[12px] border border-white/10 bg-black/35 px-2.5 py-1.5 text-[10px] text-zinc-100">{line}</div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </SectionCard>


        <AnimatePresence>
          {game.damagePopups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 0, y: 12, scale: 0.8 }}
              animate={{ opacity: 1, y: -8, scale: 1.1 }}
              exit={{ opacity: 0, y: -24, scale: 0.9 }}
              className={`pointer-events-none fixed z-50 rounded-xl border px-4 py-2 text-2xl font-black shadow-[0_20px_60px_rgba(0,0,0,0.5)] ${
                popup.tone === "damage"
                  ? "border-rose-300/60 bg-rose-600/35 text-rose-100"
                  : popup.tone === "heal"
                    ? "border-emerald-300/60 bg-emerald-600/30 text-emerald-100"
                    : "border-cyan-300/60 bg-cyan-600/30 text-cyan-100"
              } ${popup.target === "enemy" ? "left-[20%] top-[30%]" : "right-[20%] top-[30%]"}`}
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
          {game.phase === "reward" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
              <div className="w-full max-w-4xl rounded-[28px] border border-amber-300/20 bg-zinc-950/95 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img src={LOGO_URL} alt="Kabal logo" className="h-10 w-10 object-contain" />
                    <div>
                      <div className="font-serif text-xl italic text-amber-300 md:text-2xl">Choose 1 Artifact</div>
                      <div className="text-sm text-zinc-300">{game.startRewardPending ? "Start your run with one trinket." : "Boss down. Build your run."}</div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-zinc-300">Zone {game.floor}</div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {game.artifactsOffered.map((artifact) => (
                    <ArtifactCard key={artifact.id} artifact={artifact} onPick={pickArtifact} />
                  ))}
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
                    <img src={LOGO_URL} alt="Kabal logo" className="h-10 w-10 object-contain" />
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
