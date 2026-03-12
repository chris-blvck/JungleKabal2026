import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import confetti from 'canvas-confetti';

// Extend dayjs plugins for countdown
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(duration);

// ===== Scroll Navigation =====
export function ScrollNav({ sections }) {
  return (
    <nav className="fixed top-0 left-0 h-full w-16 bg-zinc-900 flex flex-col items-center py-4 space-y-2 z-50">
      {sections.map((sec, i) => (
        <button
          key={i}
          onClick={() => document.getElementById(sec.id).scrollIntoView({ behavior: 'smooth' })}
          className="w-3 h-3 bg-yellow-500 rounded-full hover:scale-125 transition"
          title={sec.label}
        />
      ))}
    </nav>
  );
}

// ===== Hero Section with Video/GIF Background =====
export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative h-[70vh] flex flex-col items-center justify-center overflow-hidden pt-32 pb-16"
    >
      {/* Background Video or GIF */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/videos/header.mp4" // or "/images/header.gif"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay Content: Kabal Kash Machine header */}
      <div className="relative z-10 text-center space-y-4 px-4">
        {/* Top 3 Hunters */}
        <div className="flex justify-center space-x-4 mt-4">
          {['Hunter1', 'Hunter2', 'Hunter3'].map((name, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="px-2 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full mb-1">
                TOP {i + 1}
              </span>
              <img
                src={`/badges/bloodline${i + 1}.png`}
                alt={`${name} Badge`}
                className="w-12 h-12 mb-1"
              />
              <span className="text-white font-semibold">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== System Flow =====
export function SystemFlow({ flowText }) {
  return (
    <section id="flow" className="bg-zinc-900 p-6 rounded-xl text-center space-y-4 shadow-md">
      <h2 className="text-2xl font-bold text-yellow-400">🧭 System Flow</h2>
      <p className="text-gray-200">{flowText}</p>
    </section>
  );
}

// ===== Vault Status =====
export function VaultStatus({ totalInvestment, tvl, health, totalPayout }) {
  return (
    <section id="vault" className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center mt-8">
      <div className="bg-zinc-800 p-4 rounded-xl">
        <h3 className="text-lg text-gray-300">Total Investment</h3>
        <p className="text-3xl font-bold">${totalInvestment.toLocaleString()}</p>
      </div>
      <div className="bg-zinc-800 p-4 rounded-xl">
        <h3 className="text-lg text-gray-300">TVL</h3>
        <p className="text-3xl font-bold">${tvl.toLocaleString()}</p>
      </div>
      <div className="bg-zinc-800 p-4 rounded-xl">
        <h3 className="text-lg text-gray-300">Health</h3>
        <p className="text-3xl font-bold">{health}%</p>
      </div>
      <div className="bg-zinc-800 p-4 rounded-xl">
        <h3 className="text-lg text-gray-300">Total Paid Out</h3>
        <p className="text-3xl font-bold">${totalPayout.toLocaleString()}</p>
      </div>
    </section>
  );
}

// ===== Profit Projections with curve placeholder =====
export function ProfitProjection({ weeklyLast, weeklyEst }) {
  return (
    <section id="projection" className="bg-zinc-900 p-6 rounded-xl mt-8">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">📈 Weekly ROI</h2>
      <div className="flex justify-between text-gray-200 mb-4">
        <div>
          Last Week: <span className="text-white font-semibold">{weeklyLast}%</span>
        </div>
        <div>
          Est: <span className="text-white font-semibold">{weeklyEst}%</span>
        </div>
      </div>
      {/* Placeholder for curve chart */}
      <div className="h-32 bg-zinc-800 rounded-lg flex items-center justify-center text-gray-500">
        Curve Chart Placeholder
      </div>
    </section>
  );
}

// ===== Weekly Ritual Countdown =====
export function RitualCountdown({ payoutDay = 0, payoutHour = 18, payoutMinute = 0, onRitual }) {
  const [diff, setDiff] = useState('');
  const [ritualSoon, setRitualSoon] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const now = dayjs().tz('Asia/Bangkok');
      let next = now.day(payoutDay).hour(payoutHour).minute(payoutMinute).second(0);
      if (now.isAfter(next)) next = next.add(1, 'week');
      const d = dayjs.duration(next.diff(now));
      setDiff(`${d.days()}d ${d.hours()}h ${d.minutes()}m`);
      setRitualSoon(d.asHours() < 1);
      if (d.asMilliseconds() <= 0 && onRitual) onRitual();
    };
    calculate();
    const iv = setInterval(calculate, 60000);
    return () => clearInterval(iv);
  }, [payoutDay, payoutHour, payoutMinute, onRitual]);

  return (
    <section id="ritual" className="bg-yellow-900 text-black p-8 rounded-2xl text-center shadow-2xl space-y-4 mt-8">
      <h2 className="text-2xl font-extrabold">⏳ Weekly Ritual Payout</h2>
      <p>
        Next payout in: <span className="font-mono">{diff}</span>
      </p>
      {ritualSoon && <div className="animate-pulse text-red-600">Ritual is about to begin!</div>}
    </section>
  );
}

// ===== Main Component =====
export default function KabalKashMachine() {
  const sections = [
    { id: 'hero', label: 'Hero' },
    { id: 'flow', label: 'Flow' },
    { id: 'vault', label: 'Vault' },
    { id: 'projection', label: 'Projection' },
    { id: 'ritual', label: 'Ritual' },
  ];

  // Example data
  const totalInvestment = 167848;
  const tvl = 156620;
  const health = 93.31;
  const totalPayout = 80709;
  const weeklyLast = 12.4;
  const weeklyEst = 15.2;

  const handleRitual = () => {
    confetti({ particleCount: 200, spread: 60 });
  };

  return (
    <div className="relative bg-black-texture bg-black bg-cover bg-center text-white min-h-screen p-8 font-mono max-w-screen-xl mx-auto">
      <ScrollNav sections={sections} />
      <HeroSection />
      <SystemFlow flowText="Deposit → Trade → Split → Compound" />
      <VaultStatus
        totalInvestment={totalInvestment}
        tvl={tvl}
        health={health}
        totalPayout={totalPayout}
      />
      <ProfitProjection weeklyLast={weeklyLast} weeklyEst={weeklyEst} />
      <RitualCountdown onRitual={handleRitual} />
    </div>
  );
}

