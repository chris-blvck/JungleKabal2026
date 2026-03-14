import React, { useEffect, useMemo, useState } from "react";
import compactCourseRaw from "../docs/memecoin-trading-guide-compact.md?raw";
import { parseCompactCourse } from "@/lib/academyParser";
import { loadAcademyContent, saveAcademyContent } from "@/lib/academyApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function createModule() {
  return { id: `m-${Date.now()}`, title: "Nouveau module", description: "", lessons: [] };
}

function createLesson() {
  return {
    id: `l-${Date.now()}`,
    title: "Nouvelle leçon",
    duration: "7 min",
    content: "",
    bullets: [],
    blocks: [],
  };
}

const createPackDraft = (existingModules = []) => {
  return {
    id: `pack-${Date.now()}`,
    title: "Nouveau pack",
    description: "",
    moduleIds: existingModules.slice(0, 1).map((module) => module.id),
    audience: "public",
    accessType: "open",
    priceLabel: "Inclus",
  };
};

function createBlock(type = "text") {
  return { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, content: "", options: ["", "", "", ""], answer: 0 };
}

function withDefaultPacks(data) {
  if (Array.isArray(data.packs) && data.packs.length) {
    return data;
  }

  return {
    ...data,
    packs: [{
      id: "pack-core",
      title: "Core Academy",
      description: "Base commune pour toute l'équipe.",
      moduleIds: (data.modules || []).map((module) => module.id),
      audience: "public",
      accessType: "open",
      priceLabel: "Inclus",
    }],
  };
}

