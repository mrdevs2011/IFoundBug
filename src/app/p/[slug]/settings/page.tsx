'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Empty, ErrorBox, Spinner, btnGhost } from '@/components/ui';
import { RepoHeader, ghBtn, ghBtnPrimary, ghInput } from '@/components/gh';
import { createIntegration, deleteIntegration, errMsg, getProject, listIntegrations, myRole, testIntegration, updateIntegration, type Integration, type WebhookEvent } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import { copyToClipboard } from '@/lib/clipboard';
import { timeAgo } from '@/lib/constants';
import type { Project } from '@/types';

const EVENTS: [WebhookEvent, string][] = [
  ['issue.created', 'New issue'],
  ['issue.status_changed', 'Status changed'],
  ['issue.assigned', 'Issue assigned'],
  ['comment.created', 'New comment (team-only notes are never sent)'],
];

function EventPicker({ value, onChange }: { value: WebhookEvent[]; onChange: (v: WebhookEvent[]) => void }) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="mb-1 text-sm font-semibold text-[#f0f6fc]">Send me</legend>
      {EVENTS.map(([k, label]) => (
        <label key={k} className="flex items-center gap-2 text-sm text-[#f0f6fc]">
          <input type="checkbox" className="h-4 w-4 accent-[#1f6feb]" checked={value.includes(k)} onChange={(e) => onChange(e.target.checked ? [...value, k] : value.filter((x) => x !== k))} />{label}
        </label>
      ))}
    </fieldset>
  );
}

function TelegramForm({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [chats, setChats] = useState<{ id: string; title: string; type: string }[] | null>(null);
  const [bot, setBot] = useState('');
  const [hint, setHint] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(['issue.created', 'issue.status_changed', 'comment.created']);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const findChats = async () => {
    setBusy('chats'); setError(''); setHint('');
    try {
      const res = await fetch('/api/telegram/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token.trim() }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setBot(json.bot); setChats(json.chats); setHint(json.hint || '');
      if (json.chats?.length === 1) setChatId(json.chats[0].id);
    } catch (e) { setError(errMsg(e)); } finally { setBusy(''); }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy('save'); setError('');
    try {
      const { id } = await createIntegration(projectId, { kind: 'telegram', name: bot ? `@${bot}` : 'Telegram', botToken: token.trim(), chatId: chatId.trim(), events });
      await testIntegration(id);
      onDone();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(''); }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <ol className="list-decimal space-y-1 pl-5 text-sm text-[#9198a1]">
        <li>In Telegram open <b className="text-[#f0f6fc]">@BotFather</b>, send <code className="rounded bg-[#262c36] px-1">/newbot</code>, copy the token.</li>
        <li>Add the bot to your team group (or open the bot and press Start), then send any message there.</li>
        <li>Paste the token below and press <b className="text-[#f0f6fc]">Find chats</b>.</li>
      </ol>
      <div>
        <label className="mb-1 block text-sm font-semibold text-[#f0f6fc]" htmlFor="tg-token">Bot token</label>
        <div className="flex gap-2">
          <input id="tg-token" className={`${ghInput} font-mono`} value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456789:AA..." autoComplete="off" spellCheck={false} />
          <button type="button" className={ghBtn} disabled={!token.trim() || Boolean(busy)} onClick={findChats}>{busy === 'chats' ? 'Looking…' : 'Find chats'}</button>
        </div>
      </div>
      {chats && (
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#f0f6fc]" htmlFor="tg-chat">Chat {bot && <span className="font-normal text-[#9198a1]">for @{bot}</span>}</label>
          {chats.length > 0 ? (
            <select id="tg-chat" className={ghInput} value={chatId} onChange={(e) => setChatId(e.target.value)}>
              <option value="">Choose a chat…</option>
              {chats.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.type})</option>)}
            </select>
          ) : <p className="mb-2 text-xs text-[#d29922]">{hint || 'No chats found yet. Send a message to the bot or in the group, then press Find chats again — or type the chat id.'}</p>}
          <input className={`${ghInput} mt-2 font-mono`} value={chatId} onChange={(e) => setChatId(e.target.value)} placeholder="Chat id, e.g. -1001234567890 or @channelname" />
        </div>
      )}
      <EventPicker value={events} onChange={setEvents} />
      {error && <ErrorBox message={error} />}
      <button className={ghBtnPrimary} disabled={Boolean(busy) || !token.trim() || !chatId.trim() || !events.length}>{busy === 'save' ? 'Connecting…' : 'Connect Telegram'}</button>
    </form>
  );
}

