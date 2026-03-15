import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
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

async function getLeaderboard() {
  try {
    await access(leaderboardFile);
    const raw = await readFile(leaderboardFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return defaultLeaderboard;
  }
  entry.count += 1;
  rateLimitStore.set(key, entry);
  return entry.count > limit;
}

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
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

function send(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,PUT,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  const pathName = parsePath(req.url);
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (pathName === '/api/catalog' && req.method === 'GET') {
    const catalog = await getCatalog();
    return send(res, 200, { ok: true, ...catalog });
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
    req.on('data', (chunk) => {
      body += chunk;
    });
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
