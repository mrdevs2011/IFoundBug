'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { authErrorToUzbek, normalizeUsername, usernameToAuthEmail } from '@/lib/supabase/username-auth';
import { UserProfile } from '@/types';
import { DataService } from '@/lib/supabase/data-service';
import { BugIcon, CheckIcon } from '@/components/icons';

interface OnboardingViewProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function OnboardingView({ onAuthSuccess }: OnboardingViewProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [showSplash, setShowSplash] = useState(true);

  // Pure username authentication states
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'developer' | 'qa_tester' | 'team_lead' | 'product_manager'>('developer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Silky 1.2-second splash screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const cleanUsernameStr = (val: string) => {
    return normalizeUsername(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUser = cleanUsernameStr(username);
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

    if (isSupabaseConfigured && supabase) {
      try {
        const authEmail = usernameToAuthEmail(cleanUser);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) throw error;

        const profile = await DataService.fetchProfile(data.user.id, data.user.email || cleanUser);

        onAuthSuccess(profile);
        return;
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(authErrorToUzbek(error));
        setLoading(false);
        return;
      }
    }


  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUser = cleanUsernameStr(username);
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('Autentifikatsiya serveri sozlanmagan. Keyinroq qayta urinib ko‘ring.');
      setLoading(false);
      return;
    }
    if (!cleanUser) {
      setErrorMsg('Foydalanuvchi nomini kiriting (faqat lotin harflari va raqamlar).');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Parol kamida 8 ta belgidan iborat bo‘lishi kerak.');
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const authEmail = usernameToAuthEmail(cleanUser);

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

        if (error) throw error;

        if (!data.user || !data.session) {
          setErrorMsg('Hisob yaratildi, lekin Supabase sessiya bermadi. Supabase Auth ichida email tasdiqlashni o‘chirish kerak.');
          setLoading(false);
          return;
        }

        const profile = await DataService.fetchProfile(data.user.id, data.user.email || cleanUser);

        onAuthSuccess(profile);
        return;
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(authErrorToUzbek(error));
        setLoading(false);
        return;
      }
    }


  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black relative overflow-hidden font-sans">
      {/* 0. Intro Splash Screen */}
      {showSplash && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center transition-all duration-700 ease-out">
          <div className="flex flex-col items-center space-y-5 animate-fade-in">
            <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 p-0.5 shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)]">
              <div className="w-full h-full bg-zinc-950 rounded-[22px] flex items-center justify-center">
                <BugIcon className="w-10 h-10 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1.5">
              <div className="flex items-baseline justify-center gap-2">
                <span className="font-mono font-black text-2xl tracking-widest text-emerald-400">IFB</span>
                <span className="font-extrabold text-2xl tracking-tight text-white">IFoundBug</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-500 tracking-widest uppercase">
                Apex Collaborative Bug Tracker
              </p>
            </div>
            <div className="w-40 h-1 bg-zinc-900 rounded-full overflow-hidden mt-3">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Radiant Background Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <BugIcon className="w-5 h-5" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-black text-base tracking-widest text-emerald-400">IFB</span>
              <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">IFoundBug</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/50">
                v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium hidden md:inline">
              Find and fix bugs faster
            </span>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">Linear + Supabase Realtime</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        {/* Left Side: Product Value & Interactive Bug Preview */}
        <div className="flex-1 max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Developer-First Bug Tracking</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
            Buglarni tartibli boshqarib,{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              chek qo‘ying.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Ilovalaringizdagi xatolarni audio yoki chalkash skrinshotlar orqali emas, balki
            aniq qadamlar, telemetriya va Claude/Cursor AI promptlari bilan boshqaring.
          </p>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckIcon className="w-4 h-4" /> Supabase PostgreSQL bilan ishlaydi
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Loyihalar, buglar, izohlar, jamoa a’zolari va bildirishnomalar markaziy bazada saqlanadi va barcha qurilmalarda sinxron ko‘rinadi.
            </p>
          </div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="w-full max-w-md linear-card rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative border border-white/[0.08]">
          {/* Segmented Control Switcher */}
          <div className="p-1 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMsg('');
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                tab === 'login'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Kirish (Login)
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMsg('');
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                tab === 'signup'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl leading-relaxed">
              {errorMsg}
            </div>
          )}

          {tab === 'login' ? (
            /* Login Form: Pure Username + Password */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Foydalanuvchi nomi (Username)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="masalan: muhamad"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Parol</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}
              </button>
            </form>
          ) : (
            /* Signup Form: Username + Full Name + Password + Role */
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Foydalanuvchi nomi (Username)</label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="masalan: muhamad_dev"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Ism va familiyangiz</label>
                <input
                  type="text"
                  required
                  placeholder="Ism Familiya"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Parol</label>
                <input
                  type="password"
                  required
                  placeholder="Kamida 8 belgi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">Loyihadagi rolingiz</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                  className="ifb-select w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                className="w-full py-2.5 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? 'Yaratilmoqda...' : 'Ro‘yxatdan O‘tish'}
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Faqat Username orqali</span>
            <span>Next.js 15 & Supabase</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900/80 py-4 text-center text-xs text-zinc-600 font-mono">
        IFoundBug • Professional Bug Triage Standard • Designed for Developers
      </footer>
    </div>
  );
}