function WebhookForm({ projectId, onDone }: { projectId: string; onDone: (secret: string | null) => void }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>(['issue.created', 'issue.status_changed', 'comment.created']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const r = await createIntegration(projectId, { kind: 'http', name: name.trim() || new URL(url).hostname, url: url.trim(), events }); onDone(r.secret); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-[#9198a1]">IFB sends a signed JSON <code className="rounded bg-[#262c36] px-1">POST</code> to your URL. Verify <code className="rounded bg-[#262c36] px-1">X-IFB-Signature</code> = <code className="rounded bg-[#262c36] px-1">sha256=HMAC(secret, body)</code>.</p>
      <div><label className="mb-1 block text-sm font-semibold text-[#f0f6fc]" htmlFor="wh-url">Payload URL</label><input id="wh-url" className={ghInput} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/ifb-webhook" /></div>
      <div><label className="mb-1 block text-sm font-semibold text-[#f0f6fc]" htmlFor="wh-name">Name <span className="font-normal text-[#9198a1]">(optional)</span></label><input id="wh-name" className={ghInput} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Deploy bot" /></div>
      <EventPicker value={events} onChange={setEvents} />
      {error && <ErrorBox message={error} />}
      <button className={ghBtnPrimary} disabled={busy || !url.trim() || !events.length}>{busy ? 'Adding…' : 'Add webhook'}</button>
    </form>
  );
}

function DeliveryDot({ d }: { d: Integration['recent'][number] }) {
  const ok = d.status !== null && d.status < 300;
  const label = d.pending ? 'pending' : d.error ? d.error : `HTTP ${d.status}`;
  return <span title={`${d.event} · ${label} · ${timeAgo(d.at)}`} className={`inline-block h-2.5 w-2.5 rounded-full ${d.pending ? 'bg-[#9198a1]' : ok ? 'bg-[#3fb950]' : 'bg-[#f85149]'}`} />;
}

export default function SettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const me = useMe();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [roleState, setRoleState] = useState<{ key: string; role: string | null } | null>(null);
  const [items, setItems] = useState<Integration[] | null>(null);
  const [adding, setAdding] = useState<'' | 'telegram' | 'http'>('');
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => { let alive = true; getProject(slug).then((p) => { if (alive) setProject(p); }).catch((e) => { if (alive) setError(errMsg(e)); }); return () => { alive = false; }; }, [slug]);
  const roleKey = project && me ? `${project.id}:${me.id}` : '';
  useEffect(() => {
    if (!project || !me) return;
    let alive = true;
    const key = `${project.id}:${me.id}`;
    myRole(project.id, me.id).then((r) => { if (alive) setRoleState({ key, role: r }); }).catch(() => { if (alive) setRoleState({ key, role: null }); });
    return () => { alive = false; };
  }, [project, me]);
  // undefined = still loading; owners are always stored as members with role "owner".
  const role = me === null ? null : roleKey && roleState?.key === roleKey ? roleState.role : undefined;
  const isAdmin = role === 'owner' || role === 'admin';
  const projectId = project?.id;
  useEffect(() => {
    if (!isAdmin || !projectId) return;
    let alive = true;
    listIntegrations(projectId).then((r) => { if (alive) setItems(r); }).catch((e) => { if (alive) setError(errMsg(e)); });
    return () => { alive = false; };
  }, [isAdmin, projectId, reload]);
  const load = () => setReload((n) => n + 1);

  const act = async (fn: () => Promise<unknown>) => { setError(''); try { await fn(); load(); } catch (e) { setError(errMsg(e)); } };

  if (project === undefined && !error) return <><Nav /><Spinner label="Loading…" /></>;
  if (project === null) return <><Nav /><main className="mx-auto max-w-5xl flex-1 px-4 py-10"><Empty title="Repository not found"><Link href="/" className={btnGhost}>Home</Link></Empty></main></>;
  return (
    <>
      <Nav />
      {project && <RepoHeader project={project} active="settings" />}
      <main className="mx-auto w-full max-w-[1012px] flex-1 px-4 py-6 md:px-6">
        {role === undefined && !error && <Spinner />}
        {role !== undefined && !isAdmin && <Empty title="Only owners and admins can change repository settings." />}
        {isAdmin && project && (
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#3d444d] pb-3">
              <div>
                <h1 className="text-2xl font-normal text-[#f0f6fc]">Integrations</h1>
                <p className="mt-1 text-sm text-[#9198a1]">Get issue and comment updates in Telegram or send them to your own service.</p>
              </div>
              <div className="flex gap-2">
                <button className={ghBtn} onClick={() => { setAdding('telegram'); setSecret(null); }}>Add Telegram</button>
                <button className={ghBtn} onClick={() => { setAdding('http'); setSecret(null); }}>Add webhook</button>
              </div>
            </div>
            {error && <div className="mb-4"><ErrorBox message={error} /></div>}
            {secret && (
              <div className="mb-4 rounded-md border border-[#9e6a03] bg-[#9e6a03]/10 p-4 text-sm">
                <p className="font-semibold text-[#f0f6fc]">Signing secret — copy it now, it will not be shown again.</p>
                <div className="mt-2 flex gap-2"><input readOnly value={secret} className={`${ghInput} font-mono`} onFocus={(e) => e.currentTarget.select()} /><button className={ghBtn} onClick={() => void copyToClipboard(secret)}>Copy</button></div>
              </div>
            )}
            {adding && (
              <div className="mb-6 rounded-md border border-[#3d444d] p-4">
                <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold text-[#f0f6fc]">{adding === 'telegram' ? 'Connect Telegram' : 'Add webhook'}</h2><button className="text-sm text-[#9198a1] hover:text-[#f0f6fc]" onClick={() => setAdding('')}>Cancel</button></div>
                {adding === 'telegram'
                  ? <TelegramForm projectId={project.id} onDone={() => { setAdding(''); load(); }} />
                  : <WebhookForm projectId={project.id} onDone={(s) => { setAdding(''); setSecret(s); load(); }} />}
              </div>
            )}
            {!items && <Spinner />}
            {items && items.length === 0 && !adding && <Empty title="No integrations yet" hint="Connect Telegram to get new issues, status changes and comments in your team chat." />}
            {items && items.length > 0 && (
              <ul className="overflow-hidden rounded-md border border-[#3d444d]">
                {items.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center gap-3 border-b border-[#3d444d] px-4 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#3d444d] px-2 text-xs leading-[18px] text-[#9198a1]">{h.kind === 'telegram' ? 'Telegram' : 'Webhook'}</span>
                        <span className="truncate font-semibold text-[#f0f6fc]">{h.name || (h.kind === 'http' ? h.url : 'Telegram')}</span>
                        {!h.active && <span className="text-xs text-[#d29922]">paused</span>}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#9198a1]">{h.kind === 'http' ? h.url : `chat ${h.telegram_chat_id}`} · {h.events.length} event{h.events.length === 1 ? '' : 's'}</p>
                    </div>
                    <span className="flex items-center gap-1" aria-label="Recent deliveries">{h.recent.length ? h.recent.map((d, i) => <DeliveryDot key={i} d={d} />) : <span className="text-xs text-[#9198a1]">no deliveries yet</span>}</span>
                    <div className="flex gap-2">
                      <button className={ghBtn} onClick={() => act(() => testIntegration(h.id))}>Send test</button>
                      <button className={ghBtn} onClick={() => act(() => updateIntegration(h.id, { active: !h.active }))}>{h.active ? 'Pause' : 'Resume'}</button>
                      <button className={`${ghBtn} !text-[#f85149]`} onClick={() => { if (confirm('Delete this integration?')) void act(() => deleteIntegration(h.id)); }}>Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {items && items.length > 0 && <p className="mt-2 text-xs text-[#9198a1]">Dots show the last 5 deliveries: green delivered, red failed (hover for the reason), grey pending. <button className="text-[#4493f8] hover:underline" onClick={load}>Refresh</button></p>}
          </section>
        )}
      </main>
    </>
  );
}
