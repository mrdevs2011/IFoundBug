'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Nav, LoginHint } from '@/components/Nav';
import { Empty, ErrorBox, Modal, Spinner } from '@/components/ui';
import { ghBtn, ghBtnPrimary, ghInput, PersonIcon, RepoIcon } from '@/components/gh';
import { createOrg, errMsg, myOrgs, type OrgSummary } from '@/lib/db';
import { useMe } from '@/lib/useMe';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

function NewOrgModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [touched, setTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const effectiveSlug = touched ? slug : slugify(name);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const s = await createOrg(name.trim(), effectiveSlug, description.trim()); router.push(`/orgs/${s}`); }
    catch (err) { setError(errMsg(err)); setBusy(false); }
  };
  return (
    <Modal title="Create an organization" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="org-name" className="mb-1 block text-sm font-semibold text-[#f0f6fc]">Organization name</label><input id="org-name" className={ghInput} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} placeholder="Acme Inc" autoFocus /></div>
        <div><label htmlFor="org-slug" className="mb-1 block text-sm font-semibold text-[#f0f6fc]">URL name</label><input id="org-slug" className={`${ghInput} font-mono`} value={effectiveSlug} maxLength={40} onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }} placeholder="acme" /><p className="mt-1 text-xs text-[#9198a1]">ifoundbug/orgs/{effectiveSlug || 'name'}</p></div>
        <div><label htmlFor="org-desc" className="mb-1 block text-sm font-semibold text-[#f0f6fc]">Description <span className="font-normal text-[#9198a1]">(optional)</span></label><input id="org-desc" className={ghInput} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} /></div>
        {error && <ErrorBox message={error} />}
        <div className="flex justify-end gap-2"><button type="button" className={ghBtn} onClick={onClose}>Cancel</button><button className={ghBtnPrimary} disabled={busy || !name.trim() || effectiveSlug.length < 3}>{busy ? 'Creating…' : 'Create organization'}</button></div>
      </form>
    </Modal>
  );
}

export default function OrgsPage() {
  const me = useMe();
  const [orgs, setOrgs] = useState<OrgSummary[] | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    if (!me) return;
    let alive = true;
    myOrgs().then((o) => { if (alive) setOrgs(o); }).catch((e) => { if (alive) setError(errMsg(e)); });
    return () => { alive = false; };
  }, [me]);
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-[1012px] flex-1 px-4 py-6 md:px-6">
        <div className="mb-4 flex items-center justify-between border-b border-[#3d444d] pb-3">
          <div><h1 className="text-2xl font-normal text-[#f0f6fc]">Organizations</h1><p className="mt-1 text-sm text-[#9198a1]">Group repositories and give a whole team access at once.</p></div>
          {me && <button className={ghBtnPrimary} onClick={() => setCreating(true)}>New organization</button>}
        </div>
        {me === null && <LoginHint what="Manage organizations" />}
        {error && <ErrorBox message={error} />}
        {me && !orgs && !error && <Spinner />}
        {orgs && orgs.length === 0 && <Empty title="You are not in any organization yet" hint="Create one, add your teammates, then move repositories into it. Everyone in the organization gets access automatically." />}
        {orgs && orgs.length > 0 && (
          <ul className="overflow-hidden rounded-md border border-[#3d444d]">
            {orgs.map((o) => (
              <li key={o.id} className="flex items-center gap-4 border-b border-[#3d444d] px-4 py-3 last:border-b-0 hover:bg-[#151b23]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-[#3d444d] bg-[#151b23] text-lg font-semibold text-[#f0f6fc]">{o.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/orgs/${o.slug}`} className="font-semibold text-[#f0f6fc] hover:text-[#4493f8]">{o.name}</Link>
                  {o.description && <p className="truncate text-sm text-[#9198a1]">{o.description}</p>}
                </div>
                <span className="hidden items-center gap-1 text-xs text-[#9198a1] sm:flex"><RepoIcon />{o.repositories}</span>
                <span className="hidden items-center gap-1 text-xs text-[#9198a1] sm:flex"><PersonIcon />{o.members}</span>
                <span className="rounded-full border border-[#3d444d] px-2 text-xs leading-[18px] text-[#9198a1]">{o.role}</span>
              </li>
            ))}
          </ul>
        )}
      </main>
      {creating && <NewOrgModal onClose={() => setCreating(false)} />}
    </>
  );
}
