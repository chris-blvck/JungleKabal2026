import React, { useEffect, useMemo, useState } from "react";
import compactCourseRaw from "../docs/memecoin-trading-guide-compact.md?raw";
import { parseCompactCourse } from "@/lib/academyParser";
import { loadAcademyContent, saveAcademyContent } from "@/lib/academyApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const DEFAULT_COVER = "https://i.postimg.cc/jdH0StDF/Chat-GPT-Image-14-mars-2026-16-20-50.png";
const JK_LOGO_FULL = "https://i.postimg.cc/7YwD758t/Logo-JK-Transparent-full.png";
const JK_LOGO_ROUND = "https://i.postimg.cc/bwvhC4v2/logo-jaune-rond.png";
const EXPANDED_MODULES_KEY = "jk-academy-expanded-admin-v1";

const packTemplates = [
  { id: "pack-beta-season", title: "KKM Beta Season", description: "Onboarding public + fondamentaux memecoin.", audience: "public", accessType: "open", priceLabel: "Inclus", coverImage: DEFAULT_COVER, workflowStatus: "published" },
  { id: "pack-alpha-pro", title: "KKM Alpha Pro", description: "Setups avancés et exécution disciplinée.", audience: "public", accessType: "token-gated", priceLabel: "Token pass requis", coverImage: DEFAULT_COVER, workflowStatus: "published" },
  { id: "pack-agent-lab", title: "KKM Agent Lab", description: "Création de formations par team/agents.", audience: "team", accessType: "token-gated", priceLabel: "Accès team", coverImage: DEFAULT_COVER, workflowStatus: "published" },
];

const roadmapWaves = [
  { wave: "Wave 1", title: "Live replays hub", status: "done", emoji: "🎥" },
  { wave: "Wave 2", title: "Player pro + timestamps", status: "next", emoji: "⏯️" },
  { wave: "Wave 3", title: "XP, streaks, badges", status: "in_progress", emoji: "🏆" },
  { wave: "Wave 4", title: "Quêtes hebdo + leaderboard", status: "next", emoji: "🧭" },
  { wave: "Wave 5", title: "Draft → Review → Publish", status: "next", emoji: "🛠️" },
  { wave: "Wave 6", title: "Analytics completion + dropoff", status: "next", emoji: "📈" },
  { wave: "Wave 7", title: "Token gate + entitlements", status: "next", emoji: "🔐" },
  { wave: "Wave 8", title: "Telegram Mini App native", status: "next", emoji: "📲" },
  { wave: "Wave 9", title: "IA assistant coach", status: "vision", emoji: "🤖" },
  { wave: "Wave 10", title: "Battle pass saisonnier", status: "vision", emoji: "🎮" },
  { wave: "Wave 11", title: "Signals room", status: "vision", emoji: "📡" },
  { wave: "Wave 12", title: "Creator economy", status: "vision", emoji: "🧱" },
];

const statusClass = {
  done: "bg-emerald-400/20 text-emerald-200 border-emerald-300/30",
  in_progress: "bg-amber-400/20 text-amber-200 border-amber-300/30",
  next: "bg-sky-400/20 text-sky-200 border-sky-300/30",
  vision: "bg-fuchsia-400/20 text-fuchsia-200 border-fuchsia-300/30",
};

const masterExecutionBoard = [
  { lane: "Content velocity", owner: "Admin Ops", items: ["Upload-first media flow", "Bulk translation", "Quality checklist"] },
  { lane: "Learner retention", owner: "Product", items: ["Next best lesson", "Quest loops", "Value score"] },
  { lane: "Monetization", owner: "Growth", items: ["Token entitlements", "Premium replays", "Season pass"] },
  { lane: "Distribution", owner: "Community", items: ["Telegram mini app", "Referral links", "Coach collabs"] },
];

function createModule() {
  return { id: `m-${Date.now()}`, title: "Nouveau module", description: "", lessons: [] };
}

function createLesson() {
  return { id: `l-${Date.now()}`, title: "Nouvelle leçon", duration: "7 min", content: "", bullets: [], blocks: [] };
}

