'use client';
import React, { useCallback, useEffect, useState } from 'react';
import type { Project, ProjectInvite } from '@/types';
import { createInvite, errMsg, listInvites, listMembers, removeMember, revokeInvite, type Member } from '@/lib/db';
import { copyToClipboard } from '@/lib/clipboard';
import { btnGhost, btnPrimary, ErrorBox, Modal } from '@/components/ui';

const ROLES: [string, string][] = [['developer', 'Dasturchi (statusni o‘zgartira oladi)'], ['qa_tester', 'QA (statusni o‘zgartira oladi)'], ['admin', 'Admin (jamoa va sozlamalar)'], ['viewer', 'Kuzatuvchi']];

export function TeamPanel({ project, isAdmin, onClose }: { project: Project; isAdmin: boolean; onClose: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [role, setRole] = useState('developer');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');

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
  const make = async () => { try { const inv = await createInvite(project.id, role); load(); if (await copyToClipboard(url(inv.token))) setCopied(inv.id); } catch (e) { setError(errMsg(e)); } };

  return (
    <Modal title="Jamoa" onClose={onClose}>
      <div className="space-y-5">
        <ul className="space-y-1.5">
          {members.map((m) => (
            <li key={m.profile.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
              <span className="text-zinc-200">{m.profile.full_name} <span className="text-xs text-zinc-500">@{m.profile.username}</span></span>
              <span className="flex items-center gap-2 text-xs text-zinc-400">{m.role}
                {isAdmin && m.role !== 'owner' && <button className="text-red-300 hover:underline" onClick={async () => { await removeMember(project.id, m.profile.id).catch((e) => setError(errMsg(e))); load(); }}>olib tashlash</button>}
              </span>
            </li>
          ))}
        </ul>
        {isAdmin ? (
          <div className="space-y-3 border-t border-white/[0.07] pt-4">
            <h3 className="text-sm font-semibold text-white">Taklif havolasi</h3>
            <div className="flex gap-2">
              <select value={role} onChange={(e) => setRole(e.target.value)} className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white">
                {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className={btnPrimary} onClick={make}>Yaratish</button>
            </div>
            <ul className="space-y-1.5">
              {invites.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
                  <span className="truncate">{i.role} · {i.uses_count}/{i.max_uses}</span>
                  <span className="flex shrink-0 gap-3">
                    <button className="text-emerald-300 hover:underline" onClick={async () => { if (await copyToClipboard(url(i.token))) setCopied(i.id); }}>{copied === i.id ? 'Nusxalandi' : 'Nusxalash'}</button>
                    <button className="text-red-300 hover:underline" onClick={async () => { await revokeInvite(i.id).catch((e) => setError(errMsg(e))); load(); }}>bekor</button>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-500">Havola 30 kun amal qiladi. Jamoa a’zolari bug statusini boshqaradi; bug yozish va izoh uchun jamoa a’zosi bo‘lish shart emas.</p>
          </div>
        ) : <p className="text-xs text-zinc-500">Jamoani faqat loyiha adminlari boshqaradi.</p>}
        {error && <ErrorBox message={error} />}
        <button className={`${btnGhost} w-full`} onClick={onClose}>Yopish</button>
      </div>
    </Modal>
  );
}
