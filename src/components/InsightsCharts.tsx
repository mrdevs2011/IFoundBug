'use client';
import React, { useState } from 'react';
import { SEVERITY_LABEL, SEVERITY_ORDER } from '@/lib/constants';
import type { Insights } from '@/lib/insights';
import type { Severity } from '@/types';

// Validated (dark, #0d1117): created #4493f8 / closed #d0761f — all six checks pass.
const C_CREATED = '#4493f8';
const C_CLOSED = '#d0761f';

export function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-md border border-[#3d444d] bg-[#0d1117] p-4">
      <div className="text-xs text-[#9198a1]">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-[#f0f6fc]">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-[#9198a1]">{hint}</div>}
    </div>
  );
}

export function WeeklyChart({ weeks }: { weeks: Insights['weekly'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720, H = 220, L = 32, R = 72, T = 12, B = 28;
  const max = Math.max(1, ...weeks.flatMap((w) => [w.created, w.closed]));
  const step = (W - L - R) / Math.max(1, weeks.length - 1);
  const x = (i: number) => L + i * step;
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const line = (key: 'created' | 'closed') => weeks.map((w, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(w[key]).toFixed(1)}`).join(' ');
  const ticks = Array.from(new Set([0, Math.round(max / 2), max]));
  const last = weeks.length - 1;
  // Keep the two end labels at least 14px apart (closed is nudged below created when they meet).
  const endLabels = (() => {
    let created = y(weeks[last].created) + 4, closed = y(weeks[last].closed) + 4;
    if (Math.abs(created - closed) < 14) { if (created <= closed) closed = created + 14; else created = closed + 14; }
    return { created, closed };
  })();
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Issues created and closed per week, last 12 weeks"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(last, Math.round((px - L) / step)))); }}>
        {ticks.map((t) => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#3d444d" strokeWidth="1" strokeDasharray={t ? '2 4' : undefined} /><text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#9198a1">{t}</text></g>)}
        {weeks.map((w, i) => i % 2 === last % 2 && <text key={w.week} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#9198a1">{fmt(w.week)}</text>)}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={T} y2={H - B} stroke="#9198a1" strokeWidth="1" />}
        <path d={line('created')} fill="none" stroke={C_CREATED} strokeWidth="2" strokeLinejoin="round" />
        <path d={line('closed')} fill="none" stroke={C_CLOSED} strokeWidth="2" strokeLinejoin="round" />
        {hover !== null && (['created', 'closed'] as const).map((k) => <circle key={k} cx={x(hover)} cy={y(weeks[hover][k])} r="4.5" fill={k === 'created' ? C_CREATED : C_CLOSED} stroke="#0d1117" strokeWidth="2" />)}
        {/* direct labels at line ends */}
        <text x={x(last) + 8} y={endLabels.created} fontSize="12" fill="#f0f6fc">Created</text>
        <text x={x(last) + 8} y={endLabels.closed} fontSize="12" fill="#f0f6fc">Closed</text>
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded-md border border-[#3d444d] bg-[#151b23] px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: hover > last / 2 ? 'translateX(calc(-100% - 12px))' : 'translateX(12px)' }}>
          <div className="mb-1 font-semibold text-[#f0f6fc]">Week of {fmt(weeks[hover].week)}</div>
          <div className="flex items-center gap-2 text-[#9198a1]"><span className="h-2 w-2 rounded-full" style={{ background: C_CREATED }} />Created <span className="ml-auto pl-3 tabular-nums text-[#f0f6fc]">{weeks[hover].created}</span></div>
          <div className="flex items-center gap-2 text-[#9198a1]"><span className="h-2 w-2 rounded-full" style={{ background: C_CLOSED }} />Closed <span className="ml-auto pl-3 tabular-nums text-[#f0f6fc]">{weeks[hover].closed}</span></div>
        </div>
      )}
      <div className="mt-2 flex gap-4 text-xs text-[#9198a1]">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: C_CREATED }} />Created</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: C_CLOSED }} />Closed</span>
      </div>
      <details className="mt-3 text-xs text-[#9198a1]">
        <summary className="cursor-pointer hover:text-[#f0f6fc]">Show as table</summary>
        <table className="mt-2 w-full max-w-sm tabular-nums">
          <thead><tr className="text-left"><th className="py-1 font-medium">Week</th><th className="py-1 text-right font-medium">Created</th><th className="py-1 text-right font-medium">Closed</th></tr></thead>
          <tbody>{weeks.map((w) => <tr key={w.week} className="border-t border-[#3d444d]"><td className="py-1">{fmt(w.week)}</td><td className="py-1 text-right text-[#f0f6fc]">{w.created}</td><td className="py-1 text-right text-[#f0f6fc]">{w.closed}</td></tr>)}</tbody>
        </table>
      </details>
    </div>
  );
}

export function SeverityBars({ data }: { data: Partial<Record<Severity, number>> }) {
  const max = Math.max(1, ...SEVERITY_ORDER.map((s) => data[s] || 0));
  return (
    <ul className="space-y-2.5">
      {SEVERITY_ORDER.map((s) => {
        const n = data[s] || 0;
        return (
          <li key={s} className="grid grid-cols-[72px_1fr_32px] items-center gap-3 text-sm" title={`${SEVERITY_LABEL[s]}: ${n} open`}>
            <span className="text-[#9198a1]">{SEVERITY_LABEL[s]}</span>
            <span className="h-3 rounded-r-[4px] bg-[#21262d]"><span className="block h-3 rounded-r-[4px]" style={{ width: `${(n / max) * 100}%`, background: C_CREATED, minWidth: n ? 4 : 0 }} /></span>
            <span className="text-right tabular-nums text-[#f0f6fc]">{n}</span>
          </li>
        );
      })}
    </ul>
  );
}

