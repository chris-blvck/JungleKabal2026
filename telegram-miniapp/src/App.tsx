import React, { useEffect, useMemo, useState } from 'react';
import DieInTheJungle from './game/DieInTheJungle';
import {
  claimMissionReward,
  claimReferralBonus,
  consumeRunTicket,
  loadProgression,
  markMissionShare,
  markRunFinished,
  saveProgression,
  type ProgressionState,
} from './lib/progression';
import { checkMiniappAuth, claimReferral, fetchFriendsLeaderboard, fetchReferralStats, submitRun, trackEvent } from './lib/miniappApi';
import { getStartParam, getTelegramInitData, getTelegramUser, getTelegramWebApp, initTelegramMiniApp } from './telegram';

const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'your_bot_username';

export default function App() {
  const [progression, setProgression] = useState<ProgressionState>(() => loadProgression());
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
    setProgression((prev) => markRunFinished(prev, floor));
    trackEvent('run_end', telegramUserId, { score, floor, runSeed, characterId }, telegramInitData).catch(() => undefined);

    submitRun({
      telegramUserId,
      referralCodeUsed: inboundRef,
      runSeed,
      score,
      floor,
      characterId,
    }, telegramInitData)
      .then(() => {
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

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#ffc300]">Telegram Mini App + Web Mirror</p>
            <h1 className="text-lg font-black">Die In The Jungle</h1>
            <p className="text-xs text-zinc-300">Run tickets: <span className="font-black text-emerald-300">{progression.runTickets}</span> · Referrals: <span className="font-black text-cyan-300">{referralsLabel}</span> · Streak: <span className="font-black text-amber-300">{progression.streak.current}</span> · Auth: <span className={`font-black ${authStatus === 'verified' ? 'text-emerald-300' : authStatus === 'unverified' ? 'text-amber-300' : 'text-zinc-300'}`}>{authStatus}</span></p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {inboundRef ? <span className="rounded-full border border-emerald-400/40 px-3 py-1">Referral entrant: {inboundRef}</span> : null}
            <button onClick={shareInvite} className="rounded-full bg-[#ffc300] px-3 py-1 font-bold text-black hover:bg-[#ffcf3f]">
              Invite & Share
            </button>
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
        <DieInTheJungle onBeforeRestart={canRestartRun} onRunEnded={onRunEnded} />
      </main>
    </div>
  );
}
