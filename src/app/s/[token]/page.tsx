'use client';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { BugView } from '@/components/BugView';
import { Empty, ErrorBox, Spinner } from '@/components/ui';
import { errMsg, getSharedBug, type SharedBug } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import type { Bug, BugComment } from '@/types';

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
    const id = setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 20000);
    return () => { alive = false; clearInterval(id); };
  }, [token]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {data === undefined && <Spinner label="Yuklanmoqda…" />}
        {data === null && <Empty title="Havola yaroqsiz" hint="Bug egasi havolani yangilagan yoki o‘chirgan bo‘lishi mumkin." />}
        {error && <ErrorBox message={error} />}
        {data && bug && (
          <>
            <p className="mb-4 text-xs text-zinc-500">{data.project.name} loyihasidagi maxfiy bug</p>
            <BugView project={data.project} bug={bug} comments={comments} me={me} role={null} token={token} onBug={setBug} onComments={setComments} />
          </>
        )}
      </main>
    </>
  );
}
