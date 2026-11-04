'use client';

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { BugIcon, CheckIcon, SparklesIcon, ShareIcon } from '@/components/icons';

interface OnboardingViewProps {
  onAuthSuccess: (user: UserProfile) => void;
}

export default function OnboardingView({ onAuthSuccess }: OnboardingViewProps) {
  const [tab, setTab] = useState<'login' | 'signup' | 'demo'>('login');
  const [showSplash, setShowSplash] = useState(true);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'developer' | 'qa_tester' | 'team_lead' | 'product_manager'>('developer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Silky 1.5-second splash screen like TekinMail & MYplan
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: (data.user.user_metadata?.full_name as string) || email.split('@')[0],
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
        setErrorMsg(error.message || 'Kirishda xatolik yuz berdi. Ma\'lumotlarni tekshiring.');
        setLoading(false);
        return;
      }
    }

    // Local authentication fallback
    const localUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: email.split('@')[0],
      role: 'developer',
      created_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('ifb_active_user', JSON.stringify(localUser));
    }
    onAuthSuccess(localUser);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split('@')[0],
              role,
            },
          },
        });

        if (error) throw error;

        const profile: UserProfile = {
          id: data.user?.id || `usr-${Date.now()}`,
          email,
          full_name: fullName.trim() || email.split('@')[0],
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
        setErrorMsg(error.message || 'Ro‘yxatdan o‘tishda xatolik yuz berdi.');
        setLoading(false);
        return;
      }
    }

    // Local fallback
    const localUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      full_name: fullName.trim() || email.split('@')[0],
      role,
      created_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('ifb_active_user', JSON.stringify(localUser));
    }
    onAuthSuccess(localUser);
  };

  const handleDemoLogin = (demoRole: 'developer' | 'qa_tester' | 'team_lead', name: string) => {
    const demoUser: UserProfile = {
      id: `demo-${demoRole}`,
      email: `${demoRole}@ifoundbug.dev`,
      full_name: name,
      role: demoRole,
      created_at: new Date().toISOString(),
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('ifb_active_user', JSON.stringify(demoUser));
    }
    onAuthSuccess(demoUser);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-black relative overflow-hidden font-sans">
      {/* 0. SILKY INTRO SPLASH SCREEN (Just like TekinMail & MYplan) */}
      {showSplash && (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-700">
          <div className="flex flex-col items-center space-y-4 animate-fade-in">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-2xl shadow-emerald-500/30">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <BugIcon className="w-8 h-8 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-mono font-black text-2xl tracking-widest text-emerald-400">IFB</span>
                <span className="font-extrabold text-xl tracking-tight text-white">IFoundBug</span>
              </div>
              <p className="text-[11px] font-mono text-zinc-500 tracking-wider">APEX BUG TRACKING PLATFORM</p>
            </div>
            <div className="w-36 h-1 bg-zinc-900 rounded-full overflow-hidden mt-2">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-progress-indeterminate" />
            </div>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BugIcon className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-black text-sm tracking-widest text-emerald-400">IFB</span>
              <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">IFoundBug</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 hidden sm:inline">Stop Debugging in Telegram</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Xavfsiz Tizim</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        {/* Left Side: Product Showcase & Pain-Point Solution */}
        <div className="flex-1 max-w-xl space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
            <span>🛡️ Dasturchilar Uchun Yangi Standart</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Telegram guruhlardagi tartibsizlikka{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              chek qo‘ying.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Ilovalaringiz xatolarini audio yoki betartib skrinshotlar orqali emas, balki bir joyda
            aniq qadamlar, telemetriya, real-time suhbat va qabul mezonlari bilan boshqaring.
          </p>

          {/* Feature List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Multi-Project Workspace</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Faqat bitta ilovaga bog‘lanib qolmasdan, istalgancha yangi loyihalar ochish.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
                <ShareIcon className="w-4 h-4 stroke-[2.5]" />
                <span>1-Bosishda Telegramga</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Har bir bug uchun guruhga chiroyli va to‘liq ma&apos;lumotli karta ulashish.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                <SparklesIcon className="w-4 h-4 stroke-[2.5]" />
                <span>AI Prompt (Cursor/Claude)</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Xatoni tuzatish uchun AI ga tayyor, professional tuzatish promptini beradi.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <CheckIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Clipboarddan Skrinshot</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Ctrl+V bilan to‘g‘ridan-to‘g‘ri skrinshot tashlash va ustiga chizish.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Box */}
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  tab === 'login' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Kirish (Login)
              </button>
              <button
                onClick={() => {
                  setTab('signup');
                  setErrorMsg('');
                }}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  tab === 'signup' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Ro‘yxatdan o‘tish
              </button>
            </div>

            <button
              onClick={() => setTab('demo')}
              className={`text-[11px] font-semibold font-mono px-2 py-1 rounded-lg border transition ${
                tab === 'demo'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:text-zinc-300'
              }`}
            >
              ⚡ Tezkor Demo
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl leading-relaxed">
              {errorMsg}
            </div>
          )}

          {tab === 'demo' ? (
            /* Quick Demo Onboarding Mode */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white">Tezkor Demo Profil Tanlang</h3>
                <p className="text-xs text-zinc-400">
                  Parolsiz, darhol platforma imkoniyatlarini sinab ko‘rish uchun
                </p>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => handleDemoLogin('team_lead', 'Muhamad R. (Lead)')}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                      Muhamad R.
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">Team Lead / Platform Egasi</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Kirish →</span>
                </button>

                <button
                  onClick={() => handleDemoLogin('developer', 'Alisher Qodirov')}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                      Alisher Qodirov
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">Frontend / Mobile Dasturchi</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Kirish →</span>
                </button>

                <button
                  onClick={() => handleDemoLogin('qa_tester', 'Sarvar Tester')}
                  className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                      Sarvar Tester
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-mono">QA Engineer / Bug Hunter</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Kirish →</span>
                </button>
              </div>
            </div>
          ) : tab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Email yoki Dasturchi login</label>
                <input
                  type="email"
                  required
                  placeholder="developer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
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
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Ism va familiya</label>
                <input
                  type="text"
                  required
                  placeholder="Muhamad R."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Email manzil</label>
                <input
                  type="email"
                  required
                  placeholder="developer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Parol</label>
                <input
                  type="password"
                  required
                  placeholder="Kamida 6 ta belgi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Rolingiz</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserProfile['role'])}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="developer">Dasturchi (Developer)</option>
                  <option value="qa_tester">QA Tester</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="product_manager">Product Manager</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                {loading ? 'Yaratilmoqda...' : 'Hisob Yaratish & Kirish'}
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
        <span>IFoundBug (IFB) — Developer-Grade Bug Tracking & Collaboration. Made by MR.</span>
      </footer>
    </div>
  );
}
