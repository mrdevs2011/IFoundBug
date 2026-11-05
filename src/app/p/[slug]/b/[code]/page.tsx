'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { BugView } from '@/components/BugView';
import { Empty, ErrorBox, Spinner, btnGhost } from '@/components/ui';
import { errMsg, getBug, getProject, listComments, myRole } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import type { Bug, BugComment, Project } from '@/types';

export default function BugPage() {
  const { slug, code } = useParams<{ slug: string; code: string }>();
  const me = useMe();
  const [project, setProject] = useState<Project | null>(null);
  const [bug, setBug] = useState<Bug | null>(null);
  const [comments, setComments] = useState<BugComment[]>([]);
  const [roleState, setRoleState] = useState<{ key: string; role: string | null } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProject(slug);
        const b = p ? await getBug(p.id, code) : null;
        if (!alive) return;
        if (!p || !b) { setState('missing'); return; }
        setProject(p); setBug(b); setState('ready');
        const c = await listComments(b.id);
        if (alive) setComments(c);
      } catch (e) { if (alive) { setError(errMsg(e)); setState('missing'); } }
    })();
    return () => { alive = false; };
  }, [slug, code, me?.id]);

  useEffect(() => {
    if (!project || !me) return;
    let alive = true;
    const key = `${project.id}:${me.id}`;
    myRole(project.id, me.id).then((r) => { if (alive) setRoleState({ key, role: r }); }).catch(() => {});
    return () => { alive = false; };
  }, [project, me]);
  const role = project && me && roleState?.key === `${project.id}:${me.id}` ? roleState.role : null;

  // Light polling instead of a websocket: simple, no connection errors.
  useEffect(() => {
    if (!bug) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') listComments(bug.id).then(setComments).catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, [bug?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {state === 'loading' && <Spinner label="Yuklanmoqda…" />}
        {state === 'missing' && (
          <Empty title="Bug topilmadi" hint="Havola noto‘g‘ri, bug o‘chirilgan yoki u faqat maxfiy havola orqali ochiladi.">
            <Link href={`/p/${slug}`} className={btnGhost}>Loyihaga qaytish</Link>
          </Empty>
        )}
        {error && <ErrorBox message={error} />}
        {state === 'ready' && project && bug && (
          <>
            <Link href={`/p/${project.slug}`} className="mb-4 inline-block text-xs text-zinc-500 hover:text-zinc-300">← {project.name}</Link>
            <BugView project={project} bug={bug} comments={comments} me={me} role={role} onBug={setBug} onComments={setComments} />
          </>
        )}
      </main>
    </>
  );
}
