'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { Bug, BugComment, BugStatus, Project, Severity } from '@/types';
import { LoginHint } from '@/components/Nav';
import { AIPromptModal } from '@/components/AIPromptModal';
import { ErrorBox, SeverityBadge, StatusBadge, btnGhost, btnPrimary, inputCls } from '@/components/ui';
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
}

const bugUrl = (p: Pick<Project, 'slug'>, b: Bug) => `${location.origin}/p/${p.slug}/b/${b.code}`;

function toMarkdown(project: Props['project'], b: Bug): string {
  const steps = b.steps_to_reproduce?.length ? b.steps_to_reproduce.map((s, i) => `${i + 1}. ${s}`).join('\n') : '—';
  return `## [${b.code}] ${b.title}\n\n**Repository:** ${project.name} · **Severity:** ${b.severity} · **Status:** ${b.status} · **Environment:** ${b.environment}\n\n### Steps to reproduce\n${steps}\n\n### Actual behavior\n${b.actual_behavior || '—'}\n\n### Expected behavior\n${b.expected_behavior || '—'}\n${b.evidence_urls?.length ? `\n### Attachments\n${b.evidence_urls.map((u) => `- ${u}`).join('\n')}\n` : ''}`;
}

export function BugView({ project, bug, comments, me, role, token, onBug, onComments }: Props) {
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0 space-y-6">
        <header>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="font-mono">{bug.code}</span><StatusBadge status={bug.status} /><SeverityBadge severity={bug.severity} />
            {linkOnly && <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-300">Private link only</span>}
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-snug text-white">{bug.title}</h1>
          <p className="mt-1 text-xs text-zinc-500">{bug.reporter_name} · {timeAgo(bug.created_at)} · {ENV_LABEL[bug.environment]}</p>
        </header>

        {bug.steps_to_reproduce?.length > 0 && (
          <section><h2 className="mb-2 text-sm font-semibold text-zinc-200">Steps to reproduce</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-300">{bug.steps_to_reproduce.map((s, i) => <li key={i}>{s}</li>)}</ol></section>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {bug.actual_behavior && <section className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-4"><h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-300">Actual</h2><p className="whitespace-pre-wrap text-sm text-zinc-300">{bug.actual_behavior}</p></section>}
          {bug.expected_behavior && <section className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4"><h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">Expected</h2><p className="whitespace-pre-wrap text-sm text-zinc-300">{bug.expected_behavior}</p></section>}
        </div>
        {bug.evidence_urls?.length > 0 && (
          <section><h2 className="mb-2 text-sm font-semibold text-zinc-200">Attachments</h2>
            <div className="flex flex-wrap gap-2">{bug.evidence_urls.map((u) => {
              const src = token && u.startsWith('/api/attachments/') ? `${u}?share_token=${encodeURIComponent(token)}` : u;
              return <button key={u} onClick={() => setZoom(src)} className="overflow-hidden rounded-lg border border-white/10">
                <img src={src} alt="Screenshot" className="h-28 w-auto object-cover" loading="lazy" />
              </button>; })}</div></section>
        )}
        {t && (t.os || t.browser) && <p className="text-xs text-zinc-500">Device · {[t.os, t.browser, t.viewport, t.language].filter(Boolean).join(' · ')}</p>}
        {(triage || bug.dev_notes) && (
          <section><h2 className="mb-2 text-sm font-semibold text-zinc-200">Developer notes</h2>
            {triage ? (
              <div className="space-y-2">
                <textarea className={`${inputCls} min-h-20`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Root cause, affected files, and fix…" />
                {notes !== (bug.dev_notes ?? '') && <button className={btnPrimary} onClick={() => { const previous = bug; const nextNotes = notes; onBug({ ...previous, dev_notes: nextNotes }); void updateBug(bug.id, { dev_notes: nextNotes }).then(onBug).catch((reason) => { onBug(previous); setNotes(previous.dev_notes ?? ''); setError(errMsg(reason)); }); }}>Save</button>}
              </div>
            ) : <p className="whitespace-pre-wrap text-sm text-zinc-300">{bug.dev_notes}</p>}
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-200">Discussion ({comments.length})</h2>
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-medium text-zinc-300">{c.author_name}</span>
                  <span className="flex gap-3">{timeAgo(c.created_at)}
                    {!token && (triage || (me && c.author_id === me.id)) && <button className="text-red-300 hover:underline" onClick={() => { const previous = comments; onComments(previous.filter((x) => x.id !== c.id)); void deleteComment(c.id).catch((reason) => { onComments(previous); setError(errMsg(reason)); }); }}>Delete</button>}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-200">{c.content}</p>
              </li>
            ))}
            {comments.length === 0 && <li className="text-xs text-zinc-500">No comments yet.</li>}
          </ul>
          <div className="mt-4">
            {me ? (
              <form onSubmit={send} className="space-y-2">
                <textarea className={`${inputCls} min-h-20`} value={text} onChange={(e) => setText(e.target.value)} placeholder="Leave a comment…" maxLength={5000} aria-label="Comment" />
                <button className={btnPrimary} disabled={busy || !text.trim()}>{busy ? 'Submitting…' : 'Comment'}</button>
              </form>
            ) : me === null ? <LoginHint what="Write a comment" /> : null}
          </div>
        </section>
        {error && <ErrorBox message={error} />}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <button onClick={vote} disabled={voting} aria-pressed={voted} className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${voted ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300' : 'border-white/10 text-zinc-200 hover:bg-white/5'}`}>
          <span className="flex items-center gap-2"><ThumbsUpIcon className="h-4 w-4" />I have this issue too</span><span>{bug.upvotes_count}</span>
        </button>

        {triage && !token && (
          <div className="space-y-3 rounded-2xl border border-white/10 p-4">
            <label className="block text-xs text-zinc-400">Status
              <select className={`${inputCls} mt-1 !py-2`} value={bug.status} onChange={(e) => {
                const previous = bug; const nextStatus = e.target.value as BugStatus;
                onBug({ ...previous, status: nextStatus }); setError('');
                void setStatus(bug.id, nextStatus).then(onBug).catch((reason) => { onBug(previous); setError(errMsg(reason)); });
              }}>
                {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select></label>
            <label className="block text-xs text-zinc-400">Severity
              <select className={`${inputCls} mt-1 !py-2`} value={bug.severity} onChange={(e) => {
                const previous = bug; const nextSeverity = e.target.value as Severity;
                onBug({ ...previous, severity: nextSeverity }); setError('');
                void updateBug(bug.id, { severity: nextSeverity }).then(onBug).catch((reason) => { onBug(previous); setError(errMsg(reason)); });
              }}>
                {SEVERITY_ORDER.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
              </select></label>
          </div>
        )}

        <div className="space-y-2 rounded-2xl border border-white/10 p-4">
          <button className={`${btnGhost} w-full`} onClick={() => setAi(true)}>AI · Generate AI prompt</button>
          <button className={`${btnGhost} w-full`} onClick={() => copy('md', toMarkdown(project, bug))}>{copied === 'md' ? 'Copied' : 'Copy Markdown'}</button>
          {!linkOnly && <button className={`${btnGhost} w-full`} onClick={() => copy('url', bugUrl(project, bug))}>{copied === 'url' ? 'Copied' : 'Copy link'}</button>}
        </div>

        {(canLink || token) && (
          <div className="space-y-2 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <h3 className="text-sm font-semibold text-amber-200">Private link</h3>
            {linkOnly ? (
              <>
                <p className="text-xs leading-relaxed text-zinc-400">This issue is hidden from listings and search. Anyone with the link can access it; share it only with trusted people.</p>
                {link && <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Private link" className={`${inputCls} !py-2 font-mono text-[11px]`} />}
                {canLink && (
                  <div className="flex flex-wrap gap-2">
                    <button className={btnPrimary} onClick={() => copy('link', link)}>{copied === 'link' ? 'Copied' : 'Copy'}</button>
                    <button className={btnGhost} disabled={linkBusy} onClick={() => { if (!confirm('The previous private link will stop working. Continue?')) return; setLinkBusy(true); void setBugLink(bug.id, true, true).then((tkn) => onBug({ ...bug, share_token: tkn })).catch((reason) => setError(errMsg(reason))).finally(() => setLinkBusy(false)); }}>Regenerate</button>
                    <button className={btnGhost} disabled={linkBusy} onClick={() => { if (!confirm('This issue will become visible to everyone. Continue?')) return; const previous = bug; onBug({ ...bug, share_token: null }); setLinkBusy(true); void setBugLink(bug.id, false).then(() => onBug({ ...previous, share_token: null })).catch((reason) => { onBug(previous); setError(errMsg(reason)); }).finally(() => setLinkBusy(false)); }}>Make public</button>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-xs leading-relaxed text-zinc-400">This issue is currently public. You can hide it from listings and share it using a private link.</p>
                <button className={`${btnGhost} w-full`} disabled={linkBusy} onClick={() => { setLinkBusy(true); void setBugLink(bug.id, true).then((tkn) => onBug({ ...bug, share_token: tkn })).catch((reason) => setError(errMsg(reason))).finally(() => setLinkBusy(false)); }}>{linkBusy ? 'Creating private link…' : 'Create private link'}</button>
              </>
            )}
          </div>
        )}
      </aside>

      {ai && <AIPromptModal bugs={[bug]} onClose={() => setAi(false)} />}
      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4" onClick={() => setZoom(null)} role="dialog" aria-label="Screenshot">
          <img src={zoom} alt="Screenshot" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
