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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const p = await createProject({ name: name.trim(), description: description.trim(), tech_stack: stack.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 10) });
      router.push(`/p/${p.slug}`);
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  return (
    <Modal title="Yangi loyiha" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Loyiha nomi" required maxLength={80} autoFocus />
        <textarea className={`${inputCls} min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Qisqacha tavsif (ixtiyoriy)" maxLength={300} />
        <input className={inputCls} value={stack} onChange={(e) => setStack(e.target.value)} placeholder="Texnologiyalar: Kotlin, Next.js, …" />
        <p className="text-xs text-zinc-500">Loyiha va uning buglari hamma uchun ochiq. Alohida bugni keyinchalik maxfiy havolaga aylantirish mumkin.</p>
        {error && <ErrorBox message={error} />}
        <button className={`${btnPrimary} w-full`} disabled={busy || !name.trim()}>{busy ? 'Yaratilmoqda…' : 'Loyiha yaratish'}</button>
      </form>
    </Modal>
  );
}
