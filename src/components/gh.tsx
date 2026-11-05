'use client';
// GitHub/Primer-style building blocks (octicon-shaped glyphs are MIT-licensed shapes).
import React from 'react';
import Link from 'next/link';
import type { Bug, BugStatus, Priority, Project, Severity } from '@/types';
import { DONE_STATUSES, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/constants';

type SvgProps = React.SVGProps<SVGSVGElement>;
const Oct = ({ paths, ...p }: SvgProps & { paths: string[] }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" {...p}>{paths.map((x) => <path key={x} d={x} />)}</svg>
);
export const IssueOpenedIcon = (p: SvgProps) => <Oct {...p} paths={['M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z', 'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z']} />;
export const IssueClosedIcon = (p: SvgProps) => <Oct {...p} paths={['M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z', 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z']} />;
export const SkipIcon = (p: SvgProps) => <Oct {...p} paths={['M11.28 4.72a.75.75 0 0 1 0 1.06l-5.5 5.5a.75.75 0 0 1-1.06-1.06l5.5-5.5a.75.75 0 0 1 1.06 0Z', 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z']} />;
export const RepoIcon = (p: SvgProps) => <Oct {...p} paths={['M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z']} />;
export const CommentIcon = (p: SvgProps) => <Oct {...p} paths={['M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z']} />;
export const PersonIcon = (p: SvgProps) => <Oct {...p} paths={['M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z']} />;
export const LockIcon = (p: SvgProps) => <Oct {...p} paths={['M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z']} />;

export const isClosed = (s: BugStatus) => DONE_STATUSES.includes(s);
export const notPlanned = (s: BugStatus) => s === 'WONT_FIX';

export function IssueStateIcon({ status, className = '' }: { status: BugStatus; className?: string }) {
  if (notPlanned(status)) return <SkipIcon className={`shrink-0 text-[#8b949e] ${className}`} aria-label="Closed as not planned" />;
  if (isClosed(status)) return <IssueClosedIcon className={`shrink-0 text-[#ab7df8] ${className}`} aria-label="Closed" />;
  return <IssueOpenedIcon className={`shrink-0 text-[#3fb950] ${className}`} aria-label="Open" />;
}

/** Big rounded state pill shown under an issue title. */
export function IssueStatePill({ status }: { status: BugStatus }) {
  const closed = isClosed(status);
  const np = notPlanned(status);
  const cls = np ? 'bg-[#6e7681]' : closed ? 'bg-[#8957e5]' : 'bg-[#238636]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-[5px] text-sm font-medium text-white ${cls}`}>
      <IssueStateIcon status={status} className="!text-white" />{np ? 'Closed as not planned' : closed ? 'Closed' : 'Open'}
    </span>
  );
}

// GitHub label: tinted background, coloured border and text (dark theme formula).
const LABEL_RGB: Record<string, [number, number, number]> = {
  CRITICAL: [248, 81, 73], HIGH: [219, 109, 40], MEDIUM: [210, 153, 34], LOW: [139, 148, 158],
  P0: [248, 81, 73], P1: [219, 109, 40], P2: [88, 166, 255], P3: [139, 148, 158],
  TRIAGED: [163, 113, 247], IN_PROGRESS: [210, 153, 34], READY_FOR_QA: [88, 166, 255], VERIFIED: [63, 185, 80], FIXED: [63, 185, 80],
};
export function Label({ tone, children, title }: { tone: string; children: React.ReactNode; title?: string }) {
  const [r, g, b] = LABEL_RGB[tone] ?? [139, 148, 158];
  return (
    <span title={title} className="inline-flex items-center whitespace-nowrap rounded-full border px-[7px] text-xs font-medium leading-[18px]"
      style={{ background: `rgba(${r},${g},${b},0.18)`, color: `rgb(${Math.min(255, r + 40)},${Math.min(255, g + 40)},${Math.min(255, b + 40)})`, borderColor: `rgba(${r},${g},${b},0.4)` }}>
      {children}
    </span>
  );
}
export const SeverityLabel = ({ severity }: { severity: Severity }) => <Label tone={severity} title="Severity">{SEVERITY_LABEL[severity].toLowerCase()}</Label>;
export const PriorityLabel = ({ priority }: { priority: Priority }) => <Label tone={priority} title="Priority">{priority}</Label>;
export const StatusLabel = ({ status }: { status: BugStatus }) => (status === 'REPORTED' || status === 'CLOSED' || status === 'WONT_FIX') ? null : <Label tone={status} title="Status">{STATUS_LABEL[status].toLowerCase()}</Label>;

export function IssueLabels({ bug }: { bug: Pick<Bug, 'severity' | 'priority' | 'status'> }) {
  return <><SeverityLabel severity={bug.severity} />{bug.priority && <PriorityLabel priority={bug.priority} />}<StatusLabel status={bug.status} /></>;
}

const AVATAR_BG = ['#1f6feb', '#8957e5', '#238636', '#bf4b8a', '#9e6a03', '#db6d28', '#0e8a9c'];
export function Avatar({ name, size = 20 }: { name: string; size?: number }) {
  const n = name || '?';
  let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span aria-hidden="true" className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.45), background: AVATAR_BG[h % AVATAR_BG.length] }}>
      {n.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Repository header: breadcrumb + visibility badge + underline tab nav (GitHub repo chrome). */
export function RepoHeader({ project, active, openCount, actions }: {
  project: Pick<Project, 'name' | 'slug' | 'is_public'> & { description?: string | null };
  active: 'issues' | 'people';
  openCount?: number;
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#30363d] bg-[#010409]">
      <div className="mx-auto max-w-[1280px] px-4 pt-4 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-xl">
            <RepoIcon className="text-[#8b949e]" />
            <Link href={`/p/${project.slug}`} className="truncate font-semibold text-[#e6edf3] hover:underline">{project.name}</Link>
            <span className="rounded-full border border-[#30363d] px-[7px] text-xs font-medium leading-[18px] text-[#8b949e]">{project.is_public ? 'Public' : 'Private'}</span>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        <nav className="-mb-px mt-4 flex gap-2 overflow-x-auto text-sm" aria-label="Repository">
          <Link href={`/p/${project.slug}`} aria-current={active === 'issues' ? 'page' : undefined}
            className={`flex items-center gap-2 border-b-2 px-2 pb-2 pt-1 ${active === 'issues' ? 'border-[#f78166] font-semibold text-[#e6edf3]' : 'border-transparent text-[#e6edf3] hover:border-[#6e7681]'}`}>
            <IssueOpenedIcon className="text-[#8b949e]" />Issues
            {typeof openCount === 'number' && <span className="rounded-full bg-[#6e7681]/40 px-1.5 text-xs font-medium leading-[18px]">{openCount}</span>}
          </Link>
        </nav>
      </div>
    </div>
  );
}

export const ghBtn = 'inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium text-[#f0f6fc] transition-colors hover:border-[#3d444d] hover:bg-[#262c36] disabled:cursor-not-allowed disabled:opacity-50';
export const ghBtnPrimary = 'inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[rgba(240,246,252,0.1)] bg-[#238636] px-3 text-sm font-medium text-white transition-colors hover:bg-[#29903b] disabled:cursor-not-allowed disabled:opacity-50';
export const ghInput = 'h-8 w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 text-sm text-[#f0f6fc] placeholder-[#9198a1] outline-none focus:border-[#1f6feb] focus:shadow-[inset_0_0_0_1px_#1f6feb]';
