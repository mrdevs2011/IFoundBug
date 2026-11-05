'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { TeamPanel } from '@/components/TeamPanel';
import { AIPromptModal } from '@/components/AIPromptModal';
import { Empty, ErrorBox, SeverityBadge, Spinner, StatusBadge, btnGhost, btnPrimary, inputCls } from '@/components/ui';
import { SEVERITY_DOT, SEVERITY_LABEL, SEVERITY_ORDER, STATUS_LABEL, STATUS_ORDER, timeAgo } from '@/lib/constants';
import { errMsg, getProject, myRole } from '@/lib/db';
import { copyToClipboard } from '@/lib/clipboard';
import { useMe } from '@/lib/useMe';
import { ThumbsUpIcon, PlusIcon, SparklesIcon } from '@/components/icons';
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
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {error && <ErrorBox message={error} />}
        {project && (
          <>
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-white">{project.name}</h1>
                {project.description && <p className="mt-1 text-sm text-zinc-400">{project.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">{(project.tech_stack ?? []).map((t) => <span key={t} className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-zinc-400">{t}</span>)}</div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button className={btnGhost} onClick={async () => { if (await copyToClipboard(location.href)) { setCopied(true); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 1500); } }}>{copied ? 'Copied' : 'Copy link'}</button>
                <button className={btnGhost} onClick={() => setTeam(true)}>People</button>
                <Link href={`/p/${project.slug}/new`} className={btnPrimary}><PlusIcon className="h-4 w-4" />New issue</Link>
              </div>
            </header>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-white/10 p-0.5 text-sm" role="tablist">
                {([['open', 'Open'], ['done', 'Closed'], ['all', 'All']] as [Tab, string][]).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={tab === k} onClick={() => { setPage(1); setTab(k); }} className={`rounded-lg px-3 py-1.5 ${tab === k ? 'bg-emerald-400/15 text-emerald-300' : 'text-zinc-400 hover:text-white'}`}>{l} <span className="text-xs opacity-60">{counts[k]}</span></button>
                ))}
              </div>
              <input className={`${inputCls} min-w-40 flex-1 !py-2`} value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search issues… status:in_progress priority:P1 assignee:me" aria-label="Search issues" />
              <select aria-label="Severity" value={severity} onChange={(e) => { setPage(1); setSeverity(e.target.value as Severity | ''); }} className="rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-300">
                <option value="">Severity</option>{SEVERITY_ORDER.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
              </select>
              <select aria-label="Status" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value as BugStatus | ''); }} className="rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-300">
                <option value="">Status</option>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <select aria-label="Sort" value={sort} onChange={(e) => { setPage(1); setSort(e.target.value as typeof sort); }} className="rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-300">
                <option value="new">Newest</option><option value="votes">Most votes</option><option value="severity">Severity</option>
              </select>
            </div>

            {!parsedQuery.ok && <p role="alert" className="mb-3 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-300">{parsedQuery.error}</p>}
            {loadingIssues && !bugs && <Spinner />}
            {bugs && visible.length === 0 && (
              <Empty title={total ? 'No issues match these filters' : 'No issues yet'} hint={total ? undefined : 'Report the first issue in this repository.'}>
                {!total && <Link href={`/p/${project.slug}/new`} className={btnPrimary}><PlusIcon className="h-4 w-4" />New issue</Link>}
              </Empty>
            )}
            {visible.length > 0 && (
              <>
                <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08]">
                  {visible.map((b) => (
                    <li key={b.id}>
                      <Link href={`/p/${project.slug}/b/${b.code}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${SEVERITY_DOT[b.severity]}`} title={SEVERITY_LABEL[b.severity]} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-zinc-100">{b.title}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                            {b.code.slice(0, 7)} · {b.reporter_name} · {timeAgo(b.created_at)}{b.share_token ? ' · via private link' : ''}
                          </span>
                        </span>
                        <span className="hidden sm:block"><SeverityBadge severity={b.severity} /></span>
                        <StatusBadge status={b.status} />
                        <span className="flex w-10 shrink-0 items-center justify-end gap-1 text-xs text-zinc-400"><ThumbsUpIcon className="h-3.5 w-3.5" />{b.upvotes_count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-zinc-500">{total.toLocaleString()} issues · Page {page} of {Math.max(1, Math.ceil(total / 50))}{loadingIssues ? ' · Updating…' : ''}</span>
                  <div className="flex items-center gap-2">
                    <button className={btnGhost} disabled={page <= 1 || loadingIssues} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                    <button className={btnGhost} disabled={page >= Math.ceil(total / 50) || loadingIssues} onClick={() => setPage((value) => value + 1)}>Next</button>
                    <button className={btnGhost} onClick={() => setAi(true)}><SparklesIcon className="h-4 w-4" />Generate an AI task from {visible.length} issues</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
      {team && project && <TeamPanel project={project} isAdmin={isAdmin} onClose={() => setTeam(false)} />}
      {ai && <AIPromptModal bugs={visible.slice(0, 20)} onClose={() => setAi(false)} />}
    </>
  );
}
