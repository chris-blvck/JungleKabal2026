import React from 'react';

const HERO_VISUAL = 'https://i.postimg.cc/YSmfqq2c/Background-desktop.png';
const LOGO_VISUAL = 'https://i.postimg.cc/rwdjP9rb/logo-jaune.png';
const GAMEPLAY_VISUAL = 'https://i.postimg.cc/xdqv6wsH/Chat-GPT-Image-Mar-12-2026-02-29-33-PM.png';
const LORE_VISUAL = 'https://i.postimg.cc/DwMdGXHm/Kabalian-or-KKM.png';

const FEATURES = [
  {
    title: 'Fast, high-pressure roguelite runs',
    description: 'Jump into short combats, take big risks, and climb your best score run after run.',
  },
  {
    title: 'Two identities. Two playstyles.',
    description: 'Pick Kabalian or KKM and adapt your strategy between aggressive tempo and heavy sustain.',
  },
  {
    title: 'A world driven by Ka Fragments',
    description: 'Uncover jungle chronicles while deciding how much power and chaos you can handle.',
  },
];

export default function DieInTheJunglePromo() {
  return (
    <main className="min-h-screen bg-[#090c10] text-white">
      <section className="relative overflow-hidden border-b border-yellow-300/15">
        <img
          src={HERO_VISUAL}
          alt="Die In The Jungle jungle background"
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090c10] via-[#090c10]/90 to-[#090c10]/55" />

        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-6 pb-14 pt-16 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-yellow-400/50 bg-yellow-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-yellow-300">
              New challenge live
            </p>

            <img src={LOGO_VISUAL} alt="Die In The Jungle logo" className="h-16 w-auto md:h-20" />

            <h1 className="text-4xl font-black uppercase leading-tight md:text-6xl">
              Enter the jungle.
              <br />
              Survive the Ka.
            </h1>

            <p className="max-w-xl text-lg text-slate-200">
              Every decision shifts the jungle. The deeper you chase Ka Fragments, the more brutal each fight becomes.
              Step in, adapt fast, and push your run to legend status.
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="/diejungle"
                className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold uppercase tracking-wide text-black transition hover:bg-yellow-300"
              >
                Play now
              </a>
              <a
                href="#features"
                className="rounded-xl border border-white/25 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-yellow-300 hover:text-yellow-300"
              >
                Why it hooks players
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm">
            <img src={GAMEPLAY_VISUAL} alt="Die In The Jungle gameplay visual" className="w-full rounded-xl object-cover" />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <h2 className="mb-3 text-xl font-bold text-yellow-300">{feature.title}</h2>
              <p className="text-slate-200">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 md:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <img src={GAMEPLAY_VISUAL} alt="Combat board preview" className="mb-5 w-full rounded-xl" />
          <h3 className="mb-2 text-xl font-bold">Short runs. Instant adrenaline.</h3>
          <p className="text-slate-300">
            You fail fast, learn fast, and relaunch in seconds. Perfect for a competitive, score-driven loop.
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <img src={LORE_VISUAL} alt="Kabalian and KKM lore visual" className="mb-5 w-full rounded-xl" />
          <h3 className="mb-2 text-xl font-bold">Kabal lore with shareable identity</h3>
          <p className="text-slate-300">
            Kabalian and KKM chronicles give the game a strong mythos and make every run feel like part of a bigger story.
          </p>
        </article>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 pt-8 text-center">
        <div className="rounded-2xl border border-yellow-300/35 bg-yellow-300/10 px-6 py-12">
          <p className="text-sm uppercase tracking-[0.2em] text-yellow-300">The Ka is waiting</p>
          <h4 className="mt-2 text-3xl font-black uppercase md:text-4xl">Do you have what it takes to survive?</h4>
          <a
            href="/diejungle"
            className="mt-6 inline-block rounded-xl bg-yellow-400 px-8 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:bg-yellow-300"
          >
            Start a run
          </a>
        </div>
      </section>
    </main>
  );
}
