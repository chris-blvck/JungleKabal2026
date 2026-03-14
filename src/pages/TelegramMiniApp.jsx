import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Brain, Gem, Rocket, ShoppingBag, Sparkles, CheckCircle2, Clock3 } from 'lucide-react';
import catalogFallback from '../data/catalogFallback.json';

const typeTheme = {
  kourse: {
    label: 'Kourse',
    icon: BookOpen,
    chip: 'border-amber-300/40 bg-amber-400/20 text-amber-200',
    frame: 'border-amber-300/30',
  },
  kodex: {
    label: 'Kodex',
    icon: Gem,
    chip: 'border-cyan-300/40 bg-cyan-400/20 text-cyan-200',
    frame: 'border-cyan-300/30',
  },
  koaching: {
    label: 'Koaching',
    icon: Brain,
    chip: 'border-emerald-300/40 bg-emerald-400/20 text-emerald-200',
    frame: 'border-emerald-300/30',
  },
};



const sectionTheme = {
  kourses: 'border-amber-300/30 bg-amber-500/10',
  kodex: 'border-cyan-300/30 bg-cyan-500/10',
  koaching: 'border-emerald-300/30 bg-emerald-500/10',
};
const roadmapStatus = {
  done: { label: 'Done', className: 'bg-emerald-400/20 text-emerald-300 border-emerald-300/30', Icon: CheckCircle2 },
  in_progress: { label: 'In Progress', className: 'bg-amber-400/20 text-amber-300 border-amber-300/30', Icon: Clock3 },
  next: { label: 'Next', className: 'bg-violet-400/20 text-violet-300 border-violet-300/30', Icon: Rocket },
};

function getTelegramUserFromUrl() {
  const url = new URL(window.location.href);
  return url.searchParams.get('tgUserId') || '';
}

function getPreselectedProductId() {
  const url = new URL(window.location.href);
  return url.searchParams.get('productId') || '';
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { error: text || 'Invalid API response' };
  }

  if (!response.ok) throw new Error(payload.error || `API request failed (${response.status})`);
  return payload;
}

function money(value) {
  return `${Number(value).toFixed(5)} SOL`;
}

function isActivationFee(product) {
  return Number(product.amountSol || 0) <= 0.00001 && !product.comingSoon;
}

function normalizeProductType(type) {
  if (type === 'pack') return 'kourse';
  return type;
}

