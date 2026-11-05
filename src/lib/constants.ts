import type { BugStatus, Severity, Environment } from '@/types';

export const STATUS_LABEL: Record<BugStatus, string> = {
  REPORTED: 'Yangi',
  TRIAGED: 'Ko‘rib chiqilgan',
  IN_PROGRESS: 'Ishlanmoqda',
  READY_FOR_QA: 'Tekshiruvga tayyor',
  VERIFIED: 'Tasdiqlangan',
  FIXED: 'Tuzatilgan',
  CLOSED: 'Yopilgan',
  WONT_FIX: 'Tuzatilmaydi',
};
export const STATUS_ORDER = Object.keys(STATUS_LABEL) as BugStatus[];
export const DONE_STATUSES: BugStatus[] = ['FIXED', 'CLOSED', 'WONT_FIX', 'VERIFIED'];

export const STATUS_STYLE: Record<BugStatus, string> = {
  REPORTED: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  TRIAGED: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  READY_FOR_QA: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  VERIFIED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  FIXED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  CLOSED: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  WONT_FIX: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: 'Kritik', HIGH: 'Yuqori', MEDIUM: 'O‘rta', LOW: 'Past',
};
export const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
export const SEVERITY_DOT: Record<Severity, string> = {
  CRITICAL: 'bg-red-500', HIGH: 'bg-orange-400', MEDIUM: 'bg-yellow-400', LOW: 'bg-zinc-500',
};
export const SEVERITY_STYLE: Record<Severity, string> = {
  CRITICAL: 'bg-red-500/10 text-red-300 border-red-500/20',
  HIGH: 'bg-orange-500/10 text-orange-300 border-orange-500/20',
  MEDIUM: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  LOW: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export const ENV_LABEL: Record<Environment, string> = {
  PRODUCTION: 'Production', STAGING: 'Staging', DEVELOPMENT: 'Development', LOCAL: 'Local',
};

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'hozirgina';
  const m = Math.floor(s / 60); if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24); if (d < 30) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString('uz-UZ');
}
