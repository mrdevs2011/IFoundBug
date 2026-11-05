'use client';
// GitHub/Primer-style building blocks (octicon-shaped glyphs are MIT-licensed shapes).
import React from 'react';
import Link from 'next/link';
import type { Bug, BugStatus, Priority, Project, Severity } from '@/types';
import { DONE_STATUSES, SEVERITY_LABEL, STATUS_LABEL } from '@/lib/constants';
import { trustedAvatar } from '@/lib/avatar';

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
export const GraphIcon = (p: SvgProps) => <Oct {...p} paths={['M1.5 1.75V13.5h13.75a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1-.75-.75V1.75a.75.75 0 0 1 1.5 0Zm14.28 2.53-5.25 5.25a.75.75 0 0 1-1.06 0L7 7.06 4.28 9.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.25-3.25a.75.75 0 0 1 1.06 0L10 7.94l4.72-4.72a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z']} />;
export const GearIcon = (p: SvgProps) => <Oct {...p} paths={['M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z']} />;
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
export function Avatar({ name, size = 20, src }: { name: string; size?: number; src?: string | null }) {
  const n = name || '?';
  const safe = trustedAvatar(src);
  if (safe) return <img src={safe} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (
    <span aria-hidden="true" className="inline-grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.45), background: AVATAR_BG[h % AVATAR_BG.length] }}>
      {n.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Repository header: breadcrumb + visibility badge + underline tab nav (GitHub repo chrome). */
export function RepoHeader({ project, active, openCount, actions, showSettings }: {
  project: Pick<Project, 'name' | 'slug' | 'is_public'> & { description?: string | null };
  active: 'issues' | 'people' | 'insights' | 'settings';
  showSettings?: boolean;
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
          <Link href={`/p/${project.slug}/insights`} aria-current={active === 'insights' ? 'page' : undefined}
            className={`flex items-center gap-2 border-b-2 px-2 pb-2 pt-1 ${active === 'insights' ? 'border-[#f78166] font-semibold text-[#e6edf3]' : 'border-transparent text-[#e6edf3] hover:border-[#6e7681]'}`}>
            <GraphIcon className="text-[#8b949e]" />Insights
          </Link>
          {(showSettings || active === 'settings') && (
            <Link href={`/p/${project.slug}/settings`} aria-current={active === 'settings' ? 'page' : undefined}
              className={`flex items-center gap-2 border-b-2 px-2 pb-2 pt-1 ${active === 'settings' ? 'border-[#f78166] font-semibold text-[#e6edf3]' : 'border-transparent text-[#e6edf3] hover:border-[#6e7681]'}`}>
              <GearIcon className="text-[#8b949e]" />Settings
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}

export const ghBtn = 'inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[#3d444d] bg-[#212830] px-3 text-sm font-medium text-[#f0f6fc] transition-colors hover:border-[#3d444d] hover:bg-[#262c36] disabled:cursor-not-allowed disabled:opacity-50';
export const ghBtnPrimary = 'inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-[rgba(240,246,252,0.1)] bg-[#238636] px-3 text-sm font-medium text-white transition-colors hover:bg-[#29903b] disabled:cursor-not-allowed disabled:opacity-50';
export const ghInput = 'h-8 w-full rounded-md border border-[#3d444d] bg-[#0d1117] px-3 text-sm text-[#f0f6fc] placeholder-[#9198a1] outline-none focus:border-[#1f6feb] focus:shadow-[inset_0_0_0_1px_#1f6feb]';
