'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { Avatar } from '@/components/gh';
import type { Project, ProjectInvite } from '@/types';
import { createInvite, errMsg, listInvites, listMembers, removeMember, revokeInvite, type Member } from '@/lib/db';
import { copyToClipboard } from '@/lib/clipboard';
import { btnGhost, btnPrimary, ErrorBox, Modal } from '@/components/ui';

const ROLES: [string, string][] = [['developer', 'Developer (can update issue status)'], ['qa_tester', 'QA tester (can update issue status)'], ['admin', 'Admin (team and settings)'], ['viewer', 'Viewer']];

export function TeamPanel({ project, isAdmin, onClose }: { project: Project; isAdmin: boolean; onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [role, setRole] = useState('developer');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [pending, setPending] = useState('');

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    let alive = true;
    Promise.all([listMembers(project.id), isAdmin ? listInvites(project.id) : Promise.resolve([] as ProjectInvite[])])
      .then(([m, i]) => { if (alive) { setMembers(m); setInvites(i); } })
      .catch((e) => { if (alive) setError(errMsg(e)); });
    return () => { alive = false; };
  }, [project.id, isAdmin, tick]);

  const url = (t: string) => `${location.origin}/invite/${t}`;
  const make = async () => {
    if (pending) return;
    setPending('create'); setError('');
    try {
      const inv = await createInvite(project.id, role);
      setInvites((current) => [inv, ...current.filter((item) => item.id !== inv.id)]);
      if (await copyToClipboard(url(inv.token))) setCopied(inv.id);
      load();
    } catch (e) { setError(errMsg(e)); }
    finally { setPending(''); }
  };

  return (
    <Modal title="People" onClose={onClose}>
      <div className="space-y-5">
        <ul className="space-y-1.5">
          {members.map((m) => (
            <li key={m.profile.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-[#f0f6fc]"><Avatar name={m.profile.full_name} src={m.profile.avatar_url} size={24} />{m.profile.full_name} <span className="text-xs text-[#9198a1]">@{m.profile.username}</span></span>
              <span className="flex items-center gap-2 text-xs text-[#9198a1]">{m.role}
                {isAdmin && m.role !== 'owner' && <button disabled={Boolean(pending)} className="text-red-300 hover:underline disabled:opacity-50" onClick={() => { const previous = members; setMembers(previous.filter((member) => member.profile.id !== m.profile.id)); setPending(`member:${m.profile.id}`); void removeMember(project.id, m.profile.id).then(load).catch((reason) => { setMembers(previous); setError(errMsg(reason)); }).finally(() => setPending('')); }}>Remove</button>}
              </span>
            </li>
          ))}
        </ul>
        {isAdmin ? (
          <div className="space-y-3 border-t border-white/[0.07] pt-4">
            <h3 className="text-sm font-semibold text-white">Invitation link</h3>
            <div className="flex gap-2">
              <select value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white">
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className={btnPrimary} onClick={make} disabled={Boolean(pending)}>{pending === 'create' ? 'Creating…' : 'Create'}</button>
            </div>
            <ul className="space-y-1.5">
              {invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-[#9198a1]">
                  <span className="truncate">{i.role} · {i.uses_count}/{i.max_uses}</span>
                  <span className="flex shrink-0 gap-3">
                    <button className="text-[#3fb950] hover:underline" onClick={async () => { if (await copyToClipboard(url(i.token))) setCopied(i.id); }}>{copied === i.id ? 'Copied' : 'Copy'}</button>
                    <button disabled={Boolean(pending)} className="text-red-300 hover:underline disabled:opacity-50" onClick={() => { const previous = invites; setInvites(previous.filter((invite) => invite.id !== i.id)); setPending(`invite:${i.id}`); void revokeInvite(i.id).then(load).catch((reason) => { setInvites(previous); setError(errMsg(reason)); }).finally(() => setPending('')); }}>Revoke</button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-[#9198a1]">Invitations expire after 30 days. Members can triage issues; public issue reports and comments do not require membership.</p>
          </div>
        ) : <p className="text-xs text-[#9198a1]">Only repository admins can manage members.</p>}
        {error && <ErrorBox message={error} />}
        <button className={`${btnGhost} w-full`} onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
