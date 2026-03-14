import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.ACADEMY_API_PORT || 8787);
const dataFile = path.join(__dirname, 'data', 'academy-content.json');
const compactFile = path.join(__dirname, '..', 'src', 'docs', 'memecoin-trading-guide-compact.md');
const paymentsFile = path.join(__dirname, 'data', 'payments.json');
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
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

function createEmptyPaymentsState() {
  return { version: 1, walletCursor: 0, payments: [], entitlements: [] };
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
    'Access-Control-Allow-Headers': 'Content-Type',
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
    productId: payment.productId,
    amountSol: payment.amountSol,
    receiverWallet: payment.receiverWallet,
    reference: payment.reference,
    status: payment.status,
    buyerWallet: payment.buyerWallet,
    telegramId: payment.telegramId,
    createdAt: payment.createdAt,
    confirmedAt: payment.confirmedAt,
    txSignature: payment.txSignature,
  };
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

  keys.forEach((ownerKey) => {
    const existing = state.entitlements.find((entry) => entry.ownerKey === ownerKey && entry.productId === payment.productId);
    if (!existing) {
      state.entitlements.push({
        id: randomUUID(),
        ownerKey,
        productId: payment.productId,
        paymentId: payment.id,
        createdAt: new Date().toISOString(),
      });
    }
  });
}

function parsePath(url = '/') {
  return url.split('?')[0];
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 200, { ok: true });

  const pathName = parsePath(req.url);
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

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

  if (pathName === '/api/payments/create' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const amountSol = Number(body.amountSol);
      if (!body.productId || Number.isNaN(amountSol) || amountSol <= 0) {
        return send(res, 400, { ok: false, error: 'productId et amountSol sont requis.' });
      }

      const state = await getPaymentsState();
      const payment = {
        id: randomUUID(),
        productId: body.productId,
        amountSol,
        receiverWallet: nextReceiverWallet(state),
        reference: `kabal-${Date.now().toString(36)}`,
        status: 'pending',
        buyerWallet: body.buyerWallet || null,
        telegramId: body.telegramId || null,
        txSignature: null,
        createdAt: new Date().toISOString(),
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
    return send(res, 200, { ok: true, payment: sanitizePayment(payment) });
  }

  const paymentConfirmMatch = pathName.match(/^\/api\/payments\/([a-f0-9-]+)\/confirm$/i);
  if (paymentConfirmMatch && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!body.signature) return send(res, 400, { ok: false, error: 'signature requise.' });

      const state = await getPaymentsState();
      const payment = state.payments.find((entry) => entry.id === paymentConfirmMatch[1]);
      if (!payment) return send(res, 404, { ok: false, error: 'Paiement introuvable.' });
      if (payment.status === 'confirmed') return send(res, 200, { ok: true, payment: sanitizePayment(payment) });

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
      const text = update.message?.text || '';
      const chatId = update.message?.chat?.id;
      const match = text.match(/^\/start\s+link_([a-f0-9-]+)/i);
      if (match && chatId) {
        const state = await getPaymentsState();
        const payment = state.payments.find((entry) => entry.id === match[1]);
        if (payment) {
          payment.telegramId = String(chatId);
          if (payment.status === 'confirmed') grantEntitlement(state, payment);
          await savePaymentsState(state);
        }
      }
      return send(res, 200, { ok: true });
    } catch (error) {
      return send(res, 400, { ok: false, error: error.message });
    }
  }

  if (pathName === '/api/access/check' && req.method === 'GET') {
    const productId = requestUrl.searchParams.get('productId');
    const wallet = requestUrl.searchParams.get('wallet');
    const telegramId = requestUrl.searchParams.get('telegramId');

    if (!productId) return send(res, 400, { ok: false, error: 'productId requis.' });

    const keys = [];
    if (wallet) keys.push(`wallet:${wallet}`);
    if (telegramId) keys.push(`telegram:${telegramId}`);

    const state = await getPaymentsState();
    const entitlement = state.entitlements.find((entry) => entry.productId === productId && keys.includes(entry.ownerKey));
    return send(res, 200, { ok: true, granted: Boolean(entitlement), entitlement: entitlement || null });
  }

  if (pathName === '/health') return send(res, 200, { ok: true });
  return send(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Academy API running on http://localhost:${PORT}`);
});
