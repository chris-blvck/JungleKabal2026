import React, { useEffect, useMemo, useState } from "react";
import compactCourseRaw from "../docs/memecoin-trading-guide-compact.md?raw";
import { parseCompactCourse } from "@/lib/academyParser";
import { loadAcademyContent } from "@/lib/academyApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, Clock3, Crown, Lock, PlayCircle, Search, Sparkles, Target, Wallet } from "lucide-react";

function getPacks(content) {
  if (Array.isArray(content?.packs) && content.packs.length) {
    return content.packs;
  }

  return [{
    id: "pack-core",
    title: "Core Academy",
    description: "Base commune pour toute l'équipe.",
    moduleIds: (content?.modules || []).map((module) => module.id),
    audience: "public",
    accessType: "open",
    priceLabel: "Inclus",
  }];
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
  const [selectedPackId, setSelectedPackId] = useState("pack-core");
  const [moduleId, setModuleId] = useState(seed.modules[0]?.id || "");
  const [lessonId, setLessonId] = useState(seed.modules[0]?.lessons[0]?.id || "");
  const [doneByLesson, setDoneByLesson] = useState({});
  const [search, setSearch] = useState("");
  const [quizAnswers, setQuizAnswers] = useState({});

  useEffect(() => {
    loadAcademyContent(seed).then((content) => {
      setAcademy(content);
      const packs = getPacks(content);
      const defaultPack = packs[0];
      setSelectedPackId(defaultPack?.id || "pack-core");

      const firstModuleId = defaultPack?.moduleIds?.[0] || content.modules[0]?.id || "";
      const firstModule = content.modules.find((module) => module.id === firstModuleId) || content.modules[0];
      setModuleId(firstModule?.id || "");
      setLessonId(firstModule?.lessons?.[0]?.id || "");
    });
  }, [seed]);

  const packs = useMemo(() => getPacks(academy), [academy]);
  const selectedPack = useMemo(() => packs.find((pack) => pack.id === selectedPackId) || packs[0], [packs, selectedPackId]);

  const visibleModules = useMemo(() => {
    if (!selectedPack?.moduleIds?.length) {
      return academy.modules;
    }

    return academy.modules.filter((module) => selectedPack.moduleIds.includes(module.id));
  }, [academy.modules, selectedPack]);

  useEffect(() => {
    if (!visibleModules.length) return;
    const hasActiveModule = visibleModules.some((module) => module.id === moduleId);
    if (!hasActiveModule) {
      setModuleId(visibleModules[0].id);
      setLessonId(visibleModules[0]?.lessons?.[0]?.id || "");
    }
  }, [visibleModules, moduleId]);

  const lessonIndex = useMemo(
    () => visibleModules.flatMap((module) => module.lessons.map((lesson) => ({ moduleId: module.id, moduleTitle: module.title, ...lesson, searchText: `${module.title} ${lesson.title} ${lesson.content || ""}`.toLowerCase() }))),
    [visibleModules],
  );

  const activeModule = visibleModules.find((module) => module.id === moduleId) || visibleModules[0];
  const activeLesson = activeModule?.lessons.find((lesson) => lesson.id === lessonId) || activeModule?.lessons[0];

  const totalLessons = lessonIndex.length || 1;
  const doneCount = lessonIndex.filter((lesson) => doneByLesson[lesson.id]).length;
  const percent = Math.round((doneCount / totalLessons) * 100);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return lessonIndex.filter((lesson) => lesson.searchText.includes(query)).slice(0, 8);
  }, [search, lessonIndex]);

  if (!started) {
    return (
      <div className="min-h-screen bg-[#090909] text-white">
        <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-6 px-4 py-8 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-300">
              <Sparkles className="h-4 w-4" />
              UX optimisée · mobile + web
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Academy memecoins</h1>
            <p className="mt-4 text-zinc-300">Packs de formation, progression visuelle et structure prête pour le token-gating.</p>
          </div>
          <Card className="rounded-3xl border-white/10 bg-white/5">
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
    <div className="min-h-screen bg-[#090909] pb-24 text-white lg:pb-8">
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:py-7">
        <Card className="rounded-3xl border-white/10 bg-white/5">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Jungle Kabal Academy</div>
                <h2 className="text-2xl font-black">Bienvenue {username}</h2>
                <p className="text-sm text-zinc-400">Une fois publié par l'admin, c'est visible pour tout le monde sur ce pack.</p>
              </div>
              <div className="w-full min-w-[220px] md:max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm text-zinc-300"><span>{doneCount}/{totalLessons} leçons validées</span><span>{percent}%</span></div>
                <Progress value={percent} className="h-2.5 bg-zinc-800" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    className={`rounded-2xl border p-4 text-left transition ${isSelected ? "border-amber-400/60 bg-amber-400/10" : "border-white/10 bg-black/30 hover:border-white/30"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-semibold">{pack.title}</p>
                      {pack.accessType === "token-gated" ? <Lock className="h-4 w-4 text-amber-300" /> : <Crown className="h-4 w-4 text-emerald-300" />}
                    </div>
                    <p className="text-xs text-zinc-400">{pack.description}</p>
                    <p className="mt-3 text-xs text-zinc-500">{pack.priceLabel || "Bientôt"}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="rounded-3xl border-white/10 bg-white/5"><CardContent className="flex items-center gap-3 p-4"><BookOpen className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Modules</p><p className="text-xl font-black">{visibleModules.length}</p></div></CardContent></Card>
          <Card className="rounded-3xl border-white/10 bg-white/5"><CardContent className="flex items-center gap-3 p-4"><Clock3 className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Leçons</p><p className="text-xl font-black">{totalLessons}</p></div></CardContent></Card>
          <Card className="rounded-3xl border-white/10 bg-white/5"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Pack actif</p><p className="text-xl font-black">{selectedPack?.title || "-"}</p></div></CardContent></Card>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5">
            <Search className="h-4 w-4 text-amber-300" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une leçon" className="border-0 bg-transparent p-0 text-white placeholder:text-zinc-500 focus-visible:ring-0" />
          </div>
          {!!search && <div className="mt-2 space-y-2">{results.map((lesson) => <button key={lesson.id} onClick={() => { setModuleId(lesson.moduleId); setLessonId(lesson.id); setSearch(""); }} className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-left"><p className="text-sm font-semibold">{lesson.title}</p><p className="text-xs text-zinc-400">{lesson.moduleTitle}</p></button>)}</div>}
        </div>

        {tab === "learn" && <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader><CardTitle>Parcours</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {visibleModules.map((module) => <div key={module.id} className={`rounded-2xl border p-3 ${module.id === moduleId ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-black/30"}`}><button onClick={() => { setModuleId(module.id); setLessonId(module.lessons[0]?.id || ""); }} className="w-full text-left"><p className="font-semibold">{module.title}</p><p className="text-xs text-zinc-400">{module.description}</p></button><div className="mt-2 space-y-1.5">{module.lessons.map((lesson) => <button key={lesson.id} onClick={() => { setModuleId(module.id); setLessonId(lesson.id); }} className={`flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm ${lesson.id === lessonId ? "bg-white/10" : "bg-black/20"}`}><span className="truncate pr-2">{lesson.title}</span><input type="checkbox" checked={Boolean(doneByLesson[lesson.id])} onChange={(e) => { e.stopPropagation(); setDoneByLesson((prev) => ({ ...prev, [lesson.id]: e.target.checked })); }} className="h-4 w-4 accent-amber-400" /></button>)}</div></div>)}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader><div className="flex items-center justify-between"><CardTitle>{activeLesson?.title}</CardTitle><span className="rounded-full bg-white/10 px-3 py-1 text-xs">{activeLesson?.duration || "7 min"}</span></div></CardHeader>
            <CardContent className="space-y-4"><div className="rounded-xl border border-dashed border-white/20 bg-black/30 p-4"><div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs text-amber-300"><PlayCircle className="h-4 w-4" /> Placeholder vidéo</div><div className="grid aspect-video place-content-center rounded-xl border border-white/10 bg-zinc-900 text-sm text-zinc-400">video slot</div></div>
              <div className="whitespace-pre-line rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-zinc-200">{activeLesson?.content}</div>

              {(activeLesson?.blocks || []).map((block) => (
                <div key={block.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  {(block.type === "text" || block.type === "gamified") && <p className="whitespace-pre-line text-sm text-zinc-200">{block.content}</p>}
                  {block.type === "image" && block.content && <img src={block.content} alt="lesson" className="w-full rounded-lg border border-white/10" />}
                  {block.type === "video" && block.content && <iframe title={block.id} src={block.content} className="aspect-video w-full rounded-lg border border-white/10" allow="autoplay; encrypted-media" allowFullScreen />}
                  {block.type === "quiz" && <div className="space-y-2"><p className="font-semibold">{block.content}</p>{(block.options || []).map((option, index) => <button key={`${block.id}-${index}`} onClick={() => setQuizAnswers((prev) => ({ ...prev, [block.id]: index }))} className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${(quizAnswers[block.id] ?? -1) === index ? "border-amber-400/60 bg-amber-400/10" : "border-white/10"}`}>{option}</button>)}{quizAnswers[block.id] !== undefined && <p className="text-xs text-zinc-400">{quizAnswers[block.id] === (block.answer || 0) ? "✅ Bonne réponse" : "❌ Mauvaise réponse"}</p>}</div>}
                </div>
              ))}

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm"><input type="checkbox" checked={Boolean(doneByLesson[activeLesson?.id])} onChange={(e) => setDoneByLesson((prev) => ({ ...prev, [activeLesson.id]: e.target.checked }))} className="h-4 w-4 accent-amber-400" />J'ai fini cette leçon</label>
            </CardContent>
          </Card>
        </div>}

        {tab === "progress" && <Card className="rounded-3xl border-white/10 bg-white/5"><CardHeader><CardTitle>Suivi</CardTitle></CardHeader><CardContent className="space-y-3">{visibleModules.map((module) => { const done = module.lessons.filter((lesson) => doneByLesson[lesson.id]).length; const moduleProgress = Math.round((done / (module.lessons.length || 1)) * 100); return <div key={module.id} className="rounded-xl border border-white/10 bg-black/30 p-3"><div className="mb-2 flex items-center justify-between text-sm"><span>{module.title}</span><span>{done}/{module.lessons.length}</span></div><Progress value={moduleProgress} className="h-2 bg-zinc-800" /></div>; })}</CardContent></Card>}
        {tab === "tools" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{["Risk", "Journal", "Conviction"].map((title) => <Card key={title} className="rounded-3xl border-white/10 bg-white/5"><CardContent className="p-4"><p className="font-semibold">{title}</p></CardContent></Card>)}</div>}
      </div>
      <MobileTabs tab={tab} setTab={setTab} />
    </div>
  );
}
