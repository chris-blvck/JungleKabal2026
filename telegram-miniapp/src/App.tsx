import React, { useEffect, useMemo, useState } from 'react';
import DieInTheJungle from './game/DieInTheJungle';
import {
  claimMissionReward,
  claimReferralBonus,
  consumeRunTicket,
  getModeLimits,
  loadProgression,
  markMissionShare,
  markRunFinished,
  saveProgression,
  setBuildLoadout,
  unlockCharacter,
  unlockWeapon,
  type ProgressionState,
} from './lib/progression';
import { checkMiniappAuth, claimReferral, fetchFriendsLeaderboard, fetchReferralStats, submitRun, trackEvent } from './lib/miniappApi';
import { getStartParam, getTelegramInitData, getTelegramUser, getTelegramWebApp, initTelegramMiniApp } from './telegram';

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'your_bot_username';

const CHARACTER_UNLOCKS = {
  krex: { name: 'K-Rex', gemCost: 150 },
};

const STARTER_WEAPONS = [
  { id: 'jungle-blade-common', name: 'Jungle Blade (common)', gemCost: 0 },
  { id: 'root-staff-rare', name: 'Root Staff (rare)', gemCost: 150 },
  { id: 'stone-shield-rare', name: 'Stone Shield (rare)', gemCost: 150 },
  { id: 'venom-fang-epic', name: 'Venom Fang (epic)', gemCost: 400 },
];

const COMPANIONS = [
  { id: 'momo', name: 'Momo Monkey', desc: '+1 ATK permanent' },
  { id: 'kappa', name: 'Kappa Turtle', desc: 'Auto +4 shield every 3 turns' },
  { id: 'pixi', name: 'Pixi Spirit', desc: 'Auto +2 heal every 2 turns' },
];

