'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { TeamPanel } from '@/components/TeamPanel';
import { AIPromptModal } from '@/components/AIPromptModal';
import { Empty, ErrorBox, Spinner, btnGhost } from '@/components/ui';
import { IssueClosedIcon, IssueLabels, IssueOpenedIcon, IssueStateIcon, LockIcon, PersonIcon, RepoHeader, ghBtn, ghBtnPrimary, ghInput, isClosed } from '@/components/gh';
import { SEVERITY_LABEL, SEVERITY_ORDER, STATUS_LABEL, STATUS_ORDER, timeAgo } from '@/lib/constants';
import { errMsg, getProject, myRole } from '@/lib/db';
import { copyToClipboard } from '@/lib/clipboard';
import { useMe } from '@/lib/useMe';
import { ThumbsUpIcon, SearchIcon, SparklesIcon } from '@/components/icons';
import type { Bug, BugStatus, Project, Severity } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { parseIssueQuery } from '@/lib/issues/search';

type Tab = 'open' | 'done' | 'all';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const me = useMe();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [bugs, setBugs] = useState<Bug[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [counts, setCounts] = useState({ open: 0, done: 0, all: 0 });
  const [roleState, setRoleState] = useState<{ key: string; role: string | null } | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>(() => typeof window !== 'undefined' && ['open', 'done', 'all'].includes(new URLSearchParams(window.location.search).get('tab') || '') ? new URLSearchParams(window.location.search).get('tab') as Tab : 'open');
  const [search, setSearch] = useState(() => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : '');
  const [severity, setSeverity] = useState<Severity | ''>(() => typeof window !== 'undefined' && SEVERITY_ORDER.includes(new URLSearchParams(window.location.search).get('severity') as Severity) ? new URLSearchParams(window.location.search).get('severity') as Severity : '');
  const [status, setStatus] = useState<BugStatus | ''>(() => typeof window !== 'undefined' && STATUS_ORDER.includes(new URLSearchParams(window.location.search).get('status') as BugStatus) ? new URLSearchParams(window.location.search).get('status') as BugStatus : '');
  const [sort, setSort] = useState<'new' | 'votes' | 'severity'>(() => typeof window !== 'undefined' && ['new', 'votes', 'severity'].includes(new URLSearchParams(window.location.search).get('sort') || '') ? new URLSearchParams(window.location.search).get('sort') as 'new' | 'votes' | 'severity' : 'new');
  const [team, setTeam] = useState(false);
  const [ai, setAi] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProject(slug);
        if (!alive) return;
        setProject(p);
      } catch (e) { if (alive) setError(errMsg(e)); }
    })();
    return () => { alive = false; };
  }, [slug]);

  useEffect(() => {
    if (!project || !me) return;
    let alive = true;
    const key = `${project.id}:${me.id}`;
    myRole(project.id, me.id).then((r) => { if (alive) setRoleState({ key, role: r }); }).catch(() => {});
    return () => { alive = false; };
  }, [project, me]);
  const role = project && me && roleState?.key === `${project.id}:${me.id}` ? roleState.role : null;
  const realtimeProjectId = project?.id;
  const realtimeProjectSlug = project?.slug;
  const parsedQuery = parseIssueQuery(search);

  const loadIssues = useCallback(async (signal?: AbortSignal) => {
    if (!project || !parseIssueQuery(search).ok) { setBugs([]); setTotal(0); setLoadingIssues(false); return; }
    setLoadingIssues(true);
    const params = new URLSearchParams({
      project: project.id, q: search, tab, severity, status, sort,
      page: String(page), page_size: '50',
    });
    try {
      const response = await fetch(`/api/issues/search?${params}`, { signal, cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to search issues.');
      if (signal?.aborted) return;
      setBugs(payload.data as Bug[]);
      setTotal(Number(payload.total) || 0);
      setCounts(payload.counts || { open: 0, done: 0, all: 0 });
      setError('');
    } catch (reason) {
      if (signal?.aborted) return;
      setError(errMsg(reason));
    } finally {
      if (!signal?.aborted) setLoadingIssues(false);
    }
  }, [project, search, tab, severity, status, sort, page]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => { void loadIssues(controller.signal); }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [loadIssues]);

  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries({ q: search, tab, severity, status, sort })) {
      if (value && !(key === 'tab' && value === 'open') && !(key === 'sort' && value === 'new')) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url);
  }, [search, tab, severity, status, sort]);

  useEffect(() => {
    if (!realtimeProjectId || !realtimeProjectSlug || !supabase) return;
    const client = supabase;
    let active = true;
    const refresh = async () => {
      try {
        const nextProject = await getProject(realtimeProjectSlug);
        if (active && nextProject) setProject(nextProject);
        if (active) await loadIssues();
      } catch (reason) { if (active) setError(errMsg(reason)); }
    };
    const channel = client.channel(`ifb-project-${realtimeProjectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bugs', filter: `project_id=eq.${realtimeProjectId}` }, refresh)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'ifb_projects', filter: `id=eq.${realtimeProjectId}` }, refresh)
      .subscribe();
    return () => { active = false; void client.removeChannel(channel); };
  }, [realtimeProjectId, realtimeProjectSlug, loadIssues]);

  const visible = bugs ?? [];

  if (project === undefined && !error) return <><Nav /><Spinner label="Loading…" /></>;
  if (project === null) return <><Nav /><main className="mx-auto max-w-5xl flex-1 px-4 py-10"><Empty title="Repository not found" hint="This repository may have an invalid or outdated URL."><Link href="/" className={btnGhost}>Home</Link></Empty></main></>;

  const isAdmin = role === 'owner' || role === 'admin';
  const pages = Math.max(1, Math.ceil(total / 50));
  const setTabTo = (k: Tab) => { setPage(1); setTab(k); };
  return (
    <>
      <Nav />
      {project && (
        <RepoHeader project={project} active="issues" openCount={counts.open} actions={<>
          <button className={ghBtn} onClick={async () => { if (await copyToClipboard(location.href)) { setCopied(true); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 1500); } }}>{copied ? 'Copied!' : 'Copy link'}</button>
          <button className={ghBtn} onClick={() => setTeam(true)}><PersonIcon className="text-[#9198a1]" />People</button>
        </>} />
      )}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 lg:px-8">
        {error && <div className="mb-4"><ErrorBox message={error} /></div>}
        {project && (
          <>
            {project.description && <p className="mb-4 text-sm text-[#9198a1]">{project.description}</p>}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9198a1]" />
                <input className={`${ghInput} pl-8`} value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search all issues  status:in_progress priority:P1 assignee:me" aria-label="Search issues" data-issue-search />
              </div>
              <Link href={`/p/${project.slug}/new`} className={ghBtnPrimary}>New issue</Link>
            </div>

            {!parsedQuery.ok && <p role="alert" className="mb-3 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 px-3 py-2 text-xs text-[#ff7b72]">{parsedQuery.error}</p>}

            <div className="overflow-hidden rounded-md border border-[#3d444d]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3d444d] bg-[#151b23] px-4 py-3 text-sm">
                <div className="flex items-center gap-4" role="tablist">
                  <button role="tab" aria-selected={tab === 'open'} onClick={() => setTabTo('open')} className={`flex items-center gap-1.5 ${tab === 'open' ? 'font-semibold text-[#f0f6fc]' : 'text-[#9198a1] hover:text-[#f0f6fc]'}`}><IssueOpenedIcon />{counts.open} Open</button>
                  <button role="tab" aria-selected={tab === 'done'} onClick={() => setTabTo('done')} className={`flex items-center gap-1.5 ${tab === 'done' ? 'font-semibold text-[#f0f6fc]' : 'text-[#9198a1] hover:text-[#f0f6fc]'}`}><IssueClosedIcon />{counts.done} Closed</button>
                  <button role="tab" aria-selected={tab === 'all'} onClick={() => setTabTo('all')} className={`${tab === 'all' ? 'font-semibold text-[#f0f6fc]' : 'text-[#9198a1] hover:text-[#f0f6fc]'}`}>All</button>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[#9198a1]">
                  <select aria-label="Severity" value={severity} onChange={(e) => { setPage(1); setSeverity(e.target.value as Severity | ''); }} className="gh-menu-select">
                    <option value="">Severity</option>{SEVERITY_ORDER.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
                  </select>
                  <select aria-label="Status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as BugStatus | ''); }} className="gh-menu-select">
                    <option value="">Status</option>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                  <select aria-label="Sort" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value as typeof sort); }} className="gh-menu-select">
                    <option value="new">Newest</option><option value="votes">Most reactions</option><option value="severity">Severity</option>
                  </select>
                </div>
              </div>

              {loadingIssues && !bugs && <Spinner />}
              {bugs && visible.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <IssueOpenedIcon className="mx-auto mb-3 h-6 w-6 text-[#9198a1]" />
                  <h3 className="text-xl font-semibold text-[#f0f6fc]">{total || search || severity || status ? 'No results matched your search.' : 'Welcome to issues!'}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-[#9198a1]">{total || search || severity || status ? 'Try a different search or clear the filters.' : 'Issues are used to track bugs and work in this repository.'}</p>
                  {!total && !search && <Link href={`/p/${project.slug}/new`} className={`${ghBtnPrimary} mt-4`}>New issue</Link>}
                </div>
              )}
              {visible.length > 0 && (
                <ul>
                  {visible.map((b) => (
                    <li key={b.id} className="flex items-start gap-3 border-b border-[#3d444d] px-4 py-2.5 last:border-b-0 hover:bg-[#151b23]">
                      <IssueStateIcon status={b.status} className="mt-1" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <Link href={`/p/${project.slug}/b/${b.code}`} className="text-base font-semibold text-[#f0f6fc] hover:text-[#4493f8]">{b.title}</Link>
                          <IssueLabels bug={b} />
                          {b.share_token && <span className="inline-flex items-center gap-1 text-xs text-[#9198a1]" title="Visible only through a private link"><LockIcon className="h-3 w-3" />private link</span>}
                        </div>
                        <p className="mt-1 text-xs text-[#9198a1]">{b.code} · {isClosed(b.status) ? 'closed' : 'opened'} {timeAgo(isClosed(b.status) && b.resolved_at ? b.resolved_at : b.created_at)} by {b.reporter_name}</p>
                      </div>
                      {b.upvotes_count > 0 && <span className="mt-1 hidden shrink-0 items-center gap-1 text-xs text-[#9198a1] sm:flex" title="Reactions"><ThumbsUpIcon className="h-3.5 w-3.5" />{b.upvotes_count}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {visible.length > 0 && (
              <div className="mt-4 flex flex-col items-center gap-3">
                {pages > 1 && (
                  <nav className="flex items-center gap-1 text-sm" aria-label="Pagination">
                    <button className="rounded-md px-3 py-1 text-[#4493f8] hover:bg-[#151b23] disabled:text-[#656c76] disabled:hover:bg-transparent" disabled={page <= 1 || loadingIssues} onClick={() => setPage((v) => Math.max(1, v - 1))}>‹ Previous</button>
                    <span className="rounded-md bg-[#1f6feb] px-3 py-1 font-semibold text-white">{page}</span>
                    <span className="px-2 text-[#9198a1]">of {pages}</span>
                    <button className="rounded-md px-3 py-1 text-[#4493f8] hover:bg-[#151b23] disabled:text-[#656c76] disabled:hover:bg-transparent" disabled={page >= pages || loadingIssues} onClick={() => setPage((v) => v + 1)}>Next ›</button>
                  </nav>
                )}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#9198a1]">
                  <span>{total.toLocaleString()} issues{loadingIssues ? ' · Updating…' : ''}</span>
                  <button className="inline-flex items-center gap-1 text-[#4493f8] hover:underline" onClick={() => setAi(true)}><SparklesIcon className="h-3.5 w-3.5" />Generate an AI task from {visible.length} issues</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
      {team && project && <TeamPanel project={project} isAdmin={isAdmin} onClose={() => setTeam(false)} />}
      {ai && <AIPromptModal bugs={visible.slice(0, 20)} onClose={() => setAi(false)} />}
    </>
  );
}
