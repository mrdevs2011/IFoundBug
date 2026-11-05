'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { BugView } from '@/components/BugView';
import { Empty, ErrorBox, Spinner, btnGhost } from '@/components/ui';
import { errMsg, getAvatars, getBug, getProject, listComments, myRole } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import type { Bug, BugComment, Project } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { RepoHeader } from '@/components/gh';

export default function BugPage() {
  const { slug, code } = useParams<{ slug: string; code: string }>();
  const me = useMe();
  const [project, setProject] = useState<Project | null>(null);
  const [bug, setBug] = useState<Bug | null>(null);
  const [comments, setComments] = useState<BugComment[]>([]);
  const [roleState, setRoleState] = useState<{ key: string; role: string | null } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [error, setError] = useState('');
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const avatarKey = [bug?.reported_by, ...comments.map((c) => c.author_id)].filter(Boolean).sort().join(',');
  useEffect(() => {
    if (!avatarKey) return;
    let alive = true;
    getAvatars(avatarKey.split(',')).then((map) => { if (alive) setAvatars(map); }).catch(() => {});
    return () => { alive = false; };
  }, [avatarKey]);

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

  const realtimeBugId = bug?.id;
  const realtimeProjectId = bug?.project_id;
  const realtimeBugCode = bug?.code;
  useEffect(() => {
    if (!realtimeBugId || !realtimeProjectId || !realtimeBugCode || !supabase) return;
    const client = supabase;
    let active = true;
    const refresh = async () => {
      try {
        const [nextBug, nextComments] = await Promise.all([getBug(realtimeProjectId, realtimeBugCode), listComments(realtimeBugId)]);
        if (active) { if (nextBug) setBug(nextBug); setComments(nextComments); }
      } catch (reason) { if (active) setError(errMsg(reason)); }
    };
    const channel = client.channel(`ifb-issue-${realtimeBugId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bugs', filter: `id=eq.${realtimeBugId}` }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ifb_bug_comments', filter: `bug_id=eq.${realtimeBugId}` }, refresh)
      .subscribe((status) => { if (status === 'SUBSCRIBED') void refresh(); });
    return () => { active = false; void client.removeChannel(channel); };
  }, [realtimeBugId, realtimeProjectId, realtimeBugCode]);

  return (
    <>
      <Nav />
      {state === 'ready' && project && <RepoHeader project={project} active="issues" />}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 lg:px-8">
        {state === 'loading' && <Spinner label="Loading…" />}
        {state === 'missing' && (
          <Empty title="Issue not found" hint="This URL may be invalid, the issue may have been deleted, or it may require a private link.">
            <Link href={`/p/${slug}`} className={btnGhost}>Back to repository</Link>
          </Empty>
        )}
        {error && <ErrorBox message={error} />}
        {state === 'ready' && project && bug && (
          <>
            <BugView project={project} bug={bug} comments={comments} me={me} role={role} onBug={setBug} onComments={setComments} avatars={avatars} />
          </>
        )}
      </main>
    </>
  );
}
