export function parseCompactCourse(raw) {
  const lines = raw.split("\n");
  const modules = [];
  let currentModule = null;
  let currentLesson = null;

  const flushLesson = () => {
    if (!currentModule || !currentLesson) return;
    const content = currentLesson.contentLines.join("\n").trim();
    const bullets = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-") || line.startsWith("•"))
      .map((line) => line.replace(/^[-•]\s*/, ""))
      .slice(0, 8);

    currentModule.lessons.push({
      id: currentLesson.id,
      title: currentLesson.title,
      duration: "7 min",
      content,
      bullets: bullets.length
        ? bullets
        : [
            "Lire la leçon complète.",
            "Appliquer l'exercice recommandé.",
            "Valider la progression.",
          ],
      blocks: [],
    });
  };

  const flushModule = () => {
    if (!currentModule) return;
    if (currentLesson) {
      flushLesson();
      currentLesson = null;
    }
    modules.push(currentModule);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    if (/^#\s*MODULE\s+\d+/i.test(line)) {
      flushModule();
      const moduleNum = line.replace(/^#\s*MODULE\s+/i, "").trim();
      const nextTitle = (lines[i + 1] || "")
        .replace(/^#\s*/, "")
        .trim() || `Module ${moduleNum}`;
      currentModule = {
        id: `m${moduleNum}`,
        title: `Module ${moduleNum} · ${nextTitle}`,
        description: "Extrait du guide compact.",
        lessons: [],
      };
      continue;
    }

    if (/^#\s*Lesson\s+/i.test(line) && currentModule) {
      if (currentLesson) flushLesson();
      const lessonCode = line.replace(/^#\s*Lesson\s+/i, "").trim();
      const titleLine = (lines[i + 1] || "")
        .replace(/^#\s*/, "")
        .trim() || `Lesson ${lessonCode}`;
      currentLesson = {
        id: `l-${lessonCode.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
        title: `${lessonCode} · ${titleLine}`,
        contentLines: [],
      };
      continue;
    }

    if (currentLesson && line) {
      currentLesson.contentLines.push(line);
    }
  }

  flushModule();

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    modules,
  };
}
