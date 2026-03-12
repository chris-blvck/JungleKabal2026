import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const BG_URL = "https://i.postimg.cc/YSmfqq2c/Background-desktop.png";
const LOGO_URL = "https://i.postimg.cc/rwdjP9rb/logo-jaune.png";

const ENEMIES = [
  { name: "Jungle Rat", hp: 14, damage: 4, emoji: "🐀", mood: "Sneaky bite" },
  { name: "Temple Snake", hp: 18, damage: 5, emoji: "🐍", mood: "Fast strike" },
  { name: "Amber Guardian", hp: 24, damage: 6, emoji: "🗿", mood: "Heavy smash" },
  { name: "Jungle Idol", hp: 32, damage: 8, emoji: "👁️", mood: "Boss beam" },
];

function rollDice() {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1);
}

function emptyGrid() {
  return [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
}

function makeInitialState() {
  return {
    room: 0,
    phase: "roll",
    dice: [],
    grid: emptyGrid(),
    player: {
      hp: 24,
      maxHp: 24,
      shield: 0,
      emoji: "🐸",
    },
    enemy: { ...ENEMIES[0] },
    log: ["Click ROLL to start."],
  };
}

function resolveGrid(state) {
  let player = { ...state.player };
  let enemy = { ...state.enemy };

  let attack = 0;
  let shield = 0;
  let heal = 0;

  state.grid.flat().forEach((die) => {
    if (!die) return;
    if (die <= 2) shield += die;
    else if (die <= 4) heal += 1;
    else attack += die;
  });

  player.shield += shield;
  player.hp = Math.min(player.maxHp, player.hp + heal);
  enemy.hp -= attack;

  const log = [`⚔️ Attack ${attack}`, `🛡️ Shield +${shield}`, `❤️ Heal +${heal}`];

  if (enemy.hp > 0) {
    const blocked = Math.min(player.shield, enemy.damage);
    player.shield -= blocked;
    const dmg = enemy.damage - blocked;
    player.hp -= dmg;
    log.unshift(`${enemy.emoji} ${enemy.name} hits for ${enemy.damage}`);
  }

  return { player, enemy, log };
}

function getDieMeta(value) {
  if (value <= 2) return { label: "Shield", emoji: "🛡️", colors: "from-cyan-300 to-sky-500" };
  if (value <= 4) return { label: "Heal", emoji: "❤️", colors: "from-emerald-300 to-lime-500" };
  return { label: "Attack", emoji: "⚔️", colors: "from-amber-300 to-orange-500" };
}

function SectionCard({ title, children, right }) {
  return (
    <div className="rounded-[28px] border border-white/15 bg-black/45 backdrop-blur-md p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-xs uppercase tracking-[0.24em] text-amber-300 font-black">{title}</div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

function ImagePlaceholder({ emoji, title, subtitle, small = false }) {
  return (
    <div className={`rounded-[28px] border border-dashed border-amber-300/35 bg-zinc-950/60 overflow-hidden ${small ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-4">
        <div className={`flex items-center justify-center rounded-3xl bg-black/50 border border-white/10 ${small ? "w-20 h-20 text-4xl" : "w-28 h-28 text-6xl"}`}>
          {emoji}
        </div>
        <div className="flex-1">
          <div className="text-lg font-black text-white">{title}</div>
          <div className="text-sm text-zinc-200 mt-1 whitespace-pre-line">{subtitle}</div>
        </div>
        <img src={LOGO_URL} alt="Kabal logo" className={`${small ? "w-14 h-14" : "w-16 h-16"} object-contain opacity-90`} />
      </div>
    </div>
  );
}

function DicePreview({ value }) {
  const meta = getDieMeta(value);
  return (
    <motion.div
      initial={{ scale: 0.88, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-24 h-24 rounded-[26px] bg-gradient-to-br ${meta.colors} text-black flex flex-col items-center justify-center shadow-2xl border border-white/40`}
    >
      <div className="text-2xl">{meta.emoji}</div>
      <div className="text-3xl font-black leading-none">{value}</div>
      <div className="text-[11px] font-black tracking-[0.18em] uppercase">{meta.label}</div>
    </motion.div>
  );
}

export default function DieInTheJungle() {
  const [game, setGame] = useState(makeInitialState);

  const enemyMaxHp = ENEMIES[game.room].hp;
  const enemyHpPct = useMemo(() => Math.max(0, (game.enemy.hp / enemyMaxHp) * 100), [game.enemy.hp, enemyMaxHp]);
  const playerHpPct = useMemo(() => Math.max(0, (game.player.hp / game.player.maxHp) * 100), [game.player.hp, game.player.maxHp]);

  function startRoll() {
    const dice = rollDice();
    setGame((g) => ({
      ...g,
      dice,
      grid: emptyGrid(),
      phase: "place",
      log: [`🎲 Rolled: ${dice.join(" - ")}`, ...g.log].slice(0, 8),
    }));
  }

  function placeDie(dieIndex, x, y) {
    if (game.grid[y][x] !== null) return;

    const newGrid = game.grid.map((row) => [...row]);
    newGrid[y][x] = game.dice[dieIndex];

    const newDice = [...game.dice];
    newDice[dieIndex] = null;
    const allPlaced = newDice.every((d) => d === null);

    setGame((g) => ({
      ...g,
      dice: newDice,
      grid: newGrid,
      phase: allPlaced ? "resolve" : "place",
    }));

    if (allPlaced) setTimeout(resolveTurn, 450);
  }

  function resolveTurn() {
    setGame((g) => {
      const result = resolveGrid(g);
      let next = {
        ...g,
        player: result.player,
        enemy: result.enemy,
        log: [...result.log, ...g.log].slice(0, 8),
      };

      if (result.player.hp <= 0) {
        next.phase = "gameover";
        return next;
      }

      if (result.enemy.hp <= 0) {
        const nextRoom = g.room + 1;
        if (nextRoom >= ENEMIES.length) {
          next.phase = "victory";
          return next;
        }
        next.enemy = { ...ENEMIES[nextRoom] };
        next.room = nextRoom;
        next.log = [`✅ Next enemy: ${ENEMIES[nextRoom].emoji} ${ENEMIES[nextRoom].name}`, ...next.log].slice(0, 8);
      }

      next.phase = "roll";
      next.grid = emptyGrid();
      return next;
    });
  }

  function restart() {
    setGame(makeInitialState());
  }

  return (
    <div
      className="min-h-screen text-white p-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.56), rgba(0,0,0,.74)), url(${BG_URL})` }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-amber-300/20 bg-black/35 backdrop-blur-md p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={LOGO_URL} alt="Kabal logo" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="text-5xl font-black tracking-tight text-amber-300">Die in the Jungle</h1>
                <p className="text-zinc-100 mt-1 text-lg">Cleaner emoji UI so you can see the flow fast.</p>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-black/45 px-4 py-3 text-right">
              <div className="text-xs uppercase tracking-[0.24em] text-zinc-300">Phase</div>
              <div className="text-2xl font-black text-amber-300 uppercase">{game.phase}</div>
            </div>
          </div>
        </div>

        <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">
          <div className="space-y-6">
            <SectionCard
              title="Enemy"
              right={<div className="text-sm text-zinc-100">Room {game.room + 1}/{ENEMIES.length}</div>}
            >
              <div className="grid lg:grid-cols-[1fr_220px] gap-4 items-start">
                <ImagePlaceholder
                  emoji={game.enemy.emoji}
                  title={`${game.enemy.emoji} ${game.enemy.name}`}
                  subtitle={`Placeholder image area\nWhat to generate later: enemy portrait card / transparent PNG\nMood: ${game.enemy.mood}`}
                />
                <div className="rounded-[24px] border border-white/10 bg-black/35 p-4">
                  <div className="text-sm text-zinc-200 mb-2">Enemy HP</div>
                  <div className="text-2xl font-black text-white mb-3">{Math.max(0, game.enemy.hp)} / {enemyMaxHp}</div>
                  <Progress value={enemyHpPct} className="h-4 bg-zinc-800" />
                  <div className="mt-4 rounded-2xl bg-zinc-900/80 border border-white/10 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-amber-300">Intent</div>
                    <div className="text-lg font-bold text-white mt-1">⚔️ Hits for {game.enemy.damage}</div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Board" right={<div className="text-sm text-zinc-100">Click empty slots</div>}>
              <div className="mb-4">
                <ImagePlaceholder
                  emoji="🟩"
                  title="🟩 Board frame placeholder"
                  subtitle="Later replace with your jungle board asset / 3x3 frame / transparent PNG"
                  small
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {game.grid.map((row, y) =>
                  row.map((cell, x) => {
                    const meta = cell ? getDieMeta(cell) : null;
                    return (
                      <button
                        key={`${x}-${y}`}
                        className="h-28 rounded-[24px] border border-white/20 bg-zinc-700/80 hover:bg-zinc-600/90 transition text-white font-black text-3xl shadow-lg"
                        onClick={() => {
                          const dieIndex = game.dice.findIndex((d) => d !== null);
                          if (dieIndex !== -1 && game.phase === "place") placeDie(dieIndex, x, y);
                        }}
                      >
                        {cell ? (
                          <div className="flex flex-col items-center justify-center">
                            <div className="text-2xl">{meta.emoji}</div>
                            <div>{cell}</div>
                          </div>
                        ) : (
                          <span className="text-zinc-200 text-sm font-semibold tracking-[0.18em]">PLACE</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </SectionCard>

            <SectionCard title="Dice + Action" right={<div className="text-sm text-zinc-100">3 dice each turn</div>}>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-white">🛡️ 1-2 = Shield</div>
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-white">❤️ 3-4 = Heal</div>
                <div className="rounded-2xl border border-white/10 bg-black/35 px-3 py-2 text-white">⚔️ 5-6 = Attack</div>
              </div>
              <div className="flex flex-wrap gap-4 min-h-[96px]">
                {game.dice.some(Boolean) ? (
                  game.dice.map((d, i) => (d ? <DicePreview key={i} value={d} /> : null))
                ) : (
                  <div className="text-zinc-100 text-base">🎲 No dice yet. Press <span className="text-amber-300 font-black">ROLL</span>.</div>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-4 items-center">
                {game.phase === "roll" && (
                  <Button onClick={startRoll} className="bg-amber-400 hover:bg-amber-300 text-black text-xl font-black px-8 py-6 rounded-2xl shadow-xl">
                    🎲 ROLL
                  </Button>
                )}
                {(game.phase === "gameover" || game.phase === "victory") && (
                  <>
                    <div className="text-3xl font-black text-white">{game.phase === "victory" ? "🏆 YOU WIN" : "💀 YOU DIED"}</div>
                    <Button onClick={restart} className="bg-white text-black hover:bg-zinc-200 text-lg font-black px-6 py-5 rounded-2xl">
                      Restart Run
                    </Button>
                  </>
                )}
              </div>
            </SectionCard>

            <div className="grid md:grid-cols-[1fr_280px] gap-6">
              <SectionCard title="Player HUD">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-3xl bg-black/40 border border-white/10 flex items-center justify-center text-5xl">{game.player.emoji}</div>
                  <div className="flex-1">
                    <div className="text-2xl font-black text-white">🐸 Player</div>
                    <div className="text-zinc-100 mt-1">HP {game.player.hp} / {game.player.maxHp}</div>
                    <Progress value={playerHpPct} className="h-4 bg-zinc-800 mt-3" />
                    <div className="mt-3 text-lg text-cyan-200 font-semibold">🛡️ Shield {game.player.shield}</div>
                  </div>
                </div>
              </SectionCard>

              <ImagePlaceholder
                emoji="🖼️"
                title="🐸 Player image placeholder"
                subtitle="Use logo for now + emoji. Later replace with hero portrait / transparent PNG"
                small
              />
            </div>
          </div>

          <div className="space-y-6">
            <SectionCard title="How to play">
              <div className="space-y-3 text-lg text-white">
                <div>1️⃣ Click <span className="text-amber-300 font-black">ROLL</span></div>
                <div>2️⃣ Put all 3 dice on the board</div>
                <div>3️⃣ 🛡️ 1-2 = Shield</div>
                <div>4️⃣ ❤️ 3-4 = Heal</div>
                <div>5️⃣ ⚔️ 5-6 = Attack</div>
                <div>6️⃣ Enemy hits back</div>
              </div>
            </SectionCard>

            <SectionCard title="Image placeholders to generate later">
              <div className="grid sm:grid-cols-2 gap-3 text-white">
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">🌴 Background</div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">🐍 Enemy portraits</div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">🐸 Player portrait</div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">🎲 Amber dice</div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">🟩 Jungle board</div>
                <div className="rounded-2xl border border-white/10 bg-black/35 p-3">⚔️ 🛡️ ❤️ icons</div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-amber-300/35 bg-zinc-950/50 p-3">
                <img src={LOGO_URL} alt="Kabal logo" className="w-12 h-12 object-contain" />
                <div className="text-zinc-100">Using the Kabal logo as temporary art anchor.</div>
              </div>
            </SectionCard>

            <SectionCard title="Combat log">
              <div className="space-y-2">
                {game.log.map((l, i) => (
                  <div key={i} className="rounded-2xl bg-zinc-900/80 border border-white/10 px-4 py-3 text-base text-white">
                    {l}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
