'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMe } from '@/lib/useMe';
import { signOut } from '@/lib/db';
import MCPSettingsModal from '@/components/MCPSettingsModal';
import ProfileModal from '@/components/ProfileModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { Logo } from '@/components/Logo';
import { Avatar, IssueOpenedIcon, PlusOctIcon, RepoIcon, SearchOctIcon, ThreeBarsIcon, TriangleDownIcon } from '@/components/gh';
import { PROFILE_UPDATED_EVENT } from '@/lib/avatar';
import type { Me } from '@/lib/db';

const iconBtn = 'inline-flex h-8 items-center justify-center gap-0.5 rounded-md border border-[#3d444d] px-2 text-[#f0f6fc] hover:bg-[#262c36]';
const menuBox = 'absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#3d444d] bg-[#151b23] py-2 shadow-[0_8px_24px_rgba(1,4,9,.85)]';
const menuItem = 'mx-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[#f0f6fc] hover:bg-[#656c7633]';

export function Nav() {
  const loaded = useMe();
  const [override, setOverride] = useState<Me | null>(null);
  const me = loaded && override && override.id === loaded.id ? override : loaded;
  const [profile, setProfile] = useState(false);
  const path = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState<'user' | 'plus' | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [mcp, setMcp] = useState(false);
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const next = encodeURIComponent(path || '/');
  const slug = path?.startsWith('/p/') ? path.split('/')[2] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const editing = t?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t?.tagName || '');
      if (e.key === '/' && !editing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'Escape') { setMenu(null); setDrawer(false); }
    };
    const onDown = (e: MouseEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setMenu(null); };
    window.addEventListener('keydown', onKey); window.addEventListener('mousedown', onDown);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown); };
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/?q=${encodeURIComponent(term)}` : '/');
    searchRef.current?.blur();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#3d444d] bg-[#151b23]">
      <div className="flex h-16 items-center justify-between gap-2 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {me && <button onClick={() => setDrawer(true)} aria-label="Open global navigation menu" className={`${iconBtn} w-8 !px-0`}><ThreeBarsIcon /></button>}
          <Link href="/" aria-label="Homepage" className="mx-1 shrink-0 rounded-full"><Logo size={32} /></Link>
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm font-semibold text-[#f0f6fc]">
            {slug ? <><Link href="/" className="hover:underline">Dashboard</Link><span className="font-normal text-[#9198a1]">/</span><Link href={`/p/${slug}`} className="truncate hover:underline">{slug}</Link></> : <Link href="/" className="hover:underline">{me ? 'Dashboard' : 'IFoundBug'}</Link>}
          </nav>
        </div>
        <div ref={wrap} className="flex items-center gap-2">
          <form onSubmit={submit} role="search" className="relative hidden md:block">
            <SearchOctIcon className="pointer-events-none absolute left-2 top-2 text-[#9198a1]" />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search or jump to…" placeholder="Type / to search" className="h-8 w-72 rounded-md border border-[#3d444d] bg-[#0d1117] pl-8 pr-2 text-sm text-[#f0f6fc] placeholder-[#9198a1] outline-none focus:w-96 focus:border-[#1f6feb] focus:shadow-[inset_0_0_0_1px_#1f6feb] transition-[width]" />
          </form>
          {me === undefined ? <span className="h-8 w-24 animate-pulse rounded-md bg-[#262c36]" /> : me ? (
            <>
              <div className="relative">
                <button onClick={() => setMenu(menu === 'plus' ? null : 'plus')} aria-label="Create new…" aria-haspopup="menu" aria-expanded={menu === 'plus'} className={iconBtn}><PlusOctIcon /><TriangleDownIcon /></button>
                {menu === 'plus' && <div role="menu" className={menuBox}>
                  <button role="menuitem" className={menuItem} onClick={() => { setMenu(null); setCreating(true); }}><RepoIcon className="text-[#9198a1]" />New repository</button>
                </div>}
              </div>
              <Link href="/?q=" aria-label="Your issues" className={`${iconBtn} w-8 !px-0`}><IssueOpenedIcon /></Link>
              <div className="relative">
                <button onClick={() => setMenu(menu === 'user' ? null : 'user')} aria-label="Open user navigation menu" aria-haspopup="menu" aria-expanded={menu === 'user'} className="flex h-8 items-center gap-0.5 rounded-full hover:opacity-80"><Avatar name={me.full_name} src={me.avatar_url} size={32} /></button>
                {menu === 'user' && <div role="menu" className={menuBox}>
                  <div className="mx-4 mb-2 mt-1 flex items-center gap-2 border-b border-[#3d444d] pb-2"><Avatar name={me.full_name} src={me.avatar_url} size={32} /><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#f0f6fc]">{me.username}</p><p className="truncate text-xs text-[#9198a1]">{me.full_name}</p></div></div>
                  <button role="menuitem" className={menuItem} onClick={() => { setMenu(null); setProfile(true); }}>Your profile</button>
                  <Link role="menuitem" href="/" className={menuItem} onClick={() => setMenu(null)}>Your repositories</Link>
                  <button role="menuitem" className={menuItem} onClick={() => { setMenu(null); setMcp(true); }}>MCP settings</button>
                  <div className="my-2 border-t border-[#3d444d]" />
                  <button role="menuitem" className={menuItem} onClick={async () => { setMenu(null); await signOut(); router.refresh(); router.push('/'); }}>Sign out</button>
                </div>}
              </div>
            </>
          ) : <>
            <Link href={`/login?next=${next}`} className="inline-flex h-8 items-center rounded-md border border-[#3d444d] px-3 text-sm font-medium text-[#f0f6fc] hover:bg-[#262c36]">Sign in</Link>
            <Link href={`/signup?next=${next}`} className="inline-flex h-8 items-center rounded-md border border-[#3d444d] px-3 text-sm font-medium text-[#f0f6fc] hover:bg-[#262c36]">Sign up</Link>
          </>}
        </div>
      </div>
      {drawer && <div className="fixed inset-0 z-50 bg-black/60" onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawer(false); }}>
        <aside className="h-full w-80 max-w-[85vw] overflow-y-auto border-r border-[#3d444d] bg-[#151b23] p-4">
          <div className="mb-4 flex items-center justify-between"><Logo size={32} /><button onClick={() => setDrawer(false)} aria-label="Close" className={`${iconBtn} w-8 !px-0`}>✕</button></div>
          <ul className="space-y-0.5 text-sm">
            <li><Link href="/" onClick={() => setDrawer(false)} className={menuItem + ' !mx-0 !w-full'}><RepoIcon className="text-[#9198a1]" />Repositories</Link></li>
            <li><Link href="/?q=" onClick={() => setDrawer(false)} className={menuItem + ' !mx-0 !w-full'}><IssueOpenedIcon className="text-[#9198a1]" />Issues</Link></li>
          </ul>
        </aside>
      </div>}
      {mcp && <MCPSettingsModal onClose={() => setMcp(false)} />}
      {creating && <NewProjectModal onClose={() => setCreating(false)} />}
      {profile && me && <ProfileModal me={me} onClose={() => setProfile(false)} onSaved={(n) => { setOverride(n); window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT)); }} />}
    </header>
  );
}

export function LoginHint({ what }: { what: string }) {
  const path = usePathname();
  const next = encodeURIComponent(path || '/');
  return <p className="rounded-md border border-[#3d444d] bg-[#151b23] px-4 py-3 text-xs text-[#9198a1]">Sign in to {what.toLowerCase()} or <Link className="font-semibold text-[#4493f8] hover:underline" href={`/login?next=${next}`}>create an account</Link>.</p>;
}
