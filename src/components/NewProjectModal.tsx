'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { BugIcon } from '@/components/icons';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject?: (project: Project) => void | Promise<void>;
  onCreate?: (project: Project) => void | Promise<void>;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  onCreateProject,
  onCreate,
}: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');

    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const project: Project = {
      // Supabase ifb_projects.id is UUID; never send a prefixed timestamp.
      id: crypto.randomUUID(),
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim() || undefined,
      github_repo_url: githubUrl.trim() || undefined,
      tech_stack: techStack.length > 0 ? techStack : ['Next.js', 'React'],
      is_public: isPublic,
      allow_guest_reports: true,
      color: '#10b981',
      icon: 'bug',
      created_at: new Date().toISOString(),
    };

    try {
      if (onCreate) await onCreate(project);
      if (onCreateProject) await onCreateProject(project);
      onClose();
    } catch (error) {
      console.error('Project creation failed:', error);
      const message = error instanceof Error ? error.message : String((error as { message?: string })?.message || error);
      setSubmitError(message.includes('duplicate key') || message.includes('ifb_projects_slug_uidx')
        ? 'Bu loyiha slug’i band. Loyiha nomini biroz o‘zgartirib qayta urin.'
        : message || 'Loyiha yaratilmadi. Qayta urinib ko‘r.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BugIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Yangi Loyiha Yaratish</h2>
              <p className="text-[11px] text-zinc-400">Workspace / Ilova uchun bug tracking doskasi</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-sm p-1">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {submitError && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-xs text-red-300">{submitError}</div>}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Loyiha nomi <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Barbershop Mobile App yoki SayDo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Tavsif (Description)</label>
            <textarea
              rows={2}
              placeholder="Ilovaning asosiy maqsadi va vazifalari..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Texnologiyalar (vergul bilan ajrating)</label>
            <input
              type="text"
              placeholder="React Native, Expo, Supabase, TypeScript"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">GitHub Repozitoriy Havolasi (ixtiyoriy)</label>
            <input
              type="url"
              placeholder="https://github.com/mrdevs2011/my-app"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300 select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-0"
              />
              <span>Ochiq loyiha (Public workspace)</span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white rounded-xl bg-zinc-800 hover:bg-zinc-700 transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                Yaratish
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
