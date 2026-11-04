'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { BugIcon } from '@/components/icons';
import { UserProfile } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('developer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cleanUserStr = (val: string) => {
    return val.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUser = cleanUserStr(username);
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('Autentifikatsiya serveri sozlanmagan. Keyinroq qayta urinib ko‘ring.');
      setLoading(false);
      return;
    }
    if (!cleanUser) {
      setErrorMsg('Foydalanuvchi nomini kiriting.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const authEmail = `${cleanUser}@ifoundbug.dev`;

        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password,
          options: {
            data: {
              username: cleanUser,
              full_name: fullName.trim() || cleanUser,
              role,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        if (!data?.user || !data.session) {
          setErrorMsg('Hisob yaratildi, ammo email tasdiqlash talab qilinadi. Email tasdiqlangach tizimga kiring.');
          setLoading(false);
          return;
        }

        if (data?.user && data.session) {
          try {
            await supabase.from('ifb_profiles').upsert([
              {
                auth_user_id: data.user.id,
                username: cleanUser,
                full_name: fullName.trim() || cleanUser,
                role,
              },
            ]);
          } catch {}

          if (typeof window !== 'undefined') {
            const profile: UserProfile = {
              id: data.user.id,
              email: cleanUser,
              full_name: fullName.trim() || cleanUser,
              role: role as UserProfile['role'],
              created_at: data.user.created_at,
            };
            localStorage.setItem('ifb_active_user', JSON.stringify(profile));
          }
        }

        router.push('/');
        return;
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi');
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
          <h1 className="text-xl font-extrabold text-white">Ro‘yxatdan O‘tish</h1>
          <p className="text-xs text-zinc-400">Faqat username va parol orqali yangi hisob yarating</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
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
              placeholder="masalan: alisher_dev"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Ism va familiyangiz</label>
            <input
              type="text"
              required
              placeholder="Alisher Qodirov"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Parol</label>
            <input
              type="password"
              required
              placeholder="Kamida 6 belgi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-300">Loyihadagi Rolingiz</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="developer">Dasturchi (Software Engineer)</option>
              <option value="qa_tester">QA Tester (Bug Hunter)</option>
              <option value="team_lead">Team Lead / Tech Lead</option>
              <option value="product_manager">Product Manager</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-lg shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Yaratilmoqda...' : 'Hisob Yaratish'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-500">
          Hisobingiz bormi?{' '}
          <Link href="/auth/login" className="text-emerald-400 font-semibold hover:underline">
            Kirish
          </Link>
        </p>
      </div>
    </div>
  );
}
