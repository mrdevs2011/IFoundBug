'use client';
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { IssueStateIcon, RepoIcon, LockIcon, SearchOctIcon, PlusOctIcon, ghBtnPrimary, ghBtn } from '@/components/gh';
import { Nav } from '@/components/Nav';
import { NewProjectModal } from '@/components/NewProjectModal';
import { ErrorBox } from '@/components/ui';
import { Logo } from '@/components/Logo';
import { errMsg, listProjects, type ProjectCard } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import { supabase } from '@/lib/supabase/client';
import type { Bug } from '@/types';

function FeedCard({ project }: { project: ProjectCard }) {
  return (
    <article className="rounded-md border border-[#3d444d] bg-[#0d1117] p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="grid h-5 w-5 place-items-center text-[#9198a1]">{project.is_public ? <RepoIcon /> : <LockIcon />}</span>
        <Link href={'/p/' + project.slug} className="truncate font-semibold text-[#4493f8] hover:underline">{project.name}</Link>
        <span className="rounded-full border border-[#3d444d] px-[7px] text-xs font-medium leading-[18px] text-[#9198a1]">{project.is_public ? 'Public' : 'Private'}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-[#9198a1]">{project.description || 'No description provided.'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#9198a1]">
        <span className="inline-flex items-center gap-1"><IssueStateIcon status="REPORTED" />{project.open_count} open</span>
        <span>{project.total_count} total</span>
        {(project.tech_stack ?? []).slice(0, 3).map((t) => <span key={t} className="rounded-full bg-[#388bfd1a] px-2 py-0.5 font-medium text-[#4493f8]">{t}</span>)}
      </div>
    </article>
  );
}

function HomeInner() {
  const me = useMe();
  const [projects, setProjects] = useState<ProjectCard[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const issueSearch = useSearchParams().get('q') ?? '';
  const [issueResults, setIssueResults] = useState<(Bug & { project: { id: string; name: string; slug: string } })[]>([]);
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');
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
    const total = items.reduce((n, x) => n + x.total_count, 0);
    const open = items.reduce((n, x) => n + x.open_count, 0);
    return { total, open, closed: Math.max(0, total - open) };
  }, [projects]);
  const [filter, setFilter] = useState('');
  const sidebar = (projects ?? []).filter((x) => x.name.toLowerCase().includes(filter.toLowerCase())).slice(0, 12);
  const searching = issueSearch.trim().length > 0;

  if (me === null && !searching) return (
    <>
      <Nav />
      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
          <Logo size={72} />
          <h1 className="mt-6 text-5xl font-semibold leading-tight tracking-tight text-[#f0f6fc]">Where teams find and fix bugs</h1>
          <p className="mt-4 max-w-xl text-xl text-[#9198a1]">Report issues, discuss fixes and hand AI agents an actionable prompt — all in one place.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/signup" className="inline-flex h-10 items-center rounded-md border border-[rgba(240,246,252,0.1)] bg-[#238636] px-5 text-sm font-semibold text-white hover:bg-[#2ea043]">Sign up for IFoundBug</Link>
            <Link href="/login" className="inline-flex h-10 items-center rounded-md border border-[#3d444d] bg-[#212830] px-5 text-sm font-semibold text-[#f0f6fc] hover:bg-[#262c36]">Sign in</Link>
          </div>
        </section>
        {projects && projects.length > 0 && <section className="mx-auto max-w-3xl px-4 pb-16">
          <h2 className="mb-2 text-sm font-semibold text-[#f0f6fc]">Public repositories</h2>
          <div className="divide-y divide-[#3d444d] rounded-md border border-[#3d444d]">{projects.map((p) => <FeedCard key={p.id} project={p} />)}</div>
        </section>}
      </main>
    </>
  );

  return (
    <>
      <Nav />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-[296px]" aria-label="Top repositories">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#f0f6fc]">Top repositories</h2>
            {me && <button onClick={() => setCreating(true)} className={`${ghBtnPrimary} !h-7 !px-2 text-xs`}><RepoIcon />New</button>}
          </div>
          <div className="relative mb-2">
            <SearchOctIcon className="pointer-events-none absolute left-2 top-2 text-[#9198a1]" />
            <input value={filter} onChange={(e) => { setFilter(e.target.value); setSearch(e.target.value); }} placeholder="Find a repository…" aria-label="Find a repository" className="h-8 w-full rounded-md border border-[#3d444d] bg-[#0d1117] pl-8 pr-2 text-sm text-[#f0f6fc] placeholder-[#9198a1] outline-none focus:border-[#1f6feb]" />
          </div>
          {!projects && !error ? <div className="space-y-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-5 animate-pulse rounded bg-[#212830]" />)}</div> :
            sidebar.length === 0 ? <p className="text-xs text-[#9198a1]">No repositories found.</p> :
            <ul className="space-y-0.5">{sidebar.map((p) => <li key={p.id}><Link href={`/p/${p.slug}`} className="flex items-center gap-2 rounded-md px-1 py-1 text-sm text-[#f0f6fc] hover:bg-[#656c7633]"><span className="grid h-4 w-4 shrink-0 place-items-center">{p.is_public ? <RepoIcon className="text-[#9198a1]" /> : <LockIcon className="text-[#9198a1]" />}</span><span className="truncate font-semibold hover:underline">{p.name}</span></Link></li>)}</ul>}
        </aside>

        <section className="min-w-0 flex-1" aria-label="Home">
          {searching ? (
            <div>
              <h1 className="mb-3 text-xl font-semibold text-[#f0f6fc]">Issues matching “{issueSearch}”</h1>
              <div className="overflow-hidden rounded-md border border-[#3d444d]">
                <div className="border-b border-[#3d444d] bg-[#151b23] px-4 py-3 text-sm font-semibold text-[#f0f6fc]">{issueLoading ? 'Searching…' : `${issueResults.length} results`}</div>
                {issueError && <p role="alert" className="px-4 py-3 text-xs text-[#ff7b72]">{issueError}</p>}
                {!issueLoading && !issueError && issueResults.length === 0 && <p className="px-4 py-10 text-center text-sm text-[#9198a1]">No matching issues in repositories visible to your account.</p>}
                <ul className="divide-y divide-[#3d444d]">{issueResults.map((issue) => <li key={issue.id}><Link href={`/p/${issue.project.slug}/b/${issue.code}`} className="flex items-start gap-2 px-4 py-2.5 hover:bg-[#151b23]"><span className="mt-1"><IssueStateIcon status={issue.status} /></span><span className="min-w-0 flex-1"><span className="block truncate text-base font-semibold text-[#f0f6fc] hover:text-[#4493f8]">{issue.title}</span><span className="mt-0.5 block truncate text-xs text-[#9198a1]">{issue.project.name}#{issue.code} · {issue.status.replaceAll('_', ' ').toLowerCase()}</span></span></Link></li>)}</ul>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <h1 className="text-xl font-semibold text-[#f0f6fc]">Home</h1>
                {me && <button className={ghBtn} onClick={() => setCreating(true)}><PlusOctIcon />New repository</button>}
              </div>
              {error && <ErrorBox message={error} />}
              {!projects && !error && <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-md border border-[#3d444d] bg-[#151b23]" />)}</div>}
              {projects && projects.length === 0 && !error && (
                <div className="rounded-md border border-[#3d444d] bg-[#0d1117] p-8 text-center">
                  <Logo size={48} className="mx-auto" />
                  <h2 className="mt-4 text-2xl font-semibold text-[#f0f6fc]">{search ? 'No repositories found' : 'Welcome to IFoundBug'}</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-[#9198a1]">{search ? 'Try another search term.' : 'Create your first repository to start collecting, triaging and resolving issues with your team.'}</p>
                  {!search && me && <button className={`${ghBtnPrimary} mt-5 !h-9 !px-4`} onClick={() => setCreating(true)}><RepoIcon />Create a repository</button>}
                </div>
              )}
              {projects && projects.length > 0 && <div className="space-y-3">{projects.map((p) => <FeedCard key={p.id} project={p} />)}</div>}
            </>
          )}
        </section>

        <aside className="hidden w-[296px] shrink-0 xl:block" aria-label="Overview">
          <h2 className="mb-2 text-base font-semibold text-[#f0f6fc]">Overview</h2>
          <div className="rounded-md border border-[#3d444d] bg-[#0d1117] p-4">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-[#9198a1]">Repositories</dt><dd className="font-semibold text-[#f0f6fc]">{(projects ?? []).length}</dd></div>
              <div className="flex justify-between"><dt className="flex items-center gap-2 text-[#9198a1]"><IssueStateIcon status="REPORTED" />Open issues</dt><dd className="font-semibold text-[#f0f6fc]">{metrics.open}</dd></div>
              <div className="flex justify-between"><dt className="flex items-center gap-2 text-[#9198a1]"><IssueStateIcon status="FIXED" />Closed issues</dt><dd className="font-semibold text-[#f0f6fc]">{metrics.closed}</dd></div>
            </dl>
          </div>
        </aside>
      </main>
      {creating && <NewProjectModal onClose={() => setCreating(false)} />}
    </>
  );
}

export default function Home() {
  return <Suspense fallback={null}><HomeInner /></Suspense>;
}
