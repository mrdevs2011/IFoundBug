'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Nav, LoginHint } from '@/components/Nav';
import { Empty, ErrorBox, Spinner, btnPrimary } from '@/components/ui';
import { acceptInvite, errMsg, previewInvite } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import type { Project } from '@/types';

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const me = useMe();
  const [invite, setInvite] = useState<{ role: string; project: Project } | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { previewInvite(token).then(setInvite).catch((e) => { setError(errMsg(e)); setInvite(null); }); }, [token]);

  const join = async () => {
    setBusy(true); setError('');
    try { router.push(`/p/${await acceptInvite(token)}`); } catch (e) { setError(errMsg(e)); setBusy(false); }
  };

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-14">
        {invite === undefined && <Spinner label="Checking invitation…" />}
        {invite === null && <Empty title="Invalid invitation" hint="This invitation may have expired or been revoked." />}
        {invite && (
          <div className="space-y-4 rounded-2xl border border-white/10 bg-[#101312] p-6 text-center">
            <p className="text-xs text-[#9198a1]">You have been invited to join</p>
            <h1 className="text-2xl font-semibold text-[#f0f6fc]">{invite.project.name}</h1>
            <p className="text-sm text-[#9198a1]">Role: <b className="text-[#f0f6fc]">{invite.role}</b></p>
            {me ? <button className={`${btnPrimary} w-full`} onClick={join} disabled={busy}>{busy ? 'Joining…' : 'Join repository'}</button> : me === null ? <LoginHint what="join this repository" /> : null}
            {error && <ErrorBox message={error} />}
          </div>
        )}
      </main>
    </>
  );
}
