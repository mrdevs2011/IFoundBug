'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Bug, BugComment, BugStatus, Project, Severity } from '@/types';
import { LoginHint } from '@/components/Nav';
import { AIPromptModal } from '@/components/AIPromptModal';
import { ErrorBox, inputCls } from '@/components/ui';
import { Avatar, IssueClosedIcon, IssueLabels, IssueOpenedIcon, IssueStatePill, LockIcon, ghBtn, ghBtnPrimary, ghInput, isClosed } from '@/components/gh';
import { ENV_LABEL, SEVERITY_LABEL, SEVERITY_ORDER, STATUS_LABEL, STATUS_ORDER, timeAgo } from '@/lib/constants';
import { addComment, addSharedComment, deleteComment, errMsg, myVote, setBugLink, setStatus, toggleVote, updateBug, type Me } from '@/lib/db';
import { copyToClipboard } from '@/lib/clipboard';
import { ThumbsUpIcon } from '@/components/icons';

interface Props {
  project: Pick<Project, 'id' | 'name' | 'slug'>;
  bug: Bug;
  comments: BugComment[];
  me: Me | null | undefined;
  role: string | null;
  /** Set when the page was opened through a secret link. */
  token?: string;
  onBug: (b: Bug) => void;
  onComments: (c: BugComment[]) => void;
  /** profile id -> avatar url */
  avatars?: Record<string, string>;
}

const bugUrl = (p: Pick<Project, 'slug'>, b: Bug) => `${location.origin}/p/${p.slug}/b/${b.code}`;

function toMarkdown(project: Props['project'], b: Bug): string {
  const steps = b.steps_to_reproduce?.length ? b.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`).join('\n') : '—';
  return `## [${b.code}] ${b.title}\n\n**Repository:** ${project.name} · **Severity:** ${b.severity} · **Status:** ${b.status} · **Environment:** ${b.environment}\n\n### Steps to reproduce\n${steps}\n\n### Actual behavior\n${b.actual_behavior || '—'}\n\n### Expected behavior\n${b.expected_behavior || '—'}\n${b.evidence_urls?.length ? `\n### Attachments\n${b.evidence_urls.map((u) => `- ${u}`).join('\n')}\n` : ''}`;
}

