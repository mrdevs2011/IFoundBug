'use client';

import React, { useState } from 'react';
import { UserProfile, Project } from '@/types';

interface OnboardingModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onComplete: (project: Project, profileUpdates?: Partial<UserProfile>) => void;
  onClose: () => void;
}

export default function OnboardingModal({
  isOpen,
  user,
  onComplete,
  onClose,
}: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [organization, setOrganization] = useState(user?.organization || 'Mening Jamoam');
  const [role, setRole] = useState(user?.role || 'developer');

  // Step 2: Real Project Fields
  const [projectName, setProjectName] = useState('');
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [techStackInput, setTechStackInput] = useState('Next.js, TypeScript, Tailwind');
  const [projectDescription, setProjectDescription] = useState('');

  // Step 3: Preferences
  const [telegramNotifications, setTelegramNotifications] = useState(true);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      if (!fullName.trim()) return;
      setStep(2);
    } else if (step === 2) {
      if (!projectName.trim()) return;
      setStep(3);
    } else if (step === 3) {
      // Finalize
      const techStack = techStackInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const newProject: Project = {
        id: 'proj_' + Date.now(),
        name: projectName,
        slug: projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description: projectDescription || 'IFoundABug orqali boshqariladigan loyiha',
        is_public: true,
        allow_guest_reports: true,
        tech_stack: techStack.length > 0 ? techStack : ['Next.js', 'React'],
        github_repo_url: githubRepoUrl || undefined,
        telegram_webhook_enabled: telegramNotifications,
        created_at: new Date().toISOString(),
      };

      onComplete(newProject, {
        full_name: fullName,
        organization,
        role,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step Progress Line */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition ${
                  step === s
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : step > s
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-600'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Bosqich {step} / 3: {step === 1 ? 'Profil' : step === 2 ? 'Loyiha' : 'Integratsiya'}
          </span>
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-lg font-extrabold text-white">Xush kelibsiz! Profilingizni sozlang</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Jamoa a’zolaringiz va hamkorlar sizni qanday ko‘rishini belgilang.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">To‘liq Ismingiz:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ismingiz va familiyangiz"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Kompaniya / Jamoa Nomi:
                </label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Masalan: Fintech Labs, Freelance Devs"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Asosiy Mutaxassisligingiz:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="developer">Frontend / Backend / Fullstack Dasturchi</option>
                  <option value="qa_tester">QA Tester / Bug Hunter</option>
                  <option value="team_lead">Team Lead / CTO</option>
                  <option value="product_manager">Product Manager</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Real Project Creation */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-lg font-extrabold text-white">Birinchi Haqiqiy Loyihangiz</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Bu yerdagi loyiha namuna emas — xatoliklarni kuzatmoqchi bo‘lgan real loyihangiz nomi.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Loyiha Nomi (Majburiy):
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Masalan: E-Commerce Web Platform, Paynet Bot, CRM"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  GitHub Repozitoriy Havolasi (Ixtiyoriy):
                </label>
                <input
                  type="url"
                  value={githubRepoUrl}
                  onChange={(e) => setGithubRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/project"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Texnologiyalar To‘plami (Vergul bilan):
                </label>
                <input
                  type="text"
                  value={techStackInput}
                  onChange={(e) => setTechStackInput(e.target.value)}
                  placeholder="Next.js, TypeScript, Flutter, PostgreSQL, Docker"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Loyiha Haqida Qisqacha:
                </label>
                <textarea
                  rows={2}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Loyiha maqsadi va vazifalari..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-white focus:border-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Team Collaboration & Finish */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-lg font-extrabold text-white">Hamkorlik va Tayyorlik</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Loyiha sozlandi. Endi jamoangiz bilan tartibli bug-tracking boshlashingiz mumkin.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  Telegram Tartibsizligiga Chek Qo‘yish:
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  Har bir bug uchun alohida tokenli havola, ekran skrinshoti annotatsiyasi, PII blur va AI Fix Promptlari yaratiladi. Telegram guruhga faqat tayyor tizimli hisobot boradi.
                </p>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telegramNotifications}
                    onChange={(e) => setTelegramNotifications(e.target.checked)}
                    className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-zinc-200">
                    Telegram bildirishnomalar integratsiyasini faollashtirish
                  </span>
                </label>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-zinc-400">
                <span className="font-mono text-white font-bold">{projectName}</span> loyihasi yaratildi va faol ishchi soha sifatida ochiladi.
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-zinc-800/80">
          {step > 1 ? (
            <button
              onClick={() => {
                setStep((prev) => (prev - 1) as 1 | 2);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition"
            >
              ← Ortga
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
          >
            {step === 3 ? 'Boshlash va Loyihani Ochish' : 'Davom etish →'}
          </button>
        </div>
      </div>
    </div>
  );
}
