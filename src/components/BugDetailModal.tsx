'use client';

import React, { useState } from 'react';
import { Bug, BugComment, BugStatus } from '@/types';
import {
  XIcon,
  SparklesIcon,
  ThumbsUpIcon,
  CheckIcon,
  SmartphoneIcon,
  PenToolIcon,
  EyeIcon,
  EyeOffIcon,
  MessageSquareIcon,
  SendIcon,
} from './icons';
import { AIPromptModal } from './AIPromptModal';
import { ImageAnnotator } from './ImageAnnotator';

interface BugDetailModalProps {
  bug: Bug;
  comments: BugComment[];
  privacyMode: boolean;
  onClose: () => void;
  onStatusChange: (newStatus: BugStatus) => void;
  onToggleAcceptance: (criterionId: string) => void;
  onUpvote: () => void;
  onAddComment: (content: string, isInternal: boolean) => void;
  onUpdateEvidence?: (newEvidenceUrls: string[]) => void;
}

export const BugDetailModal: React.FC<BugDetailModalProps> = ({
  bug,
  comments,
  privacyMode,
  onClose,
  onStatusChange,
  onToggleAcceptance,
  onUpvote,
  onAddComment,
  onUpdateEvidence,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'discussion' | 'audit'>('details');
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [annotatingImageUrl, setAnnotatingImageUrl] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [localPrivacy, setLocalPrivacy] = useState(privacyMode || Boolean(bug.is_sensitive));

  const statusColors: Record<BugStatus, { bg: string; text: string; border: string }> = {
    REPORTED: { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' },
    TRIAGED: { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
    IN_PROGRESS: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    READY_FOR_QA: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    VERIFIED: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
    FIXED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    CLOSED: { bg: 'bg-zinc-900', text: 'text-zinc-500', border: 'border-zinc-800' },
    WONT_FIX: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  const severityColors = {
    CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/40',
    HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    LOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(commentText.trim(), isInternalComment);
    setCommentText('');
  };

  const completedCriteriaCount = bug.acceptance_criteria.filter((c) => c.checked).length;
  const totalCriteriaCount = bug.acceptance_criteria.length;
  const progressPercent = totalCriteriaCount > 0 ? Math.round((completedCriteriaCount / totalCriteriaCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm bg-zinc-800 text-white px-2.5 py-0.5 rounded border border-zinc-700">
                {bug.code}
              </span>

              {/* Status Selector Dropdown */}
              <select
                value={bug.status}
                onChange={(e) => onStatusChange(e.target.value as BugStatus)}
                className={`text-xs font-bold px-2.5 py-1 rounded-md border focus:outline-none transition cursor-pointer ${
                  statusColors[bug.status].bg
                } ${statusColors[bug.status].text} ${statusColors[bug.status].border}`}
              >
                <option value="REPORTED">REPORTED (Ochiq)</option>
                <option value="TRIAGED">TRIAGED (Ko‘rildi)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Jarayonda)</option>
                <option value="READY_FOR_QA">READY_FOR_QA (Testga tayyor)</option>
                <option value="VERIFIED">VERIFIED (Tasdiqlandi)</option>
                <option value="FIXED">FIXED (Tuzatildi ✓)</option>
                <option value="CLOSED">CLOSED (Yopildi)</option>
                <option value="WONT_FIX">WONT_FIX (Tuzatilmaydi)</option>
              </select>

              {/* Severity Pill */}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${severityColors[bug.severity]}`}>
                {bug.severity} ({bug.priority})
              </span>

              {/* Section */}
              <span className="text-xs text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded border border-zinc-700/60">
                {bug.section} • {bug.screen || 'Umumiy'}
              </span>

              {/* Environment */}
              <span className="text-[11px] text-zinc-400 font-mono">
                [{bug.environment}]
              </span>
            </div>

            <h2 className="text-white font-bold text-lg leading-snug">{bug.title}</h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* AI Fix Prompt Synthesizer */}
            <button
              onClick={() => setShowAIPrompt(true)}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
              title="Claude Code / Cursor uchun prompt yaratish"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>AI Fix Prompt</span>
            </button>

            {/* Upvote / Reproduced button */}
            <button
              onClick={onUpvote}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 transition"
              title="Men ham bu xatoni qayta hosil qildim (+1)"
            >
              <ThumbsUpIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>{bug.upvotes_count}</span>
            </button>

            {/* Privacy Toggle */}
            <button
              onClick={() => setLocalPrivacy(!localPrivacy)}
              className={`p-1.5 rounded-lg border transition ${
                localPrivacy ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
              title="Skrinshotlar xiraligi (PII Blur)"
            >
              {localPrivacy ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition">
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition ${
              activeTab === 'details' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Bug Tafsilotlari & Dalillar
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'discussion' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquareIcon className="w-3.5 h-3.5" />
            Jonli Muhokama ({comments.length})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Telemetry Bar */}
              {bug.device_telemetry && (
                <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <SmartphoneIcon className="w-4 h-4 text-emerald-400" />
                    <span>Qurilma & Telemetriya:</span>
                  </div>
                  <span className="font-mono text-zinc-300">{bug.device_telemetry.os}</span>
                  <span>•</span>
                  <span className="font-mono text-zinc-300">{bug.device_telemetry.browser}</span>
                  <span>•</span>
                  <span className="font-mono text-zinc-400">Ekran: {bug.device_telemetry.resolution}</span>
                  <span>•</span>
                  <span className="font-mono text-zinc-400">Viewport: {bug.device_telemetry.viewport}</span>
                  <span className="ml-auto text-[11px] text-zinc-500">
                    Reported by: <strong className="text-zinc-400">{bug.reporter_name}</strong>
                  </span>
                </div>
              )}

              {/* Actual vs Expected Behavior Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-wider mb-2">
                    <span>❌ Hozirgi Xato (Actual Behavior)</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">{bug.actual_behavior}</p>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    <span>✅ Kutilgan Natija (Expected Behavior)</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">{bug.expected_behavior}</p>
                </div>
              </div>

              {/* Steps to Reproduce */}
              {bug.steps_to_reproduce && bug.steps_to_reproduce.length > 0 && (
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
                    🔁 Qayta Hosil Qilish Qadamlari (Steps to Reproduce)
                  </h4>
                  <ol className="space-y-2 text-xs text-zinc-300 list-decimal list-inside">
                    {bug.steps_to_reproduce.map((step, idx) => (
                      <li key={idx} className="leading-relaxed pl-1">
                        <span className="text-zinc-200">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Acceptance Criteria Checklist */}
              {bug.acceptance_criteria && bug.acceptance_criteria.length > 0 && (
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-emerald-400" />
                      Qabul Mezonlari ({completedCriteriaCount}/{totalCriteriaCount})
                    </h4>
                    <span className="text-xs font-bold text-emerald-400">{progressPercent}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {bug.acceptance_criteria.map((ac) => (
                      <label
                        key={ac.id}
                        className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-800/40 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={ac.checked}
                          onChange={() => onToggleAcceptance(ac.id)}
                          className="mt-0.5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span
                          className={`text-xs leading-relaxed ${
                            ac.checked ? 'line-through text-zinc-500' : 'text-zinc-200'
                          }`}
                        >
                          {ac.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Dev Notes & Technical Clues */}
              {bug.dev_notes && (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span>🛠 Texnik Tahlil & Fayl Ko‘rsatkichlari (Dev Notes)</span>
                  </h4>
                  <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {bug.dev_notes}
                  </pre>
                </div>
              )}

              {/* Evidence Screenshots Gallery */}
              {bug.evidence_urls && bug.evidence_urls.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                      📸 Dalil Skrinshotlari ({bug.evidence_urls.length})
                    </h4>
                    {localPrivacy && (
                      <span className="text-[11px] text-amber-400 flex items-center gap-1">
                        <EyeOffIcon className="w-3.5 h-3.5" /> Maxfiy rejim: rasmlar xiralashtirilgan
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {bug.evidence_urls.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative group bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden aspect-[9/16] max-h-72 flex items-center justify-center"
                      >
                        <img
                          src={url}
                          alt={`${bug.code} evidence ${idx + 1}`}
                          className={`w-full h-full object-contain transition duration-300 ${
                            localPrivacy ? 'blur-md hover:blur-none' : ''
                          }`}
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition">
                          <button
                            onClick={() => setZoomedImage(url)}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs px-2.5 py-1.5 rounded-lg border border-zinc-600 shadow"
                          >
                            Kattalashtirish
                          </button>
                          <button
                            onClick={() => setAnnotatingImageUrl(url)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow"
                          >
                            <PenToolIcon className="w-3 h-3" /> Chizish
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Discussion & Realtime Comments */}
          {activeTab === 'discussion' && (
            <div className="space-y-4">
              {/* Comment Thread */}
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs">
                    Hozircha izohlar yo‘q. Birinchi bo‘lib fikr bildiring!
                  </div>
                ) : (
                  comments.map((comm) => (
                    <div
                      key={comm.id}
                      className={`p-3.5 rounded-xl border ${
                        comm.is_internal
                          ? 'bg-amber-950/10 border-amber-900/30'
                          : 'bg-zinc-950 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {comm.author_name.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-zinc-200">{comm.author_name}</span>
                          {comm.is_internal && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-semibold">
                              Faqat Dasturchilar uchun
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-500">
                          {new Date(comm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{comm.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* New Comment Input */}
              <form onSubmit={handleCommentSubmit} className="pt-2 border-t border-zinc-800 space-y-2">
                <textarea
                  rows={3}
                  placeholder="Fikr, taklif yoki kod yozing... (Markdown qo‘llab-quvvatlanadi)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-amber-500"
                    />
                    <span>Maxfiy ichki izoh (faqat jamoa ko‘radi)</span>
                  </label>

                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <SendIcon className="w-3.5 h-3.5" /> Yuborish
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* AI Prompt Synthesizer Modal */}
      {showAIPrompt && <AIPromptModal bugs={[bug]} onClose={() => setShowAIPrompt(false)} />}

      {/* In-browser Image Annotator */}
      {annotatingImageUrl && (
        <ImageAnnotator
          imageUrl={annotatingImageUrl}
          onSave={(annotatedUrl) => {
            if (onUpdateEvidence && bug.evidence_urls) {
              const updated = bug.evidence_urls.map((u) => (u === annotatingImageUrl ? annotatedUrl : u));
              onUpdateEvidence(updated);
            }
            setAnnotatingImageUrl(null);
          }}
          onClose={() => setAnnotatingImageUrl(null)}
        />
      )}

      {/* Fullscreen Lightbox Zoom */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={zoomedImage} alt="Zoomed Evidence" className="max-h-[95vh] max-w-[95vw] object-contain rounded" />
        </div>
      )}
    </div>
  );
};
