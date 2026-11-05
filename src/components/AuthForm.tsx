'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { authErrorToEnglish, normalizeUsername, usernameToAuthEmail } from '@/lib/supabase/username-auth';
import { btnPrimary, ErrorBox, inputCls } from '@/components/ui';

function safeNext(v: string | null): string {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : '/';
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const signup = mode === 'signup';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { setError('Supabase is not configured.'); return; }
    const u = normalizeUsername(username);
    if (u.length < 3) { setError('Username must be at least 3 characters (a-z, 0-9, _ . -).'); return; }
    setBusy(true); setError('');
    try {
      const email = usernameToAuthEmail(u);
      const res = signup
        ? await supabase.auth.signUp({ email, password, options: { data: { username: u, full_name: fullName.trim() || u } } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (res.error) throw res.error;
      if (signup && !res.data.session) {
        const login = await supabase.auth.signInWithPassword({ email, password });
        if (login.error) throw login.error;
      }
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(authErrorToEnglish(err as { message?: string; status?: number }));
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-sm space-y-4 rounded-2xl border border-white/10 bg-[#101312] p-6">
      <div>
        <h1 className="text-xl font-bold text-white">{signup ? 'Create account' : 'Sign in'}</h1>
        <p className="mt-1 text-xs text-zinc-500">{signup ? 'Use a username and password. No email required.' : 'Enter your username and password.'}</p>
      </div>
      <label className="block text-xs text-zinc-400">Username
        <input className={`${inputCls} mt-1.5`} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" required placeholder="sardor_dev" />
      </label>
      {signup && (
        <label className="block text-xs text-zinc-400">Full name (optional)
          <input className={`${inputCls} mt-1.5`} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" placeholder="Sardor Aliyev" />
        </label>
      )}
      <label className="block text-xs text-zinc-400">Password
        <input className={`${inputCls} mt-1.5`} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} required placeholder={signup ? 'At least 8 characters' : '••••••••'} />
      </label>
      {error && <ErrorBox message={error} />}
      <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? 'Please wait…' : signup ? 'Sign up' : 'Sign in'}</button>
      <p className="text-center text-xs text-zinc-500">
        {signup ? 'Already have an account?' : 'New to IFoundBug?'}{' '}
        <Link className="font-semibold text-emerald-300 hover:underline" href={`${signup ? '/login' : '/signup'}?next=${encodeURIComponent(next)}`}>{signup ? 'Sign in' : 'Sign up'}</Link>
      </p>
    </form>
  );
}
