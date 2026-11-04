'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppNavbar } from '@/components/AppNavbar';
import { UserProfile } from '@/types';
import { DataService } from '@/lib/supabase/data-service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!isSupabaseConfigured || !supabase) {
        setError('Supabase bilan ulanish mavjud emas.');
        setLoading(false);
        return;
      }

      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.replace('/');
          return;
        }
        const result = await DataService.fetchProfile(user.id, user.email || '');
        if (active) setProfile(result);
      } catch (err) {
        console.error('Profile loading failed:', err);
        if (active) setError(err instanceof Error ? err.message : 'Profilni yuklab bo‘lmadi.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => { active = false; };
  }, [router]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace('/');
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <AppNavbar user={profile} onLogout={profile ? handleLogout : undefined} />
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-500 transition hover:text-emerald-300">
          <span aria-hidden="true">←</span> Dashboard&apos;ga qaytish
        </Link>

        <div className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-400">Account</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Mening profilim</h1>
          <p className="mt-2 text-sm text-zinc-500">Hisob ma’lumotlaring va IFoundBug profiling.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/[0.07] bg-zinc-900/50 p-8 text-sm text-zinc-400">Profil yuklanmoqda…</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-6 text-sm text-rose-300">{error}</div>
        ) : profile ? (
          <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-900/50 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-5 border-b border-white/[0.07] bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-transparent p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-2xl font-bold text-emerald-300">
                {profile.full_name?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-white">{profile.full_name || 'IFoundBug user'}</h2>
                <p className="mt-1 truncate text-sm text-zinc-400">{profile.email}</p>
                <span className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">{profile.role.replaceAll('_', ' ')}</span>
              </div>
            </div>
            <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2">
              <div className="bg-zinc-950/70 p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">To‘liq ism</p>
                <p className="mt-2 text-sm font-medium text-zinc-100">{profile.full_name || '—'}</p>
              </div>
              <div className="bg-zinc-950/70 p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Email</p>
                <p className="mt-2 break-all text-sm font-medium text-zinc-100">{profile.email || '—'}</p>
              </div>
              <div className="bg-zinc-950/70 p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Rol</p>
                <p className="mt-2 text-sm font-medium capitalize text-zinc-100">{profile.role.replaceAll('_', ' ')}</p>
              </div>
              <div className="bg-zinc-950/70 p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">A’zo bo‘lgan sana</p>
                <p className="mt-2 text-sm font-medium text-zinc-100">{profile.created_at ? new Intl.DateTimeFormat('uz-UZ', { dateStyle: 'long' }).format(new Date(profile.created_at)) : '—'}</p>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
