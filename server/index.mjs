import { createServer } from 'node:http';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.ACADEMY_API_PORT || 8787);
const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*';
const WRITE_RATE_LIMIT_WINDOW_MS = Number(process.env.ANGEL_OPS_RATE_LIMIT_WINDOW_MS || 60_000);
const WRITE_RATE_LIMIT_MAX = Number(process.env.ANGEL_OPS_RATE_LIMIT_MAX || 60);
const dataFile = path.join(__dirname, 'data', 'academy-content.json');
const compactFile = path.join(__dirname, '..', 'src', 'docs', 'memecoin-trading-guide-compact.md');
const angelOpsFile = path.join(__dirname, 'data', 'angel-ops.json');

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
        'Lire la leçon complète.',
        "Appliquer l'exercice recommandé.",
        'Valider la progression.',
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



function defaultAngelOpsState() {
  return {
    updatedAt: new Date().toISOString(),
    wallets: {
      trading: '',
      reserve: '',
      moonbag: '',
    },
    snapshots: [],
  };
}

async function getAngelOpsState() {
  try {
    await access(angelOpsFile);
    const raw = await readFile(angelOpsFile, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...defaultAngelOpsState(),
      ...(parsed || {}),
      wallets: { ...defaultAngelOpsState().wallets, ...(parsed?.wallets || {}) },
      snapshots: Array.isArray(parsed?.snapshots) ? parsed.snapshots : [],
    };
  } catch {
    return defaultAngelOpsState();
  }
}

async function saveAngelOpsState(nextState) {
  const normalized = {
    ...defaultAngelOpsState(),
    ...(nextState || {}),
    wallets: { ...defaultAngelOpsState().wallets, ...(nextState?.wallets || {}) },
    snapshots: Array.isArray(nextState?.snapshots) ? nextState.snapshots.slice(0, 500) : [],
    updatedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(angelOpsFile), { recursive: true });
  await writeFile(angelOpsFile, JSON.stringify(normalized, null, 2));
  return normalized;
}



function isValidSolAddress(address) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test((address || '').trim());
}

function normalizeWalletPayload(input) {
  const allowedKeys = ['trading', 'reserve', 'moonbag'];
  const next = {};
  for (const key of allowedKeys) {
    if (typeof input?.[key] !== 'string') continue;
    const trimmed = input[key].trim();
    if (trimmed && !isValidSolAddress(trimmed)) {
      throw new Error(`Invalid SOL address for ${key}`);
    }
    next[key] = trimmed;
  }
  return next;
}

function normalizeSnapshotPayload(input) {
  const at = input?.at ? new Date(input.at).toISOString() : new Date().toISOString();
  const totalValueUsd = Number(input?.totalValueUsd || 0);
  if (!Number.isFinite(totalValueUsd)) throw new Error('Invalid totalValueUsd');
  const wallets = input?.wallets && typeof input.wallets === 'object' ? input.wallets : {};
  const walletKeys = Object.keys(wallets).slice(0, 3);
  const normalizedWallets = {};
  for (const key of walletKeys) {
    const item = wallets[key] || {};
    normalizedWallets[key] = {
      solBalance: Number.isFinite(Number(item.solBalance)) ? Number(item.solBalance) : 0,
      value: Number.isFinite(Number(item.value)) ? Number(item.value) : 0,
      source: typeof item.source === 'string' ? item.source.slice(0, 180) : '',
    };
  }
  return { at, totalValueUsd, wallets: normalizedWallets };
}

function canWriteAngelOps(req) {
  const requiredToken = process.env.ANGEL_OPS_ADMIN_TOKEN;
  if (!requiredToken) return true;
  return req.headers['x-admin-token'] === requiredToken;
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



function getPathname(reqUrl = '/') {
  try {
    return new URL(reqUrl, 'http://localhost').pathname;
  } catch {
    return reqUrl || '/';
  }
}

function collectJsonBody(req, maxBytes = 200_000) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', () => reject(new Error('Request stream error')));
  });
}