function createPack(existingModules = []) {
  return { id: `pack-${Date.now()}`, title: "Nouveau pack", description: "", moduleIds: existingModules.slice(0, 1).map((module) => module.id), audience: "public", accessType: "open", priceLabel: "Inclus", coverImage: DEFAULT_COVER, workflowStatus: "draft" };
}

function createBlock(type = "text") {
  return { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, content: "", options: ["", "", "", ""], answer: 0 };
}


function getLiveReplays(content) {
  if (Array.isArray(content?.liveReplays)) return content.liveReplays;
  return [];
}

function createReplay() {
  return { id: `r-${Date.now()}`, title: "Nouveau replay", coach: "Coach", date: new Date().toISOString().slice(0, 10), duration: "60 min", url: "", packId: "" };
}

function withDefaultPacks(data) {
  if (Array.isArray(data.packs) && data.packs.length) return data;
  const allModuleIds = (data.modules || []).map((module) => module.id);
  return {
    ...data,
    packs: packTemplates.map((pack, index) => ({
      ...pack,
      moduleIds: index === 0 ? allModuleIds : allModuleIds.slice(0, Math.max(1, Math.ceil(allModuleIds.length / 2))),
    })),
  };
}

export default function KabalAcademyAdmin() {
  const seed = useMemo(() => withDefaultPacks(parseCompactCourse(compactCourseRaw)), []);
  const [content, setContent] = useState(seed);
  const [saving, setSaving] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(seed.modules[0]?.id || "");
  const [selectedLessonId, setSelectedLessonId] = useState(seed.modules[0]?.lessons?.[0]?.id || "");
  const [selectedPackId, setSelectedPackId] = useState(seed.packs[0]?.id || "pack-beta-season");
  const [newBlockType, setNewBlockType] = useState("text");
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [translateLang, setTranslateLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [translateError, setTranslateError] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(EXPANDED_MODULES_KEY);
      if (!raw) return;
      const ids = JSON.parse(raw);
      if (Array.isArray(ids)) setExpandedModules(new Set(ids));
    } catch {
      setExpandedModules(new Set());
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(EXPANDED_MODULES_KEY, JSON.stringify(Array.from(expandedModules)));
  }, [expandedModules]);

  useEffect(() => {
    loadAcademyContent(seed).then((data) => {
      const hydrated = withDefaultPacks(data);
      setContent(hydrated);
      setSelectedModuleId(hydrated.modules[0]?.id || "");
      setSelectedLessonId(hydrated.modules[0]?.lessons?.[0]?.id || "");
      setSelectedPackId(hydrated.packs[0]?.id || "pack-beta-season");
    }).catch(() => {
      // fallback silencieux : le contenu seed est déjà en place
    });
  }, [seed]);

  const selectedModule = content.modules.find((module) => module.id === selectedModuleId) || content.modules[0];
  const selectedLesson = selectedModule?.lessons.find((lesson) => lesson.id === selectedLessonId) || selectedModule?.lessons?.[0];
  const selectedPack = content.packs?.find((pack) => pack.id === selectedPackId) || content.packs?.[0];
  const liveReplays = getLiveReplays(content);

  const modulesWithoutLessons = content.modules.filter((module) => !(module.lessons || []).length).length;
  const lessonsWithoutContent = content.modules.flatMap((module) => module.lessons || []).filter((lesson) => !(lesson.content || "").trim()).length;
  const packsWithoutCover = (content.packs || []).filter((pack) => !(pack.coverImage || "").trim()).length;
  const draftPacks = (content.packs || []).filter((pack) => (pack.workflowStatus || "published") === "draft").length;
  const replaysWithoutUrl = liveReplays.filter((replay) => !(replay.url || "").trim()).length;
  const packsWithoutModules = (content.packs || []).filter((pack) => !(pack.moduleIds || []).length).length;

  const publishChecks = [
    { key: "modules", label: "Modules avec contenu", ok: modulesWithoutLessons === 0 && lessonsWithoutContent === 0 },
    { key: "covers", label: "Covers packs", ok: packsWithoutCover === 0 },
    { key: "mapping", label: "Mapping modules/pack", ok: packsWithoutModules === 0 },
    { key: "replays", label: "URLs replay", ok: replaysWithoutUrl === 0 },
  ];
  const publishReadyCount = publishChecks.filter((item) => item.ok).length;
  const publishReadiness = Math.round((publishReadyCount / publishChecks.length) * 100);

  const patchContent = (updater) => setContent((prev) => updater(structuredClone(prev)));

  const saveAll = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await saveAcademyContent({ ...content, updatedAt: new Date().toISOString() });
    } catch {
      setSaveError("Échec de la sauvegarde. Vérifie ta connexion et réessaye.");
    } finally {
      setSaving(false);
    }
  };

  const toggleModule = (targetModuleId) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(targetModuleId)) next.delete(targetModuleId);
      else next.add(targetModuleId);
      return next;
    });
  };

  const expandAllModules = () => setExpandedModules(new Set(content.modules.map((module) => module.id)));
  const collapseAllModules = () => setExpandedModules(new Set());

  const setPackStatus = (status) => {
    if (!selectedPack) return;
    patchContent((draft) => {
      const pack = draft.packs.find((item) => item.id === selectedPack.id);
      pack.workflowStatus = status;
      pack.publishedAt = status === "published" ? new Date().toISOString() : null;
      return draft;
    });
  };

  const duplicateSelectedPack = () => {
    if (!selectedPack) return;
    patchContent((draft) => {
      const base = draft.packs.find((item) => item.id === selectedPack.id);
      draft.packs.push({ ...structuredClone(base), id: `pack-${Date.now()}`, title: `${base.title} (copy)`, workflowStatus: "draft", publishedAt: null });
      return draft;
    });
  };

  const deleteSelectedPack = () => {
    if (!selectedPack) return;
    patchContent((draft) => {
      draft.packs = (draft.packs || []).filter((item) => item.id !== selectedPack.id);
      return draft;
    });
    const fallback = (content.packs || []).find((item) => item.id !== selectedPack.id);
    setSelectedPackId(fallback?.id || "");
  };

  const setPackCoverFromFile = (file) => {
    if (!file || !selectedPack) return;
    const reader = new FileReader();
    reader.onload = () => patchContent((draft) => {
      const pack = draft.packs.find((item) => item.id === selectedPack.id);
      if (pack) pack.coverImage = String(reader.result || "");
      return draft;
    });
    reader.readAsDataURL(file);
  };

  const setBlockContentFromFile = (blockId, file) => {
    if (!file || !selectedModule || !selectedLesson) return;
    const reader = new FileReader();
    reader.onload = () => patchContent((draft) => {
      const module = draft.modules.find((item) => item.id === selectedModule.id);
      const lesson = module?.lessons.find((item) => item.id === selectedLesson.id);
      const block = lesson?.blocks.find((item) => item.id === blockId);
      if (block) block.content = String(reader.result || "");
      return draft;
    });
    reader.readAsDataURL(file);
  };

  const translateText = async (text, targetLang) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) return "";
    const resp = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=fr|${encodeURIComponent(targetLang)}`);
    if (!resp.ok) throw new Error(`Traduction échouée (${resp.status})`);
    const data = await resp.json();
    return data?.responseData?.translatedText || trimmed;
  };

  const translateLessonContent = async () => {
    if (!selectedModule || !selectedLesson) return;
    setTranslating(true);
    try {
      const translated = await translateText(selectedLesson.content || "", translateLang);
      patchContent((draft) => {
        const module = draft.modules.find((item) => item.id === selectedModule.id);
        const lesson = module?.lessons.find((item) => item.id === selectedLesson.id);
        if (lesson) lesson.content = translated;
        return draft;
      });
      setTranslateError(null);
    } catch {
      setTranslateError("Traduction échouée. Vérifie ta connexion.");
    } finally {
      setTranslating(false);
    }
  };

  const translateBlockContent = async (blockId, text) => {
    setTranslating(true);
    try {
      const translated = await translateText(text || "", translateLang);
      patchContent((draft) => {
        const module = draft.modules.find((item) => item.id === selectedModule.id);
        const lesson = module?.lessons.find((item) => item.id === selectedLesson.id);
        const block = lesson?.blocks.find((item) => item.id === blockId);
        if (block) block.content = translated;
        return draft;
      });
      setTranslateError(null);
    } catch {
      setTranslateError("Traduction du bloc échouée. Vérifie ta connexion.");
    } finally {
      setTranslating(false);
    }
  };

  const autoFixDraftData = () => {
    patchContent((draft) => {
      const fallbackCover = DEFAULT_COVER;
      draft.packs = (draft.packs || []).map((pack) => ({
        ...pack,
        coverImage: (pack.coverImage || "").trim() ? pack.coverImage : fallbackCover,
        moduleIds: (pack.moduleIds || []).length ? pack.moduleIds : (draft.modules[0] ? [draft.modules[0].id] : []),
      }));
      draft.liveReplays = (draft.liveReplays || []).map((replay) => ({
        ...replay,
        url: (replay.url || "").trim() ? replay.url : "https://example.com/replay",
      }));
      draft.modules = (draft.modules || []).map((module) => ({
        ...module,
        lessons: (module.lessons || []).map((lesson) => ({
          ...lesson,
          content: (lesson.content || "").trim() ? lesson.content : "Contenu à compléter.",
        })),
      }));
      return draft;
    });
  };

  const translateWholeLesson = async () => {
    if (!selectedModule || !selectedLesson) return;
    setTranslating(true);
    try {
      const titleTranslated = await translateText(selectedLesson.title || "", translateLang);
      const contentTranslated = await translateText(selectedLesson.content || "", translateLang);
      const translatedBlocks = await Promise.all((selectedLesson.blocks || []).map(async (block) => ({
        id: block.id,
        content: await translateText(block.content || "", translateLang),
      })));

      patchContent((draft) => {
        const module = draft.modules.find((item) => item.id === selectedModule.id);
        const lesson = module?.lessons.find((item) => item.id === selectedLesson.id);
        if (!lesson) return draft;
        lesson.title = titleTranslated || lesson.title;
        lesson.content = contentTranslated || lesson.content;
        lesson.blocks = (lesson.blocks || []).map((block) => {
          const translated = translatedBlocks.find((item) => item.id === block.id);
          return translated ? { ...block, content: translated.content || block.content } : block;
        });
        return draft;
      });
      setTranslateError(null);
    } catch {
      setTranslateError("Traduction complète de la leçon échouée. Vérifie ta connexion.");
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#231f10_0%,_#090909_50%)] px-4 py-6 text-white lg:px-8">
      <div className="pointer-events-none absolute -left-20 top-12 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl" />
      <div className="mx-auto max-w-7xl space-y-4">
        <Card className="border-amber-300/20 bg-gradient-to-br from-amber-300/10 via-white/5 to-black/40 shadow-[0_0_60px_rgba(245,158,11,0.1)]">
          <CardHeader><CardTitle><span className="inline-flex items-center gap-2"><img src={JK_LOGO_ROUND} alt="JK" className="h-5 w-5 rounded-full opacity-85" />Academy Admin · Builder</span></CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button onClick={saveAll} className="bg-amber-400 text-black hover:bg-amber-300">{saving ? "Sauvegarde..." : "Sauvegarder et publier"}</Button>
            <Button variant="outline" onClick={() => patchContent((draft) => { draft.modules.push(createModule()); return draft; })}>+ Module</Button>
            <Button variant="outline" onClick={() => patchContent((draft) => { draft.packs = draft.packs || []; draft.packs.push(createPack(draft.modules)); return draft; })}>+ Pack</Button>
            <Button variant="outline" onClick={() => patchContent((draft) => {
              const allModuleIds = draft.modules.map((module) => module.id);
              draft.packs = packTemplates.map((pack, index) => ({ ...pack, moduleIds: index === 0 ? allModuleIds : allModuleIds.slice(0, Math.max(1, Math.ceil(allModuleIds.length / 2))) }));
              return draft;
            })}>Packs placeholder (x3)</Button>
            <img src={JK_LOGO_FULL} alt="Jungle Kabal" className="h-5 w-auto opacity-70" /><a href="/academy" className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300">Voir la version publique</a>
            <span className="text-xs text-zinc-400">Une sauvegarde met à jour les versions public/admin. API: /api/academy/content (fallback localStorage).</span>
            {saveError && <span className="w-full text-xs text-red-400">{saveError}</span>}
          </CardContent>
        </Card>

        <Card className="border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-400/10 via-amber-300/10 to-black/40">
          <CardHeader><CardTitle>🎛️ Delivery cockpit</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5 text-sm">
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Modules sans leçons: <span className="font-semibold">{modulesWithoutLessons}</span></div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Leçons sans contenu: <span className="font-semibold">{lessonsWithoutContent}</span></div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Packs sans cover: <span className="font-semibold">{packsWithoutCover}</span></div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Packs draft: <span className="font-semibold">{draftPacks}</span></div>
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">Replays sans URL: <span className="font-semibold">{replaysWithoutUrl}</span></div>
          </CardContent>
        </Card>

        <Card className="border-emerald-300/20 bg-gradient-to-br from-emerald-400/10 to-black/40">
          <CardHeader><CardTitle>✅ Publish readiness</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <p className="text-zinc-300">Préparation release</p>
              <p className="font-semibold text-emerald-200">{publishReadiness}%</p>
            </div>
            <div className="h-2 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-amber-300" style={{ width: `${publishReadiness}%` }} /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {publishChecks.map((check) => <div key={check.key} className={`rounded-xl border px-3 py-2 text-xs ${check.ok ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200" : "border-red-300/30 bg-red-400/10 text-red-200"}`}>{check.ok ? "✅" : "⚠️"} {check.label}</div>)}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={autoFixDraftData}>Auto-fix rapide</Button>
              <Button onClick={saveAll} className="bg-emerald-400 text-black hover:bg-emerald-300">Save release</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40">
          <CardHeader><CardTitle>Roadmap Session (next waves)</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-sm">
            {roadmapWaves.map((item) => <div key={item.wave} className="rounded-xl border border-amber-200/20 bg-black/25 px-3 py-2 text-zinc-200"><div className="mb-1 flex items-center justify-between"><p className="text-xs text-zinc-400">{item.wave}</p><span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusClass[item.status] || "border-white/10 bg-white/10 text-zinc-300"}`}>{item.status}</span></div><p>{item.emoji} {item.title}</p></div>)}
          </CardContent>
        </Card>

        <Card className="border-sky-300/20 bg-gradient-to-br from-sky-400/10 to-black/40">
          <CardHeader><CardTitle>🧠 Master list updates · execution now</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {masterExecutionBoard.map((lane) => <div key={lane.lane} className="rounded-xl border border-white/10 bg-black/25 p-3"><div className="mb-2 flex items-center justify-between"><p className="font-semibold">{lane.lane}</p><span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase text-zinc-300">{lane.owner}</span></div><ul className="space-y-1 text-xs text-zinc-300">{lane.items.map((item) => <li key={item}>• {item}</li>)}</ul></div>)}
          </CardContent>
        </Card>

        <Card className="border-amber-300/20 bg-gradient-to-br from-amber-400/15 to-black/40">
          <CardHeader><CardTitle>Session Max Ops</CardTitle></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 text-sm">
            {[
              "⚡ Batch create packs",
              "🧪 QA module checklist",
              "🎯 Replay-to-pack mapping",
              "🛰️ Publish audit trail",
            ].map((item) => <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-zinc-300">{item}</div>)}
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Modules & lessons</CardTitle>
                <div className="flex gap-2"><button onClick={expandAllModules} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300">Tout déplier</button><button onClick={collapseAllModules} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300">Tout replier</button></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.modules.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                return (
                  <div key={module.id} className={`rounded-xl border p-3 ${module.id === selectedModuleId ? "border-amber-400/50" : "border-white/10"}`}>
                    <button className="flex w-full items-center justify-between text-left" onClick={() => { setSelectedModuleId(module.id); setSelectedLessonId(module.lessons[0]?.id || ""); toggleModule(module.id); }}><div className="font-semibold">{module.title}</div><span className="text-xs text-zinc-400">{isExpanded ? "−" : "+"}</span></button>
                    {isExpanded && <div className="mt-2 space-y-1">{module.lessons.map((lesson) => <button key={lesson.id} className={`w-full rounded-lg px-2 py-1 text-left text-sm ${lesson.id === selectedLessonId ? "bg-white/15" : "bg-black/20"}`} onClick={() => { setSelectedModuleId(module.id); setSelectedLessonId(lesson.id); }}>{lesson.title}</button>)}</div>}
                    <Button variant="outline" className="mt-2 w-full" onClick={() => patchContent((draft) => { const target = draft.modules.find((item) => item.id === module.id); target.lessons.push(createLesson()); return draft; })}>+ Lesson</Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedPack && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader><CardTitle><span className="inline-flex items-center gap-2"><img src={JK_LOGO_ROUND} alt="JK" className="h-4 w-4 rounded-full opacity-80" />Configuration pack</span></CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <select value={selectedPackId} onChange={(e) => setSelectedPackId(e.target.value)} className="h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm">{(content.packs || []).map((pack) => <option key={pack.id} value={pack.id}>{pack.title}</option>)}</select>
                  <img src={selectedPack.coverImage || DEFAULT_COVER} alt={selectedPack.title} className="h-36 w-full rounded-xl border border-white/10 object-cover" />

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-300">Statut: {selectedPack.workflowStatus || "published"}</span>
                    {selectedPack.publishedAt && <span className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">Publié: {new Date(selectedPack.publishedAt).toLocaleDateString()}</span>}
                    <button onClick={() => setPackStatus("draft")} className="rounded-lg border border-orange-300/30 bg-orange-400/10 px-2 py-1 text-xs text-orange-200">Mettre en draft</button>
                    <button onClick={() => setPackStatus("published")} className="rounded-lg border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">Publier</button>
                    <button onClick={duplicateSelectedPack} className="rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-xs text-zinc-200">Dupliquer</button>
                    <button onClick={deleteSelectedPack} className="rounded-lg border border-red-300/30 bg-red-400/10 px-2 py-1 text-xs text-red-200">Supprimer</button>
                  </div>

                  <Input value={selectedPack.title || ""} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.title = e.target.value; return draft; })} placeholder="Titre pack" />
                  <Textarea value={selectedPack.description || ""} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.description = e.target.value; return draft; })} className="min-h-[80px]" placeholder="Description pack" />
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <Input value={selectedPack.coverImage || ""} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.coverImage = e.target.value; return draft; })} placeholder="URL image du pack" />
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-amber-300/30 bg-amber-400/10 px-3 text-xs text-amber-200">Upload cover<input type="file" accept="image/*" className="hidden" onChange={(e) => setPackCoverFromFile(e.target.files?.[0])} /></label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-4">
                    <select value={selectedPack.accessType || "open"} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.accessType = e.target.value; return draft; })} className="h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"><option value="open">Open</option><option value="token-gated">Token-gated</option></select>
                    <select value={selectedPack.audience || "public"} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.audience = e.target.value; return draft; })} className="h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"><option value="public">Public</option><option value="team">Team</option></select>
                    <select value={selectedPack.workflowStatus || "published"} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.workflowStatus = e.target.value; if (e.target.value === "published") pack.publishedAt = new Date().toISOString(); return draft; })} className="h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"><option value="published">Published</option><option value="draft">Draft</option></select>
                    <Input value={selectedPack.priceLabel || ""} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.priceLabel = e.target.value; return draft; })} placeholder="Prix / plan" />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-sm font-semibold">Modules inclus dans ce pack</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {content.modules.map((module) => {
                        const checked = (selectedPack.moduleIds || []).includes(module.id);
                        return (
                          <label key={module.id} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-sm">
                            <input type="checkbox" checked={checked} onChange={(e) => patchContent((draft) => {
                              const pack = draft.packs.find((item) => item.id === selectedPack.id);
                              const currentIds = new Set(pack.moduleIds || []);
                              if (e.target.checked) currentIds.add(module.id); else currentIds.delete(module.id);
                              pack.moduleIds = Array.from(currentIds);
                              return draft;
                            })} className="h-4 w-4 accent-amber-400" />
                            <span className="truncate">{module.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            <Card className="border-white/10 bg-white/5">
              <CardHeader><CardTitle>Live Replays</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" onClick={() => patchContent((draft) => { draft.liveReplays = getLiveReplays(draft); draft.liveReplays.push(createReplay()); return draft; })}>+ Replay</Button>
                {(liveReplays || []).map((replay) => (
                  <div key={replay.id} className="rounded-xl border border-white/10 p-3 space-y-2">
                    <Input value={replay.title || ""} onChange={(e) => patchContent((draft) => { const item = getLiveReplays(draft).find((r) => r.id === replay.id); item.title = e.target.value; return draft; })} placeholder="Titre replay" />
                    <div className="grid gap-2 md:grid-cols-3">
                      <Input value={replay.coach || ""} onChange={(e) => patchContent((draft) => { const item = getLiveReplays(draft).find((r) => r.id === replay.id); item.coach = e.target.value; return draft; })} placeholder="Coach" />
                      <Input value={replay.date || ""} onChange={(e) => patchContent((draft) => { const item = getLiveReplays(draft).find((r) => r.id === replay.id); item.date = e.target.value; return draft; })} placeholder="Date" />
                      <Input value={replay.duration || ""} onChange={(e) => patchContent((draft) => { const item = getLiveReplays(draft).find((r) => r.id === replay.id); item.duration = e.target.value; return draft; })} placeholder="Durée" />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input value={replay.url || ""} onChange={(e) => patchContent((draft) => { const item = getLiveReplays(draft).find((r) => r.id === replay.id); item.url = e.target.value; return draft; })} placeholder="URL replay" />
                      <select value={replay.packId || ""} onChange={(e) => patchContent((draft) => { const item = getLiveReplays(draft).find((r) => r.id === replay.id); item.packId = e.target.value; return draft; })} className="h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm">
                        <option value="">Tous les packs</option>
                        {(content.packs || []).map((pack) => <option key={pack.id} value={pack.id}>{pack.title}</option>)}
                      </select>
                    </div>
                    <button className="text-xs text-red-300" onClick={() => patchContent((draft) => { draft.liveReplays = getLiveReplays(draft).filter((r) => r.id !== replay.id); return draft; })}>Supprimer replay</button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedModule && selectedLesson && (
              <Card className="border-amber-300/20 bg-gradient-to-br from-amber-300/10 to-black/40">
                <CardHeader><CardTitle>Édition lesson · Studio</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2"><Input value={selectedModule.title} onChange={(e) => patchContent((draft) => { draft.modules.find((module) => module.id === selectedModule.id).title = e.target.value; return draft; })} placeholder="Titre module" /><Input value={selectedLesson.duration || ""} onChange={(e) => patchContent((draft) => { const module = draft.modules.find((item) => item.id === selectedModule.id); module.lessons.find((lesson) => lesson.id === selectedLesson.id).duration = e.target.value; return draft; })} placeholder="Durée (ex: 8 min)" /></div>
                  <Input value={selectedLesson.title} onChange={(e) => patchContent((draft) => { const module = draft.modules.find((item) => item.id === selectedModule.id); module.lessons.find((lesson) => lesson.id === selectedLesson.id).title = e.target.value; return draft; })} placeholder="Titre lesson" />
                  <div className="rounded-xl border border-amber-300/20 bg-black/20 p-3">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-zinc-400">Auto-translate (gratuit)</span>
                      <select value={translateLang} onChange={(e) => setTranslateLang(e.target.value)} className="h-8 rounded-lg border border-white/15 bg-black/30 px-2 text-xs">
                        <option value="en">English</option><option value="es">Español</option><option value="pt">Português</option><option value="it">Italiano</option><option value="de">Deutsch</option><option value="ar">العربية</option>
                      </select>
                      <button onClick={translateLessonContent} disabled={translating} className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-xs text-amber-200 disabled:opacity-40">{translating ? "Traduction..." : "Traduire le contenu"}</button>
                      <button onClick={translateWholeLesson} disabled={translating} className="rounded-lg border border-fuchsia-300/30 bg-fuchsia-400/10 px-2 py-1 text-xs text-fuchsia-200 disabled:opacity-40">{translating ? "Traduction..." : "Traduire toute la lesson"}</button>
                      {translateError && <span className="text-xs text-red-400">{translateError}</span>}
                    </div>
                    <Textarea value={selectedLesson.content || ""} onChange={(e) => patchContent((draft) => { const module = draft.modules.find((item) => item.id === selectedModule.id); module.lessons.find((lesson) => lesson.id === selectedLesson.id).content = e.target.value; return draft; })} className="min-h-[140px]" placeholder="Contenu principal" />
                  </div>

                  <div className="rounded-xl border border-white/10 p-3">
                    <div className="mb-2 flex items-center gap-2"><select value={newBlockType} onChange={(e) => setNewBlockType(e.target.value)} className="h-9 rounded-lg border border-white/15 bg-black/30 px-3 text-sm"><option value="text">Texte</option><option value="image">Image</option><option value="video">Vidéo</option><option value="audio">Audio</option><option value="quiz">Quiz</option><option value="gamified">Gamifié</option></select><Button onClick={() => patchContent((draft) => { const module = draft.modules.find((item) => item.id === selectedModule.id); const lesson = module.lessons.find((item) => item.id === selectedLesson.id); lesson.blocks = lesson.blocks || []; lesson.blocks.push(createBlock(newBlockType)); return draft; })}>+ Bloc</Button></div>                    <div className="space-y-3">
                      {(selectedLesson.blocks || []).map((block) => (
                        <div key={block.id} className="rounded-lg border border-white/10 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs uppercase text-zinc-400">{block.type}</span>
                            <button
                              className="text-xs text-red-300"
                              onClick={() => patchContent((draft) => {
                                const module = draft.modules.find((item) => item.id === selectedModule.id);
                                const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                lesson.blocks = (lesson.blocks || []).filter((item) => item.id !== block.id);
                                return draft;
                              })}
                            >
                              Supprimer
                            </button>
                          </div>

                          {(block.type === "text" || block.type === "gamified") && (
                            <div className="space-y-2">
                              <Textarea
                                value={block.content || ""}
                                onChange={(e) => patchContent((draft) => {
                                  const module = draft.modules.find((item) => item.id === selectedModule.id);
                                  const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                  lesson.blocks.find((item) => item.id === block.id).content = e.target.value;
                                  return draft;
                                })}
                                className="min-h-[90px]"
                                placeholder="Contenu bloc"
                              />
                              <button onClick={() => translateBlockContent(block.id, block.content)} disabled={translating} className="rounded-lg border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200 disabled:opacity-40">{translating ? "Traduction..." : "Traduire ce bloc"}</button>
                            </div>
                          )}

                          {(block.type === "image" || block.type === "video" || block.type === "audio") && (
                            <div className="space-y-2">
                              <Input
                                value={block.content || ""}
                                onChange={(e) => patchContent((draft) => {
                                  const module = draft.modules.find((item) => item.id === selectedModule.id);
                                  const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                  lesson.blocks.find((item) => item.id === block.id).content = e.target.value;
                                  return draft;
                                })}
                                placeholder={block.type === "image" ? "URL image" : block.type === "video" ? "URL vidéo (youtube embed)" : "URL audio (mp3, m4a...)"}
                              />
                              <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/20 bg-white/5 px-2 py-1 text-[11px] text-zinc-300">
                                Upload fichier
                                <input type="file" accept={block.type === "image" ? "image/*" : block.type === "video" ? "video/*" : "audio/*"} className="hidden" onChange={(e) => setBlockContentFromFile(block.id, e.target.files?.[0])} />
                              </label>
                            </div>
                          )}

                          {block.type === "quiz" && (
                            <div className="space-y-2">
                              <Input
                                value={block.content || ""}
                                onChange={(e) => patchContent((draft) => {
                                  const module = draft.modules.find((item) => item.id === selectedModule.id);
                                  const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                  lesson.blocks.find((item) => item.id === block.id).content = e.target.value;
                                  return draft;
                                })}
                                placeholder="Question"
                              />
                              {(block.options || []).map((option, idx) => (
                                <div key={`${block.id}-${idx}`} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    checked={(block.answer || 0) === idx}
                                    onChange={() => patchContent((draft) => {
                                      const module = draft.modules.find((item) => item.id === selectedModule.id);
                                      const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                      lesson.blocks.find((item) => item.id === block.id).answer = idx;
                                      return draft;
                                    })}
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => patchContent((draft) => {
                                      const module = draft.modules.find((item) => item.id === selectedModule.id);
                                      const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                      lesson.blocks.find((item) => item.id === block.id).options[idx] = e.target.value;
                                      return draft;
                                    })}
                                    placeholder={`Option ${idx + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
