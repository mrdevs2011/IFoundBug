'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { authErrorToUzbek, normalizeUsername, usernameToAuthEmail } from '@/lib/supabase/username-auth';
import { BugIcon } from '@/components/icons';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cleanUserStr = (val: string) => {
    return normalizeUsername(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUser = cleanUserStr(username);
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('Autentifikatsiya serveri sozlanmagan. Keyinroq qayta urinib ko‘ring.');
      setLoading(false);
      return;
    }
    if (!/^[a-z0-9_.-]{3,32}$/.test(cleanUser)) {
      setErrorMsg('Username 3–32 belgidan iborat bo‘lsin: a-z, 0-9, nuqta, _ yoki -.');
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const authEmail = usernameToAuthEmail(cleanUser);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) {
          setErrorMsg(authErrorToUzbek(error));
          setLoading(false);
          return;
        }

        if (!data.user || !data.session) {
          setErrorMsg('Supabase sessiyasi olinmadi. Qayta urinib ko‘ring.');
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
          <p className="text-xs text-zinc-400">Foydalanuvchi nomi va parol bilan kiring</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Foydalanuvchi nomi (Username)</label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="masalan: muhamad"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Parol</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-lg shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Kirilmoqda...' : 'Kirish'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Hisobingiz yo‘qmi?{' '}
          <Link href="/auth/signup" className="text-emerald-400 font-semibold hover:underline">
            Ro‘yxatdan o‘tish
          </Link>
        </p>
      </div>
    </div>
  );
}
