import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ImagePlus,
  PlayCircle,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";

const ACADEMY = {
  title: "Memecoins Trading Guide · Academy",
  subtitle: "Version claire & intuitive (mobile + web)",
  modules: [
    {
      id: "m1",
      title: "Module 1 · Fondations",
      description: "Comprendre la logique des memecoins.",
      lessons: [
        { id: "m1-l1", title: "1.1 · C'est quoi un memecoin ?", duration: "7 min", bullets: ["Actif d'attention", "Narratif > produit", "Cycle émotionnel"] },
        { id: "m1-l2", title: "1.2 · Psychologie de marché", duration: "8 min", bullets: ["FOMO/FUD", "Comportement de foule", "Timing social"] },
        { id: "m1-l3", title: "1.3 · Phases d'un pump", duration: "6 min", bullets: ["Launch", "Early hype", "Distribution"] },
      ],
    },
    {
      id: "m2",
      title: "Module 2 · Environnement Solana",
      description: "Pourquoi Solana pour exécuter vite.",
      lessons: [
        { id: "m2-l1", title: "2.1 · Vitesse & frais", duration: "6 min", bullets: ["Faibles coûts", "Entrées/sorties rapides", "Gestion active"] },
        { id: "m2-l2", title: "2.2 · Wallet setup", duration: "7 min", bullets: ["Phantom propre", "Sécurité seed", "Wallet trading dédié"] },
        { id: "m2-l3", title: "2.3 · Outils de base", duration: "8 min", bullets: ["Axiom/BullX", "DexScreener", "RugCheck"] },
      ],
    },
    {
      id: "m3",
      title: "Module 3 · Recherche narrative",
      description: "Identifier les coins qui peuvent attirer l'attention.",
      lessons: [
        { id: "m3-l1", title: "3.1 · Lire un narratif", duration: "7 min", bullets: ["Mème lisible", "Hook émotionnel", "Culture communautaire"] },
        { id: "m3-l2", title: "3.2 · Sources alpha", duration: "8 min", bullets: ["X/Twitter", "Telegram", "KOL & smart money"] },
        { id: "m3-l3", title: "3.3 · Filtrer les faux signaux", duration: "7 min", bullets: ["Bots", "Volume artificiel", "Promesses vides"] },
      ],
    },
    {
      id: "m4",
      title: "Module 4 · Entrées intelligentes",
      description: "Entrer avec un plan, pas avec l'émotion.",
      lessons: [
        { id: "m4-l1", title: "4.1 · Conditions d'entrée", duration: "8 min", bullets: ["Liquidité", "Contexte narratif", "Risque acceptable"] },
        { id: "m4-l2", title: "4.2 · Position sizing", duration: "6 min", bullets: ["Risque fixe", "Aucun all-in", "Taille adaptée"] },
        { id: "m4-l3", title: "4.3 · Éviter le FOMO", duration: "6 min", bullets: ["Attendre setup", "Pas de chase", "Respect du plan"] },
      ],
    },
    {
      id: "m5",
      title: "Module 5 · Sorties & prise de profit",
      description: "Protéger les gains quand le momentum tourne.",
      lessons: [
        { id: "m5-l1", title: "5.1 · TP partiels", duration: "7 min", bullets: ["Retirer risque", "Sécuriser capital", "Laisser runner"] },
        { id: "m5-l2", title: "5.2 · Invalidation", duration: "6 min", bullets: ["Scénario cassé", "Sortie immédiate", "Pas d'ego"] },
        { id: "m5-l3", title: "5.3 · Gestion post-pump", duration: "7 min", bullets: ["Distribution", "Liquidité qui baisse", "Règles de sortie"] },
      ],
    },
    {
      id: "m6",
      title: "Module 6 · Gestion du risque",
      description: "Tenir sur le long terme sans exploser le compte.",
      lessons: [
        { id: "m6-l1", title: "6.1 · Kill-switch personnel", duration: "5 min", bullets: ["Max drawdown", "Stop session", "Revue à froid"] },
        { id: "m6-l2", title: "6.2 · Pièges fréquents", duration: "7 min", bullets: ["Revenge trade", "Sur-trading", "Surexposition"] },
        { id: "m6-l3", title: "6.3 · Checklist anti-rug", duration: "8 min", bullets: ["Contrat", "Wallets suspects", "Unlocks"] },
      ],
    },
    {
      id: "m7",
      title: "Module 7 · Routine quotidienne",
      description: "Créer une exécution stable tous les jours.",
      lessons: [
        { id: "m7-l1", title: "7.1 · Pré-market", duration: "6 min", bullets: ["Watchlist", "Niveaux clés", "Scénarios"] },
        { id: "m7-l2", title: "7.2 · Pendant session", duration: "7 min", bullets: ["Focus", "Exécution propre", "Pas de distractions"] },
        { id: "m7-l3", title: "7.3 · Debrief rapide", duration: "6 min", bullets: ["Ce qui a marché", "Erreurs", "Action demain"] },
      ],
    },
    {
      id: "m8",
      title: "Module 8 · Mental & discipline",
      description: "Rester solide dans la volatilité.",
      lessons: [
        { id: "m8-l1", title: "8.1 · Gérer l'euphorie", duration: "5 min", bullets: ["Après gains", "Rester strict", "Continuité"] },
        { id: "m8-l2", title: "8.2 · Gérer les pertes", duration: "6 min", bullets: ["Accepter", "Analyser", "Repartir propre"] },
        { id: "m8-l3", title: "8.3 · Plan 30 jours", duration: "8 min", bullets: ["Objectifs", "Cadence", "Mesure de progrès"] },
      ],
    },
  ],
};

