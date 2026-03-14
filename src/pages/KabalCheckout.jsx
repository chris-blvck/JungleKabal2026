import React, { useMemo, useState } from 'react';

const PRODUCTS = [
  { id: 'academy-memecoin', name: 'Formation Memecoin', amountSol: 1.25, description: 'Accès aux modules Academy + updates.' },
  { id: 'academy-premium', name: 'Formation Premium', amountSol: 2.5, description: 'Accès Academy + coaching de groupe.' },
];

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || 'API request failed');
  }
  return payload;
}

export default function KabalCheckout() {
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [buyerWallet, setBuyerWallet] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [payment, setPayment] = useState(null);
  const [signature, setSignature] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedProduct = useMemo(() => PRODUCTS.find((p) => p.id === productId), [productId]);

  const createPayment = async () => {
    setError('');
    setLoading(true);
    try {
      const created = await apiRequest('/api/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          amountSol: selectedProduct.amountSol,
          buyerWallet: buyerWallet || undefined,
          telegramId: telegramId || undefined,
        }),
      });
      setPayment(created.payment);
      setStatus(created.payment.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshPayment = async () => {
    if (!payment?.id) return;
    setError('');
    setLoading(true);
    try {
      const result = await apiRequest(`/api/payments/${payment.id}`);
      setPayment(result.payment);
      setStatus(result.payment.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!payment?.id || !signature.trim()) return;
    setError('');
    setLoading(true);
    try {
      const result = await apiRequest(`/api/payments/${payment.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ signature: signature.trim() }),
      });
      setPayment(result.payment);
      setStatus(result.payment.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090909] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-black">Kabal Checkout (SOL)</h1>
        <p className="text-zinc-300">Flow: création du paiement → envoi SOL → confirmation onchain → entitlement pour token gating.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="mb-3 text-lg font-semibold">1) Choisir l'offre</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PRODUCTS.map((product) => (
              <button
                key={product.id}
                onClick={() => setProductId(product.id)}
                className={`rounded-xl border p-4 text-left ${productId === product.id ? 'border-amber-400/70 bg-amber-500/10' : 'border-white/10 bg-black/30'}`}
              >
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-zinc-400">{product.description}</p>
                <p className="mt-2 text-amber-300">{product.amountSol} SOL</p>
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              value={buyerWallet}
              onChange={(e) => setBuyerWallet(e.target.value)}
              placeholder="Wallet acheteur (optionnel)"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            />
            <input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Telegram ID (optionnel)"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            />
          </div>
          <button onClick={createPayment} disabled={loading} className="mt-4 rounded-xl bg-amber-400 px-4 py-2 font-semibold text-black disabled:opacity-50">
            Créer la demande de paiement
          </button>
        </div>

        {payment && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="mb-2 text-lg font-semibold">2) Paiement</h2>
            <p className="text-sm text-zinc-300">Payment ID: <span className="font-mono">{payment.id}</span></p>
            <p className="text-sm text-zinc-300">Envoyer <strong>{payment.amountSol} SOL</strong> vers:</p>
            <p className="mt-1 break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm">{payment.receiverWallet}</p>
            <p className="mt-2 text-sm text-zinc-400">Memo de suivi: {payment.reference}</p>
            <p className="mt-3 text-sm">Status: <span className="font-semibold text-amber-300">{status}</span></p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Signature de transaction SOL"
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
              />
              <button onClick={confirmPayment} disabled={loading} className="rounded-xl border border-amber-300 px-4 py-2 text-amber-200 disabled:opacity-50">
                Confirmer onchain
              </button>
              <button onClick={refreshPayment} disabled={loading} className="rounded-xl border border-white/20 px-4 py-2 text-zinc-200 disabled:opacity-50">
                Rafraîchir
              </button>
            </div>
          </div>
        )}

        {status === 'confirmed' && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-emerald-200">
            ✅ Paiement confirmé. L'accès token-gated peut maintenant être activé côté Academy.
          </div>
        )}

        {error && <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-red-200">{error}</div>}
      </div>
    </div>
  );
}
