'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { BugView } from '@/components/BugView';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { errMsg, getSharedBug, type SharedBug } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import type { Bug, BugComment } from '@/types';
import { supabase } from '@/lib/supabase/client';

/** Secret-link bug view: works logged out, never exposes the project's other bugs. */
export default function SharedBugPage() {
  const { token } = useParams<{ token: string }>();
  const me = useMe();
  const [data, setData] = useState<SharedBug | null | undefined>(undefined);
  const [bug, setBug] = useState<Bug | null>(null);
  const [comments, setComments] = useState<BugComment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = () => getSharedBug(token).then((d) => {
      if (!alive) return;
      setData(d);
      if (d) { setBug((prev) => prev ?? d.bug); setComments(d.comments ?? []); }
    }).catch((e) => { if (alive) { setError(errMsg(e)); setData(null); } });
    void load();
    return () => { alive = false; };
  }, [token]);

  const sharedBugId = data?.bug.id;
  useEffect(() => {
    if (!sharedBugId || !supabase) return;
    const client = supabase;
    const channel = client.channel(`ifb-shared-${sharedBugId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bugs', filter: `id=eq.${sharedBugId}` }, () => {
        void getSharedBug(token).then((next) => { if (next) { setData(next); setBug(next.bug); setComments(next.comments ?? []); } }).catch((reason) => setError(errMsg(reason)));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bug_comments', filter: `bug_id=eq.${sharedBugId}` }, () => {
        void getSharedBug(token).then((next) => { if (next) { setData(next); setBug(next.bug); setComments(next.comments ?? []); } }).catch((reason) => setError(errMsg(reason)));
      })
      .subscribe();
    return () => { void client.removeChannel(channel); };
  }, [sharedBugId, token]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {data === undefined && <Spinner label="Loading…" />}
        {data === null && <Empty title="Invalid link" hint="The issue owner may have regenerated or revoked this link." />}
        {error && <ErrorBox message={error} />}
        {data && bug && (
          <>
            <p className="mb-4 text-xs text-[#9198a1]">Private issue in {data.project.name}</p>
            <BugView project={data.project} bug={bug} comments={comments} me={me} role={null} token={token} onBug={setBug} onComments={setComments} />
          </>
        )}
      </main>
    </>
  );
}
