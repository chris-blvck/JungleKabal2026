import React, { useEffect, useMemo, useState } from "react";
import compactCourseRaw from "../docs/memecoin-trading-guide-compact.md?raw";
import { parseCompactCourse } from "@/lib/academyParser";
import { loadAcademyContent, loadLeaderboard, subscribeNotifications } from "@/lib/academyApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, Clock3, Crown, Flame, Lock, PlayCircle, Search, Shield, Sparkles, Target, Wallet } from "lucide-react";
import confetti from "canvas-confetti";

const DEFAULT_COVER = "https://i.postimg.cc/jdH0StDF/Chat-GPT-Image-14-mars-2026-16-20-50.png";
const JK_LOGO_FULL = "https://i.postimg.cc/7YwD758t/Logo-JK-Transparent-full.png";
const JK_LOGO_ROUND = "https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png";
const EXPANDED_MODULES_KEY = "jk-academy-expanded-public-v1";
const LAST_LESSON_KEY = "jk-academy-last-lesson-v1";
const DONE_LESSONS_KEY = "jk-academy-done-lessons-v1";


const ultimateRoadmap = [
  { wave: "Wave 1", title: "Live & Replays Hub", status: "done", emoji: "🎥", value: "Rétention + replay value loop" },
  { wave: "Wave 2", title: "Player pro", status: "next", emoji: "⏯️", value: "Chapitres, notes, timestamps" },
  { wave: "Wave 3", title: "XP & badges", status: "in_progress", emoji: "🏆", value: "Engagement dopaminergique" },
  { wave: "Wave 4", title: "Quêtes hebdo", status: "next", emoji: "🧭", value: "Habitudes & progression" },
  { wave: "Wave 5", title: "Review workflow", status: "next", emoji: "🛠️", value: "Draft → Review → Publish" },
  { wave: "Wave 6", title: "Analytics valeur", status: "next", emoji: "📈", value: "Dropoff, completion, conversion" },
  { wave: "Wave 7", title: "Token gate", status: "next", emoji: "🔐", value: "Entitlements par pack" },
  { wave: "Wave 8", title: "Telegram Mini App", status: "next", emoji: "📲", value: "UX native in-chat" },
  { wave: "Wave 9", title: "AI Coach", status: "vision", emoji: "🤖", value: "Aide contextuelle en live" },
  { wave: "Wave 10", title: "Battle pass saisonnier", status: "vision", emoji: "🎮", value: "Récompenses premium + challenge squads" },
  { wave: "Wave 11", title: "Signals room", status: "vision", emoji: "📡", value: "Bridge academy → war room en temps réel" },
  { wave: "Wave 12", title: "Creator economy", status: "vision", emoji: "🧱", value: "Packs white-label par coach" },
  { wave: "Wave 13", title: "Learning squad battles", status: "vision", emoji: "⚔️", value: "Compétition gamifiée entre équipes" },
  { wave: "Wave 14", title: "Smart notification engine", status: "next", emoji: "🔔", value: "Nudges personnalisés par progression" },
  { wave: "Wave 15", title: "Portfolio impact tracker", status: "vision", emoji: "📊", value: "Relier formation et résultats trading" },
];

const roadmapStatusStyles = {
  done: "bg-emerald-400/20 text-emerald-200 border-emerald-300/30",
  in_progress: "bg-amber-400/20 text-amber-200 border-amber-300/30",
  next: "bg-sky-400/20 text-sky-200 border-sky-300/30",
  vision: "bg-fuchsia-400/20 text-fuchsia-200 border-fuchsia-300/30",
};

const roadmapProgress = { done: 100, in_progress: 60, next: 25, vision: 10 };

const masterUpdateList = [
  {
    lane: "Growth engine",
    color: "amber",
    updates: [
      { item: "Daily quests évolutives (3 niveaux)", status: "in_progress", impact: "↑ rétention quotidienne" },
      { item: "Battle pass saisonnier par pack", status: "next", impact: "↑ valeur perçue + upsell" },
      { item: "Referral loops depuis Telegram", status: "vision", impact: "↑ acquisition organique" },
    ],
  },
  {
    lane: "Learning quality",
    color: "sky",
    updates: [
      { item: "Recommandation Next Best Lesson", status: "done", impact: "↑ completion" },
      { item: "Player chapters + notes timestampées", status: "next", impact: "↑ compréhension" },
      { item: "Score de valeur personnalisé", status: "in_progress", impact: "↑ motivation" },
    ],
  },
  {
    lane: "Monetization",
    color: "fuchsia",
    updates: [
      { item: "Entitlements par pack (token gate)", status: "next", impact: "↑ revenu pack" },
      { item: "Paywall premium replays", status: "vision", impact: "↑ conversion" },
      { item: "Creator packs white-label", status: "vision", impact: "↑ B2B / partnerships" },
    ],
  },
  {
    lane: "Ops/admin",
    color: "emerald",
    updates: [
      { item: "Studio upload simplifié", status: "done", impact: "↑ vélocité production" },
      { item: "Auto-translate multi-langue", status: "in_progress", impact: "↑ portée globale" },
      { item: "Checklist qualité avant publish", status: "next", impact: "↓ erreurs de release" },
    ],
  },
];