const LESSON_INDEX = ACADEMY.modules.flatMap((module) =>
  module.lessons.map((lesson) => ({
    moduleId: module.id,
    moduleTitle: module.title,
    ...lesson,
    searchText: `${module.title} ${lesson.title} ${lesson.bullets.join(" ")}`.toLowerCase(),
  })),
);

function createBlock(type = "text") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    content: "",
    checked: false,
  };
}

function MobileTabs({ tab, setTab }) {
  const tabs = [
    ["learn", "Cours", BookOpen],
    ["progress", "Suivi", Target],
    ["tools", "Outils", Wallet],
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/95 p-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
        {tabs.map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-2xl px-3 py-2 text-xs font-semibold ${tab === key ? "bg-amber-400 text-black" : "bg-white/5 text-zinc-200"}`}
          >
            <Icon className="mx-auto mb-1 h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KabalAcademyMVP() {
  const firstModule = ACADEMY.modules[0];
  const firstLesson = firstModule.lessons[0];

  const [started, setStarted] = useState(false);
  const [username, setUsername] = useState("Rex");
  const [tab, setTab] = useState("learn");
  const [moduleId, setModuleId] = useState(firstModule.id);
  const [lessonId, setLessonId] = useState(firstLesson.id);
  const [doneByLesson, setDoneByLesson] = useState({});
  const [search, setSearch] = useState("");
  const [newBlockType, setNewBlockType] = useState("text");
  const [contentBlocksByLesson, setContentBlocksByLesson] = useState({});

  const activeModule = ACADEMY.modules.find((m) => m.id === moduleId) || firstModule;
  const activeLesson = activeModule.lessons.find((l) => l.id === lessonId) || activeModule.lessons[0];

  const totalLessons = LESSON_INDEX.length;
  const doneCount = Object.values(doneByLesson).filter(Boolean).length;
  const percent = Math.round((doneCount / totalLessons) * 100);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return LESSON_INDEX.filter((l) => l.searchText.includes(query)).slice(0, 8);
  }, [search]);

  const currentChecked = Boolean(doneByLesson[activeLesson.id]);
  const currentBlocks = contentBlocksByLesson[activeLesson.id] || [];

  const setDone = (id, checked) => {
    setDoneByLesson((prev) => ({ ...prev, [id]: checked }));
  };

  const addBlock = () => {
    setContentBlocksByLesson((prev) => ({
      ...prev,
      [activeLesson.id]: [...(prev[activeLesson.id] || []), createBlock(newBlockType)],
    }));
  };

  const updateBlock = (blockId, patch) => {
    setContentBlocksByLesson((prev) => ({
      ...prev,
      [activeLesson.id]: (prev[activeLesson.id] || []).map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    }));
  };

  const removeBlock = (blockId) => {
    setContentBlocksByLesson((prev) => ({
      ...prev,
      [activeLesson.id]: (prev[activeLesson.id] || []).filter((block) => block.id !== blockId),
    }));
  };

  const uploadImageToBlock = (blockId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateBlock(blockId, { content: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-[#090909] text-white">
        <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-6 px-4 py-8 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs text-amber-300">
              <Sparkles className="h-4 w-4" /> UI/UX simple · mobile + web
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">Formation memecoins complète, organisée, facile à suivre.</h1>
            <p className="mt-4 text-zinc-300">Chaque leçon a sa vidéo, ses points clés et son espace de notes en blocs (style Notion).</p>
          </div>

          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Accéder à l'Academy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ton pseudo" className="h-12 rounded-2xl border-white/10 bg-black/30" />
              <Button onClick={() => setStarted(true)} className="h-12 w-full rounded-2xl bg-amber-400 text-black hover:bg-amber-300">
                Commencer
              </Button>
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
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">Jungle Kabal Academy</div>
                <h2 className="text-2xl font-black">Bienvenue {username}</h2>
                <p className="text-sm text-zinc-400">{ACADEMY.subtitle}</p>
              </div>
              <div className="min-w-[220px] flex-1 md:max-w-sm">
                <div className="mb-2 flex items-center justify-between text-sm text-zinc-300">
                  <span>{doneCount}/{totalLessons} leçons validées</span>
                  <span>{percent}%</span>
                </div>
                <Progress value={percent} className="h-2.5 bg-zinc-800" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="rounded-3xl border-white/10 bg-white/5"><CardContent className="flex items-center gap-3 p-4"><BookOpen className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Modules</p><p className="text-xl font-black">{ACADEMY.modules.length}</p></div></CardContent></Card>
          <Card className="rounded-3xl border-white/10 bg-white/5"><CardContent className="flex items-center gap-3 p-4"><Clock3 className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Format</p><p className="text-xl font-black">5-8 min</p></div></CardContent></Card>
          <Card className="rounded-3xl border-white/10 bg-white/5"><CardContent className="flex items-center gap-3 p-4"><CheckCircle2 className="h-5 w-5 text-amber-300" /><div><p className="text-xs text-zinc-400">Validation</p><p className="text-xl font-black">Checkbox</p></div></CardContent></Card>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5">
            <Search className="h-4 w-4 text-amber-300" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une leçon" className="border-0 bg-transparent p-0 text-white placeholder:text-zinc-500 focus-visible:ring-0" />
          </div>
          {!!search && (
            <div className="mt-2 space-y-2">
              {results.length ? results.map((l) => (
                <button
                  key={l.id}
                  onClick={() => {
                    setModuleId(l.moduleId);
                    setLessonId(l.id);
                    setTab("learn");
                    setSearch("");
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-left"
                >
                  <p className="text-sm font-semibold">{l.title}</p>
                  <p className="text-xs text-zinc-400">{l.moduleTitle}</p>
                </button>
              )) : <p className="px-2 py-1 text-sm text-zinc-500">Aucun résultat</p>}
            </div>
          )}
        </div>

        {tab === "learn" && (
          <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
            <Card className="rounded-3xl border-white/10 bg-white/5">
              <CardHeader><CardTitle>Parcours complet</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {ACADEMY.modules.map((module) => {
                  const selected = module.id === moduleId;
                  return (
                    <div key={module.id} className={`rounded-2xl border p-3 ${selected ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-black/30"}`}>
                      <button onClick={() => { setModuleId(module.id); setLessonId(module.lessons[0].id); }} className="w-full text-left">
                        <p className="font-semibold">{module.title}</p>
                        <p className="text-xs text-zinc-400">{module.description}</p>
                      </button>
                      <div className="mt-2 space-y-1.5">
                        {module.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => { setModuleId(module.id); setLessonId(lesson.id); }}
                            className={`flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm ${lesson.id === lessonId ? "bg-white/10" : "bg-black/20"}`}
                          >
                            <span className="truncate pr-2">{lesson.title}</span>
                            <span className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={Boolean(doneByLesson[lesson.id])}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  setDone(lesson.id, e.target.checked);
                                }}
                                className="h-4 w-4 accent-amber-400"
                              />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-white/10 bg-white/5">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{activeLesson.title}</CardTitle>
                  <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-zinc-200">{activeLesson.duration}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-dashed border-white/20 bg-black/30 p-4">
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-2.5 py-1 text-xs text-amber-300">
                    <PlayCircle className="h-4 w-4" /> Placeholder vidéo
                  </div>
                  <div className="aspect-video rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800/70 grid place-content-center">
                    <p className="text-sm text-zinc-400">Ici: vidéo de la leçon ({activeLesson.duration})</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-100">Contenu sous la vidéo (style Notion)</p>
                    <select
                      value={newBlockType}
                      onChange={(e) => setNewBlockType(e.target.value)}
                      className="h-9 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-zinc-100"
                    >
                      <option value="title">Titre</option>
                      <option value="text">Texte</option>
                      <option value="bullet">Liste à puces</option>
                      <option value="check">Checklist</option>
                      <option value="image">Image</option>
                    </select>
                    <Button onClick={addBlock} className="h-9 rounded-xl bg-amber-400 px-3 text-black hover:bg-amber-300">
                      <Plus className="mr-1 h-4 w-4" /> Ajouter bloc
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {currentBlocks.length === 0 && (
                      <p className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-zinc-500">
                        Aucun bloc pour cette leçon. Ajoute du texte, des checklists, des images, etc.
                      </p>
                    )}

                    {currentBlocks.map((block) => (
                      <div key={block.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <select
                            value={block.type}
                            onChange={(e) => updateBlock(block.id, { type: e.target.value })}
                            className="h-8 rounded-lg border border-white/15 bg-black/30 px-2 text-xs text-zinc-200"
                          >
                            <option value="title">Titre</option>
                            <option value="text">Texte</option>
                            <option value="bullet">Liste à puces</option>
                            <option value="check">Checklist</option>
                            <option value="image">Image</option>
                          </select>
                          <button onClick={() => removeBlock(block.id)} className="rounded-md p-1 text-zinc-400 hover:bg-white/10 hover:text-red-300">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {block.type === "title" && (
                          <Input
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder="Titre de section"
                            className="h-10 rounded-xl border-white/10 bg-black/30"
                          />
                        )}

                        {(block.type === "text" || block.type === "bullet") && (
                          <Textarea
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            placeholder={block.type === "bullet" ? "Une ligne = une puce" : "Ton texte ici..."}
                            className="min-h-[110px] rounded-xl border-white/10 bg-black/30"
                          />
                        )}

                        {block.type === "check" && (
                          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-3 text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(block.checked)}
                              onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
                              className="h-4 w-4 accent-amber-400"
                            />
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              placeholder="Tâche / point à cocher"
                              className="h-9 border-0 bg-transparent p-0"
                            />
                          </label>
                        )}

                        {block.type === "image" && (
                          <div className="space-y-2">
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              placeholder="URL de l'image"
                              className="h-10 rounded-xl border-white/10 bg-black/30"
                            />
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10">
                              <ImagePlus className="h-4 w-4" /> Importer image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => uploadImageToBlock(block.id, e.target.files?.[0])}
                              />
                            </label>
                            {block.content && (
                              <img src={block.content} alt="Illustration de leçon" className="max-h-64 w-full rounded-xl border border-white/10 object-contain" />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="mb-2 text-sm font-semibold text-zinc-100">Points clés</p>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    {activeLesson.bullets.map((b) => (<li key={b}>• {b}</li>))}
                  </ul>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3 text-sm">
                  <input type="checkbox" checked={currentChecked} onChange={(e) => setDone(activeLesson.id, e.target.checked)} className="h-4 w-4 accent-amber-400" />
                  J'ai fini cette leçon
                </label>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "progress" && (
          <Card className="rounded-3xl border-white/10 bg-white/5">
            <CardHeader><CardTitle>Suivi simple</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {ACADEMY.modules.map((m) => {
                const done = m.lessons.filter((l) => doneByLesson[l.id]).length;
                const p = Math.round((done / m.lessons.length) * 100);
                return (
                  <div key={m.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold">{m.title}</span>
                      <span className="text-zinc-400">{done}/{m.lessons.length}</span>
                    </div>
                    <Progress value={p} className="h-2 bg-zinc-800" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {tab === "tools" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["Wallet sécurité", "Checklist anti-rug", "Plan entrée/sortie"].map((title) => (
              <Card key={title} className="rounded-3xl border-white/10 bg-white/5">
                <CardContent className="p-4">
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-zinc-400">Section prête pour ajouter tes ressources internes.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <MobileTabs tab={tab} setTab={setTab} />
    </div>
  );
}
