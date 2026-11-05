'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { TeamPanel } from '@/components/TeamPanel';
import { AIPromptModal } from '@/components/AIPromptModal';
import { Empty, ErrorBox, SeverityBadge, Spinner, StatusBadge, btnGhost, btnPrimary, inputCls } from '@/components/ui';
import { DONE_STATUSES, SEVERITY_DOT, SEVERITY_LABEL, SEVERITY_ORDER, STATUS_LABEL, STATUS_ORDER, timeAgo } from '@/lib/constants';
import { errMsg, getProject, listBugs, myRole } from '@/lib/db';
import { copyToClipboard } from '@/lib/clipboard';
import { useMe } from '@/lib/useMe';
import { ThumbsUpIcon } from '@/components/icons';
import type { Bug, BugStatus, Project, Severity } from '@/types';

type Tab = 'open' | 'done' | 'all';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const me = useMe();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [bugs, setBugs] = useState<Bug[] | null>(null);
  const [roleState, setRoleState] = useState<{ key: string; role: string | null } | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('open');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState<Severity | ''>('');
  const [status, setStatus] = useState<BugStatus | ''>('');
  const [sort, setSort] = useState<'new' | 'votes' | 'severity'>('new');
  const [team, setTeam] = useState(false);
  const [ai, setAi] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProject(slug);
        if (!alive) return;
        setProject(p);
        if (p) setBugs(await listBugs(p.id));
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

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sev = (s: Severity) => SEVERITY_ORDER.indexOf(s);
    return (bugs ?? [])
      .filter((b) => tab === 'all' || (tab === 'done') === DONE_STATUSES.includes(b.status))
      .filter((b) => !severity || b.severity === severity)
      .filter((b) => !status || b.status === status)
      .filter((b) => !q || b.title.toLowerCase().includes(q) || b.code.toLowerCase().includes(q) || (b.actual_behavior ?? '').toLowerCase().includes(q))
      .sort((a, b) => sort === 'votes' ? b.upvotes_count - a.upvotes_count : sort === 'severity' ? sev(a.severity) - sev(b.severity) : +new Date(b.created_at) - +new Date(a.created_at));
  }, [bugs, tab, search, severity, status, sort]);

  const counts = useMemo(() => {
    const all = bugs ?? [];
    const done = all.filter((b) => DONE_STATUSES.includes(b.status)).length;
    return { open: all.length - done, done, all: all.length };
  }, [bugs]);

  if (project === undefined && !error) return <><Nav /><Spinner label="Yuklanmoqda…" /></>;
  if (project === null) return <><Nav /><main className="mx-auto max-w-5xl flex-1 px-4 py-10"><Empty title="Loyiha topilmadi" hint="Havola noto‘g‘ri bo‘lishi mumkin."><Link href="/" className={btnGhost}>Bosh sahifa</Link></Empty></main></>;

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
                <button className={btnGhost} onClick={async () => { if (await copyToClipboard(location.href)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}>{copied ? 'Nusxalandi' : 'Havola'}</button>
                <button className={btnGhost} onClick={() => setTeam(true)}>Jamoa</button>
                <Link href={`/p/${project.slug}/new`} className={btnPrimary}>＋ Bug yozish</Link>
              </div>
            </header>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-white/10 p-0.5 text-sm" role="tablist">
                {([['open', 'Ochiq'], ['done', 'Yopilgan'], ['all', 'Hammasi']] as [Tab, string][]).map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 ${tab === k ? 'bg-emerald-400/15 text-emerald-300' : 'text-zinc-400 hover:text-white'}`}>{l} <span className="text-xs opacity-60">{counts[k]}</span></button>
                ))}
              </div>
              <input className={`${inputCls} min-w-40 flex-1 !py-2`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Bug qidirish…" aria-label="Bug qidirish" />
              <select aria-label="Jiddiylik" value={severity} onChange={(e) => setSeverity(e.target.value as Severity | '')} className="rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-300">
                <option value="">Jiddiylik</option>{SEVERITY_ORDER.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
              </select>
              <select aria-label="Holat" value={status} onChange={(e) => setStatus(e.target.value as BugStatus | '')} className="rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-300">
                <option value="">Holat</option>{STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <select aria-label="Saralash" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="rounded-xl border border-white/10 bg-zinc-900 px-2.5 py-2 text-sm text-zinc-300">
                <option value="new">Yangilari</option><option value="votes">Ko‘p ovoz</option><option value="severity">Jiddiylik</option>
              </select>
            </div>

            {!bugs && <Spinner />}
            {bugs && visible.length === 0 && (
              <Empty title={bugs.length ? 'Filtrga mos bug yo‘q' : 'Hali bug yo‘q'} hint={bugs.length ? undefined : 'Birinchi bo‘lib xatolikni yozing.'}>
                {!bugs.length && <Link href={`/p/${project.slug}/new`} className={btnPrimary}>＋ Bug yozish</Link>}
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
                            {b.code.slice(0, 7)} · {b.reporter_name} · {timeAgo(b.created_at)}{b.share_token ? ' · 🔗 havola orqali' : ''}
                          </span>
                        </span>
                        <span className="hidden sm:block"><SeverityBadge severity={b.severity} /></span>
                        <StatusBadge status={b.status} />
                        <span className="flex w-10 shrink-0 items-center justify-end gap-1 text-xs text-zinc-400"><ThumbsUpIcon className="h-3.5 w-3.5" />{b.upvotes_count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-end">
                  <button className={btnGhost} onClick={() => setAi(true)}>✨ Ko‘rinayotgan {visible.length} ta bug → AI vazifa</button>
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
