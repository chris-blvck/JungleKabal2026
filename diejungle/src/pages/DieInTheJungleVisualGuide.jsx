import React from "react";
import { Link } from "react-router-dom";

const samples = {
  background: "https://i.postimg.cc/YSmfqq2c/Background-desktop.png",
  logo: "https://i.postimg.cc/rwdjP9rb/logo-jaune.png",
  player: "https://i.postimg.cc/B6rBLmBt/Kabalian-Face.png",
  kkm: "https://i.postimg.cc/Kv8zygVk/KKM-Mascot-2.png",
  enemy: "https://i.postimg.cc/XYDpJTQK/Magic-Book-1.png",
  laneTop: "https://i.postimg.cc/xdqv6wsH/Chat-GPT-Image-Mar-12-2026-02-29-33-PM.png",
  laneMid: "https://i.postimg.cc/66CdbLhg/Chat-GPT-Image-Mar-12-2026-02-31-00-PM.png",
  laneBot: "https://i.postimg.cc/BvdqdFg9/Chat-GPT-Image-Mar-12-2026-02-24-25-PM.png",
  diceAttack: "https://i.postimg.cc/mk4Rdw2K/Dice-1.png",
  diceHeal: "https://i.postimg.cc/k4T1QSqL/Dice-health-1.png",
  diceShield: "https://i.postimg.cc/x8qstddp/Dice-shield-1.png",
  story: "https://i.postimg.cc/DwMdGXHm/Kabalian-or-KKM.png",
};

function AssetCard({ title, src, note, editableAt }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-black text-amber-200">{title}</div>
        <div className="rounded-full border border-cyan-300/30 bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-100">Changeable</div>
      </div>
      <img src={src} alt={title} className="mb-2 h-28 w-full rounded-xl border border-white/10 bg-black/30 object-contain" />
      <div className="text-xs text-zinc-300">{note}</div>
      <div className="mt-1 text-[11px] text-zinc-400">Edit: <span className="text-zinc-200">{editableAt}</span></div>
    </div>
  );
}

function Badge({ children, tone = "amber" }) {
  const tones = {
    amber: "border-amber-300/35 bg-amber-500/20 text-amber-100",
    cyan: "border-cyan-300/35 bg-cyan-500/20 text-cyan-100",
    rose: "border-rose-300/35 bg-rose-500/20 text-rose-100",
    emerald: "border-emerald-300/35 bg-emerald-500/20 text-emerald-100",
    zinc: "border-white/15 bg-white/10 text-zinc-100",
  };
  return <span className={`rounded-full border px-2 py-1 text-[11px] font-bold ${tones[tone]}`}>{children}</span>;
}

function ElementRow({ element, visual, edit }) {
  return (
    <div className="grid grid-cols-1 gap-2 rounded-xl border border-white/10 bg-black/35 p-2 md:grid-cols-[1.2fr_1fr_1.5fr] md:items-center">
      <div className="text-xs font-black text-zinc-100">{element}</div>
      <div className="text-xs text-zinc-300">{visual}</div>
      <div className="text-[11px] text-cyan-200">{edit}</div>
    </div>
  );
}

