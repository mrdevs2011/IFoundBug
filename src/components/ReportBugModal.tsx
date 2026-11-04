'use client';

import React, { useState } from 'react';
import { Bug, Project, DeviceTelemetry, Severity, Priority, Environment } from '@/types';
import { PlusIcon, XIcon, PenToolIcon, CheckIcon, SmartphoneIcon } from './icons';
import { ImageAnnotator } from './ImageAnnotator';

interface ReportBugModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (bug: Partial<Bug>) => void;
}

const getInitialTelemetry = (): DeviceTelemetry => {
  if (typeof window === 'undefined') {
    return {
      browser: 'Browser',
      os: 'OS',
      resolution: '1920x1080',
      viewport: '1280x720',
    };
  }

  const ua = navigator.userAgent;
  let browser = 'Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  let os = 'OS';
  if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    browser,
    os,
    resolution: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: ua,
    language: navigator.language,
  };
};

export const ReportBugModal: React.FC<ReportBugModalProps> = ({ project, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('UI');
  const [screen, setScreen] = useState('');
  const [severity, setSeverity] = useState<Severity>('MEDIUM');
  const [priority, setPriority] = useState<Priority>('P2');
  const [environment, setEnvironment] = useState<Environment>('PRODUCTION');
  const [actualBehavior, setActualBehavior] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [devNotes, setDevNotes] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [reporterName, setReporterName] = useState('Anonymous Hunter');

  // Dynamic steps
  const [steps, setSteps] = useState<string[]>(['1. Ilovani oching']);
  // Dynamic acceptance criteria
  const [criteria, setCriteria] = useState<string[]>(['Xatolik to‘liq bartaraf etildi']);

  // Evidence
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [evidenceInput, setEvidenceInput] = useState('');
  const [annotatingImageUrl, setAnnotatingImageUrl] = useState<string | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  // Clipboard Paste (Ctrl+V) listener
  React.useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            setIsUploadingEvidence(true);
            try {
              const formData = new FormData();
              formData.append('file', blob);
              const res = await fetch('/api/upload', { method: 'POST', body: formData });
              const data = await res.json();
              if (data.url) {
                setEvidenceUrls((prev) => [...prev, data.url]);
              }
            } catch (err) {
              console.error('Paste upload error:', err);
            } finally {
              setIsUploadingEvidence(false);
            }
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // Lazy-initialized telemetry without effect cascade
  const [telemetry] = useState<DeviceTelemetry>(getInitialTelemetry);

  const handleAddStep = () => {
    setSteps([...steps, `${steps.length + 1}. `]);
  };

  const handleUpdateStep = (idx: number, val: string) => {
    const updated = [...steps];
    updated[idx] = val;
    setSteps(updated);
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, '']);
  };

  const handleUpdateCriterion = (idx: number, val: string) => {
    const updated = [...criteria];
    updated[idx] = val;
    setCriteria(updated);
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteria(criteria.filter((_, i) => i !== idx));
  };

  const handleAddEvidence = () => {
    if (evidenceInput.trim()) {
      setEvidenceUrls([...evidenceUrls, evidenceInput.trim()]);
      setEvidenceInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingEvidence(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.url) {
          setEvidenceUrls((prev) => [...prev, data.url]);
        }
      } catch (err) {
        console.error('File upload error:', err);
      } finally {
        setIsUploadingEvidence(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !actualBehavior.trim() || !expectedBehavior.trim()) {
      alert('Iltimos, sarlavha, hozirgi xato va kutilgan natijani to‘ldiring!');
      return;
    }

    const bugData: Partial<Bug> = {
      project_id: project.id,
      title: title.trim(),
      section,
      screen: screen.trim() || section,
      severity,
      priority,
      environment,
      actual_behavior: actualBehavior.trim(),
      expected_behavior: expectedBehavior.trim(),
      steps_to_reproduce: steps.filter((s) => s.trim().length > 0),
      acceptance_criteria: criteria
        .filter((c) => c.trim().length > 0)
        .map((text, idx) => ({ id: `ac-${idx}`, text, checked: false })),
      device_telemetry: telemetry,
      dev_notes: devNotes.trim(),
      evidence_urls: evidenceUrls,
      is_sensitive: isSensitive,
      reporter_name: reporterName.trim() || 'Anonymous Hunter',
      status: 'REPORTED',
      upvotes_count: 1,
      reproduced_count: 1,
      views_count: 1,
    };

    onSubmit(bugData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div>
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Yangi Bug Qo‘shish
            </h3>
            <p className="text-xs text-zinc-400">Loyiha: {project.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Telemetry Detection Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <SmartphoneIcon className="w-4 h-4 text-emerald-400" />
              <span>Avtomatik Telemetriya:</span>
              <span className="text-emerald-400 font-mono font-semibold">
                {telemetry.os} • {telemetry.browser} • {telemetry.viewport} ({telemetry.resolution})
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
              Avto-aniqlandi
            </span>
          </div>

          {/* Title & Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Bug Sarlavhasi (Title) *
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: Pastki navigatsiya paneli o‘zbekcha emas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Bo‘lim / Modul (Section)
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="ifb-select w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="UI">UI / Dizayn</option>
                <option value="Auth">Autentifikatsiya / Kirish</option>
                <option value="Navigation">Navigatsiya & Menyu</option>
                <option value="Payment">To‘lov & Billing</option>
                <option value="API">API / Backend</option>
                <option value="Performance">Tezlik & Xotira</option>
                <option value="Translation">Til & Tarjima</option>
              </select>
            </div>
          </div>

          {/* Screen / Specific Page */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Aniq Ekran / Sahifa (Screen / Page)
            </label>
            <input
              type="text"
              placeholder="Masalan: Profil sozlamalari, Bosh sahifa, To‘lov modali..."
              value={screen}
              onChange={(e) => setScreen(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Severity, Priority, Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Jiddiylik (Severity)</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
                className="ifb-select w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="CRITICAL">CRITICAL (Blocker)</option>
                <option value="HIGH">HIGH (Jiddiy)</option>
                <option value="MEDIUM">MEDIUM (O‘rtacha)</option>
                <option value="LOW">LOW (Kichik)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Prioritet</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="ifb-select w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="P0">P0 (Zudlik bilan)</option>
                <option value="P1">P1 (Tezkor)</option>
                <option value="P2">P2 (Rejadagi)</option>
                <option value="P3">P3 (Bo‘sh vaqtda)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Muhit (Environment)</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as Environment)}
                className="ifb-select w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="PRODUCTION">Production (Jonli)</option>
                <option value="STAGING">Staging / Test</option>
                <option value="DEVELOPMENT">Development</option>
                <option value="LOCAL">Localhost</option>
              </select>
            </div>
          </div>

          {/* Actual vs Expected Behavior Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-red-400 mb-1">
                Hozirgi Xato (Actual Behavior) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Amalda nima noto‘g‘ri bo‘lyapti? (Masalan: Inglizcha tab nomlari turibdi)"
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">
                Kutilgan Natija (Expected Behavior) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Aslida qanday bo‘lishi kerak edi? (Masalan: Uy, Qidirish, Xabarlar bo‘lishi kerak)"
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Steps to Reproduce */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Qayta Hosil Qilish Qadamlari (Steps to Reproduce)
              </label>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Qadam qo‘shish
              </button>
            </div>
            <div className="space-y-2">
              {steps.map((st, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={st}
                    onChange={(e) => handleUpdateStep(idx, e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1 text-zinc-500 hover:text-red-400"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Qabul Mezonlari (Acceptance Criteria Checklist)
              </label>
              <button
                type="button"
                onClick={handleAddCriterion}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
              >
                <PlusIcon className="w-3.5 h-3.5" /> Mezon qo‘shish
              </button>
            </div>
            <div className="space-y-2">
              {criteria.map((cr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cr}
                    placeholder="Masalan: Barcha tab nomlari o‘zbek tilida to‘g‘ri aks etadi"
                    onChange={(e) => handleUpdateCriterion(idx, e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  {criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(idx)}
                      className="p-1 text-zinc-500 hover:text-red-400"
                    >
                      <XIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Evidence Upload & In-Browser Annotation */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Dalil / Skrinshotlar (Evidence Screenshots)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder="Rasm URL havolasi yoki fayl tanlang"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddEvidence}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-2 rounded-lg border border-zinc-700 transition"
              >
                URL Qo‘shish
              </button>
              <label className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-3 py-2 rounded-lg border border-zinc-700 cursor-pointer transition">
                {isUploadingEvidence ? 'Yuklanmoqda...' : 'Fayl yuklash'}
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Evidence previews */}
            {evidenceUrls.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {evidenceUrls.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-zinc-800 w-24 h-24 bg-zinc-950">
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition">
                      <button
                        type="button"
                        onClick={() => setAnnotatingImageUrl(url)}
                        title="Rasm ustiga chizish & belgilash"
                        className="p-1.5 bg-emerald-500 text-black rounded hover:bg-emerald-400"
                      >
                        <PenToolIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEvidenceUrls(evidenceUrls.filter((_, idx) => idx !== i))}
                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-400"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dev Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Texnik Tahlil & Fayl Ko‘rsatkichlari (Dev Notes) — ixtiyoriy
            </label>
            <textarea
              rows={2}
              placeholder="Masalan: navigation.json faylida kalitlar yetishmayapti, regex tekshiruvi kerak..."
              value={devNotes}
              onChange={(e) => setDevNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none font-mono"
            />
          </div>

          {/* Privacy & Reporter */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={isSensitive}
                onChange={(e) => setIsSensitive(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>Maxfiy PII (Skrinshotda shaxsiy ma&apos;lumotlar bor bo‘lsa xiralashtirilsin)</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Ismingiz:</span>
              <input
                type="text"
                placeholder="Sarvar Tester"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1 text-xs text-white"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg transition"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold px-5 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <CheckIcon className="w-4 h-4 text-black" /> Bugni Ro‘yxatga Olish
            </button>
          </div>
        </form>
      </div>

      {/* Image Annotator Studio Modal */}
      {annotatingImageUrl && (
        <ImageAnnotator
          imageUrl={annotatingImageUrl}
          onSave={(annotatedUrl) => {
            setEvidenceUrls(evidenceUrls.map((u) => (u === annotatingImageUrl ? annotatedUrl : u)));
            setAnnotatingImageUrl(null);
          }}
          onClose={() => setAnnotatingImageUrl(null)}
        />
      )}
    </div>
  );
};