const writeRateBucket = new Map();

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function checkWriteRateLimit(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = writeRateBucket.get(ip) || { count: 0, resetAt: now + WRITE_RATE_LIMIT_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + WRITE_RATE_LIMIT_WINDOW_MS;
  }
  bucket.count += 1;
  writeRateBucket.set(ip, bucket);
  const remaining = Math.max(0, WRITE_RATE_LIMIT_MAX - bucket.count);
  return {
    limited: bucket.count > WRITE_RATE_LIMIT_MAX,
    remaining,
    resetAt: bucket.resetAt,
  };
}

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Admin-Token',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  const pathname = getPathname(req.url);

  if (pathname === '/api/angel-ops/state' && req.method === 'GET') {
    const state = await getAngelOpsState();
    return send(res, 200, state);
  }


  if (pathname === '/api/angel-ops/health' && req.method === 'GET') {
    const state = await getAngelOpsState();
    return send(res, 200, {
      ok: true,
      service: 'angel-ops',
      hasAdminToken: Boolean(process.env.ANGEL_OPS_ADMIN_TOKEN),
      walletsConfigured: Object.values(state.wallets || {}).filter(Boolean).length,
      snapshotsCount: Array.isArray(state.snapshots) ? state.snapshots.length : 0,
      updatedAt: state.updatedAt,
      now: new Date().toISOString(),
      corsAllowOrigin: CORS_ALLOW_ORIGIN,
      rateLimit: {
        windowMs: WRITE_RATE_LIMIT_WINDOW_MS,
        maxWrites: WRITE_RATE_LIMIT_MAX,
      },
    });
  }

  if (pathname === '/api/angel-ops/wallets' && req.method === 'PUT') {
    if (!canWriteAngelOps(req)) return send(res, 401, { ok: false, error: 'Unauthorized' });
    const limiter = checkWriteRateLimit(req);
    if (limiter.limited) return send(res, 429, { ok: false, error: 'Rate limit exceeded', retryAt: new Date(limiter.resetAt).toISOString() });
    try {
      const parsed = await collectJsonBody(req);
      const normalizedWallets = normalizeWalletPayload(parsed || {});
      const current = await getAngelOpsState();
      const next = await saveAngelOpsState({
        ...current,
        wallets: {
          ...current.wallets,
          ...normalizedWallets,
        },
      });
      return send(res, 200, { ok: true, wallets: next.wallets, updatedAt: next.updatedAt });
    } catch (error) {
      return send(res, 400, { ok: false, error: (error && error.message) || 'Invalid JSON body' });
    }
  }

  if (pathname === '/api/angel-ops/snapshot' && req.method === 'POST') {
    if (!canWriteAngelOps(req)) return send(res, 401, { ok: false, error: 'Unauthorized' });
    const limiter = checkWriteRateLimit(req);
    if (limiter.limited) return send(res, 429, { ok: false, error: 'Rate limit exceeded', retryAt: new Date(limiter.resetAt).toISOString() });
    try {
      const parsed = await collectJsonBody(req);
      const current = await getAngelOpsState();
      const snapshot = normalizeSnapshotPayload(parsed || {});
      const next = await saveAngelOpsState({
        ...current,
        snapshots: [snapshot, ...(Array.isArray(current.snapshots) ? current.snapshots : [])].slice(0, 500),
      });
      return send(res, 200, { ok: true, snapshot, count: next.snapshots.length, updatedAt: next.updatedAt });
    } catch (error) {
      return send(res, 400, { ok: false, error: (error && error.message) || 'Invalid JSON body' });
    }
  }


  if (pathname === '/api/angel-ops/snapshots' && req.method === 'DELETE') {
    if (!canWriteAngelOps(req)) return send(res, 401, { ok: false, error: 'Unauthorized' });
    const limiter = checkWriteRateLimit(req);
    if (limiter.limited) return send(res, 429, { ok: false, error: 'Rate limit exceeded', retryAt: new Date(limiter.resetAt).toISOString() });
    const current = await getAngelOpsState();
    const next = await saveAngelOpsState({
      ...current,
      snapshots: [],
    });
    return send(res, 200, { ok: true, count: next.snapshots.length, updatedAt: next.updatedAt });
  }

  if (pathname === '/api/academy/content' && req.method === 'GET') {
    const content = await getContent();
    return send(res, 200, content);
  }

  if (pathname === '/api/academy/content' && req.method === 'PUT') {
    try {
      const parsed = await collectJsonBody(req, 2_000_000);
      parsed.updatedAt = new Date().toISOString();
      await writeFile(dataFile, JSON.stringify(parsed, null, 2));
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: (error && error.message) || 'Invalid JSON body' });
    }
  }

  if (pathname === '/health') return send(res, 200, { ok: true });
  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Academy API running on http://localhost:${PORT}`);
});
