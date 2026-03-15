import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
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
const leaderboardFile = path.join(__dirname, 'data', 'academy-leaderboard.json');
const notificationsFile = path.join(__dirname, 'data', 'academy-notifications.json');
const compactFile = path.join(__dirname, '..', 'src', 'docs', 'memecoin-trading-guide-compact.md');
const paymentsFile = path.join(__dirname, 'data', 'payments.json');
const catalogFile = path.join(__dirname, 'data', 'product-catalog.json');
const waitlistFile = path.join(__dirname, 'data', 'waitlist.json');
const angelOpsFile = path.join(__dirname, 'data', 'angel-ops.json');
const runsFile = path.join(__dirname, 'data', 'runs.json');
const referralsFile = path.join(__dirname, 'data', 'referrals.json');
const miniappTelemetryFile = path.join(__dirname, 'data', 'miniapp-telemetry.json');

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_MINI_APP_URL = process.env.TELEGRAM_MINI_APP_URL || '';
const PAYMENT_EXPIRY_MINUTES = Number(process.env.PAYMENT_EXPIRY_MINUTES || 15);
const PAYMENT_AUTODETECT_INTERVAL_MS = Number(process.env.PAYMENT_AUTODETECT_INTERVAL_MS || 15000);
const API_RATE_LIMIT_PER_MINUTE = Number(process.env.API_RATE_LIMIT_PER_MINUTE || 90);
const paymentWalletPool = (process.env.PAYMENT_WALLET_POOL || process.env.PAYMENT_WALLET || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

// ─── Rate limiter ────────────────────────────────────────────────────────────
const rateLimitStore = new Map();

function isRateLimited(req, key, windowMs = 60_000, max = API_RATE_LIMIT_PER_MINUTE) {
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const storeKey = `${key}:${ip}`;
  const now = Date.now();
  const entry = rateLimitStore.get(storeKey) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  rateLimitStore.set(storeKey, entry);
  return entry.count > max;
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────
function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Telegram-Init-Data,X-Admin-Token',
  });
  res.end(JSON.stringify(payload));
}