const defaultWeeklyLeaderboard = [
  { rank: 1, name: "Rex", points: 1420, streak: 12 },
  { rank: 2, name: "Mina", points: 1360, streak: 10 },
  { rank: 3, name: "Kuro", points: 1210, streak: 8 },
  { rank: 4, name: "Nova", points: 980, streak: 6 },
];

const seasonPassTiers = [
  { tier: "Bronze", min: 0 },
  { tier: "Silver", min: 800 },
  { tier: "Gold", min: 1600 },
  { tier: "Legend", min: 2600 },
];

const defaultPackTemplates = [
  { id: "pack-beta-season", title: "KKM Beta Season", description: "Onboarding public + fondamentaux memecoin.", audience: "public", accessType: "open", priceLabel: "Inclus", coverImage: DEFAULT_COVER, workflowStatus: "published" },
  { id: "pack-alpha-pro", title: "KKM Alpha Pro", description: "Setups avancés et exécution disciplinée.", audience: "public", accessType: "token-gated", priceLabel: "Token pass requis", coverImage: DEFAULT_COVER, workflowStatus: "published" },
  { id: "pack-agent-lab", title: "KKM Agent Lab", description: "Création de formations par team/agents.", audience: "team", accessType: "token-gated", priceLabel: "Accès team", coverImage: DEFAULT_COVER, workflowStatus: "published" },
];

function getPacks(content) {
  if (Array.isArray(content?.packs) && content.packs.length) return content.packs;
  const allModuleIds = (content?.modules || []).map((module) => module.id);
  return defaultPackTemplates.map((pack, index) => ({
    ...pack,
    moduleIds: index === 0 ? allModuleIds : allModuleIds.slice(0, Math.max(1, Math.ceil(allModuleIds.length / 2))),
  }));
}


function getLiveReplays(content) {
  if (Array.isArray(content?.liveReplays) && content.liveReplays.length) return content.liveReplays;
  return [
    { id: "replay-1", title: "Live Scalping Session #01", coach: "Rex", date: "2026-03-10", duration: "58 min", url: "", packId: "pack-beta-season" },
    { id: "replay-2", title: "Macro + Meme Rotation", coach: "Mina", date: "2026-03-12", duration: "72 min", url: "", packId: "pack-alpha-pro" },
  ];
}

