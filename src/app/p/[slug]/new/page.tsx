'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Nav, LoginHint } from '@/components/Nav';
import { ImageAnnotator } from '@/components/ImageAnnotator';
import { Empty, ErrorBox, Spinner, btnGhost, btnPrimary, inputCls } from '@/components/ui';
import { ENV_LABEL, SEVERITY_LABEL, SEVERITY_ORDER } from '@/lib/constants';
import { createBug, errMsg, getProject, uploadFile } from '@/lib/db';
import { useMe } from '@/lib/useMe';
import type { DeviceTelemetry, Environment, Project, Severity } from '@/types';

function telemetry(): DeviceTelemetry {
  const ua = navigator.userAgent;
  const browser = ua.includes('Firefox') ? 'Firefox' : ua.includes('Edg') ? 'Edge' : ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : 'Browser';
  const os = ua.includes('Android') ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'OS';
  return { browser, os, resolution: `${screen.width}x${screen.height}`, viewport: `${innerWidth}x${innerHeight}`, userAgent: ua, language: navigator.language };
}

interface Shot { id: string; blob: Blob; url: string }

export default function NewBugPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const me = useMe();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [actual, setActual] = useState('');
  const [expected, setExpected] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [env, setEnv] = useState<Environment>('PRODUCTION');
  const [shots, setShots] = useState<Shot[]>([]);
  const [annotating, setAnnotating] = useState<Shot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { getProject(slug).then(setProject).catch((e) => { setError(errMsg(e)); setProject(null); }); }, [slug]);

  const addFiles = (files: Iterable<File | Blob>) => {
    const next: Shot[] = [];
    for (const f of files) if (f.type.startsWith('image/')) next.push({ id: crypto.randomUUID(), blob: f, url: URL.createObjectURL(f) });
    if (next.length) setShots((s) => [...s, ...next].slice(0, 6));
  };
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.some((f) => f.type.startsWith('image/'))) { e.preventDefault(); addFiles(files); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setBusy(true); setError('');
    try {
      const urls: string[] = [];
      for (const s of shots) urls.push(await uploadFile(s.blob, `${s.id}.png`));
      const bug = await createBug(project.id, {
        title: title.trim(), severity, environment: env,
        actual_behavior: actual.trim(), expected_behavior: expected.trim(),
        steps_to_reproduce: steps.split('\n').map((s) => s.trim()).filter(Boolean),
        evidence_urls: urls, device_telemetry: telemetry(),
      });
      router.push(`/p/${project.slug}/b/${bug.code}`);
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  };

  if (project === undefined) return <><Nav /><Spinner /></>;
  if (!project) return <><Nav /><main className="mx-auto max-w-2xl flex-1 px-4 py-10"><Empty title="Loyiha topilmadi" /></main></>;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link href={`/p/${project.slug}`} className="text-xs text-zinc-500 hover:text-zinc-300">← {project.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-white">Yangi bug</h1>
        {me === null ? <div className="mt-6"><LoginHint what="Bug yozish" /></div> : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <label className="block text-sm text-zinc-300">Nima bo‘ldi?
              <input className={`${inputCls} mt-1.5`} value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={180} placeholder="Qisqa sarlavha: “Karta qo‘shish tugmasi xato matn ko‘rsatadi”" autoFocus />
            </label>
            <label className="block text-sm text-zinc-300">Qanday takrorlash mumkin? <span className="text-xs text-zinc-500">(har qator — bitta qadam)</span>
              <textarea className={`${inputCls} mt-1.5 min-h-28`} value={steps} onChange={(e) => setSteps(e.target.value)} placeholder={'Ilovani oching\nProfil → To‘lov usullari\n“Karta qo‘shish” ni bosing'} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-zinc-300">Hozir nima bo‘lyapti?
                <textarea className={`${inputCls} mt-1.5 min-h-24`} value={actual} onChange={(e) => setActual(e.target.value)} />
              </label>
              <label className="block text-sm text-zinc-300">Nima bo‘lishi kerak?
                <textarea className={`${inputCls} mt-1.5 min-h-24`} value={expected} onChange={(e) => setExpected(e.target.value)} />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-zinc-300">Jiddiylik
                <select className={`${inputCls} mt-1.5`} value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                  {SEVERITY_ORDER.map((s) => <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>)}
                </select>
              </label>
              <label className="block text-sm text-zinc-300">Muhit
                <select className={`${inputCls} mt-1.5`} value={env} onChange={(e) => setEnv(e.target.value as Environment)}>
                  {(Object.keys(ENV_LABEL) as Environment[]).map((k) => <option key={k} value={k}>{ENV_LABEL[k]}</option>)}
                </select>
              </label>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm text-zinc-300">Skrinshot <span className="text-xs text-zinc-500">Ctrl+V bilan qo‘ying yoki fayl tanlang</span></div>
              <div className="flex flex-wrap gap-2">
                {shots.map((s) => (
                  <div key={s.id} className="group relative">
                    <img src={s.url} alt="Skrinshot" className="h-20 w-28 rounded-lg border border-white/10 object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-black/60 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                      <button type="button" onClick={() => setAnnotating(s)} className="rounded bg-white/15 px-2 py-1 text-[11px] text-white">Belgilash</button>
                      <button type="button" onClick={() => setShots((all) => all.filter((x) => x.id !== s.id))} className="rounded bg-red-500/40 px-2 py-1 text-[11px] text-white">✕</button>
                    </div>
                  </div>
                ))}
                {shots.length < 6 && <button type="button" onClick={() => fileRef.current?.click()} className="grid h-20 w-28 place-items-center rounded-lg border border-dashed border-white/15 text-xs text-zinc-500 hover:border-emerald-500/40 hover:text-emerald-300">＋ Rasm</button>}
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
              </div>
            </div>
            <p className="text-xs text-zinc-500">Brauzer va qurilma ma’lumotlari avtomatik qo‘shiladi. Bug hamma uchun ochiq bo‘ladi; xohlasangiz keyin “maxfiy havola”ga aylantirasiz.</p>
            {error && <ErrorBox message={error} />}
            <div className="flex gap-2">
              <button className={btnPrimary} disabled={busy || !title.trim()}>{busy ? 'Yuborilmoqda…' : 'Bug yuborish'}</button>
              <Link href={`/p/${project.slug}`} className={btnGhost}>Bekor qilish</Link>
            </div>
          </form>
        )}
      </main>
      {annotating && (
        <div className="fixed inset-0 z-50 bg-black/80 p-4">
          <ImageAnnotator
            imageUrl={annotating.url}
            onClose={() => setAnnotating(null)}
            onSave={async (dataUrl) => {
              const blob = await (await fetch(dataUrl)).blob();
              setShots((all) => all.map((x) => x.id === annotating.id ? { ...x, blob, url: URL.createObjectURL(blob) } : x));
              setAnnotating(null);
            }}
          />
        </div>
      )}
    </>
  );
}