export default function App() {
  const [progression, setProgression] = useState<ProgressionState>(() => loadProgression());
  const [runMode, setRunMode] = useState<'competitive' | 'practice'>('competitive');
  const [uiPreset, setUiPreset] = useState<'default' | 'readable'>('default');
  const [fxIntensity, setFxIntensity] = useState<'low' | 'normal' | 'high'>('normal');
  const [alerts, setAlerts] = useState<string[]>([]);
  const [serverReferralCount, setServerReferralCount] = useState<number | null>(null);
  const [authStatus, setAuthStatus] = useState<'verified' | 'unverified' | 'unknown'>('unknown');
  const [friendsBoard, setFriendsBoard] = useState<Array<{ telegramUserId: string; score: number; floor: number }>>([]);

  useEffect(() => {
    initTelegramMiniApp();
  }, []);

  useEffect(() => {
    saveProgression(progression);
  }, [progression]);

  const user = getTelegramUser();
  const telegramUserId = user?.id ? String(user.id) : 'guest';
  const telegramInitData = getTelegramInitData();

  const referralCode = useMemo(() => {
    if (user?.id) return `ref_${user.id}`;
    if (user?.username) return `ref_${user.username}`;
    return 'ref_guest';
  }, [user?.id, user?.username]);

  const inboundRef = getStartParam();
  const inviteLink = `https://t.me/${BOT_USERNAME}/app?startapp=${referralCode}`;

  useEffect(() => {
    checkMiniappAuth(telegramUserId, telegramInitData)
      .then((payload) => {
        setAuthStatus(payload.auth?.verified ? 'verified' : 'unverified');
      })
      .catch(() => setAuthStatus('unverified'));
  }, [telegramUserId, telegramInitData]);

  useEffect(() => {
    let cancelled = false;
    fetchReferralStats(referralCode)
      .then((payload) => {
        if (!cancelled) setServerReferralCount(Number(payload.stats?.totalClaims || 0));
      })
      .catch(() => {
        if (!cancelled) setServerReferralCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [referralCode]);


  useEffect(() => {
    const ids = [telegramUserId, ...progression.referralsClaimed.map((_, i) => `friend_${i}`)].slice(0, 15);
    fetchFriendsLeaderboard(ids)
      .then((payload) => setFriendsBoard(Array.isArray(payload.leaderboard) ? payload.leaderboard : []))
      .catch(() => setFriendsBoard([]));
  }, [telegramUserId, progression.referralsClaimed.length]);
  useEffect(() => {
    if (!inboundRef || inboundRef === referralCode) return;

    const localResult = claimReferralBonus(progression, inboundRef);
    if (localResult.claimed) {
      setProgression(localResult.next);
      setAlerts((prev) => [`🎁 Referral detected (${inboundRef}) → +1 run ticket`, ...prev].slice(0, 4));
    }

    claimReferral(inboundRef, telegramUserId, telegramInitData)
      .then((payload) => {
        if (payload.claimed) {
          setServerReferralCount(Number(payload.stats?.totalClaims || 0));
          setAlerts((prev) => [`✅ Referral synced with server (${inboundRef})`, ...prev].slice(0, 4));
        }
      })
      .catch(() => {
        setAlerts((prev) => ['⚠️ Referral server sync failed (local ticket still granted).', ...prev].slice(0, 4));
      });
    // intentionally triggered once at load for incoming start_param
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboundRef, referralCode, telegramUserId, telegramInitData]);

  const shareInvite = () => {
    const text = encodeURIComponent(`Join me in Die In The Jungle 🌴🎲\nInvite bonus: +1 run ticket\n${inviteLink}`);
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`;
    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }

    setProgression((prev) => markMissionShare(prev));
    setAlerts((prev) => ['📣 Share mission progress +1', ...prev].slice(0, 4));
    trackEvent('share_click', telegramUserId, { referralCode }, telegramInitData).catch(() => undefined);
  };

  const canRestartRun = () => {
    const limits = getModeLimits(progression);
    if (runMode === 'competitive' && limits.competitiveRemaining <= 0) {
      setAlerts((prev) => ['🏁 Daily competitive attempts used. Try Practice mode.', ...prev].slice(0, 4));
      return false;
    }
    if (runMode === 'practice' && limits.practiceRemaining <= 0) {
      setAlerts((prev) => ['🧪 Practice limit reached (10 runs/day). Come back tomorrow.', ...prev].slice(0, 4));
      return false;
    }

    const result = consumeRunTicket(progression);
    if (!result.ok) {
      setAlerts((prev) => ['🚫 No run tickets left. Invite a friend to get +1 ticket.', ...prev].slice(0, 4));
      return false;
    }
    setProgression(result.next);
    return true;
  };

  const onRunEnded = ({ score, floor, runSeed, characterId }: { score: number; floor: number; runSeed: string; characterId: string }) => {
    setAlerts((prev) => [`🏁 Run ended · Zone ${floor} · Score ${score}`, ...prev].slice(0, 4));
    setProgression((prev) => markRunFinished(prev, floor, runMode));
    trackEvent('run_end', telegramUserId, { score, floor, runSeed, characterId }, telegramInitData).catch(() => undefined);

    submitRun({
      telegramUserId,
      referralCodeUsed: inboundRef,
      runSeed,
      score,
      floor,
      characterId,
      mode: runMode,
    }, telegramInitData)
      .then(() => {
        if (runMode === 'competitive' && floor >= 6) {
          setAlerts((prev) => ['🎉 Competitive win: +1 extra daily competitive ticket unlocked.', ...prev].slice(0, 4));
        }
        setAlerts((prev) => ['📡 Run submitted to server leaderboard', ...prev].slice(0, 4));
      })
      .catch(() => {
        setAlerts((prev) => ['⚠️ Run server submit failed (local run is still valid).', ...prev].slice(0, 4));
      });
  };

  const claimMission = (missionId: 'play_run' | 'reach_zone_3' | 'share_once') => {
    const result = claimMissionReward(progression, missionId);
    if (!result.claimed) {
      setAlerts((prev) => ['⏳ Mission not ready yet', ...prev].slice(0, 4));
      return;
    }
    setProgression(result.next);
    setAlerts((prev) => [`🎟️ Mission reward claimed: +${result.reward} ticket`, ...prev].slice(0, 4));
  };

  const referralsLabel = serverReferralCount === null ? `${progression.totalReferrals} (local)` : `${serverReferralCount} (server)`;
  const limits = getModeLimits(progression);

  const unlockKrex = () => {
    const result = unlockCharacter(progression, 'krex', CHARACTER_UNLOCKS.krex.gemCost);
    if (!result.unlocked) {
      setAlerts((prev) => ['💎 Not enough gems to unlock K-Rex.', ...prev].slice(0, 4));
      return;
    }
    setProgression(result.next);
    setAlerts((prev) => ['🦖 K-Rex unlocked.', ...prev].slice(0, 4));
  };

  const unlockStarterWeapon = (weaponId: string, gemCost: number) => {
    if (progression.unlockedWeapons.includes(weaponId)) {
      setProgression((prev) => setBuildLoadout(prev, { starterWeaponId: weaponId }));
      return;
    }
    const result = unlockWeapon(progression, weaponId, gemCost);
    if (!result.unlocked) {
      setAlerts((prev) => ['💎 Not enough gems to unlock this weapon.', ...prev].slice(0, 4));
      return;
    }
    setProgression(result.next);
    setAlerts((prev) => ['⚔️ Starter weapon unlocked and equipped.', ...prev].slice(0, 4));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#ffc300]">Telegram Mini App + Web Mirror</p>
            <h1 className="text-lg font-black">Die In The Jungle</h1>
            <p className="text-xs text-zinc-300">Run tickets: <span className="font-black text-emerald-300">{progression.runTickets}</span> · Referrals: <span className="font-black text-cyan-300">{referralsLabel}</span> · Streak: <span className="font-black text-amber-300">{progression.streak.current}</span> · Auth: <span className={`font-black ${authStatus === 'verified' ? 'text-emerald-300' : authStatus === 'unverified' ? 'text-amber-300' : 'text-zinc-300'}`}>{authStatus}</span></p>
            <p className="text-xs text-zinc-300">Mode: <span className="font-black text-[#ffc300]">{runMode === 'competitive' ? 'Daily Competitive' : 'Practice'}</span> · Competitive left today: <span className="font-black text-rose-300">{limits.competitiveRemaining}</span> · Practice left today: <span className="font-black text-sky-300">{limits.practiceRemaining}</span></p>
            <p className="text-xs text-zinc-300">Gems: <span className="font-black text-fuchsia-300">{progression.gems}</span> · Companion: <span className="font-black text-emerald-300">{COMPANIONS.find((c) => c.id === progression.selectedCompanionId)?.name || 'none'}</span> · Starter weapon: <span className="font-black text-amber-300">{STARTER_WEAPONS.find((w) => w.id === progression.selectedStarterWeaponId)?.name || 'none'}</span></p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {inboundRef ? <span className="rounded-full border border-emerald-400/40 px-3 py-1">Referral entrant: {inboundRef}</span> : null}
            <button
              onClick={() => setRunMode('competitive')}
              className={`rounded-full px-3 py-1 font-bold ${runMode === 'competitive' ? 'bg-rose-500 text-white' : 'border border-white/20 text-zinc-200'}`}
            >
              Competitive
            </button>
            <button
              onClick={() => setRunMode('practice')}
              className={`rounded-full px-3 py-1 font-bold ${runMode === 'practice' ? 'bg-sky-500 text-white' : 'border border-white/20 text-zinc-200'}`}
            >
              Practice
            </button>
            <button onClick={shareInvite} className="rounded-full bg-[#ffc300] px-3 py-1 font-bold text-black hover:bg-[#ffcf3f]">
              Invite & Share
            </button>
          </div>
        </div>

        <div className="mx-auto mt-2 flex max-w-5xl flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-white/20 px-3 py-1 text-zinc-200">Preview readability</span>
          <button
            onClick={() => setUiPreset('default')}
            className={`rounded-full px-3 py-1 font-bold ${uiPreset === 'default' ? 'bg-zinc-200 text-black' : 'border border-white/20 text-zinc-200'}`}
          >
            Standard
          </button>
          <button
            onClick={() => setUiPreset('readable')}
            className={`rounded-full px-3 py-1 font-bold ${uiPreset === 'readable' ? 'bg-emerald-400 text-black' : 'border border-white/20 text-zinc-200'}`}
          >
            Readable+
          </button>

          <span className="ml-2 rounded-full border border-white/20 px-3 py-1 text-zinc-200">FX intensity</span>
          {(['low', 'normal', 'high'] as const).map((fx) => (
            <button
              key={fx}
              onClick={() => setFxIntensity(fx)}
              className={`rounded-full px-3 py-1 font-bold ${fxIntensity === fx ? 'bg-fuchsia-400 text-black' : 'border border-white/20 text-zinc-200'}`}
            >
              {fx}
            </button>
          ))}
        </div>

        <div className="mx-auto mt-2 grid max-w-5xl gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/30 p-2">
            <div className="mb-1 font-semibold text-amber-200">Build Prep · Character unlock</div>
            {progression.unlockedCharacters.includes('krex') ? (
              <div className="text-emerald-300">🦖 K-Rex unlocked</div>
            ) : (
              <button onClick={unlockKrex} className="rounded bg-amber-400 px-2 py-1 font-bold text-black">Unlock K-Rex ({CHARACTER_UNLOCKS.krex.gemCost}💎)</button>
            )}
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-2">
            <div className="mb-1 font-semibold text-cyan-200">Build Prep · Companion</div>
            <div className="space-y-1">
              {COMPANIONS.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setProgression((prev) => setBuildLoadout(prev, { companionId: comp.id }))}
                  className={`w-full rounded px-2 py-1 text-left ${progression.selectedCompanionId === comp.id ? 'bg-cyan-400 text-black' : 'border border-white/20 text-zinc-200'}`}
                >
                  {comp.name} · {comp.desc}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/30 p-2">
            <div className="mb-1 font-semibold text-fuchsia-200">Build Prep · Starter weapon</div>
            <div className="space-y-1">
              {STARTER_WEAPONS.map((weapon) => {
                const unlocked = progression.unlockedWeapons.includes(weapon.id);
                return (
                  <button
                    key={weapon.id}
                    onClick={() => unlockStarterWeapon(weapon.id, weapon.gemCost)}
                    className={`w-full rounded px-2 py-1 text-left ${progression.selectedStarterWeaponId === weapon.id ? 'bg-fuchsia-400 text-black' : 'border border-white/20 text-zinc-200'}`}
                  >
                    {weapon.name} {unlocked ? '· equipped/unlocked' : `· unlock ${weapon.gemCost}💎`}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-2 grid max-w-5xl gap-2 md:grid-cols-3">
          {progression.daily.missions.map((mission) => {
            const ready = mission.progress >= mission.target && !mission.claimed;
            return (
              <div key={mission.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                <div className="font-semibold text-zinc-100">{mission.label}</div>
                <div className="text-zinc-300">{mission.progress}/{mission.target} · reward +{mission.rewardTickets} 🎟️</div>
                <button
                  onClick={() => claimMission(mission.id)}
                  disabled={!ready}
                  className={`mt-1 rounded px-2 py-1 font-bold ${ready ? 'bg-emerald-400 text-black' : 'bg-zinc-700 text-zinc-300'}`}
                >
                  {mission.claimed ? 'Claimed' : ready ? 'Claim reward' : 'In progress'}
                </button>
              </div>
            );
          })}
        </div>


        <div className="mx-auto mt-2 max-w-5xl rounded-lg border border-white/10 bg-white/5 p-2 text-xs">
          <div className="mb-1 font-semibold text-cyan-200">Friends leaderboard (MVP)</div>
          {friendsBoard.length ? (
            <div className="space-y-1">
              {friendsBoard.slice(0, 5).map((entry, i) => (
                <div key={`${entry.telegramUserId}-${i}`} className="flex items-center justify-between rounded bg-black/30 px-2 py-1">
                  <span>#{i + 1} · {entry.telegramUserId}</span>
                  <span>🏆 {entry.score} · Zone {entry.floor}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-300">No friend scores yet.</div>
          )}
        </div>
        {alerts.length > 0 ? (
          <div className="mx-auto mt-2 flex max-w-5xl flex-col gap-1">
            {alerts.map((msg, i) => (
              <div key={`${msg}-${i}`} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-100">{msg}</div>
            ))}
          </div>
        ) : null}
      </header>

      <main>
        <DieInTheJungle
          onBeforeRestart={canRestartRun}
          onRunEnded={onRunEnded}
          uiPreset={uiPreset}
          fxIntensity={fxIntensity}
          unlockedCharacterIds={progression.unlockedCharacters}
          selectedCompanionId={progression.selectedCompanionId}
          selectedStarterWeaponId={progression.selectedStarterWeaponId}
        />
      </main>
    </div>
  );
}
