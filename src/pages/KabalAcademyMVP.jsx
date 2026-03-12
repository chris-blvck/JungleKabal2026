import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Lock,
  PlayCircle,
  BookOpen,
  ScrollText,
  Trophy,
  Target,
  Search,
  Shield,
  Swords,
  Brain,
  Sparkles,
} from "lucide-react";

const COURSES = [
  {
    id: "memecoins-trading-guide",
    title: "Memecoins Trading Guide",
    level: "Initiate",
    description:
      "Full academy version adapted from the March 2025 PDF into modules, lessons, quizzes and exercises.",
    modules: [
      {
        id: "module-1",
        title: "Module 1 · Foundations of Memecoin Trading",
        lessons: [
          {
            id: "lesson-1-1",
            title: "1.1 · What Are Memecoins?",
            duration: "10 min",
            type: "lesson",
            content: `Memecoins are not tech products. They are attention assets.\n\nCore idea:\n- Community, culture and energy drive price.\n- Viral potential matters more than utility.\n- Emotional response beats whitepaper logic.\n- Accessibility brings more buyers.\n\nMindset shift:\nYou are not investing like a traditional crypto boomer.\nYou are surfing waves of human attention.\n\nKey line:\nAttention = value.\n\nWhat makes a memecoin strong:\n- Easy to explain in one sentence\n- Strong meme / lore / culture\n- Emotional hook\n- Community people want to belong to`,
          },
          {
            id: "lesson-1-2",
            title: "1.2 · Why Solana Is Ideal",
            duration: "9 min",
            type: "lesson",
            content: `Why Solana wins for memecoins:\n- Ultra-low fees\n- Very fast execution\n- Strong memecoin culture\n- Better liquidity for rapid entries and exits\n\nWhy this matters:\nFast markets punish slow chains.\nOn Solana you can enter early, clip profits fast, rebalance often and avoid fee death.\n\nKey tools named in the guide:\n- Pump.fun\n- Axiom / BullX\n- Phantom\n- Dexscreener`,
          },
        ],
        quiz: {
          id: "quiz-1",
          title: "Foundations Check",
          questions: [
            {
              q: "What drives memecoin price the most according to the guide?",
              options: ["Utility and partnerships", "Attention and psychology", "Tokenomics alone", "Audits only"],
              answer: 1,
              explanation:
                "The PDF repeats that memecoins are attention-driven assets, not utility-driven ones.",
            },
            {
              q: "Which phase is usually the best entry zone?",
              options: ["Late dump", "Early hype", "After the final top", "Only at launch"],
              answer: 1,
              explanation:
                "The guide says the most profit often comes from identifying coins in early hype before the major pump.",
            },
          ],
        },
        exercise: {
          id: "exercise-1",
          title: "Narrative & Phase Analysis",
          fields: [
            "Coin",
            "Narrative Type",
            "Current Phase",
            "Why People Care",
            "Risk Level",
            "Would You Enter? Why?",
          ],
        },
      },
      {
        id: "module-2",
        title: "Module 2 · Essential Setup",
        lessons: [
          {
            id: "lesson-2-1",
            title: "2.1 · Critical Tools",
            duration: "10 min",
            type: "lesson",
            content: `Core tools from the PDF:\n- Axiom Pro as main trading base\n- Phantom Wallet\n- Phocaine extension\n- Twitter / Telegram\n- GMGN smart money tracking\n- Vector for mobile alerts\n- KOL Scan\n- RugCheck\n- LunarCrush\n- SOL Incinerator\n\nLesson:\nYou do not need 50 tools.\nYou need a fast command center with the right ones.`,
          },
        ],
        quiz: {
          id: "quiz-2",
          title: "Setup Check",
          questions: [
            {
              q: "What is the main purpose of proper workspace setup?",
              options: [
                "To look pro",
                "To reduce decision lag and execution friction",
                "To hold more tabs",
                "To avoid journaling",
              ],
              answer: 1,
              explanation:
                "The guide says time saved through setup translates directly into better entries and exits.",
            },
          ],
        },
        exercise: {
          id: "exercise-2",
          title: "Command Center Build",
          fields: [
            "Main Trading Tool",
            "Wallet Setup",
            "Alert Tools",
            "Bookmark Folder Structure",
            "Journal App",
            "Execution Notes",
          ],
        },
      },
    ],
  },
];

