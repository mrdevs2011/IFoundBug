'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BugIcon, ChevronDownIcon, TerminalIcon } from '@/components/icons';
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
    <header className="sticky top-0 z-40 border-b border-[#3d444d] bg-[#010409]">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-sm font-semibold text-[#e6edf3]">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-[#3fb950]/40 bg-[#3fb950]/10 text-[#3fb950]"><BugIcon className="h-[18px] w-[18px]" /></span>
          <span>FoundBug</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          {me === undefined ? <span className="h-8 w-24 animate-pulse rounded-md bg-[#21262d]" /> : me ? (
            <div className="relative">
              <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-[#c9d1d9] hover:border-[#30363d] hover:bg-[#161b22]" aria-haspopup="menu" aria-expanded={open}>
                <span className="grid h-6 w-6 place-items-center rounded-full border border-[#3fb950]/40 bg-[#3fb950]/10 text-[11px] font-semibold text-[#3fb950]">{me.full_name.slice(0, 1).toUpperCase()}</span>
                <span className="max-w-[140px] truncate">{me.username}</span><ChevronDownIcon className="h-3.5 w-3.5 text-[#8b949e]" />
              </button>
              {open && <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-md border border-[#30363d] bg-[#161b22] py-1 shadow-2xl" onMouseLeave={() => setOpen(false)}>
                <div className="border-b border-[#30363d] px-3 py-2"><p className="text-xs text-[#8b949e]">Signed in as</p><p className="truncate text-sm font-medium text-[#e6edf3]">@{me.username}</p></div>
                <button role="menuitem" onClick={() => { setOpen(false); setMcp(true); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#c9d1d9] hover:bg-[#21262d]"><TerminalIcon className="h-4 w-4" /> MCP settings</button>
                <button role="menuitem" onClick={async () => { setOpen(false); await signOut(); router.refresh(); router.push('/'); }} className="block w-full border-t border-[#30363d] px-3 py-2 text-left text-sm text-[#f85149] hover:bg-[#21262d]">Sign out</button>
              </div>}
            </div>
          ) : <><Link href={`/login?next=${next}`} className="rounded-md px-3 py-1.5 text-[#c9d1d9] hover:bg-[#161b22]">Sign in</Link><Link href={`/signup?next=${next}`} className="rounded-md border border-[#3fb950]/50 bg-[#238636] px-3 py-1.5 font-semibold text-white hover:bg-[#2ea043]">Sign up</Link></>}
        </nav>
      </div>
      {mcp && <MCPSettingsModal onClose={() => setMcp(false)} />}
    </header>
  );
}

export function LoginHint({ what }: { what: string }) {
  const path = usePathname();
  const next = encodeURIComponent(path || '/');
  return <p className="rounded-md border border-[#30363d] bg-[#161b22] px-4 py-3 text-xs text-[#8b949e]">Sign in to {what.toLowerCase()} or <Link className="font-semibold text-[#58a6ff] hover:underline" href={`/login?next=${next}`}>create an account</Link>.</p>;
}