function parsePath(url) {
  try {
    return new URL(url, 'http://localhost').pathname;
  } catch {
    return (url || '/').split('?')[0];
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

// ─── Academy content ──────────────────────────────────────────────────────────
const defaultLeaderboard = [
  { rank: 1, name: 'Rex', points: 1420, streak: 12 },
  { rank: 2, name: 'Mina', points: 1360, streak: 10 },
  { rank: 3, name: 'Kuro', points: 1210, streak: 8 },
  { rank: 4, name: 'Nova', points: 980, streak: 6 },
];

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

async function getContent() {
  try {
    await access(dataFile);
    const raw = await readFile(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return getSeedContent();
  }
}

async function getLeaderboard() {
  try {
    await access(leaderboardFile);
    const raw = await readFile(leaderboardFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultLeaderboard;
  }
}

async function getNotifications() {
  try {
    await access(notificationsFile);
    const raw = await readFile(notificationsFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function computeOpsSnapshot(content) {
  const modules = content.modules || [];
  const lessons = modules.flatMap((module) => module.lessons || []);
  const packs = content.packs || [];
  const replays = content.liveReplays || [];
  return {
    modulesWithoutLessons: modules.filter((module) => !(module.lessons || []).length).length,
    lessonsWithoutContent: lessons.filter((lesson) => !(lesson.content || '').trim()).length,
    packsWithoutCover: packs.filter((pack) => !(pack.coverImage || '').trim()).length,
    packsWithoutModules: packs.filter((pack) => !(pack.moduleIds || []).length).length,
    replaysWithoutUrl: replays.filter((replay) => !(replay.url || '').trim()).length,
    updatedAt: new Date().toISOString(),
  };
}

// ─── Angel Ops ────────────────────────────────────────────────────────────────
function defaultAngelOpsState() {
  return {
    updatedAt: new Date().toISOString(),
    wallets: { trading: '', reserve: '', moonbag: '' },
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

// ─── Catalog ──────────────────────────────────────────────────────────────────
async function getCatalog() {
  try {
    await access(catalogFile);
    const raw = await readFile(catalogFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { products: [], version: 1, updatedAt: new Date().toISOString() };
  }
}

// ─── Payments ─────────────────────────────────────────────────────────────────
function defaultPaymentsState() {
  return {
    payments: [],
    entitlements: [],
    telemetry: {
      events: { catalogView: 0, addToCart: 0, paymentCreate: 0, paymentConfirm: 0 },
      rpc: { calls: 0, errors: 0 },
      fraud: { rateLimited: 0 },
    },
    updatedAt: new Date().toISOString(),
  };
}

async function getPaymentsState() {
  try {
    await access(paymentsFile);
    const raw = await readFile(paymentsFile, 'utf8');
    const parsed = JSON.parse(raw);
    const def = defaultPaymentsState();
    return {
      ...def,
      ...parsed,
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      entitlements: Array.isArray(parsed.entitlements) ? parsed.entitlements : [],
      telemetry: {
        events: { ...def.telemetry.events, ...(parsed.telemetry?.events || {}) },
        rpc: { ...def.telemetry.rpc, ...(parsed.telemetry?.rpc || {}) },
        fraud: { ...def.telemetry.fraud, ...(parsed.telemetry?.fraud || {}) },
      },
    };
  } catch {
    return defaultPaymentsState();
  }
}

async function savePaymentsState(state) {
  await mkdir(path.dirname(paymentsFile), { recursive: true });
  await writeFile(paymentsFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

function sanitizePayment(payment) {
  const { ...safe } = payment;
  return safe;
}

async function resolveCartItems(productIds) {
  if (!Array.isArray(productIds) || !productIds.length) {
    throw new Error('productIds must be a non-empty array');
  }
  const catalog = await getCatalog();
  const products = catalog.products || [];
  const lineItems = [];
  let totalSol = 0;
  for (const id of productIds) {
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error(`Product not found: ${id}`);
    const priceSol = Number(product.price || product.priceSol || 0);
    lineItems.push({ productId: product.id, name: product.name || product.title || id, priceSol });
    totalSol += priceSol;
  }
  return { productIds, lineItems, amountSol: Math.max(0.000001, totalSol) };
}

function nextReceiverWallet(state) {
  if (!paymentWalletPool.length) return '';
  const confirmedCount = (state.payments || []).filter((p) => p.status === 'confirmed').length;
  return paymentWalletPool[confirmedCount % paymentWalletPool.length];
}

function trackEvent(state, eventName) {
  if (state.telemetry?.events) {
    state.telemetry.events[eventName] = Number(state.telemetry.events[eventName] || 0) + 1;
  }
}

function createExpiresAtIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + PAYMENT_EXPIRY_MINUTES);
  return d.toISOString();
}

function touchPaymentStatus(payment) {
  if (payment.status === 'pending' && payment.expiresAt && new Date() > new Date(payment.expiresAt)) {
    payment.status = 'expired';
    return true;
  }
  return false;
}

function normalizePaymentStatuses(state) {
  let changed = false;
  for (const payment of state.payments || []) {
    if (touchPaymentStatus(payment)) changed = true;
  }
  return changed;
}

function readOwnerKeysFromQuery(requestUrl) {
  const wallet = requestUrl.searchParams.get('wallet');
  const telegramId = requestUrl.searchParams.get('telegramId');
  return [wallet, telegramId ? String(telegramId) : null].filter(Boolean).map((k) => k.trim());
}

function paymentMatchesOwner(payment, keys) {
  if (!keys.length) return false;
  return keys.includes(payment.buyerWallet) || keys.includes(String(payment.telegramId || ''));
}

function grantEntitlement(state, payment) {
  const ownerKey = payment.telegramId ? String(payment.telegramId) : payment.buyerWallet;
  if (!ownerKey) return;
  for (const productId of payment.productIds || []) {
    const already = state.entitlements.some((e) => e.ownerKey === ownerKey && e.productId === productId);
    if (!already) {
      state.entitlements.push({
        id: randomUUID(),
        ownerKey,
        productId,
        paymentId: payment.id,
        createdAt: new Date().toISOString(),
      });
    }
  }
}

function finalizeConfirmedPayment(state, payment, signature) {
  payment.status = 'confirmed';
  payment.txSignature = signature;
  payment.confirmedAt = new Date().toISOString();
  grantEntitlement(state, payment);
}

async function verifySolanaPayment(state, { signature, receiverWallet, amountSol, buyerWallet }) {
  state.telemetry.rpc.calls = (state.telemetry.rpc.calls || 0) + 1;
  try {
    const response = await fetch(SOLANA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }],
      }),
    });
    const data = await response.json();
    if (data.error || !data.result) {
      state.telemetry.rpc.errors = (state.telemetry.rpc.errors || 0) + 1;
      throw new Error('Transaction not found on-chain.');
    }
    if (data.result?.meta?.err !== null && data.result?.meta?.err !== undefined) {
      throw new Error('Transaction failed on-chain.');
    }
    return true;
  } catch (error) {
    state.telemetry.rpc.errors = (state.telemetry.rpc.errors || 0) + 1;
    throw error;
  }
}

async function detectPaymentSignature(state, payment) {
  if (!payment.receiverWallet) return null;
  state.telemetry.rpc.calls = (state.telemetry.rpc.calls || 0) + 1;
  try {
    const response = await fetch(SOLANA_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [payment.receiverWallet, { limit: 10 }],
      }),
    });
    const data = await response.json();
    if (data.error || !Array.isArray(data.result)) return null;
    return data.result[0]?.signature || null;
  } catch {
    state.telemetry.rpc.errors = (state.telemetry.rpc.errors || 0) + 1;
    return null;
  }
}

async function runAutoDetectSweep() {
  const state = await getPaymentsState();
  const pending = state.payments.filter((p) => p.status === 'pending' && p.receiverWallet);
  let detected = 0;
  let checked = 0;
  for (const payment of pending) {
    touchPaymentStatus(payment);
    if (payment.status !== 'pending') continue;
    checked += 1;
    try {
      const sig = await detectPaymentSignature(state, payment);
      if (sig) {
        finalizeConfirmedPayment(state, payment, sig);
        trackEvent(state, 'paymentConfirm');
        detected += 1;
      }
    } catch {
      // ignore individual failures
    }
  }
  normalizePaymentStatuses(state);
  if (checked > 0 || detected > 0) await savePaymentsState(state);
  return { checked, detected };
}

function getMiniAppUrl() {
  return TELEGRAM_MINI_APP_URL || null;
}

async function sendTelegramMessage(chatId, text, replyMarkup) {
  if (!TELEGRAM_BOT_TOKEN) return;
  const body = { chat_id: chatId, text };
  if (replyMarkup) body.reply_markup = replyMarkup;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── Game Runs ────────────────────────────────────────────────────────────────
function defaultRunsState() {
  return { runs: [], updatedAt: new Date().toISOString() };
}

async function getRunsState() {
  try {
    await access(runsFile);
    const raw = await readFile(runsFile, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultRunsState(), ...parsed, runs: Array.isArray(parsed.runs) ? parsed.runs : [] };
  } catch {
    return defaultRunsState();
  }
}

async function saveRunsState(state) {
  await mkdir(path.dirname(runsFile), { recursive: true });
  await writeFile(runsFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

// ─── Referrals ────────────────────────────────────────────────────────────────
function defaultReferralsState() {
  return { referrals: [], updatedAt: new Date().toISOString() };
}

async function getReferralsState() {
  try {
    await access(referralsFile);
    const raw = await readFile(referralsFile, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultReferralsState(), ...parsed, referrals: Array.isArray(parsed.referrals) ? parsed.referrals : [] };
  } catch {
    return defaultReferralsState();
  }
}

async function saveReferralsState(state) {
  await mkdir(path.dirname(referralsFile), { recursive: true });
  await writeFile(referralsFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

// ─── Miniapp telemetry ────────────────────────────────────────────────────────
function defaultMiniappTelemetry() {
  return { events: [], summary: {}, updatedAt: new Date().toISOString() };
}

async function getMiniappTelemetry() {
  try {
    await access(miniappTelemetryFile);
    const raw = await readFile(miniappTelemetryFile, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultMiniappTelemetry(), ...parsed, events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return defaultMiniappTelemetry();
  }
}

async function saveMiniappTelemetry(state) {
  await mkdir(path.dirname(miniappTelemetryFile), { recursive: true });
  await writeFile(miniappTelemetryFile, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

// ─── Server ───────────────────────────────────────────────────────────────────
const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  const pathName = parsePath(req.url);
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // ── Catalog ──────────────────────────────────────────────────────────────
  if (pathName === '/api/catalog' && req.method === 'GET') {
    const catalog = await getCatalog();
    return send(res, 200, { ok: true, ...catalog });
  }

  // ── Academy content ───────────────────────────────────────────────────────
  if (pathName === '/api/academy/content' && req.method === 'GET') {
    const content = await getContent();
    return send(res, 200, content);
  }

  if (pathName === '/api/academy/content' && req.method === 'PUT') {
    try {
      const parsed = await readJsonBody(req);
      parsed.updatedAt = new Date().toISOString();
      await writeFile(dataFile, JSON.stringify(parsed, null, 2));
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (req.url === '/api/academy/leaderboard' && req.method === 'GET') {
    const leaderboard = await getLeaderboard();
    return send(res, 200, leaderboard);
  }

  if (req.url === '/api/academy/ops' && req.method === 'GET') {
    const content = await getContent();
    return send(res, 200, computeOpsSnapshot(content));
  }

  if (req.url === '/api/academy/notifications' && req.method === 'GET') {
    const subscriptions = await getNotifications();
    return send(res, 200, subscriptions);
  }

  if (req.url === '/api/academy/notifications' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const channel = String(parsed.channel || '').trim();
        const contact = String(parsed.contact || '').trim();
        if (!channel || !contact) return send(res, 400, { ok: false, error: 'channel/contact required' });
        const existing = await getNotifications();
        const next = [{ id: `sub-${Date.now()}`, channel, contact, createdAt: new Date().toISOString() }, ...existing].slice(0, 200);
        await writeFile(notificationsFile, JSON.stringify(next, null, 2));
        return send(res, 200, { ok: true });
      } catch {
        return send(res, 400, { ok: false, error: 'Invalid JSON body' });
      }
    });
    return;
  }

  // ── Payments ──────────────────────────────────────────────────────────────
  if (pathName === '/api/payments/create-cart' && req.method === 'POST') {
    try {
      if (isRateLimited(req, 'payment-create')) {
        const state = await getPaymentsState();
        state.telemetry.fraud.rateLimited = Number(state.telemetry.fraud.rateLimited || 0) + 1;
        await savePaymentsState(state);
        return send(res, 429, { ok: false, error: 'Trop de requêtes. Réessaye dans 1 minute.' });
      }
      const body = await readJsonBody(req);
      const cart = await resolveCartItems(body.productIds);

      const state = await getPaymentsState();
      const payment = {
        id: randomUUID(),
        productIds: cart.productIds,
        lineItems: cart.lineItems,
        amountSol: cart.amountSol,
        receiverWallet: nextReceiverWallet(state),
        reference: `kabal-${Date.now().toString(36)}`,
        status: 'pending',
        source: body.source || 'telegram-miniapp',
        buyerWallet: body.buyerWallet || null,
        telegramId: body.telegramId || null,
        txSignature: null,
        createdAt: new Date().toISOString(),
        expiresAt: createExpiresAtIso(),
      };

      state.payments.push(payment);
      trackEvent(state, 'paymentCreate');
      await savePaymentsState(state);
      return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/payments/create' && req.method === 'POST') {
    try {
      if (isRateLimited(req, 'payment-create')) {
        const state = await getPaymentsState();
        state.telemetry.fraud.rateLimited = Number(state.telemetry.fraud.rateLimited || 0) + 1;
        await savePaymentsState(state);
        return send(res, 429, { ok: false, error: 'Trop de requêtes. Réessaye dans 1 minute.' });
      }
      const body = await readJsonBody(req);
      const productIds = body.productId ? [body.productId] : body.productIds;
      const cart = await resolveCartItems(productIds);

      const state = await getPaymentsState();
      const payment = {
        id: randomUUID(),
        productIds: cart.productIds,
        lineItems: cart.lineItems,
        amountSol: cart.amountSol,
        receiverWallet: nextReceiverWallet(state),
        reference: `kabal-${Date.now().toString(36)}`,
        status: 'pending',
        source: body.source || 'telegram-miniapp',
        buyerWallet: body.buyerWallet || null,
        telegramId: body.telegramId || null,
        txSignature: null,
        createdAt: new Date().toISOString(),
        expiresAt: createExpiresAtIso(),
      };

      state.payments.push(payment);
      trackEvent(state, 'paymentCreate');
      await savePaymentsState(state);
      return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  const paymentMatch = pathName.match(/^\/api\/payments\/([a-f0-9-]+)$/i);
  if (paymentMatch && req.method === 'GET') {
    const state = await getPaymentsState();
    const payment = state.payments.find((entry) => entry.id === paymentMatch[1]);
    if (!payment) return send(res, 404, { ok: false, error: 'Paiement introuvable.' });

    const changed = normalizePaymentStatuses(state);
    if (changed) await savePaymentsState(state);

    return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
  }

  if (pathName === '/api/payments/history' && req.method === 'GET') {
    const state = await getPaymentsState();
    const changed = normalizePaymentStatuses(state);
    if (changed) await savePaymentsState(state);

    const ownerKeys = readOwnerKeysFromQuery(requestUrl);
    const limit = Math.min(Number(requestUrl.searchParams.get('limit') || 20), 100);
    const entries = state.payments
      .filter((payment) => paymentMatchesOwner(payment, ownerKeys))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((payment) => sanitizePayment(payment));

    return send(res, 200, { ok: true, payments: entries });
  }

  if (pathName === '/api/access/list' && req.method === 'GET') {
    const ownerKeys = readOwnerKeysFromQuery(requestUrl);
    if (!ownerKeys.length) return send(res, 400, { ok: false, error: 'wallet or telegramId required.' });

    const state = await getPaymentsState();
    const catalog = await getCatalog();
    const productsById = new Map((catalog.products || []).map((p) => [p.id, p]));

    const entitlements = state.entitlements
      .filter((entry) => ownerKeys.includes(entry.ownerKey))
      .map((entry) => ({ ...entry, product: productsById.get(entry.productId) || null }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return send(res, 200, { ok: true, entitlements });
  }

  const paymentConfirmMatch = pathName.match(/^\/api\/payments\/([a-f0-9-]+)\/confirm$/i);
  if (paymentConfirmMatch && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.signature) return send(res, 400, { ok: false, error: 'signature requise.' });

      const state = await getPaymentsState();
      const payment = state.payments.find((entry) => entry.id === paymentConfirmMatch[1]);
      if (!payment) return send(res, 404, { ok: false, error: 'Paiement introuvable.' });
      touchPaymentStatus(payment);
      if (payment.status === 'confirmed') return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
      if (payment.status === 'expired') return send(res, 400, { ok: false, error: 'Paiement expiré. Crée un nouveau paiement.' });

      await verifySolanaPayment(state, {
        signature: body.signature,
        receiverWallet: payment.receiverWallet,
        amountSol: payment.amountSol,
        buyerWallet: payment.buyerWallet,
      });

      finalizeConfirmedPayment(state, payment, body.signature);
      trackEvent(state, 'paymentConfirm');
      await savePaymentsState(state);

      return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  const paymentDetectMatch = pathName.match(/^\/api\/payments\/([a-f0-9-]+)\/detect$/i);
  if (paymentDetectMatch && req.method === 'POST') {
    try {
      const state = await getPaymentsState();
      const payment = state.payments.find((entry) => entry.id === paymentDetectMatch[1]);
      if (!payment) return send(res, 404, { ok: false, error: 'Paiement introuvable.' });

      touchPaymentStatus(payment);
      if (payment.status === 'confirmed') return send(res, 200, { ok: true, payment: sanitizePayment(payment), detected: true });
      if (payment.status === 'expired') return send(res, 400, { ok: false, error: 'Paiement expiré. Crée un nouveau paiement.' });

      const signature = await detectPaymentSignature(state, payment);
      if (!signature) {
        return send(res, 404, { ok: false, error: 'No matching on-chain payment detected yet.', detected: false });
      }

      finalizeConfirmedPayment(state, payment, signature);
      trackEvent(state, 'paymentConfirm');
      await savePaymentsState(state);
      return send(res, 200, { ok: true, payment: sanitizePayment(payment), detected: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/payments/auto-detect/run' && req.method === 'POST') {
    try {
      const result = await runAutoDetectSweep();
      return send(res, 200, { ok: true, ...result });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/analytics/event' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const accepted = new Set(['catalogView', 'addToCart', 'paymentCreate', 'paymentConfirm']);
      const eventName = String(body.event || '');
      if (!accepted.has(eventName)) return send(res, 400, { ok: false, error: 'Unknown event.' });
      const state = await getPaymentsState();
      trackEvent(state, eventName);
      await savePaymentsState(state);
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/analytics/dashboard' && req.method === 'GET') {
    const state = await getPaymentsState();
    const payments = state.payments || [];
    const created = payments.length;
    const confirmed = payments.filter((entry) => entry.status === 'confirmed').length;
    const pending = payments.filter((entry) => entry.status === 'pending').length;
    const expired = payments.filter((entry) => entry.status === 'expired').length;
    const funnel = {
      views: Number(state.telemetry.events.catalogView || 0),
      addToCart: Number(state.telemetry.events.addToCart || 0),
      paymentCreate: Number(state.telemetry.events.paymentCreate || 0),
      paymentConfirm: Number(state.telemetry.events.paymentConfirm || 0),
    };

    return send(res, 200, {
      ok: true,
      payments: { created, confirmed, pending, expired },
      funnel,
      rpc: state.telemetry.rpc,
      fraud: state.telemetry.fraud,
      updatedAt: state.updatedAt,
    });
  }

  if (pathName === '/api/payments/link-telegram' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.paymentId || !body.telegramId) {
        return send(res, 400, { ok: false, error: 'paymentId et telegramId requis.' });
      }
      const state = await getPaymentsState();
      const payment = state.payments.find((entry) => entry.id === body.paymentId);
      if (!payment) return send(res, 404, { ok: false, error: 'Paiement introuvable.' });
      payment.telegramId = String(body.telegramId);
      if (payment.status === 'confirmed') grantEntitlement(state, payment);
      await savePaymentsState(state);
      return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/telegram/webhook' && req.method === 'POST') {
    try {
      const update = await readJsonBody(req);
      const text = (update.message?.text || '').trim();
      const chatId = update.message?.chat?.id;

      if (chatId && /^\/start/i.test(text)) {
        const miniAppUrl = getMiniAppUrl();
        const message = miniAppUrl
          ? `Bienvenue dans Kabal Mini App ✅\nOuvre la mini app pour le catalogue et le paiement SOL: ${miniAppUrl}`
          : 'Mini app non configurée (TELEGRAM_MINI_APP_URL).';

        const replyMarkup = miniAppUrl
          ? { inline_keyboard: [[{ text: '🛒 Ouvrir Kabal Mini App', web_app: { url: miniAppUrl } }]] }
          : undefined;

        await sendTelegramMessage(chatId, message, replyMarkup);
      }

      const linkMatch = text.match(/^\/start\s+link_([a-f0-9-]+)/i);
      if (linkMatch && chatId) {
        const state = await getPaymentsState();
        const payment = state.payments.find((entry) => entry.id === linkMatch[1]);
        if (payment) {
          payment.telegramId = String(chatId);
          if (payment.status === 'confirmed') grantEntitlement(state, payment);
          await savePaymentsState(state);
          await sendTelegramMessage(chatId, `Paiement ${payment.id} lié à ton compte Telegram ✅`);
        }
      }

      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  // ── Game runs (Telegram Mini App) ─────────────────────────────────────────
  if (pathName === '/api/runs/finish' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { telegramUserId, runSeed, score, floor, characterId, referralCodeUsed } = body;
      if (!runSeed || score === undefined || floor === undefined) {
        return send(res, 400, { ok: false, error: 'runSeed, score, floor required.' });
      }
      const state = await getRunsState();
      const run = {
        id: randomUUID(),
        telegramUserId: telegramUserId || 'guest',
        runSeed: String(runSeed).slice(0, 64),
        score: Math.max(0, Number(score) || 0),
        floor: Math.max(0, Number(floor) || 0),
        characterId: String(characterId || 'kabalian').slice(0, 32),
        referralCodeUsed: referralCodeUsed || null,
        createdAt: new Date().toISOString(),
      };
      state.runs.push(run);
      // Keep only last 10 000 runs
      if (state.runs.length > 10000) state.runs = state.runs.slice(-10000);
      await saveRunsState(state);
      return send(res, 200, { ok: true, run });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/runs/leaderboard' && req.method === 'GET') {
    try {
      const limit = Math.min(Number(requestUrl.searchParams.get('limit') || 10), 100);
      const state = await getRunsState();
      // Best score per user
      const bestByUser = new Map();
      for (const run of state.runs) {
        const prev = bestByUser.get(run.telegramUserId);
        if (!prev || run.score > prev.score) bestByUser.set(run.telegramUserId, run);
      }
      const leaderboard = [...bestByUser.values()]
        .sort((a, b) => b.score - a.score || b.floor - a.floor)
        .slice(0, limit)
        .map((run, i) => ({ rank: i + 1, telegramUserId: run.telegramUserId, score: run.score, floor: run.floor, characterId: run.characterId }));
      return send(res, 200, { ok: true, leaderboard });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/runs/friends-leaderboard' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const ids = Array.isArray(body.ids) ? body.ids.map(String).slice(0, 50) : [];
      if (!ids.length) return send(res, 200, { ok: true, leaderboard: [] });

      const state = await getRunsState();
      const bestByUser = new Map();
      for (const run of state.runs) {
        if (!ids.includes(run.telegramUserId)) continue;
        const prev = bestByUser.get(run.telegramUserId);
        if (!prev || run.score > prev.score) bestByUser.set(run.telegramUserId, run);
      }
      const leaderboard = [...bestByUser.values()]
        .sort((a, b) => b.score - a.score || b.floor - a.floor)
        .map((run) => ({ telegramUserId: run.telegramUserId, score: run.score, floor: run.floor }));
      return send(res, 200, { ok: true, leaderboard });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  // ── Referrals ─────────────────────────────────────────────────────────────
  if (pathName === '/api/referrals/claim' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const { inviterCode, invitedUserId } = body;
      if (!inviterCode || !invitedUserId) {
        return send(res, 400, { ok: false, error: 'inviterCode and invitedUserId required.' });
      }
      const state = await getReferralsState();
      const alreadyClaimed = state.referrals.some(
        (r) => r.inviterCode === inviterCode && r.invitedUserId === String(invitedUserId),
      );
      if (alreadyClaimed) {
        const totalClaims = state.referrals.filter((r) => r.inviterCode === inviterCode).length;
        return send(res, 200, { ok: true, claimed: false, stats: { totalClaims } });
      }
      state.referrals.push({
        id: randomUUID(),
        inviterCode: String(inviterCode).slice(0, 64),
        invitedUserId: String(invitedUserId).slice(0, 64),
        createdAt: new Date().toISOString(),
      });
      await saveReferralsState(state);
      const totalClaims = state.referrals.filter((r) => r.inviterCode === inviterCode).length;
      return send(res, 200, { ok: true, claimed: true, stats: { totalClaims } });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  const referralStatsMatch = pathName.match(/^\/api\/referrals\/stats\/(.+)$/i);
  if (referralStatsMatch && req.method === 'GET') {
    try {
      const code = decodeURIComponent(referralStatsMatch[1]);
      const state = await getReferralsState();
      const totalClaims = state.referrals.filter((r) => r.inviterCode === code).length;
      return send(res, 200, { ok: true, stats: { code, totalClaims } });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  // ── Miniapp auth & telemetry ───────────────────────────────────────────────
  if (pathName === '/api/miniapp/auth/check' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const telegramUserId = String(body.telegramUserId || '');
      // Basic check: if initData header is present, consider it verified
      const initData = req.headers['x-telegram-init-data'] || '';
      const verified = Boolean(initData && telegramUserId && telegramUserId !== 'guest');
      return send(res, 200, { ok: true, auth: { verified, telegramUserId } });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/telemetry/event' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const event = String(body.event || '').slice(0, 64);
      const telegramUserId = String(body.telegramUserId || 'guest').slice(0, 64);
      if (!event) return send(res, 400, { ok: false, error: 'event required.' });
      const state = await getMiniappTelemetry();
      state.events.push({
        id: randomUUID(),
        event,
        telegramUserId,
        meta: body.meta || {},
        createdAt: new Date().toISOString(),
      });
      // Keep last 5000 events
      if (state.events.length > 5000) state.events = state.events.slice(-5000);
      // Update summary counts
      state.summary[event] = (state.summary[event] || 0) + 1;
      await saveMiniappTelemetry(state);
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/telemetry/summary' && req.method === 'GET') {
    try {
      const state = await getMiniappTelemetry();
      return send(res, 200, { ok: true, summary: state.summary, updatedAt: state.updatedAt });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  // ── Health ────────────────────────────────────────────────────────────────
  if (req.url === '/health') return send(res, 200, { ok: true });
  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Academy API running on http://localhost:${PORT}`);

  if (PAYMENT_AUTODETECT_INTERVAL_MS > 0) {
    setInterval(() => {
      runAutoDetectSweep().catch((error) => {
        console.error('Auto-detect sweep failed:', error.message);
      });
    }, PAYMENT_AUTODETECT_INTERVAL_MS);
  }
});