function flattenContent() {
  const items = [];
  for (const course of COURSES) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        items.push({ kind: "lesson", courseId: course.id, moduleId: module.id, ...lesson, body: lesson.content });
      }
      items.push({ kind: "quiz", courseId: course.id, moduleId: module.id, id: module.quiz.id, title: module.quiz.title, body: module.quiz.questions.map((q) => q.q).join(" ") });
      items.push({ kind: "exercise", courseId: course.id, moduleId: module.id, id: module.exercise.id, title: module.exercise.title, body: module.exercise.fields.join(" ") });
    }
  }
  return items;
}

const SEARCH_INDEX = flattenContent();

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <Card className="rounded-3xl border-amber-500/20 bg-black/35 backdrop-blur-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3">
            <Icon className="h-5 w-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-400">{label}</div>
            <div className="mt-1 text-2xl font-black text-white">{value}</div>
            <div className="mt-1 text-xs text-zinc-500">{hint}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Shell({ children }) {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(circle at top, rgba(245,166,35,0.12), transparent 22%), radial-gradient(circle at 20% 20%, rgba(132,204,22,0.08), transparent 18%), linear-gradient(180deg, #0B0B0A 0%, #090806 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</div>
    </div>
  );
}

export default function KabalAcademyMVP() {
  const [authorized, setAuthorized] = useState(false);
  const [username, setUsername] = useState("Rex Black");
  const [activeCourse] = useState(COURSES[0]);
  const [activeModuleId, setActiveModuleId] = useState(COURSES[0].modules[0].id);
  const [activeLessonId, setActiveLessonId] = useState(COURSES[0].modules[0].lessons[0].id);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittedExercises, setSubmittedExercises] = useState({});
  const [exerciseDraft, setExerciseDraft] = useState({});
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("lesson");

  const activeModule = activeCourse.modules.find((m) => m.id === activeModuleId) || activeCourse.modules[0];
  const activeLesson = activeModule.lessons.find((l) => l.id === activeLessonId) || activeModule.lessons[0];

  const totalLessons = activeCourse.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completionPct = Math.round((completedLessons.length / totalLessons) * 100);
  const quizCount = activeCourse.modules.reduce((acc, m) => acc + m.quiz.questions.length, 0);
  const answeredCount = Object.keys(quizAnswers).length;
  const xp = completedLessons.length * 20 + answeredCount * 10 + Object.keys(submittedExercises).length * 25;
  const level = xp >= 120 ? "Oracle" : xp >= 80 ? "Raider" : xp >= 40 ? "Hunter" : "Initiate";

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_INDEX.filter((item) => item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q)).slice(0, 8);
  }, [search]);

  const currentQuiz = activeModule.quiz;
  const currentExercise = activeModule.exercise;

  const quizScore = currentQuiz.questions.reduce((acc, q, idx) => {
    const key = `${currentQuiz.id}-${idx}`;
    return acc + (quizAnswers[key] === q.answer ? 1 : 0);
  }, 0);

  const markLessonDone = () => {
    if (!completedLessons.includes(activeLesson.id)) {
      setCompletedLessons((prev) => [...prev, activeLesson.id]);
    }
  };

  const answerQuiz = (questionIndex, optionIndex) => {
    const key = `${currentQuiz.id}-${questionIndex}`;
    setQuizAnswers((prev) => ({ ...prev, [key]: optionIndex }));
  };

  const submitExercise = () => {
    setSubmittedExercises((prev) => ({ ...prev, [currentExercise.id]: exerciseDraft }));
  };

  if (!authorized) {
    return (
      <Shell>
        <div className="grid min-h-[88vh] items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-amber-300">
              <Sparkles className="h-4 w-4" /> Kabal Academy MVP
            </div>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] text-white sm:text-6xl">
              Private education <span className="text-amber-300">hub</span>
              <br /> inside your own jungle.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-300">
              Login with Telegram. Unlock lessons. Do exercises. Pass quizzes. Track progress.
            </p>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-[28px] border-amber-500/20 bg-black/45 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl font-black text-white">
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3">
                    <Lock className="h-6 w-6 text-amber-300" />
                  </div>
                  Telegram Access Gate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 rounded-2xl border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
                  placeholder="Telegram username"
                />
                <Button onClick={() => setAuthorized(true)} className="h-12 w-full rounded-2xl bg-amber-400 text-black hover:bg-amber-300">
                  Login with Telegram
                </Button>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat icon={BookOpen} label="Modules" value={String(activeCourse.modules.length)} hint="Structured content" />
                  <Stat icon={ScrollText} label="Exercises" value={String(activeCourse.modules.length)} hint="Interactive learning" />
                  <Stat icon={Trophy} label="Quizzes" value={String(activeCourse.modules.length)} hint="Retention loop" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mb-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border-amber-500/20 bg-black/35 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Jungle Kabal · Academy Hub</div>
                <h1 className="mt-2 text-4xl font-black text-white">Welcome back, {username}</h1>
              </div>
              <div className="rounded-3xl border border-amber-500/20 bg-amber-400/10 px-5 py-4 text-right">
                <div className="text-xs uppercase tracking-[0.24em] text-zinc-400">Current level</div>
                <div className="mt-1 text-3xl font-black text-amber-300">{level}</div>
                <div className="text-sm text-zinc-400">{xp} XP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-amber-500/20 bg-black/35 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Search className="h-4 w-4 text-amber-300" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search lesson, quiz, exercise" className="border-0 bg-transparent p-0 text-white focus-visible:ring-0" />
            </div>
            {search && (
              <div className="mt-3 space-y-2">
                {searchResults.length ? searchResults.map((item) => (
                  <button key={item.id} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10" onClick={() => {
                    setActiveModuleId(item.moduleId);
                    if (item.kind === "lesson") setActiveLessonId(item.id);
                    setSearch("");
                  }}>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{item.kind}</div>
                  </button>
                )) : <div className="pt-3 text-sm text-zinc-500">No result.</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat icon={BookOpen} label="Lessons done" value={`${completedLessons.length}/${totalLessons}`} hint="Progress across course" />
        <Stat icon={Target} label="Quiz answers" value={`${answeredCount}/${quizCount}`} hint="Knowledge retention" />
        <Stat icon={ScrollText} label="Exercises sent" value={Object.keys(submittedExercises).length} hint="Practical reps" />
        <Card className="rounded-3xl border-amber-500/20 bg-black/35 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-400">Overall progress</div>
            <div className="mt-2 text-2xl font-black text-white">{completionPct}%</div>
            <Progress value={completionPct} className="mt-3 h-3 bg-zinc-800" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="rounded-[28px] border-amber-500/20 bg-black/35 backdrop-blur-xl">
          <CardHeader><CardTitle className="text-xl font-black text-white">Course Map</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activeCourse.modules.map((module, idx) => {
              const isActive = module.id === activeModuleId;
              return (
                <button key={module.id} onClick={() => { setActiveModuleId(module.id); setActiveLessonId(module.lessons[0].id); }} className={`w-full rounded-3xl border p-4 text-left transition ${isActive ? "border-amber-400/40 bg-amber-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">Module {idx + 1}</div>
                  <div className="mt-1 text-base font-bold text-white">{module.title}</div>
                  <div className="mt-3 space-y-2">
                    {module.lessons.map((lesson) => {
                      const done = completedLessons.includes(lesson.id);
                      return <div key={lesson.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-2"><div className="truncate text-sm font-medium text-zinc-100">{lesson.title}</div>{done ? <CheckCircle2 className="h-4 w-4 text-lime-400" /> : <PlayCircle className="h-4 w-4 text-amber-300" />}</div>;
                    })}
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div>
          <div className="grid grid-cols-4 rounded-3xl border border-white/10 bg-black/35 p-2">
            {[
              ["lesson", "Lesson"],
              ["quiz", "Quiz"],
              ["exercise", "Exercise"],
              ["tools", "Tools"],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} className={`rounded-2xl py-2 text-sm ${activeTab === key ? "bg-amber-400 text-black" : "text-white"}`}>{label}</button>
            ))}
          </div>

          {activeTab === "lesson" && (
            <Card className="mt-4 rounded-[28px] border-amber-500/20 bg-black/35 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="mt-1 text-3xl font-black text-white">{activeLesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center gap-3 text-sm text-zinc-400"><Brain className="h-4 w-4 text-blue-300" /> Read first. Then do reps.</div>
                  <div className="whitespace-pre-line text-[15px] leading-8 text-zinc-200">{activeLesson.content}</div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={markLessonDone} className="rounded-2xl bg-amber-400 text-black hover:bg-amber-300">Mark lesson as done</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "quiz" && (
            <Card className="mt-4 rounded-[28px] border-amber-500/20 bg-black/35 backdrop-blur-xl">
              <CardHeader><CardTitle className="mt-1 text-3xl font-black text-white">{currentQuiz.title}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {currentQuiz.questions.map((question, qIndex) => {
                  const key = `${currentQuiz.id}-${qIndex}`;
                  const selected = quizAnswers[key];
                  return <div key={key} className="rounded-[24px] border border-white/10 bg-white/5 p-5"><div className="mt-2 text-lg font-bold text-white">{question.q}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{question.options.map((option, optIndex) => <button key={option} onClick={() => answerQuiz(qIndex, optIndex)} className={`rounded-2xl border px-4 py-3 text-left transition ${selected === optIndex ? "border-amber-500/30 bg-amber-500/10" : "border-white/10 bg-black/20 hover:bg-white/10"}`}>{option}</button>)}</div></div>;
                })}
              </CardContent>
            </Card>
          )}

          {activeTab === "exercise" && (
            <Card className="mt-4 rounded-[28px] border-amber-500/20 bg-black/35 backdrop-blur-xl">
              <CardHeader><CardTitle className="mt-1 text-3xl font-black text-white">{currentExercise.title}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {currentExercise.fields.map((field) => (
                    <div key={field} className="space-y-2">
                      <div className="text-sm font-semibold text-zinc-200">{field}</div>
                      {field.length > 12 ? <Textarea value={exerciseDraft[field] || ""} onChange={(e) => setExerciseDraft((prev) => ({ ...prev, [field]: e.target.value }))} className="min-h-[120px] rounded-2xl border-white/10 bg-white/5 text-white" /> : <Input value={exerciseDraft[field] || ""} onChange={(e) => setExerciseDraft((prev) => ({ ...prev, [field]: e.target.value }))} className="h-12 rounded-2xl border-white/10 bg-white/5 text-white" />}
                    </div>
                  ))}
                </div>
                <Button onClick={submitExercise} className="mt-5 rounded-2xl bg-amber-400 text-black hover:bg-amber-300">Submit exercise</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "tools" && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[{ title: "Risk Manager", icon: Shield }, { title: "Conviction Board", icon: Swords }, { title: "PNL Journal", icon: Trophy }].map((tool) => (
                <Card key={tool.title} className="rounded-[28px] border-amber-500/20 bg-black/35 backdrop-blur-xl">
                  <CardContent className="p-5"><div className="flex items-start gap-3"><div className="rounded-2xl border border-amber-500/25 bg-amber-400/10 p-3"><tool.icon className="h-5 w-5 text-amber-300" /></div><div><div className="text-lg font-bold text-white">{tool.title}</div><Badge className="mt-4 rounded-full bg-white/10 px-4 py-2 text-zinc-200 hover:bg-white/10">Soon</Badge></div></div></CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
