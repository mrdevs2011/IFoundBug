'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { Avatar, LockIcon, RepoIcon, ghBtn, ghBtnPrimary, ghInput } from '@/components/gh';
import { addOrgMember, deleteOrg, errMsg, listProjects, orgOverview, removeOrgMember, setOrgRole, setProjectOrg, type OrgOverview, type OrgRole, type ProjectCard } from '@/lib/db';
import { useMe } from '@/lib/useMe';

export default function OrgPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const me = useMe();
  const [org, setOrg] = useState<OrgOverview | null | undefined>(undefined);
  const [mine, setMine] = useState<ProjectCard[]>([]);
  const [tab, setTab] = useState<'repos' | 'people'>('repos');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<OrgRole>('member');
  const [moveId, setMoveId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!me) return;
    let alive = true;
    orgOverview(slug).then((o) => { if (alive) setOrg(o); }).catch((e) => { if (alive) { setOrg(null); setError(errMsg(e)); } });
    listProjects().then((p) => { if (alive) setMine(p); }).catch(() => {});
    return () => { alive = false; };
  }, [slug, me, reload]);

  const act = async (fn: () => Promise<unknown>) => { setBusy(true); setError(''); try { await fn(); setReload((n) => n + 1); return true; } catch (e) { setError(errMsg(e)); return false; } finally { setBusy(false); } };
  const admin = org?.my_role === 'owner' || org?.my_role === 'admin';
  const movable = mine.filter((p) => !org?.repositories.some((r) => r.id === p.id));

  return (
    <>
      <Nav />
      {org && (
        <div className="border-b border-[#3d444d] bg-[#010409]">
          <div className="mx-auto max-w-[1280px] px-4 pt-6 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-md border border-[#3d444d] bg-[#151b23] text-xl font-semibold text-[#f0f6fc]">{org.name.slice(0, 1).toUpperCase()}</span>
              <div><h1 className="text-2xl font-semibold text-[#f0f6fc]">{org.name}</h1>{org.description && <p className="text-sm text-[#9198a1]">{org.description}</p>}</div>
            </div>
            <nav className="-mb-px mt-4 flex gap-2 text-sm" aria-label="Organization">
              {([['repos', `Repositories ${org.repositories.length}`], ['people', `People ${org.members.length}`]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} aria-current={tab === k ? 'page' : undefined} className={`border-b-2 px-2 pb-2 pt-1 ${tab === k ? 'border-[#f78166] font-semibold text-[#e6edf3]' : 'border-transparent text-[#e6edf3] hover:border-[#6e7681]'}`}>{l}</button>
              ))}
            </nav>
          </div>
        </div>
      )}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 lg:px-8">
        {error && <div className="mb-4"><ErrorBox message={error} /></div>}
        {(org === undefined && me !== null) && <Spinner />}
        {(org === null || me === null) && <Empty title="Organization not found" hint="It may not exist, or you are not a member." />}
        {org && tab === 'repos' && (
          <section className="space-y-4">
            {admin && movable.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#3d444d] p-3">
                <span className="text-sm text-[#9198a1]">Move a repository into {org.name}:</span>
                <select className={`${ghInput} !w-auto`} value={moveId} onChange={(e) => setMoveId(e.target.value)} aria-label="Repository to move"><option value="">Choose…</option>{movable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                <button className={ghBtnPrimary} disabled={!moveId || busy} onClick={async () => { if (await act(() => setProjectOrg(moveId, org.id))) setMoveId(''); }}>Move</button>
                <span className="w-full text-xs text-[#9198a1]">Every organization member gets access: owners/admins as repository admins, members as developers. Existing roles stay as they are.</span>
              </div>
            )}
            {org.repositories.length === 0 ? <Empty title="No repositories yet" hint={admin ? 'Move one of your repositories here.' : 'An admin can move repositories into this organization.'} /> : (
              <ul className="overflow-hidden rounded-md border border-[#3d444d]">
                {org.repositories.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 border-b border-[#3d444d] px-4 py-3 last:border-b-0">
                    <RepoIcon className="text-[#9198a1]" />
                    <Link href={`/p/${r.slug}`} className="min-w-0 flex-1 truncate font-semibold text-[#4493f8] hover:underline">{r.name}</Link>
                    {!r.is_public && <span className="flex items-center gap-1 text-xs text-[#9198a1]"><LockIcon className="h-3 w-3" />Private</span>}
                    <span className="text-xs text-[#9198a1]">{r.open} open</span>
                    {admin && <button className={ghBtn} disabled={busy} onClick={() => { if (confirm(`Remove ${r.name} from ${org.name}? People who only had access through the organization will lose access.`)) void act(() => setProjectOrg(r.id, null)); }}>Remove</button>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        {org && tab === 'people' && (
          <section className="space-y-4">
            {admin && (
              <form className="flex flex-wrap items-center gap-2 rounded-md border border-[#3d444d] p-3" onSubmit={async (e) => { e.preventDefault(); if (await act(() => addOrgMember(org.id, username, role))) setUsername(''); }}>
                <input className={`${ghInput} !w-56`} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" aria-label="Username" />
                <select className={`${ghInput} !w-auto`} value={role} onChange={(e) => setRole(e.target.value as OrgRole)} aria-label="Role"><option value="member">Member</option><option value="admin">Admin</option>{org.my_role === 'owner' && <option value="owner">Owner</option>}</select>
                <button className={ghBtnPrimary} disabled={busy || !username.trim()}>Add member</button>
              </form>
            )}
            <ul className="overflow-hidden rounded-md border border-[#3d444d]">
              {org.members.map((m) => {
                const self = me && m.id === me.id;
                const canEdit = admin && !self && (m.role !== 'owner' || org.my_role === 'owner');
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 border-b border-[#3d444d] px-4 py-2.5 last:border-b-0">
                    <Avatar name={m.full_name} src={m.avatar_url} size={32} />
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold text-[#f0f6fc]">{m.full_name}{self && <span className="ml-1 font-normal text-[#9198a1]">(you)</span>}</p><p className="text-xs text-[#9198a1]">@{m.username}</p></div>
                    {canEdit ? (
                      <select className={`${ghInput} !w-auto`} value={m.role} disabled={busy} onChange={(e) => void act(() => setOrgRole(org.id, m.id, e.target.value as OrgRole))} aria-label={`Role of ${m.username}`}>
                        <option value="member">Member</option><option value="admin">Admin</option>{org.my_role === 'owner' && <option value="owner">Owner</option>}
                      </select>
                    ) : <span className="rounded-full border border-[#3d444d] px-2 text-xs leading-[18px] text-[#9198a1]">{m.role}</span>}
                    {(canEdit || self) && <button className={`${ghBtn} !text-[#f85149]`} disabled={busy} onClick={() => { if (confirm(self ? `Leave ${org.name}?` : `Remove @${m.username} from ${org.name}?`)) void act(() => removeOrgMember(org.id, m.id)).then((ok) => { if (ok && self) router.push('/orgs'); }); }}>{self ? 'Leave' : 'Remove'}</button>}
                  </li>
                );
              })}
            </ul>
            {org.my_role === 'owner' && (
              <div className="rounded-md border border-[#f85149]/40 p-4">
                <h2 className="text-sm font-semibold text-[#f0f6fc]">Delete organization</h2>
                <p className="mt-1 text-xs text-[#9198a1]">Repositories are kept and stay with their owners. Access that came only from this organization is removed.</p>
                <button className={`${ghBtn} mt-3 !text-[#f85149]`} disabled={busy} onClick={() => { if (prompt(`Type ${org.slug} to delete this organization`) === org.slug) void act(() => deleteOrg(org.id)).then((ok) => { if (ok) router.push('/orgs'); }); }}>Delete this organization</button>
              </div>
            )}
          </section>
        )}
      </main>
    </>
  );
}
