import { createServer } from 'node:http';
import { createHmac, randomUUID } from 'node:crypto';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.ACADEMY_API_PORT || 8787);
const dataFile = path.join(__dirname, 'data', 'academy-content.json');
const compactFile = path.join(__dirname, '..', 'src', 'docs', 'memecoin-trading-guide-compact.md');
const paymentsFile = path.join(__dirname, 'data', 'payments.json');
const miniappFile = path.join(__dirname, 'data', 'miniapp.json');
const miniappConfigFile = path.join(__dirname, 'data', 'miniapp-config.json');
const miniappAssetsRoot = path.join(__dirname, '..', 'public', 'miniapp-assets');
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_STRICT_AUTH = process.env.TELEGRAM_STRICT_AUTH === '1';
const paymentWalletPool = (process.env.PAYMENT_WALLET_POOL || process.env.PAYMENT_WALLET || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

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

async function getCatalog() {
  const raw = await readFile(catalogFile, 'utf8');
  return JSON.parse(raw);
}

function createEmptyPaymentsState() {
  return { version: 1, walletCursor: 0, payments: [], entitlements: [] };
}


async function getWaitlistState() {
  try {
    await access(waitlistFile);
    const raw = await readFile(waitlistFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    const seed = { version: 1, entries: [] };
    await writeFile(waitlistFile, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function saveWaitlistState(state) {
  state.updatedAt = new Date().toISOString();
  await writeFile(waitlistFile, JSON.stringify(state, null, 2));
}

async function getPaymentsState() {
  try {
    await access(paymentsFile);
    const raw = await readFile(paymentsFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    const seed = createEmptyPaymentsState();
    await writeFile(paymentsFile, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function savePaymentsState(state) {
  state.updatedAt = new Date().toISOString();
  await writeFile(paymentsFile, JSON.stringify(state, null, 2));
}

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Telegram-Init-Data',
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
}

function sanitizePayment(payment) {
  if (!payment) return null;
  return {
    id: payment.id,
    productIds: payment.productIds || [payment.productId],
    lineItems: payment.lineItems || [],
    amountSol: payment.amountSol,
    receiverWallet: payment.receiverWallet,
    reference: payment.reference,
    status: payment.status,
    source: payment.source,
    buyerWallet: payment.buyerWallet,
    telegramId: payment.telegramId,
    createdAt: payment.createdAt,
    confirmedAt: payment.confirmedAt,
    txSignature: payment.txSignature,
    expiresAt: payment.expiresAt,
  };
}


function isPaymentExpired(payment) {
  if (!payment?.expiresAt) return false;
  return Date.now() >= new Date(payment.expiresAt).getTime();
}

function touchPaymentStatus(payment) {
  if (!payment || payment.status === 'confirmed' || payment.status === 'expired') return;
  if (isPaymentExpired(payment)) payment.status = 'expired';
}

function createExpiresAtIso() {
  const minutes = Number.isFinite(PAYMENT_EXPIRY_MINUTES) && PAYMENT_EXPIRY_MINUTES > 0 ? PAYMENT_EXPIRY_MINUTES : 15;
  return new Date(Date.now() + minutes * 60_000).toISOString();
}


function normalizePaymentStatuses(state) {
  let changed = false;
  state.payments.forEach((payment) => {
    const previous = payment.status;
    touchPaymentStatus(payment);
    if (payment.status !== previous) changed = true;
  });
  return changed;
}

function paymentMatchesOwner(payment, ownerKeys) {
  if (!ownerKeys.length) return false;
  const walletKey = payment.buyerWallet ? `wallet:${payment.buyerWallet}` : null;
  const telegramKey = payment.telegramId ? `telegram:${payment.telegramId}` : null;
  return ownerKeys.includes(walletKey) || ownerKeys.includes(telegramKey);
}

function readOwnerKeysFromQuery(requestUrl) {
  const wallet = requestUrl.searchParams.get('wallet');
  const telegramId = requestUrl.searchParams.get('telegramId');
  const keys = [];
  if (wallet) keys.push(`wallet:${wallet}`);
  if (telegramId) keys.push(`telegram:${telegramId}`);
  return keys;
}

function nextReceiverWallet(state) {
  if (!paymentWalletPool.length) {
    throw new Error('Aucun wallet de réception configuré. Ajouter PAYMENT_WALLET ou PAYMENT_WALLET_POOL.');
  }
  const index = state.walletCursor % paymentWalletPool.length;
  state.walletCursor += 1;
  return paymentWalletPool[index];
}

async function verifySolanaPayment({ signature, receiverWallet, amountSol, buyerWallet }) {
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

  const payload = await response.json();
  if (!payload.result) {
    throw new Error('Transaction introuvable sur le RPC Solana.');
  }

  const tx = payload.result;
  if (tx.meta?.err) {
    throw new Error('Transaction en erreur onchain.');
  }

  const transfers = tx.transaction?.message?.instructions?.filter(
    (ix) => ix.program === 'system' && ix.parsed?.type === 'transfer',
  ) || [];

  const minLamports = Math.round(Number(amountSol) * 1_000_000_000);
  const matchingTransfer = transfers.find((ix) => {
    const info = ix.parsed?.info || {};
    const amountOk = Number(info.lamports || 0) >= minLamports;
    const receiverOk = info.destination === receiverWallet;
    const senderOk = buyerWallet ? info.source === buyerWallet : true;
    return amountOk && receiverOk && senderOk;
  });

  if (!matchingTransfer) {
    throw new Error('Aucun transfer SOL valide trouvé (wallet ou montant incorrect).');
  }
}

function grantEntitlement(state, payment) {
  const keys = [];
  if (payment.telegramId) keys.push(`telegram:${payment.telegramId}`);
  if (payment.buyerWallet) keys.push(`wallet:${payment.buyerWallet}`);

  const productIds = payment.productIds || [payment.productId].filter(Boolean);

  keys.forEach((ownerKey) => {
    productIds.forEach((productId) => {
      const existing = state.entitlements.find((entry) => entry.ownerKey === ownerKey && entry.productId === productId);
      if (!existing) {
        state.entitlements.push({
          id: randomUUID(),
          ownerKey,
          productId,
          paymentId: payment.id,
          createdAt: new Date().toISOString(),
        });
      }
    });
  });
}

async function sendTelegramMessage(chatId, text, replyMarkup) {
  if (!TELEGRAM_BOT_TOKEN) {
    return { sent: false, reason: 'TELEGRAM_BOT_TOKEN missing' };
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Telegram sendMessage failed: ${payload}`);
  }

  return { sent: true };
}

function getMiniAppUrl(productId) {
  if (!TELEGRAM_MINI_APP_URL) return null;
  const url = new URL(TELEGRAM_MINI_APP_URL);
  if (productId) url.searchParams.set('productId', productId);
  return url.toString();
}

function parsePath(url = '/') {
  return url.split('?')[0];
}

function parseTelegramInitData(rawInitData = '') {
  const params = new URLSearchParams(rawInitData);
  const hash = params.get('hash') || '';
  const authDate = Number(params.get('auth_date') || '0');
  const items = [];
  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue;
    items.push([key, value]);
  }
  items.sort((a, b) => a[0].localeCompare(b[0]));
  const dataCheckString = items.map(([key, value]) => `${key}=${value}`).join('\n');

  let user = null;
  try {
    const rawUser = params.get('user');
    if (rawUser) user = JSON.parse(rawUser);
  } catch {
    user = null;
  }

  return { hash, authDate, user, dataCheckString };
}

function verifyTelegramInitData(rawInitData = '') {
  if (!rawInitData) return { ok: false, reason: 'missing-init-data' };
  if (!TELEGRAM_BOT_TOKEN) return { ok: false, reason: 'missing-bot-token' };

  const { hash, authDate, user, dataCheckString } = parseTelegramInitData(rawInitData);
  if (!hash || !authDate || !dataCheckString) return { ok: false, reason: 'invalid-init-data-shape' };

  const secret = createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
  const expected = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (expected !== hash) return { ok: false, reason: 'invalid-signature' };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - authDate) > 86400) return { ok: false, reason: 'auth-date-expired' };

  return { ok: true, user };
}

function getMiniappAuth(req, bodyUserId = null) {
  const rawInitData = String(req.headers['x-telegram-init-data'] || '');
  const verified = verifyTelegramInitData(rawInitData);

  if (verified.ok && verified.user?.id) {
    return {
      verified: true,
      userId: String(verified.user.id),
      username: verified.user.username || null,
      reason: 'verified',
    };
  }

  const fallbackUserId = bodyUserId ? String(bodyUserId) : 'guest';
  return {
    verified: false,
    userId: fallbackUserId,
    username: null,
    reason: verified.reason || 'unverified',
  };
}

function createEmptyMiniappConfig() {
  return {
    version: 2,
    assets: {
      monsters: {
        mob: [],
        champions: [],
        boss: [],
      },
      backgrounds: {
        jungle: [],
        ruins: [],
        temple: [],
      },
      zones: {
        general: [],
      },
      events: {
        general: [],
      },
    },
    gameLogic: {
      enemyHpScale: 1,
      enemyDamageScale: 1,
      scoreScale: 1,
      randomEventChance: 0.2,
      waveGrowthPerStage: 0.12,
      bossHpMultiplier: 2.4,
      bossDamageMultiplier: 1.8,
      critChance: 0.12,
      critMultiplier: 1.75,
      dodgeChance: 0.08,
      lifeSteal: 0.05,
      shieldDecayPerTurn: 0.15,
      comboWindowTurns: 2,
      rerollCostScore: 20,
      reviveHpRatio: 0.35,
      eventIntensityScale: 1,
      dropRateMultiplier: 1,
    },
    randomEvents: [],
    visuals: {
      backgroundUrl: '',
      logoUrl: '',
      storyFragmentImageUrl: '',
    },
    characters: {
      playable: {},
      emotionUrls: {},
    },
    narrative: {
      kabalian: [],
      kkm: [],
    },
    adminBacklog: [],
    monsters: {
      traitsCatalog: [],
      customMonsters: [],
    },
    artifacts: {
      customArtifacts: [],
    },
  };
}

async function getMiniappConfig() {
  try {
    await access(miniappConfigFile);
    const raw = await readFile(miniappConfigFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    const seed = createEmptyMiniappConfig();
    await writeFile(miniappConfigFile, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function saveMiniappConfig(config) {
  config.updatedAt = new Date().toISOString();
  await writeFile(miniappConfigFile, JSON.stringify(config, null, 2));
}

function mergeConfigSection(base = {}, patch = {}) {
  const out = { ...base };
  Object.entries(patch || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
      out[key] = { ...out[key], ...value };
    } else {
      out[key] = value;
    }
  });
  return out;
}

function slugifyName(name = 'asset') {
  return String(name || 'asset')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'asset';
}

async function saveDataUrlAsset({ category, subcategory = '', fileName, dataUrl }) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid dataUrl image payload.');

  const mime = match[1].toLowerCase();
  const base64 = match[2];
  const ext = mime.includes('png') ? 'png' : mime.includes('jpeg') || mime.includes('jpg') ? 'jpg' : mime.includes('webp') ? 'webp' : 'png';
  const safeCategory = ['monsters', 'backgrounds', 'zones', 'events'].includes(category) ? category : 'misc';
  const safeSubcategory = slugifyName(subcategory || 'general');
  const folder = path.join(miniappAssetsRoot, safeCategory, safeSubcategory);
  await mkdir(folder, { recursive: true });

  const slug = slugifyName(fileName);
  const finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${slug}.${ext}`;
  const fullPath = path.join(folder, finalName);
  await writeFile(fullPath, Buffer.from(base64, 'base64'));

  return {
    id: randomUUID(),
    category: safeCategory,
    subcategory: safeSubcategory,
    fileName: finalName,
    originalName: fileName,
    mime,
    sizeBytes: Math.round(base64.length * 0.75),
    url: `/miniapp-assets/${safeCategory}/${safeSubcategory}/${finalName}`,
    createdAt: new Date().toISOString(),
  };
}


function createEmptyMiniappState() {
  return {
    version: 1,
    runs: [],
    referrals: [],
    referralClaims: [],
    statsByCode: {},
    telemetry: [],
  };
}

async function getMiniappState() {
  try {
    await access(miniappFile);
    const raw = await readFile(miniappFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    const seed = createEmptyMiniappState();
    await writeFile(miniappFile, JSON.stringify(seed, null, 2));
    return seed;
  }
}

async function saveMiniappState(state) {
  state.updatedAt = new Date().toISOString();
  await writeFile(miniappFile, JSON.stringify(state, null, 2));
}

function normalizeReferralCode(code = '') {
  return String(code || '').trim().toLowerCase();
}

function upsertReferralStats(state, code) {
  if (!state.statsByCode[code]) {
    state.statsByCode[code] = {
      code,
      totalClaims: 0,
      updatedAt: new Date().toISOString(),
    };
  }
  return state.statsByCode[code];
}

const writeRateLimit = new Map();

function checkWriteRateLimit(req, limit = 120, windowMs = 60_000) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const bucket = writeRateLimit.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  writeRateLimit.set(ip, bucket);
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}


const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  const pathName = parsePath(req.url);
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (pathName.startsWith('/miniapp-assets/') && req.method === 'GET') {
    try {
      const local = path.join(__dirname, '..', 'public', pathName.replace(/^\/+/, ''));
      const buf = await readFile(local);
      const ext = path.extname(local).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=31536000, immutable' });
      res.end(buf);
      return;
    } catch {
      return send(res, 404, { ok: false, error: 'Asset not found' });
    }
  }

  if (req.method === 'POST' && (pathName.startsWith('/api/runs') || pathName.startsWith('/api/referrals') || pathName.startsWith('/api/telemetry'))) {
    const limit = checkWriteRateLimit(req);
    if (!limit.ok) return send(res, 429, { ok: false, error: 'Too many requests. Slow down.' });
  }

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

  if (pathName === '/api/payments/create-cart' && req.method === 'POST') {
    try {
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
      await savePaymentsState(state);
      return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/payments/create' && req.method === 'POST') {
    try {
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
      .map((entry) => ({
        ...entry,
        product: productsById.get(entry.productId) || null,
      }))
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

      await verifySolanaPayment({
        signature: body.signature,
        receiverWallet: payment.receiverWallet,
        amountSol: payment.amountSol,
        buyerWallet: payment.buyerWallet,
      });

      payment.status = 'confirmed';
      payment.txSignature = body.signature;
      payment.confirmedAt = new Date().toISOString();
      grantEntitlement(state, payment);
      await savePaymentsState(state);

      return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
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


  if (pathName === '/api/waitlist/subscribe' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.productId || !body.email) {
        return send(res, 400, { ok: false, error: 'productId and email are required.' });
      }

      const waitlist = await getWaitlistState();
      const exists = waitlist.entries.find((entry) => entry.productId === body.productId && entry.email.toLowerCase() === String(body.email).toLowerCase());
      if (!exists) {
        waitlist.entries.push({
          id: randomUUID(),
          productId: body.productId,
          email: String(body.email).trim(),
          telegramId: body.telegramId ? String(body.telegramId) : null,
          createdAt: new Date().toISOString(),
        });
        await saveWaitlistState(waitlist);
      }

      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/access/check' && req.method === 'GET') {
    const productId = requestUrl.searchParams.get('productId');
    if (!productId) return send(res, 400, { ok: false, error: 'productId requis.' });

    const keys = readOwnerKeysFromQuery(requestUrl);

    const state = await getPaymentsState();
    const entitlement = state.entitlements.find((entry) => entry.productId === productId && keys.includes(entry.ownerKey));
    return send(res, 200, { ok: true, granted: Boolean(entitlement), entitlement: entitlement || null });
  }

  if (pathName === '/api/miniapp/auth/check' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const auth = getMiniappAuth(req, body.telegramUserId || body.userId || null);
      if (TELEGRAM_STRICT_AUTH && !auth.verified) {
        return send(res, 401, { ok: false, error: `telegram auth failed: ${auth.reason}` });
      }
      return send(res, 200, { ok: true, auth });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/runs/finish' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.runSeed || !Number.isFinite(Number(body.score)) || !Number.isFinite(Number(body.floor))) {
        return send(res, 400, { ok: false, error: 'runSeed, score et floor requis.' });
      }

      const auth = getMiniappAuth(req, body.telegramUserId || null);
      if (TELEGRAM_STRICT_AUTH && !auth.verified) {
        return send(res, 401, { ok: false, error: `telegram auth failed: ${auth.reason}` });
      }

      const state = await getMiniappState();
      const existing = state.runs.find((entry) => entry.telegramUserId === auth.userId && entry.runSeed === String(body.runSeed));
      if (existing) {
        return send(res, 200, { ok: true, deduped: true, run: existing });
      }

      const run = {
        id: randomUUID(),
        telegramUserId: auth.userId,
        referralCodeUsed: normalizeReferralCode(body.referralCodeUsed || ''),
        runSeed: String(body.runSeed),
        score: Number(body.score),
        floor: Number(body.floor),
        characterId: body.characterId || 'kabalian',
        authVerified: auth.verified,
        createdAt: new Date().toISOString(),
      };
      state.runs.push(run);
      state.runs = state.runs.sort((a, b) => b.score - a.score).slice(0, 2000);
      await saveMiniappState(state);
      return send(res, 200, { ok: true, run });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/runs/leaderboard' && req.method === 'GET') {
    const limit = Math.min(100, Math.max(1, Number(requestUrl.searchParams.get('limit') || 20)));
    const state = await getMiniappState();
    return send(res, 200, { ok: true, leaderboard: state.runs.slice(0, limit) });
  }

  if (pathName === '/api/referrals/claim' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const inviterCode = normalizeReferralCode(body.inviterCode);
      const invitedUserId = body.invitedUserId ? String(body.invitedUserId) : '';
      if (!inviterCode || !invitedUserId) {
        return send(res, 400, { ok: false, error: 'inviterCode et invitedUserId requis.' });
      }

      const auth = getMiniappAuth(req, invitedUserId || null);
      if (TELEGRAM_STRICT_AUTH && !auth.verified) {
        return send(res, 401, { ok: false, error: `telegram auth failed: ${auth.reason}` });
      }

      const canonicalInvitedUserId = auth.userId;
      const selfCode = normalizeReferralCode(`ref_${canonicalInvitedUserId}`);
      if (inviterCode === selfCode) {
        return send(res, 200, { ok: true, claimed: false, reason: 'self-referral-blocked' });
      }

      const state = await getMiniappState();
      const duplicate = state.referralClaims.find((entry) => entry.invitedUserId === canonicalInvitedUserId);
      if (duplicate) {
        return send(res, 200, { ok: true, claimed: false, reason: 'already-claimed', claim: duplicate });
      }

      const claim = {
        id: randomUUID(),
        inviterCode,
        invitedUserId: canonicalInvitedUserId,
        authVerified: auth.verified,
        createdAt: new Date().toISOString(),
      };
      state.referralClaims.push(claim);
      state.referrals.push(claim);

      const stats = upsertReferralStats(state, inviterCode);
      stats.totalClaims += 1;
      stats.updatedAt = new Date().toISOString();

      await saveMiniappState(state);
      return send(res, 200, { ok: true, claimed: true, claim, stats, auth: { verified: auth.verified, reason: auth.reason } });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  const referralStatsMatch = pathName.match(/^\/api\/referrals\/stats\/([a-zA-Z0-9_-]+)$/);
  if (referralStatsMatch && req.method === 'GET') {
    const code = normalizeReferralCode(referralStatsMatch[1]);
    const state = await getMiniappState();
    const stats = state.statsByCode?.[code] || { code, totalClaims: 0, updatedAt: null };
    return send(res, 200, { ok: true, stats });
  }

  if (pathName === '/api/runs/friends-leaderboard' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id)).slice(0, 100) : [];
      const state = await getMiniappState();
      const filtered = state.runs.filter((run) => ids.includes(String(run.telegramUserId))).slice(0, 1000);
      const bestByUser = [];
      const byUser = new Map();
      filtered.forEach((run) => {
        const current = byUser.get(run.telegramUserId);
        if (!current || run.score > current.score) byUser.set(run.telegramUserId, run);
      });
      byUser.forEach((value) => bestByUser.push(value));
      bestByUser.sort((a, b) => b.score - a.score);
      return send(res, 200, { ok: true, leaderboard: bestByUser.slice(0, 20) });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/telemetry/event' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.event) return send(res, 400, { ok: false, error: 'event requis.' });
      const auth = getMiniappAuth(req, body.telegramUserId || null);
      if (TELEGRAM_STRICT_AUTH && !auth.verified) {
        return send(res, 401, { ok: false, error: `telegram auth failed: ${auth.reason}` });
      }

      const state = await getMiniappState();
      state.telemetry.push({
        id: randomUUID(),
        event: String(body.event),
        telegramUserId: auth.userId,
        meta: body.meta && typeof body.meta === 'object' ? body.meta : {},
        authVerified: auth.verified,
        createdAt: new Date().toISOString(),
      });
      state.telemetry = state.telemetry.slice(-5000);
      await saveMiniappState(state);
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/telemetry/summary' && req.method === 'GET') {
    const state = await getMiniappState();
    const summary = state.telemetry.reduce((acc, row) => {
      acc[row.event] = (acc[row.event] || 0) + 1;
      return acc;
    }, {});
    return send(res, 200, { ok: true, summary, total: state.telemetry.length });
  }

  if (pathName === '/api/miniapp/config' && req.method === 'GET') {
    const config = await getMiniappConfig();
    return send(res, 200, { ok: true, config });
  }

  if (pathName === '/api/miniapp/config' && req.method === 'PUT') {
    try {
      const body = await readJsonBody(req);
      const current = await getMiniappConfig();
      const next = {
        ...current,
        ...body,
        assets: mergeConfigSection(current.assets || {}, body.assets || {}),
        gameLogic: mergeConfigSection(current.gameLogic || {}, body.gameLogic || {}),
        randomEvents: Array.isArray(body.randomEvents) ? body.randomEvents : current.randomEvents,
      };
      await saveMiniappConfig(next);
      return send(res, 200, { ok: true, config: next });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/miniapp/assets/upload-batch' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const category = String(body.category || 'monsters');
      const subcategory = String(body.subcategory || 'general');
      const files = Array.isArray(body.files) ? body.files.slice(0, 30) : [];
      if (!files.length) return send(res, 400, { ok: false, error: 'No files provided.' });

      const uploaded = [];
      for (const file of files) {
        const item = await saveDataUrlAsset({
          category,
          subcategory,
          fileName: file.name || 'asset.png',
          dataUrl: file.dataUrl || '',
        });
        uploaded.push(item);
      }

      const config = await getMiniappConfig();
      config.assets = config.assets || {};
      const currentByCategory = config.assets[category];

      if (currentByCategory && typeof currentByCategory === 'object' && !Array.isArray(currentByCategory)) {
        const prev = Array.isArray(currentByCategory[subcategory]) ? currentByCategory[subcategory] : [];
        config.assets[category] = {
          ...currentByCategory,
          [subcategory]: [...uploaded, ...prev].slice(0, 1000),
        };
      } else {
        const prev = Array.isArray(config.assets[category]) ? config.assets[category] : [];
        config.assets[category] = [...uploaded, ...prev].slice(0, 1000);
      }

      await saveMiniappConfig(config);

      return send(res, 200, { ok: true, uploaded, config });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/health') return send(res, 200, { ok: true });
  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Academy API running on http://localhost:${PORT}`);
});
