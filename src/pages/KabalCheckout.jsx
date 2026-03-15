import React, { useEffect } from 'react';

const KABALPAY_URL =
  import.meta.env.VITE_KABALPAY_URL ||
  'https://t.me/KabalPayBot/KabalPay';

export default function KabalCheckout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = KABALPAY_URL;
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-[#090909] px-4 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">KabalPay</p>
        <h1 className="mt-3 text-3xl font-black">On te redirige vers KabalPay</h1>
        <p className="mt-2 text-zinc-300">
          Le paiement et la confirmation se font sur KabalPay, notre app Telegram.
        </p>
        <a
          href={KABALPAY_URL}
          className="mt-6 inline-flex rounded-xl bg-amber-400 px-5 py-3 font-semibold text-black"
        >
          Ouvrir KabalPay
        </a>
      </div>
    </div>
  );
}
