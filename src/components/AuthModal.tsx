'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/types';
import { cyberSound } from '@/lib/cyber-sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile, isNewUser?: boolean) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'developer' | 'qa_tester' | 'team_lead' | 'product_manager'>('developer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (tab === 'signup') {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          setErrorMsg('Iltimos, barcha maydonlarni to‘ldiring.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
          setLoading(false);
          return;
        }

        let userProfile: UserProfile = {
          id: 'user_' + Date.now(),
          email,
          full_name: fullName,
          role,
          created_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role,
              },
            },
          });

          if (error) {
            setErrorMsg(error.message);
            setLoading(false);
            return;
          }

          if (data.user) {
            userProfile = {
              id: data.user.id,
              email: data.user.email || email,
              full_name: fullName,
              role,
              created_at: data.user.created_at || new Date().toISOString(),
            };
          }
        }

        cyberSound.playSuccess();
        onSuccess(userProfile, true);
        onClose();
      } else {
        // Login
        if (!email.trim() || !password.trim()) {
          setErrorMsg('Iltimos, email va parolni kiriting.');
          setLoading(false);
          return;
        }

        let userProfile: UserProfile = {
          id: 'user_' + Date.now(),
          email,
          full_name: email.split('@')[0],
          role: 'developer',
          created_at: new Date().toISOString(),
        };

        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            setErrorMsg(error.message);
            setLoading(false);
            return;
          }

          if (data.user) {
            userProfile = {
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || email.split('@')[0],
              role: data.user.user_metadata?.role || 'developer',
              created_at: data.user.created_at || new Date().toISOString(),
            };
          }
        }

        cyberSound.playSuccess();
        onSuccess(userProfile, false);
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email.trim()) {
      setErrorMsg('Iltimos, email manzilingizni kiriting.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setMagicLinkSent(true);
        cyberSound.playSuccess();
      }
    } else {
      setMagicLinkSent(true);
      cyberSound.playSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_20px_#10b981]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-emerald-400 bg-clip-text text-transparent inline-flex items-baseline">
                IFound<sub className="text-emerald-400 text-xs font-mono font-bold px-0.5 relative -bottom-0.5 not-italic select-none">a</sub>Bug
              </span>
              <span className="text-xs font-normal text-zinc-400">
                • {tab === 'login' ? 'Hisobga kirish' : 'Ro‘yxatdan o‘tish'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dasturchilar va Bug Hunterlar uchun hamkorlik platformasi
            </p>
          </div>

          <button
            onClick={() => {
              cyberSound.playClick();
              onClose();
            }}
            className="text-zinc-500 hover:text-white transition p-1 text-base font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              cyberSound.playClick();
              setTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition ${
              tab === 'login'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Kirish (Login)
          </button>
          <button
            onClick={() => {
              cyberSound.playClick();
              setTab('signup');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition ${
              tab === 'signup'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        {magicLinkSent ? (
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center space-y-2">
            <span className="text-2xl">✉️</span>
            <h4 className="text-sm font-bold text-emerald-300">Sehrli havola yuborildi!</h4>
            <p className="text-xs text-zinc-300">
              <strong>{email}</strong> pochtangizga bir martalik kirish havolasi yuborildi. Pochtani tekshiring va havola orqali kiring.
            </p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="text-xs text-emerald-400 underline mt-2 inline-block"
            >
              Parol orqali kirishga qaytish
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
                {errorMsg}
              </div>
            )}

            {tab === 'signup' && (
              <>
                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    To‘liq Ismingiz (Ism Familiya):
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masalan: Sardor Rustamov"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-medium mb-1">
                    Asosiy Mutaxassisligingiz (Rol):
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as typeof role)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="developer">💻 Dasturchi (Frontend / Backend / Fullstack)</option>
                    <option value="qa_tester">🐞 QA Tester / Bug Hunter</option>
                    <option value="team_lead">🚀 Team Lead / Tech Lead</option>
                    <option value="product_manager">📊 Product / Project Manager</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-zinc-400 font-medium mb-1">
                Elektron Pochta (Email):
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@company.uz"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-zinc-400 font-medium">Parol:</label>
                {tab === 'login' && (
                  <button
                    type="button"
                    onClick={handleMagicLink}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Pochtaga havola yuborish (Magic Link)
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-98 disabled:opacity-50 mt-2"
            >
              {loading
                ? 'Yuklanmoqda...'
                : tab === 'login'
                ? 'Hisobga Kirish'
                : 'Ro‘yxatdan O‘tish va Boshlash'}
            </button>

            <div className="pt-2 text-center text-[11px] text-zinc-500">
              Supabase Auth himoyalangan sessiya (JWT & RLS).
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