export default function DieInTheJungleVisualGuide() {
  return (
    <div className="min-h-screen bg-zinc-950 p-3 text-white md:p-6">
      <div className="mx-auto max-w-6xl space-y-3">
        <div className="rounded-2xl border border-amber-300/20 bg-black/45 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-black text-amber-300 md:text-2xl">Die In The Jungle · Visual Customization Guide</h1>
              <p className="text-sm text-zinc-300">Aperçu visuel complet: assets, couleurs, boutons, HUD, cartes, modales, états et micro-UI.</p>
            </div>
            <div className="flex gap-2">
              <Link to="/" className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-black text-black hover:bg-amber-300">Open game</Link>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-2 text-sm font-black text-cyan-200">Quick categories (everything editable)</div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="amber">Global branding</Badge>
            <Badge tone="cyan">Dice + board skins</Badge>
            <Badge tone="rose">Enemy + character art</Badge>
            <Badge tone="emerald">Buttons + CTA states</Badge>
            <Badge tone="zinc">HUD + cards + modals + typography</Badge>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AssetCard title="Background" src={samples.background} note="Fond principal du jeu." editableAt="BG_URL" />
          <AssetCard title="Logo" src={samples.logo} note="Logo affiché dans le header et modales." editableAt="LOGO_URL" />
          <AssetCard title="Player avatar" src={samples.player} note="Avatar Kabalian / émotions." editableAt="PLAYER_AVATAR_URL + PLAYER_EMOTION_URLS" />
          <AssetCard title="KKM avatar" src={samples.kkm} note="Avatar alternatif du personnage KKM." editableAt="KKM_AVATAR_URL" />
          <AssetCard title="Enemy sprite" src={samples.enemy} note="Chaque ennemi a son image dédiée." editableAt="ENEMY_POOLS[*].image" />
          <AssetCard title="Story fragment image" src={samples.story} note="Image utilisée dans la modale reward/lore." editableAt="STORY_FRAGMENT_IMAGE_URL" />
          <AssetCard title="Lane Top" src={samples.laneTop} note="Tuile de fond de la ligne TOP." editableAt="LANE_IMAGES[0]" />
          <AssetCard title="Lane Mid" src={samples.laneMid} note="Tuile de fond de la ligne MID." editableAt="LANE_IMAGES[1]" />
          <AssetCard title="Lane Bot" src={samples.laneBot} note="Tuile de fond de la ligne BOT." editableAt="LANE_IMAGES[2]" />
          <AssetCard title="Attack die skin" src={samples.diceAttack} note="Skin du dé attaque." editableAt="DICE_IMAGES_BY_KIND.attack" />
          <AssetCard title="Heal die skin" src={samples.diceHeal} note="Skin du dé heal." editableAt="DICE_IMAGES_BY_KIND.heal" />
          <AssetCard title="Shield die skin" src={samples.diceShield} note="Skin du dé shield." editableAt="DICE_IMAGES_BY_KIND.shield" />
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-2 text-sm font-black text-amber-200">Buttons / CTA skins</div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-2xl bg-amber-400 px-4 py-2 font-black text-black">🎲 ROLL</button>
              <button className="rounded-2xl border border-white/20 bg-zinc-800 px-4 py-2 font-black text-white">🔁 REROLL</button>
              <button className="rounded-2xl bg-white px-4 py-2 font-black text-black">Play again</button>
              <button className="rounded-2xl bg-violet-500/40 px-4 py-2 font-black text-white">Submit score</button>
              <button className="rounded-2xl bg-sky-500/40 px-4 py-2 font-black text-white">Share run</button>
            </div>
            <p className="mt-2 text-xs text-zinc-300">Tu peux remplacer ces boutons par images (png/webp/svg) + états hover/pressed.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-2 text-sm font-black text-cyan-200">Color tokens preview</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg border border-amber-300/30 bg-amber-500/20 p-2">Amber primary</div>
              <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/20 p-2">Cyan info</div>
              <div className="rounded-lg border border-rose-300/30 bg-rose-500/20 p-2">Rose danger</div>
              <div className="rounded-lg border border-emerald-300/30 bg-emerald-500/20 p-2">Emerald success</div>
            </div>
            <p className="mt-2 text-xs text-zinc-300">Tu peux refaire totalement le look en “Solana neon” ou autre palette.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="mb-2 text-sm font-black text-rose-200">HUD blocks preview</div>
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="rounded-xl border border-white/15 bg-black/45 px-2 py-1">Zone 7</div>
              <div className="rounded-xl border border-white/15 bg-black/45 px-2 py-1">Phase: place</div>
              <div className="rounded-xl border border-white/15 bg-black/45 px-2 py-1">Seed #12345</div>
              <div className="rounded-xl border border-sky-300/30 bg-sky-500/20 px-2 py-1">Player @username</div>
            </div>
            <p className="mt-2 text-xs text-zinc-300">Styles/layout du top HUD sont entièrement personnalisables.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 text-sm font-black text-amber-200">Element-by-element map (ce que tu peux changer)</div>
          <div className="space-y-2">
            <ElementRow element="Header title + subtitle" visual="Typo, taille, couleur, style" edit="Section header dans DieInTheJungle.tsx" />
            <ElementRow element="Panel cards (Enemy/Combat/Player)" visual="Border radius, gradient, opacity, shadow" edit="SectionCard + classes des panels" />
            <ElementRow element="HP / Shield bars" visual="Gradient colors, thickness, shape" edit="Component LifeBar + tones" />
            <ElementRow element="Dice cards" visual="Frame, glow, label chips, selected badge" edit="DiceFace component" />
            <ElementRow element="Board cells" visual="Tile image, border, cooldown overlay" edit="LANE_IMAGES + board cell classes" />
            <ElementRow element="Route cards" visual="Current/done/hidden states" edit="RouteCard component" />
            <ElementRow element="Artifacts cards" visual="Rarity color coding + icon size" edit="ArtifactCard + rarityClasses" />
            <ElementRow element="Popups / toasts" visual="Damage/heal popup color + blur" edit="damagePopups/actionFlash blocks" />
            <ElementRow element="Reward & How-to modals" visual="Backdrop, panel style, typography" edit="reward/showHowToPlay modal sections" />
            <ElementRow element="Mobile bottom action bar" visual="Height, blur, CTA style" edit="fixed mobile action bar section" />
            <ElementRow element="Leaderboard rows" visual="Badges, ranking style, spacing" edit="Leaderboard section + mobile details" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="mb-2 text-sm font-black text-cyan-200">Where to edit quickly</div>
          <ul className="space-y-1 text-xs text-zinc-300">
            <li>• `src/pages/DieInTheJungle.tsx` (assets URLs + UI classes + panels/buttons/modals)</li>
            <li>• `public/games/die in the jungle/assets/...` (tes assets locaux image)</li>
            <li>• `src/components/ui/button.jsx` (style global du composant Button)</li>
            <li>• Route de ce guide: `src/App.jsx` → `/diejungle-visual-guide`</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
