'use client';

import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { authErrorToUzbek, normalizeUsername, usernameToAuthEmail } from '@/lib/supabase/username-auth';
import { UserProfile } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile, isNewUser?: boolean) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'developer' | 'qa_tester' | 'team_lead' | 'product_manager'>('developer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const cleanUserStr = (val: string) => {
    return normalizeUsername(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const cleanUser = cleanUserStr(username);
    if (!cleanUser) {
      setErrorMsg('Foydalanuvchi nomini kiriting.');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg('Autentifikatsiya serveri sozlanmagan. Keyinroq qayta urinib ko‘ring.');
      setLoading(false);
      return;
    }

    try {
      if (tab === 'signup') {
        if (!fullName.trim() || !password.trim()) {
          setErrorMsg('Iltimos, barcha maydonlarni to‘ldiring.');
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setErrorMsg('Parol kamida 8 ta belgidan iborat bo‘lishi kerak.');
          setLoading(false);
          return;
        }

        let userProfile: UserProfile | null = null;

        if (isSupabaseConfigured && supabase) {
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

          if (error) {
            setErrorMsg(authErrorToUzbek(error));
            setLoading(false);
            return;
          }

          if (!data.user || !data.session) {
            setErrorMsg('Hisob yaratildi, lekin Supabase sessiya bermadi. Supabase Auth ichida email tasdiqlashni o‘chirish kerak.');
            setLoading(false);
            return;
          }

          if (data.user && data.session) {
            userProfile = {
              id: data.user.id,
              email: cleanUser,
              full_name: fullName.trim() || cleanUser,
              role,
              created_at: data.user.created_at || new Date().toISOString(),
            };
          }
        }

        if (!userProfile) throw new Error('Supabase sessiyasi olinmadi.');
        onSuccess(userProfile, true);
        onClose();
      } else {
        // Canonical username-based Supabase identity.
        if (!password.trim()) {
          setErrorMsg('Iltimos, parolni kiriting.');
          setLoading(false);
          return;
        }

        let userProfile: UserProfile | null = null;

        if (isSupabaseConfigured && supabase) {
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
            setErrorMsg('Hisob yaratildi, lekin Supabase sessiya bermadi. Supabase Auth ichida email tasdiqlashni o‘chirish kerak.');
            setLoading(false);
            return;
          }

          if (data.user && data.session) {
            userProfile = {
              id: data.user.id,
              email: cleanUser,
              full_name: data.user.user_metadata?.full_name || cleanUser,
              role: data.user.user_metadata?.role || 'developer',
              created_at: data.user.created_at || new Date().toISOString(),
            };
          }
        }

        if (!userProfile) throw new Error('Supabase sessiyasi olinmadi.');
        onSuccess(userProfile, false);
        onClose();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
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
                IFoundBug
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
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition p-1 text-base font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition cursor-pointer ${
              tab === 'login'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Kirish (Login)
          </button>
          <button
            onClick={() => {
              setTab('signup');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg transition cursor-pointer ${
              tab === 'signup'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

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
                  className="ifb-select w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="developer">Dasturchi (Frontend / Backend / Fullstack)</option>
                  <option value="qa_tester">QA Tester / Bug Hunter</option>
                  <option value="team_lead">Team Lead / Tech Lead</option>
                  <option value="product_manager">Product / Project Manager</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-zinc-400 font-medium mb-1">
              Foydalanuvchi nomi (Username):
            </label>
            <input
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="masalan: sardor_dev"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-400 font-medium mb-1">Parol:</label>
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
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-98 disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Bajarilmoqda...' : tab === 'signup' ? 'Hisob yaratish' : 'Tizimga kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