function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
  <div className="border-b border-[#3d444d] py-4 first:pt-0"><h3 className="mb-2 text-xs font-semibold text-[#9198a1]">{title}</h3>{children}</div>
  );
}
function TimelineBox({ name, when, children, badge, heading, avatar }: { name: string; when: string; children: React.ReactNode; badge?: React.ReactNode; heading?: React.ReactNode; avatar?: string }) {
  return (
  <div className="relative flex gap-4">
    <div className="hidden pt-0.5 sm:block"><Avatar name={name} src={avatar} size={40} /></div>
    <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-[#3d444d]">
      <div className="flex items-center justify-between gap-2 border-b border-[#3d444d] bg-[#151b23] px-4 py-2 text-sm text-[#9198a1]">
        <span className="min-w-0 truncate">{heading ?? <><span className="font-semibold text-[#f0f6fc]">{name}</span> commented {when}</>}</span>{badge}
      </div>
      <div className="gh-body p-4">{children}</div>
    </div>
  </div>
  );
}

export function BugView({ project, bug, comments, me, role, token, onBug, onComments, avatars = {} }: Props) {
  const triage = Boolean(role && !['viewer', 'hunter'].includes(role));
  const isReporter = Boolean(me && bug.reported_by && bug.reported_by === me.id);
  const canLink = Boolean(me && !token && (isReporter || triage));
  const linkOnly = Boolean(token || bug.share_token);

  const [voteState, setVoteState] = useState<{ key: string; voted: boolean } | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [voting, setVoting] = useState(false);
  const [linkBusy, setLinkBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [ai, setAi] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);
  const [notes, setNotes] = useState(bug.dev_notes ?? '');
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimer.current) clearTimeout(copyTimer.current); }, []);

  const voteKey = me ? `${bug.id}:${me.authId}` : '';
  const voted = Boolean(voteKey && voteState?.key === voteKey && voteState.voted);
  useEffect(() => {
    if (!me) return;
    const key = `${bug.id}:${me.authId}`;
    myVote(bug.id, me.authId).then((v) => setVoteState({ key, voted: v })).catch(() => {});
  }, [bug.id, me]);

  const copy = async (key: string, value: string) => { if (await copyToClipboard(value)) { setCopied(key); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(''), 1600); } };

  const vote = async () => {
    if (voting) return;
    if (!me) { setError('Sign in to react to this issue.'); return; }
    const previous = bug;
    const previousVoted = voted;
    const nextVoted = !previousVoted;
    setError(''); setVoting(true);
    setVoteState({ key: voteKey, voted: nextVoted });
    onBug({ ...previous, upvotes_count: Math.max(0, previous.upvotes_count + (nextVoted ? 1 : -1)) });
    try {
      const result = await toggleVote(bug.id);
      setVoteState({ key: voteKey, voted: result.voted });
      onBug({ ...previous, upvotes_count: result.count });
    } catch (reason) {
      setVoteState({ key: voteKey, voted: previousVoted });
      onBug(previous);
      setError(errMsg(reason));
    } finally { setVoting(false); }
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setBusy(true); setError('');
    const optimisticId = `pending-${crypto.randomUUID()}`;
    const optimistic: BugComment = { id: optimisticId, bug_id: bug.id, author_id: me?.id, author_name: me?.full_name ?? 'You', content, created_at: new Date().toISOString() };
    onComments([...comments, optimistic]);
    setText('');
    void (async () => {
      try {
        const saved = token ? await addSharedComment(token, content) : await addComment(bug.id, content);
        onComments([...comments.filter((item) => item.id !== optimisticId), saved]);
      } catch (reason) {
        onComments(comments.filter((item) => item.id !== optimisticId));
        setText(content);
        setError(errMsg(reason));
      } finally { setBusy(false); }
    })();
  };

  const link = token ? `${location.origin}/s/${token}` : bug.share_token ? `${location.origin}/s/${bug.share_token}` : '';
  const t = bug.device_telemetry;

  const changeStatus = (nextStatus: BugStatus) => {
    const previous = bug;
    onBug({ ...previous, status: nextStatus }); setError('');
    void setStatus(bug.id, nextStatus).then(onBug).catch((reason) => { onBug(previous); setError(errMsg(reason)); });
  };
  const closed = isClosed(bug.status);
  const participants = (() => {
    const seen = new Map<string, { key: string; name: string; src?: string }>();
    const add = (id: string | null | undefined, name: string) => { const key = id || `n:${name}`; if (!seen.has(key)) seen.set(key, { key, name, src: id ? avatars[id] : undefined }); };
    add(bug.reported_by, bug.reporter_name);
    comments.forEach((c) => add(c.author_id, c.author_name));
    return [...seen.values()];
  })();
  const hasBody = Boolean(bug.summary || bug.steps_to_reproduce?.length || bug.actual_behavior || bug.expected_behavior || bug.evidence_urls?.length || (t && (t.os || t.browser)));
  return (
    <div>
      <header className="border-b border-[#3d444d] pb-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="min-w-0 break-words text-[26px] font-normal leading-tight text-[#f0f6fc] sm:text-[32px]">
            {bug.title} <span className="font-light text-[#9198a1]">{bug.code}</span>
          </h1>
          <Link href={`/p/${project.slug}/new`} className={`${ghBtnPrimary} shrink-0`}>New issue</Link>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#9198a1]">
          <IssueStatePill status={bug.status} />
          <span><span className="font-semibold text-[#9198a1]">{bug.reporter_name}</span> opened this issue {timeAgo(bug.created_at)} · {comments.length} comment{comments.length === 1 ? '' : 's'}</span>
          {linkOnly && <span className="inline-flex items-center gap-1 rounded-full border border-[#9e6a03] px-2 text-xs leading-[20px] text-[#d29922]"><LockIcon className="h-3 w-3" />Private link only</span>}
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_256px]">
        <div className="min-w-0">
          <div className="relative space-y-4 before:absolute before:bottom-0 before:left-[20px] before:top-0 before:hidden before:w-0.5 before:bg-[#3d444d] sm:before:block [&>*]:relative">
            <TimelineBox name={bug.reporter_name} avatar={bug.reported_by ? avatars[bug.reported_by] : undefined} when={timeAgo(bug.created_at)} badge={<span className="rounded-full border border-[#3d444d] px-2 text-xs leading-[18px]">Author</span>}>
              {!hasBody && <p className="italic text-[#9198a1]">No description provided.</p>}
              {bug.summary && <p className="whitespace-pre-wrap">{bug.summary}</p>}
              {bug.steps_to_reproduce?.length > 0 && <><h3>Steps to reproduce</h3><ol>{bug.steps_to_reproduce.map((step, i) => <li key={i}>{step}</li>)}</ol></>}
              {bug.actual_behavior && <><h3>Actual behavior</h3><p className="whitespace-pre-wrap">{bug.actual_behavior}</p></>}
              {bug.expected_behavior && <><h3>Expected behavior</h3><p className="whitespace-pre-wrap">{bug.expected_behavior}</p></>}
              {bug.evidence_urls?.length > 0 && (<><h3>Attachments</h3>
                <div className="flex flex-wrap gap-2">{bug.evidence_urls.map((u) => {
                  const src = token && u.startsWith('/api/attachments/') ? `${u}?share_token=${encodeURIComponent(token)}` : u;
                  return <button key={u} onClick={() => setZoom(src)} className="overflow-hidden rounded-md border border-[#3d444d]"><img src={src} alt="Screenshot" className="h-32 w-auto object-cover" loading="lazy" /></button>;
                })}</div></>)}
              {t && (t.os || t.browser) && <p className="mt-3 text-xs text-[#9198a1]">Device · {[t.os, t.browser, t.viewport, t.language].filter(Boolean).join(' · ')}</p>}
              <div className="mt-4 flex">
                <button onClick={vote} disabled={voting} aria-pressed={voted} title="I have this issue too"
                  className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium ${voted ? 'border-[#1f6feb] bg-[#1f6feb]/15 text-[#4493f8]' : 'border-[#3d444d] text-[#9198a1] hover:border-[#9198a1]'}`}>
                  <ThumbsUpIcon className="h-3.5 w-3.5" />{bug.upvotes_count}
                </button>
              </div>
            </TimelineBox>

            {(triage || bug.dev_notes) && (
              <TimelineBox name="Developer notes" when="" heading={<><span className="font-semibold text-[#f0f6fc]">Developer notes</span> · visible to the team only</>} badge={<span className="rounded-full border border-[#3d444d] px-2 text-xs leading-[18px]">Team</span>}>
                {triage ? (
                  <div className="space-y-2">
                    <textarea className={`${inputCls} min-h-20`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Root cause, affected files, and fix…" />
                    {notes !== (bug.dev_notes ?? '') && <div className="flex justify-end"><button className={ghBtnPrimary} onClick={() => { const previous = bug; const nextNotes = notes; onBug({ ...previous, dev_notes: nextNotes }); void updateBug(bug.id, { dev_notes: nextNotes }).then(onBug).catch((reason) => { onBug(previous); setNotes(previous.dev_notes ?? ''); setError(errMsg(reason)); }); }}>Save notes</button></div>}
                  </div>
                ) : <p className="whitespace-pre-wrap">{bug.dev_notes}</p>}
              </TimelineBox>
            )}

            {comments.map((c) => (
              <TimelineBox key={c.id} name={c.author_name} avatar={c.author_id ? avatars[c.author_id] : undefined} when={timeAgo(c.created_at)}
                badge={!token && (triage || (me && c.author_id === me.id)) ? <button className="text-xs text-[#f85149] hover:underline" onClick={() => { const previous = comments; onComments(previous.filter((x) => x.id !== c.id)); void deleteComment(c.id).catch((reason) => { onComments(previous); setError(errMsg(reason)); }); }}>Delete</button> : undefined}>
                <p className="whitespace-pre-wrap">{c.content}</p>
              </TimelineBox>
            ))}
          </div>

          <div className="mt-6 border-t-2 border-[#3d444d] pt-6">
            {me ? (
              <form onSubmit={send} className="flex gap-4">
                <div className="hidden sm:block"><Avatar name={me.full_name} src={me.avatar_url} size={40} /></div>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-2 text-base font-semibold text-[#f0f6fc]">Add a comment</h2>
                  <div className="rounded-md border border-[#3d444d]">
                    <textarea className="block min-h-[110px] w-full resize-y rounded-md border-0 bg-[#0d1117] px-3 py-2 text-sm text-[#f0f6fc] placeholder-[#9198a1] focus:!shadow-none" value={text} onChange={(e) => setText(e.target.value)} placeholder="Use Markdown to format your comment" maxLength={5000} aria-label="Comment" />
                  </div>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    {triage && !token && (closed
                      ? <button type="button" className={ghBtn} onClick={() => changeStatus('REPORTED')}><IssueOpenedIcon className="text-[#3fb950]" />Reopen issue</button>
                      : <button type="button" className={ghBtn} onClick={() => changeStatus('CLOSED')}><IssueClosedIcon className="text-[#ab7df8]" />Close issue</button>)}
                    <button className={ghBtnPrimary} disabled={busy || !text.trim()}>{busy ? 'Commenting…' : 'Comment'}</button>
                  </div>
                </div>
              </form>
            ) : me === null ? <LoginHint what="Write a comment" /> : null}
          </div>
          {error && <div className="mt-4"><ErrorBox message={error} /></div>}
        </div>

        <aside className="text-sm lg:self-start">
          <SideSection title="Assignees">
            {bug.assigned_to
              ? <span className="inline-flex items-center gap-2 text-[#f0f6fc]"><Avatar name="Assignee" src={avatars[bug.assigned_to]} size={20} />Assigned</span>
              : <span className="text-[#9198a1]">No one assigned</span>}
          </SideSection>
          <SideSection title="Labels">
            <div className="flex flex-wrap gap-1"><IssueLabels bug={bug} /></div>
            {triage && !token && (
              <select aria-label="Severity" className="gh-menu-select mt-2 !pl-0" value={bug.severity} onChange={(e) => {
                const previous = bug; const nextSeverity = e.target.value as Severity;
                onBug({ ...previous, severity: nextSeverity }); setError('');
                void updateBug(bug.id, { severity: nextSeverity }).then(onBug).catch((reason) => { onBug(previous); setError(errMsg(reason)); });
              }}>{SEVERITY_ORDER.map((s) => <option key={s} value={s}>Severity: {SEVERITY_LABEL[s]}</option>)}</select>
            )}
          </SideSection>
          <SideSection title="Status">
            {triage && !token ? (
              <select aria-label="Status" className="gh-menu-select !pl-0" value={bug.status} onChange={(e) => changeStatus(e.target.value as BugStatus)}>
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            ) : <span className="text-[#f0f6fc]">{STATUS_LABEL[bug.status]}</span>}
          </SideSection>
          <SideSection title="Environment"><span className="text-[#f0f6fc]">{ENV_LABEL[bug.environment]}</span></SideSection>
          <SideSection title={`${participants.length} participant${participants.length === 1 ? '' : 's'}`}>
            <div className="flex flex-wrap gap-1">{participants.map((u) => <span key={u.key} title={u.name}><Avatar name={u.name} src={u.src} size={26} /></span>)}</div>
          </SideSection>
          <SideSection title="Actions">
            <div className="flex flex-col items-start gap-1.5">
              <button className="text-[#9198a1] hover:text-[#4493f8]" onClick={() => setAi(true)}>Generate AI prompt</button>
              <button className="text-[#9198a1] hover:text-[#4493f8]" onClick={() => copy('md', toMarkdown(project, bug))}>{copied === 'md' ? 'Copied!' : 'Copy as Markdown'}</button>
              {!linkOnly && <button className="text-[#9198a1] hover:text-[#4493f8]" onClick={() => copy('url', bugUrl(project, bug))}>{copied === 'url' ? 'Copied!' : 'Copy link'}</button>}
            </div>
          </SideSection>

          {(canLink || token) && (
            <div className="py-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#9198a1]"><LockIcon className="h-3 w-3" />Private link</h3>
              {linkOnly ? (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-[#9198a1]">Hidden from listings and search. Anyone with the link can open it.</p>
                  {link && <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Private link" className={`${ghInput} font-mono text-[11px]`} />}
                  {canLink && (
                    <div className="flex flex-wrap gap-2">
                      <button className={ghBtn} onClick={() => copy('link', link)}>{copied === 'link' ? 'Copied!' : 'Copy'}</button>
                      <button className={ghBtn} disabled={linkBusy} onClick={() => { if (!confirm('The previous private link will stop working. Continue?')) return; setLinkBusy(true); void setBugLink(bug.id, true, true).then((tkn) => onBug({ ...bug, share_token: tkn })).catch((reason) => setError(errMsg(reason))).finally(() => setLinkBusy(false)); }}>Regenerate</button>
                      <button className={ghBtn} disabled={linkBusy} onClick={() => { if (!confirm('This issue will become visible to everyone. Continue?')) return; const previous = bug; onBug({ ...bug, share_token: null }); setLinkBusy(true); void setBugLink(bug.id, false).then(() => onBug({ ...previous, share_token: null })).catch((reason) => { onBug(previous); setError(errMsg(reason)); }).finally(() => setLinkBusy(false)); }}>Make public</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs leading-relaxed text-[#9198a1]">This issue is public. Hide it from listings and share it with a private link instead.</p>
                  <button className={`${ghBtn} w-full`} disabled={linkBusy} onClick={() => { setLinkBusy(true); void setBugLink(bug.id, true).then((tkn) => onBug({ ...bug, share_token: tkn })).catch((reason) => setError(errMsg(reason))).finally(() => setLinkBusy(false)); }}>{linkBusy ? 'Creating private link…' : 'Create private link'}</button>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {ai && <AIPromptModal bugs={[bug]} onClose={() => setAi(false)} />}
      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" onClick={() => setZoom(null)} role="dialog" aria-label="Screenshot">
          <img src={zoom} alt="Screenshot" className="max-h-full max-w-full rounded-md" />
        </div>
      )}
    </div>
  );
}
