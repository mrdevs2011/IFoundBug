import type { Priority, Severity, BugStatus } from '@/types';

export interface Insights {
  generated_at: string;
  totals: { all: number; open: number; closed: number; created_30d: number; closed_30d: number };
  time_to_close_hours: { samples: number; average: number | null; median: number | null; p90: number | null };
  open_by_severity: Partial<Record<Severity, number>>;
  open_by_priority: Partial<Record<Priority, number>>;
  by_status: Partial<Record<BugStatus, number>>;
  weekly: { week: string; created: number; closed: number }[];
  assignees: { id: string; username: string; full_name: string; open: number; closed_30d: number; avg_close_hours: number | null }[];
  unassigned_open: number;
  oldest_open: { code: string; title: string; severity: Severity; priority: Priority; created_at: string }[];
}

/** 0.4 -> "24m", 5.5 -> "5.5h", 50 -> "2.1d", null -> "—". */
export function formatHours(h: number | null | undefined): string {
  if (h === null || h === undefined || Number.isNaN(Number(h))) return '—';
  const v = Number(h);
  if (v < 1) return `${Math.max(1, Math.round(v * 60))}m`;
  if (v < 48) return `${Math.round(v * 10) / 10}h`;
  return `${Math.round((v / 24) * 10) / 10}d`;
}
