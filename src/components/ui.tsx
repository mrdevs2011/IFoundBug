'use client';
import React from 'react';
import type { BugStatus, Severity } from '@/types';
import { SEVERITY_LABEL, SEVERITY_STYLE, STATUS_LABEL, STATUS_STYLE } from '@/lib/constants';

export function StatusBadge({ status }: { status: BugStatus }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}
export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${SEVERITY_STYLE[severity]}`}>{SEVERITY_LABEL[severity]}</span>;
}
export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-zinc-500">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}
export function Empty({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      <div className="text-sm font-semibold text-zinc-200">{title}</div>
      {hint && <p className="mx-auto mt-1 max-w-md text-xs text-zinc-500">{hint}</p>}
      {children && <div className="mt-4 flex justify-center">{children}</div>}
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  return <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">{message}</div>;
}
export const btnPrimary = 'inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40';
export const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3.5 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white disabled:opacity-40';
export const inputCls = 'w-full rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-emerald-500/60';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#101312] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} aria-label="Yopish" className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-white/5 hover:text-white">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
