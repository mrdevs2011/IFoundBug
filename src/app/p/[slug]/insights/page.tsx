'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Empty, ErrorBox, Spinner, btnGhost } from '@/components/ui';
import { Avatar, RepoHeader } from '@/components/gh';
import { errMsg, getProject } from '@/lib/db';
import { supabase } from '@/lib/supabase/client';
import { timeAgo } from '@/lib/constants';
import { formatHours, type Insights } from '@/lib/insights';
import { SeverityBars, Tile, WeeklyChart } from '@/components/InsightsCharts';
import type { Project } from '@/types';

export default function InsightsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await getProject(slug);
        if (!alive) return;
        setProject(p);
        if (!p || !supabase) return;
        const { data: result, error: rpcError } = await supabase.rpc('ifb_project_insights', { p_project: p.id });
        if (rpcError) throw rpcError;
        if (alive) setData(result as Insights);
      } catch (e) { if (alive) setError(errMsg(e)); }
    })();
    return () => { alive = false; };
  }, [slug]);

  if (project === undefined && !error) return <><Nav /><Spinner label="Loading…" /></>;
  if (project === null) return <><Nav /><main className="mx-auto max-w-5xl flex-1 px-4 py-10"><Empty title="Repository not found"><Link href="/" className={btnGhost}>Home</Link></Empty></main></>;
  const ttc = data?.time_to_close_hours;
  return (
    <>
      <Nav />
      {project && <RepoHeader project={project} active="insights" openCount={data?.totals.open} />}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 md:px-6 lg:px-8">
        {error && <ErrorBox message={error} />}
        {!data && !error && <Spinner />}
        {data && (
          <div className="space-y-6">
            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary">
              <Tile label="Open issues" value={String(data.totals.open)} hint={`${data.unassigned_open} unassigned`} />
              <Tile label="Closed in 30 days" value={String(data.totals.closed_30d)} hint={`${data.totals.created_30d} opened in 30 days`} />
              <Tile label="Median time to close" value={formatHours(ttc?.median)} hint={ttc?.samples ? `average ${formatHours(ttc.average)} · ${ttc.samples} issues, 90 days` : 'no issues closed in 90 days'} />
              <Tile label="Slowest 10% close after" value={formatHours(ttc?.p90)} hint="90th percentile, 90 days" />
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <section className="rounded-md border border-[#3d444d] p-4">
                <h2 className="mb-3 text-base font-semibold text-[#f0f6fc]">Created vs closed per week</h2>
                <WeeklyChart weeks={data.weekly} />
              </section>
              <section className="rounded-md border border-[#3d444d] p-4">
                <h2 className="mb-3 text-base font-semibold text-[#f0f6fc]">Open issues by severity</h2>
                <SeverityBars data={data.open_by_severity} />
              </section>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="overflow-hidden rounded-md border border-[#3d444d]">
                <h2 className="border-b border-[#3d444d] bg-[#151b23] px-4 py-3 text-sm font-semibold text-[#f0f6fc]">Team</h2>
                {data.assignees.length === 0 ? <p className="px-4 py-6 text-sm text-[#9198a1]">No assigned issues yet. Assign issues to see per-person workload and speed.</p> : (
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-[#9198a1]"><th className="px-4 py-2 font-medium">Person</th><th className="px-4 py-2 text-right font-medium">Open</th><th className="px-4 py-2 text-right font-medium">Closed 30d</th><th className="px-4 py-2 text-right font-medium">Avg close</th></tr></thead>
                    <tbody>{data.assignees.map((a) => (
                      <tr key={a.id} className="border-t border-[#3d444d]">
                        <td className="px-4 py-2"><span className="flex items-center gap-2 text-[#f0f6fc]"><Avatar name={a.full_name} size={20} />{a.full_name}<span className="text-xs text-[#9198a1]">@{a.username}</span></span></td>
                        <td className="px-4 py-2 text-right tabular-nums text-[#f0f6fc]">{a.open}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-[#f0f6fc]">{a.closed_30d}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-[#9198a1]">{formatHours(a.avg_close_hours)}</td>
                      </tr>))}</tbody>
                  </table>
                )}
              </section>
              <section className="overflow-hidden rounded-md border border-[#3d444d]">
                <h2 className="border-b border-[#3d444d] bg-[#151b23] px-4 py-3 text-sm font-semibold text-[#f0f6fc]">Oldest open issues</h2>
                {data.oldest_open.length === 0 ? <p className="px-4 py-6 text-sm text-[#9198a1]">No open issues. 🎉</p> : (
                  <ul>{data.oldest_open.map((o) => (
                    <li key={o.code} className="flex items-center justify-between gap-3 border-t border-[#3d444d] px-4 py-2 text-sm first:border-t-0">
                      <Link href={`/p/${slug}/b/${o.code}`} className="min-w-0 truncate font-semibold text-[#f0f6fc] hover:text-[#4493f8]">{o.title}</Link>
                      <span className="shrink-0 text-xs text-[#9198a1]">{o.code} · {timeAgo(o.created_at)}</span>
                    </li>))}</ul>
                )}
              </section>
            </div>
            <p className="text-xs text-[#9198a1]">Closed = Verified, Fixed, Closed or Won&apos;t fix. Updated {timeAgo(data.generated_at)}.</p>
          </div>
        )}
      </main>
    </>
  );
}
