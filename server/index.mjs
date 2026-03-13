import { createServer } from 'node:http';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.ACADEMY_API_PORT || 8787);
const dataFile = path.join(__dirname, 'data', 'academy-content.json');
const compactFile = path.join(__dirname, '..', 'src', 'docs', 'memecoin-trading-guide-compact.md');

function parseCompactCourse(raw) {
  const lines = raw.split('\n');
  const modules = [];
  let currentModule = null;
  let currentLesson = null;

  const flushLesson = () => {
    if (!currentModule || !currentLesson) return;
    const content = currentLesson.contentLines.join('\n').trim();
    const bullets = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-') || line.startsWith('•'))
      .map((line) => line.replace(/^[-•]\s*/, ''))
      .slice(0, 8);

    currentModule.lessons.push({
      id: currentLesson.id,
      title: currentLesson.title,
      duration: '7 min',
      content,
      bullets: bullets.length ? bullets : [
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
      const moduleNum = line.replace(/^#\s*MODULE\s+/i, '').trim();
      const nextTitle = (lines[i + 1] || '').replace(/^#\s*/, '').trim() || `Module ${moduleNum}`;
      currentModule = {
        id: `m${moduleNum}`,
        title: `Module ${moduleNum} · ${nextTitle}`,
        description: 'Extrait du guide compact.',
        lessons: [],
      };
      continue;
    }

    if (/^#\s*Lesson\s+/i.test(line) && currentModule) {
      if (currentLesson) flushLesson();
      const lessonCode = line.replace(/^#\s*Lesson\s+/i, '').trim();
      const titleLine = (lines[i + 1] || '').replace(/^#\s*/, '').trim() || `Lesson ${lessonCode}`;
      currentLesson = {
        id: `l-${lessonCode.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
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

async function getSeedContent() {
  const raw = await readFile(compactFile, 'utf8');
  return parseCompactCourse(raw);
}

async function getContent() {
  try {
    await access(dataFile);
    const raw = await readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return getSeedContent();
  }
}

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  if (req.url === '/api/academy/content' && req.method === 'GET') {
    const content = await getContent();
    return send(res, 200, content);
  }

  if (req.url === '/api/academy/content' && req.method === 'PUT') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        parsed.updatedAt = new Date().toISOString();
        await writeFile(dataFile, JSON.stringify(parsed, null, 2));
        send(res, 200, { ok: true });
      } catch {
        send(res, 400, { ok: false, error: 'Invalid JSON body' });
      }
    });
    return;
  }

  if (req.url === '/health') return send(res, 200, { ok: true });
  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Academy API running on http://localhost:${PORT}`);
});
