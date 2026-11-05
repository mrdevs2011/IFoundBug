'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject, errMsg } from '@/lib/db';
import { btnPrimary, ErrorBox, inputCls, Modal } from '@/components/ui';

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stack, setStack] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [allowGuestReports, setAllowGuestReports] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const p = await createProject({ name: name.trim(), description: description.trim(), tech_stack: stack.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10), is_public: isPublic, allow_guest_reports: isPublic && allowGuestReports });
      router.push(`/p/${p.slug}`);
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <Modal title="New repository" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Repository name" required maxLength={80} autoFocus />
        <textarea className={`${inputCls} min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={300} />
        <input className={inputCls} value={stack} onChange={(e) => setStack(e.target.value)} placeholder="Technologies: React, Next.js, PostgreSQL" />
        <label className="flex items-start gap-2 text-sm text-[#f0f6fc]">
          <input type="checkbox" checked={isPublic} onChange={(event) => { setIsPublic(event.target.checked); if (!event.target.checked) setAllowGuestReports(false); }} className="mt-0.5 accent-[#238636]" />
          <span><span className="block font-medium">Public repository</span><span className="text-xs text-[#9198a1]">Anyone can discover and view this repository.</span></span>
        </label>
        {isPublic && <label className="flex items-start gap-2 pl-6 text-sm text-[#f0f6fc]">
          <input type="checkbox" checked={allowGuestReports} onChange={(event) => setAllowGuestReports(event.target.checked)} className="mt-0.5 accent-[#238636]" />
          <span><span className="block font-medium">Allow public issue submissions</span><span className="text-xs text-[#9198a1]">Signed-in users can report issues without joining the team.</span></span>
        </label>}
        {error && <ErrorBox message={error} />}
        <button className={`${btnPrimary} w-full`} disabled={busy || !name.trim()}>{busy ? 'Creating…' : 'Create repository'}</button>
      </form>
    </Modal>
  );
}
