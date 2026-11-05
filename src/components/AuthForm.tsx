'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { authErrorToEnglish, normalizeUsername, usernameToAuthEmail } from '@/lib/supabase/username-auth';
import { Logo } from '@/components/Logo';

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

  const lbl = 'mb-2 block text-sm font-normal text-[#f0f6fc]';
  const inp = 'h-8 w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 text-sm text-[#f0f6fc] placeholder-[#9198a1] outline-none focus:border-[#1f6feb] focus:shadow-[inset_0_0_0_1px_#1f6feb]';
  return (
    <div className="mx-auto w-full max-w-[340px]">
      <div className="mb-4 flex flex-col items-center">
        <Link href="/" aria-label="IFoundBug home"><Logo size={48} /></Link>
        <h1 className="mt-4 text-2xl font-light tracking-tight text-[#f0f6fc]">{signup ? 'Create your account' : 'Sign in to IFoundBug'}</h1>
      </div>
      <form onSubmit={submit} className="rounded-md border border-[#3d444d] bg-[#151b23] p-4">
        {error && <div role="alert" className="mb-4 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 px-4 py-3 text-sm text-[#f0f6fc]">{error}</div>}
        <label className="mb-4 block"><span className={lbl}>Username</span>
          <input className={inp} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" autoCorrect="off" required autoFocus placeholder={signup ? 'sardor_dev' : ''} />
        </label>
        {signup && (
          <label className="mb-4 block"><span className={lbl}>Full name <span className="text-[#9198a1]">(optional)</span></span>
            <input className={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="mb-4 block"><span className={lbl}>Password</span>
          <input className={inp} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} required />
          {signup && <span className="mt-1 block text-xs text-[#9198a1]">Make sure it&apos;s at least 8 characters.</span>}
        </label>
        <button disabled={busy} className="h-8 w-full rounded-md border border-[rgba(240,246,252,0.1)] bg-[#238636] text-sm font-medium text-white transition-colors hover:bg-[#2ea043] disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="mt-4 rounded-md border border-[#3d444d] p-4 text-center text-sm text-[#f0f6fc]">
        {signup ? 'Already have an account?' : 'New to IFoundBug?'}{' '}
        <Link className="text-[#4493f8] hover:underline" href={`${signup ? '/login' : '/signup'}?next=${encodeURIComponent(next)}`}>{signup ? 'Sign in' : 'Create an account'}</Link>.
      </p>
    </div>
  );
}
