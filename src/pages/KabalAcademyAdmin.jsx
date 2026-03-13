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

function createBlock(type = "text") {
  return { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, content: "", options: ["", "", "", ""], answer: 0 };
}

export default function KabalAcademyAdmin() {
  const seed = useMemo(() => parseCompactCourse(compactCourseRaw), []);
  const [content, setContent] = useState(seed);
  const [saving, setSaving] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(seed.modules[0]?.id || "");
  const [selectedLessonId, setSelectedLessonId] = useState(seed.modules[0]?.lessons?.[0]?.id || "");
  const [newBlockType, setNewBlockType] = useState("text");

  useEffect(() => {
    loadAcademyContent(seed).then((data) => {
      setContent(data);
      setSelectedModuleId(data.modules[0]?.id || "");
      setSelectedLessonId(data.modules[0]?.lessons?.[0]?.id || "");
    });
  }, [seed]);

  const selectedModule = content.modules.find((m) => m.id === selectedModuleId) || content.modules[0];
  const selectedLesson = selectedModule?.lessons.find((l) => l.id === selectedLessonId) || selectedModule?.lessons?.[0];

  const patchContent = (updater) => {
    setContent((prev) => {
      const next = updater(structuredClone(prev));
      return next;
    });
  };

  const saveAll = async () => {
    setSaving(true);
    await saveAcademyContent(content);
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
            <Button onClick={saveAll} className="bg-amber-400 text-black hover:bg-amber-300">
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button
              variant="outline"
              onClick={() => patchContent((draft) => {
                draft.modules.push(createModule());
                return draft;
              })}
            >
              + Module
            </Button>
            <span className="text-xs text-zinc-400">Backend: /api/academy/content (fallback localStorage si API absente)</span>
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
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => patchContent((draft) => {
                      const mod = draft.modules.find((m) => m.id === module.id);
                      mod.lessons.push(createLesson());
                      return draft;
                    })}
                  >
                    + Lesson
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedModule && selectedLesson && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader><CardTitle>Édition lesson</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input value={selectedModule.title} onChange={(e) => patchContent((draft) => { draft.modules.find((m) => m.id === selectedModule.id).title = e.target.value; return draft; })} placeholder="Titre module" />
                  <Input value={selectedLesson.duration || ""} onChange={(e) => patchContent((draft) => { const mod=draft.modules.find((m)=>m.id===selectedModule.id); mod.lessons.find((l)=>l.id===selectedLesson.id).duration = e.target.value; return draft; })} placeholder="Durée (ex: 8 min)" />
                </div>
                <Input value={selectedLesson.title} onChange={(e) => patchContent((draft) => { const mod=draft.modules.find((m)=>m.id===selectedModule.id); mod.lessons.find((l)=>l.id===selectedLesson.id).title = e.target.value; return draft; })} placeholder="Titre lesson" />
                <Textarea value={selectedLesson.content || ""} onChange={(e) => patchContent((draft) => { const mod=draft.modules.find((m)=>m.id===selectedModule.id); mod.lessons.find((l)=>l.id===selectedLesson.id).content = e.target.value; return draft; })} className="min-h-[140px]" placeholder="Contenu principal" />

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
                      const mod = draft.modules.find((m) => m.id === selectedModule.id);
                      const lesson = mod.lessons.find((l) => l.id === selectedLesson.id);
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
                            const mod = draft.modules.find((m) => m.id === selectedModule.id);
                            const lesson = mod.lessons.find((l) => l.id === selectedLesson.id);
                            lesson.blocks = (lesson.blocks || []).filter((b) => b.id !== block.id);
                            return draft;
                          })}>Supprimer</button>
                        </div>

                        {(block.type === "text" || block.type === "gamified") && (
                          <Textarea value={block.content || ""} onChange={(e) => patchContent((draft) => {
                            const mod = draft.modules.find((m) => m.id === selectedModule.id);
                            const lesson = mod.lessons.find((l) => l.id === selectedLesson.id);
                            const target = lesson.blocks.find((b) => b.id === block.id);
                            target.content = e.target.value;
                            return draft;
                          })} className="min-h-[90px]" placeholder="Contenu bloc" />
                        )}

                        {(block.type === "image" || block.type === "video") && (
                          <Input value={block.content || ""} onChange={(e) => patchContent((draft) => {
                            const mod = draft.modules.find((m) => m.id === selectedModule.id);
                            const lesson = mod.lessons.find((l) => l.id === selectedLesson.id);
                            const target = lesson.blocks.find((b) => b.id === block.id);
                            target.content = e.target.value;
                            return draft;
                          })} placeholder={block.type === "image" ? "URL image" : "URL vidéo (youtube embed)"} />
                        )}

                        {block.type === "quiz" && (
                          <div className="space-y-2">
                            <Input value={block.content || ""} onChange={(e) => patchContent((draft) => {
                              const mod = draft.modules.find((m) => m.id === selectedModule.id);
                              const lesson = mod.lessons.find((l) => l.id === selectedLesson.id);
                              const target = lesson.blocks.find((b) => b.id === block.id);
                              target.content = e.target.value;
                              return draft;
                            })} placeholder="Question" />
                            {(block.options || []).map((opt, idx) => (
                              <div key={`${block.id}-${idx}`} className="flex items-center gap-2">
                                <input type="radio" checked={(block.answer || 0) === idx} onChange={() => patchContent((draft) => {
                                  const mod = draft.modules.find((m) => m.id === selectedModule.id);
                                  const lesson = mod.lessons.find((l) => l.id === selectedLesson.id);
                                  const target = lesson.blocks.find((b) => b.id === block.id);
                                  target.answer = idx;
                                  return draft;
                                })} />
                                <Input value={opt} onChange={(e) => patchContent((draft) => {
                                  const mod = draft.modules.find((m) => m.id === selectedModule.id);
                                  const lesson = mod.lessons.find((l) => l.id === selectedLesson.id);
                                  const target = lesson.blocks.find((b) => b.id === block.id);
                                  target.options[idx] = e.target.value;
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
  );
}
