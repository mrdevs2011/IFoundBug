'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { BugIcon, CheckIcon, SparklesIcon, ShareIcon } from '@/components/icons';

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
    return val.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
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
        let authEmail = cleanUser.includes('@') ? cleanUser : `${cleanUser}@ifoundbug.dev`;

        // Check if there is a custom email linked to this username in public.ifb_profiles
        try {
          const { data: rpcEmail } = await supabase.rpc('ifb_get_email_by_username', {
            p_username: cleanUser,
          });
          if (rpcEmail) {
            authEmail = rpcEmail;
          }
        } catch {
          // RPC may not exist yet, fallback to default synthetic email
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password,
        });

        if (error) throw error;

        const profile: UserProfile = {
          id: data.user.id,
          email: cleanUser,
          full_name: (data.user.user_metadata?.full_name as string) || cleanUser,
          role: (data.user.user_metadata?.role as UserProfile['role']) || 'developer',
          created_at: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('ifb_active_user', JSON.stringify(profile));
        }

        onAuthSuccess(profile);
        return;
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || 'Kirishda xatolik yuz berdi. Foydalanuvchi nomi yoki parolni tekshiring.');
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

        if (error) throw error;

        if (!data.user || !data.session) {
          setErrorMsg('Hisob yaratildi. Kirishni yakunlash uchun email tasdiqlash talab qilinadi.');
          setLoading(false);
          return;
        }

        const profile: UserProfile = {
          id: data.user.id,
          email: cleanUser,
          full_name: fullName.trim() || cleanUser,
          role,
          created_at: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('ifb_active_user', JSON.stringify(profile));
        }

        onAuthSuccess(profile);
        return;
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi. Bu foydalanuvchi nomi band bo‘lishi mumkin.');
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
              Stop Telegram Bug Chaos
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
            Telegram guruhlardagi tartibsizlikka{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              chek qo‘ying.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
            Ilovalaringizdagi xatolarni audio yoki chalkash skrinshotlar orqali emas, balki
            aniq qadamlar, telemetriya, bir bosishda Telegram kartalari va Claude/Cursor AI promptlari bilan boshqaring.
          </p>

          {/* Interactive Live Mock Bug Card (Visual Proof) */}
          <div className="linear-card rounded-2xl p-4 sm:p-5 text-left space-y-3.5 relative overflow-hidden border border-zinc-800/90 shadow-2xl">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 border border-zinc-700">
                  B04
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  CRITICAL • P0
                </span>
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">To‘lov / Checkout</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                iPhone 15 Pro • iOS 17.4
              </span>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                O‘zbekcha tilda savatchadan to‘lovga o‘tishda ilova to‘xtab qolyapti
              </h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                Til o‘zbekchaga almashtirilganda to‘lov API javobidagi null qiymat sababli ilova crash bo‘lmoqda.
              </p>
            </div>

            {/* Checklist simulation */}
            <div className="space-y-1.5 pt-1 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 stroke-[2.5]" />
                </div>
                <span>Savatchaga mahsulot qo‘shish va o‘zbek tilini tanlash</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center text-[10px] font-mono font-black">
                  ✕
                </div>
                <span className="text-zinc-400">To‘lov tugmasi bosilganda xatolik berishi</span>
              </div>
            </div>

            {/* Actions Bar inside Preview */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold">
                  6 ta dasturchi tasdiqladi
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[11px] font-medium">
                  <ShareIcon className="w-3 h-3" />
                  <span>Telegram</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[11px] font-medium">
                  <SparklesIcon className="w-3 h-3" />
                  <span>AI Prompt</span>
                </span>
              </div>
            </div>
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
                  placeholder="Muhamad R."
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
                  placeholder="Kamida 6 belgi"
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
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
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