function ProductCard({ product, inCart, onToggle }) {
  const normalizedType = normalizeProductType(product.type);
  const theme = typeTheme[normalizedType] || typeTheme.kourse;
  const TypeIcon = theme.icon;

  return (
    <article className={`group overflow-hidden rounded-xl border bg-black/40 backdrop-blur ${inCart ? 'border-amber-300/70 shadow-[0_0_20px_rgba(251,191,36,0.2)]' : theme.frame}`}>
      <div className="relative h-24 w-full overflow-hidden">
        <img src={product.cover} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/10" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] uppercase tracking-wide ${theme.chip}`}>
            <TypeIcon className="h-3 w-3" /> {theme.label}
          </span>
          {product.comingSoon && <span className="rounded-full border border-violet-300/30 bg-violet-400/20 px-2 py-1 text-[10px] uppercase text-violet-200">Coming Soon</span>}
          {product.isFreePack && <span className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-2 py-1 text-[10px] uppercase text-emerald-200">Free Starter</span>}
        </div>
      </div>

      <div className="space-y-2 p-2.5">
        <div>
          <p className="text-[13px] font-black leading-snug tracking-wide text-white">{product.name}</p>
          <p className="mt-1 line-clamp-2 text-[11px] text-zinc-300">{product.description}</p>
        </div>

        {product.lessonsIncluded?.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-1.5">
            <p className="text-[10px] uppercase tracking-wider text-zinc-400">Inside this pack</p>
            <ul className="mt-1 space-y-0.5 text-[10px] text-zinc-200">
              {product.lessonsIncluded.slice(0, 3).map((lesson) => <li key={lesson}>• {lesson}</li>)}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-amber-300">{product.comingSoon ? 'COMING SOON' : money(product.amountSol)}</p>
            {isActivationFee(product) && <p className="text-[11px] text-emerald-300">Symbolic anti-spam activation fee</p>}
          </div>
          <button
            onClick={() => onToggle(product.id)}
            disabled={product.comingSoon}
            className={`rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${product.comingSoon ? 'cursor-not-allowed bg-zinc-800 text-zinc-500' : inCart ? 'bg-zinc-700 text-zinc-100' : 'bg-amber-400 text-black hover:bg-amber-300'}`}
          >
            {product.comingSoon ? 'Soon' : inCart ? 'Remove' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function TelegramMiniApp() {
  const [catalog, setCatalog] = useState({
    categories: catalogFallback.categories || [],
    products: catalogFallback.products || [],
    roadmap: catalogFallback.roadmap || [],
  });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [error, setError] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [cartIds, setCartIds] = useState([]);
  const [telegramId, setTelegramId] = useState('');
  const [buyerWallet, setBuyerWallet] = useState('');
  const [busy, setBusy] = useState(false);
  const [payment, setPayment] = useState(null);
  const [signature, setSignature] = useState('');
  const [usingFallbackCatalog, setUsingFallbackCatalog] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifyByProduct, setNotifyByProduct] = useState({});

  useEffect(() => {
    const tgUser = getTelegramUserFromUrl();
    const preselected = getPreselectedProductId();
    setTelegramId(tgUser);

    apiRequest('/api/catalog')
      .then((data) => {
        const products = data.products || [];
        if (!products.length) {
          setError('API returned no products, using local fallback catalog.');
          setCatalog({
            categories: catalogFallback.categories || [],
            products: catalogFallback.products || [],
            roadmap: catalogFallback.roadmap || [],
          });
          setUsingFallbackCatalog(true);
        } else {
          setCatalog({ categories: data.categories || [], products, roadmap: data.roadmap || [] });
          setUsingFallbackCatalog(false);
        }
        if (preselected) setCartIds((prev) => (prev.includes(preselected) ? prev : [...prev, preselected]));
      })
      .catch((err) => {
        setError(`API unavailable, showing local catalog fallback. (${err.message})`);
        setCatalog({
          categories: catalogFallback.categories || [],
          products: catalogFallback.products || [],
          roadmap: catalogFallback.roadmap || [],
        });
        setUsingFallbackCatalog(true);
        if (preselected) setCartIds((prev) => (prev.includes(preselected) ? prev : [...prev, preselected]));
      })
      .finally(() => setLoadingCatalog(false));
  }, []);

  const productMap = useMemo(() => new Map(catalog.products.map((p) => [p.id, p])), [catalog.products]);
  const visibleProducts = useMemo(() => (activeType === 'all' ? catalog.products : catalog.products.filter((p) => normalizeProductType(p.type) === activeType)), [catalog.products, activeType]);
  const grouped = useMemo(() => ({
    kourses: visibleProducts.filter((p) => normalizeProductType(p.type) === 'kourse'),
    kodex: visibleProducts.filter((p) => normalizeProductType(p.type) === 'kodex'),
    koaching: visibleProducts.filter((p) => normalizeProductType(p.type) === 'koaching'),
  }), [visibleProducts]);

  const cartItems = useMemo(() => cartIds.map((id) => productMap.get(id)).filter(Boolean).filter((p) => !p.comingSoon), [cartIds, productMap]);
  const totalSol = useMemo(() => cartItems.reduce((sum, item) => sum + Number(item.amountSol || 0), 0), [cartItems]);

  const toggleInCart = (id) => {
    const product = productMap.get(id);
    if (!product || product.comingSoon) return;
    setCartIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const requestNotify = async (productId) => {
    const email = notifyEmail.trim();
    if (!email) {
      setError('Enter an email to get notified.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await apiRequest('/api/waitlist/subscribe', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          email,
          telegramId: telegramId || undefined,
        }),
      });
      setNotifyByProduct((prev) => ({ ...prev, [productId]: 'saved' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const createCartPayment = async () => {
    if (!cartItems.length) {
      setError('Add at least one available product to cart.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const payload = await apiRequest('/api/payments/create-cart', {
        method: 'POST',
        body: JSON.stringify({
          productIds: cartItems.map((p) => p.id),
          telegramId: telegramId || undefined,
          buyerWallet: buyerWallet || undefined,
          source: 'telegram-miniapp',
        }),
      });
      setPayment(payload.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmPayment = async () => {
    if (!payment?.id || !signature.trim()) return;
    setError('');
    setBusy(true);
    try {
      const payload = await apiRequest(`/api/payments/${payment.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ signature: signature.trim() }),
      });
      setPayment(payload.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const renderSection = (title, items, themeKey) => {
    if (!items.length) return null;
    return (
      <section className={`space-y-3 rounded-2xl border p-3 ${sectionTheme[themeKey] || 'border-white/10 bg-white/5'}`}>
        <h2 className="text-lg font-black text-white">{title} <span className="text-sm font-semibold text-zinc-300">({items.length})</span></h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} inCart={cartIds.includes(product.id)} onToggle={toggleInCart} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#060606] pb-40 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/30 blur-3xl" />
        <div className="absolute bottom-20 left-16 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-16 top-40 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = '/academy'))}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-xs text-zinc-400">Telegram ID: <span className="text-emerald-300">{telegramId || 'not linked'}</span></div>
        </div>

        <header className="rounded-3xl border border-white/15 bg-gradient-to-br from-violet-500/25 via-fuchsia-500/15 to-amber-500/20 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs"><Sparkles className="h-4 w-4 text-amber-300" /> Kabal Mini App Store</div>
          <h1 className="mt-3 text-2xl font-black md:text-4xl">Kourses · Kodex · Koaching</h1>
          <p className="mt-3 max-w-3xl text-sm text-zinc-200 md:text-base">High-conversion visual catalog with symbolic free starter on-chain activation, premium packs, and roadmap-driven delivery.</p>
        </header>

        {usingFallbackCatalog && (
          <div className="rounded-2xl border border-amber-300/40 bg-amber-500/10 p-3 text-sm text-amber-100">
            ⚠️ Running in local fallback mode (API/catalog endpoint not reachable).
          </div>
        )}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <div className="flex flex-wrap gap-2">
            {['all', 'kourse', 'kodex', 'koaching'].map((key) => (
              <button
                key={key}
                onClick={() => setActiveType(key)}
                className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-wide ${activeType === key ? 'bg-amber-400 text-black' : 'border border-white/20 text-zinc-200'}`}
              >
                {key === 'all' ? 'All' : key}
              </button>
            ))}
          </div>
        </div>

        {loadingCatalog && <p className="text-sm text-zinc-400">Loading catalog...</p>}

        {!loadingCatalog && (
          <>
            {renderSection('Kourses', grouped.kourses, 'kourses')}
            {renderSection('Kodex', grouped.kodex, 'kodex')}
            {renderSection('Koaching', grouped.koaching, 'koaching')}
          </>
        )}

        {!loadingCatalog && catalog.products.some((p) => p.comingSoon) && (
          <section className="rounded-2xl border border-violet-300/30 bg-violet-500/10 p-4">
            <h3 className="text-sm font-semibold text-violet-200">Notify me when available</h3>
            <p className="mt-1 text-xs text-zinc-200">Get an email when a coming-soon pack is released.</p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <input
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                placeholder="you@email.com"
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {catalog.products.filter((p) => p.comingSoon).map((p) => (
                <button
                  key={p.id}
                  onClick={() => requestNotify(p.id)}
                  disabled={busy}
                  className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-left text-sm"
                >
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-zinc-400">{notifyByProduct[p.id] === 'saved' ? '✅ Reminder saved' : 'Remind me when available'}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {catalog.roadmap.length > 0 && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-zinc-100">Roadmap</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {catalog.roadmap.map((phase) => {
                const meta = roadmapStatus[phase.status] || roadmapStatus.next;
                const StatusIcon = meta.Icon;
                return (
                  <article key={phase.id} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] ${meta.className}`}><StatusIcon className="h-3 w-3" /> {meta.label}</div>
                    <p className="mt-2 text-sm font-semibold">{phase.title}</p>
                    <ul className="mt-2 space-y-1 text-xs text-zinc-300">{(phase.items || []).map((item) => <li key={item}>• {item}</li>)}</ul>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {payment && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-lg font-semibold">SOL payment pending</h2>
            <p className="mt-1 text-xs text-zinc-300">ID: {payment.id}</p>
            <p className="mt-2 text-sm text-zinc-300">Send <strong>{money(payment.amountSol)}</strong> to:</p>
            <p className="mt-1 break-all rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-xs">{payment.receiverWallet}</p>
            <p className="mt-2 text-xs text-zinc-400">Reference: {payment.reference}</p>
            <div className="mt-3 space-y-2">
              <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Paste SOL tx signature" className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
              <button onClick={confirmPayment} disabled={busy} className="w-full rounded-xl border border-amber-300 px-4 py-2 text-sm text-amber-200 disabled:opacity-50">Confirm payment</button>
            </div>
            {payment.status === 'confirmed' && <p className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">✅ Payment confirmed. Access unlocked.</p>}
          </section>
        )}

        {error && <p className="rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">{error}</p>}
      </div>

      <aside className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><ShoppingBag className="h-5 w-5 text-amber-300" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-400">Cart</p>
            <p className="truncate text-sm font-semibold">{cartItems.length} item(s) · {money(totalSol)}</p>
          </div>
          <input value={buyerWallet} onChange={(e) => setBuyerWallet(e.target.value)} placeholder="Burner wallet (optional)" className="hidden w-64 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs lg:block" />
          <button onClick={createCartPayment} disabled={busy || cartItems.length === 0} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">Pay with SOL</button>
        </div>
      </aside>
    </div>
  );
}
