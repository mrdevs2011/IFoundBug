'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BugIcon } from '@/components/icons';
import { useMe } from '@/lib/useMe';
import { signOut } from '@/lib/db';
import MCPSettingsModal from '@/components/MCPSettingsModal';

export function Nav() {
  const me = useMe();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mcp, setMcp] = useState(false);
  const next = encodeURIComponent(path || '/');

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-zinc-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-400/15 text-emerald-400"><BugIcon className="h-4 w-4" /></span>
          IFoundBug
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {me === undefined ? <span className="h-8 w-20" /> : me ? (
            <div className="relative">
              <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-1.5 text-zinc-200 hover:bg-white/5" aria-haspopup="menu" aria-expanded={open}>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-400/20 text-[10px] font-bold text-emerald-300">{me.full_name.slice(0, 1).toUpperCase()}</span>
                <span className="max-w-[120px] truncate">{me.username}</span>
              </button>
              {open && (
                <div role="menu" className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#101312] py-1 shadow-xl" onMouseLeave={() => setOpen(false)}>
                  <button role="menuitem" onClick={() => { setOpen(false); setMcp(true); }} className="block w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5">AI / MCP ulanish</button>
                  <button role="menuitem" onClick={async () => { setOpen(false); await signOut(); router.refresh(); router.push('/'); }} className="block w-full px-4 py-2 text-left text-sm text-red-300 hover:bg-white/5">Chiqish</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href={`/login?next=${next}`} className="rounded-xl px-3 py-1.5 text-zinc-300 hover:bg-white/5 hover:text-white">Kirish</Link>
              <Link href={`/signup?next=${next}`} className="rounded-xl bg-emerald-400 px-3.5 py-1.5 font-semibold text-black hover:bg-emerald-300">Ro‘yxatdan o‘tish</Link>
            </>
          )}
        </nav>
      </div>
      {mcp && <MCPSettingsModal onClose={() => setMcp(false)} />}
    </header>
  );
}

export function LoginHint({ what }: { what: string }) {
  const path = usePathname();
  const next = encodeURIComponent(path || '/');
  return (
    <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-zinc-400">
      {what} uchun <Link className="font-semibold text-emerald-300 hover:underline" href={`/login?next=${next}`}>kiring</Link> yoki{' '}
      <Link className="font-semibold text-emerald-300 hover:underline" href={`/signup?next=${next}`}>ro‘yxatdan o‘ting</Link> — bir daqiqa, email kerak emas.
    </p>
  );
}
