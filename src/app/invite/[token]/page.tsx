'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project } from '@/types';
import { DataService } from '@/lib/supabase/data-service';
import { AppNavbar } from '@/components/AppNavbar';
import { BugIcon, CheckIcon } from '@/components/icons';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [inviteData, setInviteData] = useState<{ project: Project; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function checkToken() {
      setLoading(true);
      try {
        const result = await DataService.validateInvite(token);
        if (result) {
          setInviteData(result);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Invite validation error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    checkToken();
  }, [token]);

  const handleJoin = async () => {
    if (!inviteData) return;
    setJoining(true);
    setTimeout(() => {
      router.push(`/p/${inviteData.project.slug}`);
    }, 600);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs text-zinc-500 font-mono">Taklifnoma tekshirilmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <AppNavbar />

      <main className="flex-1 flex items-center justify-center p-4">
        {error || !inviteData ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto text-xl font-bold">
              ✕
            </div>
            <h2 className="text-lg font-bold text-white">Yaroqsiz yoki Eskirgan Taklif</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Bu taklif havolasi eskirgan, o‘chirilgan yoki chegaralangan foydalanish miqdoriga yetgan.
            </p>
            <Link
              href="/"
              className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl transition"
            >
              Boshqaruv paneliga o‘tish
            </Link>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-lg w-full text-center space-y-6 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-inner">
              <BugIcon className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-mono text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 inline-block">
                Jamoa Taklifi
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {inviteData.project.name}
              </h1>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                {inviteData.project.description || 'Loyiha uchun bug tracking va tezkor hamkorlik doskasi.'}
              </p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Berilayotgan rol:</span>
                <span className="font-mono font-bold text-emerald-400 capitalize">
                  {inviteData.role}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Loyiha formati:</span>
                <span className="font-mono text-white">
                  {inviteData.project.is_public ? 'Ochiq (Public)' : 'Maxfiy (Private)'}
                </span>
              </div>
              {inviteData.project.tech_stack && (
                <div className="flex justify-between items-center text-zinc-400 pt-1 border-t border-zinc-800/80">
                  <span>Texnologiyalar:</span>
                  <span className="font-mono text-xs text-zinc-300 truncate max-w-[200px]">
                    {inviteData.project.tech_stack.join(', ')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3 px-4 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              {joining ? (
                <>
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Ulanmoqda...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4 text-zinc-950 stroke-[2.5]" />
                  <span>Jamoaga Qo‘shilish & Doskani Ochish</span>
                </>
              )}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