export default function KabalAcademyAdmin() {
  const seed = useMemo(() => withDefaultPacks(parseCompactCourse(compactCourseRaw)), []);
  const [content, setContent] = useState(seed);
  const [saving, setSaving] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(seed.modules[0]?.id || "");
  const [selectedLessonId, setSelectedLessonId] = useState(seed.modules[0]?.lessons?.[0]?.id || "");
  const [selectedPackId, setSelectedPackId] = useState(seed.packs[0]?.id || "pack-core");
  const [newBlockType, setNewBlockType] = useState("text");

  useEffect(() => {
    loadAcademyContent(seed).then((data) => {
      const hydrated = withDefaultPacks(data);
      setContent(hydrated);
      setSelectedModuleId(hydrated.modules[0]?.id || "");
      setSelectedLessonId(hydrated.modules[0]?.lessons?.[0]?.id || "");
      setSelectedPackId(hydrated.packs[0]?.id || "pack-core");
    });
  }, [seed]);

  const selectedModule = content.modules.find((module) => module.id === selectedModuleId) || content.modules[0];
  const selectedLesson = selectedModule?.lessons.find((lesson) => lesson.id === selectedLessonId) || selectedModule?.lessons?.[0];
  const selectedPack = content.packs?.find((pack) => pack.id === selectedPackId) || content.packs?.[0];

  const patchContent = (updater) => {
    setContent((prev) => updater(structuredClone(prev)));
  };

  const saveAll = async () => {
    setSaving(true);
    await saveAcademyContent({
      ...content,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#090909] px-4 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Academy Admin · Builder</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button onClick={saveAll} className="bg-amber-400 text-black hover:bg-amber-300">{saving ? "Sauvegarde..." : "Sauvegarder et publier"}</Button>
            <Button variant="outline" onClick={() => patchContent((draft) => { draft.modules.push(createModule()); return draft; })}>+ Module</Button>
            <Button variant="outline" onClick={() => patchContent((draft) => { draft.packs = draft.packs || []; draft.packs.push(createPackDraft(draft.modules)); return draft; })}>+ Pack</Button>
            <span className="text-xs text-zinc-400">Une sauvegarde met à jour les versions public/admin. API: /api/academy/content (fallback localStorage).</span>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <Card className="border-white/10 bg-white/5">
            <CardHeader><CardTitle>Modules & lessons</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {content.modules.map((module) => (
                <div key={module.id} className={`rounded-xl border p-3 ${module.id === selectedModuleId ? "border-amber-400/50" : "border-white/10"}`}>
                  <button className="w-full text-left" onClick={() => { setSelectedModuleId(module.id); setSelectedLessonId(module.lessons[0]?.id || ""); }}>
                    <div className="font-semibold">{module.title}</div>
                  </button>
                  <div className="mt-2 space-y-1">
                    {module.lessons.map((lesson) => (
                      <button key={lesson.id} className={`w-full rounded-lg px-2 py-1 text-left text-sm ${lesson.id === selectedLessonId ? "bg-white/15" : "bg-black/20"}`} onClick={() => { setSelectedModuleId(module.id); setSelectedLessonId(lesson.id); }}>
                        {lesson.title}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-2 w-full" onClick={() => patchContent((draft) => { const target = draft.modules.find((item) => item.id === module.id); target.lessons.push(createLesson()); return draft; })}>+ Lesson</Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedPack && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader><CardTitle>Configuration pack</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <select value={selectedPackId} onChange={(e) => setSelectedPackId(e.target.value)} className="h-10 w-full rounded-lg border border-white/15 bg-black/30 px-3 text-sm">
                    {(content.packs || []).map((pack) => <option key={pack.id} value={pack.id}>{pack.title}</option>)}
                  </select>

                  <Input value={selectedPack.title || ""} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.title = e.target.value; return draft; })} placeholder="Titre pack" />
                  <Textarea value={selectedPack.description || ""} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.description = e.target.value; return draft; })} className="min-h-[80px]" placeholder="Description pack" />

                  <div className="grid gap-3 md:grid-cols-3">
                    <select value={selectedPack.accessType || "open"} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.accessType = e.target.value; return draft; })} className="h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm">
                      <option value="open">Open</option>
                      <option value="token-gated">Token-gated</option>
                    </select>
                    <select value={selectedPack.audience || "public"} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.audience = e.target.value; return draft; })} className="h-10 rounded-lg border border-white/15 bg-black/30 px-3 text-sm">
                      <option value="public">Public</option>
                      <option value="team">Team</option>
                    </select>
                    <Input value={selectedPack.priceLabel || ""} onChange={(e) => patchContent((draft) => { const pack = draft.packs.find((item) => item.id === selectedPack.id); pack.priceLabel = e.target.value; return draft; })} placeholder="Prix / plan" />
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="mb-2 text-sm font-semibold">Modules inclus dans ce pack</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {content.modules.map((module) => {
                        const checked = (selectedPack.moduleIds || []).includes(module.id);
                        return (
                          <label key={module.id} className="flex items-center gap-2 rounded-lg border border-white/10 px-2 py-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => patchContent((draft) => {
                                const pack = draft.packs.find((item) => item.id === selectedPack.id);
                                const currentIds = new Set(pack.moduleIds || []);
                                if (e.target.checked) currentIds.add(module.id);
                                else currentIds.delete(module.id);
                                pack.moduleIds = Array.from(currentIds);
                                return draft;
                              })}
                              className="h-4 w-4 accent-amber-400"
                            />
                            <span className="truncate">{module.title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedModule && selectedLesson && (
              <Card className="border-white/10 bg-white/5">
                <CardHeader><CardTitle>Édition lesson</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input value={selectedModule.title} onChange={(e) => patchContent((draft) => { draft.modules.find((module) => module.id === selectedModule.id).title = e.target.value; return draft; })} placeholder="Titre module" />
                    <Input value={selectedLesson.duration || ""} onChange={(e) => patchContent((draft) => { const module = draft.modules.find((item) => item.id === selectedModule.id); module.lessons.find((lesson) => lesson.id === selectedLesson.id).duration = e.target.value; return draft; })} placeholder="Durée (ex: 8 min)" />
                  </div>
                  <Input value={selectedLesson.title} onChange={(e) => patchContent((draft) => { const module = draft.modules.find((item) => item.id === selectedModule.id); module.lessons.find((lesson) => lesson.id === selectedLesson.id).title = e.target.value; return draft; })} placeholder="Titre lesson" />
                  <Textarea value={selectedLesson.content || ""} onChange={(e) => patchContent((draft) => { const module = draft.modules.find((item) => item.id === selectedModule.id); module.lessons.find((lesson) => lesson.id === selectedLesson.id).content = e.target.value; return draft; })} className="min-h-[140px]" placeholder="Contenu principal" />

                  <div className="rounded-xl border border-white/10 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <select value={newBlockType} onChange={(e) => setNewBlockType(e.target.value)} className="h-9 rounded-lg border border-white/15 bg-black/30 px-3 text-sm">
                        <option value="text">Texte</option>
                        <option value="image">Image</option>
                        <option value="video">Vidéo</option>
                        <option value="quiz">Quiz</option>
                        <option value="gamified">Gamifié</option>
                      </select>
                      <Button onClick={() => patchContent((draft) => {
                        const module = draft.modules.find((item) => item.id === selectedModule.id);
                        const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                        lesson.blocks = lesson.blocks || [];
                        lesson.blocks.push(createBlock(newBlockType));
                        return draft;
                      })}>+ Bloc</Button>
                    </div>

                    <div className="space-y-3">
                      {(selectedLesson.blocks || []).map((block) => (
                        <div key={block.id} className="rounded-lg border border-white/10 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs uppercase text-zinc-400">{block.type}</span>
                            <button className="text-xs text-red-300" onClick={() => patchContent((draft) => {
                              const module = draft.modules.find((item) => item.id === selectedModule.id);
                              const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                              lesson.blocks = (lesson.blocks || []).filter((item) => item.id !== block.id);
                              return draft;
                            })}>Supprimer</button>
                          </div>

                          {(block.type === "text" || block.type === "gamified") && (
                            <Textarea value={block.content || ""} onChange={(e) => patchContent((draft) => {
                              const module = draft.modules.find((item) => item.id === selectedModule.id);
                              const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                              lesson.blocks.find((item) => item.id === block.id).content = e.target.value;
                              return draft;
                            })} className="min-h-[90px]" placeholder="Contenu bloc" />
                          )}

                          {(block.type === "image" || block.type === "video") && (
                            <Input value={block.content || ""} onChange={(e) => patchContent((draft) => {
                              const module = draft.modules.find((item) => item.id === selectedModule.id);
                              const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                              lesson.blocks.find((item) => item.id === block.id).content = e.target.value;
                              return draft;
                            })} placeholder={block.type === "image" ? "URL image" : "URL vidéo (youtube embed)"} />
                          )}

                          {block.type === "quiz" && (
                            <div className="space-y-2">
                              <Input value={block.content || ""} onChange={(e) => patchContent((draft) => {
                                const module = draft.modules.find((item) => item.id === selectedModule.id);
                                const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                lesson.blocks.find((item) => item.id === block.id).content = e.target.value;
                                return draft;
                              })} placeholder="Question" />
                              {(block.options || []).map((option, idx) => (
                                <div key={`${block.id}-${idx}`} className="flex items-center gap-2">
                                  <input type="radio" checked={(block.answer || 0) === idx} onChange={() => patchContent((draft) => {
                                    const module = draft.modules.find((item) => item.id === selectedModule.id);
                                    const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                    lesson.blocks.find((item) => item.id === block.id).answer = idx;
                                    return draft;
                                  })} />
                                  <Input value={option} onChange={(e) => patchContent((draft) => {
                                    const module = draft.modules.find((item) => item.id === selectedModule.id);
                                    const lesson = module.lessons.find((item) => item.id === selectedLesson.id);
                                    lesson.blocks.find((item) => item.id === block.id).options[idx] = e.target.value;
                                    return draft;
                                  })} placeholder={`Option ${idx + 1}`} />
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
