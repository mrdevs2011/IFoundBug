'use client';

import React, { useEffect } from 'react';
import { BugIcon } from '@/components/icons';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error caught by IFB Error Boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <BugIcon className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold">Kutilmagan xatolik yuz berdi</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Xatolik avtomatik logga yozildi. Qayta urinib ko‘rishingiz yoki sahifani yangilashingiz mumkin.
        </p>
        {error.message && (
          <pre className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] font-mono text-red-400 text-left overflow-x-auto">
            {error.message}
          </pre>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs py-2.5 rounded-xl transition"
          >
            Qayta urinish
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs py-2.5 rounded-xl border border-zinc-700 transition"
          >
            Yangilash
          </button>
        </div>
      </div>
    </div>
  );
}
