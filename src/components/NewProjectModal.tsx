'use client';

import React, { useState } from 'react';
import { Project } from '@/types';
import { cyberSound } from '@/lib/cyber-sound';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (project: Project) => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: NewProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const project: Project = {
      id: 'proj_' + Date.now(),
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim() || undefined,
      github_repo_url: githubUrl.trim() || undefined,
      tech_stack: techStack.length > 0 ? techStack : ['Custom'],
      is_public: isPublic,
      allow_guest_reports: true,
      created_at: new Date().toISOString(),
    };

    cyberSound.playSuccess();
    onCreateProject(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🚀</span> Yangi Loyiha Yaratish
          </h3>
          <button
            onClick={() => {
              cyberSound.playClick();
              onClose();
            }}
            className="text-zinc-500 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Loyiha Nomi (Masalan: Mobil Ilova, Web Dashboard):
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Loyiha nomini kiriting..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              GitHub Repozitoriy URL (Ixtiyoriy):
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/org/repo"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              Texnologiyalar (Vergul bilan):
            </label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="React, TypeScript, NestJS, Supabase"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Tavsif (Ixtiyoriy):</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Loyiha haqida qisqacha ma'lumot..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <label className="flex items-center gap-2 pt-1 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-zinc-300">
              Ommaviy rejim (jamoa a’zolari havola orqali ko‘ra oladi)
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-md shadow-emerald-500/20"
            >
              Loyiha Yaratish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