function MobileTabs({ tab, setTab }) {
  const tabs = [["learn", "Cours", BookOpen], ["progress", "Suivi", Target], ["tools", "Outils", Wallet]];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 p-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
        {tabs.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`rounded-2xl px-3 py-2 text-xs font-semibold ${tab === key ? "bg-amber-400 text-black" : "bg-white/5 text-zinc-200"}`}>
            <Icon className="mx-auto mb-1 h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KabalAcademyMVP() {
  const seed = useMemo(() => parseCompactCourse(compactCourseRaw), []);
  const [academy, setAcademy] = useState(seed);
  const [started, setStarted] = useState(false);
  const [username, setUsername] = useState("Rex");
  const [tab, setTab] = useState("learn");
  const [selectedPackId, setSelectedPackId] = useState("pack-beta-season");
  const [moduleId, setModuleId] = useState(seed.modules[0]?.id || "");
  const [lessonId, setLessonId] = useState(seed.modules[0]?.lessons[0]?.id || "");
  const [doneByLesson, setDoneByLesson] = useState({});
  const [search, setSearch] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({});
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [lastLessonByPack, setLastLessonByPack] = useState({});
  const [celebrationMessage, setCelebrationMessage] = useState("");
  const [leaderboard, setLeaderboard] = useState(defaultWeeklyLeaderboard);
  const [notifChannel, setNotifChannel] = useState("telegram");
  const [notifContact, setNotifContact] = useState("");
  const [notifStatus, setNotifStatus] = useState("");

  useEffect(() => {
    try {
      const rawExpanded = localStorage.getItem(EXPANDED_MODULES_KEY);
      if (rawExpanded) {
        const ids = JSON.parse(rawExpanded);
        if (Array.isArray(ids)) setExpandedModules(new Set(ids));
      }
      const rawLastLesson = localStorage.getItem(LAST_LESSON_KEY);
      if (rawLastLesson) {
        const parsed = JSON.parse(rawLastLesson);
        if (parsed && typeof parsed === "object") setLastLessonByPack(parsed);
      }
      const rawDone = localStorage.getItem(DONE_LESSONS_KEY);
      if (rawDone) {
        const parsedDone = JSON.parse(rawDone);
        if (parsedDone && typeof parsedDone === "object") setDoneByLesson(parsedDone);
      }
    } catch {
      setExpandedModules(new Set());
      setLastLessonByPack({});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(EXPANDED_MODULES_KEY, JSON.stringify(Array.from(expandedModules)));
  }, [expandedModules]);

  useEffect(() => {
    localStorage.setItem(LAST_LESSON_KEY, JSON.stringify(lastLessonByPack));
  }, [lastLessonByPack]);

  useEffect(() => {
    localStorage.setItem(DONE_LESSONS_KEY, JSON.stringify(doneByLesson));
  }, [doneByLesson]);

  useEffect(() => {
    loadAcademyContent(seed).then((content) => {
      setAcademy(content);
      const allPacks = getPacks(content);
      const publishedPacks = allPacks.filter((pack) => pack.workflowStatus !== "draft");
      const eligiblePacks = publishedPacks.length ? publishedPacks : allPacks;
      const defaultPack = eligiblePacks[0];
      setSelectedPackId(defaultPack?.id || "pack-beta-season");

      const firstModuleId = defaultPack?.moduleIds?.[0] || content.modules[0]?.id || "";
      const firstModule = content.modules.find((module) => module.id === firstModuleId) || content.modules[0];
      setModuleId(firstModule?.id || "");
      setLessonId(firstModule?.lessons?.[0]?.id || "");
    });
  }, [seed]);

  useEffect(() => {
    loadLeaderboard().then((rows) => {
      if (Array.isArray(rows) && rows.length) setLeaderboard(rows);
    });
  }, []);

  const allPacks = useMemo(() => getPacks(academy), [academy]);
  const packs = useMemo(() => {
    const published = allPacks.filter((pack) => pack.workflowStatus !== "draft");
    return published.length ? published : allPacks;
  }, [allPacks]);

  const selectedPack = useMemo(() => packs.find((pack) => pack.id === selectedPackId) || packs[0], [packs, selectedPackId]);
  const liveReplays = useMemo(() => getLiveReplays(academy).filter((replay) => !replay.packId || replay.packId === selectedPackId), [academy, selectedPackId]);

  const visibleModules = useMemo(() => {
    if (!selectedPack?.moduleIds?.length) return academy.modules;
    return academy.modules.filter((module) => selectedPack.moduleIds.includes(module.id));
  }, [academy.modules, selectedPack]);

  const lessonIndex = useMemo(
    () => visibleModules.flatMap((module) => module.lessons.map((lesson) => ({ moduleId: module.id, moduleTitle: module.title, ...lesson, searchText: `${module.title} ${lesson.title} ${lesson.content || ""}`.toLowerCase() }))),
    [visibleModules],
  );

  useEffect(() => {
    if (!visibleModules.length) return;
    const stillVisible = visibleModules.some((module) => module.id === moduleId && module.lessons.some((lesson) => lesson.id === lessonId));
    if (!stillVisible) {
      setModuleId(visibleModules[0].id);
      setLessonId(visibleModules[0]?.lessons?.[0]?.id || "");
    }
  }, [visibleModules, moduleId, lessonId]);

  useEffect(() => {
    if (!selectedPack?.id || !lessonId) return;
    setLastLessonByPack((prev) => ({ ...prev, [selectedPack.id]: lessonId }));
  }, [selectedPack?.id, lessonId]);

  const activeModule = visibleModules.find((module) => module.id === moduleId) || visibleModules[0];
  const activeLesson = activeModule?.lessons.find((lesson) => lesson.id === lessonId) || activeModule?.lessons[0];

  const totalLessons = lessonIndex.length || 1;
  const doneCount = lessonIndex.filter((lesson) => doneByLesson[lesson.id]).length;
  const percent = Math.round((doneCount / totalLessons) * 100);
  const xp = doneCount * 120;
  const level = Math.max(1, Math.floor(xp / 500) + 1);
  const streak = Math.min(30, Math.max(0, Math.floor(doneCount / 2)));
  const valueScore = xp + streak * 35 + percent * 10;

  const nextRecommendedLesson = useMemo(() => lessonIndex.find((lesson) => !doneByLesson[lesson.id]), [lessonIndex, doneByLesson]);

  const questCards = useMemo(() => ([
    { id: "quest-1", title: "Valider 1 leçon aujourd'hui", progress: Math.min(doneCount, 1), target: 1, reward: "+120 XP" },
    { id: "quest-2", title: "Monter une série", progress: Math.min(streak, 7), target: 7, reward: "Shield de streak" },
    { id: "quest-3", title: "Finir le pack", progress: doneCount, target: totalLessons, reward: "Badge Pack Master" },
  ]), [doneCount, streak, totalLessons]);

  const nextLevelXP = level * 500;
  const xpToNextLevel = Math.max(0, nextLevelXP - xp);
  const completionLabel = doneCount >= totalLessons ? "Pack terminé" : `${totalLessons - doneCount} leçons restantes`;
  const seasonTier = [...seasonPassTiers].reverse().find((tier) => xp >= tier.min) || seasonPassTiers[0];



  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const wallet = url.searchParams.get('wallet') || '';
    const tg = url.searchParams.get('tgUserId') || '';
    if (wallet) setAccessWallet(wallet);
    if (tg) setAccessTelegramId(tg);
  }, []);

  async function refreshAcademyAccess(overrideWallet = accessWallet, overrideTelegramId = accessTelegramId) {
    if (!API_BASE || (!overrideWallet && !overrideTelegramId)) {
      setHasAcademyAccess(false);
      return;
    }
    setAccessLoading(true);
    try {
      const query = new URLSearchParams();
      if (overrideWallet) query.set('wallet', overrideWallet);
      if (overrideTelegramId) query.set('telegramId', overrideTelegramId);
      const response = await fetch(`${API_BASE}/api/access/list?${query.toString()}`);
      const payload = await response.json();
      const entitlements = payload.entitlements || [];
      const unlocked = entitlements.some((entry) => {
        const app = (entry?.product?.app || 'academy').toLowerCase();
        return app === 'academy';
      });
      setHasAcademyAccess(unlocked);
    } catch {
      setHasAcademyAccess(false);
    } finally {
      setAccessLoading(false);
    }
  }

  useEffect(() => {
    refreshAcademyAccess();
  }, [accessWallet, accessTelegramId]);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return lessonIndex.filter((lesson) => lesson.searchText.includes(query)).slice(0, 8);
  }, [search, lessonIndex]);

  const goToLesson = (nextModuleId, nextLessonId) => {
    setModuleId(nextModuleId);
    setLessonId(nextLessonId);
    setExpandedModules((prev) => new Set([...prev, nextModuleId]));
  };

  const resumeLearning = () => {
    const lastId = selectedPack?.id ? lastLessonByPack[selectedPack.id] : undefined;
    if (!lastId) return;
    const found = lessonIndex.find((lesson) => lesson.id === lastId);
    if (!found) return;
    goToLesson(found.moduleId, found.id);
  };

  const toggleModule = (targetModuleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(targetModuleId)) next.delete(targetModuleId);
      else next.add(targetModuleId);
      return next;
    });
  };

  const expandAllModules = () => setExpandedModules(new Set(visibleModules.map((module) => module.id)));
  const collapseAllModules = () => setExpandedModules(new Set());

  const fireLessonConfetti = () => {
    confetti({ particleCount: 70, spread: 75, origin: { y: 0.7 }, zIndex: 2000 });
    confetti({ particleCount: 45, spread: 110, angle: 60, origin: { x: 0 } });
    confetti({ particleCount: 45, spread: 110, angle: 120, origin: { x: 1 } });
  };

  const markLessonCompletion = (targetLessonId, isDone) => {
    const wasDone = Boolean(doneByLesson[targetLessonId]);
    setDoneByLesson((prev) => ({ ...prev, [targetLessonId]: isDone }));
    if (!wasDone && isDone) {
      fireLessonConfetti();
      setCelebrationMessage("🔥 Leçon validée ! Excellent momentum.");
      window.setTimeout(() => setCelebrationMessage(""), 2400);
    }
  };

  const handleNotificationSubscribe = async () => {
    if (!notifContact.trim()) return;
    const result = await subscribeNotifications({ channel: notifChannel, contact: notifContact.trim() });
    setNotifStatus(result?.ok ? "✅ Alerte activée" : "⚠️ Impossible d'activer");
    if (result?.ok) setNotifContact("");
    window.setTimeout(() => setNotifStatus(""), 2200);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-[#090909] text-white">
        <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-6 px-4 py-8 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-300"><Sparkles className="h-4 w-4" />UX optimisée · mobile + web</div>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Academy memecoins</h1>
            <p className="mt-4 text-zinc-300">Packs de formation, progression visuelle et structure prête pour le token-gating Telegram.</p>
          </div>
          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-white/10 to-white/5 shadow-[0_0_40px_rgba(245,158,11,0.08)]">
            <CardHeader><CardTitle>Accéder à l'Academy</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ton pseudo" className="h-12 rounded-2xl border-white/10 bg-black/30" />
              <button onClick={() => setStarted(true)} className="h-12 w-full rounded-2xl bg-amber-400 text-black">Commencer</button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#231f10_0%,_#090909_42%)] pb-24 text-white lg:pb-8">
      <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 left-1/3 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:py-7">
        <Card className="relative overflow-hidden rounded-3xl border-amber-300/30 bg-gradient-to-br from-amber-300/15 via-white/5 to-black/50 shadow-[0_0_60px_rgba(245,158,11,0.16)]">
          <CardContent className="space-y-4 p-5 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-amber-300/70 before:to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-400"><img src={JK_LOGO_ROUND} alt="JK" className="h-5 w-5 rounded-full opacity-85" />Jungle Kabal Academy</div>
                <h2 className="text-2xl font-black">Bienvenue {username}</h2>
                <p className="text-sm text-zinc-400">Quand l'admin publie un pack, il est mis à jour pour tous les utilisateurs concernés.</p>
              </div>
              <div className="w-full min-w-[220px] md:max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm text-zinc-300"><span>{doneCount}/{totalLessons} leçons validées</span><span>{percent}%</span></div>
                <Progress value={percent} className="h-2.5 bg-zinc-800" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={resumeLearning} disabled={!selectedPack?.id || !lastLessonByPack[selectedPack.id]} className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-40">Reprendre où tu t'es arrêté</button>
              {selectedPack?.workflowStatus === "draft" && <span className="rounded-xl border border-orange-300/30 bg-orange-400/10 px-3 py-1.5 text-xs text-orange-200">Pack brouillon (visible car aucun publié)</span>}
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="rounded-2xl border border-amber-300/25 bg-gradient-to-br from-amber-200/15 to-black/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-200"><Flame className="h-4 w-4" /><p className="text-sm font-semibold">Next best move</p></div>
                {nextRecommendedLesson ? <>
                  <p className="text-sm text-zinc-300">Prochaine leçon recommandée pour garder ton momentum :</p>
                  <p className="mt-1 font-semibold">{nextRecommendedLesson.title}</p>
                  <button onClick={() => goToLesson(nextRecommendedLesson.moduleId, nextRecommendedLesson.id)} className="mt-3 rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">Lancer maintenant</button>
                </> : <p className="text-sm text-emerald-200">Pack terminé ✅ Tu peux passer sur les replays/live.</p>}
              </div>
              <div className="rounded-2xl border border-fuchsia-300/25 bg-gradient-to-br from-fuchsia-400/15 to-black/40 p-4">
                <div className="mb-2 flex items-center gap-2 text-fuchsia-200"><Shield className="h-4 w-4" /><p className="text-sm font-semibold">Value score</p></div>
                <p className="text-3xl font-black">{valueScore}</p>
                <p className="text-xs text-zinc-300">Combine XP, streak et progression pour suivre la vraie valeur gagnée.</p>
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-3">
              {questCards.map((quest) => {
                const pct = Math.round((quest.progress / Math.max(1, quest.target)) * 100);
                const done = quest.progress >= quest.target;
                return <div key={quest.id} className={`rounded-xl border p-3 ${done ? "border-emerald-300/40 bg-emerald-400/10" : "border-sky-300/30 bg-sky-400/10"}`}>
                  <p className="text-xs font-semibold">{quest.title}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10"><div className={`h-full rounded-full ${done ? "bg-emerald-300" : "bg-sky-300"}`} style={{ width: `${pct}%` }} /></div>
                  <p className="mt-1 text-[11px] text-zinc-300">{quest.progress}/{quest.target} · Reward: {quest.reward}</p>
                </div>;
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {packs.map((pack) => {
                const isSelected = pack.id === selectedPack?.id;
                return (
                  <button
                    key={pack.id}
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      const nextModule = academy.modules.find((module) => pack.moduleIds?.includes(module.id)) || academy.modules[0];
                      setModuleId(nextModule?.id || "");
                      setLessonId(nextModule?.lessons?.[0]?.id || "");
                    }}
                    className={`group overflow-hidden rounded-2xl border text-left transition duration-300 ${isSelected ? "-translate-y-0.5 border-amber-400/70 bg-gradient-to-br from-amber-300/20 to-black/50 shadow-[0_0_26px_rgba(251,191,36,0.2)]" : "border-white/10 bg-black/30 hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-amber-300/5"}`}
                  >
                    <img src={pack.coverImage || DEFAULT_COVER} alt={pack.title} className="h-32 w-full object-cover" />
                    <div className="p-4"><img src={JK_LOGO_FULL} alt="Jungle Kabal" className="mb-2 h-4 w-auto opacity-70" />
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-semibold">{pack.title}</p>
                        {pack.accessType === "token-gated" ? <Lock className="h-4 w-4 text-amber-300" /> : <Crown className="h-4 w-4 text-emerald-300" />}
                      </div>
                      <p className="text-xs text-zinc-400">{pack.description}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-wide text-zinc-500">{pack.workflowStatus || "published"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{pack.priceLabel || "Bientôt"}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {!!celebrationMessage && <div className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.2)]">{celebrationMessage}</div>}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40"><CardContent className="flex items-center gap-3 p-4"><BookOpen className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Modules</p><p className="text-xl font-black">{visibleModules.length}</p></div></CardContent></Card>
          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40"><CardContent className="flex items-center gap-3 p-4"><Clock3 className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Leçons</p><p className="text-xl font-black">{totalLessons}</p></div></CardContent></Card>
          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Pack actif</p><p className="text-xl font-black">{selectedPack?.title || "-"}</p></div></CardContent></Card>
          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40"><CardContent className="flex items-center gap-3 p-4"><Sparkles className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">XP</p><p className="text-xl font-black">{xp}</p></div></CardContent></Card>
          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40"><CardContent className="flex items-center gap-3 p-4"><Target className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Level / Streak</p><p className="text-xl font-black">L{level} · {streak}j</p></div></CardContent></Card>
        </div>

        <Card className="rounded-3xl border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-400/10 via-amber-300/10 to-black/40">
          <CardContent className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="font-semibold text-fuchsia-200">Progression vers niveau suivant</p>
              <p className="text-zinc-300">{completionLabel}</p>
            </div>
            <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 via-amber-300 to-sky-300" style={{ width: `${Math.min(100, Math.round((xp / Math.max(1, nextLevelXP)) * 100))}%` }} /></div>
            <p className="text-xs text-zinc-300">Encore {xpToNextLevel} XP pour atteindre L{level + 1}.</p>
          </CardContent>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="rounded-3xl border-sky-300/20 bg-gradient-to-br from-sky-400/10 to-black/40">
            <CardHeader><CardTitle>🏁 Season pass</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-zinc-300">Tier actuel: <span className="font-semibold text-sky-200">{seasonTier.tier}</span></p>
              <div className="grid gap-2 sm:grid-cols-4">{seasonPassTiers.map((tier) => <div key={tier.tier} className={`rounded-lg border px-2 py-1 text-xs ${xp >= tier.min ? "border-sky-300/40 bg-sky-400/10 text-sky-200" : "border-white/10 bg-black/20 text-zinc-500"}`}>{tier.tier}<p className="text-[10px]">{tier.min}+ XP</p></div>)}</div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-400/10 to-black/40">
            <CardHeader><CardTitle>🏆 Weekly leaderboard</CardTitle></CardHeader>
            <CardContent className="space-y-2">{leaderboard.map((entry) => <div key={entry.rank} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm"><p>#{entry.rank} {entry.name}</p><p className="text-xs text-zinc-300">{entry.points} pts · {entry.streak}j</p></div>)}</CardContent>
          </Card>

          <Card className="rounded-3xl border-emerald-300/20 bg-gradient-to-br from-emerald-400/10 to-black/40">
            <CardHeader><CardTitle>🔔 Smart notifications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-zinc-300">Active les rappels auto pour revenir sur tes leçons/replays.</p>
              <div className="grid gap-2 sm:grid-cols-[130px_minmax(0,1fr)_auto]">
                <select value={notifChannel} onChange={(e) => setNotifChannel(e.target.value)} className="h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"><option value="telegram">Telegram</option><option value="email">Email</option></select>
                <Input value={notifContact} onChange={(e) => setNotifContact(e.target.value)} placeholder={notifChannel === "telegram" ? "@username" : "email@domain.com"} />
                <button onClick={handleNotificationSubscribe} className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-3 text-xs text-emerald-200">Activer</button>
              </div>
              {!!notifStatus && <p className="text-xs text-emerald-200">{notifStatus}</p>}
            </CardContent>
          </Card>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5">
            <Search className="h-4 w-4 text-amber-300" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une leçon" className="border-0 bg-transparent p-0 text-white placeholder:text-zinc-500 focus-visible:ring-0" />
          </div>
          {!!search && <div className="mt-2 space-y-2">{results.map((lesson) => <button key={lesson.id} onClick={() => { goToLesson(lesson.moduleId, lesson.id); setSearch(""); }} className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-left"><p className="text-sm font-semibold">{lesson.title}</p><p className="text-xs text-zinc-400">{lesson.moduleTitle}</p></button>)}</div>}
        </div>

        {tab === "learn" && <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Parcours</CardTitle>
                <div className="flex gap-2">
                  <button onClick={expandAllModules} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300">Tout déplier</button>
                  <button onClick={collapseAllModules} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300">Tout replier</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {visibleModules.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                return (
                  <div key={module.id} className={`rounded-2xl border p-3 ${module.id === moduleId ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-black/30"}`}>
                    <button onClick={() => { setModuleId(module.id); setLessonId(module.lessons[0]?.id || ""); toggleModule(module.id); }} className="flex w-full items-start justify-between gap-2 text-left">
                      <div><p className="font-semibold">{module.title}</p><p className="text-xs text-zinc-400">{module.description}</p></div>
                      <span className="text-xs text-zinc-400">{isExpanded ? "−" : "+"}</span>
                    </button>
                    {isExpanded && <div className="mt-2 space-y-1.5">{module.lessons.map((lesson) => <button key={lesson.id} onClick={() => goToLesson(module.id, lesson.id)} className={`flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm ${lesson.id === lessonId ? "bg-white/10" : "bg-black/20"}`}><span className="truncate pr-2">{lesson.title}</span><input type="checkbox" checked={Boolean(doneByLesson[lesson.id])} onChange={(e) => { e.stopPropagation(); markLessonCompletion(lesson.id, e.target.checked); }} className="h-4 w-4 accent-amber-400" /></button>)}</div>}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader><div className="flex items-center justify-between"><CardTitle>{activeLesson?.title}</CardTitle><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{activeLesson?.duration || "7 min"}</span></div></CardHeader>
            <CardContent className="space-y-4"><div className="rounded-xl border border-dashed border-white/20 bg-black/30 p-4"><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs text-amber-300"><PlayCircle className="h-4 w-4" /> Placeholder vidéo</div><div className="grid aspect-video place-content-center rounded-xl border border-white/10 bg-zinc-900 text-sm text-zinc-400">video slot</div></div>
              <div className="whitespace-pre-line rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200">{activeLesson?.content}</div>
              {(activeLesson?.blocks || []).map((block) => <div key={block.id} className="rounded-xl border border-white/10 bg-black/30 p-4">{(block.type === "text" || block.type === "gamified") && <p className="whitespace-pre-line text-sm text-zinc-200">{block.content}</p>}{block.type === "image" && block.content && <img src={block.content} alt="lesson" className="w-full rounded-lg border border-white/10" />}{block.type === "video" && block.content && <iframe title={block.id} src={block.content} className="aspect-video w-full rounded-lg border border-white/10" allow="autoplay; encrypted-media" allowFullScreen />}{block.type === "audio" && block.content && <audio controls preload="metadata" src={block.content} className="w-full" />}{block.type === "quiz" && <div className="space-y-2"><p className="font-semibold">{block.content}</p>{(block.options || []).map((option, index) => <button key={`${block.id}-${index}`} onClick={() => setQuizAnswers((prev) => ({ ...prev, [block.id]: index }))} className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${(quizAnswers[block.id] ?? -1) === index ? "border-amber-400/60 bg-amber-400/10" : "border-white/10"}`}>{option}</button>)}{quizAnswers[block.id] !== undefined && <p className="text-xs text-zinc-400">{quizAnswers[block.id] === (block.answer || 0) ? "✅ Bonne réponse" : "❌ Mauvaise réponse"}</p>}</div>}</div>)}
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm"><input type="checkbox" checked={Boolean(doneByLesson[activeLesson?.id])} onChange={(e) => markLessonCompletion(activeLesson.id, e.target.checked)} className="h-4 w-4 accent-amber-400" />J'ai fini cette leçon</label>
            </CardContent>
          </Card>
        </div>}

        {tab === "progress" && <Card className="rounded-3xl border-white/10 bg-white/5"><CardHeader><CardTitle>Suivi</CardTitle></CardHeader><CardContent className="space-y-3">{visibleModules.map((module) => { const done = module.lessons.filter((lesson) => doneByLesson[lesson.id]).length; const moduleProgress = Math.round((done / (module.lessons.length || 1)) * 100); return <div key={module.id} className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="mb-2 flex items-center justify-between text-sm"><span>{module.title}</span><span>{done}/{module.lessons.length}</span></div><Progress value={moduleProgress} className="h-2 bg-zinc-800" /></div>; })}<div className="grid gap-2 sm:grid-cols-3 pt-2">{[
          { key: "starter", title: "Starter", unlocked: doneCount >= 1 },
          { key: "streak", title: "Momentum", unlocked: streak >= 3 },
          { key: "master", title: "Pack Master", unlocked: percent >= 80 },
        ].map((badge) => <div key={badge.key} className={`rounded-xl border px-3 py-2 text-xs ${badge.unlocked ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-black/20 text-zinc-500"}`}>{badge.unlocked ? "🏆" : "🔒"} {badge.title}</div>)}</div></CardContent></Card>}
        {tab === "tools" && <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
            { title: "Risk", desc: "Garde-fous de capital et sizing.", emoji: "🛡️" },
            { title: "Journal", desc: "Notes et feedbacks post-trade.", emoji: "📓" },
            { title: "Conviction", desc: "Framework de décision.", emoji: "🧠" },
            { title: "Mini App TG", desc: "Compat mobile, intégration Telegram à finaliser.", emoji: "📲" },
          ].map((item) => <Card key={item.title} className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40 transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:shadow-[0_0_25px_rgba(251,191,36,0.15)]"><CardContent className="p-4"><div className="mb-2 flex items-center gap-2"><span>{item.emoji}</span><img src={JK_LOGO_ROUND} alt="JK" className="h-4 w-4 rounded-full opacity-70" /><p className="font-semibold">{item.title}</p></div><p className="text-xs text-zinc-300">{item.desc}</p></CardContent></Card>)}</div>

          <Card className="rounded-3xl border-amber-300/20 bg-gradient-to-br from-amber-400/10 to-black/30">
            <CardHeader><CardTitle className="flex items-center gap-2"><PlayCircle className="h-4 w-4 text-amber-300" />Live & Replays</CardTitle></CardHeader>
            <CardContent className="space-y-2">{liveReplays.length === 0 ? <p className="text-sm text-zinc-400">Aucun replay disponible pour ce pack.</p> : liveReplays.map((replay) => <div key={replay.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{replay.title}</p><span className="text-xs text-zinc-400">{replay.duration}</span></div><p className="text-xs text-zinc-400">{replay.coach} · {replay.date}</p>{replay.url ? <a href={replay.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-amber-300 underline">Voir le replay</a> : <p className="mt-2 text-xs text-zinc-500">URL replay à connecter</p>}</div>)}</CardContent>
          </Card>

          <Card className="rounded-3xl border-amber-300/30 bg-gradient-to-br from-amber-300/15 via-amber-100/5 to-black/40 shadow-[0_0_30px_rgba(251,191,36,0.12)]">
            <CardHeader><CardTitle>🚀 Ultimate roadmap</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{ultimateRoadmap.map((item) => <div key={item.wave} className="rounded-xl border border-amber-200/20 bg-black/25 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-amber-300/40 hover:shadow-[0_0_20px_rgba(251,191,36,0.14)]"><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs text-zinc-300">{item.wave}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${roadmapStatusStyles[item.status] || "bg-white/10 text-zinc-300 border-white/10"}`}>{item.status}</span></div><p className="font-semibold">{item.emoji} {item.title}</p><p className="mt-1 text-xs text-zinc-400">{item.value}</p><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-yellow-400" style={{ width: `${roadmapProgress[item.status] || 15}%` }} /></div></div>)}</CardContent>
          </Card>

          <Card className="rounded-3xl border-sky-300/20 bg-gradient-to-br from-sky-400/10 via-fuchsia-400/10 to-black/40">
            <CardHeader><CardTitle>🧠 Master list updates (execution board)</CardTitle></CardHeader>
            <CardContent className="grid gap-3 lg:grid-cols-2">
              {masterUpdateList.map((lane) => <div key={lane.lane} className="rounded-xl border border-white/10 bg-black/25 p-3"><p className="mb-2 font-semibold">{lane.lane}</p><div className="space-y-2">{lane.updates.map((update) => <div key={update.item} className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5"><div className="flex items-center justify-between gap-2"><p className="text-xs text-zinc-200">{update.item}</p><span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${update.status === "done" ? "bg-emerald-400/20 text-emerald-200" : update.status === "in_progress" ? "bg-amber-400/20 text-amber-200" : update.status === "next" ? "bg-sky-400/20 text-sky-200" : "bg-fuchsia-400/20 text-fuchsia-200"}`}>{update.status}</span></div><p className="text-[11px] text-zinc-400">Impact: {update.impact}</p></div>)}</div></div>)}
            </CardContent>
          </Card>
        </div>}
      </div>
      <MobileTabs tab={tab} setTab={setTab} />
    </div>
  );
}
