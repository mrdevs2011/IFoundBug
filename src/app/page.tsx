'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Nav, LoginHint } from '@/components/Nav';
import { NewProjectModal } from '@/components/NewProjectModal';
import { Empty, ErrorBox, btnPrimary, inputCls } from '@/components/ui';
import { BugIcon, SearchIcon, ArrowRightIcon, PlusIcon } from '@/components/icons';
import { errMsg, listProjects, type ProjectCard } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import { supabase } from '@/lib/supabase/client';
import type { Bug } from '@/types';

function Metric({ label, value, detail, tone = 'neutral' }: { label: string; value: number; detail: string; tone?: 'neutral' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-[#3fb950]' : tone === 'red' ? 'text-[#ff7b72]' : 'text-[#e6edf3]';
  return (
    <div className="rounded-md border border-[#30363d] bg-[#161b22] px-4 py-3">
      <p className="text-xs text-[#8b949e]">{label}</p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className={'font-mono text-2xl font-semibold tracking-tight ' + color}>{value.toLocaleString('en-US')}</span>
        <span className="text-[11px] text-[#6e7681]">{detail}</span>
      </div>
    </div>
  );
}

function RepositoryRow({ project }: { project: ProjectCard }) {
  return (
    <Link href={'/p/' + project.slug} className="group flex min-w-0 items-start gap-3 px-4 py-4 transition hover:bg-[#161b22]">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[#30363d] bg-[#0d1117] text-[#8b949e]">
        <BugIcon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-[#58a6ff] group-hover:underline">{project.name}</span>
          <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-[10px] text-[#8b949e]">Public</span>
        </span>
        <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-[#8b949e]">
          {project.description || 'No description provided.'}
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8b949e]">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3fb950]" />{project.open_count} open issues</span>
          <span>{project.total_count} total issues</span>
          {(project.tech_stack ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded border border-[#30363d] px-1.5 py-0.5">{tag}</span>)}
        </span>
      </span>
      <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-[#6e7681] transition group-hover:translate-x-0.5 group-hover:text-[#58a6ff]" />
    </Link>
  );
}

export default function Home() {
  const me = useMe();
  const [projects, setProjects] = useState<ProjectCard[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [issueSearch, setIssueSearch] = useState('');
  const [issueResults, setIssueResults] = useState<(Bug & { project: { id: string; name: string; slug: string } })[]>([]);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');
  const issueSearchInput = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      void listProjects(search).then((items) => {
        if (active) { setProjects(items); setError(''); }
      }).catch((reason) => {
        if (active) { setError(errMsg(reason)); setProjects([]); }
      });
    }, 160);
    return () => { active = false; clearTimeout(timer); };
  }, [search]);

  useEffect(() => {
    const term = issueSearch.trim();
    if (!term) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIssueLoading(true);
      try {
        const params = new URLSearchParams({ q: term, tab: 'all', page: '1', page_size: '20' });
        const response = await fetch(`/api/issues/search?${params}`, { signal: controller.signal, cache: 'no-store' });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Unable to search issues.');
        if (!controller.signal.aborted) { setIssueResults(payload.data || []); setIssueError(''); }
      } catch (reason) {
        if (!controller.signal.aborted) { setIssueResults([]); setIssueError(reason instanceof Error ? reason.message : 'Unable to search issues.'); }
      } finally {
        if (!controller.signal.aborted) setIssueLoading(false);
      }
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [issueSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editing = target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName || '');
      if (event.key === '/' && !editing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        issueSearchInput.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    const refresh = () => {
      void listProjects(search).then((items) => {
        if (active) { setProjects(items); setError(''); }
      }).catch((reason) => {
        if (active) setError(errMsg(reason));
      });
    };
    const channel = client.channel('ifb-dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_projects' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bugs' }, refresh)
      .subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, [search]);

  const metrics = useMemo(() => {
    const items = projects ?? [];
    return {
      repositories: items.length,
      issues: items.reduce((sum, project) => sum + project.total_count, 0),
      open: items.reduce((sum, project) => sum + project.open_count, 0),
      resolved: items.reduce((sum, project) => sum + Math.max(0, project.total_count - project.open_count), 0),
    };
  }, [projects]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-6">
        <div className="mb-6 flex flex-col gap-3 border-b border-[#30363d] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-[#8b949e]">Workspace / Overview</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#e6edf3]">Dashboard</h1>
            <p className="mt-1 text-sm text-[#8b949e]">Manage repositories and track reported issues.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {me ? <button className={btnPrimary} onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" />New repository</button> : me === null ? <LoginHint what="create a repository" /> : <span className="h-9 w-32 animate-pulse rounded-md bg-[#21262d]" />}
          </div>
        </div>

        <section aria-label="Global issue search" className="mb-7 overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
          <div className="border-b border-[#30363d] bg-[#161b22] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#e6edf3]">Search all issues</h2>
            <p className="mt-0.5 text-xs text-[#8b949e]">Search across repositories you are allowed to access.</p>
            <input ref={issueSearchInput} className={`${inputCls} mt-3 w-full`} value={issueSearch} onChange={(event) => setIssueSearch(event.target.value)} placeholder="Search issues… status:in_progress priority:P1 project:my-repo" aria-label="Search all issues" />
          </div>
          {issueSearch.trim() && <div className="divide-y divide-[#21262d]">
            {issueError && <p role="alert" className="px-4 py-3 text-xs text-[#ff7b72]">{issueError}</p>}
            {issueLoading && <p className="px-4 py-3 text-xs text-[#8b949e]">Searching…</p>}
            {!issueLoading && issueResults.length === 0 && <p className="px-4 py-3 text-xs text-[#8b949e]">No matching issues in repositories visible to your account.</p>}
            {issueResults.map((issue) => <Link key={issue.id} href={`/p/${issue.project.slug}/b/${issue.code}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#161b22]">
              <BugIcon className="h-4 w-4 shrink-0 text-[#8b949e]" />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#58a6ff]">{issue.title}</span><span className="mt-0.5 block truncate text-[11px] text-[#8b949e]">{issue.project.name} · {issue.code} · {issue.status.replaceAll('_', ' ')}</span></span>
            </Link>)}
          </div>}
        </section>

        <section aria-label="Workspace overview" className="mb-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Metric label="Repositories" value={metrics.repositories} detail="total" />
          <Metric label="Issues" value={metrics.issues} detail="reported" />
          <Metric label="Open" value={metrics.open} detail="needs attention" tone="red" />
          <Metric label="Resolved" value={metrics.resolved} detail="completed" tone="green" />
        </section>

        <section id="repositories" className="overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
          <div className="flex flex-col gap-3 border-b border-[#30363d] bg-[#161b22] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#e6edf3]">Your repositories</h2>
              <p className="mt-0.5 text-xs text-[#8b949e]">Projects you own or have access to.</p>
            </div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search repositories</span>
              <SearchIcon aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b949e]" />
              <input className={inputCls + ' !pl-9'} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a repository..." />
            </label>
          </div>

          {error && <div className="p-4"><ErrorBox message={error} /></div>}
          {!projects && !error && <div className="space-y-0 divide-y divide-[#21262d]">{[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse bg-[#0d1117]" />)}</div>}
          {projects && projects.length === 0 && (
            <div className="p-4">
              <Empty title={search ? 'No repositories found' : 'No repositories yet'} hint={search ? 'Try another search term.' : 'Create your first repository to start collecting and resolving issues.'}>
                {me ? <button className={btnPrimary} onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" />Create your first repository</button> : <Link href="/signup" className={btnPrimary}>Create an account</Link>}
              </Empty>
            </div>
          )}
          {projects && projects.length > 0 && (
            <div className="divide-y divide-[#21262d]">
              {projects.map((project) => <RepositoryRow key={project.id} project={project} />)}
            </div>
          )}
        </section>

        <footer className="mt-8 flex flex-col gap-1 border-t border-[#30363d] pt-4 text-[11px] text-[#6e7681] sm:flex-row sm:items-center sm:justify-between">
          <span>FoundBug · Find bugs. Fix faster.</span>
          <span>Built for software teams.</span>
        </footer>
      </main>
      {creating && <NewProjectModal onClose={() => setCreating(false)} />}
    </>
  );
}
