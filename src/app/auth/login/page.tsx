'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { BugIcon } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        router.push('/');
        return;
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || 'Kirishda xatolik yuz berdi');
        setLoading(false);
        return;
      }
    }

    // Local / Guest fallback
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BugIcon className="w-5 h-5" />
            </div>
            <span className="font-mono font-bold text-lg text-emerald-400">IFB</span>
          </Link>
          <h1 className="text-xl font-extrabold text-white">Hisobga Kirish</h1>
          <p className="text-xs text-zinc-400">Dasturchi yoki QA tester profilingiz bilan kiring</p>
        </div>

        <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Email manzil</label>
            <input
              type="email"
              required
              placeholder="developer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Parol</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer"
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-zinc-500">Hisobingiz yo‘qmi? </span>
            <Link href="/auth/signup" className="text-xs font-semibold text-emerald-400 hover:underline">
              Ro‘yxatdan o‘tish
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
